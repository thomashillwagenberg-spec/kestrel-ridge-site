import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../assets/site-analytics.js',import.meta.url),'utf8');
function setup(saved=null,host='kestrelridgehealth.com',pathname='/public-guide/',search='',webdriver=false) {
 const session=new Map();
 const nodes=[],head=[],listeners={},cookies=[];
 class Node {
  constructor(tag){this.tag=tag;this.listeners={};}
  setAttribute(){}
  addEventListener(k,f){this.listeners[k]=f;}
  appendChild(n){nodes.push(n);}
  querySelector(){return{focus(){}};}
  focus(){}
 }
 const document={head:{appendChild:n=>head.push(n)},body:new Node('body'),referrer:'https://www.google.com/search?q=private-query',createElement:t=>new Node(t),addEventListener:(k,f)=>listeners[k]=f};
 Object.defineProperty(document,'cookie',{get:()=>cookies.join(';'),set:v=>cookies.push(v)});
 const localStorage={getItem:()=>saved,setItem:(_,v)=>{saved=v;}};
 const window={addEventListener:(k,f)=>listeners[k]=f};
 const sessionStorage={getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)};
 const context={document,window,localStorage,sessionStorage,navigator:{webdriver},location:{hostname:host,origin:'https://'+host,pathname,search},Date,URL,URLSearchParams,JSON};
 const run=()=>vm.runInNewContext(source,context);
 run();
 return{head,nodes,window,listeners,run,session,choice:v=>nodes.find(n=>n.className==='krh-analytics-panel').listeners.click({target:{dataset:{choice:v}}})};
}
test('no Google request before an explicit allow, and declining does not load Google',()=>{
 const f=setup();assert.equal(f.head.filter(n=>n.tag==='script').length,0);f.choice('no');assert.equal(f.head.filter(n=>n.tag==='script').length,0);assert.equal(f.window['ga-disable-G-7X0ZX70KQK'],true);
});
test('allow loads only the verified property and excludes query/referrer details',()=>{
 const f=setup();f.choice('yes');assert.equal(f.head.filter(n=>n.tag==='script').length,1);assert.match(f.head.find(n=>n.tag==='script').src,/G-7X0ZX70KQK$/);
 const data=f.window.dataLayer.map(x=>Array.from(x));const config=data.find(x=>x[0]==='config')[2];assert.equal(config.page_location,'https://kestrelridgehealth.com/public-guide/');assert.equal(config.page_referrer,'https://www.google.com');assert.equal(config.allow_google_signals,false);assert.equal(config.allow_ad_personalization_signals,false);assert.equal(data[0][2].ad_storage,'denied');
});
test('expired consent prompts again, and local previews never produce Analytics visits',()=>{
 const f=setup(JSON.stringify({value:'yes',expires:1}));assert.equal(f.head.filter(n=>n.tag==='script').length,0);const local=setup(null,'127.0.0.1');local.choice('yes');assert.equal(local.head.filter(n=>n.tag==='script').length,0);
});
test('contact click is separate from an inquiry: remembered for /contact/ arrival, no click-time hit, stops after revocation',()=>{
 const f=setup();f.choice('yes');const event={target:{closest:()=>({href:'https://kestrelridgehealth.com/contact/?email=private'})}};f.listeners.click(event);
 assert.equal(f.window.dataLayer.map(x=>Array.from(x)).filter(x=>x[0]==='event').length,0);
 const p=JSON.parse(f.session.get('krh-cta-pending-v1'));assert.equal(p.source_page,'/public-guide/');assert.ok(!JSON.stringify(p).includes('private'));
 f.session.clear();f.choice('no');f.listeners.click(event);assert.equal(f.session.size,0);
});
test('automation browsers (navigator.webdriver) never record a CTA',()=>{
 const f=setup(null,'kestrelridgehealth.com','/public-guide/','',true);f.choice('yes');f.listeners.click({target:{closest:()=>({href:'https://kestrelridgehealth.com/contact/'})}});assert.equal(f.session.size,0);
});
test('campaign tags survive in page_location; free text, emails and phone numbers do not',()=>{
 const f=setup(null,'kestrelridgehealth.com','/public-guide/','?utm_source=linkedin&utm_medium=social&utm_campaign=li-organic-2026-11&utm_content=pat@x.com&utm_term=216-555-0100&drivers=private');f.choice('yes');
 const config=f.window.dataLayer.map(x=>Array.from(x)).find(x=>x[0]==='config')[2];
 assert.equal(config.page_location,'https://kestrelridgehealth.com/public-guide/?utm_source=linkedin&utm_medium=social&utm_campaign=li-organic-2026-11');
});
test('directory and index aliases share the same article and contact analytics paths',()=>{
 const f=setup(null,'kestrelridgehealth.com','/public-guide/index.html');
 f.choice('yes');
 f.listeners.click({target:{closest:()=>({href:'https://kestrelridgehealth.com/contact/index.html?private=1'})}});
 const config=f.window.dataLayer.map(x=>Array.from(x)).find(x=>x[0]==='config')[2];
 assert.equal(config.page_location,'https://kestrelridgehealth.com/public-guide/');
 assert.equal(JSON.parse(f.session.get('krh-cta-pending-v1')).source_page,'/public-guide/');
});
test('duplicate static initialization cannot load a second tag or consent control',()=>{
 const f=setup(JSON.stringify({value:'yes',expires:Date.now()+60000}));
 f.run();
 assert.equal(f.head.filter(n=>n.tag==='script').length,1);
 assert.equal(f.nodes.filter(n=>n.className==='krh-analytics-panel').length,1);
 assert.equal(f.window.dataLayer.filter(x=>x[0]==='config').length,1);
});
