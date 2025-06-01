
// src/app/public/page.tsx
import { Suspense } from "react";
import PublicLogListClient from "@/components/PublicLogListClient"; // We will create this component
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function PublicLogsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Public Mind Map Logs
        </h1>
        <Button variant="outline" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      <p className="mb-8 text-lg text-muted-foreground">
        Explore mind map logs that have been shared publicly by users.
      </p>
      <Suspense fallback={<div className="text-center py-10">Loading public logs...</div>}>
        <PublicLogListClient />
      </Suspense>
       <footer className="mt-16 py-8 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} MindMapper Lite. Public Logs.</p>
      </footer>
    </div>
  );
}
