import React from 'react';
import { useExam } from '../context/ExamContext';

const AdminDashboard = ({ onLogout }) => {
    const { students, alerts, stats } = useExam();

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
                    <p style={{ color: 'var(--secondary)' }}>Real-time Monitoring Overview</p>
                </div>
                <button onClick={onLogout} style={{ background: 'white', border: '1px solid #cbd5e1' }}>Logout</button>
            </header>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3 style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Active Exams</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.activeExams}</p>
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Online Students</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{students.length}</p> {/* Using actual count */}
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Recent Alerts</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>{alerts.length}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Student Status Table */}
                <div className="card">
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Student Status</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Student Name</th>
                                <th style={{ padding: '1rem' }}>Exam</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{student.name}</td>
                                    <td style={{ padding: '1rem', color: 'var(--secondary)' }}>{student.exam}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                            background: student.status === 'Active' ? '#dcfce7' : student.status === 'Finished' ? '#e0f2fe' : '#fee2e2',
                                            color: student.status === 'Active' ? '#166534' : student.status === 'Finished' ? '#075985' : '#991b1b'
                                        }}>
                                            {student.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Alerts Panel */}
                <div className="card">
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Proctoring Alerts</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {alerts.length === 0 ? (
                            <p style={{ color: 'var(--secondary)', textAlign: 'center', padding: '1rem' }}>No active alerts</p>
                        ) : (
                            alerts.map(alert => (
                                <div key={alert.id} style={{
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    background: alert.type === 'error' ? '#fef2f2' : '#fffbeb',
                                    borderLeft: `4px solid ${alert.type === 'error' ? 'var(--danger)' : 'var(--warning)'}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{alert.time}</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem' }}>{alert.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
