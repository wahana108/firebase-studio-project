// src/app/public/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { LogEntry } from '@/types';
import LogList from '@/components/LogList';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function PublicLogsPage() {
  const [publicLogs, setPublicLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPublicLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const logsCollection = collection(db, 'logs');
        const q = query(
          logsCollection,
          where('isPublic', '==', true),
          orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const logsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as LogEntry));
        setPublicLogs(logsData);
        console.log('[PublicLogsPage] Success: Fetched public logs', logsData.length);
      } catch (error) {
        console.error("Error fetching public logs:", error);
      } finally {
        setIsLoadingLogs(false);
      }
    };
    fetchPublicLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!searchTerm) {
      return publicLogs;
    }
    return publicLogs.filter(log =>
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [publicLogs, searchTerm]);

  if (isLoadingLogs) {
    return <div className="container mx-auto p-4 text-center">Loading public logs...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">Public Logs</h1>
      
      <div className="mb-8 max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search public logs by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <LogList 
          logs={filteredLogs} 
          showControls={false} // No edit/delete controls on public page for non-owners
          emptyStateMessage={searchTerm ? "No public logs match your search." : "No public logs available at the moment."}
        />
      </div>
    </div>
  );
}
