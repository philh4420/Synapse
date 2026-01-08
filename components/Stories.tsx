import React, { useEffect, useState, useRef } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from './ui/Card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';
import { collection, query, orderBy, onSnapshot, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Story } from '../types';
import { uploadToCloudinary } from '../utils/upload';

export const Stories: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch stories from Firestore, ordered by newest first
    const q = query(
      collection(db, 'stories'), 
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedStories = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        };
      }) as Story[];
      
      setStories(fetchedStories);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      
      await addDoc(collection(db, 'stories'), {
        uid: user.uid,
        displayName: userProfile?.displayName || user.displayName || 'User',
        avatar: userProfile?.photoURL || user.photoURL || '',
        image: imageUrl,
        timestamp: serverTimestamp()
      });

    } catch (error) {
      console.error("Error creating story:", error);
      alert("Failed to upload story.");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar h-[250px] items-center px-4">
        <Loader2 className="w-8 h-8 animate-spin text-synapse-400 mx-auto" />
      </div>
    );
  }

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
      {/* Create Story Card */}
      <Card 
        onClick={triggerFileInput}
        className="min-w-[140px] w-[140px] h-[250px] flex-shrink-0 relative overflow-hidden group cursor-pointer border-0 shadow-sm hover:shadow-md transition-all"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleCreateStory} 
          accept="image/*" 
          className="hidden" 
        />
        
        <div className="h-[75%] w-full relative">
            <img 
                src={userProfile?.photoURL || user?.photoURL || ''} 
                alt="Me" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-slate-200"
            />
            {uploading ? (
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
               </div>
            ) : (
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            )}
        </div>
        <div className="h-[25%] bg-white relative pt-6 text-center">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-synapse-600 p-1 rounded-full border-4 border-white">
                <Plus className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-900">Create story</p>
        </div>
      </Card>

      {/* Real Stories from DB */}
      {stories.map(story => (
        <Card key={story.id} className="min-w-[140px] w-[140px] h-[250px] flex-shrink-0 relative overflow-hidden group cursor-pointer border-0 shadow-sm hover:shadow-md transition-all bg-slate-800">
            <img 
                src={story.image} 
                alt={story.displayName} 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
            
            <div className="absolute top-3 left-3">
                <Avatar className="w-10 h-10 border-4 border-synapse-600 ring-2 ring-black/20">
                    <AvatarImage src={story.avatar} />
                    <AvatarFallback>{story.displayName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
            </div>
            
            <div className="absolute bottom-3 left-3 text-white font-semibold text-sm drop-shadow-md truncate w-[90%]">
                {story.displayName}
            </div>
        </Card>
      ))}
    </div>
  );
};