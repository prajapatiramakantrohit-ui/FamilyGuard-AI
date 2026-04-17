import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const demoPath = path.resolve(process.cwd(), 'demoPatient.json');

async function loadDemo() {
  const raw = await fs.readFile(demoPath, 'utf-8');
  return JSON.parse(raw);
}

test('demo patient includes profile and lab payloads', async () => {
  const demo = await loadDemo();
  assert.ok(demo.profile);
  assert.ok(demo.labValues);
  assert.equal(typeof demo.profile.name, 'string');
  assert.equal(typeof demo.profile.age, 'number');
});

test('demo lab payload contains all expected analytes', async () => {
  const demo = await loadDemo();
  const labs = demo.labValues;
  const expected = [
    'glucose_fasting',
    'hba1c',
    'cholesterol_total',
    'cholesterol_ldl',
    'cholesterol_hdl',
    'triglycerides',
    'vitaminD',
    'vitaminB12',
    'tsh',
    'hemoglobin',
    'creatinine',
    'uric_acid'
  ];

  for (const key of expected) {
    assert.ok(Object.hasOwn(labs, key), `Missing lab key: ${key}`);
    assert.equal(typeof labs[key], 'number');
  }
});

test('demo values fall in broad plausibility ranges', async () => {
  const labs = (await loadDemo()).labValues;

  assert.ok(labs.glucose_fasting >= 40 && labs.glucose_fasting <= 500);
  assert.ok(labs.hba1c >= 3 && labs.hba1c <= 15);
  assert.ok(labs.tsh >= 0.01 && labs.tsh <= 100);
  assert.ok(labs.creatinine >= 0.2 && labs.creatinine <= 15);
  assert.ok(labs.uric_acid >= 1 && labs.uric_acid <= 20);
});
