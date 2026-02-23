import { loadUsers, saveUsers, listMarketHistory } from './storage.js';
import { makeDefaultPlayer, navItems } from './state.js';
import { makeStreams } from './rng.js';
import { openCase } from './cases.js';
import { tickEconomy, calcNetWorth } from './economy.js';
import { drawBlackjack, spinRoulette, playCoinflip, crashPoint, createMines, slotsSpin, plinkoDrop, jackpotWinner } from './casino.js';

const $ = (s) => document.querySelector(s);
const users = loadUsers();
const state = { user: null, player: null, streams: null, tab: 'Dashboard', autoBet: null, mines: null, crash: null, battlePass: { season: 1 } };

function persist() { if(state.user){ users[state.user] = state.player; saveUsers(users); } }
function money(n){ return `$${Math.round(n).toLocaleString()}`; }

function authView(){
  $('#auth-screen').innerHTML = `
    <h2>SimStrike Login / Signup</h2>
    <form id="auth-form">
      <input name="username" placeholder="username" required />
      <input name="password" placeholder="password" type="password" required />
      <select name="avatar"><option>🎯</option><option>🔥</option><option>🎲</option><option>🕶️</option></select>
      <div class="grid"><button class="btn" name="action" value="login">Login</button><button class="btn" name="action" value="signup">Signup</button></div>
    </form>`;
  $('#auth-form').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const username = f.get('username').toString(); const password = f.get('password').toString();
    const action = (e.submitter?.value || 'login');
    if(action==='signup'){
      if(users[username]) return alert('User exists');
      const p = makeDefaultPlayer(username); p.password = password; p.avatar = f.get('avatar');
      users[username] = p; saveUsers(users);
    }
    if(!users[username] || users[username].password !== password) return alert('Invalid credentials');
    state.user = username; state.player = users[username];
    state.streams = makeStreams(state.player.settings.seed || Date.now());
    $('#auth-screen').classList.add('hidden'); $('#app').classList.remove('hidden');
    if(!state.player.missions.length) seedMissions();
    bindShell(); render();
  };
}

function bindShell(){
  const nav = $('#nav'); nav.innerHTML = navItems.map(n=>`<button data-tab="${n}">${n}</button>`).join('');
  nav.onclick = (e)=>{ if(e.target.dataset.tab){ state.tab = e.target.dataset.tab; render(); } };
  $('#toggle-theme').onclick = ()=>{ state.player.settings.dark = !state.player.settings.dark; document.body.classList.toggle('light', !state.player.settings.dark); persist(); };
  $('#toggle-sound').onclick = ()=>{ state.player.settings.sound = !state.player.settings.sound; persist(); render(); };
  $('#logout').onclick = ()=> location.reload();
}

function drawTop(){
  $('#profile-mini').innerHTML = `${state.player.avatar} ${state.user} ${state.player.admin?'<span class="badge">ADMIN</span>':''}`;
  $('#balance').textContent = money(state.player.balance);
  $('#bank-balance').textContent = money(state.player.bankBalance);
  $('#xp').textContent = state.player.xp;
  $('#level').textContent = state.player.level;
  $('#rank').textContent = state.player.rank;
  $('#net-worth').textContent = money(calcNetWorth(state.player));
  $('#seed-panel').innerHTML = `Provably Fair<br>C: ${state.player.rngSeeds.casino}<br>K: ${state.player.rngSeeds.cases}<br>E: ${state.player.rngSeeds.economy}`;
  document.body.classList.toggle('light', !state.player.settings.dark);
}

function xpGain(v){ state.player.xp += v; state.player.battlePassXp += v; if(state.player.xp >= state.player.level*100){ state.player.level++; state.player.rank = ['Silver','Gold','Platinum','Diamond'][Math.min(3,Math.floor(state.player.level/10))]; } }
function log(s){ state.player.history.unshift(`${new Date().toLocaleTimeString()} - ${s}`); state.player.history = state.player.history.slice(0,120); }
function payout(delta, game){ state.player.balance += delta; if(game){ state.player.totalGambles++; if(delta>=0) state.player.wins[game]=(state.player.wins[game]||0)+1; else state.player.losses[game]=(state.player.losses[game]||0)+1; } state.player.stats.pnl += delta; }

function dashboard(){
  return `<div class="card"><h2>Dashboard</h2><p>Complete missions, open cases, battle bots, and grow your simulated empire.</p>
  <div class="log">${state.player.history.map(h=>`<div>${h}</div>`).join('')}</div></div>`;
}

function clickerView(){
  return `<div class="card"><h2>Clicker</h2>
    <button id="click-btn" class="btn">Click +${state.player.clickPower}</button>
    <div>Crit: ${(state.player.critChance*100).toFixed(1)}% | Auto: ${state.player.autoClick}/sec | Rebirths: ${state.player.rebirths}</div>
    <div class="grid grid-2">
      <button class="btn" id="up-click">Upgrade click ($${20*state.player.clickPower})</button>
      <button class="btn" id="up-auto">Buy auto ($${50*(state.player.autoClick+1)})</button>
      <button class="btn" id="up-crit">Upgrade crit ($${75})</button>
      <button class="btn" id="rebirth">Rebirth (lv10)</button>
    </div>
  </div>`;
}

function casesView(){
  return `<div class="card"><h2>Cases</h2>
    <div class="grid grid-2"><select id="case-name"><option>Fracture Sim</option><option>Shadow Sim</option><option>Event Arcane</option></select>
    <select id="case-count"><option value="1">x1</option><option value="5">x5</option><option value="10">x10</option></select></div>
    <button class="btn" id="open-case">Open Case</button>
    <div class="case-strip" id="case-strip">Awaiting spin...</div>
  </div>`;
}

function inventoryView(){
  const rows = state.player.inventory.map(i=>`<div class="item rarity-${i.rarity.toLowerCase()}"><b>${i.name}</b><div>${i.rarity} ${i.statTrak?'★ST':''}</div><div>Float ${i.float} (${i.wear})</div><div>${money(i.baseValue*state.player.marketMultiplier)}</div><button data-sell="${i.id}">Sell</button></div>`).join('');
  return `<div class="card"><h2>Inventory (${state.player.inventory.length})</h2><div class="inventory-grid">${rows || 'No items.'}</div></div>`;
}

function economyView(){
  return `<div class="card"><h2>Economy</h2><div>Market Multiplier: x${state.player.marketMultiplier.toFixed(2)}</div><button class="btn" id="econ-tick">Simulate tick</button><canvas id="econ-canvas" width="700" height="180"></canvas></div>`;
}

function bankView(){
  return `<div class="card"><h2>Bank</h2><input id="bank-amount" type="number" min="1" value="100" />
    <div class="grid grid-2"><button id="deposit">Deposit</button><button id="withdraw">Withdraw</button><button id="loan">Take Loan $5000</button><button id="repay">Repay Loan</button></div>
    <div>${state.player.loan?`Loan due in ${Math.max(0,Math.floor((state.player.loan.due-Date.now())/1000))}s`: 'No active loan'}</div>
  </div>`;
}

function battlesView(){ return `<div class="card"><h2>Case Battles</h2><button id="battle-1v1">Start 1v1 ($200)</button> <button id="battle-team">Team ($500)</button> <button id="battle-ffa">FFA ($300)</button><div id="battle-result"></div></div>`; }
function missionsView(){ return `<div class="card"><h2>Missions & Pass</h2>${state.player.missions.map((m,i)=>`<div>${m.name} ${m.progress}/${m.goal} <button data-claim="${i}">Claim</button></div>`).join('')}<hr/>Battle Pass XP: ${state.player.battlePassXp}</div>`; }
function statsView(){ const wr=(g)=>{const w=state.player.wins[g]||0,l=state.player.losses[g]||0; return w+l?((w/(w+l))*100).toFixed(1):'0';}; return `<div class="card"><h2>Statistics</h2><div>Total Clicks ${state.player.totalClicks}</div><div>Cases ${state.player.totalCases}</div><div>P/L ${money(state.player.stats.pnl)}</div><div>Coinflip WR ${wr('coinflip')}%</div><div>Roulette WR ${wr('roulette')}%</div><div>Blackjack WR ${wr('blackjack')}%</div></div>`; }
function accountView(){ return `<div class="card"><h2>Profile</h2><div>User: ${state.user}</div><div>Avatar: ${state.player.avatar}</div><div>Season ${state.battlePass.season}</div></div>`; }
function adminView(){ if(!state.player.admin) return `<div class="card">Admin locked.</div>`; return `<div class="card"><h2>Admin Panel</h2><button id="adm-money">+10000</button><button id="adm-item">Spawn Covert</button><button id="adm-reset">Reset Progress</button></div>`; }

function casinoView(){
  return `<div class="card"><h2>Casino</h2>
  <input id="bet" type="range" min="10" max="1000" value="100"/><span id="betv">100</span>
  <div class="grid grid-2">
    <div class="card"><h3>Blackjack</h3><button data-casino="bj-hit">Hit</button><button data-casino="bj-stand">Stand</button><button data-casino="bj-double">Double</button><div id="bj"></div></div>
    <div class="card"><h3>Roulette</h3><select id="roulette-bet"><option value="red">Red</option><option value="black">Black</option><option value="odd">Odd</option><option value="even">Even</option><option value="dozen1">1st 12</option></select><button data-casino="roulette">Spin</button><div class="roulette-wheel" id="roulette-out"></div></div>
    <div class="card"><h3>Coinflip</h3><select id="coin-side"><option>heads</option><option>tails</option></select><button data-casino="coin">Flip</button><div id="coin-out"></div></div>
    <div class="card"><h3>Crash</h3><button data-casino="crash-start">Start</button><button data-casino="crash-cash">Cashout</button><div class="crash-graph" id="crash-out"></div></div>
    <div class="card"><h3>Jackpot</h3><button data-casino="jackpot">Join round</button><div id="jackpot-out"></div></div>
    <div class="card"><h3>Mines</h3><button data-casino="mines-new">New 5x5</button><button data-casino="mines-cash">Cashout</button><div id="mines"></div></div>
    <div class="card"><h3>Slots</h3><button data-casino="slots">Spin</button><div class="slots-reels" id="slots"></div></div>
    <div class="card"><h3>Plinko</h3><button data-casino="plinko">Drop ball</button><div class="plinko-board" id="plinko"></div></div>
  </div></div>`;
}

async function render(){
  drawTop();
  const views={Dashboard:dashboard,Clicker:clickerView,Cases:casesView,Casino:casinoView,Inventory:inventoryView,Economy:economyView,Bank:bankView,Battles:battlesView,Missions:missionsView,Stats:statsView,Account:accountView,Admin:adminView};
  $('#content').innerHTML = views[state.tab]();
  bindTabHandlers();
  if(state.tab==='Economy') await drawEconomyGraph();
  persist();
}

function bindTabHandlers(){
  const bet = $('#bet'); if(bet){ bet.oninput=()=>$('#betv').textContent=bet.value; }
  $('#click-btn')?.addEventListener('click',()=>{
    let gain=state.player.clickPower; if(Math.random()<state.player.critChance) gain*=3;
    payout(gain); xpGain(2); state.player.totalClicks++; missionProgress('click',1); render();
  });
  $('#up-click')?.addEventListener('click',()=>{const c=20*state.player.clickPower;if(state.player.balance>=c){payout(-c);state.player.clickPower++;render();}});
  $('#up-auto')?.addEventListener('click',()=>{const c=50*(state.player.autoClick+1);if(state.player.balance>=c){payout(-c);state.player.autoClick++;render();}});
  $('#up-crit')?.addEventListener('click',()=>{if(state.player.balance>=75){payout(-75);state.player.critChance=Math.min(.5,state.player.critChance+.02);render();}});
  $('#rebirth')?.addEventListener('click',()=>{if(state.player.level>=10){state.player.rebirths++;state.player.clickPower=1+state.player.rebirths;state.player.autoClick=0;state.player.level=1;state.player.xp=0;state.player.balance=1000;render();}});

  $('#open-case')?.addEventListener('click',()=>{
    const cnt = +$('#case-count').value; const cost=120*cnt; if(state.player.balance<cost) return;
    payout(-cost); const pulls=openCase(state,state.streams.cases,$('#case-name').value,cnt);
    state.player.inventory.push(...pulls); state.player.totalCases+=cnt; missionProgress('case',cnt); xpGain(8*cnt);
    const best = pulls.sort((a,b)=>b.baseValue-a.baseValue)[0]; state.player.stats.rarestPull = best.name;
    $('#case-strip').innerHTML = pulls.map(p=>`<span class="badge rarity-${p.rarity.toLowerCase()}">${p.rarity} ${p.name} ${p.oneOfOne?'1/1':''}</span>`).join(' ');
    log(`Opened ${cnt} case(s), best ${best.rarity}`); render();
  });

  $('#content').onclick = (e)=>{
    const id=e.target.dataset.sell; if(id){ const it=state.player.inventory.find(i=>i.id===id); if(!it) return; payout(it.baseValue*state.player.marketMultiplier); state.player.inventory = state.player.inventory.filter(i=>i.id!==id); render(); }
    const c=e.target.dataset.casino; if(c) runCasino(c);
    const claim=e.target.dataset.claim; if(claim!==undefined){ const m=state.player.missions[claim]; if(m.progress>=m.goal && !m.claimed){ m.claimed=true; payout(m.reward); xpGain(30); } render(); }
  };

  $('#econ-tick')?.addEventListener('click', async()=>{ await tickEconomy(state,state.streams.economy); render(); });
  $('#deposit')?.addEventListener('click',()=>{const a=+$('#bank-amount').value;if(a>0&&state.player.balance>=a){state.player.balance-=a;state.player.bankBalance+=a;render();}});
  $('#withdraw')?.addEventListener('click',()=>{const a=+$('#bank-amount').value;if(a>0&&state.player.bankBalance>=a){state.player.bankBalance-=a;state.player.balance+=a;render();}});
  $('#loan')?.addEventListener('click',()=>{if(!state.player.loan){state.player.loan={amount:5000,due:Date.now()+120000};payout(5000);render();}});
  $('#repay')?.addEventListener('click',()=>{if(state.player.loan){const owed=Math.round(state.player.loan.amount*1.35);if(state.player.balance>=owed){payout(-owed);state.player.loan=null;render();}}});

  $('#battle-1v1')?.addEventListener('click',()=>battle(200,[1,1]));
  $('#battle-team')?.addEventListener('click',()=>battle(500,[2,2]));
  $('#battle-ffa')?.addEventListener('click',()=>battle(300,[1,4]));

  $('#adm-money')?.addEventListener('click',()=>{payout(10000);render();});
  $('#adm-item')?.addEventListener('click',()=>{state.player.inventory.push(...openCase(state,state.streams.cases,'Admin',1).map(x=>({...x,rarity:'Covert',baseValue:5000})));render();});
  $('#adm-reset')?.addEventListener('click',()=>{users[state.user]=makeDefaultPlayer(state.user);state.player=users[state.user];render();});
}

function runCasino(type){
  const bet = +($('#bet')?.value || 100); if(state.player.balance<bet && !type.includes('cash')) return;
  if(type==='coin'){ payout(-bet,'coinflip'); const pick=$('#coin-side').value; const out=playCoinflip(state.streams.casino); const win=pick===out; if(win)payout(bet*2,'coinflip'); $('#coin-out').textContent=`${out} ${win?'WIN':'LOSE'}`; }
  if(type==='roulette'){ payout(-bet,'roulette'); const b=$('#roulette-bet').value; const r=spinRoulette(state.streams.casino); let win=false,m=2;
    if((b==='red'||b==='black')&&r.color===b) win=true;
    if(b==='odd'&&r.n%2===1) win=true; if(b==='even'&&r.n!==0&&r.n%2===0) win=true;
    if(b==='dozen1'&&r.n>=1&&r.n<=12){win=true;m=3;}
    if(win)payout(bet*m,'roulette'); $('#roulette-out').textContent=`${r.n} ${r.color} ${win?'WIN':'LOSE'}`;
  }
  if(type.startsWith('bj-')){ payout(-bet,'blackjack'); const map={ 'bj-hit':'hit','bj-stand':'stand','bj-double':'double' }; const g=drawBlackjack(state.streams.casino,bet,map[type]); payout(g.payout,'blackjack'); $('#bj').textContent=`P ${g.pv} vs D ${g.dv}: ${g.result}`; }
  if(type==='slots'){ payout(-bet,'slots'); const r=slotsSpin(state.streams.casino); const w=bet*r.mult; if(w)payout(w,'slots'); $('#slots').textContent=`${r.reels.map(x=>x.s).join(' | ')} x${r.mult}`; }
  if(type==='plinko'){ payout(-bet,'plinko'); const r=plinkoDrop(state.streams.casino); payout(bet*r.mult,'plinko'); $('#plinko').textContent=`Bucket ${r.pos} x${r.mult}`; }
  if(type==='jackpot'){ payout(-bet,'jackpot'); const bots=[{name:'bot1',tickets:50+Math.random()*100},{name:'bot2',tickets:80+Math.random()*110},{name:state.user,tickets:bet}]; const w=jackpotWinner(state.streams.casino,bots); if(w.name===state.user)payout(bet+bots[0].tickets+bots[1].tickets,'jackpot'); $('#jackpot-out').textContent=`Winner: ${w.name}`; }
  if(type==='mines-new'){ payout(-bet,'mines'); state.mines={bet,opened:[],mult:1,mines:createMines(state.streams.casino,25,3)}; drawMines(); }
  if(type==='mines-cash'&&state.mines){ payout(state.mines.bet*state.mines.mult,'mines'); state.mines=null; $('#mines').textContent='Cashed out'; }
  if(type==='crash-start'){ payout(-bet,'crash'); state.crash={bet,current:1,target:crashPoint(state.streams.casino),active:true}; runCrashLoop(); }
  if(type==='crash-cash'&&state.crash?.active){ state.crash.active=false; payout(state.crash.bet*state.crash.current,'crash'); $('#crash-out').textContent=`Cashed at x${state.crash.current.toFixed(2)}`; }
  missionProgress('gamble',1); render();
}

function drawMines(){
  const el=$('#mines'); if(!el||!state.mines) return;
  el.innerHTML = Array.from({length:25},(_,i)=>`<button data-mine="${i}">${state.mines.opened.includes(i)?'✅':'?'}</button>`).join('');
  el.querySelectorAll('[data-mine]').forEach(btn=>btn.onclick=()=>{
    const i=+btn.dataset.mine; if(state.mines.opened.includes(i)) return;
    if(state.mines.mines.has(i)){ state.mines=null; $('#mines').textContent='💥 Mine hit'; return; }
    state.mines.opened.push(i); state.mines.mult = +(state.mines.mult+0.2).toFixed(2); drawMines();
  });
}

function runCrashLoop(){
  const t=setInterval(()=>{
    if(!state.crash){clearInterval(t);return;}
    if(!state.crash.active){clearInterval(t);return;}
    state.crash.current += 0.05;
    $('#crash-out') && ($('#crash-out').textContent=`x${state.crash.current.toFixed(2)} / target ${state.crash.target}`);
    if(state.crash.current>=state.crash.target){ state.crash.active=false; $('#crash-out').textContent='CRASHED'; clearInterval(t); }
  },120);
}

function battle(cost,botRange){
  if(state.player.balance<cost) return; payout(-cost);
  const my = openCase(state,state.streams.cases,'Battle',1)[0].baseValue;
  const bots = Array.from({length:botRange[1]},()=>openCase(state,state.streams.cases,'Battle',1)[0].baseValue);
  const top = Math.max(...bots);
  const win = my >= top;
  if(win) payout(cost*(botRange[1]+1));
  $('#battle-result').textContent = `You ${my} vs bots ${bots.join(', ')} => ${win?'WIN':'LOSE'}`;
}

function seedMissions(){
  state.player.missions = [
    { name:'Click 100 times', type:'click', goal:100, progress:0, reward:300, claimed:false },
    { name:'Open 10 cases', type:'case', goal:10, progress:0, reward:600, claimed:false },
    { name:'Play 20 casino rounds', type:'gamble', goal:20, progress:0, reward:800, claimed:false },
  ];
}
function missionProgress(type, amt){ state.player.missions.forEach(m=>{ if(m.type===type && !m.claimed) m.progress=Math.min(m.goal,m.progress+amt);}); }

async function drawEconomyGraph(){
  const c=$('#econ-canvas'); if(!c) return; const ctx=c.getContext('2d');
  const pts = await listMarketHistory();
  ctx.clearRect(0,0,c.width,c.height); ctx.strokeStyle='#6e7dff'; ctx.beginPath();
  pts.forEach((p,i)=>{ const x=(i/(Math.max(1,pts.length-1)))*c.width; const y=c.height-(p.m/3)*c.height; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); });
  ctx.stroke();
}

setInterval(()=>{ if(!state.player) return; if(state.player.autoClick){ payout(state.player.autoClick*state.player.clickPower*(1+state.player.rebirths*0.2)); state.player.totalClicks += state.player.autoClick; } if(state.player.bankBalance) state.player.bankBalance*=1.0005; if(state.player.loan && Date.now()>state.player.loan.due){ const owed=Math.round(state.player.loan.amount*1.8); if(state.player.balance>=owed) payout(-owed); else {state.player.balance=0;state.player.inventory=[];} state.player.loan=null; } persist(); drawTop(); },1000);
setInterval(()=>{ if(!state.player) return; tickEconomy(state,state.streams.economy).then(()=>{persist(); if(state.tab==='Economy') drawEconomyGraph();}); },8000);

authView();
