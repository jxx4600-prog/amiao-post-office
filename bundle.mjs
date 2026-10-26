import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);let esbuild;try{esbuild=require('esbuild')}catch{try{esbuild=require('../miao-cloud/node_modules/esbuild')}catch{}};
const root=path.join(import.meta.dirname,'docs');
let html=await readFile(path.join(root,'index.html'),'utf8');
const cssFiles=['fonts.css','app.css','enhancements.css','motion.css','couriers.css','final-adjustments.css','home-layout.css','home-summary.css','letter-tools.css','home-final.css','home-animation-v7.css','journal-design.css','editor-layers.css','user-auth.css','responsive-layout.css','sites-adaptation.css','editor-upgrade.css','ui-motion.css'];
const jsFiles=['lucide-icons.js','clock-utils.js','courier-utils.js','motion.js','letter-tools.js','enhancements.js','asset-utils.js','assets-ui.js','home-animation-v7.js','vendor/lunar.js','cat-mail-content.js','postbox.js','editor-typography.js','postcard-layout.js','journal-design.js','todo-workflow.js','editor-layers.js','editor-interaction.js','object-crop.js','long-paper.js','personal-details.js','mailbox-actions.js','responsive-layout.js','editor-upgrade.js','ui-motion.js','vendor/supabase-2.117.3.js','auth-config.js','user-auth.js','cloud-sync.js','app.js','paw-feedback.js','task-reminders.js'];
const css=(await Promise.all(cssFiles.map(f=>readFile(path.join(root,f),'utf8')))).join('\n');
const js=(await Promise.all(jsFiles.map(f=>readFile(path.join(root,f),'utf8')))).join('\n;\n');
const styles=esbuild?await esbuild.transform(css,{loader:'css',minify:true}):{code:css};
const scripts=esbuild?await esbuild.transform(js,{loader:'js',minify:true,target:['es2020']}):{code:js};
await writeFile(path.join(root,'site.css'),styles.code);await writeFile(path.join(root,'site.js'),scripts.code);
let first=true;html=html.replace(/<link rel="stylesheet" href="[^"]*">/g,()=>{if(!first)return '';first=false;return '<link rel="stylesheet" href="site.css?v=20261026-3">';});
first=true;html=html.replace(/<script defer src="[^"]*"><\/script>/g,()=>{if(!first)return '';first=false;return '<script defer src="site.js?v=20261026-3"></script>';});
await writeFile(path.join(root,'index.html'),html);
console.log(JSON.stringify({stylesheetsBefore:cssFiles.length,scriptsBefore:jsFiles.length,stylesheetsAfter:1,scriptsAfter:1,cssBytes:Buffer.byteLength(styles.code),jsBytes:Buffer.byteLength(scripts.code)}));

