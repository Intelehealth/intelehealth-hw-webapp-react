import { useEffect } from 'react';
import {
  useBreadcrumbContext,
  type BreadcrumbItem,
} from '../context/BreadcrumbContext';

interface UseBreadcrumbOptions {
  bgColor?: string;
}

export const useBreadcrumb = (
  items: BreadcrumbItem[],
  options?: UseBreadcrumbOptions
): void => {
  const { setItems, setBgColor } = useBreadcrumbContext();

  useEffect(() => {
    setItems(items);
    if (options?.bgColor) {
      setBgColor(options.bgColor);
    }
    return () => {
      setItems([]);
      setBgColor('bg-white');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items), options?.bgColor, setItems, setBgColor]);
};
