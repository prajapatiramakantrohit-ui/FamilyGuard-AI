// securityAudit.js
// Simple consent, audit-log, and reminder state tracking for the demo.

const SecurityAudit = (() => {
  const KEY = 'familyguard_security_state';

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        return { reminders: [], auditLog: [], consented: true };
      }
      return JSON.parse(raw);
    } catch {
      return { reminders: [], auditLog: [], consented: true };
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save security state', err);
    }
  }

  function logEvent(event) {
    const state = loadState();
    state.auditLog = Array.isArray(state.auditLog) ? state.auditLog : [];
    state.auditLog.unshift({
      id: Date.now().toString(),
      at: new Date().toISOString(),
      ...event
    });
    state.auditLog = state.auditLog.slice(0, 20);
    saveState(state);
  }

  function saveReminder(reminder) {
    const state = loadState();
    state.reminders = Array.isArray(state.reminders) ? state.reminders : [];
    state.reminders.unshift({
      id: Date.now().toString(),
      at: new Date().toISOString(),
      ...reminder
    });
    state.reminders = state.reminders.slice(0, 20);
    saveState(state);
  }

  function getState() {
    return loadState();
  }

  return { logEvent, saveReminder, getState };
})();

export default SecurityAudit;
