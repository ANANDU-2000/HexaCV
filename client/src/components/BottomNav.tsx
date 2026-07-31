import { useAuth } from "@/_core/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/sheet";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  FileText,
  Gift,
  LogOut,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const navItems = [
  { icon: FileText, label: "Builder", path: "/builder" },
  { icon: Zap, label: "ATS", path: "/dashboard/ats" },
  { icon: Gift, label: "Affiliate", path: "/dashboard/affiliate" },
  { icon: CreditCard, label: "Billing", path: "/dashboard/billing" },
];

const moreItems = [
  { icon: ShieldCheck, label: "Admin Page", path: "/admin", adminOnly: true },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export function BottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) =>
    location === path || (path === "/admin" && location.startsWith("/admin"));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-surface-elevated border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-full items-center justify-around px-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="flex flex-col items-center justify-center gap-0.5 h-full min-w-0 flex-1"
              >
                <item.icon
                  strokeWidth={1.5}
                  className={cn(
                    "h-6 w-6",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] leading-tight",
                    active
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-0.5 h-full min-w-0 flex-1">
                <MoreHorizontal
                  strokeWidth={1.5}
                  className="h-6 w-6 text-muted-foreground"
                />
                <span className="text-[10px] leading-tight text-muted-foreground">
                  More
                </span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-xl p-6 pb-[env(safe-area-inset-bottom)]"
            >
              <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-border" />

              <div className="space-y-1">
                {moreItems.map((item) => {
                  if ((item as any).adminOnly && user?.role !== "admin")
                    return null;
                  const active = isActive(item.path!);
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setLocation(item.path!);
                        setSheetOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-accent transition-colors text-left",
                        active && "text-primary"
                      )}
                    >
                      <item.icon
                        strokeWidth={1.5}
                        className={cn(
                          "h-5 w-5",
                          active ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          active ? "font-medium" : "text-foreground"
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}

                <div className="border-t border-border my-2" />

                <button
                  onClick={() => {
                    logout();
                    setSheetOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-accent transition-colors text-left text-destructive"
                >
                  <LogOut strokeWidth={1.5} className="h-5 w-5" />
                  <span className="text-sm font-medium">Log out</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
