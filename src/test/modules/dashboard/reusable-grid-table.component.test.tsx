import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReusableGridTable } from '../../../components/common/reusable-grid-table.component';

interface TestRow {
  name: string;
  status: string;
}

const INITIAL_LIMIT = 6;

const columns = [
  { header: 'Patient Name', accessor: 'name' as keyof TestRow },
  { header: 'Status', accessor: 'status' as keyof TestRow },
];

const data: TestRow[] = [
  { name: 'Alice', status: 'Active' },
  { name: 'Bob', status: 'Inactive' },
];

/** Generate N rows for pagination tests */
const generateRows = (count: number): TestRow[] =>
  Array.from({ length: count }, (_, i) => ({
    name: `Patient ${i + 1}`,
    status: i % 2 === 0 ? 'Active' : 'Inactive',
  }));

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
      const nameHeaders = screen.getAllByText('Patient Name');
      expect(nameHeaders.length).toBeGreaterThanOrEqual(data.length + 1);
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
      expect(customCells.length).toBe(data.length * 2);
      expect(screen.getAllByText('ALICE').length).toBeGreaterThan(0);
      expect(screen.getAllByText('BOB').length).toBeGreaterThan(0);
    });

    it('falls back to accessor when render is not provided', () => {
      render(<ReusableGridTable columns={columns} data={data} />);
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    });
  });

  describe('Footer / Show all toggle', () => {
    it('does not render footer when data has 6 or fewer rows', () => {
      render(<ReusableGridTable columns={columns} data={data} />);
      expect(screen.queryByText('Show all →')).not.toBeInTheDocument();
      expect(screen.queryByText('← Show less')).not.toBeInTheDocument();
    });

    it('renders "Show all →" when data has more than 6 rows', () => {
      const bigData = generateRows(10);
      render(<ReusableGridTable columns={columns} data={bigData} />);
      expect(screen.getByText('Show all →')).toBeInTheDocument();
    });

    it('toggles to "← Show less" after clicking "Show all →"', () => {
      const bigData = generateRows(10);
      render(<ReusableGridTable columns={columns} data={bigData} />);

      fireEvent.click(screen.getByText('Show all →'));

      expect(screen.getByText('← Show less')).toBeInTheDocument();
      expect(screen.queryByText('Show all →')).not.toBeInTheDocument();
    });

    it('toggles back to "Show all →" after clicking "← Show less"', () => {
      const bigData = generateRows(10);
      render(<ReusableGridTable columns={columns} data={bigData} />);

      fireEvent.click(screen.getByText('Show all →'));
      fireEvent.click(screen.getByText('← Show less'));

      expect(screen.getByText('Show all →')).toBeInTheDocument();
      expect(screen.queryByText('← Show less')).not.toBeInTheDocument();
    });
  });

  describe('Initial row limit (6 rows)', () => {
    it('shows only 6 rows initially when data exceeds 6', () => {
      const bigData = generateRows(10);
      const { container } = render(
        <ReusableGridTable columns={columns} data={bigData} />
      );
      const rows = container.querySelectorAll(
        '.rounded-xl.border.border-\\[\\#ECEEFF\\]'
      );
      expect(rows.length).toBe(INITIAL_LIMIT);
    });

    it('shows all rows after clicking "Show all →"', () => {
      const bigData = generateRows(10);
      const { container } = render(
        <ReusableGridTable columns={columns} data={bigData} />
      );

      fireEvent.click(screen.getByText('Show all →'));

      const rows = container.querySelectorAll(
        '.rounded-xl.border.border-\\[\\#ECEEFF\\]'
      );
      expect(rows.length).toBe(10);
    });

    it('collapses back to 6 rows after clicking "← Show less"', () => {
      const bigData = generateRows(10);
      const { container } = render(
        <ReusableGridTable columns={columns} data={bigData} />
      );

      fireEvent.click(screen.getByText('Show all →'));
      fireEvent.click(screen.getByText('← Show less'));

      const rows = container.querySelectorAll(
        '.rounded-xl.border.border-\\[\\#ECEEFF\\]'
      );
      expect(rows.length).toBe(INITIAL_LIMIT);
    });

    it('shows all rows when data has exactly 6 rows (no toggle needed)', () => {
      const exactData = generateRows(INITIAL_LIMIT);
      const { container } = render(
        <ReusableGridTable columns={columns} data={exactData} />
      );
      const rows = container.querySelectorAll(
        '.rounded-xl.border.border-\\[\\#ECEEFF\\]'
      );
      expect(rows.length).toBe(INITIAL_LIMIT);
    });
  });

  describe('Scrollable rows container', () => {
    it('rows container has overflow-y-auto for scrolling', () => {
      const bigData = generateRows(10);
      const { container } = render(
        <ReusableGridTable columns={columns} data={bigData} />
      );

      const rowsContainer = container.querySelector('.overflow-y-auto');
      expect(rowsContainer).toBeInTheDocument();
    });

    it('rows container is always scrollable regardless of showAll state', () => {
      const bigData = generateRows(10);
      const { container } = render(
        <ReusableGridTable columns={columns} data={bigData} />
      );

      fireEvent.click(screen.getByText('Show all →'));

      const rowsContainer = container.querySelector('.overflow-y-auto');
      expect(rowsContainer).toBeInTheDocument();
    });
  });

  describe('Fixed header (non-sticky, shrink-0)', () => {
    it('renders header with shrink-0 class so it stays fixed', () => {
      const { container } = render(
        <ReusableGridTable columns={columns} data={data} />
      );
      const fixedHeader = container.querySelector('.shrink-0');
      expect(fixedHeader).toBeInTheDocument();
    });
  });

  describe('Flex layout', () => {
    it('root container uses flex-col layout', () => {
      const { container } = render(
        <ReusableGridTable columns={columns} data={data} />
      );
      const root = container.firstElementChild;
      expect(root?.classList.contains('flex')).toBe(true);
      expect(root?.classList.contains('flex-col')).toBe(true);
    });
  });

  describe('Empty data', () => {
    it('renders no data rows when data is empty', () => {
      render(<ReusableGridTable columns={columns} data={[]} />);
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('still renders headers with empty data but no footer', () => {
      render(<ReusableGridTable columns={columns} data={[]} />);
      expect(screen.getByText('Patient Name')).toBeInTheDocument();
      expect(screen.queryByText('Show all →')).not.toBeInTheDocument();
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

  describe('Custom initialRowCount prop', () => {
    it('limits visible rows to the provided initialRowCount', () => {
      const bigData = generateRows(10);
      const { container } = render(
        <ReusableGridTable columns={columns} data={bigData} initialRowCount={3} />
      );
      const rows = container.querySelectorAll(
        '.rounded-xl.border.border-\\[\\#ECEEFF\\]'
      );
      expect(rows.length).toBe(3);
    });

    it('shows "Show all →" when data exceeds custom initialRowCount', () => {
      const bigData = generateRows(5);
      render(
        <ReusableGridTable columns={columns} data={bigData} initialRowCount={3} />
      );
      expect(screen.getByText('Show all →')).toBeInTheDocument();
    });

    it('does not show footer when data fits within custom initialRowCount', () => {
      const smallData = generateRows(3);
      render(
        <ReusableGridTable columns={columns} data={smallData} initialRowCount={5} />
      );
      expect(screen.queryByText('Show all →')).not.toBeInTheDocument();
    });

    it('shows all rows after clicking "Show all →" with custom initialRowCount', () => {
      const bigData = generateRows(8);
      const { container } = render(
        <ReusableGridTable columns={columns} data={bigData} initialRowCount={4} />
      );

      fireEvent.click(screen.getByText('Show all →'));

      const rows = container.querySelectorAll(
        '.rounded-xl.border.border-\\[\\#ECEEFF\\]'
      );
      expect(rows.length).toBe(8);
    });

    it('collapses back to custom initialRowCount after clicking "← Show less"', () => {
      const bigData = generateRows(8);
      const { container } = render(
        <ReusableGridTable columns={columns} data={bigData} initialRowCount={4} />
      );

      fireEvent.click(screen.getByText('Show all →'));
      fireEvent.click(screen.getByText('← Show less'));

      const rows = container.querySelectorAll(
        '.rounded-xl.border.border-\\[\\#ECEEFF\\]'
      );
      expect(rows.length).toBe(4);
    });

    it('uses default of 6 when initialRowCount is not provided', () => {
      const bigData = generateRows(10);
      const { container } = render(
        <ReusableGridTable columns={columns} data={bigData} />
      );
      const rows = container.querySelectorAll(
        '.rounded-xl.border.border-\\[\\#ECEEFF\\]'
      );
      expect(rows.length).toBe(INITIAL_LIMIT);
    });
  });
});
