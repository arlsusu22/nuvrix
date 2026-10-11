import {handleEnquiry,browserResponse} from '../lib/enquiry.mjs';
// Best-effort per-instance limit; use Vercel Firewall for a shared production limit.
const attempts=new Map();
export default {
 async fetch(request){
  if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers:{Allow:'POST'}});
  const now=Date.now();
  for(const [ip,entry] of attempts)if(entry.until<=now)attempts.delete(ip);
  const ip=request.headers.get('x-vercel-forwarded-for')||'unknown';
  const entry=attempts.get(ip)||{count:0,until:now+600000};
  if(entry.count>=5)return new Response(JSON.stringify({accepted:false,message:'Too many attempts. Please wait a few minutes before trying again.'}),{status:429,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Retry-After':String(Math.ceil((entry.until-now)/1000))}});
  entry.count++;attempts.set(ip,entry);
  return browserResponse(request,await handleEnquiry(request));
 }
};
