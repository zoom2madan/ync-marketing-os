"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchForm } from "@/components/shared/search-form";

export function SegmentSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type && type !== "all") params.set("type", type);
    params.set("page", "1");

    router.push(`/segments?${params.toString()}`);
    setIsSearching(false);
  };

  const handleReset = () => {
    setSearch("");
    setType("");
    router.push("/segments");
  };

  return (
    <SearchForm onSubmit={handleSubmit} onReset={handleReset} isSearching={isSearching}>
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Segment name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="sql">SQL</SelectItem>
            <SelectItem value="function">Function</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SearchForm>
  );
}

