"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Shield, Search } from "lucide-react";
import { AdminSidebarTrigger } from "./admin-sidebar";
import { useState } from "react";

type Props = { name: string; email: string };

export function AdminHeader({ name, email }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border/50 bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 lg:px-6">
      <AdminSidebarTrigger />
      <div className="flex-1 max-w-sm hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-xl bg-muted/50 border-border/50 w-full text-sm"
            aria-label="Search"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-xl h-9 px-2 hover:bg-muted/70"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:inline-block text-sm font-medium truncate max-w-[140px]">
                {name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-lg border-border/50">
            <div className="px-3 py-2.5 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground truncate">{email}</p>
            </div>
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-xl cursor-pointer focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
