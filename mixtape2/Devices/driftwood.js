/* Mixtape 2 device: DRIFTWOOD, an electric guitar for writing songs at home (2026-11-24; a first, plainly drawn prototype: its real
   look comes once Steve has played it). It is wired the way a guitarist's rig is:
     GUITAR → PEDALBOARD (SWELL, COMP, DRIVE, HARMONY, MOD) → AMP (four voicings, BASS MID TREBLE, a speaker cabinet)
       → PAD, DELAY and REVERB in the amp's effects loop (after the amp's own drive, as most ambient players wire them, so the echoes
         stay clean when the amp is pushed) → OUT.
   The PLAY knob: HOLD (a key holds its note), RING (every plucked note rings on by itself, as a string does), STRINGS (six strings
   and a hand on the neck: a string picked again stops its last note) and LEAD (STRINGS with hammer-ons and pull-offs); see below.
   The PAD pedal is a small HALO under the guitar (WARM, GLASS, CHOIR, AIR, ORGAN, SHRUTI; LEVEL, FADE IN), playing the keys held.
   The guitar: FreePats' raw recordings of a Fender (bridge pickup, straight from the guitar with no amp: the amp here makes the tone;
   CC0, in Instruments\FreePats Electric Guitar Direct, not in Git), soft and hard picking, two takes of each note (played in turn so a
   repeated note is never the very same sound), a recording about every third note. A key's own copy is made once at its own pitch
   (cubic), so every note plays at speed 1 (the browser's cheap way); until it is made the nearest recording plays faster or slower.
   The GUITAR panel: PICKUP (NECK / MIDDLE / BRIDGE, made from the bridge recording by its tone), VOLUME, TONE, MUTE (palm muting:
   shorter, darker notes), STRUM (keys pressed together are strummed: DOWN, or DOWN / UP in turn) and SPREAD (how slow the strum),
   PLAY.
   HARMONY, in the spirit of a studio harmonizer pedal (an original design): since every note played is known, its harmonies are more
   guitar notes, exactly in the song's KEY: DIATONIC (one voice a 3rd, 4th, 5th, 6th or octave away, above or below), QUAD (a 3rd, a
   5th and an octave above), OCTAVES (below and above) and CRYSTALS (the note an octave up, backwards, in echoes that drift left and
   right). SOUND IN (any other sound) goes through the pedals and the amp too, but HARMONY and SWELL only play on DRIFTWOOD's own notes.
   Jacks: KEYS IN (KEYS, GRAPH PAPER; with nothing there any MIDI keyboard, its sustain pedal on CC 64, the bend wheel bends a tone),
   SOUND IN, OUT. Silent for 5 s it unhooks from the output (Chrome then runs nothing behind it); a pedal switched off is taken out of
   the chain, and the MOD's and the shimmer's wobblers only run while they are on. */
(()=>{const M2=window.M2;
const W=760,H=400;
const DIR='Instruments/FreePats Electric Guitar Direct/samples/bridge';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),pct=v=>Math.round(v*100)+'%',dB=d=>Math.pow(10,d/20);
const hold=(p,t)=>{if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);else p.cancelScheduledValues(t);};
/* a swell's S-shaped rise from `a` to `b` over `dur`, made of eight straight ramps (a value curve cannot be cut cleanly when a note is
   let go at the very moment it starts: the browser refuses the release, and the note would hang) */
const sCurve=(p,a,b,t,dur)=>{p.setValueAtTime(a,t);for(let i=1;i<=8;i++){const x=i/8;p.linearRampToValueAtTime(a+(b-a)*x*x*(3-2*x),t+dur*x);}};
const NM=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

/* ---- the knobs' values (0..1) to sound ---- */
const toneOf=v=>1200*Math.pow(20000/1200,v);          /* TONE: 1.2 kHz (dark) … open */
const swellOf=v=>.03*Math.pow(4/.03,v);               /* FADE IN: 30 ms … 4 s to come in */
const thrOf=v=>v>.98?128:1+126*v;                     /* SENS: notes played softer than this swell (at its top: every note) */
const decTc=v=>.06*Math.pow(40,v);                    /* DECAY: how fast a swelled note fades: 60 ms … 2.4 s (at its top: rings on) */
const tideBeats=v=>[2,4,8,16][Math.round(clamp(v,0,1)*3)];   /* TIDE: one wave every 2, 4, 8 or 16 beats (FADE IN picks) */
const spreadOf=v=>.006+.07*v*v;                       /* SPREAD: 6 … 76 ms between strings */
const muteTc=v=>.03+.6*Math.pow(1-v,2);               /* MUTE: how fast a muted note dies (it does not, at 0) */
const delFree=v=>.06*Math.pow(25,v);                  /* DELAY TIME, free: 60 ms … 1.5 s */
const sizeOf=v=>.8*Math.pow(10,v);                    /* REVERB SIZE: 0.8 … 8 s */
const rateOf=v=>.1*Math.pow(80,v);                    /* MOD RATE: 0.1 … 8 Hz */
const DIVS=[['1/4',1],['1/4 ·',1.5],['1/8 ·',.75],['1/8',.5],['1/16',.25],['FREE',0]];
const IVS=[['3RD UP',2],['4TH UP',3],['5TH UP',4],['6TH UP',5],['OCTAVE UP',7],['3RD DOWN',-2],['4TH DOWN',-3],['5TH DOWN',-4],['6TH DOWN',-5],['OCTAVE DOWN',-7]];
const HMODES=['DIATONIC','QUAD','OCTAVES','CRYSTALS'],MMODES=['CHORUS','VIBRATO','TREMOLO'],PICKS=['NECK','MIDDLE','BRIDGE'],STRUMS=['OFF','DOWN','DOWN/UP'];
/* the amp's voicings (original): how hard the preamp can be pushed (GAIN from lo to hi), its lean (bias: uneven clipping, a valve's
   warmth), how tight its lows are (hp) and its own colour (peaks: Hz, dB, Q) on top of BASS MID TREBLE */
const AMPS={clean:{name:'CLEAN',lo:.6,hi:5,bias:.05,hp:60,col:[[450,-3,.7],[3200,3,.7]]},
  chime:{name:'CHIME',lo:1.5,hi:16,bias:.12,hp:90,col:[[1100,3,.8],[4200,4,.9]]},
  crunch:{name:'CRUNCH',lo:3,hi:45,bias:.18,hp:110,col:[[800,4,.8],[2400,2,.8]]},
  lead:{name:'LEAD',lo:8,hi:140,bias:.22,hp:220,col:[[650,5,.9],[3600,-2,1]]}};

/* the sound as it starts, and the presets on top of it */
const V0={g:{pick:'BRIDGE',vol:.8,tone:.85,mute:0,strum:'OFF',spread:.45,play:'RING'},pad:{on:false,ch:'warm',level:.45,swell:.5},
  swell:{on:false,att:.6,mode:'each',sens:1,mix:0,dec:1,wheel:false},comp:{on:false,sus:.4,lvl:.5},drive:{on:false,drive:.35,tone:.55,lvl:.5},
  harm:{on:false,mode:'DIATONIC',key:0,iv:'3RD UP',mix:.6},mod:{on:false,mode:'CHORUS',rate:.35,depth:.4},
  amp:{model:'clean',gain:.35,bass:.5,mid:.5,treb:.55,master:.6,cab:true},
  delay:{on:false,div:'1/8 ·',time:.5,fb:.35,mix:.3},verb:{on:true,size:.35,mix:.22,shim:0}};
const PRESETS=[
  ['Clean writing desk',{comp:{on:true,sus:.3},verb:{on:true,size:.3,mix:.18}}],
  ['Sunday swells',{g:{pick:'NECK',tone:.7},swell:{on:true,att:.62},amp:{treb:.6},delay:{on:true,div:'1/8 ·',fb:.45,mix:.32},verb:{on:true,size:.85,mix:.45,shim:.35}}],
  ['Edge of breakup',{g:{pick:'MIDDLE'},drive:{on:true,drive:.25,lvl:.55},amp:{model:'chime',gain:.45},delay:{on:true,div:'1/8 ·',fb:.3,mix:.22},verb:{on:true,size:.45,mix:.22}}],
  ['Crystal harmonies',{harm:{on:true,mode:'CRYSTALS',mix:.55},delay:{on:true,div:'1/4',fb:.4,mix:.28},verb:{on:true,size:.8,mix:.4,shim:.2}}],
  ['Thirds above',{harm:{on:true,mode:'DIATONIC',iv:'3RD UP',mix:.7},mod:{on:true,mode:'CHORUS',rate:.3,depth:.35},verb:{on:true,size:.45,mix:.25}}],
  ['Driven anthem',{g:{pick:'BRIDGE'},comp:{on:true,sus:.35},drive:{on:true,drive:.55,tone:.6},amp:{model:'crunch',gain:.5,mid:.6},delay:{on:true,div:'1/4',fb:.3,mix:.2},verb:{on:true,size:.5,mix:.2}}],
  ['Tremolo ballad',{g:{pick:'NECK',tone:.65},mod:{on:true,mode:'TREMOLO',rate:.5,depth:.6},amp:{model:'clean',gain:.3},verb:{on:true,size:.4,mix:.3}}],
  ['Strummed chords',{g:{strum:'DOWN/UP',spread:.5,pick:'MIDDLE'},comp:{on:true,sus:.45},amp:{model:'chime',gain:.3},verb:{on:true,size:.35,mix:.2}}],
  ['Ocean tide',{g:{pick:'NECK',tone:.7},swell:{on:true,mode:'tide',att:.67,mix:.25},delay:{on:true,div:'1/4 ·',fb:.4,mix:.3},verb:{on:true,size:.8,mix:.4,shim:.25}}],
  ['Guitar over a pad',{g:{pick:'NECK',tone:.75},pad:{on:true,ch:'warm',level:.45,swell:.55},delay:{on:true,div:'1/8 ·',fb:.35,mix:.25},verb:{on:true,size:.7,mix:.35,shim:.15}}]];
/* the PAD pedal's four sounds (HALO's characters) */
const SWM=[['each','EACH NOTE'],['wave','WAVE'],['tide','TIDE'],['rise','RISE']];
const SWTIP={each:'EVERY NOTE SWELLS IN ON ITS OWN',wave:'EACH NEW NOTE SWELLS EVERYTHING RINGING AGAIN',tide:'THE SOUND RISES AND EBBS IN WAVES, IN TIME',rise:'THE NOTE PLAYS, ITS REVERB RISES BEHIND IT'};
const PADS=['warm','glass','choir','air','organ','shruti'];
/* the PLAY knob: what a key let go does, and whether notes share strings (see STRINGS below) */
const PLAYS=['HOLD','RING','STRINGS','LEAD'];
const PLAYTIP={HOLD:'A NOTE STOPS WHEN ITS KEY COMES UP',RING:'EVERY NOTE RINGS ON BY ITSELF',STRINGS:'SIX STRINGS: A STRING PICKED AGAIN STOPS ITS LAST NOTE',LEAD:'STRINGS + SMOOTH PLAYING HAMMERS ON AND PULLS OFF'};
const deep=(a,b)=>{for(const k in b)if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])){a[k]=a[k]||{};deep(a[k],b[k]);}else a[k]=b[k];return a;};
const fresh=p=>deep(JSON.parse(JSON.stringify(V0)),JSON.parse(JSON.stringify(p||{})));

/* ---- the recordings: decoded once for every DRIFTWOOD, mono, each take's level evened (peak 0.7, soft picking 0.45) ---- */
const SAMP={state:'none',msg:'',p:null,buf:new Map(),tune:new Map(),by:{soft:[],hard:[]},done:0,total:0};   /* buf: 'note|soft/hard|take' → AudioBuffer;
   tune: the same → how far off its note it was recorded, in cents (+ sharp), put right whenever it plays */
/* a recording's pitch, by YIN (the lag where the ringing sound best repeats itself, refined between samples), about its note's f0.
   The guitar was a real one, a little out: measured 2026-11-24, most takes within ±8 cents but A2's 11 sharp and 15 flat, enough to
   sound out of tune beside the CELLOS (Steve heard it); so each take is measured as it loads and played at true pitch */
function yinHz(x,sr,f0){const lo=Math.floor(sr/(f0*1.5)),hi=Math.ceil(sr/(f0/1.5)),N=Math.min(4096,x.length-hi-2);if(N<512)return 0;const d=new Float64Array(hi+2),c=new Float64Array(hi+2);
  for(let t=1;t<=hi+1;t++){let s=0;for(let i=0;i<N;i++){const e=x[i]-x[i+t];s+=e*e;}d[t]=s;}
  let run=0,best=lo,m=1e9;for(let t=1;t<=hi+1;t++){run+=d[t];c[t]=d[t]*t/(run||1);}for(let t=lo;t<=hi;t++)if(c[t]<m){m=c[t];best=t;}
  const a=c[best-1],b=c[best],g=c[best+1],den=a-2*b+g;return sr/(best+(den?(a-g)/(2*den):0));}
const NAME_RE=/^([A-G])(#?)(\d)_s\d(_soft)?_(\d\d)\.flac$/i,SEMI={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function loadSamples(ctx,files){if(SAMP.p)return SAMP.p;SAMP.state='loading';SAMP.msg='TUNING UP…';M2.emit('driftwood-samples');
  SAMP.p=(async()=>{let list=[];try{list=await files.list(DIR);}catch(e){}
    /* two takes of each note; up high (G4 and above, where only hard picking was recorded) all four, so repeated high notes vary */
    const want=list.map(f=>{const m=!f.dir&&NAME_RE.exec(f.name);if(!m)return null;const n=12*(+m[3]+1)+SEMI[m[1].toUpperCase()]+(m[2]?1:0),soft=!!m[4];
      if(soft&&n>=67)return {name:f.name,n,lay:'hard',rr:4};   /* (D5's one soft take is, in the set's own map, a fourth take of its hard picks) */
      return (+m[5]<=2||!soft&&n>=67)&&{name:f.name,n,lay:soft?'soft':'hard',rr:+m[5]};}).filter(Boolean);
    if(!want.length){SAMP.state='missing';SAMP.msg='NO GUITAR RECORDINGS';M2.emit('driftwood-samples');SAMP.p=null;throw new Error('missing');}
    want.sort((a,b)=>Math.abs(a.n-55)-Math.abs(b.n-55));SAMP.total=want.length;SAMP.done=0;   /* the middle of the neck first */
    const one=async w=>{try{const u=await files.read(DIR+'/'+w.name),b=await ctx.decodeAudioData(u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength));
        const sr=b.sampleRate,x=b.getChannelData(0);let pk=0;for(let i=0;i<x.length;i++){const a=Math.abs(x[i]);if(a>pk)pk=a;}
        let s0=0;while(s0<x.length&&Math.abs(x[s0])<pk*.02)s0++;s0=Math.max(0,s0-Math.round(sr*.002));   /* the silence before the pick cut off */
        const maxS=w.n<52?10:w.n<66?8:6,n=Math.min(x.length-s0,Math.round(sr*maxS)),fade=Math.round(sr*.4),o=ctx.createBuffer(1,n,sr),y=o.getChannelData(0),k=(w.lay==='soft'?.45:.7)/(pk||1);
        for(let i=0;i<n;i++)y[i]=x[s0+i]*k;for(let i=0;i<fade&&i<n;i++)y[n-1-i]*=i/fade;
        const f0=440*Math.pow(2,(w.n-69)/12),hz=yinHz(y.subarray(Math.round(.25*sr),Math.round(.8*sr)),sr,f0),ct=hz?1200*Math.log2(hz/f0):0;
        SAMP.tune.set(w.n+'|'+w.lay+'|'+w.rr,Math.abs(ct)<45?ct:0);   /* (a reading further off than that is a mistaken one: left alone) */
        SAMP.buf.set(w.n+'|'+w.lay+'|'+w.rr,o);if(!SAMP.by[w.lay].includes(w.n))SAMP.by[w.lay].push(w.n);}catch(e){console.warn('DRIFTWOOD sample',w.name,e);}
      SAMP.done++;if(SAMP.done%6===0){SAMP.msg='TUNING UP… '+Math.round(SAMP.done/SAMP.total*100)+'%';M2.emit('driftwood-samples');}};
    const q=[...want];await Promise.all([0,1,2,3].map(async()=>{while(q.length)await one(q.shift());}));
    for(const l in SAMP.by)SAMP.by[l].sort((a,b)=>a-b);
    SAMP.state=SAMP.buf.size?'ready':'missing';SAMP.msg=SAMP.buf.size?'':'NO GUITAR RECORDINGS';M2.emit('driftwood-samples');})();
  return SAMP.p;}
/* the nearest recording of a note (that picking, that take; else the other take, else the other picking) */
/* (that picking only if it was recorded within 2 half steps, the recordings' spacing: soft picks stop at E4, and a soft high note once
   played the E4 recording sped up an octave, which sounded fake; now it takes the hard pick there, softened in E.play) */
function nearest(n,lay,rr){for(const L of [lay,lay==='soft'?'hard':'soft']){const ns=SAMP.by[L];if(!ns.length)continue;let s=ns[0];for(const m of ns)if(Math.abs(m-n)<Math.abs(s-n))s=m;
    if(L===lay&&Math.abs(s-n)>2&&SAMP.by[L==='soft'?'hard':'soft'].some(m=>Math.abs(m-n)<=2))continue;
    for(const r of [rr,rr===1?2:1,1]){const id=s+'|'+L+'|'+r,b=SAMP.buf.get(id);if(b)return{s,b,id,k:Math.pow(2,-(SAMP.tune.get(id)||0)/1200)};}}return null;}   /* k: its tuning put right */
/* a note's own copy at its own pitch (made once, kept: the last 200), made a little after the note asks so playing never waits */
const KEYC=new Map(),RQ=[];let rqT=0;
const a4=()=>globalThis.MIXTAPE_A4||440;
function render(ctx,r,n){const src=r.b.getChannelData(0),ratio=Math.pow(2,(n-r.s)/12)*a4()/440*r.k,len=Math.floor((src.length-3)/ratio);if(len<64)return null;
  const b=ctx.createBuffer(1,len,r.b.sampleRate),o=b.getChannelData(0);
  for(let i=0;i<len;i++){const p=i*ratio,j=p|0,f=p-j,y0=src[j>0?j-1:0],y1=src[j],y2=src[j+1],y3=src[j+2];o[i]=y1+.5*f*(y2-y0+f*(2*y0-5*y1+4*y2-y3+f*(3*(y1-y2)+y3-y0)));}
  return b;}
function keep(id,b){KEYC.set(id,b);while(KEYC.size>96)KEYC.delete(KEYC.keys().next().value);}   /* (a ringing note is up to 10 s: 96 copies is about 150 MB) */
function keyBuf(ctx,n,lay,rr){const r=nearest(n,lay,rr);if(!r)return null;const id=n+'|'+r.id+'|'+a4(),hard=r.id.includes('|hard|');   /* hard: a hard pick, whatever was asked */
  let b=KEYC.get(id);if(b){KEYC.delete(id);KEYC.set(id,b);return{b,rate:1,hard};}
  if(n===r.s&&a4()===440&&Math.abs(r.k-1)<3e-4)return{b:r.b,rate:1,hard};   /* (its own note, recorded within half a cent) */
  if(!RQ.some(x=>x.id===id))RQ.push({id,r,n});if(!rqT)rqT=setTimeout(()=>drain(ctx),30);
  return{b:r.b,rate:Math.pow(2,(n-r.s)/12)*a4()/440*r.k,hard};}
function drain(ctx){rqT=0;const t0=performance.now();while(RQ.length&&performance.now()-t0<12){const x=RQ.shift();if(!KEYC.has(x.id)){const b=render(ctx,x.r,x.n);if(b)keep(x.id,b);}}if(RQ.length)rqT=setTimeout(()=>drain(ctx),40);}
/* CRYSTALS' shard: the first 1.4 s of a note an octave up, backwards (made once a note) */
function revBuf(ctx,n,lay){const id='R|'+n+'|'+lay+'|'+a4();let b=KEYC.get(id);if(b)return b;const r=nearest(n,lay,1);if(!r)return null;
  const f=KEYC.get(n+'|'+r.id+'|'+a4())||render(ctx,r,n);if(!f)return null;const L=Math.min(f.length,Math.round(f.sampleRate*1.4)),x=f.getChannelData(0);
  b=ctx.createBuffer(1,L,f.sampleRate);const o=b.getChannelData(0),fi=Math.round(f.sampleRate*.02);for(let i=0;i<L;i++)o[i]=x[L-1-i]*(i<fi?i/fi:1);keep(id,b);return b;}
/* the song's KEY (a major scale; a minor song uses its relative major: A minor = C) and a note's harmony a number of scale steps away */
function harmOf(n,key,steps){const sc=[0,2,4,5,7,9,11];let deg=-1,base=n;
  for(let d=0;d<12&&deg<0;d++){const pc=((n-d-key)%12+12)%12,i=sc.indexOf(pc);if(i>=0){deg=i;base=n-d;}}
  const oct=Math.floor((deg+steps)/7),i=((deg+steps)%7+7)%7;return base-sc[deg]+sc[i]+12*oct+(n-base);}

/* a reverb's ring: a cloud of noise dying away over T (highs sooner), left and right each their own */
function hallIR(ctx,T){const sr=ctx.sampleRate,len=Math.round(sr*Math.min(9,T*1.15+.1)),b=ctx.createBuffer(2,len,sr),pre=Math.round(sr*.012);let e=0;
  for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);let lp=0;const kM=Math.exp(-6.91/(T*sr)),kH=Math.exp(-6.91/(T*.45*sr));let gM=1,gH=1;
    for(let i=0;i<len;i++){if(i<pre){d[i]=0;continue;}const nz=Math.random()*2-1,a=.25+.6*(1-gH);lp+=a*(nz-lp);const att=Math.min(1,(i-pre)/(sr*.04));d[i]=(lp*gM+(nz-lp)*gH*.6)*att;gM*=kM;gH*=kH;e+=d[i]*d[i];}}
  const s=.55/Math.sqrt(e/2);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<len;i++)d[i]*=s;}return b;}
/* a soft clipper's curve: tanh over ±8, leaning by `bias` (so it clips unevenly, as a valve does) */
function clipCurve(bias){const N=4096,c=new Float32Array(N),z=Math.tanh(bias);for(let i=0;i<N;i++){const u=i/(N-1)*2-1;c[i]=Math.tanh(8*u+bias)-z;}const m=Math.max(Math.abs(c[0]),Math.abs(c[N-1]));for(let i=0;i<N;i++)c[i]/=m;return c;}

/* ---- the sound ---- */
function Engine(ctx,outG){
  const G=v=>{const g=ctx.createGain();g.gain.value=v;return g;},B=(type,f,q,g)=>{const b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;if(q!=null)b.Q.value=q;if(g!=null)b.gain.value=g;return b;};
  const E={voices:[],awake:false,P:null};
  const ramp=(p,v,tc)=>{const t=ctx.currentTime;hold(p,t);p.setTargetAtTime(v,t,tc||.03);};
  /* the GUITAR: every note → the pickup's colour → TONE → VOLUME */
  const vBus=G(1),pkLo=B('peaking',220,.8,0),pkHi=B('highshelf',2600,null,0),tone=B('lowpass',20000,.5),gVol=G(.8);
  /* OCEAN SWELL's two shared gains on the guitar's notes: swG (WAVE's restart, TIDE's waves) and whG (the mod wheel as a volume pedal) */
  const swG=G(1),whG=G(1),tideAmp=G(0);let tide=null;tideAmp.connect(swG.gain);
  vBus.connect(swG);swG.connect(whG);whG.connect(pkLo);pkLo.connect(pkHi);pkHi.connect(tone);tone.connect(gVol);
  const chainIn=G(1);gVol.connect(chainIn);
  const sndIn=G(1);sndIn.connect(chainIn);const inMon=ctx.createAnalyser();inMon.fftSize=256;sndIn.connect(inMon);const ibuf=new Float32Array(256);
  /* COMP */
  const cp=ctx.createDynamicsCompressor(),cpG=G(1);cp.knee.value=8;cp.attack.value=.004;cp.release.value=.25;cp.connect(cpG);const COMP={inp:cp,out:cpG};
  /* DRIVE: a mid hump into a soft clipper, then its TONE */
  const drHp=B('highpass',140,.7),drMid=B('peaking',720,.7,6),drPre=G(1),drSh=ctx.createWaveShaper(),drLp=B('lowpass',4000,.6),drOut=G(1);
  drSh.curve=clipCurve(.05);drSh.oversample='4x';drHp.connect(drMid);drMid.connect(drPre);drPre.connect(drSh);drSh.connect(drLp);drLp.connect(drOut);const DRIVE={inp:drHp,out:drOut};
  /* MOD: dry + a wobbling short delay (chorus, vibrato), then a gain that wobbles (tremolo); its wobbler runs only while it is on */
  const mIn=G(1),mDry=G(1),mDl=ctx.createDelay(.05),mWet=G(0),mSum=G(1),mTr=G(1),mDep=G(0),mTrD=G(0);
  mIn.connect(mDry);mIn.connect(mDl);mDl.connect(mWet);mDry.connect(mSum);mWet.connect(mSum);mSum.connect(mTr);mDep.connect(mDl.delayTime);mTrD.connect(mTr.gain);
  let lfo=null;const MOD={inp:mIn,out:mTr};
  /* the AMP: tightness, preamp drive (GAIN), BASS MID TREBLE, its voicing, the speaker cabinet, MASTER */
  const aHp=B('highpass',60,.7),aPre=G(1),aSh=ctx.createWaveShaper(),aMk=G(1),aBass=B('lowshelf',120,null,0),aMid=B('peaking',700,.8,0),aTreb=B('highshelf',2800,null,0),
    aC1=B('peaking',450,.7,0),aC2=B('peaking',3200,.7,0),cab1=B('highpass',80,.7),cab2=B('peaking',120,1,3),cab3=B('lowpass',5200,.9),cab4=B('lowpass',7000,.6),cabOut=G(1),aMaster=G(.6);
  aSh.oversample='4x';let curBias=null;
  for(const [a,b] of [[aHp,aPre],[aPre,aSh],[aSh,aMk],[aMk,aBass],[aBass,aMid],[aMid,aTreb],[aTreb,aC1],[aC1,aC2],[cab1,cab2],[cab2,cab3],[cab3,cab4],[cab4,cabOut],[cabOut,aMaster]])a.connect(b);
  let cabOn=null;const AMP={inp:aHp,out:aMaster};
  /* DELAY: ping-pong, a tape's dulling in its repeats */
  const dIn=G(1),dDry=G(1),dL=ctx.createDelay(2),dR=ctx.createDelay(2),dFb=G(.35),dTone=B('lowpass',3800,-6),   /* (Q in dB: no bump, so the loop never gains) */dMg=ctx.createChannelMerger(2),dWet=G(.3),dOut=G(1);
  dIn.connect(dDry);dDry.connect(dOut);dIn.connect(dL);dL.connect(dR);dR.connect(dTone);dTone.connect(dFb);dFb.connect(dL);dL.connect(dMg,0,0);dR.connect(dMg,0,1);dMg.connect(dWet);dWet.connect(dOut);
  const DELAY={inp:dIn,out:dOut};
  /* REVERB: a hall made from noise (made again when SIZE moves); SHIMMER feeds the hall back into itself an octave up */
  const rIn=G(1),rDry=G(1),rPre=G(1),rCv=ctx.createConvolver(),rWet=G(.22),rOut=G(1),rShG=G(0);rCv.normalize=false;
  rIn.connect(rDry);rDry.connect(rOut);rIn.connect(rPre);rPre.connect(rCv);rCv.connect(rWet);rWet.connect(rOut);rShG.connect(rPre);
  let irT=0,irSize=-1,shim=null;const VERB={inp:rIn,out:rOut};
  /* the amp's effects loop: where the amp's sound and the PAD meet, before DELAY and REVERB */
  const loopIn=G(1),padBus=G(1);padBus.connect(loopIn);const LOOP={inp:loopIn,out:loopIn};E.padBus=padBus;
  /* the end: a limiter, a meter, and the output (hooked up only while awake) */
  const preLim=G(1),lim=ctx.createDynamicsCompressor();lim.threshold.value=-3;lim.knee.value=2;lim.ratio.value=20;lim.attack.value=.002;lim.release.value=.15;preLim.connect(lim);
  const meter=ctx.createAnalyser();meter.fftSize=512;const mbuf=new Float32Array(512);

  /* an octave-up shifter for the shimmer: two taps of a delay swept by sawtooths, each faded out where its sweep jumps back */
  function shifter(semi,win){const inp=G(1),out=G(1),f=1/win,amp=(1-Math.pow(2,semi/12))/(2*f),base=Math.abs(amp)+.003,oscs=[],nodes=[inp,out];
    const cosW=ctx.createPeriodicWave(new Float32Array([0,1]),new Float32Array([0,0]),{disableNormalization:true}),t=ctx.currentTime+.03;
    for(const k of [0,1]){const d=ctx.createDelay(1);d.delayTime.value=base;const s=ctx.createOscillator();s.type='sawtooth';s.frequency.value=f;const sa=G(amp);s.connect(sa);sa.connect(d.delayTime);
      const w=ctx.createOscillator();w.setPeriodicWave(cosW);w.frequency.value=f;const wg=G(.5),vg=G(.5);w.connect(wg);wg.connect(vg.gain);
      inp.connect(d);d.connect(vg);vg.connect(out);const st=t+k/(2*f);s.start(st);w.start(st);oscs.push(s,w);nodes.push(d,sa,wg,vg);}
    return{inp,out,stop(){for(const o of oscs)try{o.stop();}catch(e){}for(const n of nodes)try{n.disconnect();}catch(e){}}};}

  /* the chain: only the pedals switched on are in it (a short dip while it is re-plugged, so it does not click) */
  let chainKey='',links=[];
  function rewire(){const P=E.P,seq=[{out:chainIn}];if(P.comp.on)seq.push(COMP);if(P.drive.on)seq.push(DRIVE);if(P.mod.on)seq.push(MOD);seq.push(AMP,LOOP);if(P.delay.on)seq.push(DELAY);if(P.verb.on)seq.push(VERB);seq.push({inp:preLim});
    const key=[P.comp.on,P.drive.on,P.mod.on,P.delay.on,P.verb.on].join();if(key===chainKey)return;
    const doIt=()=>{for(const n of links)try{n.disconnect();}catch(e){}links=[];for(let i=0;i<seq.length-1;i++){seq[i].out.connect(seq[i+1].inp);links.push(seq[i].out);}};
    if(!chainKey){chainKey=key;doIt();return;}chainKey=key;const t=ctx.currentTime;hold(preLim.gain,t);preLim.gain.setTargetAtTime(0,t,.004);
    setTimeout(()=>{doIt();const t2=ctx.currentTime;hold(preLim.gain,t2);preLim.gain.setTargetAtTime(1,t2,.01);},25);}

  /* every setting into the sound */
  E.apply=(clock)=>{const P=E.P;if(!P)return;const g=P.g;
    const pk={NECK:[4,-6,3800],MIDDLE:[1.5,-2.5,7000],BRIDGE:[0,0,20000]}[g.pick]||[0,0,20000];   /* neck: rounder and darker; middle: between */
    ramp(pkLo.gain,pk[0]);ramp(pkHi.gain,pk[1]);ramp(tone.frequency,Math.min(toneOf(g.tone),pk[2],g.mute>.02?9000-6500*g.mute:20000));ramp(gVol.gain,g.vol*1.1);
    const c=P.comp;cp.threshold.value=-8-34*c.sus;cp.ratio.value=3+9*c.sus;ramp(cpG.gain,dB((8+34*c.sus)*(1-1/(3+9*c.sus))*.45+(c.lvl-.5)*16));
    const d=P.drive,dg=1+60*d.drive*d.drive;ramp(drPre.gain,dg/8);ramp(drLp.frequency,1500*Math.pow(6,d.tone));ramp(drOut.gain,.5/Math.tanh(dg*.5)*(.25+1.5*d.lvl));
    const m=P.mod,rate=rateOf(m.rate);
    if(m.on&&!lfo){lfo=ctx.createOscillator();lfo.type='sine';lfo.connect(mDep);lfo.connect(mTrD);lfo.start();}
    if(!m.on&&lfo){try{lfo.stop();lfo.disconnect();}catch(e){}lfo=null;}
    if(lfo)ramp(lfo.frequency,rate,.05);
    if(m.mode==='CHORUS'){ramp(mDry.gain,1);ramp(mWet.gain,.75);mDl.delayTime.value=.012;ramp(mDep.gain,.0035*m.depth+.0003);ramp(mTrD.gain,0);ramp(mTr.gain,.85);}
    else if(m.mode==='VIBRATO'){ramp(mDry.gain,0);ramp(mWet.gain,1);mDl.delayTime.value=.006;ramp(mDep.gain,.0028*m.depth+.0002);ramp(mTrD.gain,0);ramp(mTr.gain,1);}
    else{ramp(mDry.gain,1);ramp(mWet.gain,0);ramp(mDep.gain,0);ramp(mTrD.gain,.5*m.depth);ramp(mTr.gain,1-.5*m.depth);}
    const a=P.amp,M=AMPS[a.model]||AMPS.clean,ag=M.lo*Math.pow(M.hi/M.lo,a.gain);
    if(curBias!==M.bias){aSh.curve=clipCurve(M.bias);curBias=M.bias;}
    ramp(aHp.frequency,M.hp);ramp(aPre.gain,ag/8);ramp(aMk.gain,.5/Math.tanh(ag*.5));
    ramp(aBass.gain,(a.bass-.5)*20);ramp(aMid.gain,(a.mid-.5)*20);ramp(aTreb.gain,(a.treb-.5)*20);
    aC1.frequency.value=M.col[0][0];ramp(aC1.gain,M.col[0][1]);aC1.Q.value=M.col[0][2];aC2.frequency.value=M.col[1][0];ramp(aC2.gain,M.col[1][1]);aC2.Q.value=M.col[1][2];
    ramp(aMaster.gain,1.6*Math.pow(a.master,1.6));
    if(cabOn!==!!a.cab){try{aC2.disconnect();}catch(e){}aC2.connect(a.cab?cab1:cabOut);cabOn=!!a.cab;}
    const dl=P.delay,bpm=(clock||M2.clock).bpm||120,dv=(DIVS.find(x=>x[0]===dl.div)||DIVS[2])[1],dt=Math.min(1.9,dv?dv*60/bpm:delFree(dl.time));
    ramp(dL.delayTime,dt,.05);ramp(dR.delayTime,dt,.05);ramp(dFb.gain,Math.min(.9,dl.fb*.9));ramp(dWet.gain,dl.mix*1.2);ramp(dDry.gain,1-dl.mix*.35);
    const v=P.verb;E.wetT=v.mix*1.4;ramp(rWet.gain,E.wetT);ramp(rDry.gain,1-v.mix*.5);
    /* OCEAN SWELL: TIDE's wave (a slow swell and ebb between MIX and full, in beats of the desk's tempo), the wheel, WAVE's rest */
    const s=P.swell,isT=s.on&&s.mode==='tide';
    if(isT&&!tide){tide=ctx.createOscillator();tide.setPeriodicWave(ctx.createPeriodicWave(new Float32Array([0,0,0]),new Float32Array([0,1,.18])));tide.connect(tideAmp);tide.start();}
    if(!isT&&tide){try{tide.stop();tide.disconnect();}catch(e){}tide=null;}
    if(tide){ramp(tide.frequency,1/(tideBeats(s.att)*60/bpm),.2);ramp(tideAmp.gain,(1-s.mix)/2*.92,.2);ramp(swG.gain,(1+s.mix)/2,.2);}
    else if(!(s.on&&s.mode==='wave'))ramp(swG.gain,1,.05);
    if(!(s.on&&s.wheel))ramp(whG.gain,1,.03);else ramp(whG.gain,E.wheelV==null?1:E.wheelV,.03);
    if(Math.abs(irSize-v.size)>.004){irSize=v.size;clearTimeout(irT);irT=setTimeout(()=>{rCv.buffer=hallIR(ctx,sizeOf(irSize));},rCv.buffer?150:0);}
    const wantSh=v.on&&v.shim>.01;
    if(wantSh&&!shim){shim=shifter(12,.06);rCv.connect(shim.inp);shim.out.connect(rShG);}
    if(!wantSh&&shim){try{rCv.disconnect(shim.inp);}catch(e){}shim.stop();shim=null;}
    ramp(rShG.gain,wantSh?.42*v.shim:0,.1);
    rewire();};

  /* a note: its own copy (or the nearest recording, sped), coming in at once or swelling, muted or ringing, panned if a harmony */
  /* (a note above the guitar's top, D6, folds down an octave or two, as a cello's section does: nothing is stretched past what the
     recordings reach; it still lets go with its own key) */
  E.play=(n,vel,o)=>{o=o||{};const n0=n;while(n>86)n-=12;const P=E.P,t=Math.max(ctx.currentTime,o.when||0),lay=vel<=92?'soft':'hard';E.rr=(E.rr||0)+1;
    let kb;if(o.rev){const b=revBuf(ctx,n,lay);kb=b&&{b,rate:1};}else kb=keyBuf(ctx,n,lay,1+E.rr%(n>=66?4:2));if(!kb)return null;
    const src=ctx.createBufferSource();src.buffer=kb.b;src.playbackRate.value=kb.rate*(E.bend?Math.pow(2,E.bend*2/12):1);
    /* soft picking where only hard picks were recorded (above E4): darker (a lowpass, lower the softer), a touch quieter and gentler
       at its start, as a lighter pick sounds; its own filter only on those notes */
    const fake=lay==='soft'&&kb.hard&&!o.rev,vs=clamp(vel/92,0,1);let lp=null;
    if(fake){lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1400+3800*Math.pow(vs,1.5);lp.Q.value=-3;src.connect(lp);}
    const g=ctx.createGain(),lvl=Math.pow(clamp(vel,1,127)/127,1.4)*(o.gain==null?1:o.gain)*(o.hammer?.8:1)*(fake?.72:1);g.gain.value=0;g.gain.setValueAtTime(0,t);(lp||src).connect(g);
    let pan=null;if(o.pan){pan=ctx.createStereoPanner();pan.pan.value=o.pan;g.connect(pan);pan.connect(vBus);}else g.connect(vBus);
    /* OCEAN SWELL: SENS picks the notes it swells (played softer than its line); EACH NOTE swells each one from MIX up; WAVE and
       RISE restart the shared swell or the hall's; DECAY lets every note fade after it has swelled (short: like tape backwards) */
    const S=P.swell,sOn=S.on&&!o.rev,soft=sOn&&vel<=thrOf(S.sens),sw=soft&&S.mode==='each',att=sw?swellOf(S.att):o.hammer?.012:fake?.005+.012*(1-vs):.003;
    if(sw){g.gain.linearRampToValueAtTime(lvl*S.mix,t+.003);sCurve(g.gain,lvl*S.mix,lvl,t+.004,att);}
    else g.gain.linearRampToValueAtTime(lvl,t+att);
    if(soft&&!o.harm&&!o.hammer){if(S.mode==='wave')E.wave(t);else if(S.mode==='rise')E.rise(t);}
    const tcs=[];if(P.g.mute>.02&&!o.rev)tcs.push(muteTc(P.g.mute));if(sOn&&S.dec<.98)tcs.push(decTc(S.dec));
    if(tcs.length)g.gain.setTargetAtTime(0,t+(sw?att+.005:att+.01)+(sOn&&S.mode!=='each'&&S.dec<.98?swellOf(S.att)*.6:0),Math.min(...tcs));
    src.start(t,o.offset||0);const v={n,src,g,pan,t0:t,att,lvl,rate0:kb.rate,str:o.str==null?-1:o.str,hammer:!!o.hammer,harm:!!o.harm,parent:o.parent==null?n0:o.parent,oneShot:!!o.rev,strum:o.strum||0,fake,released:false};
    src.onended=()=>{const i=E.voices.indexOf(v);if(i>=0)E.voices.splice(i,1);try{src.disconnect();g.disconnect();if(pan)pan.disconnect();if(lp)lp.disconnect();}catch(e){}};
    E.voices.push(v);while(E.voices.length>32)E.kill(E.voices[0],.02);return v;};
  E.release=(v,t,rel)=>{if(v.released)return;v.released=true;t=Math.max(t,v.t0+.01);const g=v.g.gain;hold(g,t);g.setTargetAtTime(0,t,rel/4);try{v.src.stop(t+rel+.05);}catch(e){}};
  E.kill=(v,rel)=>{const i=E.voices.indexOf(v);if(i>=0)E.voices.splice(i,1);E.release(v,ctx.currentTime,rel||.02);};
  E.relTime=()=>E.P.swell.on?Math.max(.3,swellOf(E.P.swell.att)*.5):.12;
  /* WAVE: everything ringing dips to MIX and swells back over FADE IN (as an old slow-gear pedal does on each new note) */
  const curveTo=(p,from,to,t,dur)=>{hold(p,t);p.linearRampToValueAtTime(from,t+.02);sCurve(p,from,to,t+.021,dur);};
  E.wave=t=>{const S=E.P.swell;curveTo(swG.gain,S.mix,1,t,swellOf(S.att));};
  /* RISE: the note plays as it is; the REVERB's share of it drops to MIX and rises behind it over FADE IN */
  E.rise=t=>{const S=E.P.swell,w=E.wetT||0;curveTo(rWet.gain,w*S.mix,w,t,Math.max(.3,swellOf(S.att)*1.5));};
  /* the mod wheel as a volume pedal (WHEEL lit): its square, so the bottom of its travel is gentle */
  E.wheel=v=>{E.wheelV=v*v;const S=E.P.swell;if(S.on&&S.wheel)ramp(whG.gain,E.wheelV,.03);};
  E.swState=()=>({sw:+swG.gain.value.toFixed(3),wheel:+whG.gain.value.toFixed(3),wet:+rWet.gain.value.toFixed(3),tide:!!tide});
  E.noteOff=(n,t)=>{t=t==null?ctx.currentTime:t;const rel=E.relTime();for(const v of E.voices)if(v.parent===n&&!v.released&&!v.oneShot)E.release(v,t,v.harm?rel*1.2:rel);};
  E.allOff=()=>{for(const v of [...E.voices])E.kill(v,.03);};
  E.panic=()=>{E.allOff();const t=ctx.currentTime;for(const g of [dFb,rWet,rShG,dWet]){hold(g.gain,t);g.gain.setTargetAtTime(0,t,.02);}clearTimeout(E._pT);E._pT=setTimeout(()=>E.apply(),1500);};
  E.wake=()=>{if(E.awake)return;E.awake=true;lim.connect(outG);lim.connect(meter);};
  E.sleep=()=>{if(!E.awake)return;E.awake=false;try{lim.disconnect();}catch(e){}};
  E.level=()=>{if(!E.awake)return 0;meter.getFloatTimeDomainData(mbuf);let s=0;for(const v of mbuf)s+=v*v;return Math.sqrt(s/mbuf.length);};
  E.inLevel=()=>{inMon.getFloatTimeDomainData(ibuf);let p=0;for(const v of ibuf){const a=Math.abs(v);if(a>p)p=a;}return p;};
  E.sndIn=sndIn;E.lfoOn=()=>!!lfo;E.shimOn=()=>!!shim;E.chain=()=>chainKey;
  E.dispose=()=>{E.allOff();if(lfo)try{lfo.stop();}catch(e){}if(shim)shim.stop();clearTimeout(irT);
    if(tide)try{tide.stop();}catch(e){}
    setTimeout(()=>{for(const n of [swG,whG,tideAmp,loopIn,padBus,vBus,pkLo,pkHi,tone,gVol,chainIn,sndIn,cp,cpG,drHp,drMid,drPre,drSh,drLp,drOut,mIn,mDry,mDl,mWet,mSum,mTr,mDep,mTrD,aHp,aPre,aSh,aMk,aBass,aMid,aTreb,aC1,aC2,cab1,cab2,cab3,cab4,cabOut,aMaster,dIn,dDry,dL,dR,dFb,dTone,dMg,dWet,dOut,rIn,rDry,rPre,rCv,rWet,rOut,rShG,preLim,lim])try{n.disconnect();}catch(e){}},300);};
  return E;}

/* ---- the face (a plain prototype: GUITAR and AMP on top, the PEDALBOARD below) ---- */
let styled=false;
function style(){if(styled)return;styled=true;const s=document.createElement('style');s.textContent=`
.dw{position:absolute;inset:0;border-radius:10px;overflow:hidden;background:linear-gradient(#2A211B,#17120F);color:#EADBC8;font:600 8px Bahnschrift,'Segoe UI',Arial;letter-spacing:.6px;user-select:none;box-shadow:inset 0 0 0 1px #4A3A2E}
.dw *{box-sizing:border-box}
.dw .top{position:absolute;left:0;right:0;bottom:0;height:30px;display:flex;align-items:center;gap:7px;padding:0 10px;background:linear-gradient(#3B2E25,#2A211B);border-top:1px solid #4A3A2E}   /* (the bar, along the bottom as HORIZON's) */
.dw .top .logo{margin-right:6px}.dw .vw{display:flex;gap:3px;margin:0 auto 0 6px}
.dw .logo{font:300 15px Bahnschrift,Arial;letter-spacing:6px;color:#F3E2C7}.dw .logo i{font-style:normal;color:#C98A4B}
.dw .sub{font-size:7px;color:#A8927B;letter-spacing:2px;margin-right:auto}
.dw .nmin{position:absolute;inset:1px;background:#0E1412;border:none;outline:1px solid #9FE3C0;border-radius:3px;color:#CFF7E2;font:700 9px Consolas,monospace;padding:0 6px}
.dw .lcd{position:relative;width:180px;height:20px;border-radius:4px;background:#0E1412;border:1px solid #33433D;color:#9FE3C0;font:600 8px Consolas,monospace;display:flex;flex-direction:column;justify-content:center;padding:0 6px;overflow:hidden;white-space:nowrap}
.dw .lcd b{font-weight:700;color:#CFF7E2}.dw .lcd span{opacity:.75}
.dw .bt{cursor:pointer;padding:3px 6px;border-radius:4px;background:#46382D;border:1px solid #5C4A3B;color:#EADBC8;font-size:7.5px;white-space:nowrap}
.dw .bt.on{background:#C98A4B;color:#1A120C;border-color:#E0A868}.dw .bt.down{filter:brightness(1.3)}
.dw .lamp{width:7px;height:7px;border-radius:50%;background:#3A2E26;box-shadow:inset 0 0 0 1px #000}.dw .lamp.on{background:#7CF0A8;box-shadow:0 0 6px #7CF0A8}
.dw .lamp.dim{opacity:.35}
.dw .panel{position:absolute;border-radius:8px}
.dw .gt{left:8px;top:36px;width:236px;height:118px;background:linear-gradient(160deg,#5A3B24,#3A2616);border:1px solid #6E4C31;box-shadow:inset 0 1px 0 #8A6442}
.dw .amp{left:252px;top:36px;width:500px;height:118px;background:#111;border:1px solid #333;box-shadow:inset 0 0 0 3px #1C1C1C}
.dw .amp .grill{position:absolute;left:6px;right:6px;top:6px;height:30px;border-radius:3px;background:repeating-linear-gradient(45deg,#3A3530 0 2px,#26221F 2px 4px);box-shadow:inset 0 0 8px #000}
.dw .amp .grill b{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:italic 700 13px Georgia,serif;color:#E8D8B8;letter-spacing:2px;text-shadow:0 1px 2px #000}
.dw .amp .face{position:absolute;left:6px;right:6px;top:40px;bottom:6px;border-radius:3px;background:linear-gradient(#D9C7A2,#BFA97F);color:#2A1E12;display:flex;align-items:center;gap:6px;padding:0 8px}
.dw .amp .face .bt{background:#2B2117;color:#E8D8B8;border-color:#000}.dw .amp .face .bt.on{background:#8E2B1F;color:#FFE9D0}
.dw .vk{font-size:7px;color:#A8927B;letter-spacing:1.5px}.dw .top .kn.topk{width:22px}.dw .top .kn label{display:none}
/* the view (GUITAR AMP PEDALS on the bar): a part hidden is gone from the stage; with the pedals hidden the stage grows down to the
   bar and the rig (guitar and amp, 744 × 222, its floor line at 212) grows with it, about its floor's middle; one left alone is centred */
.dw .rig{position:absolute;left:0;bottom:0;width:744px;height:222px;transform-origin:372px 212px;pointer-events:none;transition:transform .25s}
.dw.nop .board{display:none}.dw.nop .stage{height:360px}.dw.nop .rig{transform:scale(1.2)}   /* (1.2: the pair still clear of the stage's sides) */
.dw.nog .gtr{display:none}.dw.noa .amp2{display:none}.dw.nog .amp2{transform:translateX(-94px)}
.dw .stage{position:absolute;left:8px;top:4px;width:744px;height:222px;border-radius:8px;overflow:hidden;box-shadow:inset 0 0 30px rgba(0,0,0,.7);
  background:radial-gradient(ellipse 60% 90% at 50% 75%,rgba(255,190,120,.10),rgba(0,0,0,0) 70%),linear-gradient(#1A1410,#2A2019 85%,#221A14)}
/* the stage seen from the front: behind it Steve's photo of a coast at sunset (Skins\driftwood-stage.jpg, set on the stage itself:
   the dark wall here is only seen if it is missing), and the wooden floor the amp and the guitar stand on (its line at 212) */
.dw .sea{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .4s}.dw .sea.ready{opacity:1}
.dw .floor{position:absolute;left:0;right:0;height:10px;bottom:0;background:linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.1) 40%),repeating-linear-gradient(90deg,#5A3E28 0 38px,#3E2A1A 38px 39px,#4E3622 39px 80px,#35241A 80px 81px)}
.dw .floor::before{content:'';position:absolute;left:0;right:0;top:-1px;height:1px;background:rgba(255,220,180,.12)}
.dw .ph{position:absolute;pointer-events:none}.dw .phi{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none}.dw .phk,.dw .phz{position:absolute;cursor:pointer;pointer-events:auto}
.dw .gtr .phk::after{content:'';position:absolute;left:50%;top:5%;width:4px;height:34%;margin-left:-2px;border-radius:2px;background:#2A1808;box-shadow:0 0 0 1px rgba(255,240,210,.35)}
.dw .phzr{justify-content:flex-end;padding:0 5px 0 0}
.dw .phl{position:absolute;transform:translate(-100%,-50%);font:800 12px Bahnschrift,Arial;letter-spacing:1px;color:#F6E7C8;text-shadow:0 1px 2px rgba(0,0,0,.8);pointer-events:none;white-space:nowrap}
.dw .phzt{font:800 12px Bahnschrift,Arial;letter-spacing:1px;color:#F6E7C8;text-shadow:0 1px 2px rgba(0,0,0,.8);display:flex;align-items:center;padding-left:6px;border-radius:5px}
.dw .tgl{position:absolute;pointer-events:none}.dw .tgl::before{content:'';position:absolute;left:7px;top:7px;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#E8E8E4,#8A8A86 60%,#4A4A46)}
.dw .tgl::after{content:'';position:absolute;left:9px;top:9px;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#FFF6DE,#E2B86A 60%,#8E6A2C);box-shadow:0 2px 3px rgba(0,0,0,.6);transition:transform .12s}
.dw .tgl[data-pos=NECK]::after{transform:translateY(-11px)}.dw .tgl[data-pos=BRIDGE]::after{transform:translateY(11px)}
.dw .phb{position:absolute;pointer-events:none}.dw .phc{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.dw .phk{border-radius:50%;cursor:ns-resize}.dw .phk.off{filter:brightness(.6)}
.dw .phz{border-radius:12px}.dw .phz.on{background:rgba(255,205,110,.28);box-shadow:0 0 16px 6px rgba(255,190,80,.55)}.dw .phz.down{background:rgba(0,0,0,.2)}
.dw .phz.tog{border-radius:50%}.dw .phz.tog.on{background:none;box-shadow:none}
.dw .amp2 .phi{filter:drop-shadow(0 6px 10px rgba(0,0,0,.7))}.dw .gtr .phi{filter:drop-shadow(-8px 10px 12px rgba(0,0,0,.6))}
.dw .jewel{position:absolute;border-radius:50%;pointer-events:none}.dw.awake .jewel{background:radial-gradient(circle,#FFE6D8 0 20%,#FF4A30 50%,rgba(255,60,30,0) 100%);box-shadow:0 0 30px 12px rgba(255,70,40,.55)}
/* CAB off: the photo's own toggle (the patch under the switch) turned half round, its lever pointing down; it lets clicks through to
   the switch (it caught them before, so CAB could not be turned back on) */
.dw .cabz .cabdown{position:absolute;inset:0;border-radius:50%;transform:rotate(180deg);pointer-events:none}
.dw .cabz.on .cabdown{display:none}
.dw .board{left:8px;top:230px;width:744px;height:134px;background:repeating-linear-gradient(90deg,#1E1E22 0 2px,#252529 2px 6px);border:1px solid #333;padding:5px;display:flex;gap:5px}
.dw .ped{position:relative;flex:1;border-radius:7px;padding:5px 4px 0;display:flex;flex-direction:column;align-items:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 2px 4px #000}
.dw .ped .nm{font:700 8.5px Bahnschrift,Arial;letter-spacing:1.5px;color:#fff;text-shadow:0 1px 1px rgba(0,0,0,.5)}
.dw .ped .row{display:flex;gap:2px;margin-top:3px}
.dw .ped .chip{cursor:pointer;margin-top:3px;padding:1.5px 4px;border-radius:3px;background:rgba(0,0,0,.35);color:#fff;font-size:6.5px;white-space:nowrap;max-width:84px;overflow:hidden}
.dw .ped .chip.off{opacity:.35}.dw .ped .chip.on{background:#FFF3DC;color:#3A2410}
.dw .ped .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px;margin-top:3px}.dw .ped .grid .chip{margin-top:0;text-align:center;font-size:5.6px;padding:1.5px 0;letter-spacing:0;overflow:visible}
.dw .ped .led{position:absolute;left:50%;bottom:31px;margin-left:-3px;width:6px;height:6px;border-radius:50%;background:#3B0B0B;box-shadow:inset 0 0 0 1px #000}
.dw .ped.on .led{background:#FF4436;box-shadow:0 0 6px #FF4436}
.dw .ped .fs{position:absolute;left:50%;bottom:6px;margin-left:-11px;width:22px;height:22px;border-radius:50%;cursor:pointer;background:radial-gradient(circle at 40% 35%,#F2F2F2,#9A9A9A 55%,#555);box-shadow:0 1px 2px #000}
.dw .ped .fs.down{transform:translateY(1px);filter:brightness(.85)}
.dw .loop{position:relative;width:12px;display:flex;align-items:center;justify-content:center}
.dw .loop span{transform:rotate(-90deg);white-space:nowrap;font-size:6.5px;color:#9A8F80;letter-spacing:1px}
.dw .kn{display:flex;flex-direction:column;align-items:center;width:30px}
.dw .kn .cap{position:relative;width:22px;height:22px;border-radius:50%;cursor:ns-resize;background:radial-gradient(circle at 40% 35%,#3C3C3C,#111 70%);box-shadow:0 1px 2px #000,inset 0 0 0 1px #000}
.dw .kn .cap::after{content:'';position:absolute;left:50%;top:2px;width:2px;height:8px;margin-left:-1px;border-radius:1px;background:#F3E2C7;pointer-events:none}
.dw .kn.sm{width:26px}.dw .kn.sm label{font-size:5.6px;letter-spacing:.1px}.dw .kn.sm .cap{width:18px;height:18px}.dw .kn.sm .cap::after{height:6px}
.dw .kn.cream .cap{background:radial-gradient(circle at 40% 35%,#FFF8E6,#CFC2A4 70%)}.dw .kn.cream .cap::after{background:#2A1E12}
.dw .kn label{margin-top:2px;font-size:6.5px;pointer-events:none;white-space:nowrap}
.dw .kn.off{opacity:.4}
.dw .kn.play .cap{background:radial-gradient(circle at 40% 35%,#E7B77A,#8A5A2B 70%)}.dw .kn.play .cap::after{background:#1A0F06;height:10px}.dw .kn.play label{color:#FFD9A0}
.dw .gt .h{position:absolute;left:8px;top:6px;font:700 9px Bahnschrift,Arial;letter-spacing:3px;color:#F3E2C7}
.dw .gt .sw{position:absolute;display:flex;gap:3px;align-items:center}
.dw .gt .sw em{font-style:normal;font-size:6.5px;color:#D8BFA2;margin-right:2px}
.dw .gt .kns{position:absolute;display:flex;gap:4px}
.dw .ped.swell{flex:0 0 111px;padding:0;background:#0E3B44;border-radius:4px;overflow:hidden}
.dw .osf{position:absolute;left:0;top:0;transform-origin:0 0;transform:scale(.12398)}.dw .osb,.dw .osk,.dw .osfs,.dw .osw{position:absolute;cursor:pointer}
.dw .osb{border-radius:10px}.dw .osb.down,.dw .osfs.down{background:rgba(0,0,0,.25)}.dw .osb.on{box-shadow:inset 0 0 40px rgba(120,255,220,.3)}
.dw .osl{position:absolute;width:22px;height:22px;border-radius:50%;pointer-events:none}
.dw .osb.on .osl{background:radial-gradient(circle,#F0FFF8 0 30%,#5CFFC0 60%,rgba(60,255,170,0) 100%);box-shadow:0 0 22px 8px rgba(80,255,180,.7)}
.dw .osk{border-radius:50%;cursor:ns-resize}.dw .osfs{border-radius:50%}.dw .osst{position:absolute;border-radius:50%;pointer-events:none}
.dw .ped.swell.on .osst{background:radial-gradient(circle,#fff 0 25%,#8FF3FF 55%,rgba(100,230,255,0) 100%);box-shadow:0 0 34px 14px rgba(110,235,255,.6)}
.dw .osw{border-radius:10px}.dw .osw.on{box-shadow:0 0 0 5px rgba(120,255,220,.75),0 0 34px 12px rgba(120,255,220,.45);background:rgba(120,255,220,.14)}
.dw .ped .chip.whl{position:absolute;right:6px;bottom:12px;margin:0;font-size:5.6px;padding:1px 3px}.dw .ped.comp{background:linear-gradient(#3567C8,#244A92)}.dw .ped.drive{background:linear-gradient(#3EA04A,#27712F)}
.dw .ped.harm{background:linear-gradient(#6D3CC4,#46258A)}.dw .ped.pad{background:linear-gradient(#D98A2B,#9C5B14)}.dw .ped.mod{background:linear-gradient(#3FA6D9,#28769F)}.dw .ped.delay{background:linear-gradient(#9AA3AD,#5F6871)}.dw .ped.verb{background:linear-gradient(#24356A,#141F45)}
.dw.flash .lamp[data-l=kin]{background:#7CF0A8;box-shadow:0 0 6px #7CF0A8}`;document.head.appendChild(s);}

/* the knobs: their place in the settings, name, how their value reads, where a double-click puts them */
const KN={'g.playk':['PLAY',v=>{const m=PLAYS[Math.round(v*3)];return m+' · '+PLAYTIP[m];}],'g.vol':['VOLUME',pct],'g.tone':['TONE',v=>v>.98?'OPEN':Math.round(toneOf(v))+' HZ'],'g.mute':['MUTE',v=>v<.02?'OFF (RINGING)':pct(v)],'g.spread':['SPREAD',v=>Math.round(spreadOf(v)*1000)+' MS A STRING'],
  'swell.att':['FADE IN',v=>{const s=swellOf(v);return (s<1?Math.round(s*1000)+' MS':s.toFixed(2)+' S')+' · TIDE: A WAVE EVERY '+tideBeats(v)+' BEATS';}],'swell.sens':['SENS',v=>v>.98?'EVERY NOTE SWELLS':'NOTES SOFTER THAN '+Math.round(thrOf(v))+' SWELL, HARDER ONES PICK'],
  'swell.mix':['MIX',v=>v<.02?'PURE SWELL':pct(v)+' OF THE PICK KEPT'],'swell.dec':['DECAY',v=>v>.98?'RINGS ON':'FADES IN '+decTc(v).toFixed(2)+' S'],'comp.sus':['SUSTAIN',pct],'comp.lvl':['LEVEL',v=>((v-.5)*16>=0?'+':'')+((v-.5)*16).toFixed(1)+' DB'],
  'drive.drive':['DRIVE',pct],'drive.tone':['TONE',pct],'drive.lvl':['LEVEL',pct],'harm.mix':['MIX',pct],'mod.rate':['RATE',v=>rateOf(v).toFixed(2)+' HZ'],'mod.depth':['DEPTH',pct],
  'g.strumk':['STRUM',v=>({OFF:'OFF: EVERY KEY AT ONCE',DOWN:'DOWN: EACH CHORD LOW TO HIGH','DOWN/UP':'DOWN/UP: DOWN, THEN THE NEXT CHORD UP'})[STRUMS[Math.round(v*2)]]],
  'amp.chan':['CHANNEL',v=>(AMPS[Object.keys(AMPS)[Math.round(v*3)]]||AMPS.clean).name],'amp.gain':['GAIN',pct],'amp.bass':['BASS',v=>((v-.5)*20).toFixed(1)+' DB'],'amp.mid':['MIDDLE',v=>((v-.5)*20).toFixed(1)+' DB'],'amp.treb':['TREBLE',v=>((v-.5)*20).toFixed(1)+' DB'],'amp.master':['MASTER',pct],
  'pad.level':['LEVEL',pct],'pad.swell':['FADE IN',v=>v<.2?'QUICK':v<.6?'GENTLE':v<.85?'SLOW':'VERY SLOW'],
  'delay.time':['TIME',v=>Math.round(delFree(v)*1000)+' MS'],'delay.fb':['REPEATS',pct],'delay.mix':['MIX',pct],'verb.size':['SIZE',v=>sizeOf(v).toFixed(1)+' S'],'verb.mix':['MIX',pct],'verb.shim':['SHIMMER',v=>v<.01?'OFF':pct(v)]};
/* OCEAN SWELL's face: Steve's photo (Skins\ocean-swell.jpg, 1008 × 1050, made 2026-11-24 from the sketch Skins\ocean-swell-sketch.png:
   the Great Wave engraved on sea-teal, four mode buttons with their own lights). The pedal is cut out of it (cut: x, y, w, h) and
   every live part laid on at the photo's own pixels, the whole scaled to the board (122 / 984). Its knob caps are cut from the photo
   and turn, each from where its pointer was photographed (degrees clockwise from straight up) */
const OS={src:'mixtape2/Skins/ocean-swell.jpg',iw:1008,ih:1050,cut:[62,38,896,984],
  modes:{each:[90,182,406,80,120,222],wave:[518,182,408,80,560,222],tide:[90,288,406,80,120,328],rise:[518,288,408,80,560,328]},   /* button x y w h, its light */
  knobs:[['swell.att',165,468,82],['swell.sens',390,465,49],['swell.mix',622,468,-143],['swell.dec',850,468,-90]],kr:64,
  led:[507,746,16],fs:[507,882,80],wheel:[715,862,213,63]};
function osFace(){const u=M2.fileUrl(OS.src),[cx,cy,cw,ch]=OS.cut,bg=(x,y)=>`background:url('${u}') ${-x}px ${-y}px/${OS.iw}px ${OS.ih}px no-repeat`,
    at=(x,y,w,h)=>`left:${x-cx}px;top:${y-cy}px;width:${w}px;height:${h}px`;
  return `<div class="osf" style="width:${cw}px;height:${ch}px;${bg(cx,cy)}">`+
    SWM.map(([k])=>{const [x,y,w,h,lx,ly]=OS.modes[k];return `<div class="osb" data-b="swm.${k}" title="${SWTIP[k].toLowerCase()}" style="${at(x,y,w,h)}"><i class="osl" style="left:${lx-x-11}px;top:${ly-y-11}px"></i></div>`;}).join('')+
    OS.knobs.map(([k,x,y,off])=>{const r=OS.kr;return `<div class="osk" data-k="${k}" data-off="${off}" title="${KN[k][0].toLowerCase()}" style="${at(x-r,y-r,2*r,2*r)};${bg(x-r,y-r)}"></div>`;}).join('')+
    `<i class="osst" style="${at(OS.led[0]-OS.led[2],OS.led[1]-OS.led[2],2*OS.led[2],2*OS.led[2])}"></i>`+
    `<div class="osfs" data-s="swell" title="OCEAN SWELL on / off" style="${at(OS.fs[0]-OS.fs[2],OS.fs[1]-OS.fs[2],2*OS.fs[2],2*OS.fs[2])}"></div>`+
    `<div class="osw" data-b="swell.wheel" title="lit: the keyboard's mod wheel is a volume pedal" style="${at(...OS.wheel)}"></div></div>`;}
/* THE STAGE (Steve's picks, 2026-11-24): the guitar lying top left, the amp standing top right, the pedalboard below. Each is a picture
   laid on at its own pixels (cut: x, y, w, h of the picture; at: where on the face; s: its scale), its live parts placed in the picture's
   pixels (at: in the stage, which is 744 × 194): knob caps cut from the picture that turn (off: where the picture's pointer points, degrees clockwise from up), zones that
   light round a switch's printed place, and the switches themselves (a click steps them on).
   The guitar: until Steve's photo comes, the design sketch Skins\driftwood-guitar.svg (2000 × 820, tools\probes\m2-driftwood-sketch.js). */
/* the guitar: Steve's photo Skins\driftwood-guitar.jpg (1518 × 688, a cherry-sunburst single-cut, DRIFTWOOD on its headstock), cut out
   of its white backdrop as driftwood-guitar.png (tools\cutout.ps1), as big as the stage is tall. Its four bell knobs (r 21, no pointer
   of their own: one is painted on) are TONE MUTE PLAY STRUM, labelled below; VOLUME is on the top bar and SPREAD keeps its setting
   unseen (Steve, 2026-11-24). Its toggle on the upper horn is the PICKUP: a drawn lever thrown up (NECK), centred (MIDDLE) or down
   (BRIDGE), its three places named beside it */
/* (the stage is seen from the front, the floor at 212. The guitar rests as a real one would (Steve, 2026-11-24): on the floor at two
   points, the bottom of its body (photo 330,618) and the end of its headstock (1490,445), so it slopes rot = 8.3°, the angle that
   levels those two; and against the amp at one, its upper horn (740,232) on the amp's left edge; its headstock ends on the floor at the
   amp's right-hand corner, in front. At that slope it stands 525 photo px tall (body top 350,84 to the floor): s .38 fills the stage.
   The pair in the middle of the stage) */
const GT={src:'mixtape2/Skins/driftwood-guitar.png',iw:1518,ih:688,cut:[56,80,1442,540],at:[101,36.4],s:.38,rot:8.8,cls:'gtr',   /* (8.8°, worked out from the photo's own outline: the body's lowest pixel (x 308) and the headstock's
       (x 1448) level; standing 536 px tall; its upper horn reaching furthest right of the body, where the amp's left edge meets it) */
  knobs:[['g.tone',176,467,21,0],['g.mute',268,468,21,0],['g.playk',216,538,21,0],['g.strumk',309,540,21,0]],
  labels:[['TONE',152,467],['MUTE',244,468],['PLAY',192,538],['STRUM',285,540]],   /* (each just left of its knob, on the wood: x its right end, y its middle) */
  zones:[['pick.NECK',555,196,60,17,'phzr','NECK'],['pick.MIDDLE',555,214,60,17,'phzr','MIDDLE'],['pick.BRIDGE',555,232,60,17,'phzr','BRIDGE'],['pick.cycle',618,192,56,56,'tog']],
  toggle:[646,220]};
/* the amp: Steve's photo Skins\driftwood-amp.jpg (1190 × 896, a boutique combo in a room): cut out along its own edge, handle and all
   (the wall seen under the handle left out); its chicken-head knobs reach 45 px and were photographed pointing 32° right of up */
/* (traced on the photo, which looks down on the amp a little, so its sides lean in: x 83 → 100 on the left, 1117 → 1104 on the right;
   metal corners; the wall under the handle left out). mask: each chicken-head is cut out by its own shape so only the knob turns and
   the printed dots round it stay: its round base (rb) whole, then the cream of its pointer (within ptr[0]° of where it points, out to
   ptr[1] px) and of its tail (tail[0]° round from the pointer, within tail[1]°, out to tail[2] px) */
const AM={src:'mixtape2/Skins/driftwood-amp.jpg',iw:1190,ih:896,cut:[80,28,1040,792],at:[328.5,2],s:.265,cls:'amp2',   /* (its left edge at the guitar's pickup switch, so the guitar leans on it; the pair centred) */   /* (its feet on the floor line) */
  clip:'polygon(evenodd,3px 75px,6px 68px,14px 64px,24px 63px,338px 63px,332px 56px,331px 46px,336px 38px,350px 32px,390px 22px,440px 12px,520px 5px,600px 12px,650px 22px,690px 32px,710px 38px,716px 46px,714px 58px,708px 63px,692px 63px,686px 54px,660px 44px,620px 34px,570px 25px,520px 19px,470px 24px,420px 32px,380px 42px,360px 50px,354px 58px,352px 63px,1026px 63px,1032px 64px,1037px 68px,1038px 75px,1024px 772px,1020px 784px,1012px 789px,28px 789px,21px 784px,19px 772px)',
  knobs:[['amp.chan',234,212,45,32],['amp.gain',381,212,45,32],['amp.bass',515,212,45,32],['amp.mid',648,212,45,32],['amp.treb',781,212,45,32],['amp.master',913,212,45,32]],
  mask:{rb:32,ptr:[25,40],tail:[188,32,45]},
  zones:[['cab',1012,166,34,36,'tog cabz']],jewel:[1029,264,17]};
const AMPK=Object.keys(AMPS);

/* THE SEA (Steve, 2026-11-24: "waves moving in from the sea"): the coast photo drawn by a small picture program on the graphics card
   (WebGL), its water moving and the rest still. The water is the outline SEA (traced on the photo, 1408 × 768: horizon to the left-hand
   cliffs and the beach, the headland and sand kept out), its surf the bright colourless water inside it. Swells roll in from the horizon:
   bands at a perspective depth (1 / distance below the horizon), so they are slow and close together far out and widen as they come in,
   slightly from the left as the photo's swell does; each lifts and darkens the water a little and nudges it; the surf flares as one
   arrives. How loud DRIFTWOOD plays makes the sets bigger. Drawn about 30 times a second only
   while it sounds and is in sight, otherwise not at all (the last picture stays). The photo is read from its bytes (WebGL may not take a
   file:// picture loaded by its address) */
const SEA={src:'mixtape2/Skins/driftwood-stage.jpg',iw:1408,ih:768,horizon:258,
  /* (its lower edge follows the foam's edge on both beaches, so the sand, dry and wet, stays still) */
  poly:[[0,258],[830,258],[980,268],[985,290],[900,305],[830,315],[780,340],[760,385],[800,393],[845,398],[895,400],[875,420],[858,440],[848,460],[822,480],[792,498],[760,515],[730,520],[690,528],[650,535],[625,552],[600,558],[570,562],[545,568],[525,560],[510,540],[470,530],[440,490],[380,470],[300,465],[220,465],[160,470],[140,490],[100,520],[60,540],[0,555]],
  /* the swell's way (Steve: in from the upper left toward the lower right): on the sea's surface, seen in perspective, its crests
     slant r (lateral over depth): measured in the photo they lie almost level far out (0.4°) and slant a little nearer (1.6 to 2.6°),
     as distant swell does; r = -1.5 keeps them that flat far out and slants them about 15° near the beach, travelling to the lower right */
  r:-1.5};
async function seaGL(cv,files){const gl=cv.getContext('webgl',{alpha:false,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});   /* (kept: the last picture stays while it sleeps) */if(!gl)throw new Error('no WebGL');
  const u=await files.read(SEA.src),bmp=await createImageBitmap(new Blob([u]));
  /* the mask, half the photo's size: red the water (the outline, softened, less its rocks), green its surf (bright and colourless).
     A rock is anything in the water darker than any water is (lum under 62; the darkest water measured about 100), grown by 2 px so its
     edge does not wobble */
  const mw=704,mh=384,mc=document.createElement('canvas');mc.width=mw;mc.height=mh;const g=mc.getContext('2d');
  g.filter='blur(1.5px)';g.fillStyle='#fff';g.beginPath();SEA.poly.forEach(([x,y],i)=>g[i?'lineTo':'moveTo'](x*mw/SEA.iw,y*mh/SEA.ih));g.closePath();g.fill();g.filter='none';
  const poly=g.getImageData(0,0,mw,mh).data,pc=document.createElement('canvas');pc.width=mw;pc.height=mh;const pg=pc.getContext('2d');pg.drawImage(bmp,0,0,mw,mh);
  const px=pg.getImageData(0,0,mw,mh).data,md=g.createImageData(mw,mh),rock=new Uint8Array(mw*mh),near=new Uint8Array(mw*mh);
  for(let i=0;i<mw*mh;i++){const q=i*4;if(.3*px[q]+.59*px[q+1]+.11*px[q+2]<62)rock[i]=1;}
  for(let y=0;y<mh;y++)for(let x=0;x<mw;x++)if(rock[y*mw+x])for(let j=Math.max(0,y-2);j<=Math.min(mh-1,y+2);j++)for(let k=Math.max(0,x-2);k<=Math.min(mw-1,x+2);k++)near[j*mw+k]=1;
  for(let i=0;i<mw*mh;i++){const q=i*4,r=px[q],gg=px[q+1],b=px[q+2],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),lum=.3*r+.59*gg+.11*b,w=poly[q]/255*(near[i]?0:1);
    const foam=w*Math.min(1,Math.max(0,(lum-125)/60))*Math.min(1,Math.max(0,1-(mx-mn-18)/30));md.data[q]=w*255;md.data[q+1]=foam*255;md.data[q+2]=0;md.data[q+3]=255;}
  g.putImageData(md,0,0);g.filter='blur(.8px)';g.drawImage(mc,0,0);
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o;};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 v;uniform sampler2D uImg,uMask;uniform vec2 uStage,uSize;uniform vec3 uFit;uniform float uT,uLv,uH,uR,uAsp;
    void main(){vec2 s=v*uStage,uv=(s-uFit.yz)/(uFit.x*uSize);vec4 m=texture2D(uMask,uv);
      float d=max(uv.y-uH,.004),far=smoothstep(.012,.06,uv.y-uH);   /* (far out the swells are too close to see: still, so the horizon does not shimmer) */
      /* the swell on the sea's surface: depth 1/d, across (x-.5)*aspect/d, its crests slanting by uR; sin(ph+t): they come toward
         the viewer and to the right */
      float wa=m.r*far,fo=m.g*far,ph=.55*(1.+uR*uAsp*(uv.x-.5))/d+uT*.9,w=sin(ph),cr=pow(max(w,0.),5.),amp=.45+uLv;
      vec2 uv2=uv+vec2(0.,cos(ph)*.0014*amp*min(d*4.,1.))*wa;
      uv2=mix(uv,uv2,step(.6,texture2D(uMask,uv2).r));             /* (never reaching across into a rock, the sand or the shore) */
      vec3 c=texture2D(uImg,uv2).rgb;
      c*=1.+wa*(cr*.2-.05*w)*amp*(.25+.75*smoothstep(.05,.3,d));     /* a swell: its face a touch darker, its crest lit (faint far out) */
      c+=fo*cr*vec3(.34,.36,.38)*amp;                                 /* the surf flaring as it arrives */
      c*=mix(.88,1.,smoothstep(0.,.3,v.y))*mix(1.,.62,smoothstep(.3,1.,v.y));
      gl_FragColor=vec4(c,1.);}`));
  gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));gl.useProgram(pr);
  const bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const ap=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,2,gl.FLOAT,false,0,0);
  const tex=(unit,src)=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);
    for(const [k,v] of [[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE],[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR]])gl.texParameteri(gl.TEXTURE_2D,k,v);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,src);return t;};
  tex(0,bmp);tex(1,mc);if(bmp.close)bmp.close();
  const U={};for(const n of ['uImg','uMask','uStage','uSize','uFit','uT','uLv','uH','uR','uAsp'])U[n]=gl.getUniformLocation(pr,n);
  gl.uniform1i(U.uImg,0);gl.uniform1i(U.uMask,1);gl.uniform2f(U.uSize,SEA.iw,SEA.ih);gl.uniform1f(U.uH,SEA.horizon/SEA.ih);gl.uniform1f(U.uR,SEA.r);gl.uniform1f(U.uAsp,SEA.iw/SEA.ih);
  return {draw(W,H,t,lv){const q=1.6,pw=Math.round(W*q),ph=Math.round(H*q);if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;}gl.viewport(0,0,pw,ph);
      const sc=Math.max(W/SEA.iw,H/SEA.ih);gl.uniform2f(U.uStage,W,H);gl.uniform3f(U.uFit,sc,(W-SEA.iw*sc)*.5,(H-SEA.ih*sc)*.3);gl.uniform1f(U.uT,t);gl.uniform1f(U.uLv,lv);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);},
    dispose(){const x=gl.getExtension('WEBGL_lose_context');if(x)x.loseContext();}};}
function phLayer(P){const u=M2.fileUrl(P.src),[cx,cy,cw,ch]=P.cut,bg=(x,y)=>`background:url('${u}') ${-x}px ${-y}px/${P.iw}px ${P.ih}px no-repeat`,
    at=(x,y,w,h)=>`left:${x-cx}px;top:${y-cy}px;width:${w}px;height:${h}px`;
  return `<div class="ph ${P.cls}" style="left:${P.at[0]}px;top:${P.at[1]}px;width:${cw*P.s}px;height:${ch*P.s}px${P.rot?`;transform:rotate(${P.rot}deg)`:''}">`+
    `<div class="phi" style="width:${cw}px;height:${ch}px;transform:scale(${P.s});${bg(cx,cy)}${P.clip?';clip-path:'+P.clip:''}">`+
    P.knobs.map(([k,x,y,r,off])=>{const R=P.mask?r+5:r;return (P.mask?`<div class="phb" style="${at(x-R,y-R,2*R,2*R)}"></div>`:'')+
      `<div class="phk" data-k="${k}" data-off="${off}" title="${KN[k][0].toLowerCase()}" style="${at(x-R,y-R,2*R,2*R)};${bg(x-R,y-R)}"></div>`;}).join('')+
    P.zones.map(([b,x,y,w,h,c,t])=>`<div class="phz ${c||''}${t?' phzt':''}" data-b="${b}" style="${at(x,y,w,h)}">${b==='cab'?`<i class="cabdown" style="${bg(x,y)}"></i>`:t||''}</div>`).join('')+
    (P.labels||[]).map(([t,x,y])=>`<span class="phl" style="left:${x-cx}px;top:${y-cy}px">${t}</span>`).join('')+
    (P.toggle?`<i class="tgl" style="${at(P.toggle[0]-16,P.toggle[1]-16,32,32)}"></i>`:'')+
    (P.jewel?`<i class="jewel" style="${at(P.jewel[0]-P.jewel[2],P.jewel[1]-P.jewel[2],2*P.jewel[2],2*P.jewel[2])}"></i>`:'')+'</div></div>';}
const PEDALS=[['swell','OCEAN SWELL','notes rise like a swell on the sea: each note, a wave, the tide, or the hall rising'],['comp','COMP','evens and lengthens'],['drive','DRIVE','a warm overdrive'],['harm','HARMONY','harmonies in the key'],['mod','MOD','chorus · vibrato · tremolo'],['pad','PAD','HALO\'s pad under the guitar, on the keys you hold'],
  ['delay','DELAY','echoes, in time with the desk'],['verb','REVERB','a hall, shimmer above it']];
const PNAME={swell:'OCEAN SWELL',comp:'COMP',drive:'DRIVE',harm:'HARMONY',mod:'MOD',pad:'PAD',delay:'DELAY',verb:'REVERB'};

const DEF={id:'driftwood',name:'DRIFTWOOD electric guitar',short:'DRIFTWOOD',type:'instrument',version:'0.1',format:1,w:W,h:H,scale:1.75,   /* (opens at 175%: 1330 × 700 on the laptop's 1536 × 864) */
  blurb:'An electric guitar for writing songs: guitar, pedalboard (swell, comp, drive, harmony, mod), amp and cabinet, delay and reverb',
  sockets:[{id:'keys',kind:'control',dir:'in',label:'Keys in',side:'left',at:.3,tag:'notes'},{id:'in',kind:'sound',dir:'in',label:'Sound in',side:'left',at:.7,auto:false},
    {id:'out',kind:'sound',dir:'out',label:'Output',side:'right',at:.3,normal:true}],
  settings:{v:null,preset:0,edited:false,view:{g:true,a:true,p:true}},   /* (view: what the stage shows, kept with the setup) */
  preview(){style();const d=document.createElement('div');
    d.style.cssText='position:relative;width:180px;height:77px;border-radius:9px;overflow:hidden;background:linear-gradient(#2A211B,#17120F);box-shadow:inset 0 0 0 1px #4A3A2E';
    d.innerHTML='<b style="position:absolute;left:10px;top:7px;font:300 12px Bahnschrift,Arial;letter-spacing:4px;color:#F3E2C7">DRIFT<i style="font-style:normal;color:#C98A4B">WOOD</i></b>'+
      '<div style="position:absolute;left:10px;right:10px;bottom:8px;height:30px;display:flex;gap:3px">'+['#2BA3A0','#3567C8','#3EA04A','#6D3CC4','#3FA6D9','#D98A2B','#9AA3AD','#24356A'].map(c=>`<i style="flex:1;border-radius:3px;background:${c}"></i>`).join('')+'</div>';return d;},
  create(host){style();const S=host.settings,ctx=host.engine.ctx,clock=host.clock||M2.clock,uid=host.uid;
    const outG=ctx.createGain(),E=Engine(ctx,outG);
    if(S.v&&S.v.g&&S.v.g.ring===false&&!S.v.g.play)S.v.g.play='HOLD';   /* a desk saved before the PLAY knob, LET RING off */
    if(!S.v)S.v=fresh(PRESETS[0][1]);else S.v=deep(fresh({}),S.v);delete S.v.g.ring;if(!PLAYS.includes(S.v.g.play))S.v.g.play='RING';
    const P=()=>{E.P=S.v;return S.v;};P();
    let dead=false,sleepT=0,quietSince=0,flashT=0,pedal=false,comp=false,koct=0,kvel=100,offMidi=null,strumDir=1,strumAt=0,strumN=0,pend=null,pendT=0,kinT=0;
    const down=new Set(),sus=new Set(),typed=new Set();
    const plugged=s=>M2.patch.at(uid,s).length>0;
    /* (PLAY and the amp's CHANNEL are switches in four steps on a knob) */
    const get=k=>k==='g.playk'?PLAYS.indexOf(mode())/3:k==='amp.chan'?AMPK.indexOf(S.v.amp.model)/3:k==='g.strumk'?STRUMS.indexOf(S.v.g.strum)/2:k.split('.').reduce((o,p)=>o&&o[p],S.v),
      put=(k,v)=>{if(k==='g.playk'){S.v.g.play=PLAYS[clamp(Math.round(v*3),0,3)];return;}if(k==='amp.chan'){S.v.amp.model=AMPK[clamp(Math.round(v*3),0,3)];return;}
        if(k==='g.strumk'){S.v.g.strum=STRUMS[clamp(Math.round(v*2),0,2)];return;}   /* (STRUM: a switch in three steps on a knob) */
        const p=k.split('.'),l=p.pop();p.reduce((o,q)=>o[q],S.v)[l]=v;};

    /* ---- the face ---- */
    const m=document.createElement('div');m.className='dw';host.el.appendChild(m);
    const knob=(k,cls)=>`<div class="kn ${cls||''}" data-kw="${k}"><div class="cap" data-k="${k}"></div><label>${KN[k][0]}</label></div>`;
    const ped=(id,name,inner)=>`<div class="ped ${id}" data-p="${id}" title="${PEDALS.find(x=>x[0]===id)[2]}"><div class="nm">${name}</div>${inner}<div class="led"></div><div class="fs" data-s="${id}"></div></div>`;
    m.innerHTML=`<div class="top"><span class="logo">DRIFT<i>WOOD</i></span>
      <span class="bt" data-b="prev">‹</span><div class="lcd"><b data-t="l1"></b><span data-t="l2"></span></div><span class="bt" data-b="next">›</span><span class="bt" data-b="save" title="keep the sound as it is now as a preset of your own, named as you type it (every DRIFTWOOD has it)">SAVE</span>
      <span class="vw"><span class="bt" data-b="view.g" title="show or hide the guitar">GUITAR</span><span class="bt" data-b="view.a" title="show or hide the amp">AMP</span><span class="bt" data-b="view.p" title="show or hide the pedalboard: hidden, the stage grows down to this bar">PEDALS</span></span>
      <span class="vk">VOLUME</span>${knob('g.vol','sm topk')}
      <span class="lamp" data-l="kin" title="KEYS IN: lights with each note"></span>
      <span class="bt" data-b="keys" title="play from the computer keyboard: A W S E D F T G… · Z X octave · C V velocity">KEYS</span><span class="bt" data-b="panic" title="stop every note and echo">PANIC</span></div>
    <div class="stage" title="" style="background:linear-gradient(rgba(0,0,0,.12),rgba(0,0,0,0) 30%,rgba(0,0,0,.38)),url('${M2.fileUrl('mixtape2/Skins/driftwood-stage.jpg')}') center 30%/cover no-repeat,#1A1410"><canvas class="sea"></canvas><div class="floor"></div><div class="rig">${phLayer(AM)}${phLayer(GT)}</div></div>
    <div class="panel board">
      <div class="ped swell" data-p="swell" title="OCEAN SWELL: notes rise like a swell on the sea">${osFace()}</div>
      ${ped('comp','COMP',`<div class="row">${knob('comp.sus','sm')}${knob('comp.lvl','sm')}</div>`)}
      ${ped('drive','DRIVE',`<div class="row">${knob('drive.drive','sm')}${knob('drive.tone','sm')}${knob('drive.lvl','sm')}</div>`)}
      ${ped('harm','HARMONY',`<div class="chip" data-c="harm.mode"></div><div class="row"><div class="chip" data-c="harm.key"></div><div class="chip" data-c="harm.iv"></div></div><div class="row">${knob('harm.mix','sm')}</div>`)}
      ${ped('mod','MOD',`<div class="chip" data-c="mod.mode"></div><div class="row">${knob('mod.rate','sm')}${knob('mod.depth','sm')}</div>`)}
      <div class="loop" title="PAD, DELAY and REVERB sit in the amp's effects loop: after its drive"><span>AMP LOOP →</span></div>
      ${ped('pad','PAD',`<div class="grid">${PADS.map(c=>`<span class="chip" data-b="pad.${c}">${c.toUpperCase()}</span>`).join('')}</div><div class="row">${knob('pad.level','sm')}${knob('pad.swell','sm')}</div>`)}
      ${ped('delay','DELAY',`<div class="chip" data-c="delay.div"></div><div class="row">${knob('delay.time','sm')}${knob('delay.fb','sm')}${knob('delay.mix','sm')}</div>`)}
      ${ped('verb','REVERB',`<div class="row">${knob('verb.size','sm')}${knob('verb.mix','sm')}${knob('verb.shim','sm')}</div>`)}</div>`;
    const $=s=>m.querySelector(s),$$=s=>[...m.querySelectorAll(s)];
    /* a picture's knobs cut out by their own shape (P.mask): made once from the picture's bytes (a canvas may not read back a file://
       picture loaded by its address); each knob becomes a cap that turns, over a patch of the panel's own black that hides the knob
       photographed beneath, so the panel's printed dots round it stay still. Until it is made the knob turns as a plain disc */
    async function cutKnobs(P){const K=P.mask;if(!K)return;let bmp;
      try{const f=host.files||window.mixtapeFiles,u=await f.read(P.src);bmp=await createImageBitmap(new Blob([u]));}catch(e){console.warn('DRIFTWOOD knobs',e);return;}
      if(dead)return;const near=(a,c,w)=>Math.abs(((a-c)%360+540)%360-180)<=w;
      for(const [k,x,y,r,off] of P.knobs){const R=r+5,n=2*R,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d');g.drawImage(bmp,x-R,y-R,n,n,0,0,n,n);
        const px=g.getImageData(0,0,n,n).data,a=new Float32Array(n*n);let pr=0,pg=0,pb=0,pc=0;
        for(let j=0;j<n;j++)for(let i=0;i<n;i++){const dx=i+.5-R,dy=j+.5-R,d=Math.hypot(dx,dy),q=(j*n+i)*4,lum=.3*px[q]+.59*px[q+1]+.11*px[q+2];
          if(d>K.rb+2&&d<K.rb+6&&lum<55){pr+=px[q];pg+=px[q+1];pb+=px[q+2];pc++;}   /* the panel's own black, just round the knob */
          if(d<=K.rb){a[j*n+i]=1;continue;}
          const ang=(Math.atan2(dx,-dy)*180/Math.PI+360)%360;
          if(near(ang,off,K.ptr[0])&&d<=K.ptr[1]||near(ang,off+K.tail[0],K.tail[1])&&d<=K.tail[2])a[j*n+i]=clamp((lum-60)/50,0,1);}
        /* the patch under it: the panel as it is a quarter turn round the same knob, where nothing covers it (its texture and printed
           dots at the same distance), so the photographed knob's place looks like bare panel; under the round base (always covered by
           the cap) plain panel black */
        const cap=g.createImageData(n,n),base=g.createImageData(n,n),col=pc?[pr/pc,pg/pc,pb/pc]:[20,20,18];
        const from=(i,j)=>{const dx=i+.5-R,dy=j+.5-R;if(Math.hypot(dx,dy)<=K.rb)return null;
          for(const t of [90,-90,135,-135]){const c=Math.cos(t*Math.PI/180),s=Math.sin(t*Math.PI/180),si=Math.round(R+dx*c-dy*s-.5),sj=Math.round(R+dx*s+dy*c-.5);
            if(si>=0&&sj>=0&&si<n&&sj<n&&a[sj*n+si]===0)return (sj*n+si)*4;}return null;};
        for(let j=0;j<n;j++)for(let i=0;i<n;i++){const o=j*n+i,q=o*4;let mx=0;
          for(let y2=Math.max(0,j-2);y2<=Math.min(n-1,j+2);y2++)for(let x2=Math.max(0,i-2);x2<=Math.min(n-1,i+2);x2++)if(a[y2*n+x2]>mx)mx=a[y2*n+x2];
          cap.data[q]=px[q];cap.data[q+1]=px[q+1];cap.data[q+2]=px[q+2];cap.data[q+3]=a[o]*255;
          if(Math.hypot(i+.5-R,j+.5-R)>K.tail[2]+.5)mx=0;   /* (never past the knob's reach: a printed dot just beyond it, as CHANNEL's CLEAN, stays whole) */
          const sq=mx?from(i,j):null;base.data[q]=sq==null?col[0]:px[sq];base.data[q+1]=sq==null?col[1]:px[sq+1];base.data[q+2]=sq==null?col[2]:px[sq+2];base.data[q+3]=mx*255;}
        const cv=id=>{const v=document.createElement('canvas');v.width=v.height=n;v.getContext('2d').putImageData(id,0,0);v.className='phc';return v;};
        const el=m.querySelector(`.${P.cls} [data-k="${k}"]`);if(!el)continue;el.previousElementSibling.appendChild(cv(base));el.style.background='none';el.appendChild(cv(cap));}
      if(bmp.close)bmp.close();}
    cutKnobs(AM);cutKnobs(GT);
    /* the sea (seaGL): a first picture once it is made (the photo behind it until then), then about 30 a second while DRIFTWOOD sounds
       and is in sight; its swells come in faster and bigger the louder it plays (seaLv: quick up, slow down); asleep, the last picture stays */
    let sea=null,seaRaf=0,seaT=0,seaLv=0,seaLast=0,seaFrames=0,inSight=true;const seaCv=$('.sea');
    const seaSize=()=>[744,S.view.p?222:360],seaStill=()=>{if(sea&&!seaRaf)sea.draw(...seaSize(),seaT,seaLv);};
    seaGL(seaCv,host.files||window.mixtapeFiles).then(o=>{if(dead){o.dispose();return;}sea=o;seaStill();seaCv.classList.add('ready');seaGo();}).catch(e=>console.warn('DRIFTWOOD sea',e));
    function seaFrame(now){seaRaf=0;if(dead||!sea)return;if(!(E.awake&&inSight)){seaLast=0;return;}
      if(!seaLast||now-seaLast>=30){const dt=seaLast?Math.min(.1,(now-seaLast)/1000):1/30;seaLast=now;
        const tgt=Math.min(1,E.level()*4);seaLv+=(tgt-seaLv)*(tgt>seaLv?.25:.04);seaT+=dt*(1+seaLv*.6);sea.draw(...seaSize(),seaT,seaLv);seaFrames++;}
      seaRaf=requestAnimationFrame(seaFrame);}
    function seaGo(){if(sea&&!seaRaf&&E.awake&&inSight)seaRaf=requestAnimationFrame(seaFrame);}
    const names=()=>PRESETS.map(p=>p[0]).concat((M2.settings.driftwoodMine||[]).map(x=>x.name));
    let msg=null;
    function show(){const l1=$('[data-t=l1]'),l2=$('[data-t=l2]');
      if(msg){l1.textContent=msg[0];l2.textContent=msg[1];return;}
      if(SAMP.state==='loading'||SAMP.state==='missing'){l1.textContent=SAMP.state==='missing'?'NO GUITAR RECORDINGS':'TUNING UP';l2.textContent=SAMP.state==='missing'?'INSTRUMENTS\\FREEPATS ELECTRIC GUITAR DIRECT':SAMP.msg;return;}
      const L=names();l1.textContent=(L[S.preset]||L[0]).toUpperCase()+(S.edited?' *':'');l2.textContent='PRESET '+(S.preset+1)+' / '+L.length+(S.edited?' · EDITED':'');}
    function flash(a,b){msg=[a,b||''];show();clearTimeout(flashT);flashT=setTimeout(()=>{msg=null;show();},1800);}
    const chipText={'harm.mode':()=>S.v.harm.mode,'harm.key':()=>'KEY '+NM[S.v.harm.key],'harm.iv':()=>S.v.harm.iv,'mod.mode':()=>S.v.mod.mode,'delay.div':()=>S.v.delay.div};
    function paint(){const v=S.v,vw=S.view;m.classList.toggle('nog',!vw.g);m.classList.toggle('noa',!vw.a);m.classList.toggle('nop',!vw.p);
      for(const c of $$('[data-k]')){const x=clamp(+get(c.dataset.k)||0,0,1);c.style.transform=`rotate(${-135+270*x-(+c.dataset.off||0)}deg)`;}   /* (a photo's knob cap: from where its pointer was photographed) */
      for(const p of $$('[data-p]'))p.classList.toggle('on',!!v[p.dataset.p].on);
      for(const c of $$('[data-c]'))c.textContent=chipText[c.dataset.c]();
      $('[data-c="harm.iv"]').classList.toggle('off',v.harm.mode!=='DIATONIC');$('[data-c="harm.key"]').classList.toggle('off',v.harm.mode==='OCTAVES'||v.harm.mode==='CRYSTALS');
      $('[data-kw="delay.time"]').classList.toggle('off',v.delay.div!=='FREE');const tg=$('.tgl');if(tg)tg.dataset.pos=v.g.pick;   /* (the pickup lever thrown to its place) */
      for(const b of $$('[data-b]')){const d=b.dataset.b;let on=false;
        if(d.startsWith('pick.'))on=v.g.pick===d.slice(5);else if(d.startsWith('strum.'))on=v.g.strum===d.slice(6);else if(d.startsWith('amp.'))on=v.amp.model===d.slice(4);
        else if(d==='cab')on=!!v.amp.cab;else if(d==='keys')on=comp;else if(d.startsWith('pad.'))on=v.pad.ch===d.slice(4);else if(d.startsWith('swm.'))on=v.swell.mode===d.slice(4);else if(d==='swell.wheel')on=!!v.swell.wheel;else if(d.startsWith('view.'))on=!!vw[d.slice(5)];b.classList.toggle('on',on);}
      show();}
    const kinLamp=()=>{$('[data-l="kin"]').classList.toggle('dim',!(plugged('keys')||M2.midi.inputs.length>0));};
    const kinFlash=()=>{m.classList.add('flash');clearTimeout(kinT);kinT=setTimeout(()=>m.classList.remove('flash'),90);};

    /* ---- awake / asleep (the PAD's engine too) ---- */
    function watch(){clearTimeout(sleepT);if(dead)return;m.classList.toggle('awake',E.awake);   /* (the amp's jewel light: lit while it sounds) */
      if(E.awake){const busy=E.voices.length||E.level()>1e-4||E.inLevel()>1e-4||pend||(padE&&(padE.voices.length||padE.level()>1e-4));if(busy)quietSince=0;else if(!quietSince)quietSince=performance.now();
        if(quietSince&&performance.now()-quietSince>5000){E.sleep();if(padE)padE.sleep();quietSince=0;host.engine.busy(uid,false);}}
      else if(plugged('in')&&E.inLevel()>1e-4)awake();
      sleepT=setTimeout(watch,E.awake?400:plugged('in')?150:1000);}
    const awake=()=>{const was=E.awake;E.wake();m.classList.add('awake');if(!was){quietSince=0;host.engine.busy(uid,true);}seaGo();};

    /* ---- the PAD pedal: HALO's engine (as HORIZON's PAD), made the first time the pedal is switched on, its sound into the amp's
       effects loop (so DELAY and REVERB take it too, its own hall kept small); it plays the keys held, and lets go when they do ---- */
    let padE=null;const padHeld=new Map();
    function padApply(){const pd=S.v.pad,H=M2.halo;
      if(!pd.on){for(const n of [...padHeld.keys()])padOff(n);return;}
      if(!H){host.toast('DRIFTWOOD: the PAD needs HALO\'s file (Devices\halo.js)');return;}
      if(!padE)padE=H.Engine(ctx,E.padBus);
      padE.P=Object.assign({},H.DEFAULTS,{ch:[pd.ch],lv:{},vol:pd.level,swell:.15+.75*pd.swell,motion:'breathe',space:.2,tone:.45,width:.7});padE.apply(clock);H.tables(ctx,pd.ch);}
    function padOn(n,vel){if(!S.v.pad.on||!padE)return;const old=padHeld.get(n);if(old)old.release(ctx.currentTime);padHeld.set(n,padE.noteOn(n,vel));}
    function padOff(n){const v=padHeld.get(n);if(v){v.release(ctx.currentTime);padHeld.delete(n);}}

    /* ---- the PLAY knob. HOLD: a key holds its note. RING: every note rings on by itself. STRINGS: a fretboard of six strings in
       standard tuning (E A D G B E) with a hand on it: each note goes on the string that keeps the hand nearest where it already is
       (the way tablature programs choose, after Sayegh's "optimal path", 1989, but note by note, since nothing ahead is known), the
       hand moving when a note is out of its reach (four frets; open strings while it is low on the neck); a string sounds one note at
       a time, so a string picked again stops its last note while the other strings ring on: a solo run across two or three strings
       sounds as a guitarist's does. Keys pressed together (or strummed) go on different strings, the low notes on the low strings.
       LEAD: STRINGS, and playing smoothly (the next key down before the last one comes up, within 5 half steps) is a hammer-on or a
       pull-off on the same string: no new pick (the recording starts past its pick), a little softer; letting the upper key go while
       the lower one is still held pulls off to it (a trill: hold one key, tap the other) ---- */
    const OPEN=[40,45,50,55,59,64],FRETS=22,strs=OPEN.map(()=>({n:-1,t:-9})),onStr=new Map(),velOf=new Map();let hand=0;
    const mode=()=>S.v.g.play||'RING',fretted=()=>mode()==='STRINGS'||mode()==='LEAD';
    function cost(s,n,chord){const f=n-OPEN[s];if(f<0||f>FRETS)return Infinity;
      return (f===0?(hand<=4?0:2.5):f<hand?(hand-f)*1.2:f>hand+4?(f-hand-4)*1.2:0)+(chord?s*.15:0)+f*.01;}
    /* (in a chord the strings keep the notes' order, lower notes on lower strings, as a chord shape does) */
    const inOrder=(s,n,taken)=>{for(const s2 of taken){const n2=strs[s2].n;if(n2<0)continue;if(s2<s&&n2>n||s2>s&&n2<n)return false;}return true;};
    function place(n,taken,chord,leg){let best=-1,bc=Infinity;for(let s=0;s<6;s++){if(taken.has(s)||chord&&!inOrder(s,n,taken))continue;const c=cost(s,n,chord)-(s===leg?2:0);if(c<bc){bc=c;best=s;}}
      if(best<0)return -1;const f=n-OPEN[best];if(f>0){if(f<hand)hand=f;else if(f>hand+4)hand=f-3;}return best;}
    /* a string picked (or hammered): its last note stops */
    function pickStr(s,n,t,quick){for(const v of E.voices)if(v.str===s&&!v.released&&!v.oneShot)E.release(v,t,quick?.015:.03);strs[s].n=n;strs[s].t=t;onStr.set(n,s);}
    const busyStrs=t=>{const b=new Set();strs.forEach((x,s)=>{if(Math.abs(t-x.t)<.04)b.add(s);});return b;};   /* picked in the last 40 ms: the same chord */
    const lastHeld=n=>{const h=[...down].filter(k=>k!==n);return h.length?h[h.length-1]:null;};

    /* ---- notes: the guitar's, then its HARMONY (on the same string, so they stop with it) ---- */
    function sound(n,v,when,strum,fx){const h=S.v.harm,t=Math.max(ctx.currentTime,when||0);fx=fx||{};const str=fx.str==null?-1:fx.str;
      if(str>=0)pickStr(str,n,t,fx.hammer);else for(const x of E.voices)if(x.parent===n&&!x.released&&!x.oneShot)E.release(x,t,.03);   /* the string picked again */
      const o={when,strum,str,hammer:!!fx.hammer,offset:fx.hammer?.03:0};E.play(n,v,o);if(!h.on)return;
      const mix=h.mix*1.1,hv=(hn,g,p)=>E.play(hn,v,Object.assign({},o,{harm:true,parent:n,gain:g,pan:p}));
      if(h.mode==='DIATONIC'){const st=(IVS.find(x=>x[0]===h.iv)||IVS[0])[1];hv(st===7?n+12:st===-7?n-12:harmOf(n,h.key,st),mix,st>0?.35:-.35);}
      else if(h.mode==='QUAD'){hv(harmOf(n,h.key,2),mix*.8,-.4);hv(harmOf(n,h.key,4),mix*.8,.4);hv(n+12,mix*.8,.01);}
      else if(h.mode==='OCTAVES'){hv(n-12,mix,-.3);hv(n+12,mix*.8,.3);}
      else if(h.mode==='CRYSTALS'){[[.18,.9,-.6],[.42,.6,.6],[.7,.38,-.4],[1.02,.22,.4]].forEach(([d,g,p])=>E.play(n+12,v,{when:t+d,harm:true,rev:true,parent:n,gain:mix*g,pan:p}));}}
    /* one key, not strummed: on a string (STRINGS, LEAD), a hammer-on when LEAD and played smoothly */
    function pluck(n,v){if(!fretted())return sound(n,v);const taken=busyStrs(ctx.currentTime);let leg=-1;
      if(mode()==='LEAD'){const k=lastHeld(n);if(k!=null&&Math.abs(n-k)<=5){const s0=onStr.get(k);if(s0!=null&&strs[s0].n===k&&n-OPEN[s0]>=0){leg=s0;taken.delete(s0);}}}
      const s=place(n,taken,taken.size>0,leg);if(s<0)return sound(n,v);sound(n,v,0,0,{str:s,hammer:s===leg});}
    /* LEAD: the upper key let go while the lower is held, on the same string: a pull-off to it */
    function pullOff(n){const s=onStr.get(n);if(s==null||strs[s].n!==n)return;const k=lastHeld(n);
      if(k==null||Math.abs(n-k)>5||k-OPEN[s]<0)return;if(!E.voices.some(x=>x.str===s&&!x.released&&!x.harm))return;sound(k,velOf.get(k)||90,0,0,{str:s,hammer:true});}
    /* STRUM: keys pressed within 25 ms of each other are one chord, its strings sounded one after another as a pick crosses them:
       DOWN always from the lowest note up; DOWN/UP down, then the next chord (within 1.5 s) up from the highest, then down again, as a
       strumming hand goes. RING: a new strum damps the last one's strings, as the strumming hand does (STRINGS: only the strings struck again) */
    function flushStrum(){pendT=0;const ch=pend;pend=null;if(!ch||!ch.length)return;const g=S.v.g,fr=fretted();
      if(g.strum==='DOWN/UP'){const now=performance.now();strumDir=now-strumAt<1500?-strumDir:1;strumAt=now;}else strumDir=1;
      if(fr){const taken=new Set();[...ch].sort((a,b)=>a.n-b.n).forEach(x=>{x.s=place(x.n,taken,true,-1);if(x.s>=0){taken.add(x.s);strs[x.s].n=x.n;}});}
      ch.sort((a,b)=>(a.n-b.n)*strumDir);const sp=spreadOf(g.spread),t0=ctx.currentTime+.005,id=++strumN;
      if(mode()==='RING')for(const v of E.voices)if(v.strum&&v.strum!==id&&!v.released&&!v.oneShot)E.release(v,t0,.1);
      ch.forEach((x,i)=>{sound(x.n,x.v,t0+i*sp,id,fr&&x.s>=0?{str:x.s}:null);if(x.off&&mode()==='HOLD')E.noteOff(x.n,t0+i*sp+.08);});}
    /* a key let go (or the sustain pedal lifted): the PAD lets go; the guitar's note stops with HOLD, rings on otherwise (LEAD may pull off) */
    function letGo(n){padOff(n);const m=mode();if(m==='HOLD')E.noteOff(n);else if(m==='LEAD')pullOff(n);}
    function key(x){if(!x)return;
      if(x.t==='on'){awake();kinFlash();const v=x.v||100;velOf.set(x.n,v);padOn(x.n,v);
        if(S.v.g.strum!=='OFF'){down.add(x.n);sus.delete(x.n);if(!pend){pend=[];pendT=setTimeout(flushStrum,25);}pend.push({n:x.n,v});}
        else{pluck(x.n,v);down.delete(x.n);down.add(x.n);sus.delete(x.n);}}   /* (down after the pluck, so LEAD finds the key held before it) */
      else if(x.t==='off'){down.delete(x.n);if(pend){const p=pend.find(y=>y.n===x.n);if(p){p.off=true;padOff(x.n);return;}}if(pedal)sus.add(x.n);else letGo(x.n);}
      else if(x.t==='pedal'){pedal=!!x.on;if(!pedal){for(const n of sus)if(!down.has(n))letGo(n);sus.clear();}}
      else if(x.t==='bend'){bend(clamp(+x.v||0,-1,1));}
      else if(x.t==='mod'){E.wheel(clamp(+x.v||0,0,1));}}
    /* the bend wheel: a whole tone either way (each sounding note's speed moved; it costs more only while bent) */
    function bend(b){E.bend=b;const r=Math.pow(2,b*2/12),t=ctx.currentTime;for(const v of E.voices){if(v.released||v.oneShot)continue;hold(v.src.playbackRate,t);v.src.playbackRate.setTargetAtTime(v.rate0*r,t,.01);}}
    const midi=x=>{if(plugged('keys'))return;key(x.t==='cc'?(x.n===64?{t:'pedal',on:x.v>=.5}:x.n===1?{t:'mod',v:x.v}:null):x);};
    const allUp=()=>{for(const n of [...down])key({t:'off',n});if(pedal)key({t:'pedal',on:false});};
    function panic(){clearTimeout(pendT);pend=null;E.panic();if(padE){const t=ctx.currentTime;padE.voices.slice().forEach(v=>v.kill(t));}padHeld.clear();down.clear();sus.clear();pedal=false;bend(0);flash('PANIC','EVERY NOTE AND ECHO STOPPED');}

    /* ---- settings ---- */
    function apply(){P();E.apply(clock);padApply();}
    function set(k,v,quiet){const was=mode();put(k,v);S.edited=true;apply();paint();
      if(k==='g.playk'){if(mode()===was)return;if(mode()==='HOLD')for(const x of [...E.voices])if(!down.has(x.parent)&&!sus.has(x.parent)&&!x.oneShot)E.release(x,ctx.currentTime,E.relTime());v=get(k);}if(!quiet)flash(KN[k]?(PNAMEof(k)+KN[k][0]):k,KN[k]?KN[k][1](v):String(v));host.changed('knob');}
    const PNAMEof=k=>{const p=k.split('.')[0];return p==='g'?'GUITAR · ':p==='amp'?'AMP · ':(PNAME[p]||'')+' · ';};
    /* SAVE: the display becomes a box to type the name in (your own preset's name, or "My sound N"); Enter keeps the sound as it is
       now under that name (one already of that name is replaced), Esc or clicking away leaves it. Kept for every DRIFTWOOD in
       Settings\mixtape2.json (driftwoodMine), listed after the built-in presets */
    function save(name){name=String(name||'').trim().slice(0,40);if(!name)return;
      const mine=(M2.settings.driftwoodMine||[]).filter(x=>x.name!==name);mine.push({name,v:JSON.parse(JSON.stringify(S.v))});M2.prefs.set('driftwoodMine',mine);
      S.preset=names().lastIndexOf(name);S.edited=false;host.changed('save');flash('SAVED',name.toUpperCase()+' · EVERY DRIFTWOOD');}
    function askName(){const lcd=$('.lcd');if(lcd.querySelector('input'))return;const L=names(),cur=L[S.preset],mine=M2.settings.driftwoodMine||[];
      let n=1;while(L.includes('My sound '+n))n++;const inp=document.createElement('input');inp.className='nmin';inp.maxLength=40;
      inp.value=mine.some(x=>x.name===cur)?cur:'My sound '+n;lcd.appendChild(inp);inp.focus();inp.select();let done=false;
      const end=ok=>{if(done)return;done=true;const v=inp.value;inp.remove();if(ok)save(v);else show();};
      inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')end(true);else if(e.key==='Escape')end(false);});
      inp.addEventListener('blur',()=>end(false));inp.addEventListener('pointerdown',e=>e.stopPropagation());}
    function usePreset(i){const L=names();i=(i+L.length)%L.length;const mine=(M2.settings.driftwoodMine||[]).find(x=>x.name===L[i]);
      S.v=mine?deep(fresh({}),JSON.parse(JSON.stringify(mine.v))):fresh(PRESETS[i][1]);S.preset=i;S.edited=false;apply();paint();host.changed('preset');flash(L[i].toUpperCase(),'PRESET '+(i+1)+' / '+L.length);}
    function cycle(c,dir){const v=S.v,step=(list,cur)=>list[(list.indexOf(cur)+dir+list.length)%list.length];
      if(c==='harm.mode')v.harm.mode=step(HMODES,v.harm.mode);else if(c==='harm.key')v.harm.key=(v.harm.key+dir+12)%12;else if(c==='harm.iv')v.harm.iv=step(IVS.map(x=>x[0]),v.harm.iv);
      else if(c==='mod.mode')v.mod.mode=step(MMODES,v.mod.mode);else if(c==='delay.div')v.delay.div=step(DIVS.map(x=>x[0]),v.delay.div);
      S.edited=true;apply();paint();host.changed('switch');
      const tip={'harm.mode':{DIATONIC:'ONE VOICE, IN THE KEY',QUAD:'A 3RD, A 5TH AND AN OCTAVE ABOVE',OCTAVES:'AN OCTAVE BELOW AND ABOVE',CRYSTALS:'BACKWARDS OCTAVES IN ECHOES'}[v.harm.mode],
        'harm.key':NM[v.harm.key]+' MAJOR (OR ITS RELATIVE MINOR: '+NM[(v.harm.key+9)%12]+' MINOR)','harm.iv':'IN '+NM[v.harm.key]+' MAJOR','mod.mode':'','delay.div':v.delay.div==='FREE'?'TIME BY ITS KNOB':'IN TIME WITH THE DESK ('+Math.round(clock.bpm||120)+' BPM)'}[c];
      flash((PNAME[c.split('.')[0]])+' · '+chipText[c](),tip);}
    function stomp(id){const p=S.v[id];p.on=!p.on;S.edited=true;apply();paint();host.changed('switch');flash(PNAME[id],p.on?'ON':'OFF');}
    function button(b){const v=S.v;
      if(b==='prev'||b==='next')return usePreset(S.preset+(b==='next'?1:-1));
      if(b==='save')return askName();
      if(b.startsWith('view.')){const k=b.slice(5);S.view[k]=!S.view[k];paint();host.changed('view');if(k==='p')seaStill();
        return flash(({g:'GUITAR',a:'AMP',p:'PEDALS'})[k],S.view[k]?'SHOWN':k==='p'?'HIDDEN: THE STAGE FILLS THE SPACE':'HIDDEN');}
      if(b==='panic')return panic();if(b==='keys')return compKeys(!comp);
      if(b.startsWith('swm.')){const sw=v.swell;sw.mode=b.slice(4);sw.on=true;if(sw.mode==='rise'&&!v.verb.on)v.verb.on=true;S.edited=true;apply();paint();host.changed('switch');
        return flash('OCEAN SWELL · '+SWM.find(x=>x[0]===sw.mode)[1],SWTIP[sw.mode]+(sw.mode==='rise'?' (REVERB ON)':''));}
      if(b==='swell.wheel'){const sw=v.swell;sw.wheel=!sw.wheel;if(sw.wheel)sw.on=true;S.edited=true;apply();paint();host.changed('switch');return flash('OCEAN SWELL · WHEEL',sw.wheel?'THE MOD WHEEL IS A VOLUME PEDAL':'OFF');}
      if(b.startsWith('pad.')){v.pad.ch=b.slice(4);if(!v.pad.on)v.pad.on=true;S.edited=true;apply();paint();host.changed('switch');return flash('PAD',v.pad.ch.toUpperCase()+' · PLAYS THE KEYS YOU HOLD');}
      if(b==='pick.cycle')b='pick.'+PICKS[(PICKS.indexOf(v.g.pick)+1)%3];   /* the switch itself: one place on (and round) */
      if(b==='strum.cycle')b='strum.'+STRUMS[(STRUMS.indexOf(v.g.strum)+1)%3];
      if(b==='cab'){v.amp.cab=!v.amp.cab;S.edited=true;apply();paint();host.changed('switch');return flash('AMP · CAB',v.amp.cab?'THE SPEAKER CABINET':'OFF: STRAIGHT FROM THE AMP');}
      if(b.startsWith('pick.')){v.g.pick=b.slice(5);S.edited=true;apply();paint();host.changed('switch');return flash('GUITAR · PICKUP',{NECK:'ROUND AND WARM',MIDDLE:'BETWEEN',BRIDGE:'BRIGHT AND CUTTING'}[v.g.pick]);}
      if(b.startsWith('strum.')){v.g.strum=b.slice(6);S.edited=true;paint();host.changed('switch');return flash('GUITAR · STRUM',{OFF:'EVERY KEY AT ONCE','DOWN':'EACH CHORD LOW STRING TO HIGH','DOWN/UP':'DOWN (LOW TO HIGH), NEXT CHORD UP (HIGH TO LOW)'}[v.g.strum]);}
      if(b.startsWith('amp.')){v.amp.model=b.slice(4);S.edited=true;apply();paint();host.changed('switch');return flash('AMP',AMPS[v.amp.model].name);}}

    /* ---- the computer keyboard (KEYS lit), as HORIZON's ---- */
    const CK={KeyA:0,KeyW:1,KeyS:2,KeyE:3,KeyD:4,KeyF:5,KeyT:6,KeyG:7,KeyY:8,KeyH:9,KeyU:10,KeyJ:11,KeyK:12,KeyO:13,KeyL:14,KeyP:15,Semicolon:16,Quote:17},CK_BASE=52;
    const busyTyping=t=>!!(t&&(t.isContentEditable||/^(TEXTAREA|SELECT)$/.test(t.tagName)||t.tagName==='INPUT'&&!/^(range|checkbox|radio|button|submit|color)$/.test(t.type)))||!!document.querySelector('.modal');
    function kd(e){if(!comp||dead||e.ctrlKey||e.altKey||e.metaKey||busyTyping(e.target))return;const c=e.code;
      if(c in CK){e.preventDefault();if(e.repeat||typed.has(c))return;typed.add(c);key({t:'on',n:CK_BASE+12*koct+CK[c],v:kvel});return;}
      if(c==='KeyZ'||c==='KeyX'){e.preventDefault();if(!e.repeat){blur();koct=clamp(koct+(c==='KeyX'?1:-1),-2,3);flash('KEYS','OCTAVE '+(koct>0?'+':'')+koct);}}
      else if(c==='KeyC'||c==='KeyV'){e.preventDefault();if(!e.repeat){kvel=clamp(kvel+(c==='KeyV'?20:-20),1,127);flash('KEYS','VELOCITY '+kvel+(kvel<=92?' (SOFT PICKING)':' (HARD PICKING)'));}}}
    function ku(e){if(typed.delete(e.code))key({t:'off',n:CK_BASE+12*koct+CK[e.code]});}
    function blur(){for(const c of typed)key({t:'off',n:CK_BASE+12*koct+CK[c]});typed.clear();}
    function compKeys(on){if(on&&plugged('keys')){host.toast('DRIFTWOOD: a KEYS device is plugged into KEYS IN: turn on its COMPUTER KEYS instead');return;}
      comp=on;if(on){addEventListener('keydown',kd);addEventListener('keyup',ku);addEventListener('blur',blur);}else{blur();removeEventListener('keydown',kd);removeEventListener('keyup',ku);removeEventListener('blur',blur);}
      paint();flash('KEYS',on?'A S D F… PLAY (LOW E UP) · Z X OCTAVE':'OFF');}

    /* ---- the hands on it: knobs (drag up and down, scroll, double-click for where it starts), buttons, chips (click on, scroll
       either way), footswitches; anywhere else the desk picks the device up ---- */
    const drag=(e,mv,up)=>{e.preventDefault();e.stopPropagation();const M=ev=>mv(ev),U=ev=>{removeEventListener('pointermove',M);removeEventListener('pointerup',U);if(up)up(ev);};addEventListener('pointermove',M);addEventListener('pointerup',U);};
    m.addEventListener('pointerdown',e=>{if(e.button)return;const t=e.target,d=t.dataset||{};
      if(d.k){const k=d.k,y0=e.clientY,u0=+get(k)||0,h=t.getBoundingClientRect().height*5;drag(e,ev=>set(k,clamp(u0+(y0-ev.clientY)/h,0,1)));return;}
      if(d.b||d.s||d.c){t.classList.add('down');drag(e,()=>{},()=>{t.classList.remove('down');if(d.b)button(d.b);else if(d.s)stomp(d.s);else cycle(d.c,1);});}});
    m.addEventListener('wheel',e=>{const d=e.target.dataset||{};if(d.k){e.preventDefault();e.stopPropagation();set(d.k,clamp(get(d.k)-Math.sign(e.deltaY)*(d.k==='g.playk'||d.k==='amp.chan'?1/3:d.k==='g.strumk'?1/2:.03),0,1));}   /* (PLAY, CHANNEL and STRUM: a place a tick) */
      else if(d.c){e.preventDefault();e.stopPropagation();cycle(d.c,e.deltaY>0?1:-1);}},{passive:false});
    m.addEventListener('dblclick',e=>{const d=e.target.dataset||{};if(d.k){e.stopPropagation();set(d.k,d.k==='g.playk'?1/3:d.k.split('.').reduce((o,p)=>o&&o[p],V0));}});

    /* ---- start ---- */
    const offStat=M2.on('driftwood-samples',()=>{if(!dead)show();});
    loadSamples(ctx,host.files||window.mixtapeFiles).catch(()=>{if(!dead)host.toast('DRIFTWOOD: the guitar recordings are not in Instruments\\FreePats Electric Guitar Direct');});
    apply();paint();watch();offMidi=M2.midi.listen(midi);kinLamp();
    const offIn=M2.on('midi',kinLamp),offTempo=M2.on('tempo',()=>E.apply(clock));
    return {node:s=>s==='out'?outG:s==='in'?E.sndIn:null,
      receive(sock,msg){if(sock==='keys')key(msg);return true;},
      plugged(sock){if(sock==='keys'){allUp();if(comp&&plugged('keys'))compKeys(false);kinLamp();}if(sock==='in')watch();},
      visible(v){inSight=v!==false;if(inSight)seaGo();},   /* (out of sight the sea is not drawn) */
      /* for tools\probes\m2-driftwood.js */
      probe:()=>({sea:{ready:!!sea,running:!!seaRaf,frames:seaFrames,lv:+seaLv.toFixed(2),t:+seaT.toFixed(1)},samples:SAMP.state,loaded:SAMP.buf.size,notes:{soft:SAMP.by.soft.length,hard:SAMP.by.hard.length},awake:E.awake,voices:E.voices.length,live:E.voices.filter(v=>!v.released).length,
        harm:E.voices.filter(v=>v.harm).length,rev:E.voices.filter(v=>v.oneShot).length,keyBufs:KEYC.size,queued:RQ.length,level:+E.level().toFixed(4),chain:E.chain(),lfo:E.lfoOn(),shimmer:E.shimOn(),
        preset:names()[S.preset],edited:S.edited,play:mode(),swell:Object.assign({mode:S.v.swell.mode,on:S.v.swell.on},E.swState()),hand,strings:E.voices.filter(v=>!v.released&&!v.harm&&!v.oneShot).map(v=>v.n+'@'+v.str+(v.hammer?'h':'')),pad:padE?{on:S.v.pad.on,ch:S.v.pad.ch,voices:padE.voices.length,held:[...padHeld.keys()],awake:!!padE.awake,level:+padE.level().toFixed(4)}:(S.v.pad.on?'no engine':'off'),pedal,down:[...down],lcd:$('.lcd').textContent,rates:E.voices.map(v=>+v.src.playbackRate.value.toFixed(3)),playing:E.voices.map(v=>v.n+(v.fake?'~':'')),}),
      debugSet:(k,v)=>set(k,v,true),debugSea:()=>{if(sea)sea.draw(...seaSize(),seaT+=.03,seaLv);},debugHush:()=>{clearTimeout(pendT);pend=null;E.allOff();if(padE)padE.voices.slice().forEach(v=>v.kill(ctx.currentTime));padHeld.clear();},debugButton:b=>button(b),debugStomp:s=>stomp(s),debugCycle:(c,d)=>cycle(c,d||1),harmOf,
      destroy(){dead=true;if(seaRaf)cancelAnimationFrame(seaRaf);if(sea)sea.dispose();clearTimeout(flashT);clearTimeout(sleepT);clearTimeout(pendT);clearTimeout(kinT);if(comp)compKeys(false);if(offMidi)offMidi();offStat();offIn();offTempo();
        if(padE)padE.dispose();E.dispose();host.engine.busy(uid,false);setTimeout(()=>{try{outG.disconnect();}catch(e){}},350);}};}};
M2.define(DEF);
M2.driftwood={Engine,SAMP,PRESETS,fresh,harmOf,loadSamples,played:(ctx,n,lay,rr)=>{const r=nearest(n,lay,rr);return r&&render(ctx,r,n);}};   /* (played: a note as DRIFTWOOD plays it, for toolsprobesm2-driftwood-tuning.js) */
})();
