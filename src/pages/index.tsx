import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CardLayout from "../components/Layout/CardLayout";
import { useState, useEffect } from "react";
import HotelMap from "../components/Layout/Map";
import { useRouter } from "next/router";
import { dummyHotels } from "@/data/dummyHotels";
import Link from "next/link";
import SkeletonCardLayout from "@/components/Layout/SkeletonCardLayout";

const tabs = [
  { name: "For Ahmad", active: true },
  { name: "7.7 Plus Festival", active: false },
  { name: "Kesehatan", active: false },
  { name: "Mirip yang kamu cek", active: false },
];

export default function Main() {
  const [showMap, setShowMap] = useState(false);
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 200 &&
        visibleCount < dummyHotels.length &&
        !isLoadingMore
      ) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setVisibleCount((prev) => Math.min(prev + 8, dummyHotels.length));
          setIsLoadingMore(false);
        }, 700); // simulasi loading
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visibleCount, isLoadingMore]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Banner */}
        <div
          className="relative mb-8 rounded-xl overflow-hidden h-72 md:h-64 lg:h-72 cursor-pointer"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dummyHotels.slice(0, visibleCount).map((hotel) => (
            <Link
              key={hotel.rentalId}
              href={`/detail/${hotel.rentalId}`}
              passHref
              legacyBehavior
            >
              <a style={{ display: "block", height: "100%" }}>
                <CardLayout
                  image={hotel.mainImage}
                  name={hotel.name}
                  address={hotel.address}
                  rating={hotel.rating}
                  reviewCount={hotel.reviewCount}
                  price={hotel.price}
                  originalPrice={hotel.originalPrice}
                  description={hotel.description}
                  facilities={hotel.facilities || []}
                />
              </a>
            </Link>
          ))}
          {isLoadingMore &&
            Array.from({ length: 4 }).map((_, idx) => (
              <SkeletonCardLayout key={`skeleton-${idx}`} />
            ))}
        </div>
      </div>
    </div>
  );
}
