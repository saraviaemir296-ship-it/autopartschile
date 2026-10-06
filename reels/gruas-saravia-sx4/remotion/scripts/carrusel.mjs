import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const root = process.cwd();
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const browserExecutable = process.env.REMOTION_CHROME;
const n = Number(process.argv[2] || 7);
fs.mkdirSync('out/carrusel-semana', {recursive: true});
for (let i = 0; i < n; i++) {
  const composition = await selectComposition({serveUrl, id: 'Carrusel', inputProps: {i}, browserExecutable});
  await renderStill({serveUrl, composition, frame: 0, inputProps: {i}, output: `out/carrusel-semana/${i + 1}.jpg`, imageFormat: 'jpeg', jpegQuality: 92, browserExecutable});
  console.log('ok', i + 1);
}
