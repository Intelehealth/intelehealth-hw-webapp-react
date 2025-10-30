import React, { type ReactNode } from 'react';

interface CardProps {
  image?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}

const Card: React.FC<CardProps> = ({
  image,
  title,
  description,
  children,
  className = '',
  contentClassName = 'p-4 md:p-8',
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden border border-(--color-primary-light) hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      {/* Image */}
      {image && (
        <img src={image} alt={title} className="w-full h-48 object-cover" />
      )}

      {/* Content */}
      <div className={contentClassName}>
        {title && <h3 className="text-lg font-bold text-gray-800">{title}</h3>}
        {description && (
          <p className="text-gray-600 text-sm mt-2">{description}</p>
        )}

        {/* Extra (buttons, custom content) */}
        {children && (
          <div className={`${title || description ? 'mt-4' : ''}`}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
