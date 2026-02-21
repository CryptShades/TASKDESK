/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['eslint:recommended'],
  env: {
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
