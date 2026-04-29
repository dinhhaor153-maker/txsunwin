const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;
const MAX_HISTORY = 5000;
const MAX_PRED_LOG = 5000;
const WINDOW = 21;

// ============================================================
// PATTERN TABLES - Pattern7+5 (71.34% accuracy, max streak 3)
// ============================================================
const T7 = {
  "['X','T','X','X','X','X','X']":"NGUOC","['T','X','X','X','X','X','X']":"NGUOC",
  "['X','X','X','X','X','X','T']":"NGUOC","['X','X','X','X','X','T','X']":"BET",
  "['X','X','X','X','T','X','X']":"NGUOC","['X','X','X','T','X','X','T']":"NGUOC",
  "['X','X','T','X','X','T','X']":"NGUOC","['X','T','X','X','T','X','T']":"BET",
  "['T','X','X','T','X','T','T']":"BET","['X','X','T','X','T','T','T']":"NGUOC",
  "['X','T','X','T','T','T','T']":"NGUOC","['T','X','T','T','T','T','X']":"NGUOC",
  "['X','T','T','T','T','X','T']":"NGUOC","['T','T','T','T','X','T','X']":"BET",
  "['T','T','T','X','T','X','X']":"BET","['T','T','X','T','X','X','T']":"NGUOC",
  "['X','X','T','T','T','T','X']":"BET","['T','T','X','T','X','X','X']":"NGUOC",
  "['T','X','T','X','X','X','T']":"BET","['X','T','X','X','X','T','X']":"NGUOC",
  "['T','X','X','X','T','X','T']":"NGUOC","['X','X','X','T','X','T','X']":"NGUOC",
  "['X','X','T','X','T','X','T']":"BET","['X','T','X','T','X','T','X']":"NGUOC",
  "['T','X','T','X','T','X','X']":"BET","['X','T','X','T','X','X','X']":"BET",
  "['T','X','T','X','X','X','X']":"NGUOC","['X','T','X','X','X','X','T']":"NGUOC",
  "['T','X','X','X','X','T','T']":"BET","['X','X','X','X','T','T','T']":"BET",
  "['X','X','X','T','T','T','T']":"BET","['X','X','T','T','T','T','T']":"NGUOC",
  "['X','T','T','T','T','T','X']":"NGUOC","['T','T','T','T','T','X','T']":"BET",
  "['T','T','T','T','X','T','T']":"BET","['T','T','T','X','T','T','T']":"BET",
  "['T','T','X','T','T','T','T']":"NGUOC","['X','T','T','T','T','X','X']":"NGUOC",
  "['T','T','T','T','X','X','T']":"NGUOC","['T','T','T','X','X','T','X']":"BET",
  "['T','T','X','X','T','X','X']":"NGUOC","['T','X','X','T','X','X','T']":"NGUOC",
  "['X','X','T','X','T','T','X']":"NGUOC","['X','T','X','T','T','X','T']":"BET",
  "['T','X','T','T','X','T','X']":"NGUOC","['X','T','T','X','T','X','T']":"NGUOC",
  "['T','T','X','T','X','T','X']":"BET","['X','T','X','X','X','T','T']":"BET",
  "['T','X','X','X','T','T','X']":"BET","['X','X','X','T','T','X','X']":"BET",
  "['X','X','T','T','X','X','X']":"NGUOC","['X','T','T','X','X','X','T']":"NGUOC",
  "['T','T','X','X','X','T','X']":"BET","['X','T','X','T','X','T','T']":"NGUOC",
  "['T','X','T','X','T','T','X']":"BET","['X','T','X','T','T','X','X']":"NGUOC",
  "['T','X','T','T','X','X','T']":"NGUOC","['X','T','T','X','X','T','X']":"NGUOC",
  "['T','T','X','X','T','X','T']":"BET","['T','X','X','T','X','T','X']":"NGUOC",
  "['T','X','T','X','T','X','T']":"BET","['T','X','T','T','X','X','X']":"BET",
  "['X','T','T','X','X','X','X']":"NGUOC","['T','T','X','X','X','X','T']":"NGUOC",
  "['T','X','X','X','X','T','X']":"BET","['X','X','T','X','X','T','T']":"NGUOC",
  "['X','T','X','X','T','T','X']":"BET","['T','X','X','T','T','X','X']":"BET",
  "['T','T','X','X','X','T','T']":"NGUOC","['T','X','X','X','T','T','T']":"NGUOC",
  "['X','X','X','T','T','T','X']":"NGUOC","['X','X','T','T','T','X','T']":"BET",
  "['X','T','T','T','X','T','X']":"NGUOC","['T','T','T','X','T','X','T']":"BET",
  "['T','T','X','T','X','T','T']":"BET","['T','X','T','X','T','T','T']":"NGUOC",
  "['X','T','X','T','T','T','X']":"NGUOC","['T','X','T','T','T','X','T']":"BET",
  "['X','T','T','T','X','T','T']":"NGUOC","['T','T','X','T','T','T','X']":"BET",
  "['T','X','T','T','T','X','X']":"BET","['X','T','T','T','X','X','X']":"NGUOC",
  "['T','T','T','X','X','X','T']":"BET","['X','X','T','X','T','X','X']":"BET",
  "['T','X','X','X','X','X','T']":"BET","['X','X','X','X','X','T','T']":"NGUOC",
  "['X','X','X','X','T','T','X']":"BET","['X','X','X','T','T','X','T']":"NGUOC",
  "['X','X','T','T','X','T','X']":"NGUOC","['X','X','X','T','X','X','X']":"NGUOC",
  "['X','X','T','X','X','X','X']":"NGUOC","['X','X','X','X','T','X','T']":"BET",
  "['X','X','X','T','X','T','T']":"BET","['T','T','T','X','T','T','X']":"BET",
  "['T','T','X','T','T','X','T']":"NGUOC","['T','X','T','T','X','T','T']":"BET",
  "['X','T','T','X','T','T','T']":"BET","['T','X','T','X','X','T','X']":"NGUOC",
  "['X','T','X','X','T','X','X']":"BET","['T','X','T','T','T','T','T']":"NGUOC",
  "['T','X','X','X','T','X','X']":"NGUOC","['T','X','X','T','X','X','X']":"BET",
  "['T','T','X','X','X','X','X']":"BET","['X','T','T','X','X','T','T']":"BET",
  "['X','T','T','X','T','X','X']":"NGUOC","['T','T','X','T','T','X','X']":"BET",
  "['X','X','T','T','X','X','T']":"NGUOC","['X','T','T','X','T','T','X']":"NGUOC",
  "['T','T','T','X','X','X','X']":"BET","['X','X','T','X','X','X','T']":"BET",
  "['X','X','T','T','T','X','X']":"BET"
};

const T5 = {
  "['X','X','X','X','X']":"NGUOC","['X','X','X','X','T']":"NGUOC",
  "['X','X','X','T','X']":"BET","['X','X','T','X','X']":"NGUOC",
  "['X','T','X','X','T']":"NGUOC","['T','X','X','T','X']":"NGUOC",
  "['X','X','T','X','T']":"BET","['X','T','X','T','T']":"BET",
  "['T','X','T','T','T']":"NGUOC","['X','T','T','T','T']":"NGUOC",
  "['T','T','T','T','X']":"NGUOC","['T','T','T','X','T']":"BET",
  "['T','T','X','T','X']":"NGUOC","['T','X','T','X','X']":"BET",
  "['T','X','X','T','T']":"NGUOC","['X','X','T','T','T']":"BET",
  "['X','T','X','X','X']":"BET","['T','X','X','X','T']":"BET",
  "['X','T','X','T','X']":"BET","['T','X','T','X','T']":"BET",
  "['T','X','X','X','X']":"NGUOC","['X','X','X','T','T']":"NGUOC",
  "['T','T','T','T','T']":"NGUOC","['T','T','X','T','T']":"BET",
  "['T','T','T','X','X']":"BET","['T','T','X','X','T']":"NGUOC",
  "['T','X','T','T','X']":"NGUOC","['X','T','T','X','T']":"NGUOC",
  "['X','X','T','T','X']":"BET","['X','T','T','X','X']":"BET",
  "['T','T','X','X','X']":"NGUOC","['X','T','T','T','X']":"NGUOC"
};

// ============================================================
// RECENT PREDICTION MEMORY (giu log, CutLoss da tat)
// ============================================================
let recentPreds = [];
let cutLossCooldown = 0;
function updateRecentPreds(pred, actual, isCutLoss) {
  const correct = pred === actual;
  recentPreds.unshift({ pred, actual, correct, isCutLoss: !!isCutLoss });
  if (recentPreds.length > 10) recentPreds = recentPreds.slice(0, 10);
}

function getCutLossOverride(normalPred) {
  // CutLoss da bi tat - test cho thay no lam giam accuracy tren du lieu thuc te
  // Baseline (Pattern-7+5 thuan) cho ket qua tot hon
  return null;
}
function keyOf(arr) {
  return "['" + arr.join("','") + "']";
}

function getStreak(w) {
  let s = 1;
  const last = w[w.length - 1];
  for (let i = w.length - 2; i >= Math.max(w.length - 11, 0); i--) {
    if (w[i] === last) s++; else break;
  }
  return s;
}

function runPredict(w, recentTotals, recentPredResults) {
  if (w.length < WINDOW) return null;
  const last = w[w.length - 1];
  const anti = last === 'Tai' ? 'Xiu' : 'Tai';

  // Chuyen sang T/X de tra bang
  const wTX = w.map(x => x === 'Tai' ? 'T' : 'X');
  const lastTX = wTX[wTX.length - 1];

  // Tinh cac chi so phan tich
  const s    = getStreak(wTX);
  const c5   = wTX.slice(-5).filter(x => x === lastTX).length;
  const c10  = wTX.slice(-10).filter(x => x === lastTX).length;
  const c21  = wTX.filter(x => x === 'T').length;
  const pat7 = wTX.slice(-7);
  const pat5 = wTX.slice(-5);
  const k7   = keyOf(pat7);
  const k5   = keyOf(pat5);

  let avgTotal = null;
  if (recentTotals && recentTotals.length >= 10) {
    avgTotal = recentTotals.slice(0,10).reduce((a,b)=>a+b,0)/10;
  }

  const detail = {
    window_7: pat7, window_5: pat5, key_7: k7, key_5: k5,
    streak_hien_tai: s, loai_streak: lastTX,
    dem_5_phien:  { [lastTX]: c5,  [lastTX==='T'?'X':'T']: 5-c5  },
    dem_10_phien: { T: wTX.slice(-10).filter(x=>x==='T').length, X: wTX.slice(-10).filter(x=>x==='X').length },
    dem_21_phien: { T: c21, X: 21-c21 },
    hit_table7: !!T7[k7], hit_table5: !!T5[k5],
    action_table7: T7[k7]||null, action_table5: T5[k5]||null,
    avg_tong_10: avgTotal ? avgTotal.toFixed(2) : null
  };

  // ── UU TIEN 1: Dung best algo tu auto-search (neu dat target max_sai<=2) ──
  // Kiem tra performance thuc te: neu dang sai nhieu tren 30 phien gan nhat thi fallback
  if (autoSearchState && autoSearchState.best && autoSearchState.best.achieved_target) {
    // Kiem tra performance thuc te cua best algo tren 30 phien gan nhat trong predLog
    let realOk=0, realTotal=0, realMaxSai=0, realCur=0;
    const recentLog = predLog.filter(p => p.algo && p.algo.startsWith('AutoBest:')).slice(0,30);
    if (recentLog.length >= 10) {
      for (const p of recentLog) {
        realTotal++;
        if (p.dung) { realOk++; if(realCur>realMaxSai)realMaxSai=realCur; realCur=0; }
        else realCur++;
      }
      if (realCur>realMaxSai) realMaxSai=realCur;
      const realAcc = realOk/realTotal*100;
      // Neu thuc te: acc < 45% hoac max_sai > 5 => fallback, reset best
      if (realAcc < 45 || realMaxSai > 5) {
        console.log('[SEARCH] Best algo performance toi: acc='+realAcc.toFixed(1)+'% max_sai='+realMaxSai+' => fallback + reset');
        autoSearchState.best = null; // reset de search lai
        autoSearchState.last_search_phien_count = 0; // force search lai ngay
      }
    }
  }

  if (autoSearchState && autoSearchState.best && autoSearchState.best.achieved_target) {
    const tw = recentTotals ? recentTotals.slice(0,15) : [];
    const pred = predictByConfig(autoSearchState.best.config, w, tw);
    if (pred) {
      return {
        pred, algo: 'AutoBest:'+autoSearchState.best.name, conf: 82,
        ly_giai: `Auto-search best (acc=${autoSearchState.best.acc.toFixed(1)}% max_sai=${autoSearchState.best.max_sai}) => ${pred}`,
        detail
      };
    }
  }

  // ── UU TIEN 2: AvgTotal10 fallback ──
  if (avgTotal !== null && avgTotal !== 9.5) {
    if (avgTotal > 9.5) return { pred:'Tai', algo:'AvgTotal10->Tai', conf:74,
      ly_giai:`TB tong diem 10 phien = ${avgTotal.toFixed(2)} > 9.5 => Tai`, detail };
    return { pred:'Xiu', algo:'AvgTotal10->Xiu', conf:74,
      ly_giai:`TB tong diem 10 phien = ${avgTotal.toFixed(2)} < 9.5 => Xiu`, detail };
  }

  // ── UU TIEN 3: Streak cuc dai ──
  if (s >= 6) return { pred:last, algo:`Streak${s}->Theo`, conf:75,
    ly_giai:`Chuoi ${lastTX} lien tiep ${s} phien => theo ${last}`, detail };

  // Table 7
  if (T7[k7]) {
    const action = T7[k7];
    const pred = action==='BET'?last:anti;
    return { pred, algo:'Pattern-7', conf:72,
      ly_giai:`Pattern-7 [${pat7.join(',')}] => ${action} => ${pred}`, detail };
  }
  // Table 5
  if (T5[k5]) {
    const action = T5[k5];
    const pred = action==='BET'?last:anti;
    return { pred, algo:'Pattern-5', conf:65,
      ly_giai:`Pattern-5 [${pat5.join(',')}] => ${action} => ${pred}`, detail };
  }

  if (s>=5) return { pred:anti, algo:'Streak>=5->Nguoc', conf:82, ly_giai:`Chuoi ${s}>=5 => dao ${anti}`, detail };
  if (s===4) return { pred:anti, algo:'Streak=4->Nguoc', conf:66, ly_giai:`Chuoi 4 => dao ${anti}`, detail };
  if (s===3&&c5>=3) return { pred:last, algo:'S3C5>=3->Bet', conf:58, ly_giai:`S3 C5=${c5}>=3 => bet ${last}`, detail };
  if (s===2&&c5===3) return { pred:last, algo:'S2C5=3->Bet', conf:59, ly_giai:`S2 C5=3 => bet ${last}`, detail };
  if (s===2&&c5>=4) return { pred:anti, algo:'S2C5>=4->Nguoc', conf:57, ly_giai:`S2 C5=${c5}>=4 => dao ${anti}`, detail };
  if (s===1&&c5>=4) return { pred:last, algo:'C5>=4->Bet', conf:56, ly_giai:`C5=${c5}>=4 => bet ${last}`, detail };
  if (s===1&&c5<=2) return { pred:anti, algo:'C5<=2->Nguoc', conf:62, ly_giai:`C5=${c5}<=2 => dao ${anti}`, detail };
  if (c10>=6) return { pred:last, algo:'C10>=6->Bet', conf:55, ly_giai:`C10=${c10}>=6 => bet ${last}`, detail };
  return { pred:anti, algo:'Nguoc cuoi (mac dinh)', conf:54, ly_giai:`Mac dinh dao ${last} => ${anti}`, detail };
}

// ============================================================
// AUTO SEARCH ENGINE
// Chay background, tim thuat toan tot nhat tren du lieu tich luy
// Muc tieu: max_sai <= 2 tren 1000 phien gan nhat
// Khi dat target => tu dong dung thuat toan do de du doan
// ============================================================
const SEARCH_TARGET_MAX_SAI = 2;
const SEARCH_TEST_WINDOW    = 1000;
const SEARCH_MIN_PHIEN      = 80;
const SEARCH_INTERVAL_PHIEN = 30;

let autoSearchState = {
  running: false,
  last_search_phien_count: 0,
  best: null,          // ket qua tot nhat tim duoc
  history: [],         // lich su cac lan search
  started_at: null,
  iterations: 0
};

// Helper: evaluate predictions
function evalPreds(preds) {
  const total = preds.length;
  if (!total) return { acc:0, max_sai:0, max_dung:0, dist:{} };
  const ok = preds.filter(p => p[0]===p[1]).length;
  let cw=0, mw=0, cr=0, mr=0;
  const streaks = {};
  for (const [pred, actual] of preds) {
    if (pred===actual) {
      if (cw>0) { streaks[cw]=(streaks[cw]||0)+1; } cw=0; cr++; if(cr>mr)mr=cr;
    } else { cr=0; cw++; if(cw>mw)mw=cw; }
  }
  if (cw>0) streaks[cw]=(streaks[cw]||0)+1;
  return { acc: ok/total*100, max_sai: mw, max_dung: mr, dist: streaks };
}

// Helper: predict theo config bat ky
function predictByConfig(config, w, tw) {
  const last=w[w.length-1]; const anti=last==='Tai'?'Xiu':'Tai';
  const wTX=w.map(x=>x==='Tai'?'T':'X');
  const s=getStreak(wTX); const lastTX=wTX[wTX.length-1];
  const c5=wTX.slice(-5).filter(x=>x===lastTX).length;
  const c10=wTX.slice(-10).filter(x=>x===lastTX).length;
  const c21=wTX.filter(x=>x==='T').length;
  const t=config.type;

  if (t==='avg_total') {
    const {n_avg,thresh}=config;
    if (tw.length>=n_avg) {
      const avg=tw.slice(0,n_avg).reduce((a,b)=>a+b,0)/n_avg;
      if (avg>thresh) return 'Tai'; if (avg<thresh) return 'Xiu';
    }
  }
  else if (t==='avg_count') {
    const {n_avg,thresh,n_win,hi}=config;
    if (tw.length>=n_avg) {
      const avg=tw.slice(0,n_avg).reduce((a,b)=>a+b,0)/n_avg;
      if (avg>thresh) return 'Tai'; if (avg<thresh) return 'Xiu';
    }
    const rc=wTX.slice(-n_win);
    if (rc.filter(x=>x==='T').length>=hi) return 'Tai';
    if (rc.filter(x=>x==='X').length>=hi) return 'Xiu';
  }
  else if (t==='momentum') {
    const {n_avg,thresh,n_short,n_long,delta}=config;
    let avg=null,mom=null;
    if (tw.length>=n_avg) avg=tw.slice(0,n_avg).reduce((a,b)=>a+b,0)/n_avg;
    if (tw.length>=n_long) {
      const as=tw.slice(0,n_short).reduce((a,b)=>a+b,0)/n_short;
      const al=tw.slice(n_short,n_long).reduce((a,b)=>a+b,0)/(n_long-n_short);
      mom=as-al;
    }
    if (avg!==null&&mom!==null) {
      if (avg>thresh&&mom>=-delta) return 'Tai';
      if (avg<thresh&&mom<=delta)  return 'Xiu';
      if (mom>delta)  return 'Tai';
      if (mom<-delta) return 'Xiu';
    } else if (avg!==null) {
      if (avg>thresh) return 'Tai'; if (avg<thresh) return 'Xiu';
    }
  }
  else if (t==='streak') {
    const {follow_thresh,flip_thresh}=config;
    if (s>=follow_thresh) return last;
    if (s>=flip_thresh)   return anti;
  }
  else if (t==='count_tx') {
    const {n_win,hi,lo}=config;
    const rc=wTX.slice(-n_win);
    const tc=rc.filter(x=>x==='T').length;
    if (tc>=hi) return 'Tai'; if (tc<=lo) return 'Xiu';
  }
  else if (t==='avg_streak') {
    const {n_avg,thresh,streak_follow,streak_flip}=config;
    if (s>=streak_follow) return last;
    if (s>=streak_flip)   return anti;
    if (tw.length>=n_avg) {
      const avg=tw.slice(0,n_avg).reduce((a,b)=>a+b,0)/n_avg;
      if (avg>thresh) return 'Tai'; if (avg<thresh) return 'Xiu';
    }
  }
  // --- Cau bet (xen ke T-X-T-X) ---
  else if (t==='cau_bet') {
    // Dem so lan doi chieu trong N phien gan nhat
    const {n_win,min_flip,action}=config;
    const rc=wTX.slice(-n_win);
    let flips=0;
    for (let i=1;i<rc.length;i++) if (rc[i]!==rc[i-1]) flips++;
    if (flips>=min_flip) {
      // Dang cau bet => tiep tuc doi chieu
      return action==='follow'?last:anti;
    }
  }
  // --- Cau 1-2 (1 roi 2 roi 1 roi 2) ---
  else if (t==='cau_12') {
    const {n_win}=config;
    const rc=wTX.slice(-n_win);
    // Phat hien pattern 1-2: X,T,T,X,X,T,T...
    let groups=[]; let cur=rc[0]; let cnt=1;
    for (let i=1;i<rc.length;i++) {
      if (rc[i]===cur) cnt++;
      else { groups.push({v:cur,c:cnt}); cur=rc[i]; cnt=1; }
    }
    groups.push({v:cur,c:cnt});
    if (groups.length>=3) {
      const last2=groups.slice(-2);
      const last3=groups.slice(-3);
      // Pattern 1-2: alternating 1 and 2
      if (last3[0].c===1&&last3[1].c===2&&last3[2].c===1) return last3[2].v==='T'?'Xiu':'Tai'; // tiep theo la 2
      if (last3[0].c===2&&last3[1].c===1&&last3[2].c===2) return last3[2].v==='T'?'Xiu':'Tai'; // tiep theo la 1
      // Pattern 1-1: all single
      if (groups.slice(-4).every(g=>g.c===1)) return anti; // tiep tuc xen ke
    }
  }
  // --- Ti le T/X trong 21 phien (keo ve trung binh) ---
  else if (t==='balance_21') {
    const {thresh_hi,thresh_lo}=config;
    const tRate=c21/21;
    if (tRate>thresh_hi) return 'Xiu'; // Tai nhieu qua => keo ve Xiu
    if (tRate<thresh_lo) return 'Tai'; // Xiu nhieu qua => keo ve Tai
  }
  // --- Adaptive flip: khi sai N lien tiep, dao nguoc bat ky algo ---
  else if (t==='adaptive_flip') {
    const {base_type,base_config,flip_at}=config;
    // Tinh chuoi sai hien tai tu predLog
    let curWrong=0;
    for (const p of predLog) { if (!p.dung) curWrong++; else break; }
    const basePred=predictByConfig({type:base_type,...base_config},w,tw);
    if (curWrong>=flip_at) return basePred==='Tai'?'Xiu':'Tai';
    return basePred;
  }
  // --- Ket hop 2 dieu kien (AND logic) ---
  else if (t==='combo_and') {
    const {cond1,cond2,agree_action}=config;
    const p1=predictByConfig(cond1,w,tw);
    const p2=predictByConfig(cond2,w,tw);
    if (p1&&p2&&p1===p2) return p1; // ca 2 dong y
    // Neu khong dong y => fallback Pattern
  }
  // --- Tong diem tuyet doi (so sanh voi nguong tuyet doi) ---
  else if (t==='last_total') {
    const {n_check,hi_thresh,lo_thresh}=config;
    // Xem N phien gan nhat co tong cao hay thap
    const recent_tw=tw.slice(0,n_check);
    if (recent_tw.length<n_check) { /* fallback */ }
    else {
      const hi_cnt=recent_tw.filter(x=>x>hi_thresh).length;
      const lo_cnt=recent_tw.filter(x=>x<lo_thresh).length;
      if (hi_cnt>=Math.ceil(n_check*0.6)) return 'Tai';
      if (lo_cnt>=Math.ceil(n_check*0.6)) return 'Xiu';
    }
  }
  // --- Phan tich bien dong (variance) ---
  else if (t==='variance') {
    const {n_win,hi_var,action_hi,action_lo}=config;
    const rc=tw.slice(0,n_win);
    if (rc.length<n_win) { /* fallback */ }
    else {
      const mean=rc.reduce((a,b)=>a+b,0)/n_win;
      const variance=rc.reduce((a,b)=>a+(b-mean)*(b-mean),0)/n_win;
      if (variance>hi_var) return action_hi==='Tai'?'Tai':'Xiu';
      else return action_lo==='Tai'?'Tai':'Xiu';
    }
  }
  // --- Mean reversion: tong cao thi phien sau thap va nguoc lai ---
  else if (t==='mean_revert') {
    const {n_avg,hi_thresh,lo_thresh}=config;
    if (tw.length>=1) {
      const lastTot=tw[0]; // tong phien vua xong
      if (lastTot>hi_thresh) return 'Xiu'; // tong cao => phien sau thap
      if (lastTot<lo_thresh) return 'Tai'; // tong thap => phien sau cao
    }
    if (tw.length>=n_avg) {
      const avg=tw.slice(0,n_avg).reduce((a,b)=>a+b,0)/n_avg;
      if (avg>hi_thresh) return 'Xiu';
      if (avg<lo_thresh) return 'Tai';
    }
  }
  // --- Weighted avg (phien gan hon trong so cao hon) ---
  else if (t==='weighted_avg') {
    const {n_avg,thresh}=config;
    if (tw.length>=n_avg) {
      let wsum=0, wtot=0;
      for (let i=0;i<n_avg;i++) { const w=n_avg-i; wsum+=tw[i]*w; wtot+=w; }
      const wavg=wsum/wtot;
      if (wavg>thresh) return 'Tai';
      if (wavg<thresh) return 'Xiu';
    }
  }
  // --- Pattern 3 phien (8 combo T/X) ---
  else if (t==='pat3') {
    const {pat,action}=config; // pat = 'TTT','TTX','TXT','TXX','XTT','XTX','XXT','XXX'
    const last3=wTX.slice(-3).join('');
    if (last3===pat) return action==='BET'?last:anti;
  }
  // --- Cau 2-2 (2 roi 2 xen ke) ---
  else if (t==='cau_22') {
    const rc=wTX.slice(-8);
    if (rc.length>=8) {
      // Kiem tra pattern TTXX hoac XXTT lap lai
      const p1=rc.slice(0,4).join(''); const p2=rc.slice(4,8).join('');
      if ((p1==='TTXX'&&p2==='TTXX')||(p1==='XXTT'&&p2==='XXTT')) return last; // tiep tuc
      if ((p1==='TTXX'&&p2==='XXTT')||(p1==='XXTT'&&p2==='TTXX')) return anti; // doi
    }
  }
  // --- Dao sau chuoi dung dai (dang dung nhieu => sap sai) ---
  else if (t==='flip_after_win') {
    const {win_thresh}=config;
    let curRight=0;
    for (const p of predLog) { if (p.dung) curRight++; else break; }
    if (curRight>=win_thresh) return anti; // dang dung nhieu => dao
  }
  // --- Ket hop 3 dieu kien (avg + streak + count) ---
  else if (t==='triple_and') {
    const {n_avg,thresh,streak_min,count_n,count_hi}=config;
    let votes=0, total=0;
    if (tw.length>=n_avg) {
      total++;
      const avg=tw.slice(0,n_avg).reduce((a,b)=>a+b,0)/n_avg;
      if (avg>thresh) votes++; else if (avg<thresh) votes--;
    }
    total++;
    if (s>=streak_min) { if (last==='Tai') votes++; else votes--; }
    const rc=wTX.slice(-count_n);
    total++;
    const tc=rc.filter(x=>x==='T').length;
    if (tc>=count_hi) votes++; else if (tc<=count_n-count_hi) votes--;
    if (votes>0) return 'Tai';
    if (votes<0) return 'Xiu';
  }
  // --- Pattern N phien (4,5,6 phien) ---
  else if (t==='patN') {
    const {pat,action}=config;
    const n=pat.length;
    const lastN=wTX.slice(-n).join('');
    if (lastN===pat) return action==='BET'?last:anti;
  }
  // --- So sanh nua dau vs nua cuoi window 21 ---
  else if (t==='half_compare') {
    const {action_more_tai_recent}=config;
    const first10=wTX.slice(0,10);  // cu hon
    const last10=wTX.slice(11,21);  // moi hon
    const tFirst=first10.filter(x=>x==='T').length;
    const tLast=last10.filter(x=>x==='T').length;
    if (tLast>tFirst) return action_more_tai_recent==='follow'?'Tai':'Xiu';
    if (tLast<tFirst) return action_more_tai_recent==='follow'?'Xiu':'Tai';
  }
  // --- Tong diem chan/le ---
  else if (t==='odd_even') {
    const {action_odd,action_even}=config;
    if (tw.length>=1) {
      const lastTot=tw[0];
      if (lastTot%2===0) return action_even==='Tai'?'Tai':'Xiu';
      else return action_odd==='Tai'?'Tai':'Xiu';
    }
  }
  // --- Avg + Variance ket hop ---
  else if (t==='avg_var') {
    const {n_avg,thresh,n_var,hi_var,trust_action}=config;
    if (tw.length>=Math.max(n_avg,n_var)) {
      const avg=tw.slice(0,n_avg).reduce((a,b)=>a+b,0)/n_avg;
      const mean_v=tw.slice(0,n_var).reduce((a,b)=>a+b,0)/n_var;
      const variance=tw.slice(0,n_var).reduce((a,b)=>a+(b-mean_v)*(b-mean_v),0)/n_var;
      const avgPred=avg>thresh?'Tai':'Xiu';
      if (variance<=hi_var) return avgPred; // bien dong thap => tin tuong avg
      // bien dong cao => khong chac, dung nguoc
      return trust_action==='follow'?avgPred:(avgPred==='Tai'?'Xiu':'Tai');
    }
  }
  // --- Multi-window vote (window 7, 14, 21 bau chon) ---
  else if (t==='multi_window_vote') {
    const {thresh}=config;
    let votes=0;
    // Window 7
    const t7=wTX.slice(-7).filter(x=>x==='T').length;
    if (t7/7>thresh) votes++; else if (t7/7<1-thresh) votes--;
    // Window 14
    const t14=wTX.slice(-14).filter(x=>x==='T').length;
    if (t14/14>thresh) votes++; else if (t14/14<1-thresh) votes--;
    // Window 21
    const t21=wTX.filter(x=>x==='T').length;
    if (t21/21>thresh) votes++; else if (t21/21<1-thresh) votes--;
    if (votes>0) return 'Tai';
    if (votes<0) return 'Xiu';
  }
  // --- Cau 1-3 (1 roi 3 xen ke) ---
  else if (t==='cau_13') {
    const rc=wTX.slice(-8);
    if (rc.length>=8) {
      let groups=[]; let cur=rc[0]; let cnt=1;
      for (let i=1;i<rc.length;i++) {
        if (rc[i]===cur) cnt++;
        else { groups.push({v:cur,c:cnt}); cur=rc[i]; cnt=1; }
      }
      groups.push({v:cur,c:cnt});
      if (groups.length>=3) {
        const g=groups.slice(-3);
        if ((g[0].c===1&&g[1].c===3)||(g[0].c===3&&g[1].c===1)) {
          // Dang trong pattern 1-3
          const expected=g[1].c===3?1:3;
          if (g[2].c<expected) return g[2].v==='T'?'Tai':'Xiu'; // tiep tuc chuoi hien tai
          else return g[2].v==='T'?'Xiu':'Tai'; // doi sang loai khac
        }
      }
    }
  }
  // --- Sliding window acceleration (toc do thay doi) ---
  else if (t==='acceleration') {
    const {n1,n2,n3}=config; // 3 window ngan dan
    if (tw.length>=n1) {
      const a1=tw.slice(0,n3).reduce((a,b)=>a+b,0)/n3;
      const a2=tw.slice(n3,n3+n2).reduce((a,b)=>a+b,0)/n2;
      const a3=tw.slice(n3+n2,n1).reduce((a,b)=>a+b,0)/(n1-n3-n2);
      // Gia toc: a1>a2>a3 => dang tang manh => Tai
      if (a1>a2&&a2>a3) return 'Tai';
      if (a1<a2&&a2<a3) return 'Xiu';
    }
  }
  // --- Cau 3-1 (3 roi 1 xen ke) ---
  else if (t==='cau_31') {
    const rc=wTX.slice(-8);
    if (rc.length>=6) {
      let groups=[]; let cur=rc[0]; let cnt=1;
      for (let i=1;i<rc.length;i++) {
        if (rc[i]===cur) cnt++;
        else { groups.push({v:cur,c:cnt}); cur=rc[i]; cnt=1; }
      }
      groups.push({v:cur,c:cnt});
      if (groups.length>=2) {
        const g=groups.slice(-2);
        if ((g[0].c===3&&g[1].c>=1)||(g[0].c===1&&g[1].c>=3)) {
          const expected=g[0].c===3?1:3;
          if (g[1].c<expected) return g[1].v==='T'?'Tai':'Xiu';
          else return g[1].v==='T'?'Xiu':'Tai';
        }
      }
    }
  }
  // --- Cau 2-1 (2 roi 1 xen ke) ---
  else if (t==='cau_21') {
    const rc=wTX.slice(-9);
    if (rc.length>=6) {
      let groups=[]; let cur=rc[0]; let cnt=1;
      for (let i=1;i<rc.length;i++) {
        if (rc[i]===cur) cnt++;
        else { groups.push({v:cur,c:cnt}); cur=rc[i]; cnt=1; }
      }
      groups.push({v:cur,c:cnt});
      if (groups.length>=3) {
        const g=groups.slice(-3);
        if ((g[0].c===2&&g[1].c===1&&g[2].c===2)||(g[0].c===1&&g[1].c===2&&g[2].c===1)) {
          const expected=g[2].c===2?1:2;
          if (g[2].c<expected) return g[2].v==='T'?'Tai':'Xiu';
          else return g[2].v==='T'?'Xiu':'Tai';
        }
      }
    }
  }
  // --- Phan tich xuc xac rieng le (tong xuc xac 1+2+3) ---
  else if (t==='dice_sum_range') {
    const {hi,lo}=config;
    if (tw.length>=1) {
      const lt=tw[0];
      if (lt>=hi) return 'Xiu'; // tong cao => phien sau thap
      if (lt<=lo) return 'Tai'; // tong thap => phien sau cao
    }
  }
  // --- So sanh 2 avg khac nhau (crossover) ---
  else if (t==='avg_crossover') {
    const {n_fast,n_slow}=config;
    if (tw.length>=n_slow) {
      const fast=tw.slice(0,n_fast).reduce((a,b)=>a+b,0)/n_fast;
      const slow=tw.slice(0,n_slow).reduce((a,b)=>a+b,0)/n_slow;
      if (fast>slow) return 'Tai';  // fast vuot slow => tang
      if (fast<slow) return 'Xiu';  // fast xuong duoi slow => giam
    }
  }
  // --- Dem so lan doi chieu trong window (oscillation) ---
  else if (t==='oscillation') {
    const {n_win,hi_flip,lo_flip}=config;
    const rc=wTX.slice(-n_win);
    let flips=0;
    for (let i=1;i<rc.length;i++) if (rc[i]!==rc[i-1]) flips++;
    if (flips>=hi_flip) return anti; // dao nhieu => tiep tuc dao
    if (flips<=lo_flip) return last; // it dao => theo chuoi
  }
  // --- Tong diem trung binh so voi lich su dai han ---
  else if (t==='long_short_compare') {
    const {n_short,n_long,thresh_diff}=config;
    if (tw.length>=n_long) {
      const short_avg=tw.slice(0,n_short).reduce((a,b)=>a+b,0)/n_short;
      const long_avg=tw.slice(0,n_long).reduce((a,b)=>a+b,0)/n_long;
      const diff=short_avg-long_avg;
      if (diff>thresh_diff) return 'Tai';
      if (diff<-thresh_diff) return 'Xiu';
    }
  }
  // --- Pattern 6 phien (64 combo) ---
  else if (t==='pat6') {
    const {pat,action}=config;
    const last6=wTX.slice(-6).join('');
    if (last6===pat) return action==='BET'?last:anti;
  }
  // --- Ket hop avg + odd_even ---
  else if (t==='avg_oddeven') {
    const {n_avg,thresh,action_odd,action_even}=config;
    if (tw.length>=n_avg) {
      const avg=tw.slice(0,n_avg).reduce((a,b)=>a+b,0)/n_avg;
      if (avg>thresh) {
        return tw[0]%2===0?action_even:action_odd;
      } else {
        return tw[0]%2===0?(action_even==='Tai'?'Xiu':'Tai'):(action_odd==='Tai'?'Xiu':'Tai');
      }
    }
  }
  // --- Streak + Count TX ket hop ---
  else if (t==='streak_count') {
    const {streak_thresh,count_n,count_hi,count_lo}=config;
    const rc=wTX.slice(-count_n);
    const tc=rc.filter(x=>x==='T').length;
    if (s>=streak_thresh) {
      // Chuoi dai: kiem tra count de quyet dinh theo hay dao
      if (tc>=count_hi) return last;  // chuoi dai + nhieu T => tiep tuc
      if (tc<=count_lo) return anti;  // chuoi dai + it T => dao
      return last;
    }
  }
  // --- Phan tich nhip (rhythm): TXTTXTTXT... ---
  else if (t==='rhythm') {
    const {period,offset,action}=config;
    // Kiem tra xem co pattern lap lai theo chu ky khong
    const rc=wTX.slice(-period*3);
    if (rc.length>=period*2) {
      let match=0;
      for (let i=0;i<period;i++) {
        if (rc[rc.length-1-i]===rc[rc.length-1-i-period]) match++;
      }
      if (match>=Math.ceil(period*0.7)) {
        // Co nhip => du doan theo nhip
        const nextInPattern=rc[rc.length-1-offset];
        return action==='follow'?nextInPattern==='T'?'Tai':'Xiu':nextInPattern==='T'?'Xiu':'Tai';
      }
    }
  }
  // --- EMA (Exponential Moving Average) ---
  else if (t==='ema') {
    const {n,thresh,alpha}=config;
    if (tw.length>=n) {
      let ema=tw[n-1];
      for (let i=n-2;i>=0;i--) ema=alpha*tw[i]+(1-alpha)*ema;
      if (ema>thresh) return 'Tai';
      if (ema<thresh) return 'Xiu';
    }
  }
  // --- RSI-style ---
  else if (t==='rsi_style') {
    const {n,thresh_hi,thresh_lo}=config;
    if (tw.length>=n+1) {
      let gains=0,losses=0;
      for (let i=0;i<n;i++) {
        const diff=tw[i]-tw[i+1];
        if (diff>0) gains+=diff; else losses+=(-diff);
      }
      const rs=losses===0?100:(gains/losses);
      const rsi=100-(100/(1+rs));
      if (rsi>thresh_hi) return 'Xiu';
      if (rsi<thresh_lo) return 'Tai';
    }
  }
  // --- Bollinger-style ---
  else if (t==='bollinger') {
    const {n,mult}=config;
    if (tw.length>=n) {
      const avg=tw.slice(0,n).reduce((a,b)=>a+b,0)/n;
      const std=Math.sqrt(tw.slice(0,n).reduce((a,b)=>a+(b-avg)*(b-avg),0)/n);
      const upper=avg+mult*std;
      const lower=avg-mult*std;
      if (tw[0]>upper) return 'Xiu';
      if (tw[0]<lower) return 'Tai';
      if (tw[0]>avg)   return 'Tai';
      return 'Xiu';
    }
  }
  // --- Markov chain ---
  else if (t==='markov') {
    const {n,thresh}=config;
    if (w.length>=n+1) {
      const recent=wTX.slice(-n-1);
      let tt=0,tx=0,xt=0,xx=0;
      for (let i=0;i<recent.length-1;i++) {
        if (recent[i]==='T'&&recent[i+1]==='T') tt++;
        else if (recent[i]==='T'&&recent[i+1]==='X') tx++;
        else if (recent[i]==='X'&&recent[i+1]==='T') xt++;
        else xx++;
      }
      const curLast=wTX[wTX.length-1];
      if (curLast==='T') {
        const total=tt+tx; if (total>0) return tt/total>thresh?'Tai':'Xiu';
      } else {
        const total=xt+xx; if (total>0) return xt/total>thresh?'Tai':'Xiu';
      }
    }
  }
  // --- Cau 1-4 ---
  else if (t==='cau_14') {
    const rc=wTX.slice(-10);
    if (rc.length>=5) {
      let groups=[]; let cur=rc[0]; let cnt=1;
      for (let i=1;i<rc.length;i++) {
        if (rc[i]===cur) cnt++;
        else { groups.push({v:cur,c:cnt}); cur=rc[i]; cnt=1; }
      }
      groups.push({v:cur,c:cnt});
      if (groups.length>=2) {
        const g=groups.slice(-2);
        if ((g[0].c===1&&g[1].c>=1)||(g[0].c===4&&g[1].c>=1)) {
          const expected=g[0].c===1?4:1;
          if (g[1].c<expected) return g[1].v==='T'?'Tai':'Xiu';
          else return g[1].v==='T'?'Xiu':'Tai';
        }
      }
    }
  }
  // --- Cau 2-3 ---
  else if (t==='cau_23') {
    const rc=wTX.slice(-10);
    if (rc.length>=5) {
      let groups=[]; let cur=rc[0]; let cnt=1;
      for (let i=1;i<rc.length;i++) {
        if (rc[i]===cur) cnt++;
        else { groups.push({v:cur,c:cnt}); cur=rc[i]; cnt=1; }
      }
      groups.push({v:cur,c:cnt});
      if (groups.length>=3) {
        const g=groups.slice(-3);
        if ((g[0].c===2&&g[1].c===3)||(g[0].c===3&&g[1].c===2)) {
          const expected=g[1].c===3?2:3;
          if (g[2].c<expected) return g[2].v==='T'?'Tai':'Xiu';
          else return g[2].v==='T'?'Xiu':'Tai';
        }
      }
    }
  }
  // --- EMA + Count TX ---
  else if (t==='ema_count') {
    const {n,alpha,thresh,n_win,hi}=config;
    if (tw.length>=n) {
      let ema=tw[n-1];
      for (let i=n-2;i>=0;i--) ema=alpha*tw[i]+(1-alpha)*ema;
      if (ema>thresh) return 'Tai';
      if (ema<thresh) return 'Xiu';
    }
    const rc=wTX.slice(-n_win);
    if (rc.filter(x=>x==='T').length>=hi) return 'Tai';
    if (rc.filter(x=>x==='X').length>=hi) return 'Xiu';
  }
  else if (t==='pattern75') {
    if (s>=6) return last;
    const k7=keyOf(wTX.slice(-7)); if (T7[k7]) return T7[k7]==='BET'?last:anti;
    const k5=keyOf(wTX.slice(-5)); if (T5[k5]) return T5[k5]==='BET'?last:anti;
    if (s>=5) return anti; if (s===4) return anti;
    if (s===3&&c5>=3) return last; if (s===2&&c5===3) return last;
    if (s===2&&c5>=4) return anti; if (s===1&&c5>=4) return last;
    if (s===1&&c5<=2) return anti; if (c10>=6) return last;
    return anti;
  }

  // Fallback Pattern-7+5
  if (s>=6) return last;
  const k7=keyOf(wTX.slice(-7)); if (T7[k7]) return T7[k7]==='BET'?last:anti;
  const k5=keyOf(wTX.slice(-5)); if (T5[k5]) return T5[k5]==='BET'?last:anti;
  if (s>=5) return anti; if (s===4) return anti;
  if (s===3&&c5>=3) return last; if (s===2&&c5===3) return last;
  if (s===2&&c5>=4) return anti; if (s===1&&c5>=4) return last;
  if (s===1&&c5<=2) return anti; if (c10>=6) return last;
  return anti;
}

// Sinh danh sach tat ca config can test
function generateConfigs() {
  const cfgs = [];

  // 1. AvgTotal (trung binh tong diem N phien)
  for (let na=5;na<=15;na++) for (let tx=80;tx<=125;tx+=5)
    cfgs.push({type:'avg_total',n_avg:na,thresh:tx/10,name:`AvgTotal(n=${na},t=${tx/10})`});

  // 2. AvgTotal + Count TX (avg + dem T/X)
  for (let na=7;na<=12;na++) for (let tx=85;tx<=115;tx+=5) {
    const th=tx/10;
    for (let nw=5;nw<=13;nw++) for (let hi=Math.ceil(nw*0.6);hi<=nw;hi++)
      cfgs.push({type:'avg_count',n_avg:na,thresh:th,n_win:nw,hi,name:`AvgCount(na=${na},t=${th},nw=${nw},hi=${hi})`});
  }

  // 3. Momentum (xu huong tang/giam)
  for (let na=7;na<=13;na++) for (let tx=86;tx<=114;tx+=4) {
    const th=tx/10;
    for (let ns=2;ns<=5;ns++) for (let nl=ns+3;nl<=12;nl++) for (let dx=2;dx<=15;dx+=2)
      cfgs.push({type:'momentum',n_avg:na,thresh:th,n_short:ns,n_long:nl,delta:dx/10,name:`Mom(na=${na},t=${th},ns=${ns},nl=${nl},d=${dx/10})`});
  }

  // 4. Streak-based (theo/dao chuoi)
  for (let sf=3;sf<=8;sf++) for (let fp=2;fp<=sf-1;fp++)
    cfgs.push({type:'streak',follow_thresh:sf,flip_thresh:fp,name:`Streak(f=${sf},p=${fp})`});

  // 5. Count TX (dem T/X thuan)
  for (let nw=5;nw<=15;nw++) for (let hi=Math.ceil(nw*0.6);hi<=nw;hi++) for (let lo=0;lo<=Math.floor(nw*0.35);lo++)
    cfgs.push({type:'count_tx',n_win:nw,hi,lo,name:`CountTX(nw=${nw},hi=${hi},lo=${lo})`});

  // 6. AvgTotal + Streak
  for (let na=7;na<=12;na++) for (let tx=87;tx<=113;tx+=4) {
    const th=tx/10;
    for (let sf=4;sf<=8;sf++) for (let fp=2;fp<=sf-1;fp++)
      cfgs.push({type:'avg_streak',n_avg:na,thresh:th,streak_follow:sf,streak_flip:fp,name:`AvgStreak(na=${na},t=${th},sf=${sf},fp=${fp})`});
  }

  // 7. Cau bet (xen ke T-X lien tuc)
  for (let nw=4;nw<=10;nw++) for (let mf=Math.ceil(nw*0.6);mf<=nw-1;mf++) {
    cfgs.push({type:'cau_bet',n_win:nw,min_flip:mf,action:'follow',name:`CauBet(nw=${nw},mf=${mf},follow)`});
    cfgs.push({type:'cau_bet',n_win:nw,min_flip:mf,action:'anti',name:`CauBet(nw=${nw},mf=${mf},anti)`});
  }

  // 8. Ti le T/X trong 21 phien (keo ve can bang)
  for (let hi=60;hi<=80;hi+=5) for (let lo=20;lo<=40;lo+=5)
    if (hi+lo<=100)
      cfgs.push({type:'balance_21',thresh_hi:hi/100,thresh_lo:lo/100,name:`Balance21(hi=${hi}%,lo=${lo}%)`});

  // 9. Tong diem tuyet doi (N phien gan nhat co tong cao/thap)
  for (let nc=3;nc<=8;nc++) for (let hi=12;hi<=16;hi++) for (let lo=6;lo<=9;lo++)
    cfgs.push({type:'last_total',n_check:nc,hi_thresh:hi,lo_thresh:lo,name:`LastTotal(n=${nc},hi>${hi},lo<${lo})`});

  // 10. Phan tich bien dong (variance cao => ngau nhien, thap => co xu huong)
  for (let nw=5;nw<=10;nw++) for (let hv=3;hv<=8;hv++) {
    cfgs.push({type:'variance',n_win:nw,hi_var:hv,action_hi:'Xiu',action_lo:'Tai',name:`Var(nw=${nw},hv=${hv},hi=X)`});
    cfgs.push({type:'variance',n_win:nw,hi_var:hv,action_hi:'Tai',action_lo:'Xiu',name:`Var(nw=${nw},hv=${hv},hi=T)`});
  }

  // 11. Adaptive flip AvgTotal (khi sai N lien tiep thi dao)
  for (let na=8;na<=12;na++) for (let tx=88;tx<=112;tx+=4) {
    const th=tx/10;
    for (let fa=2;fa<=4;fa++)
      cfgs.push({type:'adaptive_flip',base_type:'avg_total',base_config:{n_avg:na,thresh:th},flip_at:fa,name:`AdaptFlip(avg,na=${na},t=${th},fa=${fa})`});
  }

  // 12. Combo AND: AvgTotal + CountTX phai dong y
  for (let na=8;na<=12;na++) for (let tx=88;tx<=112;tx+=4) {
    const th=tx/10;
    for (let nw=7;nw<=11;nw++) for (let hi=Math.ceil(nw*0.65);hi<=nw;hi++)
      cfgs.push({type:'combo_and',
        cond1:{type:'avg_total',n_avg:na,thresh:th},
        cond2:{type:'count_tx',n_win:nw,hi,lo:Math.floor(nw*0.35)},
        name:`ComboAND(avg_na=${na}_t=${th},cnt_nw=${nw}_hi=${hi})`});
  }

  // 13. Mean reversion (tong cao => phien sau thap)
  for (let hi=12;hi<=16;hi++) for (let lo=6;lo<=9;lo++) for (let na=3;na<=8;na++)
    cfgs.push({type:'mean_revert',n_avg:na,hi_thresh:hi,lo_thresh:lo,name:`MeanRevert(hi>${hi},lo<${lo},n=${na})`});

  // 14. Weighted avg (phien gan trong so cao hon)
  for (let na=5;na<=15;na++) for (let tx=80;tx<=125;tx+=5)
    cfgs.push({type:'weighted_avg',n_avg:na,thresh:tx/10,name:`WeightedAvg(n=${na},t=${tx/10})`});

  // 15. Pattern 3 phien (8 combo)
  const pat3list=['TTT','TTX','TXT','TXX','XTT','XTX','XXT','XXX'];
  for (const pat of pat3list) {
    cfgs.push({type:'pat3',pat,action:'BET', name:`Pat3(${pat}->BET)`});
    cfgs.push({type:'pat3',pat,action:'NGUOC',name:`Pat3(${pat}->NGUOC)`});
  }

  // 16. Cau 2-2
  cfgs.push({type:'cau_22',name:'Cau22'});

  // 17. Dao sau chuoi dung dai
  for (let wt=3;wt<=8;wt++)
    cfgs.push({type:'flip_after_win',win_thresh:wt,name:`FlipAfterWin(wt=${wt})`});

  // 18. Triple AND (avg + streak + count)
  for (let na=8;na<=12;na++) for (let tx=88;tx<=112;tx+=4) {
    const th=tx/10;
    for (let sm=2;sm<=5;sm++) for (let cn=7;cn<=11;cn++) for (let ch=Math.ceil(cn*0.6);ch<=cn;ch++)
      cfgs.push({type:'triple_and',n_avg:na,thresh:th,streak_min:sm,count_n:cn,count_hi:ch,
        name:`TripleAND(na=${na},t=${th},sm=${sm},cn=${cn},ch=${ch})`});
  }

  // 20. Pattern N phien (4 phien = 16 combo, 5 phien = 32 combo)
  const genPats=(n)=>{const r=[];const f=(s)=>{if(s.length===n){r.push(s);return;}f(s+'T');f(s+'X');};f('');return r;};
  for (const pat of genPats(4)) {
    cfgs.push({type:'patN',pat,action:'BET',  name:`Pat4(${pat}->BET)`});
    cfgs.push({type:'patN',pat,action:'NGUOC',name:`Pat4(${pat}->NGUOC)`});
  }
  for (const pat of genPats(5)) {
    cfgs.push({type:'patN',pat,action:'BET',  name:`Pat5(${pat}->BET)`});
    cfgs.push({type:'patN',pat,action:'NGUOC',name:`Pat5(${pat}->NGUOC)`});
  }

  // 21. So sanh nua dau vs nua cuoi window 21
  cfgs.push({type:'half_compare',action_more_tai_recent:'follow',name:'HalfCompare(follow)'});
  cfgs.push({type:'half_compare',action_more_tai_recent:'anti',  name:'HalfCompare(anti)'});

  // 22. Tong diem chan/le
  cfgs.push({type:'odd_even',action_odd:'Tai', action_even:'Xiu',name:'OddEven(odd=T)'});
  cfgs.push({type:'odd_even',action_odd:'Xiu', action_even:'Tai',name:'OddEven(odd=X)'});

  // 23. Avg + Variance ket hop
  for (let na=8;na<=12;na++) for (let tx=88;tx<=112;tx+=4) {
    const th=tx/10;
    for (let nv=5;nv<=10;nv++) for (let hv=3;hv<=8;hv++) {
      cfgs.push({type:'avg_var',n_avg:na,thresh:th,n_var:nv,hi_var:hv,trust_action:'follow',name:`AvgVar(na=${na},t=${th},nv=${nv},hv=${hv},follow)`});
      cfgs.push({type:'avg_var',n_avg:na,thresh:th,n_var:nv,hi_var:hv,trust_action:'anti',  name:`AvgVar(na=${na},t=${th},nv=${nv},hv=${hv},anti)`});
    }
  }

  // 24. Multi-window vote (7, 14, 21 bau chon)
  for (let tx=52;tx<=65;tx+=3)
    cfgs.push({type:'multi_window_vote',thresh:tx/100,name:`MultiVote(t=${tx/100})`});

  // 25. Cau 1-3
  cfgs.push({type:'cau_13',name:'Cau13'});

  // 26. Acceleration (toc do thay doi tong diem)
  for (let n3=2;n3<=4;n3++) for (let n2=2;n2<=4;n2++) for (let n1=n3+n2+2;n1<=12;n1++)
    cfgs.push({type:'acceleration',n1,n2,n3,name:`Accel(n1=${n1},n2=${n2},n3=${n3})`});

  // 27. Cau 3-1
  cfgs.push({type:'cau_31',name:'Cau31'});

  // 28. Cau 2-1
  cfgs.push({type:'cau_21',name:'Cau21'});

  // 29. Dice sum range (tong xuc xac cao/thap => phien sau nguoc lai)
  for (let hi=13;hi<=17;hi++) for (let lo=5;lo<=9;lo++)
    cfgs.push({type:'dice_sum_range',hi,lo,name:`DiceSumRange(hi>=${hi},lo<=${lo})`});

  // 30. Avg crossover (fast avg vuot slow avg)
  for (let nf=2;nf<=6;nf++) for (let ns=nf+2;ns<=15;ns++)
    cfgs.push({type:'avg_crossover',n_fast:nf,n_slow:ns,name:`AvgCross(fast=${nf},slow=${ns})`});

  // 31. Oscillation (dem so lan doi chieu)
  for (let nw=5;nw<=12;nw++) for (let hi=Math.ceil(nw*0.7);hi<=nw-1;hi++) for (let lo=0;lo<=Math.floor(nw*0.3);lo++)
    cfgs.push({type:'oscillation',n_win:nw,hi_flip:hi,lo_flip:lo,name:`Osc(nw=${nw},hi=${hi},lo=${lo})`});

  // 32. Long-short compare (avg ngan vs dai han)
  for (let ns=3;ns<=7;ns++) for (let nl=ns+5;nl<=20;nl++) for (let td=1;td<=4;td++)
    cfgs.push({type:'long_short_compare',n_short:ns,n_long:nl,thresh_diff:td/2,name:`LongShort(ns=${ns},nl=${nl},td=${td/2})`});

  // 33. Pattern 6 phien (64 combo - chi lay 1 nua de giam config)
  const genPats6=()=>{const r=[];const f=(s)=>{if(s.length===6){r.push(s);return;}f(s+'T');f(s+'X');};f('');return r;};
  for (const pat of genPats6()) {
    cfgs.push({type:'pat6',pat,action:'BET',  name:`Pat6(${pat}->BET)`});
    cfgs.push({type:'pat6',pat,action:'NGUOC',name:`Pat6(${pat}->NGUOC)`});
  }

  // 34. Avg + odd/even
  for (let na=8;na<=12;na++) for (let tx=88;tx<=112;tx+=4) {
    const th=tx/10;
    cfgs.push({type:'avg_oddeven',n_avg:na,thresh:th,action_odd:'Tai', action_even:'Xiu',name:`AvgOdd(na=${na},t=${th},odd=T)`});
    cfgs.push({type:'avg_oddeven',n_avg:na,thresh:th,action_odd:'Xiu', action_even:'Tai',name:`AvgOdd(na=${na},t=${th},odd=X)`});
  }

  // 35. Streak + Count TX
  for (let st=2;st<=6;st++) for (let cn=7;cn<=12;cn++) {
    const hi=Math.ceil(cn*0.65); const lo=Math.floor(cn*0.35);
    cfgs.push({type:'streak_count',streak_thresh:st,count_n:cn,count_hi:hi,count_lo:lo,name:`StreakCount(st=${st},cn=${cn})`});
  }

  // 36. Rhythm (phat hien nhip lap lai)
  for (let period=3;period<=7;period++) for (let offset=1;offset<=period-1;offset++) {
    cfgs.push({type:'rhythm',period,offset,action:'follow',name:`Rhythm(p=${period},o=${offset},follow)`});
    cfgs.push({type:'rhythm',period,offset,action:'anti',  name:`Rhythm(p=${period},o=${offset},anti)`});
  }

  // 38. EMA
  for (let n=5;n<=15;n++) for (let tx=80;tx<=125;tx+=5) for (let ax=2;ax<=8;ax++)
    cfgs.push({type:'ema',n,thresh:tx/10,alpha:ax/10,name:`EMA(n=${n},t=${tx/10},a=${ax/10})`});

  // 39. RSI-style
  for (let n=5;n<=14;n++) for (let hi=60;hi<=80;hi+=5) for (let lo=20;lo<=40;lo+=5)
    cfgs.push({type:'rsi_style',n,thresh_hi:hi,thresh_lo:lo,name:`RSI(n=${n},hi=${hi},lo=${lo})`});

  // 40. Bollinger-style
  for (let n=5;n<=15;n++) for (let mult=10;mult<=30;mult+=5)
    cfgs.push({type:'bollinger',n,mult:mult/10,name:`Bollinger(n=${n},mult=${mult/10})`});

  // 41. Markov chain
  for (let n=10;n<=21;n++) for (let tx=50;tx<=75;tx+=5)
    cfgs.push({type:'markov',n,thresh:tx/100,name:`Markov(n=${n},t=${tx/100})`});

  // 42. Cau 1-4
  cfgs.push({type:'cau_14',name:'Cau14'});

  // 43. Cau 2-3
  cfgs.push({type:'cau_23',name:'Cau23'});

  // 44. EMA + Count TX
  for (let n=7;n<=12;n++) for (let tx=88;tx<=112;tx+=4) for (let ax=2;ax<=6;ax++) {
    const th=tx/10; const alpha=ax/10;
    for (let nw=7;nw<=11;nw++) for (let hi=Math.ceil(nw*0.65);hi<=nw;hi++)
      cfgs.push({type:'ema_count',n,alpha,thresh:th,n_win:nw,hi,name:`EMACount(n=${n},a=${alpha},t=${th},nw=${nw},hi=${hi})`});
  }

  // 45. Pattern-7+5 baseline
  cfgs.push({type:'pattern75',name:'Pattern75'});

  return cfgs;
}// Brute-force search tren du lieu hien co
function runAutoSearch() {
  if (autoSearchState.running) return;
  const n = lichSu.length;
  if (n < SEARCH_MIN_PHIEN + WINDOW) {
    console.log('[SEARCH] Chua du '+SEARCH_MIN_PHIEN+' phien (hien co '+n+')');
    return;
  }

  autoSearchState.running = true;
  autoSearchState.iterations++;
  const iter = autoSearchState.iterations;
  console.log('[SEARCH] Bat dau iter='+iter+' tren '+n+' phien...');

  // Chay async de khong block event loop
  setImmediate(() => {
    try {
      const sorted  = lichSu.slice().sort((a,b)=>a.Phien-b.Phien);
      const results = sorted.map(x=>x.Ket_qua);
      const totals  = sorted.map(x=>x.Tong);
      const testN   = Math.min(SEARCH_TEST_WINDOW, n - WINDOW);
      const startIdx = Math.max(WINDOW, n - testN);
      const configs  = generateConfigs();
      let best = null;

      for (const cfg of configs) {
        const preds = [];
        for (let i=startIdx; i<n; i++) {
          const w  = results.slice(i-WINDOW, i);
          const tw = totals.slice(i-15, i).reverse();
          preds.push([predictByConfig(cfg, w, tw), results[i]]);
        }
        const ev = evalPreds(preds);
        const c = { ...ev, config:cfg, name:cfg.name };
        if (!best ||
            c.max_sai < best.max_sai ||
            (c.max_sai===best.max_sai && c.acc>best.acc) ||
            (c.max_sai===best.max_sai && c.acc===best.acc && c.max_dung>best.max_dung))
          best = c;
      }

      if (!best) { autoSearchState.running=false; return; }
      best.achieved_target = best.max_sai <= SEARCH_TARGET_MAX_SAI;
      best.test_phien  = testN;
      best.total_phien = n;
      best.timestamp   = new Date().toISOString();
      best.iteration   = iter;

      const prev = autoSearchState.best;
      if (!prev || best.max_sai<prev.max_sai || (best.max_sai===prev.max_sai && best.acc>prev.acc)) {
        autoSearchState.best = best;
        console.log('[SEARCH] *** NEW BEST iter='+iter+': '+best.name+
          ' acc='+best.acc.toFixed(1)+'% max_sai='+best.max_sai+
          ' max_dung='+best.max_dung+' target='+best.achieved_target+' ***');
      } else {
        console.log('[SEARCH] iter='+iter+' best='+best.name+
          ' acc='+best.acc.toFixed(1)+'% max_sai='+best.max_sai);
      }

      autoSearchState.history.unshift({
        iter, acc:best.acc, max_sai:best.max_sai, max_dung:best.max_dung,
        name:best.name, achieved:best.achieved_target, ts:best.timestamp
      });
      if (autoSearchState.history.length>30) autoSearchState.history=autoSearchState.history.slice(0,30);
      autoSearchState.last_search_phien_count = n;
    } catch(e) {
      console.error('[SEARCH ERR] '+e.message);
    } finally {
      autoSearchState.running = false;
    }
  });
}

// Trigger search khi co du phien moi
function maybeRunSearch() {
  const n = lichSu.length;
  if (n < SEARCH_MIN_PHIEN + WINDOW) return;
  if (autoSearchState.running) return;
  if (n - autoSearchState.last_search_phien_count >= SEARCH_INTERVAL_PHIEN) {
    runAutoSearch();
  }
}

// ============================================================
// PREDICTION LOG STATE
// ============================================================
let predLog = [];       // { phien, pred, actual, correct, algo, conf, time }
let pendingPred = null; // { pred, algo, conf } — cho phien tiep theo

let latestSession = { Phien:null, Xuc_xac_1:null, Xuc_xac_2:null, Xuc_xac_3:null, Tong:null, Ket_qua:'', id:'@tiendataox' };
let lichSu = [];
let currentSessionId = null;

const WEBSOCKET_URL = "wss://websocket.azhkthg1.net/websocket?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbW91bnQiOjAsInVzZXJuYW1lIjoiU0NfYXBpc3Vud2luMTIzIn0.hgrRbSV6vnBwJMg9ZFtbx3rRu9mX_hZMZ_m5gMNhkw0";
const WS_HEADERS = { "User-Agent":"Mozilla/5.0","Origin":"https://play.sun.win" };
const RECONNECT_DELAY = 2500;
const PING_INTERVAL = 15000;
let lastKnownPhien = null; // phien cuoi cung da xu ly thanh cong

const initialMessages = [
  [1,"MiniGame","GM_apivopnha","WangLin",{"info":"{\"ipAddress\":\"14.249.227.107\",\"wsToken\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJnZW5kZXIiOjAsImNhblZpZXdTdGF0IjpmYWxzZSwiZGlzcGxheU5hbWUiOiI5ODE5YW5zc3MiLCJib3QiOjAsImlzTWVyY2hhbnQiOmZhbHNlLCJ2ZXJpZmllZEJhbmtBY2NvdW50IjpmYWxzZSwicGxheUV2ZW50TG9iYnkiOmZhbHNlLCJjdXN0b21lcklkIjozMjMyODExNTEsImFmZklkIjoic3VuLndpbiIsImJhbm5lZCI6ZmFsc2UsImJyYW5kIjoiZ2VtIiwidGltZXN0YW1wIjoxNzYzMDMyOTI4NzcwLCJsb2NrR2FtZXMiOltdLCJhbW91bnQiOjAsImxvY2tDaGF0IjpmYWxzZSwicGhvbmVWZXJpZmllZCI6ZmFsc2UsImlwQWRkcmVzcyI6IjE0LjI0OS4yMjcuMTA3IiwibXV0ZSI6ZmFsc2UsImF2YXRhciI6Imh0dHBzOi8vaW1hZ2VzLnN3aW5zaG9wLm5ldC9pbWFnZXMvYXZhdGFyL2F2YXRhcl8wNS5wbmciLCJwbGF0Zm9ybUlkIjo0LCJ1c2VySWQiOiI4ODM4NTMzZS1kZTQzLTRiOGQtOTUwMy02MjFmNDA1MDUzNGUiLCJyZWdUaW1lIjoxNzYxNjMyMzAwNTc2LCJwaG9uZSI6IiIsImRlcG9zaXQiOmZhbHNlLCJ1c2VybmFtZSI6IkdNX2FwaXZvcG5oYSJ9.guH6ztJSPXUL1cU8QdMz8O1Sdy_SbxjSM-CDzWPTr-0\",\"locale\":\"vi\",\"userId\":\"8838533e-de43-4b8d-9503-621f4050534e\",\"username\":\"GM_apivopnha\",\"timestamp\":1763032928770,\"refreshToken\":\"e576b43a64e84f789548bfc7c4c8d1e5.7d4244a361e345908af95ee2e8ab2895\"}","signature":"45EF4B318C883862C36E1B189A1DF5465EBB60CB602BA05FAD8FCBFCD6E0DA8CB3CE65333EDD79A2BB4ABFCE326ED5525C7D971D9DEDB5A17A72764287FFE6F62CBC2DF8A04CD8EFF8D0D5AE27046947ADE45E62E644111EFDE96A74FEC635A97861A425FF2B5732D74F41176703CA10CFEED67D0745FF15EAC1065E1C8BCBFA"}],
  // Request lich su nhieu nhat co the (5000 phien)
  [6,"MiniGame","taixiuPlugin",{cmd:1005, count:5000}],
  [6,"MiniGame","taixiuPlugin",{cmd:1005}],
  [6,"MiniGame","lobbyPlugin",{cmd:10001}]
];

let ws=null, pingInterval=null, reconnectTimeout=null;

function connectWebSocket() {
  if (ws) { ws.removeAllListeners(); try{ws.close();}catch(e){} }
  ws = new WebSocket(WEBSOCKET_URL, { headers: WS_HEADERS });
  ws.on('open', () => {
    console.log('[OK] WebSocket connected.');
    initialMessages.forEach((msg,i) => setTimeout(() => { if(ws.readyState===WebSocket.OPEN) ws.send(JSON.stringify(msg)); }, i*600));
    clearInterval(pingInterval);
    pingInterval = setInterval(() => { if(ws.readyState===WebSocket.OPEN) ws.ping(); }, PING_INTERVAL);
  });
  ws.on('pong', () => console.log('[PING] OK.'));
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (!Array.isArray(data) || typeof data[1] !== 'object') return;
      const { cmd, sid, d1, d2, d3, gBB, htr } = data[1];
      if (cmd === 1008 && sid) currentSessionId = sid;
      if (cmd === 1005 && htr && Array.isArray(htr)) {
        const existing = new Set(lichSu.map(x => x.Phien));
        const newEntries = htr.filter(p => p.d1 && p.d2 && p.d3 && !existing.has(p.sid)).map(p => {
          const tong = p.d1+p.d2+p.d3;
          return { Phien:p.sid, Xuc_xac_1:p.d1, Xuc_xac_2:p.d2, Xuc_xac_3:p.d3, Tong:tong, Ket_qua:tong>10?'Tai':'Xiu', id:'@tiendataox' };
        });
        if (newEntries.length > 0) {
          lichSu = [...newEntries,...lichSu].sort((a,b)=>b.Phien-a.Phien).slice(0,MAX_HISTORY);
          console.log('[HISTORY] Loaded: '+lichSu.length+' sessions');

          // Kiem tra gap phien bi mat khi reconnect
          if (lastKnownPhien && lichSu.length > 0) {
            const newestInHistory = lichSu[0].Phien;
            const gap = newestInHistory - lastKnownPhien;
            if (gap > 1) {
              console.log('[GAP] Phat hien mat '+gap+' phien ('+lastKnownPhien+' -> '+newestInHistory+'), dang xu ly...');
              // Xu ly cac phien bi mat: chay sliding window cho tung phien trong gap
              const sorted = lichSu.slice().sort((a,b) => a.Phien - b.Phien);
              const missedEntries = sorted.filter(e => e.Phien > lastKnownPhien && e.Phien <= newestInHistory);
              for (const missed of missedEntries) {
                const idx = sorted.findIndex(e => e.Phien === missed.Phien);
                if (idx < WINDOW) continue;
                const w = sorted.slice(idx - WINDOW, idx).map(x => x.Ket_qua);
                const recentTotals = sorted.slice(idx - 10, idx).map(x => x.Tong).reverse();
                const pred = runPredict(w, recentTotals, recentPreds);
                if (!pred) continue;
                const actual = missed.Ket_qua;
                const correct = pred.pred === actual;
                updateRecentPreds(pred.pred, actual, pred.isCutLoss);
                if (!predLog.some(p => p.phien === missed.Phien)) {                  predLog.unshift({
                    phien: missed.Phien,
                    du_doan: pred.pred,
                    ket_qua: actual,
                    dung: correct,
                    algo: pred.algo,
                    conf: pred.conf,
                    ly_giai: pred.ly_giai || '',
                    phan_tich: pred.detail || null,
                    xuc_xac: missed.Xuc_xac_1+'-'+missed.Xuc_xac_2+'-'+missed.Xuc_xac_3,
                    tong: missed.Tong,
                    time: new Date().toISOString(),
                    recovered: true
                  });
                  console.log('[RECOVER] Phien '+missed.Phien+': du_doan='+pred.pred+' thuc_te='+actual+' => '+(correct?'DUNG':'SAI'));
                }
              }
              if (predLog.length > MAX_PRED_LOG) predLog = predLog.slice(0, MAX_PRED_LOG);
            }
          }
          // Cap nhat lastKnownPhien
          if (lichSu.length > 0) lastKnownPhien = lichSu[0].Phien;

          // Backfill predLog tu lich su co san
          // Sap xep cu -> moi de chay sliding window
          if (lichSu.length >= WINDOW + 1 && predLog.length === 0) {
            const sorted = lichSu.slice().sort((a,b) => a.Phien - b.Phien);
            let backfilled = 0;
            for (let i = WINDOW; i < sorted.length; i++) {
              const w = sorted.slice(i - WINDOW, i).map(x => x.Ket_qua);
              const recentTotals = sorted.slice(i - 10, i).map(x => x.Tong).reverse();
              const pred = runPredict(w, recentTotals, recentPreds);
              if (!pred) continue;
              const actual = sorted[i].Ket_qua;
              const correct = pred.pred === actual;
              // Cap nhat recentPreds trong backfill de CutLoss hoat dong
              updateRecentPreds(pred.pred, actual, pred.isCutLoss);
              predLog.push({
                phien: sorted[i].Phien,
                du_doan: pred.pred,
                ket_qua: actual,
                dung: correct,
                algo: pred.algo,
                conf: pred.conf,
                ly_giai: pred.ly_giai || '',
                phan_tich: pred.detail || null,
                xuc_xac: sorted[i].Xuc_xac_1+'-'+sorted[i].Xuc_xac_2+'-'+sorted[i].Xuc_xac_3,
                tong: sorted[i].Tong,
                time: sorted[i].time || new Date().toISOString(),
                backfill: true
              });
              backfilled++;
            }
            // Dao nguoc lai: moi nhat o dau
            predLog.reverse();
            if (predLog.length > MAX_PRED_LOG) predLog = predLog.slice(0, MAX_PRED_LOG);
            const dung = predLog.filter(p=>p.dung).length;
            console.log('[BACKFILL] '+backfilled+' predictions from history | acc='+(dung/predLog.length*100).toFixed(1)+'%');
            // Trigger search sau khi backfill xong
            maybeRunSearch();
          }

          // Tinh du doan cho phien tiep theo
          if (lichSu.length >= WINDOW && !pendingPred) {
            const w = lichSu.slice(0, WINDOW).map(x => x.Ket_qua).reverse();
            const recentTotals = lichSu.slice(0, 10).map(x => x.Tong);
            pendingPred = runPredict(w, recentTotals, recentPreds);
            if (pendingPred) {
              console.log('[NEXT] Du doan phien tiep: '+pendingPred.pred+' ('+pendingPred.algo+', conf='+pendingPred.conf+'%)');
            }
          }
        }
      }
      if (cmd === 1003 && gBB) {
        if (!d1 || !d2 || !d3) return;
        const total = d1+d2+d3;
        const result = total > 10 ? 'Tai' : 'Xiu';
        const entry = { Phien:currentSessionId, Xuc_xac_1:d1, Xuc_xac_2:d2, Xuc_xac_3:d3, Tong:total, Ket_qua:result, id:'@tiendataox' };
        latestSession = entry;
        lastKnownPhien = entry.Phien;
        if (!lichSu.some(x => x.Phien === entry.Phien)) {
          // Neu co pending prediction => ghi ket qua dung/sai
          if (pendingPred && lichSu.length >= WINDOW) {
            const correct = pendingPred.pred === result;
            // Cap nhat recent predictions de cut-loss
            updateRecentPreds(pendingPred.pred, result, pendingPred.isCutLoss);
            const logEntry = {
              phien: entry.Phien,
              du_doan: pendingPred.pred,
              ket_qua: result,
              dung: correct,
              algo: pendingPred.algo,
              conf: pendingPred.conf,
              ly_giai: pendingPred.ly_giai || '',
              phan_tich: pendingPred.detail || null,
              xuc_xac: d1+'-'+d2+'-'+d3,
              tong: total,
              time: new Date().toISOString()
            };
            predLog.unshift(logEntry);
            if (predLog.length > MAX_PRED_LOG) predLog = predLog.slice(0, MAX_PRED_LOG);
            console.log('[PRED] Phien '+entry.Phien+': du_doan='+pendingPred.pred+' thuc_te='+result+' => '+(correct?'DUNG':'SAI')+' ('+pendingPred.algo+')');
          }
          pendingPred = null;

          lichSu.unshift(entry);
          if (lichSu.length > MAX_HISTORY) lichSu = lichSu.slice(0,MAX_HISTORY);

          // Tinh du doan cho phien tiep theo
          if (lichSu.length >= WINDOW) {
            const w = lichSu.slice(0, WINDOW).map(x => x.Ket_qua).reverse();
            const recentTotals = lichSu.slice(0, 10).map(x => x.Tong);
            pendingPred = runPredict(w, recentTotals, recentPreds);
            if (pendingPred) {
              console.log('[NEXT] Du doan phien tiep: '+pendingPred.pred+' ('+pendingPred.algo+', conf='+pendingPred.conf+'%)');
            }
          }
        }
        console.log('[NEW] Phien '+entry.Phien+': '+d1+'-'+d2+'-'+d3+'='+total+' ('+result+') | Total: '+lichSu.length);
        currentSessionId = null;
        // Trigger search khi co phien moi
        maybeRunSearch();
      }
    } catch(e) { console.error('[ERR] '+e.message); }
  });
  ws.on('close', (code) => {
    console.log('[CLOSE] Code: '+code+' | Se reconnect sau 1.5s...');
    clearInterval(pingInterval); clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(connectWebSocket, 1500); // Giam tu 2500 xuong 1500ms
  });
  ws.on('error', (err) => { console.error('[ERR] '+err.message); try{ws.close();}catch(e){} });
}

app.get('/api/ditmemaysun', (req,res) => res.json(latestSession));
app.get('/api/latest', (req,res) => res.json(latestSession));
app.get('/api/lichsu', (req,res) => {
  const limit = Math.min(parseInt(req.query.limit)||100, MAX_HISTORY);
  res.json(lichSu.slice(0,limit));
});
app.get('/api/lichsu/all', (req,res) => res.json(lichSu));
app.get('/api/stats', (req,res) => {
  const tai = lichSu.filter(x=>x.Ket_qua==='Tai').length;
  const xiu = lichSu.filter(x=>x.Ket_qua==='Xiu').length;
  res.json({ total:lichSu.length, tai, xiu, latestSession, id:'@tiendataox' });
});

// ============================================================
// ENDPOINT: Du doan phien tiep theo
// GET /api/dudoan
// ============================================================
app.get('/api/dudoan', (req,res) => {
  if (lichSu.length < WINDOW) {
    return res.json({
      status: 'waiting',
      message: 'Chua du '+WINDOW+' phien de du doan (hien co '+lichSu.length+')',
      can_predict: false,
      id: '@tiendataox'
    });
  }
  const w = lichSu.slice(0, WINDOW).map(x => x.Ket_qua).reverse();
  const recentTotals = lichSu.slice(0, 10).map(x => x.Tong);
  const result = runPredict(w, recentTotals, recentPreds);
  if (!result) return res.json({ status:'error', message:'Khong the du doan', can_predict:false });

  const total_pred = predLog.length;
  const dung = predLog.filter(p => p.dung).length;
  let chuoi_sai_hien_tai = 0;
  for (const p of predLog) { if (!p.dung) chuoi_sai_hien_tai++; else break; }

  res.json({
    status: 'ok',
    can_predict: true,
    du_doan: result.pred,
    algo: result.algo,
    do_tin_cay: result.conf+'%',
    ly_giai: result.ly_giai,
    phan_tich: result.detail,
    phien_moi_nhat: latestSession.Phien,
    ket_qua_moi_nhat: latestSession.Ket_qua,
    window_21: w,
    thong_ke: {
      tong_du_doan: total_pred,
      dung,
      sai: total_pred - dung,
      ty_le_dung: total_pred > 0 ? (dung/total_pred*100).toFixed(2)+'%' : 'Chua co du lieu',
      chuoi_sai_hien_tai
    },
    id: '@tiendataox'
  });
});

// ============================================================
// ENDPOINT: Lich su du doan dung/sai
// GET /api/lichsu/dudoan?limit=100&page=1
// ============================================================
app.get('/api/lichsu/dudoan', (req,res) => {
  const limit  = Math.min(parseInt(req.query.limit)||100, MAX_PRED_LOG);
  const page   = Math.max(parseInt(req.query.page)||1, 1);
  const offset = (page-1)*limit;
  const slice  = predLog.slice(offset, offset+limit);

  const total = predLog.length;
  const dung  = predLog.filter(p => p.dung).length;
  let max_chuoi_sai = 0, cur = 0;
  for (const p of predLog) {
    if (!p.dung) { cur++; if (cur > max_chuoi_sai) max_chuoi_sai = cur; }
    else cur = 0;
  }
  let chuoi_sai_hien_tai = 0;
  for (const p of predLog) { if (!p.dung) chuoi_sai_hien_tai++; else break; }

  res.json({
    status: 'ok',
    thong_ke: {
      tong_du_doan: total,
      dung,
      sai: total-dung,
      ty_le_dung: total > 0 ? (dung/total*100).toFixed(2)+'%' : 'Chua co du lieu',
      chuoi_sai_dai_nhat: max_chuoi_sai,
      chuoi_sai_hien_tai
    },
    phan_trang: { page, limit, total, total_pages: Math.ceil(total/limit) },
    lich_su: slice,
    id: '@tiendataox'
  });
});

// ============================================================
// ENDPOINT: Thong ke chi tiet du doan theo algo
// GET /api/dudoan/stats
// ============================================================
app.get('/api/dudoan/stats', (req,res) => {
  const total = predLog.length;
  const dung  = predLog.filter(p => p.dung).length;
  const algoStats = {};
  for (const p of predLog) {
    if (!algoStats[p.algo]) algoStats[p.algo] = { total:0, dung:0 };
    algoStats[p.algo].total++;
    if (p.dung) algoStats[p.algo].dung++;
  }
  const algoArr = Object.entries(algoStats).map(([name,s]) => ({
    algo: name, total: s.total, dung: s.dung, sai: s.total-s.dung,
    ty_le: (s.dung/s.total*100).toFixed(2)+'%'
  })).sort((a,b) => b.total-a.total);

  const dist = {};
  let cur = 0;
  for (const p of predLog) {
    if (!p.dung) cur++;
    else { if (cur > 0) { dist[cur]=(dist[cur]||0)+1; } cur=0; }
  }
  if (cur > 0) dist[cur]=(dist[cur]||0)+1;

  res.json({
    status: 'ok',
    tong_quan: {
      tong_du_doan: total, dung, sai: total-dung,
      ty_le_dung: total > 0 ? (dung/total*100).toFixed(2)+'%' : 'Chua co du lieu'
    },
    theo_algo: algoArr,
    phan_phoi_chuoi_sai: dist,
    id: '@tiendataox'
  });
});

// ============================================================
// ENDPOINT: Auto Search results
// GET /api/algo/search
// POST /api/algo/search/run
// ============================================================
app.get('/api/algo/search', (req,res) => {
  res.json({
    status: 'ok',
    search_state: {
      running: autoSearchState.running,
      iterations: autoSearchState.iterations,
      last_search_phien_count: autoSearchState.last_search_phien_count,
      started_at: autoSearchState.started_at,
      total_phien_hien_co: lichSu.length,
      target: 'max_sai <= '+SEARCH_TARGET_MAX_SAI+' tren '+SEARCH_TEST_WINDOW+' phien gan nhat',
      search_interval: 'Moi '+SEARCH_INTERVAL_PHIEN+' phien moi'
    },
    best_algo: autoSearchState.best ? {
      name: autoSearchState.best.name,
      config: autoSearchState.best.config,
      acc: autoSearchState.best.acc.toFixed(2)+'%',
      max_sai: autoSearchState.best.max_sai,
      max_dung: autoSearchState.best.max_dung,
      dist_sai: autoSearchState.best.dist,
      test_phien: autoSearchState.best.test_phien,
      total_phien: autoSearchState.best.total_phien,
      achieved_target: autoSearchState.best.achieved_target,
      timestamp: autoSearchState.best.timestamp,
      iteration: autoSearchState.best.iteration
    } : null,
    history: autoSearchState.history,
    id: '@tiendataox'
  });
});

app.post('/api/algo/search/run', (req,res) => {
  if (autoSearchState.running) {
    return res.json({ status: 'busy', message: 'Dang chay search, vui long cho...' });
  }
  autoSearchState.last_search_phien_count = 0; // force run
  runAutoSearch();
  res.json({ status: 'ok', message: 'Da bat dau search, xem ket qua tai /api/algo/search' });
});

app.get('/', (req,res) => res.json({
  message: 'LC79 Data API - Soi Cau Tai Xiu (Pattern-7+5, 71.34%)',
  endpoints: [
    'GET /api/latest              — Phien moi nhat',
    'GET /api/lichsu?limit=N      — Lich su (mac dinh 100, max 5000)',
    'GET /api/lichsu/all          — Toan bo lich su',
    'GET /api/stats               — Thong ke Tai/Xiu',
    'GET /api/dudoan              — Du doan phien tiep theo',
    'GET /api/lichsu/dudoan?limit=N&page=N — Lich su du doan dung/sai',
    'GET /api/dudoan/stats        — Thong ke chi tiet du doan theo algo',
    'GET /api/algo/search         — Ket qua tim thuat toan tu dong',
    'POST /api/algo/search/run    — Chay search ngay lap tuc'
  ],
  id: '@tiendataox'
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log('LC79 API running on port '+PORT);
  autoSearchState.started_at = new Date().toISOString();
  connectWebSocket();
});
