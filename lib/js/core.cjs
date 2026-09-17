'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');
const HOME = os.homedir();
const configRoot = process.env.XDG_CONFIG_HOME || path.join(HOME, '.config');
const stateRoot = process.env.XDG_STATE_HOME || path.join(HOME, '.local/state');
const children = new Set();
function killGroup(child) { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }
process.once('SIGTERM', () => { for (const child of children) killGroup(child); process.exit(143); });
function run(argv, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(argv[0], argv.slice(1), {cwd: options.cwd, env: {...process.env, GIT_OPTIONAL_LOCKS:'0', ...options.env}, detached: true, stdio: ['ignore','pipe','pipe']});
    children.add(child);
    let out = [], err = [], size = 0, errorSize = 0, failure;
    const fail = message => { failure ||= new Error(message); killGroup(child); };
    const timer = setTimeout(() => fail('Command timed out: ' + argv[0]), options.timeout || 8000);
    child.stdout.on('data', b => { size += b.length; if (size > (options.limit || 1048576)) fail('Output limit exceeded: ' + argv[0]); else out.push(b); });
    child.stderr.on('data', b => { errorSize += b.length; if (errorSize > 8192) fail('Error output limit exceeded: ' + argv[0]); else err.push(b); });
    child.on('error', e => { failure = e; });
    child.on('close', code => {
      clearTimeout(timer); children.delete(child);
      if (failure) return reject(failure);
      if (code !== 0 && !options.allowFailure) return reject(new Error(argv[0] + ' exited ' + code));
      resolve({out:Buffer.concat(out).toString('utf8'), err:Buffer.concat(err).toString('utf8'), code});
    });
  });
}
function read(file, max = 1048576) {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try { const s=fs.fstatSync(fd); if (!s.isFile() || s.size>max) throw new Error('Unsupported or oversized file: '+file); const b=Buffer.alloc(max+1); const n=fs.readSync(fd,b,0,b.length,0); if(n>max) throw new Error('File grew beyond limit'); return b.subarray(0,n).toString('utf8'); } finally {fs.closeSync(fd);}
}
function json(file, fallback) { try { return JSON.parse(read(file)); } catch(e) { if(e.code==='ENOENT') return fallback; throw e; } }
function mkdir(dir) {
  const absolute=path.resolve(dir);let parent=path.parse(absolute).root;
  for(const part of absolute.slice(parent.length).split(path.sep)){parent=path.join(parent,part);if(fs.existsSync(parent)&&fs.lstatSync(parent).isSymbolicLink())throw new Error('Refusing symlink directory');}
  fs.mkdirSync(dir,{recursive:true,mode:0o700});
}
function atomic(file, value) {
  mkdir(path.dirname(file));
  if(fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink()) throw new Error('Refusing symlink target');
  const tmp=file+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';
  try {fs.writeFileSync(tmp,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600}); fs.renameSync(tmp,file);} finally {try{fs.unlinkSync(tmp);}catch{}}
}
function append(file, obj) {
  mkdir(path.dirname(file));
  // A bounded journal: retain the previous segment rather than unbounded growth.
  if(fs.existsSync(file) && fs.lstatSync(file).size>2*1048576) fs.renameSync(file,file+'.1');
  const fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_APPEND|fs.constants.O_CREAT|fs.constants.O_NOFOLLOW,0o600);
  try {fs.writeSync(fd,JSON.stringify(obj)+'\n');} finally {fs.closeSync(fd);}
}
function events(file) {
  let s=''; try{s=read(file,3*1048576);}catch(e){if(e.code==='ENOENT')return [];throw e;}
  return s.split('\n').filter(Boolean).flatMap(line=>{try{return [JSON.parse(line)];}catch{return [];}}).slice(-2000);
}
function cfg(name) { const value=json(path.join(configRoot,name,'config.json'),{}); if(!value||Array.isArray(value)||typeof value!=='object')throw new Error('Config must be a JSON object');return value; }
function state(name,file='state.json') {return path.join(stateRoot,name,file);}
function expand(p) {return path.resolve(p==='~'?HOME:String(p).replace(/^~\//,HOME+'/'));}
function exists(p) {return fs.existsSync(p);}
function walk(root, depth=3, max=3000) {
  const result=[]; let visited=0;
  function visit(dir,n) { if(visited++>=max)return; let entries;try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch{return;}
    for(const e of entries){if(result.length>=max)return; if(e.isSymbolicLink())continue; const p=path.join(dir,e.name); if(e.isFile())result.push(p);else if(e.isDirectory()&&n>0&&!['node_modules','.git','vendor','target','.cache'].includes(e.name))visit(p,n-1);}}
  visit(root,depth);return result;
}
function roots(config) {return (Array.isArray(config.roots)?config.roots:[path.join(HOME,'code')]).slice(0,32).map(expand);}
function repoPaths(config) {
  const found=new Set(); let count=0;
  function visit(dir,depth){if(++count>3000||found.size>=100)return;let es;try{es=fs.readdirSync(dir,{withFileTypes:true});}catch{return;}
    if(es.some(e=>e.name==='.git')){found.add(dir);return;} if(depth<=0)return;
    for(const e of es)if(e.isDirectory()&&!e.isSymbolicLink()&&!e.name.startsWith('.')&&!['node_modules','vendor','target'].includes(e.name))visit(path.join(dir,e.name),depth-1);}
  for(const r of roots(config))visit(r,Math.min(6,Math.max(0,Number(config.depth)||3)));
  return [...found];
}
async function git(cwd,args) {return (await run(['git','-C',cwd,...args])).out.trimEnd();}
function dirtyCount(text){const records=text.split('\0');let count=0;for(let i=0;i<records.length;i++){const r=records[i];if(!r)continue;count++;if(r[0]==='R'||r[0]==='C'||r[1]==='R'||r[1]==='C')i++;}return count;}
async function gitScan(config) {
  const rows=[];for(const cwd of repoPaths(config)){try{
    const status=await git(cwd,['status','--porcelain=v1','-z']);const branch=await git(cwd,['branch','--show-current']);
    let ahead=null,behind=null;try{[behind,ahead]=(await git(cwd,['rev-list','--left-right','--count','@{upstream}...HEAD'])).split(/\s+/).map(Number);}catch{}
    let remote='';try{remote=await git(cwd,['remote','get-url','origin']);}catch{}
    const m=remote.match(/(?:@|\/\/)([^/:]+)[:/]([^/]+)\/(.+?)(?:\.git)?$/);
    rows.push({path:cwd,branch,dirty:dirtyCount(status),ahead,behind,lastCommit:Number(await git(cwd,['log','-1','--format=%ct'])),remote:m?{host:m[1],owner:m[2],name:m[3]}:null});
  }catch(e){rows.push({path:cwd,error:e.message});}}return rows;
}
function proc(pid,root='/proc') {
  try {const dir=path.join(root,String(pid));if(fs.statSync(dir).uid!==process.getuid())return null;
    const s=fs.readFileSync(path.join(dir,'stat'),'utf8'); const fields=s.slice(s.lastIndexOf(')')+2).split(' ');
    return {pid:Number(pid),ppid:Number(fields[1]),pgrp:Number(fields[2]),tpgid:Number(fields[5]),ticks:Number(fields[11])+Number(fields[12]),start:fields[19],exe:fs.readlinkSync(path.join(dir,'exe')),cwd:fs.readlinkSync(path.join(dir,'cwd')),argv:fs.readFileSync(path.join(dir,'cmdline'),'utf8').split('\0').filter(Boolean)};
  } catch{return null;}
}
function processes() {return fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x)).slice(0,20000).map(p=>proc(p)).filter(Boolean);}
function ancestors(p,all) {const result=[],seen=new Set();const map=new Map(all.map(x=>[x.pid,x]));while(p&&!seen.has(p.pid)&&result.length<64){result.push(p.pid);seen.add(p.pid);p=map.get(p.ppid);}return result;}
function quote(s) {if(/[\x00-\x1f\x7f]/.test(String(s)))throw new Error('Control characters not accepted in commands');return "'"+String(s).replace(/'/g,"'\\''")+"'";}
function terminalArgs(terminal,cwd,argv) {
  const base=path.basename(terminal);if(!['alacritty','ghostty','kitty'].includes(base))throw new Error('Supported terminals: alacritty, ghostty, kitty');
  const staged=argv.map(quote).join(' ');
  // read -e leaves the command editable; no command is executed before Enter.
  const script='printf "Review command; Enter runs it, Ctrl-C cancels.\\n"; IFS= read -r -e -i "$1" -p "$ " cmd && eval "$cmd"; exec bash --noprofile --norc -i';
  return [terminal,...(base==='kitty'?['--directory',cwd]:base==='ghostty'?['--working-directory='+cwd]:['--working-directory',cwd]),'-e','bash','--noprofile','--norc','-c',script,'omq-term',staged];
}
function which(cmd) {return (process.env.PATH||'').split(path.delimiter).map(p=>path.join(p,cmd)).find(p=>{try{fs.accessSync(p,fs.constants.X_OK);return true;}catch{return false;}});}
function terminal(cwd,argv=[]) {
  const term=process.env.TERMINAL || ['alacritty','ghostty','kitty'].find(which);if(!term)throw new Error('No supported terminal installed');
  const args=terminalArgs(term,fs.realpathSync(cwd),argv);
  return new Promise((resolve,reject)=>{const child=spawn(args[0],args.slice(1),{detached:true,stdio:'ignore'});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve({ok:true,staged:argv});});});
}
function foregroundCwd(pid, all=processes()) {
  const descendants=all.filter(p=>ancestors(p,all).includes(Number(pid)));
  const foreground=descendants.filter(p=>p.pgrp===p.tpgid).sort((a,b)=>ancestors(b,all).length-ancestors(a,all).length)[0];
  return foreground?.cwd||all.find(p=>p.pid===Number(pid))?.cwd||null;
}
async function clients() {return JSON.parse((await run(['hyprctl','-j','clients'])).out);}
function row(id,title,detail,extra={}) {return {id,title,detail,group:'',reliability:'observed',...extra};}
function snapshot(rows,summary,extra={}) {return {status:rows.length?'ready':'empty',rows,summary,severity:'ok',at:Date.now(),...extra};}
module.exports={fs,path,HOME,configRoot,stateRoot,run,read,json,atomic,append,events,cfg,state,expand,exists,walk,roots,repoPaths,git,gitScan,dirtyCount,proc,processes,ancestors,foregroundCwd,quote,terminalArgs,terminal,which,clients,row,snapshot};
