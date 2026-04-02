"use client";

import { useState, useCallback } from "react";
import { Sparkles, Plus } from "lucide-react";
import { LogForm } from "@/components/LogForm";
import { LogList } from "@/components/LogList";
import { SearchBar } from "@/components/SearchBar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

export default function ClientHomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);

  const handleLogCreated = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleLogCreatedAndCollapse = useCallback(() => {
    handleLogCreated();
    setAccordionValue(undefined); // Menutup accordion setelah log berhasil dibuat
  }, [handleLogCreated]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 selection:bg-primary/20">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Mind Map Management Portal
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
          Capture your thoughts and ideas. Create visual logs with titles, descriptions, and images.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-12">
        {/* Bagian Pencarian */}
        <section aria-labelledby="search-heading" className="w-full">
          <SearchBar />
        </section>

        {/* Bagian Pembuatan Log Baru */}
        <section className="w-full">
          <Accordion 
            type="single" 
            collapsible 
            value={accordionValue} 
            onValueChange={setAccordionValue}
            className="w-full"
          >
            <AccordionItem value="create-log-item" className="border bg-card text-card-foreground rounded-lg shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline px-6 py-4 text-left w-full data-[state=open]:border-b">
                <div className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold">Create New Log</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click to expand and add a new mind map entry.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6">
                <LogForm onLogCreated={handleLogCreatedAndCollapse} variant="embedded" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator className="my-12" />

        {/* Bagian Daftar Log Admin */}
        <section aria-labelledby="logs-list-heading" className="w-full">
          <h2 id="logs-list-heading" className="text-3xl font-semibold mb-8 text-center md:text-left text-foreground">
            Your Mind Map Logs
          </h2>
          <LogList key={refreshKey} />
        </section>
      </main>

      <footer className="mt-16 py-8 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} MindMapper Lite. Built with Next.js and Firebase.</p>
      </footer>
    </div>
  );
}
