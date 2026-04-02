
"use client";

// LogForm, LogList, SearchBar, Separator, createLogAction, Accordion components, useState, and useCallback are removed
// as they are related to private log creation/listing or redundant search.
import { Sparkles } from "lucide-react";
import PublicLogListClient from "@/components/PublicLogListClient"; // Added

export default function ClientHomePage() {
  // State and callbacks related to LogForm and private LogList (refreshKey, accordionValue, handleLogCreated, etc.) are removed.

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 selection:bg-primary/20">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground"> {/* Updated Title */}
          Public Mind Map Logs
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto"> {/* Updated Subtitle */}
          Browse logs shared by the community.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-12">
        {/* SearchBar section removed, search is handled by PublicLogListClient */}
        {/* Create Log section (Accordion with LogForm) removed */}
        {/* Separator removed */}

        <section aria-labelledby="public-logs-list-heading" className="w-full">
          {/* The heading for the list can be part of PublicLogListClient or added here if needed */}
          {/* For simplicity, we'll let PublicLogListClient manage its presentation including search */}
          <PublicLogListClient /> {/* Replaced LogList with PublicLogListClient */}
        </section>
      </main>

      <footer className="mt-16 py-8 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} MindMapper Lite. Built with Next.js and Firebase.</p>
      </footer>
    </div>
  );
}
