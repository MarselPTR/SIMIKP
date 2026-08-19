import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Penugasan from './pages/Penugasan';
import BankKonten from './pages/BankKonten';
import Sidebar from './components/Sidebar';
import { INITIAL_TASKS } from './data/mockData';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSelectedTask(null);
  };

  const handleUpdateStatus = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => ({ ...prev, status: newStatus }));
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const userTasks = tasks.filter(t => t.bidang === currentUser?.bidang);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        onLogout={handleLogout}
        setSelectedTask={setSelectedTask}
      />
      <main style={{ flex: 1, padding: '32px' }}>
        {activeTab === 'dashboard' && (
          <Dashboard 
            currentUser={currentUser} 
            userTasks={userTasks} 
            onSelectTask={(task) => { setSelectedTask(task); setActiveTab('penugasan'); }} 
          />
        )}
        {activeTab === 'penugasan' && (
          <Penugasan 
            currentUser={currentUser} 
            userTasks={userTasks} 
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
        {activeTab === 'bank_konten' && <BankKonten />}
      </main>
    </div>
  );
}