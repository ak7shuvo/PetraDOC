import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    rules: {
      // New in eslint-config-next 16 (React Compiler lint). Our effects load async data and reset paging on
      // input change, which is the standard pattern here; kept visible as a warning instead of rewriting every page.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  { ignores: [".next/**", ".next-license/**", "out/**", "node_modules/**", "scripts/**"] },
];
export default config;
