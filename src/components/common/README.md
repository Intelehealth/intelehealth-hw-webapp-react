# Common UI Components

A comprehensive collection of reusable UI components built with React, TypeScript, and TailwindCSS. All components are fully accessible, customizable, and include comprehensive TypeScript support.

## Components

### Input

A versatile input component supporting various types, sizes, and validation states.

```tsx
import { Input } from './components/common';

<Input
  label="Username"
  placeholder="Enter your username"
  type="text"
  size="md"
  variant="outlined"
  error="This field is required"
  helperText="Choose a unique username"
  isRequired
  leftIcon={<SearchIcon />}
  rightIcon={<CheckIcon />}
/>;
```

**Props:**

- `type`: 'text' | 'email' | 'password' | 'number' | etc.
- `size`: 'sm' | 'md' | 'lg'
- `variant`: 'default' | 'filled' | 'outlined'
- `label`: string
- `error`: string
- `helperText`: string
- `isRequired`: boolean
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode

### Button

A flexible button component with multiple variants, sizes, and states.

```tsx
import { Button } from './components/common';

<Button
  variant="primary"
  size="md"
  isLoading={false}
  loadingText="Loading..."
  leftIcon={<PlusIcon />}
  rightIcon={<ArrowIcon />}
  fullWidth={false}
  disabled={false}
>
  Click me
</Button>;
```

**Props:**

- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- `loadingText`: string
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `fullWidth`: boolean

### Checkbox

A checkbox component with label support and validation states.

```tsx
import { Checkbox } from './components/common';

<Checkbox
  label="I agree to the terms"
  size="md"
  checked={false}
  onChange={e => setChecked(e.target.checked)}
  error="This field is required"
  helperText="Please read the terms carefully"
  description="By checking this box, you agree to our terms and conditions"
  isRequired
/>;
```

**Props:**

- `size`: 'sm' | 'md' | 'lg'
- `label`: string
- `error`: string
- `helperText`: string
- `description`: string
- `isRequired`: boolean

### Radio & RadioGroup

Radio button components for single selection, with group support.

```tsx
import { Radio, RadioGroup } from './components/common';

// Individual radio
<Radio
  label="Option 1"
  value="option1"
  checked={selectedValue === 'option1'}
  onChange={(e) => setSelectedValue(e.target.value)}
/>

// Radio group
<RadioGroup
  name="theme"
  value={selectedTheme}
  onChange={setSelectedTheme}
  label="Select Theme"
>
  <Radio value="light" label="Light Theme" />
  <Radio value="dark" label="Dark Theme" />
</RadioGroup>
```

**Radio Props:**

- `size`: 'sm' | 'md' | 'lg'
- `label`: string
- `value`: string
- `error`: string
- `helperText`: string
- `description`: string
- `isRequired`: boolean

**RadioGroup Props:**

- `name`: string
- `value`: string
- `onChange`: (value: string) => void
- `error`: string
- `helperText`: string

### Toggle

A toggle switch component with multiple variants and sizes.

```tsx
import { Toggle } from './components/common';

<Toggle
  label="Enable notifications"
  size="md"
  variant="default"
  checked={isEnabled}
  onChange={e => setIsEnabled(e.target.checked)}
  error="This field is required"
  helperText="Toggle to enable/disable notifications"
  description="You will receive email notifications when enabled"
/>;
```

**Props:**

- `size`: 'sm' | 'md' | 'lg'
- `variant`: 'default' | 'success' | 'warning' | 'error'
- `label`: string
- `error`: string
- `helperText`: string
- `description`: string
- `isRequired`: boolean

### Dropdown

A powerful dropdown component supporting single and multi-select with search functionality.

```tsx
import { Dropdown, type DropdownOption } from './components/common';

const options: DropdownOption[] = [
  { value: 'us', label: 'United States', description: 'North America' },
  { value: 'ca', label: 'Canada', description: 'North America' },
];

<Dropdown
  label="Country"
  placeholder="Select your country"
  options={options}
  value={selectedCountry}
  onChange={setSelectedCountry}
  size="md"
  variant="outlined"
  multiple={false}
  searchable={true}
  clearable={true}
  disabled={false}
  isRequired
/>;
```

**Props:**

- `options`: DropdownOption[]
- `value`: string | string[]
- `onChange`: (value: string | string[]) => void
- `size`: 'sm' | 'md' | 'lg'
- `variant`: 'default' | 'filled' | 'outlined'
- `multiple`: boolean
- `searchable`: boolean
- `clearable`: boolean
- `placeholder`: string
- `label`: string
- `error`: string
- `helperText`: string
- `isRequired`: boolean

**DropdownOption Interface:**

```tsx
interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}
```

### Chip

A versatile chip component that can be used as a button, tag, or filter. Supports toggle functionality, removal, and various visual variants.

```tsx
import { Chip } from './components/common';

// Basic chip
<Chip>Basic Chip</Chip>

// Toggle chip (click to select/deselect)
<Chip
  clickable
  selected={isSelected}
  onClick={() => setIsSelected(!isSelected)}
  variant="primary"
>
  Toggle Chip
</Chip>

// Removable chip
<Chip
  removable
  onRemove={() => handleRemove()}
  variant="secondary"
>
  Removable Chip
</Chip>

// Chip with icons
<Chip
  leftIcon={<PlusIcon />}
  rightIcon={<ArrowIcon />}
  clickable
>
  With Icons
</Chip>
```

**Props:**

- `children`: ReactNode
- `variant`: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `clickable`: boolean
- `removable`: boolean
- `onRemove`: () => void
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `selected`: boolean
- `disabled`: boolean

### ReusableGridTable

A generic, responsive table component that renders as a card list on mobile and a CSS grid on desktop. Supports pagination via a show/hide toggle and optional row click handling.

```tsx
import { ReusableGridTable } from './components/common';

interface Patient {
  name: string;
  age: number;
  status: string;
}

const columns: Column<Patient>[] = [
  { header: 'Name', accessor: 'name' },
  { header: 'Age', accessor: 'age' },
  {
    header: 'Status',
    accessor: 'status',
    render: row => (
      <span className={row.status === 'Active' ? 'text-green-600' : 'text-red-500'}>
        {row.status}
      </span>
    ),
  },
];

// Basic usage
<ReusableGridTable
  columns={columns}
  data={patients}
  initialRowCount={6}
/>

// With row click handler
<ReusableGridTable
  columns={columns}
  data={patients}
  initialRowCount={6}
  onRowClick={row => navigate(`/patient/${row.id}`)}
/>
```

**Column Interface:**

```tsx
interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (row: T) => React.ReactNode;
}
```

**Props:**

- `columns`: Column\<T\>[] — column definitions with header, accessor, and optional custom render
- `data`: T[] — array of data rows (generic, matches your data type)
- `initialRowCount`: number — number of rows shown before "Show all" toggle (default: 6)
- `onRowClick`: (row: T) => void — optional click handler; makes rows appear clickable

### Breadcrumb

A layout-level breadcrumb navigation component driven by React Context. Pages declaratively set their breadcrumb trail using the `useBreadcrumb` hook, and the `Breadcrumb` component (rendered once in `MainContainer`) displays it automatically.

```tsx
// In your page component:
import { useBreadcrumb } from '../../hooks/useBreadcrumb';

const SettingsPage: React.FC = () => {
  useBreadcrumb([
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Settings' },
  ]);

  return <SettingsComponent />;
};

// With custom background color:
const EducationalVideosPage: React.FC = () => {
  useBreadcrumb(
    [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Educational Videos' },
    ],
    { bgColor: 'bg-gray-50' }
  );

  return <EducationalVideos />;
};

// With navigation state on breadcrumb links:
const PrescriptionDetailPage: React.FC = () => {
  useBreadcrumb([
    { label: 'Dashboard', path: '/dashboard' },
    {
      label: 'Visit Details',
      path: '/visit-details/123',
      state: { fromLabel: 'Prescriptions', fromPath: '/prescriptions' },
    },
    { label: 'Prescription Detail' },
  ]);

  return <PrescriptionDetail />;
};
```

**How it works:**

1. `BreadcrumbProvider` wraps the layout in `MainContainer` and holds the breadcrumb state.
2. Pages call `useBreadcrumb(items, options?)` to set their trail on mount. Items are cleared automatically on unmount.
3. The `Breadcrumb` component reads from context and renders the trail. It returns `null` when no items are set (e.g. Dashboard page).

**BreadcrumbItem Interface:**

```tsx
interface BreadcrumbItem {
  label: string;
  path?: string;
  state?: Record<string, unknown>;
}
```

**useBreadcrumb Options:**

- `bgColor`: string — Tailwind background class applied to the breadcrumb nav and content container (default: `'bg-white'`)

**Breadcrumb Props:**

- `className`: string — additional CSS classes merged onto the `<nav>` element

**Files:**

- `src/context/BreadcrumbContext.tsx` — provider and context hook
- `src/hooks/useBreadcrumb.ts` — page-level hook
- `src/components/common/breadcrumb.component.tsx` — rendered component

### FilterModule

A reusable date/range filter component that appears as a popover anchored to a filter icon. Supports single-date and date-range modes with a toggle, and integrates with the existing `Calendar` component.

```tsx
import { FilterModule } from './components/common';
import { isDateInFilterRange } from '../../utils/date-filter';
import type { FilterValue } from '../../utils/date-filter';

// State
const [showFilter, setShowFilter] = useState(false);
const [dateFilter, setDateFilter] = useState<FilterValue | null>(null);
const filterRef = useRef<HTMLDivElement>(null);

// Popover trigger (attach to a filter icon)
<div ref={filterRef} className="relative">
  <img src={iconFilter} onClick={() => setShowFilter(prev => !prev)} />
  {showFilter && (
    <div className="absolute right-0 top-full mt-2 z-50">
      <FilterModule
        onApply={value => {
          setDateFilter(value);
          setShowFilter(false);
        }}
      />
    </div>
  )}
</div>;

// Apply filter in useMemo
const filtered = useMemo(() => {
  return data.filter(
    row =>
      row.patientName.toLowerCase().includes(search.toLowerCase()) &&
      isDateInFilterRange(row.visitCreatedDate, dateFilter)
  );
}, [data, search, dateFilter]);
```

**Props:**

- `onApply`: (value: FilterValue) => void — callback fired when Apply is clicked (required)
- `defaultMode`: 'date' | 'range' — initial filter mode (default: `'range'`)
- `defaultFrom`: string — initial from date in `yyyy-MM-dd` format
- `defaultTo`: string — initial to date in `yyyy-MM-dd` format
- `showToggle`: boolean — show/hide the Date/Range toggle buttons (default: `true`)
- `className`: string — additional CSS classes for the container

**FilterValue Interface:**

```ts
interface FilterValue {
  mode: 'date' | 'range';
  from: string; // yyyy-MM-dd
  to: string | null; // null in date mode
}
```

**Helper — `isDateInFilterRange(dateStr, filter)`:**

Parses both ISO (`2025-04-21`) and human-readable (`10 Oct 2025, at 10:00 am`) date formats. Returns `true` when filter is `null` or the date string is unparseable.

**Files:**

- Component: `src/components/common/filter-module.component.tsx`
- Date utility: `src/utils/date-filter.ts`
- Tests: `src/test/common/FilterModule.test.tsx`, `src/test/utils/date-filter.test.ts`

**Integrated in:**

- Open Visits (`src/modules/dashboard/open-visits.component.tsx`) — filters on `visitCreatedDate`
- Appointment List (`src/modules/dashboard/appointment-list.component.tsx`) — filters on `dateTime`
- Follow-up Visits (`src/modules/dashboard/followup-visits.component.tsx`) — filters on `visitCreatedDate`
- Prescriptions (`src/modules/dashboard/prescriptions-received.component.tsx`) — filters on `visitCreatedDate`

### VideoCard

A responsive video card component that displays a video thumbnail with a play button overlay and duration badge. Renders as a horizontal row on mobile and a vertical card on desktop.

```tsx
import VideoCard from './components/common/video-card.component';

<VideoCard
  title="Treat mild fever at home"
  duration="2:30"
  thumbnail="https://img.youtube.com/vi/TqNiRWOBNTs/hqdefault.jpg"
  videoUrl="https://www.youtube.com/watch?v=TqNiRWOBNTs"
/>;
```

**Props:**

- `title`: string — video title displayed below the thumbnail
- `duration`: string — duration badge shown on the thumbnail (e.g. '2:30')
- `thumbnail`: string — thumbnail image URL
- `videoUrl`: string — URL the card links to (opens in new tab)

## Styling

All components use TailwindCSS for styling and support:

- **Custom color palette** with primary, secondary, success, warning, and error variants
- **Consistent spacing** and sizing system
- **Responsive design** with mobile-first approach
- **Dark mode support** (when configured)
- **Custom animations** and transitions

## Accessibility

All components are built with accessibility in mind:

- **ARIA attributes** for screen readers
- **Keyboard navigation** support
- **Focus management** and visual indicators
- **Color contrast** compliance
- **Semantic HTML** structure

## Usage

```tsx
import {
  Input,
  Button,
  Checkbox,
  Radio,
  RadioGroup,
  Toggle,
  Dropdown,
  Chip,
  type DropdownOption,
} from './components/common';

// Use components in your forms
function MyForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    country: '',
    newsletter: false,
  });

  return (
    <form>
      <Input
        label="Username"
        value={formData.username}
        onChange={e =>
          setFormData(prev => ({ ...prev, username: e.target.value }))
        }
        isRequired
      />

      <Button type="submit" variant="primary">
        Submit
      </Button>
    </form>
  );
}
```

## Testing

All components include comprehensive unit tests using Vitest and React Testing Library. Run tests with:

```bash
yarn test:run src/test/common
```

## TypeScript Support

Full TypeScript support with:

- **Type definitions** for all props
- **Generic types** for flexible usage
- **IntelliSense** support in IDEs
- **Compile-time error checking**

## Examples

See `ExampleUsage.tsx` for comprehensive examples of all components with various configurations and use cases.
