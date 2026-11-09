/* Report pages: dashboard, list, submit, detail, actions, notifications, map */
function dash(){if(!guard())return;if(ME.role==='brgy')return brgyDash();const R=visible(ME),c=counts(R);let h='';
 if(ME.role==='res'){
  h=`${resBanner()}<header class="dash-header"><div><p class="eyebrow">Resident dashboard</p><h2>Welcome, ${esc(ME.name)}</h2><p class="dash-description">Check your reports or start a new one.</p></div><nav class="dash-actions" aria-label="Quick actions"><a class="btn" href="#/new">Report a Problem</a><a class="btn o" href="#/reports">My Reports</a><a class="btn o" href="#/track">Track a Report</a></nav></header>
  <section class="dash-section" aria-labelledby="dash-overview-title"><div class="section-heading"><h3 id="dash-overview-title">Your report overview</h3></div><div class="grid dash-kpis">${[['Total reports',R.length],['Awaiting review',c.SUBMITTED+c['UNDER REVIEW']],['In progress',c['IN PROGRESS']+c.ASSIGNED+c.VERIFIED],['Resolved',c.RESOLVED]].map(x=>`<div class="card stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join('')}</div></section>
  <section class="dash-section" aria-labelledby="dash-recent-title"><div class="section-heading"><div><h3 id="dash-recent-title">Recent reports</h3><p class="mu">Your five most recent submissions.</p></div><a class="text-link" href="#/reports">View all reports</a></div>${tbl(R.slice(-5).reverse())}</section>`;
 }else{
  const t=ME.role==='admin'?'Citywide dashboard':ME.role==='brgy'?'Barangay '+bname(ME.brgy):'City Official – '+dname(ME.dept),review=c.SUBMITTED+c['UNDER REVIEW'],progress=c.VERIFIED+c.ASSIGNED+c['IN PROGRESS'];
  h=`<header class="dash-header"><div><p class="eyebrow">${ROLE[ME.role]}</p><h2>${esc(t)}</h2><p class="dash-description">A clear view of reports that need attention and current progress.</p></div><nav class="dash-actions" aria-label="Dashboard actions"><a class="btn" href="#/reports">View reports</a></nav></header>
  <section class="dash-section" aria-labelledby="dash-overview-title"><div class="section-heading"><div><h3 id="dash-overview-title">Report overview</h3><p class="mu">Current totals for the reports you manage.</p></div>${ME.role==='admin'?`<p class="dash-context">Residents <b>${S.users.filter(u=>u.role==='res').length}</b><span aria-hidden="true"> · </span>Officials <b>${S.users.filter(u=>u.role==='brgy'||u.role==='city').length}</b></p>`:''}</div><div class="grid dash-kpis">${[['Total reports',R.length],['Awaiting review',review],['In progress',progress],['Resolved',c.RESOLVED]].map(x=>`<div class="card stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join('')}</div></section>
  <section class="dash-section" aria-labelledby="dash-insights-title"><div class="section-heading"><div><h3 id="dash-insights-title">Report insights</h3><p class="mu">Compare reports by category and current status.</p></div></div><div class="dash-columns"><section class="dash-panel"><h4>By category</h4>${barChart(group(R,r=>r.cat),'Reports by category')}</section><section class="dash-panel"><h4>By status</h4>${donutChart(group(R,r=>r.status),'Reports by status',statusColor)}</section></div></section>
  ${ME.role==='admin'?`<section class="dash-section" aria-labelledby="dash-barangay-title"><div class="section-heading"><div><h3 id="dash-barangay-title">Reports by barangay</h3><p class="mu">Compare report volume across the city.</p></div></div><div class="dash-panel">${barChart(group(R,r=>bname(r.brgy)),'Reports by barangay')}</div></section>`:''}
  <section class="dash-section" aria-labelledby="dash-attention-title"><div class="section-heading"><div><h3 id="dash-attention-title">Needs attention</h3><p class="mu">Reports awaiting official review.</p></div></div>${tbl(R.filter(r=>['SUBMITTED','UNDER REVIEW'].includes(r.status)).slice(0,5))}</section>`;
 }
 $('app').innerHTML=h}
let F={q:'',s:'',c:'',b:''};
function reports(){if(!guard())return;const R=visible(ME);
 const f=x=>R.filter(r=>(!F.s||r.status===F.s)&&(!F.c||r.cat===F.c)&&(!F.b||r.brgy==F.b)&&(!F.q||(r.code+r.desc).toLowerCase().includes(F.q.toLowerCase())));
 $('app').innerHTML=`<h2>${ME.role==='res'?'My Reports':'Reports'}</h2>
 <div class="card row"><input id="fq" placeholder="Search ID / text" value="${esc(F.q)}"><select id="fs"><option value="">All statuses</option>${STAT.map(s=>`<option ${F.s===s?'selected':''}>${s}</option>`).join('')}</select><select id="fc"><option value="">All categories</option>${CATS.map(s=>`<option ${F.c===s?'selected':''}>${s}</option>`).join('')}</select>${ME.role==='admin'?`<select id="fb"><option value="">All barangays</option>${S.barangays.map(b=>`<option value="${b.id}" ${F.b==b.id?'selected':''}>${esc(b.name)}</option>`).join('')}</select>`:''}<button class="btn" onclick="applyF()">Filter</button></div>${tbl(f(),staff())}`}
function applyF(){F.q=$('fq').value;F.s=$('fs').value;F.c=$('fc').value;F.b=$('fb')?$('fb').value:'';reports()}
function newRep(){if(!guard(['res']))return;PH='';if(ME.vstatus!=='approved'){$('app').innerHTML='<h2>Report a Problem</h2>'+resBanner();return}
 $('app').innerHTML=`<div class="card"><h2>Report a Problem</h2><label>Category</label><select id="nc">${CATS.map(c=>`<option>${c}</option>`).join('')}</select><label>Description</label><textarea id="nd" rows="4"></textarea>
 <label>Photo (JPG/PNG/WEBP, max 5MB)</label><input id="nf" type="file" accept="image/*" onchange="prev('nf','npv')"><div id="npv"></div>
 <label>Barangay</label><select id="nb" onchange="brgyPicked()"><option value="">Select barangay…</option>${allowedBarangays().map(b=>`<option value="${b.id}" ${b.id===ME.brgy?'selected':''}>${esc(b.name)}</option>`).join('')}</select>
 <label>Location description</label><div class="row"><input id="nl" placeholder="e.g. Near main road, Brgy Pag-asa"><button class="btn o" onclick="geocodeAddress()" style="margin-left:6px">Geocode</button></div><div class="row"><div><label>Latitude</label><input id="nla" type="number" step="any"></div><div><label>Longitude</label><input id="nlo" type="number" step="any"></div></div>
 <button class="btn o" onclick="useGeo()">Use my current location</button> <button class="btn o" onclick="useBrgy()">Use barangay center</button>
 <p class="mu">Tap or click the map to choose the report location.</p><div id="pick" class="location-picker" role="region" aria-label="Choose report location on map"></div><p id="pick-msg" class="note" role="status" hidden>The map could not be loaded. Check your internet connection, or type the latitude and longitude above, or press "Use barangay center".</p>
 <p id="nm" class="err"></p><button class="btn g" onclick="subRep()">Submit Report</button></div>`;drawPick();brgyPicked()}
const TILE_URL='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
let pickMapInstance=null,pickMarker=null,reportMap=null;
let peopleMapInstance=null,peopleMarkers=null,peopleMapData=null,peopleMapRequest=0;
function addBaseLayer(map){return L.tileLayer(TILE_URL,{maxZoom:19,attribution:TILE_ATTRIBUTION}).addTo(map)}
function drawPick(){
 const el=$('pick');if(pickMapInstance)pickMapInstance.remove();pickMarker=null;
 if(!window.L||!el)return;
 if(!el.clientWidth||!el.clientHeight){requestAnimationFrame(drawPick);return;}
 const selBrgy=$('nb')?$('nb').value:null;
 const centerBrgy=selBrgy?S.barangays.find(b=>b.id==selBrgy):null;
 const defaultCenter=[(BB[0]+BB[1])/2,(BB[2]+BB[3])/2];
 const startCenter=centerBrgy?[Number(centerBrgy.lat),Number(centerBrgy.lng)]:defaultCenter;
 pickMapInstance=L.map(el,{scrollWheelZoom:false}).setView(startCenter,centerBrgy?15:12);addBaseLayer(pickMapInstance).on('tileerror',()=>{const m=$('pick-msg');if(m)m.hidden=false});
 const barangayPoints=S.barangays.map(b=>[Number(b.lat),Number(b.lng)]).filter(point=>point.every(Number.isFinite));
 if(barangayPoints.length)pickMapInstance.fitBounds(barangayPoints,{padding:[30,30],maxZoom:14});
 S.barangays.forEach(b=>{const marker=L.circleMarker([Number(b.lat),Number(b.lng)],{radius:5,color:'#fff',weight:2,fillColor:'#006b62',fillOpacity:.9}).addTo(pickMapInstance);marker.bindTooltip(esc(b.name))});
 pickMapInstance.on('click',e=>setPickPoint(e.latlng.lat,e.latlng.lng));
}
function setPickPoint(lat,lng,pan){
 $('nla').value=Number(lat).toFixed(5);$('nlo').value=Number(lng).toFixed(5);
 if(!pickMapInstance)return;
 if(pickMarker)pickMarker.setLatLng([lat,lng]);else pickMarker=L.circleMarker([lat,lng],{radius:9,color:'#fff',weight:3,fillColor:'#d88700',fillOpacity:1}).addTo(pickMapInstance);
 if(pan)pickMapInstance.setView([lat,lng],14);
}
function brgyPicked(){const b=S.barangays.find(x=>x.id==($('nb')||{}).value);if(b&&pickMapInstance&&!$('nla').value)pickMapInstance.setView([Number(b.lat),Number(b.lng)],15)}
function useGeo(){if(!navigator.geolocation)return $('nm').textContent='Geolocation is not supported by your browser.';navigator.geolocation.getCurrentPosition(p=>{$('nm').textContent='';setPickPoint(p.coords.latitude,p.coords.longitude,true);},e=>{let msg='Could not access your location.';if(e.code===1)msg='Location access was denied. Please enable location permissions or enter the latitude and longitude manually.';else if(e.code===2)msg='Location information is unavailable. Please enter the latitude and longitude manually.';else if(e.code===3)msg='Location request timed out. Please enter the latitude and longitude manually.';$('nm').textContent=msg;},{enableHighAccuracy:true,timeout:10000,maximumAge:0});}
function useBrgy(){const b=S.barangays.find(x=>x.id==$('nb').value);if(!b)return $('nm').textContent='Select a barangay first.';setPickPoint(b.lat,b.lng,true)}
let geocodeTimeout=null;
async function geocodeAddress(){const addr=$('nl').value.trim();if(!addr)return $('nm').textContent='Please enter a location description first.';if(geocodeTimeout)clearTimeout(geocodeTimeout);$('nm').textContent='Geocoding address...';try{const resp=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr+', Olongapo City, Philippines')}&format=json&limit=1&viewbox=120.2000,14.7500,120.4000,14.9000&bounded=1`,{headers:{'User-Agent':'OlongapoFixIt/1.0 (contact@olongapofixit.gov.ph)'}});if(!resp.ok)throw new Error('Geocoding service unavailable');const data=await resp.json();if(!data||data.length===0)throw new Error('No results found for this address');const {lat,lon,display_name}=data[0];const latF=Number(lat),lngF=Number(lon);if(!Number.isFinite(latF)||!Number.isFinite(lngF))throw new Error('Invalid coordinates returned');$('nla').value=latF.toFixed(6);$('nlo').value=lngF.toFixed(6);setPickPoint(latF,lngF,true);$('nm').textContent='Address geocoded: '+esc(display_name);}catch(e){$('nm').textContent='Geocode failed: '+e.message;}}
async function subRep(){const m=$('nm');m.textContent='';const b=$('nb').value;if(!b)return m.textContent='Please select a barangay.';
 const latF=Number($('nla').value),lngF=Number($('nlo').value);
 if(!Number.isFinite(latF)||!Number.isFinite(lngF)||latF===0&&lngF===0){const brgy=S.barangays.find(x=>x.id==+b);if(brgy){$('nla').value=Number(brgy.lat).toFixed(6);$('nlo').value=Number(brgy.lng).toFixed(6);m.textContent='No coordinates provided; using barangay center.'}}
 else if(latF<BB[0]||latF>BB[1]||lngF<BB[2]||lngF>BB[3]){return m.textContent='Coordinates are outside Olongapo City bounds. Please enter a location within the city.'}
 await guarded(async()=>{const r=await api('report',{cat:$('nc').value,brgy:+b,desc:$('nd').value,photo:PH,loc:$('nl').value,lat:$('nla').value,lng:$('nlo').value});
 $('app').innerHTML=`<div class="card"><h2 class="ok">Your report has been successfully submitted.</h2><p>Report ID: <b>${esc(r.code)}</b></p><button class="btn" onclick="go('#/r/${r.id}')">View Report</button></div>`},'nm')}
function detail(id){PH='';if(!guard())return;const r=S.reports.find(x=>x.id===id);
 if(!r||!can(r)){$('app').innerHTML='<div class="card err">Report not found or access denied.</div>';return}
 const st=staff(),open=!['RESOLVED','REJECTED'].includes(r.status);
 const asg=S.users.filter(u=>u.active&&((u.role==='brgy'&&u.brgy===r.brgy)||u.role==='city'));
 $('app').innerHTML=`<div class="card"><h2>${esc(r.code)} ${badge(r.status)}</h2><p><b>${esc(r.cat)}</b> · ${esc(bname(r.brgy))} · ${esc(fd(r.created))}</p><p>${esc(r.desc)}</p>${r.photo?`<img class="ph" src="/api/img/r/${r.id}" alt="Report photo">`:'<p class="mu">No photo</p>'}
 <p>Location: ${esc(r.loc||'—')}${Number.isFinite(Number(r.lat))&&Number.isFinite(Number(r.lng))&&(Number(r.lat)!==0||Number(r.lng)!==0)?` (${Number(r.lat).toFixed(5)}, ${Number(r.lng).toFixed(5)})`:''}<br>Reporter: ${st?esc(uname(r.uid)):'You'}<br>Assigned: ${esc(r.assignee?uname(r.assignee):r.dept?dname(r.dept):'—')}</p>${Number.isFinite(Number(r.lat))&&Number.isFinite(Number(r.lng))&&(Number(r.lat)!==0||Number(r.lng)!==0)?`<div id="rpt-map" class="report-map" style="height:220px;min-height:180px;margin-top:12px" role="region" aria-label="Report location map"></div>`:''}</div>
 ${st&&open?`<div class="card"><h3>Actions</h3><label>Remarks</label><input id="rm"><button class="btn g" onclick="act(${r.id},'VERIFIED')">Verify</button><button class="btn r" onclick="act(${r.id},'REJECTED')">Reject</button><button class="btn o" onclick="act(${r.id},'IN PROGRESS')">Mark In Progress</button>
 <div class="row" style="margin-top:8px"><select id="as"><option value="">Assign to…</option>${asg.map(u=>`<option value="u${u.id}">${esc(u.name)} (${esc(u.pos)})</option>`).join('')}${S.depts.filter(d=>d.active).map(d=>`<option value="d${d.id}">${esc(d.name)}</option>`).join('')}</select><button class="btn" onclick="assign(${r.id})">Assign</button></div>
 <h4>Resolve (remarks + photo evidence required)</h4><input id="rr" placeholder="Resolution remarks"><input id="rf" type="file" accept="image/*" onchange="prev('rf','rpv')"><div id="rpv"></div><button class="btn g" onclick="resolve(${r.id})">Resolve</button><p id="am" class="err"></p></div>`:''}
 ${r.ev.length?`<div class="card"><h3>Resolution evidence</h3>${r.ev.map(e=>`<p>${esc(e.desc)} <small>${esc(uname(e.by))}, ${esc(fd(e.at))}</small></p>${e.img?`<img class="ph" src="/api/img/e/${e.id}" alt="Resolution evidence">`:''}`).join('')}</div>`:''}
 <div class="card"><h3>Status Timeline</h3><ul class="tl">${r.hist.map(h=>`<li><b>${esc(h.s)}</b> – ${esc(fd(h.at))} – ${esc(uname(h.by))}<br><small>${esc(h.rem)}</small></li>`).join('')}</ul></div>`}
  const rmapEl=$('rpt-map');if(rmapEl&&window.L){const rmap=L.map(rmapEl,{scrollWheelZoom:false}).setView([Number(r.lat),Number(r.lng)],16);addBaseLayer(rmap);L.circleMarker([Number(r.lat),Number(r.lng)],{radius:9,color:'#fff',weight:3,fillColor:'#d88700',fillOpacity:1}).addTo(rmap).bindPopup(`${esc(r.code)} – ${esc(r.cat)}<br>${esc(Number(r.lat).toFixed(6))}, ${esc(Number(r.lng).toFixed(6))}`);requestAnimationFrame(()=>rmap.invalidateSize());}
 async function act(id,s){await guarded(async()=>{await api('act',{id,s,rem:$('rm').value});await refresh();detail(id)},'am','Report updated.')}
async function assign(id){await guarded(async()=>{await api('assign',{id,to:$('as').value});await refresh();detail(id)},'am','Report assigned.')}
async function resolve(id){await guarded(async()=>{if(!PH)throw new Error('Resolution remarks and a photo are required.');await api('resolve',{id,rem:$('rr').value,img:PH});PH='';await refresh();detail(id)},'am','Report marked as resolved.')}
async function notifs(){if(!guard())return;const N=S.notifs.slice();await api('notifs/read',{});S.notifs.forEach(n=>n.read=true);nav();
 $('app').innerHTML=`<div class="card"><h2>Notifications</h2>${N.map(n=>`<p>${esc(n.msg)} <small>${esc(fd(n.at))}</small> ${n.rid?`<a class="btn o" onclick="go('#/r/${n.rid}')">Open</a>`:''}</p>`).join('')||'<p class="mu">Nothing yet.</p>'}</div>`}
function mapV(){
 if(!guard(['admin','brgy','city']))return;
 const R=visible(ME),colors={RESOLVED:'#17633a',REJECTED:'#a32121'};
 if(reportMap){reportMap.remove();reportMap=null}
 $('app').innerHTML=`<section class="card map-page"><header class="map-heading"><div><h2>Olongapo FixIt Map</h2><p class="mu">Explore report locations and open a marker for report details.</p></div><a class="btn o" href="#/reports">View reports</a></header><div id="report-map" class="report-map" role="region" aria-label="Interactive map of Olongapo reports"></div><ul class="map-legend" aria-label="Report status legend"><li><span class="legend-dot active" aria-hidden="true"></span>Active</li><li><span class="legend-dot resolved" aria-hidden="true"></span>Resolved</li><li><span class="legend-dot rejected" aria-hidden="true"></span>Rejected</li></ul><p id="map-message" class="note" role="status" hidden>Map tiles could not be loaded. Check your internet connection and try again.</p></section>`;
 const el=$('report-map');if(!window.L||!el.clientWidth||!el.clientHeight)return;
 reportMap=L.map(el,{scrollWheelZoom:false}).setView([(BB[0]+BB[1])/2,(BB[2]+BB[3])/2],12);const tiles=addBaseLayer(reportMap);
 tiles.on('tileerror',()=>{$('map-message').hidden=false});
 const points=[];
 R.forEach(r=>{
  const brgy=S.barangays.find(b=>b.id===r.brgy),lat=Number(r.lat),lng=Number(r.lng),position=Number.isFinite(lat)&&Number.isFinite(lng)&&(lat!==0||lng!==0)?[lat,lng]:brgy?[Number(brgy.lat),Number(brgy.lng)]:null;
  if(!position||!position.every(Number.isFinite))return;
  points.push(position);
  const color=colors[r.status]||'#8a4b00';
  const latLng=Number.isFinite(lat)&&Number.isFinite(lng)&&(lat!==0||lng!==0)?`${lat.toFixed(6)}, ${lng.toFixed(6)}`:'—';
  const isApprox=!(Number.isFinite(lat)&&Number.isFinite(lng)&&(lat!==0||lng!==0));
  const popup=`<strong>${esc(r.code)}</strong><br>${esc(r.cat)}<br>${esc(bname(r.brgy))}<p>${badge(r.status)}</p><p><b>Location:</b> ${esc(r.loc||'—')}<br><b>Coordinates:</b> ${latLng}${isApprox?' <small>(approx. barangay center)</small>':''}</p><a href="#/r/${r.id}">Open report details</a>`;
  L.circleMarker(position,{radius:9,color:'#fff',weight:2,fillColor:color,fillOpacity:.9}).addTo(reportMap).bindPopup(popup);
 });
 S.barangays.forEach(b=>{
  const hasReport=points.some(p=>Math.abs(p[0]-Number(b.lat))<0.0001&&Math.abs(p[1]-Number(b.lng))<0.0001);
  if(!hasReport){
   L.circleMarker([Number(b.lat),Number(b.lng)],{radius:6,color:'#fff',weight:1,fillColor:'#006b62',fillOpacity:.4}).addTo(reportMap).bindTooltip(esc(b.name)+' (center)');
  }
 });
 if(points.length>1)reportMap.fitBounds(points,{padding:[30,30],maxZoom:14});else if(points.length===1)reportMap.setView(points[0],15);else if(S.barangays.length)reportMap.fitBounds(S.barangays.map(b=>[Number(b.lat),Number(b.lng)]).filter(p=>p.every(Number.isFinite)),{padding:[30,30],maxZoom:13});
 L.control.scale({imperial:false}).addTo(reportMap);
}
const PEOPLE_MAP_BRGS=[['Pag-asa','Pag-asa'],['New Kalalake','Kalalake'],['West Tapinac','West Tapinac']];
const PEOPLE_MAP_COLORS={'Pag-asa':'#087e8b','Kalalake':'#cf6d18','West Tapinac':'#7653a6'};
function disposePeopleMap(){peopleMapRequest++;if(peopleMapInstance){peopleMapInstance.remove();peopleMapInstance=null}peopleMarkers=null;peopleMapData=null}
function peopleMap(){
 if(!guard(['admin','brgy']))return;
 const options=S.barangays.filter(b=>b.active&&PEOPLE_MAP_BRGS.some(x=>x[0]===b.name)).map(b=>({id:b.id,name:PEOPLE_MAP_BRGS.find(x=>x[0]===b.name)[1]}));
 $('app').innerHTML=`<section class="card map-page people-map-page"><header class="map-heading"><div><h2>Residents &amp; Barangay Officials Map</h2><p class="mu">Markers use approximate barangay-center locations, not residents' street addresses.</p></div></header>
 <div class="people-map-controls"><fieldset><legend>Barangays</legend><label><input id="people-all" type="checkbox" checked> All 3 Barangays</label>${options.map(b=>`<label><input class="people-brgy" type="checkbox" value="${b.id}" checked> ${esc(b.name)}</label>`).join('')}</fieldset>
 <fieldset><legend>Layers</legend><label><input id="people-residents-on" type="checkbox" checked> Residents</label><label><input id="people-officials-on" type="checkbox" checked> Officials</label></fieldset>
 <label class="people-search-label" for="people-search">Search by name</label><input id="people-search" type="search" placeholder="Find a resident or official"></div>
 <div id="people-counts" class="people-counts" aria-live="polite"></div><p id="people-loading" class="note" role="status">Loading records…</p><p id="people-error" class="err" role="alert" hidden></p>
 <div id="people-map" class="report-map" role="region" aria-label="Map of residents and barangay officials"></div>
 <p id="people-missing" class="note" hidden></p><p id="people-empty" class="mu" role="status" hidden>No records found.</p>
 <ul class="map-legend people-legend" aria-label="People map legend"><li><span class="people-legend-brgy" style="--brgy-color:#087e8b"></span>Pag-asa</li><li><span class="people-legend-brgy" style="--brgy-color:#cf6d18"></span>Kalalake</li><li><span class="people-legend-brgy" style="--brgy-color:#7653a6"></span>West Tapinac</li><li><span class="people-marker people-marker-resident">R</span>Resident</li><li><span class="people-marker people-marker-official">O</span>Official</li></ul></section>`;
 if(window.L&&$('people-map').clientWidth){peopleMapInstance=L.map('people-map',{scrollWheelZoom:false}).setView([(BB[0]+BB[1])/2,(BB[2]+BB[3])/2],12);addBaseLayer(peopleMapInstance);peopleMarkers=L.layerGroup().addTo(peopleMapInstance);L.control.scale({imperial:false}).addTo(peopleMapInstance)}else if(!window.L){$('people-error').textContent='The map library could not be loaded.';$('people-error').hidden=false}
 const all=$('people-all'),brgyChecks=[...document.querySelectorAll('.people-brgy')],refreshAll=()=>{all.checked=brgyChecks.length>0&&brgyChecks.every(x=>x.checked);all.indeterminate=brgyChecks.some(x=>x.checked)&&!all.checked};
 all.addEventListener('change',()=>{brgyChecks.forEach(x=>x.checked=all.checked);loadPeopleMap()});
 brgyChecks.forEach(x=>x.addEventListener('change',()=>{refreshAll();loadPeopleMap()}));
 $('people-residents-on').addEventListener('change',loadPeopleMap);$('people-officials-on').addEventListener('change',loadPeopleMap);
 $('people-search').addEventListener('input',drawPeopleMarkers);
 loadPeopleMap();
}
async function loadPeopleMap(){
 const request=++peopleMapRequest,loading=$('people-loading'),error=$('people-error'),countsEl=$('people-counts'),missing=$('people-missing');
 if(!loading)return;
 loading.hidden=false;loading.textContent='Loading records…';error.hidden=true;missing.hidden=true;$('people-empty').hidden=true;
 const ids=[...document.querySelectorAll('.people-brgy:checked')].map(x=>x.value),residentsOn=$('people-residents-on').checked,officialsOn=$('people-officials-on').checked;
 const query=new URLSearchParams({barangays:ids.join(','),residents:residentsOn?'1':'0',officials:officialsOn?'1':'0'});
 try{
  const data=await api('people-map?'+query.toString());if(request!==peopleMapRequest)return;
  peopleMapData=data;countsEl.innerHTML=(data.barangays||[]).map(b=>`<span><b>${esc(b.name)}:</b> ${b.counts.residents} residents, ${b.counts.officials} officials</span>`).join('');
  if(data.missingLocation){missing.textContent=`${data.missingLocation} records have no location.`;missing.hidden=false}
  loading.hidden=true;drawPeopleMarkers();
  if(peopleMapInstance){const centers=data.barangays.map(b=>[Number(b.lat),Number(b.lng)]).filter(p=>p.every(Number.isFinite));if(centers.length>1)peopleMapInstance.fitBounds(centers,{padding:[30,30],maxZoom:14});else if(centers.length===1)peopleMapInstance.setView(centers[0],14);else peopleMapInstance.setView([(BB[0]+BB[1])/2,(BB[2]+BB[3])/2],12);requestAnimationFrame(()=>peopleMapInstance&&peopleMapInstance.invalidateSize())}
 }catch(e){if(request!==peopleMapRequest)return;loading.hidden=true;error.textContent=e.message;error.hidden=false;countsEl.textContent='';if(peopleMarkers)peopleMarkers.clearLayers()}
}
function drawPeopleMarkers(){
 if(!peopleMapData)return;
 const search=$('people-search').value.trim().toLocaleLowerCase(),items=[...(peopleMapData.residents||[]).map(x=>({...x,kind:'resident'})),...(peopleMapData.officials||[]).map(x=>({...x,kind:'official'}))].filter(x=>!search||x.name.toLocaleLowerCase().includes(search)),valid=items.filter(x=>Number.isFinite(x.lat)&&x.lat>=-90&&x.lat<=90&&Number.isFinite(x.lng)&&x.lng>=-180&&x.lng<=180);
 if(peopleMarkers)peopleMarkers.clearLayers();
 valid.forEach(x=>{if(!window.L)return;const color=PEOPLE_MAP_COLORS[x.barangay]||'#435957',role=x.kind==='official'?`<br><b>Position:</b> ${esc(x.position||'—')}`:'',html=`<strong>${esc(x.name)}</strong>${role}<br><b>Address:</b> ${esc(x.address||'—')}<br><b>Barangay:</b> ${esc(x.barangay)}`,icon=L.divIcon({className:'people-marker-shell',html:`<span class="people-marker people-marker-${x.kind}" style="--brgy-color:${color}"><i>${x.kind==='resident'?'R':'O'}</i></span>`,iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-13]});if(peopleMarkers)L.marker([x.lat,x.lng],{icon}).addTo(peopleMarkers).bindPopup(html)});
 $('people-empty').hidden=valid.length>0;
}
