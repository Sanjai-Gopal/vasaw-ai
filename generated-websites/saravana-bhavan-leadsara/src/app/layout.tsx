import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saravana Bhavan | Restaurant in Coimbatore",
  description: "Welcome to Saravana Bhavan, top-rated Restaurant in Coimbatore. Rated 4.6/5 with 420 reviews. Call +91 422 239 1234.",
  openGraph: {
    title: "Saravana Bhavan | Restaurant in Coimbatore",
    description: "Welcome to Saravana Bhavan, top-rated Restaurant in Coimbatore. Rated 4.6/5 with 420 reviews. Call +91 422 239 1234.",
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
