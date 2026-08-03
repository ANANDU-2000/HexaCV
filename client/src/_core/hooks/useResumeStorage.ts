import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Resume } from "@shared/types";
import { useCallback } from "react";

export function useResumeStorage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  // Mutations for cloud
  const createResumeMutation = trpc.resume.create.useMutation();
  const updateResumeMutation = trpc.resume.update.useMutation();
  const deleteResumeMutation = trpc.resume.delete.useMutation();
  const restoreResumeMutation = trpc.resume.restore.useMutation();

  const saveBackupMutation = trpc.backup.save.useMutation();
  const deleteBackupMutation = trpc.backup.delete.useMutation();

  // Local storage keys
  const RESUMES_KEY = "hexacv_local_resumes";
  const BACKUPS_KEY_PREFIX = "hexacv_local_backups_";

  // 1. Resumes Local Storage IO
  const getLocalResumesIncludingDeleted = useCallback((): Array<Resume & { deletedAt?: string | null }> => {
    try {
      const data = localStorage.getItem(RESUMES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  /** Active (non-soft-deleted) local drafts only. */
  const getLocalResumes = useCallback((): Resume[] => {
    return getLocalResumesIncludingDeleted().filter(r => !r.deletedAt);
  }, [getLocalResumesIncludingDeleted]);

  const saveLocalResumes = useCallback((resumes: Array<Resume & { deletedAt?: string | null }>) => {
    localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes));
  }, []);

  // Public CRUD operations
  const listResumes = useCallback(async (): Promise<Resume[]> => {
    if (isAuthenticated) {
      try {
        const cloudResumes = await utils.resume.list.fetch();
        return cloudResumes.map(r => {
          const parsedContent = typeof r.content === 'string' ? JSON.parse(r.content) : r.content;
          return {
            id: r.id,
            userId: String(r.userId),
            title: r.title,
            templateId: r.templateId,
            jobDescriptionId: r.jobDescriptionId || undefined,
            sections: parsedContent?.sections || parsedContent || [],
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt)
          };
        });
      } catch (err) {
        console.warn("[ResumeStorage] Cloud resumes fetch failed, falling back to local storage:", err);
        return getLocalResumes().map(r => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt)
        }));
      }
    } else {
      return getLocalResumes().map(r => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt)
      }));
    }
  }, [isAuthenticated, getLocalResumes, utils]);

  const saveResume = useCallback(async (resume: Resume): Promise<Resume> => {
    if (isAuthenticated) {
      try {
        const cloudList = await utils.resume.list.fetch();
        const exists = cloudList.some(r => r.id === resume.id);
        const serializedContent = JSON.stringify({ sections: resume.sections });

        if (exists) {
          const res = await updateResumeMutation.mutateAsync({
            id: resume.id,
            title: resume.title,
            templateId: resume.templateId,
            content: serializedContent,
            jobDescriptionId: resume.jobDescriptionId,
          });
          await utils.resume.list.invalidate();
          if (!res) {
            throw new Error("Failed to update resume");
          }
          const parsedContent = typeof res.content === 'string' ? JSON.parse(res.content) : res.content;
          return {
            id: res.id,
            userId: String(res.userId),
            title: res.title,
            templateId: res.templateId,
            jobDescriptionId: res.jobDescriptionId || undefined,
            sections: parsedContent?.sections || parsedContent || [],
            createdAt: new Date(res.createdAt),
            updatedAt: new Date(res.updatedAt)
          };
        } else {
          const res = await createResumeMutation.mutateAsync({
            title: resume.title,
            templateId: resume.templateId,
            content: serializedContent,
            jobDescriptionId: resume.jobDescriptionId || undefined,
          });
          await utils.resume.list.invalidate();
          const parsedContent = typeof res.content === 'string' ? JSON.parse(res.content) : res.content;
          return {
            id: res.id,
            userId: String(res.userId),
            title: res.title,
            templateId: res.templateId,
            jobDescriptionId: res.jobDescriptionId || undefined,
            sections: parsedContent?.sections || parsedContent || [],
            createdAt: new Date(res.createdAt),
            updatedAt: new Date(res.updatedAt)
          };
        }
      } catch (err) {
        console.warn("[ResumeStorage] Cloud save failed, saving to local storage:", err);
        const local = getLocalResumesIncludingDeleted();
        const existingIdx = local.findIndex(r => r.id === resume.id && !r.deletedAt);

        if (existingIdx > -1) {
          local[existingIdx] = {
            ...resume,
            deletedAt: null,
            updatedAt: new Date()
          };
        } else {
          local.push({
            ...resume,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        saveLocalResumes(local);
        return resume;
      }
    } else {
      const local = getLocalResumesIncludingDeleted();
      const activeCount = local.filter(r => !r.deletedAt).length;
      const existingIdx = local.findIndex(r => r.id === resume.id && !r.deletedAt);

      if (existingIdx > -1) {
        local[existingIdx] = {
          ...resume,
          deletedAt: null,
          updatedAt: new Date()
        };
      } else {
        if (activeCount >= 3) {
          throw new Error("GUEST_LIMIT_REACHED");
        }
        local.push({
          ...resume,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      saveLocalResumes(local);
      return resume;
    }
  }, [isAuthenticated, getLocalResumesIncludingDeleted, saveLocalResumes, createResumeMutation, updateResumeMutation, utils]);

  const deleteResume = useCallback(async (id: string) => {
    if (isAuthenticated) {
      try {
        await deleteResumeMutation.mutateAsync({ id });
        await utils.resume.list.invalidate();
      } catch (err) {
        console.warn("[ResumeStorage] Cloud soft-delete failed, marking locally:", err);
        const local = getLocalResumesIncludingDeleted();
        const updated = local.map(r =>
          r.id === id ? { ...r, deletedAt: new Date().toISOString(), updatedAt: new Date() } : r
        );
        saveLocalResumes(updated);
      }
    } else {
      const local = getLocalResumesIncludingDeleted();
      const updated = local.map(r =>
        r.id === id ? { ...r, deletedAt: new Date().toISOString(), updatedAt: new Date() } : r
      );
      saveLocalResumes(updated);
    }
  }, [isAuthenticated, getLocalResumesIncludingDeleted, saveLocalResumes, deleteResumeMutation, utils]);

  const restoreResume = useCallback(async (id: string) => {
    if (isAuthenticated) {
      try {
        await restoreResumeMutation.mutateAsync({ id });
        await utils.resume.list.invalidate();
      } catch (err) {
        console.warn("[ResumeStorage] Cloud restore failed, clearing local deletedAt:", err);
        const local = getLocalResumesIncludingDeleted();
        const updated = local.map(r =>
          r.id === id ? { ...r, deletedAt: null, updatedAt: new Date() } : r
        );
        saveLocalResumes(updated);
      }
    } else {
      const local = getLocalResumesIncludingDeleted();
      const updated = local.map(r =>
        r.id === id ? { ...r, deletedAt: null, updatedAt: new Date() } : r
      );
      saveLocalResumes(updated);
    }
  }, [isAuthenticated, getLocalResumesIncludingDeleted, saveLocalResumes, restoreResumeMutation, utils]);

  // 2. Cloud Backups (e.g. cover letters, ATS reports, job matches)
  const getLocalBackups = useCallback((type: string): any[] => {
    try {
      const data = localStorage.getItem(BACKUPS_KEY_PREFIX + type);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  const saveLocalBackups = useCallback((type: string, backups: any[]) => {
    localStorage.setItem(BACKUPS_KEY_PREFIX + type, JSON.stringify(backups));
  }, []);

  const listBackups = useCallback(async (type: string): Promise<any[]> => {
    if (isAuthenticated) {
      try {
        const res = await utils.backup.list.fetch({ type });
        return res.map(b => ({
          ...b,
          content: typeof b.content === 'string' ? JSON.parse(b.content) : b.content,
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt)
        }));
      } catch (err) {
        console.warn(`[ResumeStorage] Cloud backup list failed for ${type}, returning local:`, err);
        return getLocalBackups(type).map(b => ({
          ...b,
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt)
        }));
      }
    } else {
      return getLocalBackups(type).map(b => ({
        ...b,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt)
      }));
    }
  }, [isAuthenticated, getLocalBackups, utils]);

  const saveBackup = useCallback(async (type: string, name: string, content: any): Promise<any> => {
    if (isAuthenticated) {
      const res = await saveBackupMutation.mutateAsync({
        type,
        name,
        content: typeof content === 'object' ? JSON.stringify(content) : content
      });
      await utils.backup.list.invalidate({ type });
      return res;
    } else {
      const local = getLocalBackups(type);
      const existingIdx = local.findIndex(b => b.name === name);
      const backupItem = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        name,
        content,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      if (existingIdx > -1) {
        local[existingIdx] = {
          ...local[existingIdx],
          content,
          updatedAt: new Date()
        };
      } else {
        local.push(backupItem);
      }
      saveLocalBackups(type, local);
      return backupItem;
    }
  }, [isAuthenticated, getLocalBackups, saveLocalBackups, saveBackupMutation, utils]);

  const deleteBackup = useCallback(async (id: string, type: string) => {
    if (isAuthenticated) {
      await deleteBackupMutation.mutateAsync({ id });
      await utils.backup.list.invalidate({ type });
    } else {
      const local = getLocalBackups(type);
      const updated = local.filter(b => b.id !== id);
      saveLocalBackups(type, updated);
    }
  }, [isAuthenticated, getLocalBackups, saveLocalBackups, deleteBackupMutation, utils]);

  // Migrates local guest data to the cloud on registration
  const syncGuestDataToCloud = useCallback(async () => {
    const localResumes = getLocalResumes();
    const resumesToUpload = localResumes.slice(0, 3);
    for (const r of resumesToUpload) {
      try {
        const serializedContent = JSON.stringify({ sections: r.sections });
        await createResumeMutation.mutateAsync({
          title: r.title,
          templateId: r.templateId,
          content: serializedContent,
          jobDescriptionId: r.jobDescriptionId || undefined
        });
      } catch (e) {
        console.error("[Storage Sync] Failed to sync local resume:", e);
      }
    }

    const backupTypes = ["cover_letter", "ats_report", "job_matches"];
    for (const type of backupTypes) {
      const backups = getLocalBackups(type);
      for (const b of backups) {
        try {
          await saveBackupMutation.mutateAsync({
            type: b.type,
            name: b.name,
            content: typeof b.content === 'object' ? JSON.stringify(b.content) : b.content
          });
        } catch (e) {
          console.error(`[Storage Sync] Failed to sync local ${type}:`, e);
        }
      }
      localStorage.removeItem(BACKUPS_KEY_PREFIX + type);
    }

    localStorage.removeItem(RESUMES_KEY);
    await utils.resume.list.invalidate();
  }, [getLocalResumes, getLocalBackups, createResumeMutation, saveBackupMutation, utils]);

  return {
    listResumes,
    saveResume,
    deleteResume,
    restoreResume,
    listBackups,
    saveBackup,
    deleteBackup,
    syncGuestDataToCloud,
    getLocalResumes,
  };
}
