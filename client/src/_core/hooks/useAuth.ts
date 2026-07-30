import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { getCurrentLocalUser, logoutLocalUser } from "@/lib/localStorageDb";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    logoutLocalUser();
    utils.auth.me.setData(undefined, null);
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      console.warn("[Auth] Logout request warning:", error);
    } finally {
      localStorage.removeItem("manus-runtime-user-info");
      logoutLocalUser();
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      if (typeof window !== "undefined") {
        window.location.href = "/api/auth/logout";
      }
    }
  }, [logoutMutation, utils]);

  const isLoggedOut = typeof window !== "undefined" && localStorage.getItem("hexacv_logged_out") === "true";

  const localUser = useMemo(() => isLoggedOut ? null : getCurrentLocalUser(), [meQuery.data, meQuery.isLoading, isLoggedOut]);

  const activeUser = isLoggedOut ? null : (localUser as any) ?? meQuery.data ?? null;

  const state = useMemo(() => {
    if (activeUser) {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(activeUser)
      );
    } else {
      localStorage.removeItem("manus-runtime-user-info");
    }
    return {
      user: activeUser,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(activeUser),
    };
  }, [
    activeUser,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}

