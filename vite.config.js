import { resolve } from 'path';
import glsl from 'vite-plugin-glsl';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [dts(), glsl()],
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