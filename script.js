document.documentElement.classList.add('js');
const menuButton=document.querySelector('.menu-toggle');
const navigation=document.querySelector('.main-navigation');
const serviceMenu=document.querySelector('.service-menu');
function closeNavigation(){navigation?.classList.remove('is-open');menuButton?.setAttribute('aria-expanded','false');if(serviceMenu)serviceMenu.open=false;}
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));navigation.classList.toggle('is-open',open);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(serviceMenu?.open){serviceMenu.open=false;serviceMenu.querySelector('summary').focus();}else if(navigation?.classList.contains('is-open')){closeNavigation();menuButton.focus();}}});
document.addEventListener('click',event=>{if(serviceMenu?.open&&!serviceMenu.contains(event.target))serviceMenu.open=false;});
navigation?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeNavigation));
const form=document.querySelector('#enquiry-form');
if(form){
 form.noValidate=true;
 const status=document.querySelector('#form-status');
 const submit=form.querySelector('[type="submit"]');
 const serviceInputs=[...form.querySelectorAll('[name="services"]')];
 const params=new URLSearchParams(location.search);
 const selected=params.getAll('service');
 serviceInputs.forEach(input=>{if(selected.includes(input.value))input.checked=true;});
 let requestId=crypto.randomUUID();
 let payloadSignature='';
 function clearErrors(){form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));form.querySelectorAll('.field-error').forEach(el=>el.textContent='');}
 function fieldError(name,message){const field=form.elements[name];const error=document.getElementById(name+'-error');if(error)error.textContent=message;if(name==='services'){serviceInputs.forEach(input=>input.setAttribute('aria-invalid','true'));}else if(field){field.setAttribute('aria-invalid','true');const existing=field.getAttribute('aria-describedby')||'';if(!existing.includes(name+'-error'))field.setAttribute('aria-describedby',(existing+' '+name+'-error').trim());}}
 function setStatus(message,type){status.className='form-status '+type;status.textContent=message;}
 form.addEventListener('submit',async event=>{
  event.preventDefault();clearErrors();setStatus('','');
  const payload={name:form.elements.name.value.trim(),email:form.elements.email.value.trim(),company:form.elements.company.value.trim(),services:serviceInputs.filter(input=>input.checked).map(input=>input.value),description:form.elements.description.value.trim(),website:form.elements.website.value};
  const errors={};
  if(!payload.name)errors.name='Enter your name.';
  if(!payload.email||!form.elements.email.validity.valid)errors.email='Enter a valid email address.';
  if(!payload.company)errors.company='Enter your company name.';
  if(!payload.services.length)errors.services='Choose at least one service, or select “Not sure yet”.';
  if(payload.description.length<20)errors.description='Add at least 20 characters about your project.';
  if(Object.keys(errors).length){Object.entries(errors).forEach(([key,value])=>fieldError(key,value));setStatus('Please check the highlighted fields.','error');form.querySelector('[aria-invalid="true"]')?.focus();return;}
  const signature=JSON.stringify(payload);if(signature!==payloadSignature){requestId=crypto.randomUUID();payloadSignature=signature;}
  payload.requestId=requestId;
  submit.disabled=true;form.setAttribute('aria-busy','true');submit.textContent='Sending enquiry…';setStatus('Sending your enquiry…','loading');
  try{
   const response=await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
   const result=await response.json();
   if(!response.ok||result.accepted!==true){if(result.errors)Object.entries(result.errors).forEach(([key,value])=>fieldError(key,value));throw new Error(result.message||'Your enquiry was not accepted. Please try again.');}
   setStatus('Your enquiry has been accepted. Thank you for telling us about your sales setup.','success');form.reset();requestId=crypto.randomUUID();payloadSignature='';status.focus();
  }catch(error){const known=error.name==='AbortError'||error.name==='TimeoutError';setStatus(known?'We couldn’t confirm whether your enquiry was accepted. Your details are still here; you can try again.':error instanceof TypeError?'We couldn’t connect. Your details are still here; please try again.':error.message||'Your enquiry could not be sent. Please try again.','error');status.focus();}
  finally{submit.disabled=false;form.removeAttribute('aria-busy');submit.innerHTML='Send enquiry <span aria-hidden="true">↗</span>';}
 });
}

// Illustrations stay readable without JavaScript and honour the visitor's motion setting.
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
const illustrations=[...document.querySelectorAll('[data-service-art]')];
const illustrationObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>{
 for(const entry of entries)entry.target.classList.toggle('art-playing',entry.isIntersecting&&!motionPreference.matches);
},{threshold:.15}):null;
function updateIllustrationMotion(){
 for(const illustration of illustrations){
  illustration.classList.remove('art-playing');
  if(illustrationObserver){illustrationObserver.unobserve(illustration);illustrationObserver.observe(illustration);}
  else if(!motionPreference.matches)illustration.classList.add('art-playing');
 }
}
for(const illustration of illustrations){
 const toggle=illustration.querySelector('.animation-toggle');
 toggle.addEventListener('click',()=>{
  const paused=illustration.classList.toggle('art-paused');
  toggle.setAttribute('aria-pressed',String(paused));
  toggle.setAttribute('aria-label',paused?'Play illustration animation':'Pause illustration animation');
  toggle.textContent=paused?'Play animation':'Pause animation';
 });
}
motionPreference.addEventListener('change',updateIllustrationMotion);
updateIllustrationMotion();
