import AyuButton from './ayu-button.component';

interface AyuYesNoButtonProps {
  value: 'Yes' | 'No' | null;
  onChange: (value: 'Yes' | 'No') => void;
  activeColor?: string;
  disabled?: boolean;
}

export const AyuYesNoButton = ({
  value,
  onChange,
  activeColor = '#0fd197',
  disabled = false,
}: AyuYesNoButtonProps) => {
  const getButtonClass = (option: 'Yes' | 'No') =>
    value === option
      ? 'text-white !border-0'
      : 'bg-white text-gray-700 !border-0';

  const getButtonStyle = (option: 'Yes' | 'No') =>
    value === option
      ? { backgroundColor: activeColor, border: 'none' }
      : { border: 'none' };

  return (
    <div className="flex gap-2">
      <AyuButton
        type="button"
        onClick={() => onChange('Yes')}
        variant={value === 'Yes' ? 'primary' : 'secondary'}
        size="sm"
        className={getButtonClass('Yes')}
        style={getButtonStyle('Yes')}
        disabled={disabled}
      >
        ✓ Yes
      </AyuButton>
      <AyuButton
        type="button"
        onClick={() => onChange('No')}
        variant={value === 'No' ? 'primary' : 'secondary'}
        size="sm"
        className={getButtonClass('No')}
        style={getButtonStyle('No')}
        disabled={disabled}
      >
        ✕ No
      </AyuButton>
    </div>
  );
};
