/* Public pages: home, track, community, login, register */
function home(){const st=P.stats||{};
 const reports=[['Total reports',st.total],['Resolved',st.resolved],['Open now',st.active],['Barangays reached',st.barangays]];
 $('app').innerHTML=`<div class="civic-home">
 <section class="signal-hero" aria-labelledby="home-title">
   <div class="signal-copy reveal"><p class="kicker">Olongapo City · Community desk</p><h1 id="home-title">Small reports.<br><em>Visible change.</em></h1><p class="hero-lede">Spot a problem on your street? Put it on the city’s radar and follow every handoff through to resolution.</p>
   <div class="hero-actions"><a class="signal-cta" href="#/new">Report an issue <span aria-hidden="true">→</span></a><a class="signal-link" href="#/track">Track a report <span aria-hidden="true">↗</span></a></div>
   <p class="quiet-promise">No call queue. No guessing. Your report gets a reference number instantly.</p></div>
   <aside class="signal-board reveal" aria-label="Community report activity"><div class="board-top"><span class="live-dot"></span> LIVE CITY SIGNAL</div><div class="board-number">${st.active??0}</div><p>issues currently moving through review and repair</p><div class="signal-lines" aria-hidden="true"><i></i><i></i><i></i><i></i></div><a href="#/community">See community reports <span aria-hidden="true">→</span></a></aside>
   <div class="hero-grid" aria-hidden="true"></div>
 </section>
 <section class="report-pulse" aria-labelledby="pulse-title"><div class="pulse-heading"><p class="kicker">The city, in motion</p><h2 id="pulse-title">Every report leaves a trail.</h2></div><div class="pulse-stats">${reports.map((x,i)=>`<div class="pulse-stat reveal" style="--i:${i}"><b>${x[1]??0}</b><span>${x[0]}</span></div>`).join('')}</div></section>
 <section class="route-section" aria-labelledby="route-title"><div class="route-intro"><p class="kicker">From sidewalk to solution</p><h2 id="route-title">One clear route.<br>Six accountable steps.</h2><p>FixIt sends each report to the people who can move it forward — while you stay in the loop.</p>${ME?'<a class="text-action" href="#/dash">Open my dashboard <span aria-hidden="true">→</span></a>':'<a class="text-action" href="#/register">Create a resident account <span aria-hidden="true">→</span></a>'}</div><ol class="report-route">${[['01','You flag it','Add a photo, location, and a quick description.'],['02','We check it','Initial verification keeps reports useful and focused.'],['03','It reaches the right desk','Barangay and city teams can review and assign it.'],['04','You see the outcome','Follow status updates until the work is complete.']].map((x,i)=>`<li class="reveal" style="--i:${i}"><span>${x[0]}</span><div><h3>${x[1]}</h3><p>${x[2]}</p></div></li>`).join('')}</ol></section>
 <section class="category-section" aria-labelledby="category-title"><div><p class="kicker">Make your neighborhood legible</p><h2 id="category-title">What needs attention?</h2></div><div class="category-cloud">${CATS.map((c,i)=>`<a class="category-tag tag-${i%4}" href="#/new" aria-label="Report ${esc(c)}">${esc(c)} <span aria-hidden="true">↗</span></a>`).join('')}</div></section>
 <section class="home-close"><p>Olongapo works better when the street-level details have somewhere to go.</p><a class="signal-cta light" href="#/new">Start a report <span aria-hidden="true">→</span></a></section>
 </div>`}
function track(){$('app').innerHTML=`<div class="card authbox" data-enter="doTrack" style="max-width:640px"><h2>Track a Report</h2><p class="mu">Enter the report ID you received when you submitted (example: OF-2026-000001).</p><input id="tc" placeholder="OF-2026-000001"><button class="btn" onclick="doTrack()">Track</button><div id="tr"></div></div>`}
async function doTrack(){const c=$('tc').value.trim();await guarded(async()=>{const r=await api('track?code='+encodeURIComponent(c));
 $('tr').innerHTML=r.found?`<h3>${esc(r.code)}</h3><p>${esc(r.cat)} · ${esc(r.brgy)} · ${esc(fd(r.created))}</p>${badge(r.status)}<ul class="tl">${r.hist.map(h=>`<li><b>${esc(h.s)}</b> <small>${esc(fd(h.at))}</small></li>`).join('')}</ul>${r.resolution?'<p class="ok">Resolution: '+esc(r.resolution)+'</p>':''}`:'<p class="err">No report found with that ID.</p>'},'tr')}
function community(){$('app').innerHTML=`<div class="card"><h2>Community Reports</h2><div class="tw"><table><tr><th>Category</th><th>Barangay</th><th>General location</th><th>Status</th><th>Date</th></tr>${P.list.map(r=>`<tr><td>${esc(r.cat)}</td><td>${esc(r.brgy)}</td><td>Brgy. ${esc(r.brgy)}</td><td>${badge(r.status)}</td><td>${esc(fdate(r.date))}</td></tr>`).join('')}</table></div></div>`}
const DEMOS=[['Super Admin','admin@fixit.ph','admin123'],['Pag-asa Official','pagasa@fixit.ph','demo123'],['New Kalalake Official','newkalalake@fixit.ph','demo123'],['West Tapinac Official','westtapinac@fixit.ph','demo123'],['City Official','engineer@fixit.ph','demo123'],['Resident','resident@fixit.ph','demo123']];
function fillDemo(e,p){$('le').value=e;$('lp').value=p;$('lp').focus()}
function login(){$('app').innerHTML=`<div class="authbox card" data-enter="doLogin"><h2>Welcome back</h2><p class="mu">Log in to report problems or manage reports.</p>
 <label for="le">Email</label><input id="le" type="email" autocomplete="username"><label for="lp">Password</label><input id="lp" type="password" autocomplete="current-password">
 <button class="btn block" onclick="doLogin()">Log in</button><p id="lm" class="err" role="alert"></p><p class="mu">New here? <a href="#/register">Create an account</a></p>
 <details class="demo"><summary>Try a demo account</summary><div class="chips">${DEMOS.map(d=>`<button class="chip" onclick="fillDemo('${d[1]}','${d[2]}')">${d[0]}</button>`).join('')}</div></details></div>`;$('le').focus()}
async function doLogin(){$('lm').textContent='';await guarded(async()=>{await api('login',{email:$('le').value,password:$('lp').value});toast('Welcome back!','ok');goto('#/dash')},'lm')}
function register(){PH='';const B=allowedBarangays();
 $('app').innerHTML=`<div class="reg-page">
  <div class="reg-card" data-enter="doReg">
   <header class="reg-header">
    <div class="reg-brand">Olongapo <b>FixIt</b></div>
    <h1 class="reg-title">Create your resident account</h1>
    <p class="reg-subtitle">Join Olongapo FixIt to report community problems, track their progress, and receive updates from your barangay officials. All information you provide will be verified before your account is activated.</p>
   </header>
   <form id="regForm" novalidate>
    <section class="reg-section">
     <div class="reg-section-head">
      <h2 class="reg-section-title"><span class="reg-sec-icon">👤</span>Personal Information</h2>
      <p class="reg-section-desc">Tell us about yourself so we can create your account.</p>
     </div>
     <div class="reg-cols">
      <div class="reg-field">
       <label class="reg-label"><span class="reg-icon">👤</span>Complete Name<span class="reg-req" aria-hidden="true">*</span></label>
       <input id="rn" type="text" placeholder="Juan Dela Cruz" autocomplete="name" required>
       <p class="reg-err" id="er-rn"></p>
      </div>
      <div class="reg-field">
       <label class="reg-label"><span class="reg-icon">✉️</span>Email Address<span class="reg-req" aria-hidden="true">*</span></label>
       <input id="re" type="email" placeholder="juan@example.com" autocomplete="email" required>
       <p class="reg-err" id="er-re"></p>
      </div>
      <div class="reg-field">
       <label class="reg-label"><span class="reg-icon">📞</span>Contact Number<span class="reg-req" aria-hidden="true">*</span></label>
       <input id="rph" type="tel" placeholder="0917 000 0000" autocomplete="tel" required>
       <p class="reg-err" id="er-rph"></p>
      </div>
      <div class="reg-field">
       <label class="reg-label"><span class="reg-icon">🎂</span>Age<span class="reg-req" aria-hidden="true">*</span></label>
       <input id="ra" type="number" min="13" max="120" inputmode="numeric" placeholder="25" required>
       <p class="reg-err" id="er-ra"></p>
      </div>
      <div class="reg-field">
       <label class="reg-label"><span class="reg-icon">📅</span>Date of Birth<span class="reg-req" aria-hidden="true">*</span></label>
       <input id="rbd" type="date" required>
       <p class="reg-err" id="er-rbd"></p>
      </div>
      <div class="reg-field">
       <label class="reg-label"><span class="reg-icon">⚧</span>Gender<span class="reg-req" aria-hidden="true">*</span></label>
       <select id="rgn" required>
        <option value="">Select gender</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
        <option>Prefer not to say</option>
       </select>
       <p class="reg-err" id="er-rgn"></p>
      </div>
     </div>
    </section>
    <section class="reg-section">
     <div class="reg-section-head">
      <h2 class="reg-section-title"><span class="reg-sec-icon">🏠</span>Residential Information</h2>
      <p class="reg-section-desc">Where do you live? This helps us assign your reports to the right barangay.</p>
     </div>
     <div class="reg-cols">
      <div class="reg-field full">
       <label class="reg-label"><span class="reg-icon">🏠</span>Complete Residential Address<span class="reg-req" aria-hidden="true">*</span></label>
       <input id="rad" type="text" placeholder="House no., street, purok / zone, barangay" autocomplete="street-address" required>
       <p class="reg-err" id="er-rad"></p>
      </div>
      <div class="reg-field full">
       <label class="reg-label"><span class="reg-icon">📍</span>Barangay<span class="reg-req" aria-hidden="true">*</span></label>
       <select id="rb" required>
        <option value="">Select your barangay…</option>${B.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('')}
       </select>
       <p class="reg-hint">Your barangay officials will verify your residency.</p>
       <p class="reg-err" id="er-rb"></p>
      </div>
     </div>
    </section>
    <section class="reg-section">
     <div class="reg-section-head">
      <h2 class="reg-section-title"><span class="reg-sec-icon">📄</span>Proof of residency</h2>
      <p class="reg-section-desc">Upload a document that proves you live in your selected barangay.</p>
     </div>
     <div class="reg-cols">
      <div class="reg-field full">
       <label class="reg-label"><span class="reg-icon">📎</span>Upload Document<span class="reg-req" aria-hidden="true">*</span></label>
       <div class="reg-upload" id="regUpload">
        <input id="rf" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.pdf" onchange="regFile(this)">
        <div class="reg-dropzone">
         <div class="reg-drop-icon">📎</div>
         <div class="reg-drop-text"><strong>Click to upload</strong> or drag your file here</div>
         <div class="reg-drop-hint">Accepted: JPG, JPEG, PNG, PDF · Max 5 MB</div>
        </div>
        <div class="reg-file-preview" id="regFilePreview">
         <div class="reg-file-item" id="regFileItem" style="display:none">
          <span class="reg-file-icon">📄</span>
          <span class="reg-file-name" id="regFileName">No file selected</span>
          <button type="button" class="reg-file-remove" onclick="regRemove()" aria-label="Remove uploaded file">Remove</button>
         </div>
        </div>
       </div>
       <p class="reg-hint">This document is used for residency verification by your barangay officials. Examples: Barangay Certificate, Certificate of Residency, or a utility bill showing your address.</p>
       <p class="reg-err" id="er-rf"></p>
      </div>
     </div>
    </section>
    <section class="reg-section">
     <div class="reg-section-head">
      <h2 class="reg-section-title"><span class="reg-sec-icon">🔐</span>Account Security</h2>
      <p class="reg-section-desc">Create a secure password to protect your account.</p>
     </div>
     <div class="reg-cols">
      <div class="reg-field full">
       <label class="reg-label"><span class="reg-icon">🔒</span>Password<span class="reg-req" aria-hidden="true">*</span></label>
       <div class="reg-pass-wrap">
        <input id="rp" type="password" autocomplete="new-password" placeholder="At least 6 characters" required>
        <button type="button" class="reg-pass-toggle" onclick="regToggle('rp')" aria-label="Show password" aria-pressed="false">👁️</button>
       </div>
       <p class="reg-hint" id="regPassReq">At least 6 characters</p>
       <p class="reg-strength" id="regStrength"></p>
       <p class="reg-err" id="er-rp"></p>
      </div>
      <div class="reg-field full">
       <label class="reg-label"><span class="reg-icon">🔁</span>Confirm Password<span class="reg-req" aria-hidden="true">*</span></label>
       <div class="reg-pass-wrap">
        <input id="rc" type="password" autocomplete="new-password" placeholder="Enter your password again" required>
        <button type="button" class="reg-pass-toggle" onclick="regToggle('rc')" aria-label="Show password" aria-pressed="false">👁️</button>
       </div>
       <p class="reg-err" id="er-rc"></p>
      </div>
     </div>
    </section>
    <div class="reg-actions">
     <button type="button" class="reg-btn" id="regBtn" onclick="doReg()">Create Account</button>
     <p class="reg-link">Already registered? <a href="#/login">Log in</a></p>
    </div>
   </form>
  </div>
 </div>`;$('rn').focus();
 const up=$('regUpload');
 up.ondragover=e=>{e.preventDefault();up.classList.add('reg-drag')};
 up.ondragleave=e=>{e.preventDefault();up.classList.remove('reg-drag')};
 up.ondrop=e=>{e.preventDefault();up.classList.remove('reg-drag');const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(f)regSetFile(f)}}
async function regSetFile(file){const item=$('regFileItem'),name=$('regFileName');if(!file){PH='';item.style.display='none';name.textContent='No file selected';return}if(!/^image\/(jpeg|png|webp)$|^application\/pdf$/.test(file.type)){toast('Only JPG, JPEG, PNG or PDF files are allowed.','err');return}if(file.size>5e6){toast('File must be under 5 MB.','err');return}try{PH=await readDataURL(file);item.style.display='flex';name.textContent=file.name+' · '+(file.size/1024).toFixed(0)+' KB'}catch(e){PH='';item.style.display='none';toast(e.message,'err')}}
function regFile(inp){regSetFile(inp.files[0]);}
function regRemove(){const inp=$('rf');inp.value='';regSetFile(null);}
function regToggle(id){const i=$(id),b=i.parentElement.querySelector('.reg-pass-toggle');const show=i.type!=='password';i.type=show?'text':'password';b.setAttribute('aria-pressed',show);b.textContent=show?'🙈':'👁️';}
function regClear(){['rn','re','rph','ra','rbd','rgn','rad','rb','rf','rp','rc'].forEach(id=>{const e=$('er-'+id);if(e)e.textContent=''})}
function regErr(field,msg){const e=$('er-'+field);if(e)e.textContent=msg}
async function doReg(){const btn=$('regBtn');regClear();if(!$('rn').value.trim()){regErr('rn','Please enter your complete name.');$('rn').focus();return}if(!$('re').value.trim()){regErr('re','Please enter your email address.');$('re').focus();return}if(!/^\S+@\S+\.\S+$/.test($('re').value.trim())){regErr('re','Please enter a valid email address.');$('re').focus();return}if(!$('rph').value.trim()){regErr('rph','Please enter your contact number.');$('rph').focus();return}const age=Number($('ra').value);if(!$('ra').value||!Number.isInteger(age)||age<13||age>120){regErr('ra','Please enter a valid age between 13 and 120.');$('ra').focus();return}if(!$('rbd').value){regErr('rbd','Please enter your date of birth.');$('rbd').focus();return}if(!$('rgn').value){regErr('rgn','Please select your gender.');$('rgn').focus();return}if(!$('rad').value.trim()){regErr('rad','Please enter your complete residential address.');$('rad').focus();return}if(!$('rb').value){regErr('rb','Please select your barangay.');$('rb').focus();return}if(!PH){regErr('rf','Please upload your proof of residency.');$('rf').focus();return}if($('rp').value.length<6){regErr('rp','Password must be at least 6 characters.');$('rp').focus();return}if($('rp').value!==$('rc').value){regErr('rc','Passwords do not match.');$('rc').focus();return}btn.disabled=true;btn.innerHTML='<span class="reg-loader"></span> Creating account…';try{await api('register',{name:$('rn').value.trim(),email:$('re').value.trim().toLowerCase(),phone:$('rph').value.trim(),age:+$('ra').value,dob:$('rbd').value,gender:$('rgn').value,address:$('rad').value.trim(),brgy:+$('rb').value,proof:PH,password:$('rp').value});PH='';btn.innerHTML='<span class="reg-ok">✓</span> Account created!';toast('Account created successfully. Your registration is pending barangay verification.','ok');setTimeout(()=>{goto('#/dash');btn.disabled=false;btn.innerHTML='Create Account';},1200)}catch(e){btn.disabled=false;btn.innerHTML='Create Account';const msg=e.message||'Registration failed. Please try again.';if(/email already/i.test(msg)){regErr('re',msg);$('re').focus()}else if(/proof/i.test(msg)){regErr('rf',msg);$('rf').focus()}else if(/barangay/i.test(msg)){regErr('rb',msg);$('rb').focus()}else if(/age/i.test(msg)){regErr('ra',msg);$('ra').focus()}else toast(msg,'err')}}
