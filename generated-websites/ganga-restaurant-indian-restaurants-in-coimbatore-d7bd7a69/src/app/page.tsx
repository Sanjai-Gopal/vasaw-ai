'use client';

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

const business = {
  "businessName": "Ganga Restaurant - Indian Restaurants in Coimbatore",
  "category": "Indian restaurant",
  "location": "22 - Nanjundapuram, Coimbatore",
  "phone": "+919080808008",
  "email": "",
  "address": "",
  "rating": 4.8,
  "reviews": 189,
  "website": "https://www.darzaresorts.com/dining.html",
  "hours": [],
  "services": [],
  "description": "Business identified from Google Maps with 189 reviews, rating 4.8/5",
  "name": "Ganga Restaurant - Indian Restaurants in Coimbatore"
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection business={business} />
      <AboutSection business={business} />
      <MenuSection business={business} />
      <GallerySection business={business} />
      <TestimonialsSection business={business} />
      <HoursSection business={business} />
      <ContactSection business={business} />
    </main>
  );
}

function HeroSection({ business }: { business: Business }) {
  return (
    <section className="relative h-screen bg-gray-200">
      <div className="px-6 text-center">
        <h1 className="text-5xl font-bold mb-6">{business.name}</h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">{business.description}</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-yellow-300">★</span>
            <span>{business.rating}/5 ({business.reviews} reviews)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>{business.location}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection({ business }: { business: Business }) {
  return (
    <section id="about" className="py-6 bg-gray-50">
      <div className="max-w-full px-6 py-8">
        <h2 className="text-3xl font-bold text-center mb-6">{business.name}</h2>
        <p className="text-gray-700 text-lg">{business.description}</p>
      </div>
    </section>
  );
}

function MenuSection({ business }: { business: Business }) {
  return (
    <section id="menu" className="py-6">
      <div className="max-w-full px-6 py-8">
        <h2 className="text-3xl font-bold text-center mb-6">Our Menu</h2>
        {business.services.slice(0, 8).map((service: string, i: number) => (
          <div key={i} className="bg-white p-4 rounded">
            <h3 className="text-lg font-semibold">{service}</h3>
            <p className="text-gray-600">Available dish</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GallerySection({ business: _business }: { business: Business }) {
  return (
    <section id="gallery" className="py-6 bg-gray-50" />
  );
}

function TestimonialsSection({ business: _business }: { business: Business }) {
  return (
    <section id="testimonials" className="py-6 bg-gray-50" />
  );
}

function HoursSection({ business: _business }: { business: Business }) {
  return (
    <section id="hours" className="py-6" />
  );
}

function ContactSection({ business: _business }: { business: Business }) {
  return (
    <section id="contact" className="py-6 bg-gray-50" />
  );
}