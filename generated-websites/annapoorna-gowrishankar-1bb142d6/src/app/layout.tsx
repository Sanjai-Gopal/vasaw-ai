import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Annapoorna Gowrishankar | Restaurant in Coimbatore",
  description: "Welcome to Annapoorna Gowrishankar, top-rated Restaurant in Coimbatore. Rated 4.7/5 with 2100 reviews. Call +91 422 244 5566.",
  openGraph: {
    title: "Annapoorna Gowrishankar | Restaurant in Coimbatore",
    description: "Welcome to Annapoorna Gowrishankar, top-rated Restaurant in Coimbatore. Rated 4.7/5 with 2100 reviews. Call +91 422 244 5566.",
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
      <body className="min-h-screen bg-white antialiased text-gray-900">
        {children}
      </body>
    </html>
  );
}
