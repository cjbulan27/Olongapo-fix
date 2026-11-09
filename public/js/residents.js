/* Resident verification + dedicated barangay official dashboard */
const VL={pending:'Pending',approved:'Approved',rejected:'Rejected'};
const vbadge=s=>`<span class="bd s-${slug(s)}">${esc(VL[s]||s)}</span>`;
const pendingN=()=>ME&&['admin','brgy'].includes(ME.role)?(S.residents||[]).filter(r=>r.vstatus==='pending').length:0;
function resBanner(){
 if(!ME||ME.role!=='res'||ME.vstatus==='approved')return'';
 if(ME.vstatus==='rejected')return `<div class="banner bad" role="alert"><h3>Proof of residency not accepted</h3><p>${esc(ME.vrem||'Please upload a clearer proof of residency.')}</p>
  <label for="rsa">Complete address</label><input id="rsa" value="${esc(ME.address||'')}"><label for="rsf">New proof of residency (JPG/PNG/WEBP, max 5 MB)</label><input id="rsf" type="file" accept="image/*" onchange="prev('rsf','rspv',1000)"><div id="rspv"></div>
  <button class="btn" onclick="resubmit()">Submit again</button><p id="rsm" class="err" role="alert"></p></div>`;
 return `<div class="banner" role="status"><h3>Waiting for verification</h3><p>Officials of Barangay ${esc(bname(ME.brgy))} are checking your proof of residency. You can submit reports once you are approved.</p></div>`}
async function resubmit(){await guarded(async()=>{if(!PH)throw new Error('Upload your new proof of residency.');await api('resident/proof',{address:$('rsa').value,proof:PH});PH='';await refresh();dash()},'rsm','Proof submitted. Please wait for verification.')}

function pendingTable(L){return L.length?`<div class="card tw"><table><tr><th>Name</th><th>Age</th><th>Address</th><th>Submitted</th><th></th></tr>${L.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.age)}</td><td>${esc(r.address)}</td><td>${esc(fdate(r.created))}</td><td><a class="btn" href="#/resident/${r.id}">Review</a></td></tr>`).join('')}</table></div>`:'<div class="card"><p class="mu">No residents are waiting for verification.</p></div>'}
function brgyDash(){
 const R=visible(ME),c=counts(R),bn=bname(ME.brgy),review=c.SUBMITTED+c['UNDER REVIEW'],progress=c.VERIFIED+c.ASSIGNED+c['IN PROGRESS'],pend=(S.residents||[]).filter(x=>x.vstatus==='pending'),todo=R.filter(r=>['SUBMITTED','UNDER REVIEW'].includes(r.status)).slice(-5).reverse();
 $('app').innerHTML=`<header class="dash-header"><div><p class="eyebrow">Barangay ${esc(bn)} Official</p><h2>Barangay ${esc(bn)} Dashboard</h2><p class="dash-description">Only reports and residents of Barangay ${esc(bn)} are shown here.</p></div>
 <nav class="dash-actions" aria-label="Dashboard actions"><a class="btn" href="#/reports">View reports</a><a class="btn o" href="#/residents">Verify residents${pend.length?' ('+pend.length+')':''}</a><a class="btn o" href="#/map">Map</a></nav></header>
 <section class="dash-section"><div class="section-heading"><div><h3>Report overview</h3><p class="mu">Reports submitted in Barangay ${esc(bn)}.</p></div></div><div class="grid dash-kpis">${[['Total reports',R.length],['Awaiting review',review],['In progress',progress],['Resolved',c.RESOLVED]].map(x=>`<div class="card stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join('')}</div></section>
 <section class="dash-section"><div class="section-heading"><div><h3>Resident verification</h3><p class="mu">Check the proof of residency before residents can report.</p></div><a class="text-link" href="#/residents">View all residents</a></div>${pendingTable(pend.slice(0,5))}</section>
 <section class="dash-section"><div class="section-heading"><div><h3>Reports needing action</h3><p class="mu">Newest reports still waiting for your review.</p></div><a class="text-link" href="#/reports">View all reports</a></div>${todo.length?tbl(todo):'<div class="card"><p class="mu">Nothing is waiting for review.</p></div>'}</section>
 <section class="dash-section"><div class="section-heading"><div><h3>Report insights</h3><p class="mu">Graphs for Barangay ${esc(bn)} only.</p></div><a class="text-link" href="#/analytics">Full analytics</a></div>
 <div class="charts"><div class="card"><h4>By status</h4>${donutChart(group(R,r=>r.status),'Reports by status',statusColor)}</div><div class="card"><h4>By category</h4>${barChart(group(R,r=>r.cat),'Reports by category')}</div></div></section>`}

let RF='pending';
function setRF(f){RF=f;residents()}
function residents(){
 if(!guard(['admin','brgy']))return;const all=S.residents||[],ad=ME.role==='admin',L=all.filter(r=>RF==='all'||r.vstatus===RF),cnt=k=>k==='all'?all.length:all.filter(r=>r.vstatus===k).length;
 $('app').innerHTML=`<h2>Residents${ad?'':' of Barangay '+esc(bname(ME.brgy))}</h2><p class="mu">Review the proof of residency submitted during registration.</p>
 <div class="tabs" role="group" aria-label="Filter residents">${['pending','approved','rejected','all'].map(k=>`<button class="btn ${RF===k?'':'o'}" aria-pressed="${RF===k}" onclick="setRF('${k}')">${k[0].toUpperCase()+k.slice(1)} (${cnt(k)})</button>`).join('')}</div>
 <div class="card tw">${L.length?`<table><tr><th>Name</th><th>Age</th><th>Address</th>${ad?'<th>Barangay</th>':''}<th>Contact</th><th>Registered</th><th>Status</th><th></th></tr>${L.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.age??'—')}</td><td>${esc(r.address||'—')}</td>${ad?`<td>${esc(bname(r.brgy))}</td>`:''}<td>${esc(r.phone||r.email)}</td><td>${esc(fdate(r.created))}</td><td>${vbadge(r.vstatus)}</td><td><a class="btn o" href="#/resident/${r.id}">${r.vstatus==='pending'?'Review':'View'}</a></td></tr>`).join('')}</table>`:'<p class="mu">No residents in this list.</p>'}</div>`}
function residentDetail(id){
 if(!guard(['admin','brgy']))return;const r=(S.residents||[]).find(x=>x.id===id);
 if(!r){$('app').innerHTML='<div class="card err">Resident not found or access denied.</div>';return}
 $('app').innerHTML=`<p><a href="#/residents">← Back to residents</a></p><div class="card"><h2>${esc(r.name)} ${vbadge(r.vstatus)}</h2>
 <p><b>Barangay:</b> ${esc(bname(r.brgy))}<br><b>Age:</b> ${esc(r.age??'—')}<br><b>Address:</b> ${esc(r.address||'—')}<br><b>Email:</b> ${esc(r.email)}<br><b>Phone:</b> ${esc(r.phone||'—')}<br><b>Registered:</b> ${esc(fd(r.created))}</p>
 <h3>Proof of residency</h3>${r.hasproof?`<img class="proof" src="/api/img/p/${r.id}" alt="Proof of residency submitted by ${esc(r.name)}">`:'<p class="mu">No proof uploaded.</p>'}
 ${r.vstatus==='pending'?`<h3>Decision</h3><label for="rvr">Remarks (required when rejecting)</label><input id="rvr" maxlength="300"><button class="btn g" onclick="reviewRes(${r.id},'approved')">Approve</button><button class="btn r" onclick="reviewRes(${r.id},'rejected')">Reject</button><p id="rvm" class="err" role="alert"></p>`:`<p class="mu">Decision: <b>${esc(VL[r.vstatus])}</b>${r.vat?' on '+esc(fd(r.vat)):''}${r.vrem?' – '+esc(r.vrem):''}</p>`}</div>`}
async function reviewRes(id,d){await guarded(async()=>{await api('resident/review',{id,d,rem:$('rvr').value});await refresh();residentDetail(id)},'rvm',d==='approved'?'Resident approved.':'Resident rejected.')}
