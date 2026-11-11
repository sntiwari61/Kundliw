import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  {
    // React Compiler rules introduced with eslint-config-next 16. They flag existing
    // patterns (hydration-safe localStorage reads, handlers using Date.now) that are
    // not runtime defects, so they are surfaced as warnings and cleaned up gradually.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "tests-e2e/**", "test-results/**", "mobile-app/**"],
  },
];

export default config;
