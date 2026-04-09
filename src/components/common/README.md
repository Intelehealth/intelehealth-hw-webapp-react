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
