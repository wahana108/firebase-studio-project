
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, LogIn, UserCircle, Search, Globe, Home } from 'lucide-react';

export default function ClientNav() {
  const { currentUser, signOut, loading } = useAuth();

  if (loading) {
    return (
      <nav className="bg-card text-card-foreground shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            MindMapper Lite
          </Link>
          <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-card text-card-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center">
        <Link href="/" className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          MindMapper Lite
        </Link>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {currentUser && (
             <Link href="/" className="text-sm hover:text-primary p-2 rounded-md flex items-center">
              <Home className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}
          <Link href="/public" className="text-sm hover:text-primary p-2 rounded-md flex items-center">
            <Globe className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Public</span>
          </Link>
          {currentUser && (
            <Link href="/search" className="text-sm hover:text-primary p-2 rounded-md flex items-center">
              <Search className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">My Search</span>
            </Link>
          )}
          {currentUser ? (
            <>
              <button
                onClick={signOut}
                className="text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3 py-2 rounded-md flex items-center"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Sign Out</span>
              </button>
              {currentUser.displayName && (
                <span className="text-sm text-muted-foreground flex items-center p-2" title={currentUser.email || ''}>
                  <UserCircle className="h-4 w-4 mr-1 text-primary" />
                  <span className="hidden sm:inline truncate max-w-xs">{currentUser.displayName}</span>
                </span>
              )}
            </>
          ) : (
            <Link href="/login" className="text-sm bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md flex items-center">
              <LogIn className="h-4 w-4 sm:mr-1" /> Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
