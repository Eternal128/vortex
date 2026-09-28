import {defineCliConfig} from 'sanity/cli'

import {dataset, projectId} from './env'

export default defineCliConfig({
  api: {projectId, dataset},
  studioHost: 'vortex-learning',
  // The Sanity Context MCP only serves a dataset that has a deployed Studio application (AGENTS.md §12).
  deployment: {
    appId: 'tgwi2fenne6h7556mtf41n8m',
  },
  typegen: {
    enabled: true,
    // Queries live in the Next.js app one level up.
    path: '../{app,components,lib,sanity}/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../sanity.types.ts',
    overloadClientMethods: true,
  },
})
