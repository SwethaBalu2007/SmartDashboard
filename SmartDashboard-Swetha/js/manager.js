// ====== QUESTION MANAGER LOGIC ======
(function () {
    // Auth guard
    if (!AUTH.requireRole('manager')) return;

    // ---- Sidebar User Info ----
    function updateSidebar() {
        const user = AUTH.getSession();
        if (user.fullName) {
            document.getElementById('user-fullname').textContent = user.fullName;
            document.getElementById('user-email').textContent = user.email;
            const avatar = document.getElementById('user-avatar');
            if (avatar) avatar.textContent = user.fullName[0].toUpperCase();
        }
    }

    // ---- Sample Data ----
    let EXAMS = [
        { id: 'E001', title: 'Data Structures Final', subject: 'CS301', duration: 60, desc: 'Final examination on data structures and algorithms.' },
        { id: 'E002', title: 'Algorithms Midterm', subject: 'CS302', duration: 45, desc: 'Midterm covering algorithmic analysis and design.' },
        { id: 'E003', title: 'Database Design', subject: 'CS303', duration: 30, desc: 'Assessment on relational database design principles.' },
        { id: 'E004', title: 'Operating Systems', subject: 'CS304', duration: 90, desc: 'Comprehensive OS exam covering scheduling, memory, and I/O.' },
    ];

    let QUESTIONS = [
        { id: 'Q001', examId: 'E001', text: 'What is the time complexity of Binary Search?', opts: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 1, difficulty: 'Medium', points: 2 },
        { id: 'Q002', examId: 'E001', text: 'Which data structure uses LIFO principle?', opts: ['Queue', 'Stack', 'Array', 'Linked List'], correct: 1, difficulty: 'Easy', points: 1 },
        { id: 'Q003', examId: 'E001', text: 'What is the worst-case for Bubble Sort?', opts: ['O(n)', 'O(log n)', 'O(n²)', 'O(n log n)'], correct: 2, difficulty: 'Medium', points: 2 },
        { id: 'Q004', examId: 'E002', text: 'P vs NP problem is?', opts: ['Solved', 'Unsolved', 'Irrelevant', 'Trivial'], correct: 1, difficulty: 'Hard', points: 3 },
        { id: 'Q005', examId: 'E002', text: 'Dynamic programming uses?', opts: ['Recursion only', 'Memoization', 'Greedy choice', 'Backtracking'], correct: 1, difficulty: 'Medium', points: 2 },
    ];

    let editingExamId = null, editingQId = null;

    // ---- Navigation ----
    window.showSection = function (sec) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
        const navBtn = document.querySelector(`[onclick="showSection('${sec}')"]`);
        if (navBtn) navBtn.classList.add('active');
        const secEl = document.getElementById('sec-' + sec);
        if (secEl) secEl.classList.add('active');

        const titles = { exams: ['Manage Exams', 'Creation and editing center'], questions: ['Question Bank', 'Full repository'], upload: ['Bulk Upload', 'Import question sets'], stats: ['Statistics', 'Analytics overview'] };
        if (titles[sec]) {
            document.getElementById('page-title').textContent = titles[sec][0];
            document.getElementById('page-subtitle').textContent = titles[sec][1];
        }
        if (sec === 'questions') refreshQExamFilter();
        if (sec === 'stats') renderStats();
    };

    // ---- EXAM CRUD ----
    function renderExams() {
        const el = document.getElementById('manager-exam-list');
        if (!el) return;
        el.innerHTML = `<div class="table-wrapper"><table><thead><tr><th>Title</th><th>Subject</th><th>Duration</th><th>Questions</th><th>Actions</th></tr></thead><tbody>
      ${EXAMS.map(e => `<tr><td><strong>${e.title}</strong></td><td><span class="badge badge-purple">${e.subject}</span></td><td>${e.duration}m</td><td>${QUESTIONS.filter(q => q.examId === e.id).length}</td><td><button class="btn btn-secondary btn-sm" onclick="openExamModal('${e.id}')">Edit</button></td></tr>`).join('')}
      </tbody></table></div>`;
    }

    window.openExamModal = (examId) => {
        editingExamId = examId;
        const exam = examId ? EXAMS.find(e => e.id === examId) : null;
        document.getElementById('exam-title-input').value = exam?.title || '';
        document.getElementById('exam-subject-input').value = exam?.subject || '';
        document.getElementById('exam-modal').classList.remove('hidden');
    };
    window.closeExamModal = () => document.getElementById('exam-modal').classList.add('hidden');
    window.saveExam = () => {
        const title = document.getElementById('exam-title-input').value;
        if (!title) return;
        if (editingExamId) {
            const idx = EXAMS.findIndex(e => e.id === editingExamId);
            EXAMS[idx].title = title;
        } else {
            EXAMS.push({ id: 'E' + Date.now(), title, subject: 'NEW', duration: 60 });
        }
        closeExamModal(); renderExams();
    };

    // ---- QUESTION CRUD ----
    function renderQuestions(filterExamId = '') {
        const el = document.getElementById('question-bank-list');
        if (!el) return;
        const qset = filterExamId ? QUESTIONS.filter(q => q.examId === filterExamId) : QUESTIONS;
        el.innerHTML = `<div class="table-wrapper"><table><thead><tr><th>Question</th><th>Difficulty</th><th>Points</th></tr></thead><tbody>
      ${qset.map(q => `<tr><td>${q.text}</td><td>${q.difficulty}</td><td>${q.points}</td></tr>`).join('')}
      </tbody></table></div>`;
    }
    window.filterQuestions = (id) => renderQuestions(id);
    function refreshQExamFilter() {
        const sel = document.querySelector('select[onchange="filterQuestions(this.value)"]');
        if (sel) sel.innerHTML = '<option value="">All Exams</option>' + EXAMS.map(e => `<option value="${e.id}">${e.title}</option>`).join('');
    }

    function renderStats() {
        const grid = document.getElementById('mgr-stats-grid');
        if (grid) grid.innerHTML = `<div class="stat-card purple-glow"><div class="stat-label">Total Exams</div><div class="stat-value">${EXAMS.length}</div></div><div class="stat-card green-glow"><div class="stat-label">Total Questions</div><div class="stat-value">${QUESTIONS.length}</div></div>`;
    }

    window.showToast = (type, title, msg) => {
        const container = document.getElementById('toast-container');
        if (container) {
            const t = document.createElement('div'); t.className = 'toast';
            t.innerHTML = `<div class="toast-title">${title}</div><div class="toast-msg">${msg}</div>`;
            container.appendChild(t); setTimeout(() => t.remove(), 3000);
        }
    };

    document.addEventListener('DOMContentLoaded', () => { updateSidebar(); renderExams(); });
})();
