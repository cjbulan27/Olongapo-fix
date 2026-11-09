'use strict';
const {all,get,run,tx,now,histAdd,notify}=require('./db');
const {bad}=require('./security');
const {MSG}=require('./config');
function createReport(d){return tx(()=>{
  const id=Number(run(`INSERT INTO reports(uid,cat,brgy,descr,photo,loc,lat,lng,status,created) VALUES(?,?,?,?,?,?,?,?,'UNDER REVIEW',?)`,d.uid,d.cat,d.brgy,d.desc,d.photo||null,d.loc||'',d.lat,d.lng,now()).lastInsertRowid);
  const code='OF-'+new Date().getFullYear()+'-'+String(id).padStart(6,'0');run('UPDATE reports SET code=? WHERE id=?',code,id);
  histAdd(id,'UNDER REVIEW','Report submitted and awaiting official review',d.uid);
  return {id,code}})}
function setStatus(r,s,rem,who){run('UPDATE reports SET status=?,resolved=CASE WHEN ?=\'RESOLVED\' THEN ? ELSE resolved END WHERE id=?',s,s,now(),r.id);histAdd(r.id,s,rem,who);notify(r.uid,r.id,`${r.code}: ${MSG[s]||s}`)}
const scope=u=>u.role==='admin'?['1=1',[]]:u.role==='brgy'?['brgy=?',[u.brgy]]:u.role==='city'?['(dept=? OR assignee=?)',[u.dept,u.id]]:['uid=?',[u.id]];
const RC='id,code,uid,cat,brgy,descr,loc,lat,lng,status,assignee,dept,created,resolved,(photo IS NOT NULL AND photo<>\'\') AS ph';
function getReport(u,id){const [w,p]=scope(u);const r=get(`SELECT * FROM reports WHERE id=? AND ${w}`,Number(id),...p);if(!r)bad('Report not found or access denied.',404);return r}
function shape(rows){if(!rows.length)return[];const ids=rows.map(r=>r.id),ph=ids.map(()=>'?').join(',');
  const grp=(sql)=>{const m={};all(sql,...ids).forEach(x=>(m[x.rid]=m[x.rid]||[]).push(x));return m};
  const H=grp(`SELECT rid,s,rem,who,at FROM hist WHERE rid IN(${ph}) AND s<>'AI ANALYZING' ORDER BY id`),E=grp(`SELECT id,rid,descr,who,at,(img IS NOT NULL AND img<>'') AS has FROM ev WHERE rid IN(${ph}) ORDER BY id`);
  return rows.map(r=>({id:r.id,code:r.code,uid:r.uid,cat:r.cat,brgy:r.brgy,desc:r.descr,photo:!!r.ph,loc:r.loc,lat:r.lat,lng:r.lng,status:r.status,assignee:r.assignee,dept:r.dept,created:r.created,resolved:r.resolved,
   hist:(H[r.id]||[]).map(h=>({s:h.s,rem:h.rem,by:h.who,at:h.at})),ev:(E[r.id]||[]).map(e=>({id:e.id,desc:e.descr,by:e.who,at:e.at,img:!!e.has}))}))}
const pub=x=>({id:x.id,name:x.name,role:x.role,pos:x.pos,brgy:x.brgy,dept:x.dept,active:!!x.active,vstatus:x.role==='res'?x.vstatus:undefined});
const RESQ="SELECT id,name,email,phone,age,address,brgy,vstatus,vrem,vat,created,(proof IS NOT NULL AND proof<>'') AS hasproof FROM users WHERE role='res'";
function state(u){const S={barangays:all('SELECT * FROM barangays ORDER BY id').map(b=>({...b,active:!!b.active})),depts:all('SELECT * FROM depts ORDER BY id').map(d=>({...d,active:!!d.active})),users:[],residents:[],reports:[],notifs:[],logs:[]};
  if(!u)return{me:null,S};
  const [w,p]=scope(u);S.reports=shape(all(`SELECT ${RC} FROM reports WHERE ${w} ORDER BY id`,...p));
  const m=new Map();all("SELECT * FROM users WHERE role IN('brgy','city')").forEach(x=>m.set(x.id,pub(x)));
  if(u.role==='admin')all('SELECT * FROM users ORDER BY id').forEach(x=>m.set(x.id,{...pub(x),email:x.email,phone:x.phone,created:x.created}));
  else{if(u.role!=='res')S.reports.forEach(r=>{if(!m.has(r.uid)){const x=get('SELECT * FROM users WHERE id=?',r.uid);if(x)m.set(x.id,pub(x))}});m.set(u.id,{...pub(u),email:u.email,phone:u.phone,created:u.created,age:u.age,address:u.address,vrem:u.vrem})}
  S.users=[...m.values()];
  S.notifs=all('SELECT id,uid,rid,msg,read,at FROM notifs WHERE uid=? ORDER BY id DESC LIMIT 100',u.id).map(n=>({...n,read:!!n.read}));
  if(u.role==='admin'||u.role==='brgy'){S.residents=(u.role==='admin'?all(RESQ+' ORDER BY id DESC'):all(RESQ+' AND brgy=? ORDER BY id DESC',u.brgy)).map(x=>({...x,hasproof:!!x.hasproof}))}
  if(u.role==='admin')S.logs=all('SELECT u,a,e,eid AS id,dsc,at FROM logs ORDER BY id DESC LIMIT 200');
  return{me:u.id,S}}
module.exports={createReport,setStatus,scope,RC,getReport,shape,pub,state};
