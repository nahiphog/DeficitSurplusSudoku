import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('src', 'dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
// app.ts intentionally uses browser-compatible TypeScript syntax only, so it can
// be copied as the module consumed by this dependency-free static site.
await cp('src/app.ts', 'dist/app.js');
await cp('src/simulation.ts', 'dist/simulation.js');
await cp('src/custom.ts', 'dist/custom.js');
await cp('src/custom-worker.ts', 'dist/custom-worker.js');
await cp('src/verify.ts', 'dist/verify.js');
await cp('src/techniques.ts', 'dist/techniques.js');
await cp('third-party', 'dist/third-party', { recursive: true });
