"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddClientDialog } from "./add-client-dialog";

export function ClientsHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-add-client", handler);
    return () => window.removeEventListener("open-add-client", handler);
  }, []);

  return (
    <>
      <AddClientDialog open={open} onOpenChange={setOpen} />
      <Button
      size="lg"
      onClick={() => setOpen(true)}
      className="rounded-xl gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      aria-label="Add new client"
    >
      <Plus className="h-5 w-5" />
      Add Client
      </Button>
    </>
  );
}
