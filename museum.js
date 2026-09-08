import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------- Exhibit manifest ----------
const EXHIBITS = [
  { id:'lucky-cat', mat:'gold', file:'lucky-cat.glb', title:'Lucky Cat Robot', desc:'Maneki-neko automaton, gold and ivory. The good luck machine - Lucky Cat Robot Co., Chicago, 2026.', anim:'rock', scale:1.0 },
  { id:'mammoth', mat:'bronze', file:'mammoth.glb', title:'Woolly Mammoth', desc:'Mammuthus primigenius. Icon of the deep past, rebuilt by the machines of the near future.', anim:'sway', scale:1.0 },
  { id:'trex', mat:'obsidian', file:'trex.glb', title:'Tyrannosaurus Rex', desc:'The tyrant lizard king, sixty-six million years young and still accelerating.', anim:'sway', scale:1.0 },
  { id:'rocket', mat:'silver', file:'rocket.glb', title:'Acceleration One', desc:'Retro-futurist orbital rocket. Growth is good. More energy, more compute, more life.', anim:'hover', scale:1.0 },
  { id:'humanoid', mat:'pearl', file:'humanoid.glb', title:'The Successor', desc:'General-purpose humanoid. The next pair of hands humanity builds will not be hands at all.', anim:'breathe', scale:1.0 },
  { id:'satellite', mat:'copper', file:'satellite.glb', title:'Signal No. 1', desc:'Vintage satellite, beaming culture back to Earth. CYBERIA - signals from the wired world.', anim:'spin', scale:1.0 },
];

// ---------- Renderer / scene ----------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
{ const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; }
scene.background = new THREE.Color(0x101014);
scene.fog = new THREE.Fog(0x101014, 30, 95);

const camera = new THREE.PerspectiveCamera(62, innerWidth/innerHeight, .1, 300);
camera.position.set(0, 1.7, 26);

// ---------- Lights ----------
scene.add(new THREE.HemisphereLight(0xfff3dd, 0x1c1a18, 0.55));
const oculus = new THREE.SpotLight(0xffe9c4, 900, 60, Math.PI/7, 0.45, 1.6);
oculus.position.set(0, 17.5, 0);
oculus.castShadow = true;
oculus.shadow.mapSize.set(1024, 1024);
scene.add(oculus);
oculus.target.position.set(0,0,0); scene.add(oculus.target);
const warm = [];
for (let i=0;i<8;i++){
  const a = i/8*Math.PI*2;
  const p = new THREE.PointLight(0xffd9a0, 60, 30, 1.8);
  p.position.set(Math.cos(a)*15, 6.2, Math.sin(a)*15);
  scene.add(p); warm.push(p);
}

// ---------- Procedural textures ----------
function canvasTex(draw, w=512, h=512, repeat=[1,1]){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  draw(c.getContext('2d'), w, h);
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(...repeat);
  t.anisotropy=8; t.colorSpace=THREE.SRGBColorSpace;
  return t;
}
const marbleTex = canvasTex((g,w,h)=>{
  g.fillStyle='#ded8cc'; g.fillRect(0,0,w,h);
  for(let i=0;i<70;i++){
    g.strokeStyle=`rgba(${120+Math.random()*40|0},${115+Math.random()*40|0},${105+Math.random()*40|0},${.06+Math.random()*.12})`;
    g.lineWidth=Math.random()*2.2+.3; g.beginPath();
    let x=Math.random()*w,y=Math.random()*h; g.moveTo(x,y);
    for(let j=0;j<5;j++){x+=(Math.random()-.5)*160;y+=(Math.random()-.5)*160;g.lineTo(x,y);}
    g.stroke();
  }
},512,512,[8,8]);
const wallTex = canvasTex((g,w,h)=>{
  g.fillStyle='#2e2a26'; g.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){g.fillStyle=`rgba(255,240,210,${Math.random()*.03})`;g.fillRect(Math.random()*w,Math.random()*h,2,2);}
},512,512,[6,2]);
const plaqueTex = canvasTex((g,w,h)=>{
  g.fillStyle='#2b2113'; g.fillRect(0,0,w,h);
  g.strokeStyle='#c9a227'; g.lineWidth=6; g.strokeRect(10,10,w-20,h-20);
},256,128);

const MAT = {
  marble: new THREE.MeshStandardMaterial({ map:marbleTex, roughness:.28, metalness:.05 }),
  wall:   new THREE.MeshStandardMaterial({ map:wallTex, roughness:.9 }),
  stone:  new THREE.MeshStandardMaterial({ color:0xcfc8ba, roughness:.5 }),
  darkstone: new THREE.MeshStandardMaterial({ color:0x8f867a, roughness:.6 }),
  gold:   new THREE.MeshStandardMaterial({ color:0xc9a227, roughness:.25, metalness:.9 }),
  plaque: new THREE.MeshStandardMaterial({ map:plaqueTex, roughness:.4, metalness:.4 }),
};

// ---------- Architecture: rotunda ----------
const R = 22, WALL_H = 9;
const floor = new THREE.Mesh(new THREE.CircleGeometry(R+8, 72), MAT.marble);
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);

// center medallion
const medallion = new THREE.Mesh(new THREE.CircleGeometry(6, 48), new THREE.MeshStandardMaterial({ color:0x7a1f1f, roughness:.4 }));
medallion.rotation.x = -Math.PI/2; medallion.position.y = .005; scene.add(medallion);
const medRing = new THREE.Mesh(new THREE.RingGeometry(6, 6.4, 48), MAT.gold);
medRing.rotation.x = -Math.PI/2; medRing.position.y = .01; scene.add(medRing);

// outer wall
const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, WALL_H, 72, 1, true), MAT.wall);
wall.position.y = WALL_H/2; wall.material.side = THREE.BackSide; scene.add(wall);

// dome
const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 24, 0, Math.PI*2, 0, Math.PI/2), MAT.stone);
dome.material = MAT.stone.clone(); dome.material.side = THREE.BackSide;
dome.scale.y = .55; dome.position.y = WALL_H; scene.add(dome);
// oculus ring
const ocRing = new THREE.Mesh(new THREE.TorusGeometry(3.2, .28, 12, 40), MAT.gold);
ocRing.rotation.x = Math.PI/2; ocRing.position.y = WALL_H + R*.55 - .5; scene.add(ocRing);

// colonnade
function column(x,z,h=8.2,r=.55){
  const grp = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r*.85, r, h, 18), MAT.stone);
  shaft.position.y = h/2 + .5; shaft.castShadow = shaft.receiveShadow = true;
  const base = new THREE.Mesh(new THREE.BoxGeometry(r*2.6,.5,r*2.6), MAT.darkstone);
  base.position.y = .25;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(r*2.6,.45,r*2.6), MAT.darkstone);
  cap.position.y = h + .72;
  grp.add(shaft, base, cap); grp.position.set(x,0,z); return grp;
}
for (let i=0;i<12;i++){
  const a = i/12*Math.PI*2 + Math.PI/12;
  scene.add(column(Math.cos(a)*13.5, Math.sin(a)*13.5));
}

// entablature ring
const ent = new THREE.Mesh(new THREE.TorusGeometry(13.5, .5, 8, 60), MAT.stone);
ent.rotation.x = Math.PI/2; ent.position.y = 9.4; scene.add(ent);

// coffered ceiling band (simple gold ring pattern)
for (let i=0;i<3;i++){
  const ring = new THREE.Mesh(new THREE.TorusGeometry(17+i*1.7, .12, 6, 64), MAT.gold);
  ring.rotation.x = Math.PI/2; ring.position.y = 8.2 + i*.35; scene.add(ring);
}

// side gallery (hallway behind)
const hall = new THREE.Mesh(new THREE.BoxGeometry(14, 7.5, 34), MAT.wall);
hall.material = MAT.wall.clone(); hall.material.side = THREE.BackSide;
hall.position.set(0, 3.75, -(R+17)); scene.add(hall);
const hallFloor = new THREE.Mesh(new THREE.BoxGeometry(14, .1, 34), MAT.marble);
hallFloor.position.set(0, .05, -(R+17)); hallFloor.receiveShadow = true; scene.add(hallFloor);
// arch opening into hall
const arch = new THREE.Mesh(new THREE.TorusGeometry(3.6, .5, 10, 30, Math.PI), MAT.stone);
arch.position.set(0, 3.6, -R+.4); scene.add(arch);

// ---------- Pedestals + exhibits ----------
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const manager = new THREE.LoadingManager();
const progressEl = document.getElementById('progress');
let loadedCount = 0;
const exhibits = [];   // {group, cfg, baseY, mesh}
const raycastTargets = [];

function pedestal(x, z, tall=1.15, rad=1.0){
  const grp = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad*1.12, tall, 24), MAT.marble);
  body.position.y = tall/2; body.castShadow = body.receiveShadow = true;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(rad*1.15, rad*1.15, .12, 24), MAT.darkstone);
  top.position.y = tall + .06;
  const plq = new THREE.Mesh(new THREE.BoxGeometry(.72,.36,.04), MAT.plaque);
  plq.position.set(0, tall*.62, rad*1.12 + .02);
  grp.add(body, top, plq); grp.position.set(x, 0, z);
  return {grp, topY: tall + .12};
}

function placeModel(gltfScene, cfg, topY, grp){
  const model = gltfScene;
  // normalize: fit into 2.6m box, sit on pedestal
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const s = (2.6 / maxDim) * cfg.scale;
  model.scale.setScalar(s);
  const box2 = new THREE.Box3().setFromObject(model);
  const ctr = box2.getCenter(new THREE.Vector3());
  model.position.sub(ctr);
  model.position.y += (box2.max.y - box2.min.y)/2;
  const holder = new THREE.Group();
  holder.add(model);
  holder.position.y = topY;
  const FINE = {
    gold:   new THREE.MeshStandardMaterial({ color:0xd4af37, roughness:.22, metalness:1.0 }),
    bronze: new THREE.MeshStandardMaterial({ color:0x8c6a3f, roughness:.38, metalness:.95 }),
    obsidian: new THREE.MeshStandardMaterial({ color:0x1a1c22, roughness:.15, metalness:.6 }),
    silver: new THREE.MeshStandardMaterial({ color:0xc8ccd4, roughness:.18, metalness:1.0 }),
    pearl:  new THREE.MeshStandardMaterial({ color:0xe8e4da, roughness:.35, metalness:.25 }),
    copper: new THREE.MeshStandardMaterial({ color:0xb5673a, roughness:.3, metalness:.95 }),
    jade:   new THREE.MeshStandardMaterial({ color:0x2e8b74, roughness:.25, metalness:.1 }),
    crystal:new THREE.MeshPhysicalMaterial({ color:0x9fc8ff, roughness:.05, metalness:0, transmission:.6, thickness:1.2, ior:1.8 }),
  };
  model.traverse(o=>{ if(o.isMesh){ if(!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); o.castShadow=true; o.receiveShadow=true; if(cfg.mat){ o.material = FINE[cfg.mat]; } }});
  grp.add(holder);
  holder.userData.baseY = holder.position.y;
  return holder;
}

function loadExhibit(cfg, x, z, tall, rad){
  const {grp, topY} = pedestal(x, z, tall, rad);
  scene.add(grp);
  const entry = { cfg, grp, holder:null, t: Math.random()*10 };
  exhibits.push(entry);
  loader.load(cfg.file,
    gltf => { entry.holder = placeModel(gltf.scene, cfg, topY, grp); entry.holder.userData.cfg = cfg; raycastTargets.push(grp); loadedCount++; updateProgress(); },
    undefined,
    err => { // fallback marble bust placeholder
      const bust = new THREE.Group();
      const sph = new THREE.Mesh(new THREE.SphereGeometry(.55, 24, 18), MAT.stone);
      sph.position.y = 1.0; sph.scale.y = 1.25;
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.4,.55,.8,18), MAT.stone);
      cyl.position.y = .35;
      bust.add(sph, cyl); bust.position.y = topY;
      bust.traverse(o=>{if(o.isMesh)o.castShadow=true});
      grp.add(bust); entry.holder = bust; entry.holder.userData.cfg = cfg; raycastTargets.push(grp); loadedCount++; updateProgress();
    });
}

function updateProgress(){
  progressEl.textContent = `Hanging the exhibits… ${loadedCount} / ${EXHIBITS.length}`;
}

// rotunda centerpiece + ring
loadExhibit(EXHIBITS[0], 0, 0, 1.5, 1.5);                    // lucky cat center
const ringR = 17.2;
for (let i=1;i<=5;i++){
  const a = (i-1)/5 * Math.PI*2 + Math.PI/5;
  loadExhibit(EXHIBITS[i], Math.cos(a)*ringR, Math.sin(a)*ringR, 1.15, 1.0);
}
// hall exhibit: the Acceleration Diamond (cut in-house)
(function(){
  const {grp, topY} = pedestal(0, -(R+16), 1.3, 1.1);
  scene.add(grp);
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(.8, 0),
    new THREE.MeshPhysicalMaterial({ color:0x9fc8ff, roughness:.05, metalness:0, transmission:.65, thickness:1.4, ior:1.8 })
  );
  gem.scale.y = 1.5; gem.castShadow = true;
  const holder = new THREE.Group(); holder.add(gem); holder.position.y = topY + .9;
  grp.add(holder);
  const entry = { cfg:{ id:'diamond', title:'The Acceleration Diamond', desc:'A gem cut by pressure and time - the two ingredients of every great leap.', anim:'spin', scale:1 }, grp, holder, t:0 };
  exhibits.push(entry); raycastTargets.push(grp);
  const glint = new THREE.PointLight(0xbfd9ff, 25, 8, 2); glint.position.set(0, topY+1.6, -(R+16)); scene.add(glint);
})();

// ---------- Animation ----------
const clock = new THREE.Clock();
const flame = new THREE.PointLight(0xff7a2a, 0, 8, 2);
scene.add(flame);
let flameSprite;
function makeFlame(holder){
  const geo = new THREE.ConeGeometry(.28, .9, 12);
  const mat = new THREE.MeshBasicMaterial({ color:0xff8c3a, transparent:true, opacity:.85 });
  const cone = new THREE.Mesh(geo, mat);
  cone.rotation.x = Math.PI; cone.position.y = -.35;
  holder.add(cone); return cone;
}

function animateExhibits(dt, t){
  for (const e of exhibits){
    if (!e.holder) continue;
    e.t += dt;
    const h = e.holder;
    switch(e.cfg.anim){
      case 'rock': h.rotation.y += dt*.5; h.rotation.z = Math.sin(e.t*2.2)*.06; break;
      case 'sway': h.rotation.y += dt*.35; h.rotation.x = Math.sin(e.t*1.1)*.02; break;
      case 'spin': h.rotation.y += dt*1.2; break;
      case 'breathe': { const s = 1 + Math.sin(e.t*1.6)*.012; h.scale.set(s,s,s); h.rotation.y += dt*.4; break; }
      case 'hover': {
        h.rotation.y += dt*.6;
        if (h.userData.baseY === undefined) h.userData.baseY = h.position.y;
        h.position.y = h.userData.baseY + Math.sin(e.t*2)*.18;
        break; }
    }
  }
}

// ---------- Controls ----------
const controls = new PointerLockControls(camera, renderer.domElement);
const overlay = document.getElementById('overlay');
const hint = document.getElementById('hint');
let dragMode = false, yaw = 0, pitch = 0;
camera.rotation.order = 'YXZ';
document.getElementById('enter').addEventListener('click', ()=>{
  try { controls.lock(); } catch(e) {}
  setTimeout(()=>{
    if (!controls.isLocked){
      dragMode = true;
      const e = camera.rotation; yaw = e.y; pitch = e.x;
      overlay.classList.add('hidden');
      hint.textContent = 'DRAG TO LOOK · W A S D TO WALK · CLICK AN EXHIBIT TO INSPECT';
      hint.classList.add('show'); setTimeout(()=>hint.classList.remove('show'), 6000);
    }
  }, 400);
});
let dragStart = null;
renderer.domElement.addEventListener('pointerdown', e=>{ if (dragMode && !controls.isLocked) dragStart = {x:e.clientX, y:e.clientY, yaw, pitch, moved:false}; });
addEventListener('pointermove', e=>{
  if (!dragStart) return;
  const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
  if (Math.abs(dx)+Math.abs(dy) > 4) dragStart.moved = true;
  yaw = dragStart.yaw - dx * 0.0032;
  pitch = THREE.MathUtils.clamp(dragStart.pitch - dy * 0.0032, -1.4, 1.4);
  camera.rotation.set(pitch, yaw, 0);
});
addEventListener('pointerup', ()=>{ dragStart = null; });
controls.addEventListener('lock', ()=>{ overlay.classList.add('hidden'); hint.classList.add('show'); setTimeout(()=>hint.classList.remove('show'), 6000); });
controls.addEventListener('unlock', ()=>{ if(!touring) overlay.classList.remove('hidden'); });

const keys = {};
addEventListener('keydown', e=>keys[e.code]=true);
addEventListener('keyup', e=>keys[e.code]=false);

function movePlayer(dt){
  const sp = (keys.ShiftLeft? 9: 4.5) * dt;
  const f = new THREE.Vector3(); camera.getWorldDirection(f); f.y=0; f.normalize();
  const r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0,1,0));
  if (keys.KeyW) camera.position.addScaledVector(f, sp);
  if (keys.KeyS) camera.position.addScaledVector(f, -sp);
  if (keys.KeyA) camera.position.addScaledVector(r, -sp);
  if (keys.KeyD) camera.position.addScaledVector(r, sp);
  camera.position.y = 1.7;
  // keep inside rotunda + hall
  const p = camera.position;
  const inHall = Math.abs(p.x) < 6.2 && p.z < -(R-3) && p.z > -(R+32);
  if (!inHall){
    const d = Math.hypot(p.x, p.z);
    if (d > R-1.2){ p.x *= (R-1.2)/d; p.z *= (R-1.2)/d; }
  } else {
    p.x = THREE.MathUtils.clamp(p.x, -6.2, 6.2);
    p.z = THREE.MathUtils.clamp(p.z, -(R+32), p.z);
  }
}

// ---------- Inspect on click ----------
const ray = new THREE.Raycaster();
const plaque = document.getElementById('plaque');
let focusTween = null, savedCam = null, touring=false;

function showPlaque(cfg){ document.getElementById('ptitle').textContent = cfg.title; document.getElementById('pdesc').textContent = cfg.desc; plaque.classList.add('show'); }
function hidePlaque(){ plaque.classList.remove('show'); }

// simpler inspect: walk up to exhibit group
function findExhibitRoot(obj){
  while (obj){ if (exhibits.some(e=>e.grp===obj)) return obj; obj = obj.parent; } return null;
}
renderer.domElement.addEventListener('click', (ev)=>{
  if (!controls.isLocked && !dragMode) return;
  if (dragStart && dragStart.moved) return;
  if (controls.isLocked) ray.setFromCamera(new THREE.Vector2(0,0), camera);
  else ray.setFromCamera(new THREE.Vector2((ev.clientX/innerWidth)*2-1, -(ev.clientY/innerHeight)*2+1), camera);
  const hits = ray.intersectObjects(raycastTargets, true);
  if (!hits.length || hits[0].distance > 14) { hidePlaque(); return; }
  const root = findExhibitRoot(hits[0].object);
  if (!root) return;
  const entry = exhibits.find(e=>e.grp===root);
  showPlaque(entry.cfg);
  clearTimeout(entry._pt); entry._pt = setTimeout(hidePlaque, 6000);
});

// ---------- Guided tour ----------
const tourBtn = document.getElementById('tour');
let tourState = null;
tourBtn.addEventListener('click', ()=>{
  if (tourState){ tourState=null; overlay.classList.remove('hidden'); return; }
  overlay.classList.add('hidden');
  controls.unlock(); touring = true; hidePlaque();
  const wp = exhibits.filter(e=>e.holder).map(e=>{
    const p = new THREE.Vector3(); e.grp.getWorldPosition(p);
    return p;
  });
  tourState = { i:0, t:0, wp };
});
function runTour(dt){
  if (!tourState) return;
  tourState.t += dt;
  const seg = 6;
  const i = Math.floor(tourState.t / seg) % tourState.wp.length;
  const j = (i+1) % tourState.wp.length;
  const k = (tourState.t % seg) / seg;
  const a = tourState.wp[i], b = tourState.wp[j];
  const from = new THREE.Vector3(a.x*0.45, 2.6, a.z*0.45);
  const to = new THREE.Vector3(b.x*0.45, 2.6, b.z*0.45);
  camera.position.lerpVectors(from, to, THREE.MathUtils.smoothstep(k,0,1));
  camera.lookAt(a.x, 2.0, a.z);
  const entry = exhibits.filter(e=>e.holder)[i];
  if (entry) showPlaque(entry.cfg);
}

// ---------- Loop ----------
window.__cam = camera; window.__exhibits = exhibits;
function tick(){
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), .05);
  animateExhibits(dt, clock.elapsedTime);
  if (tourState) runTour(dt);
  else if (controls.isLocked || dragMode) movePlayer(dt);
  // rocket flame flicker
  for (const e of exhibits){
    if (e.cfg.anim==='hover' && e.holder && !e.holder.userData.flame){
      e.holder.userData.flame = makeFlame(e.holder);
      e.holder.userData.baseY = e.holder.position.y;
    }
    if (e.holder?.userData.flame){
      const fl = e.holder.userData.flame;
      fl.scale.setScalar(.9 + Math.random()*.3);
      const wp = new THREE.Vector3(); fl.getWorldPosition(wp);
      flame.position.copy(wp); flame.intensity = 20 + Math.random()*15;
    }
  }
  renderer.render(scene, camera);
}
tick();
addEventListener('resize', ()=>{ camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
