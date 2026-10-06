/* Desk Floor 3D — robots at chalkboards, information packets flowing between them.
   Reads window.__DESK__ = { seats: {key: {status, summary, last, dur, tools, mode}}, running: [keys], nowMode } (filled by the page's data script). */
(function(){
  if (!window.THREE) { var n=document.getElementById('scene3d-note'); if(n) n.textContent='3D view unavailable (library blocked).'; return; }
  var THREE=window.THREE;
  var host=document.getElementById('scene3d'); if(!host) return;
  var reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- layout: where each seat sits (x, z) and the information edges
  var SEATS=[
    {k:'screener',    name:'Screener',           x:-8,  z:-6},
    {k:'macro',       name:'Macro / Regime',     x:-4,  z:-6},
    {k:'technical',   name:'Technical',          x: 0,  z:-6},
    {k:'catalyst',    name:'Catalyst / News',    x: 4,  z:-6},
    {k:'smart-money', name:'Smart Money & Power',x: 8,  z:-6},
    {k:'head-trader', name:'Head Trader',        x:-2,  z: 0},
    {k:'risk',        name:'Risk Manager',       x: 4,  z: 0},
    {k:'execution',   name:'Execution',          x:-4,  z: 6},
    {k:'coach',       name:'Coach',              x: 4,  z: 6}
  ];
  var EDGES=[['screener','macro'],['screener','technical'],['screener','catalyst'],['screener','smart-money'],
             ['macro','head-trader'],['technical','head-trader'],['catalyst','head-trader'],['smart-money','head-trader'],
             ['head-trader','risk'],['risk','head-trader'],['head-trader','execution'],['execution','coach'],['coach','head-trader'],['execution','market'],['market','execution']];
  var COL={idle:0x55606f, running:0x4aa3ff, done:0x3ec38a, refused:0xef5f5f, chalk:'#e9efe6', board:'#1e3a2e', accent:0xf0a83a};

  // ---- renderer / scene / camera
  var W=host.clientWidth, H=Math.max(420, Math.min(620, Math.round(W*0.56)));
  var renderer=new THREE.WebGLRenderer({antialias:true, alpha:false}); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1)); renderer.setSize(W,H); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.insertBefore(renderer.domElement, host.firstChild); renderer.domElement.style.display='block'; renderer.domElement.style.borderRadius='10px';
  var scene=new THREE.Scene(); scene.background=new THREE.Color(0x0b0e13); scene.fog=new THREE.Fog(0x0b0e13, 26, 48);
  var camera=new THREE.PerspectiveCamera(42, W/H, 0.1, 100);
  var orbit={az:0.0, el:0.62, r:24, tx:0, ty:0.8, tz:0};
  function placeCam(){ camera.position.set(orbit.tx+orbit.r*Math.cos(orbit.el)*Math.sin(orbit.az), orbit.ty+orbit.r*Math.sin(orbit.el), orbit.tz+orbit.r*Math.cos(orbit.el)*Math.cos(orbit.az)); camera.lookAt(orbit.tx,orbit.ty,orbit.tz); }
  placeCam();
  scene.add(new THREE.HemisphereLight(0xaab4c8, 0x202830, 0.75));
  var key=new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(8,14,6); key.castShadow=true; key.shadow.mapSize.set(1024,1024); key.shadow.camera.left=-16; key.shadow.camera.right=16; key.shadow.camera.top=16; key.shadow.camera.bottom=-16; scene.add(key);
  var floor=new THREE.Mesh(new THREE.PlaneGeometry(40,30), new THREE.MeshStandardMaterial({color:0x141a22, roughness:0.95})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
  var grid=new THREE.GridHelper(40, 40, 0x263040, 0x1c2430); grid.position.y=0.01; scene.add(grid);
  var wall=new THREE.Mesh(new THREE.PlaneGeometry(40,10), new THREE.MeshStandardMaterial({color:0x10151c, roughness:1})); wall.position.set(0,5,-15); scene.add(wall);
  // market board (the exchange) on the back wall
  var mkt={canvas:document.createElement('canvas')}; mkt.canvas.width=1024; mkt.canvas.height=256; mkt.ctx=mkt.canvas.getContext('2d'); mkt.tex=new THREE.CanvasTexture(mkt.canvas);
  var mktMesh=new THREE.Mesh(new THREE.PlaneGeometry(12,3), new THREE.MeshBasicMaterial({map:mkt.tex})); mktMesh.position.set(0,6.2,-14.9); scene.add(mktMesh);
  var mktFrame=new THREE.Mesh(new THREE.BoxGeometry(12.3,3.3,0.1), new THREE.MeshStandardMaterial({color:0x1c2430})); mktFrame.position.set(0,6.2,-14.96); scene.add(mktFrame);
  var MARKET_ANCHOR=new THREE.Vector3(0,5.2,-14.6);
  function drawMarket(lines, flash){ var c=mkt.canvas, x=mkt.ctx; x.fillStyle=flash?'#1a2a1e':'#0a0d12'; x.fillRect(0,0,c.width,c.height); x.fillStyle='#f0a83a'; x.font='bold 40px JetBrains Mono, monospace'; x.fillText('MARKET  ·  NYSE / NASDAQ  ·  paper', 30, 56);
    x.font='34px JetBrains Mono, monospace'; (lines||['closed — demo replay available']).slice(0,4).forEach(function(l,i){ x.fillStyle=i===0?'#e9efe6':'#aab4c8'; x.fillText(l, 30, 110+i*44) }); mkt.tex.needsUpdate=true; }
  drawMarket();

  // ---- chalkboard texture
  function wrap(ctx, text, maxW){ var words=String(text||'').split(/\s+/), lines=[], cur=''; words.forEach(function(w){ var t=cur?cur+' '+w:w; if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=w}else cur=t }); if(cur) lines.push(cur); return lines; }
  function makeBoard(){ var c=document.createElement('canvas'); c.width=640; c.height=360; var tex=new THREE.CanvasTexture(c); tex.anisotropy=4; return {canvas:c, ctx:c.getContext('2d'), tex:tex}; }
  function drawBoard(b, seat, st, tick){ var ctx=b.ctx, c=b.canvas; ctx.fillStyle=COL.board; ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=14; ctx.strokeRect(7,7,c.width-14,c.height-14);
    ctx.fillStyle=COL.chalk; ctx.font='bold 30px JetBrains Mono, monospace'; ctx.fillText(seat.name.toUpperCase(), 34, 56);
    ctx.font='22px JetBrains Mono, monospace'; ctx.fillStyle='#bcd3c3'; ctx.fillText((st.status||'idle').toUpperCase()+(st.mode?'  ·  '+st.mode:'')+(st.last?'  ·  '+st.last:''), 34, 90);
    ctx.strokeStyle='#bcd3c3'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(34,104); ctx.lineTo(c.width-34,104); ctx.stroke();
    ctx.fillStyle=COL.chalk; ctx.font='24px Archivo, sans-serif';
    var text=st.status==='running'?(st.summary&&st.summary!=='Waiting for its turn.'?st.summary:'working…'):(st.summary||'Waiting for its turn.');
    var lines=[]; String(text).split('\n').forEach(function(seg){ lines=lines.concat(wrap(ctx, seg, c.width-68)) }); lines=lines.slice(0,7); lines.forEach(function(l,i){ ctx.fillText(l, 34, 140+i*30) });
    if(st.status==='running'){ var n=(Math.floor(tick/12)%4); ctx.fillText('writing'+'.'.repeat(n), 34, c.height-40); var x=34+((tick*6)%(c.width-100)); ctx.fillRect(x, c.height-24, 40, 3); }
    else if(st.tools!=null){ ctx.font='20px JetBrains Mono, monospace'; ctx.fillStyle='#bcd3c3'; ctx.fillText('tools '+st.tools+'   took '+(st.dur||'—'), 34, c.height-32); }
    b.tex.needsUpdate=true; }

  // ---- robot
  function makeRobot(seat){ var g=new THREE.Group(); var body=new THREE.MeshStandardMaterial({color:0x3b4656, metalness:0.35, roughness:0.55});
    var torso=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.1,0.55), body); torso.position.y=1.35; torso.castShadow=true; g.add(torso);
    var head=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.6,0.6), body); head.position.y=2.25; head.castShadow=true; g.add(head);
    var eyeMat=new THREE.MeshStandardMaterial({color:0x222222, emissive:COL.idle, emissiveIntensity:1});
    var e1=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.1,0.05), eyeMat); e1.position.set(-0.17,2.3,0.31); var e2=e1.clone(); e2.position.x=0.17; g.add(e1); g.add(e2);
    var ant=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.4,8), body); ant.position.set(0,2.75,0); g.add(ant);
    var bulb=new THREE.Mesh(new THREE.SphereGeometry(0.09,12,12), new THREE.MeshStandardMaterial({color:0x111111, emissive:COL.accent, emissiveIntensity:0.6})); bulb.position.set(0,2.97,0); g.add(bulb);
    var legs=new THREE.Mesh(new THREE.BoxGeometry(0.75,0.8,0.5), body); legs.position.y=0.4; legs.castShadow=true; g.add(legs);
    var armL=new THREE.Group(); var a1=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.9,10), body); a1.position.y=-0.45; armL.add(a1); armL.position.set(-0.6,1.8,0); g.add(armL);
    var armR=new THREE.Group(); var a2=a1.clone(); armR.add(a2); armR.position.set(0.6,1.8,0); g.add(armR);
    var chalk=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.25,8), new THREE.MeshStandardMaterial({color:0xf2f2e8})); chalk.position.set(0,-0.95,0); armR.add(chalk);
    g.userData={eyes:eyeMat, armL:armL, armR:armR, bulb:bulb, seat:seat}; return g; }

  // ---- stations
  var stations={}, pickables=[];
  SEATS.forEach(function(s){ var st=new THREE.Group(); st.position.set(s.x,0,s.z);
    var desk=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.12,1.1), new THREE.MeshStandardMaterial({color:0x5a4634, roughness:0.8})); desk.position.set(0,0.95,1.1); desk.castShadow=true; desk.receiveShadow=true; st.add(desk);
    [-1.15,1.15].forEach(function(x){ var leg=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.9,0.1), new THREE.MeshStandardMaterial({color:0x2f2620})); leg.position.set(x,0.47,1.1); st.add(leg); });
    var b=makeBoard(); var boardMesh=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.8), new THREE.MeshBasicMaterial({map:b.tex})); boardMesh.position.set(0,2.45,-0.9); st.add(boardMesh);
    var frame=new THREE.Mesh(new THREE.BoxGeometry(3.4,2.0,0.08), new THREE.MeshStandardMaterial({color:0x6b5033})); frame.position.set(0,2.45,-0.95); st.add(frame);
    [-1.45,1.45].forEach(function(x){ var post=new THREE.Mesh(new THREE.BoxGeometry(0.08,2.6,0.08), new THREE.MeshStandardMaterial({color:0x3a2b1e})); post.position.set(x,1.3,-0.95); st.add(post); });
    var robot=makeRobot(s); robot.position.set(0,0,0.15); st.add(robot); pickables.push(robot);
    // name label (sprite)
    var lc=document.createElement('canvas'); lc.width=512; lc.height=96; var lctx=lc.getContext('2d'); lctx.font='bold 44px Archivo, sans-serif'; lctx.fillStyle='#f0a83a'; lctx.textAlign='center'; lctx.fillText(s.name, 256, 62);
    var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(lc), transparent:true})); sp.scale.set(3.6,0.68,1); sp.position.set(0,3.75,-0.9); st.add(sp);
    var ring=new THREE.Mesh(new THREE.RingGeometry(1.6,1.75,48), new THREE.MeshBasicMaterial({color:COL.running, transparent:true, opacity:0, side:THREE.DoubleSide})); ring.rotation.x=-Math.PI/2; ring.position.y=0.02; st.add(ring);
    scene.add(st); stations[s.k]={group:st, board:b, boardMesh:boardMesh, robot:robot, ring:ring, lastKey:'', anchor:new THREE.Vector3(s.x,1.6,s.z-0.4)}; drawBoard(b, s, {status:'idle'}, 0); });

  // ---- information packets along arcs
  stations['market']={anchor:MARKET_ANCHOR};
  var packets=[]; var packetGeo=new THREE.SphereGeometry(0.11,10,10);
  EDGES.forEach(function(e){ var a=stations[e[0]].anchor, b=stations[e[1]].anchor; var mid=a.clone().add(b).multiplyScalar(0.5); mid.y+=2.2+Math.min(3, a.distanceTo(b)*0.18);
    var curve=new THREE.QuadraticBezierCurve3(a,mid,b); var line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), new THREE.LineBasicMaterial({color:0x2a3646, transparent:true, opacity:0.9})); scene.add(line);
    for(var i=0;i<3;i++){ var m=new THREE.Mesh(packetGeo, new THREE.MeshBasicMaterial({color:0x4aa3ff, transparent:true, opacity:0.35})); scene.add(m); packets.push({mesh:m, curve:curve, t:i/3, from:e[0], to:e[1], line:line}); } });

  // ---- interaction: orbit + pick
  var dragging=false, lx=0, ly=0, moved=0, el=renderer.domElement; el.style.touchAction='none';
  el.addEventListener('pointerdown', function(ev){ dragging=true; moved=0; lx=ev.clientX; ly=ev.clientY; el.setPointerCapture(ev.pointerId) });
  el.addEventListener('pointermove', function(ev){ if(!dragging) return; var dx=ev.clientX-lx, dy=ev.clientY-ly; lx=ev.clientX; ly=ev.clientY; moved+=Math.abs(dx)+Math.abs(dy); orbit.az-=dx*0.006; orbit.el=Math.max(0.15, Math.min(1.35, orbit.el+dy*0.005)); placeCam() });
  el.addEventListener('pointerup', function(ev){ dragging=false; if(moved<6) pick(ev) }); el.addEventListener('pointercancel', function(){dragging=false});
  el.addEventListener('wheel', function(ev){ ev.preventDefault(); orbit.r=Math.max(10, Math.min(40, orbit.r+ev.deltaY*0.02)); placeCam() }, {passive:false});
  var ray=new THREE.Raycaster(), ndc=new THREE.Vector2(), panel=document.getElementById('scene3d-panel');
  function pick(ev){ var r=el.getBoundingClientRect(); ndc.set(((ev.clientX-r.left)/r.width)*2-1, -((ev.clientY-r.top)/r.height)*2+1); ray.setFromCamera(ndc, camera); var hits=ray.intersectObjects(pickables, true); if(!hits.length){ if(panel) panel.hidden=true; return }
    var o=hits[0].object; while(o && !(o.userData&&o.userData.seat)) o=o.parent; if(!o) return; var s=o.userData.seat; var st=(window.__DESK__&&window.__DESK__.seats&&window.__DESK__.seats[s.k])||{};
    if(panel){ panel.hidden=false; panel.innerHTML='<div class="p-name">'+s.name+'</div><div class="p-st '+(st.status||'idle')+'">'+(st.status||'idle')+(st.mode?' · '+st.mode:'')+'</div><div class="p-sum">'+(st.summary||'Waiting for its turn.').replace(/</g,'&lt;')+'</div><div class="p-meta">last '+(st.last||'—')+' · took '+(st.dur||'—')+' · tools '+(st.tools==null?'—':st.tools)+'</div>'; } }


  // ---- trade sequence engine: plays an order's life through the robots (used by the demo replay and by live ledger rows)
  var override={}, seq=null, ticket=document.getElementById('ticket'), ticketLines=document.getElementById('ticket-lines'), eqTile=document.getElementById('t-eq');
  function say(seat, text){ override[seat]=text; var S=stations[seat]; if(S&&S.board){ S.lastKey=''; } }
  function tl(line, cls){ if(!ticketLines) return; var li=document.createElement('li'); li.className=cls||''; li.textContent=line; ticketLines.appendChild(li); ticketLines.scrollTop=ticketLines.scrollHeight; }
  function burst(from,to){ packets.forEach(function(p){ if(p.from===from&&p.to===to){ p.hot=120; p.t=0; } }); }
  function playTrade(T){ if(seq) return; var steps=[], eq0=T.equity_start, eq=eq0;
    if(ticket){ ticket.hidden=false; ticketLines.innerHTML=''; document.getElementById('ticket-title').textContent=(T.demo?'DEMO REPLAY · ':'LIVE · ')+T.symbol+' '+T.side.toUpperCase(); }
    steps.push({d:90, run:['head-trader'], f:function(){ say('head-trader','ORDER → Execution: '+T.side.toUpperCase()+' '+T.symbol+'  risk '+T.risk_pct+'%  entry '+T.entry+'  stop '+T.stop+'  T1 '+T.t1+(T.t2?'  T2 '+T.t2:'')); tl('Head Trader → Execution: '+T.side+' '+T.symbol+' risk '+T.risk_pct+'% · entry '+T.entry+' · stop '+T.stop+' · T1 '+T.t1); burst('head-trader','execution'); }});
    steps.push({d:150, run:['execution'], f:function(){ say('execution','GUARDS: risk '+T.risk_pct+'% of $'+eq0.toFixed(2)+' = $'+(eq0*T.risk_pct/100).toFixed(2)+' → '+(T.clipped?('cash clip → '+T.qty+' sh ($'+(T.qty*T.fill).toFixed(0)+')'):(T.qty+' sh'))+'  eff. risk '+T.eff_risk+'%  ✓ open risk ≤ 10%  ✓ floor room $'+(eq0-T.floor).toFixed(0)+'  → SEND'); tl('Execution guards: '+(T.clipped?'clipped to '+T.qty+' sh (cash) · ':'')+'effective risk '+T.eff_risk+'% · floor ok · SEND','ok'); }});
    steps.push({d:120, run:['execution'], f:function(){ burst('execution','market'); drawMarket([T.symbol+'  '+T.fill.toFixed(2)+'   bid '+(T.fill-0.01).toFixed(2)+'  ask '+T.fill.toFixed(2), 'order: '+T.side+' '+T.qty+' '+T.symbol+' limit '+T.limit], true); }});
    steps.push({d:110, run:['execution'], f:function(){ burst('market','execution'); drawMarket([T.symbol+'  '+T.fill.toFixed(2)+'   FILLED '+T.qty+' @ '+T.fill.toFixed(2), 'stop '+T.stop+' armed · take-profit '+T.t1], true); say('execution','FILLED '+T.qty+' '+T.symbol+' @ '+T.fill+'  notional $'+(T.qty*T.fill).toFixed(2)+'\nstop '+T.stop+' armed · T1 '+T.t1+(T.t2?' · T2 '+T.t2:'')); tl('FILLED '+T.qty+' @ '+T.fill+' · stop '+T.stop+' armed','ok'); }});
    var path=T.path||[]; path.forEach(function(ev){
      steps.push({d:ev.d||110, run:[], f:function(){ drawMarket([T.symbol+'  '+ev.px.toFixed(2)+'  '+(ev.px>=T.fill?'▲':'▼')+' '+((ev.px/T.fill-1)*100).toFixed(2)+'%', ev.label||''], ev.kind!=='tick'); if(ev.kind==='tick') return; burst('market','execution'); }});
      if(ev.kind==='scale'){ steps.push({d:130, run:['execution'], f:function(){ eq+=ev.pnl; say('execution','T1 HIT @ '+ev.px+'  → SCALE '+ev.qty+' sh  +$'+ev.pnl.toFixed(2)+'\nstop → breakeven '+T.fill); tl('T1 hit '+ev.px+' · scaled '+ev.qty+' sh · +$'+ev.pnl.toFixed(2)+' · stop to breakeven','ok'); setEq(eq); }}); }
      if(ev.kind==='exit'){ steps.push({d:140, run:['execution'], f:function(){ eq+=ev.pnl; say('execution',(ev.pnl>=0?'TARGET':'STOP')+' @ '+ev.px+'  → EXIT '+ev.qty+' sh  '+(ev.pnl>=0?'+':'−')+'$'+Math.abs(ev.pnl).toFixed(2)+'\nequity $'+eq.toFixed(2)); tl((ev.pnl>=0?'Exit at target ':'Stopped ')+ev.px+' · '+(ev.pnl>=0?'+':'−')+'$'+Math.abs(ev.pnl).toFixed(2)+' · equity $'+eq.toFixed(2), ev.pnl>=0?'ok':'bad'); setEq(eq); burst('execution','coach'); }}); }
    });
    steps.push({d:160, run:['coach'], f:function(){ var pf=eq-eq0; say('coach','JOURNALED '+T.symbol+': '+(pf>=0?'+':'−')+'$'+Math.abs(pf).toFixed(2)+' ('+((pf/eq0)*100).toFixed(2)+'%)  →  replay vs 5-min bars at 16:24'); tl('Coach: journaled · '+(pf>=0?'+':'−')+'$'+Math.abs(pf).toFixed(2)+' ('+((pf/eq0)*100).toFixed(2)+'%) · will be replayed against real bars at 16:24'); }});
    steps.push({d:200, run:[], f:function(){ tl(T.demo?'Demo replay finished. Real orders play here automatically from 09:40 ET.':'Order lifecycle complete.'); }});
    seq={steps:steps, i:-1, left:0, T:T}; }
  function setEq(v){ if(eqTile){ eqTile.textContent='$'+v.toFixed(2); eqTile.classList.add('pos'); } }
  function stepSeq(){ if(!seq) return; if(seq.left>0){ seq.left--; return } seq.i++; if(seq.i>=seq.steps.length){ seq=null; seqRun={}; override={}; Object.keys(stations).forEach(function(k){ if(stations[k].board) stations[k].lastKey=''; }); drawMarket(); return } var st=seq.steps[seq.i]; seqRun={}; st.run.forEach(function(k){seqRun[k]=true}); st.f(); seq.left=reduced?10:st.d; }
  var seqRun={};
  var DEMO={demo:true, symbol:'NU', side:'buy', risk_pct:5, entry:15.20, limit:15.37, fill:15.21, stop:14.72, t1:16.00, t2:16.40, qty:13.15, clipped:true, eff_risk:3.16, equity_start:200, floor:100,
    path:[{kind:'tick',px:15.33,d:50,label:'09:52 · holding above VWAP'},{kind:'tick',px:15.62,d:50,label:'10:20 · higher lows'},{kind:'scale',px:16.00,qty:6.58,pnl:5.20,label:'T1 16.00 printed'},{kind:'tick',px:16.21,d:50,label:'11:05 · stop at breakeven, risk-free'},{kind:'exit',px:16.40,qty:6.57,pnl:7.82,label:'T2 16.40 printed'}]};
  var btn=document.getElementById('demo-btn'); if(btn) btn.addEventListener('click', function(){ if(!seq) playTrade(DEMO); });
  window.__DESK__ = window.__DESK__ || {}; window.__DESK__.playTrade=playTrade;

  // ---- animation
  var tick=0, running={};
  function sync(){ var D=window.__DESK__||{}; running={}; (D.running||[]).forEach(function(k){running[k]=true});
    SEATS.forEach(function(s){ var st=(D.seats&&D.seats[s.k])||{status:'idle'}; var S=stations[s.k]; var isRun=!!running[s.k]||!!seqRun[s.k]; var status=isRun?'running':(st.status||'idle'); if(override[s.k]) st=Object.assign({}, st, {summary:override[s.k]});
      var keyStr=status+'|'+(st.summary||'')+'|'+(st.last||'')+'|'+(st.tools||'');
      S.robot.userData.eyes.emissive.setHex(COL[status]||COL.idle); S.ring.material.color.setHex(status==='refused'?COL.refused:COL.running);
      if(keyStr!==S.lastKey || isRun && tick%12===0){ drawBoard(S.board, s, {status:status, summary:st.summary, last:st.last, tools:st.tools, dur:st.dur, mode:st.mode}, tick); S.lastKey=keyStr; } }); }
  function frame(){ tick++; stepSeq(); if(tick%30===1||seq) sync();
    SEATS.forEach(function(s){ var S=stations[s.k], R=S.robot, isRun=!!running[s.k]||!!seqRun[s.k];
      if(isRun && !reduced){ R.userData.armR.rotation.x=-1.9+Math.sin(tick*0.25)*0.35; R.userData.armR.rotation.z=Math.sin(tick*0.5)*0.25; R.userData.armL.rotation.x=Math.sin(tick*0.1)*0.15; R.userData.eyes.emissiveIntensity=0.6+0.4*Math.abs(Math.sin(tick*0.15)); S.ring.material.opacity=0.35+0.3*Math.abs(Math.sin(tick*0.08)); R.position.y=Math.abs(Math.sin(tick*0.12))*0.04; }
      else { R.userData.armR.rotation.x+= (0-R.userData.armR.rotation.x)*0.1; R.userData.armR.rotation.z*=0.9; R.userData.armL.rotation.x*=0.9; R.userData.eyes.emissiveIntensity=1; S.ring.material.opacity=(running[s.k]?0.5:0); R.position.y=0; } });
    Object.keys(seqRun).forEach(function(k){ if(stations[k]&&stations[k].robot) stations[k].robot.userData.eyes.emissive.setHex(COL.running); });
    packets.forEach(function(p){ if(p.hot>0) p.hot--; var hot=running[p.from]||running[p.to]||p.hot>0; var speed=p.hot>0?0.02:(hot?0.012:0.003); if(!reduced){ p.t=(p.t+speed)%1; } var pos=p.curve.getPoint(p.t); p.mesh.position.copy(pos); p.mesh.material.opacity=hot?0.95:0.3; p.mesh.material.color.setHex(hot?COL.accent:0x4aa3ff); p.mesh.scale.setScalar(hot?1.4:1); p.line.material.opacity=hot?1:0.6; p.line.material.color.setHex(hot?0x6a5a2a:0x2a3646); });
    if(!dragging && !reduced){ orbit.az+=0.0008; placeCam(); }
    renderer.render(scene, camera); requestAnimationFrame(frame); }
  frame();
  window.addEventListener('resize', function(){ var w=host.clientWidth, h=Math.max(420, Math.min(620, Math.round(w*0.56))); renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); });
})();
