/** @type {import('lint-staged').Configuration} */
export default {
  '{src,test,apps,libs}/**/*.ts': [
    'eslint --fix --no-warn-ignored',
    'prettier --write',
  ],
  '*.{json,md,yml,yaml}': 'prettier --write --ignore-unknown',
  '*.{js,mjs,cjs}': 'prettier --write --ignore-unknown',
};
