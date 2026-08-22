export const metadata = {
  title: "Ganga Restaurant - Indian Restaurants in Coimbatore",
  description: "Business identified from Google Maps with 189 reviews, rating 4.8/5",
  openGraph: {
    title: "Ganga Restaurant - Indian Restaurants in Coimbatore",
    description: "Business identified from Google Maps with 189 reviews, rating 4.8/5",
    type: "website",
  },
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