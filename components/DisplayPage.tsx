
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { 
  Moon, Sun, Smartphone, Monitor, ChevronRight, 
  Keyboard, Type, Eye, Layout, MousePointerClick, 
  CheckCircle2, Circle
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Separator } from './ui/Separator';
import { cn } from '../lib/utils';
import { UserSettings } from '../types';

type Section = 'appearance' | 'accessibility' | 'keyboard';

export const DisplayPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<Section>('appearance');
  
  // Local state for immediate UI feedback before save
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'system',
    accessibility: {
      compactMode: false,
      fontSize: 'medium',
      reduceMotion: false,
      highContrast: false
    }
  });

  // Sync with user profile on load
  useEffect(() => {
    if (userProfile?.settings) {
      setSettings(prev => ({
        ...prev,
        ...userProfile.settings,
        accessibility: { ...prev.accessibility, ...userProfile.settings?.accessibility }
      }));
    }
  }, [userProfile]);

  const saveSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings); // Optimistic update
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { settings: newSettings });
      // Note: Actual theme application (dark/light) would typically happen in a top-level ThemeProvider context
      // For this demo, we are persisting the preference.
    } catch (e) {
      console.error(e);
      toast("Failed to save preference", "error");
    }
  };

  const updateAccessibility = (key: string, value: any) => {
    const newSettings = {
      ...settings,
      accessibility: {
        ...settings.accessibility,
        [key]: value
      }
    };
    saveSettings(newSettings);
  };

  const updateTheme = (theme: 'light' | 'dark' | 'system') => {
    const newSettings = { ...settings, theme };
    saveSettings(newSettings);
  };

  // --- UI Components ---
  const SidebarItem = ({ id, icon: Icon, label }: { id: Section, icon: any, label: string }) => (
    <button
      onClick={() => setActiveSection(id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold transition-all duration-300 text-left",
        activeSection === id 
          ? "bg-white text-synapse-700 shadow-sm ring-1 ring-synapse-100" 
          : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
        activeSection === id ? "bg-synapse-50 text-synapse-600" : "bg-transparent text-slate-400"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="flex-1">{label}</span>
      {activeSection === id && <ChevronRight className="w-4 h-4 text-synapse-400" />}
    </button>
  );

  const Toggle = ({ checked, onChange, label, desc }: { checked: boolean, onChange: (v: boolean) => void, label: string, desc?: string }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
       <div className="pr-4">
          <p className="font-semibold text-slate-900">{label}</p>
          {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
       </div>
       <button 
         onClick={() => onChange(!checked)}
         className={cn(
            "relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-synapse-500",
            checked ? "bg-synapse-600" : "bg-slate-300"
         )}
       >
          <span className={cn(
             "absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300",
             checked ? "translate-x-6" : "translate-x-0"
          )} />
       </button>
    </div>
  );

  const ThemeCard = ({ type, icon: Icon, label, active }: { type: 'light' | 'dark' | 'system', icon: any, label: string, active: boolean }) => (
    <button 
      onClick={() => updateTheme(type)}
      className={cn(
        "flex-1 p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 relative overflow-hidden",
        active 
          ? "border-synapse-500 bg-synapse-50/50" 
          : "border-slate-100 bg-white hover:border-slate-200"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
        active ? "bg-synapse-100 text-synapse-600" : "bg-slate-100 text-slate-500"
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={cn("font-bold text-sm", active ? "text-synapse-700" : "text-slate-600")}>{label}</span>
      {active && (
        <div className="absolute top-3 right-3 text-synapse-600">
          <CheckCircle2 className="w-5 h-5 fill-current text-white" />
        </div>
      )}
    </button>
  );

  return (
    <div className="max-w-[1100px] mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8">
         <h1 className="text-3xl font-black text-slate-900 tracking-tight">Display & Accessibility</h1>
         <p className="text-slate-500 mt-1">Manage your screen experience, themes, and shortcuts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
         <div className="space-y-1">
            <SidebarItem id="appearance" icon={Moon} label="Appearance" />
            <SidebarItem id="accessibility" icon={Eye} label="Accessibility" />
            <SidebarItem id="keyboard" icon={Keyboard} label="Keyboard" />
         </div>

         <Card className="min-h-[500px] bg-white/80 backdrop-blur-xl border-white/60 p-6 lg:p-8 shadow-sm">
            
            {/* --- APPEARANCE --- */}
            {activeSection === 'appearance' && (
               <div className="space-y-8">
                  <div>
                     <h2 className="text-xl font-bold text-slate-900 mb-6">Theme Preferences</h2>
                     <div className="flex flex-col sm:flex-row gap-4">
                        <ThemeCard type="light" icon={Sun} label="Light Mode" active={settings.theme === 'light'} />
                        <ThemeCard type="dark" icon={Moon} label="Dark Mode" active={settings.theme === 'dark'} />
                        <ThemeCard type="system" icon={Monitor} label="System Default" active={settings.theme === 'system'} />
                     </div>
                     <p className="text-xs text-slate-400 mt-3 text-center">
                        We'll adjust your appearance based on your device settings when "System Default" is selected.
                     </p>
                  </div>

                  <Separator />

                  <div>
                     <h2 className="text-xl font-bold text-slate-900 mb-4">Density</h2>
                     <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                        <div className="flex items-start gap-4">
                           <Layout className="w-6 h-6 text-slate-400 mt-1" />
                           <div className="flex-1">
                              <div 
                                className="flex items-center justify-between cursor-pointer group"
                                onClick={() => updateAccessibility('compactMode', false)}
                              >
                                 <div>
                                    <p className="font-bold text-slate-900">Standard</p>
                                    <p className="text-sm text-slate-500">Comfortable spacing and larger text.</p>
                                 </div>
                                 <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", !settings.accessibility?.compactMode ? "border-synapse-600 bg-synapse-600" : "border-slate-300")}>
                                    {!settings.accessibility?.compactMode && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                 </div>
                              </div>
                              
                              <Separator className="my-4" />
                              
                              <div 
                                className="flex items-center justify-between cursor-pointer group"
                                onClick={() => updateAccessibility('compactMode', true)}
                              >
                                 <div>
                                    <p className="font-bold text-slate-900">Compact</p>
                                    <p className="text-sm text-slate-500">Fit more content on the screen with tighter spacing.</p>
                                 </div>
                                 <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", settings.accessibility?.compactMode ? "border-synapse-600 bg-synapse-600" : "border-slate-300")}>
                                    {settings.accessibility?.compactMode && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* --- ACCESSIBILITY --- */}
            {activeSection === 'accessibility' && (
               <div className="space-y-8">
                  <div>
                     <h2 className="text-xl font-bold text-slate-900 mb-2">Accessibility Settings</h2>
                     <p className="text-slate-500 text-sm mb-6">Tools to make Synapse easier to use.</p>

                     <div className="space-y-2">
                        <Toggle 
                           label="Reduce Motion" 
                           desc="Minimize animations and transitions."
                           checked={settings.accessibility?.reduceMotion ?? false}
                           onChange={(v) => updateAccessibility('reduceMotion', v)}
                        />
                        <Toggle 
                           label="High Contrast" 
                           desc="Increase contrast for better readability."
                           checked={settings.accessibility?.highContrast ?? false}
                           onChange={(v) => updateAccessibility('highContrast', v)}
                        />
                        <Toggle 
                           label="Screen Reader Support" 
                           desc="Optimize content for screen readers (ARIA)."
                           checked={true}
                           onChange={() => {}} 
                        />
                     </div>
                  </div>

                  <Separator />

                  <div>
                     <h2 className="text-xl font-bold text-slate-900 mb-4">Text Size</h2>
                     <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <div className="flex items-center justify-between gap-4">
                           <Type className="w-4 h-4 text-slate-500" />
                           <input 
                              type="range" 
                              min="0" 
                              max="2" 
                              step="1"
                              value={settings.accessibility?.fontSize === 'small' ? 0 : settings.accessibility?.fontSize === 'large' ? 2 : 1}
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 const size = val === 0 ? 'small' : val === 2 ? 'large' : 'medium';
                                 updateAccessibility('fontSize', size);
                              }}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-synapse-600"
                           />
                           <Type className="w-6 h-6 text-slate-900" />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                           <span>Small</span>
                           <span>Medium</span>
                           <span>Large</span>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* --- KEYBOARD --- */}
            {activeSection === 'keyboard' && (
               <div className="space-y-8">
                  <div>
                     <h2 className="text-xl font-bold text-slate-900 mb-2">Keyboard Shortcuts</h2>
                     <p className="text-slate-500 text-sm mb-6">Navigate Synapse faster with these keys.</p>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                           { key: 'j', action: 'Scroll down' },
                           { key: 'k', action: 'Scroll up' },
                           { key: 'l', action: 'Like post' },
                           { key: 'c', action: 'Comment on post' },
                           { key: 's', action: 'Share post' },
                           { key: '/', action: 'Search' },
                           { key: 'p', action: 'Open profile' },
                           { key: 'n', action: 'New post' }
                        ].map(shortcut => (
                           <div key={shortcut.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-slate-700 font-medium">{shortcut.action}</span>
                              <kbd className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm min-w-[32px] text-center uppercase">
                                 {shortcut.key}
                              </kbd>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

         </Card>
      </div>
    </div>
  );
};
