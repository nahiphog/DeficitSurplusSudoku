import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('src', 'dist', { recursive: true });
await cp('public/index.html', 'dist/index.html');
// app.ts intentionally uses browser-compatible TypeScript syntax only, so it can
// be copied as the module consumed by this dependency-free static site.
await cp('src/app.ts', 'dist/app.js');
