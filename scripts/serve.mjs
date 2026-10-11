import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {handleEnquiry,browserResponse} from '../lib/enquiry.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.woff2':'font/woff2'};
const redirects={'/about-us.html':'/#how-we-work','/pricing.html':'/contact','/run.html':'/services/managed-outbound-operations','/how-it-runs.html':'/services/managed-outbound-operations'};

export function createAppServer({env=process.env,send=fetch,publicRoot=path.join(root,'dist')}={}){
 const limits=new Map();
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");
  let url;try{url=new URL(req.url,'http://'+(req.headers.host||'localhost'));}catch{res.writeHead(400).end('Bad request');return;}
  if(url.pathname==='/api/enquiries'){
   res.setHeader('Cache-Control','no-store');
   const origin=req.headers.origin;
   if(origin&&!env.SITE_URL){try{if(new URL(origin).host!==url.host){res.writeHead(403,{'Content-Type':'application/json'}).end(JSON.stringify({accepted:false,message:'Please use the Nuvrix enquiry form.'}));return;}}catch{res.writeHead(403).end();return;}}
   const ip=env.TRUST_PROXY==='true'?String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',')[0].trim():req.socket.remoteAddress;
   const now=Date.now();for(const [key,entry] of limits)if(entry.until<=now)limits.delete(key);
   const limit=limits.get(ip)||{count:0,until:now+10*60*1000};
   if(req.method==='POST'){if(limit.count>=5){res.writeHead(429,{'Content-Type':'application/json','Retry-After':String(Math.ceil((limit.until-now)/1000))}).end(JSON.stringify({accepted:false,message:'Too many attempts. Please wait a few minutes before trying again.'}));return;}limit.count++;limits.set(ip,limit);}
   let length=0;const chunks=[];
   try{for await(const chunk of req){length+=chunk.length;if(length>24000){res.writeHead(413,{'Content-Type':'application/json'}).end(JSON.stringify({accepted:false,message:'The enquiry is too long. Please shorten it.'}));return;}chunks.push(chunk);}
    const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});
    const result=await browserResponse(request,await handleEnquiry(request,env,send));
    res.writeHead(result.status,Object.fromEntries(result.headers)).end(await result.text());
   }catch{if(!res.headersSent)res.writeHead(400,{'Content-Type':'application/json'}).end(JSON.stringify({accepted:false,message:'The enquiry could not be read. Please try again.'}));}
   return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'}).end('Method not allowed');return;}
  if(redirects[url.pathname]){res.writeHead(301,{Location:redirects[url.pathname]}).end();return;}
  try{
   const pathname=decodeURIComponent(url.pathname);let file=path.resolve(publicRoot,'.'+pathname);
   if(file!==publicRoot&&!file.startsWith(publicRoot+path.sep)){res.writeHead(403).end('Forbidden');return;}
   const info=await stat(file);if(info.isDirectory())file=path.join(file,'index.html');
   const ext=path.extname(file);if(!types[ext]){res.writeHead(404).end('Not found');return;}
   const content=await readFile(file);res.writeHead(200,{'Content-Type':types[ext],'Cache-Control':ext==='.html'?'no-cache':'public, max-age=3600'}).end(req.method==='HEAD'?undefined:content);
  }catch{const content=await readFile(path.join(publicRoot,'404.html')).catch(()=>Buffer.from('Page not found'));res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'}).end(req.method==='HEAD'?undefined:content);}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||8766);const host=process.env.HOST||'127.0.0.1';
 createAppServer().listen(port,host,()=>console.log(`Nuvrix Connect available at http://${host}:${port}`));
}
