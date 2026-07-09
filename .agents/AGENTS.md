# Workspace Rules

## Compilation & ESLint Compliance
- Never introduce any `any` casts or explicit `any` declarations in client/server code without proper eslint ignore overrides if absolutely necessary.
- Always cast types to their strict definitions rather than using loose types.
- Ensure all variables defined are used, or prefixed with `_` if they are intentional placeholders.
- Always run `npm run build` or the corresponding build/compilation check command before declaring a task complete to ensure the application compiles successfully with zero warnings/errors.
