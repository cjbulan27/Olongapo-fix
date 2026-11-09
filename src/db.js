'use strict';
const path=require('path');
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(process.env.DB_FILE||path.join(__dirname,'..','fixit.db'));
db.exec(`PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS barangays(id INTEGER PRIMARY KEY,name TEXT UNIQUE NOT NULL,address TEXT,contact TEXT,lat REAL NOT NULL,lng REAL NOT NULL,active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS depts(id INTEGER PRIMARY KEY,name TEXT UNIQUE NOT NULL,active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,pw TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN('admin','brgy','city','res')),pos TEXT,brgy INTEGER REFERENCES barangays(id),dept INTEGER REFERENCES depts(id),phone TEXT,active INTEGER DEFAULT 1,created TEXT,age INTEGER,address TEXT,proof TEXT,vstatus TEXT DEFAULT 'approved',vrem TEXT,vat TEXT);
CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY,code TEXT UNIQUE,uid INTEGER NOT NULL REFERENCES users(id),cat TEXT NOT NULL,brgy INTEGER NOT NULL REFERENCES barangays(id),descr TEXT NOT NULL,photo TEXT,loc TEXT,lat REAL,lng REAL,status TEXT NOT NULL,assignee INTEGER REFERENCES users(id),dept INTEGER REFERENCES depts(id),created TEXT,resolved TEXT);
CREATE TABLE IF NOT EXISTS hist(id INTEGER PRIMARY KEY,rid INTEGER NOT NULL REFERENCES reports(id),s TEXT,rem TEXT,who INTEGER,at TEXT);
CREATE TABLE IF NOT EXISTS ev(id INTEGER PRIMARY KEY,rid INTEGER NOT NULL REFERENCES reports(id),img TEXT,descr TEXT,who INTEGER,at TEXT);
CREATE TABLE IF NOT EXISTS notifs(id INTEGER PRIMARY KEY,uid INTEGER NOT NULL,rid INTEGER,msg TEXT,read INTEGER DEFAULT 0,at TEXT);
CREATE TABLE IF NOT EXISTS logs(id INTEGER PRIMARY KEY,u INTEGER,a TEXT,e TEXT,eid TEXT,dsc TEXT,at TEXT);
CREATE TABLE IF NOT EXISTS sessions(tok TEXT PRIMARY KEY,uid INTEGER NOT NULL,exp INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS chat_services(id INTEGER PRIMARY KEY,name TEXT NOT NULL UNIQUE COLLATE NOCASE,requirements TEXT NOT NULL,fee TEXT NOT NULL,office_hours TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,updated TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS chat_topic_stats(topic TEXT PRIMARY KEY,count INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS chat_feedback_stats(topic TEXT NOT NULL,vote TEXT NOT NULL CHECK(vote IN('up','down')),count INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(topic,vote));
CREATE INDEX IF NOT EXISTS ix_r_b ON reports(brgy);CREATE INDEX IF NOT EXISTS ix_r_u ON reports(uid);CREATE INDEX IF NOT EXISTS ix_sessions_exp ON sessions(exp);CREATE INDEX IF NOT EXISTS ix_reports_created ON reports(created);CREATE INDEX IF NOT EXISTS ix_reports_status ON reports(status);CREATE INDEX IF NOT EXISTS ix_notifs_uid ON notifs(uid);CREATE INDEX IF NOT EXISTS ix_hist_rid ON hist(rid);CREATE INDEX IF NOT EXISTS ix_logs_at ON logs(at);CREATE INDEX IF NOT EXISTS ix_reports_cat ON reports(cat);CREATE INDEX IF NOT EXISTS ix_reports_uid_status ON reports(uid,status);CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);CREATE INDEX IF NOT EXISTS ix_users_role_brgy ON users(role,brgy);CREATE INDEX IF NOT EXISTS ix_users_role_dept ON users(role,dept);CREATE INDEX IF NOT EXISTS ix_ev_rid ON ev(rid);CREATE INDEX IF NOT EXISTS ix_notifs_uid_read ON notifs(uid,read);`);
db.exec("UPDATE reports SET status='UNDER REVIEW' WHERE status='AI ANALYZING'");
{const have=db.prepare('PRAGMA table_info(users)').all().map(c=>c.name);
  [['age','INTEGER'],['address','TEXT'],['proof','TEXT'],['dob','TEXT'],['gender','TEXT'],['failed_attempts','INTEGER DEFAULT 0'],['locked_until','INTEGER'],['vstatus',"TEXT DEFAULT 'approved'"],['vrem','TEXT'],['vat','TEXT']].forEach(([n,t])=>{if(!have.includes(n))db.exec(`ALTER TABLE users ADD COLUMN ${n} ${t}`)})}
const nn=v=>v===undefined?null:v;
const all=(s,...p)=>db.prepare(s).all(...p.map(nn)),get=(s,...p)=>db.prepare(s).get(...p.map(nn)),run=(s,...p)=>db.prepare(s).run(...p.map(nn));
const count=(s,...p)=>{const r=db.prepare(s).get(...p.map(nn));return r?Number(Object.values(r)[0]):0};
const paginate=(s,countSql,limit,offset,...p)=>{const rows=all(s,...p.map(nn),limit,offset);const total=count(countSql,...p.map(nn));return{rows,total,limit,offset}};
let depth=0;const tx=f=>{if(depth){return f()}depth=1;db.exec('BEGIN');try{const r=f();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}finally{depth=0}};
const now=()=>new Date().toISOString();
function log(u,a,e,eid,dsc){run('INSERT INTO logs(u,a,e,eid,dsc,at) VALUES(?,?,?,?,?,?)',u,a,e,String(eid),dsc,now())}
function notify(uid,rid,msg){if(uid)run('INSERT INTO notifs(uid,rid,msg,at) VALUES(?,?,?,?)',uid,rid,msg,now())}
function histAdd(rid,s,rem,who){run('INSERT INTO hist(rid,s,rem,who,at) VALUES(?,?,?,?,?)',rid,s,rem,who,now())}
module.exports={db,nn,all,get,run,tx,now,count,paginate,log,notify,histAdd};
