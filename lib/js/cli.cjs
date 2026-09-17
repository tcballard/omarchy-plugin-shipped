'use strict';
const C=require('./core.cjs');
async function main(name,backend,dir){
 const [verb='snapshot',id='',key='',...rest]=process.argv.slice(2);const config=C.cfg(name);
 if(verb==='snapshot')return backend.collect(config);
 if(verb==='action')return backend.action(config,id,key);
 if(verb==='apply'&&backend.apply)return backend.apply(config,[id,key,...rest]);
 if(verb==='stop'&&backend.stop)return backend.stop(id,key);
 if(verb==='block'&&backend.block)return backend.block(id,key);
 if(verb==='hook'&&backend.hook){
   if(name==='kamal'){await backend.hook(C.path.basename(id));return {ok:true};}
   let input='';for await(const b of process.stdin){input+=b;if(Buffer.byteLength(input)>65536)throw new Error('Hook input exceeds limit');}backend.hook(JSON.parse(input));return {ok:true};
 }
 if(verb==='watch-events'&&name==='kamal'){
   const folder=C.path.dirname(C.state(name,'events.jsonl'));C.fs.mkdirSync(folder,{recursive:true,mode:0o700});
   const watcher=C.fs.watch(folder,(event,file)=>{if(String(file).startsWith('events.jsonl'))process.stdout.write('{"changed":true}\n');});
   await new Promise((resolve,reject)=>{watcher.once('error',reject);watcher.once('close',resolve);});return {disconnected:true};
 }
 if(verb==='watch'&&backend.event){
   let queue=Promise.resolve(),pending=0;const context={};
   const socket=require('./hyprevents.cjs').connect(event=>{
     if(pending>=64)return;pending++;
     queue=queue.then(()=>backend.event(C.cfg(name),event.event+'>>'+event.data,context))
       .then(changed=>{if(changed)process.stdout.write('{"changed":true}\n');})
       .catch(e=>process.stderr.write(e.message.slice(0,200)+'\n')).finally(()=>pending--);
   });
   await new Promise((resolve,reject)=>{socket.once('error',reject);socket.once('close',resolve);});return {disconnected:true};
 }
 throw new Error('Unknown command: '+verb);
}
function entry(name,backend,dir){main(name,backend,dir).then(result=>{const line=JSON.stringify(result||{ok:true});if(Buffer.byteLength(line)>1048576)throw new Error('Snapshot exceeds 1 MiB; narrow configured roots');process.stdout.write(line+'\n');}).catch(e=>{process.stdout.write(JSON.stringify({status:'failed',error:e.message.slice(0,300),rows:[],summary:'Unavailable',severity:'warn'})+'\n');process.exitCode=1;});}
module.exports={entry,main};
