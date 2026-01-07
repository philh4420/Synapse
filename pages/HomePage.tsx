import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Feed } from '../components/Feed';
import { RightPanel } from '../components/RightPanel';
import { Menu, X } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-synapse-600 to-synapse-400">
          Synapse
        </span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-6 lg:hidden animate-fade-in">
          <div className="space-y-4">
            {['Feed', 'Explore', 'Notifications', 'Messages', 'Profile'].map((item) => (
              <button 
                key={item}
                onClick={() => { setActiveTab(item.toLowerCase()); setMobileMenuOpen(false); }}
                className="block w-full text-left text-lg font-medium text-slate-800 py-3 border-b border-slate-100"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 w-full max-w-2xl mt-14 lg:mt-0">
        {activeTab === 'feed' ? <Feed /> : (
          <div className="flex items-center justify-center h-[80vh] text-slate-400">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-300 mb-2">Coming Soon</h2>
              <p>This section is under construction for 2026.</p>
            </div>
          </div>
        )}
      </main>

      <RightPanel />
    </div>
  );
};