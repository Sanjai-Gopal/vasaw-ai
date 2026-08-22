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
  "businessName": "Nagerkovil Arya Bhavan",
  "category": "South Indian restaurant",
  "location": "Coimbatore",
  "phone": "+918903174444",
  "email": "",
  "address": "Nagerkovil Arya Bhavan, Coimbatore",
  "rating": 4.2,
  "reviews": 10107,
  "website": "https://www.nagerkovilaryabhavan.in/",
  "hours": [
    {
      "day": "Mon-Sun",
      "hours": "Mon-Sun: 7:00 AM - 10:00 PM"
    }
  ],
  "services": [
    "Idli",
    "Dosa",
    "Vada",
    "Pongal",
    "Filter Coffee",
    "Meals",
    "Tiffin"
  ],
  "description": "Welcome to Nagerkovil Arya Bhavan - South Indian restaurant in Coimbatore",
  "name": "Nagerkovil Arya Bhavan"
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection business={business} />
      <AboutSection business={business} />
      <MenuSection business={business} />
      <TestimonialsSection business={business} />
      <HoursSection business={business} />
      <ContactSection business={business} />
    </main>
  );
}

function HeroSection({ business }: { business: Business }) {
  const star = String.fromCharCode(0x2605);
  const location = String.fromCodePoint(0x1F4CD);
  return (
    <section className="relative min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)" }}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative container px-6 text-center">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          {business.name}
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
          {business.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="flex items-center gap-2 text-white/90">
            <span className="text-accent" role="img" aria-label="star">{star}</span>
            <span className="font-medium">{business.rating}/5</span>
            <span className="text-white/60">({business.reviews} reviews)</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <span role="img" aria-label="location">{location}</span>
            <span className="font-medium">{business.location}</span>
          </div>
        </div>
        <div className="mt-10 flex gap-4 justify-center">
          <a href="#contact" className="bg-accent text-primary px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity">
            Contact Us
          </a>
          <a href={"tel:" + business.phone.replace(/\D/g, "")} className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors">
            Call Now
          </a>
        </div>
      </div>
    </section>
  );
}

function AboutSection({ business }: { business: Business }) {
  return (
    <section id="about" className="section bg-gray-50">
      <div className="container">
        <h2 className="section-title font-display">About {business.name}</h2>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-gray-700 leading-relaxed">{business.description}</p>
        </div>
        {business.rating > 0 && (
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-primary font-display">{business.rating}</div>
              <div className="text-gray-600">Rating</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-primary font-display">{business.reviews.toLocaleString()}+</div>
              <div className="text-gray-600">Reviews</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-primary font-display">{business.category}</div>
              <div className="text-gray-600">Category</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MenuSection({ business }: { business: Business }) {
  if (!business.services || business.services.length === 0) return null;
  
  return (
    <section id="menu" className="section">
      <div className="container">
        <h2 className="section-title font-display">Our Menu</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {business.services.slice(0, 9).map((service, i) => (
            <article key={i} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{service}</h3>
              <p className="text-gray-600">Available dish</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ business }: { business: Business }) {
  if (!business.services || business.services.length === 0) return null;
  
  return (
    <section id="services" className="section bg-gray-50">
      <div className="container">
        <h2 className="section-title font-display">Our Services</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {business.services.slice(0, 9).map((service, i) => (
            <article key={i} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{service}</h3>
              <p className="text-gray-600">Professional service</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GallerySection({ business }: { business: Business }) {
  return (
    <section id="gallery" className="section">
      <div className="container">
        <h2 className="section-title font-display">Gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
              <img 
                src={"/placeholder-" + i + ".jpg"} 
                alt={business.name + " gallery image " + i}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ business }: { business: Business }) {
  const star = String.fromCharCode(0x2605);
  return (
    <section id="testimonials" className="section bg-gray-50">
      <div className="container">
        <h2 className="section-title font-display">What Our Customers Say</h2>
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-accent" role="img" aria-label="star">{star}</span>
            <span className="text-3xl font-bold">{business.rating}/5</span>
          </div>
          <p className="text-lg text-gray-700">
            Based on {business.reviews.toLocaleString()} reviews
          </p>
        </div>
      </div>
    </section>
  );
}

function HoursSection({ business }: { business: Business }) {
  if (!business.hours || business.hours.length === 0) return null;
  
  return (
    <section id="hours" className="section">
      <div className="container">
        <h2 className="section-title font-display">Opening Hours</h2>
        <div className="max-w-md mx-auto">
          <dl className="space-y-4">
            {business.hours.map((item, i) => (
              <div key={i} className="flex justify-between py-3 border-b border-gray-200">
                <dt className="font-medium text-gray-900">{item.day}</dt>
                <dd className="text-gray-600">{item.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function ContactSection({ business }: { business: Business }) {
  return (
    <section id="contact" className="section bg-gray-50">
      <div className="container">
        <h2 className="section-title font-display">Contact Us</h2>
        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          <div>
            <h3 className="text-2xl font-semibold mb-6">Visit Us</h3>
            <address className="not-italic space-y-4 text-gray-700">
              <p>{business.address}</p>
              <p>{business.location}</p>
            </address>
            <h3 className="text-2xl font-semibold mt-10 mb-6">Call Us</h3>
            <a href={"tel:" + business.phone.replace(/\D/g, "")} className="text-gray-700 hover:text-primary transition-colors inline-block">
              {business.phone}
            </a>
            {business.email && (
              <>
                <h3 className="text-2xl font-semibold mt-10 mb-6">Email Us</h3>
                <a href={"mailto:" + business.email} className="text-gray-700 hover:text-primary transition-colors inline-block">
                  {business.email}
                </a>
              </>
            )}
            {business.website && (
              <>
                <h3 className="text-2xl font-semibold mt-10 mb-6">Website</h3>
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-primary transition-colors inline-block">
                  {business.website}
                </a>
              </>
            )}
          </div>
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-200">
            <iframe
              src={"https://maps.google.com/maps?q=" + encodeURIComponent(business.address) + "&output=embed"}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterSection({ business }: { business: Business }) {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-2xl font-bold mb-4">{business.name}</h3>
            <p className="text-gray-400">{business.description}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <address className="not-italic text-gray-400 space-y-2">
              <p>{business.address}</p>
              <p>{business.location}</p>
              <a href={"tel:" + business.phone.replace(/\D/g, "")} className="hover:text-accent transition-colors">{business.phone}</a>
              {business.email && <a href={"mailto:" + business.email} className="hover:text-accent transition-colors">{business.email}</a>}
            </address>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Hours</h4>
            <dl className="text-gray-400 space-y-2">
              {business.hours && business.hours.length > 0 ? (
                business.hours.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <dt>{item.day}</dt>
                    <dd>{item.hours}</dd>
                  </div>
                ))
              ) : (
                <p>Contact for hours</p>
              )}
            </dl>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} {business.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}