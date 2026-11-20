import {cp,rm,mkdir,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {build} from 'esbuild';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(root,'../dist'),out=path.join(root,'www');
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const entry of await readdir(source,{withFileTypes:true})) {
  if(entry.name.startsWith('.')||['test','test03','test04','apk-layout-qa'].includes(entry.name))continue;
  await cp(path.join(source,entry.name),path.join(out,entry.name),{recursive:true});
}
await build({entryPoints:[path.join(root,'native-bridge.mjs')],outfile:path.join(out,'native-bridge.js'),bundle:true,format:'iife',target:'chrome108',legalComments:'none'});
console.log('v1.6.15 current web frontend and local sound effects staged for Android.');

