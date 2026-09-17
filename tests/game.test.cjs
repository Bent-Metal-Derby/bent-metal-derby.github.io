// No browser or npm dependencies: execute the shipped game logic with rendering and DOM stubs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const source = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(source);
function runtime() {
  const elements = new Map(), events = {}, frames = [];
  const element = id => {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, {style:{},dataset:{},children:[],listeners:{},textContent:'',
        classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),
          toggle(x,on){if(on??!classes.has(x)) classes.add(x); else classes.delete(x);}},
        addEventListener(type,fn){this.listeners[type]=fn;},getContext:()=>({}),
        appendChild(child){this.children.push(child);},setPointerCapture(){}});
    }
    return elements.get(id);
  };
  const touches = ['gas','brake','left','right','hand'].map(action=>{
    const b=element('touch-'+action);b.dataset.touch=action;return b;
  });
  class Material { constructor(){this.userData={};} }
  const ctx = vm.createContext({console,assert,
    THREE:{MeshStandardMaterial:Material,Color:class {},Vector3:class {},Clock:class {getDelta(){return 1/60;}}},
    screen:{width:1280,height:720},navigator:{userAgent:''},
    window:{addEventListener:(name,fn)=>events[name]=fn},
    document:{getElementById:element,querySelectorAll:()=>touches},
    setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:fn=>frames.push(fn),
    localStorage:{getItem:()=>null,setItem(){}},
  });
  const run = code => vm.runInContext(code,ctx);
  run(source.slice(0,source.indexOf('\nloadCareer();')));
  run(`
    particles=new Proxy({}, {get:()=>()=>{}});
    function setup(type='race',dirt=true){
      Object.assign(Game,{state:'playing',levelType:type,dirtTrack:dirt,trackWalls:type==='race'&&!dirt,
        cars:[],ramps:[],barrels:[],tires:[],trees:[],cityBuildings:[],powerups:[],towTruck:null,
        player:null,pullout:{},finishSeq:0,elapsed:10,gripMult:1,wrongTimer:0,raceTime:0,paused:false,eventType:'standard',eliminationLap:0,
        trial:null,recoveryHold:0,recoveryCooldown:0});
      Course.setPoly([[-60,-60],[60,-60],[60,60],[-60,60]],15,type==='city'?4:0);
    }
    function car(x=0,z=0){
      const color={setHex(){}};
      const c=Object.assign(Object.create(Car.prototype),{
        id:Game.cars.length+1,x,z,y:0,vx:0,vz:0,vy:0,angle:0,omega:0,groundY:0,
        airborne:false,onRamp:false,rampCd:0,alive:true,health:100,maxHealth:100,
        invMass:CAR.invMass,invInertia:CAR.invInertia,enginePow:CAR.enginePow,brakePow:CAR.brakePow,
        reversePow:CAR.reversePow,turnRate:CAR.turnRate,gripF:CAR.grip,gripH:CAR.gripHand,
        drag:CAR.drag,ram:1,pullSide:0,nitroT:0,shieldT:0,dmgT:0,steerVis:0,squash:0,
        dustTimer:999,hitFlash:0,lastScoredHit:-1,removed:false,finished:false,finishOrder:0,
        cumU:0,prevU:0,prevUWarn:0,laps:0,burning:false,lapTimes:[],lapStartedAt:0,finishTime:null,eliminated:false,
        recoveryLock:0,stuckT:0,recoverT:0,recoverCd:0,topSpeedEst:36,ai:{aggro:1},
        mesh:{visible:true,userData:{body:{material:{color}},cabin:{material:{color}}}},
        applyDamageVisual(){},syncMesh(){},
      }); Game.cars.push(c);return c;
    }
    function place(c,u){const p=Course.at(u);c.x=p.cx;c.z=p.cz;}
    function tick(n=1,ctrl={throttle:0,steer:0,hand:false}){
      for(let i=0;i<n;i++) physicsStep(1/120,Game.cars.map(()=>ctrl));
    }
  `);
  return {ctx,run,element,events,frames,touches};
}
function check(name,code){test(name,()=>runtime().run(code));}
check('a spent life and score survive retrying round one',`
  clearRoundScene=()=>{}; spawnPowerups=()=>{}; applyEnvironment=()=>{};
  buildDerby=buildRaceTrack=buildCityTrack=buildDirtTrack=()=>{};
  Car=class {constructor(){this.ai={aggro:1};} reset(){}};
  Game.lives=1;Game.score=1234;Game.championship={rounds:2,points:{YOU:12}};
  startRound(1); assert.equal(Game.lives,1);assert.equal(Game.score,1234);assert.equal(Game.championship.points.YOU,12);
`);
check('a fresh run resets run state while keeping garage cash',`
  Game.state='menu'; Game.lives=0;Game.score=900;Game.cash=345;
  go(1,true);assert.equal(Game.lives,3);assert.equal(Game.score,0);assert.equal(Game.cash,345);
`);
check('grid slots measure laps from the painted start line',`
  setup();const a=car(),b=car();const p=Course.at(.992),q=Course.at(.96);
  a.reset(p.cx,p.cz,0);b.reset(q.cx,q.cz,0);
  assert.ok(Math.abs(a.cumU+.008)<1e-9);assert.ok(Math.abs(b.cumU+.04)<1e-9);
`);
check('a race ends at the finish line after three laps',`
  setup();const c=car();Game.player=c;c.prevU=.99;c.cumU=2.99;place(c,.001);
  updateRaceProgress();assert.equal(c.finished,true);assert.equal(c.finishOrder,1);assert.equal(c.cumU,3);
`);
check('close finishes are ordered by crossing time, not array order',`
  setup();const p=car(),r=car();Game.player=p;
  p.prevU=.99;p.cumU=2.99;place(p,.001);
  r.prevU=.999;r.cumU=2.999;place(r,.01);
  updateRaceProgress();assert.equal(r.finishOrder,1);assert.equal(p.finishOrder,2);assert.equal(playerPlace(),2);
`);
check('reversing or wrecking after finishing cannot change the winner',`
  setup();const p=car(),r=car();Game.player=p;
  p.finished=true;p.finishOrder=2;p.cumU=3;p.prevU=.1;place(p,.2);
  r.finished=true;r.finishOrder=1;r.cumU=3;r.prevU=.1;place(r,0);
  updateRaceProgress();assert.equal(p.cumU,3);assert.equal(r.cumU,3);assert.equal(playerPlace(),2);
  r.alive=false;let result;completeLevel=(...args)=>result=args;
  checkLevelEnd();assert.equal(result[0],2);assert.equal(result[5],false);
`);
check('wrong-way warning clears when stopped and uses elapsed time',`
  setup();const p=car();Game.player=p;p.prevU=.1;p.cumU=.1;p.vz=10;place(p,.099);
  updateRaceProgress(.1);assert.equal(Game.wrongTimer,.1);
  p.vz=0;updateRaceProgress(.1);assert.equal(Game.wrongTimer,0);
`);
check('impact cooldowns expire even while cars are apart',`
  setup();_pairHitCd.set('1_2',.45);tick(120);assert.equal(_pairHitCd.has('1_2'),false);
`);
check('incoming momentum survives the collision impulse for damage attribution',`
  setup();const a=car(0,-2),b=car(0,2);a.vz=20;b.vz=-20;b.angle=Math.PI;
  const hit=obbCollide(a,b),closing=resolveCars(a,b,hit);
  assert.equal(hit.contribA,20);assert.equal(hit.contribB,20);
  a.vz=b.vz=0;registerImpact(a,b,hit,closing);
  assert.ok(a.health<95);assert.ok(b.health<95);
`);
check('towed-away wrecks no longer collide with cars or barrels',`
  setup();const a=car(0,-60),b=car(0,-59);b.removed=true;b.alive=false;b.mesh.visible=false;
  tick();assert.equal(a.z,-60);assert.equal(b.z,-59);
  Game.cars=[b];const barrel={x:.5,z:-59,y:0,r:.7,vx:0,vz:0,vy:0,hitCd:1};b.vx=10;
  collideBarrel(barrel);assert.equal(barrel.x,.5);assert.equal(barrel.vx,0);
`);
check('a destroyed tow truck releases its wreck',`
  setup();const tow=car(),wreck=car();tow.alive=false;wreck.alive=false;wreck.beingTowed=true;
  tow.towState={mode:'towing',target:wreck};driveTowAI(tow,.016);
  assert.equal(wreck.beingTowed,false);assert.equal(tow.towState.target,null);
`);
check('zero damage does not steal kill credit',`
  setup();const a=car(),b=car();a.damage(0,b);assert.equal(a.lastHitBy,undefined);assert.equal(a.health,100);
`);
check('the tow truck cannot award competitor wreck points',`
  setup();const a=car(),tow=car();a.isPlayer=true;tow.isTow=true;Game.player=a;Game.levelWrecks=0;
  tow.damage(200,a);assert.equal(Game.levelWrecks,0);
`);
for(const [type,dirt] of [['race',true],['city',false],['figure8',false],['figure8',true]]) {
  for(const side of [-1,1]) check(type+' '+dirt+' has an open edge on side '+side,`
    setup('${type}',${dirt});const c=car(0,-60-(${side})*12);c.vz=-(${side})*15;c.angle=${side}>0?Math.PI:0;
    tick(120,{throttle:1,steer:0,hand:false});assert.ok(Math.abs(Course.project(c.x,c.z).lateral)>15);
    assert.equal(c.groundY,-.5);assert.equal(c.y,-.5);
    c.x=150;c.z=150;c.vx=10;c.vz=0;tick();assert.ok(c.x>150);
  `);
}
check('paved circuit and derby walls still block',`
  setup('race',false);const c=car(0,-76);c.vz=-4;tick();assert.ok(c.z>=-73.6-1e-8);
  setup('derby');const d=car(57,0);d.vx=4;tick();assert.ok(d.vertices().every(v=>Math.hypot(...v)<=WALL_R+1e-6));
`);
check('jumps cannot pass through a tall building',`
  setup('city',false);Game.cityBuildings=[{x:0,z:-90,tx:1,tz:0,nx:0,nz:1,hw:10,hd:5,height:20}];
  const c=car(0,-84);c.y=3;c.vz=-4;cityBuildingCollide(c);assert.ok(c.z>=-82.9-1e-8);assert.ok(c.vz>0);
  c.z=-84;c.y=21;cityBuildingCollide(c);assert.equal(c.z,-84);
`);
check('barrels settle onto off-road terrain',`
  setup();const b=Object.assign(Object.create(Barrel.prototype),{x:0,z:-80,y:0,vy:0,vx:0,vz:0,r:.7,hitCd:0,fireT:100,mesh:{position:{set(){}}}});
  for(let i=0;i<120;i++) b.step(1/120);assert.equal(b.y,-.5);
`);
check('fourth place pays no garage cash',`
  setup();const p=car();p.name='YOU';Game.player=p;Game.cash=300;Game.levelWrecks=2;Game.levelFatalities=1;Game.levelHits=3;
  completeLevel(4,0,false,'4TH PLACE',0,false);assert.equal(Game.cash,300);assert.equal(Game.lastBreakdown.cashEarned,0);
`);
check('corrupt settings cannot select NPCs or inherited object properties',`
  localStorage.getItem=()=>JSON.stringify({cash:-30,volume:1,playerVehicle:'tow',difficulty:'toString'});
  loadCareer();assert.equal(Game.cash,0);assert.equal(Game.playerVehicle,'car');assert.equal(Game.difficulty,'normal');
  localStorage.getItem=()=>'{"cash":1e999,"volume":1e999,"playerVehicle":"constructor"}';
  loadCareer();assert.equal(Game.cash,0);assert.equal(Game.volume,1);assert.equal(Game.playerVehicle,'car');
`);
check('gamepad failures cannot stop the game',`
  navigator.getGamepads=()=>{throw new Error('denied');};pollGamepad();rumble(1,100);
  assert.equal(input.throttle,0);
`);
check('controller disconnect releases the pause-button latch',`
  gamepadStartHeld=true;navigator.getGamepads=()=>[];pollGamepad();assert.equal(gamepadStartHeld,false);
`);
test('touch pedals and steering work simultaneously, then release on cancel',()=>{
  const {run,touches}=runtime();run('setup();');
  for(const action of ['gas','right']) {
    const b=touches.find(b=>b.dataset.touch===action);
    b.listeners.pointerdown({pointerId:action,preventDefault(){}});
  }
  run('pollGamepad();assert.equal(input.throttle,1);assert.equal(input.rawSteer,-1);');
  touches.find(b=>b.dataset.touch==='gas').listeners.pointercancel({pointerId:'gas'});
  run('pollGamepad();assert.equal(input.throttle,0);assert.equal(input.rawSteer,-1);');
  run('togglePause();assert.equal(touchPointers.size,0);assert.equal(input.steer,0);');
});
test('pause works with Escape and ignores key repeats',()=>{
  const {run,events}=runtime();run('setup();');
  const e={key:'Escape',repeat:false,preventDefault(){}};
  events.keydown(e);run('assert.equal(Game.paused,true);');
  events.keydown({...e,repeat:true});run('assert.equal(Game.paused,true);');
  events.keydown(e);run('assert.equal(Game.paused,false);');
});
check('pause cannot replace a menu or results overlay',`
  Game.state='menu';togglePause();assert.equal(Game.paused,false);
  Game.state='roundwon';togglePause();assert.equal(Game.paused,false);
`);
check('paused countdown and elapsed time stay frozen',`
  Game.state='countdown';Game.paused=true;Game.countdown=3;Game.elapsed=10;
  renderer={render(){},shadowMap:{autoUpdate:true}};loop();
  assert.equal(Game.countdown,3);assert.equal(Game.elapsed,10);
`);
test('home stops the old round and clears held controls',()=>{
  const {run,element}=runtime();
  run("Game.state='gameover';keys.w=true;refreshCashTags=buildVehicleChips=previewHighlight=()=>{};");
  element('loseHomeBtn').listeners.click();
  run("assert.equal(Game.state,'menu');assert.equal(input.throttle,0);");
});
check('all generated courses have finite, normalized directions and projections',`
  for(let k=0;k<12;k++) for(const generate of [()=>{genTrack();Course.setPolar();},genCity,genDirtTrack,genFigureEight]){
    generate();for(let i=0;i<100;i++){const p=Course.at(i/100),q=Course.project(p.cx,p.cz);
      assert.ok(Object.values(p).every(Number.isFinite));assert.ok(Number.isFinite(q.u));assert.ok(Math.abs(q.lateral)<1e-6);
      assert.ok(Math.abs(Math.hypot(p.tx,p.tz)-1)<1e-6);
    }
  }
`);
check('retry results replace earlier championship awards for the same round',`
  setup();const p=car(),r=car();p.name='YOU';r.name='VIPER';Game.player=p;Game.round=2;
  p.cumU=1;r.cumU=2;recordChampionship();assert.equal(Game.championship.points.YOU,8);
  p.cumU=3;p.finished=true;p.finishOrder=1;recordChampionship();
  assert.equal(Game.championship.rounds,1);assert.equal(Game.championship.points.YOU,10);assert.equal(Game.championship.points.VIPER,8);
  recordChampionship();assert.equal(Game.championship.points.YOU,10);
`);
check('wrecking loses an unbanked drift combo',`
  setup();const p=car();Game.player=p;p.alive=false;Game.score=0;Game.drift={active:true,score:400,mult:2,grace:.3};
  updateDrift(.016);assert.equal(Game.score,0);assert.equal(Game.drift.active,false);assert.equal(Game.drift.score,0);
`);
check('a partial controller stick stays at partial steering',`
  setup('derby',false);drawMinimap=()=>{};renderer={render(){},shadowMap:{autoUpdate:true}};
  navigator.getGamepads=()=>[{axes:[.35],buttons:[]}];
  for(let i=0;i<120;i++)loop();
  assert.ok(Math.abs(input.steer-(-(.35-.14)/.86))<1e-8);
`);
check('pausing during the loading reveal keeps the pause menu visible',`
  Game.state='countdown';Game.paused=true;Game.reveal=1;
  renderer={render(){},shadowMap:{autoUpdate:true}};loop();
  assert.equal($('pauseScreen').classList.contains('hidden'),false);
`);
check('shared graphics resources survive round cleanup; private ones are disposed',`
  let disposed=[];const resource=(id,kind)=>({[kind]:true,dispose(){disposed.push(id);}});
  const owned=resource('owned geometry','isBufferGeometry'),shared=resource('shared geometry','isBufferGeometry');
  const texture=resource('owned texture','isTexture'),cachedTexture=resource('cached texture','isTexture');
  const material=Object.assign(resource('owned material','isMaterial'),{map:texture,normalMap:cachedTexture});
  const mesh=(geometry)=>({geometry,material,traverse(fn){fn(this);}});
  const road=mesh(owned),vehicle=mesh(shared);
  _rbCache.shared=shared;_softTex=cachedTexture;
  levelGroup={children:[road],clear(){this.children=[];},traverse(fn){fn(this);for(const c of this.children)c.traverse(fn);}};
  scene={children:[levelGroup,vehicle],remove(o){this.children=this.children.filter(x=>x!==o);},traverse(fn){fn(this);for(const c of this.children)c.traverse(fn);}};
  Game.cars=[{mesh:vehicle}];clearRoundScene();
  assert.deepEqual(disposed.sort(),['owned geometry','owned material','owned texture']);
`);
check('a full figure-eight lap follows both crossover branches without jumping progress',`
  setup('figure8',false);genFigureEight();const c=car();Game.player=c;place(c,.99);c.prevU=.99;c.cumU=-.01;
  for(let i=1;i<=1011;i++){const u=.99+i*.001;place(c,u);const before=c.cumU;updateRaceProgress();
    assert.ok(Math.abs(c.cumU-before-.001)<1e-6);
  }
  assert.equal(c.laps,1);
`);
check('garage settings survive a save/load round trip',`
  let saved;localStorage.setItem=(k,s)=>saved=s;localStorage.getItem=()=>saved;
  Game.cash=1200;Game.playerVehicle='buggy';Game.playerColor=PLAYER_PAINTS[2];Game.volume=.3;Game.upgrades.buggy.engine=4;saveCareer();
  Game.cash=0;Game.playerVehicle='car';Game.playerColor=PLAYER_PAINTS[0];Game.volume=1;Game.upgrades.buggy.engine=0;loadCareer();
  assert.equal(Game.cash,1200);assert.equal(Game.playerVehicle,'buggy');assert.equal(Game.playerColor,PLAYER_PAINTS[2]);assert.equal(Game.volume,.3);assert.equal(Game.upgrades.buggy.engine,4);
`);
check('arena selection controls the surface and derby never uses race elimination',`
  clearRoundScene=spawnPowerups=applyEnvironment=()=>{};
  buildDerby=buildRaceTrack=buildCityTrack=buildDirtTrack=()=>{};
  Car=class {constructor(){this.ai={aggro:1};} reset(){}};
  Game.raceFormat='elimination';
  for(const arena of ARENA_CHOICES.slice(1)){
    Game.arenaChoice=arena.key;Game.raceTime=99;startRound(2);
    assert.equal(Game.levelType,arena.type);assert.equal(Game.dirtTrack,arena.dirt);
    assert.equal(Game.eventType,arena.type==='derby'?'standard':'elimination');assert.equal(Game.raceTime,0);
  }
`);
check('arena and format choices persist and reject invalid saved values',`
  let saved;localStorage.setItem=(k,s)=>saved=s;localStorage.getItem=()=>saved;
  Game.arenaChoice='rally';Game.raceFormat='elimination';saveCareer();
  Game.arenaChoice='tour';Game.raceFormat='standard';loadCareer();
  assert.equal(Game.arenaChoice,'rally');assert.equal(Game.raceFormat,'elimination');
  saved=JSON.stringify({arenaChoice:'unknown',raceFormat:'unknown'});loadCareer();
  assert.equal(Game.arenaChoice,'rally');assert.equal(Game.raceFormat,'elimination');
  Game.arenaChoice='derby';refreshEventUI();assert.equal($('formatSelect').value,'standard');
  Game.arenaChoice='city';refreshEventUI();assert.equal($('formatSelect').value,'elimination');
`);
check('race clock excludes countdowns, pauses and results',`
  setup();Game.player=car();Game.state='countdown';updateRaceProgress(1);assert.equal(Game.raceTime,0);
  Game.state='playing';Game.paused=true;updateRaceProgress(1);assert.equal(Game.raceTime,0);
  Game.paused=false;updateRaceProgress(.5);assert.equal(Game.raceTime,.5);
  Game.state='roundwon';updateRaceProgress(1);assert.equal(Game.raceTime,.5);
`);
check('lap times interpolate line crossings and ignore reverse recrossings',`
  setup();const p=car();Game.player=p;Game.raceTime=59;p.cumU=.99;p.prevU=.99;place(p,.01);
  updateRaceProgress(.02);assert.equal(p.lapTimes.length,1);assert.ok(Math.abs(p.lapTimes[0]-59.01)<1e-8);
  place(p,.99);updateRaceProgress(.02);place(p,.01);updateRaceProgress(.02);
  assert.equal(p.lapTimes.length,1);assert.ok(Math.abs(p.lapStartedAt-59.01)<1e-8);
  Game.raceTime=117;p.cumU=1.99;p.prevU=.99;place(p,.01);updateRaceProgress(.02);
  assert.equal(p.lapTimes.length,2);assert.ok(Math.abs(bestLapTime(p)-58)<1e-8);
  assert.equal($('bannerBig').textContent,'FINAL LAP');assert.ok($('bannerSub').textContent.includes('NEW BEST'));
`);
check('race finish timing freezes at the line and reaches the result board',`
  setup();const p=car(),r=car();Game.player=p;p.name='YOU';r.name='RIVAL';r.prevU=.2;place(r,.2);
  p.cumU=2.99;p.prevU=.99;p.lapTimes=[60,59];p.lapStartedAt=119;Game.raceTime=178;place(p,.01);
  updateRaceProgress(.02);assert.ok(Math.abs(p.finishTime-178.01)<1e-8);assert.equal(p.lapTimes.length,3);
  const finish=p.finishTime;updateRaceProgress(.5);updateHUD();assert.equal(p.finishTime,finish);assert.equal($('raceTime').textContent,'2:58.010');
  completeLevel(1,1,true,'1ST PLACE!',WIN_BONUS,false);buildWinVehChips=()=>{};showWin();
  assert.equal(Game.lastBreakdown.timing.time,finish);assert.ok($('winBoard').innerHTML.includes('2:58.010'));
  assert.ok($('winBoard').innerHTML.includes('0:59.000'));
`);
check('elimination removes exactly the last car at each of the first two leader laps',`
  setup();Game.eventType='elimination';const p=car(),a=car(),b=car(),c=car();Game.player=p;
  p.isPlayer=true;p.name='YOU';a.name='A';b.name='B';c.name='C';
  const line=(x,u)=>{x.cumU=u;x.prevU=u%1;place(x,u);};
  line(p,.8);line(a,.6);line(b,.4);line(c,.2);c.lastHitBy=p;
  updateRaceProgress();assert.equal(aliveCars().length,4);
  line(p,.99);place(p,.01);updateRaceProgress();assert.equal(c.eliminated,true);assert.equal(c.alive,false);
  assert.equal(c.burning,false);assert.equal(Game.levelWrecks,0);assert.equal(c.killedByPlayer,false);
  updateRaceProgress();assert.equal(aliveCars().length,3);
  line(p,1.99);place(p,.01);updateRaceProgress();assert.equal(b.eliminated,true);assert.equal(aliveCars().length,2);
  line(p,2.99);place(p,.01);updateRaceProgress();assert.equal(a.alive,true);assert.equal(Game.eliminationLap,2);
`);
check('player elimination warns beforehand and displays the correct loss reason',`
  setup();Game.eventType='elimination';const p=car(),r=car();Game.player=p;p.isPlayer=true;p.name='YOU';r.name='RIVAL';
  p.prevU=.2;p.cumU=.2;place(p,.2);r.prevU=.99;r.cumU=.99;place(r,.99);updateHUD();
  assert.equal($('placeSub').textContent,'AT RISK');place(r,.01);updateRaceProgress();checkLevelEnd();
  assert.equal(Game.state,'gameover');assert.equal($('bannerBig').textContent,'ELIMINATED');
  buildLoseVehChips=()=>{};showLose();assert.equal($('loseTitle').textContent,'ELIMINATED');
`);
check('car resets clear lap history, finish times and elimination state',`
  setup();const p=car();p.lapTimes=[55];p.lapStartedAt=55;p.finishTime=150;p.eliminated=true;
  const start=Course.at(.99);p.reset(start.cx,start.cz,0);
  assert.equal(p.lapTimes.length,0);assert.equal(p.lapStartedAt,0);assert.equal(p.finishTime,null);assert.equal(p.eliminated,false);
`);
check('race time formatting carries milliseconds across minute boundaries',`
  assert.equal(formatRaceTime(null),'—');assert.equal(formatRaceTime(0),'0:00.000');
  assert.equal(formatRaceTime(59.9996),'1:00.000');assert.equal(formatRaceTime(125.123),'2:05.123');
`);
check('AI chooses room to pass a stopped car without weaving every frame',`
  setup();const c=car(),o=car();place(c,.05);c.prevU=.05;c.angle=Math.PI/2;c.vx=20;
  place(o,.09);o.alive=false;
  driveRaceAI(c,.1);const lane=c.ai.targetLane;assert.ok(Math.abs(lane)>3);
  for(let i=0;i<8;i++)driveRaceAI(c,.1);assert.equal(c.ai.targetLane,lane);
`);
check('AI brakes before a pileup when every lane is blocked',`
  setup();const c=car();place(c,.05);c.prevU=.05;c.angle=Math.PI/2;c.vx=25;
  for(const lane of [-10,-5,0,5,10]){const o=car();place(o,.067);o.z+=lane;}
  assert.ok(driveRaceAI(c,.1).throttle<0);
`);
check('AI slows for sharp corners and keeps a bounded lane on narrow roads',`
  setup();const c=car();place(c,.235);c.prevU=.235;c.angle=Math.PI/2;c.vx=35;
  const ctrl=driveRaceAI(c,.1);assert.ok(ctrl.throttle<0);assert.ok(Math.abs(ctrl.steer)<=1);
  Course.halfW=7;driveRaceAI(c,2);assert.ok(Math.abs(c.ai.targetLane)<=2.5);
`);
check('AI ignores removed wrecks but detects a crossing car moving into its lane',`
  setup();const c=car(),o=car();place(c,.05);c.prevU=.05;c.angle=Math.PI/2;
  place(o,.08);o.removed=true;assert.equal(raceTraffic(c,Course.project(c.x,c.z),30).length,0);
  o.removed=false;o.z-=7;o.vz=20;
  const seen=raceTraffic(c,Course.project(c.x,c.z),30);assert.equal(seen.length,1);assert.ok(Math.abs(seen[0].side)<.001);
`);
check('recovery returns to a clear road location without healing or gaining progress',`
  setup();const p=car();Game.player=p;p.health=25;p.cumU=1.35;p.prevU=.35;p.lapTimes=[50];p.lapStartedAt=50;p.laps=1;p.x=300;p.z=300;
  const before=p.cumU;assert.equal(recoverPlayer(),true);
  assert.equal(p.health,25);assert.ok(p.cumU<before);assert.equal(p.lapTimes.length,1);assert.equal(p.lapStartedAt,50);
  assert.ok(Math.abs(Course.project(p.x,p.z).lateral)<Course.halfW);assert.equal(p.recoveryLock,2);
  tick(120,{throttle:1,steer:0,hand:false});assert.equal(p.speed,0);assert.ok(p.recoveryLock>.9);
`);
check('recovery waits for the hold and pause cancels it',`
  setup();Game.player=car();input.recover=true;updateRecovery(1);assert.equal(Game.recoveryHold,1);assert.equal(Game.recoveryCooldown,0);
  Game.paused=true;updateRecovery(1);assert.equal(Game.recoveryHold,0);
  Game.paused=false;input.recover=true;updateRecovery(1.5);assert.equal(Game.recoveryCooldown,10);
`);
check('recovery cannot resurrect wrecks or be used at speed, after finishing or on cooldown',`
  setup();const p=car();Game.player=p;p.alive=false;assert.equal(recoverPlayer(),false);
  p.alive=true;p.vx=20;assert.equal(recoverPlayer(),false);p.vx=0;p.finished=true;assert.equal(recoverPlayer(),false);
  p.finished=false;Game.recoveryCooldown=2;assert.equal(recoverPlayer(),false);
`);
check('recovery skips obstacles and approaching traffic',`
  setup();const p=car();Game.player=p;p.cumU=.3;
  const a=Course.at(.297);Game.barrels=[{x:a.cx,z:a.cz,r:1}];
  const spot=findRecoverySpot(p);assert.ok(spot);assert.ok(Math.hypot(spot.x-a.cx,spot.z-a.cz)>=4);
  const other=car(spot.x+12,spot.z);other.vx=-20;assert.equal(recoverySpotClear(spot.x,spot.z,p),false);
`);
check('a blocked recovery does not teleport, heal or charge the cooldown',`
  setup();const p=car();Game.player=p;p.cumU=.5;p.health=45;
  recoverySpotClear=()=>false;assert.equal(recoverPlayer(),false);assert.equal(Game.recoveryCooldown,0);assert.equal(p.health,45);assert.equal(p.cumU,.5);
`);
check('derby recovery stays inside the visible arena wall',`
  setup('derby',false);const p=car(200,200);Game.player=p;assert.equal(recoverPlayer(),true);assert.ok(Math.hypot(p.x,p.z)<WALL_R-8);
`);
check('seeded track generation repeats and restores the normal random source after errors',`
  const generate=()=>{genTrack();Course.setPolar();return JSON.stringify(TRK.harms);};
  assert.equal(withLayoutSeed(1729,generate),withLayoutSeed(1729,generate));assert.notEqual(withLayoutSeed(1730,generate),withLayoutSeed(1729,generate));
  assert.throws(()=>withLayoutSeed(12,()=>{throw Error('test');}));assert.equal(layoutRandom,null);
  assert.equal(withLayoutSeed(12,()=>{visualRand(0,1);return random();}),withLayoutSeed(12,()=>random()));
`);
check('ghost playback interpolates heading across zero and snaps recoveries',`
  const samples=[[0,0,0,0,3.1,0],[1,10,2,20,-3.1,0],[2,50,0,60,0,1]];
  const pose=ghostPose(samples,.5);assert.equal(pose[0],5);assert.equal(pose[1],1);assert.ok(Math.abs(pose[3]-Math.PI)<.01);
  assert.equal(ghostPose(samples,1.5)[0],10);assert.equal(ghostPose(samples,2)[0],50);
`);
check('ghost storage rejects malformed, non-monotonic and incomplete recordings',`
  let data;localStorage.getItem=()=>JSON.stringify(data);
  data={time:1,samples:[[0,0,0,0,0,0],[1,5,0,0,0,0]]};assert.ok(loadGhost('x'));
  data.samples[1][0]=0;assert.equal(loadGhost('x'),null);
  data.samples[1][0]=.5;assert.equal(loadGhost('x'),null);
  data.samples[1][0]=1;data.samples[1][2]=null;assert.equal(loadGhost('x'),null);
`);
check('ghost records are separate for arena, vehicle and upgrade configuration',`
  Game.arenaChoice='rally';const a=trialKey();Game.arenaChoice='city';assert.notEqual(trialKey(),a);
  Game.arenaChoice='rally';Game.upgrades.car.engine++;assert.notEqual(trialKey(),a);
  Game.upgrades.car.engine=0;Game.playerVehicle='truck';assert.notEqual(trialKey(),a);
`);
check('solo time trials require all laps and do not award career cash, lives or points',`
  setup();const p=car();Game.player=p;Game.eventType='trial';Game.arenaChoice='circuit';Game.cash=123;Game.lives=2;Game.score=42;
  initTimeTrial();checkLevelEnd();assert.equal(Game.state,'playing');
  Game.raceTime=10;p.finished=true;p.finishTime=10;p.lapTimes=[3,3,4];
  let saved;localStorage.setItem=(k,s)=>saved=s;checkLevelEnd();
  assert.equal(Game.state,'roundwon');assert.equal(Game.cash,123);assert.equal(Game.lives,2);assert.equal(Game.score,42);assert.equal(Game.championship.rounds,0);
  const ghost=JSON.parse(saved);assert.equal(ghost.time,10);assert.equal(ghost.samples[0][0],0);assert.equal(ghost.samples.at(-1)[0],10);
`);
check('slower attempts keep the faster ghost and storage failure still finishes the trial',`
  setup();Game.player=car();Game.eventType='trial';initTimeTrial();Game.trial.best={time:8,samples:[]};
  Game.player.finished=true;Game.player.finishTime=10;Game.raceTime=10;let saves=0;localStorage.setItem=()=>saves++;
  completeTimeTrial();assert.equal(saves,0);assert.equal(Game.lastBreakdown.newBest,false);
  Game.trial.best=null;localStorage.setItem=()=>{throw Error('full');};completeTimeTrial();assert.equal(Game.lastBreakdown.saved,false);assert.equal(Game.state,'roundwon');
`);
check('time-trial retries never spend lives',`
  Game.eventType='trial';Game.state='gameover';Game.lives=0;let round;go=r=>round=r;
  $('retryBtn').listeners.click();assert.equal(round,Game.round);assert.equal(Game.lives,0);
`);
check('pausing stops recovery, ghost recording and replay advancement',`
  setup();Game.player=car();Game.eventType='trial';initTimeTrial();Game.paused=true;
  input.recover=true;updateRecovery(1);updateRaceProgress(1);assert.equal(Game.recoveryHold,0);assert.equal(Game.trial.samples.length,1);assert.equal(Game.raceTime,0);
`);
check('a millisecond tie keeps the existing ghost rather than replacing it',`
  setup();Game.player=car();Game.eventType='trial';initTimeTrial();Game.trial.best={time:10,samples:[]};
  Game.player.finished=true;Game.player.finishTime=9.999999999;Game.raceTime=10;
  let saves=0;localStorage.setItem=()=>saves++;completeTimeTrial();assert.equal(saves,0);assert.equal(Game.lastBreakdown.newBest,false);
`);
