
// src/app/public/page.tsx
import { Suspense } from "react";
import PublicLogListClient from "@/components/PublicLogListClient";
// Link, Button, dan HomeIcon tidak lagi dibutuhkan di sini untuk tombol "Back to Home"
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Home as HomeIcon } from "lucide-react";

export default function PublicPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Public Mind Map Logs
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Browse logs shared by the community.
        </p>
        {/* Tombol "Back to Home" yang mengarah ke "/" dihilangkan
        <div className="mt-6"> 
          <Button variant="outline" asChild>
            <Link href="/">
              <HomeIcon className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        */}
      </header>
      <Suspense fallback={<div className="text-center py-10">Loading public logs...</div>}>
        <PublicLogListClient />
      </Suspense>
    </div>
  );
}
