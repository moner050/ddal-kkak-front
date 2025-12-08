import React, { useState } from 'react';

interface StockLogoProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: string;
  onError?: () => void;
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const fallbackIconSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl',
};

export default function StockLogo({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackIcon = '📊',
  onError,
}: StockLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  const handleLoad = () => {
    setImageLoaded(true);
  };

  const baseClasses = `${sizeClasses[size]} rounded-lg object-contain flex-shrink-0`;
  const containerClasses = `${baseClasses} ${className} bg-white border border-gray-200 p-1`;

  // Show fallback if no src or error occurred
  if (!src || imageError) {
    return (
      <div className={`${containerClasses} flex items-center justify-center`}>
        <span className={`${fallbackIconSizes[size]} text-gray-400`}>{fallbackIcon}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      {/* Loading skeleton */}
      {!imageLoaded && (
        <div className={`${containerClasses} animate-pulse bg-gray-200`}>
          <div className="h-full w-full bg-gray-300 rounded"></div>
        </div>
      )}

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={`${containerClasses} ${!imageLoaded ? 'absolute inset-0 opacity-0' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
}
