import React from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark } from 'lucide-react';
import { Post as PostType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Card, CardContent, CardFooter, CardHeader } from './ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { Button } from './ui/Button';

export const Post: React.FC<{ post: PostType }> = ({ post }) => {
  const { user } = useAuth();
  
  // Check if current user has already liked this post
  const isLiked = user ? post.likedByUsers?.includes(user.uid) : false;

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
            
            <Button variant="ghost" size="sm" className="flex items-center gap-2 font-medium text-slate-500 hover:text-synapse-600 hover:bg-transparent px-0">
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
      </div>
    </Card>
  );
};