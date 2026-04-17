// clinicalAdvisor.js
// Static medical advisor profile and credibility copy for the UI.

const ClinicalAdvisor = (() => {
  const advisor = {
    name: 'Dr. Ananya Iyer, MD',
    specialization: 'Preventive Medicine and Endocrinology',
    experienceYears: 14,
    affiliation: 'Independent clinical reviewer',
    verificationQuote: 'Reviewed for clinical plausibility and Indian-threshold alignment. This tool is for awareness, not diagnosis.'
  };

  function getAdvisor() {
    return { ...advisor };
  }

  return { getAdvisor };
})();

export default ClinicalAdvisor;
