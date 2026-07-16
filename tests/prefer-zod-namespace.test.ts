import { RuleTester } from "oxlint/plugins-dev";
import * as vitest from "vitest";

import rule from "../src/rules/prefer-zod-namespace";

RuleTester.describe = vitest.describe;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;

// Test cases use TypeScript-only syntax (e.g. `import type`), so parse as TS.
const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      lang: "ts",
    },
  },
});

ruleTester.run("prefer-zod-namespace-import", rule, {
  valid: [
    // Namespace import is valid
    "import * as z from 'zod';",
    // Namespace import is valid
    "import * as z from 'zod/v3';",
    // Namespace import is valid
    "import * as z from 'zod/v4';",
    // Namespace import is valid
    "import * as z from 'zod/v4-mini';",
    // Namespace import for submodules
    "import * as core from 'zod/v4/core';",
    // Type namespace import is valid
    "import type * as z from 'zod';",
    // Other imports from zod that don't include 'z' are valid
    "import { toJSONSchema } from 'zod';",
    // Other type imports from zod that don't include 'z' are valid
    "import type { toJSONSchema } from 'zod';",

    // Imports from other modules are valid
    "import { z } from 'not-zod';",
  ],
  invalid: [
    // Import cases
    // Simple case: only z is imported
    {
      code: "import { z } from 'zod';",
      output: "import * as z from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import { z } from 'zod/v4';",
      output: "import * as z from 'zod/v4';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import { z } from 'zod/v4-mini';",
      output: "import * as z from 'zod/v4-mini';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import { z } from 'zod/v3';",
      output: "import * as z from 'zod/v3';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    // Default import cases
    {
      code: "import z from 'zod';",
      output: "import * as z from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import z from 'zod/v4';",
      output: "import * as z from 'zod/v4';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import z from 'zod/v3';",
      output: "import * as z from 'zod/v3';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import type z from 'zod';",
      output: "import type * as z from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    // Mixed default and named imports
    {
      code: "import z, { toJSONSchema } from 'zod';",
      output: "import * as z from 'zod';\nimport { toJSONSchema } from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    // Default imports with any name should be converted
    {
      code: "import zod from 'zod';",
      output: "import * as zod from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import zodSchema from 'zod';",
      output: "import * as zodSchema from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import Z from 'zod';",
      output: "import * as Z from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import type zod from 'zod';",
      output: "import type * as zod from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import zod, { toJSONSchema } from 'zod';",
      output:
        "import * as zod from 'zod';\nimport { toJSONSchema } from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    // Submodule imports from zod/v4
    {
      code: "import { core } from 'zod/v4';",
      output: "import * as core from 'zod/v4/core';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import { core as zodCore } from 'zod/v4';",
      output: "import * as zodCore from 'zod/v4/core';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import type { core } from 'zod/v4';",
      output: "import type * as core from 'zod/v4/core';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    {
      code: "import { toJSONSchema, core } from 'zod/v4';",
      output:
        "import * as core from 'zod/v4/core';\nimport { toJSONSchema } from 'zod/v4';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    // Type-only import case
    {
      code: "import type { z } from 'zod';",
      output: "import type * as z from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    // Complex case: z is imported along with other exports
    {
      code: "import { toJSONSchema, z } from 'zod';",
      output: "import * as z from 'zod';\nimport { toJSONSchema } from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    // Complex type-only import case
    {
      code: "import type { toJSONSchema, z } from 'zod';",
      output:
        "import type * as z from 'zod';\nimport type { toJSONSchema } from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    // Case with renamed import
    {
      code: "import { z as zodSchema } from 'zod';",
      output: "import * as zodSchema from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    // Complex case with renamed imports
    {
      code: "import { toJSONSchema as schema, z } from 'zod';",
      output:
        "import * as z from 'zod';\nimport { toJSONSchema as schema } from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    // Type import case with z
    {
      code: "import { type ZodError, z } from 'zod';",
      output: "import * as z from 'zod';\nimport { type ZodError } from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
    // Case where z appears before other imports
    {
      code: "import { z, toJSONSchema } from 'zod';",
      output: "import * as z from 'zod';\nimport { toJSONSchema } from 'zod';",
      errors: [{ messageId: "preferNamespaceImport" }],
    },
  ],
});
