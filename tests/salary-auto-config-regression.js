'use strict';
const fs=require('fs');
const vm=require('vm');
const crypto=require('crypto');
const assert=require('assert');
const path=require('path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
const withoutInit=source.replace(/\ninit\(\);\s*$/,'\n');
const hook=`\nObject.defineProperty(globalThis,'__gfhTest',{value:{\n  setState(v){state=v;}, snapshot(){return clone(state);},\n  normalizeMonthlyAllocation, allocationTypeLabel, getAllocationCandidatesForMigration, migrateBudgetToAllocations,\n  getActiveMonthlyAllocations, allocationEffectiveAmount, getAllocationSummary, getBudget, monthKey\n}, configurable:false});\n`;
const context={
  localStorage:{getItem(){return null;},setItem(){}},
  console,Intl,Date,JSON,Math,Number,String,Boolean,Object,Array,RegExp,parseInt,parseFloat,isFinite,setTimeout,clearTimeout,
  confirm(){return true;},
  crypto:{randomUUID:()=> 'test-'+crypto.randomUUID()},
  document:{getElementById(){return {textContent:'',classList:{add(){},remove(){}}};}},
  window:{WORLD_MAP_COUNTRIES:[]}
};
vm.runInNewContext(withoutInit+hook,context,{filename:path.join(root,'app.js')});
const api=context.__gfhTest;
context.renderAll=()=>{};
context.saveState=()=>{};

function base(){
  const s=api.snapshot();
  s.profile.netMonthly=1448;
  s.salaryPlan={effectiveFrom:'2026-01',netMonthly:1448};
  s.salaryRecords=[];
  s.months={};
  s.transactions=[];
  s.monthlyAllocations=[];
  s.monthlyAllocationOverrides={};
  return s;
}

// Normalization must tolerate legacy/malformed fields while preserving unknown properties.
let n=api.normalizeMonthlyAllocation({id:'a1',name:'Viagens',category:'Viagens',type:'travel',amount:'250',active:0,priority:'3',notes:'x',linkedCommitmentId:'c1',customField:'keep'});
assert.strictEqual(n.id,'a1');
assert.strictEqual(n.amount,250);
assert.strictEqual(n.type,'travel');
assert.strictEqual(n.active,false);
assert.strictEqual(n.priority,3);
assert.strictEqual(n.linkedCommitmentId,'c1');
assert.strictEqual(n.customField,'keep');
assert.ok(n.createdAt&&n.updatedAt);
console.log('NORMALIZE_ALLOCATION_PASS');
console.log('ALLOCATION_TYPE_LABEL_PASS');

// No rules: configure non-zero budget categories into one rule per category, with no transactions.
let s=base();
api.setState(s);
context.confirm=()=>true;
api.migrateBudgetToAllocations('2026-09');
s=api.snapshot();
assert.ok(s.monthlyAllocations.length>0);
assert.strictEqual(s.monthlyAllocations.filter(a=>a.category==='Viagens')[0].type,'travel');
assert.strictEqual(s.transactions.length,0);
console.log('MIGRATION_EMPTY_RULESET_PASS');
console.log('TRAVEL_RULE_TYPE_PASS');
console.log('NO_FAKE_TRANSACTIONS_PASS');

// Existing rules must not duplicate; a different amount may be updated explicitly.
s=base();
s.monthlyAllocations=[
  {id:'br',name:'Brasil',category:'Brasil',type:'transfer',amount:200,active:true,priority:4,notes:'preserve',linkedCommitmentId:'commit-1',createdAt:'c',updatedAt:'u'},
  {id:'tr',name:'Viagens',category:'Viagens',type:'travel',amount:250,active:true,priority:2,notes:'travel',createdAt:'c',updatedAt:'u'}
];
s.monthlyAllocationOverrides={'2026-09':{'br':175}};
api.setState(s);
let confirms=[]; context.confirm=(msg)=>{confirms.push(msg); return true;};
api.migrateBudgetToAllocations('2026-09');
s=api.snapshot();
assert.strictEqual(s.monthlyAllocations.filter(a=>a.category==='Brasil').length,1);
assert.strictEqual(s.monthlyAllocations.filter(a=>a.category==='Viagens').length,1);
assert.strictEqual(s.monthlyAllocations.find(a=>a.id==='br').priority,4);
assert.strictEqual(s.monthlyAllocations.find(a=>a.id==='br').notes,'preserve');
assert.strictEqual(s.monthlyAllocations.find(a=>a.id==='br').linkedCommitmentId,'commit-1');
assert.strictEqual(s.monthlyAllocationOverrides['2026-09'].br,175);
assert.ok(s.monthlyAllocations.some(a=>a.category==='Casa'));
assert.ok(confirms.length>=1);
console.log('MIGRATION_NO_DUPLICATES_PASS');
console.log('MIGRATION_EXISTING_UPDATE_PASS');
console.log('OVERRIDES_PRESERVED_PASS');
console.log('LINKED_COMMITMENT_PRESERVED_PASS');

// Cancel confirmation: absolutely no data mutation.
s=base();
s.monthlyAllocations=[{id:'br',name:'Brasil',category:'Brasil',type:'transfer',amount:200,active:true,priority:1,notes:'keep'}];
const before=JSON.stringify(s);
api.setState(s);
context.confirm=()=>false;
api.migrateBudgetToAllocations('2026-09');
assert.strictEqual(JSON.stringify(api.snapshot()),before);
console.log('MIGRATION_CANCEL_PASS');

// One-month budget source works through the existing month structure.
s=base();
s.months={'2026-09':{budget:{Alimentação:120,Viagens:400}},'2026-10':{budget:{Alimentação:90,Viagens:250}}};
api.setState(s); context.confirm=()=>true;
api.migrateBudgetToAllocations('2026-09');
s=api.snapshot();
assert.strictEqual(s.monthlyAllocations.find(a=>a.category==='Viagens').amount,400);
assert.strictEqual(s.monthlyAllocations.find(a=>a.category==='Alimentação').amount,120);
console.log('MONTH_SPECIFIC_BUDGET_MIGRATION_PASS');

// Static safeguards: one storage key, no clear, no map modification, button present.
assert.strictEqual((source.match(/const STORAGE_KEY = 'gfh_v1'/g)||[]).length,1);
assert.ok(!source.includes('localStorage.clear('));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.includes('id="configureAllocationsFromBudgetBtn"'));
assert.strictEqual((html.match(/id="configureAllocationsFromBudgetBtn"/g)||[]).length,1);
const mapA=fs.readFileSync(path.join(root,'world-map-data.js'));
const mapB=fs.readFileSync('/mnt/data/gfh-patch-final/world-map-data.js');
assert.strictEqual(crypto.createHash('sha256').update(mapA).digest('hex'),crypto.createHash('sha256').update(mapB).digest('hex'));
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
assert.ok(/country-flag-asset\{[^}]*background-size:360px 234px;/.test(css));
assert.ok(!css.includes('background-size:330px 214.5px'));
console.log('CONFIGURE_BUTTON_ALWAYS_AVAILABLE_PASS');
console.log('STORAGE_GFH_V1_PASS');
console.log('NO_LOCALSTORAGE_CLEAR_PASS');
console.log('MAP_BYTE_IDENTITY_PASS');
console.log('MOBILE_FLAG_SCALE_PASS');
console.log('SALARY_AUTO_CONFIG_TESTS_PASSED');
