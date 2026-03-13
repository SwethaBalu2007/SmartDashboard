// ===== SIGN IN PAGE LOGIC =====
let captchaAnswer = null;
let currentRole = 'student';

function initSignIn() {
    refreshCaptcha();
}

function switchRole(role) {
    currentRole = role;
    document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + role).classList.add('active');
    document.getElementById('signin-role').value = role;

    const labels = { student: 'Student', admin: 'Admin', manager: 'Question Manager' };
    const btnEl = document.getElementById('signin-btn');
    const textEl = document.getElementById('signin-btn-text');
    textEl.textContent = `Sign In as ${labels[role]}`;

    btnEl.className = 'btn-auth';
    if (role === 'admin') btnEl.classList.add('admin-btn');
    if (role === 'manager') btnEl.classList.add('manager-btn');

    hideAlert();
}

function refreshCaptcha() {
    const captcha = AUTH.generateCaptcha();
    captchaAnswer = captcha.answer;
    document.getElementById('captcha-q').textContent = `${captcha.question} = ?`;
    document.getElementById('captcha-ans').value = '';
    document.getElementById('captcha-msg').textContent = 'Solve the math problem to verify you\'re human';
    document.getElementById('captcha-msg').className = 'field-msg hint';
}

function showAlert(msg, type = 'err') {
    const box = document.getElementById('alert-box');
    const icon = document.getElementById('alert-icon');
    const msgEl = document.getElementById('alert-msg');
    box.className = 'auth-alert show ' + type;
    icon.textContent = type === 'err' ? '❌' : '✅';
    msgEl.textContent = msg;
}
function hideAlert() {
    document.getElementById('alert-box').className = 'auth-alert err';
}

function fillDemo(role) {
    const demos = {
        student: { id: 'student123', pass: 'student@Pass1' },
        admin: { id: 'admin123', pass: 'admin@Pass1' },
        manager: { id: 'manager123', pass: 'manager@Pass1' },
    };
    switchRole(role);
    document.getElementById('identifier').value = demos[role].id;
    document.getElementById('password').value = demos[role].pass;
    document.getElementById('captcha-ans').focus();
}

function togglePass(id, btn) {
    const inp = document.getElementById(id);
    if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
    else { inp.type = 'password'; btn.textContent = '👁️'; }
}

function handleSignIn(event) {
    event.preventDefault();
    hideAlert();

    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;
    const captchaAns = parseInt(document.getElementById('captcha-ans').value);
    const role = document.getElementById('signin-role').value;

    // Validate CAPTCHA
    if (isNaN(captchaAns) || captchaAns !== captchaAnswer) {
        document.getElementById('captcha-msg').textContent = '⚠ Incorrect captcha answer. Try again.';
        document.getElementById('captcha-msg').className = 'field-msg err';
        refreshCaptcha();
        shakeForm();
        return;
    }

    // Authenticate
    const result = AUTH.authenticate(identifier, password, role);
    if (!result.ok) {
        showAlert(result.msg);
        refreshCaptcha();
        shakeForm();
        return;
    }

    // Success – set session and redirect
    AUTH.setSession(result.user);
    const btn = document.getElementById('signin-btn');
    btn.classList.add('loading');
    document.getElementById('signin-btn-text').textContent = 'Signing in…';

    const redirects = { student: 'student.html', admin: 'admin.html', manager: 'manager.html' };
    setTimeout(() => { window.location.href = redirects[role]; }, 700);
}

function shakeForm() {
    const card = document.querySelector('.auth-card');
    card.style.animation = 'none';
    setTimeout(() => { card.style.animation = 'shake 0.4s ease'; }, 10);
}

document.addEventListener('DOMContentLoaded', initSignIn);
