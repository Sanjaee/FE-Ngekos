import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";

interface CardLayoutProps {
  image: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  description?: string;
  facilities: string[];
  onDetailClick?: () => void;
}

export const CardLayout: React.FC<CardLayoutProps> = ({
  image,
  name,
  address,
  rating,
  reviewCount,
  price,
  originalPrice,
  description,
  facilities,
  onDetailClick,
}) => {
  return (
    <Card
      className="bg-white hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col group"
      onClick={onDetailClick}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Image Section */}
        <div className="relative mb-3">
          <img
            src={image}
            alt={name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        </div>
        {/* Content Section */}
        <div className="p-3 flex flex-col flex-1">
          {/* Hotel Name and Location */}
          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 h-12 overflow-hidden">
            {name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{address}</p>

          {/* Rating Section */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <polygon points="9.9,1.1 12.3,6.9 18.6,7.6 13.8,11.9 15.2,18.1 9.9,14.8 4.6,18.1 6,11.9 1.2,7.6 7.5,6.9 " />
                </svg>
              ))}
            </div>
            <Badge className="bg-white text-black border border-black text-xs px-2 py-1 font-bold transition-colors duration-200 hover:bg-black hover:text-white cursor-pointer">
              {rating}/5
            </Badge>
            <span className="text-xs text-gray-500">
              ({reviewCount} Review)
            </span>
          </div>

          {/* Facilities */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {facilities.slice(0, 3).map((facility, index) => (
                <span
                  key={index}
                  className="shine-badge text-xs px-2 py-1 rounded-full border border-gray-400 bg-white text-black transition-colors duration-200"
                  style={{ display: "inline-block" }}
                >
                  {facility}
                </span>
              ))}
              {facilities.length > 3 && (
                <span
                  className="shine-badge text-xs px-2 py-1 rounded-full border border-gray-400 bg-white text-black transition-colors duration-200"
                  style={{ display: "inline-block" }}
                >
                  +{facilities.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Spacer agar bottom section selalu di bawah */}
          <div className="flex-1" />

          {/* Bottom Section rata ke bawah */}
          <div className="flex flex-col items-end text-right mt-2">
            <p className="text-xs text-gray-500 mb-1">Mulai dari</p>
            <span className="text-lg font-bold text-red-600 mb-1">
              IDR {price.toLocaleString("id-ID")}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-500 line-through mb-1">
                IDR {originalPrice.toLocaleString("id-ID")}
              </span>
            )}
            <p className="text-xs text-gray-500">/kamar</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CardLayout;
