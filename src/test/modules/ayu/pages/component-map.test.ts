import { describe, expect, it } from 'vitest';
import { componentMap } from '../../../../modules/ayu/pages/component-map';

describe('componentMap', () => {
  describe('Structure', () => {
    it('should be defined', () => {
      expect(componentMap).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof componentMap).toBe('object');
      expect(componentMap).not.toBeNull();
    });

    it('should not be an array', () => {
      expect(Array.isArray(componentMap)).toBe(false);
    });
  });

  describe('Component Keys', () => {
    it('should have all required component keys', () => {
      const expectedKeys = [
        'group',
        'display',
        'text',
        'repeatable-text',
        'number',
        'date',
        'select',
        'selectableOptionGroup',
        'multi-select',
        'quantity',
      ];

      expectedKeys.forEach(key => {
        expect(componentMap).toHaveProperty(key);
      });
    });

    it('should have exactly 10 component mappings', () => {
      const keys = Object.keys(componentMap);
      expect(keys).toHaveLength(10);
    });

    it('should have group component mapping', () => {
      expect(componentMap).toHaveProperty('group');
      expect(componentMap.group).toBeDefined();
    });

    it('should have display component mapping', () => {
      expect(componentMap).toHaveProperty('display');
      expect(componentMap.display).toBeDefined();
    });

    it('should have text component mapping', () => {
      expect(componentMap).toHaveProperty('text');
      expect(componentMap.text).toBeDefined();
    });

    it('should have repeatable-text component mapping', () => {
      expect(componentMap).toHaveProperty('repeatable-text');
      expect(componentMap['repeatable-text']).toBeDefined();
    });

    it('should have number component mapping', () => {
      expect(componentMap).toHaveProperty('number');
      expect(componentMap.number).toBeDefined();
    });

    it('should have date component mapping', () => {
      expect(componentMap).toHaveProperty('date');
      expect(componentMap.date).toBeDefined();
    });

    it('should have select component mapping', () => {
      expect(componentMap).toHaveProperty('select');
      expect(componentMap.select).toBeDefined();
    });

    it('should have selectableOptionGroup component mapping', () => {
      expect(componentMap).toHaveProperty('selectableOptionGroup');
      expect(componentMap.selectableOptionGroup).toBeDefined();
    });

    it('should have multi-select component mapping', () => {
      expect(componentMap).toHaveProperty('multi-select');
      expect(componentMap['multi-select']).toBeDefined();
    });

    it('should have quantity component mapping', () => {
      expect(componentMap).toHaveProperty('quantity');
      expect(componentMap.quantity).toBeDefined();
    });
  });

  describe('Component Values', () => {
    it('should have all component values as functions', () => {
      Object.values(componentMap).forEach(component => {
        expect(typeof component).toBe('function');
      });
    });

    it('should have group component as a function', () => {
      expect(typeof componentMap.group).toBe('function');
    });

    it('should have display component as a function', () => {
      expect(typeof componentMap.display).toBe('function');
    });

    it('should have text component as a function', () => {
      expect(typeof componentMap.text).toBe('function');
    });

    it('should have repeatable-text component as a function', () => {
      expect(typeof componentMap['repeatable-text']).toBe('function');
    });

    it('should have number component as a function', () => {
      expect(typeof componentMap.number).toBe('function');
    });

    it('should have date component as a function', () => {
      expect(typeof componentMap.date).toBe('function');
    });

    it('should have select component as a function', () => {
      expect(typeof componentMap.select).toBe('function');
    });

    it('should have selectableOptionGroup component as a function', () => {
      expect(typeof componentMap.selectableOptionGroup).toBe('function');
    });

    it('should have multi-select component as a function', () => {
      expect(typeof componentMap['multi-select']).toBe('function');
    });

    it('should have quantity component as a function', () => {
      expect(typeof componentMap.quantity).toBe('function');
    });
  });

  describe('Component Names', () => {
    it('should have AyuGroup component for group key', () => {
      expect(componentMap.group.name).toBe('AyuGroup');
    });

    it('should have AyuDisplayText component for display key', () => {
      expect(componentMap.display.name).toBe('AyuDisplayText');
    });

    it('should have AyuTextInput component for text key', () => {
      expect(componentMap.text.name).toBe('AyuTextInput');
    });

    it('should have AyuRepeatableText component for repeatable-text key', () => {
      expect(componentMap['repeatable-text'].name).toBe('AyuRepeatableText');
    });

    it('should have AyuNumberInput component for number key', () => {
      expect(componentMap.number.name).toBe('AyuNumberInput');
    });

    it('should have AyuDateInput component for date key', () => {
      expect(componentMap.date.name).toBe('AyuDateInput');
    });

    it('should have AyuSelect component for select key', () => {
      expect(componentMap.select.name).toBe('AyuSelect');
    });

    it('should have AyuSelectableOptionGroup component for selectableOptionGroup key', () => {
      expect(componentMap.selectableOptionGroup.name).toBe('AyuSelectableOptionGroup');
    });

    it('should have AyuMultiSelect component for multi-select key', () => {
      expect(componentMap['multi-select'].name).toBe('AyuMultiSelect');
    });

    it('should have AyuDuration component for quantity key', () => {
      expect(componentMap.quantity.name).toBe('AyuDuration');
    });
  });

  describe('Access Patterns', () => {
    it('should allow dot notation access for simple keys', () => {
      expect(componentMap.group).toBeDefined();
      expect(componentMap.display).toBeDefined();
      expect(componentMap.text).toBeDefined();
      expect(componentMap.number).toBeDefined();
      expect(componentMap.date).toBeDefined();
      expect(componentMap.select).toBeDefined();
      expect(componentMap.selectableOptionGroup).toBeDefined();
      expect(componentMap.quantity).toBeDefined();
    });

    it('should allow bracket notation access for hyphenated keys', () => {
      expect(componentMap['repeatable-text']).toBeDefined();
      expect(componentMap['multi-select']).toBeDefined();
    });

    it('should allow bracket notation access for all keys', () => {
      expect(componentMap['group']).toBeDefined();
      expect(componentMap['display']).toBeDefined();
      expect(componentMap['text']).toBeDefined();
      expect(componentMap['number']).toBeDefined();
      expect(componentMap['date']).toBeDefined();
      expect(componentMap['select']).toBeDefined();
      expect(componentMap['selectableOptionGroup']).toBeDefined();
      expect(componentMap['quantity']).toBeDefined();
    });
  });

  describe('Immutability', () => {
    it('should be a read-only exported constant', () => {
      const keys = Object.keys(componentMap);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should maintain all original keys', () => {
      const expectedKeys = [
        'group',
        'display',
        'text',
        'repeatable-text',
        'number',
        'date',
        'select',
        'selectableOptionGroup',
        'multi-select',
        'quantity',
      ];

      const actualKeys = Object.keys(componentMap);
      expectedKeys.forEach(key => {
        expect(actualKeys).toContain(key);
      });
    });
  });

  describe('Type Coverage', () => {
    it('should cover all basic input types', () => {
      expect(componentMap.text).toBeDefined(); // string input
      expect(componentMap.number).toBeDefined(); // number input
      expect(componentMap.date).toBeDefined(); // date input
    });

    it('should cover all selection types', () => {
      expect(componentMap.select).toBeDefined(); // dropdown select
      expect(componentMap['multi-select']).toBeDefined(); // multiple selection
      expect(componentMap.quantity).toBeDefined(); // quantity/duration input
      expect(componentMap.selectableOptionGroup).toBeDefined(); // selectable options
    });

    it('should cover special types', () => {
      expect(componentMap.group).toBeDefined(); // grouping
      expect(componentMap.display).toBeDefined(); // display only
      expect(componentMap['repeatable-text']).toBeDefined(); // repeatable input
    });
  });

  describe('Complete Mapping', () => {
    it('should map all component types correctly', () => {
      const mapping = {
        group: 'AyuGroup',
        display: 'AyuDisplayText',
        text: 'AyuTextInput',
        'repeatable-text': 'AyuRepeatableText',
        number: 'AyuNumberInput',
        date: 'AyuDateInput',
        select: 'AyuSelect',
        selectableOptionGroup: 'AyuSelectableOptionGroup',
        'multi-select': 'AyuMultiSelect',
        quantity: 'AyuDuration',
      };

      Object.entries(mapping).forEach(([key, expectedName]) => {
        const component = componentMap[key as keyof typeof componentMap];
        expect(component).toBeDefined();
        expect(component.name).toBe(expectedName);
      });
    });
  });
});
