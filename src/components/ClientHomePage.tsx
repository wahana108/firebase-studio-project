"use client";

import { LogForm } from "@/components/LogForm";
import { LogList } from "@/components/LogList";
import { SearchBar } from "@/components/SearchBar";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import { createLogAction } from "@/lib/actions";
import { useState, useCallback } from "react";

export default function ClientHomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogCreated = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    console.log("[ClientHomePage] Refresh triggered for LogList");
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 selection:bg-primary/20">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          MindMapper Lite
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
          Capture your thoughts and ideas. Create visual logs with titles, descriptions, and images.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-12">
        <section aria-labelledby="search-heading" className="w-full">
          <SearchBar />
        </section>

        <section aria-labelledby="create-log-heading">
          <LogForm action={createLogAction} onLogCreated={handleLogCreated} />
        </section>

        <Separator className="my-12" />

        <section aria-labelledby="logs-list-heading" className="w-full">
          <h2 id="logs-list-heading" className="text-3xl font-semibold mb-8 text-center md:text-left text-foreground">
            Your Mind Map Logs
          </h2>
          <LogList refreshKey={refreshKey} />
        </section>
      </main>

      <footer className="mt-16 py-8 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} MindMapper Lite. Built with Next.js and Firebase.</p>
      </footer>
    </div>
  );
}