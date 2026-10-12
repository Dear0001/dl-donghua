import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export function AppShell({ children }: { children: ReactNode }) {
  return <><Navbar /><main className="min-h-[calc(100vh-150px)]">{children}</main><Footer /></>;
}
