
"use client";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
// We will create LogForm and LogList components later
// import LogForm from "@/components/LogForm";
// import LogList from "@/components/LogList";

export default function HomePage() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-10">Loading user data...</div>;
  }

  if (!currentUser) {
    // This should ideally be handled by AuthContext redirect, but as a fallback:
    return (
        <div className="text-center py-10">
            <p>Please log in to access this page.</p>
            <Link href="/login" className="text-primary hover:underline">
                Go to Login
            </Link>
        </div>
    );
  }

  return (
    <div className="container mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {currentUser.displayName || "User"}!</p>
      </header>

      <section className="mb-8 p-6 bg-card border rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Create New Log</h2>
        {/* Placeholder for LogForm - to be implemented */}
        {/* <LogForm /> */}
         <Link href="/create-log" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
            Create Log (Placeholder Link)
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">LogForm component will be here.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Your Logs</h2>
        {/* Placeholder for LogList - to be implemented */}
        {/* <LogList ownerId={currentUser.uid} /> */}
        <p className="text-sm text-muted-foreground">LogList component (displaying your logs) will be here.</p>
      </section>
    </div>
  );
}
