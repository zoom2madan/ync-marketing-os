"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CsvUpload } from "@/components/shared/csv-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface UploadResult {
  message: string;
  added: number;
  total: number;
  errors?: string[];
}

interface SegmentCustomersUploadProps {
  segmentId: number;
}

export function SegmentCustomersUpload({ segmentId }: SegmentCustomersUploadProps) {
  const router = useRouter();
  const [result, setResult] = useState<UploadResult | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    if (replaceExisting) {
      formData.append("replace", "true");
    }

    const response = await fetch(`/api/segments/${segmentId}/customers`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data: UploadResult = await response.json();
    setResult(data);
    
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="replace"
          checked={replaceExisting}
          onCheckedChange={(checked) => setReplaceExisting(checked === true)}
        />
        <Label htmlFor="replace" className="text-sm">
          Replace existing customers (clear segment first)
        </Label>
      </div>

      <CsvUpload
        onUpload={handleUpload}
        buttonText="Upload Customers CSV"
      />
      
      <p className="text-xs text-slate-500">
        CSV should have either &quot;customer_id&quot; or &quot;email&quot; column
      </p>
      
      {result && (
        <div className="text-sm space-y-1">
          <p className="text-green-600">
            {result.message}: {result.added} customers added
          </p>
          {result.errors && result.errors.length > 0 && (
            <div className="text-red-600">
              <p className="font-medium">Errors:</p>
              <ul className="list-disc list-inside">
                {result.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>...and {result.errors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

