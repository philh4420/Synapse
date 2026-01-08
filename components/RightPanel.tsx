import React, { useEffect, useState } from 'react';
import { Search, MoreHorizontal, Video } from 'lucide-react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { Skeleton } from './ui/Skeleton';
import { Button } from './ui/Button';

export const RightPanel: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersQuery = query(collection(db, 'users'), limit(20));
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

  if (!loading && contacts.length === 0) {
    return (
      <div className="hidden lg:flex flex-col w-[280px] xl:w-[360px] h-[calc(100vh-56px)] fixed right-0 top-14 pt-4 pr-2 pb-4">
        <div className="px-2 text-slate-500 text-sm">No contacts found</div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col w-[280px] xl:w-[360px] h-[calc(100vh-56px)] fixed right-0 top-14 pt-4 pr-2 pb-4 hover:overflow-y-auto hide-scrollbar">
      
      {/* Contacts Header */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-2 px-2">
          <h3 className="font-semibold text-slate-500 text-[17px]">Contacts</h3>
          <div className="flex gap-1 text-slate-500">
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
        <div className="space-y-0.5">
          {loading ? (
             // Skeleton loading state
             [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                   <Skeleton className="h-9 w-9 rounded-full" />
                   <Skeleton className="h-4 w-24" />
                </div>
             ))
          ) : (
            contacts.map((u) => (
              <div key={u.uid} className="flex items-center gap-3 p-2 hover:bg-black/5 rounded-lg cursor-pointer transition-colors group">
                <div className="relative">
                  <Avatar className="h-9 w-9 border border-slate-200">
                     <AvatarImage src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} />
                     <AvatarFallback>{u.displayName?.substring(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="font-medium text-slate-900 text-[15px]">{u.displayName}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};