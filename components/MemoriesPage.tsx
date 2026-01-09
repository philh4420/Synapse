
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Post as PostType } from '../types';
import { Post } from './Post';
import { Clock, Calendar, Star, Sparkles, History, ArrowRight, Share2, Heart } from 'lucide-react';
import { Skeleton } from './ui/Skeleton';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface GroupedMemories {
  year: number;
  yearsAgo: number;
  posts: PostType[];
}

export const MemoriesPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState<GroupedMemories[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchMemories = async () => {
      try {
        // Fetch user's posts
        // Note: Firestore doesn't support native "Month/Day" filtering easily. 
        // For a social app scale, we fetch recent history (e.g. 500 posts) and filter client-side.
        const q = query(
          collection(db, 'posts'),
          where('author.uid', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(200) 
        );

        const snapshot = await getDocs(q);
        const today = new Date();
        const currentYear = today.getFullYear();
        
        const grouped: Record<number, PostType[]> = {};

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const postDate = data.timestamp?.toDate();
          
          if (postDate) {
            // Check if Month and Day match today
            if (postDate.getMonth() === today.getMonth() && postDate.getDate() === today.getDate()) {
              const year = postDate.getFullYear();
              // Exclude posts from today (current year) unless you want "Today's recap"
              if (year < currentYear) {
                if (!grouped[year]) grouped[year] = [];
                grouped[year].push({ id: doc.id, ...data, timestamp: postDate } as PostType);
              }
            }
          }
        });

        const result: GroupedMemories[] = Object.keys(grouped)
          .map(yearStr => {
            const year = parseInt(yearStr);
            return {
              year,
              yearsAgo: currentYear - year,
              posts: grouped[year]
            };
          })
          .sort((a, b) => b.year - a.year); // Newest years first

        setMemories(result);
      } catch (error) {
        console.error("Error fetching memories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-4 animate-in fade-in">
         <Skeleton className="h-64 w-full rounded-3xl" />
         <div className="space-y-4">
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-96 w-full rounded-xl" />
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* --- 2026 Hero Header --- */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white shadow-2xl mb-12 group">
         {/* Animated Background Mesh */}
         <div className="absolute inset-0 z-0">
             <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 opacity-60 blur-[100px] animate-pulse" />
             <div className="absolute bottom-[-50%] right-[-20%] w-[80%] h-[150%] bg-gradient-to-tl from-cyan-500 via-teal-500 to-emerald-500 opacity-40 blur-[100px] animate-pulse delay-700" />
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-overlay"></div>
         </div>

         <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold tracking-wide uppercase text-indigo-100 shadow-sm">
                   <Sparkles className="w-4 h-4 text-yellow-300" /> On This Day
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                   Your Journey <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">Through Time</span>
                </h1>
                <p className="text-lg text-indigo-100/80 max-w-md font-medium leading-relaxed">
                   Rediscover the moments that mattered. Here is what you were doing on <span className="text-white underline decoration-wavy decoration-indigo-400 underline-offset-4">{format(new Date(), 'MMMM do')}</span>.
                </p>
            </div>
            
            <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform duration-500">
                    <Calendar className="w-16 h-16 text-white/90 drop-shadow-lg" />
                </div>
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-2 bg-white text-slate-900 font-bold px-4 py-2 rounded-xl shadow-lg transform rotate-12 text-sm border border-slate-100">
                   {format(new Date(), 'yyyy')}
                </div>
                <div className="absolute -bottom-2 -left-4 bg-indigo-500 text-white px-3 py-1.5 rounded-full shadow-lg transform -rotate-6 text-xs font-bold flex items-center gap-1 border border-white/20">
                   <History className="w-3 h-3" /> Recap
                </div>
            </div>
         </div>
      </div>

      {/* --- Memories Feed --- */}
      {memories.length > 0 ? (
        <div className="relative space-y-16 pl-4 md:pl-8">
           {/* Timeline Line */}
           <div className="absolute left-4 md:left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500/50 via-slate-300 to-transparent -ml-[1px]" />

           {memories.map((group) => (
              <div key={group.year} className="relative">
                 {/* Timeline Node */}
                 <div className="absolute -left-[33px] md:-left-[33px] top-0 w-16 h-16 flex items-center justify-center">
                    <div className="w-4 h-4 bg-indigo-600 rounded-full ring-4 ring-white shadow-md z-10" />
                 </div>

                 <div className="mb-6 pl-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                       {group.year}
                       <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                          {group.yearsAgo} {group.yearsAgo === 1 ? 'year' : 'years'} ago
                       </span>
                    </h2>
                 </div>

                 <div className="space-y-8 pl-6">
                    {group.posts.map((post) => (
                       <div key={post.id} className="relative group/post">
                          {/* Special Memory Decoration */}
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-hover/post:opacity-20 blur transition-opacity duration-500" />
                          
                          <div className="relative">
                             <Post post={post} />
                          </div>
                          
                          <div className="mt-2 flex justify-end">
                             <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 gap-2">
                                <Share2 className="w-4 h-4" /> Share memory
                             </Button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-6 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
           <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20" />
              <History className="w-10 h-10 text-slate-300" />
           </div>
           <div className="max-w-md space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">No Memories Today</h3>
              <p className="text-slate-500 leading-relaxed">
                 You haven't posted anything on this specific date in previous years. <br/>
                 <span className="font-semibold text-indigo-600">Make a post today</span> to see it here next year!
              </p>
           </div>
           <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-8 shadow-lg shadow-slate-500/20">
              Create a Post
           </Button>
        </div>
      )}
      
      {/* Footer Area */}
      <div className="mt-16 text-center">
         <div className="inline-flex items-center justify-center p-1 rounded-full bg-slate-100 border border-slate-200">
            <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
               End of Memories
            </div>
         </div>
      </div>
    </div>
  );
};
