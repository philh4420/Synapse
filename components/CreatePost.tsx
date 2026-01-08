import React, { useState, useRef } from 'react';
import { Image, Video, Smile, X, Loader2, Globe, MapPin, UserPlus, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';
import { Separator } from './ui/Separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
  DialogClose
} from './ui/Dialog';
import { uploadToCloudinary } from '../utils/upload';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const CreatePost: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Auto-open dialog if image selected from main card
      if (!isOpen) setIsOpen(true);
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
      
      await addDoc(collection(db, 'posts'), {
        author: {
          name: userProfile?.displayName || user.displayName || 'Anonymous',
          handle: user.email ? `@${user.email.split('@')[0]}` : '@user',
          avatar: userProfile?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`,
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
      
      // Reset
      setContent('');
      removeImage();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerImageUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOpen) {
      fileInputRef.current?.click();
    } else {
      setIsOpen(true);
      setTimeout(() => fileInputRef.current?.click(), 100);
    }
  };

  const firstName = userProfile?.displayName?.split(' ')[0] || 'User';

  return (
    <Card className="px-4 pt-3 pb-2 shadow-sm border-slate-200 bg-white rounded-xl">
      <div className="flex gap-3 mb-3">
        <Avatar className="h-10 w-10 cursor-pointer hover:brightness-95 transition-all">
          <AvatarImage src={userProfile?.photoURL || user?.photoURL || ''} />
          <AvatarFallback>{firstName[0]}</AvatarFallback>
        </Avatar>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <div className="flex-1 bg-[#F0F2F5] hover:bg-[#E4E6E9] rounded-full px-4 py-2.5 cursor-pointer transition-colors text-slate-500 hover:text-slate-600 text-[15px] select-none flex items-center">
              What's on your mind, {firstName}?
            </div>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden rounded-xl">
            <DialogHeader className="p-4 border-b border-slate-200 relative flex items-center justify-center">
              <DialogTitle className="text-center text-[20px] font-bold text-slate-900">Create Post</DialogTitle>
            </DialogHeader>
            
            <div className="p-4 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-300">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userProfile?.photoURL || user?.photoURL || ''} />
                  <AvatarFallback>{firstName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-[15px] text-slate-900">{userProfile?.displayName}</div>
                  <div className="flex items-center gap-1 bg-slate-200/60 hover:bg-slate-200 rounded-md px-2 py-0.5 text-xs font-semibold text-slate-600 w-fit mt-0.5 cursor-pointer">
                     <Globe className="w-3 h-3" />
                     <span>Public</span>
                     <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Input */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What's on your mind, ${firstName}?`}
                className="w-full min-h-[150px] text-[24px] placeholder:text-slate-500 text-slate-900 resize-none outline-none border-none focus:ring-0 p-0 leading-normal"
                autoFocus
              />

              {/* Image Preview */}
              {previewUrl && (
                <div className="relative mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                     <button className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm transition-colors">
                        Edit
                     </button>
                     <button 
                      onClick={removeImage}
                      className="bg-white hover:bg-slate-100 p-1.5 rounded-full shadow-sm transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-700" />
                    </button>
                  </div>
                  <img src={previewUrl} alt="Preview" className="w-full max-h-[400px] object-contain" />
                </div>
              )}
              
              {/* Add to Post Widget */}
              <div className="mt-4 border border-slate-300 rounded-lg p-3 flex items-center justify-between shadow-sm">
                 <span className="font-semibold text-[15px] text-slate-900 pl-1 cursor-default">Add to your post</span>
                 <div className="flex gap-1">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-[#45BD62] relative group"
                    >
                       <Image className="w-6 h-6" />
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Photo/Video</div>
                    </div>
                    <div className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-[#1877F2]">
                       <UserPlus className="w-6 h-6" />
                    </div>
                    <div className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-[#F7B928]">
                       <Smile className="w-6 h-6" />
                    </div>
                    <div className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-[#F5533D]">
                       <MapPin className="w-6 h-6" />
                    </div>
                 </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-slate-200">
              <Button 
                onClick={handleSubmit} 
                disabled={(!content.trim() && !selectedImage) || isUploading}
                className="w-full bg-synapse-600 hover:bg-synapse-700 text-white font-semibold h-9 rounded-lg text-[15px] disabled:bg-slate-200 disabled:text-slate-400"
              >
                {isUploading ? (
                  <>Posting <Loader2 className="w-4 h-4 ml-2 animate-spin" /></>
                ) : (
                  "Post"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="bg-slate-200/60" />

      <div className="flex items-center justify-between pt-1">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500 font-semibold text-[15px]">
           <Video className="w-6 h-6 text-[#F02849]" />
           <span className="hidden sm:inline text-slate-600">Live video</span>
        </button>
        <button 
          onClick={triggerImageUpload}
          className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500 font-semibold text-[15px]"
        >
           <Image className="w-6 h-6 text-[#45BD62]" />
           <span className="hidden sm:inline text-slate-600">Photo/video</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500 font-semibold text-[15px]">
           <Smile className="w-6 h-6 text-[#F7B928]" />
           <span className="hidden sm:inline text-slate-600">Feeling/activity</span>
        </button>
      </div>
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />
    </Card>
  );
};