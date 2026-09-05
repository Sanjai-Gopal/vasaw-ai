import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hari Bhavan | Restaurant in Coimbatore",
  description: "Welcome to Hari Bhavan, top-rated Restaurant in Coimbatore. Rated 4.1/5 with 334 reviews. Call +91 422 299 0011.",
  openGraph: {
    title: "Hari Bhavan | Restaurant in Coimbatore",
    description: "Welcome to Hari Bhavan, top-rated Restaurant in Coimbatore. Rated 4.1/5 with 334 reviews. Call +91 422 299 0011.",
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
