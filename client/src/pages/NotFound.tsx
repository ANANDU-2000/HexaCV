import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";
import SiteHeader from "@/shared/layout/SiteHeader";
import SiteFooter from "@/shared/layout/SiteFooter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <Card className="mx-4 w-full max-w-lg border-border bg-card shadow-sm">
          <CardContent className="pb-8 pt-8 text-center">
            <div className="mb-6 flex justify-center">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>

            <h1 className="mb-2 font-display text-4xl font-semibold text-foreground">404</h1>

            <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
              Page Not Found
            </h2>

            <p className="mb-8 leading-relaxed text-muted-foreground">
              Sorry, the page you are looking for doesn't exist.
              <br />
              It may have been moved or deleted.
            </p>

            <div
              id="not-found-button-group"
              className="flex flex-col justify-center gap-3 sm:flex-row"
            >
              <Button
                onClick={handleGoHome}
                className="min-h-11 rounded-[18px] bg-primary px-6 py-2.5 text-primary-foreground hover:bg-primary/90"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
