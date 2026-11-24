// Architecture rules from docs/frontend/architecture_refactor/ARCHITECTURE.md §6.
// Warnings until Step 13; eslint.config.js loads this file only when LINT_REFACTOR=1.
import checkFile from 'eslint-plugin-check-file';

const LEVEL = 'warn';
const TSX_MAX_LINES = 200;
const TEST_FILES = ['src/**/*.test.{ts,tsx}'];
const LOWERCASE_TSX_ENTRIES = ['main', 'router', 'app-routes', 'providers', 'routes'];

const DEEP_PARENT_IMPORT = {
  regex: '^(\\.\\./){3,}',
  message: 'No relative import more than two levels up; use the @/ alias.',
};
const USE_FORM_IMPORT = {
  name: 'react-hook-form',
  importNames: ['useForm'],
  message: 'Use useCalculatorForm from shared/form instead of calling useForm.',
};

const crossModuleImport = (module) => ({
  regex: `^(@/modules/|(\\.\\./)+)${module}/.+`,
  message: `Import from the ${module} module only through its index.ts.`,
});
const sharedLayerImport = {
  regex: '^(@/|(\\.\\./)+)(modules|app)(/|$)',
  message: 'shared must not import from app or modules.',
};

const restrictedImports = ({ patterns = [], allowUseForm = false } = {}) => [
  LEVEL,
  { paths: allowUseForm ? [] : [USE_FORM_IMPORT], patterns: [DEEP_PARENT_IMPORT, ...patterns] },
];

const UNIT_LITERAL_MESSAGE = 'Unit literal in a module: declare a quantity instead.';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'check-file': checkFile },
    rules: {
      'no-restricted-imports': restrictedImports(),
      'check-file/filename-naming-convention': [
        LEVEL,
        {
          [`src/**/!(${LOWERCASE_TSX_ENTRIES.join('|')}).tsx`]: 'PASCAL_CASE',
          'src/**/hooks/*.ts': 'use[A-Z]*([a-zA-Z0-9])',
          'src/**/!(hooks)/*.ts': 'KEBAB_CASE',
        },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-match-with-fex': [
        LEVEL,
        {
          '*.api.ts': '**/api/',
          '*.mapper.ts': '**/mappers/',
          '*.constants.ts': '**/constants/',
          '*.type.ts': '**/types/**',
          '*.schema.ts': '**/schemas/',
          'use*.ts': '**/hooks/',
          '*Chart.tsx': '**/charts/',
        },
      ],
    },
  },
  {
    files: ['src/modules/materials/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrictedImports({ patterns: [crossModuleImport('processes')] }) },
  },
  {
    files: ['src/modules/processes/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrictedImports({ patterns: [crossModuleImport('materials')] }) },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrictedImports({ patterns: [sharedLayerImport] }) },
  },
  {
    files: ['src/shared/form/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrictedImports({ patterns: [sharedLayerImport], allowUseForm: true }) },
  },
  {
    files: ['src/**/*.tsx'],
    ignores: TEST_FILES,
    rules: { 'max-lines': [LEVEL, { max: TSX_MAX_LINES }] },
  },
  {
    files: ['src/modules/**/*.{ts,tsx}'],
    ignores: TEST_FILES,
    rules: {
      'no-restricted-syntax': [
        LEVEL,
        { selector: 'Literal[value=/^(°C|K|Pa)$/]', message: UNIT_LITERAL_MESSAGE },
        { selector: 'JSXText[value=/^\\s*(°C|K|Pa)\\s*$/]', message: UNIT_LITERAL_MESSAGE },
        { selector: 'TemplateElement[value.raw=/°C/]', message: UNIT_LITERAL_MESSAGE },
        { selector: "JSXAttribute[name.name='digits']", message: 'No digits props: use a precision rule.' },
      ],
    },
  },
];
