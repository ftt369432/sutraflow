import React from 'react';

interface ChatAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Simple default avatar as base64 SVG
const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlNWU3ZWIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzZiNzI4MCIvPgo8cGF0aCBkPSJNOCAzMmMwLTYuNjI3IDUuMzczLTEyIDEyLTEyczEyIDUuMzczIDEyIDEyIiBmaWxsPSIjNmI3MjgwIi8+Cjwvc3ZnPg==';

export function ChatAvatar({ src, alt, size = 'md', className = '' }: ChatAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const [imgSrc, setImgSrc] = React.useState(src || defaultAvatar);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (src && src !== imgSrc) {
      setIsLoading(true);
      setImgSrc(src);
    }
  }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    console.warn(`Failed to load avatar for ${alt}, using default`);
    setImgSrc(defaultAvatar);
    setIsLoading(false);
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          isLoading ? 'opacity-50' : 'opacity-100'
        }`}
        loading="lazy"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
