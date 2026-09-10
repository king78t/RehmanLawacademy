import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { BrandLogo } from "@/components/study/BrandLogo";

const navItems = [
  { label: "Home", to: "/" },
  { label: "LAT preparation", to: "/lat" },
  { label: "Paid Courses", to: "/paid-courses" },
  { label: "Results / Progress", to: "/dashboard" },
  { label: "Saved", to: "/saved" },
  { label: "History", to: "/history" },
];

export function StudyHeader({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", closeOnEscape); document.body.style.overflow = previousOverflow; };
  }, [open]);

  const closeMenu = () => setOpen(false);
  const linkClass = ({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? "active" : ""} ${dark ? "text-white/70 hover:text-white" : ""}`;

  return (
    <>
      <header className={`site-header ${dark ? "site-header-dark" : ""}`}>
        <div className="page-wrap flex min-h-[72px] items-center justify-between gap-4">
          <BrandLogo light={dark} />
          <nav className="hidden items-center gap-6 xl:flex" aria-label="Primary navigation">{navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === "/"} className={linkClass}>{item.label}</NavLink>)}</nav>
          <div className="hidden items-center gap-2 xl:flex"><Link to="/lat/pakistan-studies" className={dark ? "button-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/[.15]" : "button-secondary"}>Explore LAT</Link><Link to="/dashboard" className="button-primary">Open progress</Link></div>
          <button type="button" className={`button-quiet !min-h-11 !min-w-11 !p-2 xl:hidden ${dark ? "!text-white/80" : ""}`} onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="mobile-navigation"><Menu size={22} /></button>
        </div>
      </header>
      {open && <><button type="button" className="drawer-backdrop" aria-label="Close menu" onClick={closeMenu} /><aside id="mobile-navigation" className="mobile-drawer p-5" role="dialog" aria-modal="true" aria-label="Mobile navigation"><div className="flex items-center justify-between"><BrandLogo /><button type="button" className="button-quiet !min-h-10 !min-w-10 !p-2" onClick={closeMenu} aria-label="Close menu"><X size={21} /></button></div><div className="mt-8 space-y-2">{navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={closeMenu} className={({ isActive }) => `block rounded-xl px-4 py-3 text-sm font-bold ${isActive ? "bg-sky-50 text-[#1766a9]" : "text-slate-600 hover:bg-slate-50"}`}>{item.label}</NavLink>)}</div><div className="mt-8 grid gap-3 border-t border-slate-100 pt-6"><Link to="/lat/pakistan-studies" onClick={closeMenu} className="button-secondary">Explore Pakistan Studies</Link><Link to="/dashboard" onClick={closeMenu} className="button-primary">Open progress</Link></div><p className="mt-8 text-xs leading-5 text-slate-400">Law GAT, information center and more study banks will join in later stages.</p></aside></>}
    </>
  );
}
