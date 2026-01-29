import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// Create mock objects
const mockAyuSchema = {
  linkId: 'test-questionnaire',
  type: 'group',
  text: 'Test Questionnaire',
  item: [
    {
      linkId: 'q1',
      type: 'string',
      text: 'Test Question',
    },
  ],
};

const mockTransformFhirToAyu = vi.fn(() => mockAyuSchema);

// Mock the transformFhirToAyu utility
vi.mock('../../../../modules/ayu-library/utils/fhir-to-ayu.util', () => ({
  transformFhirToAyu: mockTransformFhirToAyu,
}));

// Mock the JSON import
vi.mock('../../../../modules/ayu/pages/Cough.questionnaire.json', () => ({
  default: { mockFhirData: 'test-questionnaire' },
}));

// Mock the AyuRenderer component
vi.mock('../../../../modules/ayu/components/ayu-renderer.component', () => ({
  AyuRenderer: vi.fn(({ question }) => (
    <div data-testid="ayu-renderer">
      <div data-testid="ayu-question">{JSON.stringify(question)}</div>
    </div>
  )),
}));

// Mock the StartVisit component
vi.mock('../../../../modules/ayu/components/start-visit/start-visit.component', () => ({
  StartVisit: vi.fn(() => <div data-testid="start-visit">Start Visit Component</div>),
}));

// Import after mocks are set up
const { default: AyuPage } = await import('../../../../modules/ayu/pages/ayu.page');

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

    it('should render AyuRenderer component on /renders path', () => {
      render(
        <MemoryRouter initialEntries={['/renders']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('ayu-renderer')).toBeInTheDocument();
    });

    it('should pass question prop to AyuRenderer on /renders path', () => {
      render(
        <MemoryRouter initialEntries={['/renders']}>
          <AyuPage />
        </MemoryRouter>
      );

      const questionElement = screen.getByTestId('ayu-question');
      expect(questionElement).toBeInTheDocument();
      expect(questionElement.textContent).toBe(JSON.stringify(mockAyuSchema));
    });
  });

  describe('FHIR Transformation', () => {
    it('should use the transformed ayuSchema for rendering', () => {
      render(
        <MemoryRouter initialEntries={['/renders']}>
          <AyuPage />
        </MemoryRouter>
      );

      const questionElement = screen.getByTestId('ayu-question');
      expect(questionElement.textContent).toBe(JSON.stringify(mockAyuSchema));
    });

    it('should render content based on transformed schema', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPage />
        </MemoryRouter>
      );

      // Verify that routes are rendered, indicating the schema was transformed successfully
      expect(screen.getByTestId('start-visit')).toBeInTheDocument();
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
      expect(screen.queryByTestId('ayu-renderer')).not.toBeInTheDocument();

      unmount();

      // Test /renders route
      render(
        <MemoryRouter initialEntries={['/renders']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('ayu-renderer')).toBeInTheDocument();
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
      expect(screen.queryByTestId('ayu-renderer')).not.toBeInTheDocument();
    });

    it('should display error message when ayuSchema is null', async () => {
      // Mock transformFhirToAyu to return null
      vi.doMock('../../../../modules/ayu-library/utils/fhir-to-ayu.util', () => ({
        transformFhirToAyu: vi.fn(() => null),
      }));

      // Re-import the component with the new mock
      vi.resetModules();
      const { default: AyuPageWithNullSchema } = await import(
        '../../../../modules/ayu/pages/ayu.page'
      );

      render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPageWithNullSchema />
        </MemoryRouter>
      );

      expect(screen.getByText('No questionnaire available')).toBeInTheDocument();
      expect(screen.queryByTestId('start-visit')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ayu-renderer')).not.toBeInTheDocument();
    });

    it('should display error message when ayuSchema is undefined', async () => {
      // Mock transformFhirToAyu to return undefined
      vi.doMock('../../../../modules/ayu-library/utils/fhir-to-ayu.util', () => ({
        transformFhirToAyu: vi.fn(() => undefined),
      }));

      // Re-import the component with the new mock
      vi.resetModules();
      const { default: AyuPageWithUndefinedSchema } = await import(
        '../../../../modules/ayu/pages/ayu.page'
      );

      render(
        <MemoryRouter initialEntries={['/']}>
          <AyuPageWithUndefinedSchema />
        </MemoryRouter>
      );

      expect(screen.getByText('No questionnaire available')).toBeInTheDocument();
      expect(screen.queryByTestId('start-visit')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ayu-renderer')).not.toBeInTheDocument();
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

    it('should pass correct element prop to AyuRenderer route', () => {
      render(
        <MemoryRouter initialEntries={['/renders']}>
          <AyuPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('ayu-renderer')).toBeInTheDocument();
    });

    it('should pass ayuSchema as question prop to AyuRenderer', () => {
      render(
        <MemoryRouter initialEntries={['/renders']}>
          <AyuPage />
        </MemoryRouter>
      );

      const questionElement = screen.getByTestId('ayu-question');
      expect(questionElement.textContent).toBe(JSON.stringify(mockAyuSchema));
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
});
