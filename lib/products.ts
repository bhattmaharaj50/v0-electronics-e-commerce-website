export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  description: string
  category: string
  image: string
  badge?: string
  rating: number
  reviews: number
}

export const categories = [
  { name: "TVs", slug: "tvs", icon: "Tv" },
  { name: "Soundbars", slug: "soundbars", icon: "Speaker" },
  { name: "Phones", slug: "phones", icon: "Smartphone" },
  { name: "Fridges", slug: "fridges", icon: "Refrigerator" },
  { name: "Microwaves", slug: "microwaves", icon: "Microwave" },
  { name: "Washing Machines", slug: "washing-machines", icon: "WashingMachine" },
  { name: "Cookers", slug: "cookers", icon: "CookingPot" },
  { name: "Ovens", slug: "ovens", icon: "Flame" },
  { name: "Tablets", slug: "tablets", icon: "Tablet" },
  { name: "Headphones", slug: "headphones", icon: "Headphones" },
  { name: "PlayStations", slug: "playstations", icon: "Gamepad2" },
  { name: "Xbox Consoles", slug: "xbox-consoles", icon: "Joystick" },
  { name: "Chargers & Accessories", slug: "chargers-accessories", icon: "Cable" },
] as const

export const products: Product[] = [
  // TVs
  {
    id: "tv-1",
    name: 'Samsung 55" Crystal UHD 4K Smart TV',
    price: 64999,
    originalPrice: 79999,
    description: "Stunning 4K resolution with Crystal Processor for vivid, lifelike picture quality.",
    category: "tvs",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=600&fit=crop",
    badge: "Sale",
    rating: 4.7,
    reviews: 234,
  },
  {
    id: "tv-2",
    name: 'LG 50" NanoCell Smart TV',
    price: 58999,
    description: "NanoCell technology delivers purer, more accurate colors from wide viewing angles.",
    category: "tvs",
    image: "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600&h=600&fit=crop",
    rating: 4.5,
    reviews: 187,
  },
  {
    id: "tv-3",
    name: 'TCL 43" Full HD Android TV',
    price: 32999,
    originalPrice: 39999,
    description: "Smart Android TV with built-in Chromecast and Google Assistant.",
    category: "tvs",
    image: "https://images.unsplash.com/photo-1571415060716-baff5f717c37?w=600&h=600&fit=crop",
    badge: "Hot Deal",
    rating: 4.3,
    reviews: 156,
  },
  // Soundbars
  {
    id: "sb-1",
    name: "JBL Bar 5.0 MultiBeam Soundbar",
    price: 34999,
    originalPrice: 42999,
    description: "Immersive 5.0-channel surround sound powered by JBL MultiBeam technology.",
    category: "soundbars",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&h=600&fit=crop",
    badge: "Sale",
    rating: 4.6,
    reviews: 98,
  },
  {
    id: "sb-2",
    name: "Samsung HW-B550 Soundbar",
    price: 24999,
    description: "2.1 channel soundbar with wireless subwoofer for deep bass.",
    category: "soundbars",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=600&fit=crop",
    rating: 4.4,
    reviews: 76,
  },
  // Phones
  {
    id: "ph-1",
    name: "Samsung Galaxy S24 Ultra 256GB",
    price: 189999,
    originalPrice: 209999,
    description: "The ultimate Galaxy experience with S Pen, titanium frame and 200MP camera.",
    category: "phones",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop",
    badge: "New",
    rating: 4.9,
    reviews: 512,
  },
  {
    id: "ph-2",
    name: "iPhone 15 Pro Max 256GB",
    price: 199999,
    description: "A17 Pro chip, titanium design, and the most powerful iPhone camera system.",
    category: "phones",
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=600&fit=crop",
    rating: 4.8,
    reviews: 678,
  },
  {
    id: "ph-3",
    name: "Tecno Camon 20 Pro 256GB",
    price: 29999,
    originalPrice: 34999,
    description: "64MP camera, AMOLED display, and all-day battery for the price-conscious buyer.",
    category: "phones",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop",
    badge: "Best Seller",
    rating: 4.3,
    reviews: 345,
  },
  // Fridges
  {
    id: "fr-1",
    name: "Samsung 253L Double Door Refrigerator",
    price: 49999,
    originalPrice: 59999,
    description: "Digital Inverter Compressor with energy-efficient cooling and spacious storage.",
    category: "fridges",
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&h=600&fit=crop",
    badge: "Sale",
    rating: 4.5,
    reviews: 123,
  },
  {
    id: "fr-2",
    name: "LG 471L Side by Side Refrigerator",
    price: 129999,
    description: "Spacious side-by-side design with Smart Diagnosis and Linear Cooling.",
    category: "fridges",
    image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&h=600&fit=crop",
    rating: 4.6,
    reviews: 89,
  },
  // Microwaves
  {
    id: "mw-1",
    name: "Samsung 23L Solo Microwave",
    price: 12999,
    description: "Quick Defrost function and ceramic enamel interior for easy cleaning.",
    category: "microwaves",
    image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600&h=600&fit=crop",
    rating: 4.2,
    reviews: 67,
  },
  // Washing Machines
  {
    id: "wm-1",
    name: "Samsung 7kg Front Load Washing Machine",
    price: 45999,
    originalPrice: 54999,
    description: "Digital Inverter Motor with EcoBubble technology for gentle, powerful cleaning.",
    category: "washing-machines",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&h=600&fit=crop",
    badge: "Sale",
    rating: 4.6,
    reviews: 145,
  },
  // Cookers
  {
    id: "ck-1",
    name: "Ramtons 4-Burner Gas Cooker with Oven",
    price: 34999,
    description: "Stainless steel finish, auto-ignition, and spacious oven for Kenyan kitchens.",
    category: "cookers",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=600&fit=crop",
    rating: 4.4,
    reviews: 98,
  },
  // Ovens
  {
    id: "ov-1",
    name: "Samsung 28L Convection Microwave Oven",
    price: 24999,
    originalPrice: 29999,
    description: "Convection cooking, grilling, and microwaving in one versatile appliance.",
    category: "ovens",
    image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=600&fit=crop",
    badge: "Hot Deal",
    rating: 4.3,
    reviews: 56,
  },
  // Tablets
  {
    id: "tb-1",
    name: "Samsung Galaxy Tab S9 FE 128GB",
    price: 54999,
    description: "10.9-inch display, IP68 water resistance, and S Pen included.",
    category: "tablets",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=600&fit=crop",
    rating: 4.5,
    reviews: 203,
  },
  {
    id: "tb-2",
    name: "iPad 10th Generation 64GB",
    price: 59999,
    description: "A14 Bionic chip, 10.9-inch Liquid Retina display, USB-C connectivity.",
    category: "tablets",
    image: "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=600&fit=crop",
    rating: 4.7,
    reviews: 456,
  },
  // Headphones
  {
    id: "hp-1",
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: 44999,
    originalPrice: 52999,
    description: "Industry-leading noise cancellation with exceptional sound quality.",
    category: "headphones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
    badge: "Best Seller",
    rating: 4.8,
    reviews: 567,
  },
  {
    id: "hp-2",
    name: "JBL Tune 720BT Wireless Headphones",
    price: 7999,
    description: "JBL Pure Bass sound, 76-hour battery, and lightweight comfort.",
    category: "headphones",
    image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop",
    rating: 4.3,
    reviews: 234,
  },
  // PlayStations
  {
    id: "ps-1",
    name: "PlayStation 5 Console (Disc Edition)",
    price: 79999,
    description: "Lightning-fast loading, DualSense controller, and stunning 4K gaming.",
    category: "playstations",
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=600&fit=crop",
    badge: "Hot",
    rating: 4.9,
    reviews: 890,
  },
  {
    id: "ps-2",
    name: "PS5 DualSense Wireless Controller",
    price: 9999,
    description: "Haptic feedback and adaptive triggers for immersive gaming.",
    category: "playstations",
    image: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=600&h=600&fit=crop",
    rating: 4.7,
    reviews: 345,
  },
  // Xbox
  {
    id: "xb-1",
    name: "Xbox Series X Console",
    price: 74999,
    description: "12 teraflops of processing power for true 4K gaming at up to 120fps.",
    category: "xbox-consoles",
    image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600&h=600&fit=crop",
    rating: 4.8,
    reviews: 567,
  },
  // Chargers & Accessories
  {
    id: "ca-1",
    name: "Anker 65W USB-C Fast Charger",
    price: 4999,
    originalPrice: 6499,
    description: "GaN II technology delivers powerful, efficient charging in a compact design.",
    category: "chargers-accessories",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=600&fit=crop",
    badge: "Sale",
    rating: 4.6,
    reviews: 456,
  },
  {
    id: "ca-2",
    name: "Samsung 10000mAh Power Bank",
    price: 3499,
    description: "Dual USB output, fast charging support, and slim portable design.",
    category: "chargers-accessories",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop",
    rating: 4.4,
    reviews: 289,
  },
]

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category)
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.badge)
}

export function getDealsOfTheDay(): Product[] {
  return products.filter((p) => p.originalPrice)
}

export function formatPrice(price: number): string {
  return `KES ${price.toLocaleString("en-KE")}`
}
