# Notion Sync Setup

This project includes a one-command docs sync script:

`npm run push:notion`

It reads `README.md` first, then appends all `docs/*.md` files (alphabetical), upserts a Notion page by title, and prints:

`Notion page: <URL>`

## 1) Create a Notion integration

1. Open https://www.notion.so/my-integrations
2. Click **New integration**.
3. Give it a name (for example: `FamilyGuard Sync`).
4. Select the workspace.
5. Copy the **Internal Integration Token**.
6. Put it in `.env` as `NOTION_TOKEN`.

## 2) Share the target parent with the integration

If using `NOTION_PARENT_PAGE_ID`:

1. Open the Notion page that should contain your generated docs page.
2. Click **Share**.
3. Invite/select your integration so it has access.

If using `NOTION_DATABASE_ID`:

1. Open the database.
2. Click **Share**.
3. Invite/select your integration.

Without sharing, Notion API calls will fail due to permissions.

In practice, this integration still needs a real parent page or database to create content. If you try to run token-only mode, Notion may reject the create request unless the integration has the special capability to insert content at the workspace root. The reliable path is to set either `NOTION_PARENT_PAGE_ID` or `NOTION_DATABASE_ID` and share that target with the integration.

## 3) Set environment variables

Create `.env` from `.env.example`.

Set:

- `NOTION_TOKEN` = integration secret
- `NOTION_PARENT_PAGE_ID` = parent page ID (or URL)
- or `NOTION_DATABASE_ID` = database ID (or URL)
- `NOTION_PAGE_TITLE` = exact title for upsert (optional)

## 4) How to find `NOTION_PARENT_PAGE_ID`

Open the parent page in Notion, copy the URL, and use either:

- the full URL, or
- the page UUID at the end (with or without dashes)

The script accepts either and normalizes automatically.

## 5) Install and run

```bash
npm install
npm run push:notion
```

On success, terminal output ends with:

`Notion page: https://www.notion.so/...`

Use that link for submission.
