import React, { useState } from "react";
import { Eye, Heart } from "lucide-react";
import ImageLightbox from "./ImageLightbox";
import type { Rental } from "@/lib/api";

interface DetailPageProps {
  hotel: Rental;
}

const DetailPage: React.FC<DetailPageProps> = ({ hotel }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const images =
    hotel.images && hotel.images.length > 0
      ? hotel.images
      : hotel.mainImage
      ? [hotel.mainImage]
      : [];

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <div className=" text-black font-sans">
      {/* Image Gallery */}
      {/* Mobile: only show main image */}
      <div className="block md:hidden mb-8">
        {images[0] && (
          <div
            className="relative group cursor-pointer h-full"
            onClick={() => handleImageClick(0)}
          >
            <img
              src={images[0]}
              alt={hotel.name}
              className="w-full h-[400px] object-cover rounded-xl shadow-lg border"
            />
            <div className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-xl flex items-center justify-center">
              <Eye
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                size={32}
              />
            </div>
            <button className="absolute top-4 right-4 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all shadow">
              <Heart size={20} className="text-gray-600 hover:text-red-500" />
            </button>
          </div>
        )}
      </div>
      {/* Desktop: show up to 5 images (main + 4 thumbnails) */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Image */}
        <div className="lg:col-span-2 row-span-2">
          {images[0] && (
            <div
              className="relative group cursor-pointer h-full"
              onClick={() => handleImageClick(0)}
            >
              <img
                src={images[0]}
                alt={hotel.name}
                className="w-full h-[400px] object-cover rounded-xl shadow-lg border"
              />
              <div className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-xl flex items-center justify-center">
                <Eye
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  size={32}
                />
              </div>
              <button className="absolute top-4 right-4 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all shadow">
                <Heart size={20} className="text-gray-600 hover:text-red-500" />
              </button>
            </div>
          )}
        </div>
        {/* Thumbnails */}
        <div className="grid grid-cols-2 grid-rows-2 gap-4">
          {(images || []).slice(1, 5).map((img: string, idx: number) => (
            <div
              key={idx}
              className="relative group cursor-pointer"
              onClick={() => handleImageClick(idx + 1)}
            >
              <img
                src={img}
                alt={hotel.name + " " + (idx + 2)}
                className="w-full h-[190px] object-cover rounded-xl border shadow"
              />
              <div className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-xl flex items-center justify-center">
                <Eye
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  size={24}
                />
              </div>
              {idx === 3 && (images || []).length > 5 && (
                <div className="absolute inset-0  bg-opacity-50 rounded-xl flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    +{(images || []).length - 5} foto lain
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rental Info */}
      <div className="border-b pb-6 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
            Kosan
          </span>
          <div className="flex items-center">
            {Array.from({ length: Math.floor(hotel.rating) }).map((_, i) => (
              <span key={i} className="text-yellow-400">
                ★
              </span>
            ))}
            {hotel.rating % 1 !== 0 && (
              <span className="text-yellow-400">★</span>
            )}
            {Array.from({ length: 5 - Math.ceil(hotel.rating) }).map((_, i) => (
              <span key={i} className="text-gray-400">
                ★
              </span>
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-2">
            {hotel.reviewCount} review
          </span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{hotel.name}</h1>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-lg font-semibold">{hotel.rating}/5</span>
            <span className="text-gray-600">{hotel.address}</span>
            <span className="text-gray-600">Kamar: {hotel.roomCount || 1}</span>
            <span className="text-gray-600">
              Tersedia: {hotel.isAvailable ? "Ya" : "Tidak"}
            </span>
            <span className="text-gray-600">
              Status: {hotel.isActive ? "Aktif" : "Tidak Aktif"}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Mulai dari</div>
            <div className="text-2xl font-bold text-red-600">
              IDR {hotel.price.toLocaleString("id-ID")}
            </div>
            {hotel.originalPrice && (
              <div className="text-sm text-gray-500 line-through">
                IDR {hotel.originalPrice.toLocaleString("id-ID")}
              </div>
            )}
            <div className="text-sm text-gray-600">/kamar/malam</div>
          </div>
        </div>
      </div>

      {/* Facilities Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-3">Fasilitas</h2>
        <div className="flex flex-wrap gap-2">
          {(hotel.facilities || []).map((facility: string, idx: number) => (
            <span
              key={idx}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium shadow"
            >
              {facility}
            </span>
          ))}
        </div>
      </div>

      {/* Description Section */}
      {hotel.description && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3">Deskripsi</h2>
          <div className="bg-gray-50 border rounded-lg p-4 text-gray-700 whitespace-pre-line">
            {hotel.description}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <ImageLightbox
        images={(images || []).map((src: string, i: number) => ({
          id: i + 1,
          src,
          alt: hotel.name + " " + (i + 1),
          category: "room",
          description: hotel.name,
        }))}
        open={isLightboxOpen}
        index={lightboxIndex}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
};

export default DetailPage;
