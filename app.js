/* ============================================================
   SLA STUDY HUB — app.js
   Study modes backed by cognitive science:
   1. Spaced Repetition Flashcards (SM-2, Ebbinghaus)
   2. Multiple Choice Quiz (testing effect, Roediger & Karpicke 2006)
   3. Cloze / Fill-in-the-Blank (retrieval practice, desirable difficulty)
   4. Matching (paired-associate learning, Atkinson & Shiffrin)
   5. Concept Map (elaborative interrogation, Pressley et al.)
   6. Speed Round (interleaving + time pressure)
   7. AI Tutor (self-explanation effect, Chi et al. 1994)
   ============================================================ */
 
// ─── CHAPTER COLORS ──────────────────────────────────────
const CH_COLOR = {
  ch2:  '#74b9ff', ch3:  '#fd79a8', ch4:  '#ffd166',
  ch5:  '#06d6a0', ch6:  '#ff6b6b', ch7:  '#a29bfe',
  ch8:  '#fdcb6e', ch9:  '#55efc4', ch10: '#e17055',
};
 
// ─── CONCEPT CLUSTERS for Concept Map ───────────────────
const CLUSTERS = [
  {
    key: 'krashen',
    title: "Krashen's Monitor Model",
    color: '#ffd166',
    desc: "Krashen's five interconnected hypotheses that form the most influential—and debated—theory in SLA. Understanding how they reinforce each other is key.",
    terms: ['t029','t030','t031','t032','t033'],
    why: "Krashen's model directly influenced CLT and is a guaranteed exam topic."
  },
  {
    key: 'theories',
    title: 'Theoretical Frameworks',
    color: '#74b9ff',
    desc: "Major theoretical lenses for understanding why and how language is acquired. These underpin all the specific hypotheses in the course.",
    terms: ['t001','t004','t005','t006','t010','t015','t040','t042','t047','t048'],
    why: "Expect questions contrasting nativism, behaviorism, and sociocultural theory."
  },
  {
    key: 'cognitive',
    title: 'Cognitive Processing',
    color: '#06d6a0',
    desc: "How the mind processes, stores, and retrieves L2 knowledge. These concepts explain why some things are easy to learn and others stubbornly difficult.",
    terms: ['t045','t046','t051','t054','t055','t056','t059','t060','t063','t065','t121'],
    why: "Processing concepts like noticing, intake, and automaticity appear in nearly every chapter."
  },
  {
    key: 'methods',
    title: 'Teaching Methods',
    color: '#ff6b6b',
    desc: "From Grammar Translation to TBLT—the historical evolution of L2 pedagogy. Each method reflects a different theoretical stance on how language is best learned.",
    terms: ['t066','t067','t068','t069','t070','t071','t072','t073','t076','t077','t080'],
    why: "You need to know the theory behind each method, not just its name."
  },
  {
    key: 'feedback',
    title: 'Feedback & Correction',
    color: '#a29bfe',
    desc: "How errors are treated in the classroom—a surprisingly controversial area that connects theory to practice.",
    terms: ['t053','t062','t074','t075','t078','t079'],
    why: "Distinguish: recast vs. explicit correction vs. input enhancement vs. flooding."
  },
  {
    key: 'il',
    title: 'Interlanguage & Development',
    color: '#fd79a8',
    desc: "The systematic nature of learner language—its stages, errors, and eventual stabilization.",
    terms: ['t037','t038','t039','t083','t085','t086','t087','t090','t091','t092','t093','t094'],
    why: "Interlanguage is a unifying concept tying together error analysis, fossilization, and developmental sequences."
  },
  {
    key: 'cph',
    title: 'Critical Period & Age',
    color: '#fdcb6e',
    desc: "The heated debate about whether there is a biological window for native-like L2 acquisition, and what evidence supports or challenges it.",
    terms: ['t096','t097','t098','t099','t100','t101','t102','t103'],
    why: "Know the difference between critical period and sensitive period—examiners love this distinction."
  },
  {
    key: 'individual',
    title: 'Individual Differences',
    color: '#55efc4',
    desc: "Why some learners succeed and others plateau—the learner variables that predict L2 success.",
    terms: ['t104','t107','t108','t109','t110','t111','t112','t113','t114','t115','t118','t119','t120'],
    why: "BICS vs. CALP and integrative vs. instrumental motivation are high-frequency exam topics."
  },
  {
    key: 'bilingual',
    title: 'Bilingualism & Cognition',
    color: '#e17055',
    desc: "How bilingualism shapes the mind—from lexical organization to executive function to dementia research.",
    terms: ['t022','t023','t024','t025','t026','t027','t028','t123','t124','t125','t127','t129','t130','t131','t133'],
    why: "BFLA, code-switching, and additive vs. subtractive bilingualism are essential Ch3 + Ch10 concepts."
  },
];
 
// ─── STATE ────────────────────────────────────────────────
let currentMode    = 'home';
let filterChapter  = 'all';
let chatHistory    = [];
 
// Flashcard state
let fcQueue = [];
let fcIndex = 0;
let fcFlipped = false;
 
// Quiz state
let quizItems = []; let quizIdx = 0; let quizCorrect = 0;
 
// Cloze state
let clozeItems = []; let clozeIdx = 0; let clozeCorrect = 0;
 
// Matching state
let matchPairs = []; let matchScore = 0; let matchSel = null;
 
// Speed state
let speedItems = []; let speedIdx = 0; let speedTimerVal = 0;
let speedInterval = null; let speedCorrect = 0; let speedWrong = 0;
 
// Concept map state
let cmapCluster = 0;
 
// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  buildChapterFilter();
  renderHeatmap();
  updateHeaderProgress();
  showMode('home');
});
 
// ─── NAVIGATION ──────────────────────────────────────────
function buildNav() {
  const nav = document.getElementById('nav');
  const modes = [
    { id:'home',    icon:'⬛', label:'Dashboard' },
    { id:'flashcard', icon:'🃏', label:'Flashcards', science:'SM-2' },
    { id:'quiz',    icon:'❓', label:'Quiz',      science:'Testing Effect' },
    { id:'cloze',   icon:'✏️', label:'Fill-in-Blank', science:'Retrieval' },
    { id:'match',   icon:'🔗', label:'Matching',  science:'Paired Assoc.' },
    { id:'cmap',    icon:'🗺', label:'Concept Map', science:'Elaborative' },
    { id:'speed',   icon:'⚡', label:'Speed Round', science:'Interleaving' },
    { id:'tutor',   icon:'🤖', label:'AI Tutor',  science:'Self-Explanation' },
  ];
  nav.innerHTML = modes.map(m => `
    <button class="nav-btn${m.id==='home'?' active':''}" id="navbtn-${m.id}" onclick="showMode('${m.id}')">
      ${m.icon} ${m.label}
      ${m.science ? `<span class="nav-badge">${m.science}</span>` : ''}
    </button>
  `).join('');
}
 
function showMode(id) {
  document.querySelectorAll('.mode').forEach(m => m.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(`mode-${id}`);
  if (panel) panel.classList.add('active');
  const btn = document.getElementById(`navbtn-${id}`);
  if (btn) btn.classList.add('active');
  currentMode = id;
 
  switch(id) {
    case 'home':      renderHome(); break;
    case 'flashcard': initFlashcard(); break;
    case 'quiz':      initQuiz(); break;
    case 'cloze':     initCloze(); break;
    case 'match':     initMatch(); break;
    case 'cmap':      initCmap(); break;
    case 'speed':     initSpeed(); break;
    case 'tutor':     initTutor(); break;
  }
}
 
// ─── CHAPTER FILTER ──────────────────────────────────────
function buildChapterFilter() {
  const all = [{ id:'all', label:'All Chapters', color:'#ffffff' }, ...CHAPTERS];
  document.querySelectorAll('.chapter-filter').forEach(el => {
    el.innerHTML = all.map(ch => `
      <button class="filter-btn${ch.id==='all'?' active':''}"
        style="${ch.id==='all'?'':'border-color:'+ch.color+'44'}"
        onclick="setFilter('${ch.id}', this)"
        data-filter="${ch.id}">
        ${ch.label || ch.title}
      </button>
    `).join('');
  });
}
 
function setFilter(chId, btn) {
  filterChapter = chId;
  btn.closest('.chapter-filter').querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('active');
    b.style.background = '';
    b.style.color = '';
  });
  btn.classList.add('active');
  if (chId !== 'all') {
    const ch = CHAPTERS.find(c => c.id === chId);
    if (ch) { btn.style.background = ch.color; btn.style.color = '#0c0b14'; }
  }
 
  // Re-init current mode with new filter
  switch(currentMode) {
    case 'flashcard': initFlashcard(); break;
    case 'quiz':      initQuiz(); break;
    case 'cloze':     initCloze(); break;
    case 'match':     initMatch(); break;
    case 'speed':     resetSpeed(); break;
  }
}
 
// ─── HEADER PROGRESS ─────────────────────────────────────
function updateHeaderProgress() {
  const prog = getProgress();
  const pct = Math.round(prog.mastered / prog.total * 100);
 
  // Ring
  const R = 18;
  const circ = 2 * Math.PI * R;
  const ring = document.getElementById('prog-ring');
  if (ring) {
    ring.style.strokeDasharray = circ;
    ring.style.strokeDashoffset = circ - (circ * pct / 100);
  }
  el('prog-ring-text', `${pct}%`);
  el('stat-mastered', prog.mastered);
  el('stat-learning', prog.learning);
  el('stat-new', prog.newCards);
 
  const { streak } = getStreakData();
  const badge = document.getElementById('streak-badge');
  if (badge) {
    badge.classList.toggle('hidden', streak < 2);
    el('streak-num', streak + (streak === 1 ? ' day' : ' days'));
  }
}
 
// ─── HOME ─────────────────────────────────────────────────
function renderHome() {
  renderHeatmap();
  updateHeaderProgress();
}
 
function renderHeatmap() {
  const data = getHeatmapData(56);
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  const max = Math.max(...data.map(d => d.count), 1);
  grid.innerHTML = data.map(d => {
    const intensity = d.count / max;
    const bg = d.count === 0
      ? 'var(--surface3)'
      : `rgba(6,214,160,${0.2 + intensity * 0.75})`;
    return `<div class="hm-cell" style="background:${bg}" title="${d.date}: ${d.count} reviews"></div>`;
  }).join('');
}
 
// ════════════════════════════════════════════════════════════
// 1. FLASHCARDS (Spaced Repetition — SM-2)
// ════════════════════════════════════════════════════════════
function initFlashcard() {
  sessionReset();
  fcQueue = getDueQueue(filterChapter);
  fcIndex = 0;
  fcFlipped = false;
  renderFlashcard();
}
 
function renderFlashcard() {
  const pool = fcQueue;
  if (!pool.length) {
    document.getElementById('fc-content').innerHTML = `
      <div class="result-screen">
        <span class="result-emoji">🎉</span>
        <div class="result-score" style="color:var(--accent3)">All Done!</div>
        <div class="result-msg">No cards due right now. Come back later or choose a different chapter.</div>
        <button class="btn btn-primary btn-lg" onclick="initFlashcard()">Start Over</button>
      </div>`;
    return;
  }
 
  const term = pool[Math.min(fcIndex, pool.length - 1)];
  const cs   = getCardState(term.id);
  const ch   = CHAPTER_MAP[term.chapter];
  const total = pool.length;
  const pos   = Math.min(fcIndex + 1, total);
 
  // Next interval preview
  const previewIntervals = [sm2Update({...cs}, 1), sm2Update({...cs}, 3), sm2Update({...cs}, 4), sm2Update({...cs}, 5)];
 
  document.getElementById('fc-content').innerHTML = `
    <div class="fc-arena">
      <!-- Counter -->
      <div class="fc-counter">
        Card ${pos} of ${total}
        <span style="color:var(--text-subtle);margin-left:8px">·</span>
        <span style="color:var(--accent3);margin-left:8px">${getProgress().mastered} mastered</span>
      </div>
 
      <!-- Card -->
      <div class="fc-wrap" id="fc-wrap" onclick="flipCard()">
        <div class="fc-inner" id="fc-inner">
          <!-- FRONT -->
          <div class="fc-face fc-front">
            <div class="fc-label">Term</div>
            <div class="fc-term">${term.term}</div>
            ${term.abbr ? `<div class="fc-abbr">${term.abbr}</div>` : ''}
            <div class="fc-chapter-tag" style="color:${ch.color}">${ch.label} · ${ch.title}</div>
            <div class="fc-flip-hint">click to reveal</div>
          </div>
          <!-- BACK -->
          <div class="fc-face fc-back">
            <div class="fc-label">Definition</div>
            <div class="fc-def">${term.def}</div>
            ${term.example ? `<div class="fc-example">${term.example}</div>` : ''}
          </div>
        </div>
      </div>
 
      <!-- Rating row (only shown after flip) -->
      <div id="fc-rate-row" class="fc-rating-row hidden">
        <button class="fc-rating-btn r-again" onclick="rateCard(1)">
          <span class="emoji">😵</span> Again
          <span class="interval-badge">${fmt(previewIntervals[0].interval)}</span>
        </button>
        <button class="fc-rating-btn r-hard" onclick="rateCard(3)">
          <span class="emoji">😬</span> Hard
          <span class="interval-badge">${fmt(previewIntervals[1].interval)}</span>
        </button>
        <button class="fc-rating-btn r-good" onclick="rateCard(4)">
          <span class="emoji">🙂</span> Good
          <span class="interval-badge">${fmt(previewIntervals[2].interval)}</span>
        </button>
        <button class="fc-rating-btn r-easy" onclick="rateCard(5)">
          <span class="emoji">😄</span> Easy
          <span class="interval-badge">${fmt(previewIntervals[3].interval)}</span>
        </button>
      </div>
 
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="skipCard()">Skip →</button>
        <button class="btn btn-ghost btn-sm" onclick="initFlashcard()">↺ Restart Queue</button>
      </div>
    </div>`;
}
 
function fmt(days) {
  if (days < 1) return '<1d';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  return `${Math.round(days/30)}mo`;
}
 
function flipCard() {
  fcFlipped = !fcFlipped;
  const inner = document.getElementById('fc-inner');
  if (inner) inner.classList.toggle('flipped', fcFlipped);
  const rateRow = document.getElementById('fc-rate-row');
  if (rateRow && fcFlipped) rateRow.classList.remove('hidden');
}
 
function rateCard(quality) {
  const term = fcQueue[Math.min(fcIndex, fcQueue.length - 1)];
  updateCardState(term.id, quality);
  sessionRecord(quality >= 3);
  updateHeaderProgress();
 
  // If wrong, re-insert card further in queue
  if (quality < 3) {
    const reinsert = Math.min(fcIndex + 4, fcQueue.length);
    fcQueue.splice(reinsert, 0, term);
  }
 
  fcIndex++;
  fcFlipped = false;
  if (fcIndex >= fcQueue.length) fcIndex = 0;
  renderFlashcard();
}
 
function skipCard() {
  fcIndex = (fcIndex + 1) % Math.max(fcQueue.length, 1);
  fcFlipped = false;
  renderFlashcard();
}
 
// ════════════════════════════════════════════════════════════
// 2. QUIZ (Testing Effect — Roediger & Karpicke, 2006)
// ════════════════════════════════════════════════════════════
function initQuiz() {
  sessionReset();
  const pool = shuffle(getTermsByChapter(filterChapter));
  quizItems = pool.slice(0, 20);
  quizIdx = 0; quizCorrect = 0;
  renderQuiz();
}
 
function renderQuiz() {
  if (quizIdx >= quizItems.length) { renderQuizResult(); return; }
  const q = quizItems[quizIdx];
  const ch = CHAPTER_MAP[q.chapter];
  const letters = ['A','B','C','D'];
 
  // Alternate question types: def→term, term→def, example→term
  const qtype = quizIdx % 3;
  let prompt, highlightText, correct, wrongPool;
 
  if (qtype === 0) {
    // Show definition → pick term
    prompt = 'Which term matches this definition?';
    highlightText = q.def;
    correct = q.term + (q.abbr ? ` (${q.abbr})` : '');
    wrongPool = getTermsByChapter(filterChapter)
      .filter(t => t.id !== q.id)
      .map(t => t.term + (t.abbr ? ` (${t.abbr})` : ''));
  } else if (qtype === 1) {
    // Show term → pick definition
    prompt = 'Select the correct definition:';
    highlightText = q.term + (q.abbr ? ` (${q.abbr})` : '');
    correct = q.def;
    wrongPool = getTermsByChapter(filterChapter).filter(t => t.id !== q.id).map(t => t.def);
  } else {
    // Show example → pick term
    prompt = 'Which term does this example illustrate?';
    highlightText = q.example || q.def.substring(0, 120) + '…';
    correct = q.term + (q.abbr ? ` (${q.abbr})` : '');
    wrongPool = getTermsByChapter(filterChapter)
      .filter(t => t.id !== q.id && t.chapter === q.chapter) // same chapter = harder
      .map(t => t.term + (t.abbr ? ` (${t.abbr})` : ''));
    if (wrongPool.length < 3) wrongPool = getTermsByChapter(filterChapter).filter(t=>t.id!==q.id).map(t=>t.term+(t.abbr?` (${t.abbr})`:''));
  }
 
  const wrongs = shuffle(wrongPool).slice(0, 3);
  const opts = shuffle([correct, ...wrongs]);
  const pct = Math.round(quizIdx / quizItems.length * 100);
 
  document.getElementById('quiz-content').innerHTML = `
    <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
    <div class="quiz-meta">
      <span>Question ${quizIdx + 1} / ${quizItems.length}</span>
      <span class="quiz-score-live">${quizCorrect} correct</span>
    </div>
    <div class="card quiz-card">
      <div class="quiz-qtype" style="color:${ch.color}">${ch.label} · ${ch.title}</div>
      <div class="quiz-prompt">
        <span class="quiz-highlight">${highlightText}</span>
        ${prompt}
      </div>
      <div class="quiz-options" id="quiz-opts">
        ${opts.map((o, i) => `
          <button class="quiz-opt" onclick="answerQuiz(this,'${esc(o)}','${esc(correct)}')" data-opt="${esc(o)}">
            <span class="quiz-opt-letter">${letters[i]}</span>
            <span>${o}</span>
          </button>`).join('')}
      </div>
      <div class="feedback" id="quiz-feedback"></div>
      <div style="margin-top:16px;display:flex;gap:10px">
        <button class="btn btn-primary hidden" id="quiz-next">Next Question →</button>
        <button class="btn btn-ghost btn-sm" onclick="initQuiz()">↺ New Quiz</button>
      </div>
    </div>`;
}
 
function answerQuiz(btn, chosen, correct) {
  if (btn.disabled) return;
  document.querySelectorAll('.quiz-opt').forEach(b => b.disabled = true);
  const isCorrect = chosen === correct;
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    document.querySelectorAll('.quiz-opt').forEach(b => {
      if (b.dataset.opt === correct) b.classList.add('correct');
    });
  }
 
  const term = quizItems[quizIdx];
  if (isCorrect) { quizCorrect++; sessionRecord(true); updateCardState(term.id, 4); }
  else { sessionRecord(false); updateCardState(term.id, 1); }
  updateHeaderProgress();
 
  const fb = document.getElementById('quiz-feedback');
  if (fb) {
    fb.className = `feedback show ${isCorrect ? 'ok' : 'bad'}`;
    fb.innerHTML = isCorrect
      ? `✓ Correct! <em style="color:var(--text-muted);font-size:0.8rem">— ${term.example || ''}</em>`
      : `✗ The answer was: <strong>${correct}</strong>`;
  }
 
  const nextBtn = document.getElementById('quiz-next');
  if (nextBtn) {
    nextBtn.classList.remove('hidden');
    nextBtn.onclick = () => { quizIdx++; renderQuiz(); };
  }
}
 
function renderQuizResult() {
  const pct = Math.round(quizCorrect / quizItems.length * 100);
  document.getElementById('quiz-content').innerHTML = `
    <div class="result-screen">
      <span class="result-emoji">${pct>=85?'🏆':pct>=65?'🎯':'📚'}</span>
      <div class="result-score">${quizCorrect}/${quizItems.length}</div>
      <div class="result-msg">${pct}% — ${pct>=85?'Outstanding! You really know this material.':pct>=65?'Good work! Review the ones you missed.':'Keep studying — try the flashcards first, then come back.'}</div>
      <div class="result-breakdown">
        <div class="rb-item"><div class="rb-num" style="color:var(--accent3)">${quizCorrect}</div><div class="rb-lbl">Correct</div></div>
        <div class="rb-item"><div class="rb-num" style="color:var(--accent)">${quizItems.length-quizCorrect}</div><div class="rb-lbl">Missed</div></div>
        <div class="rb-item"><div class="rb-num" style="color:var(--accent2)">${pct}%</div><div class="rb-lbl">Score</div></div>
      </div>
      <button class="btn btn-primary btn-lg" onclick="initQuiz()">Try Again</button>
    </div>`;
}
 
// ════════════════════════════════════════════════════════════
// 3. CLOZE / FILL-IN-THE-BLANK (Retrieval Practice)
// ════════════════════════════════════════════════════════════
// Science: Retrieval practice with desirable difficulty (Bjork, 1994)
// + Letter-by-letter hints reduce frustration without eliminating effort.
 
function initCloze() {
  sessionReset();
  const pool = shuffle(getTermsByChapter(filterChapter));
  clozeItems = pool.slice(0, 18);
  clozeIdx = 0; clozeCorrect = 0;
  renderCloze();
}
 
function renderCloze() {
  if (clozeIdx >= clozeItems.length) { renderClozeResult(); return; }
  const t = clozeItems[clozeIdx];
  const ch = CHAPTER_MAP[t.chapter];
  const termLetters = t.term.split('');
 
  document.getElementById('cloze-content').innerHTML = `
    <div class="cloze-meta">
      <span>${clozeIdx + 1} of ${clozeItems.length}</span>
      <span class="quiz-score-live">${clozeCorrect} correct</span>
    </div>
    <div class="card cloze-card">
      <div class="cloze-chapter-tag" style="background:${ch.color}22;color:${ch.color}">${ch.label} · ${ch.title}</div>
      <br>
 
      <!-- The definition acts as the cue (elaborative) -->
      <div class="cloze-sentence">
        <span class="cloze-blank" id="cloze-blank">___</span> : <em>${t.def}</em>
      </div>
 
      <!-- Example as additional cue -->
      ${t.example ? `<div class="node-example" style="margin-bottom:20px">${t.example}</div>` : ''}
 
      <!-- Input -->
      <div class="cloze-row">
        <input class="input" id="cloze-input" placeholder="Type the term…" autocomplete="off"
          onkeydown="if(event.key==='Enter') checkCloze()"
          oninput="updateLetterHints(this.value,'${t.term.replace(/'/g,'\\\'')}')" />
        <button class="btn btn-primary" onclick="checkCloze()">Check</button>
      </div>
 
      <!-- Letter hint scaffold (desirable difficulty — reveals one letter at a time) -->
      <div class="cloze-hint-letters" id="letter-hints">
        ${termLetters.map((c,i) => `
          <div class="hint-letter" id="hl-${i}" data-char="${c === ' ' ? '_' : c}">
            ${c === ' ' ? '&nbsp;' : '·'}
          </div>`).join('')}
      </div>
      <div style="margin-top:6px;font-size:0.62rem;color:var(--text-subtle)">
        Hint: letters light up as you get closer
      </div>
 
      <div class="feedback hidden" id="cloze-fb"></div>
 
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary hidden" id="cloze-next">Next →</button>
        <button class="btn btn-ghost btn-sm" onclick="showClozeAnswer()">Reveal Answer</button>
        <button class="btn btn-ghost btn-sm" onclick="initCloze()">↺ Restart</button>
      </div>
    </div>`;
 
  document.getElementById('cloze-input')?.focus();
}
 
function updateLetterHints(typed, term) {
  // Reveal letters that the user has correctly typed so far (prefix matching)
  const lower = typed.toLowerCase();
  const termLow = term.toLowerCase();
  term.split('').forEach((c, i) => {
    const el = document.getElementById(`hl-${i}`);
    if (!el) return;
    if (lower.length > i && lower[i] === termLow[i]) {
      el.classList.add('revealed');
      el.textContent = c === ' ' ? ' ' : c;
    } else {
      el.classList.remove('revealed');
      el.textContent = c === ' ' ? '\u00a0' : '·';
    }
  });
}
 
function checkCloze() {
  const input = document.getElementById('cloze-input');
  if (!input) return;
  const t = clozeItems[clozeIdx];
  const typed = input.value.trim().toLowerCase();
  const correct = t.term.toLowerCase();
  const abbr    = t.abbr.toLowerCase();
 
  // Accept: exact match, abbreviation, or ≥70% match of first 6 chars
  const isCorrect = typed === correct
    || (abbr && typed === abbr)
    || (typed.length >= 4 && correct.startsWith(typed) && typed.length / correct.length > 0.65);
 
  input.classList.add(isCorrect ? 'correct' : 'wrong');
  input.disabled = true;
 
  if (isCorrect) { clozeCorrect++; sessionRecord(true); updateCardState(t.id, 4); }
  else { sessionRecord(false); updateCardState(t.id, 1); }
  updateHeaderProgress();
 
  const fb = document.getElementById('cloze-fb');
  if (fb) {
    fb.className = `feedback show ${isCorrect ? 'ok' : 'bad'}`;
    fb.innerHTML = isCorrect
      ? `✓ Correct! The term is <strong>${t.term}</strong>.`
      : `✗ The answer is <strong>${t.term}</strong>${t.abbr ? ` (${t.abbr})` : ''}.`;
  }
 
  // Reveal all letters
  t.term.split('').forEach((c, i) => {
    const h = document.getElementById(`hl-${i}`);
    if (h) { h.classList.add('revealed'); h.textContent = c === ' ' ? '\u00a0' : c; }
  });
 
  const nextBtn = document.getElementById('cloze-next');
  if (nextBtn) {
    nextBtn.classList.remove('hidden');
    nextBtn.onclick = () => { clozeIdx++; renderCloze(); };
  }
}
 
function showClozeAnswer() {
  const t = clozeItems[clozeIdx];
  const input = document.getElementById('cloze-input');
  if (input) { input.value = t.term; input.disabled = true; }
  updateCardState(t.id, 1);
  sessionRecord(false);
  const fb = document.getElementById('cloze-fb');
  if (fb) { fb.className = 'feedback show hint'; fb.innerHTML = `Answer revealed: <strong>${t.term}</strong>. You'll see this card again soon.`; }
  const nextBtn = document.getElementById('cloze-next');
  if (nextBtn) { nextBtn.classList.remove('hidden'); nextBtn.onclick = () => { clozeIdx++; renderCloze(); }; }
  t.term.split('').forEach((c,i) => {
    const h = document.getElementById(`hl-${i}`);
    if (h) { h.classList.add('revealed'); h.textContent = c === ' ' ? '\u00a0' : c; }
  });
  updateHeaderProgress();
}
 
function renderClozeResult() {
  const pct = Math.round(clozeCorrect / clozeItems.length * 100);
  document.getElementById('cloze-content').innerHTML = `
    <div class="result-screen">
      <span class="result-emoji">${pct>=80?'🎉':pct>=60?'👍':'📚'}</span>
      <div class="result-score">${clozeCorrect}/${clozeItems.length}</div>
      <div class="result-msg">${pct}% — Retrieval practice completed. Your brain just did the work that matters.</div>
      <button class="btn btn-primary btn-lg" onclick="initCloze()">Try Again</button>
    </div>`;
}
 
// ════════════════════════════════════════════════════════════
// 4. MATCHING (Paired-Associate Learning)
// ════════════════════════════════════════════════════════════
// Science: Matched items create stronger memory traces through
// bidirectional retrieval (Kahana 2002 — associative symmetry).
// Matching requires recognizing AND connecting — deeper than MCQ.
 
function initMatch() {
  sessionReset();
  const pool = shuffle(getTermsByChapter(filterChapter)).slice(0, 10);
  matchPairs = pool;
  matchScore = 0;
  matchSel = null;
  renderMatch();
}
 
function renderMatch() {
  const shuffledTerms = shuffle([...matchPairs]);
  const shuffledDefs  = shuffle([...matchPairs]);
 
  document.getElementById('match-content').innerHTML = `
    <div class="match-score-bar">
      <span>Matched:</span>
      <span class="match-score-num" id="match-score-num">0</span>
      <span>/ ${matchPairs.length}</span>
      <span style="margin-left:auto;font-size:0.65rem;color:var(--text-subtle)">Click a term, then its definition</span>
    </div>
    <div class="matching-board">
      <div class="match-col">
        <div class="match-col-head">Terms</div>
        ${shuffledTerms.map(p => `
          <div class="match-item term-item" id="mt-${p.id}" data-id="${p.id}" data-type="term"
               onclick="selectMatch(this,'${p.id}','term')">
            ${p.term}${p.abbr ? `<br><small style="font-weight:400;color:var(--text-muted);font-size:0.68rem">${p.abbr}</small>` : ''}
          </div>`).join('')}
      </div>
      <div class="match-col">
        <div class="match-col-head">Definitions</div>
        ${shuffledDefs.map(p => `
          <div class="match-item def-item" id="md-${p.id}" data-id="${p.id}" data-type="def"
               onclick="selectMatch(this,'${p.id}','def')">
            ${p.def.length > 100 ? p.def.slice(0,97)+'…' : p.def}
          </div>`).join('')}
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:20px;justify-content:center">
      <button class="btn btn-primary" onclick="initMatch()">↺ New Round</button>
    </div>`;
}
 
function selectMatch(el, termId, type) {
  if (el.classList.contains('matched')) return;
 
  if (!matchSel) {
    // First selection
    matchSel = { el, termId, type };
    el.classList.add('selected');
    return;
  }
 
  if (matchSel.el === el) {
    // Deselect
    el.classList.remove('selected');
    matchSel = null;
    return;
  }
 
  if (matchSel.type === type) {
    // Same column — switch selection
    matchSel.el.classList.remove('selected');
    matchSel = { el, termId, type };
    el.classList.add('selected');
    return;
  }
 
  // Different columns — check if match
  const isCorrect = matchSel.termId === termId;
 
  if (isCorrect) {
    matchSel.el.classList.remove('selected');
    matchSel.el.classList.add('matched');
    el.classList.add('matched');
    matchScore++;
    updateCardState(termId, 4);
    sessionRecord(true);
    el('match-score-num', matchScore);
    updateHeaderProgress();
 
    if (matchScore === matchPairs.length) {
      setTimeout(() => {
        document.getElementById('match-content').insertAdjacentHTML('afterbegin', `
          <div class="result-screen" style="padding:24px">
            <span class="result-emoji">🎉</span>
            <div class="result-score" style="color:var(--accent3)">All Matched!</div>
            <div class="result-msg">Perfect score on ${matchPairs.length} pairs.</div>
            <button class="btn btn-primary" onclick="initMatch()">Play Again</button>
          </div>`);
      }, 300);
    }
  } else {
    el.classList.add('wrong');
    matchSel.el.classList.add('wrong');
    updateCardState(termId, 1);
    sessionRecord(false);
    setTimeout(() => {
      el.classList.remove('wrong', 'selected');
      matchSel.el.classList.remove('wrong', 'selected');
    }, 700);
  }
 
  matchSel = null;
}
 
// ════════════════════════════════════════════════════════════
// 5. CONCEPT MAP (Elaborative Interrogation + Self-explanation)
// ════════════════════════════════════════════════════════════
function initCmap() {
  cmapCluster = 0;
  renderCmapTabs();
  renderCmapCluster(CLUSTERS[0]);
}
 
function renderCmapTabs() {
  const wrap = document.getElementById('cmap-tabs');
  if (!wrap) return;
  wrap.innerHTML = CLUSTERS.map((c, i) => `
    <button class="cluster-tab ${i===0?'active':''}"
      style="border-color:${c.color}44;${i===0?`background:${c.color};color:#0c0b14`:''}"
      id="ctab-${i}" onclick="switchCluster(${i})">
      ${c.title}
    </button>`).join('');
}
 
function switchCluster(i) {
  cmapCluster = i;
  document.querySelectorAll('.cluster-tab').forEach((b, j) => {
    const c = CLUSTERS[j];
    b.classList.toggle('active', j === i);
    b.style.background = j === i ? c.color : '';
    b.style.color = j === i ? '#0c0b14' : '';
  });
  renderCmapCluster(CLUSTERS[i]);
}
 
function renderCmapCluster(cluster) {
  const canvas = document.getElementById('cmap-canvas');
  if (!canvas) return;
  canvas.style.borderColor = cluster.color + '44';
 
  const terms = cluster.terms.map(id => TERM_MAP[id]).filter(Boolean);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
 
  canvas.innerHTML = `
    <div class="cmap-cluster-title" style="color:${cluster.color}">${cluster.title}</div>
    <div class="cmap-cluster-desc">${cluster.desc}</div>
    <div class="feedback hint show" style="margin-bottom:20px">
      💡 <strong>Exam tip:</strong> ${cluster.why}
    </div>
    ${terms.map((t, i) => {
      const relatedTerms = (t.related || []).slice(0, 4).map(id => TERM_MAP[id]).filter(Boolean);
      return `
        <div class="concept-node">
          <div class="node-index" style="background:${cluster.color}22;color:${cluster.color}">${letters[i]}</div>
          <div class="node-body">
            <div class="node-term">${t.term} ${t.abbr ? `<span class="node-abbr">(${t.abbr})</span>` : ''}</div>
            <div class="node-def">${t.def}</div>
            ${t.example ? `<div class="node-example">${t.example}</div>` : ''}
            ${relatedTerms.length ? `
              <div class="node-related">
                <span style="font-size:0.6rem;color:var(--text-subtle);margin-right:4px">See also:</span>
                ${relatedTerms.map(r => `<span class="related-chip" onclick="popRelated('${r.id}')">${r.term}</span>`).join('')}
              </div>` : ''}
          </div>
        </div>`;
    }).join('')}`;
}
 
function popRelated(id) {
  const t = TERM_MAP[id];
  if (!t) return;
  const ch = CHAPTER_MAP[t.chapter];
  // Inline mini popup
  const existing = document.getElementById('related-popup');
  if (existing) existing.remove();
  const popup = document.createElement('div');
  popup.id = 'related-popup';
  popup.style.cssText = `position:fixed;bottom:32px;right:32px;max-width:340px;background:var(--surface3);border:1px solid var(--border-mid);border-radius:14px;padding:18px;z-index:999;box-shadow:var(--shadow);animation:fadeUp 0.2s`;
  popup.innerHTML = `
    <div style="font-size:0.6rem;color:var(--text-muted);font-family:'Syne',sans-serif;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">${ch.label} · ${ch.title}</div>
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1rem;margin-bottom:8px">${t.term}${t.abbr?` <span style="font-weight:400;font-size:0.8rem;color:var(--text-muted)">(${t.abbr})</span>`:''}</div>
    <div style="font-family:'Lora',serif;font-style:italic;font-size:0.88rem;color:var(--text-muted);margin-bottom:8px">${t.def}</div>
    <button onclick="document.getElementById('related-popup').remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.72rem;font-family:'Syne',sans-serif">✕ Close</button>`;
  document.body.appendChild(popup);
  setTimeout(() => popup.addEventListener('click', e => { if(e.target===popup) popup.remove(); }), 100);
}
 
// ════════════════════════════════════════════════════════════
// 6. SPEED ROUND (Interleaving + Time Pressure)
// ════════════════════════════════════════════════════════════
// Science: Interleaved practice improves long-term retention
// even though it feels harder (Rohrer & Taylor, 2007).
// Time pressure forces top-of-mind recall (desirable difficulty).
 
function initSpeed() {
  resetSpeed();
}
 
function resetSpeed() {
  clearInterval(speedInterval);
  document.getElementById('speed-content').innerHTML = `
    <div class="speed-wrap">
      <div style="text-align:center;max-width:500px;margin:0 auto">
        <div style="font-size:3rem;margin-bottom:16px">⚡</div>
        <div class="section-title" style="margin-bottom:8px">Speed Round</div>
        <div style="color:var(--text-muted);font-size:0.85rem;margin-bottom:8px;font-family:'Lora',serif;font-style:italic">
          Questions from all chapters — mixed (interleaved). 30 seconds per question.
        </div>
        <div class="science-tag" style="margin:0 auto 24px">⚗️ Interleaving Effect — Rohrer & Taylor (2007)</div>
        <button class="btn btn-primary btn-lg" onclick="startSpeed()">Start Round ⚡</button>
      </div>
    </div>`;
}
 
function startSpeed() {
  speedItems = shuffle([...TERMS]); // Always interleaved (all chapters)
  speedIdx = 0; speedCorrect = 0; speedWrong = 0;
  renderSpeedQuestion();
}
 
function renderSpeedQuestion() {
  if (speedIdx >= speedItems.length || speedIdx >= 30) {
    clearInterval(speedInterval);
    renderSpeedResult();
    return;
  }
  const q = speedItems[speedIdx];
  speedTimerVal = 30;
 
  // Alternate: term→def / def→term
  const showTerm = speedIdx % 2 === 0;
  const prompt   = showTerm ? 'What does this term mean?' : 'Which term matches this definition?';
  const display  = showTerm ? (q.term + (q.abbr ? ` (${q.abbr})` : '')) : (q.def.length > 100 ? q.def.slice(0,97)+'…' : q.def);
  const correct  = showTerm ? q.def : (q.term + (q.abbr ? ` (${q.abbr})` : ''));
 
  const wrongPool = TERMS.filter(t => t.id !== q.id);
  const wrongs = shuffle(wrongPool).slice(0, 3).map(t => showTerm ? t.def : t.term + (t.abbr ? ` (${t.abbr})` : ''));
  const opts = shuffle([correct, ...wrongs]);
 
  const CIRC = 2 * Math.PI * 35;
 
  document.getElementById('speed-content').innerHTML = `
    <div class="speed-wrap">
      <!-- Timer ring -->
      <div class="speed-timer-ring-wrap">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle class="speed-timer-ring-bg"  cx="45" cy="45" r="35" fill="none" stroke-width="5"/>
          <circle class="speed-timer-ring-fill" id="speed-ring" cx="45" cy="45" r="35" fill="none"
            stroke-width="5" stroke-dasharray="${CIRC}" stroke-dashoffset="0"/>
        </svg>
        <div class="speed-timer-num" id="speed-time">${speedTimerVal}</div>
      </div>
 
      <div class="speed-card">
        <div class="speed-prompt">${prompt}</div>
        <div class="speed-term">${display}</div>
        <div class="speed-options" id="speed-opts">
          ${opts.map(o => `
            <button class="speed-opt" onclick="answerSpeed(this,'${esc(o)}','${esc(correct)}')" data-opt="${esc(o)}">
              ${o.length > 80 ? o.slice(0,77)+'…' : o}
            </button>`).join('')}
        </div>
      </div>
 
      <div class="speed-scoreboard">
        <div class="speed-score-item">
          <div class="speed-score-num" id="sp-correct" style="color:var(--accent3)">${speedCorrect}</div>
          <div class="speed-score-lbl">Correct</div>
        </div>
        <div class="speed-score-item">
          <div class="speed-score-num" id="sp-wrong" style="color:var(--accent)">${speedWrong}</div>
          <div class="speed-score-lbl">Wrong</div>
        </div>
        <div class="speed-score-item">
          <div class="speed-score-num">${speedIdx + 1}/30</div>
          <div class="speed-score-lbl">Question</div>
        </div>
      </div>
    </div>`;
 
  clearInterval(speedInterval);
  speedInterval = setInterval(tickSpeed, 1000);
}
 
function tickSpeed() {
  speedTimerVal--;
  const timeEl = document.getElementById('speed-time');
  const ringEl = document.getElementById('speed-ring');
  if (!timeEl) { clearInterval(speedInterval); return; }
 
  timeEl.textContent = speedTimerVal;
  timeEl.style.color = speedTimerVal <= 10 ? 'var(--accent)' : 'var(--text)';
 
  const CIRC = 2 * Math.PI * 35;
  if (ringEl) {
    ringEl.style.strokeDashoffset = CIRC - (CIRC * speedTimerVal / 30);
    ringEl.style.stroke = speedTimerVal <= 10 ? 'var(--accent)' : 'var(--accent3)';
  }
 
  if (speedTimerVal <= 0) {
    clearInterval(speedInterval);
    // Time's up — count as wrong
    const q = speedItems[speedIdx];
    speedWrong++;
    updateCardState(q.id, 1);
    sessionRecord(false);
    document.querySelectorAll('.speed-opt').forEach(b => b.disabled = true);
    setTimeout(() => { speedIdx++; renderSpeedQuestion(); }, 600);
  }
}
 
function answerSpeed(btn, chosen, correct) {
  clearInterval(speedInterval);
  document.querySelectorAll('.speed-opt').forEach(b => b.disabled = true);
  const isCorrect = chosen === correct;
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    document.querySelectorAll('.speed-opt').forEach(b => {
      if (b.dataset.opt === correct) b.classList.add('correct');
    });
  }
 
  const q = speedItems[speedIdx];
  if (isCorrect) { speedCorrect++; updateCardState(q.id, 4); sessionRecord(true); }
  else { speedWrong++; updateCardState(q.id, 1); sessionRecord(false); }
  updateHeaderProgress();
  el('sp-correct', speedCorrect);
  el('sp-wrong', speedWrong);
 
  setTimeout(() => { speedIdx++; renderSpeedQuestion(); }, 750);
}
 
function renderSpeedResult() {
  const total = speedCorrect + speedWrong;
  const pct = total > 0 ? Math.round(speedCorrect / total * 100) : 0;
  document.getElementById('speed-content').innerHTML = `
    <div class="speed-wrap">
      <div class="result-screen">
        <span class="result-emoji">${pct>=80?'🏆':pct>=60?'🎯':'📚'}</span>
        <div class="result-score">${speedCorrect} / ${total}</div>
        <div class="result-msg">${pct}% accuracy under time pressure.</div>
        <div class="result-breakdown">
          <div class="rb-item"><div class="rb-num" style="color:var(--accent3)">${speedCorrect}</div><div class="rb-lbl">Correct</div></div>
          <div class="rb-item"><div class="rb-num" style="color:var(--accent)">${speedWrong}</div><div class="rb-lbl">Missed</div></div>
          <div class="rb-item"><div class="rb-num" style="color:var(--accent2)">${pct}%</div><div class="rb-lbl">Score</div></div>
        </div>
        <button class="btn btn-primary btn-lg" onclick="startSpeed()">Play Again ⚡</button>
        <br><br>
        <button class="btn btn-ghost btn-sm" onclick="resetSpeed()">← Back</button>
      </div>
    </div>`;
}
 
// ════════════════════════════════════════════════════════════
// 7. AI TUTOR (Self-Explanation Effect — Chi et al., 1994)
// ════════════════════════════════════════════════════════════
// Science: Explaining concepts aloud (or asking an agent to explain)
// forces learners to detect gaps in their own knowledge, driving
// deeper encoding. Prompting for examples + connections amplifies this.
 
const TUTOR_SYSTEM = `You are an expert SLA (Second Language Acquisition) tutor helping a linguistics student prepare for their final exam. The course textbook is "Introducing Second Language Acquisition" by Kirsten M. Hummel (2nd ed., Wiley).
 
Chapters covered:
Ch2: FLA foundations — behaviorism, nativism, interactionism, connectionism, emergentism, morphemes, babbling, MLU, overextension, overgeneralization
Ch3: Bilingualism — additive/subtractive bilingualism, immersion, heritage language, dual-language education, translanguaging
Ch4: SLA Theories — Krashen's Monitor Model (5 hypotheses), Contrastive Analysis Hypothesis, Error Analysis, interlanguage (Selinker), cross-linguistic influence, sociocultural theory (Vygotsky), ZPD, scaffolding, Universal Grammar, parameters
Ch5: Cognitive approaches — information-processing, automatic vs. controlled processing, Noticing Hypothesis (Schmidt 1995), Comprehensible Output Hypothesis (Swain 1985), Interaction Hypothesis (Long 1983), Input Processing (VanPatten), declarative/procedural knowledge, intake, skill acquisition theory
Ch6: Teaching methods — Grammar Translation, Direct Method, Audiolingual Method, CLT, TPR, Suggestopedia, TBLT, focus on form vs. forms, input enhancement, input flooding, Processing Instruction, corrective feedback, recasts, uptake, postmethod perspective, CALL, CMC
Ch7: L2 development — interlanguage, fossilization, developmental sequences, pragmatics, interlanguage pragmatics, markedness, MDH, Multidimensional Model, Processability Theory, Teachability Hypothesis, Speech Learning Model, cognates/false friends
Ch8: Age & Critical Period — CPH (Lenneberg 1967), sensitive period, lateralization, age of arrival, length of residence, feral children, imprinting
Ch9: Individual differences — aptitude (MLAT), Gardner's motivation construct (AMTB), integrative vs. instrumental orientation, BICS vs. CALP (Cummins), cognitive/learning styles, field dependence/independence, working memory, phonological STM
Ch10: Bilingual cognition — BFLA, bilingual lexical representation, code-switching, executive control, Stroop experiment, semantic priming, cognitive reserve
 
Teaching style:
- Be concise but conceptually rich (2–4 paragraphs per response)
- Always connect to at least one concrete example from real language learning
- When comparing concepts, use a brief contrast (e.g., "Unlike X, Y...")
- End complex answers with one exam-style question to prompt self-testing
- If asked something outside SLA/linguistics, gently redirect: "I'm specialized in SLA — let's explore that instead."
- Use plain language — avoid jargon you haven't defined
- Markdown is supported: use **bold** for key terms, *italics* for examples`;
 
const SUGGESTIONS = [
  "Explain Krashen's 5 hypotheses and how they connect",
  "What's the difference between BICS and CALP?",
  "Compare CLT vs. Grammar Translation Method",
  "How does the Critical Period Hypothesis work?",
  "What is interlanguage and why does fossilization happen?",
  "Explain Vygotsky's ZPD in the context of SLA",
  "What's the difference between integrative and instrumental orientation?",
  "How does input processing (VanPatten) differ from Krashen's input hypothesis?",
  "What evidence supports or challenges the CPH?",
  "How do additive and subtractive bilingualism differ? Give examples.",
];
 
function initTutor() {
  if (chatHistory.length > 0) return; // Keep existing conversation
  const wrap = document.getElementById('tutor-msgs');
  if (!wrap) return;
  if (wrap.children.length <= 1) {
    addTutorMsg('ai', `Hi! I'm your SLA study assistant — ask me anything about your course material. I know all nine chapters cold.\n\nTry a concept you're fuzzy on, or pick one of the suggestions below. 👇`);
  }
}
 
function addTutorMsg(role, text) {
  const wrap = document.getElementById('tutor-msgs');
  if (!wrap) return;
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = `
    <div class="msg-av">${role === 'ai' ? 'AI' : 'U'}</div>
    <div class="msg-bubble">${mdToHtml(text)}</div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}
 
function mdToHtml(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}
 
async function sendTutor() {
  const input = document.getElementById('tutor-input');
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;
 
  addTutorMsg('user', msg);
  input.value = '';
  chatHistory.push({ role: 'user', content: msg });
 
  const sendBtn = document.getElementById('tutor-send');
  if (sendBtn) sendBtn.disabled = true;
 
  // Typing indicator
  const wrap = document.getElementById('tutor-msgs');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'msg ai'; typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = `<div class="msg-av">AI</div><div class="msg-bubble"><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  if (wrap) { wrap.appendChild(typingDiv); wrap.scrollTop = wrap.scrollHeight; }
 
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: TUTOR_SYSTEM,
        messages: chatHistory
      })
    });
    const data = await res.json();
    const reply = data.content?.map(c => c.text || '').join('') || 'Sorry, I had trouble responding. Please try again.';
    chatHistory.push({ role: 'assistant', content: reply });
    document.getElementById('typing-indicator')?.remove();
    addTutorMsg('ai', reply);
  } catch (err) {
    document.getElementById('typing-indicator')?.remove();
    addTutorMsg('ai', 'Connection error. Please check your internet and try again.');
  }
 
  if (sendBtn) sendBtn.disabled = false;
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
}
 
function sendSuggestion(text) {
  const input = document.getElementById('tutor-input');
  if (input) { input.value = text; sendTutor(); }
}
 
// ─── UTILITIES ────────────────────────────────────────────
function el(id, val) {
  const e = document.getElementById(id);
  if (e) e.textContent = val;
}
 
function esc(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}
