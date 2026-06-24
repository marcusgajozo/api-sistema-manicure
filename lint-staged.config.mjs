/** @type {import('lint-staged').Configuration} */
export default {
  '{src,test,database}/**/*.ts': [
    'eslint --fix --no-warn-ignored',
    'prettier --write',
  ],
  'src/**/*.spec.ts': ['eslint --fix --no-warn-ignored', 'prettier --write'],
  '*.{json,md,yml,yaml}': 'prettier --write --ignore-unknown',
  '*.{js,mjs,cjs}': 'prettier --write --ignore-unknown',
};
