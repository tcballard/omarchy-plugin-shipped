'use strict';
const net=require('node:net'),path=require('node:path');
function connect(onEvent){
 const runtime=process.env.XDG_RUNTIME_DIR,signature=process.env.HYPRLAND_INSTANCE_SIGNATURE;
 if(!runtime||!signature||signature.includes('/'))throw new Error('Hyprland session unavailable');
 const socket=net.createConnection(path.join(runtime,'hypr',signature,'.socket2.sock'));let buffer='';
 socket.on('data',chunk=>{buffer+=chunk;if(Buffer.byteLength(buffer)>65536){socket.destroy(new Error('Hyprland frame exceeds limit'));return;}
 let nl;while((nl=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,nl);buffer=buffer.slice(nl+1);const sep=line.indexOf('>>');if(sep<0)continue;onEvent({event:line.slice(0,sep),data:line.slice(sep+2),at:Date.now()});}});
 return socket;
}
if(require.main===module){try{const socket=connect(e=>process.stdout.write(JSON.stringify(e)+'\n'));socket.on('error',e=>{console.error(e.message);process.exitCode=1;});}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={connect};
