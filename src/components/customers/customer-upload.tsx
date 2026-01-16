"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CsvUpload } from "@/components/shared/csv-upload";

interface UploadResult {
  message: string;
  created: number;
  updated: number;
  total: number;
  errors?: string[];
}

export function CustomerUpload() {
  const router = useRouter();
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/customers/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data: UploadResult = await response.json();
    setResult(data);
    
    // Refresh the page data after successful upload
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <CsvUpload
        onUpload={handleUpload}
        buttonText="Upload Customers CSV"
      />
      
      {result && (
        <div className="text-sm space-y-1">
          <p className="text-green-600">
            {result.message}: {result.created} created, {result.updated} updated
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

