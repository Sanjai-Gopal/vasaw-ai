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
  "businessName": "Kovai Kitchen",
  "category": "North Indian restaurant",
  "location": "Coimbatore",
  "phone": "+917094446622",
  "email": "",
  "address": "Fairfield by Marriott Coimbatore, Trichy Road, Coimbatore",
  "rating": 4.7,
  "reviews": 613,
  "website": "https://marriottbonvoyasia.com/restaurants-bars/Fairfield-by-Marriott-Coimbatore-Kovai-Kitchen",
  "hours": [
    {
      "day": "Mon-Sun",
      "hours": "Mon-Sun: 7:00 AM - 11:00 PM"
    }
  ],
  "services": [
    "North Indian Cuisine",
    "Breakfast Buffet",
    "Lunch Buffet",
    "Dinner Buffet",
    "A La Carte",
    "Room Service"
  ],
  "description": "Welcome to Kovai Kitchen - North Indian restaurant in Coimbatore",
  "name": "Kovai Kitchen"
};

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <ContactSection business={business} />
      <FooterSection business={business} />
    </main>
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