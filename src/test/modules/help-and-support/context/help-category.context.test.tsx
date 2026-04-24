import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import HelpCategoryContext, {
  useHelpCategory,
} from '../../../../modules/help-and-support/context/help-category.context';

describe('HelpCategoryContext', () => {
  it('should provide default value of "All"', () => {
    const { result } = renderHook(() => useHelpCategory());
    expect(result.current).toBe('All');
  });

  it('should provide the value from the nearest provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <HelpCategoryContext.Provider value="Check-up">
        {children}
      </HelpCategoryContext.Provider>
    );

    const { result } = renderHook(() => useHelpCategory(), { wrapper });
    expect(result.current).toBe('Check-up');
  });

  it('should provide different category values', () => {
    const categories = ['All', 'Check-up', 'Appointment', 'Registration', 'Visit'];

    categories.forEach(category => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <HelpCategoryContext.Provider value={category}>
          {children}
        </HelpCategoryContext.Provider>
      );

      const { result } = renderHook(() => useHelpCategory(), { wrapper });
      expect(result.current).toBe(category);
    });
  });

  it('should export HelpCategoryContext as default', () => {
    expect(HelpCategoryContext).toBeDefined();
  });

  it('should export useHelpCategory hook', () => {
    expect(useHelpCategory).toBeDefined();
    expect(typeof useHelpCategory).toBe('function');
  });
});
