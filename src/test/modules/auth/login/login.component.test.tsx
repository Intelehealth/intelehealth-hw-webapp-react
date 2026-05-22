import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { HashRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../../i18n'; // adjust path if needed

const mockHandleLogin = vi.fn();
let mockLoading = false;

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    ENABLE_SITE_CAPTCHA: 'false' as string | undefined,
    RECAPTCHA_SITE_KEY: undefined as string | undefined,
  },
}));

// Mock env so captcha is disabled by default in tests; individual tests toggle
// mockEnv to exercise captcha paths.
vi.mock('../../../../config/env', () => ({
  env: new Proxy(
    {},
    {
      get: (_target, prop: string) =>
        prop in mockEnv ? mockEnv[prop as keyof typeof mockEnv] : undefined,
    }
  ),
}));

// Mock useLogin hook
vi.mock('../../../../modules/auth/login/login.hooks', () => ({
  useLogin: () => ({
    handleLogin: mockHandleLogin,
    loading: mockLoading,
  }),
}));

// Mock Dropdown from common to control onChange shapes and expose value/error
vi.mock('../../../../components/common', async importActual => {
  const actual =
    await importActual<typeof import('../../../../components/common')>();
  const MockDropdown = (
    props: {
      label?: string;
      value?: string;
      error?: string;
      onChange: (value: string | string[] | undefined) => void;
    } & Record<string, unknown>
  ) => {
    const { label, value, error, onChange } = props;
    return (
      <div>
        {label && <span>{label}</span>}
        <div data-testid="dropdown-value">{String(value ?? '')}</div>
        <button type="button" onClick={() => onChange('doctor')}>
          Mock: Select Doctor
        </button>
        <button type="button" onClick={() => onChange(['admin'])}>
          Mock: Select Admin (Array)
        </button>
        <button type="button" onClick={() => onChange('visitor')}>
          Mock: Select Invalid
        </button>
        <button type="button" onClick={() => onChange(undefined)}>
          Mock: Set Undefined
        </button>
        {error && (
          <p role="alert" aria-live="assertive">
            {error}
          </p>
        )}
      </div>
    );
  };
  const MockReCaptcha = ({
    onChange,
  }: {
    onChange: (t: string | null) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onChange('valid-token')}>
        Mock: Verify Captcha
      </button>
      <button type="button" onClick={() => onChange(null)}>
        Mock: Clear Captcha
      </button>
    </div>
  );
  return {
    ...actual,
    Dropdown: MockDropdown,
    ReCaptcha: MockReCaptcha,
  };
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async importActual => {
  const actual = await importActual<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Import the component after mocks are registered
import LoginComponent from '../../../../modules/auth/login/login.component';

describe('LoginComponent (Vite + Vitest)', () => {
  const setup = () => {
    render(
      <I18nextProvider i18n={i18n}>
        <HashRouter>
          <LoginComponent />
        </HashRouter>
      </I18nextProvider>
    );
  };

  it('renders all form fields', () => {
    setup();

    expect(
      screen.getByText(/Please enter your login details/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your username/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your password/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Select Role/i)).toBeInTheDocument();
    expect(screen.getByText(/Agree to/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('navigates to forgot username page', () => {
    setup();
    fireEvent.click(screen.getByText(/Forgot Username/i));
    expect(mockNavigate).toHaveBeenCalledWith('/auth/forgot-username');
  });

  it('navigates to forgot password page', () => {
    setup();

    fireEvent.click(screen.getByText(/Forgot Password/i));
    expect(mockNavigate).toHaveBeenCalledWith('/auth/forgot-password');
  });

  it('shows validation errors when form is submitted empty', async () => {
    setup();

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/Username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
  });

  it('shows error when terms not accepted', async () => {
    setup();

    fireEvent.change(screen.getByPlaceholderText(/Enter your username/i), {
      target: { value: 'john' },
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: 'password123' },
    });

    // Uncheck terms checkbox
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Please read and agree the Terms & Conditions and Privacy Policy./i
        )
      ).toBeInTheDocument();
    });
  });

  it('submits valid form data', async () => {
    setup();

    fireEvent.change(screen.getByPlaceholderText(/Enter your username/i), {
      target: { value: 'john' },
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: 'securePass123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockHandleLogin).toHaveBeenCalledWith({
        username: 'john',
        password: 'securePass123',
      });
    });
  });

  it('renders tooltip icon', () => {
    setup();

    expect(screen.getByAltText('info')).toBeInTheDocument();
  });

  it('disables login button when loading is true', async () => {
    mockLoading = true;
    setup();
    expect(screen.getByRole('button', { name: /Loading/i })).toBeDisabled();
  });

  it('can select a role via dropdown mock (string value)', async () => {
    setup();

    // Default role is 'nurse'
    expect(screen.getByTestId('dropdown-value')).toHaveTextContent('nurse');

    // Trigger string onChange to set 'doctor'
    fireEvent.click(screen.getByText(/Mock: Select Doctor/i));

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-value')).toHaveTextContent('doctor');
    });
  });

  it('shows password min length error on blur when too short', async () => {
    mockLoading = false;
    setup();

    const password = screen.getByPlaceholderText(/Enter your password/i);
    fireEvent.change(password, { target: { value: '123' } });
    fireEvent.blur(password);

    await waitFor(() => {
      expect(
        screen.getByText(/Password must be at least 6 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('validates username on blur without input', async () => {
    mockLoading = false;
    setup();

    const username = screen.getByPlaceholderText(/Enter your username/i);
    fireEvent.blur(username);

    await waitFor(() => {
      expect(screen.getByText(/Username is required/i)).toBeInTheDocument();
    });
  });

  it('submits when pressing Enter in password field', async () => {
    mockLoading = false;
    setup();

    fireEvent.change(screen.getByPlaceholderText(/Enter your username/i), {
      target: { value: 'john' },
    });

    const password = screen.getByPlaceholderText(/Enter your password/i);
    fireEvent.change(password, { target: { value: 'securePass123' } });

    // Press Enter inside the form to submit
    const form = document.querySelector('form');
    if (!form) throw new Error('Form not found');
    fireEvent.keyDown(password, { key: 'Enter', code: 'Enter', charCode: 13 });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockHandleLogin).toHaveBeenCalledWith({
        username: 'john',
        password: 'securePass123',
      });
    });
  });

  it('renders the right icon in the login button', () => {
    setup();

    const icon = screen.getByRole('img', { name: /info/i });
    expect(icon).toBeInTheDocument();
  });

  it('sets role when Dropdown emits an array value (uses first entry)', async () => {
    setup();

    // Trigger array onChange -> should pick first entry 'admin'
    fireEvent.click(screen.getByText(/Mock: Select Admin \(Array\)/i));

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-value')).toHaveTextContent('admin');
    });
  });

  it('shows role validation error when an invalid role is chosen', async () => {
    setup();

    // Choose an invalid role not in the allowed list
    fireEvent.click(screen.getByText(/Mock: Select Invalid/i));

    // Submit the form to trigger validation
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /must be one of the following/i
      );
    });
  });

  it('falls back to empty string when role becomes undefined (nullish coalescing)', async () => {
    setup();

    // Force undefined to exercise watch('role') ?? '' branch
    fireEvent.click(screen.getByText(/Mock: Set Undefined/i));

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-value').textContent).toBe('');
    });
  });

  it('clears role validation error after selecting a valid role', async () => {
    setup();

    // Make role invalid, submit, assert error
    fireEvent.click(screen.getByText(/Mock: Select Invalid/i));
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Now select a valid role and submit again; error should clear
    fireEvent.click(screen.getByText(/Mock: Select Doctor/i));
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  describe('captchaSiteKey branch coverage for line 34 (key ? key : null)', () => {
    afterEach(() => {
      mockEnv.ENABLE_SITE_CAPTCHA = 'false';
      mockEnv.RECAPTCHA_SITE_KEY = undefined;
    });

    it('returns the key (truthy branch) when RECAPTCHA_SITE_KEY trims to a non-empty string', () => {
      mockEnv.ENABLE_SITE_CAPTCHA = 'true';
      mockEnv.RECAPTCHA_SITE_KEY = 'valid-key';
      mockHandleLogin.mockClear();

      setup();
      // If captchaSiteKey is truthy, the ReCaptcha widget is rendered
      expect(
        screen.getByRole('button', { name: /Mock: Verify Captcha/i })
      ).toBeInTheDocument();
    });

    it('returns null (falsy branch) when RECAPTCHA_SITE_KEY trims to an empty string', () => {
      mockEnv.ENABLE_SITE_CAPTCHA = 'true';
      mockEnv.RECAPTCHA_SITE_KEY = '   ';
      mockHandleLogin.mockClear();

      setup();
      // If captchaSiteKey is null, the ReCaptcha widget should NOT be rendered
      expect(
        screen.queryByRole('button', { name: /Mock: Verify Captcha/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('when site captcha is enabled', () => {
    beforeEach(() => {
      mockEnv.ENABLE_SITE_CAPTCHA = 'true';
      mockEnv.RECAPTCHA_SITE_KEY = 'test-site-key';
      mockHandleLogin.mockClear();
    });

    afterEach(() => {
      mockEnv.ENABLE_SITE_CAPTCHA = 'false';
      mockEnv.RECAPTCHA_SITE_KEY = undefined;
    });

    it('renders the captcha widget', () => {
      setup();
      expect(
        screen.getByRole('button', { name: /Mock: Verify Captcha/i })
      ).toBeInTheDocument();
    });

    it('blocks submission and shows an error when captcha is not verified', async () => {
      setup();

      fireEvent.change(screen.getByPlaceholderText(/Enter your username/i), {
        target: { value: 'john' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
        target: { value: 'securePass123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/Please verify that you are not a robot/i)
        ).toBeInTheDocument();
      });
      expect(mockHandleLogin).not.toHaveBeenCalled();
    });

    it('submits after captcha is verified', async () => {
      setup();

      fireEvent.change(screen.getByPlaceholderText(/Enter your username/i), {
        target: { value: 'john' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
        target: { value: 'securePass123' },
      });

      fireEvent.click(
        screen.getByRole('button', { name: /Mock: Verify Captcha/i })
      );
      fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

      await waitFor(() => {
        expect(mockHandleLogin).toHaveBeenCalledWith({
          username: 'john',
          password: 'securePass123',
        });
      });
    });
  });
});
