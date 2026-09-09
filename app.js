'use strict';

const STORAGE_KEY = 'gfh_v1';

const categoryMeta = {
  'Alimentação': { icon: 'i-wallet', type: 'expense' },
  'Fixos': { icon: 'i-calendar', type: 'expense' },
  'Família': { icon: 'i-users', type: 'expense' },
  'Lazer': { icon: 'i-spark', type: 'expense' },
  'Viagens': { icon: 'i-plane', type: 'saving' },
  'Casa': { icon: 'i-home', type: 'saving' },
  'Brasil': { icon: 'i-transfer', type: 'saving' },
  'Emergência': { icon: 'i-shield', type: 'saving' },
  'Outros': { icon: 'i-box', type: 'expense' },
  'Investimentos': { icon: 'i-chart', type: 'saving' }
};

const DEFAULT_BUDGET_CATEGORY_DEFS = [
  { id:'alimentacao', name:'Alimentação', type:'expense', icon:'i-wallet', active:true, aliases:[] },
  { id:'fixos', name:'Fixos', type:'expense', icon:'i-calendar', active:true, aliases:[] },
  { id:'familia', name:'Família', type:'expense', icon:'i-users', active:true, aliases:[] },
  { id:'lazer', name:'Lazer', type:'expense', icon:'i-spark', active:true, aliases:[] },
  { id:'viagens', name:'Viagens', type:'travel', role:'travel', icon:'i-plane', active:true, aliases:[] },
  { id:'casa', name:'Casa', type:'saving', icon:'i-home', active:true, aliases:[] },
  { id:'brasil', name:'Brasil', type:'transfer', icon:'i-transfer', active:true, aliases:[] },
  { id:'emergencia', name:'Emergência', type:'saving', icon:'i-shield', active:true, aliases:[] },
  { id:'outros', name:'Outros', type:'expense', icon:'i-box', active:true, aliases:[] },
  { id:'investimentos', name:'Investimentos', type:'investment', role:'investment', icon:'i-chart', active:true, aliases:[] }
];
function budgetCategorySlug(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'categoria';}
function normalizeBudgetCategory(c={}){
  const allowed=['expense','saving','travel','investment','transfer'];
  const name=String(c.name||'').trim();
  const type=allowed.includes(c.type)?c.type:'expense';
  const fallback=DEFAULT_BUDGET_CATEGORY_DEFS.find(x=>x.name===name) || {};
  return {
    id:String(c.id||budgetCategorySlug(name||fallback.name||'categoria')),
    name:name||String(fallback.name||'Categoria'),
    type,
    role:String(c.role||fallback.role||''),
    icon:String(c.icon||fallback.icon||iconIdForType(type)),
    active:c.active!==false,
    aliases:Array.isArray(c.aliases)?[...new Set(c.aliases.map(v=>String(v||'').trim()).filter(Boolean))]:[],
    origin:c.origin||'default',
    createdAt:c.createdAt||new Date().toISOString(),
    updatedAt:c.updatedAt||c.createdAt||new Date().toISOString()
  };
}
function iconIdForType(type){return ({travel:'i-plane',investment:'i-chart',transfer:'i-transfer',expense:'i-wallet',saving:'i-target'})[type]||'i-wallet';}
function normalizeGoalIcon(value,name=''){
  const map={'🏠':'i-home','🇧🇷':'i-transfer','📈':'i-chart','🚗':'i-transfer','🚙':'i-transfer','🛟':'i-shield','🎯':'i-target','💰':'i-wallet'};
  const raw=String(value||'').trim();
  if(map[raw])return map[raw];
  if(raw.startsWith('i-'))return raw;
  const n=String(name||'').toLowerCase();
  if(n.includes('casa'))return 'i-home'; if(n.includes('brasil'))return 'i-transfer'; if(n.includes('reserva')||n.includes('emerg'))return 'i-shield'; if(n.includes('renda')||n.includes('invest'))return 'i-chart'; return 'i-target';
}
function goalIconMarkup(goal){return iconSvg(normalizeGoalIcon(goal?.icon,goal?.name),'action-icon');}
function budgetCategoryDefs(includeInactive=false){
  const defs=Array.isArray(state.budgetCategories)&&state.budgetCategories.length?state.budgetCategories:DEFAULT_BUDGET_CATEGORY_DEFS.map(normalizeBudgetCategory);
  return defs.filter(c=>includeInactive||c.active);
}
function budgetCategoryByName(name, includeInactive=true){
  const raw=String(name||'').trim();
  return budgetCategoryDefs(includeInactive).find(c=>c.name===raw||c.aliases?.includes(raw))||null;
}
function budgetCategoryByRole(role,includeInactive=true){return budgetCategoryDefs(includeInactive).find(c=>c.role===role)||(role==='travel'?budgetCategoryDefs(includeInactive).find(c=>c.type==='travel'):null)||null;}
function travelBudgetCategoryName(){return budgetCategoryByRole('travel')?.name||'Viagens';}
function isBudgetSavingType(type){return ['saving','travel','investment','transfer'].includes(type);}
function getBudgetCategoryType(name){return budgetCategoryByName(name)?.type||categoryMeta[name]?.type||'expense';}
function getBudgetCategoryIcon(name,type='expense'){return budgetCategoryByName(name)?.icon||categoryMeta[name]?.icon||iconIdForType(type);}

const initialState = {
  onboardingDone: false,
  profile: {
    name: 'Gustavo Almeida',
    location: 'Santa Cruz de Tenerife, Espanha',
    company: 'Macaronesia Forwarding Canarias, S.L.',
    role: '',
    grossAnnual: 21500,
    grossMonthly: 1791.67,
    netMonthly: 1448,
    socialSecurity: 0,
    irpf: 0,
    otherDeductions: 0,
    fxEurBrl: 6.45,
    reviewMonth: '2027-01'
  },
  budgetDefaults: {
    'Alimentação': 90,
    'Fixos': 17,
    'Família': 250,
    'Lazer': 100,
    'Viagens': 250,
    'Casa': 100,
    'Brasil': 100,
    'Emergência': 100,
    'Outros': 0
  },
  budgetCategories: DEFAULT_BUDGET_CATEGORY_DEFS.map(normalizeBudgetCategory),
  months: {},
  salaryRecords: [],
  salaryPlan: { effectiveFrom: '2027-01', netMonthly: 1448 },
  monthlyAllocations: [],
  monthlyAllocationOverrides: {},
  transactions: [],
  commitments: [],
  trips: [],
  visitedCountries: {},
  travelSettings: { annualBudget: { '2026': 3000 }, annualTripGoal: { '2026': 9 }, islandsVisited: [] },
  goals: [
    { id: 'g1', name: 'Carta de condução', target: 1000, current: 0, monthly: 100, months: 12, priority: 'alta', icon: 'i-transfer' },
    { id: 'g2', name: 'Casa Espanha', target: 15000, current: 0, monthly: 100, months: 96, priority: 'alta', icon: 'i-home' },
    { id: 'g3', name: 'Brasil', target: 10000, current: 0, monthly: 100, months: 72, priority: 'média', icon: 'i-transfer' },
    { id: 'g4', name: 'Carro usado', target: 4500, current: 0, monthly: 50, months: 24, priority: 'baixa', icon: 'i-transfer' },
    { id: 'g5', name: 'Renda passiva', target: 50000, current: 0, monthly: 100, months: 120, priority: 'baixa', icon: 'i-chart' },
    { id: 'g6', name: 'Reserva de emergência', target: 3000, current: 0, monthly: 100, months: 30, priority: 'alta', icon: 'i-shield' }
  ],
  simulator: { salary: 1448, raise: 0, bonus: 0, travel: 250, house: 100, brazil: 100, scenario: 'base' }
};

let state = loadState();
let charts = {};
let currentPage = 'dashboard';
let planningScenario = 'base';
let allocationSelectedMonth = monthKey();
let budgetSelectedMonth = monthKey();
let worldMapView = { scale: 1, x: 0, y: 0, pointers: new Map(), dragStart: null, pinchStart: null, moved: false, animation: null, selectedCountryId: '' };

const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const monthShort = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(initialState);
    const parsed = JSON.parse(raw);
    const merged = { ...clone(initialState), ...parsed, profile: { ...clone(initialState).profile, ...(parsed.profile || {}) }, simulator: { ...clone(initialState).simulator, ...(parsed.simulator || {}) }, salaryPlan: { ...clone(initialState).salaryPlan, ...(parsed.salaryPlan || {}) }, travelSettings: { ...clone(initialState).travelSettings, ...(parsed.travelSettings || {}), annualBudget: { ...clone(initialState).travelSettings.annualBudget, ...((parsed.travelSettings || {}).annualBudget || {}) }, annualTripGoal: { ...clone(initialState).travelSettings.annualTripGoal, ...((parsed.travelSettings || {}).annualTripGoal || {}) } } };
    const rawBudgetCategories = Array.isArray(parsed.budgetCategories) ? parsed.budgetCategories : clone(DEFAULT_BUDGET_CATEGORY_DEFS);
    const seenBudgetNames = new Set(rawBudgetCategories.map(c=>String(c?.name||'').trim()).filter(Boolean));
    merged.budgetCategories = rawBudgetCategories.map(normalizeBudgetCategory);
    for(const legacyName of Object.keys(merged.budgetDefaults||{})) {
      if(!seenBudgetNames.has(legacyName)) {
        const meta=DEFAULT_BUDGET_CATEGORY_DEFS.find(c=>c.name===legacyName)||{};
        merged.budgetCategories.push(normalizeBudgetCategory({id:budgetCategorySlug(legacyName),name:legacyName,type:meta.type||'expense',icon:meta.icon||iconIdForType(meta.type||'expense'),active:true}));
      }
    }
    merged.salaryRecords = Array.isArray(parsed.salaryRecords) ? parsed.salaryRecords : [];
    merged.monthlyAllocations = Array.isArray(parsed.monthlyAllocations) ? parsed.monthlyAllocations.map(normalizeMonthlyAllocation) : [];
    merged.monthlyAllocationOverrides = parsed.monthlyAllocationOverrides && typeof parsed.monthlyAllocationOverrides==='object' && !Array.isArray(parsed.monthlyAllocationOverrides) ? parsed.monthlyAllocationOverrides : {};
    merged.commitments = Array.isArray(parsed.commitments) ? parsed.commitments.map(normalizeCommitment) : [];
    merged.trips = Array.isArray(parsed.trips) ? parsed.trips.map(normalizeTrip) : [];
    merged.visitedCountries = parsed.visitedCountries && typeof parsed.visitedCountries === 'object' && !Array.isArray(parsed.visitedCountries) ? parsed.visitedCountries : {};
    merged.travelSettings.islandsVisited = Array.isArray(merged.travelSettings.islandsVisited) ? merged.travelSettings.islandsVisited : [];
    return merged;
  } catch { return clone(initialState); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function currency(n) { return new Intl.NumberFormat('pt-PT', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(Number(n)||0).replace(' ',' '); }
function currency2(n) { return new Intl.NumberFormat('pt-PT', { style:'currency', currency:'EUR', maximumFractionDigits:2 }).format(Number(n)||0).replace(' ',' '); }
function setMoneyValueClass(el, value){ if(!el)return; el.classList.toggle('negative', Number(value)<0); el.classList.toggle('zero', Number(value)===0); }
function brl(n) { return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 }).format(Number(n)||0); }
function pct(n) { return `${Math.round(Number(n)||0)}%`; }
function monthKey(date = new Date()) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function monthLabel(key) { const [y,m] = key.split('-').map(Number); return `${monthNames[m-1]} ${y}`; }
function todayISO() { return new Date().toISOString().slice(0,10); }
function clamp(n,min,max){return Math.min(max, Math.max(min,n));}
function formatDate(dateStr) { if (!dateStr) return 'Sem data'; const [y,m,d] = dateStr.split('-'); return `${d}/${m}/${y}`; }
function showToast(text) { const el=document.getElementById('toast'); el.textContent=text; el.classList.add('show'); clearTimeout(showToast.t); showToast.t=setTimeout(()=>el.classList.remove('show'),2500); }
function iconSvg(id, cls='line-icon'){ return `<svg class="${cls}" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#${id}"></use></svg>`; }
function iconIdForCategory(category,type){ return getBudgetCategoryIcon(category,type); }

function init() {
  bindNavigation();
  bindFinance();
  bindAllocationEvents();
  bindBudgetEditor();
  bindGlobalButtons();
  bindForms();
  bindSimulator();
  bindPlanningControls();
  fillSalaryForm();
  fillSettingsForm();
  populateCategorySelect();
  setupMonthSelector();
  setupSalaryHistoryYear();
  initCommitmentMonthSelect();
  setupTripYearSelector();
  renderAll();
  if (!state.onboardingDone) openModal('onboardingModal');
}

function bindNavigation() {
  document.querySelectorAll('[data-page]').forEach(btn => btn.addEventListener('click', () => goTo(btn.dataset.page)));
  const moreBtn = document.getElementById('mobileMoreBtn');
  const moreMenu = document.getElementById('mobileMoreMenu');
  const moreBackdrop = document.getElementById('mobileMoreBackdrop');
  const moreClose = document.getElementById('mobileMoreClose');
  const closeMore = () => {
    if (moreMenu) moreMenu.classList.add('hidden');
    if (moreBackdrop) moreBackdrop.classList.add('hidden');
    if (moreBtn) moreBtn.setAttribute('aria-expanded','false');
  };
  const openMore = () => {
    if (moreMenu) moreMenu.classList.remove('hidden');
    if (moreBackdrop) moreBackdrop.classList.remove('hidden');
    if (moreBtn) moreBtn.setAttribute('aria-expanded','true');
  };
  if (moreBtn) moreBtn.addEventListener('click', () => {
    if (moreMenu?.classList.contains('hidden')) openMore(); else closeMore();
  });
  if (moreBackdrop) moreBackdrop.addEventListener('click', closeMore);
  if (moreClose) moreClose.addEventListener('click', closeMore);
  document.querySelectorAll('.mobile-more-item').forEach(btn => btn.addEventListener('click', closeMore));
}
function goTo(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active', el.id === `page-${page}`));
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active', el.dataset.page === page));
  document.querySelectorAll('.mobile-nav-item[data-page]').forEach(el=>el.classList.toggle('active', el.dataset.page === page));
  const mobileMoreBtn=document.getElementById('mobileMoreBtn');
  if(mobileMoreBtn) mobileMoreBtn.classList.toggle('active', !['dashboard','finance','planning','trips'].includes(page));
  document.getElementById('mobileMoreMenu')?.classList.add('hidden');
  document.getElementById('mobileMoreBackdrop')?.classList.add('hidden');
  mobileMoreBtn?.setAttribute('aria-expanded','false');
  const titles={dashboard:'Seu painel financeiro',finance:'Central Financeira',planning:'Planejamento Financeiro',commitments:'Contas & Compromissos',money:'Meu dinheiro',trips:'Minhas viagens',goals:'Meus objetivos',whatif:'E se...?',salary:'Meu salário',settings:'Configurações'};
  document.getElementById('pageTitle').textContent=titles[page]||'Gustavo Financial Hub';
  renderPage(page);
  window.scrollTo({top:0,behavior:'smooth'});
}
function renderPage(page) {
  if (page==='dashboard') renderDashboard();
  if (page==='finance') renderFinance();
  if (page==='planning') renderPlanning();
  if (page==='commitments') renderCommitments();
  if (page==='money') renderMoney();
  if (page==='trips') renderTrips();
  if (page==='goals') renderGoals();
  if (page==='whatif') renderSimulator();
  if (page==='salary') renderSalary();
  if (page==='settings') { fillSettingsForm(); }
}
function renderAll(){ updateTodayLabel(); setupTripYearSelector(); renderDashboard(); renderFinance(); renderPlanning(); renderCommitments(); renderMoney(); renderTrips(); renderGoals(); renderSimulator(); renderSalary(); }
function updateTodayLabel(){ const d=new Date(); document.getElementById('todayLabel').textContent=`${monthNames[d.getMonth()]} ${d.getFullYear()}`; }

function getMonthTransactions(key=monthKey()) { return state.transactions.filter(t=>t.date?.startsWith(key)); }
function sumTransactions(key, type) { return getMonthTransactions(key).filter(t=>t.type===type).reduce((s,t)=>s+Number(t.amount||0),0); }
function budgetDefinitionValue(def,key){
  const explicit=state.months?.[key]?.budget&&typeof state.months[key].budget==='object'?state.months[key].budget:{};
  if(Object.prototype.hasOwnProperty.call(explicit,def.name)) return Number(explicit[def.name])||0;
  for(const alias of (def.aliases||[])) if(Object.prototype.hasOwnProperty.call(explicit,alias)) return Number(explicit[alias])||0;
  if(Object.prototype.hasOwnProperty.call(state.budgetDefaults||{},def.name)) return Number(state.budgetDefaults[def.name])||0;
  for(const alias of (def.aliases||[])) if(Object.prototype.hasOwnProperty.call(state.budgetDefaults||{},alias)) return Number(state.budgetDefaults[alias])||0;
  return 0;
}
function getBudgetWithoutAllocations(key=monthKey()){
  const out={};
  for(const def of budgetCategoryDefs()) out[def.name]=budgetDefinitionValue(def,key);
  return out;
}
function allocationEffectiveAmount(rule,key=monthKey()){const override=state.monthlyAllocationOverrides?.[key]?.[rule.id];return Number.isFinite(Number(override))?Math.max(0,Number(override)):Math.max(0,Number(rule.amount)||0);}
function getActiveMonthlyAllocations(key=monthKey()){return (state.monthlyAllocations||[]).filter(a=>a.active).map(a=>({...a,effectiveAmount:allocationEffectiveAmount(a,key)})).filter(a=>a.effectiveAmount>0).sort((a,b)=>Number(a.priority||0)-Number(b.priority||0)||a.name.localeCompare(b.name));}
function getAllocationSummary(key=monthKey()){const income=incomeUsedForMonth(key),allocations=getActiveMonthlyAllocations(key),total=allocations.reduce((sum,a)=>sum+a.effectiveAmount,0),freeAfterDistribution=financeMonthFree(key);return{key,income,allocations,total,freeAfterDistribution,deficit:Math.max(0,total-income),percent:income>0?total/income*100:0};}
function getAllocationCandidatesForMigration(key=monthKey()){
  const budget=getBudgetWithoutAllocations(key);
  return budgetCategoryDefs().filter(def=>Number(budget[def.name]||0)>0).map(def=>{
    const matches=(state.monthlyAllocations||[]).filter(a=>{const cat=String(a.category||'');return cat===def.name||(def.aliases||[]).includes(cat)||(def.role&&a.role===def.role);});
    return {name:def.name,category:def.name,amount:Number(budget[def.name])||0,type:def.type,role:def.role||'',matches};
  });
}
function getBudget(key=monthKey()){
  const defs=budgetCategoryDefs();
  const out=Object.fromEntries(defs.map(def=>[def.name,0]));
  const hasAllocationRules=Array.isArray(state.monthlyAllocations)&&state.monthlyAllocations.length>0;
  const configuredCategories=new Set((state.monthlyAllocations||[]).map(a=>a.category));
  if(!hasAllocationRules){for(const def of defs)out[def.name]=budgetDefinitionValue(def,key);}
  else {
    const explicit=state.months?.[key]?.budget&&typeof state.months[key].budget==='object'?state.months[key].budget:{};
    for(const def of defs){
      if(configuredCategories.has(def.name)) continue;
      if(def.origin==='custom' || Object.prototype.hasOwnProperty.call(explicit,def.name) || (def.aliases||[]).some(alias=>Object.prototype.hasOwnProperty.call(explicit,alias))) out[def.name]=budgetDefinitionValue(def,key);
      else out[def.name]=0;
    }
  }
  const byCategory={};
  for(const a of getActiveMonthlyAllocations(key)) byCategory[a.category]=(byCategory[a.category]||0)+a.effectiveAmount;
  for(const [cat,total] of Object.entries(byCategory)){if(Object.prototype.hasOwnProperty.call(out,cat))out[cat]=total;}
  return out;
}
function ensureMonthBudget(key){
  state.months=state.months&&typeof state.months==='object'&&!Array.isArray(state.months)?state.months:{};
  state.months[key]=state.months[key]&&typeof state.months[key]==='object'&&!Array.isArray(state.months[key])?state.months[key]:{};
  state.months[key].budget=state.months[key].budget&&typeof state.months[key].budget==='object'&&!Array.isArray(state.months[key].budget)?state.months[key].budget:{};
  return state.months[key].budget;
}
function setBudgetAmount(key,category,amount){
  const value=Math.max(0,Number(amount)||0);
  const rules=(state.monthlyAllocations||[]).filter(a=>a.category===category);
  if(rules.length){
    const targetByRule={}; const positiveBase=rules.reduce((sum,r)=>sum+Math.max(0,Number(r.amount)||0),0);
    if(positiveBase>0){let remainder=value;rules.forEach((r,index)=>{const next=index===rules.length-1?Math.max(0,remainder):Math.round(value*(Math.max(0,Number(r.amount)||0)/positiveBase)*100)/100;targetByRule[r.id]=next;remainder=Math.round((remainder-next)*100)/100;});}
    else targetByRule[rules[0].id]=value;
    state.monthlyAllocationOverrides=state.monthlyAllocationOverrides&&typeof state.monthlyAllocationOverrides==='object'&&!Array.isArray(state.monthlyAllocationOverrides)?state.monthlyAllocationOverrides:{};
    state.monthlyAllocationOverrides[key]=state.monthlyAllocationOverrides[key]&&typeof state.monthlyAllocationOverrides[key]==='object'&&!Array.isArray(state.monthlyAllocationOverrides[key])?state.monthlyAllocationOverrides[key]:{};
    for(const r of rules)state.monthlyAllocationOverrides[key][r.id]=targetByRule[r.id]||0;
    return {source:'monthlyAllocations',value};
  }
  ensureMonthBudget(key)[category]=value;
  return {source:'budget',value};
}
function migrateBudgetCategoryKey(obj,oldName,newName){if(!obj||typeof obj!=='object')return;if(Object.prototype.hasOwnProperty.call(obj,oldName)&&!Object.prototype.hasOwnProperty.call(obj,newName))obj[newName]=obj[oldName];delete obj[oldName];}
function renameBudgetCategory(id,newName){
  const def=state.budgetCategories?.find(c=>c.id===id); if(!def)return {ok:false};
  const clean=String(newName||'').trim(); if(clean.length<2)return {ok:false,error:'invalid-name'};
  const conflict=state.budgetCategories.find(c=>c.id!==id&&c.active&&c.name.toLowerCase()===clean.toLowerCase()); if(conflict)return {ok:false,error:'duplicate'};
  const oldName=def.name; if(oldName===clean)return {ok:true};
  def.aliases=[...new Set([...(def.aliases||[]),oldName])]; def.name=clean; def.updatedAt=new Date().toISOString();
  if(Object.prototype.hasOwnProperty.call(state.budgetDefaults||{},oldName)){state.budgetDefaults[clean]=state.budgetDefaults[oldName];delete state.budgetDefaults[oldName];}
  for(const m of Object.values(state.months||{}))migrateBudgetCategoryKey(m?.budget,oldName,clean);
  for(const a of state.monthlyAllocations||[])if(a.category===oldName)a.category=clean;
  return {ok:true};
}
function budgetCategoryHasHistory(def){
  if(!def)return false;
  const names=new Set([def.name,...(def.aliases||[])]);
  const hasTransactions=Array.isArray(state.transactions)&&state.transactions.some(t=>names.has(String(t.category||'')));
  const hasMonthlyBudget=Object.values(state.months||{}).some(m=>{const b=m?.budget;if(!b||typeof b!=='object')return false;return [...names].some(name=>Object.prototype.hasOwnProperty.call(b,name));});
  const hasAllocation=Array.isArray(state.monthlyAllocations)&&state.monthlyAllocations.some(a=>a.category===def.name);
  return hasTransactions||hasMonthlyBudget||hasAllocation;
}
function deleteBudgetCategory(id){
  const idx=state.budgetCategories?.findIndex(c=>c.id===id);
  if(idx==null||idx<0)return {ok:false,error:'not-found'};
  const def=state.budgetCategories[idx];
  if(budgetCategoryHasHistory(def))return {ok:false,error:'has-history'};
  const names=[def.name,...(def.aliases||[])];
  for(const name of names)delete state.budgetDefaults[name];
  state.budgetCategories.splice(idx,1);
  return {ok:true};
}
function archiveBudgetCategory(id){const def=state.budgetCategories?.find(c=>c.id===id);if(!def)return false;def.active=false;def.updatedAt=new Date().toISOString();return true;}
function restoreBudgetCategory(id){const def=state.budgetCategories?.find(c=>c.id===id);if(!def)return false;if(state.budgetCategories.some(c=>c.id!==id&&c.active&&c.name.toLowerCase()===def.name.toLowerCase()))return false;def.active=true;def.updatedAt=new Date().toISOString();return true;}
function addBudgetCategory({name,amount=0,type='expense'}){
  const clean=String(name||'').trim(); if(clean.length<2)return {ok:false,error:'invalid-name'};
  if(state.budgetCategories.some(c=>c.name.toLowerCase()===clean.toLowerCase()))return {ok:false,error:'duplicate'};
  const id=budgetCategorySlug(clean)+(state.budgetCategories.some(c=>c.id===budgetCategorySlug(clean))?'-2':'');
  const def=normalizeBudgetCategory({id,name:clean,type,active:true,origin:'custom',aliases:[]}); state.budgetCategories.push(def); state.budgetDefaults[clean]=Math.max(0,Number(amount)||0); return {ok:true,def};
}
function getBudgetCategoryDefsForType(type,selected=''){const defs=budgetCategoryDefs();return defs.filter(d=>d.name===selected||((type==='expense'&&d.type==='expense')||(type!=='expense'&&isBudgetSavingType(d.type))));}
function getActualByCategory(key=monthKey()) { const out={}; for(const t of getMonthTransactions(key)){ if(t.type==='expense'){const def=budgetCategoryByName(t.category);const name=def?.name||t.category;out[name]=(out[name]||0)+Number(t.amount||0);} } return out; }
function getSavedByCategory(key=monthKey()) { const out={}; for(const t of getMonthTransactions(key)){ if(['saving','transfer','investment'].includes(t.type)){const def=budgetCategoryByName(t.category);const name=def?.name||t.category;out[name]=(out[name]||0)+Number(t.amount||0);} } return out; }
function plannedSavings(key=monthKey()){const b=getBudget(key);return budgetCategoryDefs().filter(d=>isBudgetSavingType(d.type)).reduce((s,d)=>s+(Number(b[d.name])||0),0)}
function plannedExpenses(key=monthKey()){const b=getBudget(key);return budgetCategoryDefs().filter(d=>d.type==='expense').reduce((s,d)=>s+(Number(b[d.name])||0),0)}
function getSalaryRecord(key){return state.salaryRecords.find(r=>r.month===key)||null;}
function plannedIncome(key=monthKey()){ const record=getSalaryRecord(key); if(record && Number(record.netPlanned)>=0) return Number(record.netPlanned)||0; const plan=state.salaryPlan||{}; if(plan.effectiveFrom && key>=plan.effectiveFrom && Number(plan.netMonthly)>=0) return Number(plan.netMonthly)||0; return Number(state.profile.netMonthly)||0; }
function actualIncome(key=monthKey()){ const record=getSalaryRecord(key); if(record && ['received','partial'].includes(record.status)) return Math.max(0, Number(record.netReceived||0)+Number(record.extraIncome||0)); return plannedIncome(key); }
function incomeUsedForMonth(key=monthKey()){ const record=getSalaryRecord(key); return record && ['received','partial'].includes(record.status) ? actualIncome(key) : plannedIncome(key); }
function plannedFree(key=monthKey()){return plannedIncome(key)-plannedExpenses(key)-plannedSavings(key);}
function actualExpenses(key=monthKey()){return getMonthTransactions(key).filter(t=>t.type==='expense' && t.category!=='Viagens' && t.source!=='travel-fund').reduce((s,t)=>s+Number(t.amount||0),0);}
function actualTravelPayments(key=monthKey()){return getMonthTransactions(key).filter(t=>t.type==='expense' && (t.category==='Viagens' || t.source==='travel-fund')).reduce((s,t)=>s+Number(t.amount||0),0);}
function actualSaved(key=monthKey()){return sumTransactions(key,'saving');}
function actualRemainingSpendable(key=monthKey()){ const b=getBudget(key), a=getActualByCategory(key), defs=budgetCategoryDefs().filter(d=>d.type==='expense'); return defs.reduce((s,d)=>s+Math.max(0,(Number(b[d.name])||0)-(a[d.name]||0)),0); }
function actualCapitalFree(key=monthKey()){ return financeMonthFree(key); }
function normalizeMonthlyAllocation(a={}){
  const allowed=['expense','saving','travel','investment','transfer'];
  const now=new Date().toISOString();
  const rawType=String(a.type||'saving').trim().toLowerCase();
  const type=allowed.includes(rawType)?rawType:'saving';
  const name=String(a.name||a.category||'Destino').trim()||'Destino';
  const category=String(a.category||name).trim()||name;
  return {
    ...a,
    id:String(a.id||cryptoRandom()),
    name,
    category,
    type,
    amount:Math.max(0,Number(a.amount)||0),
    active:!(a.active===false||a.active===0||String(a.active||'').toLowerCase()==='false'),
    priority:Math.max(0,Number(a.priority)||0),
    notes:String(a.notes||''),
    linkedCommitmentId:a.linkedCommitmentId?String(a.linkedCommitmentId):'',
    createdAt:a.createdAt||now,
    updatedAt:a.updatedAt||now
  };
}
function allocationTypeLabel(type){return ({expense:'Despesa',saving:'Poupança',travel:'Viagem',investment:'Investimento',transfer:'Transferência'})[type]||'Destino';}
function normalizeAllocationText(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function findSimilarCommitmentsForAllocation(rule,key=monthKey()){if(rule.type!=='expense')return[];const monthStart=`${key}-01`,monthEnd=`${key}-${pad2(daysInMonthKey(key))}`,targetAmount=Math.max(0,Number(rule.amount)||0),targetCategory=rule.category||'Outros',targetName=normalizeAllocationText(rule.name);return state.commitments.filter(c=>c.active&&['monthly','once'].includes(c.frequency)).filter(c=>{const amount=Math.max(0,Number(c.amount)||0),mapped=mapCommitmentToExpenseCategory(c.category),dateMatch=commitmentOccurrenceDates(c,monthStart,monthEnd).length>0,name=normalizeAllocationText(c.name),similarName=targetName&&name&&(name.includes(targetName)||targetName.includes(name));return dateMatch&&Math.abs(amount-targetAmount)<=0.01&&(mapped===targetCategory||similarName);});}
function renderAllocationSummary(key=monthKey()){const summary=getAllocationSummary(key),list=document.getElementById('allocationList');if(!list)return;const monthSelect=document.getElementById('allocationMonthSelect');if(monthSelect)monthSelect.value=key;allocationSelectedMonth=key;const incomeEl=document.getElementById('allocationIncome');if(incomeEl)incomeEl.textContent=currency(summary.income);const totalEl=document.getElementById('allocationTotal');if(totalEl)totalEl.textContent=currency(summary.total);const freeEl=document.getElementById('allocationFree');if(freeEl){freeEl.textContent=currency(summary.freeAfterDistribution);setMoneyValueClass(freeEl,summary.freeAfterDistribution);}const percent=Math.min(100,Math.max(0,summary.percent)),bar=document.getElementById('allocationProgressBar');if(bar)bar.style.width=`${percent}%`;const percentEl=document.getElementById('allocationPercent');if(percentEl)percentEl.textContent=`${Math.round(summary.percent)}%`;const deficitEl=document.getElementById('allocationDeficit');if(deficitEl){deficitEl.classList.toggle('hidden',summary.deficit<=0);if(summary.deficit>0)deficitEl.innerHTML=`<strong>△ Distribuição acima da renda</strong><span>Sua distribuição mensal está ${currency(summary.deficit)} acima do salário de ${currency(summary.income)}.</span><button type="button" class="text-button" data-allocation-action="edit-summary">Editar distribuição</button>`;}const allRules=[...(state.monthlyAllocations||[])].sort((a,b)=>(a.active===b.active?0:a.active?-1:1)||Number(a.priority||0)-Number(b.priority||0)||a.name.localeCompare(b.name));list.innerHTML=allRules.length?allRules.map(a=>{const effective=allocationEffectiveAmount(a,key),override=state.monthlyAllocationOverrides?.[key]?.[a.id],overrideLabel=Number.isFinite(Number(override))?'<small class="allocation-exception">Exceção deste mês</small>':'',icon=iconIdForCategory(a.category,a.type);return `<div class="allocation-row ${a.active?'':'paused'}" data-id="${escapeHtml(a.id)}"><div class="allocation-main"><span class="allocation-icon">${iconSvg(icon)}</span><div><strong>${escapeHtml(a.name)}</strong><small>${allocationTypeLabel(a.type)} · ${escapeHtml(a.category||'Destino')} ${a.linkedCommitmentId?'· compromisso vinculado':''}</small>${overrideLabel}</div></div><button type="button" class="allocation-amount allocation-inline-edit" data-id="${escapeHtml(a.id)}" aria-label="Editar valor de ${escapeHtml(a.name)}">${currency2(effective)}</button><div class="allocation-actions"><span class="allocation-status ${a.active?'active':'paused'}">${a.active?'● Ativo':'○ Pausado'}</span><button type="button" class="icon-button small-icon" data-allocation-action="toggle" data-id="${escapeHtml(a.id)}" title="${a.active?'Pausar':'Reativar'}" aria-label="${a.active?'Pausar':'Reativar'} ${escapeHtml(a.name)}">${a.active?iconSvg('i-pause','action-icon'):iconSvg('i-play','action-icon')}</button><button type="button" class="icon-button small-icon" data-allocation-action="edit" data-id="${escapeHtml(a.id)}" title="Editar regra" aria-label="Editar regra ${escapeHtml(a.name)}">${iconSvg('i-edit','action-icon')}</button><button type="button" class="icon-button small-icon danger-icon" data-allocation-action="delete" data-id="${escapeHtml(a.id)}" title="Excluir" aria-label="Excluir ${escapeHtml(a.name)}">${iconSvg('i-trash','action-icon')}</button></div></div>`;}).join(''):'<div class="allocation-empty"><strong>Defina seus primeiros destinos mensais.</strong><span>Ex.: Brasil, viagens, reserva e investimentos. O Hub usará essas regras no planejamento sem criar transações reais.</span><button type="button" class="secondary-button" data-allocation-action="migrate">Configurar a partir do orçamento</button></div>';const spend=financeAvailableToSpend(key),planningSpend=document.getElementById('allocationSpendable');if(planningSpend){planningSpend.textContent=currency(spend);setMoneyValueClass(planningSpend,spend);}renderAllocationFlow(summary);}
function renderAllocationFlow(summary){const flow=document.getElementById('allocationFlow');if(!flow)return;const top=summary.allocations.slice(0,5);flow.innerHTML=`<div class="allocation-flow-node source"><span>Salário</span><strong>${currency(summary.income)}</strong></div><div class="allocation-flow-line"></div><div class="allocation-flow-destinations">${top.map(a=>`<div class="allocation-flow-node"><span>${escapeHtml(a.name)}</span><strong>${currency(a.effectiveAmount)}</strong></div>`).join('')}<div class="allocation-flow-node free"><span>Livre após distribuição</span><strong>${currency(summary.freeAfterDistribution)}</strong></div></div>`;}
function renderAllocationMonthSelect(){const el=document.getElementById('allocationMonthSelect');if(!el)return;const current=monthKey(),selected=allocationSelectedMonth||current;const keys=Array.from({length:25},(_,i)=>addMonthsKey(current,i-12));if(!keys.includes(selected))keys.push(selected);keys.sort();el.innerHTML=keys.map(k=>`<option value="${k}">${monthLabel(k)}</option>`).join('');el.value=selected;}
function openAllocationModal(id='',forcedMonth=''){const rule=id?state.monthlyAllocations.find(a=>a.id===id):null,key=forcedMonth||document.getElementById('allocationMonthSelect')?.value||allocationSelectedMonth||monthKey(),override=rule?state.monthlyAllocationOverrides?.[key]?.[rule.id]:undefined;allocationSelectedMonth=key;document.getElementById('allocationId').value=rule?.id||'';document.getElementById('allocationMonth').value=key;document.getElementById('allocationName').value=rule?.name||'';document.getElementById('allocationType').value=rule?.type||'saving';populateAllocationCategories(rule?.type||'saving',rule?.category||'');document.getElementById('allocationAmount').value=rule?.amount??'';document.getElementById('allocationUseOverride').checked=Number.isFinite(Number(override));document.getElementById('allocationOverrideAmount').value=Number.isFinite(Number(override))?override:(rule?.amount??'');document.getElementById('allocationOverrideLabel').classList.toggle('hidden',!rule);document.getElementById('allocationUseOverride').closest('.check-row').classList.toggle('hidden',!rule);document.getElementById('allocationOverrideAmount').disabled=!rule||!Number.isFinite(Number(override));document.getElementById('allocationPriority').value=rule?.priority??0;document.getElementById('allocationActive').checked=rule?.active!==false;document.getElementById('allocationNotes').value=rule?.notes||'';document.getElementById('allocationTitle').textContent=rule?'Editar destino':'Adicionar destino';document.getElementById('allocationExceptionHint').textContent=rule?`Padrão: ${currency(rule.amount)} · ${monthLabel(key)}: ${Number.isFinite(Number(override))?currency(override):currency(rule.amount)}.`:'A regra será aplicada automaticamente; nenhuma transação real será criada.';openModal('allocationModal');setTimeout(()=>document.getElementById('allocationName').focus(),50);}
function populateAllocationCategories(type,selected=''){
  const el=document.getElementById('allocationCategory');if(!el)return;
  const defs=budgetCategoryDefs();
  let predicate=()=>true;
  if(type==='travel')predicate=d=>d.type==='travel';
  else if(type==='investment')predicate=d=>d.type==='investment';
  else if(type==='transfer')predicate=d=>d.type==='transfer';
  else if(type==='expense')predicate=d=>d.type==='expense';
  else predicate=d=>isBudgetSavingType(d.type);
  const categories=[...new Set(defs.filter(d=>d.name===selected||predicate(d)).map(d=>d.name).concat(selected||[]).filter(Boolean))];
  el.innerHTML=categories.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if(selected&&categories.includes(selected))el.value=selected;
}

function saveMonthlyAllocation(e){e.preventDefault();const id=document.getElementById('allocationId').value,name=document.getElementById('allocationName').value.trim(),type=document.getElementById('allocationType').value,category=document.getElementById('allocationCategory').value,amount=Math.max(0,Number(document.getElementById('allocationAmount').value)||0),active=document.getElementById('allocationActive').checked,priority=Math.max(0,Number(document.getElementById('allocationPriority').value)||0),notes=document.getElementById('allocationNotes').value.trim(),key=document.getElementById('allocationMonth').value||monthKey(),useOverride=Boolean(document.getElementById('allocationUseOverride').checked),overrideAmount=Math.max(0,Number(document.getElementById('allocationOverrideAmount').value)||0);if(!name||!category){showToast('Informe um nome e um destino.');return;}const now=new Date().toISOString(),existing=id?state.monthlyAllocations.find(a=>a.id===id):null,candidate=normalizeMonthlyAllocation({...(existing||{}),id:id||cryptoRandom(),name,type,category,amount,active,priority,notes,updatedAt:now});if(!existing){const similar=findSimilarCommitmentsForAllocation(candidate,key);if(similar.length){const c=similar[0],useExisting=confirm(`Já existe um compromisso semelhante: “${c.name}”, ${currency2(c.amount)}.\n\nOK = usar o compromisso existente como base da distribuição.\nCancelar = criar uma distribuição separada.`);if(useExisting){c.includedInBudget=true;c.updatedAt=now;candidate.linkedCommitmentId=c.id;}}state.monthlyAllocations.push(candidate);}else{const idx=state.monthlyAllocations.findIndex(a=>a.id===id);state.monthlyAllocations[idx]=candidate;}state.monthlyAllocationOverrides=state.monthlyAllocationOverrides||{};if(id&&useOverride){state.monthlyAllocationOverrides[key]=state.monthlyAllocationOverrides[key]||{};state.monthlyAllocationOverrides[key][id]=overrideAmount;}else if(id&&state.monthlyAllocationOverrides[key]){delete state.monthlyAllocationOverrides[key][id];}saveState();closeModal('allocationModal');renderAll();showToast(existing?'Destino atualizado.':'Destino mensal criado.');}
function toggleMonthlyAllocation(id){const a=state.monthlyAllocations.find(x=>x.id===id);if(!a)return;a.active=!a.active;a.updatedAt=new Date().toISOString();saveState();renderAll();showToast(a.active?'Destino reativado.':'Destino pausado.');}
function deleteMonthlyAllocation(id){const a=state.monthlyAllocations.find(x=>x.id===id);if(!a)return;if(!confirm(`Excluir “${a.name}”? A regra será removida do planejamento futuro, mas nenhuma transação histórica será alterada.`))return;state.monthlyAllocations=state.monthlyAllocations.filter(x=>x.id!==id);for(const overrides of Object.values(state.monthlyAllocationOverrides||{}))delete overrides[id];saveState();renderAll();showToast('Destino excluído.');}
function inlineEditAllocation(id,key){const rule=state.monthlyAllocations.find(x=>x.id===id);if(!rule)return;const row=document.querySelector(`.allocation-row[data-id="${CSS.escape(id)}"]`),button=row?.querySelector('.allocation-inline-edit');if(!button||button.dataset.editing==='1')return;button.dataset.editing='1';const current=allocationEffectiveAmount(rule,key);button.innerHTML=`<input class="allocation-inline-input" type="number" min="0" step="1" value="${current}" aria-label="Novo valor para ${escapeHtml(rule.name)}">`;const input=button.querySelector('input');input.focus();input.select();let cancelled=false;const save=()=>{if(cancelled)return;const value=Math.max(0,Number(input.value)||0),baseAmount=Math.max(0,Number(rule.amount)||0);state.monthlyAllocationOverrides=state.monthlyAllocationOverrides||{};if(key!==monthKey()||Math.abs(value-baseAmount)>0.001){state.monthlyAllocationOverrides[key]=state.monthlyAllocationOverrides[key]||{};state.monthlyAllocationOverrides[key][id]=value;}else if(state.monthlyAllocationOverrides[key]){delete state.monthlyAllocationOverrides[key][id];}saveState();renderAll();showToast(key===monthKey()?'Valor atualizado neste mês.':'Exceção mensal salva.');};input.addEventListener('blur',save,{once:true});input.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();input.blur();}else if(ev.key==='Escape'){cancelled=true;input.value=current;input.blur();renderAll();}});}
function migrateBudgetToAllocations(key=budgetSelectedMonth||monthKey()){
  const candidates=getAllocationCandidatesForMigration(key);
  if(!candidates.length){showToast('Não há valores do orçamento para configurar.');return;}
  const newItems=candidates.filter(c=>!c.matches?.length);
  const conflicts=candidates.filter(c=>c.matches?.length);
  const lines=[...newItems.map(c=>`+ ${c.name} ${currency(c.amount)}`),...conflicts.map(c=>`• ${c.name} já configurado`)];
  if(!confirm(`Encontramos estes valores no orçamento de ${monthLabel(key)}:\n\n${lines.join('\n')}\n\nConfigurar esses valores como destinos automáticos do salário?`))return;
  let created=0,updated=0;
  for(const c of newItems){state.monthlyAllocations.push(normalizeMonthlyAllocation({name:c.name,category:c.category,amount:c.amount,type:c.type,role:c.role||'',active:true,priority:0,notes:''}));created++;}
  for(const c of conflicts){
    const target=c.matches.find(a=>a.active)||c.matches[0];if(!target)continue;
    const current=Math.max(0,Number(target.amount)||0);if(Math.abs(current-c.amount)<=0.001)continue;
    if(confirm(`${c.name} já possui uma distribuição de ${currency(current)}.\n\nO orçamento está em ${currency(c.amount)}.\n\nDeseja atualizar a distribuição para ${currency(c.amount)}?`)){target.amount=c.amount;target.updatedAt=new Date().toISOString();updated++;}
  }
  saveState();renderAll();showToast(`${created} destino(s) criado(s)${updated?` e ${updated} atualizado(s)`:''}.`);
}
function bindAllocationEvents(){const add=document.getElementById('addAllocationBtn');if(add)add.addEventListener('click',()=>openAllocationModal());document.getElementById('configureAllocationsFromBudgetBtn')?.addEventListener('click',()=>migrateBudgetToAllocations(budgetSelectedMonth||monthKey()));const form=document.getElementById('allocationForm');if(form)form.addEventListener('submit',saveMonthlyAllocation);document.getElementById('allocationType')?.addEventListener('change',e=>populateAllocationCategories(e.target.value,document.getElementById('allocationCategory')?.value||''));document.getElementById('allocationUseOverride')?.addEventListener('change',e=>{const input=document.getElementById('allocationOverrideAmount');if(input)input.disabled=!e.target.checked;});document.getElementById('allocationMonthSelect')?.addEventListener('change',()=>{allocationSelectedMonth=document.getElementById('allocationMonthSelect').value;renderAllocationSummary(allocationSelectedMonth);});document.getElementById('allocationPrevMonth')?.addEventListener('click',()=>{allocationSelectedMonth=addMonthsKey(allocationSelectedMonth,-1);renderAllocationMonthSelect();renderAllocationSummary(allocationSelectedMonth);});document.getElementById('allocationNextMonth')?.addEventListener('click',()=>{allocationSelectedMonth=addMonthsKey(allocationSelectedMonth,1);renderAllocationMonthSelect();renderAllocationSummary(allocationSelectedMonth);});document.getElementById('allocationList')?.addEventListener('click',e=>{const btn=e.target.closest('[data-allocation-action]');if(btn){const action=btn.dataset.allocationAction,id=btn.dataset.id;if(action==='edit')openAllocationModal(id);else if(action==='toggle')toggleMonthlyAllocation(id);else if(action==='delete')deleteMonthlyAllocation(id);else if(action==='migrate')migrateBudgetToAllocations();else if(action==='edit-summary')openAllocationModal();return;}const amount=e.target.closest('.allocation-inline-edit');if(amount)inlineEditAllocation(amount.dataset.id,document.getElementById('allocationMonthSelect').value);});}

function renderDashboard() {
  const key=monthKey();
  const income=incomeUsedForMonth(key);
  document.getElementById('dashIncome').textContent=currency(income);
  document.getElementById('dashSpent').textContent=currency(actualExpenses(key)+actualTravelPayments(key));
  document.getElementById('dashSaved').textContent=currency(actualSaved(key));
  document.getElementById('dashCanSpend').textContent=currency(actualRemainingSpendable(key));
  const dashFree=actualCapitalFree(key); document.getElementById('dashFree').textContent=currency(dashFree); setMoneyValueClass(document.getElementById('dashFree'),dashFree);
  const savings=goalSaved('g6'); const emergency=state.goals.find(g=>g.id==='g6'); const house=state.goals.find(g=>g.id==='g2');
  setCard('emergencyCard','emergencyMeta','emergencyBar',savings,emergency?.target||3000);
  setCard('houseCard','houseMeta','houseBar',house?.current||0,house?.target||15000);
  const tripFund=calculateTravelFund();
  setCard('travelCard','travelMeta','travelBar',tripFund,getTravelAnnualBudget(),`Aportes ${currency(getTravelSavedTotal())}`);
  document.getElementById('netWorthCard').textContent=currency(calculateNetWorth());
  const worldCount=getVisitedCountryCount(); const currentYear=new Date().getFullYear();
  document.getElementById('worldCard').textContent=`${worldCount} ${worldCount===1?'país':'países'}`;
  document.getElementById('worldMeta').textContent=`${getNewCountriesCount(currentYear)} novos em ${currentYear}`;
  const central=buildFinanceSnapshot(key); document.getElementById('financeSpendCard').textContent=currency(central.availableToSpend); document.getElementById('financeSpendMeta').textContent=central.health.title;
  const planning=buildPlanningProjection(); document.getElementById('planningDash12').textContent=currency(planning.netWorthAt(12)); document.getElementById('planningDashMeta').textContent='patrimônio em 12 meses';
  renderNextGoal(); renderNextTrip(); renderMoneyPlan(); renderDashboardAllocationSummary(key);
  updateCharts();
}
function renderDashboardAllocationSummary(key=monthKey()){const el=document.getElementById('dashboardAllocationSummary');if(!el)return;const s=getAllocationSummary(key);el.innerHTML=`<div class="dashboard-allocation-head"><div><span>Seu salário</span><strong>${currency(s.income)}</strong></div><div><span>Distribuído</span><strong>${currency(s.total)}</strong></div><div><span>Livre após distribuição</span><strong class="${s.freeAfterDistribution<0?'negative':''}">${currency(s.freeAfterDistribution)}</strong></div></div><div class="dashboard-allocation-line"><span style="width:${clamp(s.percent,0,100)}%"></span></div><div class="dashboard-allocation-foot"><span>${Math.round(s.percent)}% distribuído</span><button class="text-button" data-page="money">Ver distribuição →</button></div>`;}
function setCard(valueId,metaId,barId,value,target,metaOverride){const p=target?clamp(value/target*100,0,100):0;document.getElementById(valueId).textContent=currency(value);document.getElementById(metaId).textContent=metaOverride||`${Math.round(p)}% da meta`;document.getElementById(barId).style.width=`${p}%`;}
function goalSaved(id){return state.goals.find(g=>g.id===id)?.current||0;}
function calculateNetWorth(){
  const today=todayISO();
  const startingCash=Number(state.profile.startingCash)||0;
  const realizedIncome=state.salaryRecords.reduce((sum,r)=>{
    if(!r||!['received','partial'].includes(r.status)) return sum;
    if(r.month && r.month>monthKey(today)) return sum;
    if(r.paymentDate && r.paymentDate>today) return sum;
    return sum+Math.max(0,Number(r.netReceived||0))+Math.max(0,Number(r.extraIncome||0));
  },0);
  const realizedConsumption=state.transactions.filter(t=>t.type==='expense' && (!t.date || t.date<=today))
    .reduce((sum,t)=>sum+Math.max(0,Number(t.amount)||0),0);
  // Patrimônio = caixa inicial + receitas efetivamente recebidas - consumo efetivamente pago.
  // Transferências para reservas, metas, fundo de viagens e investimentos são apenas mudanças de composição e não reduzem patrimônio.
  return startingCash+realizedIncome-realizedConsumption;
}
// ===== FASE 5 — PLANEJAMENTO FINANCEIRO =====
function planningCurrentNetWorth(){ return Number(calculateNetWorth())||0; }
function planningTripCostForMonth(key){
  return state.trips.filter(t=>t.start?.startsWith(key) && t.status!=='cancelada' && t.status!=='realizada')
    .reduce((s,t)=>s+getTripEstimated(t),0);
}
function planningCurrentKey(){ return monthKey(); }
function planningFutureIncome(key){
  const current=planningCurrentKey();
  if(key<current) return 0;
  const record=getSalaryRecord(key);
  const planned=plannedIncome(key);
  if(key===current){
    if(record && ['received','partial'].includes(record.status)) return Math.max(0,planned-actualIncome(key));
    return planned;
  }
  return planned;
}
function planningTripConsumptionForMonth(key){
  return state.trips.filter(t=>t.start?.startsWith(key) && t.status!=='cancelada' && t.status!=='realizada')
    .reduce((sum,t)=>sum+getTripEstimated(t),0);
}
function planningMonthlyConsumption(key){
  const current=planningCurrentKey();
  const planned=plannedExpenseTotal(key);
  const actual=actualExpenses(key);
  const baseline=Math.max(planned,actual);
  const remainingConsumer=key===current?Math.max(0,baseline-actual):baseline;
  const additionalCommitments=financeOutstandingCommitments(key);
  const tripConsumption=planningTripConsumptionForMonth(key);
  return remainingConsumer+additionalCommitments+tripConsumption;
}
function planningMonthlyNetChange(key,scenario='base'){
  let income=planningFutureIncome(key);
  let consumption=planningMonthlyConsumption(key);
  if(scenario==='conservative'){ income*=0.90; consumption*=1.10; }
  if(scenario==='optimistic'){ income*=1.10; consumption*=0.90; }
  return income-consumption;
}
function planningMonthlyAllocation(key){
  return {
    saving: plannedSavingsTotal(key),
    investment: Number(getBudget(key).Investimentos||0),
    free: financeMonthFree(key)
  };
}
function buildPlanningProjection(scenario='base', overrideModel=null){
  const currentKey=planningCurrentKey();
  const base=planningCurrentNetWorth();
  const values=[base];
  for(let i=1;i<=12;i++){
    const key=addMonthsKey(currentKey,i);
    let delta;
    if(overrideModel && typeof overrideModel.income==='function' && typeof overrideModel.consumption==='function'){
      const income=Number(overrideModel.income(key,i))||0;
      const consumption=Number(overrideModel.consumption(key,i))||0;
      delta=income-consumption;
    } else {
      delta=planningMonthlyNetChange(key,scenario);
    }
    values[i]=values[i-1]+delta;
  }
  return {base,values,netWorthAt(months){const m=Math.min(12,Math.max(0,Number(months)||0));return values[m]??base;}};
}
function planningSavingCapacityForMonth(key){
  const income=planningFutureIncome(key);
  const consumption=planningMonthlyConsumption(key);
  return income-consumption;
}
function planningAverageSavingCapacity(months=3){
  const values=[];
  for(let i=0;i<Math.max(1,months);i++) values.push(planningSavingCapacityForMonth(addMonthsKey(planningCurrentKey(),i)));
  const positive=values.map(v=>Math.max(0,v));
  return positive.reduce((a,b)=>a+b,0)/positive.length;
}
function planningGoalAnalysis(goal){
  const current=Number(goal.current)||0, target=Number(goal.target)||0, remaining=Math.max(0,target-current);
  if(remaining<=0) return {onTrack:true,required:0,forecastMonths:0,remaining:0,deadline:0,capacity:planningAverageSavingCapacity(3)};
  const deadline=Math.max(1,Number(goal.months)||12), monthly=Math.max(0,Number(goal.monthly)||0);
  const required=Math.ceil(remaining/deadline);
  const forecastMonths=monthly>0?Math.ceil(remaining/monthly):Infinity;
  const capacity=planningAverageSavingCapacity(Math.min(3,deadline));
  const sustainable=monthly<=capacity+0.005;
  return {onTrack:forecastMonths<=deadline&&sustainable,required,forecastMonths,remaining,deadline,monthly,capacity,sustainable};
}
function planningRequiredMonthly(){
  return state.goals.filter(g=>Number(g.current||0)<Number(g.target||0)).reduce((s,g)=>s+planningGoalAnalysis(g).required,0);
}
function planningGoalsOnTrack(){
  const active=state.goals.filter(g=>Number(g.current||0)<Number(g.target||0));
  return {total:active.length,ok:active.filter(g=>planningGoalAnalysis(g).onTrack).length};
}
function planningTravelNeed12(){
  const end=addMonthsKey(monthKey(),12)+'-31';
  let need=0;
  const projectedFund=projectedTravelFundAt(end);
  if(projectedFund<0) need=Math.abs(projectedFund);
  return need;
}
function planningScenarioParams(name){
  const readOptionalNumber=id=>{const raw=document.getElementById(id)?.value; if(raw===undefined||String(raw).trim()==='') return null; const n=Number(raw); return Number.isFinite(n)&&n>=0?n:null;};
  const income=readOptionalNumber('planningScenarioIncome');
  const expense=readOptionalNumber('planningScenarioExpense');
  const saving=readOptionalNumber('planningScenarioSaving');
  const investment=readOptionalNumber('planningScenarioInvestment');
  const fallbackIncome=income??incomeUsedForMonth(monthKey());
  const fallbackExpense=expense??(plannedExpenseTotal(monthKey())+financeOutstandingCommitments(monthKey()));
  const fallbackSaving=saving??plannedSavingsTotal(monthKey());
  const fallbackInvestment=investment??Number(getBudget(monthKey()).Investimentos||0);
  const mult={conservative:{income:.9,expense:1.1},base:{income:1,expense:1},optimistic:{income:1.1,expense:.9}}[name]||{income:1,expense:1};
  return {income:fallbackIncome*mult.income,expense:fallbackExpense*mult.expense,saving:fallbackSaving,investment:fallbackInvestment};
}
function renderPlanning(){
  const projection=buildPlanningProjection('base');
  const current=projection.base, at12=projection.netWorthAt(12), growth=at12-current;
  const currentEl=document.getElementById('planningCurrentNetWorth'); if(!currentEl)return;
  currentEl.textContent=currency(current); document.getElementById('planning12NetWorth').textContent=currency(at12); document.getElementById('planning12Growth').textContent=`${growth>=0?'+':''}${currency(growth)}`;
  document.getElementById('planningWhereNow').textContent=currency(current); document.getElementById('planningWhereLater').textContent=currency(at12);
  const gstat=planningGoalsOnTrack(); document.getElementById('planningGoalsOnTrack').textContent=`${gstat.ok}/${gstat.total}`; document.getElementById('planningGoalsOnTrackMeta').textContent=gstat.total?'objetivos ativos no ritmo':'nenhum objetivo pendente';
  document.getElementById('planningTripNeed').textContent=currency(planningTravelNeed12());
  const headline=document.getElementById('planningHeadline');
  headline.textContent=growth>=0?`Mantendo o plano atual, seu patrimônio tende a crescer cerca de ${currency(growth)} em 12 meses.`:`Com o plano atual, a projeção indica uma redução de ${currency(Math.abs(growth))} no patrimônio em 12 meses.`;
  renderPlanningTimeline(); renderPlanningGoals(); renderPlanningScenario(); renderPlanningAdjust(); renderPlanningTravelSummary(); renderPlanningCommitmentSummary(); renderPlanningMonths(); renderPlanningChart();
}
function renderPlanningTimeline(){
  const box=document.getElementById('planningTimeline'); const p=buildPlanningProjection('base');
  const points=[0,1,3,6,12]; box.innerHTML=points.map(i=>{const key=addMonthsKey(monthKey(),i);const v=p.netWorthAt(i);return `<div class="planning-time-item"><span>${i===0?'Hoje':i+' mês'+(i===1?'':'es')}</span><strong>${currency(v)}</strong><small>${i===0?'patrimônio atual':'projeção'}</small></div>`}).join('');
}
function renderPlanningGoals(){
  const box=document.getElementById('planningGoalsList'); const active=state.goals.filter(g=>Number(g.current||0)<Number(g.target||0));
  if(!active.length){box.innerHTML=`<div class="empty-state"><strong>${iconSvg('i-check','status-line-icon')} Todas as metas estão concluídas.</strong></div>`;}
  else box.innerHTML=active.map(g=>{const a=planningGoalAnalysis(g);const p=clamp((Number(g.current)||0)/(Number(g.target)||1)*100,0,100);const cls=a.onTrack?'good':'bad';const forecast=a.forecastMonths===Infinity?'sem previsão':`${a.forecastMonths} meses`;return `<div class="planning-goal-item"><div><strong>${goalIconMarkup(g)} ${escapeHtml(g.name)}</strong><span>${currency(g.current)} / ${currency(g.target)} · ${Math.round(p)}%</span></div><div class="planning-goal-meta"><span class="status-pill ${cls}">${a.onTrack?iconSvg('i-check','status-line-icon')+' No ritmo':iconSvg('i-alert','status-line-icon')+' Fora do ritmo'}</span><small>Atual: ${currency(g.monthly||0)}/mês · necessário: ${currency(a.required)}/mês · capacidade estimada: ${currency(a.capacity||0)}/mês · previsão: ${forecast}</small></div></div>`}).join('');
  const required=planningRequiredMonthly(); const current=active.reduce((s,g)=>s+Math.max(0,Number(g.monthly)||0),0); const capacity=planningAverageSavingCapacity(3); const gap=Math.max(0,required-capacity); const advice=document.getElementById('planningGoalAdvice');
  if(!active.length) advice.innerHTML='<div class="result-card good"><strong>'+iconSvg('i-check','status-line-icon')+' Você está com todas as metas concluídas.</strong><p>Agora você pode escolher novas prioridades.</p></div>';
  else if(gap>0) advice.innerHTML=`<div class="result-card warn"><strong>${iconSvg('i-alert','status-line-icon')} Há metas fora do ritmo atual.</strong><p>Se quiser manter todos os prazos, sua capacidade média projetada é <strong>${currency(capacity)}/mês</strong> e seriam necessários aproximadamente <strong>${currency(required)}/mês</strong>. Faltam cerca de <strong>${currency(gap)}/mês</strong>.</p><p>Isso é uma sugestão: o Hub não redistribui seu dinheiro automaticamente.</p></div>`;
  else advice.innerHTML='<div class="result-card good"><strong>'+iconSvg('i-check','status-line-icon')+' Seu plano atual cobre os aportes necessários.</strong><p>As metas ativas estão, em conjunto, dentro do ritmo definido.</p></div>';
}
function buildPlanningScenarioFromInputs(name){
  const params=planningScenarioParams(name);
  const projection=buildPlanningProjection('base',{
    income:()=>params.income,
    consumption:()=>params.expense
  });
  // Guardar e investir são transferências internas: reduzem a liquidez livre do cenário,
  // mas não reduzem o patrimônio total quando não existe consumo/retorno envolvido.
  const monthlyCompositionTransfer=Math.max(0,params.saving)+Math.max(0,params.investment);
  const monthlyFree=params.income-params.expense-monthlyCompositionTransfer;
  return {
    params,
    monthlyFree,
    cumulativeSavingAt(months){return Math.max(0,params.saving)*Math.max(0,Number(months)||0);},
    cumulativeInvestmentAt(months){return Math.max(0,params.investment)*Math.max(0,Number(months)||0);},
    netWorthAt(months){return projection.netWorthAt(months);},
    freeAt(months){return monthlyFree*Math.max(0,Number(months)||0);}
  };
}
function renderPlanningScenario(){
  const incomeEl=document.getElementById('planningScenarioIncome'), expenseEl=document.getElementById('planningScenarioExpense'), savingEl=document.getElementById('planningScenarioSaving'), investmentEl=document.getElementById('planningScenarioInvestment');
  if(incomeEl&&!incomeEl.dataset.ready){incomeEl.value=Math.round(incomeUsedForMonth(monthKey())); incomeEl.dataset.ready='1';}
  if(expenseEl&&!expenseEl.dataset.ready){expenseEl.value=Math.round(plannedExpenseTotal(monthKey())+financeOutstandingCommitments(monthKey())); expenseEl.dataset.ready='1';}
  if(savingEl&&!savingEl.dataset.ready){savingEl.value=Math.round(plannedSavingsTotal(monthKey())); savingEl.dataset.ready='1';}
  if(investmentEl&&!investmentEl.dataset.ready){investmentEl.value=Math.round(Number(getBudget(monthKey()).Investimentos||0)); investmentEl.dataset.ready='1';}
  const customProjection=buildPlanningScenarioFromInputs(planningScenario); const params=customProjection.params;
  const at3=customProjection.netWorthAt(3),at6=customProjection.netWorthAt(6),at12=customProjection.netWorthAt(12);
  const labels={conservative:'Conservador: renda −10% e gastos +10%.',base:'Base: usa o seu plano atual.',optimistic:'Otimista: renda +10% e gastos −10%.'};
  document.querySelectorAll('[data-planning-scenario]').forEach(b=>b.classList.toggle('active',b.dataset.planningScenario===planningScenario));
  document.getElementById('planningScenarioCopy').innerHTML=`<p>${labels[planningScenario]}</p><div class="planning-scenario-values"><span>€${params.income.toFixed(0)}/mês de entrada</span><span>€${params.expense.toFixed(0)}/mês de gastos</span><span>€${params.saving.toFixed(0)}/mês guardados</span><span>€${params.investment.toFixed(0)}/mês investidos</span></div>`;
  document.getElementById('planningScenarioResult').innerHTML=`<div class="planning-scenario-grid"><div><span>3 meses</span><strong>${currency(at3)}</strong></div><div><span>6 meses</span><strong>${currency(at6)}</strong></div><div><span>12 meses</span><strong>${currency(at12)}</strong></div></div><div class="planning-scenario-composition"><div><span>Liquidez livre do cenário / mês</span><strong class="${customProjection.monthlyFree<0?'negative':''}">${currency(customProjection.monthlyFree)}</strong></div><div><span>Guardado em 12 meses</span><strong>${currency(customProjection.cumulativeSavingAt(12))}</strong></div><div><span>Investido em 12 meses</span><strong>${currency(customProjection.cumulativeInvestmentAt(12))}</strong></div></div><p class="planning-footnote">Guardar e investir mudam a composição e a liquidez do dinheiro. Sem consumo ou rentabilidade, não reduzem o patrimônio total.</p>`;
}
function renderPlanningAdjust(){
  const currentSaving=Math.max(0,planningAverageSavingCapacity(1)); const currentExpense=plannedExpenseTotal(monthKey())+financeOutstandingCommitments(monthKey());
  const saveInput=document.getElementById('planningAdjustSaving'), expInput=document.getElementById('planningAdjustExpense');
  if(saveInput&&!saveInput.dataset.ready){saveInput.value=currentSaving;saveInput.dataset.ready='1';} if(expInput&&!expInput.dataset.ready){expInput.value=currentExpense;expInput.dataset.ready='1';}
  const newSaving=Number(saveInput?.value)||0,newExpense=Number(expInput?.value)||0; const savingDelta=(newSaving-currentSaving)*12; const expenseDelta=(currentExpense-newExpense)*12;
  document.getElementById('planningAdjustResult').innerHTML=`<div class="adjust-row"><span>Impacto em dinheiro guardado</span><strong>${savingDelta>=0?'+':''}${currency(savingDelta)}</strong></div><div class="adjust-row"><span>Impacto no patrimônio por mudança de gasto</span><strong>${expenseDelta>=0?'+':''}${currency(expenseDelta)}</strong></div><p class="planning-footnote">Aumentar apenas a transferência para um "potinho" não cria patrimônio novo; reduzir gastos, sim, preserva mais dinheiro.</p>`;
}
function renderPlanningTravelSummary(){
  const planned12=state.trips.filter(t=>t.start&&t.start>todayISO()&&t.start<=`${addMonthsKey(monthKey(),12)}-31`&&t.status!=='cancelada').reduce((s,t)=>s+getTripEstimated(t),0); const need=planningTravelNeed12(); const fund=projectedTravelFundAt(`${addMonthsKey(monthKey(),12)}-31`);
  document.getElementById('planningTravelSummary').innerHTML=`<div class="planning-summary-line"><span>Viagens planejadas</span><strong>${currency(planned12)}</strong></div><div class="planning-summary-line"><span>Fundo projetado</span><strong>${currency(fund)}</strong></div><div class="planning-summary-line"><span>Necessidade adicional</span><strong>${currency(need)}</strong></div><p>${need>0?`${iconSvg('i-alert','status-line-icon')} Algumas viagens ainda exigem dinheiro além do fundo projetado.`:`${iconSvg('i-check','status-line-icon')} O fundo projetado cobre a necessidade de viagens considerada.`}</p>`;
}
function renderPlanningCommitmentSummary(){
  const months=[0,1,2,3,4,5,6,7,8,9,10,11]; const total=months.reduce((s,i)=>s+financeOutstandingCommitments(addMonthsKey(monthKey(),i)),0); const recurring=state.commitments.filter(c=>c.active&&c.frequency!=='once').reduce((s,c)=>s+commitmentMonthlyRecurringAmount(c),0);
  document.getElementById('planningCommitmentSummary').innerHTML=`<div class="planning-summary-line"><span>Compromissos adicionais em 12 meses</span><strong>${currency(total)}</strong></div><div class="planning-summary-line"><span>Recorrentes estimados/mês</span><strong>${currency(recurring)}</strong></div><p>Contas já refletidas no orçamento não são descontadas novamente.</p>`;
}
function renderPlanningMonths(){
  const body=document.getElementById('planningMonthsBody'); body.innerHTML=[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>{const key=addMonthsKey(monthKey(),i);const income=i===0?incomeUsedForMonth(key):plannedIncome(key);const commitments=financeOutstandingCommitments(key);const saved=plannedSavingsTotal(key);const free=planningSavingCapacityForMonth(key);const record=getSalaryRecord(key);const real=!!record&&['received','partial'].includes(record.status);return `<tr><td><strong>${monthLabel(key)}</strong> <small class="muted">${real?'Real':'Projetado'}</small></td><td>${currency(income)}</td><td>${currency(commitments)}</td><td>${currency(saved)}</td><td class="${free<0?'negative':''}"><strong>${currency(free)}</strong></td></tr>`}).join('');
}
function renderPlanningChart(){
  if(!window.Chart||!document.getElementById('planningProjectionChart'))return; const p=buildPlanningScenarioFromInputs(planningScenario); const labels=['Hoje','+1m','+3m','+6m','+12m']; const data=[p.netWorthAt(0),p.netWorthAt(1),p.netWorthAt(3),p.netWorthAt(6),p.netWorthAt(12)]; const ctx=document.getElementById('planningProjectionChart').getContext('2d'); charts.planningProjection?.destroy(); charts.planningProjection=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:'Patrimônio projetado',data,tension:.25,borderWidth:2}]},options:{responsive:true,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:false,ticks:{callback:v=>`€${v}`}}}}});
}
function bindPlanningControls(){
  document.querySelectorAll('[data-planning-scenario]').forEach(btn=>btn.addEventListener('click',()=>{planningScenario=btn.dataset.planningScenario;renderPlanning();}));
  ['planningScenarioIncome','planningScenarioExpense','planningScenarioSaving','planningScenarioInvestment','planningAdjustSaving','planningAdjustExpense'].forEach(id=>{const el=document.getElementById(id); if(el)el.addEventListener('input',()=>{if(id.startsWith('planningScenario'))renderPlanningScenario();else renderPlanningAdjust();});});
}

// ===== FASE 3 — CENTRAL FINANCEIRA =====
let financeSelectedMonth = monthKey();

function addMonthsKey(key, delta){const [y,m]=key.split('-').map(Number);const d=new Date(y,m-1+delta,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function daysInMonthKey(key){const [y,m]=key.split('-').map(Number);return new Date(y,m,0).getDate();}
function daysRemainingInMonth(key){const now=new Date(), current=monthKey(now); if(key!==current)return key>current?daysInMonthKey(key):0; return Math.max(1,daysInMonthKey(key)-now.getDate()+1);}
function isCurrentFinanceMonth(key){return key===monthKey();}
function plannedExpenseTotal(key){return plannedExpenses(key);}
function plannedSavingsTotal(key){return plannedSavings(key);}
function actualOutgoingTotal(key){return actualExpenses(key)+actualTravelPayments(key);}
function financeMonthFree(key){
  const income=incomeUsedForMonth(key);
  const plannedExp=plannedExpenseTotal(key);
  const actualExp=actualExpenses(key);
  const plannedSave=plannedSavingsTotal(key);
  const actualSave=actualSaved(key);
  // O capital livre representa o que sobra depois que o planejamento do mês
  // é respeitado, mas não pode esconder um mês matematicamente negativo.
  return income-Math.max(plannedExp,actualExp)-Math.max(plannedSave,actualSave);
}
function plannedTravelContributionRemaining(key=monthKey()){
  const planned=Number(getBudget(key).Viagens||0);
  const actual=Number(getSavedByCategory(key).Viagens||0);
  return Math.max(0,planned-actual);
}
function projectedTravelFundThroughMonth(key){
  let balance=calculateTravelFund();
  if(key>=monthKey()) balance+=plannedTravelContributionsUntil(`${key}-28`);
  const cutoff=`${key}-31`;
  const trips=state.trips.filter(t=>t.status!=='cancelada'&&t.status!=='realizada'&&t.start&&t.start<=cutoff&&t.start>=todayISO()).sort((a,b)=>a.start.localeCompare(b.start));
  for(const t of trips) balance-=getTripEstimated(t);
  return balance;
}
function travelFundingGapForMonth(key){
  if(key<monthKey()) return 0;
  const projectedFund=projectedTravelFundThroughMonth(key);
  return Math.max(0,-projectedFund);
}
function commitmentBudgetCategory(c){
  return mapCommitmentToExpenseCategory(c?.category||'Outros') || 'Outros';
}
function commitmentCoveredByBudget(key, occurrences){
  const budget=getBudget(key);
  const actualByCategory=getActualByCategory(key);
  const coveredByCategory={};
  const ordered=[...occurrences].sort((a,b)=>a.date.localeCompare(b.date)||String(a.commitment.id).localeCompare(String(b.commitment.id)));
  let covered=0;
  for(const o of ordered){
    if(!o.commitment.includedInBudget) continue;
    const cat=commitmentBudgetCategory(o.commitment);
    const planned=Math.max(0,Number(budget[cat]||0));
    const alreadyUsed=Math.max(0,Number(actualByCategory[cat]||0));
    const previouslyCovered=Math.max(0,Number(coveredByCategory[cat]||0));
    const available=Math.max(0,planned-alreadyUsed-previouslyCovered);
    const amount=Math.max(0,Number(o.amount)||0);
    const thisCovered=Math.min(amount,available);
    coveredByCategory[cat]=previouslyCovered+thisCovered;
    covered+=thisCovered;
  }
  return covered;
}
function financeOutstandingCommitments(key){
  const stats=getCommitmentStats(key);
  const pending=stats.occurrences.filter(o=>{const st=commitmentStatus(o.commitment,o.date);return st!=='paid'&&st!=='cancelled';});
  const totalPending=pending.reduce((s,o)=>s+Math.max(0,Number(o.amount)||0),0);
  const covered=commitmentCoveredByBudget(key,pending);
  return Math.max(0,totalPending-covered);
}
function financeAvailableToSpend(key){
  const base=financeMonthFree(key);
  const travelGap=travelFundingGapForMonth(key);
  const commitments=financeOutstandingCommitments(key);
  return Math.max(0,base-Math.max(0,travelGap)-commitments);
}
function financeSavedPlannedVsActual(key){return {planned:plannedSavingsTotal(key),actual:actualSaved(key)};}
function financeHealth(key){
  const planned=plannedExpenseTotal(key), actual=actualExpenses(key), free=financeMonthFree(key), income=incomeUsedForMonth(key), savings=actualSaved(key), plannedSave=plannedSavingsTotal(key);
  let score=70; const reasons=[];
  if(actual<=planned) {score+=12; reasons.push('Você está dentro do orçamento de gastos.');} else {score-=18; reasons.push(`Os gastos estão ${currency(actual-planned)} acima do planejado.`);}
  if(income>0 && Math.max(plannedSave,savings)/income>=0.2) {score+=8; reasons.push('Você está destinando uma parte relevante da renda para guardar.');} else {reasons.push('Ainda vale reforçar o dinheiro destinado a guardar.');}
  const emergency=state.goals.find(g=>g.id==='g6'); const emergencyPct=emergency?.target?Number(emergency.current||0)/Number(emergency.target):0;
  if(emergencyPct>=.5){score+=5;reasons.push('Sua reserva de emergência já tem uma boa base.');} else {reasons.push('Sua reserva de emergência ainda está em construção.');}
  const futureTrips=state.trips.filter(t=>t.status!=='cancelada'&&t.status!=='realizada'&&t.start>=todayISO()); const risky=futureTrips.filter(t=>tripViability(t).cls==='bad').length;
  if(risky){score-=10;reasons.push(`${risky} viagem(ns) futura(s) ainda não estão financiadas.`);} else reasons.push('As viagens futuras principais estão compatíveis com o fundo.');
  if(free>0)score+=5; else {score-=10;reasons.push('Sua margem livre está muito apertada.');}
  score=clamp(Math.round(score),0,100);
  if(free<0) score=Math.min(score,49); else if(free===0) score=Math.min(score,59);
  const cls=score>=80?'good':score>=60?'warn':'bad'; const title=score>=80?'Muito saudável':score>=60?'Atenção':'Precisa de cuidado';
  return {score,cls,title,reasons};
}
function buildFinanceSnapshot(key){
  const plannedInc=plannedIncome(key), actualRec=getSalaryRecord(key), realInc=actualRec&&['received','partial'].includes(actualRec.status)?actualIncome(key):null;
  const income=incomeUsedForMonth(key), pExp=plannedExpenseTotal(key), aExp=actualExpenses(key), aTravel=actualTravelPayments(key), saved=actualSaved(key), pSave=plannedSavingsTotal(key);
  const free=financeMonthFree(key), available=financeAvailableToSpend(key), daily=available/Math.max(1,daysRemainingInMonth(key));
  const health=financeHealth(key);
  const projectedEnd=free-Math.max(0,travelFundingGapForMonth(key))-financeOutstandingCommitments(key);
  return {key,plannedIncome:plannedInc,realIncome:realInc,income,actualRecord:actualRec,plannedExpenses:pExp,actualExpenses:aExp,actualTravel:aTravel,plannedSavings:pSave,actualSavings:saved,free,availableToSpend:available,dailySpend:daily,projectedEnd,health};
}
function renderFinance(){
  const key=financeSelectedMonth; const s=buildFinanceSnapshot(key); const label=document.getElementById('financeMonthLabel'); if(!label)return;
  label.textContent=monthLabel(key);
  document.getElementById('financeIncome').textContent=currency(s.income); document.getElementById('financeIncomeMeta').textContent=s.realIncome!=null?'Recebido':'Previsto';
  document.getElementById('financeSpent').textContent=currency(s.actualExpenses+s.actualTravel); document.getElementById('financeSpentMeta').textContent=s.actualTravel>0?`Inclui ${currency(s.actualTravel)} em viagens`:'Gastos realizados';
  document.getElementById('financeSaved').textContent=currency(s.actualSavings); document.getElementById('financeSavedMeta').textContent=`Planejado: ${currency(s.plannedSavings)}`;
  document.getElementById('financeFree').textContent=currency(s.free); setMoneyValueClass(document.getElementById('financeFree'),s.free); document.getElementById('financeFreeMeta').textContent='Sobra após o planejamento do mês';
  document.getElementById('financeSpendValue').textContent=currency(s.availableToSpend); setMoneyValueClass(document.getElementById('financeSpendValue'),s.availableToSpend);
  document.getElementById('financeSpendTitle').textContent=s.free<0?'Sua margem está negativa':s.availableToSpend>0?'Você pode gastar com segurança':'Sua margem está muito apertada';
  document.getElementById('financeSpendText').textContent=s.free<0?`Seu planejamento está ${currency(Math.abs(s.free))} acima da margem disponível. Primeiro vale ajustar gastos ou compromissos.`:s.availableToSpend>0?`Capital livre é o que sobra após o planejamento. Aqui, ${currency(s.availableToSpend)} é a parte que parece segura usar considerando compromissos próximos.`:'Neste momento, o planejamento não deixa uma margem confortável para novos gastos.';
  const pill=document.getElementById('financeHealthPill'); pill.className=`finance-health-pill ${s.health.cls}`; pill.textContent=s.health.title;
  const flow=[[iconSvg('i-bank')+' Entrada',s.income,'in'],[iconSvg('i-wallet')+' Gastos',s.actualExpenses+s.actualTravel,'out'],[iconSvg('i-target')+' Planejado para guardar',s.plannedSavings,'save'],[iconSvg('i-wallet')+' Capital livre',s.free,'free']];
  document.getElementById('financeFlow').innerHTML=flow.map(x=>`<div class="finance-flow-row"><span>${x[0]}</span><strong class="${x[2]} ${x[2]==='free'&&s.free<0?'negative':''}">${currency(x[1])}</strong></div>`).join('');
  const projectionText=s.projectedEnd>=0?`No cenário atual, seu capital livre projetado no fechamento fica em <strong>${currency(s.projectedEnd)}</strong>.`:`Seu fechamento projetado ficaria negativo.`;
  document.getElementById('financeMonthProjection').innerHTML=`<div class="projection-big"><strong>${currency(s.projectedEnd)}</strong><span>capital livre projetado</span></div><p>${projectionText}</p>`; setMoneyValueClass(document.querySelector('#financeMonthProjection .projection-big strong'),s.projectedEnd);
  document.getElementById('financeDailySpend').textContent=s.availableToSpend>0?currency2(s.dailySpend):currency2(0); document.getElementById('financeDaysLeft').textContent=s.availableToSpend>0?`${daysRemainingInMonth(key)} ${daysRemainingInMonth(key)===1?'dia restante':'dias restantes'}`:(s.free<0?`Margem negativa de ${currency(Math.abs(s.free))}`:'Sem margem disponível');
  renderFinanceCommitments(key); renderFinanceTimeline(key); renderFinanceHealth(s); renderFinanceThreeMonths(); renderFinanceYear();
}
function financeSalaryDate(key){const r=getSalaryRecord(key);if(r?.paymentDate)return r.paymentDate;const [y,m]=key.split('-').map(Number);return `${y}-${String(m).padStart(2,'0')}-${String(daysInMonthKey(key)).padStart(2,'0')}`;}
function renderFinanceCommitments(key){
  const items=[]; const commitmentStats=getCommitmentStats(key); if(commitmentStats.remaining>0)items.push({date:commitmentStats.nextDate||`${key}-28`,icon:'i-calendar',title:`Contas ainda previstas (${commitmentStats.remainingCount})`,amount:commitmentStats.remaining,kind:'warn'}); const sr=getSalaryRecord(key); if(!sr||sr.status==='planned'||sr.status==='not_received')items.push({date:financeSalaryDate(key),icon:'i-bank',title:'Salário previsto',amount:plannedIncome(key),kind:'info'});
  else items.push({date:financeSalaryDate(key),icon:'i-bank',title:'Salário recebido',amount:actualIncome(key),kind:'good'});
  const b=getBudget(key); for(const [cat,icon] of [['Alimentação','i-wallet'],['Família','i-users'],['Lazer','i-spark'],['Fixos','i-calendar']]){const rest=Math.max(0,Number(b[cat]||0)-(getActualByCategory(key)[cat]||0));if(rest>0)items.push({date:`${key}-20`,icon,title:`Orçamento restante: ${cat}`,amount:rest,kind:'info'});}
  const trips=state.trips.filter(t=>t.status!=='cancelada'&&t.start?.startsWith(key)).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,4); for(const t of trips)items.push({date:t.start,icon:'i-plane',title:`${t.destination} · viagem`,amount:getTripEstimated(t),kind:tripViability(t).cls});
  items.sort((a,b)=>a.date.localeCompare(b.date)); document.getElementById('financeCommitments').innerHTML=items.length?items.slice(0,6).map(i=>`<div class="commitment-item"><span>${iconSvg(i.icon,'timeline-line-icon')}</span><div><strong>${escapeHtml(i.title)}</strong><small>${formatDate(i.date)}</small></div><b class="${i.kind}">${currency(i.amount)}</b></div>`).join(''):'<div class="empty-state"><strong>Nenhum compromisso importante.</strong><span>Seu mês está tranquilo.</span></div>';
}
function renderFinanceTimeline(key){
  const events=[]; const sr=getSalaryRecord(key); events.push({date:financeSalaryDate(key),icon:'i-bank',title:sr&&['received','partial'].includes(sr.status)?'Salário recebido':'Salário previsto',detail:currency(sr&&['received','partial'].includes(sr.status)?actualIncome(key):plannedIncome(key)),cls:'good'});
  for(const c of getCommitmentOccurrencesForMonth(key)){ const p=getCommitmentPayment(c.commitment,c.date); events.push({date:c.date,icon:'i-calendar',title:c.commitment.name,detail:`${p.status==='paid'?'−':'?'} ${currency(c.amount)}`,cls:p.status==='paid'?'expense':'info'}); }
  for(const t of getMonthTransactions(key)){ if(t.source==='commitment') continue; events.push({date:t.date||`${key}-01`,icon:iconIdForCategory(t.category,t.type),title:t.description||t.category,detail:`${t.type==='saving'?'+':'−'} ${currency(t.amount)}`,cls:t.type==='saving'?'save':'expense'});}
  for(const t of state.trips.filter(t=>t.start?.startsWith(key)&&t.status!=='cancelada'))events.push({date:t.start,icon:'i-plane',title:`${t.destination} · viagem`,detail:currency(getTripEstimated(t)),cls:'trip'});
  events.sort((a,b)=>a.date.localeCompare(b.date)); document.getElementById('financeTimeline').innerHTML=events.slice(0,12).map(e=>`<div class="timeline-item"><div class="timeline-dot ${e.cls}">${iconSvg(e.icon,'timeline-line-icon')}</div><div class="timeline-content"><strong>${escapeHtml(e.title)}</strong><small>${formatDate(e.date)}</small></div><b>${e.detail}</b></div>`).join('')||'<div class="empty-state"><strong>Sem movimentações.</strong><span>Quando algo acontecer, aparecerá aqui.</span></div>';
}
function renderFinanceHealth(s){document.getElementById('financeHealthScore').textContent=s.health.score;document.getElementById('financeHealthTitle').textContent=`${s.health.title} · ${s.health.score}/100`;document.getElementById('financeHealthText').textContent=s.health.score>=80?'Você está dentro do orçamento e mantendo margem para decisões.':s.health.score>=60?'Seu mês merece atenção, mas ainda é possível ajustar a rota.':'Sua margem está apertada; vale reduzir gastos antes de assumir novos compromissos.';document.getElementById('financeHealthReasons').innerHTML=s.health.reasons.slice(0,4).map(r=>`<div>• ${escapeHtml(r)}</div>`).join('');
  const alerts=[];
  if(s.actualExpenses>s.plannedExpenses) alerts.push({cls:'bad',text:`Seus gastos estão ${currency(s.actualExpenses-s.plannedExpenses)} acima do planejado.`});
  else if(s.projectedEnd<0) alerts.push({cls:'bad',text:`Seu fechamento projetado ficaria ${currency(Math.abs(s.projectedEnd))} abaixo da margem planejada.`});
  else if(s.free<100) alerts.push({cls:'warn',text:`Sua margem livre está em ${currency(s.free)}.`});
  const risky=state.trips.filter(t=>t.status!=='cancelada'&&t.status!=='realizada'&&t.start>=todayISO()&&tripViability(t).cls==='bad');
  if(risky.length && !alerts.some(a=>a.cls==='bad')) alerts.push({cls:'warn',text:`${risky.length} viagem(ns) futura(s) ainda precisam de mais dinheiro.`});
  if(!alerts.length) alerts.push({cls:'good',text:`Você está ${currency(Math.max(0,s.plannedExpenses-s.actualExpenses))} abaixo do orçamento de gastos.`});
  document.getElementById('financeAlerts').innerHTML=alerts.map(a=>`<div class="alert-item ${a.cls}">${iconSvg(a.cls==='good'?'i-check':a.cls==='warn'?'i-info':'i-alert','status-line-icon')} <span>${escapeHtml(a.text)}</span></div>`).join('');}
function financeMonthRow(key){const income=incomeUsedForMonth(key),aExp=actualExpenses(key),pExp=plannedExpenses(key),aSave=actualSaved(key),pSave=plannedSavings(key),out=Math.max(aExp,pExp),saved=Math.max(aSave,pSave),baseFree=income-out-saved,commitmentGap=(key>=monthKey()?getCommitmentStats(key).remainingAdditional:0),free=baseFree-commitmentGap,record=getSalaryRecord(key),projected=!record||!['received','partial'].includes(record.status);return {key,income,out,saved,free,projected};}
function renderFinanceThreeMonths(){const rows=[0,1,2].map(i=>financeMonthRow(addMonthsKey(financeSelectedMonth,i)));document.getElementById('financeThreeMonthBody').innerHTML=rows.map(r=>`<tr><td><strong>${monthLabel(r.key)}</strong>${r.projected?' <small class="muted">Projetado</small>':' <small class="muted">Real</small>'}</td><td>${currency(r.income)}</td><td>${currency(r.out)}</td><td>${currency(r.saved)}</td><td><strong>${currency(r.free)}</strong></td></tr>`).join('');}
function renderFinanceYear(){if(!window.Chart)return;const labels=[],free=[],income=[],saved=[];for(let i=0;i<12;i++){const key=addMonthsKey(financeSelectedMonth,i);const r=financeMonthRow(key);labels.push(monthShort[Number(key.slice(5))-1]);income.push(r.income);saved.push(r.saved);free.push(r.free);}const ctx=document.getElementById('financeYearChart').getContext('2d');charts.financeYear?.destroy();charts.financeYear=new Chart(ctx,{type:'bar',data:{labels,datasets:[{label:'Entrada',data:income,borderRadius:6},{label:'Guardado',data:saved,borderRadius:6},{label:'Livre',data:free,borderRadius:6}]},options:{responsive:true,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:false,ticks:{callback:v=>`€${v}`}}}}});const totalIncome=income.reduce((a,b)=>a+b,0),totalFree=free.reduce((a,b)=>a+b,0);document.getElementById('financeYearSummary').innerHTML=`<div><span>Renda em 12 meses</span><strong>${currency(totalIncome)}</strong></div><div><span>Capital livre acumulado projetado</span><strong>${currency(totalFree)}</strong></div>`;}
function simulateFinanceSpend(){const amount=Math.max(0,Number(document.getElementById('financeSimSpendAmount').value)||0),base=buildFinanceSnapshot(financeSelectedMonth);if(!amount){document.getElementById('financeSimSpendResult').innerHTML='';return;}const after=base.availableToSpend-amount;const cls=amount<=base.availableToSpend?'good':amount<=base.free?'warn':'bad';const title=cls==='good'?`${iconSvg('i-check','status-line-icon')} Continua viável`:cls==='warn'?`${iconSvg('i-alert','status-line-icon')} Sua margem ficará apertada`:`${iconSvg('i-alert','status-line-icon')} Esse gasto comprometeria o planejamento`;document.getElementById('financeSimSpendResult').innerHTML=`<div class="result-card ${cls}"><h3>${title}</h3><p>Antes: <strong>${currency(base.availableToSpend)}</strong> disponíveis.</p><p>Depois do gasto: <strong>${currency(after)}</strong> de margem.</p></div>`;}
function simulateFinanceSalary(){const amount=Math.max(0,Number(document.getElementById('financeSimSalaryAmount').value)||0),base=buildFinanceSnapshot(financeSelectedMonth);if(!amount){document.getElementById('financeSimSalaryResult').innerHTML='';return;}const diff=amount-base.income, projected=base.free+diff;document.getElementById('financeSimSalaryResult').innerHTML=`<div class="result-card ${diff>=0?'good':'warn'}"><h3>${diff>=0?iconSvg('i-chart','status-line-icon')+' Mais espaço no mês':iconSvg('i-alert','status-line-icon')+' Menos espaço no mês'}</h3><p>Entrada comparada: ${currency(amount)} (${diff>=0?'+':''}${currency(diff)}).</p><p>Capital livre projetado: <strong>${currency(projected)}</strong>.</p><p>Impacto anual aproximado: <strong>${currency(diff*12)}</strong>.</p></div>`;}
function bindFinance(){
  document.getElementById('financePrevMonth').addEventListener('click',()=>{financeSelectedMonth=addMonthsKey(financeSelectedMonth,-1);renderFinance();});
  document.getElementById('financeNextMonth').addEventListener('click',()=>{financeSelectedMonth=addMonthsKey(financeSelectedMonth,1);renderFinance();});
  document.getElementById('financeSpendSimulatorBtn').addEventListener('click',()=>{document.getElementById('financeSimSpendAmount').value='';document.getElementById('financeSimSpendResult').innerHTML='';openModal('financeSpendModal');setTimeout(()=>document.getElementById('financeSimSpendAmount').focus(),50);});
  document.getElementById('financeSalarySimulatorBtn').addEventListener('click',()=>{document.getElementById('financeSimSalaryAmount').value='';document.getElementById('financeSimSalaryResult').innerHTML='';openModal('financeSalaryModal');setTimeout(()=>document.getElementById('financeSimSalaryAmount').focus(),50);});
  document.getElementById('financeSimSpendAmount').addEventListener('input',simulateFinanceSpend);
  document.getElementById('financeSimSalaryAmount').addEventListener('input',simulateFinanceSalary);
}


// ===== FASE 4 — CONTAS & COMPROMISSOS =====
const commitmentCategories = {
  'Moradia':'i-home','Alimentação':'i-wallet','Transporte':'i-transfer','Comunicação':'i-wallet','Assinaturas':'i-calendar','Saúde':'i-shield','Educação':'i-chart','Família':'i-users','Parcelas':'i-calendar','Seguros':'i-shield','Impostos':'i-bank','Outros':'i-box'
};
const commitmentFrequencyLabels={once:'Única',weekly:'Semanal',biweekly:'Quinzenal',monthly:'Mensal',yearly:'Anual'};
function normalizeCommitment(c={}){
  const payments = c.payments && typeof c.payments==='object' && !Array.isArray(c.payments) ? c.payments : {};
  return {
    ...c,
    id:c.id||cryptoRandom(), name:String(c.name||'').trim(), category:c.category||'Outros', amount:Math.max(0,Number(c.amount)||0), variableAmount:!!c.variableAmount,
    frequency:commitmentFrequencyLabels[c.frequency]?c.frequency:'monthly', startDate:c.startDate||c.nextDueDate||todayISO(), endDate:c.endDate||'', active:c.active!==false,
    paymentMethod:c.paymentMethod||'', notes:c.notes||'', includedInBudget:!!c.includedInBudget,
    installment:{enabled:!!c.installment?.enabled,total:Math.max(1,Number(c.installment?.total)||1)}, payments, createdAt:c.createdAt||new Date().toISOString(), updatedAt:c.updatedAt||c.createdAt||new Date().toISOString()
  };
}
function pad2(n){return String(n).padStart(2,'0');}
function parseISODateLocal(s){if(!s)return null; const [y,m,d]=s.split('-').map(Number); if(!y||!m||!d)return null; return new Date(y,m-1,d,12,0,0);}
function isoLocalDate(d){return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;}
function addDaysISO(dateStr,days){const d=parseISODateLocal(dateStr);if(!d)return dateStr;d.setDate(d.getDate()+days);return isoLocalDate(d);}
function addMonthsISO(dateStr,months,annual=false){const d=parseISODateLocal(dateStr);if(!d)return dateStr;const day=d.getDate();const targetMonth=d.getMonth()+months;const y=d.getFullYear()+Math.floor(targetMonth/12);const m=((targetMonth%12)+12)%12;const last=new Date(y,m+1,0,12).getDate();d.setFullYear(y,m,Math.min(day,last));return isoLocalDate(d);}
function commitmentOccurrenceDates(c, rangeStart, rangeEnd, allowInactive=false){
  if((!c?.active&&!allowInactive)||!c.startDate)return [];
  const start=parseISODateLocal(c.startDate), rs=parseISODateLocal(rangeStart), re=parseISODateLocal(rangeEnd); if(!start||!rs||!re)return [];
  const endCap=c.endDate?parseISODateLocal(c.endDate):re; const stop=endCap<re?endCap:re; if(stop<rs || start>stop)return [];
  const out=[]; let d=new Date(start); let guard=0; let occurrenceNumber=0;
  while(d<=stop && guard++<1000){
    occurrenceNumber++;
    const date=isoLocalDate(d);
    const within=date>=rangeStart&&date<=rangeEnd;
    const allowedByInstallment=!c.installment?.enabled || occurrenceNumber<=Math.max(1,Number(c.installment.total)||1);
    if(within&&allowedByInstallment)out.push(date);
    if(c.installment?.enabled && occurrenceNumber>=Math.max(1,Number(c.installment.total)||1))break;
    if(c.frequency==='once')break;
    if(c.frequency==='weekly')d.setDate(d.getDate()+7);
    else if(c.frequency==='biweekly')d.setDate(d.getDate()+14);
    else if(c.frequency==='monthly')d=parseISODateLocal(addMonthsISO(isoLocalDate(d),1));
    else if(c.frequency==='yearly')d=parseISODateLocal(addMonthsISO(isoLocalDate(d),12,true));
    else break;
    if(c.endDate&&d>parseISODateLocal(c.endDate))break;
  }
  return out;
}
function getCommitmentPayment(c,date){return c?.payments?.[date]||{status:'planned',amount:c?.variableAmount?null:Number(c?.installment?.enabled?c.amount:c.amount)||0};}
function getCommitmentOccurrenceAmount(c,date){const p=getCommitmentPayment(c,date); if(Number(p.amount)>=0 && p.amount!==null && p.amount!==undefined && p.amount!=='')return Number(p.amount)||0; if(c.installment?.enabled && Number(c.amount)>0)return Number(c.amount)||0; return Number(c.amount)||0;}
function getCommitmentOccurrencesForMonth(key, includeInactive=false){const start=`${key}-01`,end=`${key}-${pad2(daysInMonthKey(key))}`; const out=[]; for(const c of state.commitments){if(!includeInactive&&!c.active)continue; for(const date of commitmentOccurrenceDates(c,start,end,includeInactive)){out.push({commitment:c,date,amount:getCommitmentOccurrenceAmount(c,date)});}} return out.sort((a,b)=>a.date.localeCompare(b.date));}
function getCommitmentOccurrencesBetween(start,end){const out=[];for(const c of state.commitments){if(!c.active)continue;for(const date of commitmentOccurrenceDates(c,start,end))out.push({commitment:c,date,amount:getCommitmentOccurrenceAmount(c,date)});}return out.sort((a,b)=>a.date.localeCompare(b.date));}
function commitmentStatus(c,date){const p=getCommitmentPayment(c,date); if(p.status==='paid')return 'paid'; if(p.status==='cancelled')return 'cancelled'; if(date<todayISO())return 'overdue'; return 'planned';}
function getCommitmentStats(key){
  const occ=getCommitmentOccurrencesForMonth(key); let total=0,paid=0,remaining=0,overdue=0,nextDate='';
  for(const o of occ){const status=commitmentStatus(o.commitment,o.date); if(status==='cancelled')continue; const amount=o.amount; total+=amount; if(status==='paid')paid+=amount; else {remaining+=amount;if(!nextDate&&o.date>=todayISO())nextDate=o.date;} if(status==='overdue'){overdue++;}}
  const pending=occ.filter(o=>{const st=commitmentStatus(o.commitment,o.date);return st!=='paid'&&st!=='cancelled';});
  const totalPending=pending.reduce((s,o)=>s+Math.max(0,Number(o.amount)||0),0);
  const remainingAdditional=Math.max(0,totalPending-commitmentCoveredByBudget(key,pending));
  return {total,paid,remaining,overdue,remainingAdditional,remainingCount:pending.length,nextDate,occurrences:occ};
}
function commitmentMonthlyRecurringAmount(c){if(!c.active||c.frequency==='once')return 0; if(c.frequency==='monthly')return getCommitmentOccurrenceAmount(c,c.startDate); if(c.frequency==='weekly')return getCommitmentOccurrenceAmount(c,c.startDate)*52/12; if(c.frequency==='biweekly')return getCommitmentOccurrenceAmount(c,c.startDate)*26/12; if(c.frequency==='yearly')return getCommitmentOccurrenceAmount(c,c.startDate)/12; return 0;}
function getUpcomingCommitmentOccurrences(days=45){const start=todayISO(),end=addDaysISO(start,days);return getCommitmentOccurrencesBetween(start,end).filter(o=>['planned','overdue'].includes(commitmentStatus(o.commitment,o.date)));}
function initCommitmentMonthSelect(){const el=document.getElementById('commitmentMonthSelect');if(!el)return;const now=new Date();const current=monthKey();el.innerHTML='';for(let i=-1;i<=4;i++){const key=addMonthsKey(current,i);const opt=document.createElement('option');opt.value=key;opt.textContent=monthLabel(key);if(key===current)opt.selected=true;el.appendChild(opt);}}
function openCommitmentModal(id=''){const c=id?state.commitments.find(x=>x.id===id):null;document.getElementById('commitmentTitle').textContent=c?'Editar compromisso':'Novo compromisso';document.getElementById('commitmentId').value=c?.id||'';document.getElementById('commitmentName').value=c?.name||'';document.getElementById('commitmentCategory').value=c?.category||'Outros';document.getElementById('commitmentAmount').value=c?.amount??0;document.getElementById('commitmentVariable').checked=!!c?.variableAmount;document.getElementById('commitmentIncludedInBudget').checked=!!c?.includedInBudget;document.getElementById('commitmentFrequency').value=c?.frequency||'monthly';document.getElementById('commitmentStartDate').value=c?.startDate||todayISO();document.getElementById('commitmentEndDate').value=c?.endDate||'';document.getElementById('commitmentPaymentMethod').value=c?.paymentMethod||'';document.getElementById('commitmentInstallmentEnabled').checked=!!c?.installment?.enabled;document.getElementById('commitmentInstallmentTotal').value=c?.installment?.total||1;document.getElementById('commitmentInstallmentAmount').value=c?.installment?.enabled?(c?.amount||0):0;document.getElementById('commitmentInstallmentFields').classList.toggle('hidden',!c?.installment?.enabled);document.getElementById('commitmentNotes').value=c?.notes||'';openModal('commitmentModal');}
function saveCommitmentFromForm(e){e.preventDefault();const id=document.getElementById('commitmentId').value;const name=document.getElementById('commitmentName').value.trim();const amount=Math.max(0,Number(document.getElementById('commitmentInstallmentEnabled').checked?document.getElementById('commitmentInstallmentAmount').value:document.getElementById('commitmentAmount').value)||0);const start=document.getElementById('commitmentStartDate').value,end=document.getElementById('commitmentEndDate').value;if(!name||!start||Number.isNaN(parseISODateLocal(start)?.getTime()??NaN)){showToast('Preencha nome e primeiro vencimento.');return;}if(end&&end<start){showToast('A data final não pode ser anterior ao primeiro vencimento.');return;}if(!amount&&!document.getElementById('commitmentVariable').checked){showToast('Informe um valor válido.');return;}const old=id?state.commitments.find(x=>x.id===id):null;const c=normalizeCommitment({...(old||{}),id:id||cryptoRandom(),name,category:document.getElementById('commitmentCategory').value,amount,variableAmount:document.getElementById('commitmentVariable').checked,frequency:document.getElementById('commitmentFrequency').value,startDate:start,endDate:end,active:old?.active!==false,paymentMethod:document.getElementById('commitmentPaymentMethod').value.trim(),includedInBudget:document.getElementById('commitmentIncludedInBudget').checked,installment:{enabled:document.getElementById('commitmentInstallmentEnabled').checked,total:Math.max(1,Number(document.getElementById('commitmentInstallmentTotal').value)||1)},notes:document.getElementById('commitmentNotes').value.trim(),updatedAt:new Date().toISOString()});if(old){const idx=state.commitments.findIndex(x=>x.id===id);state.commitments[idx]=c;}else state.commitments.push(c);saveState();closeModal('commitmentModal');renderAll();showToast(old?'Compromisso atualizado.':'Compromisso criado.');}
function editCommitment(id){openCommitmentModal(id);}
function deactivateCommitment(id){const c=state.commitments.find(x=>x.id===id);if(!c)return;if(!confirm(`Desativar ${c.name}? Pagamentos históricos serão preservados.`))return;c.active=false;c.updatedAt=new Date().toISOString();saveState();renderAll();showToast('Compromisso desativado.');}
function openCommitmentPayment(id,date){const c=state.commitments.find(x=>x.id===id);if(!c)return;const existing=getCommitmentPayment(c,date);document.getElementById('commitmentPaymentId').value=id;document.getElementById('commitmentPaymentDate').value=date;document.getElementById('commitmentPaymentAmount').value=getCommitmentOccurrenceAmount(c,date);document.getElementById('commitmentPaymentStatus').value=existing.status==='cancelled'?'cancelled':existing.status==='paid'?'paid':'paid';document.getElementById('commitmentPaymentNote').value=existing.note||'';document.getElementById('commitmentPaymentTitle').textContent=`${c.name}`;document.getElementById('commitmentPaymentInfo').innerHTML=`<strong>${formatDate(date)} · ${commitmentFrequencyLabels[c.frequency]}</strong><p style="margin-top:6px">Pagamento previsto: ${currency2(getCommitmentOccurrenceAmount(c,date))}</p>`;openModal('commitmentPaymentModal');}
function saveCommitmentPayment(){const id=document.getElementById('commitmentPaymentId').value,date=document.getElementById('commitmentPaymentDate').value,c=state.commitments.find(x=>x.id===id);if(!c||!date)return;const status=document.getElementById('commitmentPaymentStatus').value,amount=Math.max(0,Number(document.getElementById('commitmentPaymentAmount').value)||0),note=document.getElementById('commitmentPaymentNote').value.trim();c.payments=c.payments||{};const old=c.payments[date]||{};if(status==='paid'){c.payments[date]={status:'paid',amount,note,paidAt:new Date().toISOString(),transactionId:old.transactionId||cryptoRandom()};const existingIdx=state.transactions.findIndex(t=>t.id===c.payments[date].transactionId|| (t.source==='commitment'&&t.commitmentId===id&&t.commitmentDueDate===date));const tx={id:c.payments[date].transactionId,type:'expense',source:'commitment',commitmentId:id,commitmentDueDate:date,amount,category:mapCommitmentToExpenseCategory(c.category),date,description:c.name};if(existingIdx>=0)state.transactions[existingIdx]=tx;else state.transactions.push(tx);}else{const txId=old.transactionId;if(txId)state.transactions=state.transactions.filter(t=>t.id!==txId);c.payments[date]={status,amount,note};}c.updatedAt=new Date().toISOString();saveState();closeModal('commitmentPaymentModal');renderAll();showToast(status==='paid'?'Pagamento registrado.':status==='cancelled'?'Pagamento cancelado.':'Pagamento marcado como previsto.');}
function mapCommitmentToExpenseCategory(cat){const map={Moradia:'Fixos',Comunicação:'Fixos',Assinaturas:'Fixos',Saúde:'Outros',Educação:'Outros',Seguros:'Fixos',Impostos:'Outros',Parcelas:'Outros',Alimentação:'Alimentação',Transporte:'Outros',Família:'Família',Outros:'Outros'};return map[cat]||'Outros';}
function renderCommitmentListForMonth(key){const grid=document.getElementById('commitmentGrid');if(!grid)return;const filter=document.getElementById('commitmentFilter')?.value||'all';let occ=getCommitmentOccurrencesForMonth(key,true);const filtered=occ.filter(o=>{const st=commitmentStatus(o.commitment,o.date);if(filter==='recurring')return o.commitment.frequency!=='once';if(filter==='inactive')return !o.commitment.active;if(filter==='paid')return st==='paid';if(filter==='overdue')return st==='overdue';if(filter==='upcoming')return ['planned','overdue'].includes(st)&&o.date>=todayISO();return true;});const cards=[];const grouped=new Map();for(const o of filtered){const k=`${o.commitment.id}::${o.date}`;grouped.set(k,o);}for(const o of grouped.values()){const c=o.commitment,st=commitmentStatus(c,o.date),p=getCommitmentPayment(c,o.date),icon=commitmentCategories[c.category]||'i-calendar';const installmentText=c.installment?.enabled?` · ${getInstallmentIndex(c,o.date)}/${c.installment.total}`:'';const statusLabel=st==='paid'?`${iconSvg('i-check','status-line-icon')} Pago`:st==='overdue'?`${iconSvg('i-alert','status-line-icon')} Atrasado`:st==='cancelled'?`${iconSvg('i-info','status-line-icon')} Cancelado`:`${iconSvg('i-calendar','status-line-icon')} Previsto`;cards.push(`<div class="commitment-card ${st}"><div class="commitment-card-top"><div><span class="commitment-icon">${iconSvg(icon,'timeline-line-icon')}</span><strong>${escapeHtml(c.name)}</strong></div><span class="status-pill ${st==='paid'?'good':st==='overdue'?'bad':st==='cancelled'?'info':'warn'}">${statusLabel}</span></div><div class="commitment-card-date">${formatDate(o.date)}${installmentText} · ${commitmentFrequencyLabels[c.frequency]}</div><div class="commitment-card-amount">${currency2(o.amount)}</div><small>${c.includedInBudget?'Dentro do orçamento':'Compromisso adicional'}${c.variableAmount?' · valor variável':''}</small><div class="commitment-actions">${st!=='paid'&&st!=='cancelled'&&c.active?`<button class="primary-button small-action commitment-pay" data-id="${c.id}" data-date="${o.date}">Marcar pago</button>`:''}<button class="secondary-button small-action commitment-edit" data-id="${c.id}">Editar</button>${st!=='paid'&&c.active?`<button class="text-button commitment-cancel" data-id="${c.id}" data-date="${o.date}">Cancelar ocorrência</button>`:''}</div></div>`);}grid.innerHTML=cards.join('')||'<div class="empty-state"><strong>Nenhum compromisso neste filtro.</strong><span>Cadastre uma conta ou altere o filtro.</span></div>';grid.querySelectorAll('.commitment-pay').forEach(b=>b.addEventListener('click',()=>openCommitmentPayment(b.dataset.id,b.dataset.date)));grid.querySelectorAll('.commitment-edit').forEach(b=>b.addEventListener('click',()=>editCommitment(b.dataset.id)));grid.querySelectorAll('.commitment-cancel').forEach(b=>b.addEventListener('click',()=>openCommitmentPayment(b.dataset.id,b.dataset.date)));
}
function getInstallmentIndex(c,date){const dates=commitmentOccurrenceDates(c,c.startDate,date);return dates.indexOf(date)+1;}
function renderCommitments(){const month=document.getElementById('commitmentMonthSelect')?.value||monthKey();const stats=getCommitmentStats(month);document.getElementById('commitmentMonthTotal').textContent=currency2(stats.total);document.getElementById('commitmentMonthPaid').textContent=currency2(stats.paid);document.getElementById('commitmentMonthRemaining').textContent=currency2(stats.remaining);document.getElementById('commitmentMonthOverdue').textContent=String(stats.overdue);const up=getUpcomingCommitmentOccurrences(45);document.getElementById('commitmentUpcomingList').innerHTML=up.slice(0,8).map(o=>{const st=commitmentStatus(o.commitment,o.date);return `<div class="commitment-item"><span>${iconSvg(commitmentCategories[o.commitment.category]||'i-calendar','timeline-line-icon')}</span><div><strong>${escapeHtml(o.commitment.name)}</strong><small>${formatDate(o.date)} · ${st==='overdue'?'Atrasado':'Previsto'}</small></div><b class="${st==='overdue'?'bad':'warn'}">${currency(o.amount)}</b></div>`;}).join('')||'<div class="empty-state"><strong>Nenhum pagamento próximo.</strong><span>Seu calendário está tranquilo.</span></div>';const recurring=state.commitments.filter(c=>c.active&&c.frequency!=='once').slice(0,10);const recurringTotal=recurring.reduce((s,c)=>s+commitmentMonthlyRecurringAmount(c),0);document.getElementById('commitmentRecurringList').innerHTML=recurring.map(c=>`<div class="commitment-item"><span>${commitmentCategories[c.category]||'i-calendar'}</span><div><strong>${escapeHtml(c.name)}</strong><small>${commitmentFrequencyLabels[c.frequency]}</small></div><b>${currency(commitmentMonthlyRecurringAmount(c))}/mês</b></div>`).join('')||'<div class="empty-state"><strong>Nenhum compromisso recorrente.</strong><span>Cadastre uma conta que se repete.</span></div>';document.getElementById('commitmentRecurringTotal').innerHTML=recurring.length?`<strong>Total recorrente aproximado</strong><b>${currency(recurringTotal)}/mês</b>`:'';renderCommitmentListForMonth(month);renderCommitmentAnnualSummary();}
function renderCommitmentAnnualSummary(){const year=Number((document.getElementById('commitmentMonthSelect')?.value||monthKey()).slice(0,4));const by={};let total=0;for(let m=1;m<=12;m++){const key=`${year}-${pad2(m)}`;for(const o of getCommitmentOccurrencesForMonth(key)){const st=commitmentStatus(o.commitment,o.date);if(st==='cancelled')continue;const cat=o.commitment.category;by[cat]=(by[cat]||0)+o.amount;total+=o.amount;}}document.getElementById('commitmentAnnualSummary').innerHTML=Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>`<div class="annual-item"><span>${commitmentCategories[cat]||'📅'} ${escapeHtml(cat)}</span><strong>${currency2(val)}</strong></div>`).join('')+`<div class="annual-item total"><span>Total anual previsto</span><strong>${currency2(total)}</strong></div>`;}
function commitmentHasPayment(c){return Object.values(c.payments||{}).some(p=>p&&p.status==='paid');}

function normalizeTrip(t){
  const legacyBudget=Number(t.estimatedCost ?? t.budget ?? 0)||0;
  const legacyActual=Number(t.actualCost ?? t.actual ?? 0)||0;
  const rawBreakdown=t.budgetBreakdown||t.budgetItems||{};
  const breakdown={transport:Number(rawBreakdown.transport||0),accommodation:Number(rawBreakdown.accommodation||0),food:Number(rawBreakdown.food||0),localTransport:Number(rawBreakdown.localTransport||0),activities:Number(rawBreakdown.activities||0),other:Number(rawBreakdown.other||0)};
  if(!Object.values(breakdown).some(v=>v>0) && legacyBudget>0) breakdown.other=legacyBudget;
  let status=t.status||'planejando';
  const legacyMap={planned:'planejando',reserved:'reservado',completed:'realizada',cancelled:'cancelada'};
  status=legacyMap[status]||status;
  const allowed=['ideia','planejando','reservado','realizada','cancelada']; if(!allowed.includes(status)) status='planejando';
  const type=t.type||inferTripType(t);
  return {...t,id:t.id||cryptoRandom(),destination:t.destination||t.name||'',country:t.country||'',countryCode:t.countryCode||resolveCountryCode(t.country||''),island:t.island||'',type,start:t.start||t.startDate||'',end:t.end||t.endDate||'',status,budgetBreakdown:breakdown,estimatedCost:legacyBudget||Object.values(breakdown).reduce((a,b)=>a+b,0),actualCost:legacyActual,notes:t.notes||'',createdAt:t.createdAt||new Date().toISOString()};
}
function normalizeCountrySearch(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function getWorldCountries(){return Array.isArray(window.WORLD_MAP_COUNTRIES)?window.WORLD_MAP_COUNTRIES:[];}
function getCountryById(id){return getWorldCountries().find(c=>c.id===id)||null;}
const COUNTRY_ALIASES={'es':'ES','espana':'ES','portugal':'PT','brasil':'BR','franca':'FR','france':'FR','alemania':'DE','germany':'DE','italia':'IT','italy':'IT','reino unido':'GB','united kingdom':'GB','paises baixos':'NL','netherlands':'NL','holanda':'NL','estados unidos':'US','united states':'US','japao':'JP','japan':'JP','marrocos':'MA','morocco':'MA','grecia':'GR','greece':'GR'};
function resolveCountryCode(value){const q=normalizeCountrySearch(value); if(!q)return ''; if(COUNTRY_ALIASES[q])return COUNTRY_ALIASES[q]; let c=getWorldCountries().find(x=>normalizeCountrySearch(x.id)===q||normalizeCountrySearch(x.name)===q||normalizeCountrySearch(x.nameEn)===q); if(c)return c.id; c=getWorldCountries().find(x=>normalizeCountrySearch(x.name).includes(q)||normalizeCountrySearch(x.nameEn).includes(q)); return c?.id||'';}
const COUNTRY_FLAG_ATLAS_COLS=15;
const COUNTRY_FLAG_ATLAS_CELL_W=64;
const COUNTRY_FLAG_ATLAS_CELL_H=48;
function normalizeCountryCode(id){const code=String(id||'').trim().toUpperCase();if(code.length===2&&getCountryById(code))return code;return resolveCountryCode(code);}
function countryFlagAssetPosition(id){const code=normalizeCountryCode(id);if(!code)return null;const idx=getWorldCountries().findIndex(c=>c.id===code);if(idx<0)return null;return {code,index:idx,x:-((idx%COUNTRY_FLAG_ATLAS_COLS)*COUNTRY_FLAG_ATLAS_CELL_W*3/8),y:-(Math.floor(idx/COUNTRY_FLAG_ATLAS_COLS)*COUNTRY_FLAG_ATLAS_CELL_H*3/8)};}
function countryFlagMarkup(id,label=''){const pos=countryFlagAssetPosition(id);if(!pos)return '';const country=getCountryById(pos.code);const text=label||country?.name||pos.code;return `<span class="country-flag-asset" role="img" aria-label="${escapeHtml(text)}" title="${escapeHtml(text)}" style="--flag-x:${pos.x}px;--flag-y:${pos.y}px"></span>`;}
function countryFlag(id){const data=getCountryById(normalizeCountryCode(id));return data?.flag||'';}
function countryFlagVisual(id){return countryFlagMarkup(id);}
function getVisitedCountryCount(){return Object.values(state.visitedCountries||{}).filter(v=>v&&v.visited).length;}
function getNewCountriesCount(year){return Object.values(state.visitedCountries||{}).filter(v=>v&&v.visited&&String(v.firstVisit||'').startsWith(String(year))).length;}
function getInternationalTripCount(year){return state.trips.filter(t=>tripYear(t)===Number(year)&&t.status==='realizada'&&t.countryCode&&t.type!=='canarias'&&t.type!=='brasil').length;}
function projectMapPoint(lat,lon){return {x:(Number(lon)+180)/360*1200,y:(90-Number(lat))/180*560};}
function escapeSvg(value){return String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function renderCountryOptions(){const el=document.getElementById('countryOptions');if(!el)return;el.innerHTML=getWorldCountries().map(c=>`<option value="${escapeHtml(c.name)}">${escapeHtml(c.nameEn)}</option>`).join('');}
function renderWorldMap(){
  const svg=document.getElementById('worldMap'); if(!svg)return;
  const countries=getWorldCountries(); const visited=state.visitedCountries||{};
  if(!countries.length){svg.innerHTML='<text x="600" y="280" text-anchor="middle" fill="#64748b">Mapa indisponível</text>';return;}
  const existingGroup=svg.querySelector('.world-map-layer');
  const markup=countries.map(c=>{
    const v=Boolean(visited[c.id]?.visited); const cls=v?'visited':'unvisited';
    const micro=Boolean(c.uxMicro);
    const hitAttrs=micro?`<circle class="world-country-hit" cx="${projectMapPoint(c.lat,c.lon).x.toFixed(1)}" cy="${projectMapPoint(c.lat,c.lon).y.toFixed(1)}" r="10"></circle>`:'';
    return `<g class="world-country-point ${cls}${micro?' micro':''}" data-country-id="${c.id}" tabindex="0" role="button" aria-label="${escapeSvg(c.name)}">${hitAttrs}<path class="world-country ${cls}" data-country-id="${c.id}" d="${c.path}" tabindex="-1" aria-hidden="true"><title>${escapeSvg(c.name)}</title></path></g>`;
  }).join('');
  if(existingGroup){existingGroup.innerHTML=markup;}else{svg.innerHTML=`<g class="world-map-layer" data-layer="countries">${markup}</g>`;}
  const layer=svg.querySelector('.world-map-layer');
  layer.querySelectorAll('[data-country-id].world-country-point').forEach(el=>{
    el.addEventListener('click',()=>{const code=el.dataset.countryId;focusCountry(code);setTimeout(()=>openCountryModal(code),220);});
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const code=el.dataset.countryId;focusCountry(code);setTimeout(()=>openCountryModal(code),220);}});
  });
  applyWorldMapTransform();
  if(worldMapView.selectedCountryId) updateSelectedCountryVisual();
  updateWorldSummary();
}
function getWorldMapViewport(){return document.querySelector('#worldMapViewport .world-map-viewport')||null;}
function getWorldMapSvg(){return document.getElementById('worldMap')||null;}
function getWorldMapLayer(){return getWorldMapSvg()?.querySelector('.world-map-layer')||null;}
function applyWorldMapTransform(){
  const layer=getWorldMapLayer(); if(!layer)return;
  layer.setAttribute('transform',`translate(${worldMapView.x.toFixed(3)} ${worldMapView.y.toFixed(3)}) scale(${worldMapView.scale.toFixed(4)})`);
}
function clampWorldMapPosition(){
  const maxX=Math.max(0,1200*worldMapView.scale-1200);
  const maxY=Math.max(0,560*worldMapView.scale-560);
  worldMapView.x=clamp(worldMapView.x,-maxX,0);
  worldMapView.y=clamp(worldMapView.y,-maxY,0);
}
function animateWorldMap(target,duration=300,after){
  if(worldMapView.animation)cancelAnimationFrame(worldMapView.animation);
  const from={scale:worldMapView.scale,x:worldMapView.x,y:worldMapView.y}; const started=performance.now();
  const ease=t=>1-Math.pow(1-t,3);
  const frame=now=>{
    const t=clamp((now-started)/duration,0,1), e=ease(t);
    worldMapView.scale=from.scale+(target.scale-from.scale)*e;
    worldMapView.x=from.x+(target.x-from.x)*e;
    worldMapView.y=from.y+(target.y-from.y)*e;
    clampWorldMapPosition();applyWorldMapTransform();
    if(t<1)worldMapView.animation=requestAnimationFrame(frame);else{worldMapView.animation=null;after?.();}
  };
  worldMapView.animation=requestAnimationFrame(frame);
}
function svgPointFromClient(clientX,clientY){
  const svg=getWorldMapSvg(); if(!svg)return {x:600,y:280};
  const pt=svg.createSVGPoint();pt.x=clientX;pt.y=clientY;
  const matrix=svg.getScreenCTM();
  return matrix?pt.matrixTransform(matrix.inverse()):{x:600,y:280};
}
function setWorldMapZoom(nextScale, anchorClientX=null, anchorClientY=null, animate=false){
  const viewport=getWorldMapViewport(),svg=getWorldMapSvg(); if(!viewport||!svg)return;
  const oldScale=worldMapView.scale; const scale=clamp(nextScale,1,8); if(Math.abs(scale-oldScale)<0.001)return;
  let anchor={x:600,y:280};
  if(anchorClientX!=null&&anchorClientY!=null)anchor=svgPointFromClient(anchorClientX,anchorClientY);
  const target={scale,x:anchor.x-(anchor.x-worldMapView.x)*(scale/oldScale),y:anchor.y-(anchor.y-worldMapView.y)*(scale/oldScale)};
  const finish=()=>{clampWorldMapPosition();applyWorldMapTransform();};
  if(animate)animateWorldMap(target,260,finish);else{worldMapView.scale=scale;worldMapView.x=target.x;worldMapView.y=target.y;finish();}
}
function resetWorldMap(){if(worldMapView.animation)cancelAnimationFrame(worldMapView.animation);worldMapView.animation=null;worldMapView.scale=1;worldMapView.x=0;worldMapView.y=0;worldMapView.selectedCountryId='';updateSelectedCountryVisual();applyWorldMapTransform();}
function worldMapDistance(a,b){return Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY);}
function worldMapMidpoint(a,b){return {x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2};}
function updateSelectedCountryVisual(){
  document.querySelectorAll('#worldMap [data-country-id]').forEach(el=>el.classList.toggle('selected',el.dataset.countryId===worldMapView.selectedCountryId));
}
function focusCountry(code){
  const svg=getWorldMapSvg(); if(!svg)return;
  const el=svg.querySelector(`.world-country-point[data-country-id="${code}"]`) || svg.querySelector(`.world-country[data-country-id="${code}"]`); if(!el)return;
  const targetEl=el.querySelector?.('.world-country') || el;
  const box=targetEl.getBBox(); const cx=box.x+box.width/2; const cy=box.y+box.height/2;
  const footprint=Math.max(14,Math.max(box.width,box.height));
  // Keep tiny countries usable: small geometries receive a stronger, but still bounded, focus zoom.
  const targetScale=clamp(360/Math.max(footprint,45),2.6,8);
  worldMapView.selectedCountryId=code; updateSelectedCountryVisual();
  animateWorldMap({scale:targetScale,x:600-cx*targetScale,y:280-cy*targetScale},320);
}
function bindWorldMapNavigation(){
  const viewport=getWorldMapViewport(); if(!viewport||viewport.dataset.bound)return;
  viewport.dataset.bound='1';
  viewport.addEventListener('wheel',e=>{
    e.preventDefault();
    const rect=viewport.getBoundingClientRect();
    const factor=e.deltaY<0?1.16:1/1.16;
    setWorldMapZoom(worldMapView.scale*factor,e.clientX,e.clientY,false);
  },{passive:false});
  viewport.addEventListener('pointerdown',e=>{
    if(e.target.closest('.world-map-controls'))return;
    worldMapView.pointers.set(e.pointerId,e);
    if(worldMapView.pointers.size===1){worldMapView.dragStart={x:e.clientX,y:e.clientY,baseX:worldMapView.x,baseY:worldMapView.y};worldMapView.moved=false;worldMapView.activePointerId=e.pointerId;}
    if(worldMapView.pointers.size===2){
      viewport.setPointerCapture?.(e.pointerId);
      const pts=[...worldMapView.pointers.values()];
      worldMapView.pinchStart={distance:worldMapDistance(pts[0],pts[1]),scale:worldMapView.scale,midpoint:worldMapMidpoint(pts[0],pts[1]),x:worldMapView.x,y:worldMapView.y};
      worldMapView.dragStart=null;worldMapView.moved=true;
    }
  });
  viewport.addEventListener('pointermove',e=>{
    if(!worldMapView.pointers.has(e.pointerId))return;
    worldMapView.pointers.set(e.pointerId,e);
    if(worldMapView.pointers.size===1&&worldMapView.dragStart){
      const d=worldMapView.pointers.get(e.pointerId);
      if(Math.hypot(d.clientX-worldMapView.dragStart.x,d.clientY-worldMapView.dragStart.y)>5){
        if(!worldMapView.moved){ viewport.setPointerCapture?.(e.pointerId); }
        worldMapView.moved=true;
      }
      const ratioX=1200/Math.max(1,viewport.clientWidth),ratioY=560/Math.max(1,viewport.clientHeight);
      worldMapView.x=worldMapView.dragStart.baseX+(d.clientX-worldMapView.dragStart.x)*ratioX/worldMapView.scale;
      worldMapView.y=worldMapView.dragStart.baseY+(d.clientY-worldMapView.dragStart.y)*ratioY/worldMapView.scale;
      clampWorldMapPosition();applyWorldMapTransform();
    }else if(worldMapView.pointers.size===2&&worldMapView.pinchStart){
      const pts=[...worldMapView.pointers.values()]; const start=worldMapView.pinchStart; const distance=worldMapDistance(pts[0],pts[1]);
      const mid=worldMapMidpoint(pts[0],pts[1]); const scale=clamp(start.scale*(distance/Math.max(1,start.distance)),1,8);
      const svgAnchor=svgPointFromClient(start.midpoint.x,start.midpoint.y);
      const svgNow=svgPointFromClient(mid.x,mid.y);
      worldMapView.scale=scale;
      worldMapView.x=svgAnchor.x-(svgAnchor.x-start.x)*(scale/start.scale)+(svgNow.x-svgAnchor.x);
      worldMapView.y=svgAnchor.y-(svgAnchor.y-start.y)*(scale/start.scale)+(svgNow.y-svgAnchor.y);
      clampWorldMapPosition();applyWorldMapTransform();
    }
  });
  const end=e=>{worldMapView.pointers.delete(e.pointerId);if(worldMapView.pointers.size<2)worldMapView.pinchStart=null;if(worldMapView.pointers.size===0){worldMapView.dragStart=null;worldMapView.activePointerId=null;setTimeout(()=>{worldMapView.moved=false;},0);}};
  viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);viewport.addEventListener('lostpointercapture',end);
  viewport.addEventListener('click',e=>{if(worldMapView.moved){e.preventDefault();e.stopPropagation();worldMapView.moved=false;}},true);
  document.getElementById('worldMapZoomIn')?.addEventListener('click',()=>setWorldMapZoom(worldMapView.scale*1.35,null,null,true));
  document.getElementById('worldMapZoomOut')?.addEventListener('click',()=>setWorldMapZoom(worldMapView.scale/1.35,null,null,true));
  document.getElementById('worldMapReset')?.addEventListener('click',resetWorldMap);
  window.addEventListener('keydown',e=>{
    if(e.key==='+'||e.key==='=')setWorldMapZoom(worldMapView.scale*1.2,null,null,true);
    else if(e.key==='-')setWorldMapZoom(worldMapView.scale/1.2,null,null,true);
    else if(e.key==='0')resetWorldMap();
  });
  applyWorldMapTransform();
}
function updateWorldSummary(){
  const year=Number(document.getElementById('tripYearSelect')?.value)||new Date().getFullYear(); const count=getVisitedCountryCount(); const percent=Math.round(count/195*100); const newCount=getNewCountriesCount(year); const intl=getInternationalTripCount(year); const islands=state.travelSettings?.islandsVisited?.length||0;
  const ids={worldVisitedCount:`${count} / 195`,worldVisitedPercent:`${percent}% do mundo`,worldSummaryVisited:String(count),worldSummaryYear:String(year),worldSummaryNew:String(newCount),worldSummaryTripYear:String(year),worldSummaryInternational:String(intl),worldSummaryIslands:`${islands} / 7`};
  Object.entries(ids).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=val;});
  renderCountryLists();
}
function renderCountryLists(){
  const visitedBox=document.getElementById('visitedCountryList'),unvisitedBox=document.getElementById('unvisitedCountryList'); if(!visitedBox||!unvisitedBox)return; const countries=getWorldCountries(); const visited=state.visitedCountries||{};
  const visitedList=countries.filter(c=>visited[c.id]?.visited).sort((a,b)=>a.name.localeCompare(b.name)); const unvisited=countries.filter(c=>!visited[c.id]?.visited).sort((a,b)=>a.name.localeCompare(b.name));
  visitedBox.innerHTML=visitedList.length?visitedList.map(c=>`<button class="country-list-item visited" data-country-id="${c.id}">${countryFlagMarkup(c.id,c.name)} ${escapeHtml(c.name)} <span>${iconSvg('i-check','status-line-icon')}</span></button>`).join(''):'<span class="muted">Ainda não marquei nenhum país.</span>';
  unvisitedBox.innerHTML=unvisited.slice(0,40).map(c=>`<button class="country-list-item" data-country-id="${c.id}">${countryFlagMarkup(c.id,c.name)} ${escapeHtml(c.name)} <span>›</span></button>`).join('')+(unvisited.length>40?`<span class="muted country-more-note">Use a busca acima para encontrar outros países.</span>`:'');
  [...visitedBox.querySelectorAll('[data-country-id]'),...unvisitedBox.querySelectorAll('[data-country-id]')].forEach(b=>b.addEventListener('click',()=>{focusCountry(b.dataset.countryId);setTimeout(()=>openCountryModal(b.dataset.countryId),220);}));
}
function searchCountries(){const input=document.getElementById('countrySearchInput');const box=document.getElementById('countrySearchResults');if(!input||!box)return;const q=normalizeCountrySearch(input.value);if(q.length<2){box.classList.add('hidden');box.innerHTML='';return;}const matches=getWorldCountries().filter(c=>normalizeCountrySearch(c.name).includes(q)||normalizeCountrySearch(c.nameEn).includes(q)||c.id.toLowerCase()===q).slice(0,8);box.innerHTML=matches.length?matches.map(c=>`<button class="country-search-item" data-country-id="${c.id}">${countryFlagMarkup(c.id,c.name)} <strong>${escapeHtml(c.name)}</strong><span>${state.visitedCountries?.[c.id]?.visited?iconSvg('i-check','status-line-icon')+' Visitado':'Não visitado'}</span></button>`).join(''):'<span class="muted">Nenhum país encontrado.</span>';box.classList.remove('hidden');box.querySelectorAll('[data-country-id]').forEach(b=>b.addEventListener('click',()=>{box.classList.add('hidden');input.value='';focusCountry(b.dataset.countryId);setTimeout(()=>openCountryModal(b.dataset.countryId),220);}));}
function renderWorldModule(){renderCountryOptions();bindWorldMapNavigation();renderWorldMap();const input=document.getElementById('countrySearchInput');if(input&&!input.dataset.bound){input.dataset.bound='1';input.addEventListener('input',searchCountries);} }
function openCountryModal(code){const c=getCountryById(code);if(!c)return;const rec=state.visitedCountries?.[code]||{};document.getElementById('countryCodeInput').value=code;document.getElementById('countryModalTitle').innerHTML=`${countryFlagMarkup(c.id,c.name)} ${escapeHtml(c.name)}`;document.getElementById('countryModalStatus').innerHTML=rec.visited?`<div class="result-card good"><strong>${iconSvg('i-check','status-line-icon')} Já fui</strong><p>${rec.firstVisit?`Primeira visita: ${escapeHtml(rec.firstVisit)}.`:'Você marcou este país como visitado.'}${rec.lastVisit?` Última visita: ${escapeHtml(rec.lastVisit)}.`:''}</p></div>`:`<div class="result-card"><strong>${iconSvg('i-info','status-line-icon')} Ainda não fui</strong><p>Marque quando quiser. O mínimo é confirmar que você já esteve no país.</p></div>`;document.getElementById('countryFirstVisit').value=rec.firstVisit||'';document.getElementById('countryLastVisit').value=rec.lastVisit||'';document.getElementById('countryTripCount').value=rec.tripCount||'';document.getElementById('countryNotes').value=rec.notes||'';document.getElementById('countryUnmarkBtn').style.display=rec.visited?'block':'none';openModal('countryModal');}
function saveVisitedCountryFromForm(e){e.preventDefault();const code=document.getElementById('countryCodeInput').value;const c=getCountryById(code);if(!c)return;const first=document.getElementById('countryFirstVisit').value;const last=document.getElementById('countryLastVisit').value;if(first&&last&&last<first){showToast('A última visita não pode ser anterior à primeira.');return;}state.visitedCountries=state.visitedCountries||{};state.visitedCountries[code]={visited:true,firstVisit:first||'',lastVisit:last||'',tripCount:Math.max(0,Number(document.getElementById('countryTripCount').value)||0),notes:document.getElementById('countryNotes').value.trim(),updatedAt:new Date().toISOString()};saveState();closeModal('countryModal');renderAll();showToast(`${c.name} marcado como visitado.`);}
function unmarkCountry(){const code=document.getElementById('countryCodeInput').value;const c=getCountryById(code);if(!c)return;if(!confirm(`Desmarcar ${c.name} como visitado?`))return;delete state.visitedCountries[code];saveState();closeModal('countryModal');renderAll();showToast(`${c.name} desmarcado.`);}
let suggestedCountryCode='';
function openCountrySuggestion(code){const c=getCountryById(code);if(!c||state.visitedCountries?.[code]?.visited)return;suggestedCountryCode=code;document.getElementById('countrySuggestionTitle').innerHTML=`${countryFlagMarkup(c.id,c.name)} Você esteve em ${escapeHtml(c.name)}!`;document.getElementById('countrySuggestionText').textContent='A viagem foi marcada como realizada. Deseja adicionar este país ao seu mapa?';openModal('countrySuggestionModal');}
function acceptCountrySuggestion(){if(!suggestedCountryCode)return;const code=suggestedCountryCode;const c=getCountryById(code);state.visitedCountries=state.visitedCountries||{};const month=(state.trips.find(t=>t.status==='realizada'&&t.countryCode===code)?.start||'').slice(0,7);state.visitedCountries[code]={visited:true,firstVisit:month,lastVisit:month,tripCount:state.trips.filter(t=>t.status==='realizada'&&t.countryCode===code).length||1,notes:'',updatedAt:new Date().toISOString()};saveState();closeModal('countrySuggestionModal');suggestedCountryCode='';renderAll();showToast(`${c?.name||'País'} adicionado ao mapa.`.trim());}
function inferTripType(t){const text=`${t.type||''} ${t.country||''} ${t.destination||t.name||''}`.toLowerCase(); if(text.includes('brasil'))return 'brasil'; if(text.includes('canária')||text.includes('canarias')||text.includes('tenerife')||text.includes('gran canaria')||text.includes('fuerteventura')||text.includes('lanzarote')||text.includes('la palma')||text.includes('la gomera')||text.includes('el hierro'))return 'canarias'; if(text.includes('portugal')||text.includes('espanha')||text.includes('frança')||text.includes('france')||text.includes('ital')||text.includes('aleman')||text.includes('holanda')||text.includes('europa'))return 'europa'; return 'internacional';}
function tripTypeLabel(type){return {canarias:'Canárias',europa:'Europa',brasil:'Brasil',internacional:'Internacional',outro:'Outro'}[type]||'Outro';}
function tripStatusLabel(status){return {ideia:'Ideia',planejando:'Planejando',reservado:'Reservado',realizada:'Realizada',cancelada:'Cancelada'}[status]||status;}
function tripYear(t){return t.start?Number(t.start.slice(0,4)):new Date().getFullYear();}
function getTravelAnnualBudget(year=new Date().getFullYear()){return Number(state.travelSettings?.annualBudget?.[String(year)] ?? 3000)||0;}
function getTravelAnnualGoal(year=new Date().getFullYear()){return Number(state.travelSettings?.annualTripGoal?.[String(year)] ?? 9)||0;}
function getTripEstimated(t){return Number(t.estimatedCost ?? t.budget ?? 0)||0;}
function getTripActual(t){return Number(t.actualCost ?? t.actual ?? 0)||0;}
function getTripBreakdownTotal(){return ['transport','accommodation','food','localTransport','activities','other'].reduce((s,k)=>s+(Number(document.getElementById(`trip_${k}`)?.value)||0),0);}
function calculateTravelFund(){return Math.max(0,Number(state.travelFund||0)+getTravelSavedTotal()-getTravelSpentTotal());}
function getTravelSavedTotal(){return state.transactions.filter(t=>t.type==='saving'&&t.category==='Viagens').reduce((s,t)=>s+Number(t.amount||0),0)+(state.profile.travelStartingBalance||0);}
function getTravelSpentTotal(){return state.transactions.filter(t=>t.type==='expense'&&(t.category==='Viagens'||t.source==='travel-fund')).reduce((s,t)=>s+Number(t.amount||0),0);}
function tripMonthDiff(fromKey,toKey){const [fy,fm]=fromKey.split('-').map(Number),[ty,tm]=toKey.split('-').map(Number);return Math.max(0,(ty-fy)*12+(tm-fm));}
function plannedTravelContributionForMonth(key){const travelName=travelBudgetCategoryName();const planned=Math.max(0,Number(getBudget(key)[travelName]||0));const actual=Math.max(0,Number(getSavedByCategory(key)[travelName]||0));return Math.max(0,planned-actual);}
function plannedTravelContributionsThroughMonth(targetKey){if(!targetKey)return 0;const current=monthKey();if(targetKey<current)return 0;let total=0,cursor=current;while(true){total+=plannedTravelContributionForMonth(cursor);if(cursor>=targetKey)break;cursor=addMonthsKey(cursor,1);}return total;}
function plannedTravelContributionsBefore(dateStr){if(!dateStr)return 0;const current=monthKey(),target=dateStr.slice(0,7);if(target<=current)return 0;let total=0,cursor=current;while(cursor<target){total+=plannedTravelContributionForMonth(cursor);cursor=addMonthsKey(cursor,1);}return total;}
function plannedTravelContributionsUntil(dateStr){return plannedTravelContributionsBefore(dateStr);}
function getFutureTrips(excludeId=null){return state.trips.filter(t=>t.id!==excludeId&&t.status!=='cancelada'&&t.status!=='realizada'&&t.start).sort((a,b)=>(a.start||'9999').localeCompare(b.start||'9999'));}
function projectedTravelFundAt(dateStr,excludeId=null){let balance=calculateTravelFund()+plannedTravelContributionsBefore(dateStr); const target=dateStr||'9999-12-31'; for(const t of getFutureTrips(excludeId)){ if(t.start<=target && t.start>=todayISO()) balance-=getTripEstimated(t); } return balance;}
function tripViability(t){
  const cost=getTripEstimated(t), fund=calculateTravelFund(), projected=projectedTravelFundAt(t.start,t.id), after=projected-cost;
  const annual=getTravelAnnualBudget(tripYear(t));
  const annualPlanned=getAnnualTravelPlanned(tripYear(t));
  const overAnnual=annual>0 && annualPlanned>annual;
  if(t.status==='cancelada') return {cls:'info',icon:'i-info',title:'Cancelada',text:'Esta viagem não está sendo considerada no planejamento.'};
  if(projected<cost){return {cls:'bad',icon:'i-alert',title:'Ainda não financiada',text:`Faltariam aproximadamente ${currency(cost-projected)} até ${formatDate(t.start)}.`};}
  if(overAnnual){return {cls:'warn',icon:'i-alert',title:'Cabe, mas atenção',text:`Seu planejamento anual está em ${currency(annualPlanned)} para um limite de ${currency(annual)}.`};}
  if(after<=Math.max(100,cost*.15)){return {cls:'warn',icon:'i-alert',title:'Cabe, mas fica apertada',text:`Depois dela sobrariam aproximadamente ${currency(after)} no fundo.`};}
  return {cls:'good',icon:'i-check',title:'Viagem viável',text:`Você deverá ter cerca de ${currency(projected)} disponíveis até a viagem.`};
}
function getAnnualTravelPlanned(year){return state.trips.filter(t=>tripYear(t)===Number(year)&&t.status!=='cancelada').reduce((s,t)=>s+getTripEstimated(t),0);}
function getAnnualTravelActual(year){const tripActual=state.trips.filter(t=>tripYear(t)===Number(year)&&t.status!=='cancelada').reduce((s,t)=>s+getTripActual(t),0); const legacy=state.transactions.filter(t=>t.type==='expense'&&t.category==='Viagens'&&!t.source&&t.date?.startsWith(`${year}-`)).reduce((s,t)=>s+Number(t.amount||0),0); return tripActual+legacy;}
function tripDuration(t){if(!t.start||!t.end)return null; const a=new Date(`${t.start}T12:00:00`),b=new Date(`${t.end}T12:00:00`); const days=Math.round((b-a)/86400000)+1;return days>0?days:null;}
function syncTripFundTransaction(trip){
  const txId=trip.fundTransactionId; const idx=state.transactions.findIndex(x=>x.id===txId); const amount=getTripActual(trip); const shouldHave=amount>0&&trip.status!=='cancelada';
  if(!shouldHave){if(idx>=0)state.transactions.splice(idx,1);trip.fundTransactionId='';return;}
  const tx={id:txId||cryptoRandom(),type:'expense',source:'travel-fund',tripId:trip.id,amount,category:'Viagens',date:trip.start||todayISO(),description:`Viagem: ${trip.destination}`};
  if(idx>=0)state.transactions[idx]=tx;else{state.transactions.push(tx);trip.fundTransactionId=tx.id;}
}
function removeTripFundTransaction(trip){if(trip?.fundTransactionId)state.transactions=state.transactions.filter(x=>x.id!==trip.fundTransactionId);}
function setTravelYearConfig(year,budget,goal){state.travelSettings=state.travelSettings||clone(initialState.travelSettings);state.travelSettings.annualBudget={...(state.travelSettings.annualBudget||{}),[String(year)]:Math.max(0,Number(budget)||0)};state.travelSettings.annualTripGoal={...(state.travelSettings.annualTripGoal||{}),[String(year)]:Math.max(0,Number(goal)||0)};saveState();renderTrips();renderDashboard();}

function renderNextGoal(){
  const goal=[...state.goals].filter(g=>g.current<g.target).sort((a,b)=>{const pa={alta:0,média:1,baixa:2};return (pa[a.priority]??1)-(pa[b.priority]??1)})[0];
  const box=document.getElementById('nextGoalBox');
  if(!goal){box.innerHTML='<div class="mission-content"><h4>Você completou tudo!</h4><p class="mission-sub">Crie uma nova missão para continuar avançando.</p></div>';return;}
  const remaining=Math.max(0,goal.target-goal.current); const progress=clamp(goal.current/goal.target*100,0,100); const months=goal.monthly>0?Math.ceil(remaining/goal.monthly):null;
  box.innerHTML=`<div class="mission-content"><div class="mission-top"><div><h4>${goalIconMarkup(goal)} ${escapeHtml(goal.name)}</h4><div class="mission-sub">${currency(goal.current)} / ${currency(goal.target)} · faltam ${currency(remaining)}</div></div><div class="mission-value">${Math.round(progress)}%</div></div><div class="mission-progress"><span style="width:${progress}%"></span></div><div class="mission-sub">Com ${currency(goal.monthly)}/mês: ${months?`aprox. ${months} meses`:'defina um aporte mensal'}.</div></div>`;
}
function renderNextTrip(){
  const trips=state.trips.filter(t=>t.status!=='cancelada'&&t.status!=='realizada'&&t.start).sort((a,b)=>(a.start||'9999').localeCompare(b.start||'9999'));
  const box=document.getElementById('nextTripBox');
  if(!trips.length){box.innerHTML='<div class="mission-content"><h4>Nenhuma viagem planejada ainda.</h4><p class="mission-sub">Comece com uma viagem e informe quanto ela deve custar.</p></div>';return;}
  const t=trips[0], viability=tripViability(t), projected=projectedTravelFundAt(t.start,t.id), after=projected-getTripEstimated(t);
  box.innerHTML=`<div class="mission-content"><div class="mission-top"><div><h4>${escapeHtml(t.destination)}</h4><div class="mission-sub">${t.start?formatDate(t.start):'Data a definir'} · ${currency(getTripEstimated(t))}</div></div><span class="status-pill ${viability.cls}">${iconSvg(viability.icon,'status-line-icon')} ${viability.title}</span></div><div class="mission-sub">${projected>=getTripEstimated(t)?`Saldo projetado até a viagem: <strong>${currency(projected)}</strong> · sobra estimada: ${currency(Math.max(0,after))}.`:`${viability.text}`}</div></div>`;
}
function renderMoneyPlan(){const b=getBudget();const items=budgetCategoryDefs().map(d=>[d.name,d.icon,b[d.name]]);document.getElementById('moneyPlan').innerHTML=items.map(([name,icon,val])=>`<div class="plan-item"><span>${iconSvg(icon)} ${escapeHtml(name)}</span><strong>${currency(val)}</strong></div>`).join('')+`<div class="plan-item"><span>Capital livre</span><strong>${currency(plannedFree())}</strong></div>`;}

function setupSalaryHistoryYear(){const select=document.getElementById('salaryHistoryYear');if(!select)return;const years=new Set([new Date().getFullYear(),...state.salaryRecords.map(r=>Number(r.month.slice(0,4))).filter(Boolean)]);select.innerHTML=[...years].sort((a,b)=>b-a).map(y=>`<option value="${y}">${y}</option>`).join('');}

function setupMonthSelector(){ const select=document.getElementById('chartMonthSelect'); const now=new Date(); select.innerHTML=''; for(let i=0;i<7;i++){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const key=monthKey(d); const opt=document.createElement('option');opt.value=key;opt.textContent=monthLabel(key);select.appendChild(opt);} select.addEventListener('change',updateCharts); }
function updateCharts(){
  if(!window.Chart)return;
  const selected=document.getElementById('chartMonthSelect').value||monthKey();
  const values={income:incomeUsedForMonth(selected),spent:actualExpenses(selected),saved:actualSaved(selected)};
  const ctx1=document.getElementById('monthlyChart').getContext('2d');
  charts.monthly?.destroy(); charts.monthly=new Chart(ctx1,{type:'bar',data:{labels:['Recebido','Gasto','Guardado'],datasets:[{data:[values.income,values.spent,values.saved],borderRadius:8}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:false,ticks:{callback:v=>`€${v}`}}}}});
  const actual=getActualByCategory(selected); const labels=Object.keys(actual).filter(c=>actual[c]>0); const data=labels.map(c=>actual[c]);
  const ctx2=document.getElementById('categoryChart').getContext('2d'); charts.category?.destroy(); charts.category=new Chart(ctx2,{type:'doughnut',data:{labels:labels.length?labels:['Ainda sem gastos'],datasets:[{data:data.length?data:[1],borderWidth:0}]},options:{plugins:{legend:{position:'bottom',labels:{boxWidth:10}}}}});
}

function renderBudgetMonthNav(){
  const label=document.getElementById('budgetMonthLabel');
  if(label)label.textContent=`Orçamento de ${monthLabel(budgetSelectedMonth).toLowerCase()}`;
  const status=document.getElementById('budgetMonthStatus');
  if(status)status.textContent=budgetSelectedMonth===monthKey()?'Mês atual':'Planejamento';
}
function saveBudgetInlineValue(input){
  const category=input.dataset.category,key=input.dataset.month||budgetSelectedMonth;
  if(!category||input.dataset.saving==='1')return false;
  input.dataset.saving='1';
  const value=Math.max(0,Number(String(input.value).replace(',','.'))||0);
  setBudgetAmount(key,category,value);
  saveState();
  renderAll();
  showToast(`${category}: orçamento atualizado.`);
  return true;
}
function beginBudgetInlineEdit(category,key){
  const row=[...document.querySelectorAll('#budgetBody tr')].find(r=>r.dataset.budgetCategory===category);
  if(!row)return;
  const cell=row.querySelector('.budget-planned-cell');
  if(!cell||cell.querySelector('input'))return;
  const current=Number(getBudget(key)[category]||0);
  cell.innerHTML=`<div class="budget-inline-editor"><span>€</span><input class="budget-inline-input" data-category="${escapeHtml(category)}" data-month="${escapeHtml(key)}" type="number" min="0" step="1" inputmode="decimal" value="${current}" aria-label="Planejamento de ${escapeHtml(category)}"><button type="button" class="budget-inline-confirm" aria-label="Salvar orçamento de ${escapeHtml(category)}">${iconSvg('i-check')}</button><button type="button" class="budget-inline-cancel" aria-label="Cancelar edição">×</button></div>`;
  const input=cell.querySelector('input');
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();saveBudgetInlineValue(input);}else if(e.key==='Escape'){e.preventDefault();input.dataset.cancelled='1';renderMoney();}});
  input.addEventListener('blur',()=>{if(input.dataset.saving!=='1'&&!input.dataset.cancelled)saveBudgetInlineValue(input);});
  cell.querySelector('.budget-inline-confirm')?.addEventListener('click',()=>saveBudgetInlineValue(input));
  cell.querySelector('.budget-inline-cancel')?.addEventListener('click',()=>{input.dataset.cancelled='1';renderMoney();});
  requestAnimationFrame(()=>{input.focus();input.select();});
}
function bindBudgetEditor(){
  document.getElementById('budgetPrevMonth')?.addEventListener('click',()=>{budgetSelectedMonth=addMonthsKey(budgetSelectedMonth,-1);renderMoney();});
  document.getElementById('budgetNextMonth')?.addEventListener('click',()=>{budgetSelectedMonth=addMonthsKey(budgetSelectedMonth,1);renderMoney();});
  document.getElementById('budgetBody')?.addEventListener('click',e=>{const edit=e.target.closest('[data-budget-edit]');if(edit){beginBudgetInlineEdit(edit.dataset.category,budgetSelectedMonth);return;}const action=e.target.closest('[data-budget-category-action]');if(action)handleBudgetCategoryAction(action.dataset.budgetCategoryAction,action.dataset.id);});
  document.getElementById('budgetArchivedWrap')?.addEventListener('click',e=>{const action=e.target.closest('[data-budget-category-action]');if(action)handleBudgetCategoryAction(action.dataset.budgetCategoryAction,action.dataset.id);});
  document.getElementById('addBudgetCategoryBtn')?.addEventListener('click',()=>openBudgetCategoryModal());
  document.getElementById('budgetCategoryForm')?.addEventListener('submit',saveBudgetCategoryFromForm);
}
function tripCountryCodes(trip){
  const raw=[];
  const normalizeCode=value=>{
    const text=String(value||'').trim();
    if(!text)return '';
    const upper=text.toUpperCase();
    return getCountryById(upper)?upper:resolveCountryCode(text);
  };
  if(Array.isArray(trip.countryCodes))raw.push(...trip.countryCodes.map(normalizeCode));
  if(Array.isArray(trip.countries))raw.push(...trip.countries.map(x=>normalizeCode(typeof x==='string'?x:(x?.countryCode||x?.code||x?.country||x?.name||''))));
  if(Array.isArray(trip.destinations))raw.push(...trip.destinations.map(x=>normalizeCode(typeof x==='string'?x:(x?.countryCode||x?.code||x?.country||x?.name||''))));
  if(trip.countryCode)raw.push(normalizeCode(trip.countryCode));
  if(trip.country)raw.push(normalizeCode(trip.country));
  return [...new Set(raw.filter(Boolean))];
}
function tripFlagsMarkup(trip){
  const codes=tripCountryCodes(trip); if(!codes.length)return '';
  const visible=codes.slice(0,3).map(code=>countryFlagMarkup(code)).filter(Boolean);
  if(codes.length>3)visible.push(`<span class="trip-country-more">+${codes.length-3}</span>`);
  return visible.length?`<span class="trip-country-flags" aria-label="Países da viagem">${visible.join('')}</span>`:'';
}
function renderBudgetRows(key){
  const body=document.getElementById('budgetBody'); if(!body)return;
  const b=getBudget(key), a=getActualByCategory(key), saved=getSavedByCategory(key), defs=budgetCategoryDefs();
  const activeRows=defs.map(def=>{
    const planned=Number(b[def.name]||0), actual=Number(a[def.name]||0)+Number(saved[def.name]||0), rest=planned-actual, ratio=planned?actual/planned:0, cls=planned===0?'info':ratio>1?'bad':ratio>.8?'warn':'good', status=planned===0?'Sem plano':ratio>1?'Passou':ratio>.8?'Atenção':'Tudo bem';
    const hasHistory=budgetCategoryHasHistory(def);
    const categoryAction=hasHistory?'archive':'delete';
    const categoryActionLabel=hasHistory?'Arquivar':'Excluir';
    const categoryActionIcon=hasHistory?'i-pause':'i-trash';
    return `<tr data-budget-category="${escapeHtml(def.name)}"><td><div class="budget-category-cell">${iconSvg(def.icon,'table-icon')}<span>${escapeHtml(def.name)}</span><button type="button" class="icon-button small-icon budget-category-edit" data-budget-category-action="edit" data-id="${escapeHtml(def.id)}" aria-label="Editar categoria ${escapeHtml(def.name)}" title="Editar categoria">${iconSvg('i-edit','action-icon')}</button></div></td><td class="budget-planned-cell"><button type="button" class="budget-inline-display" data-budget-edit data-category="${escapeHtml(def.name)}" aria-label="Editar orçamento de ${escapeHtml(def.name)}"><span>${currency(planned)}</span>${iconSvg('i-edit','budget-edit-icon')}</button></td><td>${currency(actual)}</td><td>${currency(rest)}</td><td><span class="status-pill ${cls}">${status}</span></td><td class="budget-row-actions"><button type="button" class="icon-button small-icon ${categoryAction==='delete'?'danger-icon':''}" data-budget-category-action="${categoryAction}" data-id="${escapeHtml(def.id)}" aria-label="${categoryActionLabel} ${escapeHtml(def.name)}" title="${categoryActionLabel}">${iconSvg(categoryActionIcon,'action-icon')}</button></td></tr>`;
  }).join('');
  body.innerHTML=activeRows || `<tr><td colspan="6"><div class="empty-state"><strong>Nenhuma categoria ativa.</strong><span>Adicione uma categoria para começar.</span></div></td></tr>`;
  const archived=state.budgetCategories?.filter(c=>!c.active)||[]; const old=document.getElementById('budgetArchivedWrap');
  if(old) old.innerHTML=archived.length?`<details class="budget-archived"><summary>Categorias arquivadas (${archived.length})</summary><div class="budget-archived-list">${archived.map(c=>`<div class="budget-archived-item"><span>${iconSvg(c.icon||'i-box','table-icon')} ${escapeHtml(c.name)}</span><button type="button" class="text-button" data-budget-category-action="restore" data-id="${escapeHtml(c.id)}">Reativar</button></div>`).join('')}</div></details>`:'';
}
function renderMoney(){
  const key=budgetSelectedMonth;
  document.getElementById('moneyIncome').textContent=currency(incomeUsedForMonth(key));document.getElementById('moneySpent').textContent=currency(actualExpenses(key));document.getElementById('moneySaved').textContent=currency(actualSaved(key));const moneyFree=actualCapitalFree(key); document.getElementById('moneyFree').textContent=currency(moneyFree); setMoneyValueClass(document.getElementById('moneyFree'),moneyFree);renderBudgetMonthNav();renderAllocationMonthSelect();renderAllocationSummary(allocationSelectedMonth);renderBudgetRows(key);renderTransactions(key); }
function openBudgetCategoryModal(id=''){
  const modal=document.getElementById('budgetCategoryModal'); if(!modal)return; const def=id?state.budgetCategories.find(c=>c.id===id):null;
  document.getElementById('budgetCategoryId').value=def?.id||'';document.getElementById('budgetCategoryName').value=def?.name||'';document.getElementById('budgetCategoryAmount').value=def?Number(state.budgetDefaults?.[def.name]??0):0;document.getElementById('budgetCategoryType').value=def?.type||'expense';document.getElementById('budgetCategoryTitle').textContent=def?'Editar categoria':'Adicionar categoria';document.getElementById('budgetCategoryHelp').textContent=def?'Renomear preserva os lançamentos históricos desta categoria.':'A categoria passa a fazer parte dos orçamentos futuros sem criar nenhuma transação.';openModal('budgetCategoryModal');setTimeout(()=>document.getElementById('budgetCategoryName').focus(),50);
}
function saveBudgetCategoryFromForm(e){e.preventDefault();const id=document.getElementById('budgetCategoryId').value;const name=document.getElementById('budgetCategoryName').value.trim();const type=document.getElementById('budgetCategoryType').value;const amount=Math.max(0,Number(document.getElementById('budgetCategoryAmount').value)||0);if(!name){showToast('Informe um nome para a categoria.');return;}let result;if(id){result=renameBudgetCategory(id,name);const def=state.budgetCategories.find(c=>c.id===id);if(result.ok&&def){def.type=type;def.icon=getBudgetCategoryIcon(def.name,type);state.budgetDefaults[def.name]=amount;def.updatedAt=new Date().toISOString();}}else{result=addBudgetCategory({name,amount,type});}if(!result.ok){showToast(result.error==='duplicate'?'Já existe uma categoria com esse nome.':'Não foi possível salvar a categoria.');return;}saveState();closeModal('budgetCategoryModal');populateCategorySelect();renderAll();showToast(id?'Categoria atualizada.':'Categoria criada.');}
function handleBudgetCategoryAction(action,id){
  const def=state.budgetCategories.find(c=>c.id===id);
  if(!def)return;
  if(action==='edit'){openBudgetCategoryModal(id);return;}
  if(action==='restore'){if(!restoreBudgetCategory(id)){showToast('Não foi possível reativar essa categoria.');return;}saveState();populateCategorySelect();renderAll();showToast('Categoria reativada.');return;}
  if(action==='archive'){
    const hasHistory=budgetCategoryHasHistory(def);
    const msg=hasHistory?`“${def.name}” possui lançamentos ou orçamento histórico. Ela será arquivada e o histórico será preservado.`:`Arquivar “${def.name}” do orçamento futuro?`;
    if(!confirm(msg))return;
    archiveBudgetCategory(id);saveState();populateCategorySelect();renderAll();showToast('Categoria arquivada.');return;
  }
  if(action==='delete'){
    const result=deleteBudgetCategory(id);
    if(result.error==='has-history'){
      const msg=`“${def.name}” possui lançamentos, orçamento histórico ou está ligada a uma distribuição. Para preservar os dados, ela será arquivada em vez de apagada.

Continuar?`;
      if(!confirm(msg))return;
      archiveBudgetCategory(id);saveState();populateCategorySelect();renderAll();showToast('Categoria arquivada para preservar o histórico.');return;
    }
    if(!confirm(`Excluir definitivamente “${def.name}”?`))return;
    if(!result.ok){showToast('Não foi possível excluir a categoria.');return;}
    saveState();populateCategorySelect();renderAll();showToast('Categoria excluída.');
  }
}

function renderTransactions(key=budgetSelectedMonth){const list=document.getElementById('recentTransactions');if(!list)return;const tx=getMonthTransactions(key).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));if(!tx.length){list.innerHTML=`<div class="muted">Nenhum lançamento em ${escapeHtml(monthLabel(key).toLowerCase())}.</div>`;return;}list.innerHTML=tx.slice(0,8).map(t=>`<div class="transaction"><div class="transaction-icon">${iconSvg(iconIdForCategory(t.category,t.type),'transaction-line-icon')}</div><div class="transaction-main"><strong>${escapeHtml(t.description||t.category)}</strong><span>${escapeHtml(t.category)} · ${formatDate(t.date)}</span></div><div class="transaction-amount">${t.type==='saving'?'+ ':'- '}${currency(t.amount)}</div></div>`).join('');}
function addExpense(amount, category, date, description=''){const type=getBudgetCategoryType(category);state.transactions.push({id:cryptoRandom(),type:isBudgetSavingType(type)?'saving':'expense',amount:Number(amount),category,date,description});saveState();renderAll();showToast(`${currency(amount)} registrado em ${category}.`);}
function populateCategorySelect(){const select=document.getElementById('expenseCategory');if(!select)return;select.innerHTML=budgetCategoryDefs().filter(c=>c.type==='expense'||isBudgetSavingType(c.type)).map(c=>`<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');}

function setupTripYearSelector(){const el=document.getElementById('tripYearSelect');if(!el)return;const years=new Set([new Date().getFullYear(),...state.trips.map(tripYear),...Object.keys(state.travelSettings?.annualBudget||{}).map(Number)]);const current=Number(el.value)||new Date().getFullYear();el.innerHTML=[...years].sort((a,b)=>a-b).map(y=>`<option value="${y}">${y}</option>`).join('');el.value=years.has(current)?current:new Date().getFullYear();}

function renderTrips(){
  const selectedYear=Number(document.getElementById('tripYearSelect')?.value)||new Date().getFullYear();
  const annualBudget=getTravelAnnualBudget(selectedYear), annualGoal=getTravelAnnualGoal(selectedYear), planned=getAnnualTravelPlanned(selectedYear), actual=getAnnualTravelActual(selectedYear), available=Math.max(0,annualBudget-planned);
  const fund=calculateTravelFund();
  const tripsYear=state.trips.filter(t=>tripYear(t)===selectedYear&&t.status!=='cancelada');
  const completed=tripsYear.filter(t=>t.status==='realizada').length;
  const next=state.trips.filter(t=>t.status!=='cancelada'&&t.status!=='realizada'&&t.start).sort((a,b)=>(a.start||'9999').localeCompare(b.start||'9999'))[0];
  document.getElementById('tripFundBig').textContent=currency(fund);
  const travelName=travelBudgetCategoryName(); document.getElementById('tripFundAdvice').textContent=`Aporte planejado: ${currency(Number(getBudget(monthKey())[travelName]||0))}/mês · já utilizado: ${currency(getTravelSpentTotal())}`;
  document.getElementById('tripAnnualBudget').textContent=currency(annualBudget);
  document.getElementById('tripAnnualPlanned').textContent=currency(planned);
  document.getElementById('tripAnnualActual').textContent=currency(actual);
  document.getElementById('tripAnnualAvailable').textContent=currency(available);
  document.getElementById('tripGoalCount').textContent=`${completed} / ${annualGoal}`;
  document.getElementById('tripNextCost').textContent=next?currency(getTripEstimated(next)):'€0';
  document.getElementById('tripNextAfter').textContent=next?next.destination:'Nenhuma viagem';
  const annualPct=annualBudget?clamp(planned/annualBudget*100,0,100):0;
  document.getElementById('tripAnnualProgress').style.width=`${annualPct}%`;
  document.getElementById('tripAnnualProgressLabel').textContent=`${currency(planned)} / ${currency(annualBudget)}`;
  renderTripCalendar(selectedYear);
  renderTripFilters();
  renderTravelHealth(selectedYear);
  renderTripIslands();
  renderWorldModule();
  updateWorldSummary();
  renderTripList(selectedYear);
  renderTravelCharts(selectedYear);
  document.getElementById('tripYearBudgetInput').value=annualBudget;
  document.getElementById('tripYearGoalInput').value=annualGoal;
}
function renderTripFilters(){document.querySelectorAll('[data-trip-filter]').forEach(b=>b.classList.toggle('active',b.dataset.tripFilter===(window.tripFilter||'all')));}
function renderTravelHealth(year){
  const annual=getTravelAnnualBudget(year), planned=getAnnualTravelPlanned(year), available=Math.max(0,annual-planned), fund=calculateTravelFund(), future=state.trips.filter(t=>tripYear(t)===year&&t.status!=='cancelada'&&t.start>=todayISO()).length;
  const cards=[];
  cards.push({cls:planned>annual?'bad':planned>annual*.8?'warn':'good',title:planned>annual?'Seu ano está acima do limite':planned>annual*.8?'Seu ano está ficando cheio':'Seu plano anual está confortável',text:`${currency(planned)} já planejados de ${currency(annual)} disponíveis para viagens em ${year}.`});
  cards.push({cls:fund<=0?'warn':fund<250?'warn':'good',title:fund<=0?'Fundo ainda vazio':'Fundo de viagens',text:fund>0?`Você já tem ${currency(fund)} separados para viajar.`:'Ainda não há saldo reservado; os aportes planejados virão mês a mês.'});
  cards.push({cls:'info',title:'Plano atual',text:`${future} viagem(ns) futura(s) considerada(s) no planejamento de ${year}.`});
  document.getElementById('travelHealthBox').innerHTML=cards.map(c=>`<div class="travel-health-card ${c.cls}"><strong>${c.title}</strong><span>${escapeHtml(c.text)}</span></div>`).join('');
}
function getFormTripDraft(){
  const destination=document.getElementById('tripDestination')?.value.trim()||''; const start=document.getElementById('tripStart')?.value||''; const end=document.getElementById('tripEnd')?.value||''; const b={transport:Number(document.getElementById('trip_transport')?.value)||0,accommodation:Number(document.getElementById('trip_accommodation')?.value)||0,food:Number(document.getElementById('trip_food')?.value)||0,localTransport:Number(document.getElementById('trip_localTransport')?.value)||0,activities:Number(document.getElementById('trip_activities')?.value)||0,other:Number(document.getElementById('trip_other')?.value)||0};
  return {id:document.getElementById('tripId')?.value||'__draft__',destination,country:document.getElementById('tripCountry')?.value.trim()||'',type:document.getElementById('tripType')?.value||'canarias',island:document.getElementById('tripIsland')?.value.trim()||'',start,end,status:document.getElementById('tripStatus')?.value||'planejando',estimatedCost:Object.values(b).reduce((a,v)=>a+v,0),budgetBreakdown:b,actualCost:Number(document.getElementById('tripActual')?.value)||0};
}
function updateTripViabilityPreview(){
  const box=document.getElementById('tripViabilityPreview'); if(!box)return; const t=getFormTripDraft(); if(!t.destination||!t.start||t.estimatedCost<=0){box.className='trip-viability-preview';box.textContent='Preencha destino, data de ida e orçamento para ver a análise.';return;} if(t.end&&t.end<t.start){box.className='trip-viability-preview bad';box.textContent='A data de volta não pode ser anterior à ida.';return;} const v=tripViability(t); box.className=`trip-viability-preview ${v.cls}`; const projected=projectedTravelFundAt(t.start,t.id==='__draft__'?null:t.id); const cost=t.estimatedCost; const after=projected-cost; box.innerHTML=`<strong>${iconSvg(v.icon,'status-line-icon')} ${v.title}</strong><br>${escapeHtml(projected>=cost?`Saldo projetado até a viagem: ${currency(projected)} · depois dela: ${currency(Math.max(0,after))}.`:`Faltariam aproximadamente ${currency(cost-projected)} até ${formatDate(t.start)}.`)}`;
}
function renderTripList(year){
  const filter=window.tripFilter||'all'; const grid=document.getElementById('tripGrid');
  let trips=state.trips.filter(t=>tripYear(t)===Number(year));
  if(filter!=='all')trips=trips.filter(t=>filter==='canarias'||filter==='europa'||filter==='brasil'||filter==='internacional'||filter==='outro'?t.type===filter:t.status===filter);
  trips.sort((a,b)=>(a.start||'9999').localeCompare(b.start||'9999'));
  if(!trips.length){grid.innerHTML=`<div class="panel" style="grid-column:1/-1"><div class="empty-state"><strong>Nenhuma viagem encontrada</strong><span>Crie uma viagem ou troque o filtro.</span></div></div>`;return;}
  grid.innerHTML=trips.map(t=>{
    const v=tripViability(t), days=tripDuration(t), estimated=getTripEstimated(t), real=getTripActual(t), diff=real-estimated;
    const diffText=real>0?`${diff>0?'+':''}${currency2(diff)}`:'Ainda não registrado';
    return `<article class="trip-card"><div class="trip-actions"><span class="trip-status ${v.cls}">${tripStatusLabel(t.status)}</span><div class="trip-card-actions"><button class="text-button trip-edit" data-id="${t.id}">Editar</button><button class="text-button danger-text trip-delete" data-id="${t.id}">Excluir</button></div></div><div class="trip-card-title"><div class="trip-emoji">${iconSvg('i-plane')}</div><div><h3>${tripFlagsMarkup(t)}${escapeHtml(t.destination)}</h3><div class="trip-meta">${escapeHtml(tripTypeLabel(t.type))}${t.country?` · ${escapeHtml(t.country)}`:''}${t.island?` · ${escapeHtml(t.island)}`:''}</div></div></div><div class="trip-details"><div class="trip-detail"><span>Datas</span><strong>${t.start?formatDate(t.start):'A definir'}${t.end?` → ${formatDate(t.end)}`:''}</strong>${days?`<small>${days} ${days===1?'dia':'dias'}</small>`:''}</div><div class="trip-detail"><span>Orçamento</span><strong>${currency(estimated)}</strong></div><div class="trip-detail"><span>Custo real</span><strong>${real?currency2(real):'—'}</strong></div><div class="trip-detail"><span>Diferença</span><strong class="${diff>0?'negative':diff<0?'positive':''}">${diffText}</strong></div></div><div class="trip-status-box ${v.cls}"><strong>${iconSvg(v.icon,'status-line-icon')} ${v.title}</strong><span>${escapeHtml(v.text)}</span></div><div class="trip-card-footer"><span>${t.notes?escapeHtml(t.notes):'Planejamento financeiro da viagem'}</span><button class="secondary-button trip-details-btn" data-id="${t.id}">Ver detalhes</button></div></article>`;
  }).join('');
  document.querySelectorAll('.trip-edit,.trip-details-btn').forEach(b=>b.addEventListener('click',()=>openTripModal(b.dataset.id)));
  document.querySelectorAll('.trip-delete').forEach(b=>b.addEventListener('click',()=>deleteTrip(b.dataset.id)));
}
function renderTripCalendar(year){
  const cal=document.getElementById('tripCalendar'); const byMonth={}; state.trips.forEach(t=>{if(t.start&&tripYear(t)===Number(year)){const k=t.start.slice(0,7);(byMonth[k]??=[]).push(t);}});
  cal.innerHTML=Array.from({length:12},(_,i)=>{const d=new Date(Number(year),i,1),k=`${year}-${String(i+1).padStart(2,'0')}`,trips=byMonth[k]||[];return `<div class="month-cell"><div class="month-name">${monthNames[i]}</div>${trips.slice(0,3).map(t=>`<button class="month-trip" data-id="${t.id}">${escapeHtml(t.destination)}</button>`).join('')}${trips.length>3?`<div class="month-trip more">+${trips.length-3}</div>`:''}</div>`}).join('');
  cal.querySelectorAll('.month-trip[data-id]').forEach(b=>b.addEventListener('click',()=>openTripModal(b.dataset.id)));
}
function renderTripIslands(){
  const islands=['Tenerife','Gran Canaria','Fuerteventura','Lanzarote','La Palma','La Gomera','El Hierro']; const box=document.getElementById('islandsChecklist'); if(!box)return;
  box.innerHTML=islands.map(i=>{const visited=state.travelSettings.islandsVisited.includes(i);return `<button class="island-chip ${visited?'visited':''}" data-island="${escapeHtml(i)}">${iconSvg(visited?'i-check':'i-map','action-icon')} ${escapeHtml(i)}</button>`;}).join('');
  box.querySelectorAll('.island-chip').forEach(b=>b.addEventListener('click',()=>{const island=b.dataset.island;const arr=state.travelSettings.islandsVisited||[];state.travelSettings.islandsVisited=arr.includes(island)?arr.filter(x=>x!==island):[...arr,island];saveState();renderTrips();}));
}
function renderTravelCharts(year){
  if(!window.Chart)return;
  const categoryTotals={Transporte:0,Hospedagem:0,Alimentação:0,'Transporte local':0,Passeios:0,Outros:0};
  state.trips.filter(t=>tripYear(t)===Number(year)&&t.status!=='cancelada').forEach(t=>{const b=t.budgetBreakdown||{}; categoryTotals.Transporte+=Number(b.transport||0);categoryTotals.Hospedagem+=Number(b.accommodation||0);categoryTotals.Alimentação+=Number(b.food||0);categoryTotals['Transporte local']+=Number(b.localTransport||0);categoryTotals.Passeios+=Number(b.activities||0);categoryTotals.Outros+=Number(b.other||0);});
  const monthValues=Array(12).fill(0); state.trips.filter(t=>tripYear(t)===Number(year)).forEach(t=>{if(t.start)monthValues[Number(t.start.slice(5,7))-1]+=getTripActual(t);});
  const catCanvas=document.getElementById('travelCategoryChart'),monthCanvas=document.getElementById('travelMonthChart'); if(catCanvas){charts.travelCategory?.destroy();charts.travelCategory=new Chart(catCanvas.getContext('2d'),{type:'doughnut',data:{labels:Object.keys(categoryTotals),datasets:[{data:Object.values(categoryTotals)}]},options:{plugins:{legend:{position:'bottom'}}}});} if(monthCanvas){charts.travelMonth?.destroy();charts.travelMonth=new Chart(monthCanvas.getContext('2d'),{type:'bar',data:{labels:monthShort,datasets:[{label:'Gasto real',data:monthValues}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:false,ticks:{callback:v=>`€${v}`}}}}});}
}
function openTripModal(id=null){
  const t=id?state.trips.find(x=>x.id===id):null; document.getElementById('tripId').value=t?.id||''; document.getElementById('tripTitle').textContent=t?'Editar viagem':'Planejar viagem';
  document.getElementById('tripDestination').value=t?.destination||'';document.getElementById('tripCountry').value=t?.country||'';document.getElementById('tripType').value=t?.type||'canarias';document.getElementById('tripIsland').value=t?.island||'';document.getElementById('tripStart').value=t?.start||'';document.getElementById('tripEnd').value=t?.end||'';document.getElementById('tripActual').value=t?.actualCost||'';document.getElementById('tripStatus').value=t?.status||'planejando';document.getElementById('tripNotes').value=t?.notes||'';
  const b=t?.budgetBreakdown||{}; ['transport','accommodation','food','localTransport','activities','other'].forEach(k=>document.getElementById(`trip_${k}`).value=Number(b[k]||0)); updateTripEstimatedTotal(); document.getElementById('tripViabilityPreview').innerHTML=t?tripViability(t).text:'Preencha o orçamento e a data para ver se a viagem cabe no seu fundo.'; openModal('tripModal');
}
function updateTripEstimatedTotal(){const total=getTripBreakdownTotal();document.getElementById('tripEstimatedCost').textContent=currency2(total); const start=document.getElementById('tripStart')?.value;const end=document.getElementById('tripEnd')?.value;const days=start&&end?tripDuration({start,end}):null;document.getElementById('tripDuration').textContent=days?`${days} ${days===1?'dia':'dias'}`:'—';updateTripViabilityPreview();}
function deleteTrip(id){const t=state.trips.find(x=>x.id===id);if(!t)return;if(!confirm(`Excluir a viagem ${t.destination}?`))return;removeTripFundTransaction(t);state.trips=state.trips.filter(x=>x.id!==id);saveState();renderAll();showToast('Viagem removida.');}
function saveTripFromForm(){
  const id=document.getElementById('tripId').value; const destination=document.getElementById('tripDestination').value.trim(); const start=document.getElementById('tripStart').value; const end=document.getElementById('tripEnd').value; const estimated=getTripBreakdownTotal(); const actual=Math.max(0,Number(document.getElementById('tripActual').value)||0);
  if(!destination){showToast('Informe o destino.');return false;} if(start&&end&&end<start){showToast('A volta não pode ser anterior à ida.');return false;} if(!estimated){showToast('Informe pelo menos um valor no orçamento.');return false;}
  let t=id?state.trips.find(x=>x.id===id):null; const isNewTrip=!t; if(!t){t={id:cryptoRandom(),createdAt:new Date().toISOString()};state.trips.push(t);} const old={...t}; const country=document.getElementById('tripCountry').value.trim(); const countryCode=resolveCountryCode(country); Object.assign(t,{destination,country,countryCode,type:document.getElementById('tripType').value,island:document.getElementById('tripIsland').value.trim(),start,end,status:document.getElementById('tripStatus').value,estimatedCost:estimated,budgetBreakdown:{transport:Number(document.getElementById('trip_transport').value)||0,accommodation:Number(document.getElementById('trip_accommodation').value)||0,food:Number(document.getElementById('trip_food').value)||0,localTransport:Number(document.getElementById('trip_localTransport').value)||0,activities:Number(document.getElementById('trip_activities').value)||0,other:Number(document.getElementById('trip_other').value)||0},actualCost:actual,notes:document.getElementById('tripNotes').value.trim()});
  syncTripFundTransaction(t); saveState(); renderAll(); closeModal('tripModal'); document.getElementById('tripForm').reset(); if(t.status==='realizada'&&old.status!=='realizada'&&countryCode&&!state.visitedCountries?.[countryCode]?.visited) openCountrySuggestion(countryCode); showToast(isNewTrip?'Viagem criada.':'Viagem atualizada.'); return true;
}

function renderGoals(){const grid=document.getElementById('goalGrid');grid.innerHTML=state.goals.map(g=>{const progress=clamp(g.current/g.target*100,0,100);const rem=Math.max(0,g.target-g.current);const months=g.monthly>0?Math.ceil(rem/g.monthly):null;const fast200=g.monthly>=200?Math.ceil(rem/g.monthly):Math.ceil(rem/200);return `<div class="goal-card"><div class="goal-head"><div><span class="panel-kicker">${goalIconMarkup(g)} MISSÃO</span><h3>${escapeHtml(g.name)}</h3></div><span class="goal-priority">${g.priority}</span></div><div class="goal-value">${currency(g.current)} / ${currency(g.target)}</div><div class="goal-note">Faltam ${currency(rem)}</div><div class="mission-progress"><span style="width:${progress}%"></span></div><div class="goal-note">${Math.round(progress)}% concluído</div><div class="projection">Com ${currency(g.monthly)}/mês: <strong>${months?`~${months} meses`:'sem previsão'}</strong></div><div class="goal-actions"><button class="secondary-button goal-fast" data-id="${g.id}">${iconSvg('i-chart')} Chegar mais rápido</button><button class="text-button goal-delete" data-id="${g.id}">Excluir</button></div><div class="goal-note">Com €200/mês: ~${fast200} meses.</div></div>`}).join('');document.querySelectorAll('.goal-delete').forEach(b=>b.addEventListener('click',()=>{state.goals=state.goals.filter(g=>g.id!==b.dataset.id);saveState();renderGoals();renderDashboard();showToast('Objetivo removido.');}));document.querySelectorAll('.goal-fast').forEach(b=>b.addEventListener('click',()=>{const g=state.goals.find(x=>x.id===b.dataset.id);if(!g)return;const rem=Math.max(0,g.target-g.current);const m100=g.monthly>0?Math.ceil(rem/g.monthly):Infinity;const m200=Math.ceil(rem/200);const m300=Math.ceil(rem/300);alert(`${g.name}\n\nCom ${currency(g.monthly)}/mês: ${m100===Infinity?'sem previsão':m100+' meses'}\nCom €200/mês: ${m200} meses\nCom €300/mês: ${m300} meses`);}));}

function bindSimulator(){['simSalary','simRaise','simBonus','simTravel','simHouse','simBrazil'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{syncSimulatorState();renderSimulator();}));document.querySelectorAll('.scenario').forEach(b=>b.addEventListener('click',()=>{state.simulator.scenario=b.dataset.scenario;saveState();document.querySelectorAll('.scenario').forEach(x=>x.classList.toggle('active',x===b));renderSimulator();}));}
function syncSimulatorState(){state.simulator.salary=Number(document.getElementById('simSalary').value);state.simulator.raise=Number(document.getElementById('simRaise').value);state.simulator.bonus=Number(document.getElementById('simBonus').value);state.simulator.travel=Number(document.getElementById('simTravel').value);state.simulator.house=Number(document.getElementById('simHouse').value);state.simulator.brazil=Number(document.getElementById('simBrazil').value);saveState();}
function renderSimulator(){const s=state.simulator;const controls={simSalary:s.salary,simRaise:s.raise,simBonus:s.bonus,simTravel:s.travel,simHouse:s.house,simBrazil:s.brazil};for(const[id,v]of Object.entries(controls)){const el=document.getElementById(id);if(el)el.value=v;}document.getElementById('simSalaryValue').textContent=currency(s.salary);document.getElementById('simRaiseValue').textContent=pct(s.raise);document.getElementById('simBonusValue').textContent=currency(s.bonus);document.getElementById('simTravelValue').textContent=currency(s.travel);document.getElementById('simHouseValue').textContent=currency(s.house);document.getElementById('simBrazilValue').textContent=currency(s.brazil);const scenario=s.scenario;document.querySelectorAll('.scenario').forEach(x=>x.classList.toggle('active',x.dataset.scenario===scenario));const result=projectScenario(scenario);document.getElementById('scenarioCopy').innerHTML=`<strong>${result.title}</strong><br>${result.copy}`;document.getElementById('projectionGrid').innerHTML=result.points.map(p=>`<div class="projection-item"><span>${p.year} ano</span><strong>${currency(p.value)}</strong></div>`).join('');updateProjectionChart(result);renderTravelScenarios();}
function projectScenario(scenario){let salary=state.simulator.salary;let raise=state.simulator.raise/100;let travel=state.simulator.travel;let house=state.simulator.house;let brazil=state.simulator.brazil;let bonus=state.simulator.bonus; if(scenario==='conservative'){raise=0;bonus=0;} if(scenario==='base'){raise=Math.max(raise,.05);bonus=0;} if(scenario==='optimistic'){raise=Math.max(raise,.10);bonus=Math.max(bonus,1000);house+=50;brazil+=50;}const monthlyBase=Math.max(0,salary-(plannedExpenses()-state.budgetDefaults.Viagens + travel)-(plannedSavings()-state.budgetDefaults.Casa-state.budgetDefaults.Brasil+house+brazil));const annualAccum=Math.max(0,monthlyBase+house+brazil)*12+bonus;let values=[];let total=calculateNetWorth();for(let y=1;y<=10;y++){if(y===2) salary*=1+raise; total+=annualAccum*Math.pow(1+Math.min(raise,.15),Math.max(0,y-1));values.push({year:y,value:Math.round(total)});}const title=scenario==='conservative'?'Cenário conservador':scenario==='optimistic'?'Cenário otimista':'Cenário base';const copy=scenario==='conservative'?'Sem contar com aumento ou bônus, para você enxergar o piso.':scenario==='optimistic'?'Aumento maior, bônus e aportes um pouco mais fortes — um teto plausível para comparar.':'Uma projeção equilibrada, incluindo uma revisão salarial em janeiro de 2027.';return{title,copy,points:values};}
function updateProjectionChart(r){if(!window.Chart)return;const ctx=document.getElementById('projectionChart').getContext('2d');charts.projection?.destroy();charts.projection=new Chart(ctx,{type:'line',data:{labels:r.points.map(p=>`${p.year} ano`),datasets:[{label:'Patrimônio estimado',data:r.points.map(p=>p.value),tension:.3,fill:true}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:false,ticks:{callback:v=>`€${v}`}}}}});}
function renderTravelScenarios(){const amounts=[150,250,300,400,500];const currentHouse=state.goals.find(g=>g.id==='g2')?.current||0;const target=state.goals.find(g=>g.id==='g2')?.target||15000;const b=getBudget();const fixedSavings=(b.Casa||100)+(b.Brasil||100)+(b.Emergência||100);document.getElementById('travelScenarios').innerHTML=amounts.map(a=>{const available=Math.max(0,state.profile.netMonthly-plannedExpenses()+((b.Viagens||250)-a)-fixedSavings);const monthlyHouse=Math.max(50,available*.1);const months=Math.ceil(Math.max(0,target-currentHouse)/monthlyHouse);return `<div class="travel-scenario"><strong>${currency(a)}/mês</strong><span>Casa em ~${months} meses</span><span>${a===250?'Plano atual':''}</span></div>`}).join('');}

function renderSalary(){
  fillSalaryForm();
  document.getElementById('salaryGrossView').textContent=currency2(state.profile.grossMonthly);
  document.getElementById('salarySSView').textContent=currency2(state.profile.socialSecurity);
  document.getElementById('salaryIRPFView').textContent=currency2(state.profile.irpf);
  document.getElementById('salaryOtherView').textContent=currency2(state.profile.otherDeductions);
  const net=Math.max(0,state.profile.grossMonthly-state.profile.socialSecurity-state.profile.irpf-state.profile.otherDeductions);
  document.getElementById('salaryNetView').textContent=currency2(state.profile.netMonthly||net);
  const plan=state.salaryPlan||initialState.salaryPlan;
  document.getElementById('salaryPlanFrom').value=plan.effectiveFrom||'2027-01';
  document.getElementById('salaryPlanNet').value=Number(plan.netMonthly ?? state.profile.netMonthly);
  setupSalaryHistoryYear();
  renderSalaryRecords();
  updateSalaryChart();
}
function fillSalaryForm(){const p=state.profile;const vals={salaryGrossAnnual:p.grossAnnual,salaryGrossMonthly:p.grossMonthly,salarySS:p.socialSecurity,salaryIRPF:p.irpf,salaryOther:p.otherDeductions};Object.entries(vals).forEach(([id,v])=>document.getElementById(id).value=v);}
function saveSalary(){state.profile.grossAnnual=Number(document.getElementById('salaryGrossAnnual').value)||0;state.profile.grossMonthly=Number(document.getElementById('salaryGrossMonthly').value)||0;state.profile.socialSecurity=Number(document.getElementById('salarySS').value)||0;state.profile.irpf=Number(document.getElementById('salaryIRPF').value)||0;state.profile.otherDeductions=Number(document.getElementById('salaryOther').value)||0;const calc=Math.max(0,state.profile.grossMonthly-state.profile.socialSecurity-state.profile.irpf-state.profile.otherDeductions);if(calc>0)state.profile.netMonthly=calc;saveState();renderAll();showToast('Salário padrão atualizado.');}
function upsertSalaryRecord(record){const idx=state.salaryRecords.findIndex(r=>r.id===record.id);if(idx>=0)state.salaryRecords[idx]=record;else{const existing=state.salaryRecords.findIndex(r=>r.month===record.month);if(existing>=0)state.salaryRecords[existing]=record;else state.salaryRecords.push(record);}saveState();renderAll();}
function calculateNetFromRecord(){const gross=Number(document.getElementById('payGross').value)||0,ss=Number(document.getElementById('paySS').value)||0,irpf=Number(document.getElementById('payIRPF').value)||0,other=Number(document.getElementById('payOther').value)||0;const calc=Math.max(0,gross-ss-irpf-other);document.getElementById('payNetCalculated').textContent=currency2(calc);const manual=document.getElementById('payNetReceived');if(!manual.dataset.manual) manual.value=calc?calc:'';}
function openSalaryRecordModal(id=null,forcedMonth=null){const r=id?state.salaryRecords.find(x=>x.id===id):state.salaryRecords.find(x=>x.month===(forcedMonth||monthKey()));document.getElementById('salaryRecordId').value=r?.id||'';document.getElementById('payMonth').value=r?.month||forcedMonth||monthKey();document.getElementById('payGross').value=r?.gross??state.profile.grossMonthly??'';document.getElementById('paySS').value=r?.socialSecurity??state.profile.socialSecurity??0;document.getElementById('payIRPF').value=r?.irpf??state.profile.irpf??0;document.getElementById('payOther').value=r?.otherDeductions??state.profile.otherDeductions??0;document.getElementById('payNetReceived').value=r?.netReceived??'';document.getElementById('payNetReceived').dataset.manual=r?.netReceived!=null?'1':'';document.getElementById('payPaymentDate').value=r?.paymentDate||'';document.getElementById('payStatus').value=r?.status||'received';document.getElementById('payExtraIncome').value=r?.extraIncome??0;document.getElementById('payNotes').value=r?.notes||'';document.getElementById('salaryRecordTitle').textContent=id?'Editar nómina':'Registrar nómina';calculateNetFromRecord();openModal('salaryRecordModal');}
function saveSalaryRecord(e){e.preventDefault();const id=document.getElementById('salaryRecordId').value||cryptoRandom();const month=document.getElementById('payMonth').value;if(!/^\d{4}-\d{2}$/.test(month)){showToast('Escolha um mês válido.');return;}const gross=Math.max(0,Number(document.getElementById('payGross').value)||0),ss=Math.max(0,Number(document.getElementById('paySS').value)||0),irpf=Math.max(0,Number(document.getElementById('payIRPF').value)||0),other=Math.max(0,Number(document.getElementById('payOther').value)||0);const calculated=Math.max(0,gross-ss-irpf-other);let net=Number(document.getElementById('payNetReceived').value);if(!Number.isFinite(net)||net<0)net=calculated;const status=document.getElementById('payStatus').value;const record={id,month,gross,socialSecurity:ss,irpf,otherDeductions:other,netPlanned:plannedIncome(month),netReceived:Math.max(0,net),paymentDate:document.getElementById('payPaymentDate').value, status, extraIncome:Math.max(0,Number(document.getElementById('payExtraIncome').value)||0),notes:document.getElementById('payNotes').value.trim()};if(status==='received' && record.netReceived===0 && calculated>0)record.netReceived=calculated;upsertSalaryRecord(record);closeModal('salaryRecordModal');showToast(`Nómina de ${monthLabel(month)} salva.`);document.getElementById('salaryRecordForm').reset();}
function editSalaryRecord(id){openSalaryRecordModal(id);}
function deleteSalaryRecord(id){const r=state.salaryRecords.find(x=>x.id===id);if(!r)return;if(!confirm(`Excluir a nómina de ${monthLabel(r.month)}?`))return;state.salaryRecords=state.salaryRecords.filter(x=>x.id!==id);saveState();renderAll();showToast('Nómina excluída.');}
function saveSalaryPlan(){const from=document.getElementById('salaryPlanFrom').value;const net=Math.max(0,Number(document.getElementById('salaryPlanNet').value)||0);if(!/^\d{4}-\d{2}$/.test(from)){showToast('Escolha um mês válido.');return;}state.salaryPlan={effectiveFrom:from,netMonthly:net};saveState();renderAll();showToast(`Plano salarial atualizado a partir de ${monthLabel(from)}.`);}
function renderSalaryRecords(){
  const list=document.getElementById('salaryRecordsList'), rows=[...state.salaryRecords].sort((a,b)=>b.month.localeCompare(a.month));
  const selectedYear=Number(document.getElementById('salaryHistoryYear')?.value)||new Date().getFullYear();
  const registered=new Map(rows.map(r=>[r.month,r]));
  for(let m=new Date().getMonth()+1;m<=12;m++){const key=`${selectedYear}-${String(m).padStart(2,'0')}`;if(key>=monthKey()&&!registered.has(key)){registered.set(key,{month:key,_plannedOnly:true,netPlanned:plannedIncome(key),status:'planned'});}}
  const visible=[...registered.values()].filter(r=>r.month.startsWith(`${selectedYear}-`)).sort((a,b)=>a.month.localeCompare(b.month));
  if(!visible.length){list.innerHTML=`<div class=\"empty-state\"><strong>Nenhuma nómina disponível em ${selectedYear}.</strong><span>Use “Registrar nómina” quando receber seu salário.</span></div>`;return;}
  list.innerHTML=visible.map(r=>{
    const isRegistered=!r._plannedOnly;
    const diff=Number(r.netReceived||0)-Number(r.netPlanned||0);
    const hasReceived=r.status==='received'||r.status==='partial';
    const cls=r.status==='received'?(diff>0.009?'above':diff<-0.009?'below':'equal'):'pending';
    const statusLabel={received:'Recebido',partial:'Parcial',planned:'Previsto',not_received:'Não recebido'}[r.status]||'Previsto';
    const statusClass=r.status==='received'?'good':r.status==='partial'?'warn':r.status==='not_received'?'bad':'info';
    const received=hasReceived?currency2(Number(r.netReceived||0)+Number(r.extraIncome||0)):'—';
    return `<div class=\"salary-record\"><div><div class=\"salary-record-title\"><strong>${monthLabel(r.month)}</strong><span class=\"status-pill ${statusClass}\">${statusLabel}</span></div><div class=\"salary-record-meta\">Planejado ${currency2(r.netPlanned)} · Recebido ${received}</div></div><div class=\"salary-record-diff ${cls}\">${hasReceived?`${diff>=0?'+':''}${currency2(diff)}`:'—'}</div><div class=\"salary-record-actions\"><button class=\"text-button\" onclick=\"${isRegistered?`editSalaryRecord('${r.id}')`:`openSalaryRecordModal(null,'${r.month}')`}\">${isRegistered?'Editar':'Registrar'}</button>${isRegistered?`<button class=\"text-button danger-text\" onclick=\"deleteSalaryRecord('${r.id}')\">Excluir</button>`:''}</div></div>`;
  }).join('');
}
function updateSalaryChart(){if(!window.Chart||!document.getElementById('salaryChart'))return;const year=Number(document.getElementById('salaryHistoryYear')?.value)||new Date().getFullYear();const rows=[...state.salaryRecords].filter(r=>r.month.startsWith(`${year}-`)).sort((a,b)=>a.month.localeCompare(b.month));const labels=rows.length?rows.map(r=>monthShort[Number(r.month.slice(5))-1]):monthShort;const planned=rows.length?rows.map(r=>r.netPlanned):[];const received=rows.length?rows.map(r=>['received','partial'].includes(r.status)?Number(r.netReceived||0)+Number(r.extraIncome||0):null):[];charts.salary?.destroy();charts.salary=new Chart(document.getElementById('salaryChart').getContext('2d'),{type:'line',data:{labels,datasets:[{label:'Planejado',data:planned,tension:.25,borderWidth:2},{label:'Recebido',data:received,tension:.25,borderWidth:2}]},options:{responsive:true,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:false,ticks:{callback:v=>`€${v}`}}}}});}
function compareSalary(){const n=Number(document.getElementById('newSalaryInput').value);if(!n){document.getElementById('salaryCompareResult').innerHTML='';return;}const base=plannedIncome(financeSelectedMonth);const diff=n-base;const annual=diff*12;document.getElementById('salaryCompareResult').innerHTML=`<div class="result-card ${diff>=0?'good':'warn'}" style="margin-top:10px"><strong>Novo salário: ${currency(n)}</strong><p>Variação mensal: ${currency(diff)} · Variação anual: ${currency(annual)}.</p><p style="margin-top:6px">Sugestão: mande primeiro o aumento para uma meta importante e só depois aumente seu padrão de vida.</p></div>`;}

function fillSettingsForm(){const p=state.profile;document.getElementById('settingsName').value=p.name;document.getElementById('settingsLocation').value=p.location;document.getElementById('settingsNetSalary').value=p.netMonthly;document.getElementById('settingsFx').value=p.fxEurBrl;}
function saveSettings(){state.profile.name=document.getElementById('settingsName').value.trim()||'Gustavo Almeida';state.profile.location=document.getElementById('settingsLocation').value.trim();state.profile.netMonthly=Number(document.getElementById('settingsNetSalary').value)||0;state.profile.fxEurBrl=Number(document.getElementById('settingsFx').value)||state.profile.fxEurBrl;saveState();renderAll();showToast('Configurações salvas.');}

function bindGlobalButtons(){document.getElementById('quickExpenseTop').addEventListener('click',()=>openExpenseModal());document.getElementById('addExpenseBtn').addEventListener('click',()=>openExpenseModal());document.getElementById('spendCheckBtn').addEventListener('click',()=>openModal('spendModal'));document.getElementById('addTripBtn').addEventListener('click',()=>openModal('tripModal'));document.getElementById('addGoalBtn').addEventListener('click',()=>openModal('goalModal'));document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));document.getElementById('startHubBtn').addEventListener('click',()=>finishOnboarding());document.getElementById('keepDefaultsBtn').addEventListener('click',()=>finishOnboarding());document.querySelectorAll('[data-quick-category]').forEach(b=>b.addEventListener('click',()=>openExpenseModal(b.dataset.quickCategory)));document.getElementById('saveSalaryBtn').addEventListener('click',saveSalary);document.getElementById('registerSalaryBtn').addEventListener('click',()=>openSalaryRecordModal());document.getElementById('salaryRecordForm').addEventListener('submit',saveSalaryRecord);['payGross','paySS','payIRPF','payOther'].forEach(id=>document.getElementById(id).addEventListener('input',calculateNetFromRecord));document.getElementById('payNetReceived').addEventListener('input',e=>e.target.dataset.manual='1');document.getElementById('saveSalaryPlanBtn').addEventListener('click',saveSalaryPlan);document.getElementById('salaryHistoryYear').addEventListener('change',()=>{renderSalaryRecords();updateSalaryChart();});document.getElementById('quickSalaryTop').addEventListener('click',()=>goTo('salary'));
document.getElementById('compareSalaryBtn').addEventListener('click',compareSalary);document.getElementById('countryForm').addEventListener('submit',saveVisitedCountryFromForm);document.getElementById('countryUnmarkBtn').addEventListener('click',unmarkCountry);document.getElementById('countrySuggestionYes').addEventListener('click',acceptCountrySuggestion);document.getElementById('countrySuggestionNo').addEventListener('click',()=>{suggestedCountryCode='';closeModal('countrySuggestionModal');});document.getElementById('addCommitmentBtn').addEventListener('click',()=>openCommitmentModal()); document.getElementById('commitmentForm').addEventListener('submit',saveCommitmentFromForm); document.getElementById('commitmentFilter').addEventListener('change',renderCommitments); document.getElementById('commitmentMonthSelect').addEventListener('change',renderCommitments); document.getElementById('saveCommitmentPaymentBtn').addEventListener('click',saveCommitmentPayment); document.getElementById('commitmentInstallmentEnabled').addEventListener('change',()=>document.getElementById('commitmentInstallmentFields').classList.toggle('hidden',!document.getElementById('commitmentInstallmentEnabled').checked));
  document.getElementById('saveSettingsBtn').addEventListener('click',saveSettings);document.getElementById('exportBtn').addEventListener('click',exportData);document.getElementById('importInput').addEventListener('change',importData);document.getElementById('resetBtn').addEventListener('click',resetData);document.getElementById('analyzeSpendBtn').addEventListener('click',analyzeSpend);document.getElementById('expenseForm').addEventListener('submit',e=>{e.preventDefault();addExpense(document.getElementById('expenseAmount').value,document.getElementById('expenseCategory').value,document.getElementById('expenseDate').value,document.getElementById('expenseDescription').value);closeModal('expenseModal');e.target.reset();document.getElementById('expenseDate').value=todayISO();});document.getElementById('tripForm').addEventListener('submit',e=>{e.preventDefault();saveTripFromForm();});document.querySelectorAll('[data-trip-filter]').forEach(b=>b.addEventListener('click',()=>{window.tripFilter=b.dataset.tripFilter;renderTrips();}));document.getElementById('tripYearSelect').addEventListener('change',()=>renderTrips());document.getElementById('saveTravelYearConfigBtn').addEventListener('click',()=>setTravelYearConfig(Number(document.getElementById('tripYearSelect').value),document.getElementById('tripYearBudgetInput').value,document.getElementById('tripYearGoalInput').value));['trip_transport','trip_accommodation','trip_food','trip_localTransport','trip_activities','trip_other','tripStart','tripEnd'].forEach(id=>document.getElementById(id).addEventListener('input',updateTripEstimatedTotal));document.getElementById('goalForm').addEventListener('submit',e=>{e.preventDefault();const g={id:cryptoRandom(),name:document.getElementById('goalName').value,target:Number(document.getElementById('goalTarget').value),current:Number(document.getElementById('goalCurrent').value)||0,monthly:Number(document.getElementById('goalMonthly').value)||0,months:Number(document.getElementById('goalMonths').value)||12,priority:document.getElementById('goalPriority').value,icon:'i-target'};state.goals.push(g);saveState();renderAll();closeModal('goalModal');e.target.reset();showToast('Objetivo criado.');});}
function bindForms(){document.getElementById('expenseDate').value=todayISO();}
function openExpenseModal(category){document.getElementById('expenseDate').value=todayISO();if(category)document.getElementById('expenseCategory').value=category;openModal('expenseModal');document.getElementById('expenseAmount').focus();}
function openModal(id){document.getElementById(id).classList.remove('hidden');}
function closeModal(id){document.getElementById(id).classList.add('hidden');}
function finishOnboarding(){state.onboardingDone=true;saveState();closeModal('onboardingModal');showToast('Pronto. Seu painel está configurado.');}

function analyzeSpend(){const amount=Number(document.getElementById('spendAmount').value)||0;const remaining=actualRemainingSpendable();const free=plannedFree();const result=document.getElementById('spendResult');if(amount<=0){result.innerHTML='';return;}let cls='good',title='SIM',text='Você pode fazer esse gasto sem comprometer suas metas deste mês.';if(amount>remaining+0.01){cls='bad';title='EU EVITARIA';text=`Esse gasto ultrapassaria em ${currency(amount-remaining)} o que ainda está livre nas categorias de gasto.`;}else if(amount>remaining*.25 || amount>Math.max(0,free)*.5){cls='warn';title='CUIDADO';text=`Você pode fazer esse gasto, mas ficará com pouca margem. Restariam cerca de ${currency(Math.max(0,remaining-amount))} para o restante do mês.`;}result.innerHTML=`<div class="result-card ${cls}"><h3>${title}</h3><p>${text}</p><p style="margin-top:8px"><strong>Motivo:</strong> ainda há ${currency(remaining)} em categorias de gasto e ${currency(free)} de capital livre planejado.</p></div>`;}

function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`gfh-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href);showToast('Backup exportado.');}
function importData(e){const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const incoming=JSON.parse(reader.result);if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))throw new Error('backup-shape');const validArray=(value)=>value===undefined||Array.isArray(value);const validObject=(value)=>value===undefined||(value&&typeof value==='object'&&!Array.isArray(value));const requiredArrays=['transactions','goals','trips','salaryRecords','commitments'];const requiredObjects=['profile','simulator','salaryPlan','visitedCountries','travelSettings','budgetDefaults'];if(!requiredArrays.every(k=>validArray(incoming[k]))||!requiredObjects.every(k=>validObject(incoming[k])))throw new Error('backup-structure');const base=clone(initialState);const incomingProfile=validObject(incoming.profile)?incoming.profile:{};const incomingSimulator=validObject(incoming.simulator)?incoming.simulator:{};const incomingSalaryPlan=validObject(incoming.salaryPlan)?incoming.salaryPlan:{};const incomingTravelSettings=validObject(incoming.travelSettings)?incoming.travelSettings:{};const incomingAnnualBudget=validObject(incomingTravelSettings.annualBudget)?incomingTravelSettings.annualBudget:{};const incomingAnnualTripGoal=validObject(incomingTravelSettings.annualTripGoal)?incomingTravelSettings.annualTripGoal:{};state={...base,...incoming,profile:{...base.profile,...incomingProfile},simulator:{...base.simulator,...incomingSimulator},salaryPlan:{...base.salaryPlan,...incomingSalaryPlan},budgetCategories:Array.isArray(incoming.budgetCategories)?incoming.budgetCategories.map(normalizeBudgetCategory):clone(base.budgetCategories),salaryRecords:Array.isArray(incoming.salaryRecords)?incoming.salaryRecords:base.salaryRecords,monthlyAllocations:Array.isArray(incoming.monthlyAllocations)?incoming.monthlyAllocations.map(normalizeMonthlyAllocation):base.monthlyAllocations,monthlyAllocationOverrides:validObject(incoming.monthlyAllocationOverrides)?incoming.monthlyAllocationOverrides:base.monthlyAllocationOverrides,commitments:Array.isArray(incoming.commitments)?incoming.commitments.map(normalizeCommitment):base.commitments,visitedCountries:validObject(incoming.visitedCountries)?incoming.visitedCountries:base.visitedCountries,travelSettings:{...base.travelSettings,...incomingTravelSettings,annualBudget:{...base.travelSettings.annualBudget,...incomingAnnualBudget},annualTripGoal:{...base.travelSettings.annualTripGoal,...incomingAnnualTripGoal}},trips:Array.isArray(incoming.trips)?incoming.trips.map(normalizeTrip):base.trips};if(!Array.isArray(state.transactions)||!Array.isArray(state.goals))throw new Error('backup-normalization');saveState();renderAll();showToast('Backup importado.');}catch{showToast('Não consegui restaurar esse backup. Seus dados atuais continuam intactos.');}e.target.value='';};reader.readAsText(file);}
function resetData(){if(!confirm('Restaurar a configuração inicial? Seus dados locais atuais serão apagados.'))return;state=clone(initialState);saveState();location.reload();}
function cryptoRandom(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

init();
