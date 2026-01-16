"use client";

import { ReactNode, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchFormProps {
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
  onReset: () => void;
  isSearching?: boolean;
}

export function SearchForm({
  children,
  onSubmit,
  onReset,
  isSearching = false,
}: SearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg border p-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSearching}>
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? "Searching..." : "Search"}
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </form>
  );
}

