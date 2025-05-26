// src/app/search/page.tsx
import { Suspense } from "react";
import SearchPageClient from "@/components/SearchPageClient";

export default function SearchPage() {
  return (
    <div>
      <h1>Search Page</h1>
      <Suspense fallback={<div>Loading search results...</div>}>
        <SearchPageClient />
      </Suspense>
    </div>
  );
}