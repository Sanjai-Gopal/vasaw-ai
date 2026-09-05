import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kumar Mess | Restaurant in Coimbatore",
  description: "Welcome to Kumar Mess, top-rated Restaurant in Coimbatore. Rated 4.2/5 with 445 reviews. Call +91 422 277 8899.",
  openGraph: {
    title: "Kumar Mess | Restaurant in Coimbatore",
    description: "Welcome to Kumar Mess, top-rated Restaurant in Coimbatore. Rated 4.2/5 with 445 reviews. Call +91 422 277 8899.",
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
