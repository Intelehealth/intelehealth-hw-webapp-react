import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// ── useLocation / useParams mock state ──────────────────────────────────────
const mockLocationState: { patientUuid?: string } = {};
const mockParams: Record<string, string> = {};

// Mock react-router-dom: keep MemoryRouter / Route / Routes real, stub hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...actual,
    useLocation: vi.fn(() => ({
      pathname: '/',
      search: '',
      hash: '',
      key: 'default',
      state: mockLocationState,
    })),
    useParams: vi.fn(() => mockParams),
  };
});

// Mock the StartVisit component
vi.mock('../../../../modules/ayu/components/start-visit/start-visit.component', () => ({
  StartVisit: vi.fn(() => <div data-testid="start-visit">Start Visit Component</div>),
}));

// Mock the StartVisitProvider – capture the initialPatientUuid prop
const mockStartVisitProviderProps: { initialPatientUuid?: string | null } = {};
vi.mock('../../../../modules/ayu/context/start-visit.context', () => ({
  StartVisitProvider: vi.fn(({ children, initialPatientUuid }: any) => {
    mockStartVisitProviderProps.initialPatientUuid = initialPatientUuid;
    return <div data-testid="start-visit-provider">{children}</div>;
  }),
  useStartVisitData: vi.fn(),
}));

// Mock VisitSummaryPage
vi.mock('../../../../modules/ayu/pages/visit-summary.page', () => ({
  default: vi.fn(() => (
    <div data-testid="visit-summary-page">Visit Summary Page</div>
  )),
}));

// Mock storage utility
const mockStorageGet = vi.fn((_key?: string): string | null => null);
const mockStorageSet = vi.fn((_key?: string, _val?: string) => {});
vi.mock('../../../../utils/storage', () => ({
  storage: {
    get: (key: string) => mockStorageGet(key),
    set: (key: string, val: string) => mockStorageSet(key, val),
    getLocationUuid: vi.fn(),
  },
}));

// Import after mocks are set up
const { default: AyuPage } = await import('../../../../modules/ayu/pages/ayu.page');

beforeEach(() => {
  // Reset mutable mock state
  Object.keys(mockLocationState).forEach((k) => delete (mockLocationState as any)[k]);
  Object.keys(mockParams).forEach((k) => delete mockParams[k]);
  mockStorageGet.mockReturnValue(null);
  mockStorageSet.mockReset();
  mockStartVisitProviderProps.initialPatientUuid = undefined;
});

describe('AyuPage', () => {
  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('start-visit')).toBeInTheDocument();
    });

    it('should render the main container with correct classes', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      const mainDiv = container.querySelector('.mx-auto.p-6.space-y-6');
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe('Route Configuration', () => {
    it('should render StartVisit component on root path', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('start-visit')).toBeInTheDocument();
      expect(screen.getByText('Start Visit Component')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should integrate Routes component correctly', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      // Verify Routes is rendered by checking for its child Route components
      expect(screen.getByTestId('start-visit')).toBeInTheDocument();
    });

    it('should render different components for different routes', () => {
      // Test root route
      const { unmount } = render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('start-visit')).toBeInTheDocument();
      expect(screen.queryByTestId('visit-summary-page')).not.toBeInTheDocument();

      unmount();

      // Test /visit-summary route
      render(
        <MemoryRouter initialEntries={['/visit-summary']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('visit-summary-page')).toBeInTheDocument();
      expect(screen.queryByTestId('start-visit')).not.toBeInTheDocument();
    });
  });

  describe('Component Exports', () => {
    it('should export AyuPage as default', () => {
      expect(AyuPage).toBeDefined();
      expect(typeof AyuPage).toBe('function');
    });

    it('should be a React functional component', () => {
      expect(AyuPage).toBeInstanceOf(Function);
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle re-renders correctly', () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('start-visit')).toBeInTheDocument();

      rerender(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('start-visit')).toBeInTheDocument();
    });

    it('should handle invalid route paths gracefully', () => {
      render(
        <MemoryRouter initialEntries={['/invalid-path']}>
          <AyuPage />
        </MemoryRouter>
      );

      // React Router should handle invalid paths by rendering nothing
      expect(screen.queryByTestId('start-visit')).not.toBeInTheDocument();
      expect(screen.queryByTestId('visit-summary-page')).not.toBeInTheDocument();
    });
  });

  describe('Component Styling', () => {
    it('should apply correct CSS classes to main container', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      const mainDiv = container.querySelector('div.mx-auto');
      expect(mainDiv).toHaveClass('mx-auto', 'p-6', 'space-y-6');
    });
  });

  describe('Route Props', () => {
    it('should pass correct element prop to StartVisit route', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('start-visit')).toBeInTheDocument();
    });
  });

  describe('Nested Routing', () => {
    it('should work correctly when nested in parent routes', () => {
      render(
        <MemoryRouter initialEntries={['/ayu']}>
          <Routes>
            <Route path="/ayu" element={<AyuPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Since AyuPage has relative routes, the root path should match
      expect(screen.getByTestId('start-visit')).toBeInTheDocument();
    });

    it('should handle deeply nested route paths', () => {
      render(
        <MemoryRouter initialEntries={['/app/ayu']}>
          <Routes>
            <Route path="/app/ayu" element={<AyuPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('start-visit')).toBeInTheDocument();
    });
  });

  /* ── Patient UUID resolution ────────────────────────────────────────────── */

  describe('Patient UUID resolution', () => {
    it('should prioritise UUID from location state over URL params', () => {
      const stateUuid = '11111111-1111-1111-1111-111111111111';
      const paramUuid = '22222222-2222-2222-2222-222222222222';

      mockLocationState.patientUuid = stateUuid;
      mockParams.patientUuid = paramUuid;

      render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(mockStartVisitProviderProps.initialPatientUuid).toBe(stateUuid);
    });

    it('should use UUID from URL params when state has no UUID', () => {
      const paramUuid = '22222222-2222-2222-2222-222222222222';
      mockParams.patientUuid = paramUuid;

      render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(mockStartVisitProviderProps.initialPatientUuid).toBe(paramUuid);
    });

    it('should ignore an invalid (non-UUID) URL param', () => {
      mockParams.patientUuid = 'not-a-valid-uuid';

      render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      // Falls through to localStorage (which also returns null)
      expect(mockStartVisitProviderProps.initialPatientUuid).toBeNull();
    });

    it('should fall back to localStorage when neither state nor params provide a UUID', () => {
      const storedUuid = '33333333-3333-3333-3333-333333333333';
      mockStorageGet.mockReturnValue(storedUuid);

      render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(mockStorageGet).toHaveBeenCalledWith('patientUuid');
      expect(mockStartVisitProviderProps.initialPatientUuid).toBe(storedUuid);
    });

    it('should resolve to null when no UUID is available anywhere', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(mockStartVisitProviderProps.initialPatientUuid).toBeNull();
    });
  });

  /* ── visit-summary sub-route ────────────────────────────────────────────── */

  describe('Visit Summary sub-route', () => {
    it('should render VisitSummaryPage on /visit-summary path', () => {
      render(
        <MemoryRouter initialEntries={['/visit-summary']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('visit-summary-page')).toBeInTheDocument();
      expect(screen.getByText('Visit Summary Page')).toBeInTheDocument();
    });
  });
});
