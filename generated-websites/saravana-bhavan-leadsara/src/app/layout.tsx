import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saravana Bhavan | Restaurant in Coimbatore",
  description: "Saravana Bhavan in Coimbatore. Rated 4.6★ based on 420 Google reviews. Professional restaurant services. Contact us today.",
  openGraph: {
    title: "Saravana Bhavan | Restaurant in Coimbatore",
    description: "Saravana Bhavan in Coimbatore. Rated 4.6★ based on 420 Google reviews. Professional restaurant services. Contact us today.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0c0a09] antialiased text-[#fdfbf7] selection:bg-amber-500 selection:text-black" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
