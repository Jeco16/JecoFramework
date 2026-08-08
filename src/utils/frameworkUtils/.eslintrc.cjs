module.exports = {
  env: {
    node: true,
    es2022: true,
    es2023: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
  plugins: ['import', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'off',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js'],
      },
    },
  },
};
