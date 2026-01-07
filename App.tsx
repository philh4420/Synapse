import React from 'react';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-synapse-200 border-t-synapse-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium animate-pulse">Initializing Synapse...</p>
        </div>
      </div>
    );
  }

  return user ? <HomePage /> : <LandingPage />;
};

export default App;