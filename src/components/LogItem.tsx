
// src/components/LogItem.tsx
"use client";
import type { LogEntry } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Lock, MessageSquare, Heart, Edit, ExternalLink, YoutubeIcon, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

interface LogItemProps {
  log: LogEntry;
  showControls?: boolean; // To show edit/delete if owner
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  let videoId = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
      videoId = urlObj.searchParams.get('v');
    } else if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/embed/')) {
      videoId = urlObj.pathname.split('/embed/')[1].split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch (e) {
    return null; // Invalid URL
  }
}

export default function LogItem({ log, showControls = false }: LogItemProps) {
  const { currentUser } = useAuth();
  const isOwner = currentUser && currentUser.uid === log.ownerId;
  const youtubeEmbedUrl = log.youtubeLink ? getYouTubeEmbedUrl(log.youtubeLink) : null;
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(0); // Placeholder for Phase 6 simplified like count
  const [localCommentCount, setLocalCommentCount] = useState(log.commentCount || 0);

  useEffect(() => {
    setLocalCommentCount(log.commentCount || 0);
  }, [log.commentCount]);

  // Fetch initial like state for the current user and total like count
  useEffect(() => {
    if (!log.id) return;

    // Check if current user liked this log
    if (currentUser && log.id) {
      const likedDocRef = doc(db, 'users', currentUser.uid, 'likedLogs', log.id);
      getDoc(likedDocRef).then((docSnap) => {
        setIsLiked(docSnap.exists());
      });
    } else {
      setIsLiked(false); // Reset if user logs out or logId is not present
    }
    
    // Fetch total like count (simplified for Phase 6 - by counting documents in a subcollection)
    // This is a simplified approach. For large scale, denormalization or Cloud Functions are better.
    // For Phase 6, we'll keep the "users/{userId}/likedLogs" structure as primary for user's liked logs.
    // Displaying an accurate total like count directly on LogItem is complex with that structure
    // without iterating through all users or denormalizing.
    // So, we'll use a placeholder for likeCount or a simplified method if feasible.
    // Let's try to count from a potential 'likes' subcollection on the log itself for display.
    // If 'logs/{logId}/likes' subcollection exists and contains docs, count them.
    // This is a *deviation* from the planned `users/{userId}/likedLogs` for *counting* purposes if you want a displayed count.
    // The primary like *action* will still use `users/{userId}/likedLogs`.
    // For now, let's just keep it as a placeholder '0' or implement the user-specific like icon state.
    // To keep it simple and adhere to the plan, we will not implement a live total like count here.
    // The `likeCount` state can be used if you decide to denormalize later.
    // For now, we'll set it to a placeholder or leave it as 0.
    // Let's simulate a count based on the `users/{userId}/likedLogs` structure for now
    // by querying all users who liked THIS specific log.
    // This is NOT efficient for many users/logs but demonstrates the idea for small scale.
    const likesQuery = query(collection(db, 'users'), where(`likedLogs.${log.id}.logId`, '==', log.id));
    // This query won't work as Firestore doesn't support querying map fields like this efficiently.
    // A better approach for counting is a subcollection on the log like `logs/{logId}/likers/{userId}`
    // or denormalization.

    // Given Phase 6 simplification, we will *not* fetch total like count.
    // `likeCount` will remain a placeholder 0. The visual feedback will be the filled/unfilled heart.
    setLikeCount(0); // Placeholder

  }, [currentUser, log.id]);

  const handleCommentAdded = useCallback(() => {
    setCommentRefreshKey(prev => prev + 1);
    setLocalCommentCount(prev => prev + 1); // Optimistically update comment count
  }, []);

  const handleLike = async () => {
    if (!currentUser || !log.id) {
      // Optionally, prompt to login
      return;
    }
    setIsLiking(true);
    const likedDocRef = doc(db, 'users', currentUser.uid, 'likedLogs', log.id);

    try {
      if (isLiked) {
        await deleteDoc(likedDocRef);
        setIsLiked(false);
        // setLikeCount(prev => Math.max(0, prev -1)); // If we were updating a real count
      } else {
        await setDoc(likedDocRef, {
          logId: log.id,
          createdAt: new Date().toISOString(),
          // Storing title might be useful for listing liked logs later
          logTitle: log.title 
        });
        setIsLiked(true);
        // setLikeCount(prev => prev + 1); // If we were updating a real count
      }
    } catch (error) {
      console.error("Error liking/unliking log:", error);
      // Handle error (e.g., show a toast)
    } finally {
      setIsLiking(false);
    }
  };
  
  // Real-time comment count update
  useEffect(() => {
    if (!log.id) return;
    const commentsCol = collection(db, 'logs', log.id, 'comments');
    const unsubscribe = onSnapshot(commentsCol, (snapshot) => {
      setLocalCommentCount(snapshot.size);
    }, (error) => {
      console.error("Error listening to comment count:", error);
    });
    return () => unsubscribe();
  }, [log.id]);


  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl md:text-2xl font-semibold">{log.title}</CardTitle>
          <div className="flex-shrink-0">
            {log.isPublic ? (
              <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600">
                <Globe size={14} /> Public
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-600">
                <Lock size={14} /> Private
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-xs text-muted-foreground pt-1">
          By: User {log.ownerId.substring(0, 6)}... | Updated: {new Date(log.updatedAt).toLocaleDateString()}
        </CardDescription>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {log.imageLink && <ImageIcon size={14} className="text-blue-500" />}
            {log.youtubeLink && <YoutubeIcon size={16} className="text-red-500" />}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {log.imageLink && (
          <div className="mb-4 aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center border">
            <img 
              src={log.imageLink} 
              alt={log.title} 
              className="w-full h-full object-contain" 
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.onerror = null; 
                target.style.display='none'; 
                const errorText = target.parentElement?.querySelector('.image-error-text') as HTMLElement;
                if(errorText) errorText.style.display = 'block';
              }}
              data-ai-hint="log image"
            />
            <p className="image-error-text text-xs text-destructive hidden">Image failed to load.</p>
          </div>
        )}
        {youtubeEmbedUrl && (
          <div className="mb-4 aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={youtubeEmbedUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="rounded-md border"
            ></iframe>
          </div>
        )}
        <p className="text-muted-foreground whitespace-pre-wrap">
          {log.description}
        </p>
      </CardContent>
      
      <Separator className="my-0" />
      
      <div className="px-6 py-4 space-y-4">
        <h4 className="text-md font-semibold">Comments ({localCommentCount})</h4>
        <CommentForm logId={log.id!} onCommentAdded={handleCommentAdded} />
        <CommentList logId={log.id!} refreshKey={commentRefreshKey} />
      </div>

      <Separator className="my-0" />

      <CardFooter className="flex flex-wrap justify-between items-center pt-4 border-t">
        <div className="flex gap-3 text-muted-foreground items-center">
          <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={handleLike} disabled={isLiking || !currentUser}>
            <Heart size={16} className={`mr-1 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} /> 
            {likeCount} {/* Placeholder, or can be removed */}
          </Button>
          <Button variant="ghost" size="sm" className="p-1 h-auto" disabled> {/* Comment button is part of form now */}
            <MessageSquare size={16} className="mr-1" /> {localCommentCount}
          </Button>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          {showControls && isOwner && (
            <Link href={`/create-log?edit=${log.id}`}>
              <Button variant="outline" size="sm">
                <Edit size={16} className="mr-1 sm:mr-2" /> Edit
              </Button>
            </Link>
          )}
           <Link href={`/logs/${log.id}`}>
              <Button variant="outline" size="sm">
                <ExternalLink size={16} className="mr-1 sm:mr-2" /> View
              </Button>
            </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
