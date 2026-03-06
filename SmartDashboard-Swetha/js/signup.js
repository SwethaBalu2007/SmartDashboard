// ===== SIGN UP PAGE LOGIC =====
let captchaAnswer = null;

function initSignUp() {
    refreshCaptcha();
}

function refreshCaptcha() {
    const captcha = AUTH.generateCaptcha();
    captchaAnswer = captcha.answer;
    document.getElementById('captcha-q').textContent = `${captcha.question} = ?`;
    document.getElementById('captcha-ans').value = '';
}

// Password strength meter
function checkStrength(pw) {
    const { label, pct, color } = AUTH.passwordStrength(pw);
    document.getElementById('strength-fill').style.width = pct + '%';
    document.getElementById('strength-fill').style.background = color;
    document.getElementById('strength-label').textContent = pw ? label : '';
    document.getElementById('strength-label').style.color = color;

    // Inline hints
    const errors = AUTH.validatePassword(pw);
    const msgEl = document.getElementById('msg-password');
    if (pw.length === 0) {
        msgEl.textContent = 'Min 8 chars, uppercase, number, special character';
        msgEl.className = 'field-msg hint';
    } else if (errors.length > 0) {
        msgEl.textContent = '⚠ Missing: ' + errors.join(', ');
        msgEl.className = 'field-msg err';
    } else {
        msgEl.textContent = '✓ Password meets all requirements';
        msgEl.className = 'field-msg ok';
    }
}

function checkConfirm() {
    const pw = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;
    const msgEl = document.getElementById('msg-confirm');
    if (!confirm) { msgEl.textContent = ''; return; }
    if (pw === confirm) { msgEl.textContent = '✓ Passwords match'; msgEl.className = 'field-msg ok'; }
    else { msgEl.textContent = '✗ Passwords do not match'; msgEl.className = 'field-msg err'; }
}

function togglePass(id, btn) {
    const inp = document.getElementById(id);
    if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
    else { inp.type = 'password'; btn.textContent = '👁️'; }
}

function showAlert(msg, type = 'err') {
    const box = document.getElementById('alert-box');
    const icon = document.getElementById('alert-icon');
    const msgEl = document.getElementById('alert-msg');
    box.className = 'auth-alert show ' + type;
    icon.textContent = type === 'err' ? '❌' : '✅';
    msgEl.textContent = msg;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleSignUp(event) {
    event.preventDefault();

    const fullName = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const userId = document.getElementById('userid').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;
    const role = document.getElementById('role').value;
    const captchaAns = parseInt(document.getElementById('captcha-ans').value);

    // Validations
    if (!role || role === '') { showAlert('Please select a role.'); return; }

    if (!/^[a-zA-Z0-9_]{4,20}$/.test(userId)) {
        showAlert('User ID: 4–20 chars, letters/numbers/underscores only.');
        return;
    }

    const pwErrors = AUTH.validatePassword(password);
    if (pwErrors.length > 0) {
        showAlert('Password must include: ' + pwErrors.join(', ') + '.');
        return;
    }

    if (password !== confirm) { showAlert('Passwords do not match.'); return; }

    if (isNaN(captchaAns) || captchaAns !== captchaAnswer) {
        showAlert('Incorrect captcha answer. Please try again.');
        refreshCaptcha();
        return;
    }

    // Register
    const result = AUTH.registerUser({ fullName, email, userId, password, role });
    if (!result.ok) { showAlert(result.msg); return; }

    // Success
    showAlert(`✅ Account created successfully! Redirecting to Sign In…`, 'ok');
    const btn = document.getElementById('signup-btn');
    btn.classList.add('loading');
    document.getElementById('signup-btn-text').textContent = 'Account created!';
    setTimeout(() => { window.location.href = 'index.html'; }, 1800);
}

document.addEventListener('DOMContentLoaded', initSignUp);
