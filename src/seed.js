'use strict';
const {tx,run,get,all,now,log}=require('./db');
const {hashPw}=require('./security');
const {createReport,setStatus}=require('./reports');
function seed(){if(get('SELECT id FROM users LIMIT 1'))return;tx(()=>{
 const B=[['Pag-asa',14.8350,120.2810],['New Kalalake',14.8240,120.2890],['West Tapinac',14.8290,120.2840]];
 B.forEach(b=>run('INSERT INTO barangays(name,address,contact,lat,lng) VALUES(?,?,?,?,?)',b[0],'Brgy. '+b[0]+', Olongapo City','(047) 222-0010',b[1],b[2]));
 ['City Engineering Office','Public Services Office','Environment Office','Disaster Risk Reduction and Management Office','General Services Office'].forEach(n=>run('INSERT INTO depts(name) VALUES(?)',n));
 const U=(n,e,p,r,pos,b,d)=>run('INSERT INTO users(name,email,pw,role,pos,brgy,dept,phone,created) VALUES(?,?,?,?,?,?,?,?,?)',n,e,hashPw(p),r,pos,b,d,'09170000000',now());
 const RES=(n,e,b,age,addr)=>run('INSERT INTO users(name,email,pw,role,pos,brgy,phone,age,address,vstatus,vat,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',n,e,hashPw('demo123'),'res','Resident',b,'09170000000',age,addr,'approved',now(),now());
 U('Super Admin','admin@fixit.ph','admin123','admin','System Admin');
 U('Juan Dela Cruz','pagasa@fixit.ph','demo123','brgy','Barangay Captain',1);U('Maria Santos','newkalalake@fixit.ph','demo123','brgy','Barangay Captain',2);U('Lito Ramos','westtapinac@fixit.ph','demo123','brgy','Barangay Captain',3);
 U('Pedro Reyes','engineer@fixit.ph','demo123','city','City Government Official',null,1);
 RES('Ana Resident','resident@fixit.ph',1,29,'12 Rizal Ave., Brgy. Pag-asa, Olongapo City');RES('Ben Resident','ben@fixit.ph',3,34,'45 Magsaysay Dr., Brgy. West Tapinac, Olongapo City');RES('Carlo Resident','carlo@fixit.ph',2,41,'8 Gordon Ave., Brgy. New Kalalake, Olongapo City');
 const RU={1:6,2:8,3:7};
 const ex=[['Pothole',1,'Large pothole near the barangay road entrance that vehicles avoid.','RESOLVED'],['Broken Streetlight',1,'Streetlight beside the road is damaged, the whole street is dark.','VERIFIED'],['Broken Streetlight',1,'Another streetlight bulb broken near the court, dark at night.','UNDER REVIEW'],['Garbage Problem',2,'Garbage piling up near the market, waste overflowing.','IN PROGRESS'],['Water Leak',3,'Pipe leak, water flowing on the street.','UNDER REVIEW'],['Flooding',1,'Flood water after rain not draining, canal clogged.','UNDER REVIEW'],['Blocked Drainage',2,'Drainage canal beside the road is clogged with trash.','UNDER REVIEW'],['Broken Streetlight',3,'Streetlight lamp not working near the corner.','UNDER REVIEW']];
 ex.forEach((e,i)=>{const b=B[e[1]-1],off=e[1]+1,c=createReport({uid:RU[e[1]],cat:e[0],brgy:e[1],desc:e[2],loc:'Near main road, Brgy '+b[0],lat:b[1]+(i%3)*0.0004,lng:b[2]+(i%2)*0.0004}),r=get('SELECT * FROM reports WHERE id=?',c.id);
  if(e[3]!=='UNDER REVIEW'){setStatus(r,e[3]==='RESOLVED'||e[3]==='IN PROGRESS'?'VERIFIED':e[3],'Demo data',off);if(e[3]==='IN PROGRESS'||e[3]==='RESOLVED')setStatus(r,'IN PROGRESS','Demo data',off);if(e[3]==='RESOLVED'){run('INSERT INTO ev(rid,descr,who,at) VALUES(?,?,?,?)',r.id,'Pothole filled and leveled.',off,now());setStatus(r,'RESOLVED','Pothole filled and leveled.',off)}}});
 all('SELECT id,status FROM reports ORDER BY id').forEach(r=>{const t=Date.now()-(9-r.id)*11*864e5;run('UPDATE reports SET created=? WHERE id=?',new Date(t).toISOString(),r.id);if(r.status==='RESOLVED')run('UPDATE reports SET resolved=? WHERE id=?',new Date(t+30*36e5).toISOString(),r.id)});
 log(0,'SEED','system',0,'Demo data created')})}
module.exports={seed};
