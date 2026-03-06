// ====== STUDENT DASHBOARD LOGIC ======
(function () {
  // Auth guard
  if (!AUTH.requireRole('student')) return;

  // ---- Sidebar User Info ----
  function updateSidebar() {
    const user = AUTH.getSession();
    if (user.fullName) {
      document.getElementById('user-fullname').textContent = user.fullName;
      document.getElementById('user-email').textContent = user.email;
      document.getElementById('user-avatar').textContent = user.fullName[0].toUpperCase();

      // Also update profile section if it exists
      const profName = document.getElementById('prof-name');
      const profId = document.getElementById('prof-id');
      const profAvatar = document.getElementById('prof-avatar');
      if (profName) profName.textContent = user.fullName;
      if (profId) profId.textContent = 'ID: ' + (user.userId || 'student123');
      if (profAvatar) profAvatar.textContent = user.fullName[0].toUpperCase();
    }
  }

  // ---- Sample Data ----
  const AVAILABLE_EXAMS = [
    { id: 'E001', title: 'Data Structures Final', subject: 'CS301', duration: 60, questions: 10, difficulty: 'Medium', icon: '🏗️', available: true },
    { id: 'E002', title: 'Algorithms Midterm', subject: 'CS302', duration: 45, questions: 8, difficulty: 'Hard', icon: '⚡', available: true },
    { id: 'E003', title: 'Database Design', subject: 'CS303', duration: 30, questions: 6, difficulty: 'Easy', icon: '🗄️', available: false },
    { id: 'E004', title: 'Operating Systems', subject: 'CS304', duration: 90, questions: 12, difficulty: 'Medium', icon: '💻', available: false },
  ];

  const PAST_RESULTS = [
    { title: 'Web Technologies', subject: 'CS201', score: 82, date: 'Feb 28, 2024', grade: 'A' },
    { title: 'Computer Networks', subject: 'CS202', score: 74, date: 'Feb 15, 2024', grade: 'B+' },
    { title: 'Discrete Mathematics', subject: 'MATH201', score: 78, date: 'Feb 01, 2024', grade: 'A-' },
  ];

  const QUESTION_BANK = {
    E001: [
      { q: 'What is the time complexity of Binary Search?', opts: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 1 },
      { q: 'Which data structure uses LIFO principle?', opts: ['Queue', 'Stack', 'Array', 'Linked List'], correct: 1 },
      { q: 'What is the worst-case for Bubble Sort?', opts: ['O(n)', 'O(log n)', 'O(n²)', 'O(n log n)'], correct: 2 },
      { q: 'Which tree is always balanced?', opts: ['BST', 'AVL Tree', 'Binary Tree', 'B-Tree'], correct: 1 },
      { q: 'Inorder traversal of BST gives:', opts: ['Random order', 'Reverse order', 'Sorted order', 'Level order'], correct: 2 },
      { q: 'Queue uses which principle?', opts: ['LIFO', 'FIFO', 'Random', 'FILO'], correct: 1 },
      { q: 'Height of a complete binary tree with n nodes?', opts: ['n', 'n-1', '⌊log₂n⌋', '2n'], correct: 2 },
      { q: 'Quicksort average case complexity?', opts: ['O(n²)', 'O(n)', 'O(n log n)', 'O(log n)'], correct: 2 },
      { q: 'Which structure is best for Dijkstra\'s?', opts: ['Stack', 'Array', 'Priority Queue', 'Deque'], correct: 2 },
      { q: 'In a Min-Heap, root contains?', opts: ['Maximum value', 'Median', 'Minimum value', 'Random value'], correct: 2 },
    ],
    E002: [
      { q: 'Which algorithm finds shortest path?', opts: ['Prim\'s', 'Kruskal\'s', 'Dijkstra\'s', 'Bellman-Ford'], correct: 2 },
      { q: 'P vs NP problem is:', opts: ['Solved', 'Unsolved', 'Irrelevant', 'Trivial'], correct: 1 },
      { q: 'Dynamic programming uses:', opts: ['Recursion only', 'Memoization', 'Greedy choice', 'Backtracking'], correct: 1 },
      { q: 'FFT has time complexity:', opts: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'], correct: 1 },
      { q: 'Greedy algorithm gives:', opts: ['Always optimal', 'Locally optimal', 'Never optimal', 'Global optimal always'], correct: 1 },
      { q: 'Floyd-Warshall finds:', opts: ['MST', 'Single source shortest', 'All pairs shortest', 'Topological sort'], correct: 2 },
      { q: 'Which is NOT a graph algorithm?', opts: ['BFS', 'DFS', 'Merge Sort', 'Prim\'s'], correct: 2 },
      { q: 'Amortized analysis is used for:', opts: ['Single operation', 'Average over sequence', 'Worst case', 'Best case'], correct: 1 },
    ]
  };

  let currentExam = null;
  let currentQ = 0;
  let answers = {};
  let timerInterval = null;
  let timeLeft = 0;
  let alertCount = 0;
  let isOnline = true;

  // ---- Navigation ----
  window.showSection = function (sec) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    const navEl = document.getElementById('nav-' + sec);
    if (navEl) navEl.classList.add('active');
    const secEl = document.getElementById('sec-' + sec);
    if (secEl) secEl.classList.add('active');

    const titles = {
      exams: ['Available Exams', 'Select an exam to begin'],
      'exam-interface': ['Exam in Progress', 'Answer all questions and submit'],
      results: ['My Results', 'Your completed exam history'],
      profile: ['My Profile', 'Your student information'],
    };
    if (titles[sec]) {
      document.getElementById('page-title').textContent = titles[sec][0];
      document.getElementById('page-subtitle').textContent = titles[sec][1];
    }
  };

  // ---- Clock ----
  setInterval(() => {
    const clk = document.getElementById('live-clock');
    if (clk) clk.textContent = new Date().toLocaleTimeString('en-IN', { hour12: true });
  }, 1000);

  // ---- Connectivity Simulation ----
  function simulateConnectivity() {
    const statuses = ['online', 'online', 'online', 'online', 'unstable', 'online'];
    const st = statuses[Math.floor(Math.random() * statuses.length)];
    const dot = document.getElementById('conn-dot');
    const lbl = document.getElementById('conn-label');
    const badge = document.getElementById('conn-badge');
    if (!dot || !lbl || !badge) return;

    if (st === 'unstable') {
      isOnline = true;
      dot.className = 'connectivity-dot conn-unstable';
      lbl.textContent = 'Unstable';
      badge.className = 'badge badge-amber';
      badge.innerHTML = '<span class="badge-dot"></span>Unstable';
      showToast('warning', 'Connection Unstable', 'Your internet connection is weak. Exam progress is saved.');
    } else {
      isOnline = true;
      dot.className = 'connectivity-dot conn-online';
      lbl.textContent = 'Connected';
      badge.className = 'badge badge-green';
      badge.innerHTML = '<span class="badge-dot badge-dot-pulse"></span>Online';
    }
  }
  setInterval(simulateConnectivity, 30000);

  // ---- Suspicious Activity Simulation ----
  document.addEventListener('visibilitychange', () => {
    if (currentExam && document.hidden) {
      alertCount++;
      showToast('error', 'Alert Sent', 'Tab switch detected! This has been reported to the proctor.');
    }
  });

  // ---- Render Exam Cards ----
  function renderExams() {
    const grid = document.getElementById('exam-cards');
    if (!grid) return;
    grid.innerHTML = AVAILABLE_EXAMS.map(e => `
      <div class="exam-card">
        <div class="exam-card-header">
          <div><div class="exam-card-title">${e.title}</div><div class="exam-card-subject">${e.subject}</div></div>
          <div class="exam-card-icon">${e.icon}</div>
        </div>
        <div class="exam-card-meta">
          <div class="exam-meta-item">⏱️ ${e.duration} m</div><div class="exam-meta-item">❓ ${e.questions} Q</div>
          <div class="exam-meta-item"><span class="badge ${e.difficulty === 'Easy' ? 'badge-green' : e.difficulty === 'Hard' ? 'badge-red' : 'badge-amber'}">${e.difficulty}</span></div>
        </div>
        ${e.available ? `<button class="btn btn-primary" onclick="startExam('${e.id}')" style="width:100%;">🚀 Start Exam</button>` : `<button class="btn btn-secondary" style="width:100%;opacity:0.5;cursor:not-allowed;" disabled>🔒 Locked</button>`}
      </div>
    `).join('');
  }

  // ---- Start Exam ----
  window.startExam = function (examId) {
    const exam = AVAILABLE_EXAMS.find(e => e.id === examId);
    if (!exam || !QUESTION_BANK[examId]) { showToast('error', 'Unavailable', 'No questions found.'); return; }
    currentExam = exam; currentQ = 0; answers = {}; timeLeft = exam.duration * 60; alertCount = 0;
    showSection('exam-interface'); renderExamInterface(); startTimer();
    showToast('info', 'Exam Started', `Good luck! You have ${exam.duration} minutes.`);
  };

  function renderExamInterface() {
    const qs = QUESTION_BANK[currentExam.id];
    const container = document.getElementById('exam-interface-content');
    if (!container) return;
    container.innerHTML = `
      <div class="exam-wrapper">
        <div class="exam-top-bar">
          <div><div style="font-size:11px;font-weight:700;color:var(--text-muted);opacity:0.7;">IN PROGRESS</div><div style="font-size:16px;font-weight:700;">${currentExam.title}</div></div>
          <div style="text-align:center;"><div id="exam-timer" class="exam-timer">--:--</div></div>
          <div style="text-align:right;"><button class="btn btn-primary btn-sm" style="background:#ef4444;" onclick="openSubmitModal()">🏁 Finish</button></div>
        </div>
        <div class="card" style="margin-bottom:16px;padding:12px;"><div class="q-nav">${qs.map((_, i) => `<button class="q-nav-btn ${i === 0 ? 'current' : ''}" id="qnav-${i}" onclick="goToQuestion(${i})">${i + 1}</button>`).join('')}</div></div>
        <div id="question-area"></div>
        <div style="display:flex;justify-content:space-between;margin-top:20px;">
          <button class="btn btn-secondary" id="prev-btn" onclick="prevQuestion()">← Back</button>
          <span style="font-size:13px;color:var(--text-muted);align-self:center;" id="q-counter"></span>
          <button class="btn btn-primary" id="next-btn" onclick="nextQuestion()">Next →</button>
        </div>
      </div>
    `;
    renderQuestion();
  }

  function renderQuestion() {
    const qs = QUESTION_BANK[currentExam.id];
    const q = qs[currentQ];
    const area = document.getElementById('question-area');
    if (!area) return;
    area.innerHTML = `<div class="question-card"><div class="question-text">${q.q}</div><div class="options-grid">${q.opts.map((opt, i) => `<button class="option-btn ${answers[currentQ] === i ? 'selected' : ''}" onclick="selectAnswer(${i})"><span class="option-label">${['A', 'B', 'C', 'D'][i]}</span><span>${opt}</span></button>`).join('')}</div></div>`;
    document.querySelectorAll('.q-nav-btn').forEach((b, i) => { b.classList.remove('current'); b.classList.toggle('answered', answers[i] !== undefined); if (i === currentQ) b.classList.add('current'); });
    const cnt = document.getElementById('q-counter'); if (cnt) cnt.textContent = `Q${currentQ + 1} of ${qs.length}`;
    const prev = document.getElementById('prev-btn'), next = document.getElementById('next-btn');
    if (prev) prev.disabled = currentQ === 0; if (next) next.textContent = currentQ === qs.length - 1 ? 'Review →' : 'Next →';
  }

  window.selectAnswer = (opt) => { answers[currentQ] = opt; renderQuestion(); };
  window.goToQuestion = (i) => { currentQ = i; renderQuestion(); };
  window.prevQuestion = () => { if (currentQ > 0) { currentQ--; renderQuestion(); } };
  window.nextQuestion = () => { if (currentQ < QUESTION_BANK[currentExam.id].length - 1) { currentQ++; renderQuestion(); } else openSubmitModal(); };

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      const el = document.getElementById('exam-timer');
      if (el) {
        const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        if (timeLeft <= 60) el.style.color = '#ef4444';
      }
      if (timeLeft <= 0) { clearInterval(timerInterval); confirmSubmit(); }
    }, 1000);
  }

  window.openSubmitModal = () => {
    const modal = document.getElementById('submit-modal');
    if (modal) modal.classList.remove('hidden');
  };
  window.closeSubmitModal = () => { document.getElementById('submit-modal').classList.add('hidden'); };
  window.confirmSubmit = () => {
    clearInterval(timerInterval);
    const qs = QUESTION_BANK[currentExam.id];
    let correct = 0;
    qs.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
    const score = Math.round((correct / qs.length) * 100);
    document.getElementById('score-display').textContent = `${score}% Score`;
    document.getElementById('submit-modal').classList.add('hidden');
    document.getElementById('success-modal').classList.remove('hidden');
  };
  window.closeSuccessModal = () => {
    document.getElementById('success-modal').classList.add('hidden');
    currentExam = null; showSection('exams');
  };

  function renderResults() {
    const el = document.getElementById('results-content');
    if (!el) return;
    el.innerHTML = PAST_RESULTS.map(r => `<div class="results-card"><div style="flex:1;"><div style="font-weight:700;">${r.title}</div><div style="font-size:12px;color:var(--text-muted);">${r.date}</div></div><div style="text-align:right;"><div style="font-size:20px;font-weight:800;color:var(--accent-cyan);">${r.score}%</div><div style="font-size:11px;font-weight:700;">GRADE ${r.grade}</div></div></div>`).join('');
  }

  window.showToast = (type, title, msg) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div'); toast.className = 'toast';
    toast.innerHTML = `<div class="toast-content"><div class="toast-title">${title}</div><div class="toast-msg">${msg}</div></div>`;
    container.appendChild(toast); setTimeout(() => toast.remove(), 4000);
  };

  function init() { updateSidebar(); renderExams(); renderResults(); }
  document.addEventListener('DOMContentLoaded', init);
})();
