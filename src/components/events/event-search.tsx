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

export function EventSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [customerEmail, setCustomerEmail] = useState(searchParams.get("customerEmail") || "");
  const [funnelType, setFunnelType] = useState(searchParams.get("funnelType") || "");
  const [toStage, setToStage] = useState(searchParams.get("toStage") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    const params = new URLSearchParams();
    if (customerEmail) params.set("customerEmail", customerEmail);
    if (funnelType && funnelType !== "all") params.set("funnelType", funnelType);
    if (toStage) params.set("toStage", toStage);
    if (dateFrom) params.set("dateFrom", dateFrom);
    params.set("page", "1");

    router.push(`/events?${params.toString()}`);
    setIsSearching(false);
  };

  const handleReset = () => {
    setCustomerEmail("");
    setFunnelType("");
    setToStage("");
    setDateFrom("");
    router.push("/events");
  };

  return (
    <SearchForm onSubmit={handleSubmit} onReset={handleReset} isSearching={isSearching}>
      <div className="space-y-2">
        <Label htmlFor="customerEmail">Customer Email</Label>
        <Input
          id="customerEmail"
          type="email"
          placeholder="customer@example.com"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="funnelType">Funnel Type</Label>
        <Select value={funnelType} onValueChange={setFunnelType}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="service-delivery">Service Delivery</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="toStage">To Stage</Label>
        <Input
          id="toStage"
          placeholder="Stage name..."
          value={toStage}
          onChange={(e) => setToStage(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateFrom">From Date</Label>
        <Input
          id="dateFrom"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
      </div>
    </SearchForm>
  );
}

