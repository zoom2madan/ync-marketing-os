"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import type { LeadEnrichedDetails } from "@/types";

const schema = z.object({
  country: z.string().optional(),
  university: z.string().optional(),
  level: z.string().optional(),
  stream: z.string().optional(),
  subject: z.string().optional(),
  targetIntake: z.string().optional(),
  currentPursuit: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const LEVELS = ["Diploma", "Undergraduate", "Postgraduate", "PhD"];
const STREAMS = [
  "Arts & Humanities",
  "Engineering & Technology",
  "Life Sciences & Medicine",
  "Natural Sciences",
  "Social Sciences & Management",
];
const INTAKES = [
  "Spring-2026",
  "Summer-2026",
  "Fall-2026",
  "Winter-2026",
  "Spring-2027",
  "Summer-2027",
  "Fall-2027",
  "Winter-2027",
];
const PURSUITS = ["Studying", "Working", "Preparing For Admission"];

interface Props {
  leadId: number;
  data?: LeadEnrichedDetails;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EnrichedDetailsForm({ leadId, data, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: data ? {
      country: data.country ?? undefined,
      university: data.university ?? undefined,
      level: data.level ?? undefined,
      stream: data.stream ?? undefined,
      subject: data.subject ?? undefined,
      targetIntake: data.targetIntake ?? undefined,
      currentPursuit: data.currentPursuit ?? undefined,
    } : {},
  });

  const level = watch("level");
  const targetIntake = watch("targetIntake");
  const currentPursuit = watch("currentPursuit");

  const onSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/enriched-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert("Failed to save enriched details");
      }
    } catch {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...register("country")} placeholder="United States" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="university">University</Label>
          <Input id="university" {...register("university")} placeholder="Harvard University" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">Level</Label>
          <Select value={level} onValueChange={(v) => setValue("level", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stream">Stream</Label>
          <Select value={watch("stream")} onValueChange={(v) => setValue("stream", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select stream" />
            </SelectTrigger>
            <SelectContent>
              {STREAMS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" {...register("subject")} placeholder="Computer Science" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetIntake">Target Intake</Label>
          <Select value={targetIntake} onValueChange={(v) => setValue("targetIntake", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select intake" />
            </SelectTrigger>
            <SelectContent>
              {INTAKES.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentPursuit">Current Pursuit</Label>
          <Select value={currentPursuit} onValueChange={(v) => setValue("currentPursuit", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select current pursuit" />
            </SelectTrigger>
            <SelectContent>
              {PURSUITS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Details"}
        </Button>
      </DialogFooter>
    </form>
  );
}

