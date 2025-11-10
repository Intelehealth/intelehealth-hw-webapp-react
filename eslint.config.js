import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Defer console handling to restricted-syntax (ban only console.log)
      'no-console': 'off',
      // Allow console.warn and console.error for legitimate logging
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.object.name="console"][callee.property.name="log"]',
          message:
            'console.log is not allowed. Use proper logging or remove for production.',
        },
      ],
      // Disable refresh rule causing false positives in non-component files
      'react-refresh/only-export-components': 'off',
      // Relax TS strictness for quicker iteration
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  {
    files: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'src/test/**/*.{ts,tsx}',
    ],
    rules: {
      // Allow console statements in test files for debugging
      'no-console': 'off',
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/modules/profile/profile-status-modal.component.tsx'],
    rules: {
      // Temporarily disable until hook ordering is refactored
      'react-hooks/rules-of-hooks': 'off',
    },
  },
]);
