'use client';

import { useState, useEffect, useRef } from 'react';
import { getCachedImageUrl } from '@/lib/imageCache';
import ImageModal from './ImageModal';

interface CachedImageProps {
  imagePath: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  clickable?: boolean;
  lazy?: boolean;
}

export default function CachedImage({ 
  imagePath, 
  alt, 
  width, 
  height, 
  className,
  clickable = true,
  lazy = true
}: CachedImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, inView]);

  useEffect(() => {
    if (!imagePath || !inView) {
      setLoading(false);
      return;
    }

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const url = await getCachedImageUrl(imagePath);
        setImageUrl(url);
      } catch (err) {
        console.error('Failed to load image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [imagePath, inView]);

  const containerStyle = { width, height };

  if (!inView) {
    return (
      <div 
        ref={imgRef}
        className={`${className} bg-gray-200 dark:bg-gray-700`}
        style={containerStyle}
      />
    );
  }

  if (loading) {
    return (
      <div 
        className={`${className} bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center`}
        style={containerStyle}
      >
        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div 
        className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600`}
        style={containerStyle}
      >
        <span className="text-gray-500 text-sm">No image</span>
      </div>
    );
  }

  if (clickable) {
    return (
      <ImageModal
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'cover' }}
      loading="lazy"
    />
  );
}
