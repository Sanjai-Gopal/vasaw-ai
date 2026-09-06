import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saravana Bhavan | Authentic Restaurant in Coimbatore",
  description: "Saravana Bhavan in Coimbatore. Rated 4.6★ based on 420 reviews. Enjoy freshly prepared food for dine-in and takeaway. Call +91 422 239 1234.",
  openGraph: {
    title: "Saravana Bhavan | Authentic Restaurant in Coimbatore",
    description: "Saravana Bhavan in Coimbatore. Rated 4.6★ based on 420 reviews. Enjoy freshly prepared food for dine-in and takeaway. Call +91 422 239 1234.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0c0a09] antialiased text-[#fdfbf7] selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
