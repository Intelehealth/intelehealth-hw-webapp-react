import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReusableGridTable } from '../../../components/common/reusable-grid-table.component';

interface TestRow {
  name: string;
  status: string;
}

const columns = [
  { header: 'Patient Name', accessor: 'name' as keyof TestRow },
  { header: 'Status', accessor: 'status' as keyof TestRow },
];

const data: TestRow[] = [
  { name: 'Alice', status: 'Active' },
  { name: 'Bob', status: 'Inactive' },
];

describe('ReusableGridTable', () => {
  describe('Column headers', () => {
    it('renders all column headers', () => {
      render(<ReusableGridTable columns={columns} data={data} />);
      expect(screen.getAllByText('Patient Name').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
    });
  });

  describe('Data rows using accessor (no render fn)', () => {
    it('renders all row values via accessor', () => {
      render(<ReusableGridTable columns={columns} data={data} />);
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0);
    });

    it('renders header labels in each mobile row', () => {
      render(<ReusableGridTable columns={columns} data={data} />);
      // Mobile view renders col.header per cell - should appear multiple times
      const nameHeaders = screen.getAllByText('Patient Name');
      expect(nameHeaders.length).toBeGreaterThanOrEqual(data.length + 1); // desktop header + mobile rows
    });
  });

  describe('Data rows using render function', () => {
    it('uses render function when provided', () => {
      const columnsWithRender = [
        {
          header: 'Patient Name',
          accessor: 'name' as keyof TestRow,
          render: (row: TestRow) => (
            <span data-testid="custom-cell">{row.name.toUpperCase()}</span>
          ),
        },
        { header: 'Status', accessor: 'status' as keyof TestRow },
      ];

      render(<ReusableGridTable columns={columnsWithRender} data={data} />);
      const customCells = screen.getAllByTestId('custom-cell');
      // Each row has mobile + desktop view = 2 custom cells per row
      expect(customCells.length).toBe(data.length * 2);
      expect(screen.getAllByText('ALICE').length).toBeGreaterThan(0);
      expect(screen.getAllByText('BOB').length).toBeGreaterThan(0);
    });

    it('falls back to accessor when render is not provided', () => {
      render(<ReusableGridTable columns={columns} data={data} />);
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    });
  });

  describe('Footer', () => {
    it('renders Show all footer link', () => {
      render(<ReusableGridTable columns={columns} data={data} />);
      expect(screen.getByText('Show all →')).toBeInTheDocument();
    });
  });

  describe('Empty data', () => {
    it('renders no data rows when data is empty', () => {
      render(<ReusableGridTable columns={columns} data={[]} />);
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('still renders headers and footer with empty data', () => {
      render(<ReusableGridTable columns={columns} data={[]} />);
      expect(screen.getByText('Patient Name')).toBeInTheDocument();
      expect(screen.getByText('Show all →')).toBeInTheDocument();
    });
  });

  describe('Multiple rows', () => {
    it('renders the correct number of row containers', () => {
      const { container } = render(
        <ReusableGridTable columns={columns} data={data} />
      );
      const rows = container.querySelectorAll(
        '.rounded-xl.border.border-\\[\\#ECEEFF\\]'
      );
      expect(rows.length).toBe(data.length);
    });
  });
});
