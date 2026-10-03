import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSettings } from "@/lib/data";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar recruitmentOpen={settings.recruitment_open} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
