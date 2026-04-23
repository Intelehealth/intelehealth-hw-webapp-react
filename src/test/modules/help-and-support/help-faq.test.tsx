import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HelpFaq from '../../../modules/help-and-support/help-faq';
import HelpCategoryContext from '../../../modules/help-and-support/context/help-category.context';
import { questionAnswerList } from '../../../assets/data/help.data';

vi.mock('../../../assets/icons/icon-search.svg', () => ({
  default: 'mocked-search-icon.svg',
}));

vi.mock('../../../assets/icons/icon-chevron-down.svg', () => ({
  default: 'mocked-chevron-icon.svg',
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithProviders = (
  ui: React.ReactElement,
  { category = 'All' }: { category?: string } = {}
) => {
  return render(
    <MemoryRouter>
      <HelpCategoryContext.Provider value={category}>
        {ui}
      </HelpCategoryContext.Provider>
    </MemoryRouter>
  );
};

describe('HelpFaq', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Default rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<HelpFaq />);
      expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
    });

    it('should render "Frequently asked questions" heading', () => {
      renderWithProviders(<HelpFaq />);
      expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
    });

    it('should render "More" button', () => {
      renderWithProviders(<HelpFaq />);
      expect(screen.getByText('More')).toBeInTheDocument();
    });

    it('should display all FAQ questions', () => {
      renderWithProviders(<HelpFaq />);
      questionAnswerList.forEach(item => {
        expect(screen.getByText(item.question)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to /help/faq when "More" button is clicked', () => {
      renderWithProviders(<HelpFaq />);
      fireEvent.click(screen.getByText('More'));
      expect(mockNavigate).toHaveBeenCalledWith('/help/faq');
    });
  });

  describe('QuestionAnswerCard toggle', () => {
    it('should not show answer by default', () => {
      renderWithProviders(<HelpFaq />);
      const firstAnswer = questionAnswerList[0].answer;
      expect(screen.queryByText(firstAnswer)).not.toBeInTheDocument();
    });

    it('should show answer when question is clicked', () => {
      renderWithProviders(<HelpFaq />);
      const firstQuestion = questionAnswerList[0].question;
      fireEvent.click(screen.getByText(firstQuestion));
      const firstAnswer = questionAnswerList[0].answer;
      expect(screen.getByText(firstAnswer)).toBeInTheDocument();
    });

    it('should hide answer when question is clicked again', () => {
      renderWithProviders(<HelpFaq />);
      const firstQuestion = questionAnswerList[0].question;
      fireEvent.click(screen.getByText(firstQuestion));
      expect(screen.getByText(questionAnswerList[0].answer)).toBeInTheDocument();
      fireEvent.click(screen.getByText(firstQuestion));
      expect(screen.queryByText(questionAnswerList[0].answer)).not.toBeInTheDocument();
    });

    it('should rotate the chevron icon when open', () => {
      renderWithProviders(<HelpFaq />);
      const firstQuestion = questionAnswerList[0].question;
      const questionRow = screen.getByText(firstQuestion).closest('.flex.items-center');
      const chevron = questionRow?.querySelector('img');
      expect(chevron?.className).not.toContain('rotate-180');
      fireEvent.click(screen.getByText(firstQuestion));
      expect(chevron?.className).toContain('rotate-180');
    });

    it('should render chevron icon with correct src', () => {
      renderWithProviders(<HelpFaq />);
      const toggleIcons = screen.getAllByAltText('toggle');
      expect(toggleIcons.length).toBeGreaterThan(0);
      expect(toggleIcons[0]).toHaveAttribute('src', 'mocked-chevron-icon.svg');
    });
  });

  describe('Category filtering', () => {
    it('should show all FAQs when category is "All"', () => {
      renderWithProviders(<HelpFaq />, { category: 'All' });
      questionAnswerList.forEach(item => {
        expect(screen.getByText(item.question)).toBeInTheDocument();
      });
    });

    it('should filter FAQs by category', () => {
      renderWithProviders(<HelpFaq />, { category: 'Registration' });
      const registrationFaqs = questionAnswerList.filter(
        item => item.category === 'Registration'
      );
      const otherFaqs = questionAnswerList.filter(
        item => item.category !== 'Registration'
      );
      registrationFaqs.forEach(item => {
        expect(screen.getByText(item.question)).toBeInTheDocument();
      });
      otherFaqs.forEach(item => {
        expect(screen.queryByText(item.question)).not.toBeInTheDocument();
      });
    });

    it('should show no FAQs when category has no matches', () => {
      renderWithProviders(<HelpFaq />, { category: 'Nonexistent' });
      questionAnswerList.forEach(item => {
        expect(screen.queryByText(item.question)).not.toBeInTheDocument();
      });
    });
  });

  describe('Search functionality', () => {
    it('should render mobile search input', () => {
      renderWithProviders(<HelpFaq />);
      expect(screen.getByPlaceholderText('Search FAQ')).toBeInTheDocument();
    });

    it('should filter FAQs by search query matching question', () => {
      renderWithProviders(
        <HelpFaq searchQuery="register" onSearchChange={vi.fn()} />
      );
      expect(screen.getByText('How to register new patient?')).toBeInTheDocument();
    });

    it('should filter FAQs by search query matching answer', () => {
      renderWithProviders(
        <HelpFaq searchQuery="privacy policy" onSearchChange={vi.fn()} />
      );
      expect(screen.getByText('How to register new patient?')).toBeInTheDocument();
    });

    it('should filter FAQs case-insensitively', () => {
      renderWithProviders(
        <HelpFaq searchQuery="INTELEHEALTH" onSearchChange={vi.fn()} />
      );
      expect(screen.getByText('How intelehealth works?')).toBeInTheDocument();
    });

    it('should use internal search state when no external props provided', () => {
      renderWithProviders(<HelpFaq />);
      const searchInput = screen.getByPlaceholderText('Search FAQ');
      fireEvent.change(searchInput, { target: { value: 'appointment' } });
      expect(screen.getByText('How to book an appointment?')).toBeInTheDocument();
    });

    it('should call external onSearchChange when provided', () => {
      const onSearchChange = vi.fn();
      renderWithProviders(
        <HelpFaq searchQuery="" onSearchChange={onSearchChange} />
      );
      const searchInput = screen.getByPlaceholderText('Search FAQ');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      expect(onSearchChange).toHaveBeenCalledWith('test');
    });
  });

  describe('Component export', () => {
    it('should export HelpFaq as default', () => {
      expect(HelpFaq).toBeDefined();
      expect(typeof HelpFaq).toBe('function');
    });
  });
});
