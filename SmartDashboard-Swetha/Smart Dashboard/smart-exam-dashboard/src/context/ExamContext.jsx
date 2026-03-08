import React, { createContext, useState, useEffect, useContext } from 'react';

const ExamContext = createContext();

export const useExam = () => useContext(ExamContext);

export const ExamProvider = ({ children }) => {
    const [students, setStudents] = useState([
        { id: '1', name: 'Ravi', exam: 'Math Test', status: 'Active' },
        { id: '2', name: 'Ayesha', exam: 'Science Test', status: 'Disconnected' },
        { id: '3', name: 'Kumar', exam: 'English Test', status: 'Finished' },
    ]);

    const [alerts, setAlerts] = useState([
        { id: 1, message: 'Student Ayesha disconnected', time: '10:05 AM', type: 'error' },
        { id: 2, message: 'Student Ravi switched tab', time: '10:12 AM', type: 'warning' },
    ]);

    const [stats, setStats] = useState({
        activeExams: 2,
        onlineStudents: 5,
    });

    // Simulation Logic
    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate random status changes
            setStudents(prev => prev.map(s => {
                if (s.status === 'Finished') return s;
                return {
                    ...s,
                    status: Math.random() > 0.9 ? (s.status === 'Active' ? 'Disconnected' : 'Active') : s.status
                };
            }));

            // Simulate random alerts
            if (Math.random() > 0.8) {
                const newAlert = {
                    id: Date.now(),
                    message: `Student ${['Ravi', 'Ayesha', 'Kumar'][Math.floor(Math.random() * 3)]} ${Math.random() > 0.5 ? 'switched tab' : 'lost connection'}`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: Math.random() > 0.5 ? 'warning' : 'error'
                };
                setAlerts(prev => [newAlert, ...prev].slice(0, 10)); // Keep last 10
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const addStudent = (name, exam) => {
        setStudents(prev => [...prev, { id: Date.now().toString(), name, exam, status: 'Active' }]);
        setStats(prev => ({ ...prev, onlineStudents: prev.onlineStudents + 1 }));
    };

    return (
        <ExamContext.Provider value={{ students, alerts, stats, addStudent }}>
            {children}
        </ExamContext.Provider>
    );
};
