module.exports = {
  env: {
    browser: false,
    commonjs: true,
    node: true,
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  overrides: [
    {
      files: ['examples/*.js'],
      rules: {
        'import/no-unresolved': 'off',
        'no-new': 'off',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 2018,
  },
  reportUnusedDisableDirectives: true,
  rules: {},
};
