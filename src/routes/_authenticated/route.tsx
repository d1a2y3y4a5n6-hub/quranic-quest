import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", data.user.id)
      .maybeSingle();
    const onOnboarding = location.pathname === "/onboarding";
    // Onboarding runs exactly once: new users are sent there, finished users never see it again.
    if (profile && !profile.onboarded_at && !onOnboarding) throw redirect({ to: "/onboarding" });
    if (profile?.onboarded_at && onOnboarding) throw redirect({ to: "/today" });
    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
