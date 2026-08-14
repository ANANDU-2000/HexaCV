import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { FilePlus2, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useResumeStorage } from "@/_core/hooks/useResumeStorage";
import ResumeHubCard from "@/components/ResumeHubCard";
import type { Resume } from "@shared/types";

/** Guest soft-cap is 3 drafts; banner at 2/3 (see ResumeBuilder / useResumeStorage). */
const GUEST_DRAFT_CAP = 3;
const GUEST_BANNER_AT = 2;

export default function DashboardHome() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const storage = useResumeStorage();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await storage.listResumes();
      setResumes(list);
    } catch {
      toast.error("Could not load resumes. Try again.");
    } finally {
      setLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount; refresh after mutations
  }, []);

  const guestDraftCount = !isAuthenticated ? resumes.length : 0;
  const showGuestBanner = !isAuthenticated && guestDraftCount >= GUEST_BANNER_AT;

  const handleEdit = (id: string) => {
    setLocation(`/dashboard/builder/edit?id=${encodeURIComponent(id)}`);
  };

  const handleNewResume = () => {
    setLocation("/builder/target");
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    const title = resumes.find((r) => r.id === id)?.title || "Resume";
    setDeleting(true);
    try {
      await storage.deleteResume(id);
      setPendingDeleteId(null);
      await refresh();
      toast.success(`“${title}” removed`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await storage.restoreResume(id);
              await refresh();
              toast.success("Resume restored");
            } catch {
              toast.error("Could not restore. Try again.");
            }
          },
        },
        duration: 8000,
      });
    } catch {
      toast.error("Could not delete. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {user?.name?.split(" ")[0]
            ? `Hi, ${user.name.split(" ")[0]}`
            : "Your resumes"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a draft or start a new one.
        </p>
      </div>

      {/* [guest-banner] Persistent at 2/3 of the 3-draft guest cap */}
      {showGuestBanner && (
        <div
          className="rounded-xl border border-accent-warm bg-accent-warm/10 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          <p className="font-semibold text-accent-warm">
            Guest drafts stay on this device ({guestDraftCount}/{GUEST_DRAFT_CAP})
          </p>
          <p className="mt-1 text-muted-foreground">
            Sign in to sync them and free the local slot before you hit the cap.
          </p>
          <button
            type="button"
            onClick={() => setLocation("/login?convert=true")}
            className="mt-3 min-h-11 rounded-[18px] bg-accent-warm px-4 text-sm font-semibold text-white hover:bg-accent-warm/90"
          >
            Sign in to keep drafts
          </button>
        </div>
      )}

      {/* [layout] Primary CTA */}
      <button
        type="button"
        onClick={handleNewResume}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-accent-warm text-base font-bold text-white transition hover:bg-accent-warm/90 active:scale-[0.99]"
      >
        <FilePlus2 className="h-5 w-5" />
        New resume
      </button>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[440px] animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      )}

      {/* [empty-state] Landing Step 3 voice — not "No resumes yet" */}
      {!loading && resumes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <p className="max-w-sm text-base font-medium text-foreground">
            Upload a resume or write from scratch. Improve clarity and ATS compatibility —
            starting with one draft.
          </p>
          <button
            type="button"
            onClick={handleNewResume}
            className="min-h-11 rounded-[18px] bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            New resume
          </button>
        </div>
      )}

      {/* [layout] Resume card grid — 1 col @375, 2–3 @1440, 3–4 @1920 */}
      {!loading && resumes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {resumes.map((resume) => (
            <ResumeHubCard
              key={resume.id}
              resume={resume}
              onEdit={handleEdit}
              onDelete={setPendingDeleteId}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {pendingDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[color:var(--ink)]/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-resume-title"
          onClick={() => !deleting && setPendingDeleteId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-resume-title" className="font-display text-lg font-semibold text-foreground">
              Remove this resume?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              It will leave your list. You can undo from the toast for a short window. Permanent
              purge after 30 days is a follow-up.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[18px] bg-accent-warm text-sm font-semibold text-white hover:bg-accent-warm/90 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Remove
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDeleteId(null)}
                className="min-h-11 flex-1 rounded-[18px] border border-border text-sm font-semibold text-foreground disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
