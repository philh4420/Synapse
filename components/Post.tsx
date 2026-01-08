import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Send } from 'lucide-react';
import { Post as PostType, UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { 
  doc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Card } from './ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { Button } from './ui/Button';

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
  
  // Check if current user has already liked this post
  const isLiked = user ? post.likedByUsers?.includes(user.uid) : false;

  useEffect(() => {
    if (showComments) {
      const q = query(
        collection(db, 'posts', post.id, 'comments'), 
        orderBy('timestamp', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setComments(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[]);
      });
      return () => unsubscribe();
    }
  }, [showComments, post.id]);

  const handleLike = async () => {
    if (!user) return;

    const postRef = doc(db, 'posts', post.id);

    try {
      if (isLiked) {
        // Unlike
        await updateDoc(postRef, {
          likes: increment(-1),
          likedByUsers: arrayRemove(user.uid)
        });
      } else {
        // Like
        await updateDoc(postRef, {
          likes: increment(1),
          likedByUsers: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    try {
      await addDoc(collection(db, 'posts', post.id, 'comments'), {
        text: commentText,
        author: {
          uid: user.uid,
          name: userProfile?.displayName || user.displayName || 'User',
          avatar: userProfile?.photoURL || user.photoURL || ''
        },
        timestamp: serverTimestamp()
      });
      
      // Update comment count on post
      await updateDoc(doc(db, 'posts', post.id), {
        comments: increment(1)
      });
      
      setCommentText('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <div className="p-5 pb-2">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-slate-50">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-slate-900 leading-tight hover:text-synapse-600 cursor-pointer transition-colors">
                {post.author.name}
              </h3>
              <p className="text-sm text-slate-500">
                {post.author.handle} · {post.timestamp ? formatDistanceToNow(post.timestamp, { addSuffix: true }) : 'Just now'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap break-words">
          {post.content}
        </p>

        {post.image && (
          <div className="mb-2 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <img src={post.image} alt="Post content" className="w-full h-auto hover:scale-105 transition-transform duration-500" />
          </div>
        )}
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex gap-4">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLike}
                className={`flex items-center gap-2 font-medium hover:bg-transparent px-0 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-slate-500 hover:text-red-500'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes}</span>
            </Button>
            
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 font-medium text-slate-500 hover:text-synapse-600 hover:bg-transparent px-0"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex items-center gap-2 font-medium text-slate-500 hover:text-green-600 hover:bg-transparent px-0">
              <Share2 className="w-5 h-5" />
              <span>{post.shares}</span>
            </Button>
          </div>
          
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-synapse-600 hover:bg-slate-50">
            <Bookmark className="w-5 h-5" />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-50 animate-in slide-in-from-top-2">
            
            {/* Comment List */}
            <div className="space-y-4 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                   <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
                   </Avatar>
                   <div className="flex-1">
                      <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 inline-block">
                         <span className="font-semibold text-sm text-slate-900 block">{comment.author.name}</span>
                         <span className="text-sm text-slate-700">{comment.text}</span>
                      </div>
                      <div className="flex gap-4 mt-1 ml-2 text-xs text-slate-400 font-medium">
                        <button className="hover:text-slate-600">Like</button>
                        <button className="hover:text-slate-600">Reply</button>
                        <span>{comment.timestamp ? formatDistanceToNow(comment.timestamp.toDate(), { addSuffix: true }) : 'Just now'}</span>
                      </div>
                   </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-2">No comments yet. Be the first!</p>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleComment} className="flex gap-3 items-start">
               <Avatar className="h-9 w-9">
                  <AvatarImage src={userProfile?.photoURL || user?.photoURL || ''} />
                  <AvatarFallback>ME</AvatarFallback>
               </Avatar>
               <div className="flex-1 relative">
                 <input 
                    type="text" 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..." 
                    className="w-full bg-slate-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-synapse-400 pr-10"
                 />
                 <button 
                    type="submit"
                    disabled={!commentText.trim()} 
                    className="absolute right-2 top-2 text-synapse-600 hover:bg-synapse-100 p-1 rounded-full disabled:opacity-50 disabled:hover:bg-transparent"
                 >
                    <Send className="w-4 h-4" />
                 </button>
               </div>
            </form>

          </div>
        )}
      </div>
    </Card>
  );
};