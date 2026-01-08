
import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserMinus, Loader2, X, UserX } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { 
  collection, query, where, addDoc, deleteDoc, 
  updateDoc, doc, onSnapshot, serverTimestamp, arrayUnion, arrayRemove, writeBatch 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useToast } from '../context/ToastContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import { cn } from '../lib/utils';

interface FriendButtonProps {
  targetUid: string;
  className?: string;
  onStatusChange?: () => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const FriendButton: React.FC<FriendButtonProps> = ({ targetUid, className, onStatusChange, size = 'default' }) => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user || !targetUid) return;

    // Immediate check from profile
    if (userProfile?.friends?.includes(targetUid)) {
      setStatus('friends');
      setLoading(false);
    }

    // Listen for requests sent BY me
    const qSent = query(
      collection(db, 'friend_requests'),
      where('senderId', '==', user.uid),
      where('receiverId', '==', targetUid)
    );

    // Listen for requests sent TO me
    const qReceived = query(
      collection(db, 'friend_requests'),
      where('senderId', '==', targetUid),
      where('receiverId', '==', user.uid)
    );

    const unsubSent = onSnapshot(qSent, (snap) => {
      if (!snap.empty) {
        setStatus('pending_sent');
        setRequestId(snap.docs[0].id);
      } else {
        if (status === 'pending_sent') setStatus('none');
      }
      setLoading(false);
    });

    const unsubReceived = onSnapshot(qReceived, (snap) => {
      if (!snap.empty) {
        setStatus('pending_received');
        setRequestId(snap.docs[0].id);
      } else {
        if (status === 'pending_received') setStatus('none');
      }
      setLoading(false);
    });

    return () => { unsubSent(); unsubReceived(); };
  }, [user, targetUid, userProfile?.friends]);

  const sendRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setActionLoading(true);
    try {
      await addDoc(collection(db, 'friend_requests'), {
        senderId: user.uid,
        receiverId: targetUid,
        status: 'pending',
        timestamp: serverTimestamp()
      });

      await addDoc(collection(db, 'notifications'), {
        recipientUid: targetUid,
        sender: {
          uid: user.uid,
          displayName: userProfile?.displayName || user.displayName || 'User',
          photoURL: userProfile?.photoURL || ''
        },
        type: 'friend_request',
        read: false,
        timestamp: serverTimestamp()
      });

      toast("Friend request sent", "success");
    } catch (e) {
      toast("Failed to send request", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const cancelRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requestId) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'friend_requests', requestId));
      setRequestId(null);
      setStatus('none');
      toast("Request canceled", "info");
    } catch (e) {
      toast("Failed to cancel", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const acceptRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requestId || !user) return;
    setActionLoading(true);
    try {
      const batch = writeBatch(db);

      // 1. Delete the friend request
      const requestRef = doc(db, 'friend_requests', requestId);
      batch.delete(requestRef);

      // 2. Add targetUid to my friends list
      const myUserRef = doc(db, 'users', user.uid);
      batch.update(myUserRef, { friends: arrayUnion(targetUid) });

      // 3. Add my uid to target's friends list
      const theirUserRef = doc(db, 'users', targetUid);
      batch.update(theirUserRef, { friends: arrayUnion(user.uid) });

      // 4. Create Notification
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        recipientUid: targetUid,
        sender: {
          uid: user.uid,
          displayName: userProfile?.displayName || user.displayName || 'User',
          photoURL: userProfile?.photoURL || ''
        },
        type: 'friend_accept',
        read: false,
        timestamp: serverTimestamp()
      });

      // Commit all changes atomically
      await batch.commit();

      setStatus('friends');
      toast("You are now friends", "success");
      if (onStatusChange) onStatusChange();
    } catch (e) {
      console.error(e);
      toast("Failed to accept", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const unfriend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    setActionLoading(true);
    try {
      const batch = writeBatch(db);
      
      const myUserRef = doc(db, 'users', user.uid);
      batch.update(myUserRef, { friends: arrayRemove(targetUid) });

      const theirUserRef = doc(db, 'users', targetUid);
      batch.update(theirUserRef, { friends: arrayRemove(user.uid) });

      await batch.commit();

      setStatus('none');
      toast("Friend removed", "info");
      if (onStatusChange) onStatusChange();
    } catch (e) {
      toast("Failed to unfriend", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Button variant="secondary" disabled size={size} className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (status === 'friends') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size={size} className={cn("gap-2 font-semibold", className)} disabled={actionLoading}>
            <UserCheck className="w-4 h-4" />
            Friends
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer gap-2" onClick={unfriend}>
             <UserMinus className="w-4 h-4" /> Unfriend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (status === 'pending_sent') {
    return (
      <Button 
        variant="secondary" 
        size={size}
        onClick={cancelRequest} 
        isLoading={actionLoading}
        className={cn("gap-2 text-slate-600", className)}
      >
        {!actionLoading && <X className="w-4 h-4" />}
        Cancel Request
      </Button>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex gap-2 w-full">
         <Button 
           variant="primary"
           size={size}
           onClick={acceptRequest} 
           isLoading={actionLoading}
           className={cn("gap-2 flex-1", className)}
         >
           Confirm
         </Button>
         <Button 
           variant="secondary"
           size={size}
           onClick={cancelRequest} 
           disabled={actionLoading}
           className="flex-1"
         >
           Delete
         </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="primary" 
      size={size}
      onClick={sendRequest} 
      isLoading={actionLoading}
      className={cn("gap-2 font-semibold", className)}
    >
      {!actionLoading && <UserPlus className="w-4 h-4" />}
      Add Friend
    </Button>
  );
};
