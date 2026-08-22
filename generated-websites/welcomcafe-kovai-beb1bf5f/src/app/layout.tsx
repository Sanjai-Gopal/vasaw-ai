import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Welcomcafe Kovai",
  description: "Welcome to Welcomcafe Kovai - Buffet restaurant in Coimbatore",
  openGraph: {
    title: "Welcomcafe Kovai",
    description: "Welcome to Welcomcafe Kovai - Buffet restaurant in Coimbatore",
    type: "website",
  },
};

interface Business {
  name: string;
  businessName: string;
  category: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  rating: number;
  reviews: number;
  description: string;
  services: string[];
  hours: Array<{ day: string; hours: string }>;
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}