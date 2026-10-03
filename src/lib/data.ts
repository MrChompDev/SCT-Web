import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { GalleryItem, Newsletter, SiteSettings, StaffMember } from "@/types";

/**
 * Fallback content used while Supabase isn't configured yet (or a table is
 * empty). Once the dashboard is live, everything below is managed from /admin.
 */

export const DEFAULT_SETTINGS: SiteSettings = {
  hero_heading: "Keeping New South Wales Moving",
  hero_subtext:
    "Southern Cross Towing is the state's virtual heavy recovery and incident management crew — winch-outs, rollovers, flatbed hauls and full scene control, around the clock.",
  logo_url: null,
  recruitment_open: true,
  discord_url: null,
};

export const DEFAULT_STAFF: StaffMember[] = [
  { id: "s1", name: "Lil_J765", rank: "Chief Executive", division: "Executive", avatar_url: null, sort_order: 1 },
  { id: "s2", name: "WilliamNOPQ", rank: "Chief Operations Officer", division: "Operations", avatar_url: null, sort_order: 2 },
  { id: "s3", name: "Shawn", rank: "Staff Development Manager", division: "Development", avatar_url: null, sort_order: 3 },
  { id: "s4", name: "Money_40", rank: "Operations Manager", division: "Operations", avatar_url: null, sort_order: 4 },
  { id: "s5", name: "Zandarhip", rank: "Area of Operations Manager", division: "Operations", avatar_url: null, sort_order: 5 },
  { id: "s6", name: "Natalspy1234", rank: "Tech Operations Manager", division: "Technology", avatar_url: null, sort_order: 6 },
  { id: "s7", name: "N5WP0L1C3", rank: "Fleet Manager", division: "Fleet", avatar_url: null, sort_order: 7 },
];

const GALLERY_CAPTIONS = [
  "Heavy wrecker uprighting an overturned rig",
  "Flatbed haul under the night lights",
  "Scene control with NSWPF in attendance",
  "Winch-out recovery on the shoulder",
  "Multi-vehicle clearance on the motorway",
  "Working shoulder-to-shoulder with FRNSW",
  "Late-night recovery operation",
  "Securing the load for transport",
  "Full scene lockdown — heavy division",
  "Hazmat incident support",
  "Dawn patrol — ready for the next call",
];

export const DEFAULT_GALLERY: GalleryItem[] = GALLERY_CAPTIONS.map(
  (caption, i) => ({
    id: `g${i + 1}`,
    image_url: `/images/gallery-${i + 1}.webp`,
    caption,
    sort_order: i + 1,
  })
);

export const DEFAULT_NEWSLETTERS: Newsletter[] = [
  {
    id: "n1",
    title: "Weekly Sitrep — New Metal Joins The Fleet",
    body: "Command is proud to confirm two new heavy wreckers have joined the rotation this week, cutting heavy-response times across the metro region.\n\nA warm welcome to the four recruits who passed their trial shifts — you've been assigned your divisions and your onboarding officers will be in touch on Discord.\n\nReminder for all crew: when NSWPF or FRNSW have control of a scene, we stage, we wait, we support. Scene discipline keeps us on everyone's good side.",
    author: "Command Team",
    created_at: "2026-09-26T09:00:00.000Z",
  },
  {
    id: "n2",
    title: "Heavy Division Training Night — This Weekend",
    body: "This Saturday we're running a joint training night with our FRNSW and NSWPF partners covering multi-agency scene protocol, load securement, and rollover up-righting drills.\n\nAll heavy division operators are expected to attend. Light and flatbed crews are welcome to observe — cross-training counts toward your division transfer hours.\n\nMeet at the depot yard, 19:30 AEST. Bring your beacons.",
    author: "Command Team",
    created_at: "2026-09-19T09:00:00.000Z",
  },
];

export async function getSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return DEFAULT_SETTINGS;
    return {
      hero_heading: data.hero_heading ?? DEFAULT_SETTINGS.hero_heading,
      hero_subtext: data.hero_subtext ?? DEFAULT_SETTINGS.hero_subtext,
      logo_url: data.logo_url ?? null,
      recruitment_open: data.recruitment_open ?? true,
      discord_url: data.discord_url ?? null,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getStaff(): Promise<StaffMember[]> {
  if (!isSupabaseConfigured) return DEFAULT_STAFF;
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("staff_members")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return DEFAULT_STAFF;
    return data;
  } catch {
    return DEFAULT_STAFF;
  }
}

export async function getGallery(): Promise<GalleryItem[]> {
  if (!isSupabaseConfigured) return DEFAULT_GALLERY;
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return DEFAULT_GALLERY;
    return data;
  } catch {
    return DEFAULT_GALLERY;
  }
}

export async function getNewsletters(): Promise<Newsletter[]> {
  if (!isSupabaseConfigured) return DEFAULT_NEWSLETTERS;
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("newsletters")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
