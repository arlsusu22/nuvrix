import test from 'node:test';
import assert from 'node:assert/strict';
import {handleEnquiry,validateEnquiry,browserResponse} from '../lib/enquiry.mjs';
const payload={name:'Test Person',email:'test@example.com',company:'Test Company',services:['outbound-automation'],description:'We need to connect our CRM and research workflow.',requestId:'12345678-1234-1234-1234-123456789abc'};
const env={RESEND_API_KEY:'test-key',ENQUIRY_FROM_EMAIL:'test@example.com',ENQUIRY_TO_EMAIL:'owner@example.com',SITE_URL:'https://www.nuvrixconnect.com'};
const req=(value=payload,headers={})=>new Request('https://www.nuvrixconnect.com/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(value)});
test('all invalid fields are rejected before delivery',async()=>{const r=await handleEnquiry(req({}),env,()=>assert.fail('must not send'));assert.equal(r.status,422);assert.deepEqual(Object.keys((await r.json()).errors).sort(),['company','description','email','name','services']);});
test('unknown services and oversized input are rejected',()=>{assert.ok(validateEnquiry({...payload,services:['invented']}).errors.services);assert.ok(validateEnquiry({...payload,name:'x'.repeat(121)}).errors.name);assert.ok(validateEnquiry({...payload,email:'a\nb@example.com'}).errors.email);});
test('unconfigured backend never reports success',async()=>{const r=await handleEnquiry(req(),{},()=>assert.fail('must not send'));assert.equal(r.status,503);assert.equal((await r.json()).accepted,false);});
test('provider acceptance is required; receipt is not exposed',async()=>{let options;const r=await handleEnquiry(req(),env,async(url,opts)=>{assert.equal(url,'https://api.resend.com/emails');options=opts;return Response.json({id:'provider-receipt'})});assert.equal(r.status,200);assert.deepEqual(await r.json(),{accepted:true});const body=JSON.parse(options.body);assert.equal(body.reply_to,payload.email);assert.equal(body.to[0],env.ENQUIRY_TO_EMAIL);assert.match(body.text,/Outbound Automation/);assert.equal(options.headers['Idempotency-Key'],'nuvrix-enquiry-'+payload.requestId);});
test('provider rejection or malformed success never reports success',async()=>{for(const [body,status] of [[{message:'rejected'},403],[{},200]]){const r=await handleEnquiry(req(),env,async()=>Response.json(body,{status}));assert.equal(r.status,502);assert.equal((await r.json()).accepted,false);}});
test('timeouts are reported as unconfirmed',async()=>{const r=await handleEnquiry(req(),env,async()=>{throw new Error('timeout')});assert.equal(r.status,502);assert.match((await r.json()).message,/confirm/);});
test('honeypot and cross-origin submissions do not send',async()=>{for(const request of [req({...payload,website:'spam'}),req(payload,{Origin:'https://other.example'})]){const r=await handleEnquiry(request,env,()=>assert.fail('must not send'));assert.ok(r.status>=400);}});
test('multiple selections and no-JS urlencoded submissions work',async()=>{const params=new URLSearchParams({...payload,services:'outbound-automation'});params.append('services','crm-sales-operations');const request=new Request('https://www.nuvrixconnect.com/api/enquiries',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'text/html'},body:params});const result=await handleEnquiry(request,env,async(_,opts)=>{assert.match(JSON.parse(opts.body).text,/CRM Implementation/);return Response.json({id:'test'})});const html=await browserResponse(request,result);assert.equal(html.status,200);assert.match(await html.text(),/Enquiry accepted/);});
test('oversized request body and invalid JSON are rejected',async()=>{assert.equal((await handleEnquiry(req({...payload,description:'x'.repeat(25000)}),env)).status,413);const bad=new Request('https://www.nuvrixconnect.com/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal((await handleEnquiry(bad,env)).status,400);});

test('Vercel entry point handles request format and rate-limit failure',async()=>{
 const endpoint=(await import('../api/enquiries.mjs')).default;
 const get=await endpoint.fetch(new Request('https://www.nuvrixconnect.com/api/enquiries'));
 assert.equal(get.status,405);
 for(let i=0;i<5;i++){
  const r=await endpoint.fetch(req({}, {'x-vercel-forwarded-for':'192.0.2.10'}));
  assert.equal(r.status,422);
 }
 const limited=await endpoint.fetch(req({}, {'x-vercel-forwarded-for':'192.0.2.10'}));
 assert.equal(limited.status,429);assert.equal((await limited.json()).accepted,false);
});

test('team setup and every displayed service can be selected together',async()=>{
 const {readFile}=await import('node:fs/promises');
 const services=JSON.parse(await readFile(new URL('../src/services.json',import.meta.url),'utf8'));
 const selected=[...services.map(s=>s.id),'not-sure'];
 let sent;
 const r=await handleEnquiry(req({...payload,services:selected}),env,async(_,opts)=>{
  sent=JSON.parse(opts.body).text;return Response.json({id:'test-team-enquiry'});
 });
 assert.equal(r.status,200);
 assert.match(sent,/Outbound Team Setup/);
 for(const s of services)assert.ok(sent.includes(s.name));
});
