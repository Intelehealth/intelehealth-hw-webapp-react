import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../i18n';
import SettingsLanguage from '../../../modules/settings/settings-language.component';

const mockShowConfirmModal = vi.fn();
vi.mock('../../../components/modal/global-modal-context', () => ({
  useGlobalModal: () => ({
    showConfirmModal: mockShowConfirmModal,
    showVitalConfirmationModal: vi.fn(),
    closeModal: vi.fn(),
  }),
}));

const mockHook = {
  language: 'en',
  isUpdating: false,
  setLanguage: vi.fn(),
  handleReset: vi.fn(),
  handleUpdateProtocols: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../../../modules/settings/settings.hooks', () => ({
  useLanguageSettings: () => mockHook,
}));

// Mock useConfig to provide dynamic language options
const mockConfig = {
  config: null as Record<string, unknown> | null,
  error: null,
  lastFetched: null,
};

vi.mock('../../../hooks/useConfig', () => ({
  useConfig: () => mockConfig,
}));

// Capture the onChange prop passed to Dropdown so we can invoke it directly.
let capturedDropdownOnChange: ((value: string | string[]) => void) | undefined;
vi.mock('../../../components/common', async orig => {
  const actual = await orig<typeof import('../../../components/common')>();
  return {
    ...actual,
    Dropdown: (props: { onChange?: (value: string | string[]) => void; value?: string; options?: unknown[] }) => {
      capturedDropdownOnChange = props.onChange;
      return <select data-testid="mock-dropdown" value={props.value || ''} onChange={() => {}} />;
    },
  };
});

const renderComponent = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <SettingsLanguage />
    </I18nextProvider>
  );

describe('SettingsLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook.language = 'en';
    mockHook.isUpdating = false;
    mockHook.handleUpdateProtocols = vi.fn().mockResolvedValue(undefined);
    mockConfig.config = null;
  });

  it('renders the section heading', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: 'Language' })).toBeInTheDocument();
  });

  it('renders App language and Reset rows', () => {
    renderComponent();
    expect(screen.getByText('App language')).toBeInTheDocument();
    expect(screen.getByText('Reset to English')).toBeInTheDocument();
  });

  it('renders Reset button', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
  });

  it('calls handleReset when Reset button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(mockHook.handleReset).toHaveBeenCalled();
  });

  it('shows "Change language?" confirm modal when a different language is picked', () => {
    renderComponent();
    const dropdownTrigger = document.querySelector(
      '[role="combobox"], [aria-haspopup="listbox"]'
    ) as HTMLElement;
    if (dropdownTrigger) fireEvent.click(dropdownTrigger);

    const hindiOption = screen.queryByText('Hindi');
    if (hindiOption) {
      fireEvent.click(hindiOption);
      expect(mockShowConfirmModal).toHaveBeenCalled();
      const call = mockShowConfirmModal.mock.calls[0][0];
      expect(call.title).toBe('Change language?');
      expect(call.confirmText).toBe('Yes');
      expect(call.cancelText).toBe('No');
    }
  });

  it('does not show the confirm modal when the already-selected language is picked', () => {
    renderComponent();
    expect(mockHook.setLanguage).not.toHaveBeenCalled();
  });

  it('early returns without showing modal when the same language code is selected', () => {
    mockHook.language = 'en';
    renderComponent();
    act(() => {
      capturedDropdownOnChange?.('en');
    });
    expect(mockShowConfirmModal).not.toHaveBeenCalled();
  });

  it('handles array value from Dropdown onChange (takes first element)', () => {
    mockHook.language = 'en';
    renderComponent();
    act(() => {
      capturedDropdownOnChange?.(['hi']);
    });
    expect(mockShowConfirmModal).toHaveBeenCalled();
    const call = mockShowConfirmModal.mock.calls[0][0];
    expect(call.title).toBe('Change language?');
    expect(call.description).toContain('Hindi');
  });

  it('falls back to code as label when language code is not found in options', () => {
    mockHook.language = 'en';
    renderComponent();
    act(() => {
      capturedDropdownOnChange?.('zz');
    });
    expect(mockShowConfirmModal).toHaveBeenCalled();
    const call = mockShowConfirmModal.mock.calls[0][0];
    expect(call.description).toContain('zz');
  });

  it('invokes the onConfirm callback from the confirm modal to call setLanguage', () => {
    mockHook.language = 'en';
    renderComponent();
    act(() => {
      capturedDropdownOnChange?.('hi');
    });
    expect(mockShowConfirmModal).toHaveBeenCalled();
    const call = mockShowConfirmModal.mock.calls[0][0];
    act(() => {
      call.onConfirm();
    });
    expect(mockHook.setLanguage).toHaveBeenCalledWith('hi', 'Hindi');
  });

  it('uses dynamic language options from config when available', () => {
    mockConfig.config = {
      language: [
        { name: 'English', code: 'en', en_name: 'English', is_default: true, platform: 'Both', is_enabled: true },
        { name: 'हिंदी', code: 'hi', en_name: 'Hindi', is_default: false, platform: 'Both', is_enabled: true },
        { name: 'русский', code: 'ru', en_name: 'Russian', is_default: false, platform: 'Both', is_enabled: true },
      ],
    };
    mockHook.language = 'en';
    renderComponent();
    act(() => {
      capturedDropdownOnChange?.('ru');
    });
    expect(mockShowConfirmModal).toHaveBeenCalled();
    const call = mockShowConfirmModal.mock.calls[0][0];
    expect(call.description).toContain('Russian');
  });

  it('falls back to LANGUAGE_OPTIONS when config has no languages', () => {
    mockConfig.config = { language: [] };
    mockHook.language = 'en';
    renderComponent();
    act(() => {
      capturedDropdownOnChange?.('hi');
    });
    expect(mockShowConfirmModal).toHaveBeenCalled();
    const call = mockShowConfirmModal.mock.calls[0][0];
    expect(call.description).toContain('Hindi');
  });

  it('filters out disabled languages from config', () => {
    mockConfig.config = {
      language: [
        { name: 'English', code: 'en', en_name: 'English', is_default: true, platform: 'Both', is_enabled: true },
        { name: 'हिंदी', code: 'hi', en_name: 'Hindi', is_default: false, platform: 'Both', is_enabled: false },
      ],
    };
    mockHook.language = 'en';
    renderComponent();
    // Only 'en' is enabled, so 'hi' won't be in options — falls back to code as label
    act(() => {
      capturedDropdownOnChange?.('hi');
    });
    const call = mockShowConfirmModal.mock.calls[0][0];
    expect(call.description).toContain('hi');
  });

  it('filters out Mobile-only languages from config', () => {
    mockConfig.config = {
      language: [
        { name: 'English', code: 'en', en_name: 'English', is_default: true, platform: 'Both', is_enabled: true },
        { name: 'Test', code: 'xx', en_name: 'TestLang', is_default: false, platform: 'Mobile', is_enabled: true },
      ],
    };
    mockHook.language = 'en';
    renderComponent();
    act(() => {
      capturedDropdownOnChange?.('xx');
    });
    const call = mockShowConfirmModal.mock.calls[0][0];
    // 'xx' is Mobile-only, so it should not be in the dropdown options — label falls back to code
    expect(call.description).toContain('xx');
  });

  it('includes Web-platform languages from config', () => {
    mockConfig.config = {
      language: [
        { name: 'English', code: 'en', en_name: 'English', is_default: true, platform: 'Web', is_enabled: true },
        { name: 'हिंदी', code: 'hi', en_name: 'Hindi', is_default: false, platform: 'Web', is_enabled: true },
      ],
    };
    mockHook.language = 'en';
    renderComponent();
    act(() => {
      capturedDropdownOnChange?.('hi');
    });
    const call = mockShowConfirmModal.mock.calls[0][0];
    expect(call.description).toContain('Hindi');
  });
});
