/* Core: helpers, API client, navigation */
const $=s=>document.getElementById(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATS=['Broken Streetlight','Pothole','Damaged Road','Garbage Problem','Water Leak','Fallen Tree','Flooding','Blocked Drainage','Damaged Sidewalk','Damaged Public Facility','Road Obstruction','Other'];
const STAT=['SUBMITTED','UNDER REVIEW','VERIFIED','ASSIGNED','IN PROGRESS','RESOLVED','REJECTED'];
let S={barangays:[],depts:[],users:[],reports:[],notifs:[],logs:[]},P={stats:{},list:[]},ME=null;
function getCookie(n){const m=(document.cookie||'').split(/;\s*/).find(c=>c.startsWith(n+'='));return m?m.slice(n.length+1):''}
let CSRF_TOKEN=getCookie('csrf_token'),csrfPending=null;
async function refreshCSRFToken(){if(!csrfPending)csrfPending=(async()=>{let r;try{r=await fetch('/api/csrf/token',{cache:'no-store'})}catch(e){throw new Error('Cannot reach the server. Check your connection.')}let j;try{j=await r.json()}catch(e){j=null}if(!r.ok||!j||typeof j.csrfToken!=='string')throw new Error(j&&j.error||'Could not initialize a secure session. Refresh the page and try again.');CSRF_TOKEN=j.csrfToken})().finally(()=>{csrfPending=null});await csrfPending}
async function api(p,b){const o=b===undefined?{method:'GET',headers:{}}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)};let r,j;apiBusy++;ensureLoader();const l=$('api-loader');l.style.transform='scaleX(1)';try{if(o.method!=='GET'&&!CSRF_TOKEN)await refreshCSRFToken();if(o.method!=='GET')o.headers['X-CSRF-Token']=CSRF_TOKEN;const request=async()=>{try{return await fetch('/api/'+p,o)}catch(e){throw new Error('Cannot reach the server. Check your connection.')}};const read=async response=>{try{return await response.json()}catch(e){return{}}};r=await request();j=await read(r);if(o.method!=='GET'&&r.status===403&&/CSRF token missing or invalid/i.test(j.error||'')){CSRF_TOKEN='';await refreshCSRFToken();o.headers['X-CSRF-Token']=CSRF_TOKEN;r=await request();j=await read(r)}if(!r.ok)throw new Error(j.error||'Request failed ('+r.status+')');if(['login','register','logout'].includes(p))CSRF_TOKEN='';return j}finally{apiBusy--;if(apiBusy<=0)l.style.transform='scaleX(0)'}}
async function refresh(){const j=await api('state');S=j.S;ME=j.me?S.users.find(u=>u.id===j.me)||null:null;if(typeof syncChatSuggestions==='function')syncChatSuggestions()}
let toastTimer;
let apiBusy=0;
function ensureLoader(){if($('api-loader'))return;const d=document.createElement('div');d.id='api-loader';d.style.cssText='position:fixed;top:0;left:0;width:100%;height:3px;background:var(--pr);z-index:9999;transform:scaleX(0);transform-origin:left;transition:transform .2s';document.body.appendChild(d);}
function toast(m,type){const t=$('toast');t.textContent=m;t.className='toast show '+(type||'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.className='toast'},3800)}
async function guarded(f,mid,ok){try{await f();if(ok)toast(ok,'ok')}catch(e){const m=mid&&$(mid);if(m)m.textContent=e.message;toast(e.message,'err')}}
const uname=id=>id===0?'System':(S.users.find(u=>u.id===id)||{}).name||'—';
const bname=id=>(S.barangays.find(b=>b.id===id)||{}).name||'—';
const dname=id=>(S.depts.find(b=>b.id===id)||{}).name||'—';
function visible(u){if(!u)return[];const R=S.reports;
 if(u.role==='admin')return R;if(u.role==='brgy')return R.filter(r=>r.brgy===u.brgy);
 if(u.role==='city')return R.filter(r=>r.dept===u.dept||r.assignee===u.id);return R.filter(r=>r.uid===u.id)}
const can=r=>visible(ME).some(x=>x.id===r.id);
const staff=()=>ME&&['admin','brgy','city'].includes(ME.role);
const slug=s=>String(s).toLowerCase().replace(/[^a-z]+/g,'-');
const badge=s=>`<span class="bd s-${slug(s)}">${esc(s)}</span>`;
const fd=d=>d?new Date(d).toLocaleString('en-PH',{timeZone:'Asia/Manila',dateStyle:'medium',timeStyle:'short'}):'—';
const fdate=d=>d?new Date(d).toLocaleDateString('en-PH',{timeZone:'Asia/Manila',dateStyle:'medium'}):'—';
function go(h){location.hash=h}
function goto(h){if(location.hash===h)route();else location.hash=h}
const ROLE={admin:'Super Admin',brgy:'Barangay Official',city:'City Official',res:'Resident'};
const STAFF=[['Dashboard','#/dash'],['Reports','#/reports'],['Map','#/map'],['Analytics','#/analytics']];
const LINKS={admin:STAFF.concat([['People Map','#/people-map'],['Residents','#/residents'],['Barangays','#/barangays'],['Users','#/users'],['Chat Insights','#/chat-insights'],['Logs','#/logs']]),brgy:STAFF.concat([['People Map','#/people-map'],['Residents','#/residents']]),city:STAFF,res:[['Home','#/dash'],['Report a Problem','#/new'],['My Reports','#/reports'],['Track','#/track']]};
const PUBNAV=[['Home','#/'],['Track','#/track'],['Community','#/community'],['Login','#/login'],['Register','#/register']];
function nav(){
 const cur=location.hash||'#/',lk=(l,n)=>`<a class="lk ${cur===l[1]?'on':''}" href="${l[1]}"${cur===l[1]?' aria-current="page"':''}>${l[0]}${n?`<span class="n">${n}</span>`:''}</a>`;
 document.body.classList.toggle('auth',!!ME);document.body.classList.remove('menu');$('side').setAttribute('aria-label',ME?'Staff navigation':'');
 const burger=document.querySelector('.burger');if(burger){burger.setAttribute('aria-expanded','false');burger.setAttribute('aria-label','Open navigation menu')}
 if(ME){$('side').innerHTML=`<div class="sidehead"><b>${esc(ME.name)}</b><small>${ROLE[ME.role]}${ME.role==='brgy'&&ME.brgy?' · '+esc(bname(ME.brgy)):''}${ME.role==='city'&&ME.dept?' · '+esc(dname(ME.dept)):''}</small></div>`+LINKS[ME.role].map(l=>lk(l,l[1]==='#/residents'?pendingN():0)).join('')+lk(['Alerts','#/notifs'],unread())+'<a class="lk out" href="#/logout" onclick="return confirmLogout(event)">Log out</a>';$('pnav').innerHTML='';$('who').textContent=ME.name}
 else{$('side').innerHTML='';$('who').textContent='';$('pnav').innerHTML=PUBNAV.map(l=>`<a class="${cur===l[1]?'on':''}" href="${l[1]}"${cur===l[1]?' aria-current="page"':''}>${l[0]}</a>`).join('')}}
const unread=()=>ME?S.notifs.filter(n=>n.uid===ME.id&&!n.read).length:0;
function counts(R){const o={};STAT.forEach(s=>o[s]=R.filter(r=>r.status===s).length);return o}
function bars(o){const m=Math.max(1,...Object.values(o));return Object.entries(o).map(([k,v])=>`<div>${esc(k)}: ${v}</div><div class="bar"><i style="width:${Math.max(5,v/m*100)}%">${v}</i></div>`).join('')||'<p class="mu">No data</p>'}
function group(R,f){const o={};R.forEach(r=>{const k=f(r);o[k]=(o[k]||0)+1});return o}
function guard(roles){if(!ME){go('#/login');return false}if(roles&&!roles.includes(ME.role)){$('app').innerHTML='<div class="card err">Access denied.</div>';return false}return true}
function readImg(file,max){max=max||500;return new Promise((ok,no)=>{if(!file)return ok('');if(!/^image\/(jpeg|png|webp)$/.test(file.type))return no(new Error('Only JPG, PNG or WEBP images allowed.'));if(file.size>5e6)return no(new Error('Image must be under 5 MB.'));
 const fr=new FileReader();fr.onerror=()=>no(new Error('Could not read image.'));fr.onload=()=>{const i=new Image();i.onerror=()=>no(new Error('Invalid image.'));i.onload=()=>{const s=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*s;c.height=i.height*s;c.getContext('2d').drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.6))};i.src=fr.result};fr.readAsDataURL(file)})}
let PH='';
async function prev(id,pv,max){try{PH=await readImg($(id).files[0],max);$(pv).innerHTML=PH?`<img class="ph" src="${PH}">`:''}catch(e){PH='';$(pv).innerHTML='<span class="err">'+esc(e.message)+'</span>';$(id).value=''}}
function readDataURL(file){return new Promise((ok,no)=>{const fr=new FileReader();fr.onerror=()=>no(new Error('Could not read file.'));fr.onload=()=>ok(fr.result);fr.readAsDataURL(file)})}
const BB=[14.7500,14.9000,120.2000,120.4000];
const ALLOWED_BRGS=['Pag-asa','New Kalalake','West Tapinac'];
function allowedBarangays(){return S.barangays.filter(b=>ALLOWED_BRGS.includes(b.name)&&b.active);}
function tbl(R,full){return `<div class="card tw"><table><tr><th>Report ID</th><th>Category</th><th>Barangay</th>${full?'<th>Resident</th>':''}<th>Date</th><th>Status</th>${full?'<th>Assigned</th>':''}<th></th></tr>${R.map(r=>`<tr><td>${esc(r.code)}</td><td>${esc(r.cat)}</td><td>${esc(bname(r.brgy))}</td>${full?`<td>${esc(uname(r.uid))}</td>`:''}<td>${esc(fdate(r.created))}</td><td>${badge(r.status)}</td>${full?`<td>${esc(r.assignee?uname(r.assignee):r.dept?dname(r.dept):'—')}</td>`:''}<td><button class="btn" onclick="go('#/r/${r.id}')">View</button></td></tr>`).join('')||'<tr><td colspan="8" class="mu">No reports.</td></tr>'}</table></div>`}

/* Confirmation dialog (used for logout) */
let cfmPrev=null;
function closeConfirm(){const d=$('cfm');if(d){d.remove();document.removeEventListener('keydown',cfmKey,true)}if(cfmPrev&&cfmPrev.focus){try{cfmPrev.focus()}catch(e){}}cfmPrev=null}
function cfmKey(e){const d=$('cfm');if(!d)return;if(e.key==='Escape'){e.preventDefault();closeConfirm()}
 else if(e.key==='Tab'){const b=[$('cfm-no'),$('cfm-yes')],i=b.indexOf(document.activeElement);e.preventDefault();b[(i+(e.shiftKey?-1:1)+2)%2].focus()}}
function openConfirm(o){closeConfirm();cfmPrev=document.activeElement;const d=document.createElement('div');d.id='cfm';d.className='modal';
 d.innerHTML=`<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="cfm-t" aria-describedby="cfm-m"><h3 id="cfm-t">${esc(o.title)}</h3><p id="cfm-m">${esc(o.msg)}</p><div class="dlg-actions"><button type="button" class="btn o" id="cfm-no">${esc(o.no||'Cancel')}</button><button type="button" class="btn r" id="cfm-yes">${esc(o.yes||'Yes')}</button></div></div>`;
 d.addEventListener('click',e=>{if(e.target===d)closeConfirm()});document.body.appendChild(d);
 $('cfm-no').onclick=closeConfirm;$('cfm-yes').onclick=()=>{const f=o.onYes;cfmPrev=null;closeConfirm();f&&f()};
 document.addEventListener('keydown',cfmKey,true);$('cfm-no').focus()}
function confirmLogout(e){if(e)e.preventDefault();document.body.classList.remove('menu');openConfirm({title:'Log out?',msg:'Are you sure you want to log out?',yes:'Yes, Log Out',no:'Cancel',onYes:()=>{go('#/logout')}});return false}
