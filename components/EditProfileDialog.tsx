import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { uploadToCloudinary } from '../utils/upload';
import { Loader2, Save, User, Briefcase, MapPin, Heart, Info, Image as ImageIcon, Camera, UploadCloud, ChevronRight } from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabKey = 'images' | 'bio' | 'work_edu' | 'places' | 'contact_basic' | 'relationships';

export const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ open, onOpenChange }) => {
  const { user, userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('images');
  
  // Form State
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    displayName: userProfile?.displayName || '',
    bio: userProfile?.bio || '',
    work: userProfile?.work || '',
    position: userProfile?.position || '',
    education: userProfile?.education || '',
    highSchool: userProfile?.highSchool || '',
    location: userProfile?.location || '',
    hometown: userProfile?.hometown || '',
    website: userProfile?.website || '',
    relationshipStatus: userProfile?.relationshipStatus || 'Single',
    birthDate: userProfile?.birthDate || '',
    gender: userProfile?.gender || '',
    languages: userProfile?.languages || ''
  });
  
  // Image State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.photoURL || '');
  const [coverPreview, setCoverPreview] = useState(userProfile?.coverURL || '');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCoverFile(e.target.files[0]);
      setCoverPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let newPhotoURL = userProfile?.photoURL;
      let newCoverURL = userProfile?.coverURL;

      // Upload Images if changed
      if (avatarFile) {
        newPhotoURL = await uploadToCloudinary(avatarFile);
      }
      if (coverFile) {
        newCoverURL = await uploadToCloudinary(coverFile);
      }

      const updates: Partial<UserProfile> = {
        ...formData,
        photoURL: newPhotoURL,
        coverURL: newCoverURL
      };

      await updateDoc(doc(db, 'users', user.uid), updates);
      await refreshProfile();
      toast("Profile updated successfully", "success");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'images', label: 'Visuals', icon: ImageIcon, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'bio', label: 'Identity', icon: User, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'work_edu', label: 'Experience', icon: Briefcase, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'places', label: 'Locations', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'contact_basic', label: 'Info', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'relationships', label: 'Family', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-white/40 shadow-2xl bg-white/95 backdrop-blur-xl">
        
        {/* Header */}
        <DialogHeader className="px-8 py-6 border-b border-slate-100 flex-shrink-0 flex flex-row items-center justify-between bg-white/50">
          <div>
            <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">Edit Profile</DialogTitle>
            <DialogDescription className="text-slate-500 mt-1 font-medium">
               Customize how others see you on Synapse.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
           {/* Sidebar Navigation */}
           <div className="w-[280px] hidden md:flex flex-col bg-slate-50/50 border-r border-slate-100 p-4 space-y-1 overflow-y-auto">
              {tabs.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as TabKey)}
                   className={cn(
                     "group w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-200 text-left relative overflow-hidden",
                     activeTab === tab.id 
                       ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" 
                       : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
                   )}
                 >
                    <div className={cn(
                       "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                       activeTab === tab.id ? `${tab.bg} ${tab.color}` : "bg-slate-100 text-slate-400 group-hover:text-slate-500"
                    )}>
                       <tab.icon className="w-5 h-5" />
                    </div>
                    <span className="flex-1">{tab.label}</span>
                    {activeTab === tab.id && (
                       <div className="w-1.5 h-1.5 rounded-full bg-synapse-600 mr-1" />
                    )}
                 </button>
              ))}
           </div>

           {/* Main Content Area */}
           <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white relative">
              
              {/* Tab Content Animation Wrapper could go here */}
              <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* --- IMAGES TAB --- */}
                {activeTab === 'images' && (
                  <div className="space-y-8">
                     <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">Profile Visuals</h3>
                        <span className="text-sm text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Publicly visible</span>
                     </div>
                     
                     {/* Cover Photo Editor */}
                     <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Cover Photo</label>
                        <div className="group relative w-full h-48 md:h-64 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm transition-all hover:shadow-md">
                           {coverPreview ? (
                              <img src={coverPreview} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Cover" />
                           ) : (
                              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 bg-slate-50">
                                 <ImageIcon className="w-10 h-10 opacity-20" />
                                 <span className="text-sm font-medium">No cover photo set</span>
                              </div>
                           )}
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="secondary" className="bg-white/90 backdrop-blur-md text-slate-900 font-semibold shadow-lg hover:bg-white" onClick={() => coverInputRef.current?.click()}>
                                 <Camera className="w-4 h-4 mr-2" /> Change Cover
                              </Button>
                           </div>
                        </div>
                        <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverChange} />
                     </div>

                     {/* Profile Picture Editor */}
                     <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Profile Picture</label>
                        <div className="flex items-center gap-6 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                           <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                              <Avatar className="w-28 h-28 border-4 border-white shadow-lg ring-1 ring-slate-100 transition-transform group-hover:scale-105">
                                 <AvatarImage src={avatarPreview} />
                                 <AvatarFallback className="text-2xl bg-slate-200 text-slate-500">ME</AvatarFallback>
                              </Avatar>
                              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Camera className="w-8 h-8 text-white drop-shadow-md" />
                              </div>
                           </div>
                           <div className="flex-1 space-y-3">
                              <p className="text-sm text-slate-600 leading-relaxed">
                                 This helps people recognize you. It will appear on your posts, comments, and messages.
                              </p>
                              <div className="flex gap-3">
                                  <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl" onClick={() => avatarInputRef.current?.click()}>
                                     <UploadCloud className="w-4 h-4 mr-2" /> Upload New
                                  </Button>
                                  {avatarPreview && avatarPreview !== userProfile?.photoURL && (
                                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 rounded-xl" onClick={() => { setAvatarFile(null); setAvatarPreview(userProfile?.photoURL || ''); }}>
                                       Reset
                                    </Button>
                                  )}
                              </div>
                           </div>
                        </div>
                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                     </div>
                  </div>
                )}

                {/* --- BIO TAB --- */}
                {activeTab === 'bio' && (
                  <div className="space-y-8">
                     <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                           <h3 className="text-xl font-bold text-slate-900">Identity & Intro</h3>
                           <p className="text-slate-500 text-sm mt-1">Set your public display name and bio.</p>
                        </div>
                        <User className="w-10 h-10 text-indigo-100" />
                     </div>
                     
                     <div className="space-y-6">
                        <Input 
                           label="Display Name" 
                           value={formData.displayName || ''} 
                           onChange={(e) => handleChange('displayName', e.target.value)} 
                           placeholder="Your full name"
                           className="text-lg font-medium"
                        />

                        <div className="space-y-2">
                           <label className="text-sm font-bold text-slate-700 ml-1">Bio</label>
                           <div className="relative">
                              <textarea 
                                 className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-synapse-500/20 focus-visible:border-synapse-500 focus:bg-white transition-all min-h-[140px] resize-none"
                                 value={formData.bio || ''}
                                 onChange={(e) => handleChange('bio', e.target.value)}
                                 placeholder="Tell the world a little bit about yourself..."
                                 maxLength={101}
                              />
                              <div className="absolute bottom-3 right-3 text-xs font-semibold text-slate-400 bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm border border-slate-100">
                                 {formData.bio?.length || 0}/101
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* --- WORK & EDU TAB --- */}
                {activeTab === 'work_edu' && (
                  <div className="space-y-8">
                     <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                           <h3 className="text-xl font-bold text-slate-900">Experience</h3>
                           <p className="text-slate-500 text-sm mt-1">Share your professional and academic journey.</p>
                        </div>
                        <Briefcase className="w-10 h-10 text-amber-100" />
                     </div>
                     
                     <div className="grid gap-6 p-1">
                        <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                           <div className="flex items-center gap-2 mb-2">
                              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Briefcase className="w-4 h-4" /></div>
                              <h4 className="font-bold text-slate-900">Work</h4>
                           </div>
                           <Input 
                              label="Company" 
                              placeholder="e.g. Synapse Inc."
                              value={formData.work || ''} 
                              onChange={(e) => handleChange('work', e.target.value)} 
                              className="bg-white"
                           />
                           <Input 
                              label="Position" 
                              placeholder="e.g. Senior Developer"
                              value={formData.position || ''} 
                              onChange={(e) => handleChange('position', e.target.value)} 
                              className="bg-white"
                           />
                        </div>

                        <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                           <div className="flex items-center gap-2 mb-2">
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><User className="w-4 h-4" /></div>
                              <h4 className="font-bold text-slate-900">Education</h4>
                           </div>
                           <Input 
                              label="College / University" 
                              placeholder="e.g. Stanford University"
                              value={formData.education || ''} 
                              onChange={(e) => handleChange('education', e.target.value)} 
                              className="bg-white"
                           />
                           <Input 
                              label="High School" 
                              placeholder="e.g. Lincoln High School"
                              value={formData.highSchool || ''} 
                              onChange={(e) => handleChange('highSchool', e.target.value)} 
                              className="bg-white"
                           />
                        </div>
                     </div>
                  </div>
                )}

                {/* --- PLACES TAB --- */}
                {activeTab === 'places' && (
                  <div className="space-y-8">
                     <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                           <h3 className="text-xl font-bold text-slate-900">Locations</h3>
                           <p className="text-slate-500 text-sm mt-1">Where are you currently located?</p>
                        </div>
                        <MapPin className="w-10 h-10 text-emerald-100" />
                     </div>
                     <div className="space-y-6">
                        <Input 
                           label="Current City" 
                           placeholder="e.g. San Francisco, California"
                           value={formData.location || ''} 
                           onChange={(e) => handleChange('location', e.target.value)} 
                           icon={MapPin}
                        />
                        <Input 
                           label="Hometown" 
                           placeholder="e.g. Austin, Texas"
                           value={formData.hometown || ''} 
                           onChange={(e) => handleChange('hometown', e.target.value)} 
                           icon={MapPin}
                        />
                     </div>
                  </div>
                )}

                {/* --- INFO TAB --- */}
                {activeTab === 'contact_basic' && (
                  <div className="space-y-8">
                     <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                           <h3 className="text-xl font-bold text-slate-900">Basic Info</h3>
                           <p className="text-slate-500 text-sm mt-1">Manage your personal details.</p>
                        </div>
                        <Info className="w-10 h-10 text-blue-100" />
                     </div>
                     
                     <div className="space-y-6">
                        <Input 
                           label="Website" 
                           placeholder="https://yourwebsite.com"
                           value={formData.website || ''} 
                           onChange={(e) => handleChange('website', e.target.value)} 
                        />
                        
                        <div className="grid grid-cols-2 gap-6">
                           <Input 
                              label="Birth Date"
                              type="date"
                              value={formData.birthDate || ''}
                              onChange={(e) => handleChange('birthDate', e.target.value)}
                           />
                           <div className="space-y-1.5">
                              <label className="text-sm font-bold text-slate-700 ml-1">Gender</label>
                              <div className="relative">
                                 <select 
                                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
                                    value={formData.gender || ''}
                                    onChange={(e) => handleChange('gender', e.target.value)}
                                 >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Custom">Custom</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                 </select>
                                 <ChevronRight className="absolute right-3 top-3 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                              </div>
                           </div>
                        </div>

                        <Input 
                           label="Languages" 
                           placeholder="e.g. English, Spanish, French"
                           value={formData.languages || ''} 
                           onChange={(e) => handleChange('languages', e.target.value)} 
                        />
                        
                        <div className="p-4 bg-slate-50 rounded-2xl text-sm flex items-start gap-3 border border-slate-100">
                           <Info className="w-5 h-5 text-slate-400 mt-0.5" />
                           <div>
                              <span className="font-semibold text-slate-700">Account Email:</span> <span className="text-slate-600">{user?.email}</span>
                              <p className="text-slate-400 text-xs mt-1">To change your email, please visit Account Settings.</p>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* --- RELATIONSHIPS TAB --- */}
                {activeTab === 'relationships' && (
                  <div className="space-y-8">
                     <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                           <h3 className="text-xl font-bold text-slate-900">Family & Relationships</h3>
                           <p className="text-slate-500 text-sm mt-1">Share your relationship status.</p>
                        </div>
                        <Heart className="w-10 h-10 text-pink-100" />
                     </div>
                     <div className="space-y-4">
                        <div className="space-y-1.5">
                           <label className="text-sm font-bold text-slate-700 ml-1">Relationship Status</label>
                           <div className="relative">
                              <select 
                                 className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none text-[15px]"
                                 value={formData.relationshipStatus || 'Single'}
                                 onChange={(e) => handleChange('relationshipStatus', e.target.value)}
                              >
                                 <option value="Single">Single</option>
                                 <option value="In a relationship">In a relationship</option>
                                 <option value="Married">Married</option>
                                 <option value="Complicated">It's complicated</option>
                                 <option value="Divorced">Divorced</option>
                                 <option value="Widowed">Widowed</option>
                              </select>
                              <ChevronRight className="absolute right-4 top-4 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                           </div>
                        </div>
                        
                        <div className="p-6 bg-slate-50 text-slate-500 text-sm rounded-3xl border border-dashed border-slate-200 text-center flex flex-col items-center gap-3 mt-6">
                           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                              <Heart className="w-6 h-6 text-pink-300" />
                           </div>
                           <p>Family member linking is coming in the next update.</p>
                        </div>
                     </div>
                  </div>
                )}

              </div>
           </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-8 py-5 border-t border-slate-100 bg-white/80 backdrop-blur-md flex-shrink-0">
          <div className="flex gap-3 w-full sm:w-auto">
             <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-xl hover:bg-slate-100 text-slate-600 font-medium">Cancel</Button>
             <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto px-8 bg-synapse-600 hover:bg-synapse-700 text-white rounded-xl shadow-lg shadow-synapse-500/20 font-semibold transition-all hover:scale-[1.02]">
               {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
               Save Changes
             </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};