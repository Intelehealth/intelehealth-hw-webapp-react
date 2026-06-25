import React, { createContext, useCallback, useContext, useState } from 'react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  state?: Record<string, unknown>;
  status?: 'completed' | 'active' | 'pending';
  onClick?: () => void;
}

interface BreadcrumbContextType {
  items: BreadcrumbItem[];
  bgColor: string;
  setItems: (items: BreadcrumbItem[]) => void;
  setBgColor: (color: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | null>(null);

export const BreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItemsState] = useState<BreadcrumbItem[]>([]);
  const [bgColor, setBgColorState] = useState('bg-white');

  const setItems = useCallback((newItems: BreadcrumbItem[]) => {
    setItemsState(newItems);
  }, []);

  const setBgColor = useCallback((color: string) => {
    setBgColorState(color);
  }, []);

  return (
    <BreadcrumbContext.Provider
      value={{ items, bgColor, setItems, setBgColor }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumbContext = (): BreadcrumbContextType => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error(
      'useBreadcrumbContext must be used within a BreadcrumbProvider'
    );
  }
  return context;
};
