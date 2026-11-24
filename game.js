(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const canvas = $("scene"), ctx = canvas.getContext("2d");
  const BALLS = [
    {name:"Papel amassado",short:"Papel",mass:.055,restitution:.18,hardness:.25,color:"#c7b99f",light:"#f2e7d4",dark:"#625747",xp:1000,desc:"Levíssima e quase sem elasticidade."},
    {name:"Plástico rígido",short:"Plástico",mass:.12,restitution:.48,hardness:.55,color:"#54b9c9",light:"#b7f5f5",dark:"#145568",xp:2600,desc:"Mais rígida, recupera parte da energia."},
    {name:"Borracha",short:"Borracha",mass:.16,restitution:.82,hardness:.38,color:"#e0a34c",light:"#ffe3a1",dark:"#75401e",xp:6200,desc:"Alta elasticidade: quica por muito mais tempo."},
    {name:"Madeira maciça",short:"Madeira",mass:.42,restitution:.32,hardness:1.1,color:"#a66b3d",light:"#e7b47d",dark:"#4d2b19",xp:13500,desc:"Mais densa, com quique moderado."},
    {name:"Vidro temperado",short:"Vidro",mass:.36,restitution:.58,hardness:1.65,color:"#72c9d5",light:"#e0ffff",dark:"#1a5868",xp:29000,desc:"Rígida e dura, com impacto concentrado."},
    {name:"Alumínio",short:"Alumínio",mass:.78,restitution:.42,hardness:2.3,color:"#a9b8c4",light:"#f3f8fc",dark:"#465665",xp:61000,desc:"Metal leve, porém muito mais rígido."},
    {name:"Ferro",short:"Ferro",mass:1.45,restitution:.28,hardness:3.5,color:"#788995",light:"#dce5eb",dark:"#27343f",xp:128000,desc:"Alta densidade e impacto pesado."},
    {name:"Aço",short:"Aço",mass:1.8,restitution:.34,hardness:5.4,color:"#9aa9b7",light:"#f1f7fc",dark:"#354451",xp:270000,desc:"Liga resistente, pesada e rígida."},
    {name:"Tungstênio",short:"Tungstênio",mass:3.2,restitution:.22,hardness:8.5,color:"#66717e",light:"#c9d2db",dark:"#202833",xp:560000,desc:"Extremamente denso. Impacto brutal."}
  ];
  const PLATES = [
    {name:"Papelão prensado",hp:900,hardness:"Muito baixa",color:"#9b754e",top:"#c9a477",side:"#63452f",reward:1},
    {name:"Madeira macia",hp:2600,hardness:"Baixa",color:"#95613a",top:"#c18a59",side:"#59371f",reward:2},
    {name:"Pinus seco",hp:6200,hardness:"Baixa",color:"#a87848",top:"#d0a16d",side:"#654329",reward:3},
    {name:"Calcário",hp:14500,hardness:"Média",color:"#8d9291",top:"#c3c7c3",side:"#565e60",reward:4},
    {name:"Granito",hp:34000,hardness:"Alta",color:"#737c83",top:"#aeb8bd",side:"#424c55",reward:6},
    {name:"Cobre",hp:76000,hardness:"Alta",color:"#a96745",top:"#dc956c",side:"#663b2b",reward:8},
    {name:"Ferro fundido",hp:165000,hardness:"Muito alta",color:"#687680",top:"#a0afb8",side:"#37434c",reward:11},
    {name:"Aço temperado",hp:360000,hardness:"Muito alta",color:"#657d91",top:"#b1c6d5",side:"#354958",reward:15},
    {name:"Titânio",hp:820000,hardness:"Extrema",color:"#778b9b",top:"#c5d5e0",side:"#3b4d5a",reward:21},
    {name:"Diamante bruto",hp:1900000,hardness:"Extrema",color:"#398b9d",top:"#8de0e8",side:"#174957",reward:30}
  ];
  const UPGRADES = [
    {id:"power",name:"Potência",icon:"↗",desc:"Aumenta o dano de cada impacto.",base:35,growth:1.65,max:30},
    {id:"mass",name:"Massa extra",icon:"◉",desc:"Adiciona massa efetiva à esfera.",base:55,growth:1.72,max:20},
    {id:"precision",name:"Ponta de impacto",icon:"✦",desc:"Concentra energia no ponto de contato.",base:90,growth:1.85,max:15}
  ];
  const SPECIALS = [
    {id:"gold",name:"Esfera dourada",desc:"Gera 25% mais moedas por dano.",price:650,glow:"#e6b94d",bonus:"Moedas +25%"},
    {id:"charged",name:"Esfera carregada",desc:"Chance de 12% de causar um impacto crítico.",price:1100,glow:"#62d6ee",bonus:"Crítico 12%"},
    {id:"heavy",name:"Núcleo pesado",desc:"Aumenta em 18% a energia inicial da queda.",price:1800,glow:"#bb8bff",bonus:"Energia +18%"}
  ];
  const SAVE_VERSION = 3;
  const defaultState = () => ({saveVersion:SAVE_VERSION,coins:0,ballIndex:0,plateIndex:0,xp:0,power:0,mass:0,precision:0,specials:[],sound:true,totalDamage:0});
  let state = loadState(), plateHp = 0, plateMax = 0, plateEarned = 0, ball = null, particles = [], cracks = [], floating = [], trails = [], rings = [], anim = 0, lastTime = 0, running = false, bounce = 0, shake = 0, toastTimer = 0;
  const G = 1780, FLOOR = 0;
  function loadState(){try{const saved=JSON.parse(localStorage.getItem("bolacai-save")||"null");if(!saved||typeof saved!=="object")return defaultState();if((saved.saveVersion||0)<SAVE_VERSION){const fresh=defaultState();localStorage.setItem("bolacai-save",JSON.stringify(fresh));return fresh}return {...defaultState(),...saved,saveVersion:SAVE_VERSION}}catch{return defaultState()}}
  function save(){state.saveVersion=SAVE_VERSION;localStorage.setItem("bolacai-save",JSON.stringify(state))}
  function currentBall(){return BALLS[Math.min(state.ballIndex,BALLS.length-1)]}
  function currentPlate(){const last=PLATES[PLATES.length-1];if(state.plateIndex<PLATES.length)return PLATES[state.plateIndex];const extra=state.plateIndex-PLATES.length+1;return {...last,name:"Liga "+(extra+1)+" de "+last.name,hp:Math.round(last.hp*Math.pow(1.72,extra)),reward:Math.round(last.reward*Math.pow(1.22,extra)),hardness:"Extrema"}}
  function fmt(n){return Math.floor(n).toLocaleString("pt-BR")}
  function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2300)}
  function ballStyle(el,b){el.style.background='radial-gradient(circle at 30% 24%,'+b.light+' 0,'+b.color+' 43%,'+b.dark+' 100%)';el.style.borderColor=b.light}
  function upgradeCost(u){return Math.floor(u.base*Math.pow(u.growth,state[u.id]))}
  function render(){
    const b=currentBall(),p=currentPlate();$("coins").textContent=fmt(state.coins);if($("coinsHome"))$("coinsHome").textContent=fmt(state.coins);$("plateName").textContent=p.name;$("plateHardness").textContent="Resistência "+p.hardness.toLowerCase();$("plateLevel").textContent=String(state.plateIndex+1).padStart(2,"0");$("ballName").textContent=b.name;$("ballLevel").textContent="NÍVEL "+(state.ballIndex+1);
    const next=BALLS[state.ballIndex+1];$("nextBallName").textContent=next?"Próxima: "+next.name:"Última evolução desbloqueada";$("evolutionText").textContent=next?fmt(state.xp)+" / "+fmt(next.xp)+" XP de impacto":"Todas as bolas desbloqueadas";$("xpBar").style.width=(next?Math.min(100,state.xp/next.xp*100):100)+"%";
    ballStyle($("miniBall"),b);ballStyle($("evolutionBall"),b);
    const pct=plateMax?plateHp/plateMax*100:100;$("plateHealthText").textContent=Math.ceil(pct)+"%";$("plateHealthBar").style.width=Math.max(0,pct)+"%";$("plateEarnings").innerHTML="+"+fmt(plateEarned)+' <small>¢</small>';
    $("upgradeList").innerHTML=UPGRADES.map(u=>{const cost=upgradeCost(u),lv=state[u.id],max=lv>=u.max;return '<article class="upgrade-item"><div class="upgrade-head"><span class="upgrade-icon">'+u.icon+'</span><div><strong>'+u.name+'</strong><small>NÍVEL '+lv+'/'+u.max+'</small></div></div><p class="upgrade-desc">'+u.desc+'</p><button class="buy-button" data-upgrade="'+u.id+'" '+(max||state.coins<cost?'disabled':'')+'><span>'+(max?'MÁXIMO':'MELHORAR')+'</span><span>'+(max?'✓':fmt(cost)+' ¢')+'</span></button></article>'}).join("");
    $("specialShop").innerHTML=SPECIALS.map(s=>{const owned=state.specials.includes(s.id);return '<article class="special-item" style="--glow:'+s.glow+'"><strong>'+s.name+'</strong><p>'+s.desc+'</p><button data-special="'+s.id+'" '+(owned||state.coins<s.price?'disabled':'')+'>'+(owned?'ADQUIRIDA':fmt(s.price)+' ¢  •  '+s.bonus)+'</button></article>'}).join("");
  }
  function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
  function dims(){const w=canvas.clientWidth,h=canvas.clientHeight;return {w,h,cx:w/2,ground:h*.78,scale:Math.min(w/390,1.5)}}
  function startDrop(){
    if(running)return;if(plateHp<=0){plateMax=currentPlate().hp;plateHp=plateMax;state.plateHp=plateHp;save();render()}running=true;bounce=0;particles=[];floating=[];trails=[];rings=[];cracks=[];shake=0;
    const d=dims(),b=currentBall(),mass=b.mass*(1+state.mass*.12),speed=640*(1+state.power*.045)*(state.specials.includes("heavy")?1.18:1);
    ball={x:d.cx,y:38,vx:0,vy:0,r:Math.max(17,Math.min(27,20+b.mass*2)),mass,restitution:Math.max(.08,Math.min(.9,b.restitution)),active:true,angle:0,spin:0,material:b,impactEnergy:0,squash:0,impactFlash:0};
    $("dropButton").disabled=true;$("sceneStatus").textContent="QUEDA INICIADA";ball.vy=speed;lastTime=performance.now();anim=requestAnimationFrame(loop);
  }
  function addCrack(x,y,amount){const count=Math.min(12,2+Math.floor(amount/25));for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,len=10+Math.random()*32;cracks.push({x,y,a,len,life:1})}}
  function burst(x,y,color,count,force=1){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=(60+Math.random()*260)*force;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,life:.55+Math.random()*.65,max:.9,size:2+Math.random()*5,color,rot:Math.random()*6,vr:(Math.random()-.5)*8})}}
  function playImpact(){if(!state.sound)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ac=playImpact.ac||(playImpact.ac=new AC());if(ac.state==="suspended")ac.resume();const osc=ac.createOscillator(),gain=ac.createGain();osc.type="triangle";osc.frequency.setValueAtTime(115,ac.currentTime);osc.frequency.exponentialRampToValueAtTime(48,ac.currentTime+.11);gain.gain.setValueAtTime(.12,ac.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.13);osc.connect(gain);gain.connect(ac.destination);osc.start();osc.stop(ac.currentTime+.14)}catch(e){}}
  function hit(){
    const b=ball.material,p=currentPlate(),impactSpeed=Math.abs(ball.vy);bounce++;playImpact();ball.vy= -impactSpeed*ball.restitution;ball.vx=Math.max(-125,Math.min(125,ball.vx+Math.sin(bounce*1.37)*Math.min(34,impactSpeed*.025)));ball.spin+=Math.sign(ball.vx||1)*(.55+impactSpeed*.0008);ball.squash=Math.min(.34,impactSpeed/4200);ball.impactFlash=.18;shake=Math.min(22,7+impactSpeed/75);const flash=$("gameFlash");if(flash){flash.classList.remove("impact");void flash.offsetWidth;flash.classList.add("impact")}rings.push({x:ball.x,y:dims().ground-8,r:ball.r,life:.42,max:.42,color:b.light});
    const kinetic=.5*ball.mass*Math.pow(impactSpeed,2);
    let raw=(kinetic*.0012)*(1+b.hardness*.35)*(1+state.power*.17)*(1+state.precision*.24);
    if(state.specials.includes("charged")&&Math.random()<.12){raw*=2.7;toast("IMPACTO CRÍTICO!")}
    const damage=Math.max(0,Math.min(plateHp,raw));plateHp-=damage;state.plateHp=plateHp;state.totalDamage+=damage;state.xp+=damage;const coins=damage*p.reward*.12*(state.specials.includes("gold")?1.25:1);state.coins+=coins;plateEarned+=coins;
    $("lastDamage").textContent="-"+fmt(damage);$("bounceCount").textContent=bounce;$("sceneStatus").textContent=damage>0?"IMPACTO REGISTRADO":"ENERGIA INSUFICIENTE";
    const d=dims();addCrack(ball.x,d.ground-8,damage);burst(d.cx,d.ground-8,p.top,Math.min(52,14+Math.floor(damage/7)),Math.min(2.5,.9+damage/100));floating.push({x:d.cx+16,y:d.ground-32,text:"-"+fmt(damage),life:1,color:"#ffd08a"});render();
    const next=BALLS[state.ballIndex+1];if(next&&state.xp>=next.xp){state.ballIndex++;state.xp=0;toast("BOLA EVOLUIU: "+currentBall().name.toUpperCase());burst(d.cx,d.ground-80,currentBall().light,36,1.5);save();render()}
    save();if(plateHp<=0){breakPlate();return}
    if(Math.abs(ball.vy)<75 && bounce>=1){const d2=dims();ball.vy=0;ball.vx*=.25;ball.active=false;ball.y=d2.ground-12-ball.r;burst(ball.x,d2.ground-9,"#b9d7df",12,.45);floating.push({x:ball.x,y:ball.y-24,text:"QUIQUE FINAL",life:1.1,color:"#8de4e8"});$( "sceneStatus" ).textContent="ESFERA ESTABILIZADA";setTimeout(finishDrop,650)}
  }
  function breakPlate(){
    if(ball)ball.active=false;
    const d=dims(),p=currentPlate();burst(d.cx,d.ground-10,p.top,70,2.2);for(let i=0;i<18;i++)particles.push({x:d.cx+(Math.random()-.5)*190,y:d.ground-10,vx:(Math.random()-.5)*500,vy:-100-Math.random()*420,life:1.1,max:1.1,size:5+Math.random()*13,color:[p.top,p.color,p.side][i%3],rot:Math.random()*6,vr:(Math.random()-.5)*9,rect:true});
    $("sceneStatus").textContent="PLACA DESTRUÍDA";plateHp=0;render();setTimeout(()=>{state.plateIndex++;plateMax=currentPlate().hp;plateHp=plateMax;state.plateHp=plateHp;plateEarned=0;save();cracks=[];toast("NOVA PLACA: "+currentPlate().name.toUpperCase());finishDrop()},950)
  }
  function finishDrop(){running=false;if(ball){ball.active=false;ball.vy=0;ball.vx=0;const d=dims();ball.y=d.ground-12-ball.r}$("dropButton").disabled=false;$("sceneStatus").textContent="SISTEMA PRONTO";save();render();draw()}
  function loop(now){if(!running)return;const dt=Math.min(.032,(now-lastTime)/1000||.016);lastTime=now;const d=dims();if(ball&&ball.active){ball.vy+=G*dt;ball.y+=ball.vy*dt;ball.x+=ball.vx*dt;ball.angle+=ball.spin*dt;ball.vx*=Math.pow(.992,dt*60);ball.squash=Math.max(0,ball.squash-dt*1.8);ball.impactFlash=Math.max(0,ball.impactFlash-dt);trails.push({x:ball.x,y:ball.y,r:ball.r,life:.24,max:.24,color:ball.material.light});if(trails.length>18)trails.shift();const floor=d.ground-12;if(ball.y+ball.r>=floor&&ball.vy>0){ball.y=floor-ball.r;hit()}}updateEffects(dt);draw();if(running)anim=requestAnimationFrame(loop)}
  function updateEffects(dt){trails=trails.filter(t=>t.life>0);trails.forEach(t=>t.life-=dt);rings=rings.filter(r=>r.life>0);rings.forEach(r=>{r.life-=dt;r.r+=150*dt});particles=particles.filter(p=>p.life>0);particles.forEach(p=>{p.life-=dt;p.vy+=700*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt});floating=floating.filter(f=>f.life>0);floating.forEach(f=>{f.life-=dt;f.y-=34*dt});shake*=Math.pow(.02,dt)}
  function roundedRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r)}
  function drawBall(x,y,r,b,angle=0,squash=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    const isPaper=b.short==="Papel";
    const deform=isPaper?Math.min(.22,squash*.75):Math.min(.12,squash*.55);
    ctx.scale(1+deform*.45,1-deform);
    const grad=ctx.createRadialGradient(-r*.34,-r*.42,r*.06,0,0,r*1.2);
    grad.addColorStop(0,b.light);grad.addColorStop(.42,b.color);grad.addColorStop(1,b.dark);
    ctx.fillStyle=grad;
    if(isPaper){
      const pts=[[-.12,-1], [.42,-.91], [.79,-.62], [.98,-.17], [.83,.35], [.58,.78], [.08,.96], [-.48,.82], [-.88,.48], [-1,.02], [-.72,-.55], [-.42,-.84]];
      ctx.beginPath();pts.forEach((p,i)=>{const px=p[0]*r,py=p[1]*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)});ctx.closePath();ctx.fill();
      ctx.strokeStyle="#fff8";ctx.lineWidth=1.4;ctx.stroke();
      ctx.save();ctx.clip();
      const folds=[
        [-.88,-.42,-.34,-.28,.08,-.76],[-.72,.35,-.22,.08,.18,.7],[-.42,-.88,-.08,-.35,.48,-.52],
        [-.08,-.68,.25,-.18,.86,-.32],[-.86,.02,-.32,.38,.02,.92],[-.18,.82,.22,.36,.78,.7],
        [.12,-.98,.36,-.55,.92,-.62],[-.58,-.65,-.12,-.5,.35,-.2],[.02,.08,.42,.28,.9,.12]
      ];
      folds.forEach((q,i)=>{ctx.beginPath();ctx.moveTo(q[0]*r,q[1]*r);ctx.quadraticCurveTo(q[2]*r,q[3]*r,q[4]*r,q[5]*r);ctx.strokeStyle=i%2?"#695b49aa":"#fff9";ctx.lineWidth=i%3===0?2.6:1.5;ctx.stroke()});
      const crumples=[[-.45,-.42,.25], [.4,-.48,.2],[-.48,.48,.22],[.48,.42,.24],[.04,.04,.19]];
      crumples.forEach((p,i)=>{const rg=ctx.createRadialGradient(p[0]*r,p[1]*r,1,p[0]*r,p[1]*r,p[2]*r);rg.addColorStop(0,i%2?"#fff9":"#51463866");rg.addColorStop(1,"#ffffff00");ctx.fillStyle=rg;ctx.beginPath();ctx.arc(p[0]*r,p[1]*r,p[2]*r,0,Math.PI*2);ctx.fill()});
      ctx.restore();
      ctx.strokeStyle="#4f463a88";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-r*.8,r*.22);ctx.lineTo(-r*.35,r*.08);ctx.lineTo(-r*.12,r*.4);ctx.stroke();
    }else{
      ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#ffffff66";ctx.lineWidth=1.3;ctx.stroke();
      ctx.save();ctx.beginPath();ctx.arc(0,0,r*.94,0,Math.PI*2);ctx.clip();
      if(b.short==="Plástico"){
        ctx.strokeStyle="#e8ffff99";ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,0,r*.72,-2.5,.7);ctx.stroke();
        ctx.fillStyle="#ffffff33";ctx.beginPath();ctx.ellipse(-r*.28,-r*.45,r*.3,r*.12,-.5,0,Math.PI*2);ctx.fill();
      }else if(b.short==="Borracha"){
        ctx.strokeStyle="#fff8";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*.68,-1.4,1.1);ctx.stroke();
        ctx.strokeStyle="#0003";ctx.beginPath();ctx.arc(0,0,r*.82,.4,2.5);ctx.stroke();
      }else if(b.short==="Madeira"){
        for(let i=-2;i<=2;i++){ctx.strokeStyle=i%2?"#42281466":"#f5c18a88";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-r,r*i*.28);ctx.quadraticCurveTo(0,r*(i*.28+.12),r,r*(i*.28-.04));ctx.stroke()}
      }else if(["Vidro","Alumínio","Ferro","Aço","Tungstênio"].includes(b.short)){
        ctx.fillStyle="#ffffff38";ctx.beginPath();ctx.moveTo(-r*.75,-r*.45);ctx.lineTo(-r*.12,-r*.85);ctx.lineTo(r*.5,-r*.28);ctx.lineTo(r*.12,r*.08);ctx.closePath();ctx.fill();
        ctx.strokeStyle="#ffffff55";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-r*.55,r*.55);ctx.lineTo(r*.45,-r*.45);ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  function draw(){const {w,h,cx,ground}=dims();ctx.clearRect(0,0,w,h);ctx.save();if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    const glow=ctx.createRadialGradient(cx,ground,8,cx,ground,w*.48);glow.addColorStop(0,"#5c879044");glow.addColorStop(1,"#0b111900");ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle="#91b6c51a";ctx.lineWidth=1;for(let y=35;y<ground-35;y+=38){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}for(let x=cx%42;x<w;x+=42){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,ground-20);ctx.stroke()}
    ctx.fillStyle="#a6c5d11a";ctx.fillRect(0,ground+38,w,1);
    const p=currentPlate(),pw=Math.min(w*.62,310),ph=34,px=cx-pw/2,py=ground;
    ctx.fillStyle="#0008";ctx.beginPath();ctx.ellipse(cx,py+39,pw*.65,14,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=p.side;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+pw,py);ctx.lineTo(px+pw-8,py+ph);ctx.lineTo(px-8,py+ph);ctx.closePath();ctx.fill();
    const pg=ctx.createLinearGradient(px,py,px,py+ph);pg.addColorStop(0,p.top);pg.addColorStop(1,p.color);ctx.fillStyle=pg;roundedRect(ctx,px,py-9,pw,ph,5);ctx.fill();ctx.strokeStyle="#ffffff45";ctx.stroke();
    ctx.strokeStyle="#2b1e1744";ctx.lineWidth=2;cracks.forEach(c=>{ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(c.x+Math.cos(c.a)*c.len,c.y+Math.sin(c.a)*c.len);ctx.lineTo(c.x+Math.cos(c.a+.8)*c.len*.65,c.y+Math.sin(c.a+.8)*c.len*.65);ctx.stroke()});
    ctx.fillStyle="#d7e3e633";ctx.font="700 8px DM Sans";ctx.textAlign="center";ctx.fillText(p.name.toUpperCase(),cx,py+13);
    trails.forEach(t=>{ctx.save();ctx.globalAlpha=Math.max(0,t.life/t.max)*.22;const tg=ctx.createRadialGradient(t.x,t.y,1,t.x,t.y,t.r*1.5);tg.addColorStop(0,t.color);tg.addColorStop(1,"#ffffff00");ctx.fillStyle=tg;ctx.beginPath();ctx.arc(t.x,t.y,t.r*1.5,0,Math.PI*2);ctx.fill();ctx.restore()});rings.forEach(r=>{ctx.save();ctx.globalAlpha=Math.max(0,r.life/r.max)*.7;ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();ctx.restore()});if(ball){ctx.fillStyle="#0009";ctx.beginPath();ctx.ellipse(ball.x,py-4,ball.r*1.35,7,0,0,Math.PI*2);ctx.fill();ctx.save();ctx.shadowColor=ball.material.light;ctx.shadowBlur=ball.active?34:14;drawBall(ball.x,ball.y,ball.r,ball.material,ball.angle,ball.squash||0);ctx.restore()}
    else{const b=currentBall();drawBall(cx,Math.max(35,py-150),Math.max(17,Math.min(27,20+b.mass*2)),b,0);ctx.strokeStyle="#75cbd544";ctx.setLineDash([3,7]);ctx.beginPath();ctx.moveTo(cx,Math.max(60,py-115));ctx.lineTo(cx,py-48);ctx.stroke();ctx.setLineDash([])}
    particles.forEach(p=>{ctx.save();ctx.globalAlpha=Math.max(0,p.life/(p.max||1));ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;if(p.rect)ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.72);else{ctx.beginPath();ctx.arc(0,0,p.size/2,0,Math.PI*2);ctx.fill()}ctx.restore()});
    floating.forEach(f=>{ctx.globalAlpha=Math.max(0,f.life);ctx.fillStyle=f.color;ctx.font="900 17px Barlow Condensed";ctx.textAlign="center";ctx.fillText(f.text,f.x,f.y)});
    ctx.restore();
  }
  $("dropButton").addEventListener("click",startDrop);
  const homeScreen=$("homeScreen"),gameScreen=$("gameScreen");
  function showGame(){homeScreen.style.display="none";gameScreen.classList.add("active");requestAnimationFrame(()=>{resize();draw()})}
  function showHome(){if(running){toast("Aguarde o lançamento terminar.");return}gameScreen.classList.remove("active");homeScreen.style.display="flex"}
  $("playButton").addEventListener("click",showGame);$("homeButton").addEventListener("click",showHome);$("soundToggle").addEventListener("click",()=>{state.sound=!state.sound;$("soundToggle").textContent=state.sound?"♫":"♪";$("soundToggle").style.color=state.sound?"var(--cyan)":"var(--muted)";save();toast(state.sound?"Som ativado":"Som desativado")});
  $("upgradeList").addEventListener("click",e=>{const btn=e.target.closest("[data-upgrade]");if(!btn)return;const u=UPGRADES.find(x=>x.id===btn.dataset.upgrade),cost=upgradeCost(u);if(state.coins<cost||state[u.id]>=u.max)return;state.coins-=cost;state[u.id]++;save();render();toast(u.name+" melhorada!")});
  $("specialShop").addEventListener("click",e=>{const btn=e.target.closest("[data-special]");if(!btn)return;const s=SPECIALS.find(x=>x.id===btn.dataset.special);if(state.specials.includes(s.id)||state.coins<s.price)return;state.coins-=s.price;state.specials.push(s.id);save();render();toast(s.name+" adquirida!")});
  window.addEventListener("resize",resize);plateMax=currentPlate().hp;plateHp=Number.isFinite(state.plateHp)&&state.plateHp!==null?Math.max(0,Math.min(plateMax,state.plateHp)):plateMax;render();resize();if($("soundToggle"))$("soundToggle").style.color=state.sound?"var(--cyan)":"var(--muted)";
})();