import {readFileSync} from 'node:fs';
const label=(x,y,text,cls='art-label')=>`<text x="${x}" y="${y}" class="${cls}">${text}</text>`;
const line=(d,cls='art-wire')=>`${cls==='art-flow'?`<path d="${d}" class="art-wire"/>`:''}<path d="${d}" class="${cls}"/>`;
const panel=(x,y,w,h,body,cls='')=>`<g class="art-panel ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>${body}</g>`;
const check=(x,y)=>`<g class="art-check"><circle cx="${x}" cy="${y}" r="9"/>${line(`m${x-4} ${y} 3 3 5-6`)}</g>`;
const person=(x,y)=>`<g class="art-person"><circle cx="${x}" cy="${y-7}" r="7"/>${line(`M${x-12} ${y+14}v-3a12 12 0 0 1 24 0v3`)}</g>`;
const colors={clay:'#f2b153',hubspot:'#ff6d3b',salesforce:'#08a3de',n8n:'#e95374',openai:'#263b32',slack:'#623767'};
const mark=(id,x,y)=>id==='clay'?`<image href="/assets/logos/clay-icon.png" x="${x}" y="${y}" width="30" height="30"/>`:`<svg x="${x}" y="${y}" width="30" height="30" viewBox="0 0 24 24" fill="${colors[id]||'#263b32'}">${readFileSync(new URL(`../assets/logos/${id}.svg`,import.meta.url),'utf8').replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'').replace(/<title>.*?<\/title>/,'')}</svg>`;
const tool=(id,x,y,text)=>panel(x,y,128,66,mark(id,x+13,y+17)+label(x+52,y+38,text),'art-node');
const diagrams={
'outbound-stack-setup':{
 title:'Connecting your outbound tools',caption:'Research, outreach, and CRM connected around your process.',
 svg:line('M158 104H218Q238 104 238 128V153M158 266H218Q238 266 238 242V215M382 104H322Q302 104 302 128V153M382 266H322Q302 266 302 242V215')+line('M158 104H218Q238 104 238 128V153M302 215V242Q302 266 322 266H382','art-flow')+tool('clay',30,71,'Clay')+tool('openai',30,233,'OpenAI')+tool('hubspot',382,71,'HubSpot')+tool('salesforce',382,233,'Salesforce')+panel(188,152,164,68,label(225,181,'Your process','art-title')+label(228,204,'Rules &amp; ownership'),'art-hub')+label(30,58,'Research &amp; enrichment','art-small')+label(382,58,'CRM &amp; handovers','art-small')+label(171,349,'Configure · connect · test','art-foot')
},
'outbound-automation':{
 title:'An account moving through an approved workflow',caption:'Research is checked before approved records reach the CRM.',
 svg:line('M150 92H194M344 92H388M450 126V190Q450 214 424 214H340M200 214H151M80 247V280Q80 300 108 300H431')+line('M150 92H194M344 92H388M450 126V190Q450 214 424 214H340M200 214H151','art-flow')+panel(20,59,130,67,label(40,88,'Account','art-title')+label(40,109,'Agreed criteria'),'art-node')+panel(194,59,150,67,mark('openai',205,77)+label(247,88,'Research','art-title')+label(247,109,'Sources &amp; data'),'art-node art-node-b')+panel(388,59,132,67,mark('n8n',399,77)+label(442,88,'Checks','art-title')+label(442,109,'Rules'),'art-node art-node-c')+panel(200,180,140,67,person(222,211)+label(245,210,'Review','art-title')+label(245,231,'Your team'),'art-node art-node-d')+panel(20,180,131,67,mark('hubspot',30,198)+label(72,210,'CRM','art-title')+label(72,231,'Update'),'art-node art-node-e')+panel(330,278,190,45,check(348,300)+label(366,304,'Reply → stop follow-up'))+label(31,350,'Review points and stop rules are agreed with you.','art-foot')
},
'outbound-intelligence':{
 title:'Research with sources and context',caption:'Relevant findings retain their source, date, and reason for review.',
 svg:line('M146 90H190Q213 90 213 113V185M146 170H213M146 250H190Q213 250 213 227V185M251 185H293')+line('M146 90H190Q213 90 213 113V185H293M146 250H190Q213 250 213 227V185','art-flow')+['Company news','Project notices','Market updates'].map((t,i)=>panel(20,64+i*80,126,52,label(36,95+i*80,t),'art-node')).join('')+`<g class="art-search"><circle cx="230" cy="185" r="25"/>${line('m247 204 13 14')}<circle cx="230" cy="185" r="12"/></g>`+panel(293,88,226,218,label(311,118,'Research finding','art-title')+line('M311 133H501')+label(311,158,'Company &amp; development')+label(311,184,'Source link &amp; publication date')+label(311,210,'Match to your criteria')+line('M311 228H501')+check(321,254)+label(340,258,'Ready for team review'),'art-finding')+label(79,350,'A reason to investigate, with the evidence attached.','art-foot')
},
'crm-sales-operations':{
 title:'Organised records and sales handovers',caption:'Each stage has defined fields, ownership, and a next action.',
 svg:['New lead','Qualified','In progress'].map((t,i)=>panel(22+i*174,62,148,232,label(37+i*174,94,t,'art-title')+line(`M37 ${109}H${155+i*174}`).replace('M37 ',`M${37+i*174} `)+panel(34+i*174,129,124,63,label(46+i*174,153,'Account record')+label(46+i*174,176,'Owner assigned','art-small'),'art-record')+panel(34+i*174,207,124,60,label(46+i*174,232,'Next action')+label(46+i*174,252,'Follow-up task','art-small')))).join('')+line('M158 160H208M332 160H382','art-flow')+label(131,342,'Required fields · routing · reporting','art-foot')
},
'managed-outbound-operations':{
 title:'Ongoing checks and maintenance',caption:'Agreed checks feed into fixes, reviews, and documented updates.',
 svg:panel(24,63,277,244,label(45,96,'Routine checks','art-title')+['Workflow connections','Data quality','Research sources','Tool configuration'].map((t,i)=>`<g class="art-maintenance-check art-node-${i}">${check(48,132+i*45)}${label(67,136+i*45,t)}${i<3?line(`M44 ${150+i*45}H279`):''}</g>`).join(''))+line('M301 176H333Q349 176 349 149V116H368M349 176V249H368')+line('M301 176H333Q349 176 349 149V116H368','art-flow')+panel(368,85,151,64,label(387,111,'Fix &amp; document','art-title')+label(387,134,'Agreed changes'),'art-node')+panel(368,218,151,64,label(387,245,'Team review','art-title')+label(387,267,'Next priorities'),'art-node art-node-c')+label(124,350,'Maintain · review · improve','art-foot')
},
'outbound-team-setup':{
 title:'Building and preparing your outbound team',caption:'Roles, hiring, tools, and training before the handover.',
 svg:panel(171,26,198,55,label(199,49,'Your business','art-title')+label(199,68,'Roles &amp; hiring decisions'),'art-owner')+line('M270 81V107M89 137V122Q89 107 110 107H430Q451 107 451 122V137M270 107V137')+line('M89 216V242Q89 256 107 256H433Q451 256 451 242V216M270 216V290','art-flow')+['Research','Outreach','Team lead'].map((t,i)=>panel(22+i*181,137,134,79,person(48+i*181,176)+label(72+i*181,174,t,'art-title')+label(72+i*181,195,'Defined role','art-small'),'art-node '+['','art-node-b','art-node-c'][i])).join('')+panel(90,290,360,55,check(112,318)+label(132,313,'Tools &amp; playbooks')+label(132,332,'Training, ramp-up support, and handover'))
}
};
export function serviceArt(id){const d=diagrams[id];if(!d)throw new Error(`Missing service illustration: ${id}`);return `<figure class="service-art art-${id}" data-service-art><svg class="service-art-canvas" viewBox="0 0 540 390" role="img" aria-labelledby="art-title-${id} art-desc-${id}"><title id="art-title-${id}">${d.title}</title><desc id="art-desc-${id}">${d.caption} Illustrative process, not live customer data.</desc>${d.svg}</svg><figcaption><span>Illustrative process</span><button class="animation-toggle" type="button" aria-pressed="false" aria-label="Pause illustration animation">Pause animation</button></figcaption></figure>`}
