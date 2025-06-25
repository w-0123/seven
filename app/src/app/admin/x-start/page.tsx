'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 轮播图组件
const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const images = [
    {
      src: '/images/slide1.png',
      alt: '轮播图 1',
    },
    {
      src: '/images/slide2.png',
      alt: '轮播图 2',
    },
    {
      src: '/images/slide3.png',
      alt: '轮播图 3',
      hasButton: true,
      buttonText: '立即体验',
      buttonLink: '/admin/noLogin',
    },
  ];

  // 重置定时器的函数
  const resetTimer = useCallback(() => {
    return setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000);
  }, [images.length]);

  useEffect(() => {
    const timer = resetTimer();
    return () => clearInterval(timer);
  }, [currentIndex, resetTimer]);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="fixed inset-0 w-full h-full">
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              className="object-cover"
            />
            {image.hasButton && (
              <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={() => router.push(image.buttonLink || '')}
                  className="px-12 py-4 bg-blue-500 text-white text-lg rounded-full hover:bg-blue-600 transition-colors"
                >
                  {image.buttonText}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-4 h-4 rounded-full transition-colors ${
              index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// 启动页组件
const SplashScreen = ({ onTimeout }: { onTimeout: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onTimeout, 3000);
    return () => clearTimeout(timer);
  }, [onTimeout]);

  return (
    <div className="fixed inset-0 w-full h-full bg-white">
      <div className="w-full h-full flex flex-col items-center justify-center -mt-20">
        <div className="w-[3.5rem] h-[3.5rem] relative mb-3">
          <Image
            src="/images/logo-green.png"
            alt="白菜出行"
            fill
            priority
            className="object-contain"
          />
        </div>
        <h1 className="text-[1rem] text-[#333333]">白菜出行</h1>
        <div className="absolute bottom-[2rem] text-center">
          <p className="text-[0.875rem] text-[#999999]">V1.0.0</p>
        </div>
      </div>
    </div>
  );
};

// 主页面
export default function StartPage() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashTimeout = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <main className="fixed inset-0 w-full h-full">
      {showSplash ? (
        <SplashScreen onTimeout={handleSplashTimeout} />
      ) : (
        <Carousel />
      )}
    </main>
  );
}