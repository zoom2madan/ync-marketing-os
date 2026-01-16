"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CronBuilder } from "./cron-builder";
import { Loader2 } from "lucide-react";
import type { Automation, CustomerSegment, MessageTemplate } from "@/types";

const automationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  customerSegmentId: z.number().min(1, "Segment is required"),
  messageTemplateId: z.number().min(1, "Template is required"),
  cron: z.string().min(1, "Schedule is required"),
  isActive: z.boolean(),
});

type AutomationFormData = z.infer<typeof automationSchema>;

interface AutomationFormProps {
  automation?: Automation;
  isEdit?: boolean;
}

export function AutomationForm({ automation, isEdit = false }: AutomationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<Pick<CustomerSegment, "id" | "name" | "type">[]>([]);
  const [templates, setTemplates] = useState<Pick<MessageTemplate, "id" | "name" | "type">[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AutomationFormData>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      name: automation?.name || "",
      description: automation?.description || "",
      customerSegmentId: automation?.customerSegmentId || 0,
      messageTemplateId: automation?.messageTemplateId || 0,
      cron: automation?.cron || "0 9 * * *",
      isActive: automation?.isActive ?? true,
    },
  });

  const cronValue = watch("cron");
  const isActiveValue = watch("isActive");

  useEffect(() => {
    // Fetch segments and templates for dropdowns
    Promise.all([
      fetch("/api/segments?all=true").then((res) => res.json()),
      fetch("/api/templates?all=true").then((res) => res.json()),
    ])
      .then(([segmentsData, templatesData]) => {
        setSegments(segmentsData);
        setTemplates(templatesData);
      })
      .catch(console.error);
  }, []);

  const onSubmit = async (data: AutomationFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEdit ? `/api/automations/${automation?.id}` : "/api/automations";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save automation");
      }

      const savedAutomation = await response.json();
      router.push(`/automations/${savedAutomation.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Automation" : "Create New Automation"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Weekly Newsletter"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2 flex items-end gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={isActiveValue}
                  onCheckedChange={(checked) => setValue("isActive", checked === true)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register("description")}
              placeholder="Describe this automation..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerSegmentId">Customer Segment *</Label>
              <Select
                value={watch("customerSegmentId")?.toString() || ""}
                onValueChange={(v) => setValue("customerSegmentId", parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a segment" />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id.toString()}>
                      {segment.name} ({segment.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerSegmentId && (
                <p className="text-sm text-red-600">{errors.customerSegmentId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageTemplateId">Message Template *</Label>
              <Select
                value={watch("messageTemplateId")?.toString() || ""}
                onValueChange={(v) => setValue("messageTemplateId", parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name} ({template.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.messageTemplateId && (
                <p className="text-sm text-red-600">{errors.messageTemplateId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Schedule (CRON) *</Label>
            <CronBuilder
              value={cronValue}
              onChange={(cron) => setValue("cron", cron)}
            />
            {errors.cron && (
              <p className="text-sm text-red-600">{errors.cron.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Update Automation"
              ) : (
                "Create Automation"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

