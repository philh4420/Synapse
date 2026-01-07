import React from 'react';
import { Search, MoreHorizontal, UserPlus } from 'lucide-react';

export const RightPanel: React.FC = () => {
  const trending = [
    { tag: '#FutureTech2026', posts: '54.2k' },
    { tag: '#SynapseLaunch', posts: '32.1k' },
    { tag: '#DigitalNomad', posts: '21.5k' },
    { tag: '#WebDesign', posts: '18.9k' },
  ];

  const suggestions = [
    { name: 'Emily Wilson', handle: '@emily_w', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
    { name: 'Michael Chen', handle: '@mchen', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
  ];

  return (
    <div className="hidden xl:block w-80 h-screen sticky top-0 py-6 pl-2 pr-6 space-y-6">
      {/* Search */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-synapse-500 transition-colors">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Search Synapse..." 
          className="w-full bg-white border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-synapse-500/20 focus:border-synapse-500 transition-all shadow-sm"
        />
      </div>

      {/* Trending */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900">Trending Now</h3>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreHorizontal size={18} />
          </button>
        </div>
        <div className="space-y-4">
          {trending.map((item, i) => (
            <div key={i} className="flex justify-between items-center group cursor-pointer">
              <div>
                <p className="font-semibold text-slate-800 text-sm group-hover:text-synapse-600 transition-colors">{item.tag}</p>
                <p className="text-xs text-slate-400">{item.posts} Posts</p>
              </div>
              <button className="opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity">
                <MoreHorizontal size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Who to follow */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
         <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900">Who to follow</h3>
          <button className="text-synapse-600 text-sm font-semibold hover:underline">See all</button>
        </div>
        <div className="space-y-4">
          {suggestions.map((user, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={user.img} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.handle}</p>
                </div>
              </div>
              <button className="p-2 text-synapse-600 bg-synapse-50 hover:bg-synapse-100 rounded-full transition-colors">
                <UserPlus size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};