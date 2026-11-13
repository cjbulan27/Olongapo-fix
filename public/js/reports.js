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
function newRep(){if(!guard(['res']))return;PH='';submittingReport=false;if(ME.vstatus!=='approved'){$('app').innerHTML='<h2>Report a Problem</h2>'+resBanner();return}
 $('app').innerHTML=`<section class="card new-report" aria-labelledby="new-report-title"><h2 id="new-report-title">Report a Problem</h2>
 <section class="report-step" aria-labelledby="category-title"><h3 id="category-title">1. Choose a category</h3><input id="nc" type="hidden" value=""><div class="category-options" role="group" aria-labelledby="category-title">
 ${[['Broken Streetlight','<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 18h6m-5 4h4m-6-7a7 7 0 1 1 8 0c-.8.6-1 1.2-1 2H9c0-.8-.2-1.4-1-2Z"/></svg>','Streetlight'],['Damaged Road','<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 3 5 21m11-18 3 18M12 5v3m0 4v3m0 4v2"/></svg>','Road'],['Garbage Problem','<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16m-10-3h4m-8 3 1 14h10l1-14m-8 4v7m4-7v7"/></svg>','Garbage'],['Flooding','<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 15a4 4 0 1 1 1-7.9A5 5 0 0 1 18 9a3 3 0 0 1 0 6H7Zm-3 4c1.2-1 2.1-1 3.3 0s2.1 1 3.4 0 2.1-1 3.3 0 2.1 1 3.3 0 2.1-1 3.4 0"/></svg>','Flooding'],['Water Leak','<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11Z"/><path d="M9 15a3 3 0 0 0 3 3"/></svg>','Water'],['Other','<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>','Other']].map(([value,icon,label])=>`<button type="button" class="category-chip" data-category="${esc(value)}" aria-pressed="false" onclick="selectReportCategory(this)"><span class="category-icon">${icon}</span><span class="category-label">${label}</span></button>`).join('')}
 </div><p id="category-error" class="form-error" role="alert" tabindex="-1"></p></section>
 <section class="report-step" aria-labelledby="location-title"><h3 id="location-title">2. Pin the location</h3><p class="map-hint">Tap the map or drag the pin to mark the problem.</p>
 <label class="sr-only" for="map-search">Search street or landmark</label><input id="map-search" class="map-search" type="search" placeholder="Search street or landmark" autocomplete="off" aria-controls="map-search-results">
 <div id="map-search-results" class="map-search-results" role="listbox" aria-label="Location search results" hidden></div>
 <div class="map-wrap"><div id="pick" class="location-picker" role="region" aria-label="Choose report location on map"></div><button type="button" id="use-location" class="map-location-button" onclick="useGeo()"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg><span>Use my current location</span></button></div>
 <p id="pick-msg" class="note" role="status" hidden>The map could not be loaded. Check your internet connection and try again.</p>
 <p id="pin-status" class="pin-status" role="status" aria-live="polite">Please pin the location on the map.</p>
 <div class="location-details"><div><label for="nb">Barangay</label><select id="nb"><option value="">Auto-select from pin</option>${allowedBarangays().map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></div>
 <div><label for="nl">Location description</label><input id="nl" maxlength="200" placeholder="Street or nearby landmark (optional)"></div></div>
 <p id="geocode-status" class="map-hint" role="status" aria-live="polite"></p><input id="nla" type="hidden"><input id="nlo" type="hidden">
 </section>
 <section class="report-step" aria-labelledby="photo-title"><h3 id="photo-title">3. Add a photo <span class="optional">(optional)</span></h3>
 <label for="nf" class="btn o photo-upload-button">Take / Upload Photo</label><input id="nf" class="photo-file-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onchange="prev('nf','npv',1200)">
 <p class="field-help">JPG, PNG or WEBP · Max 5 MB</p><div id="npv" class="photo-preview" role="status" aria-live="polite"></div></section>
 <section class="report-step" aria-labelledby="description-title"><h3 id="description-title">4. Add a short description <span class="optional">(optional)</span></h3><label class="sr-only" for="nd">Description</label><textarea id="nd" rows="3" maxlength="2000" placeholder="What's wrong? (optional)"></textarea></section>
 <section class="report-submit"><p id="nm" class="form-error" role="alert"></p><p id="pin-required" class="field-help">Please pin the location on the map.</p><button id="submit-report" class="btn g submit-report-button" type="button" onclick="subRep()" disabled>Submit Report</button></section>
 </section>`;drawPick();setupReportLocationSearch();$('nl').addEventListener('input',()=>{locationTouched=true});$('nb').addEventListener('change',()=>{barangayTouched=true});updateReportSubmit()}
const TILE_URL='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
let pickMapInstance=null,pickMarker=null,reportMap=null,markersLayer=null,pickResizeObserver=null,pickLayoutObserver=null,locationTouched=false,barangayTouched=false,submittingReport=false;
let allReports=[],selectedMapBarangay='All Barangays';
let peopleMapInstance=null,peopleMarkers=null,peopleMapData=null,peopleMapRequest=0;
function addBaseLayer(map){return L.tileLayer(TILE_URL,{maxZoom:19,attribution:TILE_ATTRIBUTION}).addTo(map)}
const MAP_BARANGAYS=[
 {name:'Pag-Asa',center:[14.8350,120.2810],zoom:15},
 {name:'West Tapinac',center:[14.8290,120.2840],zoom:15},
 {name:'New Kalalake',center:[14.8240,120.2890],zoom:15}
];
const normalizeMapBarangay=name=>String(name||'').trim().toLowerCase();
function reportCoordinates(report,barangay){
 const latitude=Number(report.lat),longitude=Number(report.lng);
 if(Number.isFinite(latitude)&&latitude>=-90&&latitude<=90&&Number.isFinite(longitude)&&longitude>=-180&&longitude<=180&&(latitude!==0||longitude!==0))return{latitude,longitude,isApprox:false};
 const center=MAP_BARANGAYS.find(x=>normalizeMapBarangay(x.name)===normalizeMapBarangay(barangay))?.center;
 const dbBarangay=S.barangays.find(x=>x.id===report.brgy);
 const fallback=center||[Number(dbBarangay?.lat),Number(dbBarangay?.lng)];
 return fallback&&fallback.every(Number.isFinite)?{latitude:fallback[0],longitude:fallback[1],isApprox:true}:{latitude:null,longitude:null,isApprox:true};
}
function invalidatePickMap(){if(pickMapInstance)requestAnimationFrame(()=>pickMapInstance&&pickMapInstance.invalidateSize({pan:false}))}
window.addEventListener('resize',invalidatePickMap,{passive:true});
// All map interactions update one draggable marker and the hidden coordinates.
function drawPick(){
 const el=$('pick');if(pickMapInstance)pickMapInstance.remove();pickMapInstance=null;pickMarker=null;locationTouched=false;barangayTouched=false;
 if(pickResizeObserver)pickResizeObserver.disconnect();if(pickLayoutObserver)pickLayoutObserver.disconnect();
 if(reverseTimeout)clearTimeout(reverseTimeout);reverseRequest++;if(searchTimeout)clearTimeout(searchTimeout);searchRequest++;
 if(!window.L||!el)return;
 if(!el.clientWidth||!el.clientHeight)return;
 const bounds=L.latLngBounds([BB[0],BB[2]],[BB[1],BB[3]]);
 // Keep mobile one-finger gestures available for page scrolling; taps still place pins.
 pickMapInstance=L.map(el,{scrollWheelZoom:false,dragging:!L.Browser.touch,touchZoom:true,minZoom:12,maxZoom:19,maxBounds:bounds,maxBoundsViscosity:.85}).setView([14.8300,120.2840],14);addBaseLayer(pickMapInstance).on('tileerror',()=>{const m=$('pick-msg');if(m)m.hidden=false});
 pickMapInstance.on('click',e=>{pickMapInstance.scrollWheelZoom.enable();setPickPoint(e.latlng.lat,e.latlng.lng,true)});
 pickMapInstance.on('mouseout',()=>pickMapInstance&&pickMapInstance.scrollWheelZoom.disable());
 if(typeof ResizeObserver==='function'){pickResizeObserver=new ResizeObserver(invalidatePickMap);pickResizeObserver.observe(el.parentElement)}
 if(typeof MutationObserver==='function'){pickLayoutObserver=new MutationObserver(invalidatePickMap);pickLayoutObserver.observe(document.body,{attributes:true,attributeFilter:['class']})}
 requestAnimationFrame(invalidatePickMap);
}
function insideOlongapo(lat,lng){return lat>=BB[0]&&lat<=BB[1]&&lng>=BB[2]&&lng<=BB[3]}
function setPickPoint(lat,lng,pan){
 lat=Number(lat);lng=Number(lng);if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
 if(!insideOlongapo(lat,lng)){$('nm').textContent='Please place the pin within Olongapo City.';return}
 $('nla').value=lat.toFixed(6);$('nlo').value=lng.toFixed(6);$('geocode-status').textContent='Finding the street or area name…';$('nm').textContent='';if(!barangayTouched){const brgy=nearestBarangay(lat,lng);if(brgy)$('nb').value=String(brgy.id)}const selected=S.barangays.find(b=>b.id==Number($('nb').value));$('pin-status').textContent='Pin placed. Location pinned: '+(selected?selected.name:'Olongapo City')+'.';updateReportSubmit();
 if(pickMapInstance){if(pickMarker)pickMarker.setLatLng([lat,lng]);else{const icon=L.divIcon({className:'report-pin-icon',html:'<svg viewBox="0 0 42 50" aria-hidden="true" focusable="false"><path d="M21 2C13 13 5 21 5 30a16 16 0 0 0 32 0C37 21 29 13 21 2Z"/><circle cx="21" cy="29" r="5.5"/></svg>',iconSize:[42,50],iconAnchor:[21,48]});pickMarker=L.marker([lat,lng],{icon,draggable:true,autoPan:true}).addTo(pickMapInstance);pickMarker.on('dragend',()=>{const point=pickMarker.getLatLng();if(!insideOlongapo(point.lat,point.lng)){pickMarker.setLatLng([Number($('nla').value),Number($('nlo').value)]);$('nm').textContent='Please keep the pin within Olongapo City.';return}setPickPoint(point.lat,point.lng,false)})}if(pan)pickMapInstance.setView([lat,lng],17)}
 scheduleReverseGeocode(lat,lng)
}
function useGeo(){if(!navigator.geolocation){$('nm').textContent='Location sharing is not available in this browser.';return}const button=$('use-location');button.disabled=true;button.querySelector('span').textContent='Finding your location…';navigator.geolocation.getCurrentPosition(p=>{button.disabled=false;button.querySelector('span').textContent='Use my current location';const lat=p.coords.latitude,lng=p.coords.longitude;if(!insideOlongapo(lat,lng)){$('nm').textContent='Your current location appears to be outside Olongapo City. Please pin a location within the city.';if(pickMapInstance)pickMapInstance.setView([14.8300,120.2840],14);return}setPickPoint(lat,lng,true)},e=>{button.disabled=false;button.querySelector('span').textContent='Use my current location';$('nm').textContent=e.code===1?'Location permission was denied. You can still tap the map to place the pin.':e.code===3?'Your location request timed out. Please try again or tap the map.':'Could not find your location. Please try again or tap the map.'},{enableHighAccuracy:true,timeout:12000,maximumAge:0})}
let reverseTimeout=null,searchTimeout=null,reverseRequest=0,searchRequest=0;
// Debounce pin changes so reverse lookups only run after the marker settles.
function scheduleReverseGeocode(lat,lng){if(reverseTimeout)clearTimeout(reverseTimeout);const request=++reverseRequest;reverseTimeout=setTimeout(()=>reverseGeocode(lat,lng,request),500)}
// Use the backend proxy for Nominatim so the app is identified and requests are paced.
async function reverseGeocode(lat,lng,request){try{const result=await api(`geocode/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`);if(request!==reverseRequest||!$('nl'))return;const address=result.address||{},area=[address.suburb,address.neighbourhood,address.city_district,address.village,address.town].filter(Boolean).join(', '),street=[address.road||address.pedestrian||address.residential||address.footway,area].filter(Boolean).join(', ');if(street&&!locationTouched)$('nl').value=street;const brgy=barangayFromAddress(address)||nearestBarangay(lat,lng);if(brgy&&!barangayTouched)$('nb').value=String(brgy.id);const selected=S.barangays.find(b=>b.id==Number($('nb').value));$('pin-status').textContent='Pin placed. Location pinned: '+(street||selected&&selected.name||'Olongapo City')+'.';$('geocode-status').textContent=''}catch(e){if(request===reverseRequest&&$('geocode-status'))$('geocode-status').textContent=''}}
function normalizeBarangay(value){return String(value||'').toLocaleLowerCase().replace(/barangay|brgy\.?/g,'').replace(/[^a-z]/g,'')}
function barangayFromAddress(address){const values=[address.suburb,address.neighbourhood,address.city_district,address.quarter,address.village,address.town,address.locality].filter(Boolean).map(normalizeBarangay);return allowedBarangays().find(b=>{const name=normalizeBarangay(b.name);return values.some(value=>value===name||value.includes(name)||name.includes(value))||name==='newkalalake'&&values.some(value=>value==='kalalake')})||null}
function nearestBarangay(lat,lng){const list=allowedBarangays();if(!list.length)return null;return list.reduce((nearest,b)=>{const distance=(Number(b.lat)-lat)**2+(Number(b.lng)-lng)**2;return !nearest||distance<nearest.distance?{barangay:b,distance}:nearest},null).barangay}
function setupReportLocationSearch(){const input=$('map-search'),results=$('map-search-results');input.addEventListener('input',()=>{if(searchTimeout)clearTimeout(searchTimeout);const query=input.value.trim(),request=++searchRequest;results.hidden=true;results.replaceChildren();if(query.length<3)return;searchTimeout=setTimeout(()=>searchLocations(query,request),500)});input.addEventListener('keydown',e=>{if(e.key==='Escape'){results.hidden=true;results.replaceChildren()}})}
async function searchLocations(query,request){const results=$('map-search-results');try{const data=await api(`geocode/search?q=${encodeURIComponent(query)}`);if(request!==searchRequest||!$('map-search-results'))return;const matches=Array.isArray(data.results)?data.results:[];if(!matches.length){results.innerHTML='<p class="map-search-empty">No nearby places found. Try a street or landmark name.</p>';results.hidden=false;return}results.innerHTML=matches.map((item,index)=>`<button type="button" class="map-search-result" role="option" aria-selected="false" onclick="chooseSearchLocation(${index})">${esc(item.name)}</button>`).join('');window.reportSearchResults=matches;results.hidden=false}catch(e){if(request===searchRequest){results.innerHTML='<p class="map-search-empty">Location search is unavailable. You can still tap the map to place the pin.</p>';results.hidden=false}}}
function chooseSearchLocation(index){const result=window.reportSearchResults&&window.reportSearchResults[index];if(!result)return;const lat=Number(result.lat),lng=Number(result.lon);if(lat<BB[0]||lat>BB[1]||lng<BB[2]||lng>BB[3]){$('nm').textContent='That result is outside Olongapo City. Please choose another place.';return}$('map-search').value=result.name;$('map-search-results').hidden=true;setPickPoint(lat,lng,true)}
function updateReportSubmit(){const pin=!!($('nla')&&$('nla').value&&$('nlo')&&$('nlo').value),button=$('submit-report');if(button)button.disabled=!pin||submittingReport;if($('pin-required'))$('pin-required').hidden=pin}
function selectReportCategory(button){document.querySelectorAll('.category-chip').forEach(item=>{const selected=item===button;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected))});$('nc').value=button.dataset.category;$('category-error').textContent=''}
async function subRep(){const message=$('nm'),button=$('submit-report');message.textContent='';if(submittingReport)return;if(!$('nc').value){$('category-error').textContent='Please choose a category.';$('category-error').focus();return}if(!$('nla').value||!$('nlo').value){$('pin-status').textContent='Please pin the location on the map.';return}const latF=Number($('nla').value),lngF=Number($('nlo').value);if(!Number.isFinite(latF)||!Number.isFinite(lngF)){message.textContent='Please place the pin on a valid location.';return}if(latF<BB[0]||latF>BB[1]||lngF<BB[2]||lngF>BB[3]){message.textContent='That pin is outside Olongapo City. Please choose a location within the city.';return}const b=Number($('nb').value)||(nearestBarangay(latF,lngF)||{}).id||null;submittingReport=true;button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='Submitting…';try{const r=await api('report',{cat:$('nc').value,brgy:b,desc:$('nd').value.trim(),photo:PH,loc:$('nl').value.trim(),lat:$('nla').value,lng:$('nlo').value});PH='';$('app').innerHTML=`<div class="card report-success" role="status"><p class="eyebrow">Report received</p><h2 class="ok">Thank you for helping improve our community.</h2><p>Your reference number is <strong>${esc(r.code)}</strong>.</p><div class="report-success-actions"><a class="btn" href="#/track">Track your report</a><button type="button" class="btn o" onclick="go('#/new')">Report another</button></div></div>`}catch(e){message.textContent=e.message||'Your report could not be submitted. Please try again.';toast(message.textContent,'err')}finally{submittingReport=false;if(button.isConnected){button.removeAttribute('aria-busy');button.textContent='Submit Report';updateReportSubmit()}}}
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
const NOTIFICATION_COPY={
 title:'Notifications',description:'Updates about your reports and account.',
 all:'All',unread:'Unread',markAll:'Mark all as read',today:'Today',yesterday:'Yesterday',earlier:'Earlier',
 emptyTitle:'You’re all caught up',emptyText:'New updates will appear here.',
 noReport:'FixIt update',openLabel:'Open notification',loading:'Loading notifications…',
 updated:'Notification marked as read.',allRead:'All notifications marked as read.'
};
let NOTIFICATION_FILTER='all';
function notificationSkeleton(){
 return `<section class="notification-page" aria-busy="true" aria-label="${esc(NOTIFICATION_COPY.loading)}"><header class="page-heading"><div><p class="eyebrow">FIXIT UPDATES</p><h2>${esc(NOTIFICATION_COPY.title)}</h2><p class="mu">${esc(NOTIFICATION_COPY.description)}</p></div></header><div class="notification-skeleton" aria-hidden="true">${[1,2,3].map(()=>'<div class="notification-skeleton-row"><i></i><span><b></b><em></em><small></small></span></div>').join('')}</div><span class="sr-only">${esc(NOTIFICATION_COPY.loading)}</span></section>`
}
function notificationDateGroup(value){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return NOTIFICATION_COPY.earlier;
 const key=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 const today=key(new Date()),yesterday=key(new Date(Date.now()-86400000)),target=key(date);
 return target===today?NOTIFICATION_COPY.today:target===yesterday?NOTIFICATION_COPY.yesterday:NOTIFICATION_COPY.earlier;
}
function relativeNotificationTime(value){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return'';
 const seconds=Math.max(0,Math.floor((Date.now()-date.getTime())/1000)),units=[['year',31536000],['month',2592000],['week',604800],['day',86400],['hour',3600],['minute',60]];
 const relative=new Intl.RelativeTimeFormat('en',{numeric:'auto'});
 for(const [unit,size] of units)if(seconds>=size)return relative.format(-Math.floor(seconds/size),unit);
 return relative.format(-seconds,'second');
}
function notificationStyle(message){
 const value=String(message||'').toLowerCase();
 if(/\bresolved\b/.test(value))return{kind:'resolved',icon:'✓',label:'Resolved'};
 if(/\bin progress\b/.test(value))return{kind:'progress',icon:'↻',label:'In progress'};
 if(/\bverified\b/.test(value))return{kind:'verified',icon:'✓',label:'Verified'};
 return{kind:'general',icon:'•',label:'Update'};
}
function renderNotifications(){
 const all=S.notifs||[],unreadCount=all.filter(n=>!n.read).length,items=all.filter(n=>NOTIFICATION_FILTER!=='unread'||!n.read).slice().sort((a,b)=>new Date(b.at)-new Date(a.at));
 const groups=[NOTIFICATION_COPY.today,NOTIFICATION_COPY.yesterday,NOTIFICATION_COPY.earlier],rendered=groups.map(group=>{
  const rows=items.filter(n=>notificationDateGroup(n.at)===group);if(!rows.length)return'';
  return `<section class="notification-group" aria-labelledby="notification-group-${group.toLowerCase()}"><h3 id="notification-group-${group.toLowerCase()}">${esc(group)}</h3><div class="notification-list">${rows.map(n=>{
   const style=notificationStyle(n.msg),match=String(n.msg||'').match(/\bOF-\d{4}-\d{6}\b/),message=String(n.msg||'').replace(match?match[0]:'','').replace(/^\s*[:–—-]\s*/,'').trim()||String(n.msg||'');
   return `<button type="button" class="notification-row ${n.read?'':'is-unread'}" aria-label="${esc(NOTIFICATION_COPY.openLabel)}${n.read?'':', unread'}: ${esc(match?match[0]:NOTIFICATION_COPY.noReport)}. ${esc(message)}" onclick="openNotification(${Number(n.id)},${Number(n.rid)||0})"><span class="notification-status notification-${style.kind}" role="img" aria-label="${esc(style.label)}">${style.icon}</span><span class="notification-content"><span class="notification-topline"><strong>${esc(match?match[0]:NOTIFICATION_COPY.noReport)}</strong>${n.read?'':'<i class="notification-unread-dot" aria-label="Unread"></i>'}</span><span class="notification-message">${esc(message)}</span><time class="notification-time" datetime="${esc(n.at||'')}" title="${esc(fd(n.at))}">${esc(relativeNotificationTime(n.at))}</time></span><span class="notification-chevron" aria-hidden="true">›</span></button>`
  }).join('')}</div></section>`
 }).join('');
 const empty=items.length===0?`<div class="notification-empty"><span class="notification-empty-icon" aria-hidden="true">✓</span><h3>${esc(NOTIFICATION_COPY.emptyTitle)}</h3><p>${NOTIFICATION_FILTER==='unread'?'You have no unread notifications.':esc(NOTIFICATION_COPY.emptyText)}</p></div>`:'';
 $('app').innerHTML=`<section class="notification-page"><header class="page-heading"><div><p class="eyebrow">FIXIT UPDATES</p><h2>${esc(NOTIFICATION_COPY.title)}</h2><p class="mu">${esc(NOTIFICATION_COPY.description)}</p></div><button type="button" class="btn notification-mark-all" onclick="markAllNotificationsRead()" ${unreadCount?'':'disabled'}>${esc(NOTIFICATION_COPY.markAll)}</button></header><div class="notification-toolbar"><div class="tabs" role="group" aria-label="Filter notifications"><button type="button" class="btn ${NOTIFICATION_FILTER==='all'?'':'o'}" aria-pressed="${NOTIFICATION_FILTER==='all'}" onclick="setNotificationFilter('all')">${esc(NOTIFICATION_COPY.all)} (${all.length})</button><button type="button" class="btn ${NOTIFICATION_FILTER==='unread'?'':'o'}" aria-pressed="${NOTIFICATION_FILTER==='unread'}" onclick="setNotificationFilter('unread')">${esc(NOTIFICATION_COPY.unread)} (${unreadCount})</button></div><span class="notification-count" aria-live="polite">${unreadCount?`${unreadCount} unread`:''}</span></div>${rendered||empty}</section>`
}
function notifs(){if(!guard())return;renderNotifications()}
function setNotificationFilter(filter){NOTIFICATION_FILTER=filter==='unread'?'unread':'all';renderNotifications()}
async function openNotification(id,rid){
 const notification=(S.notifs||[]).find(n=>n.id===id);
 if(notification&&!notification.read){
  try{await api('notifs/read',{id});notification.read=true;nav()}
  catch(e){toast(e.message,'err');return}
 }
 if(rid)go('#/r/'+rid);else renderNotifications()
}
async function markAllNotificationsRead(){
 const button=document.querySelector('.notification-mark-all');if(button)button.disabled=true;
 try{await api('notifs/read',{});(S.notifs||[]).forEach(n=>{n.read=true});nav();renderNotifications();toast(NOTIFICATION_COPY.allRead,'ok')}
 catch(e){if(button)button.disabled=false;toast(e.message,'err')}
}
function mapV(){
 if(!guard(['admin','brgy','city']))return;
 const colors={RESOLVED:'#17633a',REJECTED:'#a32121'};
 if(reportMap){reportMap.remove();reportMap=null}
 markersLayer=null;
 allReports=visible(ME).map(r=>{
  const barangayRecord=S.barangays.find(b=>b.id===r.brgy),storedName=barangayRecord?.name||bname(r.brgy);
  const barangay=MAP_BARANGAYS.find(b=>normalizeMapBarangay(b.name)===normalizeMapBarangay(storedName))?.name||storedName;
  return{id:r.id,title:r.cat,description:r.desc,status:r.status,barangay,...reportCoordinates(r,barangay),code:r.code,category:r.cat,location:r.loc,reportId:r.id};
 });
 $('app').innerHTML=`<section class="card map-page"><header class="map-heading"><div><h2>Olongapo FixIt Map</h2><p class="mu">Explore report locations and open a marker for report details.</p></div><a class="btn o" href="#/reports">View reports</a></header><div class="map-barangay-filter"><label for="map-barangay">Filter by barangay</label><select id="map-barangay"><option>All Barangays</option>${MAP_BARANGAYS.map(b=>`<option value="${esc(b.name)}">${esc(b.name)}</option>`).join('')}</select></div><p id="map-empty" class="map-empty" role="status" aria-live="polite" hidden></p><div id="report-map" class="report-map" role="region" aria-label="Interactive map of Olongapo reports"></div><ul class="map-legend" aria-label="Report status legend"><li><span class="legend-dot active" aria-hidden="true"></span>Active</li><li><span class="legend-dot resolved" aria-hidden="true"></span>Resolved</li><li><span class="legend-dot rejected" aria-hidden="true"></span>Rejected</li></ul><p id="map-message" class="note" role="status" hidden>Map tiles could not be loaded. Check your internet connection and try again.</p></section>`;
 const selector=$('map-barangay');
 selector.value=selectedMapBarangay;
 selector.addEventListener('change',()=>filterMapByBarangay(selector.value));
 filterMapByBarangay(selectedMapBarangay);
 const el=$('report-map');if(!window.L||!el.clientWidth||!el.clientHeight)return;
 reportMap=L.map(el,{scrollWheelZoom:false}).setView([(BB[0]+BB[1])/2,(BB[2]+BB[3])/2],12);const tiles=addBaseLayer(reportMap);
 tiles.on('tileerror',()=>{$('map-message').hidden=false});
 markersLayer=L.layerGroup().addTo(reportMap);
 L.control.scale({imperial:false}).addTo(reportMap);
 // Apply the persisted selection after each map/data refresh; the initial selection is All Barangays.
 filterMapByBarangay(selectedMapBarangay);
 requestAnimationFrame(()=>reportMap&&reportMap.invalidateSize());
}
function filterMapByBarangay(selectedBarangay){
 // Keep the selection across refreshes and compare names without casing or whitespace differences.
 const requested=String(selectedBarangay||'All Barangays').trim()||'All Barangays';
 const canonical=MAP_BARANGAYS.find(b=>normalizeMapBarangay(b.name)===normalizeMapBarangay(requested));
 selectedMapBarangay=normalizeMapBarangay(requested)===normalizeMapBarangay('All Barangays')?'All Barangays':canonical?canonical.name:requested;
 const selector=$('map-barangay');if(selector)selector.value=selectedMapBarangay;
 const showAll=normalizeMapBarangay(selectedMapBarangay)===normalizeMapBarangay('All Barangays');
 const reports=showAll?allReports:allReports.filter(r=>normalizeMapBarangay(r.barangay)===normalizeMapBarangay(selectedMapBarangay));
 const empty=$('map-empty');
 // Clear only report overlays, leaving the basemap and controls in place.
 if(markersLayer)markersLayer.clearLayers();
 if(empty){empty.hidden=reports.length>0;empty.textContent=reports.length?'' : showAll?'No reports are available to show on the map yet.':'No reports in this barangay yet.'}
 if(!reportMap||!markersLayer)return reports;
 const points=[];
 // Redraw markers from the complete dataset so switching filters never loses reports.
 reports.forEach(r=>{
  if(!Number.isFinite(r.latitude)||!Number.isFinite(r.longitude))return;
  const position=[r.latitude,r.longitude];points.push(position);
  const color={RESOLVED:'#17633a',REJECTED:'#a32121'}[r.status]||'#8a4b00';
  const coordinates=r.isApprox?'—':`${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}`;
  const popup=`<strong>${esc(r.code)}</strong><br>${esc(r.title)}<br>${esc(r.barangay)}<p>${badge(r.status)}</p><p><b>Location:</b> ${esc(r.location||'—')}<br><b>Coordinates:</b> ${coordinates}${r.isApprox?' <small>(approx. barangay center)</small>':''}</p><a href="#/r/${r.reportId}">Open report details</a>`;
  L.circleMarker(position,{radius:9,color:'#fff',weight:2,fillColor:color,fillOpacity:.9}).addTo(markersLayer).bindPopup(popup);
 });
 // Focus filtered views on the barangay center; without a boundary, fit a single-point bound at its configured zoom.
 const barangay=MAP_BARANGAYS.find(b=>normalizeMapBarangay(b.name)===normalizeMapBarangay(selectedMapBarangay));
 if(!showAll&&barangay)reportMap.fitBounds([barangay.center],{maxZoom:barangay.zoom,padding:[30,30]});
 else if(points.length)reportMap.fitBounds(points,{padding:[30,30],maxZoom:14});
 else reportMap.fitBounds(MAP_BARANGAYS.map(b=>b.center),{padding:[30,30],maxZoom:13});
 return reports;
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
