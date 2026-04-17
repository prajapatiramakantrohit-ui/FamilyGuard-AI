import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const thresholdPath = path.resolve(process.cwd(), 'indianThresholds.json');

test('threshold file has required markers', async () => {
  const raw = await fs.readFile(thresholdPath, 'utf-8');
  const data = JSON.parse(raw);

  const required = [
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

  for (const marker of required) {
    assert.ok(data[marker], `Missing threshold key: ${marker}`);
  }
});

test('core threshold values are plausible', async () => {
  const raw = await fs.readFile(thresholdPath, 'utf-8');
  const t = JSON.parse(raw);

  assert.equal(t.glucose_fasting.prediabetes_start, 96);
  assert.equal(t.hba1c.prediabetes_start, 5.7);
  assert.equal(t.tsh.normal_min, 0.4);
  assert.ok(t.vitaminD.deficient_max <= 25);
  assert.ok(t.cholesterol_total.indian_normal_max <= 190);
});
