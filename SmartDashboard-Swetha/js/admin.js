// ====== ADMIN DASHBOARD LOGIC ======
(function () {
  // Auth guard
  if (!AUTH.requireRole('admin')) return;

  // ---- Sidebar User Info ----
  function updateSidebar() {
    const user = AUTH.getSession();
    if (user.fullName) {
      document.getElementById('user-fullname').textContent = user.fullName;
      document.getElementById('user-email').textContent = user.email;
      document.getElementById('user-initial').textContent = user.fullName[0].toUpperCase();
    }
  }

  // ---- Data Management ----
  let EXAMS = AUTH.getExams();
  // If no exams in persistence, use these as initial seed for Admin view
  if (EXAMS.length === 0) {
    const seedExams = [
        { id: 'E001', name: 'Data Structures Final', subject: 'CS301', students: 45, total: 45, duration: '2h', elapsed: 72, status: 'active' },
        { id: 'E002', name: 'Algorithms Midterm', subject: 'CS302', students: 32, total: 40, duration: '1.5h', elapsed: 45, status: 'active' },
        { id: 'E003', name: 'Database Design', subject: 'CS303', students: 28, total: 35, duration: '1h', elapsed: 55, status: 'active' },
        { id: 'E004', name: 'Operating Systems', subject: 'CS304', students: 19, total: 30, duration: '2h', elapsed: 20, status: 'active' },
    ];
    seedExams.forEach(e => {
        // Map 'name' to 'title' if needed for consistency with manager.js
        e.title = e.name;
        AUTH.saveExam(e);
    });
    EXAMS = AUTH.getExams();
  }

  const STUDENTS = [
    { name: 'Aarav Kumar', id: 'STU001', exam: 'Data Structures Final', prog: 78, timeLeft: '28 min', conn: 'online', alerts: 0 },
    { name: 'Priya Sharma', id: 'STU002', exam: 'Data Structures Final', prog: 92, timeLeft: '20 min', conn: 'online', alerts: 1 },
    { name: 'Rohit Mehta', id: 'STU003', exam: 'Algorithms Midterm', prog: 55, timeLeft: '40 min', conn: 'unstable', alerts: 2 },
    { name: 'Sneha Patel', id: 'STU004', exam: 'Database Design', prog: 100, timeLeft: 'Done', conn: 'online', alerts: 0 },
    { name: 'Vikram Singh', id: 'STU005', exam: 'Algorithms Midterm', prog: 33, timeLeft: '55 min', conn: 'offline', alerts: 3 },
    { name: 'Anjali Nair', id: 'STU006', exam: 'Operating Systems', prog: 20, timeLeft: '95 min', conn: 'online', alerts: 0 },
    { name: 'Deepak Raj', id: 'STU007', exam: 'Data Structures Final', prog: 65, timeLeft: '35 min', conn: 'unstable', alerts: 1 },
    { name: 'Meena George', id: 'STU008', exam: 'Database Design', prog: 88, timeLeft: '12 min', conn: 'online', alerts: 0 },
    { name: 'Arjun Desai', id: 'STU009', exam: 'Operating Systems', prog: 45, timeLeft: '75 min', conn: 'online', alerts: 0 },
    { name: 'Kavya Reddy', id: 'STU010', exam: 'Algorithms Midterm', prog: 70, timeLeft: '30 min', conn: 'online', alerts: 1 },
  ];

  let SECURITY_ALERTS = [
    { id: 'a1', sid: 'STU005', studentName: 'Vikram Singh', examName: 'Algorithms Midterm', alertType: 'Tab switch detected', violations: 3, timestamp: Date.now() - 120000, type: 'ALERT_TAB_SWITCH', status: 'Awaiting Review' },
    { id: 'a2', sid: 'STU003', studentName: 'Rohit Mehta', examName: 'Algorithms Midterm', alertType: 'Camera feed blocked', violations: 1, timestamp: Date.now() - 240000, type: 'ALERT_CAMERA_OFF', status: 'Awaiting Review' },
    { id: 'a3', sid: 'STU002', studentName: 'Priya Sharma', examName: 'Data Structures Final', alertType: 'Suspicious behavior', violations: 2, timestamp: Date.now() - 600000, type: 'behavior', status: 'Reviewed' }
  ];

  const ACTIVITY_FEED = [
    { icon: '🟢', text: 'STU001 – Aarav Kumar submitted 10 answers', time: 'just now' },
    { icon: '⚠️', text: 'Alert: STU003 camera blocked', time: '1 min ago' },
    { icon: '📡', text: 'STU007 – Deepak Raj connection unstable', time: '2 min ago' },
    { icon: '✅', text: 'STU004 – Sneha Patel completed the exam', time: '5 min ago' },
    { icon: '🔴', text: 'STU005 – Vikram Singh went offline', time: '7 min ago' },
    { icon: '📝', text: 'Operating Systems exam session started (19 students)', time: '15 min ago' },
    { icon: '🟢', text: '87 students currently active across all exams', time: '16 min ago' },
  ];

  // ---- Navigation ----
  let currentSection = 'dashboard';
  window.showSection = function (sec) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    const navBtn = document.querySelector(`[onclick="showSection('${sec}')"]`);
    if (navBtn) navBtn.classList.add('active');
    const secEl = document.getElementById('sec-' + sec);
    if (secEl) secEl.classList.add('active');
    currentSection = sec;

    const titles = {
      dashboard: ['Dashboard Overview', 'Real-time monitoring and exam control center'],
      monitor: ['Live Session Monitor', 'Real-time tracking of students currently in exams'],
      exams: ['Programmed Exams', 'Currently running examination sessions'],
      students: ['Student Directory', 'All students currently in exam sessions'],
      results: ['Completed Results', 'Historical records of all submitted examinations'],
      alerts: ['Proctoring Alerts', 'Suspicious activity and system events'],
      activity: ['Live Activity Feed', 'Real-time events from all exam sessions'],
      reports: ['Reports & Analytics', 'Session statistics and performance data'],
    };
    if (titles[sec]) {
        document.getElementById('page-title').textContent = titles[sec][0];
        document.getElementById('page-subtitle').textContent = titles[sec][1];
    }

    // RE-RENDER ON NAVIGATION
    if (sec === 'dashboard') {
        renderConnectivity();
        renderActivity();
    }
    if (sec === 'monitor') renderLiveMonitoring();
    if (sec === 'exams') renderExams();
    if (sec === 'students') renderStudents();
    if (sec === 'results') renderAdminResults();
    if (sec === 'alerts') renderSecurityAlerts();
    if (sec === 'activity') renderActivity();
    if (sec === 'reports') drawWeeklyChart();
  };

  // ---- Clock ----
  function updateClock() {
    const now = new Date();
    document.getElementById('live-clock').textContent = now.toLocaleTimeString('en-IN', { hour12: true });
  }
  updateClock(); setInterval(updateClock, 1000);

  // ---- Render Programmed Exams Table ----
  function renderExams() {
    const tbody = document.getElementById('exams-tbody');
    if (!tbody) return;

    EXAMS = AUTH.getExams();
    if (EXAMS.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">No exams found in the system.</td></tr>`;
      return;
    }

    tbody.innerHTML = EXAMS.map(e => {
      const statusBadge = e.status === 'active' ? 'badge-green' : (e.status === 'completed' ? 'badge-purple' : 'badge-amber');
      const statusLabel = (e.status || 'scheduled').toUpperCase();
      const isLive = e.status === 'active';

      return `
        <tr>
          <td><strong>${e.title || e.name}</strong></td>
          <td><span class="badge badge-purple">${e.subject}</span></td>
          <td>${e.students || 0}/${e.total || '--'}</td>
          <td>${e.duration}m</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="progress-bar" style="flex:1;"><div class="progress-fill" style="width:${e.elapsed || 0}%"></div></div>
              <span style="font-size:12px;color:var(--text-muted);width:34px;">${e.elapsed || 0}%</span>
            </div>
          </td>
          <td><span class="badge ${statusBadge}">${isLive ? '<span class="badge-dot badge-dot-pulse"></span>' : ''}${statusLabel}</span></td>
          <td>
            <div style="display:flex;gap:5px;">
              ${!isLive && e.status !== 'completed' ? `<button class="btn btn-primary btn-xs" onclick="launchExam('${e.id}')" style="background:var(--accent-green);">Launch</button>` : ''}
              ${isLive ? `<button class="btn btn-secondary btn-xs" onclick="stopExam('${e.id}')" style="background:var(--accent-red);color:white;">Stop</button>` : ''}
              <button class="btn btn-secondary btn-xs" onclick="showToast('info','Viewing '+${JSON.stringify(e.title || e.name)},'Opening exam session details…')">Details</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.launchExam = (id) => {
    const exams = AUTH.getExams();
    const exam = exams.find(e => e.id === id);
    if (exam) {
      exam.status = 'active';
      AUTH.saveExam(exam);
      renderExams();
      showToast('success', 'Exam Launched', `${exam.title || exam.name} is now LIVE!`);
    }
  };

  window.stopExam = (id) => {
    const exams = AUTH.getExams();
    const exam = exams.find(e => e.id === id);
    if (exam) {
      exam.status = 'completed';
      AUTH.saveExam(exam);
      renderExams();
      showToast('info', 'Exam Stopped', `${exam.title || exam.name} has been completed.`);
    }
  };

  // ---- Render Students Table ----
  function renderStudents(filter = '') {
    const tbody = document.getElementById('students-tbody');
    if (!tbody) return;
    const filtered = STUDENTS.filter(s =>
      s.name.toLowerCase().includes(filter.toLowerCase()) ||
      s.id.toLowerCase().includes(filter.toLowerCase())
    );
    tbody.innerHTML = filtered.map(s => {
      const connBadge = s.conn === 'online'
        ? '<span class="badge badge-green"><span class="badge-dot badge-dot-pulse"></span>Online</span>'
        : s.conn === 'unstable'
          ? '<span class="badge badge-amber"><span class="badge-dot"></span>Unstable</span>'
          : '<span class="badge badge-red"><span class="badge-dot"></span>Offline</span>';
      const alertBadge = s.alerts > 0
        ? `<span style="background:rgba(239,68,68,0.15);color:#ef4444;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:700;">${s.alerts} alert${s.alerts > 1 ? 's' : ''}</span>`
        : '<span style="color:var(--text-muted);font-size:12px;">None</span>';
      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-center;font-size:13px;font-weight:700;">${s.name[0]}</div>
            <strong>${s.name}</strong>
          </div>
        </td>
        <td style="font-size:12px;color:var(--text-muted);">${s.id}</td>
        <td style="font-size:13px;">${s.exam}</td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            <div class="progress-bar" style="flex:1;min-width:60px;"><div class="progress-fill" style="width:${s.prog}%"></div></div>
            <span style="font-size:12px;">${s.prog}%</span>
          </div>
        </td>
        <td>${connBadge}</td>
        <td style="font-weight:800;text-align:center;">${s.alerts || 0}</td>
        <td>
            <button class="btn btn-danger btn-xs" onclick="kickStudent('${s.id}')">KICK</button>
        </td>
      </tr>`;
    }).join('');
  }
  window.filterStudents = (v) => renderStudents(v);

  // ---- Security Alerts Table ----

  function renderSecurityAlerts() {
    const tbody = document.getElementById('security-alerts-tbody');
    if (!tbody) return;
    
    if (SECURITY_ALERTS.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No suspicious activity detected. All systems nominal. ✅</td></tr>';
        return;
    }

    // Sort by time (newest first)
    const sorted = [...SECURITY_ALERTS].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    tbody.innerHTML = sorted.map((a) => {
      let statusBadgeClass = 'badge-amber'; // Default: Awaiting Review
      if (a.status === 'Reviewed') statusBadgeClass = 'badge-cyan';
      if (a.status === 'Resolved') statusBadgeClass = 'badge-green';

      return `
        <tr class="${a.type.includes('ALERT') && a.status === 'Awaiting Review' ? 'row-alert-danger' : ''}">
          <td><strong>${a.studentName}</strong></td>
          <td>${a.examName}</td>
          <td><span class="badge ${a.type.includes('ALERT') ? 'badge-red' : 'badge-purple'}">${a.alertType}</span></td>
          <td><div style="font-weight:800;text-align:center;">${a.violations || '--'}</div></td>
          <td>${new Date(a.timestamp).toLocaleTimeString()}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="badge ${statusBadgeClass}">${a.status}</span>
              <div class="dropdown-actions">
                <button class="btn btn-secondary btn-xs" onclick="updateAlertStatus('${a.id}', 'Reviewed')" title="Mark as Reviewed">👁️</button>
                <button class="btn btn-secondary btn-xs" onclick="updateAlertStatus('${a.id}', 'Resolved')" title="Mark as Resolved">✔️</button>
                <button class="btn btn-primary btn-xs" onclick="resendStudentEmail('${a.sid}')" title="Resend Result Email">📧 RESEND</button>
                <button class="btn btn-danger btn-xs" onclick="kickStudent('${a.sid}')" title="Kick Student">🚫 KICK</button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    // Update badge count (only awaiting review)
    const awaitingCount = SECURITY_ALERTS.filter(a => a.status === 'Awaiting Review').length;
    const badge = document.getElementById('alerts-badge');
    if (badge) badge.textContent = awaitingCount;
    const statAlerts = document.getElementById('stat-alerts');
    if (statAlerts) statAlerts.textContent = awaitingCount;
  }

  window.updateAlertStatus = function(id, newStatus) {
    const alert = SECURITY_ALERTS.find(a => a.id === id);
    if (alert) {
      alert.status = newStatus;
      renderSecurityAlerts();
      showToast('info', 'Alert Status Updated', `Status changed to ${newStatus}`);
    }
  };

  window.kickStudent = function(sid) {
    if (confirm("Are you sure you want to KICK this student from the exam?")) {
        REALTIME.broadcast(REALTIME.EVENTS.COMMAND_KICK_STUDENT, { sid: sid });
        showToast('error', 'Student Kicked', 'Remote termination command sent.');
    }
  };

  window.resendStudentEmail = async function(sid) {
    const CLOUD_API_URL = 'PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE';
    showToast('info', 'Email Dispatch', 'Searching for result record and triggering resend...');
    const results = AUTH.getResults();
    const res = results.find(r => r.userId === sid || r.sid === sid);
    if (!res) {
        showToast('error', 'Not Found', 'No completed exam record found for this student.');
        return;
    }

    try {
        if (!CLOUD_API_URL.startsWith('http')) throw new Error("Cloud API URL missing.");
        
        const response = await fetch(CLOUD_API_URL, {
            method: 'POST',
            body: JSON.stringify({
                to: res.email,
                subject: `NEXA EXAM – [RESEND] Your Exam Result: ${res.examTitle}`,
                body: `Hello ${res.fullName},\n\nThis is a resend of your exam result as requested.\n\nExam Name: ${res.examTitle}\nScore: ${res.score}%\nResult: ${res.score >= 40 ? 'PASS' : 'FAIL'}\n\nRegards,\nNEXA EXAM System`,
            })
        });
        const data = await response.json();
        if (data.ok) showToast('success', 'Email Sent', `Result resend successful for ${res.fullName}!`);
        else throw new Error(data.msg);
    } catch (err) {
        showToast('error', 'Send Failed', 'Cloud email service not configured.');
    }
  };

  window.resendSummaryReport = async function(examName) {
    const CLOUD_API_URL = 'PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE';
    showToast('info', 'Summary Dispatch', `Compiling stats for ${examName} and sending to manager...`);
    try {
        if (!CLOUD_API_URL.startsWith('http')) throw new Error("Cloud API URL missing.");

        const response = await fetch(CLOUD_API_URL, {
            method: 'POST',
            body: JSON.stringify({
                to: AUTH.getSession().email,
                subject: `NEXA EXAM – [RESEND] Summary Report: ${examName}`,
                body: `Hello,\n\nThis is a resend of the summary report for the exam session: ${examName}.\n\nStatistical Overview:\nStatus: Session Completed\nAttempts Logged: Active\n\nRegards,\nNEXA EXAM System`,
            })
        });
        const data = await response.json();
        if (data.ok) showToast('success', 'Summary Sent', 'Summary report has been resent to your email.');
        else throw new Error(data.msg);
    } catch (err) {
        showToast('error', 'Send Failed', 'Cloud email service failed.');
    }
  };

  window.dismissAlert = function (i) {
    SECURITY_ALERTS.splice(i, 1);
    renderSecurityAlerts();
    showToast('success', 'Alert dismissed', 'The proctoring alert was removed.');
  };
  window.clearAlerts = function () {
    SECURITY_ALERTS = [];
    renderSecurityAlerts();
    showToast('success', 'All alerts cleared', 'Alerts list has been reset.');
  };

  // ---- Render Activity Feed ----
  function renderActivity() {
    const el = document.getElementById('activity-feed');
    if (!el) return;
    el.innerHTML = ACTIVITY_FEED.map(a => `
      <div class="alert-item alert-info" style="border-color:rgba(99,102,241,0.3);">
        <span class="alert-icon">${a.icon}</span>
        <div class="alert-content">
          <div class="alert-title">${a.text}</div>
          <div class="alert-time">⏱ ${a.time}</div>
        </div>
      </div>
    `).join('');
  }

  // ---- Render Connectivity List ----
  function renderConnectivity() {
    const el = document.getElementById('connectivity-list');
    if (!el) return;
    const counts = { online: 0, unstable: 0, offline: 0 };
    STUDENTS.forEach(s => counts[s.conn]++);
    el.innerHTML = [
      { label: 'Online', count: counts.online, cls: 'badge-green', dot: 'conn-online' },
      { label: 'Unstable', count: counts.unstable, cls: 'badge-amber', dot: 'conn-unstable' },
      { label: 'Offline', count: counts.offline, cls: 'badge-red', dot: 'conn-offline' },
    ].map(r => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="connectivity-dot ${r.dot}"></span>
          <span style="font-size:14px;font-weight:500;">${r.label}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;font-weight:700;">${r.count}</span>
          <span class="badge ${r.cls}">${Math.round(r.count / STUDENTS.length * 100)}%</span>
        </div>
      </div>
    `).join('');
    // update stats
    document.getElementById('stat-students-online').textContent = counts.online;
    document.getElementById('stat-conn-issues').textContent = counts.offline + counts.unstable;
  }

  // ---- SVG Charts Helpers (Line, Bar, Donut, Weekly) ----
  // ... (rest of chart code remains similar but I will ensure it matches style.css paths)
  function drawLineChart(svgId, data, color, gradId) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const W = 400, H = 160, pad = { t: 10, r: 10, b: 30, l: 35 };
    const minV = Math.min(...data) - 5, maxV = Math.max(...data) + 5;
    const xStep = (W - pad.l - pad.r) / (data.length - 1);
    const yScale = v => H - pad.b - ((v - minV) / (maxV - minV)) * (H - pad.t - pad.b);
    const pts = data.map((v, i) => [pad.l + i * xStep, yScale(v)]);
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const areaD = pathD + ` L${pts[pts.length - 1][0].toFixed(1)},${H - pad.b} L${pts[0][0].toFixed(1)},${H - pad.b} Z`;
    svg.innerHTML = `
      <defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="1"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      ${[0, 25, 50, 75, 100].map(v => { const vy = yScale(minV + v * (maxV - minV) / 100); return `<line x1="${pad.l}" y1="${vy.toFixed(0)}" x2="${W - pad.r}" y2="${vy.toFixed(0)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`; }).join('')}
      <path d="${areaD}" fill="url(#${gradId})" opacity="0.2"/><path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="${color}" stroke="#0a0a1a" stroke-width="2"><title>Min ${i}: ${data[i]}</title></circle>`).join('')}
    `;
  }

  function drawBarChart(svgId, labels, values, colors) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const W = 400, H = 160, pad = { t: 15, r: 20, b: 30, l: 35 };
    const maxV = Math.max(...values) + 2;
    const step = (W - pad.l - pad.r) / labels.length;
    const barW = step * 0.6;
    svg.innerHTML = `
      ${[0, 1, 2, 3].map(i => { const v = maxV - i * (maxV / 3); const vy = pad.t + (i / 3) * (H - pad.t - pad.b); return `<line x1="${pad.l}" y1="${vy.toFixed(0)}" x2="${W - pad.r}" y2="${vy.toFixed(0)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/><text x="${pad.l - 4}" y="${vy + 4}" text-anchor="end" fill="rgba(255,255,255,0.3)" font-size="10">${Math.round(v)}</text>`; }).join('')}
      ${labels.map((lbl, i) => { const bh = ((values[i] / maxV) * (H - pad.t - pad.b)); const bx = pad.l + i * step + (step - barW) / 2; const by = H - pad.b - bh; return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="4" fill="${colors[i]}" opacity="0.85"/><text x="${(bx + barW / 2).toFixed(1)}" y="${(by - 4).toFixed(1)}" text-anchor="middle" fill="white" font-size="11" font-weight="600">${values[i]}</text><text x="${(bx + barW / 2).toFixed(1)}" y="${H - 10}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="10">${lbl}</text>`; }).join('')}
    `;
  }

  function drawDonut(svgId, legendId, data) {
    const svg = document.getElementById(svgId);
    const legend = document.getElementById(legendId);
    if (!svg || !legend) return;
    const total = data.reduce((a, d) => a + d.value, 0);
    let angle = -Math.PI / 2;
    const cx = 60, cy = 60, r = 48, inner = 30;
    const paths = data.map(d => {
      const slice = (d.value / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle), x2 = cx + r * Math.cos(angle + slice), y2 = cy + r * Math.sin(angle + slice);
      const xi1 = cx + inner * Math.cos(angle), yi1 = cy + inner * Math.sin(angle), xi2 = cx + inner * Math.cos(angle + slice), yi2 = cy + inner * Math.sin(angle + slice);
      const large = slice > Math.PI ? 1 : 0;
      const p = `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${xi2.toFixed(2)},${yi2.toFixed(2)} A${inner},${inner} 0 ${large},0 ${xi1.toFixed(2)},${yi1.toFixed(2)} Z`;
      angle += slice;
      return `<path d="${p}" fill="${d.color}" opacity="0.9"/>`;
    }).join('');
    svg.innerHTML = paths + `<text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="white" font-size="13" font-weight="700">${data[0].value}%</text>`;
    legend.innerHTML = data.map(d => `<div style="display:flex;align-items:center;gap:8px;"><div style="width:10px;height:10px;border-radius:3px;background:${d.color};"></div><span style="font-size:12px;color:var(--text-secondary);">${d.label}</span><span style="font-size:13px;font-weight:700;margin-left:auto;">${d.value}%</span></div>`).join('');
  }

  function drawWeeklyChart() {
    const svg = document.getElementById('weekly-svg');
    if (!svg) return;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], vals = [42, 65, 78, 91, 87, 34, 12];
    const W = 700, H = 170, pad = { t: 15, r: 20, b: 30, l: 40 };
    const maxV = Math.max(...vals) + 5, step = (W - pad.l - pad.r) / (days.length), bw = step * 0.5;
    svg.innerHTML = `
      ${[0, 25, 50, 75, 100].map(p => { const vy = pad.t + (1 - p / 100) * (H - pad.t - pad.b); return `<line x1="${pad.l}" y1="${vy.toFixed(0)}" x2="${W - pad.r}" y2="${vy.toFixed(0)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/><text x="${pad.l - 5}" y="${vy + 4}" text-anchor="end" fill="rgba(255,255,255,0.25)" font-size="10">${Math.round(maxV * p / 100)}</text>`; }).join('')}
      ${days.map((d, i) => { const bh = ((vals[i] / maxV) * (H - pad.t - pad.b)), bx = pad.l + i * step + (step - bw) / 2, by = H - pad.b - bh; return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="url(#wcol)"/><text x="${(bx + bw / 2).toFixed(1)}" y="${(by - 5).toFixed(1)}" text-anchor="middle" fill="white" font-size="11" font-weight="600">${vals[i]}</text><text x="${(bx + bw / 2).toFixed(1)}" y="${H - 10}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="11">${d}</text>`; }).join('')}
      <defs><linearGradient id="wcol" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.5"/></linearGradient></defs>
    `;
  }

  // ---- Toast System ----
  window.showToast = function (type, title, msg) {
    const icons = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' };
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '📢'}</span><div class="toast-content"><div class="toast-title">${title}</div><div class="toast-msg">${msg}</div></div><button class="toast-close" onclick="this.closest('.toast').remove()">×</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
  };

  // ---- Simulate Alert ----
  let simCount = 0;
  const SIM_ALERTS = [
    { type: 'critical', icon: '⚠️', title: 'Tab switch detected', desc: 'STU009 – Arjun Desai switched away from exam window.', time: 'just now', exam: 'Operating Systems' },
    { type: 'warning', icon: '📸', title: 'Face not detected', desc: 'STU010 – Kavya Reddy: face not visible in camera frame.', time: 'just now', exam: 'Algorithms Midterm' },
    { type: 'critical', icon: '🖱️', title: 'Screen share attempt', desc: 'STU007 – Deepak Raj attempted to share screen.', time: 'just now', exam: 'Data Structures Final' },
  ];
  window.toggleSimulation = function () {
    const a = SIM_ALERTS[simCount % SIM_ALERTS.length];
    
    SECURITY_ALERTS.unshift({
        id: 'sim_' + Date.now(),
        sid: 'SIM001',
        studentName: a.desc.split(' – ')[0],
        examName: a.exam,
        alertType: a.title,
        violations: 1,
        timestamp: Date.now(),
        type: a.type,
        status: 'Awaiting Review'
    });

    ACTIVITY_FEED.unshift({ icon: a.icon, text: `Alert: ${a.title} – ${a.desc}`, time: 'just now' });
    simCount++; 
    renderSecurityAlerts(); 
    renderActivity();
    showToast('warning', 'New Alert', `${a.title}: ${a.desc}`);
  };

  // ---- Real-Time Monitoring Table ----
  let LIVE_SESSIONS = {}; // Map of userId -> { sessionData }

  function renderLiveMonitoring() {
    const tbody = document.getElementById('monitor-tbody');
    if (!tbody) return;
    
    // Convert session map to array and sort by activity
    const sessions = Object.values(LIVE_SESSIONS).sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
    
    if (sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">No active monitored sessions yet. Live data will appear here.</td></tr>';
        return;
    }

    tbody.innerHTML = sessions.map(s => {
        const isOffline = (new Date() - new Date(s.lastUpdate)) > 15000;
        const statusClass = s.status === 'Completed' ? 'badge-green' : (isOffline ? 'badge-red' : 'badge-purple');
        const hasAlerts = s.alerts > 0;
        
        return `
            <tr>
                <td><strong>${s.studentName}</strong></td>
                <td><span class="badge badge-purple">${s.examName}</span></td>
                <td><span class="badge ${statusClass}">${s.status}</span></td>
                <td>${s.startTime || '--:--'}</td>
                <td>${s.endTime || '--:--'}</td>
                <td><div style="font-weight:700;">${s.attemptsUsed || 1}</div></td>
                <td>
                    <span class="badge ${hasAlerts ? 'badge-red' : 'badge-green'}">
                        ${hasAlerts ? '⚠️ Alert' : '✅ Active'}
                    </span>
                </td>
                <td>
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-primary btn-xs" onclick="resendStudentEmail('${s.sid || ''}')" title="Resend Result Email">📧</button>
                        <button class="btn btn-danger btn-xs" onclick="kickStudent('${s.sid || ''}')">🔴</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Update global stat cards
    const activeCount = sessions.filter(s => s.status === 'Active' && (new Date() - new Date(s.lastUpdate)) < 15000).length;
    const completedCount = sessions.filter(s => s.status === 'Completed').length;
    const totalStudents = sessions.length;
    
    const activeStat = document.getElementById('stat-active-exams');
    if (activeStat) activeStat.textContent = activeCount;
    const onlineStat = document.getElementById('stat-students-online');
    if (onlineStat) onlineStat.textContent = activeCount;
    const completionStat = document.getElementById('stat-completion');
    if (completionStat) completionStat.textContent = Math.round((completedCount / (totalStudents || 1)) * 100);
  }

  function renderAdminResults() {
    const tbody = document.getElementById('results-tbody');
    if (!tbody) return;
    const allResults = AUTH.getResults().sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (allResults.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">No completed results found in history.</td></tr>';
        return;
    }

    tbody.innerHTML = allResults.map(r => {
        const isPass = r.score >= 40;
        return `
            <tr>
                <td><strong>${r.fullName}</strong><br><small>${r.userId}</small></td>
                <td>${r.examTitle}</td>
                <td><span style="font-weight:800;color:${isPass ? 'var(--accent-green)' : 'var(--accent-red)'}">${r.score}%</span></td>
                <td><span class="badge ${isPass ? 'badge-green' : 'badge-red'}">${isPass ? 'PASS' : 'FAIL'}</span></td>
                <td style="font-size:12px;">${new Date(r.timestamp).toLocaleDateString()} ${new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td style="text-align:center;font-weight:700;">${r.violations || 0}</td>
                <td>
                    <button class="btn btn-primary btn-xs" onclick="resendStudentEmail('${r.userId}')">Resend 📧</button>
                </td>
            </tr>
        `;
    }).join('');
  }

  // ---- Real-Time Event Listener ----
  REALTIME.on((payload) => {
    const { type, data, sessionId, timestamp } = payload;
    if (!LIVE_SESSIONS[sessionId]) {
        LIVE_SESSIONS[sessionId] = {
            sid: data.sid || sessionId,
            studentName: data.fullName || 'Unknown Student',
            examName: data.examTitle || '--',
            status: 'Inactive',
            startTime: '--',
            endTime: '--',
            alerts: 0,
            attemptsUsed: data.attemptsUsed || 1,
            lastUpdate: timestamp
        };
    }

    const session = LIVE_SESSIONS[sessionId];
    session.lastUpdate = timestamp;

    switch (type) {
        case REALTIME.EVENTS.EXAM_STARTED:
            session.status = 'Active';
            session.startTime = data.startTime;
            session.examName = data.examTitle;
            showToast('info', 'New Exam Started', `${data.fullName} is now taking ${data.examTitle}`);
            break;
            
        case REALTIME.EVENTS.EXAM_COMPLETED:
            session.status = 'Completed';
            session.endTime = data.endTime;
            showToast('success', 'Exam Completed', `${data.fullName} finished ${data.examTitle} with ${data.score}%`);
            break;
            
        case REALTIME.EVENTS.ALERT_TAB_SWITCH:
        case REALTIME.EVENTS.ALERT_CAMERA_OFF:
        case REALTIME.EVENTS.ALERT_KEY_RESTRICTED:
        case REALTIME.EVENTS.ALERT_COPY_PASTE:
        case REALTIME.EVENTS.ALERT_RIGHT_CLICK:
            session.alerts++;
            const typeLabels = {
                [REALTIME.EVENTS.ALERT_TAB_SWITCH]: 'Tab Switching / Loss of Focus',
                [REALTIME.EVENTS.ALERT_CAMERA_OFF]: 'Camera Disabled / Feed Blocked',
                [REALTIME.EVENTS.ALERT_KEY_RESTRICTED]: 'Restricted Shortcut Attempt (Inspect/Alt)',
                [REALTIME.EVENTS.ALERT_COPY_PASTE]: 'Copy/Paste Attempt',
                [REALTIME.EVENTS.ALERT_RIGHT_CLICK]: 'Right-Click Attempt',
                [REALTIME.EVENTS.ALERT_FACE_NOT_DETECTED]: 'Face Not Detected (AI Proctor)',
                [REALTIME.EVENTS.ALERT_VIOLATION_LIMIT]: 'Violation Limit Exceeded (3 Strikes)'
            };
            
            SECURITY_ALERTS.unshift({
                id: 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                sid: data.sid || session.sid || sessionId,
                studentName: data.fullName,
                examName: data.examTitle,
                alertType: typeLabels[type] || 'Suspicious Activity',
                violations: data.totalViolations,
                timestamp: timestamp,
                type: type,
                status: 'Awaiting Review'
            });
            
            ACTIVITY_FEED.unshift({ icon: '⚠️', text: `Security: ${data.fullName} - ${typeLabels[type]}`, time: 'just now' });
            renderActivity();
            renderSecurityAlerts();
            renderStudents(); // Update students table too
            showToast('error', 'Security Alert', `${data.fullName}: ${typeLabels[type]}`);
            break;
            
        case REALTIME.EVENTS.ALERT_EXAM_TERMINATED:
            showToast('error', 'EXAM TERMINATED', `${data.fullName} removed from exam session. Reason: ${data.reason.toUpperCase()}`);
            ACTIVITY_FEED.unshift({ icon: '🔴', text: `Termination: ${data.fullName} - Removed due to ${data.reason}`, time: 'just now' });
            renderActivity();
            break;
            
        case REALTIME.EVENTS.HEARTBEAT:
            // Just update lastUpdate time
            break;
    }

    renderLiveMonitoring();
  });

  // ---- Initial Render ----
  function init() {
    updateSidebar();
    renderExams();
    renderStudents();
    renderSecurityAlerts();
    renderActivity();
    renderConnectivity();
    renderLiveMonitoring();
    renderAdminResults();

    // Refresh monitoring to handle offline status
    setInterval(renderLiveMonitoring, 10000);

    const onlineData = [72, 75, 80, 85, 82, 87, 90, 87, 84, 87];
    drawLineChart('online-svg', onlineData, '#6366f1', 'grad1');
    drawBarChart('alerts-svg', ['Tab Switch', 'Camera', 'Network', 'Behavior', 'Other'], [8, 5, 6, 4, 5], ['#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6', '#10b981']);
    drawDonut('donut-svg', 'donut-legend', [{ label: 'Completed', value: 35, color: '#10b981' }, { label: 'In Progress', value: 52, color: '#6366f1' }, { label: 'Not Started', value: 13, color: '#f59e0b' },]);
    drawWeeklyChart();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
