export type FilterMode = 'date' | 'range';

export interface FilterValue {
  mode: FilterMode;
  from: string;
  to: string | null;
}

function parseDateForComparison(dateStr: string): Date | null {
  if (!dateStr) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
  }

  const match = dateStr.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const parsed = new Date(`${match[1]} ${match[2]} ${match[3]}`);
    if (!isNaN(parsed.getTime())) {
      return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      );
    }
  }

  return null;
}

export function isDateInFilterRange(
  dateStr: string,
  filter: FilterValue | null
): boolean {
  if (!filter) return true;

  const date = parseDateForComparison(dateStr);
  if (!date) return true;

  const fromDate = new Date(filter.from);
  const from = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate()
  );

  if (filter.mode === 'date') {
    return date.getTime() === from.getTime();
  }

  if (filter.to) {
    const toDate = new Date(filter.to);
    const to = new Date(
      toDate.getFullYear(),
      toDate.getMonth(),
      toDate.getDate()
    );
    return date.getTime() >= from.getTime() && date.getTime() <= to.getTime();
  }

  return date.getTime() >= from.getTime();
}
