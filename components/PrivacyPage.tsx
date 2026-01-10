
import React, { useState } from 'react';
import { 
  Shield, Lock, Eye, Globe, UserCheck, Smartphone, 
  Database, Download, Trash2, ChevronRight, Search, 
  AlertTriangle, CheckCircle2, Sliders, Activity, Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { UserSettings } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/Dialog';

export const PrivacyPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [activeCard, setActiveCard] = useState<string | null>(null);
  
  // Dialog State for "Download Data"
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadStep, setDownloadStep] = useState(0);

  // Helper to update privacy settings
  const updatePrivacy = async (key: string, value: any) => {
    if (!user || !userProfile) return;
    const currentSettings = userProfile.settings || {};
    const currentPrivacy = currentSettings.privacy || {};
    
    const newSettings: UserSettings = {
      ...currentSettings,
      privacy: {
        ...currentPrivacy,
        [key]: value
      }
    };

    try {
      await updateDoc(doc(db, 'users', user.uid), { settings: newSettings });
      toast("Privacy setting updated", "success");
    } catch (e) {
      toast("Failed to update setting", "error");
    }
  };

  const PrivacyOption = ({ 
    icon: Icon, 
    title, 
    desc, 
    value, 
    options, 
    settingKey, 
    color = "text-synapse-600",
    bg = "bg-synapse-50"
  }: any) => (
    <div className="group relative overflow-hidden bg-white border border-slate-100 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:border-slate-200">
       <div className="flex items-start justify-between mb-4">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", bg)}>
             <Icon className={cn("w-6 h-6", color)} />
          </div>
          {settingKey && (
             <select 
               className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-synapse-500/20 cursor-pointer"
               value={value}
               onChange={(e) => updatePrivacy(settingKey, e.target.value)}
             >
                {options.map((opt: any) => (
                   <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
             </select>
          )}
       </div>
       <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-synapse-700 transition-colors">{title}</h3>
       <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );

  const CheckupCard = () => (
     <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl p-8 md:p-12 mb-10 group">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-700"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="text-center md:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest mb-4">
                 <Shield className="w-3 h-3" /> Privacy Checkup
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
                 You're in control.
              </h1>
              <p className="text-emerald-50 text-lg font-medium leading-relaxed">
                 We've designed a transparent experience. Review your key settings to ensure you're sharing exactly what you want, with whom you want.
              </p>
           </div>
           
           <div className="flex-shrink-0">
              <div className="w-64 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-2xl transform md:rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-105">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg">
                       <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <div className="h-2 w-24 bg-white/40 rounded-full mb-1.5"></div>
                       <div className="h-2 w-16 bg-white/20 rounded-full"></div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="h-10 w-full bg-white/10 rounded-xl"></div>
                    <div className="h-10 w-full bg-white/10 rounded-xl"></div>
                 </div>
                 <Button className="w-full mt-4 bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl shadow-lg border-0">
                    Start Review
                 </Button>
              </div>
           </div>
        </div>
     </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
       
       <CheckupCard />

       {/* --- Main Grid --- */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Navigation / Quick Stats */}
          <div className="lg:col-span-4 space-y-6">
             <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl">
                <h3 className="font-bold text-slate-900 mb-6 text-lg">Your Privacy Status</h3>
                
                <div className="space-y-6 relative">
                   {/* Timeline Line */}
                   <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

                   <div className="relative flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border-4 border-white shadow-sm flex items-center justify-center z-10 shrink-0">
                         <Lock className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-800">Password Last Changed</p>
                         <p className="text-xs text-slate-500 mt-0.5">3 months ago</p>
                         <button className="text-blue-600 text-xs font-bold mt-2 hover:underline">Update</button>
                      </div>
                   </div>

                   <div className="relative flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border-4 border-white shadow-sm flex items-center justify-center z-10 shrink-0">
                         <Smartphone className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-800">2-Factor Auth</p>
                         <p className="text-xs text-slate-500 mt-0.5">Enabled via SMS</p>
                      </div>
                   </div>

                   <div className="relative flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-50 border-4 border-white shadow-sm flex items-center justify-center z-10 shrink-0">
                         <Activity className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-800">Login Activity</p>
                         <p className="text-xs text-slate-500 mt-0.5">San Francisco, CA • Chrome</p>
                         <button className="text-purple-600 text-xs font-bold mt-2 hover:underline">View All</button>
                      </div>
                   </div>
                </div>
             </Card>

             <Card className="p-6 bg-slate-900 text-white border-slate-800 shadow-xl rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                   <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-400" /> Your Data
                   </h3>
                   <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                      Download a copy of your information to keep or transfer to another service.
                   </p>
                   <Button 
                     onClick={() => setDownloadDialogOpen(true)}
                     className="w-full bg-blue-600 hover:bg-blue-500 text-white border-0 font-bold rounded-xl"
                   >
                      Download Archive
                   </Button>
                </div>
             </Card>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-8 space-y-10">
             
             {/* Audience & Visibility */}
             <section>
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                      <Eye className="w-6 h-6" />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-900">Audience & Visibility</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <PrivacyOption 
                      icon={Globe}
                      title="Post Audience"
                      desc="Who can see your future posts?"
                      value={userProfile?.settings?.privacy?.defaultPostAudience || 'public'}
                      settingKey="defaultPostAudience"
                      options={[
                         { label: 'Public', value: 'public' },
                         { label: 'Friends', value: 'friends' },
                         { label: 'Only Me', value: 'only_me' }
                      ]}
                      color="text-indigo-600"
                      bg="bg-indigo-50"
                   />
                   <PrivacyOption 
                      icon={Search}
                      title="Search Visibility"
                      desc="Do you want search engines to link to your profile?"
                      value={userProfile?.settings?.privacy?.searchEngineIndexing ? 'true' : 'false'}
                      settingKey="searchEngineIndexing"
                      options={[
                         { label: 'Yes', value: 'true' },
                         { label: 'No', value: 'false' }
                      ]}
                      color="text-blue-600"
                      bg="bg-blue-50"
                   />
                   <PrivacyOption 
                      icon={UserCheck}
                      title="Friend Requests"
                      desc="Who can send you friend requests?"
                      value={userProfile?.settings?.privacy?.friendRequests || 'everyone'}
                      settingKey="friendRequests"
                      options={[
                         { label: 'Everyone', value: 'everyone' },
                         { label: 'Friends of Friends', value: 'friends_of_friends' }
                      ]}
                      color="text-emerald-600"
                      bg="bg-emerald-50"
                   />
                   <div className="group relative overflow-hidden bg-white border border-slate-100 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:border-slate-200 flex flex-col justify-between">
                      <div>
                         <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-500">
                               <AlertTriangle className="w-6 h-6" />
                            </div>
                         </div>
                         <h3 className="text-lg font-bold text-slate-900 mb-2">Blocking</h3>
                         <p className="text-sm text-slate-500 font-medium">Manage blocked users.</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-50">
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                            {userProfile?.blockedUsers?.length || 0} Blocked
                         </p>
                      </div>
                   </div>
                </div>
             </section>

             {/* Data & Ads */}
             <section>
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                      <Sliders className="w-6 h-6" />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-900">Data & Ads</h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                   <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="flex-1 space-y-4">
                         <h3 className="text-xl font-bold text-slate-900">Ad Preferences</h3>
                         <p className="text-slate-500 leading-relaxed">
                            Synapse shows you ads that are relevant to your interests. We never sell your personal information to advertisers. You can control the data used to show you ads.
                         </p>
                         <div className="flex gap-3">
                            <Button variant="outline" className="rounded-xl font-bold">Review Interests</Button>
                            <Button variant="ghost" className="rounded-xl font-bold text-slate-600">Ad Settings</Button>
                         </div>
                      </div>
                      <div className="w-full md:w-1/3 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                         <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Your Ad Topics</h4>
                         <div className="flex flex-wrap gap-2">
                            {['Technology', 'Travel', 'Design', 'Music', 'Startups'].map(tag => (
                               <span key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600">
                                  {tag}
                               </span>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </section>

          </div>
       </div>

       {/* Download Data Dialog */}
       <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white rounded-3xl p-0 overflow-hidden">
             <div className="p-8 pb-0">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                   <Download className="w-8 h-8 text-blue-600" />
                </div>
                <DialogHeader className="mb-4">
                   <DialogTitle className="text-2xl font-black text-slate-900">Download Your Information</DialogTitle>
                   <DialogDescription className="text-base text-slate-500">
                      Get a copy of what you've shared on Synapse.
                   </DialogDescription>
                </DialogHeader>
                
                {downloadStep === 0 ? (
                   <div className="space-y-4 py-4">
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                         This file will contain your profile information, posts, comments, and messages. It may take a few minutes to generate depending on how much activity you have.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all text-center">
                            <span className="block font-bold text-slate-900">HTML</span>
                            <span className="text-xs text-slate-500">Best for viewing</span>
                         </div>
                         <div className="p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all text-center">
                            <span className="block font-bold text-slate-900">JSON</span>
                            <span className="text-xs text-slate-500">Best for importing</span>
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="py-8 text-center space-y-4">
                      <div className="inline-block relative">
                         <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                      <p className="font-bold text-slate-900">Creating your file...</p>
                      <p className="text-sm text-slate-500">We'll email you at <span className="font-bold text-slate-700">{user?.email}</span> when it's ready.</p>
                   </div>
                )}
             </div>
             <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
                {downloadStep === 0 ? (
                   <>
                      <Button variant="ghost" onClick={() => setDownloadDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                      <Button onClick={() => setDownloadStep(1)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6 shadow-lg shadow-blue-500/20">Create File</Button>
                   </>
                ) : (
                   <Button onClick={() => setDownloadDialogOpen(false)} className="w-full bg-slate-900 text-white rounded-xl font-bold">Done</Button>
                )}
             </DialogFooter>
          </DialogContent>
       </Dialog>

    </div>
  );
};
