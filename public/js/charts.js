/* Charts: small dependency-free SVG graphs (the CSP only allows our own scripts) */
const PAL=['#006b62','#d88700','#3b6fd4','#a32121','#7a4cc2','#17633a','#c2417a','#2a9d8f','#8a4b00','#5b6b7a','#e76f51','#4f8a10'];
const STC={'SUBMITTED':'#8a94a6','UNDER REVIEW':'#d88700','VERIFIED':'#3b6fd4','ASSIGNED':'#2a9d8f','IN PROGRESS':'#8a4b00','RESOLVED':'#17633a','REJECTED':'#a32121'};
const statusColor=k=>STC[k]||'#8a94a6';
const NODATA='<p class="mu">No data yet.</p>';
const clip=(s,n)=>{s=String(s);return s.length>n?s.slice(0,n-1)+'…':s};
const summary=e=>e.map(([k,v])=>k+': '+v).join(', ');
function niceStep(m){const raw=m/4,p=Math.pow(10,Math.floor(Math.log10(Math.max(raw,1)))),f=raw/p;return Math.max(1,(f<=1?1:f<=2?2:f<=5?5:10)*p)}
function donutChart(o,title,colorOf){
 const e=Object.entries(o).filter(x=>x[1]>0),t=e.reduce((a,x)=>a+x[1],0);if(!t)return NODATA;
 let acc=0;const col=(k,i)=>colorOf?colorOf(k,i):PAL[i%PAL.length];
 const seg=e.map(([k,v],i)=>{const p=v/t*100,s=`<circle cx="21" cy="21" r="15.9155" fill="none" stroke="${col(k,i)}" stroke-width="6" stroke-dasharray="${p.toFixed(3)} ${(100-p).toFixed(3)}" stroke-dashoffset="${(25-acc).toFixed(3)}"><title>${esc(k)}: ${v} (${Math.round(p)}%)</title></circle>`;acc+=p;return s}).join('');
 const lg=e.map(([k,v],i)=>`<li><i style="background:${col(k,i)}"></i><span>${esc(k)}</span><b>${v}</b><small>${Math.round(v/t*100)}%</small></li>`).join('');
 return `<figure class="chart donut"><svg viewBox="0 0 42 42" role="img" aria-label="${esc(title+' — '+summary(e))}">${seg}<text x="21" y="21.8" text-anchor="middle" class="ct">${t}</text><text x="21" y="26" text-anchor="middle" class="cs">total</text></svg><ul class="legend">${lg}</ul></figure>`}
function barChart(o,title,colorOf){
 const e=Object.entries(o);if(!e.length||!e.some(x=>x[1]>0))return NODATA;
 const W=Math.max(340,e.length*56+56),H=270,L=34,T=16,B=96,pw=W-L-10,ph=H-T-B,max=Math.max(1,...e.map(x=>x[1])),st=niceStep(max),top=Math.ceil(max/st)*st,bw=Math.min(44,pw/e.length*.62);
 let g='';for(let v=0;v<=top;v+=st){const y=T+ph-v/top*ph;g+=`<line x1="${L}" x2="${W-10}" y1="${y}" y2="${y}" class="gl"/><text x="${L-6}" y="${y+3.5}" text-anchor="end" class="ax">${v}</text>`}
 const bars=e.map(([k,v],i)=>{const cx=L+pw/e.length*(i+.5),h=v/top*ph,y=T+ph-h,c=colorOf?colorOf(k,i):PAL[0];
  return `<g><rect x="${(cx-bw/2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(h,0).toFixed(1)}" rx="3" fill="${c}"><title>${esc(k)}: ${v}</title></rect><text x="${cx.toFixed(1)}" y="${(y-4).toFixed(1)}" text-anchor="middle" class="val">${v}</text><text transform="translate(${cx.toFixed(1)},${T+ph+14}) rotate(-35)" text-anchor="end" class="ax">${esc(clip(k,18))}</text></g>`}).join('');
 return `<figure class="chart"><div class="chart-scroll"><svg viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W,520)}px" role="img" aria-label="${esc(title+' — '+summary(e))}">${g}${bars}</svg></div></figure>`}
function lineChart(o,title){
 const e=Object.entries(o);if(!e.length)return NODATA;
 const W=560,H=250,L=34,T=18,B=40,pw=W-L-16,ph=H-T-B,max=Math.max(1,...e.map(x=>x[1])),st=niceStep(max),top=Math.ceil(max/st)*st;
 const X=i=>e.length===1?L+pw/2:L+pw*i/(e.length-1),Y=v=>T+ph-v/top*ph;
 let g='';for(let v=0;v<=top;v+=st){g+=`<line x1="${L}" x2="${W-16}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="${L-6}" y="${Y(v)+3.5}" text-anchor="end" class="ax">${v}</text>`}
 const pts=e.map(([k,v],i)=>X(i).toFixed(1)+','+Y(v).toFixed(1)).join(' '),area=`${X(0).toFixed(1)},${Y(0)} ${pts} ${X(e.length-1).toFixed(1)},${Y(0)}`;
 const dots=e.map(([k,v],i)=>`<g><circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="4.5" fill="${PAL[0]}" stroke="#fff" stroke-width="1.5"><title>${esc(k)}: ${v}</title></circle><text x="${X(i).toFixed(1)}" y="${(Y(v)-9).toFixed(1)}" text-anchor="middle" class="val">${v}</text><text x="${X(i).toFixed(1)}" y="${H-T+4}" text-anchor="middle" class="ax">${esc(k)}</text></g>`).join('');
 return `<figure class="chart"><div class="chart-scroll"><svg viewBox="0 0 ${W} ${H}" style="min-width:420px" role="img" aria-label="${esc(title+' — '+summary(e))}">${g}<polygon points="${area}" fill="${PAL[0]}" opacity=".12"/>${e.length>1?`<polyline points="${pts}" fill="none" stroke="${PAL[0]}" stroke-width="2.5" stroke-linejoin="round"/>`:''}${dots}</svg></div></figure>`}
function monthly(R){
 const m={};R.forEach(r=>{const d=new Date(r.created);if(isNaN(d))return;const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');m[k]=(m[k]||0)+1});
 const ks=Object.keys(m).sort();if(!ks.length)return{};
 const [y0,m0]=ks[0].split('-').map(Number),[y1,m1]=ks[ks.length-1].split('-').map(Number),o={};
 for(let y=y0,mo=m0;y<y1||(y===y1&&mo<=m1);){const k=y+'-'+String(mo).padStart(2,'0');o[new Date(y,mo-1,1).toLocaleString('en',{month:'short',year:'numeric'})]=m[k]||0;mo++;if(mo>12){mo=1;y++}}
 return o}
