import { useCallback, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { getSessionExpiry, isSessionExpired } from "../../lib/adminSession";
import { checkIsAdmin } from "../../lib/rentals";
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigError,
} from "../../lib/supabase";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";
import "./admin.css";

const Shell = ({ children }) => (
  <div className="cms">
    <Toaster
      position="top-right"
      toastOptions={{
        style: { fontFamily: "var(--font-body)", fontSize: "0.9rem" },
      }}
    />
    {children}
  </div>
);

const CenteredCard = ({ children }) => (
  <div className="cms-center">
    <div className="cms-auth-card">
      <img src="/logo/vlxlogo.png" alt="VLX" className="cms-auth-logo" />
      {children}
    </div>
  </div>
);

const Admin = () => {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [adminCheck, setAdminCheck] = useState({
    userId: null,
    isAdmin: false,
  });

  // Sign out this browser and ask for the password again.
  const expireSession = useCallback(() => {
    setSession(null);
    supabase?.auth.signOut({ scope: "local" });
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // A login saved in the browser that is older than 30 minutes is not reused.
      if (nextSession && isSessionExpired(nextSession)) {
        setSession(null);
        setAuthReady(true);
        // Supabase advises not to call auth methods inside this callback.
        setTimeout(() => supabase.auth.signOut({ scope: "local" }), 0);
        return;
      }
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const expiresAt = session ? getSessionExpiry(session) : 0;

  // Enforce the 30-minute limit while the CMS is open. Also re-check when the
  // tab regains focus, because timers pause while a laptop is asleep.
  useEffect(() => {
    if (!expiresAt) return undefined;
    const check = () => {
      if (Date.now() >= expiresAt) expireSession();
    };
    const timeout = setTimeout(
      check,
      Math.max(0, expiresAt - Date.now()) + 250,
    );
    const interval = setInterval(check, 15000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [expiresAt, expireSession]);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    checkIsAdmin()
      .then((isAdmin) => !cancelled && setAdminCheck({ userId, isAdmin }))
      .catch(() => !cancelled && setAdminCheck({ userId, isAdmin: false }));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signOut = () => {
    supabase?.auth.signOut({ scope: "local" });
  };

  if (!isSupabaseConfigured) {
    return (
      <Shell>
        <CenteredCard>
          <h1 className="cms-auth-title">Connect the CMS</h1>
          {supabaseConfigError ? (
            <p className="cms-alert" role="alert">
              {supabaseConfigError}
            </p>
          ) : (
            <p className="cms-muted">
              The Supabase connection details haven’t been added yet.
            </p>
          )}
          <p className="cms-muted">
            On Netlify:{" "}
            <strong>Site configuration → Environment variables</strong>.
            Locally: the <code>.env.local</code> file. Paste the values only,
            with no quotes, then redeploy (or restart <code>npm run dev</code>):
          </p>
          <pre className="cms-code">
            VITE_SUPABASE_URL=https://abcdefgh.supabase.co{"\n"}
            VITE_SUPABASE_ANON_KEY=eyJhbGciOi…
          </pre>
        </CenteredCard>
      </Shell>
    );
  }

  if (!authReady) {
    return (
      <Shell>
        <div className="cms-center">
          <div className="cms-spinner" aria-label="Loading" />
        </div>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <CenteredCard>
          <AdminLogin />
        </CenteredCard>
      </Shell>
    );
  }

  if (adminCheck.userId !== userId) {
    return (
      <Shell>
        <div className="cms-center">
          <div className="cms-spinner" aria-label="Checking access" />
        </div>
      </Shell>
    );
  }

  if (!adminCheck.isAdmin) {
    return (
      <Shell>
        <CenteredCard>
          <h1 className="cms-auth-title">No CMS access</h1>
          <p className="cms-muted">
            You are signed in as <strong>{session.user.email}</strong>, but this
            account is not on the CMS admin list. Ask the site owner to add your
            email to the <code>cms_admins</code> table.
          </p>
          <button
            type="button"
            className="cms-btn cms-btn-primary cms-btn-block"
            onClick={signOut}
          >
            Sign out
          </button>
        </CenteredCard>
      </Shell>
    );
  }

  return (
    <Shell>
      <AdminDashboard userEmail={session.user.email} onSignOut={signOut} />
    </Shell>
  );
};

export default Admin;
