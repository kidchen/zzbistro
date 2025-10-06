'use client';

import { useState } from 'react';

interface ImageModalProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function ImageModal({ src, alt, width, height, className }: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} cursor-pointer hover:opacity-90 transition-opacity object-cover`}
        onClick={() => setIsOpen(true)}
      />
      
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-2xl max-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
