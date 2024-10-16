import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  if (currentIndex === null || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`X-Ray ${currentIndex + 1}`}
          className="max-w-full max-h-[90vh] object-contain"
        />
        <button
          className="absolute top-4 right-4 text-white hover:text-gray-300"
          onClick={onClose}
        >
          <X size={24} />
        </button>
        <button
          className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white hover:text-gray-300"
          onClick={onPrev}
        >
          <ChevronLeft size={40} />
        </button>
        <button
          className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white hover:text-gray-300"
          onClick={onNext}
        >
          <ChevronRight size={40} />
        </button>
      </div>
    </div>
  );
}
