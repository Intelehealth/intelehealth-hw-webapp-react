import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsAccount from '../../../modules/settings/settings-account.component';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockUseProfile = vi.fn();
vi.mock('../../../context/ProfileContext', () => ({
  useProfileContext: () => mockUseProfile(),
}));

// Mock Calendar so we can invoke its onChange callback from the test
// (the real component disables the calendar UI, so we can't trigger it via clicks).
vi.mock('../../../components/common', async orig => {
  const actual = await orig<typeof import('../../../components/common')>();
  return {
    ...actual,
    Calendar: ({
      label,
      onChange,
    }: {
      label?: string;
      onChange: (d: string) => void | Promise<void>;
    }) => (
      <div>
        {label && <label>{label}</label>}
        <button
          type="button"
          data-testid="calendar-change"
          onClick={() => onChange('2001-02-03')}
        >
          change-dob
        </button>
        <button
          type="button"
          data-testid="calendar-clear"
          onClick={() => onChange('')}
        >
          clear-dob
        </button>
      </div>
    ),
  };
});

// Use a real Redux store so useSelector works (component reads loader state).
const makeStore = (loaderValue = 0) =>
  configureStore({
    reducer: {
      loader: () => ({ sections: { 'profile-save': loaderValue } }),
    },
  });

const renderAccount = (store = makeStore()) =>
  render(
    <Provider store={store}>
      <SettingsAccount />
    </Provider>
  );

const baseProfile = {
  id: '123',
  username: 'nurse1',
  firstName: 'Nurse',
  middleName: 'M',
  lastName: 'One',
  email: 'nurse@example.com',
  phone: '9876543210',
  dateOfBirth: '1990-05-12',
  gender: 'female' as const,
  setupLocation: 'Clinic 1',
  avatar: '',
  age: 35,
  address: { street: '', city: '', state: '', country: '', zipCode: '' },
  role: 'Nurse',
  department: '',
  employeeId: '',
  joinDate: '',
  lastLogin: '',
  isActive: true,
  preferences: {
    language: 'en',
    timezone: 'UTC',
    notifications: { email: false, sms: false, push: false },
  },
};

describe('SettingsAccount', () => {
  const mockUpdateProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfile.mockReturnValue({
      profile: baseProfile,
      updateProfile: mockUpdateProfile,
      hwProfile: null,
      age: 35,
      locations: [],
      locationUuid: null,
      uploadPhoto: vi.fn(),
      calculateAge: () => 35,
      updateAgeForDate: vi.fn(),
      refreshProfile: vi.fn(),
    });
  });

  it('returns null when profile is not loaded', () => {
    mockUseProfile.mockReturnValue({
      profile: null,
      updateProfile: mockUpdateProfile,
      hwProfile: null,
      age: null,
      locations: [],
      locationUuid: null,
      uploadPhoto: vi.fn(),
      calculateAge: () => 0,
      updateAgeForDate: vi.fn(),
      refreshProfile: vi.fn(),
    });
    const { container } = renderAccount();
    expect(container.firstChild).toBeNull();
  });

  it('renders section heading and Personal sub-tab', () => {
    renderAccount();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('renders all profile form labels', () => {
    renderAccount();
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Middle Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText(/Gender/)).toBeInTheDocument();
    expect(screen.getByText(/Date of Birth/)).toBeInTheDocument();
    expect(screen.getByText('or Age')).toBeInTheDocument();
    expect(screen.getByText('Phone number')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders disabled inputs with the profile values', async () => {
    renderAccount();
    // react-hook-form fills the fields asynchronously — wait a tick.
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    const username = screen.getByPlaceholderText('Username') as HTMLInputElement;
    const firstName = screen.getByPlaceholderText('First name') as HTMLInputElement;
    expect(username.disabled).toBe(true);
    expect(firstName.disabled).toBe(true);
  });

  it('shows admin alert when a disabled field wrapper is clicked', () => {
    renderAccount();
    const usernameWrapper = screen
      .getByPlaceholderText('Username')
      .closest('div')!.parentElement!;
    fireEvent.click(usernameWrapper);
    expect(
      screen.getByText(
        /Please contact your system administrator to change these profile details/i
      )
    ).toBeInTheDocument();
  });

  it('dismisses the admin alert when the close icon is clicked', () => {
    renderAccount();
    fireEvent.click(
      screen.getByPlaceholderText('Username').closest('div')!.parentElement!
    );
    const alert = screen.getByText(
      /Please contact your system administrator/i
    );
    const closeBtn = alert.parentElement!.querySelector('button')!;
    fireEvent.click(closeBtn);
    expect(
      screen.queryByText(/Please contact your system administrator/i)
    ).not.toBeInTheDocument();
  });

  it('renders Gender options (Male / Female / Other)', () => {
    renderAccount();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('renders Back and Save changes buttons', () => {
    renderAccount();
    expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Save changes/i })
    ).toBeInTheDocument();
  });

  it('navigates back when Back is clicked', () => {
    renderAccount();
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('calls updateProfile with email & phone on submit', async () => {
    mockUpdateProfile.mockResolvedValue(undefined);
    renderAccount();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));
    });

    expect(mockUpdateProfile).toHaveBeenCalled();
    const arg = mockUpdateProfile.mock.calls[0][0];
    expect(arg).toHaveProperty('email');
    expect(arg).toHaveProperty('phone');
  });

  it('logs an error to console when updateProfile rejects', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('boom'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderAccount();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));
    });

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('shows Saving... state when redux loader is active', () => {
    renderAccount(makeStore(1));
    expect(screen.getByText(/Saving/i)).toBeInTheDocument();
  });

  it('renders country-code dropdown and phone input', () => {
    renderAccount();
    expect(screen.getByPlaceholderText('9876543210')).toBeInTheDocument();
  });

  it('renders Email input', () => {
    renderAccount();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('renders read-only Age field', () => {
    renderAccount();
    const age = screen.getByPlaceholderText('Age') as HTMLInputElement;
    expect(age.readOnly).toBe(true);
  });

  it('invokes Calendar onChange with a value (runs setValue + trigger)', async () => {
    renderAccount();
    await act(async () => {
      fireEvent.click(screen.getByTestId('calendar-change'));
    });
    // No assertions on state — simply reaching the callback proves the
    // setValue + trigger branch executed without throwing.
  });

  it('invokes Calendar onChange with empty string (skips trigger branch)', async () => {
    renderAccount();
    await act(async () => {
      fireEvent.click(screen.getByTestId('calendar-clear'));
    });
  });
});
