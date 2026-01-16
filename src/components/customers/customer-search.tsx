"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchForm } from "@/components/shared/search-form";

export function CustomerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [lmsLeadId, setLmsLeadId] = useState(searchParams.get("lmsLeadId") || "");
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (email) params.set("email", email);
    if (lmsLeadId) params.set("lmsLeadId", lmsLeadId);
    params.set("page", "1");

    router.push(`/customers?${params.toString()}`);
    setIsSearching(false);
  };

  const handleReset = () => {
    setSearch("");
    setEmail("");
    setLmsLeadId("");
    router.push("/customers");
  };

  return (
    <SearchForm onSubmit={handleSubmit} onReset={handleReset} isSearching={isSearching}>
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Name, email, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="customer@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lmsLeadId">LMS Lead ID</Label>
        <Input
          id="lmsLeadId"
          placeholder="LMS-12345"
          value={lmsLeadId}
          onChange={(e) => setLmsLeadId(e.target.value)}
        />
      </div>
    </SearchForm>
  );
}

