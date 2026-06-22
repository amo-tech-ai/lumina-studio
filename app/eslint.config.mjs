import tseslint from "typescript-eslint";

// IPI2-121 · SHOOT-UX-000 — v1-import guard.
// ponytail: only the restricted-import rules are enabled (no recommended set), so
// `npm run lint` fails ONLY on deprecated CopilotKit v1 usage, not unrelated style.
const V1_HOOKS = [
  "useCoAgent",
  "useCoAgentStateRender",
  "useCopilotReadable",
  "useCopilotAction",
  "useCopilotChat",
  "useCopilotChatSuggestions",
  "useLangGraphInterrupt",
  "CopilotTextarea",
];

export default tseslint.config(
  { ignores: [".next/**", "node_modules/**", ".mastra/**"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@copilotkit/react-core",
              message: "v1 root import — use '@copilotkit/react-core/v2'.",
            },
            {
              name: "@copilotkit/runtime",
              message: "v1 root import — use '@copilotkit/runtime/v2'.",
            },
          ],
          patterns: [
            {
              group: ["@copilotkit/react-textarea", "@copilotkit/react-ui"],
              message: "Deprecated v1 package — use '@copilotkit/react-core/v2'.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: `ImportSpecifier[imported.name=/^(${V1_HOOKS.join("|")})$/]`,
          message: "Deprecated CopilotKit v1 hook — see ipix-v2-conventions.md for the v2 replacement.",
        },
        {
          selector: "CallExpression[callee.name='copilotKitEndpoint']",
          message: "v1 runtime — use createCopilotEndpoint from '@copilotkit/runtime/v2'.",
        },
      ],
    },
  },
);
