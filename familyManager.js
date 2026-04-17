// modules/familyManager.js
// Manages family profiles using localStorage

const FamilyManager = (() => {
  const STORAGE_KEY = 'familyguard_profiles';

  function loadProfiles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load profiles:', e);
      return [];
    }
  }

  function saveProfiles(profiles) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save profiles:', e);
    }
  }

  function addProfile(profile, riskResult) {
    const profiles = loadProfiles();
    const id = Date.now().toString();
    const bmi = riskResult.bmi ? riskResult.bmi.toFixed(1) : null;
    const snapshot = {
      addedAt: new Date().toISOString(),
      overallScore: riskResult.overallScore,
      riskLevel: riskResult.riskLevel,
      bmi,
      categoryScores: riskResult.categoryScores
    };

    const entry = {
      id,
      name: profile.name || 'Unknown',
      age: profile.age,
      gender: profile.gender,
      addedAt: snapshot.addedAt,
      overallScore: riskResult.overallScore,
      riskLevel: riskResult.riskLevel,
      bmi,
      categoryScores: riskResult.categoryScores,
      history: [snapshot]
    };

    // Check if profile with same name exists and update
    const existingIdx = profiles.findIndex(p => p.name.toLowerCase() === entry.name.toLowerCase());
    if (existingIdx >= 0) {
      const prev = profiles[existingIdx];
      const history = Array.isArray(prev.history) ? [...prev.history, snapshot] : [snapshot];
      profiles[existingIdx] = { ...prev, ...entry, id: prev.id, history };
    } else {
      profiles.push(entry);
    }

    saveProfiles(profiles);
    return entry;
  }

  function removeProfile(id) {
    const profiles = loadProfiles().filter(p => p.id !== id);
    saveProfiles(profiles);
  }

  function clearAllProfiles() {
    saveProfiles([]);
  }

  function getProfile(id) {
    return loadProfiles().find(p => p.id === id) || null;
  }

  function getTrend(id) {
    const profile = getProfile(id);
    if (!profile || !Array.isArray(profile.history) || profile.history.length < 2) {
      return null;
    }

    const last = profile.history[profile.history.length - 1];
    const previous = profile.history[profile.history.length - 2];
    return {
      delta: last.overallScore - previous.overallScore,
      from: previous.overallScore,
      to: last.overallScore
    };
  }

  function getRiskColor(level) {
    const colors = {
      LOW: '#2f9d6d',
      MEDIUM: '#c58a1b',
      HIGH: '#e08c4d',
      CRITICAL: '#d55b65'
    };
    return colors[level] || '#888';
  }

  function getRiskEmoji(level) {
    const emojis = { LOW: '🟢', MEDIUM: '🟠', HIGH: '🟤', CRITICAL: '🔴' };
    return emojis[level] || '⚪';
  }

  return {
    loadProfiles,
    addProfile,
    removeProfile,
    clearAllProfiles,
    getProfile,
    getTrend,
    getRiskColor,
    getRiskEmoji
  };
})();

export default FamilyManager;
