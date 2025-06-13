// src/app/page.tsx (Dashboard)
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { LogEntry } from '@/types';
import LogList from '@/components/LogList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [userLogs, setUserLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    if (currentUser) {
      const fetchUserLogs = async () => {
        setIsLoadingLogs(true);
        try {
          const logsCollection = collection(db, 'logs');
          const q = query(
            logsCollection,
            where('ownerId', '==', currentUser.uid),
            orderBy('updatedAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const logsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as LogEntry));
          setUserLogs(logsData);
        } catch (error) {
          console.error("Error fetching user's logs:", error);
        } finally {
          setIsLoadingLogs(false);
        }
      };
      fetchUserLogs();
    }
  }, [currentUser]);

  if (loading || isLoadingLogs) {
    return <div className="container mx-auto p-4 text-center">Loading dashboard...</div>;
  }

  if (!currentUser) {
    return null; // Should be redirected by the first useEffect
  }

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Logs</h1>
        <Link href="/create-log">
          <Button>
            <PlusCircle size={20} className="mr-2" /> Create New Log
          </Button>
        </Link>
      </div>
      
      <LogList 
        logs={userLogs} 
        showControls={true} 
        emptyStateMessage="You haven't created any logs yet. Get started by creating one!"
      />
    </div>
  );
}
