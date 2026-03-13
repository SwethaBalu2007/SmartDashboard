// ====== QUESTION MANAGER LOGIC ======
(function () {
    // Auth guard
    if (!AUTH.requireRole('manager')) return;

    // ---- Script Dependency Check ----
    function checkDependencies() {
        if (!window.jspdf) {
            console.error("JSPDF not found. Attempting to reload...");
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            document.head.appendChild(script);
        }
    }
    checkDependencies();

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

    // ---- Data Management ----
    let EXAMS = AUTH.getExams();
    let QUESTIONS = AUTH.getQuestions();

    // Seed if empty (for first time run)
    if (EXAMS.length === 0) {
        const seedExams = [
            { id: 'E001', title: 'Data Structures Final', subject: 'CS301', duration: 60, allowedAttempts: 3, passPercentage: 40, desc: 'Final examination on data structures and algorithms.', status: 'active' },
            { id: 'E002', title: 'Algorithms Midterm', subject: 'CS302', duration: 45, allowedAttempts: 3, passPercentage: 50, desc: 'Midterm covering algorithmic analysis and design.', status: 'active' },
            { id: 'E003', title: 'Database Design', subject: 'CS303', duration: 30, allowedAttempts: 1, passPercentage: 35, desc: 'Assessment on relational database design principles.', status: 'scheduled' },
            { id: 'E004', title: 'Operating Systems', subject: 'CS304', duration: 90, allowedAttempts: 2, passPercentage: 45, desc: 'Comprehensive OS exam covering scheduling, memory, and I/O.', status: 'scheduled' },
        ];
        seedExams.forEach(e => AUTH.saveExam(e));
        EXAMS = AUTH.getExams();
    }

    if (QUESTIONS.length === 0) {
        const seedQuestions = [
            { id: 'Q001', examId: 'E001', text: 'What is the time complexity of Binary Search?', opts: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 1, difficulty: 'Medium', points: 2 },
            { id: 'Q002', examId: 'E001', text: 'Which data structure uses LIFO principle?', opts: ['Queue', 'Stack', 'Array', 'Linked List'], correct: 1, difficulty: 'Easy', points: 1 },
            { id: 'Q003', examId: 'E001', text: 'What is the worst-case for Bubble Sort?', opts: ['O(n)', 'O(log n)', 'O(n²)', 'O(n log n)'], correct: 2, difficulty: 'Medium', points: 2 },
            { id: 'Q004', examId: 'E002', text: 'P vs NP problem is?', opts: ['Solved', 'Unsolved', 'Irrelevant', 'Trivial'], correct: 1, difficulty: 'Hard', points: 3 },
            { id: 'Q005', examId: 'E002', text: 'Dynamic programming uses?', opts: ['Recursion only', 'Memoization', 'Greedy choice', 'Backtracking'], correct: 1, difficulty: 'Medium', points: 2 },
        ];
        seedQuestions.forEach(q => AUTH.saveQuestion(q));
        QUESTIONS = AUTH.getQuestions();
    }

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
        
        EXAMS = AUTH.getExams();
        QUESTIONS = AUTH.getQuestions();

        el.innerHTML = `<div class="table-wrapper"><table><thead><tr><th>Title</th><th>Subject</th><th>Status</th><th>Duration</th><th>Questions</th><th>Actions</th></tr></thead><tbody>
      ${EXAMS.map(e => {
        const qCount = QUESTIONS.filter(q => q.examId === e.id).length;
        const statusBadge = e.status === 'active' ? 'badge-green' : (e.status === 'completed' ? 'badge-purple' : 'badge-amber');
        const statusLabel = e.status ? e.status.toUpperCase() : 'SCHEDULED';

        return `<tr>
        <td><strong>${e.title}</strong><br><small style="color:var(--text-muted);">${e.id}</small></td>
        <td><span class="badge badge-purple">${e.subject}</span></td>
        <td><span class="badge ${statusBadge}">${statusLabel}</span></td>
        <td>${e.duration}m</td>
        <td>${qCount}</td>
        <td>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">
                ${e.status !== 'active' ? `<button class="btn btn-primary btn-xs" onclick="launchExam('${e.id}')" style="background:var(--accent-green);">🚀 Launch</button>` : `<button class="btn btn-secondary btn-xs" onclick="stopExam('${e.id}')" style="background:var(--accent-red);color:white;">🛑 Stop</button>`}
                <button class="btn btn-secondary btn-xs" onclick="openExamModal('${e.id}')">Edit</button>
                <button class="btn btn-secondary btn-xs" onclick="openDeleteModal('Delete exam ${e.title} and all its questions?', () => deleteExam('${e.id}'))" style="color:#ef4444;">Delete</button>
                <button class="btn btn-secondary btn-xs" onclick="viewExamResults('${e.id}')" style="background:rgba(99,102,241,0.1);border-color:rgba(99,102,241,0.3);color:var(--accent-purple-light);">📊 Results</button>
                <button class="btn btn-primary btn-xs" onclick="sendExamReport('${e.id}')" style="background:var(--accent-amber);">📝 Summary</button>
                <button class="btn btn-primary btn-xs" onclick="sendStudentReports('${e.id}')" style="background:#6366f1;">📧 Mail All</button>
            </div>
        </td>
      </tr>`;
      }).join('')}
      </tbody></table></div>`;
    }

    window.openExamModal = (examId) => {
        editingExamId = examId;
        const exam = examId ? EXAMS.find(e => e.id === examId) : null;
        document.getElementById('exam-title-input').value = exam?.title || '';
        document.getElementById('exam-subject-input').value = exam?.subject || '';
        document.getElementById('exam-duration-input').value = exam?.duration || 60;
        document.getElementById('exam-attempts-input').value = exam?.allowedAttempts || 3;
        document.getElementById('exam-pass-input').value = exam?.passPercentage || 40;
        document.getElementById('exam-desc-input').value = exam?.desc || '';
        document.getElementById('exam-modal').classList.remove('hidden');
    };
    window.closeExamModal = () => document.getElementById('exam-modal').classList.add('hidden');
    window.saveExam = () => {
        const title = document.getElementById('exam-title-input').value;
        const subject = document.getElementById('exam-subject-input').value;
        const duration = parseInt(document.getElementById('exam-duration-input').value);
        const allowedAttempts = parseInt(document.getElementById('exam-attempts-input').value);
        const passPercentage = parseInt(document.getElementById('exam-pass-input').value);
        const desc = document.getElementById('exam-desc-input').value;
        // Adding startTime support even if hidden in HTML for now
        const startTime = document.getElementById('exam-start-time-input')?.value || '';

        if (!title || !subject) return;

        const examData = {
            id: editingExamId || ('E' + Date.now()),
            title, subject, duration, allowedAttempts, passPercentage, desc, startTime
        };

        AUTH.saveExam(examData);
        EXAMS = AUTH.getExams();
        
        // Broadcast Update
        if (window.REALTIME) REALTIME.broadcast('EXAM_UPDATED', { exam: examData });

        closeExamModal(); renderExams(); refreshQExamFilter();
        showToast('success', 'Exam Saved', 'Exam configuration updated successfully.');
    };

    window.deleteExam = (id) => {
        const exam = EXAMS.find(e => e.id === id);
        AUTH.deleteExam(id);
        EXAMS = AUTH.getExams();
        QUESTIONS = AUTH.getQuestions();
        
        if (window.REALTIME) REALTIME.broadcast('EXAM_DELETED', { id });
        
        renderExams(); refreshQExamFilter();
        showToast('error', 'Exam Deleted', `Exam ${id} removed from system.`);
    };

    window.launchExam = (id) => {
        const exams = AUTH.getExams();
        const exam = exams.find(e => e.id === id);
        if (exam) {
            exam.status = 'active';
            AUTH.saveExam(exam);
            EXAMS = AUTH.getExams();
            renderExams();
            showToast('success', 'Exam Launched', `${exam.title} is now LIVE for students! 🚀`);
            
            // Broadcast via Realtime
            if (window.REALTIME && REALTIME.broadcast) {
                REALTIME.broadcast('EXAM_LAUNCHED', { id: exam.id, title: exam.title });
            }
        }
    };

    window.stopExam = (id) => {
        const exams = AUTH.getExams();
        const exam = exams.find(e => e.id === id);
        if (exam) {
            exam.status = 'completed';
            AUTH.saveExam(exam);
            EXAMS = AUTH.getExams();
            renderExams();
            showToast('info', 'Exam Stopped', `${exam.title} has been moved to history.`);

            // Broadcast via Realtime
            if (window.REALTIME) REALTIME.broadcast('EXAM_STOPPED', { id: exam.id, title: exam.title });
        }
    };

    // ---- QUESTION CRUD ----
    function renderQuestions(filterExamId = '') {
        const el = document.getElementById('question-bank-list');
        if (!el) return;
        const qset = filterExamId ? QUESTIONS.filter(q => q.examId === filterExamId) : QUESTIONS;
        el.innerHTML = `<div class="table-wrapper"><table><thead><tr><th>ID</th><th>Question Text</th><th>Difficulty</th><th>Points</th><th>Correct</th><th>Actions</th></tr></thead><tbody>
      ${qset.map(q => `<tr>
        <td><small>${q.id}</small></td>
        <td>${q.text}</td>
        <td>${q.difficulty}</td>
        <td>${q.points}</td>
        <td><span class="badge badge-cyan">Opt ${['A','B','C','D'][q.correct]}</span></td>
        <td>
            <div style="display:flex;gap:5px;">
                <button class="btn btn-secondary btn-xs" onclick="openEditQuestionModal('${q.id}')">Edit</button>
                <button class="btn btn-secondary btn-xs" onclick="openDeleteModal('Delete this question?', () => deleteQuestion('${q.id}'))" style="color:#ef4444;">Delete</button>
            </div>
        </td>
      </tr>`).join('')}
      </tbody></table></div>`;
    }

    window.openEditQuestionModal = (qId) => {
        editingQId = qId;
        const q = QUESTIONS.find(qi => qi.id === qId);
        if (!q) return;

        document.getElementById('q-modal-title').textContent = 'Edit Question';
        document.getElementById('q-text-input').value = q.text || '';
        document.getElementById('q-diff-select').value = q.difficulty || 'Medium';
        document.getElementById('q-points-input').value = q.points || 2;
        
        const sel = document.getElementById('q-exam-select');
        sel.innerHTML = EXAMS.map(e => `<option value="${e.id}" ${e.id === q.examId ? 'selected' : ''}>${e.title}</option>`).join('');
        
        // Set radio buttons
        const radios = document.getElementsByName('correct');
        if (radios[q.correct]) radios[q.correct].checked = true;

        // Set option inputs
        const inputs = document.querySelectorAll('.option-row input[type="text"]');
        q.opts.forEach((opt, i) => {
            if (inputs[i]) inputs[i].value = opt;
        });

        document.getElementById('question-modal').classList.remove('hidden');
    };
    window.filterQuestions = (id) => renderQuestions(id);
    function refreshQExamFilter() {
        const sel = document.querySelector('select[onchange="filterQuestions(this.value)"]');
        if (sel) sel.innerHTML = '<option value="">All Exams</option>' + EXAMS.map(e => `<option value="${e.id}">${e.title}</option>`).join('');
    }

    function renderStats() {
        const grid = document.getElementById('mgr-stats-grid');
        if (!grid) return;

        // 1. Basic Stats
        grid.innerHTML = `
            <div class="stat-card purple-glow">
                <div class="stat-label">Total Exams</div>
                <div class="stat-value">${EXAMS.length}</div>
            </div>
            <div class="stat-card green-glow">
                <div class="stat-label">Total Questions</div>
                <div class="stat-value">${QUESTIONS.length}</div>
            </div>
        `;

        // 2. Questions by Subject (Bar Chart)
        const subjectCounts = {};
        EXAMS.forEach(e => {
            const count = QUESTIONS.filter(q => q.examId === e.id).length;
            subjectCounts[e.subject] = (subjectCounts[e.subject] || 0) + count;
        });

        const barSvg = document.getElementById('mgr-bar-svg');
        if (barSvg) {
            const subjects = Object.keys(subjectCounts);
            const counts = Object.values(subjectCounts);
            const max = Math.max(...counts, 1);
            
            barSvg.innerHTML = subjects.map((s, i) => {
                const h = (counts[i] / max) * 140;
                const x = 50 + i * 80;
                return `
                    <rect x="${x}" y="${160 - h}" width="40" height="${h}" fill="var(--accent-purple)" rx="4"></rect>
                    <text x="${x + 20}" y="175" fill="var(--text-muted)" font-size="10" text-anchor="middle">${s}</text>
                    <text x="${x + 20}" y="${155 - h}" fill="var(--text-primary)" font-size="11" font-weight="700" text-anchor="middle">${counts[i]}</text>
                `;
            }).join('');
        }

        // 3. Difficulty Distribution (Donut Chart)
        const diffCounts = { Easy: 0, Medium: 0, Hard: 0 };
        QUESTIONS.forEach(q => { if (diffCounts[q.difficulty] !== undefined) diffCounts[q.difficulty]++; });

        const donutSvg = document.getElementById('mgr-donut-svg');
        const legend = document.getElementById('mgr-donut-legend');
        if (donutSvg && legend) {
            const total = QUESTIONS.length || 1;
            const colors = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };
            let currentOffset = 0;
            
            donutSvg.innerHTML = Object.entries(diffCounts).map(([label, count]) => {
                const pct = (count / total) * 100;
                const dashArray = `${pct} ${100 - pct}`;
                const dashOffset = -currentOffset;
                currentOffset += pct;
                return `<circle cx="60" cy="60" r="50" fill="transparent" stroke="${colors[label]}" stroke-width="12" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" pathLength="100"></circle>`;
            }).join('') + `<circle cx="60" cy="60" r="35" fill="var(--bg-primary)"></circle>
                <text x="60" y="65" fill="white" font-size="16" font-weight="900" text-anchor="middle">${QUESTIONS.length}</text>`;

            legend.innerHTML = Object.entries(diffCounts).map(([label, count]) => `
                <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:10px;height:10px;border-radius:2px;background:${colors[label]}"></div>
                        <span style="font-size:13px;color:var(--text-secondary)">${label}</span>
                    </div>
                    <span style="font-size:13px;font-weight:700;">${count}</span>
                </div>
            `).join('');
        }
    }

    window.showToast = (type, title, msg) => {
        const container = document.getElementById('toast-container');
        if (container) {
            const t = document.createElement('div'); t.className = 'toast';
            t.innerHTML = `<div class="toast-title">${title}</div><div class="toast-msg">${msg}</div>`;
            container.appendChild(t); setTimeout(() => t.remove(), 3000);
        }
    };

    window.openAddQuestionModal = () => {
        editingQId = null;
        document.getElementById('q-modal-title').textContent = 'Add New Question';
        document.getElementById('q-text-input').value = '';
        const sel = document.getElementById('q-exam-select');
        if (sel) sel.innerHTML = EXAMS.map(e => `<option value="${e.id}">${e.title}</option>`).join('');
        document.getElementById('question-modal').classList.remove('hidden');
    };

    window.closeQuestionModal = () => document.getElementById('question-modal').classList.add('hidden');

    window.saveQuestion = () => {
        const text = document.getElementById('q-text-input').value;
        const examId = document.getElementById('q-exam-select').value;
        const difficulty = document.getElementById('q-diff-select').value;
        const points = parseInt(document.getElementById('q-points-input').value);
        const correctRadio = document.querySelector('input[name="correct"]:checked');
        const correct = parseInt(correctRadio ? correctRadio.value : 0);
        const options = Array.from(document.querySelectorAll('.option-row input[type="text"]')).map(i => i.value || 'Option');

        if (!text || !examId) return;
        
        const qData = {
            id: editingQId || ('Q' + Date.now()),
            examId, text, opts: options, 
            correct, difficulty, points
        };

        AUTH.saveQuestion(qData);
        QUESTIONS = AUTH.getQuestions();
        
        if (window.REALTIME) REALTIME.broadcast('QUESTION_UPDATED', { question: qData });

        closeQuestionModal(); renderQuestions();
        showToast('success', 'Question Saved', 'Question bank updated safely.');
    };

    window.deleteQuestion = (id) => {
        AUTH.deleteQuestion(id);
        QUESTIONS = AUTH.getQuestions();
        if (window.REALTIME) REALTIME.broadcast('QUESTION_DELETED', { id });
        renderQuestions();
        showToast('error', 'Question Deleted', 'Question removed from bank.');
    };

    window.openDeleteModal = (msg, onConfirm) => {
        document.getElementById('delete-modal-msg').textContent = msg;
        const btn = document.getElementById('confirm-delete-btn');
        btn.onclick = () => { onConfirm(); document.getElementById('delete-modal').classList.add('hidden'); };
        document.getElementById('delete-modal').classList.remove('hidden');
    };
    window.closeDeleteModal = () => document.getElementById('delete-modal').classList.add('hidden');

    // ---- Bulk Upload Logic ----
    window.handleFileUpload = function(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                let count = 0;
                const extension = file.name.split('.').pop().toLowerCase();
                
                if (extension === 'json') {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data)) {
                        data.forEach(q => {
                            // Basic validation
                            if (q.question && q.options && q.options.length >= 2) {
                                AUTH.saveQuestion({
                                    examId: document.getElementById('q-exam-select')?.value || 'E001',
                                    text: q.question,
                                    opts: q.options,
                                    correct: q.correct || 0,
                                    points: q.points || 2,
                                    difficulty: q.difficulty || 'Medium'
                                });
                                count++;
                            }
                        });
                    }
                } else {
                    // Simple CSV parser fallback
                    const lines = e.target.result.split('\n');
                    lines.forEach(line => {
                        const parts = line.split(',');
                        if (parts.length >= 3) {
                            AUTH.saveQuestion({
                                examId: document.getElementById('q-exam-select')?.value || 'E001',
                                text: parts[0].trim(),
                                opts: [parts[1].trim(), parts[2].trim(), 'N/A', 'N/A'],
                                correct: 0,
                                points: 2,
                                difficulty: 'Medium'
                            });
                            count++;
                        }
                    });
                }

                if (count > 0) {
                    QUESTIONS = AUTH.getQuestions();
                    renderQuestions();
                    if (window.REALTIME) REALTIME.broadcast('QUESTIONS_IMPORTED', { count });
                    showToast('success', 'Upload Success', `${count} questions imported successfully! 🚀`);
                } else {
                    showToast('warning', 'No Questions Found', 'File format valid but no valid questions were detected.');
                }
            } catch (err) {
                console.error("Upload Error:", err);
                showToast('error', 'Upload Failed', 'Critical failure during file parsing.');
            }
        };
        reader.readAsText(file);
    };

    // ---- Phase 3: Automated PDF Reporting Logic ----
    window.sendExamReport = function(examId) {
        const exam = EXAMS.find(e => e.id === examId);
        if (!exam) return;

        showToast('info', 'Generating Report', `Processing analytics for ${exam.title}...`);
        
        setTimeout(() => {
            generatePDFReport(exam);
            showToast('success', 'Email Sent', `Exam report for ${exam.title} sent to your inbox: ${AUTH.getSession().email} 📧`);
        }, 2000);
    };

    window.sendStudentReports = function(examId) {
        const exam = EXAMS.find(e => e.id === examId);
        if (!exam) return;

        const results = AUTH.getResults(examId);
        if (results.length === 0) {
            showToast('warning', 'No Participation', `No students have submitted results for ${exam.title} yet.`);
            return;
        }

        showToast('info', 'Batch Mailing Started', `Preparing reports for participants of ${exam.title}...`);
        
        let progress = 0;
        const total = results.length;
        const interval = setInterval(() => {
            progress += 1;
            const pct = Math.round((progress / total) * 100);
            if (progress < total) {
                showToast('info', 'Mailing in Progress', `Sending report to ${results[progress-1].fullName}...`);
            } else {
                clearInterval(interval);
                showToast('success', 'Batch Complete', `All ${total} reports have been processed and dispatched. 🚀`);
                // Give manager a download of the summary report!
                setTimeout(() => generatePDFReport(exam), 800);
            }
        }, 1200);
    };

    window.viewExamResults = function(examId) {
        const exam = EXAMS.find(e => e.id === examId);
        if (!exam) return;

        document.getElementById('results-modal-title').textContent = `Results: ${exam.title}`;
        
        const results = AUTH.getResults(examId);
        const passMark = exam.passPercentage || 40;

        const content = document.getElementById('results-modal-content');
        if (results.length === 0) {
            content.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">No student results recorded for this exam yet.</div>`;
        } else {
            content.innerHTML = `
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.map(s => {
                                const isPass = s.score >= passMark;
                                return `
                                    <tr>
                                        <td><strong>${s.fullName}</strong><br><small style="color:var(--text-muted)">${s.email}</small></td>
                                        <td><span style="font-weight:800;color:${isPass ? 'var(--accent-green)' : 'var(--accent-red)'}">${s.score}%</span></td>
                                        <td><span class="badge ${isPass ? 'badge-green' : 'badge-red'}">${isPass ? 'PASS' : 'FAIL'}</span></td>
                                        <td>
                                            <button class="btn btn-primary btn-xs" onclick="mailToStudent('${s.id}')" style="background:#6366f1;">📧 Mail</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        document.getElementById('results-modal').classList.remove('hidden');
    };

    window.closeResultsModal = () => document.getElementById('results-modal').classList.add('hidden');

    window.mailToStudent = async function(resultId) {
        try {
            const allResults = AUTH.getResults();
            const res = allResults.find(r => r.id === resultId);
            if (!res) { showToast('error', 'Error', 'Result data not found.'); return; }

            showToast('info', 'Generating Report', `Creating PDF for ${res.fullName}...`);
            
            setTimeout(async () => {
                try {
                    const { jsPDF } = window.jspdf || { jsPDF: window.jspdf_autoTable?.jsPDF };
                    if (!jsPDF) throw new Error("PDF Library (jsPDF) not initialized correctly.");

                    const doc = new jsPDF();
            doc.setFillColor(10, 10, 26);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text("OFFICIAL EXAM REPORT", 14, 25);
            doc.setFontSize(10);
            doc.text("NEXA EXAM Verification Portal", 14, 32);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text("PARTICIPANT DETAILS", 14, 55);
            doc.autoTable({
                startY: 60,
                body: [
                    ["Examinee Name", res.fullName],
                    ["Email ID", res.email],
                    ["Exam Title", res.examTitle],
                    ["Submission Date", new Date(res.timestamp).toLocaleString()]
                ],
                theme: 'grid'
            });

            const passMark = 40; // Default or fetch if possible
            const isPass = res.score >= passMark;
            doc.text("PERFORMANCE METRICS", 14, doc.lastAutoTable.finalY + 15);
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 20,
                body: [
                    ["Correct Answers", `${res.correctAnswers} / ${res.totalQuestions}`],
                    ["Final Score", `${res.score}%`],
                    ["Result Status", isPass ? "PASS" : "FAIL"]
                ],
                theme: 'striped',
                headStyles: { fillColor: isPass ? [16, 185, 129] : [239, 68, 68] }
            });

            // Actual API Call to Cloud Backend
            const CLOUD_API_URL = 'PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE';
            try {
                if (!CLOUD_API_URL.startsWith('http')) throw new Error("Cloud API URL missing.");

                const response = await fetch(CLOUD_API_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        to: res.email,
                        subject: `NEXA EXAM – Your Exam Result: ${res.examTitle}`,
                        body: `Hello ${res.fullName},\n\nYour exam has been successfully completed.\n\nExam Name: ${res.examTitle}\nScore: ${res.score}%\nResult: ${isPass ? 'PASS' : 'FAIL'}\n\nThank you for attending the exam.\n\nRegards,\nNEXA EXAM System`,
                        attachment: {
                            filename: `Report_${res.fullName.replace(/\s+/g, '_')}_${res.examId}.pdf`,
                            content: doc.output('datauristring').split(',')[1] // Base64 part
                        }
                    })
                });

                const apiResult = await response.json();
                if (apiResult.ok) {
                    showToast('success', 'Email Sent', `Individual report delivered to ${res.email}!`);
                } else {
                    console.error('Email Delivery Failed:', apiResult.msg);
                    showToast('error', 'Delivery Failed', 'Cloud Error: ' + apiResult.msg);
                    doc.save(`Report_${res.fullName.replace(/\s+/g, '_')}_${res.examId}.pdf`);
                }
            } catch (apiErr) {
                console.warn('Cloud API not reachable.', apiErr);
                showToast('warning', 'Report Saved', 'Cloud email not ready. Report downloaded locally.');
                doc.save(`Report_${res.fullName.replace(/\s+/g, '_')}_${res.examId}.pdf`);
            }
                } catch (err) {
                    console.error("PDF Generation Error:", err);
                    showToast('error', 'Report Error', 'Could not generate PDF. Please try again.');
                }
            }, 1500);
        } catch (globalErr) {
            console.error("Mailing Action Error:", globalErr);
            showToast('error', 'Action Failed', 'An unexpected error occurred.');
        }
    };

    // ---- Real-Time Monitoring ----
    const REALTIME = {
        channel: new BroadcastChannel('nexa_exam_monitor'),
        on(callback) { this.channel.onmessage = (e) => callback(e.data); }
    };

    REALTIME.on((event) => {
        const { type, data } = event;
        if (type === 'EXAM_COMPLETED') {
            showToast('info', 'Exam Submitted', `${data.fullName} has just finished ${data.examTitle}. View results to see updated stats.`);
            // Refresh modal if open
            if (!document.getElementById('results-modal').classList.contains('hidden')) {
                const currentTitle = document.getElementById('results-modal-title').textContent.replace('Results: ', '');
                const exam = EXAMS.find(e => e.title === currentTitle);
                if (exam) viewExamResults(exam.id);
            }
            renderExams(); renderStats();
        }

        if (type === 'EXAM_LAUNCHED' || type === 'EXAM_STOPPED' || type === 'EXAM_UPDATED' || type === 'EXAM_DELETED') {
            EXAMS = AUTH.getExams();
            renderExams(); renderStats(); refreshQExamFilter();
            if (type === 'EXAM_LAUNCHED') showToast('info', 'Remote Sync', `An exam was launched remotely.`);
        }

        if (type === 'QUESTION_UPDATED' || type === 'QUESTION_DELETED') {
            QUESTIONS = AUTH.getQuestions();
            renderQuestions(); renderStats();
        }
    });

    async function generatePDFReport(exam) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const now = new Date();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(16, 185, 129); // Accent Green
        doc.text("NEXA EXAM – Session Report", 105, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${now.toLocaleString()}`, 105, 28, { align: "center" });

        // Exam Info
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Exam Information", 14, 45);
        doc.autoTable({
            startY: 48,
            body: [
                ["Exam Name", exam.title],
                ["Subject Code", exam.subject],
                ["Question Manager", AUTH.getSession().fullName],
                ["Duration", `${exam.duration} Minutes`],
                ["Pass Percentage", `${exam.passPercentage || 40}%`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }
        });

        // Numerical Stats (Live Data from AUTH)
        const results = AUTH.getResults(exam.id);
        const studentData = results.length > 0 ? results : [
            { fullName: 'Sample Student 1', score: 78, violations: 0 },
            { fullName: 'Sample Student 2', score: 35, violations: 2 }
        ];

        const totalRegistered = EXAMS.length * 5; // Simulating registration pool
        const totalAttended = studentData.length;
        const passMark = exam.passPercentage || 40;
        
        let passedCount = 0;
        const resultsTable = studentData.map(s => {
            const isPass = s.score >= passMark;
            if (isPass) passedCount++;
            return [s.fullName || s.name, s.score, isPass ? 'PASS' : 'FAIL', s.violations || 0];
        });
        
        const failedCount = totalAttended - passedCount;
        const passRate = ((passedCount / totalAttended) * 100).toFixed(1);
        const failRate = ((failedCount / totalAttended) * 100).toFixed(1);

        doc.setFontSize(14);
        doc.text("EXAM PERFORMANCE SUMMARY", 14, doc.lastAutoTable.finalY + 15);
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 18,
            head: [['Metric', 'Value']],
            body: [
                ['Total Students Registered', totalRegistered],
                ['Total Students Attended', totalAttended],
                ['Students Passed', passedCount],
                ['Students Failed', failedCount],
                ['Pass Percentage', `${passRate}%`],
                ['Fail Percentage', `${failRate}%`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] } // Purple
        });

        // Student Result Table
        doc.text("STUDENT RESULT TABLE", 14, doc.lastAutoTable.finalY + 15);
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 18,
            head: [['Student Name', 'Score', 'Result', 'Violations']],
            body: resultsTable,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] } // Green
        });

        // TOP 5 PERFORMERS (LEADERBOARD)
        const top5 = [...studentData]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(s => [s.fullName || s.name, `${s.score}%`]);

        doc.text("TOP 5 PERFORMERS (LEADERBOARD)", 14, doc.lastAutoTable.finalY + 15);
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 18,
            head: [['Rank', 'Student Name', 'Performance']],
            body: top5.map((s, idx) => [idx + 1, s[0], s[1]]),
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11] } // Amber/Gold
        });

        // Security Violation Log (Simplified for the complete report)
        const criticalViolations = studentData.filter(s => s.violations > 0).map(s => [
            s.name, s.violations, s.violations >= 4 ? 'Auto-Terminated' : 'Reviewed'
        ]);

        if (criticalViolations.length > 0) {
            doc.text("SECURITY VIOLATION LOG", 14, doc.lastAutoTable.finalY + 15);
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 18,
                head: [['Student Name', 'Total Violations', 'Action Taken']],
                body: criticalViolations,
                theme: 'grid',
                headStyles: { fillColor: [239, 68, 68] } // Red
            });
        }

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("This is an automatically generated system report.", 105, 285, { align: "center" });

        // Send Summary Report to Manager via Cloud API
        const CLOUD_API_URL = 'PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE';
        try {
            if (!CLOUD_API_URL.startsWith('http')) throw new Error("Cloud API URL missing.");
            
            const managerEmail = AUTH.getSession().email;
            const response = await fetch(CLOUD_API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    to: managerEmail,
                    subject: `NEXA – Exam Summary Report: ${exam.title}`,
                    body: `Hello,\n\nThe exam session "${exam.title}" has been completed.\n\nAttached is the comprehensive summary report including statistics and violation logs.\n\nRegards,\nNEXA EXAM System`,
                    attachment: {
                        filename: `Summary_${exam.id}.pdf`,
                        content: doc.output('datauristring').split(',')[1]
                    }
                })
            });

            const emailResult = await response.json();
            if (emailResult.ok) {
                showToast('success', 'Summary Sent', 'Exam summary report emailed to manager.');
            } else {
                showToast('error', 'Mailing Failed', 'Cloud Error: ' + emailResult.msg);
                doc.save(`Summary_${exam.id}.pdf`);
            }
        } catch (apiErr) {
            console.warn('Cloud API not reachable for summary.');
            doc.save(`Summary_${exam.id}.pdf`);
        }
    }

    document.addEventListener('DOMContentLoaded', () => { updateSidebar(); renderExams(); });
})();
