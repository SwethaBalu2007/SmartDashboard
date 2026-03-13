// Demo credentials
const CREDENTIALS = {
    student: { id: 'student123', pass: 'pass123', redirect: 'student.html' },
    admin: { id: 'admin', pass: 'admin123', redirect: 'admin.html' },
    manager: { id: 'manager', pass: 'mgr123', redirect: 'manager.html' }
};

function switchRole(role) {
    document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
    document.getElementById('tab-' + role).classList.add('active');
    document.getElementById('form-' + role).classList.add('active');
}

function handleLogin(event, role) {
    event.preventDefault();
    const cred = CREDENTIALS[role];
    const errEl = document.getElementById('err-' + role);
    errEl.textContent = '';

    let id, pass;
    if (role === 'student') {
        id = document.getElementById('student-id').value.trim();
        pass = document.getElementById('student-pass').value;
    } else if (role === 'admin') {
        id = document.getElementById('admin-id').value.trim();
        pass = document.getElementById('admin-pass').value;
    } else {
        id = document.getElementById('manager-id').value.trim();
        pass = document.getElementById('manager-pass').value;
    }

    if (id === cred.id && pass === cred.pass) {
        sessionStorage.setItem('examguard_role', role);
        sessionStorage.setItem('examguard_user', id);
        // Animate button
        const btn = document.getElementById('btn-' + role + '-login');
        btn.innerHTML = '<span>Logging in…</span>';
        btn.style.opacity = '0.8';
        setTimeout(() => { window.location.href = cred.redirect; }, 600);
    } else {
        errEl.textContent = '❌ Invalid credentials. Please try again.';
        // Shake animation
        const form = document.getElementById('form-' + role);
        form.style.animation = 'none';
        setTimeout(() => { form.style.animation = 'shake 0.4s ease'; }, 10);
    }
}

// Add shake animation styles dynamically
const style = document.createElement('style');
style.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`;
document.head.appendChild(style);
