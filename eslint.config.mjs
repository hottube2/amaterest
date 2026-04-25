import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "pinterest-launch/**",
      "site/**",
      "coverage/**",
      "dist/**"
    ]
  },
  {
    rules: {
      "react/no-unescaped-entities": "off"
    }
  }
];

export default config;
