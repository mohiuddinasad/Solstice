// Shared package catalogue — used by packages.html (listing + modal)
// and booking.html (trip dropdown + price summary).
// In production this would come from the agency's backend/CMS.
const SOLSTICE_PACKAGES = [
  {
    id: "bali-explorer",
    name: "Bali & the Lesser Sundas",
    category: "beach",
    categoryLabel: "Beach",
    duration: "7 nights",
    price: 2450,
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=900&auto=format&fit=crop",
    overview: "Rice terraces, quiet inland temples, and reef time on Nusa Penida, paced so you're never rushing to the next stop.",
    highlights: [
      "4 nights Ubud, 3 nights Uluwatu coast",
      "Private sunrise trek, Mount Batur",
      "Full-day Nusa Penida boat trip",
      "Traditional Balinese cooking class"
    ],
    inclusions: ["Airport transfers", "Hand-picked boutique stays", "Daily breakfast", "Local English-speaking guide"],
  },
  {
    id: "santorini-cyclades",
    name: "Santorini & the Cyclades",
    category: "honeymoon",
    categoryLabel: "Honeymoon",
    duration: "8 nights",
    price: 3100,
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800&auto=format&fit=crop",
    overview: "Island-hopping between Santorini, Naxos and Milos, timed off the cruise-ship hours for the views everyone's after.",
    highlights: [
      "Caldera-view suite, Oia",
      "Private catamaran sunset sail",
      "3 nights on lesser-visited Milos",
      "Wine tasting at a family-run vineyard"
    ],
    inclusions: ["Inter-island ferries", "Boutique & villa stays", "Daily breakfast", "One private dinner"],
  },
  {
    id: "kyoto-kii",
    name: "Kyoto & the Kii Peninsula",
    category: "cultural",
    categoryLabel: "Cultural",
    duration: "9 nights",
    price: 3650,
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop",
    overview: "Old Japan at the pace it deserves — temples before the crowds, a night in a mountain ryokan, and real izakayas.",
    highlights: [
      "5 nights central Kyoto",
      "2 nights Koyasan monastery stay",
      "Kumano Kodo pilgrimage day-hike",
      "Private tea ceremony"
    ],
    inclusions: ["JR rail passes", "Ryokan & boutique hotels", "Daily breakfast", "Local guide in Kyoto"],
  },
  {
    id: "patagonia",
    name: "Patagonia",
    category: "adventure",
    categoryLabel: "Adventure",
    duration: "10 nights",
    price: 4200,
    image: "https://images.unsplash.com/photo-1490682143684-14369e18dce8?q=80&w=1000&auto=format&fit=crop",
    overview: "Glaciers, granite towers, and long silences — for travelers who want the trip to actually be a little hard.",
    highlights: [
      "Torres del Paine, 4-day trek",
      "Perito Moreno glacier trek",
      "El Chaltén base for Fitz Roy",
      "Estancia stay with working gauchos"
    ],
    inclusions: ["Domestic flights", "Trekking lodges & refugios", "All trekking permits", "Certified mountain guide"],
  },
  {
    id: "marrakech-atlas",
    name: "Marrakech & the Atlas",
    category: "cultural",
    categoryLabel: "Cultural",
    duration: "6 nights",
    price: 1980,
    image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=900&auto=format&fit=crop",
    overview: "Medina souks, a night under the stars in the Agafay desert, and a Berber village day in the High Atlas.",
    highlights: [
      "Riad stay in the Marrakech medina",
      "Overnight desert camp, Agafay",
      "High Atlas village day-trip",
      "Private guided souk walk"
    ],
    inclusions: ["Airport transfers", "Riad & desert camp stays", "Daily breakfast", "Desert camp dinner"],
  },
  {
    id: "swiss-alps",
    name: "Swiss Alps Family Trail",
    category: "family",
    categoryLabel: "Family",
    duration: "7 nights",
    price: 3850,
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=900&auto=format&fit=crop",
    overview: "Cable cars instead of long drives, lake towns instead of long museum queues — built for traveling with kids.",
    highlights: [
      "Base in Interlaken, day-trips by rail",
      "Jungfraujoch cogwheel excursion",
      "Lake Brienz boat afternoon",
      "Cheese-making farm visit"
    ],
    inclusions: ["Swiss Travel Pass", "Family-friendly hotels", "Daily breakfast", "All funicular/cable-car tickets"],
  }
];

function solsticeFindPackage(id) {
  return SOLSTICE_PACKAGES.find(function (p) { return p.id === id; });
}
