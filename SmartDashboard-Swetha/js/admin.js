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

  // ---- Sample Data ----
  const EXAMS = [
    { id: 'E001', name: 'Data Structures Final', subject: 'CS301', students: 45, total: 45, duration: '2h', elapsed: 72, status: 'active' },
    { id: 'E002', name: 'Algorithms Midterm', subject: 'CS302', students: 32, total: 40, duration: '1.5h', elapsed: 45, status: 'active' },
    { id: 'E003', name: 'Database Design', subject: 'CS303', students: 28, total: 35, duration: '1h', elapsed: 55, status: 'active' },
    { id: 'E004', name: 'Operating Systems', subject: 'CS304', students: 19, total: 30, duration: '2h', elapsed: 20, status: 'active' },
  ];

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

  let ALERTS = [
    { type: 'critical', icon: '⚠️', title: 'Tab switch detected', desc: 'STU005 – Vikram Singh switched away from exam window 3 times.', time: '2 min ago', exam: 'Algorithms Midterm' },
    { type: 'warning', icon: '📸', title: 'Camera feed blocked', desc: 'STU003 – Rohit Mehta: camera coverage lost for 45 seconds.', time: '4 min ago', exam: 'Algorithms Midterm' },
    { type: 'critical', icon: '📡', title: 'Connectivity lost', desc: 'STU005 – Vikram Singh: connection dropped. Auto-paused exam.', time: '7 min ago', exam: 'Algorithms Midterm' },
    { type: 'info', icon: 'ℹ️', title: 'Exam started', desc: 'E004 – Operating Systems exam session began.', time: '15 min ago', exam: 'Operating Systems' },
    { type: 'warning', icon: '🖱️', title: 'Suspicious behavior', desc: 'STU002 – Priya Sharma: rapid mouse movement detected.', time: '18 min ago', exam: 'Data Structures Final' },
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
    document.getElementById('sec-' + sec).classList.add('active');
    currentSection = sec;

    const titles = {
      dashboard: ['Dashboard Overview', 'Real-time monitoring and exam control center'],
      exams: ['Active Exams', 'Currently running examination sessions'],
      students: ['Students Monitor', 'All students currently in exam sessions'],
      alerts: ['Proctoring Alerts', 'Suspicious activity and system events'],
      activity: ['Live Activity Feed', 'Real-time events from all exam sessions'],
      reports: ['Reports & Analytics', 'Session statistics and performance data'],
    };
    document.getElementById('page-title').textContent = titles[sec][0];
    document.getElementById('page-subtitle').textContent = titles[sec][1];
  };

  // ---- Clock ----
  function updateClock() {
    const now = new Date();
    document.getElementById('live-clock').textContent = now.toLocaleTimeString('en-IN', { hour12: true });
  }
  updateClock(); setInterval(updateClock, 1000);

  // ---- Render Exams Table ----
  function renderExams() {
    const tbody = document.getElementById('exams-tbody');
    if (!tbody) return;
    tbody.innerHTML = EXAMS.map(e => `
      <tr>
        <td><strong>${e.name}</strong></td>
        <td><span class="badge badge-purple">${e.subject}</span></td>
        <td>${e.students}/${e.total}</td>
        <td>${e.duration}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="progress-bar" style="flex:1;"><div class="progress-fill" style="width:${e.elapsed}%"></div></div>
            <span style="font-size:12px;color:var(--text-muted);width:34px;">${e.elapsed}%</span>
          </div>
        </td>
        <td><span class="badge badge-green"><span class="badge-dot badge-dot-pulse"></span>Live</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="showToast('info','Viewing '+${JSON.stringify(e.name)},'Opening exam session details…')">View</button>
        </td>
      </tr>
    `).join('');
  }

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
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">${s.name[0]}</div>
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
        <td style="font-size:13px;">${s.timeLeft}</td>
        <td>${connBadge}</td>
        <td>${alertBadge}</td>
      </tr>`;
    }).join('');
  }
  window.filterStudents = (v) => renderStudents(v);

  // ---- Render Alerts List ----
  function renderAlerts() {
    const el = document.getElementById('alerts-list');
    if (!el) return;
    document.getElementById('alerts-badge').textContent = ALERTS.filter(a => a.type === 'critical').length;
    document.getElementById('stat-alerts').textContent = ALERTS.filter(a => a.type === 'critical').length;
    if (ALERTS.length === 0) {
      el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">No active alerts. All systems nominal. ✅</p>';
      return;
    }
    el.innerHTML = ALERTS.map((a, i) => `
      <div class="alert-item alert-${a.type}">
        <span class="alert-icon">${a.icon}</span>
        <div class="alert-content">
          <div class="alert-title">${a.title}</div>
          <div class="alert-desc">${a.desc}</div>
          <div class="alert-time">⏱ ${a.time} · ${a.exam}</div>
        </div>
        <button onclick="dismissAlert(${i})" class="btn btn-secondary btn-sm">Dismiss</button>
      </div>
    `).join('');
  }

  window.dismissAlert = function (i) {
    ALERTS.splice(i, 1);
    renderAlerts();
    showToast('success', 'Alert dismissed', 'The proctoring alert was removed.');
  };
  window.clearAlerts = function () {
    ALERTS = [];
    renderAlerts();
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
    ALERTS.unshift({ ...a });
    ACTIVITY_FEED.unshift({ icon: a.icon, text: `Alert: ${a.title} – ${a.desc}`, time: 'just now' });
    simCount++; renderAlerts(); renderActivity();
    showToast('warning', 'New Alert', `${a.title}: ${a.desc}`);
  };

  // ---- Initial Render ----
  function init() {
    updateSidebar();
    renderExams(); renderStudents(); renderAlerts(); renderActivity(); renderConnectivity();
    const onlineData = [72, 75, 80, 85, 82, 87, 90, 87, 84, 87];
    drawLineChart('online-svg', onlineData, '#6366f1', 'grad1');
    drawBarChart('alerts-svg', ['Tab Switch', 'Camera', 'Network', 'Behavior', 'Other'], [8, 5, 6, 4, 5], ['#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6', '#10b981']);
    drawDonut('donut-svg', 'donut-legend', [{ label: 'Completed', value: 35, color: '#10b981' }, { label: 'In Progress', value: 52, color: '#6366f1' }, { label: 'Not Started', value: 13, color: '#f59e0b' },]);
    drawWeeklyChart();
    setInterval(() => {
      const el = document.getElementById('stat-students-online');
      if (el) { const cur = parseInt(el.textContent) || 87; el.textContent = Math.max(60, cur + Math.floor(Math.random() * 5) - 2); }
      onlineData.push(onlineData[onlineData.length - 1] + Math.floor(Math.random() * 6) - 3);
      onlineData.shift();
      drawLineChart('online-svg', onlineData, '#6366f1', 'grad1');
    }, 5000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
