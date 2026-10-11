import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const services=JSON.parse(await readFile(new URL('../src/services.json',import.meta.url),'utf8'));
const serviceNames=new Map([...services.map(s=>[s.id,s.name]),['not-sure','Not sure yet']]);
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const fail=(status,message,errors)=>json(status,{accepted:false,message,...(errors?{errors}:{})});
export function validateEnquiry(input){
 const errors={};
 if(!input||typeof input!=='object'||Array.isArray(input))return {errors:{description:'Enter your project details.'}};
 const limits={name:120,email:254,company:160,description:6000};const value={};
 for(const [key,max] of Object.entries(limits)){
  const raw=input[key];value[key]=typeof raw==='string'?raw.trim():'';
  if(!value[key]||value[key].length>max)errors[key]=`Enter ${key==='description'?'a project description':'your '+key} (up to ${max} characters).`;
 }
 if(!/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(value.email))errors.email='Enter a valid email address.';
 if(value.description.length<20)errors.description='Add at least 20 characters about your project.';
 for(const key of ['name','company'])if(/[\x00-\x1f\x7f]/.test(value[key]))errors[key]='Use plain text without line breaks.';
 if(!Array.isArray(input.services)||!input.services.length||input.services.length>6||input.services.some(s=>typeof s!=='string'||!serviceNames.has(s)))errors.services='Choose at least one of the listed services, or “Not sure yet”.';
 value.services=Array.isArray(input.services)?[...new Set(input.services)]:[];
 return {value,errors};
}
export async function handleEnquiry(request,env=process.env,send=fetch){
 if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers:{Allow:'POST'}});
 const origin=request.headers.get('origin');
 if(origin){
  const expected=new URL(env.SITE_URL||request.url).origin;
  if(origin!==expected)return fail(403,'This enquiry must be submitted from the Nuvrix website.');
 }
 const type=request.headers.get('content-type')?.split(';')[0].trim();
 if(!['application/json','application/x-www-form-urlencoded'].includes(type))return fail(415,'Unsupported submission format.');
 let input;
 try{
  const text=await request.text();if(Buffer.byteLength(text)>24000)return fail(413,'The enquiry is too long. Please shorten your description.');
  if(type==='application/json')input=JSON.parse(text);
  else{const fields=new URLSearchParams(text);input=Object.fromEntries(fields);input.services=fields.getAll('services');}
 }catch{return fail(400,'The enquiry could not be read. Please try again.');}
 if(input?.website)return fail(400,'The enquiry could not be accepted. Please check your details.');
 const {value,errors}=validateEnquiry(input);
 if(Object.keys(errors).length)return fail(422,'Please check the highlighted fields.',errors);
 if(!env.RESEND_API_KEY||!env.ENQUIRY_FROM_EMAIL||!env.ENQUIRY_TO_EMAIL)return fail(503,'The enquiry form is temporarily unavailable. Your enquiry has not been sent. Please try again later or email info@nuvrixconnect.com.');
 const requestId=typeof input.requestId==='string'&&/^[a-f0-9-]{36}$/i.test(input.requestId)?input.requestId:randomUUID();
 try{
  const response=await send('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`nuvrix-enquiry-${requestId}`},body:JSON.stringify({from:env.ENQUIRY_FROM_EMAIL,to:[env.ENQUIRY_TO_EMAIL],reply_to:value.email,subject:`Nuvrix enquiry — ${value.company}`,text:`Name: ${value.name}\nEmail: ${value.email}\nCompany: ${value.company}\nServices: ${value.services.map(id=>serviceNames.get(id)).join(', ')}\n\nProject description:\n${value.description}`}),signal:AbortSignal.timeout(12000)});
  const receipt=await response.json();
  if(!response.ok||typeof receipt.id!=='string'||!receipt.id)return fail(502,'Your enquiry could not be accepted. Please try again or email info@nuvrixconnect.com.');
  return json(200,{accepted:true});
 }catch{return fail(502,'We couldn’t confirm whether your enquiry was accepted. Please retry or email info@nuvrixconnect.com.');}
}

const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function browserResponse(request,response){
 const accept=request.headers.get('accept')||'';
 if(!accept.includes('text/html')||accept.includes('application/json')||!response.headers.get('content-type')?.includes('application/json'))return response;
 const data=await response.json();const title=data.accepted?'Enquiry accepted':'Enquiry not confirmed';
 return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Nuvrix Connect</title><link rel="stylesheet" href="/styles.css"></head><body><main class="page-hero shell"><p class="eyebrow">Nuvrix Connect</p><h1>${title}</h1><p class="page-lede">${escapeHTML(data.accepted?'Thank you for telling us about your sales setup. Your enquiry has been accepted.':data.message)}</p>${data.errors?'<ul class="scope-list">'+Object.values(data.errors).map(e=>'<li>'+escapeHTML(e)+'</li>').join('')+'</ul>':''}<div class="button-row"><a class="button" href="${data.accepted?'/':'/contact'}">${data.accepted?'Return to homepage':'Return to the enquiry form'}</a></div></main></body></html>`,{status:response.status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
