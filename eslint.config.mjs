import typescript from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: [".next/**", "node_modules/**"] },
  ...typescript.configs["flat/recommended"],
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    settings: { react: { version: "detect" } },
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
];
