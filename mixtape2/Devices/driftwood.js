/* Mixtape 2 device: DRIFTWOOD, an electric guitar for writing songs at home (2026-11-24; a first, plainly drawn prototype: its real
   look comes once Steve has played it). It is wired the way a guitarist's rig is:
     GUITAR → PEDALBOARD (OCEAN SWELL, AIR COMPRESSOR, SUNSET DRIVE, BARBERSHOP, LIGHTHOUSE) → AMP (four voicings, BASS MID TREBLE, a speaker cabinet)
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
   BARBERSHOP, the harmonizer (2026-11-25, in the spirit of a studio harmonizer with a screen, Steve's picture; an original design):
   since every note played is known, its harmonies are more guitar notes, exactly in the song's KEY and SCALE (13 scales; KEY AUTO
   follows what is played, KEY held LEARNs it). Five STYLES: DIATONIC (two voices), QUARTET (three singers round your note), OCTAVER,
   MICRO (a doubled guitar) and CRYSTALS (high notes in echoes, backwards or forwards); its footswitch held FREEZEs what sounds.
   SOUND IN (any other sound) goes through the pedals and the amp too, but BARBERSHOP and SWELL only play on DRIFTWOOD's own notes.
   Jacks: KEYS IN (KEYS, GRAPH PAPER; with nothing there any MIDI keyboard, its sustain pedal on CC 64, the bend wheel bends a tone),
   SOUND IN, OUT. Silent for 5 s it unhooks from the output (Chrome then runs nothing behind it); a pedal switched off is taken out of
   the chain, and the LIGHTHOUSE's and the shimmer's wobblers only run while they are on. */
(()=>{const M2=window.M2;
const W=760,H=400;
const DIR='Instruments/FreePats Electric Guitar Direct/samples/bridge';
const LOW=36,HIGH=86;   /* the guitar plays C2 to D6 and nothing outside */
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
/* BARBERSHOP: its scales (a pentatonic's or the blues' harmonies are found in the 7-note scale it comes from, then moved to its
   nearest own note), a voice's interval in scale steps (3rd = 2 steps), its STYLES each with the pages PREV / NEXT walk through and
   VALUE turns (a page: its key, name, kind: 'iv' an interval, 'c' 0..1, or a list; where it starts), then KEY and SCALE for all */
const SCALES=[['MAJOR',[0,2,4,5,7,9,11]],['MINOR',[0,2,3,5,7,8,10]],['HARMONIC MINOR',[0,2,3,5,7,8,11]],['MELODIC MINOR',[0,2,3,5,7,9,11]],['DORIAN',[0,2,3,5,7,9,10]],
  ['PHRYGIAN',[0,1,3,5,7,8,10]],['LYDIAN',[0,2,4,6,7,9,11]],['MIXOLYDIAN',[0,2,4,5,7,9,10]],['LOCRIAN',[0,1,3,5,6,8,10]],['MAJOR PENTATONIC',[0,2,4,7,9],'MAJOR'],
  ['MINOR PENTATONIC',[0,3,5,7,10],'MINOR'],['BLUES',[0,3,5,6,7,10],'MINOR'],['CHROMATIC',null]];
const IVL=[-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,9],ivName=s=>s===0?'OFF':['','2ND','3RD','4TH','5TH','6TH','7TH','OCTAVE','9TH','10TH'][Math.abs(s)]+(s>0?' UP':' DOWN');
const VOICINGS=[['CLOSE',[2,4,7]],['BARBERSHOP',[2,-3,-7]],['SEVENTH',[2,4,6]],['OPEN',[4,7,9]],['BELOW',[-3,-5,-7]]];
const VOICETIP={CLOSE:'A 3RD, A 5TH AND AN OCTAVE ABOVE',BARBERSHOP:'TENOR ABOVE, BARITONE AND BASS BELOW',SEVENTH:'A 3RD, 5TH AND 7TH ABOVE',OPEN:'A 5TH, AN OCTAVE AND A 10TH ABOVE',BELOW:'A 4TH, A 6TH AND AN OCTAVE BELOW'};
const BST={DIATONIC:{tip:'ONE OR TWO VOICES, IN THE KEY',pages:[['a','VOICE A','iv',2],['b','VOICE B','iv',0],['bal','BALANCE','c',.5],['wide','SPREAD','c',.6],['time','TIMING','c',.2],['tone','TONE','c',.6]]},
  QUARTET:{tip:'YOUR NOTE AND THREE SINGERS: FOUR-PART HARMONY',pages:[['voicing','VOICING',VOICINGS.map(x=>x[0]),'CLOSE'],['wide','SPREAD','c',.7],['time','TIMING','c',.3],['tone','TONE','c',.55]]},
  OCTAVER:{tip:'OCTAVES UNDER AND OVER YOUR NOTE',pages:[['d2','2 OCTAVES DOWN','c',0],['d1','OCTAVE DOWN','c',.8],['u1','OCTAVE UP','c',.4],['tone','TONE','c',.6]]},
  MICRO:{tip:'A DOUBLED GUITAR: TWO COPIES A FEW CENTS APART',pages:[['det','DETUNE','c',.4],['dly','DELAY','c',.35],['wide','SPREAD','c',.8],['tone','TONE','c',.7]]},
  CRYSTALS:{tip:'HIGH NOTES IN ECHOES, BACKWARDS OR FORWARDS',pages:[['pitch','PITCH',['OCTAVE','OCTAVE + 5TH','5TH'],'OCTAVE'],['gap','TIME','c',.4],['rep','REPEATS','c',.5],['dir','DIRECTION',['BACKWARDS','FORWARDS'],'BACKWARDS']]}};
const bsv=(h,st,k,d)=>{const o=h.s&&h.s[st];if(o&&o[k]!=null)return o[k];const pg=(BST[st]||BST.DIATONIC).pages.find(p=>p[0]===k);return pg?pg[3]:d;};   /* (a style's page: as set, else where it starts) */
/* what the pedal's VALUE knob turns in each style (everything else is in its settings panel) */
const MAIN={DIATONIC:'a',QUARTET:'voicing',OCTAVER:'d1',MICRO:'det',CRYSTALS:'gap'};
/* BARBERSHOP's own presets, 30 (the drop-down and ‹ › in its panel, PREV / NEXT on the pedal), kept in order of style: a style and its
   settings, MIX; the song's KEY and SCALE are left as they are (only the blues and pentatonic ones bring their scale) */
const BSP=[['Thirds above',{style:'DIATONIC',mix:.45,s:{DIATONIC:{a:2,b:0}}}],['Thirds and fifths',{style:'DIATONIC',mix:.45,s:{DIATONIC:{a:2,b:4,bal:.45}}}],
  ['Fourths above',{style:'DIATONIC',mix:.45,s:{DIATONIC:{a:3,b:0}}}],['Sixths above',{style:'DIATONIC',mix:.45,s:{DIATONIC:{a:5,b:0,tone:.55}}}],
  ['Sixths below',{style:'DIATONIC',mix:.45,s:{DIATONIC:{a:-5,b:0}}}],['Tenths',{style:'DIATONIC',mix:.4,s:{DIATONIC:{a:9,b:0,tone:.7}}}],
  ['Twin guitars',{style:'DIATONIC',mix:.5,s:{DIATONIC:{a:2,b:0,wide:1,time:0,tone:.75}}}],
  ['Pentatonic fourths',{style:'DIATONIC',mix:.45,scale:'MINOR PENTATONIC',s:{DIATONIC:{a:2,b:0}}}],['Blues thirds',{style:'DIATONIC',mix:.45,scale:'BLUES',s:{DIATONIC:{a:2,b:-2,bal:.4}}}],
  ['Barbershop quartet',{style:'QUARTET',mix:.45,s:{QUARTET:{voicing:'BARBERSHOP',time:.35}}}],['Close harmony',{style:'QUARTET',mix:.45,s:{QUARTET:{voicing:'CLOSE',time:.2}}}],
  ['Seventh chords',{style:'QUARTET',mix:.4,s:{QUARTET:{voicing:'SEVENTH'}}}],['Gospel stack',{style:'QUARTET',mix:.45,s:{QUARTET:{voicing:'SEVENTH',wide:1,time:.25,tone:.6}}}],
  ['Open choir',{style:'QUARTET',mix:.4,s:{QUARTET:{voicing:'OPEN',wide:1,tone:.45,time:.4}}}],['Choir wash',{style:'QUARTET',mix:.4,s:{QUARTET:{voicing:'OPEN',wide:.9,tone:.35,time:.6}}}],
  ['Low choir',{style:'QUARTET',mix:.45,s:{QUARTET:{voicing:'BELOW',tone:.45}}}],
  ['Octave bass',{style:'OCTAVER',mix:.5,s:{OCTAVER:{d2:0,d1:.9,u1:0}}}],['Sub bass',{style:'OCTAVER',mix:.5,s:{OCTAVER:{d2:.8,d1:.5,u1:0,tone:.4}}}],
  ['Octave sparkle',{style:'OCTAVER',mix:.4,s:{OCTAVER:{d2:0,d1:0,u1:.8,tone:.85}}}],['Organ octaves',{style:'OCTAVER',mix:.45,s:{OCTAVER:{d2:0,d1:.6,u1:.6,tone:.6}}}],
  ['Big octaves',{style:'OCTAVER',mix:.5,s:{OCTAVER:{d2:.5,d1:.8,u1:.5}}}],
  ['Double tracked',{style:'MICRO',mix:.5,s:{MICRO:{det:.35,dly:.35}}}],['Subtle chorus',{style:'MICRO',mix:.4,s:{MICRO:{det:.15,dly:.2,wide:.6}}}],
  ['Wide doubler',{style:'MICRO',mix:.55,s:{MICRO:{det:.6,dly:.6,wide:1}}}],['Slapback double',{style:'MICRO',mix:.5,s:{MICRO:{det:.25,dly:1,wide:.9}}}],
  ['Crystals',{style:'CRYSTALS',mix:.45,s:{CRYSTALS:{pitch:'OCTAVE',dir:'BACKWARDS'}}}],['Crystal fifths',{style:'CRYSTALS',mix:.45,s:{CRYSTALS:{pitch:'OCTAVE + 5TH',gap:.5,rep:.65}}}],
  ['Backwards fifths',{style:'CRYSTALS',mix:.45,s:{CRYSTALS:{pitch:'5TH',gap:.45,rep:.4}}}],['Falling stars',{style:'CRYSTALS',mix:.4,s:{CRYSTALS:{pitch:'OCTAVE',dir:'FORWARDS',gap:.3,rep:.8}}}],
  ['Glass rain',{style:'CRYSTALS',mix:.4,s:{CRYSTALS:{pitch:'OCTAVE + 5TH',dir:'FORWARDS',gap:.18,rep:1}}}]];
const BSTY=Object.keys(BST),KEYS=['AUTO',...['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']];
/* a page's value in words (a 0..1 page; lists and intervals say themselves) */
const bsFmt=(k,v)=>k==='bal'?'A '+Math.round(Math.min(1,2*(1-v))*100)+'% · B '+Math.round(Math.min(1,2*v)*100)+'%':k==='time'?(v<.03?'TIGHT':'LOOSE: '+Math.round(v*80)+' MS'):
  k==='tone'?(v>.98?'OPEN':Math.round(toneOf(v))+' HZ'):k==='det'?(2+28*v).toFixed(1)+' CENTS':k==='dly'?Math.round(8+72*v)+' MS':k==='gap'?Math.round(120+480*v)+' MS':
  k==='rep'?(1+Math.round(v*6))+(v<.08?' ECHO':' ECHOES'):/^[du][12]$/.test(k)?(v<.02?'OFF':Math.round(v*100)+'%'):Math.round(v*100)+'%';
const MMODES=['CHORUS','FLANGER','PHASER','VIBRATO','TREMOLO'],PICKS=['NECK','MIDDLE','BRIDGE'],STRUMS=['OFF','DOWN','DOWN/UP'];
/* the amp's voicings (original): how hard the preamp can be pushed (GAIN from lo to hi), its lean (bias: uneven clipping, a valve's
   warmth), how tight its lows are (hp) and its own colour (peaks: Hz, dB, Q) on top of BASS MID TREBLE */
const AMPS={clean:{name:'CLEAN',lo:.6,hi:5,bias:.05,hp:60,col:[[450,-3,.7],[3200,3,.7]]},
  chime:{name:'CHIME',lo:1.5,hi:16,bias:.12,hp:90,col:[[1100,3,.8],[4200,4,.9]]},
  crunch:{name:'CRUNCH',lo:3,hi:45,bias:.18,hp:110,col:[[800,4,.8],[2400,2,.8]]},
  lead:{name:'LEAD',lo:8,hi:140,bias:.22,hp:220,col:[[650,5,.9],[3600,-2,1]]}};

/* the sound as it starts, and the presets on top of it */
const V0={g:{pick:'BRIDGE',vol:.8,tone:.85,mute:0,strum:'OFF',spread:.45,play:'RING'},pad:{on:false,ch:['warm'],level:.5,swell:.5,air:.15},
  swell:{on:false,att:.6,mode:'each',sens:1,mix:0,dec:1,wheel:false},comp:{on:false,sus:.4,lvl:.5,tone:.5,blend:1,att:.3},drive:{on:false,drive:.35,tone:.55,warm:.5,lvl:.5},
  harm:{on:false,style:'DIATONIC',key:0,auto:false,scale:'MAJOR',mix:.45,lvl:.5,pre:'Thirds above',ed:false,s:{}},mod:{on:false,mode:'CHORUS',rate:.35,depth:.4,mix:.85},
  amp:{model:'clean',gain:.35,bass:.5,mid:.5,treb:.55,master:.6,cab:true},
  delay:{on:false,div:'1/8 ·',time:.5,fb:.35,mix:.3},verb:{on:true,size:.35,mix:.22,shim:0}};
const PRESETS=[
  ['Clean writing desk',{comp:{on:true,sus:.3},verb:{on:true,size:.3,mix:.18}}],
  ['Sunday swells',{g:{pick:'NECK',tone:.7},swell:{on:true,att:.62},amp:{treb:.6},delay:{on:true,div:'1/8 ·',fb:.45,mix:.32},verb:{on:true,size:.85,mix:.45,shim:.35}}],
  ['Edge of breakup',{g:{pick:'MIDDLE'},drive:{on:true,drive:.25,lvl:.55},amp:{model:'chime',gain:.45},delay:{on:true,div:'1/8 ·',fb:.3,mix:.22},verb:{on:true,size:.45,mix:.22}}],
  ['Crystal harmonies',{harm:{on:true,style:'CRYSTALS',mix:.45,pre:'Crystals'},delay:{on:true,div:'1/4',fb:.4,mix:.28},verb:{on:true,size:.8,mix:.4,shim:.2}}],
  ['Thirds above',{harm:{on:true,style:'DIATONIC',mix:.45,s:{DIATONIC:{a:2,b:0}}},mod:{on:true,mode:'CHORUS',rate:.3,depth:.35},verb:{on:true,size:.45,mix:.25}}],
  ['Driven anthem',{g:{pick:'BRIDGE'},comp:{on:true,sus:.35},drive:{on:true,drive:.55,tone:.6},amp:{model:'crunch',gain:.5,mid:.6},delay:{on:true,div:'1/4',fb:.3,mix:.2},verb:{on:true,size:.5,mix:.2}}],
  ['Tremolo ballad',{g:{pick:'NECK',tone:.65},mod:{on:true,mode:'TREMOLO',rate:.5,depth:.6},amp:{model:'clean',gain:.3},verb:{on:true,size:.4,mix:.3}}],
  ['Strummed chords',{g:{strum:'DOWN/UP',spread:.5,pick:'MIDDLE'},comp:{on:true,sus:.45},amp:{model:'chime',gain:.3},verb:{on:true,size:.35,mix:.2}}],
  ['Ocean tide',{g:{pick:'NECK',tone:.7},swell:{on:true,mode:'tide',att:.67,mix:.25},delay:{on:true,div:'1/4 ·',fb:.4,mix:.3},verb:{on:true,size:.8,mix:.4,shim:.25}}],
  ['Guitar over a pad',{g:{pick:'NECK',tone:.75},pad:{on:true,ch:['warm'],level:.5,swell:.55},delay:{on:true,div:'1/8 ·',fb:.35,mix:.25},verb:{on:true,size:.7,mix:.35,shim:.15}}],
  ['Barbershop quartet',{g:{pick:'NECK',tone:.75},harm:{on:true,style:'QUARTET',auto:true,mix:.45,pre:'Barbershop quartet',s:{QUARTET:{voicing:'BARBERSHOP',time:.35}}},comp:{on:true,sus:.3},verb:{on:true,size:.5,mix:.28}}],
  ['Double tracked',{g:{pick:'MIDDLE'},harm:{on:true,style:'MICRO',mix:.5,pre:'Double tracked'},amp:{model:'chime',gain:.35},verb:{on:true,size:.35,mix:.2}}],
  ['Octave bass',{g:{pick:'NECK',tone:.6},harm:{on:true,style:'OCTAVER',mix:.5,pre:'Octave bass',s:{OCTAVER:{d2:0,d1:.9,u1:0}}},verb:{on:true,size:.3,mix:.15}}]];
/* the PAD pedal's four sounds (HALO's characters) */
const SWM=[['each','EACH NOTE'],['wave','WAVE'],['tide','TIDE'],['rise','RISE']];
const SWTIP={each:'EVERY NOTE SWELLS IN ON ITS OWN',wave:'EACH NEW NOTE SWELLS EVERYTHING RINGING AGAIN',tide:'THE SOUND RISES AND EBBS IN WAVES, IN TIME',rise:'THE NOTE PLAYS, ITS REVERB RISES BEHIND IT'};
const PADV=1.8;   /* the CUSHION's loudness: its LEVEL times this into HALO's VOLUME (Steve found the PAD too quiet; it follows the guitar's loudness, so at LEVEL 0.5 it rides about as loud as the ringing guitar) */
const PADS=['warm','glass','choir','strings','organ','shruti'];   /* (the CUSHION's six sounds, any two at once; AIR is a knob now, Steve 2026-11-25) */
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
/* a note's harmony a number of steps away in a scale (sc: its notes above the KEY); a note outside the scale is moved as the scale
   note below it is, so a passing note keeps its distance */
function harmSc(n,key,sc,steps){let deg=-1,base=n;
  for(let d=0;d<12&&deg<0;d++){const pc=((n-d-key)%12+12)%12,i=sc.indexOf(pc);if(i>=0){deg=i;base=n-d;}}
  const L=sc.length,oct=Math.floor((deg+steps)/L),i=((deg+steps)%L+L)%L;return base-sc[deg]+sc[i]+12*oct+(n-base);}
const harmOf=(n,key,steps)=>harmSc(n,key,SCALES[0][1],steps);   /* (in a major key) */
/* BARBERSHOP's harmony: CHROMATIC moves by the major scale's distances whatever the key; a pentatonic or the blues takes the harmony
   in its 7-note scale, then the nearest of its own notes (on the side the voice moves, never the note itself) */
function harmIn(n,key,scale,steps){if(!steps)return null;const S=SCALES.find(x=>x[0]===scale)||SCALES[0],a=Math.abs(steps),sg=Math.sign(steps);
  if(!S[1])return n+sg*[0,2,4,5,7,9,11,12,14,16][a];
  if(!S[2])return harmSc(n,key,S[1],steps);
  const h=harmSc(n,key,SCALES.find(x=>x[0]===S[2])[1],steps),inS=m=>S[1].includes(((m-key)%12+12)%12);let best=null,bd=99;
  for(let d=-2;d<=2;d++){const m=h+d;if(m===n||!inS(m)||Math.sign(m-n)!==sg)continue;const c=Math.abs(d)+(Math.sign(d)===-sg?.1:0);if(c<bd){bd=c;best=m;}}
  return best==null?h:best;}
/* a key from the notes played (each pitch's weight): the best match of the Krumhansl-Kessler major and minor key profiles, as music
   programs guess a key (r: how well it matches, -1..1) */
const KKP={MAJOR:[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],MINOR:[6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17]};
function keyFit(h,key,sc){const p=KKP[sc];let sx=0,sy=0,sxy=0,sxx=0,syy=0;for(let i=0;i<12;i++){const x=h[(i+key)%12],y=p[i];sx+=x;sy+=y;sxy+=x*y;sxx+=x*x;syy+=y*y;}
  const d=Math.sqrt((12*sxx-sx*sx)*(12*syy-sy*sy));return d?(12*sxy-sx*sy)/d:0;}
function guessKey(h){let b={key:0,scale:'MAJOR',r:-2};for(let k=0;k<12;k++)for(const sc of ['MAJOR','MINOR']){const r=keyFit(h,k,sc);if(r>b.r)b={key:k,scale:sc,r};}return b;}

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
  /* BARBERSHOP: its voices through their own TONE into the guitar's bus; its LEVEL on the whole guitar while it is on */
  const hTone=B('lowpass',8000,-3),hLvl=G(1);hTone.connect(vBus);
  vBus.connect(hLvl);hLvl.connect(swG);swG.connect(whG);whG.connect(pkLo);pkLo.connect(pkHi);pkHi.connect(tone);tone.connect(gVol);
  const chainIn=G(1);gVol.connect(chainIn);
  const sndIn=G(1);sndIn.connect(chainIn);const inMon=ctx.createAnalyser();inMon.fftSize=256;sndIn.connect(inMon);const ibuf=new Float32Array(256);
  /* COMP */
  /* COMP, the AIR COMPRESSOR: SUSTAIN (how hard it squeezes), ATTACK (how long it waits before it clamps, 1 to 60 ms: slow lets the pick
     snap through), TONE (a treble shelf on what it squeezes), BLEND (the squeezed sound against the clean one: parallel compression, the
     pick's own attack kept), LEVEL */
  const cIn=G(1),cp=ctx.createDynamicsCompressor(),cTone=B('highshelf',2500,null,0),cWet=G(1),cDry=G(0),cpG=G(1);cp.knee.value=8;cp.attack.value=.004;cp.release.value=.25;
  cIn.connect(cp);cp.connect(cTone);cTone.connect(cWet);cWet.connect(cpG);cIn.connect(cDry);cDry.connect(cpG);const COMP={inp:cIn,out:cpG};
  /* DRIVE, the SUNSET DRIVE: a mid hump into a soft clipper, then its TONE; WARMTH (Steve, 2026-11-25): how much low end goes into
     the clipper (its highpass 300 Hz lean and tight … 60 Hz full) and a low shelf after it (-6 … +6 dB), round and full or tight */
  const drHp=B('highpass',140,.7),drMid=B('peaking',720,.7,6),drPre=G(1),drSh=ctx.createWaveShaper(),drWarm=B('lowshelf',220,null,0),drLp=B('lowpass',4000,.6),drOut=G(1);
  drSh.curve=clipCurve(.05);drSh.oversample='4x';drHp.connect(drMid);drMid.connect(drPre);drPre.connect(drSh);drSh.connect(drWarm);drWarm.connect(drLp);drLp.connect(drOut);const DRIVE={inp:drHp,out:drOut};
  /* the LIGHTHOUSE (MOD): the dry guitar + one wobbled copy (MIX sets how much): a wobbling short delay (CHORUS, VIBRATO; FLANGER is a
     shorter one fed back into itself), four allpass filters swept up and down (PHASER, fed back a little), or a gain that wobbles
     (TREMOLO). Only the mode's own copy is let through; its wobbler runs only while it is on */
  const mIn=G(1),mDry=G(1),mDl=ctx.createDelay(.05),mFb=G(0),mDlG=G(0),mWet=G(0),mSum=G(1),mTr=G(1),mTrG=G(0),mDep=G(0),mTrD=G(0),mPhD=G(0),mPhFb=G(0),mPhG=G(0),
    mPh=[0,1,2,3].map(()=>{const f=ctx.createBiquadFilter();f.type='allpass';f.frequency.value=700;f.Q.value=.5;return f;});
  mIn.connect(mDry);mDry.connect(mSum);mIn.connect(mDl);mDl.connect(mFb);mFb.connect(mDl);mDl.connect(mDlG);mDlG.connect(mWet);
  mIn.connect(mPh[0]);for(let i=0;i<3;i++)mPh[i].connect(mPh[i+1]);mPh[3].connect(mPhFb);mPhFb.connect(mPh[0]);mPh[3].connect(mPhG);mPhG.connect(mWet);
  mIn.connect(mTr);mTr.connect(mTrG);mTrG.connect(mWet);mWet.connect(mSum);mDep.connect(mDl.delayTime);mTrD.connect(mTr.gain);for(const f of mPh)mPhD.connect(f.frequency);
  let lfo=null;const MOD={inp:mIn,out:mSum};
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
    const c=P.comp,bl=c.blend==null?1:c.blend;cp.threshold.value=-8-34*c.sus;cp.ratio.value=3+9*c.sus;cp.attack.value=.001*Math.pow(60,c.att==null?.3:c.att);ramp(cTone.gain,((c.tone==null?.5:c.tone)-.5)*18);
    ramp(cWet.gain,Math.sin(bl*Math.PI/2)*dB((8+34*c.sus)*(1-1/(3+9*c.sus))*.45));ramp(cDry.gain,Math.cos(bl*Math.PI/2));ramp(cpG.gain,dB((c.lvl-.5)*16));
    const d=P.drive,dg=1+60*d.drive*d.drive,wm=d.warm==null?.5:d.warm;ramp(drHp.frequency,60*Math.pow(5,1-wm));ramp(drWarm.gain,(wm-.5)*12);ramp(drPre.gain,dg/8);ramp(drLp.frequency,1500*Math.pow(6,d.tone));ramp(drOut.gain,.5/Math.tanh(dg*.5)*(.25+1.5*d.lvl));
    const m=P.mod,rate=rateOf(m.rate);
    if(m.on&&!lfo){lfo=ctx.createOscillator();lfo.type='sine';lfo.connect(mDep);lfo.connect(mTrD);lfo.connect(mPhD);lfo.start();}
    if(!m.on&&lfo){try{lfo.stop();lfo.disconnect();}catch(e){}lfo=null;}
    if(lfo)ramp(lfo.frequency,rate,.05);
    /* MIX: CHORUS, FLANGER and PHASER add their copy to the dry guitar (all the way up: as loud as it, the deepest swirl); VIBRATO and
       TREMOLO fade from the dry guitar to their copy (all the way up: only the wobble). (a delay fed back into itself is never shorter
       than one block of sound, 2.7 ms: so the FLANGER sweeps 2.8 … 7 ms) */
    const md=m.mode,mx=m.mix==null?.85:m.mix,mdl=md==='CHORUS'||md==='VIBRATO'||md==='FLANGER',adds=md!=='VIBRATO'&&md!=='TREMOLO';
    ramp(mDlG.gain,mdl?1:0);ramp(mPhG.gain,md==='PHASER'?1:0);ramp(mTrG.gain,md==='TREMOLO'?1:0);
    ramp(mDry.gain,adds?1/(1+.6*mx):1-mx);ramp(mWet.gain,adds?mx/(1+.6*mx):mx);
    ramp(mFb.gain,md==='FLANGER'?.3+.4*m.depth:0);ramp(mPhFb.gain,md==='PHASER'?.25+.3*m.depth:0);
    mDl.delayTime.value=md==='CHORUS'?.012:md==='FLANGER'?.0049:.006;
    ramp(mDep.gain,md==='CHORUS'?.0035*m.depth+.0003:md==='FLANGER'?.0019*m.depth+.0002:md==='VIBRATO'?.0028*m.depth+.0002:0);
    for(const f of mPh)f.frequency.value=md==='PHASER'?900:700;ramp(mPhD.gain,md==='PHASER'?100+700*m.depth:0);
    ramp(mTrD.gain,md==='TREMOLO'?.5*m.depth:0);ramp(mTr.gain,md==='TREMOLO'?1-.5*m.depth:1);
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
    const h=P.harm;ramp(hLvl.gain,h.on?dB(((h.lvl==null?.5:h.lvl)-.5)*24):1);ramp(hTone.frequency,Math.min(16000,toneOf(bsv(h,h.style,'tone',.6))));
    if(!(s.on&&s.wheel))ramp(whG.gain,1,.03);else ramp(whG.gain,E.wheelV==null?1:E.wheelV,.03);
    if(Math.abs(irSize-v.size)>.004){irSize=v.size;clearTimeout(irT);irT=setTimeout(()=>{rCv.buffer=hallIR(ctx,sizeOf(irSize));},rCv.buffer?150:0);}
    const wantSh=v.on&&v.shim>.01;
    if(wantSh&&!shim){shim=shifter(12,.06);rCv.connect(shim.inp);shim.out.connect(rShG);}
    if(!wantSh&&shim){try{rCv.disconnect(shim.inp);}catch(e){}shim.stop();shim=null;}
    ramp(rShG.gain,wantSh?.42*v.shim:0,.1);
    rewire();};

  /* a note: its own copy (or the nearest recording, sped), coming in at once or swelling, muted or ringing, panned if a harmony */
  /* (the guitar's range, C2 to D6, the lowest recording to a 22-fret guitar's top: a note outside it is not played at all, Steve's
     choice, nothing folded or stretched; a HARMONY note that would fall outside is left out too) */
  E.play=(n,vel,o)=>{o=o||{};if(n<LOW||n>HIGH)return null;const n0=n,P=E.P,t=Math.max(ctx.currentTime,o.when||0),lay=vel<=92?'soft':'hard';E.rr=(E.rr||0)+1;
    let kb;if(o.rev){const b=revBuf(ctx,n,lay);kb=b&&{b,rate:1};}else kb=keyBuf(ctx,n,lay,1+E.rr%(n>=66?4:2));if(!kb)return null;
    if(o.det)kb={...kb,rate:kb.rate*Math.pow(2,o.det/1200)};   /* (MICRO's copies: a few cents out) */
    const src=ctx.createBufferSource();src.buffer=kb.b;src.playbackRate.value=kb.rate*(E.bend?Math.pow(2,E.bend*2/12):1);
    /* soft picking where only hard picks were recorded (above E4): darker (a lowpass, lower the softer), a touch quieter and gentler
       at its start, as a lighter pick sounds; its own filter only on those notes */
    const fake=lay==='soft'&&kb.hard&&!o.rev,vs=clamp(vel/92,0,1);let lp=null;
    if(fake){lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1400+3800*Math.pow(vs,1.5);lp.Q.value=-3;src.connect(lp);}
    const g=ctx.createGain(),lvl=Math.pow(clamp(vel,1,127)/127,1.4)*(o.gain==null?1:o.gain)*(o.hammer?.8:1)*(fake?.72:1);g.gain.value=0;g.gain.setValueAtTime(0,t);(lp||src).connect(g);
    const to=o.harm?hTone:vBus;let pan=null;if(o.pan){pan=ctx.createStereoPanner();pan.pan.value=o.pan;g.connect(pan);pan.connect(to);}else g.connect(to);
    /* OCEAN SWELL: SENS picks the notes it swells (played softer than its line); EACH NOTE swells each one from MIX up; WAVE and
       RISE restart the shared swell or the hall's; DECAY lets every note fade after it has swelled (short: like tape backwards) */
    const S=P.swell,sOn=S.on&&!o.rev,soft=sOn&&vel<=thrOf(S.sens),sw=soft&&S.mode==='each',att=sw?swellOf(S.att):o.hammer?.012:fake?.005+.012*(1-vs):.003;
    if(sw){g.gain.linearRampToValueAtTime(lvl*S.mix,t+.003);sCurve(g.gain,lvl*S.mix,lvl,t+.004,att);}
    else g.gain.linearRampToValueAtTime(lvl,t+att);
    if(soft&&!o.harm&&!o.hammer){if(S.mode==='wave')E.wave(t);else if(S.mode==='rise')E.rise(t);}
    const tcs=[];if(P.g.mute>.02&&!o.rev)tcs.push(muteTc(P.g.mute));if(sOn&&S.dec<.98)tcs.push(decTc(S.dec));
    if(tcs.length)g.gain.setTargetAtTime(0,t+(sw?att+.005:att+.01)+(sOn&&S.mode!=='each'&&S.dec<.98?swellOf(S.att)*.6:0),Math.min(...tcs));
    src.start(t,o.offset||0);const v={n,src,g,pan,t0:t,att,lvl,rate0:kb.rate,str:o.str==null?-1:o.str,hammer:!!o.hammer,harm:!!o.harm,slot:o.slot==null?-1:o.slot,parent:o.parent==null?n0:o.parent,oneShot:!!(o.rev||o.one),strum:o.strum||0,fake,released:false};
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
  E.compGR=()=>E.awake&&E.P&&E.P.comp.on?-cp.reduction:0;   /* (how hard the AIR COMPRESSOR squeezes now, dB: its gauge) */
  E.swState=()=>({sw:+swG.gain.value.toFixed(3),wheel:+whG.gain.value.toFixed(3),wet:+rWet.gain.value.toFixed(3),tide:!!tide});
  E.noteOff=(n,t)=>{t=t==null?ctx.currentTime:t;const rel=E.relTime();for(const v of E.voices)if(v.parent===n&&!v.released&&!v.oneShot)E.release(v,t,v.harm?rel*1.2:rel);};
  E.allOff=()=>{for(const v of [...E.voices])E.kill(v,.03);};
  /* FREEZE (BARBERSHOP's footswitch held): the notes sounding then held on as a still cloud. Short overlapping slices (grains, 0.36 s,
     a new one every 90 ms) of each note's ringing middle, each from a random place, so it neither fades nor audibly loops; into the
     guitar's bus, so the pedals and the amp take it. Scheduled a little ahead by a timer that runs only while frozen */
  const fzG=G(0);fzG.connect(vBus);let fz=null;
  E.freeze=notes=>{E.unfreeze(true);const list=notes.map(x=>{const kb=keyBuf(ctx,x.n,x.lay||'hard',1);return kb&&{kb,g:x.g||1};}).filter(Boolean);if(!list.length)return 0;
    const t=ctx.currentTime,step=.09,dur=.36;hold(fzG.gain,t);fzG.gain.linearRampToValueAtTime(.62/Math.sqrt(list.length),t+.5);let next=t+.02;
    const tick=()=>{const now=ctx.currentTime;if(next<now)next=now+.01;
      while(next<now+.25){for(const x of list){const b=x.kb.b,r=x.kb.rate,len=b.duration/r,lo=Math.min(.3,len*.2),hi=Math.max(lo+.05,Math.min(1.6,len-dur-.05)),off=(lo+Math.random()*(hi-lo))*r;
          const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;s.playbackRate.value=r;g.gain.setValueAtTime(0,next);g.gain.linearRampToValueAtTime(x.g,next+dur/2);g.gain.linearRampToValueAtTime(0,next+dur);
          s.connect(g);g.connect(fzG);s.start(next,off,dur*r+.01);s.onended=()=>{try{s.disconnect();g.disconnect();}catch(e){}};}
        next+=step;}};
    tick();fz={list,iv:setInterval(tick,60)};return list.length;};
  E.unfreeze=quick=>{if(!fz)return;clearInterval(fz.iv);fz=null;const t=ctx.currentTime;hold(fzG.gain,t);fzG.gain.setTargetAtTime(0,t,quick?.02:.3);};
  E.frozen=()=>fz?fz.list.length:0;
  E.panic=()=>{E.unfreeze(true);E.allOff();const t=ctx.currentTime;for(const g of [dFb,rWet,rShG,dWet]){hold(g.gain,t);g.gain.setTargetAtTime(0,t,.02);}clearTimeout(E._pT);E._pT=setTimeout(()=>E.apply(),1500);};
  E.wake=()=>{if(E.awake)return;E.awake=true;lim.connect(outG);lim.connect(meter);};
  E.sleep=()=>{if(!E.awake)return;E.awake=false;try{lim.disconnect();}catch(e){}};
  E.level=()=>{if(!E.awake)return 0;meter.getFloatTimeDomainData(mbuf);let s=0;for(const v of mbuf)s+=v*v;return Math.sqrt(s/mbuf.length);};
  /* the guitar's own loudness (its notes and harmonies, before VOLUME): the CUSHION follows it */
  const gMet=ctx.createAnalyser();gMet.fftSize=1024;const gbuf=new Float32Array(1024);whG.connect(gMet);
  E.gLevel=()=>{if(!E.awake)return 0;gMet.getFloatTimeDomainData(gbuf);let s=0;for(const v of gbuf)s+=v*v;return Math.sqrt(s/gbuf.length);};
  E.inLevel=()=>{inMon.getFloatTimeDomainData(ibuf);let p=0;for(const v of ibuf){const a=Math.abs(v);if(a>p)p=a;}return p;};
  E.sndIn=sndIn;E.lfoOn=()=>!!lfo;E.shimOn=()=>!!shim;E.chain=()=>chainKey;
  E.dispose=()=>{E.unfreeze(true);E.allOff();if(lfo)try{lfo.stop();}catch(e){}if(shim)shim.stop();clearTimeout(irT);
    if(tide)try{tide.stop();}catch(e){}
    setTimeout(()=>{for(const n of [hTone,hLvl,fzG,swG,whG,tideAmp,loopIn,padBus,vBus,pkLo,pkHi,tone,gVol,chainIn,sndIn,cIn,cp,cTone,cWet,cDry,cpG,drHp,drMid,drPre,drSh,drWarm,drLp,drOut,mIn,mDry,mDl,mFb,mDlG,mWet,mSum,mTr,mTrG,mDep,mTrD,mPhD,mPhFb,mPhG,...mPh,aHp,aPre,aSh,aMk,aBass,aMid,aTreb,aC1,aC2,cab1,cab2,cab3,cab4,cabOut,aMaster,dIn,dDry,dL,dR,dFb,dTone,dMg,dWet,dOut,rIn,rDry,rPre,rCv,rWet,rOut,rShG,preLim,lim])try{n.disconnect();}catch(e){}},300);};
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
.dw .ped.drive.sun{flex:0 0 75px;padding:0;background:#2A1650;border-radius:4px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 2px 4px #000}
.dw .sdf{position:absolute;left:0;top:0;transform-origin:0 0;transform:scale(.11381)}.dw .sdk,.dw .sdfs,.dw .sdtxt,.dw .sdlamp,.dw .sdtail,.dw .sdglow,.dw .sdled{position:absolute}
.dw .sdk{border-radius:50%;cursor:ns-resize}.dw .sdfs{border-radius:50%;cursor:pointer}.dw .sdfs.down{background:rgba(0,0,0,.25)}
.dw .sdtxt,.dw .sdlamp,.dw .sdtail,.dw .sdglow,.dw .sdled{pointer-events:none}
.dw .sdtail{border-radius:4px;filter:brightness(.32) saturate(.55)}   /* (its opacity and the glow's are set by tailsPaint: with the sound) */
.dw .sdglow{border-radius:50%;opacity:0;mix-blend-mode:screen;background:radial-gradient(closest-side,rgba(255,70,40,.8),rgba(255,40,20,.28) 55%,rgba(255,30,10,0))}
.dw .sdlamp{border-radius:50%;opacity:0;mix-blend-mode:screen;background:radial-gradient(closest-side,rgba(255,236,190,.95),rgba(255,150,70,.55) 30%,rgba(255,110,60,.18) 62%,rgba(255,90,60,0));transition:opacity .15s}
.dw .sdled{border-radius:50%}.dw .ped.sun.on .sdled{background:radial-gradient(circle,#FFE8E0 0 22%,#FF3A24 55%,rgba(255,40,20,0) 100%);box-shadow:0 0 30px 12px rgba(255,50,30,.6)}
.dw .ped.comp.air{flex:0 0 73px;padding:0;background:#E9B312;border-radius:4px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 2px 4px #000}
.dw .acf{position:absolute;left:0;top:0;transform-origin:0 0;transform:scale(.11423)}.dw .ack,.dw .acfs,.dw .acpatch,.dw .acneedle,.dw .acled{position:absolute}
.dw .ack{border-radius:50%;cursor:ns-resize}.dw .acfs{border-radius:50%;cursor:pointer}.dw .acfs.down{background:rgba(0,0,0,.25)}
.dw .acpatch,.dw .acneedle{pointer-events:none}.dw .acn{transition:none}.dw .acled{border-radius:50%;pointer-events:none}
.dw .ped.air.on .acled{background:radial-gradient(circle,#FFE8E0 0 22%,#FF3A24 55%,rgba(255,40,20,0) 100%);box-shadow:0 0 30px 12px rgba(255,50,30,.6)}
.dw .ped.pad.cu{flex:0 0 67px;padding:0;background:#3E5A3A;border-radius:6px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 2px 4px #000}
.dw .cuf{position:absolute;left:0;top:0;transform-origin:0 0;transform:scale(.11445)}.dw .cub,.dw .cuk,.dw .cufs,.dw .curing,.dw .cuglow,.dw .cuswing{position:absolute}
.dw .cub{border-radius:14px;cursor:pointer;background:rgba(28,18,8,.34);transition:background .15s,box-shadow .15s}.dw .cub.on{background:rgba(255,226,160,.22);box-shadow:0 0 26px 8px rgba(255,205,120,.7),inset 0 0 18px rgba(255,240,200,.6);mix-blend-mode:screen}
.dw .cub.down{background:rgba(0,0,0,.3)}.dw .cuk{border-radius:50%;cursor:ns-resize}.dw .cufs{border-radius:50%;cursor:pointer}.dw .cufs.down{background:rgba(0,0,0,.25)}
.dw .curing,.dw .cuglow,.dw .cuswing,.dw .cutxt{pointer-events:none}.dw .cutxt{position:absolute}.dw .curing{filter:brightness(.42) saturate(.35)}.dw .ped.cu.on .curing{filter:none}
.dw .cuglow{border-radius:50%;opacity:0;mix-blend-mode:screen;background:radial-gradient(closest-side,rgba(255,226,170,0) 52%,rgba(255,214,140,.55) 64%,rgba(255,200,120,0));transition:opacity .2s}.dw .ped.cu.on .cuglow{opacity:1}
.dw .ped.mod.lh{flex:0 0 87px;padding:0;background:#1B2B4A;border-radius:7px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 2px 4px #000}
.dw .lhf{position:absolute;left:0;top:0;transform-origin:0 0;transform:scale(.12682)}.dw .lhk,.dw .lhfs,.dw .lhled,.dw .lhglow,.dw .lhbeam{position:absolute}
.dw .lhk{border-radius:50%;cursor:ns-resize}.dw .lhk.mode{cursor:pointer}.dw .lhfs{border-radius:50%;cursor:pointer}.dw .lhfs.down{background:rgba(0,0,0,.25)}
.dw .lhbeam,.dw .lhglow,.dw .lhled,.dw .lhtxt{pointer-events:none}.dw .lhtxt{position:absolute}.dw .lhbeam{mix-blend-mode:screen}
.dw .lhglow{border-radius:50%;opacity:0;mix-blend-mode:screen;background:radial-gradient(closest-side,rgba(255,246,210,.95),rgba(255,214,120,.55) 38%,rgba(255,190,90,0));transition:opacity .2s}.dw .ped.lh.on .lhglow{opacity:.9}
.dw .lhled{border-radius:50%}.dw .ped.lh.on .lhled{background:radial-gradient(circle,#FFF6DC 0 22%,#FFC23A 55%,rgba(255,190,40,0) 100%);box-shadow:0 0 30px 12px rgba(255,190,60,.6)}
.dw .ped.harm.bs{flex:0 0 97px;padding:0;background:#7A1E1C;border-radius:4px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 2px 4px #000}
.dw .bsf{position:absolute;left:0;top:0;transform-origin:0 0;transform:scale(.120553)}
.dw .bswin,.dw .bspole,.dw .bsk,.dw .bsb,.dw .bsled,.dw .bsbloom,.dw .bsfs{position:absolute}
.dw .bswin{overflow:hidden;cursor:pointer}.dw .bswin *{pointer-events:none}.dw .bsscr{position:absolute;left:0;top:0;width:100%;height:100%}
.dw .bssing{position:absolute;border-radius:50%;opacity:0;mix-blend-mode:screen;background:radial-gradient(closest-side,rgba(255,226,160,.75),rgba(255,190,100,.3) 55%,rgba(255,170,80,0))}
.dw .bspole{pointer-events:none;opacity:0}.dw .ped.bs.on .bspole{opacity:1}
.dw .bsk{border-radius:50%;cursor:ns-resize}.dw .bsb{border-radius:50%;cursor:pointer}.dw .bsb.down,.dw .bsfs.down{background:rgba(0,0,0,.3)}
.dw .bsfs{border-radius:50%;cursor:pointer}
.dw .bsled{border-radius:50%;pointer-events:none;filter:brightness(.3) saturate(.4)}.dw .ped.bs.on .bsled{filter:none}.dw .ped.bs.on .bsled.blink{filter:brightness(.3) saturate(.4)}
.dw .bsbloom{border-radius:50%;pointer-events:none;opacity:0;mix-blend-mode:screen;background:radial-gradient(closest-side,rgba(255,90,70,.75),rgba(255,40,20,.25) 50%,rgba(255,30,10,0))}.dw .ped.bs.on .bsbloom{opacity:1}.dw .ped.bs.on .bsled.blink+.bsbloom{opacity:0}
.dw .bsp{position:absolute;left:452px;top:8px;width:296px;max-height:384px;z-index:30;display:none;flex-direction:column;gap:6px;padding:9px 10px 10px;border-radius:9px;background:rgba(16,18,22,.56);backdrop-filter:blur(6px) saturate(1.2);box-shadow:0 0 0 1px rgba(255,255,255,.14),0 12px 30px rgba(0,0,0,.55);color:#E9ECF0;font:600 8px Bahnschrift,'Segoe UI',Arial;letter-spacing:.4px;cursor:default;overflow:hidden}
.dw .bsp.open{display:flex}.dw .bsph{display:flex;align-items:center;gap:4px}
.dw .bspt{font:700 10px Bahnschrift,'Segoe UI',Arial;letter-spacing:3px;color:#fff;margin-right:auto;display:flex;align-items:center;gap:6px}
.dw .bspt i{width:5px;height:14px;border-radius:2px;background:repeating-linear-gradient(-55deg,#D63A34 0 3px,#fff 3px 5px,#2D57B8 5px 8px,#fff 8px 10px)}
.dw .bspn{flex:1;text-align:center;font-size:9px;letter-spacing:1px;color:#fff;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:5px;padding:3px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dw .bspb,.dw .bspc{cursor:pointer;padding:3px 7px;border-radius:5px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#DDE2E8;white-space:nowrap;text-align:center}
.dw .bspb:hover,.dw .bspc:hover{background:rgba(255,255,255,.16)}.dw .bspb.on,.dw .bspc.on{background:#D63A34;border-color:#F06A62;color:#fff}
.dw .bsph .fz.on{background:#5BB8E0;border-color:#9AD9F2;color:#06202C}.dw .bspx{cursor:pointer;font-size:14px;line-height:1;padding:0 2px 2px 5px;color:#AEB6C0}.dw .bspx:hover{color:#fff}
.dw .bsps{display:flex;gap:3px}.dw .bsps .bspc{flex:1;padding:4px 0;font-size:6.5px;letter-spacing:.6px}
.dw .bsph2{color:#8C96A3;font-size:6.5px;letter-spacing:2px;margin-top:3px;padding-top:5px;border-top:1px solid rgba(255,255,255,.08)}
.dw .bsptip{color:#9AA4B0;font-style:italic;font-size:7px;letter-spacing:.2px}
.dw .bspr{display:flex;align-items:center;gap:6px;min-height:13px}.dw .bspr label{width:58px;flex:none;color:#B9C1CB;font-size:7px;letter-spacing:.8px}
.dw .bspr input[type=range]{flex:1;min-width:0;accent-color:#D63A34;height:11px;margin:0;cursor:pointer}
.dw .bspr .v{width:68px;flex:none;text-align:right;color:#fff;font-size:7.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dw .seg{flex:1;display:flex;flex-wrap:wrap;gap:3px}.dw .seg .bspc{padding:2px 5px;font-size:6.5px}
.dw .bsp select{flex:1;min-width:0;background:#22262C;color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:5px;font:600 8px Bahnschrift,Arial;padding:2px 4px;cursor:pointer}.dw .bsp select:disabled{opacity:.4;cursor:default}.dw .bsp select.bspsel{font-size:9.5px;letter-spacing:1px;padding:3px 6px;text-align:center}.dw .bsp optgroup{color:#8C96A3;font-style:normal}.dw .bsp option{color:#fff}
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
  'swell.mix':['MIX',v=>v<.02?'PURE SWELL':pct(v)+' OF THE PICK KEPT'],'swell.dec':['DECAY',v=>v>.98?'RINGS ON':'FADES IN '+decTc(v).toFixed(2)+' S'],'comp.sus':['SUSTAIN',pct],'comp.tone':['TONE',v=>((v-.5)*18>=0?'+':'')+((v-.5)*18).toFixed(1)+' DB TREBLE'],'comp.blend':['BLEND',v=>v>.98?'ALL SQUEEZED':v<.02?'ALL CLEAN':pct(v)+' SQUEEZED'],'comp.att':['ATTACK',v=>(.001*Math.pow(60,v)*1000).toFixed(1)+' MS'],'comp.lvl':['LEVEL',v=>((v-.5)*16>=0?'+':'')+((v-.5)*16).toFixed(1)+' DB'],
  'drive.drive':['DRIVE',pct],'drive.tone':['TONE',pct],'drive.warm':['WARMTH',v=>v<.2?'TIGHT AND LEAN':v<.45?'TIGHTER':v<.6?'BALANCED':v<.85?'WARM':'ROUND AND FULL'],'drive.lvl':['LEVEL',pct],'harm.mix':['MIX',v=>v<.02?'YOUR GUITAR ONLY':v>.98?'THE HARMONIES ONLY':'GUITAR '+Math.round(Math.min(1,2*(1-v))*100)+'% · HARMONY '+Math.round(Math.min(1,2*v)*100)+'%'],'harm.lvl':['LEVEL',v=>((v-.5)*24>=0?'+':'')+((v-.5)*24).toFixed(1)+' DB'],'harm.val':['VALUE',v=>''],'mod.rate':['RATE',v=>rateOf(v).toFixed(2)+' HZ'],'mod.depth':['DEPTH',pct],'mod.mix':['MIX',v=>v<.02?'YOUR GUITAR ONLY':pct(v)],'mod.modek':['MODE',v=>{const x=MMODES[Math.round(v*4)];return x+' · '+MTIP[x];}],
  'g.strumk':['STRUM',v=>({OFF:'OFF: EVERY KEY AT ONCE',DOWN:'DOWN: EACH CHORD LOW TO HIGH','DOWN/UP':'DOWN/UP: DOWN, THEN THE NEXT CHORD UP'})[STRUMS[Math.round(v*2)]]],
  'amp.chan':['CHANNEL',v=>(AMPS[Object.keys(AMPS)[Math.round(v*3)]]||AMPS.clean).name],'amp.gain':['GAIN',pct],'amp.bass':['BASS',v=>((v-.5)*20).toFixed(1)+' DB'],'amp.mid':['MIDDLE',v=>((v-.5)*20).toFixed(1)+' DB'],'amp.treb':['TREBLE',v=>((v-.5)*20).toFixed(1)+' DB'],'amp.master':['MASTER',pct],
  'pad.level':['LEVEL',pct],'pad.air':['AIR',v=>v<.02?'OFF':pct(v)+' BREATH'],'pad.swell':['FADE IN',v=>v<.2?'QUICK':v<.6?'GENTLE':v<.85?'SLOW':'VERY SLOW'],
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
/* the AIR COMPRESSOR's face: Steve's photo (Skins\air-compressor.jpg, 848 × 1262, made 2026-11-24 from the sketch Skins\air-compressor-
   sketch.png: a yellow pedal with a printed shop air compressor), framed on its own yellow body as OCEAN SWELL is (rounded, just inside the edges: the cut-out along its outline left a ragged fringe)
   (cut: x, y, w, h; 122 / 1068). Its knobs' black tops turn (their skirts, seen a little from the side, stay); the big pressure gauge
   on the printed compressor works: its printed needle is painted out with the dial's own cream (made from the photo's bytes as it
   loads) and a live needle drawn in its place reads how hard the pedal squeezes (the compressor's gain reduction, 0 to 30 dB over the
   dial's sweep, the red zone from about 21 dB), swinging up quickly and settling back slowly, with a little spring, as a real gauge */
const AC={src:'mixtape2/Skins/air-compressor.jpg',iw:848,ih:1262,cut:[106,100,640,1068],   /* (the yellow body only, just inside its edges: no jacks, no backdrop) */
  knobs:[['comp.lvl',222,236],['comp.tone',420,236],['comp.sus',615,236],['comp.blend',271,466],['comp.att',566,466]],kr:50,
  gauge:{x:583,y:694.7,r:30,zero:-131,full:131,ptr:29,tail:13},fs:[424,1102,60],led:[653,1100,12]};
function acFace(){const u=M2.fileUrl(AC.src),[cx,cy,cw,ch]=AC.cut,bg=(x,y)=>`background:url('${u}') ${-x}px ${-y}px/${AC.iw}px ${AC.ih}px no-repeat`,
    at=(x,y,w,h)=>`left:${x-cx}px;top:${y-cy}px;width:${w}px;height:${h}px`,G=AC.gauge,gr=G.r+8;
  return `<div class="acf" style="width:${cw}px;height:${ch}px;${bg(cx,cy)}">`+
    AC.knobs.map(([k,x,y])=>{const r=AC.kr;return `<div class="ack" data-k="${k}" title="${KN[k][0].toLowerCase()}" style="${at(x-r,y-r,2*r,2*r)};${bg(x-r,y-r)}"></div>`;}).join('')+
    `<canvas class="acpatch" style="${at(G.x-G.r,G.y-G.r,2*G.r,2*G.r)}"></canvas>`+
    `<svg class="acneedle" viewBox="${-gr} ${-gr} ${2*gr} ${2*gr}" style="${at(G.x-gr,G.y-gr,2*gr,2*gr)}"><g class="acn" style="transform:rotate(${G.zero}deg)">`+
      `<path d="M-1.6 ${G.tail} L-1.1 0 L-.35 ${-G.ptr} L.35 ${-G.ptr} L1.1 0 L1.6 ${G.tail} Z" fill="#141210"/><circle cx="0" cy="${G.tail-1}" r="2.6" fill="#141210"/></g>`+
      `<circle r="4.6" fill="#1E1B18"/><circle r="1.8" cx="-.8" cy="-.8" fill="#6A645C"/></svg>`+
    `<i class="acled" style="${at(AC.led[0]-AC.led[2],AC.led[1]-AC.led[2],2*AC.led[2],2*AC.led[2])}"></i>`+
    `<div class="acfs" data-s="comp" title="AIR COMPRESSOR on / off" style="${at(AC.fs[0]-AC.fs[2],AC.fs[1]-AC.fs[2],2*AC.fs[2],2*AC.fs[2])}"></div></div>`;}
/* the SUNSET DRIVE's face: Steve's photo (Skins\sunset-drive.jpg, 848 × 1262, 2026-11-25, from Skins\sunset-drive-sketch.png: an 80s
   car driving into a striped sunset on a neon grid road), framed on its purple body (122 / 1072). Its four knobs' black tops turn; the
   car's tail lights (photographed lit) are dimmed while the drive is off and glow, with a bloom, while it is on; the street lamps glow
   brighter the higher LEVEL is turned while it is on (Steve's idea); the printed lettering, pink on purple and hard to read small, is
   brightened as the photo loads (only its letters: pixels lighter than the purple lifted toward pink-white) */
const SD={src:'mixtape2/Skins/sunset-drive.jpg',iw:848,ih:1262,cut:[96,96,660,1072],   /* (down to the body's bottom edge: the footswitch whole) */
  knobs:[['drive.drive',189,232],['drive.tone',346,232],['drive.warm',503,232],['drive.lvl',660,232]],kr:46,
  tails:[[270,805,70,26],[505,805,72,26]],lamps:[[228,490,34],[618,490,34],[298,607,22],[548,607,22],[318,641,16],[528,641,16],[330,668,12],[516,668,12]],
  text:[[130,303,592,46],[195,983,462,66]],fs:[423,1100,58],led:[666,1104,12]};
function sdFace(){const u=M2.fileUrl(SD.src),[cx,cy,cw,ch]=SD.cut,bg=(x,y)=>`background:url('${u}') ${-x}px ${-y}px/${SD.iw}px ${SD.ih}px no-repeat`,
    at=(x,y,w,h)=>`left:${x-cx}px;top:${y-cy}px;width:${w}px;height:${h}px`;
  return `<div class="sdf" style="width:${cw}px;height:${ch}px;${bg(cx,cy)}">`+
    SD.text.map(([x,y,w,h],i)=>`<canvas class="sdtxt" data-i="${i}" style="${at(x,y,w,h)}"></canvas>`).join('')+
    SD.lamps.map(([x,y,r])=>`<i class="sdlamp" style="${at(x-r*2.2,y-r*2.2,r*4.4,r*4.4)}"></i>`).join('')+
    SD.tails.map(([x,y,w,h])=>`<i class="sdtail" style="${at(x,y,w,h)};${bg(x,y)}"></i><i class="sdglow" style="${at(x-w*.4,y-h*1.2,w*1.8,h*3.4)}"></i>`).join('')+
    SD.knobs.map(([k,x,y])=>{const r=SD.kr;return `<div class="sdk" data-k="${k}" title="${KN[k][0].toLowerCase()}" style="${at(x-r,y-r,2*r,2*r)};${bg(x-r,y-r)}"></div>`;}).join('')+
    `<i class="sdled" style="${at(SD.led[0]-SD.led[2],SD.led[1]-SD.led[2],2*SD.led[2],2*SD.led[2])}"></i>`+
    `<div class="sdfs" data-s="drive" title="SUNSET DRIVE on / off" style="${at(SD.fs[0]-SD.fs[2],SD.fs[1]-SD.fs[2],2*SD.fs[2],2*SD.fs[2])}"></div></div>`;}
/* BARBERSHOP's face: Steve's picture (Skins\barbershop.jpg, 896 × 1200, 2026-11-25: a red pedal with an old barbershop front, a barber
   pole by its door, a quartet singing in its window), framed on its red body (122 / 1012). Its brass knobs turn (MIX, VALUE, LEVEL;
   photographed pointing straight up); the four brass buttons below the window (STYLE, PREV, NEXT, KEY) press; the WINDOW is its screen:
   the picture dimmed (shop closed) while it is off, lit with gold-leaf lettering, as a shop window's, while it is on; the three singers
   glow when their voices sound; the pole's stripes turn while it is on and sounding, faster the louder; the red light (photographed lit)
   is dimmed while it is off and blinks while FROZEN */
const BS={src:'mixtape2/Skins/barbershop.jpg',iw:896,ih:1200,cut:[44,66,806,1012],
  knobs:[['harm.mix',187,275],['harm.val',448,275],['harm.lvl',709,275]],kr:70,
  btns:[['bs.style',371,854,'STYLE: the kind of harmony'],['bs.prev',485,854,'PREV: the BARBERSHOP preset before'],['bs.next',599,854,'NEXT: the next BARBERSHOP preset'],['bs.key',713,854,'KEY: opens the settings (every voice, the key, the scale); held, it LEARNS the key from what you play']],br:36,
  win:[322,517,426,271],pole:[84,586,32,90],singers:[[372,662],[440,660],[507,662]],fs:[450,997,66],led:[581,996,26]};
function bsFace(){const u=M2.fileUrl(BS.src),[cx,cy,cw,ch]=BS.cut,bg=(x,y)=>`background:url('${u}') ${-x}px ${-y}px/${BS.iw}px ${BS.ih}px no-repeat`,
    at=(x,y,w,h)=>`left:${x-cx}px;top:${y-cy}px;width:${w}px;height:${h}px`,[wx,wy,ww,wh]=BS.win,[px,py,pw,ph]=BS.pole,L=BS.led;
  return `<div class="bsf" style="width:${cw}px;height:${ch}px;${bg(cx,cy)}">`+
    `<div class="bswin" data-b="bs.panel" title="click: every setting, in a panel" style="${at(wx,wy,ww,wh)}">`+BS.singers.map(([x,y],i)=>`<i class="bssing" data-i="${i}" style="left:${x-wx-48}px;top:${y-wy-150}px;width:96px;height:270px"></i>`).join('')+
      `<canvas class="bsscr" width="${ww*2}" height="${wh*2}"></canvas></div>`+
    `<canvas class="bspole" width="${pw*3}" height="${ph*3}" style="${at(px,py,pw,ph)}"></canvas>`+
    BS.knobs.map(([k,x,y])=>{const r=BS.kr;return `<div class="bsk" data-k="${k}" title="${k==='harm.val'?'value: the main setting of the style (shown in the window)':KN[k][0].toLowerCase()}" style="${at(x-r,y-r,2*r,2*r)};${bg(x-r,y-r)}"></div>`;}).join('')+
    BS.btns.map(([b,x,y,t])=>`<div class="bsb" data-b="${b}" title="${t}" style="${at(x-BS.br,y-BS.br,2*BS.br,2*BS.br)}"></div>`).join('')+
    `<i class="bsled" style="${at(L[0]-L[2],L[1]-L[2],2*L[2],2*L[2])};${bg(L[0]-L[2],L[1]-L[2])}"></i><i class="bsbloom" style="${at(L[0]-L[2]*2.5,L[1]-L[2]*2.5,L[2]*5,L[2]*5)}"></i>`+
    `<div class="bsfs" data-s="harm" title="BARBERSHOP on / off; held, FREEZE what sounds (a tap lets it go)" style="${at(BS.fs[0]-BS.fs[2],BS.fs[1]-BS.fs[2],2*BS.fs[2],2*BS.fs[2])}"></div></div>`;}
/* the LIGHTHOUSE's face (the MOD pedal): Steve's picture (Skins\lighthouse.jpg, 896 × 1200, 2026-11-25, from Skins\lighthouse-sketch.png:
   a navy pedal painted edge to edge with a lighthouse on a rocky point at dusk, waves breaking), framed on its body (114 / 1076). Its MODE
   knob (black, photographed pointing past CHORUS) turns to the five sounds printed round it (a click steps to the next); the cream tops
   of RATE DEPTH MIX turn; the lamp room is lit while it is on, and its beam (drawn live, as from the side: two beams turning round, long
   when they point sideways, a flash when one faces you) turns at the RATE, brighter with DEPTH, while it is awake and in sight */
const LH={src:'mixtape2/Skins/lighthouse.jpg',iw:896,ih:1200,cut:[110,114,684,962],
  mode:[271,273,64,-147],ticks:[-124,-65,3,68,121],   /* (the MODE knob: its middle, size, where its pointer was photographed; the five sounds' ticks, degrees from straight up) */
  knobs:[['mod.rate',488,243],['mod.depth',606,243],['mod.mix',722,243]],kr:38,lamp:[619,531],fs:[452,986,57],led:[657,984,21],
  /* the printed words, too small to read at the desk's size (Steve): each covered with the sky beside it (dy away) and written again,
     RATE DEPTH MIX large, MODE replaced by the sound chosen, large; the five sounds round MODE at their own size (the picture spelt one
     FLANGEP). [word, middle x, y, width, height, sky from dy, letter size] in the picture's pixels; the lettering is drawn over x 110…796, y 140…400 */
  words:[['RATE',488,336,60,18,40,34],['DEPTH',601,336,80,18,40,34],['MIX',710,336,46,18,40,34],['',274,367,72,19,30,36],
    ['PHASER',275,179,74,15,-25,17],['FLANGER',180,230,84,16,-40,16],['VIBRATO',363,230,80,16,-40,17],['CHORUS',187,333,78,16,25,17],['TREMOLO',363,333,90,16,25,17]],
  txt:[110,140,686,260]};
const MTIP={CHORUS:'A SHIMMERING DOUBLE',FLANGER:'A JET PLANE\'S WHOOSH',PHASER:'A SWIRLING SWEEP',VIBRATO:'THE PITCH WAVERS',TREMOLO:'THE VOLUME PULSES'};
function lhFace(){const u=M2.fileUrl(LH.src),[cx,cy,cw,ch]=LH.cut,bg=(x,y)=>`background:url('${u}') ${-x}px ${-y}px/${LH.iw}px ${LH.ih}px no-repeat`,
    at=(x,y,w,h)=>`left:${x-cx}px;top:${y-cy}px;width:${w}px;height:${h}px`,[mx,my,mr,mo]=LH.mode,[lx,ly]=LH.lamp,L=LH.led;
  return `<div class="lhf" style="width:${cw}px;height:${ch}px;${bg(cx,cy)}">`+
    `<i class="lhglow" style="${at(lx-46,ly-46,92,92)}"></i><canvas class="lhbeam" width="${cw/2}" height="${ch/2}" style="left:0;top:0;width:${cw}px;height:${ch}px"></canvas>`+
    `<canvas class="lhtxt" width="${LH.txt[2]}" height="${LH.txt[3]}" style="${at(...LH.txt)}"></canvas>`+
    `<div class="lhk mode" data-k="mod.modek" data-off="${mo}" title="mode: chorus, flanger, phaser, vibrato, tremolo (click: the next; drag or scroll)" style="${at(mx-mr,my-mr,2*mr,2*mr)};${bg(mx-mr,my-mr)}"></div>`+
    LH.knobs.map(([k,x,y])=>{const r=LH.kr;return `<div class="lhk" data-k="${k}" title="${KN[k][0].toLowerCase()}" style="${at(x-r,y-r,2*r,2*r)};${bg(x-r,y-r)}"></div>`;}).join('')+
    `<i class="lhled" style="${at(L[0]-L[2],L[1]-L[2],2*L[2],2*L[2])}"></i>`+
    `<div class="lhfs" data-s="mod" title="LIGHTHOUSE on / off" style="${at(LH.fs[0]-LH.fs[2],LH.fs[1]-LH.fs[2],2*LH.fs[2],2*LH.fs[2])}"></div></div>`;}
/* the CUSHION's face (the PAD pedal): Steve's picture (Skins\cushion.jpg, 896 × 1200, 2026-11-25: a porch with a flowered swing, CUSHION
   lettered over it, six tan sound buttons, three black knobs, a footswitch in a ring that glows), framed on its body (72 / 1138). Its
   buttons light the sounds (any two; the others dimmed); LEVEL AIR FADE IN turn (photographed pointing up); the footswitch's ring
   (photographed lit) is dimmed while it is off and glows while it is on; the porch swing sways gently while it holds a chord, settling
   still as it lets go (Steve's pick): the swing, cut out by its outline, turned a little about the porch roof above it, over a copy of the
   porch with the swing filled in from either side of it, so no second swing shows behind the moving one; drawn only while it sways */
const CU={src:'mixtape2/Skins/cushion.jpg',iw:896,ih:1200,cut:[154,72,590,1066],
  btns:[['warm',271,258,150,78],['glass',440,258,155,78],['choir',622,258,160,78],['strings',271,356,150,81],['organ',442,356,158,81],['shruti',621,356,160,81]],
  knobs:[['pad.level',282,515],['pad.air',448,515],['pad.swell',615,515]],kr:64,fs:[450,1003,92],ring:[66,95],
  pivot:[452,180],swing:[[[259,676],[300,668],[380,662],[450,656],[520,662],[600,668],[648,676],[650,775],[732,780],[738,800],[728,812],[726,920],[186,920],[182,812],[172,800],[176,778],[258,772]],
    [[203,395],[229,395],[240,792],[212,792]],[[677,395],[704,395],[716,792],[688,792]]],box:[160,380,590,550],
  /* the knobs' red names, hard to read on the busy porch at the desk's size: written again over them, a dark edge round each letter */
  words:[['LEVEL',287,633],['AIR',448,633],['FADE IN',612,633]],wbox:[200,600,520,66]};
function cuFace(){const u=M2.fileUrl(CU.src),[cx,cy,cw,ch]=CU.cut,bg=(x,y)=>`background:url('${u}') ${-x}px ${-y}px/${CU.iw}px ${CU.ih}px no-repeat`,
    at=(x,y,w,h)=>`left:${x-cx}px;top:${y-cy}px;width:${w}px;height:${h}px`,[fx,fy,fr]=CU.fs,[r0,r1]=CU.ring;
  return `<div class="cuf" style="width:${cw}px;height:${ch}px;${bg(cx,cy)}">`+
    `<canvas class="cuswing" width="${CU.box[2]}" height="${CU.box[3]}" style="${at(...CU.box)}"></canvas>`+
    `<canvas class="cutxt" width="${CU.wbox[2]}" height="${CU.wbox[3]}" style="${at(...CU.wbox)}"></canvas>`+
    CU.btns.map(([c,x,y,w,h])=>`<div class="cub" data-b="pad.${c}" title="${c}: light it (any two at once; a third puts out the first lit)" style="${at(x-w/2,y-h/2,w,h)}"></div>`).join('')+
    CU.knobs.map(([k,x,y])=>{const r=CU.kr;return `<div class="cuk" data-k="${k}" title="${KN[k][0].toLowerCase()}" style="${at(x-r,y-r,2*r,2*r)};${bg(x-r,y-r)}"></div>`;}).join('')+
    `<i class="curing" style="${at(fx-r1-2,fy-r1-2,2*r1+4,2*r1+4)};${bg(fx-r1-2,fy-r1-2)};-webkit-mask:radial-gradient(circle,transparent ${r0}px,#000 ${r0+3}px ${r1-1}px,transparent ${r1+2}px)"></i>`+
    `<i class="cuglow" style="${at(fx-r1*1.5,fy-r1*1.5,r1*3,r1*3)}"></i>`+
    `<div class="cufs" data-s="pad" title="CUSHION on / off; while it holds a chord, a tap lets the chord go" style="${at(fx-fr,fy-fr,2*fr,2*fr)}"></div></div>`;}
const PEDALS=[['swell','OCEAN SWELL','notes rise like a swell on the sea: each note, a wave, the tide, or the hall rising'],['comp','AIR COMPRESSOR','evens and lengthens: squeeze, attack, tone, blend'],['drive','SUNSET DRIVE','a warm overdrive: drive, tone, warmth, level'],['harm','BARBERSHOP','a harmonizer: voices in the key, octaves, a doubled guitar, crystals; held, it freezes'],['mod','LIGHTHOUSE','chorus · flanger · phaser · vibrato · tremolo: rate, depth, mix'],['pad','CUSHION','a soft pad under the guitar: any two of six sounds; it holds what you play until the next chord'],
  ['delay','DELAY','echoes, in time with the desk'],['verb','REVERB','a hall, shimmer above it']];
const PNAME={swell:'OCEAN SWELL',comp:'AIR COMPRESSOR',drive:'SUNSET DRIVE',harm:'BARBERSHOP',mod:'LIGHTHOUSE',pad:'CUSHION',delay:'DELAY',verb:'REVERB'};
/* a sound saved before BARBERSHOP (HARMONY's MODE and interval) as BARBERSHOP's STYLE and pages; and before the CUSHION (the PAD's one sound) */
function oldHarm(v){const pd=v&&v.pad;if(pd&&typeof pd.ch==='string'){if(pd.ch==='air'){pd.ch=['warm'];pd.air=.7;}else pd.ch=[pd.ch];}
  const h=v&&v.harm;if(!h||!h.mode)return v;const m=h.mode;h.style={QUAD:'QUARTET',OCTAVES:'OCTAVER',CRYSTALS:'CRYSTALS'}[m]||'DIATONIC';h.s=h.s||{};
  if(m==='DIATONIC'){const iv={'3RD UP':2,'4TH UP':3,'5TH UP':4,'6TH UP':5,'OCTAVE UP':7,'3RD DOWN':-2,'4TH DOWN':-3,'5TH DOWN':-4,'6TH DOWN':-5,'OCTAVE DOWN':-7}[h.iv];h.s.DIATONIC={a:iv==null?2:iv,b:0};}
  if(m==='OCTAVES')h.s.OCTAVER={d1:.8,u1:.6};delete h.mode;delete h.iv;return v;}

const DEF={id:'driftwood',name:'DRIFTWOOD electric guitar',short:'DRIFTWOOD',type:'instrument',version:'0.1',format:1,w:W,h:H,scale:1.75,   /* (opens at 175%: 1330 × 700 on the laptop's 1536 × 864) */
  blurb:'An electric guitar for writing songs: guitar, pedalboard (swell, comp, drive, a harmonizer, chorus / flanger / phaser / vibrato / tremolo), amp and cabinet, delay and reverb',
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
    if(!S.v)S.v=fresh(PRESETS[0][1]);else S.v=oldHarm(deep(fresh({}),S.v));delete S.v.g.ring;if(!PLAYS.includes(S.v.g.play))S.v.g.play='RING';
    const P=()=>{E.P=S.v;return S.v;};P();
    let dead=false,sleepT=0,quietSince=0,flashT=0,pedal=false,comp=false,koct=0,kvel=100,offMidi=null,strumDir=1,strumAt=0,strumN=0,pend=null,pendT=0,kinT=0;
    const down=new Set(),sus=new Set(),typed=new Set();
    const plugged=s=>M2.patch.at(uid,s).length>0;
    /* (PLAY and the amp's CHANNEL are switches in four steps on a knob) */
    const get=k=>k==='harm.val'?bsGet():k==='mod.modek'?MMODES.indexOf(S.v.mod.mode)/4:k==='g.playk'?PLAYS.indexOf(mode())/3:k==='amp.chan'?AMPK.indexOf(S.v.amp.model)/3:k==='g.strumk'?STRUMS.indexOf(S.v.g.strum)/2:k.split('.').reduce((o,p)=>o&&o[p],S.v),
      put=(k,v)=>{if(k==='harm.val'){bsPut(v);return;}if(k==='mod.modek'){S.v.mod.mode=MMODES[clamp(Math.round(v*4),0,4)];return;}if(k==='g.playk'){S.v.g.play=PLAYS[clamp(Math.round(v*3),0,3)];return;}if(k==='amp.chan'){S.v.amp.model=AMPK[clamp(Math.round(v*3),0,3)];return;}
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
      <div class="ped comp air" data-p="comp" title="AIR COMPRESSOR: evens and lengthens; its gauge shows how hard it squeezes">${acFace()}</div>
      <div class="ped drive sun" data-p="drive" title="SUNSET DRIVE: a warm overdrive; its tail lights glow while it is on">${sdFace()}</div>
      <div class="ped harm bs" data-p="harm" title="BARBERSHOP: a harmonizer; its window shows what VALUE turns">${bsFace()}</div>
      <div class="ped mod lh" data-p="mod" title="LIGHTHOUSE: chorus, flanger, phaser, vibrato, tremolo; its beam turns at the RATE">${lhFace()}</div>
      <div class="loop" title="PAD, DELAY and REVERB sit in the amp's effects loop: after its drive"><span>AMP LOOP →</span></div>
      <div class="ped pad cu" data-p="pad" title="CUSHION: a soft pad under the guitar; it holds what you play until the next chord">${cuFace()}</div>
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
    /* the AIR COMPRESSOR's gauge: the printed needle (its pointer from the hub to the lower left, its wedge of a counterweight to the
       upper right) painted out with the dial's own cream, each pixel taken from a light spot of the dial at the same distance from the
       hub a little round it, so the dial's speckle carries on */
    (async()=>{const G=AC.gauge;let bmp;try{const f=host.files||window.mixtapeFiles,u=await f.read(AC.src);bmp=await createImageBitmap(new Blob([u]));}catch(e){console.warn('DRIFTWOOD gauge',e);return;}
      if(dead)return;const R=G.r,n=2*R,cv=$('.acpatch');cv.width=cv.height=n;const g=cv.getContext('2d');g.drawImage(bmp,G.x-R,G.y-R,n,n,0,0,n,n);if(bmp.close)bmp.close();
      const im=g.getImageData(0,0,n,n),d=im.data,src=new Uint8ClampedArray(d),seg=(px,py,ax,ay,bx,by)=>{const vx=bx-ax,vy=by-ay,t=clamp(((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy),0,1);return Math.hypot(px-ax-t*vx,py-ay-t*vy);};
      const P1=[-22.4,19.7],P2=[13.6,-9.9],lum=q=>.3*src[q]+.59*src[q+1]+.11*src[q+2],inNeedle=(x,y)=>seg(x,y,0,0,P1[0]*1.06,P1[1]*1.06)<=4.6||seg(x,y,0,0,P2[0]*1.25,P2[1]*1.25)<=7.6||Math.hypot(x,y)<=7.5;
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=i+.5-R,y=j+.5-R,q=(j*n+i)*4,r=Math.hypot(x,y);
        if(r>R||!inNeedle(x,y)||src[q]-src[q+2]>55&&lum(q)>95){d[q+3]=0;continue;}   /* (the red zone's own colour is kept: only the needle's dark goes) */
        /* the middle (by brightness) of the dial's colours at this distance from the hub, round it (no ticks, no red zone, no needle) */
        const cand=[];for(let a=20;a<360;a+=10){const c=Math.cos(a*Math.PI/180),s=Math.sin(a*Math.PI/180),sx=x*c-y*s,sy=x*s+y*c,si=Math.round(sx+R-.5),sj=Math.round(sy+R-.5);
          if(si<0||sj<0||si>=n||sj>=n||inNeedle(sx,sy))continue;const sq=(sj*n+si)*4;if(lum(sq)>140&&src[sq]-src[sq+2]<45)cand.push(sq);}
        if(cand.length){cand.sort((a,b)=>lum(a)-lum(b));const sq=cand[cand.length>>1];d[q]=src[sq];d[q+1]=src[sq+1];d[q+2]=src[sq+2];d[q+3]=255;}
        else{d[q]=226;d[q+1]=214;d[q+2]=196;d[q+3]=255;}}
      g.putImageData(im,0,0);})();
    /* its live needle: how hard it squeezes (E.compGR, dB) over the dial, 0 at zero to 30 at the sweep's end, bouncing off its stop pins; a spring: up quickly, down
       slowly, a touch of overshoot. Drawn only while it moves (the compressor on and sounding, in sight); at rest it sits at zero */
    let gRaf=0,gA=AC.gauge.zero,gV=0;const gEl=$('.acn');
    function gaugeFrame(){gRaf=0;if(dead)return;const G=AC.gauge,gr=E.compGR(),tgt=G.zero+(G.full-G.zero)*clamp(gr/30,0,1);
      gV+=(tgt-gA)*(tgt>gA?.22:.06);gV*=.62;gA+=gV;if(gA>G.full+3){gA=G.full+3;gV=-gV*.3;}if(gA<G.zero-2){gA=G.zero-2;gV=-gV*.3;}gEl.style.transform=`rotate(${gA.toFixed(2)}deg)`;
      if(Math.abs(tgt-gA)>.05||Math.abs(gV)>.05||(E.awake&&S.v.comp.on&&inSight))gRaf=requestAnimationFrame(gaugeFrame);}
    const gaugeGo=()=>{if(!gRaf&&!dead)gRaf=requestAnimationFrame(gaugeFrame);};
    /* the SUNSET DRIVE's lettering brightened: its pixels lighter than the purple round them (lum over 80) lifted toward a pink-white,
       the lighter the more, so the letters read when the pedal is small; the purple between them left as it is */
    (async()=>{let bmp;try{const f=host.files||window.mixtapeFiles,u=await f.read(SD.src);bmp=await createImageBitmap(new Blob([u]));}catch(e){console.warn('DRIFTWOOD lettering',e);return;}
      if(dead)return;for(const cv of $$('.sdtxt')){const [x,y,w,h]=SD.text[+cv.dataset.i];cv.width=w;cv.height=h;const g=cv.getContext('2d');g.drawImage(bmp,x,y,w,h,0,0,w,h);
        const im=g.getImageData(0,0,w,h),d=im.data;for(let i=0;i<d.length;i+=4){const l=.3*d[i]+.59*d[i+1]+.11*d[i+2],t=clamp((l-80)/70,0,1)*.8;
          d[i]=d[i]+(255-d[i])*t;d[i+1]=d[i+1]+(232-d[i+1])*t;d[i+2]=d[i+2]+(246-d[i+2])*t;d[i+3]=t>0?255:0;}g.putImageData(im,0,0);}
      if(bmp.close)bmp.close();})();
    /* the SUNSET DRIVE's tail lights with the sound (Steve, 2026-11-25): while the drive is on they follow how loud DRIFTWOOD plays
       (E.level), faint as parking lights when nothing sounds and bright as brake lights with a full glow when it plays loud; up quickly,
       down slowly. Drawn only while it is on, sounding and in sight; off, they are dark */
    let tRaf=0,tLv=0;const tailEls=$$('.sdtail'),glowEls=$$('.sdglow');
    const tailsPaint=x=>{const on=S.v.drive.on;for(const e of tailEls)e.style.opacity=(on?.55*(1-x):1).toFixed(3);for(const e of glowEls)e.style.opacity=(on?.15+.85*x:0).toFixed(3);};
    function tailsFrame(){tRaf=0;if(dead)return;const tgt=S.v.drive.on&&E.awake?clamp(Math.sqrt(E.level())*2.2,0,1):0;tLv+=(tgt-tLv)*(tgt>tLv?.5:.08);tailsPaint(tLv);
      if(tLv>.004||(E.awake&&S.v.drive.on&&inSight))tRaf=requestAnimationFrame(tailsFrame);else{tLv=0;tailsPaint(0);}}
    const tailsGo=()=>{if(!tRaf&&!dead)tRaf=requestAnimationFrame(tailsFrame);};tailsPaint(0);
    /* the street lamps: brighter the higher LEVEL, while the drive is on (no animation: set when LEVEL or the switch moves) */
    const lampsPaint=()=>{const v=S.v.drive,o=v.on?clamp(.15+.85*(v.lvl==null?.5:v.lvl),0,1):0;for(const e of $$('.sdlamp'))e.style.opacity=o.toFixed(2);};
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
    const chipText={'mod.mode':()=>S.v.mod.mode,'delay.div':()=>S.v.delay.div};
    function paint(){const v=S.v,vw=S.view;lampsPaint();m.classList.toggle('nog',!vw.g);m.classList.toggle('noa',!vw.a);m.classList.toggle('nop',!vw.p);
      for(const c of $$('[data-k]')){const x=clamp(+get(c.dataset.k)||0,0,1),a=c.dataset.k==='mod.modek'?LH.ticks[MMODES.indexOf(v.mod.mode)]:-135+270*x;c.style.transform=`rotate(${a-(+c.dataset.off||0)}deg)`;}   /* (a photo's knob cap: from where its pointer was photographed) */
      for(const p of $$('[data-p]'))p.classList.toggle('on',!!v[p.dataset.p].on);
      for(const c of $$('[data-c]'))c.textContent=chipText[c.dataset.c]();
      bsDraw();bspRender();lhGo();cuGo();if(lhMode!==v.mod.mode+(v.mod.on?'*':''))lhText();
      $('[data-kw="delay.time"]').classList.toggle('off',v.delay.div!=='FREE');const tg=$('.tgl');if(tg)tg.dataset.pos=v.g.pick;   /* (the pickup lever thrown to its place) */
      for(const b of $$('[data-b]')){const d=b.dataset.b;let on=false;
        if(d.startsWith('pick.'))on=v.g.pick===d.slice(5);else if(d.startsWith('strum.'))on=v.g.strum===d.slice(6);else if(d.startsWith('amp.'))on=v.amp.model===d.slice(4);
        else if(d==='cab')on=!!v.amp.cab;else if(d==='keys')on=comp;else if(d.startsWith('pad.'))on=v.pad.ch.includes(d.slice(4));else if(d.startsWith('swm.'))on=v.swell.mode===d.slice(4);else if(d==='swell.wheel')on=!!v.swell.wheel;else if(d.startsWith('view.'))on=!!vw[d.slice(5)];b.classList.toggle('on',on);}
      show();}
    const kinLamp=()=>{$('[data-l="kin"]').classList.toggle('dim',!(plugged('keys')||M2.midi.inputs.length>0));};
    const kinFlash=()=>{m.classList.add('flash');clearTimeout(kinT);kinT=setTimeout(()=>m.classList.remove('flash'),90);};

    /* ---- awake / asleep (the PAD's engine too) ---- */
    function watch(){clearTimeout(sleepT);if(dead)return;m.classList.toggle('awake',E.awake);   /* (the amp's jewel light: lit while it sounds) */
      if(E.awake){const busy=E.voices.length||E.level()>1e-4||E.inLevel()>1e-4||pend||(padE&&(padE.voices.length||padE.level()>1e-4));if(busy)quietSince=0;else if(!quietSince)quietSince=performance.now();
        if(quietSince&&performance.now()-quietSince>5000){E.sleep();if(padE)padE.sleep();quietSince=0;host.engine.busy(uid,false);}}
      else if(plugged('in')&&E.inLevel()>1e-4)awake();
      sleepT=setTimeout(watch,E.awake?400:plugged('in')?150:1000);}
    const awake=()=>{const was=E.awake;E.wake();m.classList.add('awake');if(!was){quietSince=0;host.engine.busy(uid,true);}seaGo();gaugeGo();tailsGo();bsGo();lhGo();cuGo();};

    /* ---- the CUSHION (the PAD pedal): HALO's engine (as HORIZON's PAD), made the first time the pedal is switched on, its sound into
       the amp's effects loop (so DELAY and REVERB take it too, its own hall kept small). Any two of its six sounds at once (both at
       full), AIR its breath on top. It HOLDS what you play until the next chord (Steve, 2026-11-25: a
       plucked key let go at once only blipped it): the notes begun within a quarter second of each other, or while other keys (or the
       sustain pedal) are down, are one chord; the next chord lets go of the notes it does not share and keeps the ones it does, sounding
       on unbroken. Its loudness follows the guitar's own (Steve: held on its own it never stopped): up with each pluck, down as the strings ring
       away (a firm chord brings it up full, a soft note less); with the guitar all but silent for 2 s it lets go. A tap of its
       footswitch while it holds a chord lets the chord go; a tap with nothing held switches it off ---- */
    let padE=null,padG=null,folT=0,folQ=0,folG=0;const padHeld=new Map(),padFol=ctx.createGain();padFol.gain.value=0;padFol.connect(E.padBus);
    function folStep(){const on=!dead&&S.v.pad.on&&padHeld.size>0,l=on?E.gLevel():0,want=Math.min(1.2,Math.pow(l/.12,.7)),t=ctx.currentTime;   /* (the guitar's loudness, as the pad's) */
      padFol.gain.setTargetAtTime(want,t,want>folG?.03:.3);folG=want;if(!on){clearInterval(folT);folT=0;folQ=0;return;}
      if(l<.004){folQ+=40;if(folQ>2000){folQ=0;padLetGo();}}else folQ=0;}
    const folGo=()=>{if(!folT&&!dead)folT=setInterval(folStep,40);};
    function padApply(){const pd=S.v.pad,H=M2.halo;
      if(!pd.on){padLetGo();return;}
      if(!H){host.toast('DRIFTWOOD: the CUSHION needs HALO\'s file (Devices\halo.js)');return;}
      if(!padE)padE=H.Engine(ctx,padFol);const ch=pd.ch.slice(0,2),lv={};   /* (two sounds: both at full, Steve's pick) */
      const was=padE.P&&padE.P.ch.join();padE.P=Object.assign({},H.DEFAULTS,{ch,lv,vol:pd.level*PADV,air:pd.air||0,swell:.15+.75*pd.swell,motion:'breathe',space:.2,tone:.45,width:.7});padE.apply(clock);
      for(const c of ch)H.tables(ctx,c);if(pd.air>.01)H.tables(ctx,'air');for(const v of padE.voices)if(was!==ch.join())v.morph();else v.update();}
    function padOn(n,vel){if(!S.v.pad.on||!padE)return;
      if(!padG&&!pedal&&![...down].some(k=>k!==n))padG={notes:new Set(),t:setTimeout(padSettle,250)};if(padG)padG.notes.add(n);
      const old=padHeld.get(n);if(old&&!old.released)return;padHeld.set(n,padE.noteOn(n,vel));cuGo();folGo();}   /* (a note it already holds sounds on, unbroken) */
    function padSettle(){const g=padG;padG=null;if(!g)return;const t=ctx.currentTime;for(const [m,v] of [...padHeld])if(!g.notes.has(m)){v.release(t);padHeld.delete(m);}}
    function padLetGo(){if(padG){clearTimeout(padG.t);padG=null;}const t=ctx.currentTime;for(const v of padHeld.values())v.release(t);padHeld.clear();}

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

    /* ---- BARBERSHOP: its settings (a style's own, in its panel), the one VALUE turns on the pedal (MAIN), its presets, its key ---- */
    const hs=()=>S.v.harm,bsMain=()=>{const st=hs().style;return (BST[st]||BST.DIATONIC).pages.find(p=>p[0]===MAIN[st]);};
    const bsList=pg=>pg[2]==='iv'?IVL:Array.isArray(pg[2])?pg[2]:null;
    const bsRaw=pg=>bsv(hs(),hs().style,pg[0]);
    const bsSetS=(k,val)=>{const h=hs();h.s=h.s||{};(h.s[h.style]=h.s[h.style]||{})[k]=val;h.ed=true;};
    function bsGet(){const pg=bsMain(),L=bsList(pg),r=bsRaw(pg);return L?Math.max(0,L.indexOf(r))/(L.length-1):+r||0;}
    function bsPut(x){const pg=bsMain(),L=bsList(pg);bsSetS(pg[0],L?L[clamp(Math.round(x*(L.length-1)),0,L.length-1)]:x);}
    const bsStep=()=>{const L=bsList(bsMain());return L?1/(L.length-1):.05;};
    const bsText=pg=>{const r=bsRaw(pg);return pg[2]==='iv'?ivName(r):pg[2]==='c'?bsFmt(pg[0],r):String(r);};
    /* its presets: the name shown (a * once changed; MY <STYLE> when the style is not the preset's own), one picked */
    const bsLabel=()=>{const h=hs(),p=BSP.find(x=>x[0]===h.pre);return p&&p[1].style===h.style?p[0]+(h.ed?' *':''):'My '+h.style.toLowerCase();};
    const bsPreIdx=()=>Math.max(0,BSP.findIndex(p=>p[0]===hs().pre));
    function bsPreset(i){i=(i+BSP.length)%BSP.length;const h=hs(),[name,p]=BSP[i];h.pre=name;h.ed=false;h.style=p.style;h.mix=p.mix;h.s=h.s||{};h.s[p.style]=JSON.parse(JSON.stringify(p.s[p.style]||{}));
      if(p.scale){h.scale=p.scale;h.auto=false;}S.edited=true;apply();paint();host.changed('switch');bsShow('PRESET '+(i+1)+' OF '+BSP.length,name.toUpperCase());flash('BARBERSHOP · '+name.toUpperCase(),BST[p.style].tip);}
    function bsStyle(st){const h=hs();h.style=st;S.edited=true;apply();paint();host.changed('switch');bsShow('STYLE',st);flash('BARBERSHOP · '+st,BST[st].tip);}
    /* the key the harmonies use: AUTO's guess once it has heard 6 notes (until then KEY and SCALE as set), else as set */
    let autoK=null,learn=null;const heard=[];
    const bsKey=()=>{const h=hs();return h.auto&&autoK?autoK:{key:h.key,scale:h.scale};};
    /* AUTO: the last 24 notes played (louder and later ones weigh more) matched to a key; it moves only when another key fits clearly
       better, so a passing note does not swing it */
    function hear(n,v){heard.push({pc:n%12,w:.5+v/127});if(heard.length>24)heard.shift();
      if(learn){learn.notes.push(n%12);bsDraw();bspRender();if(learn.notes.length>=12)learnEnd();}
      if(!hs().auto||heard.length<6)return;const hh=new Array(12).fill(0);heard.forEach((x,i)=>hh[x.pc]+=x.w*(.5+.5*i/heard.length));
      const g=guessKey(hh);if(!autoK||(g.key!==autoK.key||g.scale!==autoK.scale)&&g.r>keyFit(hh,autoK.key,autoK.scale)+.06){autoK=g;bsDraw();bspRender();}}
    /* LEARN (KEY held): the next 12 notes, or what is played in 8 s, give the key that fits them best, kept as KEY and SCALE */
    function learnStart(){if(learn)clearTimeout(learn.t);learn={notes:[],t:setTimeout(learnEnd,8000)};bsDraw();bspRender();flash('BARBERSHOP · LEARN','PLAY THE SONG\'S SCALE OR CHORDS');}
    function learnEnd(){if(!learn)return;clearTimeout(learn.t);const ns=learn.notes;learn=null;
      if(ns.length<4){bsShow('LEARN','NOT ENOUGH NOTES');bspRender();return flash('BARBERSHOP · LEARN','NOT ENOUGH NOTES: HOLD KEY, THEN PLAY');}
      const hh=new Array(12).fill(0);for(const p of ns)hh[p]++;const g=guessKey(hh),h=hs();h.auto=false;h.key=g.key;h.scale=g.scale;
      S.edited=true;apply();paint();host.changed('switch');bsShow('LEARNED',NM[g.key]+' '+g.scale);flash('BARBERSHOP · LEARNED',NM[g.key]+' '+g.scale);}
    /* the harmony voices of one note: {n, g gain, pan, slot (the singer who glows), d delay, det cents, rev / one (echoes)} */
    function bsVoices(n){const h=hs(),st=h.style,q=k=>bsv(h,st,k),K=bsKey(),out=[],tm=st==='DIATONIC'||st==='QUARTET'?q('time'):0,hum=i=>tm*(.025+.055*Math.random())*(1+.3*i);
      if(st==='DIATONIC'){const bal=q('bal'),w=q('wide');[[q('a'),Math.min(1,2*(1-bal)),-w*.7,0],[q('b'),Math.min(1,2*bal),w*.7,2]].forEach(([s,g,p,slot],i)=>{if(s&&g>.01)out.push({n:harmIn(n,K.key,K.scale,s),g,pan:p,slot,d:hum(i)});});}
      else if(st==='QUARTET'){const vc=(VOICINGS.find(x=>x[0]===q('voicing'))||VOICINGS[0])[1],w=q('wide');vc.forEach((s,i)=>out.push({n:harmIn(n,K.key,K.scale,s),g:.72,pan:[-.75,.05,.75][i]*w,slot:i,d:hum(i)}));}
      else if(st==='OCTAVER')[[-24,q('d2'),-.15,0],[-12,q('d1'),.1,1],[12,q('u1'),.25,2]].forEach(([d,g,p,slot])=>{if(g>.02)out.push({n:n+d,g:g*1.15,pan:p,slot,d:0});});
      else if(st==='MICRO'){const c=2+28*q('det'),dl=.008+.072*q('dly'),w=q('wide');out.push({n,g:.8,pan:-w*.85,slot:0,d:dl,det:c},{n,g:.8,pan:w*.85,slot:2,d:dl*1.55,det:-c*.9});}
      else if(st==='CRYSTALS'){const up={OCTAVE:[12],'OCTAVE + 5TH':[12,19],'5TH':[7]}[q('pitch')]||[12],gap=.12+.48*q('gap'),reps=1+Math.round(q('rep')*6),rev=q('dir')!=='FORWARDS';
        for(let i=0;i<reps;i++)out.push({n:n+up[i%up.length],g:.95*Math.pow(.7,i),pan:i%2?.6:-.6,slot:i%3,d:(rev?.15:0)+gap*(rev?i:i+1),rev,one:!rev});}
      return out;}
    /* ---- its window (Steve, 2026-11-25: gold lettering, then small white lettering, too hard to read at the desk's own size): off, just
       the picture; on, the picture dimmed nearly to black and big white lettering on it, as on a harmonizer's screen: the preset's name
       (on two lines if it needs them; a * once changed) and the key; for 3 s after a button or VALUE moves, what changed; LISTENING
       while it learns; FROZEN while frozen. A click opens the panel ---- */
    const scr=$('.bsscr'),sg=scr.getContext('2d');let bsEdit=0,bsT=0,bsMsg=['',''];
    const bsShow=(a,b)=>{bsMsg=[a||'',b||''];bsEdit=a?performance.now()+3000:0;bsDraw();clearTimeout(bsT);if(a)bsT=setTimeout(()=>{bsEdit=0;bsDraw();},3100);};
    const fnt=(s,wt)=>`${wt||600} ${s}px Bahnschrift,'Segoe UI',Arial,sans-serif`;
    function txt(t,x,y,size,maxW,col,al,wt){sg.font=fnt(size,wt);const w=sg.measureText(t).width;if(w>maxW){size*=maxW/w;sg.font=fnt(size,wt);}
      sg.textAlign=al||'left';sg.shadowColor='rgba(0,0,0,.95)';sg.shadowBlur=size*.22;sg.fillStyle=col||'#fff';sg.fillText(t,x,y);sg.fillText(t,x,y);sg.shadowBlur=0;}   /* (twice: a dark halo, so it reads over the picture) */
    /* words in at most two lines as big as they fit (size: the largest wanted), centred on cy */
    function big(t,cy,size,maxW,wt){const W=t.split(' ');let lines=[t];
      for(;size>30;size*=.92){sg.font=fnt(size,wt);if(sg.measureText(t).width<=maxW){lines=[t];break;}
        let best=null;for(let i=1;i<W.length;i++){const a=W.slice(0,i).join(' '),b=W.slice(i).join(' '),m=Math.max(sg.measureText(a).width,sg.measureText(b).width);if(m<=maxW&&(!best||m<best.m))best={a,b,m};}
        if(best){lines=[best.a,best.b];break;}}
      const lh=size*1.02;lines.forEach((l,i)=>txt(l,scr.width/2,cy+(i-(lines.length-1)/2)*lh+size*.36,size,maxW,'#fff','center',wt));}
    const bsSum=()=>{const h=hs(),st=h.style,q=k=>bsv(h,st,k);return st==='DIATONIC'?[q('a'),q('b')].filter(Boolean).map(ivName).join(' + ')||'NO VOICES':st==='QUARTET'?q('voicing')+' VOICING':
      st==='OCTAVER'?[['2 DOWN','d2'],['DOWN','d1'],['UP','u1']].filter(x=>q(x[1])>.02).map(x=>x[0]).join(' + ')||'NO OCTAVES':st==='MICRO'?bsFmt('det',q('det'))+' APART':q('pitch')+' · '+q('dir');};
    function bsDraw(){const W2=scr.width,H2=scr.height,h=hs(),MW=W2-60;sg.clearRect(0,0,W2,H2);sg.textBaseline='alphabetic';
      if(!h.on&&!learn&&!(bsEdit>performance.now()))return;   /* (off: the picture as it is) */
      sg.fillStyle='rgba(0,0,0,.66)';sg.fillRect(0,0,W2,H2);   /* (see-through enough that the quartet shows behind: Steve) */
      if(learn){big('LISTENING',H2*.36,150,MW,700);txt(learn.notes.length+' / 12',W2/2,H2*.82,110,MW,'#fff','center',600);return;}
      if(bsEdit>performance.now()){txt(bsMsg[0],W2/2,H2*.24,86,MW,'#CFCFCF','center',600);big(bsMsg[1],H2*.62,150,MW,700);return;}
      const K=bsKey();big(bsLabel().toUpperCase(),H2*.38,150,MW,700);
      txt(h.auto&&!autoK?'AUTO KEY':(h.auto?'AUTO · ':'')+NM[K.key]+' '+K.scale,W2/2,H2*.88,96,MW,'#CFCFCF','center',600);
      if(E.frozen()){sg.fillStyle='#fff';const w=250,x=W2-w-14,y=12;sg.fillRect(x,y,w,72);txt('FROZEN',x+w/2,y+58,60,w-14,'#000','center',700);}}
    /* ---- the pole (its stripes drawn and moved up, as a turning pole's seem to rise: slowly while it is on, faster the louder it plays),
       the singers (each glows while a voice of theirs sounds, fading as it rings away) and the light (blinking while FROZEN); drawn only
       while it is on, awake and in sight ---- */
    const pole=$('.bspole'),pc2=pole.getContext('2d'),sings=$$('.bssing'),bsLed=$('.bsled');let bRaf=0,bLast=0,bPh=0,bLv=0;const sLv=[0,0,0];
    function poleDraw(){const w=pole.width,h=pole.height,P=120,band=P*.27,sl=w*.8,o=(bPh%1)*P;pc2.fillStyle='#EFE7D6';pc2.fillRect(0,0,w,h);
      for(let y=-P*2-sl;y<h+P*2;y+=P)[['#B3262C',0],['#24489A',.5]].forEach(([c,j])=>{const yy=y-o+j*P;pc2.fillStyle=c;pc2.beginPath();pc2.moveTo(0,yy+sl);pc2.lineTo(w,yy);pc2.lineTo(w,yy+band);pc2.lineTo(0,yy+sl+band);pc2.fill();});
      const sh=pc2.createLinearGradient(0,0,w,0);sh.addColorStop(0,'rgba(0,0,0,.5)');sh.addColorStop(.3,'rgba(255,255,255,.3)');sh.addColorStop(.45,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(0,0,0,.55)');pc2.fillStyle=sh;pc2.fillRect(0,0,w,h);}
    function bsFrame(now){bRaf=0;if(dead)return;const run=hs().on&&E.awake&&inSight;
      if(!bLast||now-bLast>=33){const dt=bLast?Math.min(.1,(now-bLast)/1000):1/30;bLast=now;const tgt=run?clamp(Math.sqrt(E.level())*2.2,0,1):0;bLv+=(tgt-bLv)*(tgt>bLv?.4:.06);
        if(run){bPh+=dt*(.25+2.2*bLv);poleDraw();}
        const t=ctx.currentTime,act=[0,0,0],fz=E.frozen();for(const v of E.voices)if(v.harm&&v.slot>=0&&v.slot<3&&t>=v.t0)act[v.slot]=Math.max(act[v.slot],(v.released?.4:1)*Math.exp(-(t-v.t0)/(v.oneShot?.8:2.5)));
        sings.forEach((e,i)=>{const a=run?Math.max(act[i],fz?.45:0):0;sLv[i]+=(a-sLv[i])*(a>sLv[i]?.5:.1);e.style.opacity=sLv[i].toFixed(3);});
        bsLed.classList.toggle('blink',!!fz&&Math.floor(now/400)%2===0);}
      if(run||sLv.some(x=>x>.01))bRaf=requestAnimationFrame(bsFrame);else{bLast=0;for(let i=0;i<3;i++){sLv[i]=0;sings[i].style.opacity=0;}bsLed.classList.remove('blink');}}
    const bsGo=()=>{if(!bRaf&&!dead)bRaf=requestAnimationFrame(bsFrame);};poleDraw();
    /* ---- the LIGHTHOUSE's beam: two beams back to back turning round the lamp once a wobble (RATE), seen from the side: long and bright
       pointing sideways, short with a flash at the lamp when one faces you, a little fainter pointing away; brighter with DEPTH. Turned only while
       it is on, awake and in sight (asleep it stays where it stopped); cleared when it is switched off ---- */
    const beam=$('.lhbeam'),bg2=beam.getContext('2d'),BX=(LH.lamp[0]-LH.cut[0])/2,BY=(LH.lamp[1]-LH.cut[1])/2;let lRaf=0,lLast=0,lPh=.3,lDrawn=false;
    function beamDraw(){const w=beam.width,h=beam.height,mo=S.v.mod,B=.45+.55*mo.depth;bg2.clearRect(0,0,w,h);lDrawn=true;bg2.globalCompositeOperation='lighter';
      for(const k of [0,1]){const f=lPh*Math.PI*2+k*Math.PI,s=Math.cos(f),z=Math.sin(f),len=w*1.05*Math.abs(s),a=B*(.15+.6*Math.abs(s))*(.8+.2*z);
        if(len>3){const ex=BX+Math.sign(s)*len,sp=4+26*Math.abs(s),g=bg2.createLinearGradient(BX,0,ex,0);g.addColorStop(0,`rgba(255,244,205,${a})`);g.addColorStop(.55,`rgba(255,232,170,${a*.4})`);g.addColorStop(1,'rgba(255,225,160,0)');
          bg2.fillStyle=g;bg2.beginPath();bg2.moveTo(BX,BY-3);bg2.lineTo(ex,BY-sp);bg2.lineTo(ex,BY+sp);bg2.lineTo(BX,BY+3);bg2.closePath();bg2.fill();}
        if(z>0){const fl=Math.pow(z,4),r=10+38*fl,g=bg2.createRadialGradient(BX,BY,0,BX,BY,r);g.addColorStop(0,`rgba(255,250,225,${B*(.3+.7*fl)})`);g.addColorStop(.4,`rgba(255,226,150,${B*.45*fl})`);g.addColorStop(1,'rgba(255,210,130,0)');
          bg2.fillStyle=g;bg2.fillRect(BX-r,BY-r,2*r,2*r);}}
      bg2.globalCompositeOperation='source-over';}
    function lhFrame(now){lRaf=0;if(dead)return;const on=S.v.mod.on,run=on&&E.awake&&inSight;
      if(!on){if(lDrawn){bg2.clearRect(0,0,beam.width,beam.height);lDrawn=false;}lLast=0;return;}
      if(!lDrawn&&inSight)beamDraw();
      if(!run){lLast=0;return;}
      const dt=lLast?Math.min(.1,(now-lLast)/1000):0;lLast=now;lPh=(lPh+dt*rateOf(S.v.mod.rate))%1;beamDraw();lRaf=requestAnimationFrame(lhFrame);}
    const lhGo=()=>{if(!lRaf&&!dead)lRaf=requestAnimationFrame(lhFrame);};
    /* the CUSHION's swing (see CU): sways while it holds a chord, a slow swing back and forth, settling as it lets go. Made from the
       picture's bytes: the swing cut out by its outline, and the porch with the swing filled in row by row from either side of it */
    const cuCv=$('.cuswing'),cg=cuCv.getContext('2d');let cuPlate=null,cuSw=null,cuRaf=0,cuLast=0,cuPh=0,cuAmp=0,cuShown=false;
    (async()=>{let bmp;try{const f=host.files||window.mixtapeFiles,u=await f.read(CU.src);bmp=await createImageBitmap(new Blob([u]));}catch(e){console.warn('DRIFTWOOD CUSHION swing',e);return;}if(dead)return;
      const [bx,by,bw,bh]=CU.box,mk=()=>{const c=document.createElement('canvas');c.width=bw;c.height=bh;return c;},path=g=>{g.beginPath();for(const p of CU.swing){p.forEach(([x,y],i)=>i?g.lineTo(x-bx,y-by):g.moveTo(x-bx,y-by));g.closePath();}};
      const sw=mk(),sg=sw.getContext('2d');path(sg);sg.clip();sg.drawImage(bmp,bx,by,bw,bh,0,0,bw,bh);
      const m=mk(),mg=m.getContext('2d');path(mg);mg.fill();const M=mg.getImageData(0,0,bw,bh).data;
      const pl=mk(),pg=pl.getContext('2d');pg.drawImage(bmp,bx,by,bw,bh,0,0,bw,bh);const im=pg.getImageData(0,0,bw,bh),D=im.data,inn=(x,y)=>M[(y*bw+x)*4+3]>0;
      for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){if(!inn(x,y))continue;let e=x;while(e<bw&&inn(e,y))e++;   /* a run inside the outline: a blend of the porch just left and just right of it */
        const L=Math.max(0,x-3),R=Math.min(bw-1,e+2);for(let i=x;i<e;i++){const f=(i-x+1)/(e-x+1);for(let k=0;k<3;k++)D[(y*bw+i)*4+k]=D[(y*bw+L)*4+k]*(1-f)+D[(y*bw+R)*4+k]*f;}x=e;}
      pg.putImageData(im,0,0);cuPlate=pl;cuSw=sw;cuGo();})();
    function cuDraw(){const [bx,by,bw,bh]=CU.box,[px,py]=CU.pivot,a=Math.sin(cuPh*Math.PI*2)*cuAmp*.016;cg.clearRect(0,0,bw,bh);cg.drawImage(cuPlate,0,0);
      cg.save();cg.translate(px-bx,py-by);cg.rotate(a);cg.translate(bx-px,by-py);cg.drawImage(cuSw,0,0);cg.restore();cuShown=true;}
    function cuFrame(now){cuRaf=0;if(dead||!cuPlate)return;const want=S.v.pad.on&&padHeld.size>0&&inSight?1:0,dt=cuLast?Math.min(.1,(now-cuLast)/1000):0;cuLast=now;
      cuAmp+=(want-cuAmp)*Math.min(1,dt*(want?.7:.5));cuPh=(cuPh+dt/3.4)%1;   /* (one swing there and back in 3.4 s) */
      if(cuAmp<.01&&!want){cuAmp=0;cuLast=0;if(cuShown){cg.clearRect(0,0,cuCv.width,cuCv.height);cuShown=false;}return;}
      if(inSight)cuDraw();cuRaf=requestAnimationFrame(cuFrame);}
    const cuGo=()=>{if(!cuRaf&&!dead)cuRaf=requestAnimationFrame(cuFrame);};
    {const g=$('.cutxt').getContext('2d'),[ox,oy]=CU.wbox;g.font='700 43px Bahnschrift,"Segoe UI",Arial';g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
      for(const [w,x,y] of CU.words){g.lineWidth=9;g.strokeStyle='rgba(22,12,8,.88)';g.strokeText(w,x-ox,y-oy);g.fillStyle='#F2523F';g.fillText(w,x-ox,y-oy);}}
    /* the LIGHTHOUSE's lettering, written large (see LH.words): drawn once the picture's bytes are read, again when the sound changes */
    const lhT=$('.lhtxt'),lg=lhT.getContext('2d');let lhBmp=null,lhMode='';
    function lhText(){if(!lhBmp)return;const [ox,oy,W,H]=LH.txt,mo=S.v.mod;lhMode=mo.mode+(mo.on?'*':'');lg.clearRect(0,0,W,H);
      for(const [w0,x,y,w,h,dy,sz] of LH.words){const rx=x-w/2-5,ry=y-h/2-5,rw=w+10,rh=h+10;lg.save();lg.filter='blur(1.2px)';lg.drawImage(lhBmp,rx,ry+dy,rw,rh,rx-ox,ry-oy,rw,rh);lg.restore();
        const word=w0||mo.mode,lit=!w0&&mo.on;lg.font=`${sz>20?700:600} ${sz}px Bahnschrift,'Segoe UI',Arial`;lg.textAlign='center';lg.textBaseline='middle';lg.lineJoin='round';
        if(sz>20){lg.lineWidth=7;lg.strokeStyle='rgba(6,12,30,.8)';lg.strokeText(word,x-ox,y-oy+1);}
        lg.shadowColor=lit?'rgba(255,200,90,.9)':'transparent';lg.shadowBlur=lit?14:0;lg.fillStyle=lit?'#FFF3CF':'#EEDDB0';lg.fillText(word,x-ox,y-oy+1);lg.shadowBlur=0;}}
    (async()=>{try{const f=host.files||window.mixtapeFiles,u=await f.read(LH.src);lhBmp=await createImageBitmap(new Blob([u]));}catch(e){console.warn('DRIFTWOOD LIGHTHOUSE lettering',e);return;}if(!dead)lhText();})();
    /* ---- its panel (Steve, 2026-11-25: the window is too small for all it can do; then: half as wide, KEY and SCALE as drop-downs, not
       brown and gold): opened by a click on the window or KEY, laid over
       DRIFTWOOD, see-through. Its presets, ON, FREEZE; the five styles; the style's every setting as a slider (or buttons for a choice);
       KEY (AUTO, the twelve, LEARN), SCALE, MIX, LEVEL. Built again whenever something changes, except while a slider is being dragged
       (only its value's words change then); closed with ×, Esc, or the window again ---- */
    const bsp=document.createElement('div');bsp.className='bsp';m.appendChild(bsp);let bspOpen=false,bspDrag=false;
    const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
    function bspRow(st,pg){const [k,name,kind]=pg,val=bsv(hs(),st,k),L=bsList(pg);
      if(Array.isArray(kind))return `<div class="bspr"><label>${name}</label><span class="seg">${kind.map(x=>`<span class="bspc${x===val?' on':''}" data-a="s|${k}|${esc(x)}">${x}</span>`).join('')}</span></div>`;
      return `<div class="bspr"><label>${name}</label><input type="range" data-q="s|${k}" min="0" max="${L?L.length-1:1}" step="${L?1:.01}" value="${L?L.indexOf(val):val}"><span class="v">${esc(bsText(pg))}</span></div>`;}
    function bspRender(){if(!bspOpen||bspDrag)return;const h=hs(),st=h.style,B=BST[st],mp=B.pages.find(p=>p[0]===MAIN[st]);
      const lv=h.lvl==null?.5:h.lvl;
      bsp.innerHTML=`<div class="bsph"><b class="bspt"><i></i>BARBERSHOP</b>`+
        `<span class="bspb${h.on?' on':''}" data-a="on" title="the pedal on or off (its footswitch)">${h.on?'ON':'OFF'}</span><span class="bspb fz${E.frozen()?' on':''}" data-a="freeze" title="hold what sounds now as a still chord (also: hold the footswitch); again lets it go">FREEZE</span><span class="bspx" data-a="close" title="close (Esc)">×</span></div>`+
        `<div class="bsph"><span class="bspb" data-a="pre|-1" title="the BARBERSHOP preset before">‹</span><select class="bspsel" data-q="pre" title="BARBERSHOP's presets">${bspPresets()}</select><span class="bspb" data-a="pre|1" title="the next BARBERSHOP preset">›</span></div>`+
        `<span class="bsph2">KEY AND BLEND</span>`+
        `<div class="bspr"><label>KEY</label><select data-q="key" title="the song's key (AUTO follows what you play)"><option value="AUTO"${h.auto?' selected':''}>AUTO${autoK?' · '+NM[autoK.key]+' '+autoK.scale:' · LISTENING'}</option>${NM.map(x=>`<option${!h.auto&&NM[h.key]===x?' selected':''}>${x}</option>`).join('')}</select>`+
          `<span class="bspb${learn?' on':''}" data-a="learn" title="play the song's scale or chords: the next 12 notes set the key (also: hold KEY on the pedal)">${learn?'LISTENING '+learn.notes.length+'/12':'LEARN'}</span></div>`+
        `<div class="bspr"><label>SCALE</label><select data-q="scale"${h.auto?' disabled title="AUTO finds major or minor itself"':''}>${SCALES.map(([x])=>`<option${x===h.scale?' selected':''}>${x}</option>`).join('')}</select></div>`+
        `<div class="bspr" title="your guitar / the harmonies"><label>MIX</label><input type="range" data-q="mix" min="0" max="1" step=".01" value="${h.mix}"><span class="v">${esc(mixW(h.mix))}</span></div>`+
        `<div class="bspr"><label>LEVEL</label><input type="range" data-q="lvl" min="0" max="1" step=".01" value="${lv}"><span class="v">${esc(KN['harm.lvl'][1](lv))}</span></div>`+
        `<span class="bsph2">THE VOICES</span><div class="bsps">${BSTY.map(x=>`<span class="bspc${x===st?' on':''}" data-a="style|${x}" title="${BST[x].tip.toLowerCase()}">${x}</span>`).join('')}</div>`+
        `<i class="bsptip">${B.tip.toLowerCase()} · VALUE on the pedal turns ${mp[1].toLowerCase()}</i>${B.pages.map(pg=>bspRow(st,pg)).join('')}`+
        (st==='QUARTET'?`<i class="bsptip">${VOICETIP[bsv(h,st,'voicing')].toLowerCase()}</i>`:'')+
        '';}
    /* (the presets' drop-down: grouped by style; the one in use marked * once changed; MY <STYLE> on top while the style is not a preset's) */
    function bspPresets(){const h=hs(),lab=bsLabel(),mine=lab.startsWith('My ');return (mine?`<option value="-1" selected>${esc(lab.toUpperCase())}</option>`:'')+
      BSTY.map(st=>`<optgroup label="${st}">`+BSP.map((p,i)=>p[1].style!==st?'':`<option value="${i}"${!mine&&p[0]===h.pre?' selected':''}>${esc(p[0].toUpperCase())}${!mine&&p[0]===h.pre&&h.ed?' *':''}</option>`).join('')+'</optgroup>').join('');}
    const mixW=v=>v<.02?'GUITAR ONLY':v>.98?'HARMONY ONLY':Math.round(Math.min(1,2*(1-v))*100)+' / '+Math.round(Math.min(1,2*v)*100);   /* (the panel's MIX: guitar / harmony, %) */
    const bspKey=e=>{if(e.key==='Escape'&&bspOpen){e.preventDefault();bspShow(false);}};
    function bspShow(on){bspOpen=!!on;bsp.classList.toggle('open',bspOpen);if(bspOpen){bspRender();addEventListener('keydown',bspKey);}else{bsp.innerHTML='';removeEventListener('keydown',bspKey);}}
    const bspUp=()=>{if(bspDrag){bspDrag=false;bspRender();}};addEventListener('pointerup',bspUp);
    /* (its own clicks, drags and scrolls stay in it: the desk does not pick DRIFTWOOD up, nor zoom) */
    bsp.addEventListener('pointerdown',e=>{e.stopPropagation();if(e.target.type==='range')bspDrag=true;});
    bsp.addEventListener('dblclick',e=>e.stopPropagation());
    bsp.addEventListener('wheel',e=>{e.stopPropagation();const t=e.target;if(t.type!=='range')return;e.preventDefault();const s=+t.step;t.value=clamp(+t.value-Math.sign(e.deltaY)*(s<1?.02:1),+t.min,+t.max);t.dispatchEvent(new Event('input',{bubbles:true}));},{passive:false});
    bsp.addEventListener('input',e=>{const t=e.target,p=t.dataset.q;if(!p)return;const h=hs();let words='';
      if(p==='pre'){if(+t.value>=0)bsPreset(+t.value);return;}
      if(p==='scale')h.scale=t.value;else if(p==='key'){h.auto=t.value==='AUTO';if(!h.auto)h.key=NM.indexOf(t.value);}
      else if(p==='mix'||p==='lvl'){h[p]=+t.value;words=p==='mix'?mixW(h.mix):KN['harm.lvl'][1](h.lvl);}
      else{const k=p.split('|')[1],pg=BST[h.style].pages.find(x=>x[0]===k),L=bsList(pg);bsSetS(k,L?L[+t.value]:+t.value);words=bsText(pg);}
      const v=t.parentNode.querySelector('.v');if(v&&words)v.textContent=words;S.edited=true;apply();paint();host.changed('knob');});
    bsp.addEventListener('click',e=>{const a=e.target.dataset&&e.target.dataset.a;if(!a)return;const h=hs(),[c,x,y]=a.split('|');
      if(c==='close')return bspShow(false);if(c==='pre')return bsPreset(bsPreIdx()+(+x));if(c==='on')return stomp('harm');if(c==='style')return bsStyle(x);
      if(c==='freeze'){if(E.frozen())stomp('harm');else bsFreeze();return bspRender();}
      if(c==='learn'){if(learn)learnEnd();else learnStart();return;}
      if(c==='key'){if(x==='AUTO')h.auto=true;else{h.auto=false;h.key=NM.indexOf(x);}}else if(c==='s')bsSetS(x,y);
      S.edited=true;apply();paint();host.changed('switch');});
    /* FREEZE (the footswitch held): what sounds now (or, if nothing does, the last chord played) held on; a tap lets it go */
    let fzLast=[],fzAt=0;
    function bsFreeze(){const h=hs();awake();if(!h.on){h.on=true;S.edited=true;apply();paint();host.changed('switch');}
      const t=ctx.currentTime,seen=new Map();for(const v of E.voices)if(!v.released&&!v.oneShot&&t>=v.t0&&!seen.has(v.n))seen.set(v.n,{n:v.n,lay:'hard',g:v.harm?.7:1});
      let list=[...seen.values()];if(!list.length)list=fzLast.map(n=>({n,lay:'hard',g:1}));
      const k=E.freeze(list.slice(-8));bsGo();bsDraw();bspRender();flash('BARBERSHOP · FREEZE',k?k+' NOTES HELD · TAP THE SWITCH TO LET GO':'PLAY SOMETHING, THEN HOLD THE SWITCH');}

    /* ---- notes: the guitar's (MIX takes it down past halfway), then BARBERSHOP's voices (on the same string, so they stop with it) ---- */
    function sound(n,v,when,strum,fx){const h=S.v.harm,t=Math.max(ctx.currentTime,when||0);fx=fx||{};const str=fx.str==null?-1:fx.str;
      if(str>=0)pickStr(str,n,t,fx.hammer);else for(const x of E.voices)if(x.parent===n&&!x.released&&!x.oneShot)E.release(x,t,.03);   /* the string picked again */
      const o={when,strum,str,hammer:!!fx.hammer,offset:fx.hammer?.03:0},dry=h.on?Math.min(1,2*(1-h.mix)):1;if(dry>.01)E.play(n,v,Object.assign({},o,{gain:dry}));
      const nowP=performance.now();if(nowP-fzAt>300)fzLast=[];fzAt=nowP;fzLast.push(n);
      if(!h.on)return;const wet=Math.min(1,2*h.mix)*1.1;
      for(const x of bsVoices(n)){if(x.n==null)continue;const vv=E.play(x.n,v,Object.assign({},o,{when:t+(x.d||0),harm:true,parent:n,gain:x.g*wet,pan:x.pan,slot:x.slot,det:x.det,rev:x.rev,one:x.one}));
        if(vv&&x.one)E.release(vv,t+(x.d||0)+1.6,.6);}}   /* (forward echoes: each a short ring) */
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
    /* a key let go (or the sustain pedal lifted): the guitar's note stops with HOLD, rings on otherwise (LEAD may pull off); the CUSHION holds on */
    function letGo(n){const m=mode();if(m==='HOLD')E.noteOff(n);else if(m==='LEAD')pullOff(n);}
    function key(x){if(!x)return;
      if(x.t==='on'){awake();kinFlash();const v=x.v||100;velOf.set(x.n,v);padOn(x.n,v);hear(x.n,v);
        if(S.v.g.strum!=='OFF'){down.add(x.n);sus.delete(x.n);if(!pend){pend=[];pendT=setTimeout(flushStrum,25);}pend.push({n:x.n,v});}
        else{pluck(x.n,v);down.delete(x.n);down.add(x.n);sus.delete(x.n);}}   /* (down after the pluck, so LEAD finds the key held before it) */
      else if(x.t==='off'){down.delete(x.n);if(pend){const p=pend.find(y=>y.n===x.n);if(p){p.off=true;return;}}if(pedal)sus.add(x.n);else letGo(x.n);}
      else if(x.t==='pedal'){pedal=!!x.on;if(!pedal){for(const n of sus)if(!down.has(n))letGo(n);sus.clear();}}
      else if(x.t==='bend'){bend(clamp(+x.v||0,-1,1));}
      else if(x.t==='mod'){E.wheel(clamp(+x.v||0,0,1));}}
    /* the bend wheel: a whole tone either way (each sounding note's speed moved; it costs more only while bent) */
    function bend(b){E.bend=b;const r=Math.pow(2,b*2/12),t=ctx.currentTime;for(const v of E.voices){if(v.released||v.oneShot)continue;hold(v.src.playbackRate,t);v.src.playbackRate.setTargetAtTime(v.rate0*r,t,.01);}}
    const midi=x=>{if(plugged('keys'))return;key(x.t==='cc'?(x.n===64?{t:'pedal',on:x.v>=.5}:x.n===1?{t:'mod',v:x.v}:null):x);};
    const allUp=()=>{for(const n of [...down])key({t:'off',n});if(pedal)key({t:'pedal',on:false});};
    function panic(){clearTimeout(pendT);pend=null;padLetGo();E.panic();if(padE){const t=ctx.currentTime;padE.voices.slice().forEach(v=>v.kill(t));}padHeld.clear();down.clear();sus.clear();pedal=false;bend(0);flash('PANIC','EVERY NOTE AND ECHO STOPPED');}

    /* ---- settings ---- */
    function apply(){P();E.apply(clock);padApply();}
    function set(k,v,quiet){const was=mode();put(k,v);S.edited=true;apply();paint();
      if(k==='harm.val'){const pg=bsMain();bsShow(pg[1],bsText(pg));if(!quiet)flash('BARBERSHOP · '+pg[1],bsText(pg));host.changed('knob');return;}   /* (VALUE: the page the window shows) */
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
      S.v=mine?oldHarm(deep(fresh({}),JSON.parse(JSON.stringify(mine.v)))):fresh(PRESETS[i][1]);S.preset=i;S.edited=false;apply();paint();host.changed('preset');flash(L[i].toUpperCase(),'PRESET '+(i+1)+' / '+L.length);}
    function cycle(c,dir){const v=S.v,step=(list,cur)=>list[(list.indexOf(cur)+dir+list.length)%list.length];
      if(c==='mod.mode')v.mod.mode=step(MMODES,v.mod.mode);else if(c==='delay.div')v.delay.div=step(DIVS.map(x=>x[0]),v.delay.div);
      S.edited=true;apply();paint();host.changed('switch');
      const tip={'mod.mode':MTIP[v.mod.mode],'delay.div':v.delay.div==='FREE'?'TIME BY ITS KNOB':'IN TIME WITH THE DESK ('+Math.round(clock.bpm||120)+' BPM)'}[c];
      flash((PNAME[c.split('.')[0]])+' · '+chipText[c](),tip);}
    function stomp(id){if(id==='comp')setTimeout(gaugeGo,0);if(id==='drive')setTimeout(tailsGo,0);
      if(id==='harm'){if(E.frozen()){E.unfreeze();bsDraw();return flash('BARBERSHOP · FREEZE','LET GO');}setTimeout(bsGo,0);}
      if(id==='pad'&&S.v.pad.on&&padHeld.size){padLetGo();return flash('CUSHION','LET GO · TAP AGAIN TO SWITCH IT OFF');}   /* (holding a chord: a tap lets it go, the pedal stays on) */   /* (frozen: a tap lets the freeze go, the pedal stays on) */
      const p=S.v[id];p.on=!p.on;if(id==='harm'&&!p.on){E.unfreeze();if(learn){clearTimeout(learn.t);learn=null;}}S.edited=true;apply();paint();host.changed('switch');flash(PNAME[id],p.on?'ON':'OFF');}
    function button(b){const v=S.v;
      if(b==='prev'||b==='next')return usePreset(S.preset+(b==='next'?1:-1));
      if(b==='save')return askName();
      if(b.startsWith('view.')){const k=b.slice(5);S.view[k]=!S.view[k];paint();host.changed('view');if(k==='p')seaStill();
        return flash(({g:'GUITAR',a:'AMP',p:'PEDALS'})[k],S.view[k]?'SHOWN':k==='p'?'HIDDEN: THE STAGE FILLS THE SPACE':'HIDDEN');}
      if(b==='panic')return panic();if(b==='keys')return compKeys(!comp);
      /* BARBERSHOP's buttons: STYLE the next style; PREV / NEXT its presets; KEY (and a click on the window) its panel */
      if(b.startsWith('bs.')){const h=v.harm,w=b.slice(3);
        if(w==='style')return bsStyle(BSTY[(BSTY.indexOf(h.style)+1)%BSTY.length]);
        if(w==='prev'||w==='next')return bsPreset(bsPreIdx()+(w==='next'?1:-1));
        if(w==='key'||w==='panel')return bspShow(!bspOpen);}
      if(b.startsWith('swm.')){const sw=v.swell;sw.mode=b.slice(4);sw.on=true;if(sw.mode==='rise'&&!v.verb.on)v.verb.on=true;S.edited=true;apply();paint();host.changed('switch');
        return flash('OCEAN SWELL · '+SWM.find(x=>x[0]===sw.mode)[1],SWTIP[sw.mode]+(sw.mode==='rise'?' (REVERB ON)':''));}
      if(b==='swell.wheel'){const sw=v.swell;sw.wheel=!sw.wheel;if(sw.wheel)sw.on=true;S.edited=true;apply();paint();host.changed('switch');return flash('OCEAN SWELL · WHEEL',sw.wheel?'THE MOD WHEEL IS A VOLUME PEDAL':'OFF');}
      if(b.startsWith('pad.')){const x=b.slice(4),pd=v.pad;let l=pd.ch.filter(c=>c!==x);   /* (as HORIZON's PAD: a sound lit or put out, two at most, the oldest giving way; never none) */
        if(l.length===pd.ch.length){l=[...pd.ch,x];if(l.length>2)l=l.slice(1);}else if(!l.length)return flash('CUSHION','ALWAYS ONE SOUND');
        pd.ch=l;if(!pd.on)pd.on=true;S.edited=true;apply();paint();host.changed('switch');return flash('CUSHION',l.map(c=>c.toUpperCase()).join(' + '));}
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
      if(d.k){const k=d.k,y0=e.clientY,u0=+get(k)||0,h=t.getBoundingClientRect().height*5;let moved=false;   /* (the LIGHTHOUSE's MODE: a click without a drag steps to the next sound) */
        drag(e,ev=>{if(Math.abs(y0-ev.clientY)>3)moved=true;if(moved)set(k,clamp(u0+(y0-ev.clientY)/h,0,1));},()=>{if(k==='mod.modek'&&!moved)cycle('mod.mode',1);});return;}
      /* (BARBERSHOP's footswitch and KEY: held half a second, they FREEZE and LEARN instead) */
      if(d.b||d.s||d.c){t.classList.add('down');const hb=d.s==='harm'?bsFreeze:d.b==='bs.key'?learnStart:null;let held=false;const ht=hb?setTimeout(()=>{held=true;hb();},550):0;
        drag(e,()=>{},()=>{clearTimeout(ht);t.classList.remove('down');if(held)return;if(d.b)button(d.b);else if(d.s)stomp(d.s);else cycle(d.c,1);});}});
    m.addEventListener('wheel',e=>{const d=e.target.dataset||{};if(d.k){e.preventDefault();e.stopPropagation();set(d.k,clamp(get(d.k)-Math.sign(e.deltaY)*(d.k==='harm.val'?bsStep():d.k==='g.playk'||d.k==='amp.chan'?1/3:d.k==='g.strumk'?1/2:d.k==='mod.modek'?1/4:.03),0,1));}   /* (PLAY, CHANNEL and STRUM, and VALUE on a list: a place a tick) */
      else if(d.c){e.preventDefault();e.stopPropagation();cycle(d.c,e.deltaY>0?1:-1);}},{passive:false});
    m.addEventListener('dblclick',e=>{const d=e.target.dataset||{};if(!d.k)return;e.stopPropagation();
      if(d.k==='harm.val'){const pg=bsMain(),L=bsList(pg);if(pg[3]!=null)set(d.k,L?L.indexOf(pg[3])/(L.length-1):pg[3]);return;}   /* (VALUE: the page shown back where it starts) */
      set(d.k,d.k==='g.playk'?1/3:d.k==='mod.modek'?0:d.k.split('.').reduce((o,p)=>o&&o[p],V0));});

    /* ---- start ---- */
    const offStat=M2.on('driftwood-samples',()=>{if(!dead)show();});
    loadSamples(ctx,host.files||window.mixtapeFiles).catch(()=>{if(!dead)host.toast('DRIFTWOOD: the guitar recordings are not in Instruments\\FreePats Electric Guitar Direct');});
    apply();paint();watch();offMidi=M2.midi.listen(midi);kinLamp();
    const offIn=M2.on('midi',kinLamp),offTempo=M2.on('tempo',()=>E.apply(clock));
    return {node:s=>s==='out'?outG:s==='in'?E.sndIn:null,
      receive(sock,msg){if(sock==='keys')key(msg);return true;},
      plugged(sock){if(sock==='keys'){allUp();if(comp&&plugged('keys'))compKeys(false);kinLamp();}if(sock==='in')watch();},
      visible(v){inSight=v!==false;if(inSight){seaGo();gaugeGo();tailsGo();bsGo();lhGo();cuGo();}},   /* (out of sight the sea is not drawn) */
      /* for tools\probes\m2-driftwood.js */
      probe:()=>({tails:{lv:+tLv.toFixed(2),moving:!!tRaf},gauge:{angle:+gA.toFixed(1),gr:+E.compGR().toFixed(1),moving:!!gRaf},sea:{ready:!!sea,running:!!seaRaf,frames:seaFrames,lv:+seaLv.toFixed(2),t:+seaT.toFixed(1)},samples:SAMP.state,loaded:SAMP.buf.size,notes:{soft:SAMP.by.soft.length,hard:SAMP.by.hard.length},awake:E.awake,voices:E.voices.length,live:E.voices.filter(v=>!v.released).length,
        harm:E.voices.filter(v=>v.harm).length,rev:E.voices.filter(v=>v.oneShot).length,keyBufs:KEYC.size,queued:RQ.length,level:+E.level().toFixed(4),chain:E.chain(),lfo:E.lfoOn(),shimmer:E.shimOn(),
        preset:names()[S.preset],edited:S.edited,play:mode(),swell:Object.assign({mode:S.v.swell.mode,on:S.v.swell.on},E.swState()),hand,strings:E.voices.filter(v=>!v.released&&!v.harm&&!v.oneShot).map(v=>v.n+'@'+v.str+(v.hammer?'h':'')),pad:padE?{on:S.v.pad.on,ch:S.v.pad.ch,voices:padE.voices.length,held:[...padHeld.keys()],awake:!!padE.awake,level:+padE.level().toFixed(4)}:(S.v.pad.on?'no engine':'off'),pedal,down:[...down],lcd:$('.lcd').textContent,rates:E.voices.map(v=>+v.src.playbackRate.value.toFixed(3)),playing:E.voices.map(v=>v.n+(v.fake?'~':'')),
        bs:{on:S.v.harm.on,style:S.v.harm.style,preset:bsLabel(),main:bsMain()[1]+' '+bsText(bsMain()),panel:bspOpen,drag:bspDrag,key:bsKey(),auto:autoK&&NM[autoK.key]+' '+autoK.scale,learning:learn?learn.notes.length:false,frozen:E.frozen(),
          pole:{ph:+bPh.toFixed(2),running:!!bRaf},singers:sLv.map(x=>+x.toFixed(2)),blink:bsLed.classList.contains('blink'),screen:bsEdit>performance.now()?bsMsg.join(' · '):S.v.harm.on?'on':'closed',
          harm:E.voices.filter(v=>v.harm).map(v=>v.n+(v.oneShot?'r':'')+'@'+v.slot)}}),
      bsVoices:n=>bsVoices(n).map(x=>x.n),debugHold:w=>w==='fs'?bsFreeze():learnStart(),
      debugSet:(k,v)=>set(k,v,true),debugSea:()=>{if(sea)sea.draw(...seaSize(),seaT+=.03,seaLv);},debugBeam:ph=>{lPh=ph;beamDraw();},padVoice:n=>padHeld.get(n),gLevel:()=>E.gLevel(),padFollow:()=>+folG.toFixed(3),cuSwing:()=>({amp:+cuAmp.toFixed(3),shown:cuShown,ready:!!cuPlate}),padLv:()=>padE&&padE.P.lv,padP:()=>padE&&padE.P,debugHush:()=>{clearTimeout(pendT);pend=null;padLetGo();E.allOff();if(padE)padE.voices.slice().forEach(v=>v.kill(ctx.currentTime));padHeld.clear();},debugButton:b=>button(b),debugStomp:s=>stomp(s),debugCycle:(c,d)=>cycle(c,d||1),harmOf,
      destroy(){dead=true;clearInterval(folT);removeEventListener('pointerup',bspUp);removeEventListener('keydown',bspKey);if(seaRaf)cancelAnimationFrame(seaRaf);if(bRaf)cancelAnimationFrame(bRaf);clearTimeout(bsT);if(learn)clearTimeout(learn.t);if(gRaf)cancelAnimationFrame(gRaf);if(tRaf)cancelAnimationFrame(tRaf);if(sea)sea.dispose();clearTimeout(flashT);clearTimeout(sleepT);clearTimeout(pendT);clearTimeout(kinT);if(comp)compKeys(false);if(offMidi)offMidi();offStat();offIn();offTempo();
        if(padE)padE.dispose();E.dispose();host.engine.busy(uid,false);setTimeout(()=>{try{outG.disconnect();}catch(e){}},350);}};}};
M2.define(DEF);
M2.driftwood={Engine,SAMP,PRESETS,fresh,harmOf,harmIn,guessKey,loadSamples,played:(ctx,n,lay,rr)=>{const r=nearest(n,lay,rr);return r&&render(ctx,r,n);}};   /* (played: a note as DRIFTWOOD plays it, for toolsprobesm2-driftwood-tuning.js) */
})();
