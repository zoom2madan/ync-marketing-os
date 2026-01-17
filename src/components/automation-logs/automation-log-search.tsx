"use client";

import { useState, useEffect } from "react";
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
import type { AutomationWithRelations } from "@/types";

export function AutomationLogSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [automationId, setAutomationId] = useState(searchParams.get("automationId") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [isSearching, setIsSearching] = useState(false);
  const [automations, setAutomations] = useState<AutomationWithRelations[]>([]);

  useEffect(() => {
    // Fetch automations for the dropdown
    const fetchAutomations = async () => {
      try {
        const response = await fetch("/api/automations?limit=100");
        if (response.ok) {
          const data = await response.json();
          setAutomations(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch automations:", error);
      }
    };
    fetchAutomations();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    const params = new URLSearchParams();
    if (automationId && automationId !== "all") params.set("automationId", automationId);
    if (status && status !== "all") params.set("status", status);
    params.set("page", "1");

    router.push(`/automation-logs?${params.toString()}`);
    setIsSearching(false);
  };

  const handleReset = () => {
    setAutomationId("");
    setStatus("");
    router.push("/automation-logs");
  };

  return (
    <SearchForm onSubmit={handleSubmit} onReset={handleReset} isSearching={isSearching}>
      <div className="space-y-2">
        <Label htmlFor="automationId">Automation</Label>
        <Select value={automationId} onValueChange={setAutomationId}>
          <SelectTrigger>
            <SelectValue placeholder="All automations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All automations</SelectItem>
            {automations.map((automation) => (
              <SelectItem key={automation.id} value={automation.id.toString()}>
                {automation.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="started">Started</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SearchForm>
  );
}

