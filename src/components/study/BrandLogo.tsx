import { Link } from "react-router-dom";

export const appIconUrl =
  "https://ellprnxjjzatijdxcogk.supabase.co/storage/v1/render/image/public/files/chat-generated-images/project-cuczhjtsygkg4abjnwbs/232d886a-9063-4bf1-9156-61375b5e0e01.webp?width=96&resize=contain&quality=75";

export function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="RehmanLawAcademy home">
      <img className="brand-mark" src={appIconUrl} alt="" width="40" height="40" />
      <span className={`leading-tight ${light ? "text-white" : "brand-ink"}`}>
        <span className="block font-display text-[1rem] font-bold tracking-[-.02em]">RehmanLawAcademy</span>
        <span className={`block text-[.58rem] font-bold uppercase tracking-[.16em] ${light ? "text-white/60" : "text-slate-500"}`}>
          Law preparation, made clear
        </span>
      </span>
    </Link>
  );
}
