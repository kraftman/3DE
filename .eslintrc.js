/** @format */

module.exports = {
  extends: ['airbnb', 'prettier'],
  parser: '@typescript-eslint/parser',
  env: {
    jest: true,
    browser: true,
    es6: true,
    mocha: true,
    node: true,
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'int@typescript-eslint/no-unused-vars': 0,
    'no-undef': 2,
  },
  overrides: [],
};
