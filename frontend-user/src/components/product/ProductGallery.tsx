import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageWithFallback from '../common/ImageWithFallback';

interface ProductGalleryProps {
  images: { url: string }[];
  name: string;
}

const MotionImageWithFallback = motion(ImageWithFallback);

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const galleryImages = images && images.length > 0 ? images : [{ url: '/placeholder-product.png' }];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main Image Viewport */}
      <div
        className="relative w-full h-[320px] sm:h-[400px] md:h-[460px] lg:h-[500px] rounded-[2rem] overflow-hidden border border-slate-100/80 bg-white flex items-center justify-center cursor-zoom-in group shadow-2xs"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence mode="wait">
          <MotionImageWithFallback
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            src={galleryImages[activeIndex]?.url}
            alt={`${name} - ${activeIndex + 1}`}
            className={`w-full h-full object-contain p-6 bg-white select-none transition-transform duration-75 origin-center ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            style={
              isZoomed
                ? {
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                  }
                : undefined
            }
          />
        </AnimatePresence>

        {/* Floating Arrows */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center hover:scale-105 transition-all shadow-md z-10 cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center hover:scale-105 transition-all shadow-md z-10 cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails list */}
      {galleryImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto py-1">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer bg-white ${
                activeIndex === idx
                  ? 'border-[#2563EB] ring-4 ring-[#2563EB]/10 scale-95'
                  : 'border-slate-100 hover:border-slate-350 hover:scale-102'
              }`}
            >
              <ImageWithFallback
                src={img.url}
                alt={`${name} thumbnail ${idx + 1}`}
                className="w-full h-full object-contain p-2 bg-white"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
