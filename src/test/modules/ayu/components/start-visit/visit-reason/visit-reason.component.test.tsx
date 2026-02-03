import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisitReason } from '../../../../../../modules/ayu/components/start-visit/visit-reason/visit-reason.component';

// Mock all child components
vi.mock('../../../../../../modules/ayu/components/loaders/question-loader.component', () => ({
  QuestionLoader: vi.fn(({ children, question }) => (
    <div data-testid="question-loader">
      <div>{question}</div>
      {children}
    </div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/footer', () => ({
  VisitReasonFooter: vi.fn(({ questionIndex }) => (
    <div data-testid="visit-reason-footer">Footer - Question {questionIndex}</div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/reason-alphabetList.component', () => ({
  ReasonAlphabetList: vi.fn(() => (
    <div data-testid="reason-alphabet-list">Alphabet List</div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/reason-categoryList.component', () => ({
  ReasonCategoryList: vi.fn(() => (
    <div data-testid="reason-category-list">Category List</div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/search-input.component', () => ({
  ReasonSearchInput: vi.fn(() => (
    <div data-testid="reason-search-input">Search Input</div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/selected-reasons.component', () => ({
  SelectedReasons: vi.fn(() => (
    <div data-testid="selected-reasons">Selected Reasons</div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/useVisitReasons.hook', () => ({
  useVisitReasons: vi.fn(() => ({
    search: '',
    setSearch: vi.fn(),
    filteredNames: [],
    selectedReasons: [],
    addReason: vi.fn(),
    removeReason: vi.fn(),
    grouped: {},
  })),
}));

describe('VisitReason', () => {
  const mockOnNextQuestion = vi.fn();
  const mockOnPrevQuestion = vi.fn();
  const mockOnPrevSection = vi.fn();

  it('should render question loader with correct question', () => {
    render(
      <VisitReason
        questionIndex={0}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    expect(screen.getByText('What is the reason for this visit?')).toBeInTheDocument();
  });

  it('should render all child components', () => {
    render(
      <VisitReason
        questionIndex={0}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    expect(screen.getByTestId('question-loader')).toBeInTheDocument();
    expect(screen.getByTestId('reason-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('selected-reasons')).toBeInTheDocument();
    expect(screen.getByTestId('reason-category-list')).toBeInTheDocument();
    expect(screen.getByTestId('reason-alphabet-list')).toBeInTheDocument();
    expect(screen.getByTestId('visit-reason-footer')).toBeInTheDocument();
  });

  it('should render footer with correct question index', () => {
    render(
      <VisitReason
        questionIndex={2}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    expect(screen.getByText('Footer - Question 2')).toBeInTheDocument();
  });

  it('should render with onPrevSection prop', () => {
    render(
      <VisitReason
        questionIndex={0}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
        onPrevSection={mockOnPrevSection}
      />
    );

    expect(screen.getByTestId('visit-reason-footer')).toBeInTheDocument();
  });
});
