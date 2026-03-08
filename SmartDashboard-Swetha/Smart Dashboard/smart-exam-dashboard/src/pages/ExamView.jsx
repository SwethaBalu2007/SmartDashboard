import React, { useState } from 'react';

const questions = [
    {
        id: 1,
        text: "What is the integration of e^x?",
        options: ["e^x + C", "x + C", "2x + C", "0"]
    },
    {
        id: 2,
        text: "What is the complex number i^2 equal to?",
        options: ["1", "-1", "i", "-i"]
    },
    {
        id: 3,
        text: "Solubility of a gas in a liquid increases with:",
        options: ["Increase in temperature", "Decrease in pressure", "Increase in pressure", "None of the above"]
    }
];

const ExamView = ({ onLogout }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(curr => curr + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(curr => curr - 1);
        }
    };

    const handleOptionChange = (option) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: option
        }));
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#f8fafc'
        }}>
            <header style={{
                background: 'white',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
            }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>Math Test - Section 1</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>Time Remaining: 45:00</span>
                    <button onClick={onLogout} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#e2e8f0' }}>
                        {isLastQuestion ? 'Submit & Exit' : 'Exit Exam'}
                    </button>
                </div>
            </header>

            <main style={{ flex: 1, padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <div className="card" style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Question {currentQuestionIndex + 1} of {questions.length}</h3>
                    <p style={{ fontSize: '1.2rem', marginBottom: '2rem', textAlign: 'center' }}>
                        {currentQuestion.text}
                    </p>

                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {currentQuestion.options.map((opt, i) => (
                            <label key={i} style={{
                                padding: '1rem',
                                border: `2px solid ${answers[currentQuestion.id] === opt ? 'var(--primary)' : '#e2e8f0'}`,
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: answers[currentQuestion.id] === opt ? '#eff6ff' : 'white'
                            }}>
                                <input
                                    type="radio"
                                    name={`q${currentQuestion.id}`}
                                    checked={answers[currentQuestion.id] === opt}
                                    onChange={() => handleOptionChange(opt)}
                                />
                                {opt}
                            </label>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={handlePrevious}
                            disabled={currentQuestionIndex === 0}
                            style={{
                                background: currentQuestionIndex === 0 ? '#f1f5f9' : '#e2e8f0',
                                color: currentQuestionIndex === 0 ? '#94a3b8' : 'inherit',
                                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Previous
                        </button>

                        {isLastQuestion ? (
                            <button
                                onClick={onLogout}
                                style={{ background: 'var(--success)', color: 'white' }}
                            >
                                Submit Exam
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                style={{ background: 'var(--primary)', color: 'white' }}
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ExamView;
