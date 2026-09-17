'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),os=require('node:os');const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function fixture(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stack-integration-'));try{return fn(dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
function node(dir,code){const p=spawnSync(process.execPath,['-e',code],{cwd:root,env:{...process.env,HOME:dir,XDG_CONFIG_HOME:path.join(dir,'config'),XDG_STATE_HOME:path.join(dir,'state')},encoding:'utf8'});assert.equal(p.status,0,p.stderr||p.stdout);return p.stdout;}
test('Shipped counts only exact configured author emails in real Git history',()=>fixture(dir=>{
 const repo=path.join(dir,'code/repo');fs.mkdirSync(repo,{recursive:true});const git=(...args)=>{const r=spawnSync('git',args,{cwd:repo,encoding:'utf8'});assert.equal(r.status,0,r.stderr);};
 git('init','-q');git('config','user.email','tom@example.test');git('config','user.name','Fictional author');fs.writeFileSync(path.join(repo,'a'),'hello\n');git('add','.');git('commit','-qm','Ship fixture');
 const out=node(dir,`const B=require('./backend.cjs');B.collect({roots:[${JSON.stringify(repo)}],authorEmails:['tom@example.test']}).then(x=>console.log(JSON.stringify(x)));`);
 assert.equal(JSON.parse(out).commits,1);
}));
test('atomic writes reject symlinked ancestor directories',()=>fixture(dir=>{node(dir,`const C=require('./lib/js/core.cjs');C.fs.mkdirSync(C.path.join(C.HOME,'real'));C.fs.symlinkSync(C.path.join(C.HOME,'real'),C.path.join(C.HOME,'link'));require('node:assert/strict').throws(()=>C.atomic(C.path.join(C.HOME,'link/sub/file'),'bad'),/symlink/);`);}));
