import { SITE } from "@/data";

export default function Footer() {
  return (
    <footer className="site-footer" id="site-footer">
      <div className="wrap">
        <span>© {new Date().getFullYear()} {SITE.name}</span>
        <span>Sin cookies ni analítica.</span>
      </div>
    </footer>
  );
}
