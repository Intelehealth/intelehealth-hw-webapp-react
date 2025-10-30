import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProfileForm from '../../../modules/profile/profile-form.component';

// Mock the profile hooks
vi.mock('../../../modules/profile/profile.hooks', () => ({
  useProfile: () => ({
    profile: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      setupLocation: 'sf-clinic',
      username: 'johndoe',
      middleName: 'M',
    },
    loading: false,
    updateProfile: vi.fn(),
    uploadPhoto: vi.fn(),
    takePhoto: vi.fn(),
  }),
}));

// Mock the common components
vi.mock('../../../components/common', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  PhotoUploadModal: ({ isOpen }: any) => 
    isOpen ? <div data-testid="photo-modal">Photo Modal</div> : null,
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Toggle: ({ checked, onChange, ...props }: any) => (
    <input type="checkbox" checked={checked} onChange={onChange} {...props} />
  ),
  Input: ({ label, ...props }: any) => (
    <div>
      {label && <label>{label}</label>}
      <input {...props} />
    </div>
  ),
  Dropdown: ({ label, options, ...props }: any) => (
    <div>
      {label && <label>{label}</label>}
      <select {...props}>
        {options?.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
  Radio: ({ label, value, ...props }: any) => (
    <div>
      <input type="radio" value={value} {...props} />
      <label>{label}</label>
    </div>
  ),
  Calendar: ({ label, onChange, value, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
    </div>
  ),
}));

describe('ProfileForm', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<ProfileForm />);
    }).not.toThrow();
  });

  it('should render profile form fields', () => {
    render(<ProfileForm />);
    
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone Number')).toBeInTheDocument();
  });

  it('should render save button', () => {
    render(<ProfileForm />);
    
    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeInTheDocument();
  });

  it('should render password section', () => {
    render(<ProfileForm />);
    
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });
});
