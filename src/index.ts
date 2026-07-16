import { definePlugin } from '@oxlint/plugins';

import preferZodNamespace from './rules/prefer-zod-namespace';

const importZod = definePlugin({
  meta: {
    name: 'import-zod',
  },
  rules: {
    'prefer-zod-namespace': preferZodNamespace,
  },
});

export default importZod;
