"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Mail, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import type { Template } from "@/types";

interface TemplateDetailTabsProps {
  template: Template;
}

export function TemplateDetailTabs({ template }: TemplateDetailTabsProps) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                {template.type === "email" ? (
                  <Mail className="h-4 w-4 text-slate-400" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-green-500" />
                )}
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <Badge variant={template.type === "email" ? "default" : "secondary"}>
                    {template.type}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500">Templating Engine</p>
                <p className="font-medium">{template.templatingType}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Created</p>
                <p className="font-medium">{format(new Date(template.createdAt), "PPP")}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Updated</p>
                <p className="font-medium">{format(new Date(template.updatedAt), "PPP")}</p>
              </div>
            </div>

            {template.subject && (
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500">Subject</p>
                <p className="font-medium">{template.subject}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-slate-500 mb-2">Message Content</p>
              <pre className="p-3 bg-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                {template.message}
              </pre>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preview">
        <TemplatePreview templateId={template.id} />
      </TabsContent>
    </Tabs>
  );
}

