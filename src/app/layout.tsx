import type { Metadata } from "next";
import "./globals.css";
import { SITE, SITE_URL } from "@/data";
import { plain } from "@/lib/format";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Lightbox from "@/components/Lightbox";
import Analytics from "@/components/Analytics";

const description = `${plain(SITE.headline)} ${plain(SITE.lede)}`.slice(0, 200).replace(/\s+\S*$/, "…");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE.shortName} - Portafolio`,
  description,
  alternates: { canonical: "/" },
  icons: { icon: "/assets/logo.svg" },
  openGraph: {
    type: "website",
    siteName: SITE.shortName,
    locale: "es_CO",
    title: `${SITE.shortName} - Portafolio`,
    description,
    url: "/",
    images: ["/assets/og.jpg"],
  },
  twitter: { card: "summary_large_image", images: ["/assets/og.jpg"] },
};

// Aplica el modo oscuro guardado antes de pintar, para evitar el parpadeo.
const bootTheme = `try{if(localStorage.getItem("tema")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootTheme }} />
        <link rel="preload" href="/assets/fonts/jost-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <a className="skip" href="#main">
          Saltar al contenido
        </a>
        <Header />
        {children}
        <Footer />
        <Lightbox />
        <Analytics />
      </body>
    </html>
  );
}
