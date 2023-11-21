import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [dts()],
    server: {
        open: '/test/index.html',
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'GDRWeb',
            fileName: 'gdrweb',
        },
        /* rollupOptions: {
            external: [],
            output: {
                globals: {},
            },
        }, */
    },
});