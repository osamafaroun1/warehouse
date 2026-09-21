import js from '@eslint/js';
import solid from 'eslint-plugin-solid/configs/typescript';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
    {
        ignores: ['tools/**', 'dist/**', 'server/dist/**'],
    },
    js.configs.recommended,
    {
        files: ['src/**/*.{ts,tsx}'],
        ...solid,
        languageOptions: {
            // ...(solid.languageOptions ?? {}),
            parser: tseslint.parser,
            parserOptions: {
                project: 'tsconfig.json',
            },
            globals: {
                ...globals.browser, // or globals.node,
                API_BASE_URL: 'readonly',
                SERVER_BASE_URL: 'readonly',
                UPLOADS_URL: 'readonly',
            },
        },
        plugins: {
            ...(solid.plugins ?? {}),
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            ...(solid.rules ?? {}),
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
        },
    },
];
