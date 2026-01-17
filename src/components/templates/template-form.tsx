"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye } from "lucide-react";
import type { MessageTemplate, MessageType } from "@/types";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["email", "whatsapp"]),
  subject: z.string().optional(),
  message: z.string().min(1, "Message content is required"),
  fromEmail: z.string().optional(),
  replyTo: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateFormProps {
  template?: MessageTemplate;
  isEdit?: boolean;
}

export function TemplateForm({ template, isEdit = false }: TemplateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || "",
      type: template?.type || "email",
      subject: template?.subject || "",
      message: template?.message || "",
      fromEmail: template?.fromEmail || "",
      replyTo: template?.replyTo || "",
    },
  });

  const selectedType = watch("type");
  const message = watch("message");

  const loadPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch(
        template?.id
          ? `/api/templates/${template.id}/preview`
          : "/api/templates/preview",
        template?.id
          ? { method: "GET" }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message, subject: watch("subject") }),
            }
      );

      if (response.ok) {
        const data = await response.json();
        setPreviewHtml(data.html);
      }
    } catch (err) {
      console.error("Preview error:", err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const onSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEdit ? `/api/templates/${template?.id}` : "/api/templates";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          templatingType: "mjml",
          // Only include email fields for email templates
          fromEmail: data.type === "email" ? data.fromEmail : undefined,
          replyTo: data.type === "email" ? data.replyTo : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save template");
      }

      const savedTemplate = await response.json();
      router.push(`/templates/${savedTemplate.id}`);
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
        <CardTitle>{isEdit ? "Edit Template" : "Create New Template"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="editor">
          <TabsList className="mb-4">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview" onClick={loadPreview}>
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor">
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
                    placeholder="Welcome Email"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={selectedType}
                    onValueChange={(value: MessageType) => setValue("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedType === "email" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      {...register("subject")}
                      placeholder="Welcome to Your Next Campus!"
                    />
                    {errors.subject && (
                      <p className="text-sm text-red-600">{errors.subject.message}</p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">From Email</Label>
                      <Input
                        id="fromEmail"
                        {...register("fromEmail")}
                        placeholder="Your Next Campus<noreply@comms.yournextcampus.com>"
                      />
                      <p className="text-xs text-slate-500">
                        Format: Name&lt;email@domain.com&gt;
                      </p>
                      {errors.fromEmail && (
                        <p className="text-sm text-red-600">{errors.fromEmail.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="replyTo">Reply-To Email</Label>
                      <Input
                        id="replyTo"
                        type="email"
                        {...register("replyTo")}
                        placeholder="hello@yournextcampus.com"
                      />
                      {errors.replyTo && (
                        <p className="text-sm text-red-600">{errors.replyTo.message}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Message Content *</Label>
                <textarea
                  id="message"
                  {...register("message")}
                  className="w-full min-h-64 p-3 text-sm font-mono border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder={
                    selectedType === "email"
                      ? `<mj-section>
  <mj-column>
    <mj-text>Hello {{firstName}},</mj-text>
    <mj-text>Welcome to Your Next Campus!</mj-text>
  </mj-column>
</mj-section>`
                      : "Hello {{firstName}}! Welcome to Your Next Campus."
                  }
                />
                {errors.message && (
                  <p className="text-sm text-red-600">{errors.message.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  Use {"{{variableName}}"} for dynamic content. Available: firstName,
                  lastName, email
                </p>
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
                    "Update Template"
                  ) : (
                    "Create Template"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="preview">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Preview with sample data
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadPreview}
                  disabled={isLoadingPreview}
                >
                  {isLoadingPreview ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>

              {isLoadingPreview ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : previewHtml ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-96 bg-white"
                    title="Template Preview"
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  Click &quot;Refresh&quot; to generate preview
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

