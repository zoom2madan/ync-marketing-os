"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";

interface TemplatePreviewProps {
  templateId: number;
}

export function TemplatePreview({ templateId }: TemplatePreviewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/templates/${templateId}/preview`);

      if (!response.ok) {
        throw new Error("Failed to load preview");
      }

      const data = await response.json();
      setHtml(data.html);
      setSubject(data.subject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [templateId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Preview</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={loadPreview}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {subject && (
              <div className="p-3 bg-slate-100 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                  Subject
                </p>
                <p className="font-medium">{subject}</p>
              </div>
            )}
            <div className="border rounded-lg overflow-hidden">
              <iframe
                srcDoc={html || ""}
                className="w-full h-96 bg-white"
                title="Template Preview"
              />
            </div>
            <p className="text-xs text-slate-500">
              Preview rendered with sample data: John Doe (john.doe@example.com)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

