export type StaffMember = {
  id: string;
  name: string;
  rank: string;
  division: string;
  avatar_url: string | null;
  sort_order: number;
};

export type GalleryItem = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at?: string;
};

export type SiteSettings = {
  hero_heading: string;
  hero_subtext: string;
  logo_url: string | null;
  recruitment_open: boolean;
  discord_url: string | null;
};

export type ApplicationStatus = "pending" | "approved" | "denied";

export type Application = {
  id: string;
  roblox_username: string;
  discord_username: string;
  age: number | null;
  timezone: string | null;
  availability: string | null;
  experience: string | null;
  why_join: string | null;
  status: ApplicationStatus;
  created_at: string;
};

export type Newsletter = {
  id: string;
  title: string;
  body: string;
  author: string | null;
  created_at: string;
};

export type ProfileRole = "user" | "executive" | "admin";

export type Profile = {
  id: string;
  email: string | null;
  role: ProfileRole;
  can_manage_gallery: boolean;
  can_manage_staff: boolean;
  can_manage_settings: boolean;
  can_publish_newsletter: boolean;
  can_review_applications: boolean;
  created_at?: string;
};
