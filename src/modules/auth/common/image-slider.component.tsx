import { useEffect, useState } from 'react';
import type { Slide } from '../../../types/common.types';

interface ImageSliderProps {
  slides: Slide[];
  autoPlay?: boolean;
  interval?: number;
  hideImages?: boolean;
}

const ImageSlider = ({
  slides,
  autoPlay = true,
  interval = 3000,
  hideImages = false,
}: ImageSliderProps) => {
  const [current, setCurrent] = useState(0);

  // Auto-play effect
  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrent(prev => (prev === slides.length - 1 ? 0 : prev + 1));
    }, interval);

    return () => clearInterval(timer);
  }, [current, autoPlay, interval, slides.length]);

  return (
    <div className="relative w-full mr-4 lg:max-w-xl lg:mx-auto  overflow-hidden rounded-lg">
      {/* Slide container */}
      <div
        className="flex transition-transform duration-700"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="min-w-full flex px-6 lg:px-0 lg:flex-col items-center justify-center relative"
          >
            {!hideImages && (
              <>
                <div className="relative w-[50%] lg:w-full h-40 lg:h-96">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                {/* Heartbeat images positioned outside the slider image */}
                {slide.heartbeat1 && (
                  <img
                    src={slide.heartbeat1}
                    alt="heartbeat red"
                    className="absolute -top-8 -right-5 lg:-top-12 lg:-right-5 w-34 h-34 lg:w-32 lg:h-32 object-contain z-10"
                  />
                )}
                {slide.heartbeat2 && (
                  <img
                    src={slide.heartbeat2}
                    alt="heartbeat green"
                    className="absolute top-4 -left-5 lg:top-12 lg:-left-1 w-34 h-34 lg:w-30 lg:h-30 object-contain z-10"
                  />
                )}
              </>
            )}
            <div
              className={`mt-5 lg:text-center ${hideImages ? 'text-center' : 'text-left'}`}
            >
              <h3 className="text-xl font-bold text-white">{slide.title}</h3>
              <p className="text-white text-base mt-4">{slide.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {slides.length > 1 &&
          slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`rounded-full transition-all duration-300 ${
                index === current ? 'bg-white w-8 h-2' : 'bg-gray-400 w-3 h-2'
              }`}
            />
          ))}
      </div>
    </div>
  );
};

export default ImageSlider;
