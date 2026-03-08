import React, { useState } from 'react';
import StudentLogin from './pages/StudentLogin';
import AdminDashboard from './pages/AdminDashboard';
import ExamView from './pages/ExamView';
import { ExamProvider } from './context/ExamContext';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [userRole, setUserRole] = useState(null); // 'admin' or 'student'

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <StudentLogin onLogin={(role) => {
          setUserRole(role);
          setCurrentPage(role === 'admin' ? 'admin' : 'exam');
        }} />;
      case 'admin':
        return <AdminDashboard onLogout={() => setCurrentPage('login')} />;
      case 'exam':
        return <ExamView onLogout={() => setCurrentPage('login')} />;
      default:
        return <StudentLogin />;
    }
  };

  return (
    <ExamProvider>
      <div className="app-container">
        {renderPage()}
      </div>
    </ExamProvider>
  );
}

export default App;
