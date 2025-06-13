// src/app/create-log/page.tsx
"use client";

import LogForm from '@/components/LogForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function CreateLogPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading...</div>;
  }

  if (!currentUser) {
    // This case should ideally be handled by the redirect, but as a fallback:
    return (
      <div className="container mx-auto p-4 text-center">
        <p>You need to be logged in to create a log.</p>
        <Link href="/login" className="text-primary hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  const handleLogSave = (logId: string) => {
    console.log(`Log saved with ID: ${logId}, redirecting to home.`);
    router.push('/');
  };
  
  const isDeveloper = currentUser?.uid === 'REPLACE_WITH_YOUR_ACTUAL_GOOGLE_UID';


  return (
    <div className="container mx-auto p-4 min-h-screen">
      <LogForm onSave={handleLogSave} isDeveloper={isDeveloper} />
    </div>
  );
}
