// src/components/SearchBar.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = () => {
    if (query.trim()) {
      // Mengarahkan pencarian ke halaman saat ini (Dashboard)
      router.push(`${pathname}?q=${encodeURIComponent(query)}`);
    } else {
      router.push(pathname);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="Search logs by title or description..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
      <Button onClick={handleSearch}>
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}
