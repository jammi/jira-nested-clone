import globals from "globals";

const files = [
  "index.mjs",
  "lib/**/*.mjs",
  "-node_modules/**"
];

export default [
  {
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
      }
    },
  },
  {
    rules: {},
    files
  }
];
