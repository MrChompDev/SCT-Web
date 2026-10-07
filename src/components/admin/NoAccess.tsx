import { ShieldX } from "lucide-react";

/** Rendered when a signed-in dashboard user opens a page they lack
 *  permission for (the database refuses the writes too, via RLS). */
export default function NoAccess({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card max-w-md p-8 text-center">
        <ShieldX size={32} className="mx-auto text-red-400" />
        <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-white">
          No Access
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          You don't have permission for{" "}
          <span className="text-white">{title}</span>. Ask an executive to
          grant it from Team & Permissions.
        </p>
      </div>
    </div>
  );
}
