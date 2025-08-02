import { defineConfig } from 'eslint/config';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import globals from 'globals';
import prettier from 'eslint-plugin-prettier';
import js from '@eslint/js';
import tsc from 'eslint-plugin-tsc';
import ts from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
export default defineConfig([
   { ignores: ['package-lock.json', 'dist/**/*', '**/*.d.ts', '**/*.d.mts'] },
   {
      files: ['**/*.json'],
      ignores: ['package-lock.json'],
      plugins: { json },
      language: 'json/json',
      extends: ['json/recommended'],
   },

   {
      files: ['**/*.jsonc'],
      plugins: { json },
      language: 'json/jsonc',
      extends: ['json/recommended'],
   },

   {
      files: ['**/*.json5'],
      plugins: { json },
      language: 'json/json5',
      extends: ['json/recommended'],
   },

   {
      files: ['**/*.md'],
      plugins: { markdown },
      language: 'markdown/commonmark',
      extends: ['markdown/recommended'],
   },
   {
      files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
      plugins: { prettier, js },
      languageOptions: {
         globals: {
            ...globals.node,
            ...globals.es2021,
         },
      },
      rules: {
         'prettier/prettier': 'warn',
      },
   },
   {
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.mjs', '**/*.cjs', '**/*.mts'],
      languageOptions: {
         parser: tsparser,
         parserOptions: {
            project: './tsconfig.eslint.json',
         },
      },
      plugins: {
         tsc,
         prettier,
         ts,
      },
      extends: ['ts/recommended'],
      rules: {
         '@typescript-eslint/no-explicit-any': 'error',
         'require-await': 'warn',
         'no-return-await': 'error',
         'no-await-in-loop': 'warn',
         '@typescript-eslint/no-floating-promises': 'error',
         '@typescript-eslint/require-await': 'warn',
         '@typescript-eslint/no-misused-promises': 'error',
         'prettier/prettier': 'warn',
         'tsc/config': [
            'error',
            {
               configFile: 'tsconfig.eslint.json',
            },
         ],
      },
   },
]);
