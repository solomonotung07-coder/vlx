// Shown on the homepage only when Supabase is not configured
// (e.g. running locally without a .env.local file).
const WHATSAPP = "https://wa.me/2349051376816";

const defaultRentals = [
  {
    id: "default-1",
    name: "Sony FX3 Cinema Camera",
    price: "₦180,000/day",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
    whatsapp: WHATSAPP,
  },
  {
    id: "default-2",
    name: "Aputure LED Lighting Kit",
    price: "₦45,000/day",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    whatsapp: WHATSAPP,
  },
  {
    id: "default-3",
    name: "Canon RF Lens Kit",
    price: "₦95,000/day",
    image:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80",
    whatsapp: WHATSAPP,
  },
  {
    id: "default-4",
    name: "DJI Ronin Gimbal",
    price: "₦70,000/day",
    image:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80",
    whatsapp: WHATSAPP,
  },
];

export default defaultRentals;
