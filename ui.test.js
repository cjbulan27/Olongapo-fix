// UI smoke test (needs: npm i -D jsdom). Boots the server on a temp DB and drives the real pages.
const os=require('os'),path=require('path'),fs=require('fs');
process.env.PORT='0';process.env.DB_FILE=path.join(os.tmpdir(),`olongapo-fixit-ui-${process.pid}.db`);
for(const suffix of ['','-wal','-shm'])try{fs.unlinkSync(process.env.DB_FILE+suffix)}catch(e){}
const srv=require('./server.js'),{JSDOM,VirtualConsole}=require('jsdom'),assert=require('assert');
let base;const errors=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function open(){const jar={};const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/not implemented/i.test(e.message))errors.push('jsdom: '+e.message)});vc.on('error',m=>errors.push('console: '+m));
 const cookieStr=()=>{const cs=[];if(jar.c)cs.push(jar.c);if(jar.xcsrf)cs.push('csrf_token='+jar.xcsrf);return cs.join('; ')};
 const dom=await JSDOM.fromURL(base,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.fetch=async(u,o={})=>{const r=await fetch(new URL(u,base),{...o,headers:{...(o.headers||{}),cookie:cookieStr()}});const scs=r.headers.getSetCookie?r.headers.getSetCookie():[];for(const sc of scs){const c=sc.split(';')[0];if(c.startsWith('sid='))jar.c=c;else if(c.startsWith('csrf_token='))jar.xcsrf=c.slice(11);}return{ok:r.ok,status:r.status,json:()=>r.json()}};
  w.scrollTo=()=>{};w.alert=m=>errors.push('alert: '+m);w.confirm=()=>true;w.prompt=()=>'Newpass1';
  w.addEventListener('error',e=>errors.push('window: '+e.message))}});
 const w=dom.window;await until(()=>w.document.getElementById('app').innerHTML.length>50);return w}
async function until(f,t=4000){const s=Date.now();while(Date.now()-s<t){try{if(f())return}catch(e){}await sleep(40)}throw new Error('timeout: '+f)}
async function visit(w,h,allowErr){const before=w.document.getElementById('app').innerHTML;if(w.location.hash===h)w.route();else w.location.hash=h;await sleep(30);await until(()=>!w.document.getElementById('app').classList.contains('busy'));await sleep(60);
 const html=w.document.getElementById('app').innerHTML;assert(html.length>30,'empty page '+h);assert(allowErr||!/class="card err"/.test(html),'error page '+h+': '+html.slice(0,200));return html}
const $=(w,id)=>w.document.getElementById(id);
async function login(w,e,p){console.log('login',e,w.location.hash);await visit(w,'#/login');$(w,'le').value=e;$(w,'lp').value=p;try{await w.doLogin();console.log('doLogin completed, hash:',w.location.hash)}catch(err){console.log('doLogin error:',err.message)}try{await w.route();console.log('route completed, ME:',w.eval('ME'))}catch(err){console.log('route error:',err.message)}await until(()=>w.location.hash==='#/dash'&&w.eval('ME'));await sleep(200)}
(async()=>{
 if(!srv.listening)await new Promise((resolve,reject)=>{srv.once('listening',resolve);srv.once('error',reject)});
 base='http://127.0.0.1:'+srv.address().port+'/';
 // public
 let w=await open();for(const h of ['#/','#/track','#/community','#/login','#/register'])await visit(w,h);
 $(w,'tc')||await visit(w,'#/track');$(w,'tc').value='OF-2026-000001';await w.doTrack();await sleep(200);assert(/OF-2026-000001/.test($(w,'tr').innerHTML),'track');
 await visit(w,'#/dash');assert.equal(w.location.hash,'#/login','guard redirect');
 $(w,'le').value='admin@fixit.ph';$(w,'lp').value='wrong';await w.doLogin();await sleep(300);assert(/Invalid/.test($(w,'lm').textContent),'bad login msg');
 // admin
 w=await open();await login(w,'admin@fixit.ph','admin123');
 assert.equal($(w,'assistant-toggle'),null,'AI chat removed');
 assert($(w,'chat-toggle')&&$(w,'chat-panel').hidden,'chat assistant is available in the global shell');w.toggleChat(true);assert.equal($(w,'chat-panel').hidden,false,'chat panel opens');assert(/barangay clearance/i.test($(w,'chat-suggestions').textContent),'chat quick questions');w.toggleChat(false);
 assert(!/AI Queue|AI Performance/.test($(w,'side').textContent),'AI navigation removed');
 assert(/People Map/.test($(w,'side').textContent),'people map navigation');
 const peopleHtml=await visit(w,'#/people-map');assert(/All 3 Barangays/.test(peopleHtml)&&/Pag-asa/.test(peopleHtml)&&/Kalalake/.test(peopleHtml)&&/West Tapinac/.test(peopleHtml),'people map filters');assert(!/New Kalalake/.test(peopleHtml),'normalized Kalalake label');assert(/Residents/.test(peopleHtml)&&/Officials/.test(peopleHtml)&&/Search by name/.test(peopleHtml),'people map layers and search');assert(/Pag-asa:/.test($(w,'people-counts').textContent),'people map counts');
 $(w,'people-search').value='No matching person';$(w,'people-search').dispatchEvent(new w.Event('input'));assert.equal($(w,'people-empty').hidden,false,'people map empty state');
 for(const h of ['#/dash','#/reports','#/map','#/analytics','#/barangays','#/b/1','#/users','#/chat-insights','#/logs','#/notifs','#/r/1','#/r/3','#/residents'])await visit(w,h);
 await visit(w,'#/chat-insights');assert(/Common question topics/.test($(w,'app').textContent)&&/Verified service information/.test($(w,'app').textContent),'admin chat insights and service editor');$(w,'chat-service-name').value='UI Verified Service';$(w,'chat-service-requirements').value='Bring the form.';$(w,'chat-service-fee').value='No fee';$(w,'chat-service-hours').value='Weekdays';await w.saveChatService();await sleep(300);assert(/UI Verified Service/.test($(w,'app').textContent),'verified service saved');
 assert(!/AI Verification/.test(await visit(w,'#/r/1')),'AI report assessment removed');
 assert(/<svg/.test(await visit(w,'#/analytics')),'analytics graphs');
 assert(w.document.body.classList.contains('auth'),'sidebar layout');
 await visit(w,'#/barangays');$(w,'bn').value='UI Test Brgy';$(w,'bla').value='14.83';$(w,'blo').value='120.28';await w.addB();await sleep(400);assert(/UI Test Brgy/.test($(w,'app').innerHTML),'barangay added');
 await visit(w,'#/users');$(w,'on').value='UI Official';$(w,'oe').value='ui@x.ph';$(w,'opw').value='Secret12';$(w,'or').value='brgy';$(w,'ob').value='3';await w.addO();await sleep(400);assert(/ui@x.ph/.test($(w,'app').innerHTML),'official added');
 await w.rstU(7);await sleep(300);await w.togU(7);await sleep(300);await w.togU(7);await sleep(300);
 await visit(w,'#/reports');$(w,'fs').value='VERIFIED';w.applyF('');await sleep(100);assert(/OF-2026-000002/.test($(w,'app').innerHTML),'filter');
 await visit(w,'#/logout');await until(()=>!w.eval('ME'));
 // barangay official: full report lifecycle
 w=await open();await login(w,'pagasa@fixit.ph','demo123');
 for(const h of ['#/dash','#/reports','#/map','#/analytics','#/notifs','#/r/3'])await visit(w,h);
 assert(!/OF-2026-000005/.test(await visit(w,'#/reports')),'other barangay report visible');
 {const d=await visit(w,'#/dash');assert(/Barangay Pag-asa Dashboard/.test(d),'brgy dashboard');assert(!/West Tapinac|New Kalalake/.test(d),'brgy dashboard shows other barangays');assert(/<svg/.test(d),'dashboard graph');assert(/<svg/.test(await visit(w,'#/analytics')),'analytics graph');await visit(w,'#/residents');await visit(w,'#/resident/6');assert(/Ana Resident/.test($(w,'app').innerHTML),'resident detail');await visit(w,'#/resident/7',true);assert(/not found|access denied/i.test($(w,'app').innerHTML),'other barangay resident blocked')}
 await visit(w,'#/r/5',true);assert(/access denied|not found/i.test($(w,'app').innerHTML),'cross-barangay detail blocked');
 await visit(w,'#/r/3');$(w,'rm').value='Confirmed on site';await w.act(3,'VERIFIED');await sleep(500);assert(/VERIFIED/.test($(w,'app').innerHTML),'verified');
 $(w,'as').value='d1';await w.assign(3);await sleep(500);assert(/City Engineering/.test($(w,'app').innerHTML),'assigned');
 await w.act(3,'IN PROGRESS');await sleep(500);
 $(w,'rr').value='Fixed';await w.resolve(3);await sleep(300);assert(/photo are required|required/i.test($(w,'am').textContent),'resolve needs photo');
 await visit(w,'#/logout');await until(()=>!w.eval('ME'));
 // resident: submit + track
 w=await open();await login(w,'resident@fixit.ph','demo123');
 for(const h of ['#/dash','#/reports','#/new','#/notifs','#/track','#/r/1'])await visit(w,h);
 assert(!/AI Verification/.test(await visit(w,'#/r/1')),'resident report details omit AI assessment');
 await visit(w,'#/new');$(w,'nc').value='Pothole';$(w,'nd').value='Big pothole in front of the school gate';$(w,'nb').value='1';w.useBrgy();await w.subRep();await sleep(500);
 const ok=$(w,'app').innerHTML;assert(/successfully submitted/.test(ok),'submit: '+ok.slice(0,150));
 await visit(w,'#/new');assert.equal($(w,'nb').value,'1','own barangay preselected');$(w,'nb').value='';await w.subRep();await sleep(200);assert(/select a barangay/i.test($(w,'nm').textContent),'barangay required');
 await visit(w,'#/notifs');await sleep(100);
 // city + register
 w=await open();await login(w,'engineer@fixit.ph','demo123');for(const h of ['#/dash','#/reports','#/ai','#/map','#/analytics'])await visit(w,h);
 await visit(w,'#/users',true);assert(/Access denied/.test($(w,'app').innerHTML),'city blocked from users');
 const PX='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//aAAgBAQAAPwA=';
 w=await open();await visit(w,'#/register');assert(/Proof of residency/.test($(w,'app').innerHTML)&&/Pag-asa/.test($(w,'rb').innerHTML)&&!/Barretto/.test($(w,'rb').innerHTML),'register form');
 $(w,'rn').value='Reg User';$(w,'re').value='reg@x.ph';$(w,'rph').value='09170000000';$(w,'ra').value='30';$(w,'rbd').value='1996-01-01';$(w,'rgn').value='Male';$(w,'rad').value='5 Rizal Ave., Pag-asa';$(w,'rp').value='Abc12345';$(w,'rc').value='Abc12345';await w.doReg();await sleep(200);assert(/select your barangay/i.test($(w,'er-rb').textContent),'barangay required on register');
 $(w,'rb').value='1';await w.doReg();await sleep(200);assert(/proof of residency/i.test($(w,'er-rf').textContent),'proof required on register');
 w.eval("PH='"+PX+"'");await w.doReg();await until(()=>w.eval('ME'));
 assert(/Waiting for verification/.test(await visit(w,'#/dash')),'pending banner');assert(/Waiting for verification/.test(await visit(w,'#/new')),'pending cannot open report form');
 // official approves through the UI
 w=await open();await login(w,'pagasa@fixit.ph','demo123');await visit(w,'#/residents');assert(/Reg User/.test($(w,'app').innerHTML),'pending resident listed');
 const rid=w.eval("S.residents.find(r=>r.email==='reg@x.ph').id");await visit(w,'#/resident/'+rid);await w.reviewRes(rid,'approved');await sleep(500);assert(/Approved/.test($(w,'app').innerHTML),'approved');
 // verified resident can report; logout asks for confirmation
 w=await open();await login(w,'reg@x.ph','Abc12345');assert(/Submit Report/.test(await visit(w,'#/new')),'approved resident sees report form');
 w.confirmLogout();assert($(w,'cfm'),'logout confirmation shown');$(w,'cfm-no').click();assert(!$(w,'cfm')&&w.eval('ME'),'cancel keeps session');
 w.confirmLogout();$(w,'cfm-yes').click();await until(()=>!w.eval('ME'));
 console.log(errors.length?'ERRORS:\n'+errors.join('\n'):'no runtime errors');
 assert.equal(errors.length,0);console.log('UI TESTS PASSED');srv.close();process.exit(0)
})().catch(e=>{console.error('UI FAIL:',e.stack);console.error(errors.join('\n'));process.exit(1)});
