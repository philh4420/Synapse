import React from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from './ui/Card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';

// Mock data for stories (In a real app, this would come from Firestore)
const STORIES = [
  { id: 1, name: "Sarah K.", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah" },
  { id: 2, name: "Mike R.", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mike" },
  { id: 3, name: "Jessica T.", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jessica" },
  { id: 4, name: "David L.", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=David" },
];

export const Stories: React.FC = () => {
  const { user, userProfile } = useAuth();

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
      {/* Create Story Card */}
      <Card className="min-w-[140px] w-[140px] h-[250px] flex-shrink-0 relative overflow-hidden group cursor-pointer border-0 shadow-sm hover:shadow-md transition-all">
        <div className="h-[75%] w-full relative">
            <img 
                src={userProfile?.photoURL || user?.photoURL || ''} 
                alt="Me" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-slate-200"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        <div className="h-[25%] bg-white relative pt-6 text-center">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-synapse-600 p-1 rounded-full border-4 border-white">
                <Plus className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-900">Create story</p>
        </div>
      </Card>

      {/* Friend Stories */}
      {STORIES.map(story => (
        <Card key={story.id} className="min-w-[140px] w-[140px] h-[250px] flex-shrink-0 relative overflow-hidden group cursor-pointer border-0 shadow-sm hover:shadow-md transition-all bg-slate-800">
            <img 
                src={story.img} 
                alt={story.name} 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
            
            <div className="absolute top-3 left-3">
                <Avatar className="w-10 h-10 border-4 border-synapse-600 ring-2 ring-black/20">
                    <AvatarImage src={story.avatar} />
                    <AvatarFallback>{story.name[0]}</AvatarFallback>
                </Avatar>
            </div>
            
            <div className="absolute bottom-3 left-3 text-white font-semibold text-sm drop-shadow-md">
                {story.name}
            </div>
        </Card>
      ))}
    </div>
  );
};