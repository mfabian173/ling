// ============================================================
// SLA STUDY HUB — state.js
// Spaced repetition (SM-2 algorithm), session state, progress
// Science: Ebbinghaus forgetting curve + SM-2 (Wozniak, 1987)
// ============================================================
 
// ─── SPACED REPETITION (SM-2) ────────────────────────────
// Each card tracks: easiness factor (EF), interval (days),
// repetitions, next review timestamp, and history.
 
const DEFAULT_EF = 2.5;   // starting easiness factor
const MIN_EF = 1.3;
 
function sm2Update(card, quality) {
  // quality: 0–5 (0-1 = fail, 2 = barely, 3 = correct w/ effort, 4-5 = easy)
  const q = Math.max(0, Math.min(5, quality));
  let { ef = DEFAULT_EF, interval = 1, reps = 0 } = card;
 
  if (q < 3) {
    // failed — restart repetitions
    reps = 0;
    interval = 1;
  } else {
    // passed
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
 
    ef = Math.max(MIN_EF, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    reps++;
  }
 
  const nextReview = Date.now() + interval * 86400000;
  return { ef, interval, reps, nextReview, lastQuality: q };
}
 
function isDue(card) {
  return !card.nextReview || Date.now() >= card.nextReview;
}
 
// ─── SESSION STATE ────────────────────────────────────────
const STATE_KEY = 'sla_hub_v2';
 
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY)) || {};
  } catch { return {}; }
}
 
function saveState(state) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
}
 
let _state = loadState();
 
function getCardState(termId) {
  return _state[termId] || { ef: DEFAULT_EF, interval: 1, reps: 0, nextReview: 0, lastQuality: -1, history: [] };
}
 
function updateCardState(termId, quality) {
  const card = getCardState(termId);
  const updated = sm2Update(card, quality);
  updated.history = [...(card.history || []), { ts: Date.now(), q: quality }].slice(-20);
  _state[termId] = { ...card, ...updated };
  saveState(_state);
  return _state[termId];
}
 
function resetCardState(termId) {
  delete _state[termId];
  saveState(_state);
}
 
function resetAllState() {
  _state = {};
  saveState(_state);
}
 
// ─── PROGRESS STATS ───────────────────────────────────────
function getProgress() {
  const total = TERMS.length;
  let mastered = 0, learning = 0, newCards = 0, dueNow = 0;
 
  TERMS.forEach(t => {
    const cs = getCardState(t.id);
    if (cs.reps === 0) { newCards++; }
    else if (cs.reps >= 3 && cs.lastQuality >= 4) { mastered++; }
    else { learning++; }
    if (isDue(cs) && cs.reps > 0) dueNow++;
  });
 
  return { total, mastered, learning, newCards, dueNow };
}
 
function getStreakData() {
  // Count consecutive days with at least one review
  const days = new Set();
  Object.values(_state).forEach(cs => {
    (cs.history || []).forEach(h => {
      days.add(new Date(h.ts).toDateString());
    });
  });
  const sorted = [...days].map(d => new Date(d)).sort((a,b) => b - a);
  let streak = 0;
  let check = new Date(); check.setHours(0,0,0,0);
  for (const d of sorted) {
    const dd = new Date(d); dd.setHours(0,0,0,0);
    const diff = (check - dd) / 86400000;
    if (diff <= 1) { streak++; check = dd; }
    else break;
  }
  return { streak, totalDays: days.size };
}
 
// ─── DUE QUEUE (spaced repetition order) ─────────────────
function getDueQueue(chapterId = 'all') {
  const pool = getTermsByChapter(chapterId);
  const due = pool.filter(t => isDue(getCardState(t.id)));
  const notDue = pool.filter(t => !isDue(getCardState(t.id)));
  // Sort due cards by oldest nextReview first (most overdue)
  due.sort((a, b) => getCardState(a.id).nextReview - getCardState(b.id).nextReview);
  return [...due, ...shuffle(notDue)];
}
 
// ─── SESSION TRACKING ────────────────────────────────────
let _session = { correct: 0, wrong: 0, streak: 0, startTime: Date.now() };
 
function sessionReset() {
  _session = { correct: 0, wrong: 0, streak: 0, startTime: Date.now() };
}
 
function sessionRecord(correct) {
  if (correct) { _session.correct++; _session.streak++; }
  else { _session.wrong++; _session.streak = 0; }
}
 
function getSession() { return { ..._session }; }
 
// ─── HEATMAP DATA ────────────────────────────────────────
function getHeatmapData(days = 60) {
  const map = {};
  Object.values(_state).forEach(cs => {
    (cs.history || []).forEach(h => {
      const key = new Date(h.ts).toDateString();
      map[key] = (map[key] || 0) + 1;
    });
  });
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    result.push({ date: key, count: map[key] || 0 });
  }
  return result;
}
 
