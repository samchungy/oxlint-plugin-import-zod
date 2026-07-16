---
"oxlint-plugin-import-zod": major
---

Rewrote the plugin to target [Oxlint](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) exclusively using its JS plugin API, and renamed the package from `eslint-plugin-import-zod` to `oxlint-plugin-import-zod`. The rule is built with Oxlint's `createOnce` API for performance. ESLint is no longer supported.
