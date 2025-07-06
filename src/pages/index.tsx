import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CardLayout from "../components/Layout/CardLayout";
import { useState, useEffect } from "react";
import HotelMap from "../components/Layout/Map";

const tabs = [
  { name: "For Ahmad", active: true },
  { name: "7.7 Plus Festival", active: false },
  { name: "Kesehatan", active: false },
  { name: "Mirip yang kamu cek", active: false },
];

const rentals = [
  {
    rentalId: "rental-001",
    partnerId: "partner-001",
    name: "Cozy Studio Apartment in Central Jakarta",
    description:
      "Modern studio apartment with city view, perfect for business travelers",
    address: "Jl. Sudirman No. 123, Jakarta Pusat",
    lat: -6.2088,
    price: 450000,
    originalPrice: 600000,
    roomCount: 1,
    facilities: ["WiFi", "AC", "Kitchen", "TV", "Parking"],
    images: [
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
    ],
    mainImage:
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
    isAvailable: true,
    isActive: true,
    rating: 4.8,
    reviewCount: 125,
    bookingCount: 89,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
  },
  {
    rentalId: "rental-002",
    partnerId: "partner-002",
    name: "Luxury 2BR Apartment with Pool",
    description:
      "Spacious apartment with swimming pool access and gym facilities",
    address: "Jl. Kemang Raya No. 45, Jakarta Selatan",
    lat: -6.2615,
    price: 850000,
    originalPrice: 1200000,
    roomCount: 2,
    facilities: ["WiFi", "AC", "Pool", "Gym", "Security", "Parking"],
    images: [
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
    ],
    mainImage:
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
    isAvailable: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 78,
    bookingCount: 45,
    createdAt: "2024-01-10",
    updatedAt: "2024-01-18",
  },
  {
    rentalId: "rental-003",
    partnerId: "partner-003",
    name: "Budget Friendly Room Near Campus",
    description: "Simple and clean room perfect for students",
    address: "Jl. Margonda No. 67, Depok",
    lat: -6.3728,
    price: 200000,
    originalPrice: 300000,
    roomCount: 1,
    facilities: ["WiFi", "AC", "Shared Kitchen"],
    images: [
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
    ],
    mainImage:
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
    isAvailable: true,
    isActive: true,
    rating: 4.2,
    reviewCount: 234,
    bookingCount: 156,
    createdAt: "2024-01-05",
    updatedAt: "2024-01-19",
  },
  {
    rentalId: "rental-004",
    partnerId: "partner-004",
    name: "Family House with Garden",
    description: "Spacious family house with private garden and parking",
    address: "Jl. Cipete Raya No. 89, Jakarta Selatan",
    lat: -6.2897,
    price: 1200000,
    originalPrice: 1500000,
    roomCount: 3,
    facilities: ["WiFi", "AC", "Garden", "Parking", "Kitchen", "Laundry"],
    images: [
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
    ],
    mainImage:
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
    isAvailable: false,
    isActive: true,
    rating: 4.7,
    reviewCount: 67,
    bookingCount: 23,
    createdAt: "2024-01-12",
    updatedAt: "2024-01-21",
  },
  {
    rentalId: "rental-005",
    partnerId: "partner-005",
    name: "Modern Loft in Creative District",
    description: "Trendy loft space in the heart of creative district",
    address: "Jl. Senopati No. 12, Jakarta Selatan",
    lat: -6.2297,
    price: 750000,
    originalPrice: 950000,
    roomCount: 2,
    facilities: ["WiFi", "AC", "Workspace", "Coffee Machine", "Parking"],
    images: [
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
    ],
    mainImage:
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
    isAvailable: true,
    isActive: true,
    rating: 4.6,
    reviewCount: 92,
    bookingCount: 67,
    createdAt: "2024-01-08",
    updatedAt: "2024-01-17",
  },
  {
    rentalId: "rental-006",
    partnerId: "partner-006",
    name: "Beachfront Villa Bali Style",
    description: "Beautiful villa with ocean view and private beach access",
    address: "Jl. Pantai Indah No. 34, Bali",
    lat: -8.4095,
    price: 2500000,
    originalPrice: 3000000,
    roomCount: 4,
    facilities: ["WiFi", "AC", "Pool", "Beach Access", "Kitchen", "BBQ Area"],
    images: [
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
    ],
    mainImage:
      "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg",
    isAvailable: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 156,
    bookingCount: 89,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-22",
  },
];

export default function Main() {
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (showMap) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMap]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Banner */}
        <div
          className="relative mb-8 rounded-xl overflow-hidden h-48 md:h-64 lg:h-72 cursor-pointer"
          onClick={() => setShowMap(true)}
        >
          {/* Map kecil di Hero */}
          {!showMap && (
            <div className="absolute inset-0 z-10 opacity-80 pointer-events-none">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                  borderRadius: "1rem",
                }}
              >
                <HotelMap />
              </div>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center z-20 ">
            <Button
              type="button"
              className="bg-black text-white text-sm font-bold rounded-xl shadow-lg px-5 py-3  transition-colors duration-200 hover:bg-white hover:text-black "
              tabIndex={-1}
              style={{ pointerEvents: "auto" }}
            >
              Lihat di peta
            </Button>
          </div>
        </div>

        {/* Overlay Map Fullscreen */}
        {showMap && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="absolute inset-0">
              <HotelMap full />
            </div>
            <button
              className="absolute top-6 left-6 z-60 bg-white text-black px-4 py-2 rounded-lg font-bold shadow"
              onClick={() => setShowMap(false)}
            >
              Tutup
            </button>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rentals.map((rental) => (
            <CardLayout
              key={rental.rentalId}
              image={
                rental.mainImage ||
                "https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2020/11/01/168dfa6c-3b29-45c6-a3da-1b49e78f1c5c-1604186045263-84aa1fb10f21acdda6833c9ece13dca2.jpg"
              }
              name={rental.name}
              address={rental.address}
              rating={rental.rating}
              reviewCount={rental.reviewCount}
              price={rental.price}
              originalPrice={rental.originalPrice}
              description={rental.description}
              facilities={rental.facilities}
              onDetailClick={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
