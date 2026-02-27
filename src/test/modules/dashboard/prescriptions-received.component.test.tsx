import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrescriptionsReceived } from '../../../modules/dashboard/prescriptions-received.component';

const renderComponent = () => render(<PrescriptionsReceived />);

describe('PrescriptionsReceived', () => {
  describe('Initial render', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders header title', () => {
      renderComponent();
      expect(screen.getByText('Prescription Received')).toBeInTheDocument();
    });

    it('renders filter icon', () => {
      renderComponent();
      expect(screen.getByAltText('filter')).toBeInTheDocument();
    });

    it('renders search input with placeholder', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      renderComponent();
      expect(screen.getByAltText('search')).toBeInTheDocument();
    });

    it('renders Received and Pendings tab buttons', () => {
      renderComponent();
      expect(screen.getByText('Received')).toBeInTheDocument();
      expect(screen.getByText('Pendings')).toBeInTheDocument();
    });

    it('renders patient data in the table', () => {
      renderComponent();
      expect(screen.getAllByText('Sarrah Paul (F)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nikita Agrawal (F)').length).toBeGreaterThan(0);
    });

    it('renders all six patients', () => {
      renderComponent();
      expect(screen.getAllByText('Sarrah Paul (F)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nikita Agrawal (F)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Suresh Deshmukh (M)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nirmala Sharma (F)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Kashinath Patil (M)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Kamli Sharma (F)').length).toBeGreaterThan(0);
    });

    it('renders column headers', () => {
      renderComponent();
      expect(screen.getAllByText('Patient').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Visit created').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Clinic').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Chief complaint').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Prescription').length).toBeGreaterThan(0);
    });

    it('renders Show all footer link', () => {
      renderComponent();
      expect(screen.getByText('Show all →')).toBeInTheDocument();
    });
  });

  describe('Tab switching', () => {
    it('clicking Received tab sets it as active', () => {
      renderComponent();
      const receivedTab = screen.getByText('Received').closest('button')!;
      fireEvent.click(receivedTab);
      expect(receivedTab).toHaveClass('border-indigo-600');
      expect(receivedTab).toHaveClass('text-indigo-600');
    });

    it('clicking Pendings tab sets it as active', () => {
      renderComponent();
      const pendingsTab = screen.getByText('Pendings').closest('button')!;
      fireEvent.click(pendingsTab);
      expect(pendingsTab).toHaveClass('border-indigo-600');
      expect(pendingsTab).toHaveClass('text-indigo-600');
    });

    it('inactive tab has transparent border', () => {
      renderComponent();
      // Initially activeTab is 'received' (lowercase) so neither matches exactly
      const receivedTab = screen.getByText('Received').closest('button')!;
      const pendingsTab = screen.getByText('Pendings').closest('button')!;
      // Click Pendings to make it active
      fireEvent.click(pendingsTab);
      expect(receivedTab).toHaveClass('border-transparent');
    });

    it('switching tabs toggles active styling', () => {
      renderComponent();
      const receivedTab = screen.getByText('Received').closest('button')!;
      const pendingsTab = screen.getByText('Pendings').closest('button')!;

      // Click Received
      fireEvent.click(receivedTab);
      expect(receivedTab).toHaveClass('border-indigo-600');
      expect(pendingsTab).toHaveClass('border-transparent');

      // Click Pendings
      fireEvent.click(pendingsTab);
      expect(pendingsTab).toHaveClass('border-indigo-600');
      expect(receivedTab).toHaveClass('border-transparent');
    });
  });

  describe('Patient data display', () => {
    it('renders patient ages', () => {
      renderComponent();
      expect(screen.getAllByText('41y 3m').length).toBeGreaterThan(0);
      expect(screen.getAllByText('61y 4m').length).toBeGreaterThan(0);
    });

    it('renders visit dates', () => {
      renderComponent();
      expect(screen.getAllByText('21 Apr, 2025').length).toBeGreaterThan(0);
      expect(screen.getAllByText('20 Apr, 2025').length).toBeGreaterThan(0);
    });

    it('renders clinic names', () => {
      renderComponent();
      expect(screen.getAllByText('TM Clinic 2').length).toBeGreaterThan(0);
    });

    it('renders complaints', () => {
      renderComponent();
      expect(screen.getAllByText('Fever, Headache & Cough').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Headache & Cough').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Chest Pain').length).toBeGreaterThan(0);
    });

    it('renders prescription time values', () => {
      renderComponent();
      expect(screen.getAllByText('1 hr ago').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2 hr ago').length).toBeGreaterThan(0);
      expect(screen.getAllByText('4 hr ago').length).toBeGreaterThan(0);
    });
  });
});
