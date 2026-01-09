
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Plus, Search, Globe, Lock, MoreHorizontal, 
  Settings, ArrowLeft, Loader2, Image as ImageIcon, Camera,
  LogOut, UserPlus, UserCheck, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, 
  updateDoc, doc, arrayUnion, arrayRemove, where, getDoc, getDocs 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Community, Post as PostType } from '../types';
import { uploadToCloudinary } from '../utils/upload';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { CreatePost } from './CreatePost';
import { Post } from './Post';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/Dialog';
import { cn } from '../lib/utils';

interface CommunitiesPageProps {
  viewedCommunityId?: string | null;
  onViewCommunity?: (id: string | null) => void;
}

export const CommunitiesPage: React.FC<CommunitiesPageProps> = ({ viewedCommunityId, onViewCommunity }) => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Single Community View State
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [communityPosts, setCommunityPosts] = useState<PostType[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Create Community State
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCommunity, setNewCommunity] = useState({ name: '', description: '', privacy: 'public' as const });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch All Communities
  useEffect(() => {
    const q = query(collection(db, 'communities'), orderBy('memberCount', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Community[];
      
      setAllCommunities(comms);
      if (user) {
        setMyCommunities(comms.filter(c => c.members.includes(user.uid)));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Handle View specific community
  useEffect(() => {
    if (viewedCommunityId) {
      const comm = allCommunities.find(c => c.id === viewedCommunityId);
      if (comm) {
        setActiveCommunity(comm);
        fetchCommunityPosts(comm.id);
      } else {
        // Fallback fetch if not in list yet
        getDoc(doc(db, 'communities', viewedCommunityId)).then(snap => {
          if (snap.exists()) {
            const data = { id: snap.id, ...snap.data() } as Community;
            setActiveCommunity(data);
            fetchCommunityPosts(data.id);
          }
        });
      }
    } else {
      setActiveCommunity(null);
    }
  }, [viewedCommunityId, allCommunities]);

  const fetchCommunityPosts = (communityId: string) => {
    setPostsLoading(true);
    const q = query(
      collection(db, 'posts'),
      where('communityId', '==', communityId),
      orderBy('timestamp', 'desc')
    );
    
    // Using onSnapshot for real-time feed updates
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as PostType[];
      setCommunityPosts(posts);
      setPostsLoading(false);
    });
  };

  const handleCreateCommunity = async () => {
    if (!user || !newCommunity.name) return;
    
    setIsSubmitting(true);
    try {
      let coverURL = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200"; 
      if (coverFile) {
        coverURL = await uploadToCloudinary(coverFile);
      }

      await addDoc(collection(db, 'communities'), {
        ...newCommunity,
        coverURL,
        createdBy: user.uid,
        members: [user.uid],
        memberCount: 1,
        timestamp: serverTimestamp()
      });

      toast("Community created successfully!", "success");
      setIsCreating(false);
      setNewCommunity({ name: '', description: '', privacy: 'public' });
      setCoverFile(null);
      setCoverPreview('');
    } catch (error) {
      console.error(error);
      toast("Failed to create community", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinLeave = async (e: React.MouseEvent, communityId: string, isMember: boolean) => {
    e.stopPropagation();
    if (!user) return;
    
    try {
      const commRef = doc(db, 'communities', communityId);
      if (isMember) {
        await updateDoc(commRef, {
          members: arrayRemove(user.uid),
          memberCount: (activeCommunity?.memberCount || 1) - 1
        });
        toast("Left community", "info");
      } else {
        await updateDoc(commRef, {
          members: arrayUnion(user.uid),
          memberCount: (activeCommunity?.memberCount || 0) + 1
        });
        toast("Joined community!", "success");
      }
    } catch (e) {
      console.error(e);
      toast("Action failed", "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // --- Render Single Community View ---
  if (activeCommunity) {
    const isMember = user && activeCommunity.members.includes(user.uid);
    const isAdmin = user && activeCommunity.createdBy === user.uid;

    return (
      <div className="animate-in fade-in duration-500 pb-20">
        {/* Header */}
        <div className="bg-white rounded-b-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-6 relative">
           <div className="h-48 md:h-64 w-full bg-slate-100 relative">
              <img src={activeCommunity.coverURL} className="w-full h-full object-cover" alt="Cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onViewCommunity && onViewCommunity(null)}
                className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md"
              >
                 <ArrowLeft className="w-5 h-5" />
              </Button>
           </div>
           
           <div className="px-6 md:px-10 pb-6 relative">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 -mt-10 md:-mt-12 relative z-10">
                 <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 md:text-white md:drop-shadow-lg leading-tight mb-2">
                       {activeCommunity.name}
                    </h1>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-500 md:text-white/90">
                       <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {activeCommunity.memberCount} members</span>
                       <span className="flex items-center gap-1.5">
                          {activeCommunity.privacy === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />} 
                          {activeCommunity.privacy === 'public' ? 'Public' : 'Private'} Group
                       </span>
                    </div>
                 </div>
                 
                 <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Button 
                       onClick={(e) => handleJoinLeave(e, activeCommunity.id, !!isMember)}
                       className={cn(
                          "flex-1 md:flex-none font-bold rounded-xl shadow-lg",
                          isMember 
                             ? "bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600" 
                             : "bg-synapse-600 hover:bg-synapse-700 text-white"
                       )}
                    >
                       {isMember ? (
                          <><LogOut className="w-4 h-4 mr-2" /> Leave</>
                       ) : (
                          <><UserPlus className="w-4 h-4 mr-2" /> Join Group</>
                       )}
                    </Button>
                    {isMember && (
                       <Button variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl">
                          <MoreHorizontal className="w-5 h-5" />
                       </Button>
                    )}
                 </div>
              </div>
              
              <div className="mt-6 text-slate-600 text-sm md:text-base max-w-3xl leading-relaxed">
                 {activeCommunity.description}
              </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 px-4">
           {/* Feed */}
           <div className="space-y-6">
              {isMember && <CreatePost communityId={activeCommunity.id} placeholder="Write something..." />}
              
              {postsLoading ? (
                 <div className="space-y-4">
                    {[1,2].map(i => <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />)}
                 </div>
              ) : communityPosts.length > 0 ? (
                 <div className="space-y-4">
                    {communityPosts.map(post => <Post key={post.id} post={post} />)}
                 </div>
              ) : (
                 <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
                    <p className="text-slate-500 font-medium">No posts yet. Be the first to share!</p>
                 </div>
              )}
           </div>

           {/* Sidebar Info */}
           <div className="space-y-6 hidden lg:block">
              <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
                 <h3 className="font-bold text-slate-900 mb-4">About</h3>
                 <p className="text-sm text-slate-600 mb-4">{activeCommunity.description}</p>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                       <Globe className="w-5 h-5 text-slate-400" />
                       <div>
                          <p className="font-bold">Public</p>
                          <p className="text-xs text-slate-500">Anyone can see who's in the group and what they post.</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                       <Shield className="w-5 h-5 text-slate-400" />
                       <div>
                          <p className="font-bold">General</p>
                          <p className="text-xs text-slate-500">Created by Synapse Member</p>
                       </div>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  // --- Main Discovery View ---
  return (
    <div className="animate-in fade-in duration-500 pb-24">
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2">
          <div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">Communities</h1>
             <p className="text-slate-500">Find groups that spark your interest.</p>
          </div>
          <Button 
             onClick={() => setIsCreating(true)}
             className="bg-synapse-600 hover:bg-synapse-700 text-white rounded-xl shadow-lg font-bold px-6 h-11"
          >
             <Plus className="w-5 h-5 mr-2" /> Create Community
          </Button>
       </div>

       {/* Your Communities */}
       {myCommunities.length > 0 && (
          <div className="mb-10">
             <h2 className="text-xl font-bold text-slate-900 mb-4 px-2">Your Groups</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCommunities.map(comm => (
                   <CommunityCard 
                      key={comm.id} 
                      community={comm} 
                      isMember={true} 
                      onView={() => onViewCommunity && onViewCommunity(comm.id)} 
                   />
                ))}
             </div>
          </div>
       )}

       {/* Discover */}
       <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4 px-2">Suggested for you</h2>
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />)}
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCommunities.filter(c => !c.members.includes(user?.uid || '')).map(comm => (
                   <CommunityCard 
                      key={comm.id} 
                      community={comm} 
                      isMember={false} 
                      onJoin={(e) => handleJoinLeave(e, comm.id, false)}
                      onView={() => onViewCommunity && onViewCommunity(comm.id)} 
                   />
                ))}
                {allCommunities.length === 0 && (
                   <div className="col-span-full py-20 text-center text-slate-400">
                      <p>No communities found. Be the first to create one!</p>
                   </div>
                )}
             </div>
          )}
       </div>

       {/* Create Dialog */}
       <Dialog open={isCreating} onOpenChange={setIsCreating}>
         <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
               <DialogTitle>Create Community</DialogTitle>
               <DialogDescription>Start a new group for people with shared interests.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
               {/* Cover Upload */}
               <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full h-32 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-synapse-400 transition-colors"
               >
                  {coverPreview ? (
                     <img src={coverPreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                     <div className="flex flex-col items-center text-slate-400">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span className="text-xs font-bold">Add Cover Photo</span>
                     </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
               </div>

               <Input 
                  label="Name" 
                  placeholder="e.g. Graphic Designers" 
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})}
               />
               <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
                  <textarea 
                     className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px] resize-none"
                     placeholder="What is this group about?"
                     value={newCommunity.description}
                     onChange={(e) => setNewCommunity({...newCommunity, description: e.target.value})}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Privacy</label>
                  <select 
                     className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                     value={newCommunity.privacy}
                     onChange={(e) => setNewCommunity({...newCommunity, privacy: e.target.value as any})}
                  >
                     <option value="public">Public</option>
                     <option value="private">Private</option>
                  </select>
               </div>
            </div>

            <DialogFooter>
               <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
               <Button onClick={handleCreateCommunity} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create"}
               </Button>
            </DialogFooter>
         </DialogContent>
       </Dialog>
    </div>
  );
};

const CommunityCard: React.FC<{ 
  community: Community, 
  isMember: boolean, 
  onJoin?: (e: React.MouseEvent) => void,
  onView: () => void 
}> = ({ community, isMember, onJoin, onView }) => {
   return (
      <Card 
         className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
         onClick={onView}
      >
         <div className="h-32 bg-slate-100 relative overflow-hidden">
            <img 
               src={community.coverURL} 
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
               alt="" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
         </div>
         <div className="p-4">
            <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1 truncate">{community.name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
               <span>{community.memberCount} members</span>
               <span>•</span>
               <span>{community.privacy === 'public' ? 'Public' : 'Private'}</span>
            </div>
            
            {isMember ? (
               <Button variant="secondary" className="w-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">
                  View Group
               </Button>
            ) : (
               <Button 
                  onClick={onJoin}
                  className="w-full bg-slate-100 hover:bg-synapse-50 text-synapse-600 hover:text-synapse-700 font-bold border border-slate-200 hover:border-synapse-200"
               >
                  Join Group
               </Button>
            )}
         </div>
      </Card>
   );
};
