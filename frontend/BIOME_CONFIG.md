/**
 * Biome Configuration Guide
 * 
 * This project uses Biome for linting, formatting, and code quality checks.
 * Biome is a fast, all-in-one toolchain for web projects.
 * 
 * ## Commands
 * 
 * ```bash
 * # Lint files
 * bun run lint
 * bun run lint:fix          # Auto-fix issues
 * 
 * # Format files
 * bun run format
 * bun run format:fix        # Auto-format
 * bun run format:check      # Check only (CI)
 * 
 * # Combined check
 * bun run check
 * bun run check:fix         # Auto-fix
 * bun run check:ci          # CI mode
 * 
 * # Validate (lint + type check)
 * bun run validate
 * bun run validate:fix      # Auto-fix + type check
 * ```
 * 
 * ## Configuration Highlights
 * 
 * - **Indentation**: 2 spaces
 * - **Line width**: 100 characters
 * - **Quotes**: Single quotes (double for JSX)
 * - **Semicolons**: Always required
 * - **Trailing commas**: ES5 style (objects only)
 * 
 * ## Rules
 * 
 * ### Enabled (warn level)
 * - `noUnusedImports` - Remove unused imports
 * - `noUnusedVariables` - Remove unused variables
 * - `useExhaustiveDependencies` - React hook dependencies
 * - `useHookAtTopLevel` - React hooks rules
 * - `noExplicitAny` - Avoid `any` type
 * - `useOptionalChain` - Use optional chaining
 * 
 * ### Disabled
 * - `noConsole` - Console.log allowed (for debugging)
 * - `noForEach` - forEach allowed
 * - `noDelete` - delete operator allowed
 * 
 * ## Test Files
 * 
 * Test files (*.test.ts, *.spec.ts) have relaxed rules:
 * - `noNonNullAssertion` - off (allow `!` operator)
 * - `noExplicitAny` - off (allow `any` for mocks)
 * 
 * ## VS Code Integration
 * 
 * Install the "Biome" extension and add to settings.json:
 * 
 * ```json
 * {
 *   "biome.lspBin": "./node_modules/@biomejs/biome/bin/biome",
 *   "[typescript]": {
 *     "editor.defaultFormatter": "biomejs.biome",
 *     "editor.formatOnSave": true
 *   },
 *   "[typescriptreact]": {
 *     "editor.defaultFormatter": "biomejs.biome",
 *     "editor.formatOnSave": true
 *   }
 * }
 * ```
 * 
 * ## CI/CD
 * 
 * Use `bun run check:ci` for strict checks in CI pipelines.
 * This fails on any linting or formatting issues.
 */
