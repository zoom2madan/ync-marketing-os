"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CronParts } from "@/types";

interface CronBuilderProps {
  value: string;
  onChange: (cron: string) => void;
}

const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString());
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString());
const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];
const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

function parseCron(cron: string): CronParts {
  const parts = cron.split(" ");
  return {
    minute: parts[0] || "*",
    hour: parts[1] || "*",
    dayOfMonth: parts[2] || "*",
    month: parts[3] || "*",
    dayOfWeek: parts[4] || "*",
  };
}

function buildCron(parts: CronParts): string {
  return `${parts.minute} ${parts.hour} ${parts.dayOfMonth} ${parts.month} ${parts.dayOfWeek}`;
}

function describeCron(cron: string): string {
  const parts = parseCron(cron);
  const descriptions: string[] = [];

  // Time
  if (parts.minute === "*" && parts.hour === "*") {
    descriptions.push("Every minute");
  } else if (parts.minute !== "*" && parts.hour === "*") {
    descriptions.push(`Every hour at minute ${parts.minute}`);
  } else if (parts.minute !== "*" && parts.hour !== "*") {
    const hour = parseInt(parts.hour, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    descriptions.push(`At ${displayHour}:${parts.minute.padStart(2, "0")} ${ampm}`);
  }

  // Day of week
  if (parts.dayOfWeek !== "*") {
    const day = DAYS_OF_WEEK.find((d) => d.value === parts.dayOfWeek);
    descriptions.push(`on ${day?.label || parts.dayOfWeek}`);
  }

  // Day of month
  if (parts.dayOfMonth !== "*") {
    descriptions.push(`on day ${parts.dayOfMonth} of the month`);
  }

  // Month
  if (parts.month !== "*") {
    const month = MONTHS.find((m) => m.value === parts.month);
    descriptions.push(`in ${month?.label || parts.month}`);
  }

  return descriptions.join(" ") || "Invalid CRON expression";
}

export function CronBuilder({ value, onChange }: CronBuilderProps) {
  const [parts, setParts] = useState<CronParts>(parseCron(value));
  const [manualInput, setManualInput] = useState(value);
  const [activeTab, setActiveTab] = useState("builder");

  useEffect(() => {
    setParts(parseCron(value));
    setManualInput(value);
  }, [value]);

  const handlePartChange = (key: keyof CronParts, newValue: string) => {
    const newParts = { ...parts, [key]: newValue };
    setParts(newParts);
    const newCron = buildCron(newParts);
    setManualInput(newCron);
    onChange(newCron);
  };

  const handleManualChange = (newCron: string) => {
    setManualInput(newCron);
    if (newCron.split(" ").length === 5) {
      setParts(parseCron(newCron));
      onChange(newCron);
    }
  };

  const presets = [
    { label: "Every hour", cron: "0 * * * *" },
    { label: "Every day at 9 AM", cron: "0 9 * * *" },
    { label: "Every Monday at 9 AM", cron: "0 9 * * 1" },
    { label: "First day of month at 9 AM", cron: "0 9 1 * *" },
    { label: "Every weekday at 9 AM", cron: "0 9 * * 1-5" },
  ];

  return (
    <Card>
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="minute">Minute</Label>
                <Select value={parts.minute} onValueChange={(v) => handlePartChange("minute", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">Every minute (*)</SelectItem>
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m.padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hour">Hour</Label>
                <Select value={parts.hour} onValueChange={(v) => handlePartChange("hour", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">Every hour (*)</SelectItem>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h.padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">Day of Month</Label>
                <Select
                  value={parts.dayOfMonth}
                  onValueChange={(v) => handlePartChange("dayOfMonth", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">Every day (*)</SelectItem>
                    {DAYS_OF_MONTH.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Select value={parts.month} onValueChange={(v) => handlePartChange("month", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">Every month (*)</SelectItem>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select
                  value={parts.dayOfWeek}
                  onValueChange={(v) => handlePartChange("dayOfWeek", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">Every day (*)</SelectItem>
                    {DAYS_OF_WEEK.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cronExpression">CRON Expression</Label>
              <Input
                id="cronExpression"
                value={manualInput}
                onChange={(e) => handleManualChange(e.target.value)}
                placeholder="* * * * *"
                className="font-mono"
              />
              <p className="text-xs text-slate-500">
                Format: minute hour day-of-month month day-of-week
              </p>
            </div>
          </TabsContent>

          <TabsContent value="presets" className="space-y-2">
            {presets.map((preset) => (
              <button
                key={preset.cron}
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={() => {
                  handleManualChange(preset.cron);
                  setActiveTab("builder");
                }}
              >
                <div className="font-medium">{preset.label}</div>
                <code className="text-xs text-slate-500">{preset.cron}</code>
              </button>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-slate-100 rounded-lg">
          <p className="text-sm font-medium text-slate-700">Schedule Preview</p>
          <p className="text-sm text-slate-600 mt-1">{describeCron(manualInput)}</p>
          <code className="text-xs text-slate-500 mt-2 block">{manualInput}</code>
        </div>
      </CardContent>
    </Card>
  );
}

