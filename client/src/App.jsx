import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Profile from './components/Profile';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';
import TodoApp from './components/TodoApp';
import Auth from './components/Auth';
import { AuthProvider, useAuth } from './context/AuthContext';

const MainLayout = () => {
  const [activeTab, setActiveTab] = useState('Profile');
  const { isAuthenticated, loading } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'Profile':
        return <Profile key="profile" setActiveTab={setActiveTab} />;
      case 'About Me':
        return <About key="about" />;
      case 'Projects':
        return <Projects key="projects" setActiveTab={setActiveTab} />;
      case 'Todo App':
        if (loading) {
          return (
            <div key="loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: '10px', color: '#94a3b8' }}>
              <Loader2 size={24} className="spinning" />
              <span>Verifying session...</span>
            </div>
          );
        }
        return isAuthenticated ? <TodoApp key="todo" /> : <Auth key="auth" />;
      case 'Contact Me':
        return <Contact key="contact" />;
      default:
        return <Profile key="profile" setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Premium Navbar with Auth controls */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area with entrance transitions */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      {/* Premium Footer */}
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
