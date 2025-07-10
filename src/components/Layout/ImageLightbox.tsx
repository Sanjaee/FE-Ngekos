import React from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

export interface ImageData {
  id: number;
  src: string;
  alt: string;
  category: "exterior" | "room" | "bathroom" | "restaurant" | "pool" | "lobby";
  description: string;
  isMain?: boolean;
}

interface ImageLightboxProps {
  images: ImageData[];
  open: boolean;
  index: number;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  open,
  index,
  onClose,
}) => {
  const slides = images.map((image) => ({
    src: image.src,
    width: 1920,
    height: 1280,
    alt: image.alt,
    description: image.description,
  }));

  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={slides}
      index={index}
      plugins={[Zoom]}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      styles={{
        container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
      }}
    />
  );
};

export default ImageLightbox;
