import React, { useState, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Profile from './components/Profile';
import Auth from './components/Auth';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy-loaded non-initial views for Practical 8 Step 2 (Code Splitting)
const About = lazy(() => import('./components/About'));
const Projects = lazy(() => import('./components/Projects'));
const Contact = lazy(() => import('./components/Contact'));
const TodoApp = lazy(() => import('./components/TodoApp'));

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

      {/* Main Content Area with entrance transitions and Suspense fallback */}
      <main className="main-content">
        <Suspense
          fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: '10px', color: '#94a3b8' }}>
              <Loader2 size={24} className="spinning" />
              <span>Loading page...</span>
            </div>
          }
        >
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </Suspense>
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
