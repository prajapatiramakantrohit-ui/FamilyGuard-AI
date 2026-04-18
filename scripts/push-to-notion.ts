import fs from 'node:fs/promises';
import path from 'node:path';
import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

type NotionBlock = {
  object: 'block';
  type: string;
  [key: string]: unknown;
};

const MAX_RICH_TEXT_LEN = 2000;
const MAX_BLOCKS_PER_APPEND = 100;

const CODE_LANGUAGES = new Set([
  'abap',
  'agda',
  'arduino',
  'ascii art',
  'assembly',
  'bash',
  'basic',
  'bnf',
  'c',
  'c#',
  'c++',
  'clojure',
  'coffeescript',
  'coq',
  'css',
  'dart',
  'dhall',
  'diff',
  'docker',
  'ebnf',
  'elixir',
  'elm',
  'erlang',
  'f#',
  'flow',
  'fortran',
  'gherkin',
  'glsl',
  'go',
  'graphql',
  'groovy',
  'haskell',
  'hcl',
  'html',
  'idris',
  'java',
  'javascript',
  'json',
  'julia',
  'kotlin',
  'latex',
  'less',
  'lisp',
  'livescript',
  'llvm ir',
  'lua',
  'makefile',
  'markdown',
  'markup',
  'matlab',
  'mermaid',
  'nix',
  'notion formula',
  'objective-c',
  'ocaml',
  'pascal',
  'perl',
  'php',
  'plain text',
  'powershell',
  'prolog',
  'protobuf',
  'purescript',
  'python',
  'r',
  'racket',
  'reason',
  'ruby',
  'rust',
  'sass',
  'scala',
  'scheme',
  'scss',
  'shell',
  'solidity',
  'sql',
  'swift',
  'toml',
  'typescript',
  'vb.net',
  'verilog',
  'vhdl',
  'visual basic',
  'webassembly',
  'xml',
  'yaml',
  'java/c/c++/c#'
]);

function toTitleCaseFallback(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeNotionId(input: string): string {
  const match = input.match(/[0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (!match) {
    throw new Error(`Invalid Notion ID or URL: ${input}`);
  }

  const raw = match[0].replace(/-/g, '');
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
}

function splitText(text: string): string[] {
  const normalized = text.replace(/\r/g, '').trim();
  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  let rest = normalized;

  while (rest.length > MAX_RICH_TEXT_LEN) {
    chunks.push(rest.slice(0, MAX_RICH_TEXT_LEN));
    rest = rest.slice(MAX_RICH_TEXT_LEN);
  }

  if (rest.length > 0) {
    chunks.push(rest);
  }

  return chunks;
}

function richTextFromText(text: string) {
  return splitText(text).map((chunk) => ({
    type: 'text' as const,
    text: { content: chunk }
  }));
}

function paragraphBlocksFromText(text: string): NotionBlock[] {
  const parts = splitText(text);
  if (!parts.length) {
    return [];
  }

  return parts.map((part) => ({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: { content: part }
        }
      ]
    }
  }));
}

function headingBlock(level: 1 | 2 | 3, text: string): NotionBlock[] {
  const payload = richTextFromText(text);
  if (!payload.length) {
    return [];
  }

  const type = `heading_${level}`;
  return [
    {
      object: 'block',
      type,
      [type]: {
        rich_text: payload
      }
    }
  ];
}

function listItemBlock(kind: 'bulleted_list_item' | 'numbered_list_item', text: string): NotionBlock[] {
  const payload = richTextFromText(text);
  if (!payload.length) {
    return [];
  }

  return [
    {
      object: 'block',
      type: kind,
      [kind]: {
        rich_text: payload
      }
    }
  ];
}

function normalizeCodeLanguage(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) {
    return 'plain text';
  }

  return CODE_LANGUAGES.has(cleaned) ? cleaned : 'plain text';
}

function codeBlock(language: string, code: string): NotionBlock[] {
  const content = code.replace(/\s+$/g, '');
  if (!content) {
    return [];
  }

  const parts = splitText(content);
  return parts.map((part) => ({
    object: 'block',
    type: 'code',
    code: {
      language: normalizeCodeLanguage(language),
      rich_text: [
        {
          type: 'text',
          text: { content: part }
        }
      ]
    }
  }));
}

function parseMarkdownToNotionBlocks(markdown: string): NotionBlock[] {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const blocks: NotionBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const codeStart = trimmed.match(/^```\s*([\w#+.-]*)\s*$/);
    if (codeStart) {
      const language = codeStart[1] || 'plain text';
      i += 1;
      const codeLines: string[] = [];

      while (i < lines.length && !(lines[i] ?? '').trim().startsWith('```')) {
        codeLines.push(lines[i] ?? '');
        i += 1;
      }

      if (i < lines.length && (lines[i] ?? '').trim().startsWith('```')) {
        i += 1;
      }

      blocks.push(...codeBlock(language, codeLines.join('\n')));
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length as 1 | 2 | 3;
      const content = heading[2].trim();
      blocks.push(...headingBlock(level, content));
      i += 1;
      continue;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
    if (bullet) {
      while (i < lines.length) {
        const current = (lines[i] ?? '').trim();
        const item = current.match(/^[-*+]\s+(.*)$/);
        if (!item) {
          break;
        }
        blocks.push(...listItemBlock('bulleted_list_item', item[1].trim()));
        i += 1;
      }
      continue;
    }

    const numbered = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numbered) {
      while (i < lines.length) {
        const current = (lines[i] ?? '').trim();
        const item = current.match(/^\d+\.\s+(.*)$/);
        if (!item) {
          break;
        }
        blocks.push(...listItemBlock('numbered_list_item', item[1].trim()));
        i += 1;
      }
      continue;
    }

    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const currentRaw = lines[i] ?? '';
      const current = currentRaw.trim();
      if (!current) {
        break;
      }
      if (/^```/.test(current)) {
        break;
      }
      if (/^(#{1,3})\s+/.test(current)) {
        break;
      }
      if (/^[-*+]\s+/.test(current)) {
        break;
      }
      if (/^\d+\.\s+/.test(current)) {
        break;
      }
      paragraphLines.push(currentRaw);
      i += 1;
    }

    if (paragraphLines.length) {
      const paragraphText = paragraphLines.join(' ').replace(/\s+/g, ' ').trim();
      blocks.push(...paragraphBlocksFromText(paragraphText));
      continue;
    }

    blocks.push(...paragraphBlocksFromText(trimmed));
    i += 1;
  }

  return blocks.length ? blocks : paragraphBlocksFromText('No documentation content found.');
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readMarkdownSources(rootDir: string): Promise<string> {
  const sections: string[] = [];
  const readmePath = path.join(rootDir, 'README.md');

  if (await fileExists(readmePath)) {
    const content = await fs.readFile(readmePath, 'utf8');
    sections.push(content);
  }

  const docsDir = path.join(rootDir, 'docs');
  if (await fileExists(docsDir)) {
    const entries = await fs.readdir(docsDir, { withFileTypes: true });
    const markdownFiles = entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    for (const filename of markdownFiles) {
      const fullPath = path.join(docsDir, filename);
      const content = await fs.readFile(fullPath, 'utf8');
      sections.push(`## docs/${filename}\n\n${content}`);
    }
  }

  if (!sections.length) {
    return '# Project Documentation\n\nNo README.md or docs/*.md files were found.';
  }

  return sections.join('\n\n');
}

async function pickPageTitle(rootDir: string): Promise<string> {
  const explicit = process.env.NOTION_PAGE_TITLE?.trim();
  if (explicit) {
    return explicit;
  }

  const packageJsonPath = path.join(rootDir, 'package.json');
  try {
    const raw = await fs.readFile(packageJsonPath, 'utf8');
    const parsed = JSON.parse(raw) as { name?: string };
    if (parsed.name && parsed.name.trim()) {
      return toTitleCaseFallback(parsed.name);
    }
  } catch {
    // Fall through to directory name.
  }

  return toTitleCaseFallback(path.basename(rootDir));
}

async function getDatabaseTitlePropertyName(notion: Client, databaseId: string): Promise<string> {
  const db = await notion.databases.retrieve({ database_id: databaseId });

  if (!('properties' in db)) {
    throw new Error('Could not read database schema from Notion.');
  }

  for (const [name, property] of Object.entries(db.properties)) {
    if ((property as { type?: string }).type === 'title') {
      return name;
    }
  }

  throw new Error('Database has no title property.');
}

async function findPageInDatabaseByExactTitle(
  notion: Client,
  databaseId: string,
  titleProperty: string,
  title: string
): Promise<string | null> {
  let cursor: string | undefined;

  while (true) {
    const result = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      filter: {
        property: titleProperty,
        title: {
          equals: title
        }
      },
      page_size: 100
    });

    const match = result.results.find((entry) => entry.object === 'page');
    if (match && 'id' in match) {
      return String(match.id);
    }

    if (!result.has_more || !result.next_cursor) {
      return null;
    }

    cursor = result.next_cursor;
  }
}

async function findChildPageByExactTitle(
  notion: Client,
  parentPageId: string,
  title: string
): Promise<string | null> {
  let cursor: string | undefined;

  while (true) {
    const result = await notion.blocks.children.list({
      block_id: parentPageId,
      start_cursor: cursor,
      page_size: 100
    });

    for (const block of result.results) {
      if (block.type === 'child_page' && block.child_page.title === title) {
        return block.id;
      }
    }

    if (!result.has_more || !result.next_cursor) {
      return null;
    }

    cursor = result.next_cursor;
  }
}

async function findWorkspacePageByExactTitle(notion: Client, title: string): Promise<string | null> {
  let cursor: string | undefined;

  while (true) {
    const result = await notion.search({
      query: title,
      filter: {
        property: 'object',
        value: 'page'
      },
      page_size: 100,
      start_cursor: cursor
    });

    for (const entry of result.results) {
      if (entry.object !== 'page' || !('properties' in entry)) {
        continue;
      }

      const titleProperty = Object.values(entry.properties).find((property) => {
        return Boolean(property && typeof property === 'object' && 'type' in property && (property as { type?: string }).type === 'title');
      }) as { title?: Array<{ plain_text?: string }> } | undefined;

      const plainText = titleProperty?.title?.map((item) => item.plain_text ?? '').join('') ?? '';
      if (plainText.trim() === title) {
        return entry.id;
      }
    }

    if (!result.has_more || !result.next_cursor) {
      return null;
    }

    cursor = result.next_cursor;
  }
}

async function clearPageChildren(notion: Client, pageId: string): Promise<void> {
  let cursor: string | undefined;

  while (true) {
    const children = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100
    });

    for (const child of children.results) {
      try {
        await notion.blocks.delete({ block_id: child.id });
      } catch {
        // Ignore individual delete errors so one locked block does not fail whole sync.
      }
    }

    if (!children.has_more || !children.next_cursor) {
      break;
    }

    cursor = children.next_cursor;
  }
}

async function appendBlocksInChunks(notion: Client, pageId: string, blocks: NotionBlock[]): Promise<void> {
  for (let i = 0; i < blocks.length; i += MAX_BLOCKS_PER_APPEND) {
    const slice = blocks.slice(i, i + MAX_BLOCKS_PER_APPEND);
    await notion.blocks.children.append({
      block_id: pageId,
      children: slice as Parameters<Client['blocks']['children']['append']>[0]['children']
    });
  }
}

async function getPageUrl(notion: Client, pageId: string): Promise<string> {
  const page = await notion.pages.retrieve({ page_id: pageId });
  if ('url' in page && page.url) {
    return page.url;
  }

  return `https://www.notion.so/${pageId.replace(/-/g, '')}`;
}

async function main(): Promise<void> {
  const notionToken = process.env.NOTION_TOKEN?.trim();
  const parentPageRaw = process.env.NOTION_PARENT_PAGE_ID?.trim();
  const databaseRaw = process.env.NOTION_DATABASE_ID?.trim();

  if (!notionToken) {
    throw new Error('Missing NOTION_TOKEN environment variable.');
  }

  const rootDir = process.cwd();
  const pageTitle = await pickPageTitle(rootDir);
  const markdown = await readMarkdownSources(rootDir);
  const blocks = parseMarkdownToNotionBlocks(markdown);
  const notion = new Client({ auth: notionToken });

  let pageId: string | null = null;

  if (databaseRaw) {
    const databaseId = normalizeNotionId(databaseRaw);
    const titleProperty = await getDatabaseTitlePropertyName(notion, databaseId);
    pageId = await findPageInDatabaseByExactTitle(notion, databaseId, titleProperty, pageTitle);

    if (!pageId) {
      const created = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          [titleProperty]: {
            title: [
              {
                type: 'text',
                text: {
                  content: pageTitle
                }
              }
            ]
          }
        }
      });
      pageId = created.id;
    } else {
      await notion.pages.update({
        page_id: pageId,
        properties: {
          [titleProperty]: {
            title: [
              {
                type: 'text',
                text: {
                  content: pageTitle
                }
              }
            ]
          }
        }
      });
    }
  } else if (parentPageRaw) {
    const parentPageId = normalizeNotionId(parentPageRaw);
    pageId = await findChildPageByExactTitle(notion, parentPageId, pageTitle);

    if (!pageId) {
      const created = await notion.pages.create({
        parent: { page_id: parentPageId },
        properties: {
          title: {
            title: [
              {
                type: 'text',
                text: {
                  content: pageTitle
                }
              }
            ]
          }
        }
      });
      pageId = created.id;
    } else {
      await notion.pages.update({
        page_id: pageId,
        properties: {
          title: {
            title: [
              {
                type: 'text',
                text: {
                  content: pageTitle
                }
              }
            ]
          }
        }
      });
    }
  } else {
    pageId = await findWorkspacePageByExactTitle(notion, pageTitle);

    if (!pageId) {
      const created = await notion.pages.create({
        parent: { workspace: true },
        properties: {
          title: {
            title: [
              {
                type: 'text',
                text: {
                  content: pageTitle
                }
              }
            ]
          }
        }
      });
      pageId = created.id;
    } else {
      await notion.pages.update({
        page_id: pageId,
        properties: {
          title: {
            title: [
              {
                type: 'text',
                text: {
                  content: pageTitle
                }
              }
            ]
          }
        }
      });
    }
  }

  if (!pageId) {
    throw new Error('Could not resolve Notion page for upsert.');
  }

  await clearPageChildren(notion, pageId);
  await appendBlocksInChunks(notion, pageId, blocks);

  const finalUrl = await getPageUrl(notion, pageId);
  console.log(`Notion page: ${finalUrl}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to push docs to Notion: ${message}`);
  process.exit(1);
});
