import { defineConfig } from 'tsup';
import patchBuild from './scripts/actions/patch';
export default defineConfig({
   entry: ['src/index.ts'],
   tsconfig: 'tsconfig.json',
   outDir: 'dist',
   external: ['tslib'],
   format: ['esm', 'cjs'],
   clean: true,
   dts: true,
   onSuccess: patchBuild,
});
