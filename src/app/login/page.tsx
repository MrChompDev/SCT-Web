import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Command Login",
  robots: { index: false },
};

export default function LoginPage() {
  // The Discord button only shows when the provider has been set up —
  // paste the same client ID/secret from the Supabase dashboard here.
  const discordEnabled = Boolean(
    process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
  );
  return <LoginClient discordEnabled={discordEnabled} />;
}
