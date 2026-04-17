# FamilyGuard AI Smoke Tests

Run these three tests before any live demo.

## Test 1: Demo Flow End-to-End
1. Open index.html.
2. Click Run Demo.
3. Confirm Results section opens with:
   - Non-empty patient header
   - Gauge rendered
   - Category bars rendered
   - Findings table populated
4. Confirm Export Report button is enabled.

Expected:
- No runtime error popup.
- Risk level and score are visible.

## Test 2: Manual Entry + Validation Guard
1. Go to Enter Data.
2. Fill patient name.
3. Enter an impossible value (for example, HbA1c = 45).
4. Click Analyze Risk Profile.

Expected:
- Analysis does not run.
- Validation warning appears with plausible range guidance.
- Focus returns to the invalid field.

## Test 3: Family Save/Remove/Clear Privacy Controls
1. Run analysis (Demo or Manual valid data).
2. Leave consent checkbox unchecked.
3. Click Save to Family.
4. Check consent checkbox.
5. Click Save to Family again.
6. Remove one member from family card.
7. Click Clear All Local Data.

Expected:
- Save blocked before consent.
- Save works after consent.
- Remove works.
- Clear all removes every family profile and resets count to 0.
