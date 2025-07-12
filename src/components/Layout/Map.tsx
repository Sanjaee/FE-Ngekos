import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { apiService, Rental } from "@/lib/api";

// Types
interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapProps {
  full?: boolean;
}

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: -6.2088,
  lng: 106.8456,
};

const ITEMS_PER_PAGE = 30;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsDesktop(window.matchMedia("(min-width: 768px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
}

export default function HotelMap({ full }: MapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [visibleHotels, setVisibleHotels] = useState<Rental[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Rental | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hotelRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isDesktop = useIsDesktop();
  const router = useRouter();

  // Open InfoWindow if ?selected=... in URL and hotel exists
  useEffect(() => {
    if (router.query.selected && visibleHotels.length > 0) {
      const found = visibleHotels.find(
        (hotel) => hotel.rentalId === router.query.selected
      );
      if (found) setSelectedHotel(found);
    }
  }, [router.query.selected, visibleHotels]);

  // Helper to open InfoWindow and update query param
  const handleMarkerClick = (rental: Rental) => {
    setSelectedHotel(rental);
    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, selected: rental.rentalId },
      },
      undefined,
      { shallow: true }
    );
  };

  // Helper to close InfoWindow and remove query param
  const handleCloseInfoWindow = () => {
    setSelectedHotel(null);
    const { selected, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, {
      shallow: true,
    });
  };

  // Set default hotels immediately when component mounts
  useEffect(() => {
    const defaultBounds: MapBounds = {
      north: -6.1888,
      south: -6.2288,
      east: 106.8656,
      west: 106.8256,
    };

    fetchHotelsInBounds(defaultBounds, "");
    setMapBounds(defaultBounds);
  }, []);

  // Fetch hotels from API based on bounds and search
  const fetchHotelsInBounds = async (bounds: MapBounds, query: string = "") => {
    try {
      setLoading(true);
      const response = await apiService.getAllRentals({
        lat: (bounds.north + bounds.south) / 2,
        lng: (bounds.east + bounds.west) / 2,
        radius: 10,
        search: query || undefined,
        limit: 50,
      });

      if (response.success) {
        setVisibleHotels(response.rentals);
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
      setVisibleHotels([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two coordinates
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Update visible hotels when map bounds change
  const updateVisibleHotels = useCallback(() => {
    if (!map) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const mapBounds: MapBounds = {
      north: bounds.getNorthEast().lat(),
      south: bounds.getSouthWest().lat(),
      east: bounds.getNorthEast().lng(),
      west: bounds.getSouthWest().lng(),
    };

    setMapBounds(mapBounds);
    fetchHotelsInBounds(mapBounds, searchQuery);
    setCurrentPage(1);
  }, [map, searchQuery]);

  // Handle map events
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setIsInitialLoad(false);
  }, []);

  const onMapIdle = useCallback(() => {
    // Only update bounds, don't auto-refresh hotels
    if (!map) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const mapBounds: MapBounds = {
      north: bounds.getNorthEast().lat(),
      south: bounds.getSouthWest().lat(),
      east: bounds.getNorthEast().lng(),
      west: bounds.getSouthWest().lng(),
    };
    setMapBounds(mapBounds);
  }, [map]);

  // Handle search with debounce
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setLoading(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      // For search, use current map bounds or default area
      const bounds = mapBounds || {
        north: -6.1888,
        south: -6.2288,
        east: 106.8656,
        west: 106.8256,
      };

      fetchHotelsInBounds(bounds, query);
      setCurrentPage(1);
    }, 300);
  };

  // Handle "Search in this area" button
  const handleSearchInArea = () => {
    if (!mapBounds) return;

    setLoading(true);
    setTimeout(() => {
      fetchHotelsInBounds(mapBounds, searchQuery);
      setCurrentPage(1);
    }, 500);
  };

  // Format price to IDR
  const formatPrice = (price: number) => {
    return `IDR ${price.toLocaleString("id-ID")}`;
  };

  // Get current page hotels
  const getCurrentPageHotels = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return visibleHotels.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(visibleHotels.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (selectedHotel && hotelRefs.current[selectedHotel.rentalId]) {
      hotelRefs.current[selectedHotel.rentalId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedHotel]);

  return (
    <>
      <Head>
        <title>Hotel Map - Find Hotels Near You</title>
        <meta
          name="description"
          content="Find hotels near your location with interactive map"
        />
      </Head>
      <div
        style={{
          width: full ? "100vw" : "100%",
          height: full ? "100vh" : "100%",
        }}
      >
        <LoadScript
          googleMapsApiKey={
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
            "AIzaSyABRnad-RH886oiORitprUiV3o9Jz1x72k"
          }
        >
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={defaultCenter}
            zoom={13}
            onLoad={onMapLoad}
            onIdle={onMapIdle}
            onClick={handleCloseInfoWindow} // <-- close InfoWindow when clicking on map
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {getCurrentPageHotels().map((rental) => (
              <Marker
                key={rental.rentalId}
                position={{ lat: rental.lat, lng: rental.lng }}
                onClick={() => handleMarkerClick(rental)}
                icon={{
                  url:
                    "data:image/svg+xml;base64," +
                    btoa(`
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#FF6B6B" stroke="white" stroke-width="2"/>
                      <text x="20" y="25" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
                        ${rental.price.toString().slice(0, 3)}K
                      </text>
                    </svg>
                  `),
                  scaledSize:
                    window.google &&
                    window.google.maps &&
                    typeof window.google.maps.Size === "function"
                      ? new window.google.maps.Size(40, 40)
                      : undefined,
                }}
              />
            ))}

            {selectedHotel && (
              <>
                {/* Overlay to close InfoWindow on outside click */}
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    zIndex: 1000,
                    background: "transparent",
                    pointerEvents: "none",
                  }}
                  onClick={handleCloseInfoWindow}
                />
                <InfoWindow
                  position={{ lat: selectedHotel.lat, lng: selectedHotel.lng }}
                  onCloseClick={handleCloseInfoWindow}
                  options={{
                    maxWidth: 200,
                    pixelOffset:
                      window.google &&
                      window.google.maps &&
                      typeof window.google.maps.Size === "function"
                        ? new window.google.maps.Size(0, -10)
                        : undefined,
                  }}
                >
                  <div
                    className="p-0 max-w-sm cursor-pointer"
                    style={{
                      borderRadius: 5,
                      overflow: "hidden",
                      pointerEvents: "auto",
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent closing when clicking inside the card
                      router.push(`/detail/${selectedHotel.rentalId}`);
                    }}
                  >
                    <div className="relative">
                      <img
                        src={
                          selectedHotel.mainImage ||
                          "https://dummyimage.com/300x200/cccccc/ffffff.jpg&text=No+Image"
                        }
                        alt={selectedHotel.name}
                        className="w-full h-40 object-cover rounded-none"
                        style={{ display: "block" }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-neutral-900 mb-1">
                        {selectedHotel.name}
                      </h3>
                      {/* Star rating (static 3 stars for demo, replace with dynamic if needed) */}
                      <div className="flex items-center mb-1">
                        <span className="text-orange-400 text-lg mr-1">
                          ★★★
                        </span>
                      </div>
                      <p
                        className="text-xs text-gray-600 mb-1 break-words break-all"
                        style={{ textWrap: "wrap" }}
                      >
                        542 m dari area pilihanmu
                      </p>
                      <div className="text-xs text-gray-800 mb-2">
                        <span className="font-bold">
                          {selectedHotel.rating}
                        </span>
                        <span className="text-gray-500">
                          {" "}
                          ({selectedHotel.reviewCount})
                        </span>
                      </div>
                      <div className="font-bold text-lg text-red-600 mb-1">
                        {formatPrice(selectedHotel.price)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Belum termasuk pajak
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              </>
            )}
          </GoogleMap>
        </LoadScript>
        {/* Search in this area button & Hotel List Section hanya saat full */}
        {(full || isDesktop) && (
          <>
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-auto px-4 md:w-auto md:px-0 flex justify-center">
              <button
                onClick={handleSearchInArea}
                className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Mencari...</span>
                  </>
                ) : (
                  <span>Cari di area ini</span>
                )}
              </button>
            </div>
            <div className="fixed bottom-0 left-0 w-full z-30 bg-white shadow-2xl p-2 md:static md:w-96 md:h-full md:shadow-lg md:p-0">
              {/* Search Header */}
              <div className="p-4 border-b hidden md:block">
                <input
                  type="text"
                  placeholder="Cari ..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder:text-neutral-400 text-neutral-900"
                />
                <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                  <span>{visibleHotels.length} hotel ditemukan</span>
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                  {!isInitialLoad && visibleHotels.length > 0 && (
                    <span className="text-xs text-blue-600">
                      • Geser map & klik "Cari di area ini" untuk area lain
                    </span>
                  )}
                </div>
              </div>
              {/* Hotel List */}
              <div className="p-4">
                {getCurrentPageHotels().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Tidak ada hotel ditemukan di area ini
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto flex-nowrap md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-x-visible md:flex-none">
                    {getCurrentPageHotels().map((rental) => (
                      <Link
                        key={rental.rentalId}
                        href={`/detail/${rental.rentalId}`}
                        passHref
                        legacyBehavior
                      >
                        <a
                          className="min-w-[260px] max-w-xs flex-shrink-0 md:min-w-0 md:max-w-full border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer md:col-span-1"
                          style={{ display: "block", height: "100%" }}
                        >
                          <div className="flex gap-3">
                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                              <img
                                src={
                                  rental.mainImage ||
                                  "https://dummyimage.com/300x200/cccccc/ffffff.jpg&text=No+Image"
                                }
                                alt={rental.name}
                                className="object-cover w-full h-full rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://dummyimage.com/300x200/cccccc/ffffff.jpg&text=No+Image";
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm text-gray-900">
                                {rental.name}
                              </h3>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-yellow-500 text-xs">
                                  ★
                                </span>
                                <span className="text-xs">
                                  {rental.rating}/5 ({rental.reviewCount})
                                </span>
                              </div>
                              <p
                                className="text-xs text-gray-600 mt-1 break-words break-all"
                                style={{ textWrap: "wrap" }}
                              >
                                542 m dari area pilihanmu
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {rental.originalPrice && (
                                  <span className="text-xs line-through text-gray-500">
                                    {formatPrice(rental.originalPrice)}
                                  </span>
                                )}
                                <span className="font-bold text-red-600 text-sm">
                                  {formatPrice(rental.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                )}
                {/* Pagination tetap di bawah, tidak horizontal */}
                {totalPages > 1 && (
                  <div className="hidden md:flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>{" "}
      {/* Close main flex container */}
    </>
  );
}
