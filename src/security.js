'use strict';
const crypto=require('crypto');
const {get,run}=require('./db');
class HE extends Error{constructor(c,m){super(m);this.c=c}}
const bad=(m,c=400)=>{throw new HE(c,m)}
const errResp=(c,m)=>({ok:false,error:m,code:c});
const okResp=(d,m)=>{const o={ok:true,...d};if(m)o.message=m;return o};;
const hashPw=p=>{const s=crypto.randomBytes(16).toString('hex');return s+':'+crypto.scryptSync(p,s,32).toString('hex')};
const checkPw=(p,st)=>{const [s,h]=String(st).split(':');if(!s||!h)return false;const a=Buffer.from(h,'hex'),b=crypto.scryptSync(p,s,32);return a.length===b.length&&crypto.timingSafeEqual(a,b)};
const jpegOk=d=>{if(typeof d!=='string'||d.length>1200000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(d))return false;const b=Buffer.from(d.slice(23,60),'base64');return b[0]===0xFF&&b[1]===0xD8&&b[2]===0xFF};
const fileOk=d=>{if(typeof d!=='string'||d.length>7000000)return false;const m=d.match(/^data:([^;]+);base64,/);if(!m)return false;const i=d.indexOf(','),b=Buffer.from(d.slice(i+1,Math.min(d.length,i+1+16)),'base64');if(m[1]==='image/jpeg')return b[0]===0xFF&&b[1]===0xD8&&b[2]===0xFF;if(m[1]==='image/png')return b.length>=4&&b[0]===0x89&&b[1]===0x50&&b[2]===0x4E&&b[3]===0x47;if(m[1]==='application/pdf')return b.length>=4&&b[0]===0x25&&b[1]===0x50&&b[2]===0x44&&b[3]===0x46;return false};
const str=(v,min,max,label)=>{v=typeof v==='string'?v.trim():'';if(v.length<min||v.length>max)bad(v.length?label+' is too long (max '+max+' characters).':label+' is required.');return v};
const num=(v,a,b,l)=>{v=Number(v);if(!Number.isFinite(v)||v<a||v>b)bad(l+' is invalid.');return v};
function cookie(req,n){const m=(req.headers.cookie||'').split(/;\s*/).find(c=>c.startsWith(n+'='));return m?m.slice(n.length+1):null}
function authUser(req){const t=cookie(req,'sid');if(!t||!/^[a-f0-9]{64}$/.test(t))return null;const s=get('SELECT * FROM sessions WHERE tok=? AND exp>?',t,Date.now());if(!s)return null;const u=get('SELECT * FROM users WHERE id=? AND active=1',s.uid);return u||null}
function startSession(res,req,uid){const t=crypto.randomBytes(32).toString('hex');const ct=generateCSRFToken();run('DELETE FROM sessions WHERE exp<?',Date.now());run('INSERT INTO sessions VALUES(?,?,?)',t,uid,Date.now()+6048e5); const sec=(process.env.NODE_ENV==='production'||req.headers['x-forwarded-proto']==='https')?'; Secure':'';res.setHeader('Set-Cookie',[`sid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${sec}`,`csrf_token=${ct}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${sec}`]);return{t:t,c:ct}}
function regenerateSession(res,req,uid){const t=crypto.randomBytes(32).toString('hex');const ct=generateCSRFToken();run('DELETE FROM sessions WHERE uid=?',uid);run('DELETE FROM sessions WHERE exp<?',Date.now());run('INSERT INTO sessions VALUES(?,?,?)',t,uid,Date.now()+6048e5); const sec=(process.env.NODE_ENV==='production'||req.headers['x-forwarded-proto']==='https')?'; Secure':'';res.setHeader('Set-Cookie',[`sid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${sec}`,`csrf_token=${ct}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${sec}`]);return{t:t,c:ct}}
const need=(u,roles)=>{if(!u)bad('Please log in.',401);if(roles&&!roles.includes(u.role))bad('Access denied.',403);return u};
function isLocked(u){return !!(u.locked_until&&u.locked_until>Date.now())}
function recordFailure(u){const fa=Number(u.failed_attempts||0)+1;if(fa>=5)run('UPDATE users SET failed_attempts=?,locked_until=? WHERE id=?',fa,Date.now()+900000,u.id);else run('UPDATE users SET failed_attempts=? WHERE id=?',fa,u.id)}
function resetFailures(u){run('UPDATE users SET failed_attempts=0,locked_until=NULL WHERE id=?',u.id)}
function generateCSRFToken(){return crypto.randomBytes(32).toString('hex')}
function validateCSRFToken(req,token){const c=cookie(req,'csrf_token');if(!c||!token)return false;return c.length===token.length&&crypto.timingSafeEqual(Buffer.from(c,'hex'),Buffer.from(token,'hex'))}
function validatePassword(pw){if(typeof pw!=='string'||pw.length<8||pw.length>128)bad('Password must be 8-128 characters.');if(!/[A-Z]/.test(pw))bad('Password must contain at least one uppercase letter.');if(!/[a-z]/.test(pw))bad('Password must contain at least one lowercase letter.');if(!/[0-9]/.test(pw))bad('Password must contain at least one digit.');return pw}
const SCRIPT_RE=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_RE=/\s(on\w+)\s*=\s*("[^"]*"|'[^']*'|[^>\s]+)/gi;
function sanitizeHtml(s){if(typeof s!=='string')return s;let v=s.replace(SCRIPT_RE,'');v=v.replace(EVENT_RE,'');return v}
module.exports={HE,bad,hashPw,checkPw,jpegOk,fileOk,str,num,cookie,authUser,startSession,regenerateSession,need,isLocked,recordFailure,resetFailures,generateCSRFToken,validateCSRFToken,validatePassword,sanitizeHtml,errResp,okResp};
