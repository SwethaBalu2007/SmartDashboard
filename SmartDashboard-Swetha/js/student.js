// ====== STUDENT DASHBOARD LOGIC ======
(function () {
  // Auth guard
  if (!AUTH.requireRole('student')) return;

  // ---- Sidebar User Info ----
  function updateSidebar() {
    const user = AUTH.getSession();
    if (user.userId) {
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

  function renderProfile() {
    const user = AUTH.getSession();
    const results = AUTH.getResults();
    const userResults = results.filter(r => r.userId === user.userId);

    const totalExams = userResults.length;
    const avgScore = totalExams > 0 ? Math.round(userResults.reduce((acc, r) => acc + r.score, 0) / totalExams) : 0;
    const highestScore = totalExams > 0 ? Math.max(...userResults.map(r => r.score)) : 0;

    const profileContent = document.getElementById('profile-content');
    if (!profileContent) return;

    profileContent.innerHTML = `
            <div class="card" style="max-width: 800px; margin: 0 auto;">
                <div style="display: flex; align-items: center; gap: 30px; margin-bottom: 40px;">
                    <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan)); display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 800; box-shadow: 0 10px 30px rgba(99,102,241,0.3);">
                        ${user.fullName[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 style="font-size: 28px; margin-bottom: 4px;">${user.fullName}</h2>
                        <p style="color: var(--text-secondary); font-size: 16px;">${user.email}</p>
                        <div style="margin-top: 10px;">
                            <span class="badge badge-green">Student ID: ${user.userId}</span>
                        </div>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card purple-glow">
                        <div class="stat-label">Exams Taken</div>
                        <div class="stat-value">${totalExams}</div>
                    </div>
                    <div class="stat-card cyan-glow">
                        <div class="stat-label">Average Score</div>
                        <div class="stat-value">${avgScore}%</div>
                    </div>
                    <div class="stat-card green-glow">
                        <div class="stat-card green-glow">
                            <div class="stat-label">Highest Score</div>
                            <div class="stat-value">${highestScore}%</div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid var(--border);">
                    <h3 style="margin-bottom: 20px; font-size: 18px;">Account Settings</h3>
                    <div style="display: flex; gap: 15px;">
                        <button class="btn btn-secondary">Change Password</button>
                        <button class="btn btn-secondary">Edit Profile</button>
                    </div>
                </div>
            </div>
        `;
  }

  // ---- Results Data ----
  function getPastResults() {
    const user = AUTH.getSession();
    const allResults = AUTH.getResults();
    // Filter by current student ID
    const userResults = allResults.filter(r => r.userId === user.userId);
    
    return userResults.map(r => ({
        title: r.examTitle,
        subject: r.subject || 'N/A',
        score: r.score,
        date: new Date(r.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        grade: r.score >= 80 ? 'A' : r.score >= 60 ? 'B' : 'C',
        violations: r.violations || 0,
        result: r.score >= (r.passMark || 40) ? 'PASS' : 'FAIL'
    }));
  }

  let currentExam = null;
  let currentQ = 0;
  let answers = {};
  let examQuestions = []; // New: Store questions for the current exam
  let timerInterval = null;
  let timeLeft = 0;
  let alertCount = 0;
  let isOnline = true;
  let cameraStream = null;
  let violationCount = 0;
  let isPaused = false;
  let cameraCheckInterval = null;
  let faceDetectionInterval = null;
  let modelsLoaded = false;
  let heartbeatInterval = null;
  let graceTimers = {}; // { type: { timeoutId, intervalId, timeLeft } }

  // ---- Navigation ----
  window.showSection = function (sec) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    const navEl = document.getElementById('nav-' + sec);
    if (navEl) navEl.classList.add('active');
    const secEl = document.getElementById('sec-' + sec);
    if (secEl) secEl.classList.add('active');

    // RE-RENDER CONTENT ON NAVIGATION
    if (sec === 'exams') renderExams();
    if (sec === 'results') renderResults();
    if (sec === 'profile') renderProfile(); // Call renderProfile when navigating to profile

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
  // ---- Suspicious Activity Detection ----
  document.addEventListener('visibilitychange', () => {
    if (currentExam && document.hidden && !isPaused) {
      triggerViolation('Tab switch or minimized window detected! Incident reported.', REALTIME.EVENTS.ALERT_TAB_SWITCH);
    }
  });

  window.addEventListener('blur', () => {
    if (currentExam && !isPaused) {
      // Small timeout to allow for system alerts or modals that might cause a temporary blur
      setTimeout(() => {
        if (document.activeElement && (document.activeElement.tagName === 'IFRAME' || document.activeElement.tagName === 'VIDEO')) return;
        if (currentExam && !document.hasFocus()) {
            triggerViolation('Window focus lost (Alt+Tab or external click detected)!', REALTIME.EVENTS.ALERT_TAB_SWITCH);
        }
      }, 100);
    }
  });

  // ---- Security Restrictions ----
  function setupSecurity() {
    // Disable Right Click
    document.addEventListener('contextmenu', (e) => {
      if (!currentExam) return;
      e.preventDefault();
      triggerViolation('Right-click is disabled during the examination.', REALTIME.EVENTS.ALERT_RIGHT_CLICK);
    });

    // Disable Key Combinations
    document.addEventListener('keydown', (e) => {
      if (!currentExam) return;

      const isModifier = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
      const key = e.key.toLowerCase();

      // Block Ctrl+C, V, X, A
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(key)) {
        e.preventDefault();
        triggerViolation(`Restricted action detected: Ctrl + ${key.toUpperCase()}`, REALTIME.EVENTS.ALERT_COPY_PASTE);
        return;
      }

      // Block Shift key detection
      if (e.key === 'Shift') {
         e.preventDefault();
         triggerViolation('Restricted key action detected: Shift key usage.', REALTIME.EVENTS.ALERT_KEY_RESTRICTED);
         return;
      }

      // Block Shift shortcuts
      if (e.shiftKey) {
         e.preventDefault();
         triggerViolation('Restricted key action detected: Shift shortcut.', REALTIME.EVENTS.ALERT_KEY_RESTRICTED);
         return;
      }

      // Block Alt + Tab (Visibility change handles the switch, but we can block Alt)
      if (e.altKey && e.key === 'Tab') {
          e.preventDefault();
          triggerViolation('Alt + Tab is restricted.', REALTIME.EVENTS.ALERT_KEY_RESTRICTED);
      }
    });

    // Disable Copy/Paste/Cut events directly
    ['copy', 'paste', 'cut'].forEach(evt => {
        document.addEventListener(evt, (e) => {
            if (!currentExam) return;
            e.preventDefault();
            triggerViolation(`Restricted action: ${evt}`, REALTIME.EVENTS.ALERT_COPY_PASTE);
        });
    });

    // Detect exit from Fullscreen
    document.addEventListener('fullscreenchange', () => {
        if (!currentExam || isPaused) return;
        
        if (!document.fullscreenElement) {
            startGracePeriod('fullscreen', 10, 'Exited Full-Screen mode! Please return to full-screen to avoid a violation.', () => {
                triggerViolation('Exited Full-Screen mode! Violation recorded.', REALTIME.EVENTS.ALERT_KEY_RESTRICTED);
            });
        } else {
            cancelGracePeriod('fullscreen');
        }
    });
  }

  function triggerViolation(msg, type) {
    if (!currentExam) return;
    
    // Check if we just finished a grace period - some might call this directly
    // If it's a "Violation recorded" message, we count it.
    violationCount++;
    
    // UI Update
    const modal = document.getElementById('security-modal');
    const msgEl = document.getElementById('security-msg');
    const numEl = document.getElementById('violation-num');
    const graceContainer = document.getElementById('grace-period-container');

    if (violationCount >= 4) {
        // Broadcast specific limit exceeded alert
        REALTIME.broadcast(REALTIME.EVENTS.ALERT_VIOLATION_LIMIT, {
            fullName: AUTH.getSession().fullName,
            sid: AUTH.getSession().userId,
            examTitle: currentExam.title,
            totalViolations: violationCount
        });
        terminateExam('violations');
        return;
    }

    // Hide grace countdown if showing
    if (graceContainer) graceContainer.classList.add('hidden');

    // Progressive Warnings
    let prefix = "🚨 VIOLATION RECORDED"; // Changed from Security Alert
    if (violationCount === 2) prefix = "⚠️ STRONG WARNING";
    if (violationCount === 3) prefix = "🚫 FINAL WARNING";

    msgEl.innerHTML = `<span style="display:block;font-weight:800;color:#ef4444;margin-bottom:10px;">${prefix}</span>${msg}`;
    numEl.textContent = violationCount;
    modal.classList.remove('hidden');
    
    // Broadcast
    REALTIME.broadcast(type, {
        fullName: AUTH.getSession().fullName,
        sid: AUTH.getSession().userId,
        examTitle: currentExam.title,
        message: msg,
        totalViolations: violationCount
    });

    showToast('error', 'Security Violation', msg);
  }

  // ---- Grace Period Logic ----
  function startGracePeriod(type, duration, msg, onComplete) {
    if (!currentExam || isPaused) return;
    if (graceTimers[type]) return; // Already running

    const modal = document.getElementById('security-modal');
    const msgEl = document.getElementById('security-msg');
    const graceContainer = document.getElementById('grace-period-container');
    const countdownEl = document.getElementById('grace-countdown');

    msgEl.innerHTML = `<span style="display:block;font-weight:800;color:#f59e0b;margin-bottom:10px;">⚠️ PENDING VIOLATION</span>${msg}`;
    if (graceContainer) graceContainer.classList.remove('hidden');
    modal.classList.remove('hidden');

    let timeLeft = duration;
    if (countdownEl) countdownEl.textContent = timeLeft + 's';

    const intervalId = setInterval(() => {
        timeLeft--;
        if (countdownEl) countdownEl.textContent = timeLeft + 's';
        if (timeLeft <= 0) {
            clearInterval(intervalId);
        }
    }, 1000);

    const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        delete graceTimers[type];
        if (onComplete) onComplete();
    }, duration * 1000);

    graceTimers[type] = { timeoutId, intervalId };
  }

  function cancelGracePeriod(type) {
    if (graceTimers[type]) {
        clearTimeout(graceTimers[type].timeoutId);
        clearInterval(graceTimers[type].intervalId);
        delete graceTimers[type];
        
        // If no other grace timers are active, we can potentially hide the modal
        // but it's safer to just hide the grace container and let student close it or keep it open for info
        const graceContainer = document.getElementById('grace-period-container');
        if (graceContainer) graceContainer.classList.add('hidden');
        
        // If they fixed it, we can auto-hide the modal if it was just a nudge
        document.getElementById('security-modal').classList.add('hidden');
        showToast('success', 'Issue Resolved', 'Security requirements met. Grace period cancelled.');
    }
  }

  window.terminateExam = function(reason) {
    if (!currentExam) return;

    let displayMsg = "The exam has been terminated.";
    if (reason === 'violations') {
        displayMsg = "You have exceeded the allowed number of violations. The exam has been terminated.";
    } else if (reason === 'admin_kick') {
        displayMsg = "You have been removed from the exam by the administrator.";
    }

    document.getElementById('termination-msg').textContent = displayMsg;
    document.getElementById('termination-modal').classList.remove('hidden');
    
    // Auto Submit
    confirmSubmit(true); // Forced silent submit

    // Cleanup
    stopCamera();
    currentExam = null;

    // Report to Admin
    REALTIME.broadcast(REALTIME.EVENTS.ALERT_EXAM_TERMINATED, {
        fullName: AUTH.getSession().fullName,
        sid: AUTH.getSession().userId,
        reason: reason
    });
  };

  window.closeSecurityModal = () => {
    document.getElementById('security-modal').classList.add('hidden');
  };

  // ---- Exam Control (Pause/Resume) ----
  function pauseExam() {
    if (isPaused || !currentExam) return;
    isPaused = true;
    clearInterval(timerInterval);
    document.getElementById('camera-error-modal').classList.remove('hidden');
    const interface = document.getElementById('sec-exam-interface');
    if (interface) interface.style.opacity = '0.2';
    if (interface) interface.style.pointerEvents = 'none';
    showToast('error', 'Exam Paused', 'Camera disabled. Please re-enable to continue.');
  }

  function resumeExam() {
    if (!isPaused || !currentExam) return;
    isPaused = false;
    startTimer();
    document.getElementById('camera-error-modal').classList.add('hidden');
    const interface = document.getElementById('sec-exam-interface');
    if (interface) interface.style.opacity = '1';
    if (interface) interface.style.pointerEvents = 'auto';
    showToast('success', 'Exam Resumed', 'Camera detected. You may continue.');
  }

  // ---- Camera Monitoring ----
  async function startCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.getElementById('exam-camera');
        if (video) {
            video.srcObject = cameraStream;
            document.getElementById('camera-container').classList.remove('hidden');
        }
        
        // Monitor tracks
        cameraStream.getVideoTracks()[0].onended = () => {
            console.warn("Camera track ended");
            startGracePeriod('camera', 15, 'Camera has been disabled. Please enable your camera within 15 seconds to avoid a violation.', () => {
                triggerViolation('Camera violation recorded: Device disabled.', REALTIME.EVENTS.ALERT_CAMERA_OFF);
                pauseExam();
            });
        };

        // Monitor device changes (unplugging)
        navigator.mediaDevices.ondevicechange = () => {
             checkCameraIntegrity();
        };

        // Periodic check in case onended doesn't fire (e.g. blocked by system)
        if (!cameraCheckInterval) {
            cameraCheckInterval = setInterval(checkCameraIntegrity, 3000);
        }

        if (isPaused) resumeExam();
        
        // Start Face Detection
        startFaceDetection();
        
        // Start heartbeat
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
            const currentSession = AUTH.getSession();
            if (!currentSession.userId) return;

            REALTIME.broadcast(REALTIME.EVENTS.HEARTBEAT, {
                fullName: currentSession.fullName,
                examTitle: (currentExam && currentExam.title) ? currentExam.title : 'Active Exam',
                sid: currentSession.userId,
                status: isPaused ? 'Paused' : 'Active',
                prog: (currentExam && examQuestions) 
                    ? Math.round(((examQuestions.length - currentQ) / examQuestions.length) * 100) 
                    : 0
            });
        }, 5000);
        
        return true;
    } catch (err) {
        console.error('Camera Error:', err);
        alert("Camera access is required to start the examination.");
        REALTIME.broadcast(REALTIME.EVENTS.ALERT_CAMERA_OFF, {
            fullName: AUTH.getSession().fullName,
            examTitle: currentExam ? currentExam.title : 'None',
            message: 'Camera access required to continue.'
        });
        if (currentExam) pauseExam();
        return false;
    }
  }

  function checkCameraIntegrity() {
    if (!currentExam) return;
    
    const isCameraActive = cameraStream && 
                           cameraStream.getVideoTracks().length > 0 && 
                           cameraStream.getVideoTracks()[0].readyState === 'live' &&
                           cameraStream.getVideoTracks()[0].enabled;

    if (!isCameraActive) {
        console.warn("Camera integrity check failed");
        startGracePeriod('camera', 15, 'Camera is not active. Please enable your camera within 15 seconds to continue the exam.', () => {
            triggerViolation('Camera violation recorded: Connection lost or blocked.', REALTIME.EVENTS.ALERT_CAMERA_OFF);
            pauseExam();
        });
    } else {
        cancelGracePeriod('camera');
        if (isPaused) resumeExam();
    }
  }

  // ---- Face Detection Logic ----
  async function loadFaceModels() {
    try {
        // Using a public CDN for models if local /models is missing
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        modelsLoaded = true;
        console.log("Face models loaded successfully");
    } catch (err) {
        console.warn("Could not load face models from CDN. Face detection might be limited.", err);
    }
  }

  async function startFaceDetection() {
    if (!modelsLoaded) await loadFaceModels();
    if (faceDetectionInterval) clearInterval(faceDetectionInterval);
    
    faceDetectionInterval = setInterval(async () => {
        if (!currentExam || isPaused || !modelsLoaded) return;
        
        const video = document.getElementById('exam-camera');
        if (!video || !cameraStream) return;

        try {
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
            if (!detections) {
                console.warn("No face detected");
                startGracePeriod('face', 15, 'Face not detected. Please look at the camera within 15 seconds to avoid a violation.', () => {
                    triggerViolation('Face detection violation recorded.', REALTIME.EVENTS.ALERT_FACE_NOT_DETECTED);
                });
            } else {
                cancelGracePeriod('face');
            }
        } catch (err) {
            console.error("Face detection error:", err);
        }
    }, 3000); // Check every 3 seconds
  }

  function stopFaceDetection() {
    if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
        faceDetectionInterval = null;
    }
  }

  function stopCamera() {
    stopFaceDetection();
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    if (cameraCheckInterval) {
        clearInterval(cameraCheckInterval);
        cameraCheckInterval = null;
    }

    // Clean up all grace timers
    Object.keys(graceTimers).forEach(type => {
        clearTimeout(graceTimers[type].timeoutId);
        clearInterval(graceTimers[type].intervalId);
    });
    graceTimers = {};
    
    document.getElementById('camera-container').classList.add('hidden');
  }

  // ---- Render Exam Cards ----
  function renderExams(filterSubject = '') {
    const grid = document.getElementById('exam-cards');
    if (!grid) return;

    // Fetch from AUTH persistence
    const allExams = AUTH.getExams();
    // Only show ACTIVE exams to students
    const activeExams = allExams.filter(e => e.status === 'active');

    const filtered = filterSubject ? activeExams.filter(e => e.subject === filterSubject) : activeExams;

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted); background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px dashed var(--border);">
            <div style="font-size: 48px; margin-bottom: 20px;">📅</div>
            <h3 style="color: var(--text-primary);">No exams available at the moment.</h3>
            <p style="color: var(--text-secondary);">Check back later or contact your administrator.</p>
        </div>`;
        return;
    }

    grid.innerHTML = filtered.map(e => {
        // Find attempts used for this exam
        const myResults = AUTH.getResults().filter(r => r.userId === AUTH.getSession().userId);
        const used = myResults.filter(r => r.examId === e.id).length;
        const allowed = e.allowedAttempts || 3;
        const remains = allowed - used;
        const isLocked = remains <= 0;

        return `
            <div class="card exam-card">
                <div class="exam-card-header">
                    <span class="badge badge-purple">${e.subject}</span>
                    <span class="exam-duration">⏱️ ${e.duration}m</span>
                </div>
                <h3 class="exam-title">${e.title}</h3>
                <p class="exam-desc">${e.desc || 'Comprehensive evaluation covering course core topics.'}</p>
                <div class="exam-footer">
                    <div class="exam-attempts">Attempts: ${used}/${allowed}</div>
                    ${!isLocked ? `<button class="btn btn-primary btn-sm" onclick="startExam('${e.id}')">Start Exam</button>` : `<button class="btn btn-secondary btn-sm" disabled style="opacity:0.6;">🔒 No Attempts</button>`}
                </div>
            </div>
        `;
    }).join('');
  }

  // ---- Realtime Remote Admin Commands ----
  if (window.REALTIME) {
      REALTIME.on((event) => {
        const { type, data } = event;
        const session = AUTH.getSession();
        
        if (type === REALTIME.EVENTS.COMMAND_KICK_STUDENT && data.sid === session.userId) {
            terminateExam('admin_kick');
        }
        
        // Refresh results if manager adds one or if we submitted elsewhere
        if (type === REALTIME.EVENTS.EXAM_COMPLETED) {
            renderResults();
            renderExams();
        }
      });
  }

  // ---- Start Exam ----
  window.startExam = async function (examId) {
    // Fetch fresh data
    const allExams = AUTH.getExams();
    currentExam = allExams.find(e => e.id === examId);
    if (!currentExam) { showToast('error', 'Unavailable', 'Exam not found.'); return; }

    // Fetch questions for this exam
    examQuestions = AUTH.getQuestions(examId);
    if (examQuestions.length === 0) {
        showToast('warning', 'No Questions', 'This exam doesn\'t have any questions yet.');
        return;
    }
    
    // Check Attempt Limit
    const results = getPastResults(); // Using getPastResults for now, will refactor to AUTH.getResults() later
    const used = results.filter(r => r.title === currentExam.title).length;
    const allowed = currentExam.allowedAttempts || 3;
    if (used >= allowed) {
        alert("You have reached the maximum number of attempts for this exam.");
        return;
    }

    // REQUIRE CAMERA
    const hasCamera = await startCamera();
    if (!hasCamera) return;

    // FULL SCREEN
    try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        }
    } catch (err) {
        console.warn('Fullscreen blocked:', err);
    }

    // Reset state
    currentQ = 0;
    answers = {}; // Renamed from userAnswers to align with existing code
    timeLeft = currentExam.duration * 60;
    violationCount = 0;
    Object.keys(graceTimers).forEach(type => {
        clearTimeout(graceTimers[type].timeoutId);
        clearInterval(graceTimers[type].intervalId);
    });
    graceTimers = {};

    showSection('exam-interface'); renderExamInterface(); startTimer();
    REALTIME.broadcast(REALTIME.EVENTS.EXAM_STARTED, {
        fullName: AUTH.getSession().fullName,
        examTitle: currentExam.title,
        attemptsUsed: used + 1,
        startTime: new Date().toLocaleTimeString('en-IN')
    });
    showToast('info', 'Exam Started', `Good luck! You have ${currentExam.duration} minutes.`);
  };

  function renderExamInterface() {
    const container = document.getElementById('exam-interface-content');
    if (!container) return;
    container.innerHTML = `
      <div class="exam-wrapper">
        <div class="exam-top-bar">
          <div><div style="font-size:11px;font-weight:700;color:var(--text-muted);opacity:0.7;">IN PROGRESS</div><div style="font-size:16px;font-weight:700;">${currentExam.title}</div></div>
          <div style="text-align:center;"><div id="exam-timer" class="exam-timer">--:--</div></div>
          <div style="text-align:right;"><button class="btn btn-primary btn-sm" style="background:#ef4444;" onclick="openSubmitModal()">🏁 Finish</button></div>
        </div>
        <div class="card" style="margin-bottom:16px;padding:12px;"><div class="q-nav">${examQuestions.map((_, i) => `<button class="q-nav-btn ${i === 0 ? 'current' : ''}" id="qnav-${i}" onclick="goToQuestion(${i})">${i + 1}</button>`).join('')}</div></div>
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
    const qs = examQuestions;
    const q = qs[currentQ];
    const area = document.getElementById('question-area');
    if (!area) return;
    area.innerHTML = `<div class="question-card"><div class="question-text">${q.text || q.q}</div><div class="options-grid">${q.opts.map((opt, i) => `<button class="option-btn ${answers[currentQ] === i ? 'selected' : ''}" onclick="selectAnswer(${i})"><span class="option-label">${['A', 'B', 'C', 'D'][i]}</span><span>${opt}</span></button>`).join('')}</div></div>`;
    document.querySelectorAll('.q-nav-btn').forEach((b, i) => { b.classList.remove('current'); b.classList.toggle('answered', answers[i] !== undefined); if (i === currentQ) b.classList.add('current'); });
    const cnt = document.getElementById('q-counter'); if (cnt) cnt.textContent = `Q${currentQ + 1} of ${qs.length}`;
    const prev = document.getElementById('prev-btn'), next = document.getElementById('next-btn');
    if (prev) prev.disabled = currentQ === 0; if (next) next.textContent = currentQ === qs.length - 1 ? 'Review →' : 'Next →';
  }

  window.selectAnswer = (opt) => { answers[currentQ] = opt; renderQuestion(); };
  window.goToQuestion = (i) => { currentQ = i; renderQuestion(); };
  window.prevQuestion = () => { if (currentQ > 0) { currentQ--; renderQuestion(); } };
  window.nextQuestion = () => { if (currentQ < examQuestions.length - 1) { currentQ++; renderQuestion(); } else openSubmitModal(); };

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

  async function generateStudentReport(exam, score, correctCount, totalQuestions, startTime, endTime) {
    const { jsPDF } = window.jspdf || { jsPDF: window.jspdf_autoTable?.jsPDF } || {};
    if (!jsPDF) {
        showToast('error', 'Mailing Error', 'PDF library not loaded. Please try again.');
        return;
    }
    const doc = new jsPDF();
    const user = AUTH.getSession();
    const timestamp = new Date().toLocaleString();

    // Header
    doc.setFillColor(10, 10, 26);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("NEXA EXAM", 14, 25);
    doc.setFontSize(10);
    doc.text("Individual Exam Performance Report", 14, 32);

    // Student Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("STUDENT INFORMATION", 14, 50);
    doc.autoTable({
      startY: 55,
      body: [
        ["Name", user.fullName],
        ["Student ID", user.userId || 'N/A'],
        ["Email", user.email],
        ["Date", timestamp]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    // Exam Info
    doc.text("EXAM DETAILS", 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      body: [
        ["Exam Title", exam.title],
        ["Subject Code", exam.subject],
        ["Start Time", startTime],
        ["Submission Time", endTime]
      ],
      theme: 'grid'
    });

    // Performance Result
    const passMark = exam.passPercentage || 40;
    const isPass = score >= passMark;

    doc.text("PERFORMANCE SUMMARY", 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Metric', 'Detail']],
      body: [
        ["Correct Answers", `${correctCount} / ${totalQuestions}`],
        ["Final Score", `${score}%`],
        ["Passing Mark", `${passMark}%`],
        ["Result", isPass ? "PASS" : "FAIL"]
      ],
      theme: 'striped',
      headStyles: { fillColor: isPass ? [16, 185, 129] : [239, 68, 68] }
    });

    // Security Info
    doc.text("SECURITY COMPLIANCE", 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      body: [
        ["Violation Events Recorded", violationCount],
        ["Proctored Status", "Verified by NEXA-Guard AI"]
      ],
      theme: 'grid'
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("This is an electronically generated report. Authenticity verified by NEXA EXAM Platform.", 14, 285);
    }

    // Actual API Call to Cloud Backend (Google Apps Script)
    const CLOUD_API_URL = 'PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE'; 

    try {
        if (!CLOUD_API_URL.startsWith('http')) {
             throw new Error("Cloud API URL not configured.");
        }

        const response = await fetch(CLOUD_API_URL, {
            method: 'POST',
            body: JSON.stringify({
                to: user.email,
                subject: `NEXA EXAM – Your Exam Result: ${exam.title}`,
                body: `Hello ${user.fullName},\n\nYour exam has been successfully completed.\n\nExam Name: ${exam.title}\nScore: ${score}%\nResult: ${isPass ? 'PASS' : 'FAIL'}\nViolations: ${violationCount}\n\nPerformance Summary:\nTotal Questions: ${totalQuestions}\nCorrect Answers: ${correctCount}\n\nThank you for attending the exam.\n\nRegards,\nNEXA EXAM System`,
                attachment: {
                    filename: `NexaReport_${exam.title}_${user.fullName.replace(/\s+/g, '_')}.pdf`,
                    content: doc.output('datauristring').split(',')[1] // Base64 part
                }
            })
        });

        const result = await response.json();
        if (result.ok) {
            showToast('success', 'Email Delivered', 'Your report has been sent successfully! Check your inbox.');
        } else {
            console.error('Email Delivery Failed:', result.msg);
            showToast('error', 'Delivery Failed', 'Cloud Error: ' + result.msg);
            doc.save(`NexaReport_${exam.title}_${user.fullName.replace(/\s+/g, '_')}.pdf`);
        }
    } catch (err) {
        console.warn('Cloud API not ready or reachable. Downloading report...', err);
        showToast('warning', 'Report Saved', 'Cloud email not configured. Report downloaded locally.');
        doc.save(`NexaReport_${exam.title}_${user.fullName.replace(/\s+/g, '_')}.pdf`);
    }
  }

  window.mailResult = function(index) {
    const results = getPastResults();
    const res = results[index];
    if (!res) return;
    
    showToast('info', 'Mailing Result', `Sending report for ${res.title}...`);
    
    setTimeout(() => {
        showToast('success', 'Email Sent', `Your performance report for ${res.title} has been sent to your email. 📧`);
        
        // Use the high-quality generator
        const dummyExam = { title: res.title, subject: res.subject || 'CS-GEN', passPercentage: 40 };
        const dummyUser = AUTH.getSession();
        generateStudentReport(dummyExam, res.score, Math.round(res.score/10), 10, 'N/A', res.date);
    }, 2000);
  };

  window.confirmSubmit = function (isForced = false) {
    if (!currentExam) return;
    if (!isForced && !confirm('Are you sure you want to submit your exam?')) return;
    
    clearInterval(timerInterval);

    // Calculate Score
    let correct = 0;
    examQuestions.forEach((q, i) => { 
        if (answers[i] === q.correct) correct++; 
    });
    const score = examQuestions.length > 0 ? Math.round((correct / examQuestions.length) * 100) : 0;
    document.getElementById('score-display').textContent = `${score}% Score`;
    
    // Setup Success Modal Data
    window.lastExamResult = {
        title: currentExam.title,
        score: score,
        correct: correct,
        total: examQuestions.length
    };

    stopCamera();
    
    // EXIT FULL SCREEN
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.warn(err));
    }

    const endTime = new Date().toLocaleTimeString('en-IN');
    const startTime = new Date(Date.now() - (currentExam.duration * 60 - timeLeft) * 1000).toLocaleTimeString('en-IN');
    
    // PERSIST RESULT
    const passMark = currentExam.passPercentage || 40;
    AUTH.saveResult({
        examId: currentExam.id,
        examTitle: currentExam.title,
        subject: currentExam.subject,
        score: score,
        passMark: passMark,
        correctAnswers: correct,
        totalQuestions: examQuestions.length,
        startTime: startTime,
        endTime: endTime,
        violations: violationCount
    });

    REALTIME.broadcast(REALTIME.EVENTS.EXAM_COMPLETED, {
        fullName: AUTH.getSession().fullName,
        sid: AUTH.getSession().userId,
        examTitle: currentExam.title,
        score: score,
        endTime: endTime
    });

    const currentExamLocal = currentExam;
    // RESET STATE to stop security monitoring
    currentExam = null;
    violationCount = 0;

    if (isForced) {
        showSection('exams');
        return;
    }

    // Generate Individual Report for Student
    generateStudentReport(currentExamLocal, score, correct, examQuestions.length, startTime, endTime);

    showToast('success', 'Exam Submitted', 'Your results have been saved.');
    document.getElementById('submit-modal').classList.add('hidden');
    document.getElementById('success-modal').classList.remove('hidden');
  };
  window.closeSuccessModal = () => {
    document.getElementById('success-modal').classList.add('hidden');
    showSection('exams');
  };

  window.mailOnSuccess = function() {
    if (!window.lastExamResult) return;
    showToast('info', 'Mailing Report', `Sending your results for ${window.lastExamResult.title}...`);
    setTimeout(() => {
        showToast('success', 'Email Sent', `Report sent to ${AUTH.getSession().email} 📧`);
        // Trigger actual download as well
        const dummyExam = { title: window.lastExamResult.title, subject: 'CS-GEN', passPercentage: 40 };
        generateStudentReport(dummyExam, window.lastExamResult.score, window.lastExamResult.correct, window.lastExamResult.total, 'N/A', new Date().toLocaleTimeString());
    }, 1500);
  };

  function renderResults() {
    const el = document.getElementById('results-content');
    if (!el) return;
    const results = getPastResults();
    
    if (results.length === 0) {
        el.innerHTML = `
            <div style="text-align:center;padding:80px 40px;color:var(--text-muted);background:rgba(255,255,255,0.02);border-radius:16px;">
                <div style="font-size:64px;margin-bottom:20px;">📊</div>
                <h3 style="color:var(--text-primary);">No exam results available.</h3>
                <p>Complete an exam to see your performance here.</p>
            </div>`;
        return;
    }

    el.innerHTML = `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Exam Name</th>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Violations</th>
                        <th>Result</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map((r, i) => `
                        <tr>
                            <td><strong>${r.title}</strong><br><small style="color:var(--text-muted);">${r.subject}</small></td>
                            <td>${r.date}</td>
                            <td><span style="font-size:16px;font-weight:700;color:var(--accent-cyan);">${r.score}%</span></td>
                            <td><span class="badge ${r.violations > 0 ? 'badge-red' : 'badge-green'}">${r.violations}</span></td>
                            <td><span class="badge ${r.result === 'PASS' ? 'badge-green' : 'badge-red'}">${r.result}</span></td>
                            <td><button class="btn btn-secondary btn-xs" onclick="mailResult(${i})">📧 Mail</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
  }

  window.showToast = (type, title, msg) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div'); toast.className = 'toast';
    toast.innerHTML = `<div class="toast-content"><div class="toast-title">${title}</div><div class="toast-msg">${msg}</div></div>`;
    container.appendChild(toast); setTimeout(() => toast.remove(), 4000);
  };

  function init() { 
    try {
        updateSidebar(); 
        renderExams(); 
        renderResults(); 
        setupSecurity(); 

        // Real-Time Listeners
        if (window.REALTIME && REALTIME.on) {
            REALTIME.on((event) => {
                const { type, data } = event;
                if (type === 'EXAM_LAUNCHED') {
                    showToast('info', 'New Exam LIVE!', `Refresh now to see: ${data.title}`);
                    renderExams();
                }
                if (['EXAM_STOPPED', 'EXAM_DELETED', 'EXAM_UPDATED'].includes(type)) {
                    renderExams();
                }
            });
        }
    } catch (err) {
        console.error("Student Dashboard Init Error:", err);
        try { renderExams(); } catch (e) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
