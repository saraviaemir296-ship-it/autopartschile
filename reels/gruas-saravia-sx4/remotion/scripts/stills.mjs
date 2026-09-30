import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const root = process.cwd();
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const browserExecutable = process.env.REMOTION_CHROME;
const [id, ...frames] = process.argv.slice(2);
const composition = await selectComposition({serveUrl, id, browserExecutable});
for (const f of frames) {
  await renderStill({serveUrl, composition, frame: Number(f), output: `out/${id}_${f}.jpg`, imageFormat: 'jpeg', browserExecutable});
  console.log('ok', f);
}
