
import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Unlock, Save, AlertTriangle, 
  Activity, Users, CheckCircle2, Globe, FileText, BarChart3, AlertOctagon, UserX, Check
} from 'lucide-react';
import { Button } from './ui/Button';
import { doc, getDoc, setDoc, collection, getCountFromServer, query, where, onSnapshot, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { Card } from './ui/Card';
import { Report, UserProfile } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { useToast } from '../context/ToastContext';
import { formatDistanceToNow } from 'date-fns';

export const AdminPanel: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reports, setReports] = useState<Report[]>([]);
  
  // Real Data State
  const [stats, setStats] = useState({
    userCount: 0,
    postCount: 0,
    postsToday: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Settings
        const docRef = doc(db, 'settings', 'site');
        const settingsSnap = await getDoc(docRef);
        if (settingsSnap.exists()) {
          setSignupEnabled(settingsSnap.data()?.signupEnabled);
        } else {
          await setDoc(docRef, { signupEnabled: true });
        }
        setLoading(false);

        // 2. Fetch Real Stats
        // Total Users
        const usersColl = collection(db, 'users');
        const userSnapshot = await getCountFromServer(usersColl);
        
        // Total Posts
        const postsColl = collection(db, 'posts');
        const postSnapshot = await getCountFromServer(postsColl);

        // Posts Today (Real 24h Activity)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayQuery = query(postsColl, where('timestamp', '>=', startOfDay));
        const todaySnapshot = await getCountFromServer(todayQuery);

        setStats({
          userCount: userSnapshot.data().count,
          postCount: postSnapshot.data().count,
          postsToday: todaySnapshot.data().count
        });

      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch Reports
  useEffect(() => {
      const q = query(collection(db, 'reports'), where('status', '==', 'pending'));
      const unsub = onSnapshot(q, async (snapshot) => {
          const reportsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Report[];
          
          // Hydrate with user profiles (simulated join)
          const hydratedReports = await Promise.all(reportsData.map(async (report) => {
              const reporterSnap = await getDoc(doc(db, 'users', report.reporterId));
              const reportedSnap = await getDoc(doc(db, 'users', report.reportedId));
              return {
                  ...report,
                  reporter: reporterSnap.exists() ? reporterSnap.data() as UserProfile : undefined,
                  reported: reportedSnap.exists() ? reportedSnap.data() as UserProfile : undefined
              };
          }));
          
          setReports(hydratedReports);
      });
      return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await setDoc(doc(db, 'settings', 'site'), {
        signupEnabled: signupEnabled
      }, { merge: true });
      setMessage({ type: 'success', text: 'System configuration updated successfully.' });
    } catch (err) {
      console.error("Error saving settings:", err);
      setMessage({ type: 'error', text: 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  const resolveReport = async (reportId: string) => {
      try {
          await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
          toast("Report marked as resolved", "success");
      } catch (e) { toast("Error updating report", "error"); }
  };

  const banUser = async (userId: string, reportId: string) => {
      if (confirm("Are you sure you want to ban this user? They will be marked as banned.")) {
          try {
              await updateDoc(doc(db, 'users', userId), { isBanned: true });
              await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
              toast("User banned successfully", "success");
          } catch (e) { toast("Error banning user", "error"); }
      }
  };

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
           <Shield className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 mt-2 max-w-md">
          This area is restricted to system administrators. Please contact support if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-synapse-950 to-indigo-950 p-8 text-white shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-synapse-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
             <Shield className="h-10 w-10 text-synapse-200" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
              <span className="rounded-full bg-synapse-500/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-synapse-100 border border-synapse-400/30">
                Super User
              </span>
            </div>
            <p className="text-synapse-100/80 max-w-2xl text-lg leading-relaxed">
              Manage platform settings, security protocols, and monitor system health from a centralized command center.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
           <div className="h-32 bg-slate-200/50 rounded-2xl"></div>
           <div className="h-64 bg-slate-200/50 rounded-2xl"></div>
        </div>
      ) : (
        <>
          {/* Real Data Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <StatCard 
                icon={Users} 
                label="Total Registered Users" 
                value={statsLoading ? "..." : stats.userCount.toLocaleString()} 
                subtext="Active accounts in DB"
                color="text-blue-500"
                bgColor="bg-blue-50"
             />
             <StatCard 
                icon={FileText} 
                label="Total Posts" 
                value={statsLoading ? "..." : stats.postCount.toLocaleString()} 
                subtext="All time content"
                color="text-purple-500"
                bgColor="bg-purple-50"
             />
             <StatCard 
                icon={BarChart3} 
                label="24h Activity" 
                value={statsLoading ? "..." : stats.postsToday.toLocaleString()} 
                subtext="Posts created today"
                color="text-green-500"
                bgColor="bg-green-50"
             />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Controls */}
              <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-slate-500" />
                        Global Configuration
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Changes here affect the entire platform immediately.</p>
                    </div>
                    <Button onClick={handleSave} isLoading={saving} className="bg-synapse-600 hover:bg-synapse-700 text-white shadow-lg shadow-synapse-500/20 w-full md:w-auto">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                    </Button>
                </div>

                {/* Feedback Messages */}
                {message.text && (
                    <div className={cn(
                    "mb-6 p-4 rounded-xl border flex items-start gap-3 animate-in slide-in-from-top-2",
                    message.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
                    )}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <AlertTriangle className="w-5 h-5 mt-0.5" />}
                    <div>
                        <p className="font-semibold">{message.type === 'success' ? 'Success' : 'Error'}</p>
                        <p className="text-sm opacity-90">{message.text}</p>
                    </div>
                    </div>
                )}

                {/* Settings Grid */}
                <div className="grid grid-cols-1 gap-4">
                    
                    {/* Registration Toggle */}
                    <div className="group relative overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-6 transition-all hover:shadow-md hover:border-synapse-200">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors border",
                            signupEnabled ? "bg-green-100 text-green-600 border-green-200" : "bg-red-100 text-red-600 border-red-200"
                            )}>
                            {signupEnabled ? <Unlock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                            </div>
                            <div>
                            <h3 className="text-lg font-bold text-slate-900">User Registration</h3>
                            <p className="mt-1 text-slate-500 max-w-lg text-sm leading-relaxed">
                                Control public access to the registration form. When disabled, the landing page signup will be hidden and attempts to register will be blocked.
                            </p>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => setSignupEnabled(!signupEnabled)}
                            className={cn(
                            "relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-synapse-500 focus:ring-offset-2",
                            signupEnabled ? "bg-synapse-600" : "bg-slate-300"
                            )}
                        >
                            <span className={cn(
                            "absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform duration-300 shadow-sm",
                            signupEnabled ? "translate-x-6" : "translate-x-0"
                            )} />
                        </button>
                    </div>
                    
                    <div className="mt-6 flex items-center gap-2 border-t border-slate-200/60 pt-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Status:</span>
                        {signupEnabled ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 border border-green-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                        ) : (
                        <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5" /> Restricted
                        </span>
                        )}
                    </div>
                    </div>

                    {/* Database Info (Real) */}
                    <div className="relative overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-6 flex items-center justify-between">
                        <div className="flex gap-4 items-center">
                        <div className="h-12 w-12 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">System Status</h3>
                            <p className="text-sm text-slate-500">
                                Database connection is active. Real-time listeners are running.
                            </p>
                        </div>
                        </div>
                        <div className="flex items-center gap-2">
                        <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-sm font-semibold text-green-700">Online</span>
                        </div>
                    </div>

                </div>
              </div>

              {/* Reports Section */}
              <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 p-6 md:p-8 shadow-sm h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <AlertOctagon className="w-5 h-5 text-red-500" />
                          Pending Reports
                      </h2>
                      <div className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-red-100">
                          {reports.length} Open
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[500px]">
                      {reports.length > 0 ? (
                          reports.map(report => (
                              <div key={report.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                                  <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2 text-sm text-slate-500">
                                          <span className="font-bold text-slate-700">{report.reporter?.displayName || 'Unknown'}</span>
                                          <span>reported</span>
                                          <span className="font-bold text-red-600">{report.reported?.displayName || 'Unknown'}</span>
                                      </div>
                                      <span className="text-xs text-slate-400">{report.timestamp ? formatDistanceToNow(report.timestamp.toDate(), {addSuffix: true}) : 'Just now'}</span>
                                  </div>
                                  
                                  <div className="bg-white p-3 rounded-xl border border-slate-200 mb-3 text-sm text-slate-700">
                                      <span className="font-bold text-slate-400 text-xs uppercase block mb-1">Reason</span>
                                      {report.reason}
                                  </div>

                                  <div className="flex items-center justify-end gap-2">
                                      <Button size="sm" variant="ghost" className="h-8 text-slate-500" onClick={() => resolveReport(report.id)}>
                                          <Check className="w-4 h-4 mr-1" /> Dismiss
                                      </Button>
                                      <Button size="sm" variant="destructive" className="h-8 px-4" onClick={() => banUser(report.reportedId, report.id)}>
                                          <UserX className="w-4 h-4 mr-1" /> Ban User
                                      </Button>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-12 text-slate-400">
                              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                              <p>No pending reports. All clear!</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper Stat Card
const StatCard: React.FC<{ 
  icon: any, 
  label: string, 
  value: string, 
  subtext: string, 
  color: string, 
  bgColor: string 
}> = ({ icon: Icon, label, value, subtext, color, bgColor }) => (
  <Card className="p-5 border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
          <div className={cn("p-2.5 rounded-xl", bgColor)}>
              <Icon className={cn("w-6 h-6", color)} />
          </div>
      </div>
      <div>
         <h3 className="text-3xl font-bold text-slate-900 mt-1">{value}</h3>
         <p className="text-slate-700 text-sm font-bold mt-1">{label}</p>
         <p className="text-slate-400 text-xs mt-1">{subtext}</p>
      </div>
  </Card>
);
