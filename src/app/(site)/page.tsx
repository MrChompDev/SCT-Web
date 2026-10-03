import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import ServicesBento from "@/components/sections/ServicesBento";
import StaffGrid from "@/components/sections/StaffGrid";
import GalleryGrid from "@/components/sections/GalleryGrid";
import NewsletterPreview from "@/components/sections/NewsletterPreview";
import CTASection from "@/components/sections/CTASection";
import { getGallery, getNewsletters, getSettings, getStaff } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, staff, gallery, newsletters] = await Promise.all([
    getSettings(),
    getStaff(),
    getGallery(),
    getNewsletters(),
  ]);

  return (
    <>
      <Hero
        settings={settings}
        staffCount={staff.length}
        galleryCount={gallery.length}
      />
      <Marquee />
      <ServicesBento />
      <StaffGrid staff={staff} />
      <GalleryGrid items={gallery} />
      <NewsletterPreview posts={newsletters.slice(0, 2)} />
      <CTASection settings={settings} />
    </>
  );
}
