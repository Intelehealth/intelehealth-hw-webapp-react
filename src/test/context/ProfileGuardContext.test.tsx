import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileGuardProvider, useProfileGuard } from '../../context/ProfileGuardContext';

// Mock the profile service
vi.mock('../../../services/mindmap', () => ({
  MindmapAuthGatewayApi: {
    get: vi.fn(),
  },
}));

const TestComponent = () => {
  const { isProfileComplete, loading, profileState } = useProfileGuard();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="complete">{isProfileComplete ? 'Complete' : 'Incomplete'}</div>
      <div data-testid="state">{profileState}</div>
    </div>
  );
};

describe('ProfileGuardContext', () => {
  it('should provide default values', () => {
    render(
      <ProfileGuardProvider>
        <TestComponent />
      </ProfileGuardProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    expect(screen.getByTestId('complete')).toHaveTextContent('Incomplete');
    expect(screen.getByTestId('state')).toHaveTextContent('not-started');
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useProfileGuard must be used within ProfileGuardProvider');
    
    consoleSpy.mockRestore();
  });
});
