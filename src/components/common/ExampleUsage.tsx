import React, { useState } from 'react';
import {
  Button,
  Checkbox,
  Chip,
  Dropdown,
  Input,
  Radio,
  RadioGroup,
  Toggle,
  type DropdownOption,
} from './index';

const ExampleUsage: React.FC = () => {
  // State for form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    age: '',
    country: '',
    countries: [] as string[],
    newsletter: false,
    notifications: false,
    theme: 'light',
    terms: false,
    preferences: [] as string[],
  });

  // State for chip management
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([
    'React',
    'TypeScript',
    'TailwindCSS',
  ]);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  // State for toggle management
  const [toggleStates, setToggleStates] = useState({
    darkMode: false,
    defaultVariant: false,
    secondaryVariant: false,
    smallToggle: false,
    mediumToggle: false,
    largeToggle: false,
  });

  // Dropdown options
  const countryOptions: DropdownOption[] = [
    { value: 'us', label: 'United States', description: 'North America' },
    { value: 'ca', label: 'Canada', description: 'North America' },
    { value: 'uk', label: 'United Kingdom', description: 'Europe' },
    { value: 'de', label: 'Germany', description: 'Europe' },
    { value: 'fr', label: 'France', description: 'Europe' },
    { value: 'jp', label: 'Japan', description: 'Asia' },
    { value: 'au', label: 'Australia', description: 'Oceania' },
  ];

  const preferenceOptions: DropdownOption[] = [
    { value: 'email', label: 'Email Notifications' },
    { value: 'sms', label: 'SMS Notifications' },
    { value: 'push', label: 'Push Notifications' },
    { value: 'marketing', label: 'Marketing Emails' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: string, value: string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBooleanChange = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChipToggle = (chipValue: string) => {
    setSelectedChips(prev =>
      prev.includes(chipValue)
        ? prev.filter(c => c !== chipValue)
        : [...prev, chipValue]
    );
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleToggleChange = (toggleKey: keyof typeof toggleStates) => {
    setToggleStates(prev => ({
      ...prev,
      [toggleKey]: !prev[toggleKey],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Common UI Components Examples
        </h1>
        <p className="text-gray-600">
          Comprehensive examples of all available UI components with various
          configurations
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Input Components Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
            Input Components
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Input */}
            <Input
              label="Username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={e => handleInputChange('username', e.target.value)}
              helperText="Choose a unique username"
              isRequired
            />

            {/* Email Input */}
            <Input
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              error={
                formData.email && !formData.email.includes('@')
                  ? 'Please enter a valid email'
                  : undefined
              }
              isRequired
            />

            {/* Password Input */}
            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              helperText="Must be at least 8 characters"
              isRequired
            />

            {/* Number Input */}
            <Input
              type="number"
              label="Age"
              placeholder="Enter your age"
              value={formData.age}
              onChange={e => handleInputChange('age', e.target.value)}
              min="0"
              max="120"
            />
          </div>

          {/* Input Variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">
              Input Variants & Sizes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                size="sm"
                variant="outlined"
                placeholder="Small outlined"
                label="Small"
              />
              <Input
                size="md"
                variant="filled"
                placeholder="Medium filled"
                label="Medium"
              />
              <Input
                size="lg"
                variant="default"
                placeholder="Large default"
                label="Large"
              />
            </div>
          </div>

          {/* Input with Icons */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">
              Input with Icons
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Search"
                placeholder="Search..."
                leftIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
              <Input
                label="Website"
                placeholder="https://example.com"
                rightIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                }
              />
            </div>
          </div>
        </section>

        {/* Button Components Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
            Button Components
          </h2>

          {/* Button Variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">
              Button Variants
            </h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="primarylight">Primary Light</Button>
              <Button variant="secondary">Secondary</Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Button Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          {/* Button States */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Button States</h3>
            <div className="flex flex-wrap gap-4">
              <Button>Normal</Button>
              <Button disabled>Disabled</Button>
              <Button isLoading>Loading</Button>
              <Button isLoading loadingText="Saving...">
                Custom Loading
              </Button>
            </div>
          </div>

          {/* Button with Icons */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">
              Buttons with Icons
            </h3>
            <div className="flex flex-wrap gap-4">
              <Button
                leftIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                }
              >
                Add Item
              </Button>
              <Button
                rightIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                }
              >
                Next
              </Button>
            </div>
          </div>

          {/* Full Width Button */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">
              Full Width Button
            </h3>
            <Button fullWidth variant="primary">
              Submit Form
            </Button>
          </div>
        </section>

        {/* Checkbox Components Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
            Checkbox Components
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Checkbox */}
            <Checkbox
              label="I agree to the terms and conditions (Primary Variant)"
              checked={formData.terms}
              onChange={e => handleBooleanChange('terms', e.target.checked)}
              isRequired
              variant="primary"
            />

            {/* Checkbox with Description */}
            <Checkbox
              label="Subscribe to newsletter (Secondary Variant)"
              description="Get weekly updates about new features and products"
              checked={formData.newsletter}
              onChange={e =>
                handleBooleanChange('newsletter', e.target.checked)
              }
              variant="secondary"
            />

            {/* Checkbox Sizes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Checkbox Sizes
              </h3>
              <Checkbox size="sm" label="Small checkbox" />
              <Checkbox size="md" label="Medium checkbox (Default)" />
              <Checkbox size="lg" label="Large checkbox" />
            </div>

            {/* Checkbox with Error */}
            <Checkbox
              label="Required field"
              error="This field is required"
              isRequired
            />

            {/* Checkbox with Disabled */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Disabled Checkbox
              </h3>
              <Checkbox label="Disabled Checkbox Example" disabled />
            </div>
          </div>
        </section>

        {/* Radio Components Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
            Radio Components
          </h2>

          {/* Radio Group */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Varient
            </label>
            <RadioGroup
              name="theme"
              value={formData.theme}
              onChange={value => handleInputChange('theme', value)}
              helperText="Choose your preferred varient"
            >
              <Radio
                value="light"
                label="Primary"
                description="Clean and bright interface"
                variant="primary"
              />
              <Radio
                value="dark"
                label="Secondary"
                description="Easy on the eyes"
                variant="secondary"
              />
            </RadioGroup>
          </div>

          {/* Individual Radio Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">
              Individual Radio Buttons
            </h3>
            <div className="space-y-2">
              <Radio
                name="size"
                value="small"
                label="Small"
                description="Compact layout"
                size="sm"
              />
              <Radio
                name="size"
                value="medium"
                label="Medium"
                description="Balanced layout"
                size="md"
              />
              <Radio
                name="size"
                value="large"
                label="Large"
                description="Spacious layout"
                size="lg"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">
              Disabled Radio Buttons
            </h3>
            <Radio
              name="disabled"
              value="disabled"
              label="Disabled Radio"
              description="This radio button is disabled"
              disabled
            />
          </div>
        </section>

        {/* Toggle Components Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
            Toggle Components
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Toggle */}
            <Toggle
              label="Enable Notifications"
              checked={formData.notifications}
              onChange={e =>
                handleBooleanChange('notifications', e.target.checked)
              }
            />

            {/* Toggle with Description */}
            <Toggle
              label="Dark Mode"
              description="Switch between light and dark themes"
              checked={toggleStates.darkMode}
              onChange={() => handleToggleChange('darkMode')}
            />

            {/* Toggle Variants */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Toggle Variants
              </h3>
              <Toggle
                label="Primary (Default)"
                checked={toggleStates.defaultVariant}
                onChange={() => handleToggleChange('defaultVariant')}
              />
              <Toggle
                variant="secondary"
                label="Secondary"
                checked={toggleStates.secondaryVariant}
                onChange={() => handleToggleChange('secondaryVariant')}
              />
            </div>

            {/* Toggle Sizes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Toggle Sizes
              </h3>
              <Toggle
                size="sm"
                label="Small Toggle"
                checked={toggleStates.smallToggle}
                onChange={() => handleToggleChange('smallToggle')}
              />
              <Toggle
                size="md"
                label="Medium Toggle"
                checked={toggleStates.mediumToggle}
                onChange={() => handleToggleChange('mediumToggle')}
              />
              <Toggle
                size="lg"
                label="Large Toggle"
                checked={toggleStates.largeToggle}
                onChange={() => handleToggleChange('largeToggle')}
              />
            </div>
          </div>
        </section>

        {/* Dropdown Components Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
            Dropdown Components
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default Variant */}
            <Dropdown
              label="Default Variant"
              options={countryOptions.slice(0, 3)}
              variant="outlined"
            />
            {/* Single Select Dropdown */}
            <Dropdown
              label="Searchable Dropdown"
              placeholder="Select your country"
              options={countryOptions}
              value={formData.country}
              onChange={value => handleInputChange('country', value as string)}
              searchable
              clearable
              isRequired
            />

            {/* Multi Select Dropdown */}
            <Dropdown
              label="Multi-Select Dropdown"
              placeholder="Select your preferences"
              options={preferenceOptions}
              value={formData.preferences}
              onChange={value =>
                handleArrayChange('preferences', value as string[])
              }
              multiple
              searchable
              clearable
            />

            {/* Dropdown Sizes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Dropdown Sizes
              </h3>
              <Dropdown
                size="sm"
                label="Small"
                options={countryOptions.slice(0, 3)}
              />
              <Dropdown
                size="md"
                label="Medium"
                options={countryOptions.slice(0, 3)}
              />
              <Dropdown
                size="lg"
                label="Large"
                options={countryOptions.slice(0, 3)}
              />
            </div>
          </div>
        </section>

        {/* Chip Components Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
            Chip Components
          </h2>

          <div className="space-y-6">
            {/* Toggle Chips - Click to select/deselect */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Toggle Chips (Click to Select/Deselect)
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'JavaScript',
                  'TypeScript',
                  'React',
                  'Vue',
                  'Angular',
                  'Node.js',
                ].map(skill => (
                  <Chip
                    key={skill}
                    clickable
                    selected={selectedSkills.includes(skill)}
                    onClick={() => handleSkillToggle(skill)}
                    variant={
                      selectedSkills.includes(skill) ? 'primary' : 'default'
                    }
                  >
                    {skill}
                  </Chip>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Selected skills:{' '}
                {selectedSkills.length > 0 ? selectedSkills.join(', ') : 'None'}
              </p>
            </div>

            {/* Removable Chips */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Removable Chips
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Chip
                    key={tag}
                    removable
                    onRemove={() => handleTagRemove(tag)}
                    variant="secondary"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Remaining tags: {tags.length}
              </p>
            </div>

            {/* Chip Variants */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Chip Variants
              </h3>
              <div className="flex flex-wrap gap-2">
                <Chip variant="default">Default</Chip>
                <Chip variant="primary">Primary</Chip>
                <Chip variant="secondary">Secondary</Chip>
                <Chip variant="success">Success</Chip>
                <Chip variant="warning">Warning</Chip>
                <Chip variant="error">Error</Chip>
                <Chip variant="outline">Outline</Chip>
              </div>
            </div>

            {/* Chip Sizes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Chip Sizes</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm">Small</Chip>
                <Chip size="md">Medium</Chip>
                <Chip size="lg">Large</Chip>
              </div>
            </div>

            {/* Chips with Icons */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Chips with Icons
              </h3>
              <div className="flex flex-wrap gap-2">
                <Chip
                  leftIcon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  }
                  clickable
                  selected={selectedChips.includes('add')}
                  onClick={() => handleChipToggle('add')}
                >
                  Add Item
                </Chip>
                <Chip
                  rightIcon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  }
                  clickable
                  selected={selectedChips.includes('next')}
                  onClick={() => handleChipToggle('next')}
                >
                  Next Step
                </Chip>
                <Chip
                  leftIcon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  }
                  variant="success"
                  clickable
                  selected={selectedChips.includes('completed')}
                  onClick={() => handleChipToggle('completed')}
                >
                  Completed
                </Chip>
              </div>
            </div>

            {/* Interactive Filter Chips */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Interactive Filter Chips
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'All',
                  'Frontend',
                  'Backend',
                  'Full Stack',
                  'DevOps',
                  'Mobile',
                ].map(filter => (
                  <Chip
                    key={filter}
                    clickable
                    selected={selectedChips.includes(filter)}
                    onClick={() => handleChipToggle(filter)}
                    variant={
                      selectedChips.includes(filter) ? 'primary' : 'outline'
                    }
                    size="sm"
                  >
                    {filter}
                  </Chip>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Active filters:{' '}
                {selectedChips.length > 0 ? selectedChips.join(', ') : 'None'}
              </p>
            </div>

            {/* Status Chips */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Status Chips
              </h3>
              <div className="flex flex-wrap gap-2">
                <Chip variant="success">Active</Chip>
                <Chip variant="warning">Pending</Chip>
                <Chip variant="error">Failed</Chip>
                <Chip variant="secondary">Draft</Chip>
                <Chip variant="outline">Inactive</Chip>
              </div>
            </div>

            {/* Disabled Chips */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Disabled Chips
              </h3>
              <div className="flex flex-wrap gap-2">
                <Chip disabled>Disabled</Chip>
                <Chip clickable disabled>
                  Clickable Disabled
                </Chip>
                <Chip removable disabled>
                  Removable Disabled
                </Chip>
              </div>
            </div>
          </div>
        </section>

        {/* Form Actions */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
            Form Actions
          </h2>

          <div className="flex flex-wrap gap-4">
            <Button type="submit" variant="primary" size="lg">
              Submit Form
            </Button>
            <Button type="button" variant="secondary" size="lg">
              Reset
            </Button>
            <Button type="button" variant="primary" size="lg">
              Cancel
            </Button>
          </div>
        </section>
      </form>

      {/* Form Data Display */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
          Current Form Data
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm text-gray-700 overflow-auto">
            {JSON.stringify(
              {
                ...formData,
                selectedSkills,
                selectedChips,
                tags,
                toggleStates,
              },
              null,
              2
            )}
          </pre>
        </div>
      </section>
    </div>
  );
};

export default ExampleUsage;
