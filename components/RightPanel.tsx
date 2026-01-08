import React, { useEffect, useState } from 'react';
import { Search, MoreHorizontal, Video, Gift } from 'lucide-react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { Skeleton } from './ui/Skeleton';
import { Button } from './ui/Button';
import { Separator } from './ui/Separator';

export const RightPanel: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersQuery = query(collection(db, 'users'), limit(15));
        const usersSnap = await getDocs(usersQuery);
        
        const usersData = usersSnap.docs
          .map(doc => doc.data() as UserProfile)
          .filter(u => u.uid !== user?.uid);
          
        setContacts(usersData);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="hidden lg:flex flex-col w-[280px] xl:w-[360px] h-[calc(100vh-56px)] fixed right-0 top-14 pt-4 pr-2 pb-4 hover:overflow-y-auto hide-scrollbar">
      
      {/* --- Sponsored Section --- */}
      <div className="mb-4">
        <h3 className="font-semibold text-slate-500 text-[17px] mb-2 px-2">Sponsored</h3>
        <ul className="space-y-4">
          <li className="flex items-center gap-3 p-2 hover:bg-black/5 rounded-lg cursor-pointer transition-colors group">
            <img 
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop" 
              alt="Ad" 
              className="w-32 h-32 object-cover rounded-lg border border-slate-100"
            />
            <div className="flex flex-col justify-center">
              <span className="font-semibold text-slate-900 text-[15px] leading-tight">Nike Air Max 2026</span>
              <span className="text-xs text-slate-500 mt-1">nike.com</span>
            </div>
          </li>
          <li className="flex items-center gap-3 p-2 hover:bg-black/5 rounded-lg cursor-pointer transition-colors group">
            <img 
              src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=200&fit=crop" 
              alt="Ad" 
              className="w-32 h-32 object-cover rounded-lg border border-slate-100"
            />
            <div className="flex flex-col justify-center">
              <span className="font-semibold text-slate-900 text-[15px] leading-tight">Master Social Media Marketing</span>
              <span className="text-xs text-slate-500 mt-1">udemy.com</span>
            </div>
          </li>
        </ul>
      </div>

      <Separator className="my-2 bg-slate-300/50" />

      {/* --- Birthdays Section --- */}
      <div className="mb-4 p-2">
        <h3 className="font-semibold text-slate-500 text-[17px] mb-2">Birthdays</h3>
        <div className="flex items-start gap-3 hover:bg-black/5 p-2 rounded-lg cursor-pointer transition-colors -ml-2">
          <Gift className="w-8 h-8 text-blue-500 mt-1 flex-shrink-0" />
          <p className="text-[15px] text-slate-900 leading-tight pt-1">
            <span className="font-semibold">Sarah Jenkins</span> and <span className="font-semibold">3 others</span> have birthdays today.
          </p>
        </div>
      </div>

      <Separator className="my-2 bg-slate-300/50" />

      {/* --- Contacts Section --- */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-2 px-2">
          <h3 className="font-semibold text-slate-500 text-[17px]">Contacts</h3>
          <div className="flex gap-1 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200">
               <Video className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200">
               <Search className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200">
               <MoreHorizontal className="w-4 h-4" />
             </Button>
          </div>
        </div>
        
        {/* Contact List */}
        <div className="space-y-0.5 pb-10">
          {loading ? (
             // Skeleton loading state
             [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                   <Skeleton className="h-9 w-9 rounded-full" />
                   <Skeleton className="h-4 w-24" />
                </div>
             ))
          ) : contacts.length > 0 ? (
            contacts.map((u) => (
              <div key={u.uid} className="flex items-center gap-3 p-2 hover:bg-black/5 rounded-lg cursor-pointer transition-colors group relative">
                <div className="relative">
                  <Avatar className="h-9 w-9 border border-slate-200/50">
                     <AvatarImage src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} />
                     <AvatarFallback>{u.displayName?.substring(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {/* Online Indicator (Mocked) */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <span className="font-medium text-slate-900 text-[15px] truncate">{u.displayName}</span>
              </div>
            ))
          ) : (
            <div className="px-2 text-sm text-slate-500 italic mt-2">No other users found.</div>
          )}
        </div>
      </div>
    </div>
  );
};