// ===== ExamGuard Shared Auth System =====
console.log('ExamGuard Auth System Loading...');

const AUTH = {

    // ---- User Store (localStorage) ----
    getUsers() {
        try {
            return JSON.parse(localStorage.getItem('eg_users') || '[]');
        } catch (e) {
            console.error('Error reading eg_users from localStorage', e);
            return [];
        }
    },

    saveUsers(users) {
        try {
            localStorage.setItem('eg_users', JSON.stringify(users));
        } catch (e) {
            console.error('Error saving eg_users to localStorage', e);
        }
    },

    findUser(identifier) {
        return this.getUsers().find(u =>
            u.userId === identifier || u.email === identifier
        );
    },

    registerUser(data) {
        const users = this.getUsers();
        if (users.find(u => u.userId === data.userId)) return { ok: false, msg: 'User ID already exists.' };
        if (users.find(u => u.email === data.email)) return { ok: false, msg: 'Email already registered.' };
        users.push({
            userId: data.userId,
            fullName: data.fullName,
            email: data.email,
            password: this.hashPassword(data.password),
            role: data.role,
            createdAt: new Date().toISOString()
        });
        this.saveUsers(users);
        return { ok: true };
    },

    authenticate(identifier, password, role) {
        const user = this.findUser(identifier);
        if (!user) return { ok: false, msg: 'No account found with that ID or email.' };
        if (user.password !== this.hashPassword(password)) return { ok: false, msg: 'Incorrect password.' };
        if (user.role !== role) return { ok: false, msg: `This account is registered as "${this.roleLabel(user.role)}", not "${this.roleLabel(role)}".` };
        return { ok: true, user };
    },

    // Simple deterministic hash (XOR-based, suitable for demo)
    hashPassword(pw) {
        let h = 5381;
        for (let i = 0; i < pw.length; i++) h = ((h << 5) + h) ^ pw.charCodeAt(i);
        return 'h' + (h >>> 0).toString(16);
    },

    roleLabel(r) {
        return { student: 'Student', admin: 'Admin', manager: 'Question Manager' }[r] || r;
    },

    // ---- Session ----
    setSession(user) {
        sessionStorage.setItem('eg_role', user.role);
        sessionStorage.setItem('eg_userId', user.userId);
        sessionStorage.setItem('eg_fullName', user.fullName);
        sessionStorage.setItem('eg_email', user.email);
    },

    getSession() {
        return {
            role: sessionStorage.getItem('eg_role'),
            userId: sessionStorage.getItem('eg_userId'),
            fullName: sessionStorage.getItem('eg_fullName'),
            email: sessionStorage.getItem('eg_email'),
        };
    },

    requireRole(role) {
        const sess = this.getSession();
        if (sess.role !== role) { window.location.href = 'index.html'; return false; }
        return true;
    },

    logout() {
        sessionStorage.clear();
        window.location.href = 'index.html';
    },

    // ---- CAPTCHA ----
    generateCaptcha() {
        const ops = ['+', '-', '*'];
        const op = ops[Math.floor(Math.random() * 3)];
        let a, b, answer;
        if (op === '+') { a = randInt(2, 15); b = randInt(2, 15); answer = a + b; }
        else if (op === '-') { a = randInt(8, 20); b = randInt(1, a); answer = a - b; }
        else { a = randInt(2, 9); b = randInt(2, 9); answer = a * b; }
        return { question: `${a} ${op === '*' ? '&times;' : op} ${b}`, answer };
    },

    // ---- Password Validation ----
    validatePassword(pw) {
        const errors = [];
        if (pw.length < 8) errors.push('At least 8 characters');
        if (!/[A-Z]/.test(pw)) errors.push('One uppercase letter');
        if (!/[0-9]/.test(pw)) errors.push('One number');
        if (!/[^A-Za-z0-9]/.test(pw)) errors.push('One special character');
        return errors;
    },

    passwordStrength(pw) {
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 1) return { label: 'Weak', pct: 20, color: '#ef4444' };
        if (score <= 2) return { label: 'Fair', pct: 45, color: '#f59e0b' };
        if (score <= 3) return { label: 'Good', pct: 70, color: '#06b6d4' };
        return { label: 'Strong', pct: 100, color: '#10b981' };
    }
};

// Seed demo accounts if empty
(function seedDemoUsers() {
    try {
        if (AUTH.getUsers().length === 0) {
            ['student', 'admin', 'manager'].forEach(role => {
                const id = role === 'manager' ? 'manager' : role;
                AUTH.registerUser({
                    userId: id + '123',
                    fullName: role === 'admin' ? 'Admin User' : role === 'student' ? 'Aarav Kumar' : 'Question Manager',
                    email: id + '@examguard.io',
                    password: id + '@Pass1',
                    role
                });
            });
            console.log('Demo users seeded.');
        }
    } catch (e) {
        console.error('Failed to seed demo users:', e);
    }
})();

function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
console.log('ExamGuard Auth System Ready.');
