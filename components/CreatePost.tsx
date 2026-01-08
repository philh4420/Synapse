import React, { useState, useRef } from 'react';
import { Image, Video, Link2, Smile, Send, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';
import { uploadToCloudinary } from '../utils/upload';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface CreatePostProps {
  // onPost prop is removed as we handle logic internally now
}

export const CreatePost: React.FC<CreatePostProps> = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsFocused(true);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if ((!content.trim() && !selectedImage) || isUploading || !user) return;
    
    setIsUploading(true);
    try {
      let imageUrl = undefined;
      if (selectedImage) {
        imageUrl = await uploadToCloudinary(selectedImage);
      }
      
      // Save post to Firestore
      await addDoc(collection(db, 'posts'), {
        author: {
          name: user.displayName || 'Anonymous',
          handle: user.email ? `@${user.email.split('@')[0]}` : '@user',
          avatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`,
          uid: user.uid
        },
        content: content,
        image: imageUrl || null,
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0,
        likedByUsers: []
      });
      
      // Reset form
      setContent('');
      removeImage();
      setIsFocused(false);
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to post. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className={`p-5 transition-all duration-300 ${isFocused ? 'shadow-xl shadow-synapse-500/10 ring-1 ring-synapse-100' : ''}`}>
      <div className="flex gap-4">
        <Avatar className="h-11 w-11 ring-2 ring-slate-50">
            <AvatarImage src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} />
            <AvatarFallback>{user?.displayName?.substring(0,2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={`What's on your mind, ${user?.displayName?.split(' ')[0]}?`}
            className="w-full bg-slate-50/50 rounded-xl p-3 min-h-[50px] focus:min-h-[100px] transition-all duration-300 resize-none outline-none text-slate-700 placeholder-slate-400"
          />
          
          {previewUrl && (
            <div className="relative mt-3 rounded-xl overflow-hidden group">
              <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
              <button 
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className={`
            flex items-center justify-between mt-3 overflow-hidden transition-all duration-300
            ${isFocused || content || previewUrl ? 'opacity-100 max-h-14 pt-2' : 'opacity-0 max-h-0'}
          `}>
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="text-synapse-600 bg-synapse-50 hover:bg-synapse-100 transition-colors"
                title="Add Photo"
              >
                <Image className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-pink-600 bg-pink-50 hover:bg-pink-100 transition-colors">
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                <Link2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-yellow-600 bg-yellow-50 hover:bg-yellow-100 transition-colors">
                <Smile className="w-5 h-5" />
              </Button>
            </div>
            
            <Button 
              size="sm" 
              onClick={handleSubmit} 
              disabled={(!content.trim() && !selectedImage) || isUploading}
              className="rounded-lg px-6"
            >
              {isUploading ? (
                <>Posting <Loader2 className="w-3 h-3 ml-2 animate-spin" /></>
              ) : (
                <>Post <Send className="w-3 h-3 ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};