import { defineConfig } from 'tsup';

export default defineConfig({
   entry: ['src/index.ts'],
   tsconfig: 'tsconfig.json',
   outDir: 'dist',
   external: ['tslib'],
   format: ['esm', 'cjs'],
   clean: true,
   dts: true,
   onSuccess: async () => {
      const { default: patchBuild } = await import('./scripts/actions/patch.mjs');
      return patchBuild();
   },
});
