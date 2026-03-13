import React, { useState } from 'react';
import { useExam } from '../context/ExamContext';

const StudentLogin = ({ onLogin }) => {
    const [name, setName] = useState('');
    const [exam, setExam] = useState('Math Test');
    const { addStudent } = useExam();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name) return;

        // Backdoor for admin
        if (name.toLowerCase() === 'admin') {
            onLogin('admin');
            return;
        }

        addStudent(name, exam);
        onLogin('student');
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
            <div className="card" style={{ width: '400px', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>NASCOM</h1>
                <p style={{ marginBottom: '2rem', color: 'var(--secondary)' }}>Smart Exam Monitoring</p>

                <form onSubmit={handleSubmit}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Student Name</label>
                        <input
                            type="text"
                            placeholder="Enter your name (or 'admin')"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Select Exam</label>
                        <select value={exam} onChange={(e) => setExam(e.target.value)}>
                            <option>Math Test</option>
                            <option>Science Test</option>
                            <option>English Test</option>
                        </select>
                    </div>

                    <button type="submit" style={{ width: '100%', background: 'var(--primary)', color: 'white' }}>
                        Start Exam
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentLogin;
