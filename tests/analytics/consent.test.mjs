import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../assets/site-analytics.js',import.meta.url),'utf8');
function setup(saved=null,host='kestrelridgehealth.com') {
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
 vm.runInNewContext(source,{document,window,localStorage,location:{hostname:host,origin:'https://'+host,pathname:'/public-guide/'},Date,URL});
 return{head,nodes,window,listeners,choice:v=>nodes.find(n=>n.className==='krh-analytics-panel').listeners.click({target:{dataset:{choice:v}}})};
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
test('contact click is separate from an inquiry and stops after revocation',()=>{
 const f=setup();f.choice('yes');const event={target:{closest:()=>({href:'https://kestrelridgehealth.com/contact/?email=private'})}};f.listeners.click(event);const events=f.window.dataLayer.map(x=>Array.from(x)).filter(x=>x[0]==='event');assert.equal(events[0][1],'consultation_link_click');assert.deepEqual(JSON.parse(JSON.stringify(events[0][2])),{source_page:'/public-guide/',link_path:'/contact/'});f.choice('no');const before=f.window.dataLayer.length;f.listeners.click(event);assert.equal(f.window.dataLayer.length,before);
});
