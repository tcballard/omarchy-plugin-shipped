'use strict';const C=require('./lib/js/core.cjs');const M=require('./Model.js');
async function collect(config){const week=C.json(C.state('shipped'),{week:false}).week;const since=M.since(Date.now(),week,config.weekStart);const rows=[],errors=[];
 for(const repo of C.repoPaths(config)){try{let emails=config.authorEmails;if(!Array.isArray(emails)||!emails.length)emails=[await C.git(repo,['config','user.email'])];
 const raw=await C.git(repo,['log','--since=@'+since,'--format=%H%x00%ae%x00%s%x00%B%x00%x1e']);
 for(const part of raw.split('\x1e')){const [sha,email,subject,body]=part.trimStart().split('\0');if(!sha||!emails.includes(email)||(config.excludeCoauthored&&/Co-Authored-By:/i.test(body)))continue;
 const stats=M.countStats(await C.git(repo,['show','--format=','--numstat',sha]));rows.push(C.row(repo+':'+sha,subject,C.path.basename(repo)+' · +'+stats.added+' / -'+stats.removed,{path:repo,sha,group:C.path.basename(repo),...stats}));}}
 catch(e){errors.push(C.path.basename(repo)+': '+e.message);}}
 let merged=null,reviewCount=null,remoteError='';if(config.remote===true){const cacheFile=C.state('shipped','remote.json');let cache=C.json(cacheFile,{});if(!cache.at||Date.now()-cache.at>600000||cache.since!==since){try{
 const date=new Date(since*1000).toISOString().slice(0,10);
 const fetched=JSON.parse((await C.run(['gh','search','prs','--author=@me','--merged','--merged-at=>='+date,'--limit=100','--json','title,url,repository,number,closedAt'],{timeout:12000})).out);
 const prs=fetched.filter(p=>Date.parse(p.closedAt)>=since*1000);
 const reviews=JSON.parse((await C.run(['gh','search','prs','--review-requested=@me','--state=open','--limit=100','--json','number'],{timeout:12000})).out);
 cache={at:Date.now(),since,prs,reviewCount:reviews.length,truncated:fetched.length===100||reviews.length===100};C.atomic(cacheFile,cache);
 }catch(e){remoteError=e.message;}}
 if(cache.since===since){merged=cache.prs.length;reviewCount=cache.reviewCount;for(const p of cache.prs)rows.push(C.row(p.url,p.title,'Merged PR · '+p.repository.nameWithOwner,{url:p.url,kind:'pr'}));}}
 const commits=rows.filter(x=>x.kind!=='pr').length;
 return C.snapshot(rows,'↑ '+commits+(merged===null?'':' · ⇄ '+merged),{week,commits,merged,reviewCount,remoteError,errors,status:errors.length||remoteError?'partial':rows.length?'ready':'empty'});}
async function action(config,id,key){if(key==='w'){const old=C.json(C.state('shipped'),{week:false});C.atomic(C.state('shipped'),{week:!old.week});return;}
 const r=(await collect(config)).rows.find(x=>x.id===id);if(!r)throw new Error('Commit no longer listed');
 if(r.path)return C.terminal(r.path,[]);if(r.url&&/^https:\/\/github\.com\//.test(r.url))return C.run(['xdg-open',r.url]);throw new Error('Invalid repository');}
module.exports={collect,action};
