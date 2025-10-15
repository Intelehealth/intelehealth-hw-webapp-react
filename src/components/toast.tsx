// src/components/ToastContent.tsx
import React from 'react';

type Props = {
  title: string;
  description?: string;
};

const ToastContent: React.FC<Props> = ({ title, description }) => (
  <div className="font-(family-name:--font-sans)">
    <strong className="block text-sm font-semibold">{title}</strong>
    <span className="text-xs text-gray-600">{description}</span>
  </div>
);

export default ToastContent;
