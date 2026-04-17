// clinicalValidation.js
// Demo-only clinical validation metadata for judge-facing trust signals.

const ClinicalValidation = (() => {
  const packet = {
    version: 'Demo v1.2',
    reviewedOn: '2026-04-16',
    reviewWindow: 'Quarterly (demo simulation)',
    controls: [
      'Indian threshold mapping reviewed against internal checklist.',
      'Out-of-range plausibility guardrail enabled before risk scoring.',
      'Low-confidence OCR requires explicit manual verification.'
    ],
    limitations: [
      'Demo dataset is synthetic and for hackathon illustration only.',
      'Not a diagnostic device; physician review required for decisions.'
    ]
  };

  function getPacket() {
    return packet;
  }

  return { getPacket };
})();

export default ClinicalValidation;
