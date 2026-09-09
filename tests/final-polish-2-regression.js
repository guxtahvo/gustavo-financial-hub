"use strict";
const fs=require("fs");const vm=require("vm");const crypto=require("crypto");const assert=require("assert");const path=require("path");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"app.js"),"utf8");
const withoutInit=source.replace(/\ninit\(\);\s*$/,"\n");
const hook=`\nObject.defineProperty(globalThis,"__gfhTest",{value:{setState(v){state=v;},snapshot(){return clone(state);},iconSvg,budgetCategoryHasHistory,deleteBudgetCategory,getBudget,setBudgetAmount,monthKey,addMonthsKey},writable:false});\n`;
const mapSource=fs.readFileSync(path.join(root,"world-map-data.js"),"utf8");
const mapSandbox={window:{}};vm.runInNewContext(mapSource,mapSandbox);
const context={window:mapSandbox.window,localStorage:{getItem(){return null;},setItem(){}},console,Intl,Date,JSON,Math,Number,String,Boolean,Object,Array,RegExp,parseInt,parseFloat,isFinite,setTimeout,clearTimeout,requestAnimationFrame:fn=>fn(),crypto:{randomUUID:()=>"test-id"}};
vm.runInNewContext(withoutInit+hook,context,{filename:path.join(root,"app.js")});
const api=context.__gfhTest;
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");

// SVG root cause: every generated icon now has a fixed 24x24 viewport and explicit line-art presentation.
const sample=api.iconSvg("i-wallet");
assert.ok(sample.includes('viewBox="0 0 24 24"'));
assert.ok(sample.includes('fill="none"'));
assert.ok(sample.includes('stroke="currentColor"'));
assert.ok(sample.includes('stroke-width="1.5"'));
assert.ok(/\.line-icon[\s\S]*fill:\s*none\s*!important/.test(css));
assert.ok(/\.line-icon[\s\S]*stroke:\s*currentColor\s*!important/.test(css));
const iconTags=[...html.matchAll(/<svg\b[^>]*(?:line-icon|action-icon|table-icon|transaction-line-icon|small-title-icon|more-icon|budget-edit-icon)[^>]*>/g)].map(m=>m[0]);
assert.ok(iconTags.length>20);
assert.ok(iconTags.every(t=>t.includes('viewBox="0 0 24 24"')),'some static local icon SVG has no explicit viewBox');
for(const m of html.matchAll(/<symbol\b[^>]*>/g)){const t=m[0];if(/id="i-/.test(t)&&!t.includes('id="i-plane"')){assert.ok(t.includes('fill="none"')&&t.includes('stroke="currentColor"'),`symbol missing line-art attrs: ${t}`);}}
console.log("LINE_ART_ROOT_CAUSE_FIX_PASS");

// Search suggestions must live directly under the search control, before the map.
const searchPos=html.indexOf('id="countrySearchInput"');
const resultPos=html.indexOf('id="countrySearchResults"');
const mapPos=html.indexOf('id="worldMap"');
assert.ok(searchPos>=0&&resultPos>searchPos&&resultPos<mapPos,'country search results are not before the map');
console.log("COUNTRY_SEARCH_PLACEMENT_PASS");

// Monthly budget history stays isolated.
let s=api.snapshot();s.profile.netMonthly=1448;s.salaryPlan={effectiveFrom:"2026-01",netMonthly:1448};s.salaryRecords=[];s.months={};s.transactions=[{id:"sep-tx",date:"2026-09-05",type:"expense",category:"Alimentação",amount:35,description:"Mercado"}];s.monthlyAllocations=[];s.monthlyAllocationOverrides={};s.budgetDefaults={Alimentação:90,Família:250,Viagens:250,Casa:100,Brasil:100};api.setState(s);
api.setBudgetAmount("2026-09","Alimentação",120);api.setBudgetAmount("2026-10","Alimentação",130);
assert.strictEqual(api.getBudget("2026-09").Alimentação,120);assert.strictEqual(api.getBudget("2026-10").Alimentação,130);assert.strictEqual(api.snapshot().transactions[0].amount,35);
console.log("MONTHLY_BUDGET_HISTORY_PASS");

// Direct deletion is allowed only when no historical data exists; otherwise the category is archived.
s=api.snapshot();s.months={};s.transactions=[];s.monthlyAllocations=[];api.setState(s);const fresh=api.snapshot().budgetCategories.find(c=>c.name==='Outros');assert.ok(fresh);assert.strictEqual(api.deleteBudgetCategory(fresh.id).ok,true);assert.ok(!api.snapshot().budgetCategories.some(c=>c.id===fresh.id));console.log("CATEGORY_DELETE_WITHOUT_HISTORY_PASS");
s=api.snapshot();s.budgetCategories=api.snapshot().budgetCategories.map(c=>c.name==='Alimentação'?c:c);s.transactions=[{id:"historic",date:"2026-09-05",type:"expense",category:"Alimentação",amount:20}];api.setState(s);const food=api.snapshot().budgetCategories.find(c=>c.name==='Alimentação');const del=api.deleteBudgetCategory(food.id);assert.strictEqual(del.error,'has-history');assert.ok(api.snapshot().budgetCategories.find(c=>c.id===food.id).active);console.log("CATEGORY_DELETE_HISTORY_PROTECTION_PASS");

// Approved airplane symbol is preserved byte-for-byte from the polish input.
const currentSymbol=html.match(/<symbol id="i-plane"[\s\S]*?<\/symbol>/)[0];const originalHtml=fs.readFileSync('/mnt/data/gfh-final-polish/index.html','utf8');const originalSymbol=originalHtml.match(/<symbol id="i-plane"[\s\S]*?<\/symbol>/)[0];const geom=x=>x.replace(/^<symbol[^>]*>/,'').replace(/<\/symbol>$/,'').replace(/\s+/g,' ').trim();assert.strictEqual(crypto.createHash('sha256').update(geom(currentSymbol)).digest('hex'),crypto.createHash('sha256').update(geom(originalSymbol)).digest('hex'));console.log("AIRPLANE_PRESERVED_GEOMETRY_PASS");

// Map remains byte-for-byte unchanged.
const mapNow=fs.readFileSync(path.join(root,'world-map-data.js'));const mapPrev=fs.readFileSync('/mnt/data/gfh-final-polish/world-map-data.js');assert.strictEqual(crypto.createHash('sha256').update(mapNow).digest('hex'),crypto.createHash('sha256').update(mapPrev).digest('hex'));console.log("MAP_BYTE_IDENTITY_PASS");

console.log("FINAL_POLISH_2_TESTS_PASSED");
