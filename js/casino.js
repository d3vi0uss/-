const suits = ['♠','♥','♦','♣'];
const vals = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function cardValue(v){ if (['J','Q','K'].includes(v)) return 10; if (v==='A') return 11; return +v; }
function handValue(cards){
  let total = cards.reduce((a,c)=>a+cardValue(c.v),0);
  let aces = cards.filter(c=>c.v==='A').length;
  while (total>21 && aces--) total -=10;
  return total;
}
export function newDeck(rng){
  const d=[]; for(const s of suits) for(const v of vals) d.push({s,v});
  for(let i=d.length-1;i>0;i--){ const j=Math.floor(rng.next()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
  return d;
}
export function playCoinflip(rng){ return rng.next()<0.5?'heads':'tails'; }

export function spinRoulette(rng){
  const n = Math.floor(rng.next()*37);
  const reds = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  return { n, color: reds.has(n)?'red':n===0?'green':'black' };
}

export function slotsSpin(rng){
  const symbols=[{s:'🍒',w:40,v:2},{s:'🍋',w:25,v:3},{s:'🔔',w:15,v:5},{s:'💎',w:7,v:12},{s:'7',w:3,v:30}];
  const roll=()=>{ let t=rng.next()*90; for(const x of symbols){ t-=x.w; if(t<=0) return x; } return symbols[0]; };
  const reels=[roll(),roll(),roll()];
  let mult=0;
  if(reels[0].s===reels[1].s && reels[1].s===reels[2].s) mult=reels[0].v;
  else if(reels[0].s===reels[1].s || reels[1].s===reels[2].s) mult=1.5;
  return { reels, mult };
}

export function crashPoint(rng){
  const r = rng.next();
  return +(1 + (1/(1-r))*0.06).toFixed(2);
}

export function createMines(rng, size=25, count=3){
  const mines=new Set(); while(mines.size<count) mines.add(Math.floor(rng.next()*size)); return mines;
}

export function plinkoDrop(rng){
  let pos = 4;
  for(let i=0;i<8;i++) pos += rng.next()<0.5?-1:1;
  pos = Math.max(0, Math.min(8, pos));
  const buckets=[10,4,2,1.4,1,1.4,2,4,10];
  return { pos, mult: buckets[pos] };
}

export function drawBlackjack(rng, bet, action='stand'){
  const deck = newDeck(rng);
  const player=[deck.pop(),deck.pop()], dealer=[deck.pop(),deck.pop()];
  if(action==='hit') player.push(deck.pop());
  if(action==='double') { bet*=2; player.push(deck.pop()); }
  while(handValue(dealer)<17) dealer.push(deck.pop());
  const pv=handValue(player), dv=handValue(dealer);
  let result='lose', payout=0;
  const blackjack = pv===21 && player.length===2;
  if(pv>21) result='bust';
  else if(dv>21 || pv>dv) { result='win'; payout= blackjack ? bet*2.5 : bet*2; }
  else if(pv===dv) { result='push'; payout=bet; }
  return {player,dealer,pv,dv,result,payout,bet};
}

export function jackpotWinner(rng, entries){
  const total=entries.reduce((a,e)=>a+e.tickets,0);
  let r=rng.next()*total;
  for(const e of entries){ r-=e.tickets; if(r<=0) return e; }
  return entries[0];
}
