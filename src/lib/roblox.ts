/**
 * Best-effort Roblox headshot lookup, used to personalise the application
 * success screen. Entirely optional — any failure resolves to null.
 */

type RobloxUser = { id: number; name: string };

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(input, { ...init, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchRobloxAvatar(username: string): Promise<string | null> {
  const clean = username.trim();
  if (!clean) return null;

  const lookup = await fetchJson<{ data: RobloxUser[] }>(
    "https://users.roblox.com/v1/usernames/users",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [clean], excludeBannedUsers: false }),
    }
  );
  const id = lookup?.data?.[0]?.id;
  if (!id) return null;

  const thumbs = await fetchJson<{ data: { imageUrl: string }[] }>(
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png`
  );
  return thumbs?.data?.[0]?.imageUrl ?? null;
}
