"use strict";
const fs=require("fs");
const path=require("path");
const assert=require("assert");
const crypto=require("crypto");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const map=fs.readFileSync(path.join(root,"world-map-data.js"));
const prev=fs.readFileSync("/mnt/data/gfh-patch-current/world-map-data.js");

// Country modal status icon must have a hard maximum, not merely a preferred size.
assert.ok(/\.status-line-icon\s*\{[\s\S]*?width:\s*18px\s*!important[\s\S]*?height:\s*18px\s*!important[\s\S]*?max-width:\s*18px\s*!important[\s\S]*?max-height:\s*18px\s*!important/.test(css));
assert.ok(/\.country-modal-status \.result-card strong\s*\{[\s\S]*?display:\s*inline-flex/.test(css));
console.log("STATUS_ICON_BOUNDS_PASS");

// Every map country group receives a real click handler, while drag suppression stays centralized.
assert.ok(/world-country-point[^\n]*data-country-id/.test(app) || /world-country-point/.test(app));
assert.ok(/el\.addEventListener\('click',\(\)=>\{const code=el\.dataset\.countryId;focusCountry\(code\);setTimeout\(\(\)=>openCountryModal\(code\),220\);\}\)/.test(app));
assert.ok(/if\(Math\.hypot\(d\.clientX-worldMapView\.dragStart\.x,d\.clientY-worldMapView\.dragStart\.y\)>5\)/.test(app));
assert.ok(/viewport\.setPointerCapture\?\.\(e\.pointerId\)/.test(app));
console.log("MAP_CLICK_DRAG_SEPARATION_PASS");

// Micro-country hit areas remain invisible but interactive.
assert.ok(/world-country-hit/.test(app)&&/fill: transparent !important/.test(css)&&/pointer-events: all/.test(css));
console.log("MICRO_COUNTRY_HIT_AREA_PASS");

// Search results remain immediately under search input in the markup.
const searchPos=html.indexOf('id="countrySearchInput"');
const resultPos=html.indexOf('id="countrySearchResults"');
const mapPos=html.indexOf('id="worldMap"');
assert.ok(searchPos>=0&&resultPos>searchPos&&resultPos<mapPos);
console.log("COUNTRY_SEARCH_ORDER_PASS");

// Approved flags and airplane remain untouched relative to current input version.
assert.ok(fs.existsSync(path.join(root,"icons/flags-atlas.png")));
const plane=html.match(/<symbol id="i-plane"[\s\S]*?<\/symbol>/)[0];
const prevHtml=fs.readFileSync('/mnt/data/gfh-patch-current/index.html','utf8');
const prevPlane=prevHtml.match(/<symbol id="i-plane"[\s\S]*?<\/symbol>/)[0];
const geom=x=>x.replace(/^<symbol[^>]*>/,'').replace(/<\/symbol>$/,'').replace(/\s+/g,' ').trim();
assert.strictEqual(crypto.createHash('sha256').update(geom(plane)).digest('hex'),crypto.createHash('sha256').update(geom(prevPlane)).digest('hex'));
console.log("AIRPLANE_PRESERVED_PASS");
assert.strictEqual(crypto.createHash('sha256').update(map).digest('hex'),crypto.createHash('sha256').update(prev).digest('hex'));
console.log("MAP_BYTE_IDENTITY_PASS");

// No version badge should have been introduced.
assert.ok(!/Gustavo Financial Hub v\d/i.test(html));
console.log("VERSION_UI_CLEAN_PASS");
console.log("FINAL_ICON_MAP_PATCH_TESTS_PASSED");
