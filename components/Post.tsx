import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe, 
  Trash2, AlertCircle, EyeOff, Send, Smile, Camera, X, MessageSquare 
} from 'lucide-react';
import { Post as PostType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { 
  doc, updateDoc, increment, arrayUnion, arrayRemove, 
  collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Card } from './ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { Button } from './ui/Button';
import { Separator } from './ui/Separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/DropdownMenu';
import { cn } from '../lib/utils';

interface Comment {
  id: string;
  text: string;
  author: {
    uid: string;
    name: string;
    avatar: string;
  };
  timestamp: any;
}

export const Post: React.FC<{ post: PostType }> = ({ post }) => {
  const { user, userProfile } = useAuth();
  
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Optimistic UI state
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const displayImages = post.images || (post.image ? [post.image] : []);

  useEffect(() => {
    if (user) {
      setIsLiked(post.likedByUsers?.includes(user.uid) || false);
    }
    setLikeCount(post.likes);
  }, [post.likedByUsers, post.likes, user]);

  const isAuthor = user?.uid === post.author.uid;

  useEffect(() => {
    if (showComments) {
      const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('timestamp', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[]);
      });
      return () => unsubscribe();
    }
  }, [showComments, post.id]);

  const handleLike = async () => {
    if (!user) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

    const postRef = doc(db, 'posts', post.id);
    try {
      if (!newLikedState) {
        await updateDoc(postRef, { likes: increment(-1), likedByUsers: arrayRemove(user.uid) });
      } else {
        await updateDoc(postRef, { likes: increment(1), likedByUsers: arrayUnion(user.uid) });
      }
    } catch (error) {
      console.error("Error updating like:", error);
      setIsLiked(!newLikedState);
      setLikeCount(prev => !newLikedState ? prev + 1 : prev - 1);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    const tempComment = commentText;
    setCommentText('');

    try {
      await addDoc(collection(db, 'posts', post.id, 'comments'), {
        text: tempComment,
        author: {
          uid: user.uid,
          name: userProfile?.displayName || user.displayName || 'User',
          avatar: userProfile?.photoURL || user.photoURL || ''
        },
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, 'posts', post.id), { comments: increment(1) });
    } catch (error) {
      console.error("Error adding comment:", error);
      setCommentText(tempComment);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', post.id));
    } catch (error) {
      console.error("Error deleting post:", error);
      setIsDeleting(false);
    }
  };

  const getTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '').replace('less than a minute ago', 'Just now');
  };

  // --- Photo Grid Layout Logic ---
  const renderPhotoGrid = () => {
    if (displayImages.length === 1) {
      return (
         <div className="w-full bg-slate-50 border-t border-b border-slate-100 flex items-center justify-center max-h-[700px] overflow-hidden cursor-pointer">
            <img src={displayImages[0]} alt="" className="w-full h-auto max-h-[700px] object-cover" />
         </div>
      );
    } else if (displayImages.length === 2) {
      return (
         <div className="w-full h-[350px] flex border-t border-b border-slate-100 cursor-pointer">
            <img src={displayImages[0]} className="w-1/2 h-full object-cover border-r border-white" />
            <img src={displayImages[1]} className="w-1/2 h-full object-cover" />
         </div>
      );
    } else if (displayImages.length === 3) {
      return (
         <div className="w-full h-[400px] flex border-t border-b border-slate-100 cursor-pointer">
            <div className="w-2/3 h-full border-r border-white">
               <img src={displayImages[0]} className="w-full h-full object-cover" />
            </div>
            <div className="w-1/3 h-full flex flex-col">
               <img src={displayImages[1]} className="w-full h-1/2 object-cover border-b border-white" />
               <img src={displayImages[2]} className="w-full h-1/2 object-cover" />
            </div>
         </div>
      );
    } else if (displayImages.length >= 4) {
      return (
         <div className="w-full h-[400px] flex border-t border-b border-slate-100 cursor-pointer">
            <div className="w-2/3 h-full border-r border-white">
               <img src={displayImages[0]} className="w-full h-full object-cover" />
            </div>
            <div className="w-1/3 h-full flex flex-col">
               <img src={displayImages[1]} className="w-full h-1/3 object-cover border-b border-white" />
               <img src={displayImages[2]} className="w-full h-1/3 object-cover border-b border-white" />
               <div className="w-full h-1/3 relative">
                  <img src={displayImages[3]} className="w-full h-full object-cover" />
                  {displayImages.length > 4 && (
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-2xl">
                        +{displayImages.length - 4}
                     </div>
                  )}
               </div>
            </div>
         </div>
      );
    }
  };

  if (isDeleting) return null;

  return (
    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden animate-in fade-in duration-300">
      
      {/* --- Header --- */}
      <div className="p-3 pb-2 flex justify-between items-start">
        <div className="flex gap-2.5">
           <Avatar className="h-10 w-10 cursor-pointer hover:brightness-95">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>{post.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
           </Avatar>
           <div className="flex flex-col pt-0.5">
              <div className="font-semibold text-slate-900 text-[15px] leading-tight">
                 <span className="hover:underline cursor-pointer">{post.author.name}</span>
                 {/* Feeling / Location / Tag Metadata */}
                 {(post.feeling || post.location || (post.taggedUsers && post.taggedUsers.length > 0)) && (
                    <span className="font-normal text-slate-600">
                       {post.feeling && ` is ${post.feeling}`}
                       {post.taggedUsers && post.taggedUsers.length > 0 && ` is with ${post.taggedUsers[0]} ${post.taggedUsers.length > 1 ? `and ${post.taggedUsers.length - 1} others` : ''}`}
                       {post.location && ` at ${post.location}`}
                    </span>
                 )}
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-[13px]">
                 <span className="hover:underline cursor-pointer">
                    {getTimestamp(post.timestamp)}
                 </span>
                 <span className="text-[10px] font-bold">·</span>
                 <Globe className="w-3 h-3" />
              </div>
           </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 -mr-2">
               <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-xl border-slate-100">
             <DropdownMenuItem className="gap-3 cursor-pointer font-medium py-2 rounded-lg"><Share2 className="w-5 h-5" /> Save post</DropdownMenuItem>
             <DropdownMenuSeparator className="bg-slate-100" />
             {isAuthor && (
               <DropdownMenuItem onClick={handleDeletePost} className="gap-3 cursor-pointer font-medium py-2 text-red-600 rounded-lg">
                 <Trash2 className="w-5 h-5" /> Move to trash
               </DropdownMenuItem>
             )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- Content --- */}
      {post.background && !displayImages.length && !post.gif ? (
         // Background Post
         <div className={`w-full min-h-[350px] flex items-center justify-center p-8 text-center ${post.background}`}>
            <p className="whitespace-pre-wrap">{post.content}</p>
         </div>
      ) : (
         // Standard Post
         <div className="px-3 pb-3">
            <p className="text-[15px] text-slate-900 leading-normal whitespace-pre-wrap">{post.content}</p>
         </div>
      )}

      {/* --- Images / GIF --- */}
      {renderPhotoGrid()}
      
      {post.gif && (
        <div className="w-full bg-slate-50 border-t border-b border-slate-100">
           <img src={post.gif} className="w-full h-auto object-cover" />
        </div>
      )}

      {/* --- Stats --- */}
      <div className="px-4 py-2.5 flex items-center justify-between">
         <div className="flex items-center gap-1.5 cursor-pointer hover:underline decoration-slate-500">
             {likeCount > 0 && (
                <div className="bg-synapse-600 rounded-full p-1 flex items-center justify-center shadow-sm">
                   <ThumbsUp className="w-2.5 h-2.5 text-white fill-current" />
                </div>
             )}
             <span className="text-slate-500 text-[15px]">{likeCount > 0 ? likeCount : 'Be the first to like this'}</span>
         </div>
         <div className="flex items-center gap-3 text-slate-500 text-[15px]">
            {post.comments > 0 && <span onClick={() => setShowComments(true)} className="hover:underline cursor-pointer">{post.comments} comments</span>}
         </div>
      </div>

      <div className="px-3"><Separator className="bg-slate-200" /></div>

      {/* --- Actions --- */}
      <div className="px-2 py-1 flex items-center justify-between">
         <Button variant="ghost" onClick={handleLike} className={cn("flex-1 gap-2 font-semibold text-[15px] hover:bg-slate-100 rounded-lg h-9 transition-colors select-none", isLiked ? "text-synapse-600" : "text-slate-600")}>
            <ThumbsUp className={cn("w-5 h-5 mb-0.5", isLiked && "fill-current")} /> Like
         </Button>
         <Button variant="ghost" onClick={() => setShowComments(!showComments)} className="flex-1 gap-2 font-semibold text-[15px] text-slate-600 hover:bg-slate-100 rounded-lg h-9 transition-colors select-none">
            <MessageSquare className="w-5 h-5 mb-0.5 scale-x-[-1]" /> Comment
         </Button>
         <Button variant="ghost" className="flex-1 gap-2 font-semibold text-[15px] text-slate-600 hover:bg-slate-100 rounded-lg h-9 transition-colors select-none">
            <Share2 className="w-5 h-5 mb-0.5" /> Share
         </Button>
      </div>

      <div className="px-3"><Separator className="bg-slate-200" /></div>

      {/* --- Comments --- */}
      {(showComments || comments.length > 0) && (
         <div className="px-4 pb-4 pt-3">
            <div className="space-y-3 mb-4">
               {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 group">
                     <Avatar className="w-8 h-8 mt-0.5"><AvatarImage src={comment.author.avatar} /><AvatarFallback>{comment.author.name[0]}</AvatarFallback></Avatar>
                     <div className="flex-1 max-w-[90%]">
                        <div className="bg-[#F0F2F5] rounded-2xl px-3 py-2 inline-block relative">
                           <span className="font-semibold text-[13px] text-slate-900 block">{comment.author.name}</span>
                           <span className="text-[15px] text-slate-900 leading-snug">{comment.text}</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
            <div className="flex gap-2 items-start pt-1">
               <Avatar className="w-8 h-8 mt-1"><AvatarImage src={userProfile?.photoURL || user?.photoURL || ''} /><AvatarFallback>ME</AvatarFallback></Avatar>
               <form onSubmit={handleComment} className="flex-1 relative bg-[#F0F2F5] rounded-2xl flex items-center transition-all focus-within:ring-1 focus-within:ring-slate-300">
                  <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="bg-transparent border-none focus:ring-0 w-full px-3 py-2 text-[15px] text-slate-900 rounded-2xl" />
                  <div className="flex items-center gap-2 pr-3 text-slate-500">
                     <button type="submit" disabled={!commentText.trim()} className="p-1 rounded-full text-synapse-600 hover:bg-slate-200 disabled:text-transparent"><Send className="w-4 h-4" /></button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </Card>
  );
};