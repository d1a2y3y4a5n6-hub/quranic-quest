import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Noor, Quran & adhkar discipline" },
      {
        name: "description",
        content:
          "Sign in to Noor to set your daily Quran and adhkar target and keep your distractions locked until it is done.",
      },
      { property: "og:title", content: "Sign in — Noor" },
      {
        property: "og:description",
        content: "Set a daily Quran and adhkar target, and stay locked in until it is complete.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/today", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/today", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (err) throw err;
        if (!data.session) {
          setMessage("Check your email to confirm your account, then come back and sign in.");
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in did not complete. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/today", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="geo-pattern h-2 w-full opacity-30" />
      <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-6 py-10">
        <div className="text-center">
          <span className="arabesque-pattern mx-auto grid size-14 place-items-center rounded-2xl bg-primary font-arabic text-2xl text-primary-foreground">
            نور
          </span>
          <h1 className="mt-4 font-display text-[27px] font-semibold leading-tight">
            {mode === "signin" ? "Welcome back" : "Begin your path"}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            One lesson at a time, until the Quran is complete.
          </p>
        </div>

        <div className="geo-divider mt-6" />

        <form onSubmit={submit} className="card-noor mt-6 space-y-3 p-5">
          {mode === "signup" && (
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] outline-none focus:border-primary"
                placeholder="Amina"
              />
            </label>
          )}
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] outline-none focus:border-primary"
              placeholder="you@email.com"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Password
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </label>

          {error && <p className="text-[12px] text-destructive">{error}</p>}
          {message && <p className="text-[12px] text-primary">{message}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-foreground py-3 text-[14px] font-semibold text-background disabled:opacity-60"
          >
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={google}
            className="w-full rounded-full border border-border bg-card py-3 text-[14px] font-semibold"
          >
            Continue with Google
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
          className="mt-5 text-center text-[13px] text-muted-foreground"
        >
          {mode === "signin" ? (
            <>
              New here? <span className="font-semibold text-primary">Create an account</span>
            </>
          ) : (
            <>
              Already started? <span className="font-semibold text-primary">Sign in</span>
            </>
          )}
        </button>

        <Link to="/" className="mt-3 text-center text-[12px] text-muted-foreground">
          Back to home
        </Link>
      </div>
    </div>
  );
}
