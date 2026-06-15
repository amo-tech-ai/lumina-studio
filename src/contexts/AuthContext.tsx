import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { ensureProfile } from "@/services/profileService";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileError: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function syncProfile(user: User | null) {
  if (!user) return null;
  const result = await ensureProfile(user);
  return result.ok ? null : result.error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);
      if (data.session?.user) {
        setProfileError(await syncProfile(data.session.user));
      } else {
        setProfileError(null);
      }
      setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      if (nextSession?.user) {
        void syncProfile(nextSession.user).then((error) => {
          if (mounted) setProfileError(error);
        });
      } else {
        setProfileError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      profileError,
      signOut,
    }),
    [session, loading, profileError, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
