import React from "react";

interface ImageDetailProps {
  images: string[];
  alt?: string;
}

const ImageDetail: React.FC<ImageDetailProps> = ({ images, alt }) => {
  if (!images || images.length === 0) return null;

  // On mobile, always 1 column; on md+ use grid logic
  if (images.length === 1) {
    return (
      <div className="w-full">
        <img
          src={images[0]}
          alt={alt || "Gambar"}
          className="w-full h-[400px] object-cover rounded-xl shadow-lg border"
        />
      </div>
    );
  }

  // Responsive grid: 1 col on mobile, N cols on md+
  let gridCols = "md:grid-cols-2";
  if (images.length === 3) gridCols = "md:grid-cols-3";
  if (images.length >= 4) gridCols = "md:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>
      {images.map((img, idx) => (
        <div key={idx} className="relative">
          <img
            src={img}
            alt={alt ? `${alt} ${idx + 1}` : `Gambar ${idx + 1}`}
            className="w-full h-[200px] object-cover rounded-xl shadow border"
          />
        </div>
      ))}
    </div>
  );
};

export default ImageDetail;
