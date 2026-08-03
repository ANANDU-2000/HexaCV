import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { FilePlus2, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useResumeStorage } from "@/_core/hooks/useResumeStorage";
import ResumeHubCard from "@/components/ResumeHubCard";
import type { Resume } from "@shared/types";

const T = {
  surface: "#FFFFFF",
  elevated: "#FBF8F3",
  primary: "#123832",
  primaryText: "#123832",
  accent: "#C5622A",
  text: "#1C1B18",
  muted: "#635F55",
  outlineVariant: "#E4DFD3",
  success: "#3F7A54",
};

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
    <div className="flex flex-col gap-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: T.text }}>
          {user?.name?.split(" ")[0]
            ? `Hi, ${user.name.split(" ")[0]}`
            : "Your resumes"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>
          Open a draft or start a new one.
        </p>
      </div>

      {/* [guest-banner] Persistent at 2/3 of the 3-draft guest cap */}
      {showGuestBanner && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: T.accent,
            backgroundColor: `${T.accent}18`,
            color: T.text,
          }}
          role="status"
        >
          <p className="font-semibold" style={{ color: T.accent }}>
            Guest drafts stay on this device ({guestDraftCount}/{GUEST_DRAFT_CAP})
          </p>
          <p className="mt-1" style={{ color: T.muted }}>
            Sign in to sync them and free the local slot before you hit the cap.
          </p>
          <button
            type="button"
            onClick={() => setLocation("/login?convert=true")}
            className="mt-3 min-h-[44px] rounded-xl px-4 text-sm font-semibold"
            style={{ backgroundColor: T.accent, color: "#fff" }}
          >
            Sign in to keep drafts
          </button>
        </div>
      )}

      {/* [layout] Primary CTA */}
      <button
        type="button"
        onClick={handleNewResume}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-base font-bold transition hover:opacity-90 active:scale-[0.99]"
        style={{ backgroundColor: T.accent, color: "#fff" }}
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
              className="h-[440px] animate-pulse rounded-2xl"
              style={{ backgroundColor: T.elevated }}
            />
          ))}
        </div>
      )}

      {/* [empty-state] Landing Step 3 voice — not "No resumes yet" */}
      {!loading && resumes.length === 0 && (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border px-6 py-16 text-center"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}
        >
          <p className="max-w-sm text-base font-medium" style={{ color: T.text }}>
            Upload a resume or write from scratch. Improve clarity and ATS compatibility —
            starting with one draft.
          </p>
          <button
            type="button"
            onClick={handleNewResume}
            className="min-h-[44px] rounded-xl px-5 text-sm font-semibold"
            style={{ backgroundColor: T.primary, color: "#fff" }}
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-resume-title"
          onClick={() => !deleting && setPendingDeleteId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-5"
            style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-resume-title" className="text-lg font-bold" style={{ color: T.text }}>
              Remove this resume?
            </h2>
            <p className="mt-2 text-sm" style={{ color: T.muted }}>
              It will leave your list. You can undo from the toast for a short window. Permanent
              purge after 30 days is a follow-up.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: T.accent, color: "#fff" }}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Remove
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDeleteId(null)}
                className="min-h-[44px] flex-1 rounded-xl border text-sm font-semibold"
                style={{ borderColor: T.outlineVariant, color: T.text }}
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
