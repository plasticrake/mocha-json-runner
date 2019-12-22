module.exports = {
  env: {
    browser: false,
    commonjs: true,
    node: false,
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
  },
  reportUnusedDisableDirectives: true,
  rules: {},
};
