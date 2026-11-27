/* Crazy Dream: a huge, slowly moving, dreamy "impossible space" reverb for Web Audio.
   (Formerly called "Black Hole" in this project; renamed so it does not borrow anyone's product name.)
   Self-contained, no libraries; works in an AudioContext (live) and an OfflineAudioContext (rendering).
   Can be copied into any page (Core Sample synth, Joe's Music Sketchpad, …).

     const bh = CrazyDream.create(ctx);           // or CrazyDream.create(ctx, {mix:.4, decay:20})
     source.connect(bh.input); bh.output.connect(ctx.destination);
     bh.set({gravity:-.6});                       // any subset of the settings below
     bh.freeze(true);                             // hold the cloud forever; false lets it die away

   Settings (defaults in DEFAULTS):
     mix        0..1     0 = dry only, 1 = reverb only
     size       0..1     how big the space is (longer gaps between reflections)
     decay      s        how long the tail lasts (0.5 .. 60)
     gravity   -1..1     above 0 the tail dies away normally; below 0 the reverb SWELLS UP behind the sound
     predelay   s        gap before the reverb starts (0 .. 0.5)
     mod        0..1     how much the delay lines drift (shimmer / chorus in the tail)
     rate       0..1     how fast they drift
     lowCut     Hz       removes rumble from the reverb
     highCut    Hz       darkens the reverb (lower = darker)
     resonance  0..1     adds ringing colour inside the tail

   How it works: the sound is delayed (predelay), filtered, smeared by a chain of allpass filters (diffusion),
   then fed into 8 delay lines that feed back into each other through a mixing matrix (a "feedback delay
   network"). Each line is damped (high cut), slowly modulated by its own LFO, and optionally resonant.
   Negative gravity blends in a convolution with a rising ("reverse") envelope, so the reverb grows instead of
   decaying. Freeze stops new sound entering and sets the feedback to almost 1, so the tail never ends. */
(function(){
const DEFAULTS={mix:.35,size:.7,decay:10,gravity:0,predelay:.03,mod:.35,rate:.25,lowCut:90,highCut:8000,resonance:0,nudge:0,nudgeMix:.5,flick:0,snap:.5,flickShape:'flick'};
const LENS=[0.0371,0.0437,0.0533,0.0619,0.0713,0.0831,0.0977,0.1079];   /* base delay times (s), no common factors */
const MEAN=LENS.reduce((a,b)=>a+b)/LENS.length;

function create(ctx,opts){
  const N=LENS.length,S={...DEFAULTS,...(opts||{})},frozen={on:false};
  const ALL=[],keep=n=>(ALL.push(n),n);   /* every node, so dispose() can take it all apart */
  const G=v=>{const g=keep(ctx.createGain());if(v!=null)g.gain.value=v;return g;};
  const F=(type,f,q)=>{const b=keep(ctx.createBiquadFilter());b.type=type;b.frequency.value=f;if(q!=null)b.Q.value=q;return b;};
  /* note: for lowpass/highpass biquads Web Audio's Q is in dB; -3.5 dB = no resonant bump (a bump inside the
     feedback loop makes the tail grow instead of decay) */
  let ready=false;   /* the first settings are set at once; later changes glide (no zipper noise) */
  const to=(param,v)=>{if(!ready){param.value=v;return;}param.cancelScheduledValues(ctx.currentTime);param.setTargetAtTime(v,ctx.currentTime,.04);};

  const input=G(),output=G(),dry=G(),fdnWet=G(),swellWet=G(),gate=G(1);
  input.connect(dry).connect(output);
  /* mono into the tank */
  const mono=G();mono.channelCount=1;mono.channelCountMode='explicit';mono.channelInterpretation='speakers';
  const pre=keep(ctx.createDelay(1)),lowCut=F('highpass',S.lowCut,-3.5),highCut=F('lowpass',S.highCut,-3.5);
  input.connect(gate).connect(mono);
  /* pitch nudge before the reverb (only what goes INTO the reverb; the dry sound is untouched).
     Two delay lines whose delay sweeps steadily (a sweeping delay = a pitch change), taking turns: while one
     jumps back to the start of its sweep, it is faded out and the other is faded in. */
  const W=.06,nDry=G(1),nWet=G(0),saw=keep(ctx.createBufferSource());
  { /* an exact straight ramp from -1 to 1, one second long, looped: its playback rate = sweeps per second */
    const n=ctx.sampleRate,rb=ctx.createBuffer(1,n,ctx.sampleRate),rd=rb.getChannelData(0);for(let i=0;i<n;i++)rd[i]=i/(n-1)*2-1;
    saw.buffer=rb;saw.loop=true;saw.playbackRate.value=0;saw.start(); }
  const wrap=keep(ctx.createWaveShaper());wrap.curve=new Float32Array(1024).map((_,i)=>{const x=i/1023*2-1;return x<0?x+1:x-1;});saw.connect(wrap);
  const fadeC=new Float32Array(1024).map((_,i)=>Math.sin(Math.PI*(i/1023)));   /* silent at both ends of the sweep */
  /* pitch flick (like tapping the pitch-bend lever as each note starts): a listener notices every new attack
     (fast envelope jumps above the slow one) and makes a short on/off pulse. That pulse slowly charges a
     "position" (fast charge = a quick bend), and the position moves one delay line's delay time: while the delay
     shrinks the pitch goes up, then it creeps back so slowly the return is barely heard ('flick'), or quickly,
     dipping below the note ('bounce'). */
  const FB=.045,RATES={flick:1.6,bounce:22},BOOST={flick:1,bounce:1.5};
  const abs=keep(ctx.createWaveShaper());abs.curve=new Float32Array([1,0,1]);
  const envF=F('lowpass',40,-3),envS=F('lowpass',5,-3),sNeg=G(-1.3),onset=keep(ctx.createWaveShaper());
  onset.curve=new Float32Array(2049).map((_,i)=>{const x=(i/2048*2-1)*.2;return x>0?Math.tanh(x*300):0;});   /* input range ±0.2 */
  const onsetIn=G(5);   /* ±0.2 → ±1 for the shaper */
  mono.connect(abs);abs.connect(envF).connect(onsetIn);abs.connect(envS).connect(sNeg).connect(onsetIn);onsetIn.connect(onset);
  const shapeSel={},fPos=G(1);
  for(const k in RATES){const w=RATES[k]/ctx.sampleRate,iir=keep(ctx.createIIRFilter([w],[1,-(1-w)])),sel=G(0);onset.connect(iir).connect(sel).connect(fPos);shapeSel[k]=sel;}
  const edge=F('lowpass',20,-3),fAmt=G(0),clip=keep(ctx.createWaveShaper()),fOut=G(.05),fdl=keep(ctx.createDelay(.1));
  clip.curve=new Float32Array(1025).map((_,i)=>Math.max(-.8,Math.min(.8,i/1024*2-1)));   /* ±40 ms at most */
  fdl.delayTime.value=FB;fPos.connect(edge).connect(fAmt).connect(clip).connect(fOut).connect(fdl.delayTime);
  const stage=G(),viaFlick=G(0),viaMono=G(1),steadyIn=G(1),viaSteady=G(0),plain=G(1);
  mono.connect(fdl).connect(viaFlick).connect(stage);mono.connect(viaMono).connect(stage);
  stage.connect(plain).connect(nWet);
  const lines2=[saw,wrap].map(src=>{const dl=keep(ctx.createDelay(.2)),ramp=G(0),fade=keep(ctx.createWaveShaper()),vca=G(0);
    dl.delayTime.value=W/2;src.connect(ramp).connect(dl.delayTime);fade.curve=fadeC;src.connect(fade).connect(vca.gain);
    stage.connect(dl).connect(vca).connect(viaSteady);return {ramp};});
  viaSteady.connect(nWet);
  mono.connect(nDry).connect(pre);nWet.connect(pre);
  pre.connect(lowCut).connect(highCut);
  /* diffusion */
  let d=highCut;for(const f of [190,430,970,2100,4700]){const a=F('allpass',f,.55);d.connect(a);d=a;}

  /* the tank: 8 lines, Householder feedback (each line hears itself minus 2/N of the sum of all lines) */
  const sum=G(-2/N),merger=keep(ctx.createChannelMerger(2)),lines=[];
  for(let i=0;i<N;i++){
    const inp=G(),dl=keep(ctx.createDelay(2)),damp=F('lowpass',S.highCut,-3.5),hp=F('highpass',S.lowCut*.5,-3.5),
          res=F('peaking',650*Math.pow(1.37,i),8),self=G(),cross=G(),lfo=keep(ctx.createOscillator()),depth=G(0),tap=G((i%2?1:-1)*.42);
    res.gain.value=0;
    d.connect(inp);inp.connect(dl);dl.connect(damp).connect(hp);
    hp.connect(self).connect(inp);hp.connect(sum);sum.connect(cross).connect(inp);
    lfo.type='sine';lfo.frequency.value=.1;lfo.connect(depth).connect(dl.delayTime);lfo.start();
    /* the resonance colours what leaves each line (outside the loop, so it can never run away) */
    hp.connect(res).connect(tap).connect(merger,0,i%2);
    lines.push({dl,damp,hp,res,self,cross,lfo,depth});}
  merger.connect(fdnWet).connect(output);

  /* reverse swell for negative gravity: convolution with a rising envelope */
  const conv=keep(ctx.createConvolver());conv.normalize=false;highCut.connect(conv).connect(swellWet).connect(output);
  let swellKey='';
  function buildSwell(){
    const amt=Math.max(0,-S.gravity),len=Math.min(12,Math.max(.4,S.decay*(.25+.5*amt))),key=[amt.toFixed(2),len.toFixed(2),S.highCut|0].join();
    if(amt<=0||key===swellKey)return;swellKey=key;
    const sr=ctx.sampleRate,n=Math.round(len*sr),ir=ctx.createBuffer(2,n,sr),k=Math.exp(-2*Math.PI*Math.min(S.highCut,16000)/sr),pw=1+2.5*amt,fo=Math.round(sr*.03);
    for(let c=0;c<2;c++){const o=ir.getChannelData(c);let y=0;
      for(let j=0;j<n;j++){y=(1-k)*(Math.random()*2-1)+k*y;let e=Math.pow(j/n,pw);if(j>n-fo)e*=(n-j)/fo;o[j]=y*e;}}
    let E=0;for(let c=0;c<2;c++){const o=ir.getChannelData(c);for(let j=0;j<n;j++)E+=o[j]*o[j];}
    const sc=2.2/Math.sqrt(E/2+1e-12);for(let c=0;c<2;c++){const o=ir.getChannelData(c);for(let j=0;j<n;j++)o[j]*=sc;}
    conv.buffer=ir;}

  function apply(){
    const scale=.35+3.4*S.size,resDb=14*S.resonance;
    let g=Math.pow(10,-3*MEAN*scale/Math.max(.3,S.decay));    /* feedback that gives the asked-for decay time */
    if(frozen.on)g=.9997;
    g=Math.min(g,.9997);
    lines.forEach((L,i)=>{
      const t=LENS[i]*scale;to(L.dl.delayTime,t);
      to(L.self.gain,g);to(L.cross.gain,g);
      to(L.damp.frequency,frozen.on?20000:Math.min(20000,S.highCut*1.1));
      to(L.hp.frequency,frozen.on?20:Math.max(20,S.lowCut*.5));
      to(L.res.gain,resDb);
      to(L.depth.gain,S.mod*.0035*(.4+S.size));
      to(L.lfo.frequency,(.05+1.6*S.rate)*(.6+.13*i));});
    to(pre.delayTime,Math.min(.99,Math.max(0,S.predelay-(Math.abs(S.flick||0)>.01?FB:0))));   /* the flick line already delays by FB */
    to(lowCut.frequency,S.lowCut);to(highCut.frequency,S.highCut);
    const neg=Math.max(0,-S.gravity),wet=Math.sin(S.mix*Math.PI/2),dryV=Math.cos(S.mix*Math.PI/2);
    to(dry.gain,dryV);to(fdnWet.gain,wet*(1-neg)*1.0);to(swellWet.gain,wet*neg*.9);
    to(gate.gain,frozen.on?0:1);
    /* pitch nudge: semitones (−2..+2 = a whole step down or up) and how much of the reverb's input is shifted */
    const st=Math.max(-2,Math.min(2,S.nudge||0)),r=Math.pow(2,st/12),fl=Math.max(-2,Math.min(2,S.flick||0)),rf=Math.pow(2,fl/12);
    const sOn=Math.abs(st)>.01,fOn=Math.abs(fl)>.01,nm=(sOn||fOn)?Math.max(0,Math.min(1,S.nudgeMix)):0;
    to(saw.playbackRate,Math.abs(r-1)/W);lines2.forEach(L=>to(L.ramp.gain,(st>0?-1:1)*W/2));to(nDry.gain,1-nm);to(nWet.gain,nm*.8);
    to(viaSteady.gain,sOn?1:0);to(plain.gain,sOn?0:1);
    /* flick: the delay shrinks at (ratio-1) seconds per second while the pulse charges the position at RATE */
    const shape=RATES[S.flickShape]?S.flickShape:'flick',snap=Math.max(0,Math.min(1,S.snap??.5));
    for(const k in shapeSel)to(shapeSel[k].gain,k===shape?1:0);
    to(fAmt.gain,-(rf-1)*BOOST[shape]/RATES[shape]/.05);to(envS.frequency,2.2*Math.pow(3,snap));to(edge.frequency,7*Math.pow(4,snap));
    to(viaFlick.gain,fOn?1:0);to(viaMono.gain,fOn?0:1);
    buildSwell();}
  apply();ready=true;
  const lev=keep(ctx.createAnalyser());lev.fftSize=1024;fdnWet.connect(lev);swellWet.connect(lev);

  return {input,output,
    /* how loud the reverb is right now (0..1), for the animation */
    level(){const a=new Float32Array(lev.fftSize);lev.getFloatTimeDomainData(a);let s=0;for(const v of a)s+=v*v;return Math.sqrt(s/a.length);},
    set(p){Object.assign(S,p||{});apply();return this;},
    get settings(){return {...S};},
    freeze(on){frozen.on=!!on;apply();return frozen.on;},
    get frozen(){return frozen.on;},
    dispose(){lines.forEach(L=>{try{L.lfo.stop();}catch(_){}});try{saw.stop();}catch(_){}ALL.forEach(n=>{try{n.disconnect();}catch(_){}});try{conv.buffer=null;}catch(_){}}};}

/* a few starting points */
const PRESETS={
  'Crazy dream':{mix:.45,size:.9,decay:18,gravity:0,predelay:.04,mod:.45,rate:.2,lowCut:90,highCut:7000,resonance:0,nudge:0,nudgeMix:.5,flick:0,snap:.5,flickShape:'flick'},
  'Endless sleep':{mix:.55,size:1,decay:60,gravity:0,predelay:.06,mod:.6,rate:.12,lowCut:120,highCut:5500,resonance:.15,nudge:0,nudgeMix:.5,flick:0,snap:.5,flickShape:'flick'},
  'Waking bloom':{mix:.5,size:.8,decay:8,gravity:-.85,predelay:0,mod:.3,rate:.2,lowCut:120,highCut:9000,resonance:0,nudge:0,nudgeMix:.5,flick:0,snap:.5,flickShape:'flick'},
  'Ripple dream':{mix:.5,size:.85,decay:12,gravity:0,predelay:.02,mod:.35,rate:.2,lowCut:120,highCut:8000,resonance:0,nudge:0,nudgeMix:.6,flick:1.5,snap:.55,flickShape:'flick'},
  'Wobbly dream':{mix:.45,size:.7,decay:7,gravity:0,predelay:.01,mod:.3,rate:.2,lowCut:120,highCut:8500,resonance:0,nudge:0,nudgeMix:.6,flick:2,snap:.4,flickShape:'bounce'},
  'Nightmare':{mix:.5,size:.85,decay:25,gravity:0,predelay:.02,mod:.5,rate:.15,lowCut:60,highCut:2200,resonance:.1,nudge:0,nudgeMix:.5,flick:0,snap:.5,flickShape:'flick'},
  'Music box':{mix:.4,size:.6,decay:12,gravity:0,predelay:.03,mod:.25,rate:.3,lowCut:150,highCut:9000,resonance:.7,nudge:0,nudgeMix:.5,flick:0,snap:.5,flickShape:'flick'},
  'Rising dream':{mix:.5,size:.85,decay:14,gravity:0,predelay:.03,mod:.4,rate:.2,lowCut:150,highCut:8500,resonance:0,nudge:2,nudgeMix:.5,flick:0,snap:.5,flickShape:'flick'},
  'Daydream':{mix:.2,size:.25,decay:1.4,gravity:0,predelay:.01,mod:.15,rate:.3,lowCut:100,highCut:10000,resonance:0,nudge:0,nudgeMix:.5,flick:0,snap:.5,flickShape:'flick'}};

/* ---------- the panel: an animated dream cloud + preset menu, sliders and Hold ----------
   mountUI(el, bh): bh is a reverb from create(), or any object with the same settings/set/freeze/frozen/level
   (a host can pass a stand-in that builds the reverb only when it is switched on). Dream 0 = Off.
   The panel uses dream names for the settings: Dream = mix, Depth = size, Linger = decay, Bloom = negative gravity,
   Shimmer = mod, Light = high cut, Chime = resonance, Hold = freeze. */
function mountUI(el,bh,onChange){
  if(!document.getElementById('cdream-css')){const s=document.createElement('style');s.id='cdream-css';s.textContent=`
.cdream canvas{width:100%;display:block;border-radius:8px;margin-bottom:8px}
.cdream .bh-c{display:flex;gap:10px 16px;flex-wrap:wrap;align-items:end}
.cdream label{display:flex;flex-direction:column;gap:2px;font-size:12px;color:var(--dim,#A49A88);min-width:96px}
.cdream label span{display:flex;justify-content:space-between;gap:6px}.cdream label b{font-weight:400;color:var(--pigment,#E3D2A8)}
.cdream input[type=range]{width:110px;accent-color:var(--bronze,#A97A42)}
.cdream select{font:inherit;font-size:14px;background:#24211d;color:var(--pigment,#E3D2A8);border:1px solid #3a3631;border-radius:4px;padding:5px 7px}
.cdream button{font:inherit;padding:7px 12px;border-radius:5px;border:1px solid #57514A;background:#24211d;color:var(--pigment,#E3D2A8);cursor:pointer}
.cdream button[aria-pressed=true]{background:#7fc8e8;border-color:#7fc8e8;color:#10161a}`;document.head.appendChild(s);}
  el.classList.add('cdream');
  const dec=v=>.5*Math.pow(120,v),decInv=s=>Math.log(s/.5)/Math.log(120),tone=v=>800*Math.pow(25,v),toneInv=f=>Math.log(f/800)/Math.log(25);
  const SL=[['mix','Dream',0,1,.01,s=>s.mix,v=>({mix:v}),s=>Math.round(s.mix*100)+'%'],['size','Depth',0,1,.01,s=>s.size,v=>({size:v}),s=>Math.round(s.size*100)+'%'],
    ['decay','Linger',0,1,.005,s=>decInv(s.decay),v=>({decay:dec(v)}),s=>s.decay<10?s.decay.toFixed(1)+' s':Math.round(s.decay)+' s'],
    ['gravity','Bloom',0,1,.01,s=>Math.max(0,-s.gravity),v=>({gravity:-v}),s=>s.gravity<-.02?Math.round(-s.gravity*100)+'%':'off (fades)','Turn up and the dream blooms up behind the sound instead of fading away'],
    ['mod','Shimmer',0,1,.01,s=>s.mod,v=>({mod:v,rate:.12+.3*v}),s=>Math.round(s.mod*100)+'%','Slow drift: shimmer and chorus in the dream'],
    ['tone','Light',0,1,.005,s=>toneInv(s.highCut),v=>({highCut:tone(v)}),s=>s.highCut<1000?Math.round(s.highCut)+' Hz':(s.highCut/1000).toFixed(1)+' kHz','Lower = dimmer, darker dream'],
    ['res','Chime',0,1,.01,s=>s.resonance,v=>({resonance:v}),s=>Math.round(s.resonance*100)+'%','Ringing, music-box colour in the dream'],
    ['nudge','Nudge',-2,2,.05,s=>s.nudge||0,v=>({nudge:Math.abs(v)<.04?0:v}),s=>{const n=s.nudge||0;return Math.abs(n)<.01?'off':(n>0?'+':'')+n.toFixed(2)+' st';},'Shifts the pitch of what goes into the dream, up to a whole step (2 semitones) up or down. The dry sound is not shifted.'],
    ['flick','Flick',-2,2,.05,s=>s.flick||0,v=>({flick:Math.abs(v)<.04?0:v}),s=>{const n=s.flick||0;return Math.abs(n)<.01?'off':(n>0?'+':'')+n.toFixed(2)+' st';},'Like tapping the pitch-bend lever as each note starts: a quick bend (up to a whole step, up or down) that the dream catches and spreads into ripples. The dry sound is not bent.'],
    ['snap','Snap',0,1,.01,s=>s.snap??.5,v=>({snap:v}),s=>Math.round((s.snap??.5)*100)+'%','How fast the flick is: low = a slow, lazy bend, high = a quick tap'],
    ['nudgeMix','Pitch mix',0,1,.01,s=>s.nudgeMix??.5,v=>({nudgeMix:v}),s=>Math.round((s.nudgeMix??.5)*100)+'%','How much of the dream comes from the nudged / flicked sound']];
  el.innerHTML=`<canvas aria-hidden="true"></canvas><div class="bh-c"><label>Preset<select data-k="preset"><option value="">Off</option>${Object.keys(PRESETS).map(k=>`<option>${k}</option>`).join('')}<option value="custom" hidden>Custom</option></select></label>`+
    SL.map(([k,l,mn,mx,st,,,,tip])=>`<label${tip?` title="${tip}"`:''}><span>${l} <b data-v="${k}"></b></span><input type="range" data-k="${k}" min="${mn}" max="${mx}" step="${st}"></label>`).join('')+
    `<label title="Flick: bend and creep back. Bounce: bend, dip below the note, then settle (a wobble)">Flick shape<select data-k="flickShape"><option value="flick">Flick</option><option value="bounce">Bounce</option></select></label>`+
    `<button data-k="freeze" aria-pressed="false" title="Hold the dream forever (press again to let it fade)">Hold</button></div>`;
  const q=s=>el.querySelector(s),pre=q('[data-k="preset"]'),fz=q('[data-k="freeze"]'),fs=q('[data-k="flickShape"]');
  const show=()=>{const s=bh.settings;SL.forEach(([k,,,,,get,,fmt])=>{q(`[data-k="${k}"]`).value=get(s);q(`[data-v="${k}"]`).textContent=fmt(s);});fz.setAttribute('aria-pressed',!!bh.frozen);fs.value=s.flickShape==='bounce'?'bounce':'flick';};
  const done=()=>{show();if(onChange)onChange(bh);};
  pre.onchange=()=>{const k=pre.value;if(!k){bh.set({mix:0});done();return;}if(k!=='custom'){bh.set({...PRESETS[k]});done();}};
  SL.forEach(([k,,,,,,map])=>q(`[data-k="${k}"]`).oninput=e=>{bh.set(map(+e.target.value));pre.value=bh.settings.mix>0?'custom':'';done();});
  fz.onclick=()=>{bh.freeze(!bh.frozen);done();};
  fs.onchange=()=>{bh.set({flickShape:fs.value});pre.value=bh.settings.mix>0?'custom':'';done();};
  pre.value=bh.settings.mix>0?'custom':'';show();
  /* the animation: a dream cloud swirling round a glowing moon; depth = radius, linger = trails, bloom = drifting outward,
     shimmer = wobble, light = colour, hold = icy and slow, level = brightness */
  const cv=q('canvas'),g=cv.getContext('2d'),LW=640,LH=200,P=[];let raf=0,last=performance.now(),lv=0;
  for(let i=0;i<420;i++)P.push({a:Math.random()*Math.PI*2,r:Math.random(),s:.5+Math.random(),z:Math.random()});
  function frame(now){raf=requestAnimationFrame(frame);if(!el.isConnected){cancelAnimationFrame(raf);return;}
    const dt=Math.min(.05,(now-last)/1000);last=now;const dpr=window.devicePixelRatio||1,w=cv.clientWidth;if(!w)return;const h=Math.round(w*LH/LW);
    if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);cv.style.height=h+'px';}
    g.setTransform(dpr*w/LW,0,0,dpr*h/LH,0,0);
    const s=bh.settings,on=s.mix>0||bh.frozen,fr=bh.frozen;lv+=((on&&bh.level?bh.level():0)-lv)*.2;
    const trail=on?Math.min(.97,.55+decInv(s.decay)*.42):.5;g.fillStyle=`rgba(8,7,10,${1-trail})`;g.fillRect(0,0,LW,LH);
    const cx=LW/2,cy=LH/2,R=40+s.size*150,warm=toneInv(s.highCut),glow=on?.25+Math.min(1,lv*8)*.75:.12;
    P.forEach(p=>{const speed=(fr?.25:1)*(.15+.85*(1-p.r))*p.s;p.a+=dt*speed*(on?1.6:.4);
      p.r+=dt*(on?(s.gravity<-.02?.05*-s.gravity:-.018*(1+s.gravity)):-.01);if(p.r<.03){p.r=1;p.a=Math.random()*Math.PI*2;}if(p.r>1){p.r=.05;}
      const wob=1+Math.sin(p.a*3+now/700)*s.mod*.08,rr=(14+p.r*R)*wob,x=cx+Math.cos(p.a)*rr,y=cy+Math.sin(p.a)*rr*.32+(p.z-.5)*4;
      const hot=1-p.r,c=fr?`rgba(${150+hot*90},${210+hot*40},255,${glow*(.4+hot*.6)})`:`rgba(${Math.round(190+hot*65)},${Math.round(90+warm*70+hot*60)},${Math.round(210+hot*45)},${glow*(.35+hot*.65)})`;
      g.fillStyle=c;g.fillRect(x,y,1.6+hot*1.4,1.6+hot*1.4);});
    /* the glowing moon at the centre (soft halo pulses with the sound) */
    const mr=11+s.size*6,halo=g.createRadialGradient(cx,cy,mr*.6,cx,cy,mr*3.2);halo.addColorStop(0,fr?`rgba(190,235,255,${.35+glow*.4})`:`rgba(240,205,255,${.3+glow*.45})`);halo.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=halo;g.beginPath();g.arc(cx,cy,mr*3.2,0,Math.PI*2);g.fill();
    const moon=g.createRadialGradient(cx-mr*.35,cy-mr*.35,mr*.1,cx,cy,mr);moon.addColorStop(0,'#fffaf0');moon.addColorStop(1,fr?'#9fd8f0':'#d9b8f0');
    g.fillStyle=moon;g.beginPath();g.arc(cx,cy,mr,0,Math.PI*2);g.fill();
    g.fillStyle='rgba(227,210,168,.85)';g.font='600 14px Georgia,serif';g.fillText(on?(fr?'Holding':'Crazy Dream'):'Off',12,22);
    if(on){g.font='11px Georgia,serif';g.fillStyle='rgba(164,154,136,.9)';g.fillText(`linger ${s.decay<10?s.decay.toFixed(1):Math.round(s.decay)} s · ${s.gravity<-.02?'blooming':'fading'}`,12,38);}}
  raf=requestAnimationFrame(frame);
  return {refresh:show,destroy(){cancelAnimationFrame(raf);el.innerHTML='';}};}

window.CrazyDream={create,mountUI,DEFAULTS,PRESETS};
})();
