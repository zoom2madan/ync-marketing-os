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
import { Loader2 } from "lucide-react";
import type { CustomerSegment, SegmentType } from "@/types";

const segmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["manual", "sql", "function"]),
  selectionSql: z.string().optional(),
  handlerFunction: z.string().optional(),
});

type SegmentFormData = z.infer<typeof segmentSchema>;

interface SegmentFormProps {
  segment?: CustomerSegment;
  isEdit?: boolean;
}

export function SegmentForm({ segment, isEdit = false }: SegmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handlers, setHandlers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SegmentFormData>({
    resolver: zodResolver(segmentSchema),
    defaultValues: {
      name: segment?.name || "",
      description: segment?.description || "",
      type: segment?.type || "manual",
      selectionSql: segment?.selectionSql || "",
      handlerFunction: segment?.handlerFunction || "",
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    // Fetch available handlers
    fetch("/api/segments/handlers")
      .then((res) => res.json())
      .then((data) => setHandlers(data))
      .catch(console.error);
  }, []);

  const onSubmit = async (data: SegmentFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEdit ? `/api/segments/${segment?.id}` : "/api/segments";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save segment");
      }

      const savedSegment = await response.json();
      router.push(`/segments/${savedSegment.id}`);
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
        <CardTitle>{isEdit ? "Edit Segment" : "Create New Segment"}</CardTitle>
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
                placeholder="My Customer Segment"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={selectedType}
                onValueChange={(value: SegmentType) => setValue("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (Upload CSV)</SelectItem>
                  <SelectItem value="sql">SQL Query</SelectItem>
                  <SelectItem value="function">Function Handler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register("description")}
              placeholder="Describe this segment..."
            />
          </div>

          {selectedType === "sql" && (
            <div className="space-y-2">
              <Label htmlFor="selectionSql">Selection SQL *</Label>
              <textarea
                id="selectionSql"
                {...register("selectionSql")}
                className="w-full min-h-32 p-3 text-sm font-mono border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="SELECT customer_id FROM customers WHERE..."
              />
              <p className="text-xs text-slate-500">
                SQL query must return a customer_id column
              </p>
            </div>
          )}

          {selectedType === "function" && (
            <div className="space-y-2">
              <Label htmlFor="handlerFunction">Handler Function *</Label>
              <Select
                value={watch("handlerFunction")}
                onValueChange={(value) => setValue("handlerFunction", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a handler" />
                </SelectTrigger>
                <SelectContent>
                  {handlers.map((handler) => (
                    <SelectItem key={handler} value={handler}>
                      {handler}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Pre-defined function that returns customer IDs
              </p>
            </div>
          )}

          {selectedType === "manual" && !isEdit && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">
                After creating this segment, you can upload a CSV file with
                customer IDs or emails to populate the segment.
              </p>
            </div>
          )}

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
                "Update Segment"
              ) : (
                "Create Segment"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

