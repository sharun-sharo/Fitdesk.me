"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { AddClientDialog } from "./add-client-dialog";
import { BulkUploadDialog } from "./bulk-upload-dialog";

export function ClientsHeader() {
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-add-client", handler);
    return () => window.removeEventListener("open-add-client", handler);
  }, []);

  return (
    <>
      <AddClientDialog open={open} onOpenChange={setOpen} />
      <BulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSuccess={() => setBulkOpen(false)}
      />
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setBulkOpen(true)}
          className="rounded-xl gap-2"
          aria-label="Bulk upload clients"
        >
          <Upload className="h-5 w-5" />
          Bulk upload
        </Button>
        <Button
          size="lg"
          onClick={() => setOpen(true)}
          className="rounded-xl gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          aria-label="Add new client"
        >
          <Plus className="h-5 w-5" />
          Add Client
        </Button>
      </div>
    </>
  );
}
