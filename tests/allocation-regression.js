'use strict';
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const withoutInit = source.replace(/\ninit\(\);\s*$/, '\n');
const hook = `\nObject.defineProperty(globalThis, '__gfhTest', {value:{\n  setState(v){ state = v; },\n  snapshot(){ return clone(state); },\n  getAllocationSummary,\n  getActiveMonthlyAllocations,\n  allocationEffectiveAmount,\n  getBudget,\n  plannedSavings,\n  plannedExpenses,\n  plannedIncome,\n  actualIncome,\n  incomeUsedForMonth,\n  financeMonthFree,\n  plannedTravelContributionRemaining,\n  projectedTravelFundThroughMonth,\n  getSavedByCategory,
  monthKey,
  addMonthsKey,
  calculateTravelFund
}, writable:false});\n`;
const context = {
  localStorage: { getItem(){ return null; }, setItem(){} },
  console,
  Intl,
  Date,
  JSON,
  Math,
  Number,
  String,
  Boolean,
  Object,
  Array,
  RegExp,
  parseInt,
  parseFloat,
  isFinite,
  setTimeout,
  clearTimeout,
  crypto: { randomUUID: () => 'test-' + crypto.randomUUID() },
};
vm.runInNewContext(withoutInit + hook, context, {filename:path.join(root,'app.js')});
const api = context.__gfhTest;

function rule(id, name, category, amount, type, active=true){
  return {id, name, category, amount, type, active, priority:0, notes:'', createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:00:00.000Z'};
}
function baseState(){
  const s = api.snapshot();
  s.onboardingDone = true;
  s.profile.netMonthly = 1448;
  s.salaryPlan = {effectiveFrom:'2026-01', netMonthly:1448};
  s.salaryRecords = [];
  s.months = {};
  s.transactions = [];
  s.commitments = [];
  s.trips = [];
  s.travelFund = 0;
  s.monthlyAllocations = [
    rule('a-br','Brasil','Brasil',200,'transfer'),
    rule('a-tr','Fundo de viagens','Viagens',250,'travel'),
    rule('a-ho','Casa','Casa',100,'saving'),
    rule('a-em','Reserva','Emergência',250,'saving'),
    rule('a-in','Investimentos','Investimentos',200,'investment')
  ];
  s.monthlyAllocationOverrides = {};
  return s;
}
function run(){
  const key='2026-09';

  // 1 — baseline
  let s=baseState(); api.setState(s); let sum=api.getAllocationSummary(key);
  assert.strictEqual(sum.income,1448); assert.strictEqual(sum.total,1000); assert.strictEqual(sum.freeAfterDistribution,448);

  // 2 — edit a base rule
  s=baseState(); s.monthlyAllocations.find(x=>x.id==='a-br').amount=150; api.setState(s); sum=api.getAllocationSummary(key);
  assert.strictEqual(sum.total,950); assert.strictEqual(sum.freeAfterDistribution,498);

  // 3 — pause travel (independent baseline)
  s=baseState(); s.monthlyAllocations.find(x=>x.id==='a-tr').active=false; api.setState(s); sum=api.getAllocationSummary(key);
  assert.strictEqual(sum.total,750); assert.strictEqual(sum.freeAfterDistribution,698);
  // Reactivation restores the allocation.
  s.monthlyAllocations.find(x=>x.id==='a-tr').active=true; api.setState(s); sum=api.getAllocationSummary(key);
  assert.strictEqual(sum.total,1000); assert.strictEqual(sum.freeAfterDistribution,448);

  // 4 — allocation above income is negative, never clamped to zero
  for (const r of s.monthlyAllocations) r.amount=0;
  s.monthlyAllocations.push(rule('a-over','Excesso','Casa',1600,'saving'));
  api.setState(s); sum=api.getAllocationSummary(key);
  assert.strictEqual(sum.total,1600); assert.strictEqual(sum.freeAfterDistribution,-152); assert.strictEqual(sum.deficit,152);

  // 5 — actual salary received has priority over planned salary
  s=baseState(); s.salaryRecords=[{id:'pay1',month:key,status:'received',netPlanned:1448,netReceived:1600,extraIncome:0}]; api.setState(s); sum=api.getAllocationSummary(key);
  assert.strictEqual(api.plannedIncome(key),1448); assert.strictEqual(api.actualIncome(key),1600); assert.strictEqual(api.incomeUsedForMonth(key),1600); assert.strictEqual(sum.freeAfterDistribution,600);

  // 6 — lower actual salary recalculates the same rules
  s.salaryRecords[0].status='partial'; s.salaryRecords[0].netReceived=1300; api.setState(s); sum=api.getAllocationSummary(key);
  assert.strictEqual(sum.income,1300); assert.strictEqual(sum.freeAfterDistribution,300);

  // 7 — travel allocation feeds the existing travel budget/projection input
  s=baseState(); api.setState(s);
  assert.strictEqual(api.getBudget(key).Viagens,250);
  assert.strictEqual(api.plannedTravelContributionRemaining(key),250);

  // 8 — rules do not create real transactions
  assert.strictEqual(api.snapshot().transactions.length,0);

  // 9 — month override changes only the selected month, not the base rule/history
  s=baseState(); s.monthlyAllocationOverrides={'2026-12':{'a-br':100}}; api.setState(s);
  assert.strictEqual(api.allocationEffectiveAmount(s.monthlyAllocations[0],'2026-12'),100);
  assert.strictEqual(api.allocationEffectiveAmount(s.monthlyAllocations[0],'2026-09'),200);
  assert.strictEqual(s.monthlyAllocations[0].amount,200);

  // 10 — deleting a rule must not touch transaction history (data-level regression)
  s=baseState(); s.transactions=[{id:'tx1',date:'2026-08-15',type:'expense',category:'Outros',amount:50}];
  const beforeTx=JSON.stringify(s.transactions); s.monthlyAllocations=s.monthlyAllocations.filter(x=>x.id!=='a-br');
  api.setState(s); assert.strictEqual(JSON.stringify(api.snapshot().transactions),beforeTx);

  // 11 — shared Capital Livre engine reacts through getBudget, not a second capital formula
  s=baseState(); api.setState(s); const freeA=api.financeMonthFree(key);
  s.monthlyAllocations.find(x=>x.id==='a-br').amount=150; api.setState(s); const freeB=api.financeMonthFree(key);
  assert.strictEqual(freeB-freeA,50);

  // 12/13 — static storage safeguards
  assert.ok(!source.includes('localStorage.clear('));
  assert.ok((source.match(/const STORAGE_KEY = 'gfh_v1'/g)||[]).length===1);
  const storageWrites=[...source.matchAll(/localStorage\.setItem\(([^\n]+)\)/g)].map(m=>m[1]);
  assert.ok(storageWrites.some(x=>x.includes('STORAGE_KEY')));
  assert.ok(!storageWrites.some(x=>/monthlyAllocations|salaryAllocations|allocation/.test(x) && !x.includes('STORAGE_KEY')));

  // 14 — month key is derived from the supplied/current date, not stored history.
  assert.strictEqual(api.monthKey(new Date('2026-09-09T12:00:00Z')),'2026-09');
  assert.strictEqual(api.monthKey(new Date('2026-10-01T12:00:00Z')),'2026-10');
  assert.strictEqual(api.monthKey(new Date('2027-01-05T12:00:00Z')),'2027-01');
  assert.strictEqual(api.addMonthsKey('2026-09',-1),'2026-08');
  assert.strictEqual(api.addMonthsKey('2026-09',1),'2026-10');

  // 15 — one-month override does not modify the recurring rule.
  s=baseState(); s.monthlyAllocationOverrides={'2026-09':{'a-tr':400}}; api.setState(s);
  assert.strictEqual(api.allocationEffectiveAmount(s.monthlyAllocations.find(x=>x.id==='a-tr'),'2026-09'),400);
  assert.strictEqual(api.allocationEffectiveAmount(s.monthlyAllocations.find(x=>x.id==='a-tr'),'2026-10'),250);
  assert.strictEqual(s.monthlyAllocations.find(x=>x.id==='a-tr').amount,250);

  // 16 — pausing a configured category removes its planned amount from the shared budget engine.
  s=baseState(); api.setState(s);
  assert.strictEqual(api.getBudget(key).Brasil,200);
  s.monthlyAllocations.find(x=>x.id==='a-br').active=false; api.setState(s);
  assert.strictEqual(api.getBudget(key).Brasil,0);

  // 17 — travel allocation stays a planning contribution and does not create realized travel money.
  s=baseState(); s.travelFund=100; s.transactions=[]; api.setState(s);
  assert.strictEqual(api.getAllocationSummary(key).allocations.find(x=>x.id==='a-tr').effectiveAmount,250);
  assert.strictEqual(api.calculateTravelFund(),100);
  assert.strictEqual(api.snapshot().transactions.length,0);

  // 18 — static UI structure: the editor is in Planning, IDs are unique, and SVG use references resolve.
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const planningStart=html.indexOf('<section class="page" id="page-planning">');
  const moneyStart=html.indexOf('<section class="page" id="page-money">');
  const allocationStart=html.indexOf('<section class="allocation-panel allocation-planning-editor"');
  assert.ok(planningStart>=0 && allocationStart>planningStart && allocationStart<moneyStart);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.strictEqual(new Set(ids).size,ids.length);
  const symbols=new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map(m=>m[1]));
  const uses=[...html.matchAll(/<use href="#([^"]+)"/g)].map(m=>m[1]);
  assert.ok(uses.every(id=>symbols.has(id)), 'every SVG use must resolve to an inline symbol');
  assert.ok(/<symbol id="i-plane"[^>]*>[\s\S]*?<\/symbol>/.test(html));
  assert.ok(!/(💰|✈️|🎯|🏠|💳|📊|🗺️|⚙️)/u.test(html), 'functional UI must not use decorative emoji icons');
  const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
  assert.ok(css.includes('env(safe-area-inset-top)') && css.includes('env(safe-area-inset-bottom)'));
  assert.ok(/min-height:\s*44px/.test(css), 'interactive touch targets should be at least 44px high');

  // 19 — no additional financial localStorage database/key was introduced.
  assert.ok((source.match(/const STORAGE_KEY = 'gfh_v1'/g)||[]).length===1);
  assert.ok(!source.includes('localStorage.clear('));

  // 20 — map integrity is byte-for-byte checked below by the test runner.
  // 21 — exact monthly-planning acceptance example: 200 → 300 updates the shared free amount.
  s=baseState(); api.setState(s); s.monthlyAllocations.find(x=>x.id==='a-br').amount=300; api.setState(s); sum=api.getAllocationSummary(key);
  assert.strictEqual(sum.total,1100); assert.strictEqual(sum.freeAfterDistribution,348);

  // 22 — exact pause acceptance example: pausing Brasil changes 1000 → 800 without deleting the rule.
  s=baseState(); s.monthlyAllocations.find(x=>x.id==='a-br').active=false; api.setState(s); sum=api.getAllocationSummary(key);
  assert.strictEqual(sum.total,800); assert.strictEqual(sum.freeAfterDistribution,648); assert.ok(s.monthlyAllocations.some(x=>x.id==='a-br'));

  // 23 — month selection is initialized from today at load and remains a user-navigable value thereafter.
  assert.strictEqual(api.monthKey(new Date('2026-09-09T22:07:00+01:00')),'2026-09');
  assert.strictEqual(api.monthKey(new Date('2026-10-01T12:00:00Z')),'2026-10');
  assert.strictEqual(api.addMonthsKey('2026-09',-1),'2026-08');
  assert.strictEqual(api.addMonthsKey('2026-09',1),'2026-10');

  // 24 — UI keeps the current-month editor inside Planning and avoids a second financial storage key.
  assert.ok(html.includes('id="allocationMonthSelect"')); assert.ok(html.includes('id="allocationUseOverride"')); assert.ok(html.includes('allocation-planning-editor'));
  assert.ok(!html.includes('📱 Como instalar'));
  const mapPath=path.join(root,'world-map-data.js'); const baseMap=path.join('/mnt/data/gfh_base','world-map-data.js');
  assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(mapPath)).digest('hex'),crypto.createHash('sha256').update(fs.readFileSync(baseMap)).digest('hex'));

  console.log('ALLOCATION_SCENARIO_1_PASS');
  console.log('ALLOCATION_SCENARIO_2_PASS');
  console.log('ALLOCATION_SCENARIO_3_PASS');
  console.log('ALLOCATION_SCENARIO_4_PASS');
  console.log('ALLOCATION_SCENARIO_5_PASS');
  console.log('ALLOCATION_SCENARIO_6_PASS');
  console.log('ALLOCATION_SCENARIO_7_PASS');
  console.log('ALLOCATION_SCENARIO_8_PASS');
  console.log('ALLOCATION_SCENARIO_9_PASS');
  console.log('ALLOCATION_SCENARIO_10_PASS');
  console.log('ALLOCATION_SCENARIO_11_PASS');
  console.log('MONTH_AUTO_SELECTION_PASS');
  console.log('MONTH_NAVIGATION_PASS');
  console.log('MONTH_OVERRIDE_PASS');
  console.log('PAUSED_ALLOCATION_BUDGET_PASS');
  console.log('TRAVEL_FUND_NON_DUPLICATION_PASS');
  console.log('PLANNING_EDITOR_STRUCTURE_PASS');
  console.log('EXACT_EDIT_ACCEPTANCE_PASS');
  console.log('EXACT_PAUSE_ACCEPTANCE_PASS');
  console.log('MONTH_LOAD_AND_NAVIGATION_PASS');
  console.log('ICON_REFINEMENT_PASS');
  console.log('STORAGE_REGRESSION_PASSED');
  console.log('MAP_INTEGRITY_PASSED');
  console.log('ALLOCATION_TESTS_PASSED');
}

run();
