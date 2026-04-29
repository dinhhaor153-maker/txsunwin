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
// RECENT PREDICTION MEMORY (de cut-loss)
// ============================================================
let recentPreds = []; // [{pred, actual, correct}] — toi da 10 phien gan nhat

function updateRecentPreds(pred, actual) {
  recentPreds.unshift({ pred, actual, correct: pred === actual });
  if (recentPreds.length > 10) recentPreds = recentPreds.slice(0, 10);
}

function getCutLossOverride(normalPred) {
  // Neu sai lien tiep >= 2 lan cung huong (cung du doan 1 loai ma sai)
  // thi dao nguoc lai
  if (recentPreds.length < 2) return null;
  const last2 = recentPreds.slice(0, 2);
  const allWrong = last2.every(p => !p.correct);
  const samePred = last2.every(p => p.pred === last2[0].pred);
  if (allWrong && samePred) {
    const wrongPred = last2[0].pred;
    const override = wrongPred === 'Tai' ? 'Xiu' : 'Tai';
    return { pred: override, algo: 'CutLoss-2->Dao', conf: 68,
      ly_giai: `Sai lien tiep 2 lan du doan ${wrongPred} => dao sang ${override}` };
  }
  return null;
}

// ============================================================
// PREDICTION ENGINE
// ============================================================
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

function runPredict(w) {
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

  // Phan tich chi tiet de tra ve
  const detail = {
    window_7:  pat7,
    window_5:  pat5,
    key_7:     k7,
    key_5:     k5,
    streak_hien_tai: s,
    loai_streak: lastTX,
    dem_5_phien: { [lastTX]: c5, [lastTX==='T'?'X':'T']: 5-c5 },
    dem_10_phien: { T: wTX.slice(-10).filter(x=>x==='T').length, X: wTX.slice(-10).filter(x=>x==='X').length },
    dem_21_phien: { T: c21, X: 21-c21 },
    hit_table7: !!T7[k7],
    hit_table5: !!T5[k5],
    action_table7: T7[k7] || null,
    action_table5: T5[k5] || null
  };

  // ── ƯUTIEN 1: Cut-loss — sai lien tiep 2 lan cung huong ──
  const cutLoss = getCutLossOverride(null);
  if (cutLoss) {
    return { ...cutLoss, detail };
  }

  // ── ƯUTIEN 2: Streak cuc dai (>=6) — theo chuoi, khong dao ──
  // Neu streak >= 6 ma Pattern bao NGUOC => bo qua Pattern, theo chuoi
  if (s >= 6) {
    return { pred: last, algo: `Streak${s}->Theo`, conf: 75,
      ly_giai: `Chuoi ${lastTX} lien tiep ${s} phien rat dai => theo chuoi ${last}`, detail };
  }

  // Table 7
  if (T7[k7]) {
    const action = T7[k7];
    const pred = action === 'BET' ? last : anti;
    return {
      pred, algo: 'Pattern-7', conf: 72,
      ly_giai: `Pattern-7 [${pat7.join(',')}] => ${action} => du doan ${pred}`,
      detail
    };
  }

  // Table 5
  if (T5[k5]) {
    const action = T5[k5];
    const pred = action === 'BET' ? last : anti;
    return {
      pred, algo: 'Pattern-5', conf: 65,
      ly_giai: `Pattern-5 [${pat5.join(',')}] => ${action} => du doan ${pred}`,
      detail
    };
  }

  // Streak rules
  if (s >= 5) return { pred: anti, algo: 'Streak>=5->Nguoc', conf: 82,
    ly_giai: `Chuoi ${lastTX} lien tiep ${s} phien >= 5 => dao sang ${anti}`, detail };
  if (s === 4) return { pred: anti, algo: 'Streak=4->Nguoc', conf: 66,
    ly_giai: `Chuoi ${lastTX} lien tiep 4 phien => dao sang ${anti}`, detail };
  if (s === 3 && c5 >= 3) return { pred: last, algo: 'Streak3+Cnt5>=3->Bet', conf: 58,
    ly_giai: `Chuoi ${lastTX} lien tiep 3, trong 5 phien co ${c5} ${lastTX} >= 3 => bet theo ${last}`, detail };
  if (s === 2 && c5 === 3) return { pred: last, algo: 'Streak2+Cnt5=3->Bet', conf: 59,
    ly_giai: `Chuoi ${lastTX} lien tiep 2, trong 5 phien co dung 3 ${lastTX} => bet theo ${last}`, detail };
  if (s === 2 && c5 >= 4) return { pred: anti, algo: 'Streak2+Cnt5>=4->Nguoc', conf: 57,
    ly_giai: `Chuoi ${lastTX} lien tiep 2, trong 5 phien co ${c5} ${lastTX} >= 4 => dao sang ${anti}`, detail };
  if (s === 1 && c5 >= 4) return { pred: last, algo: 'Cnt5>=4->Bet', conf: 56,
    ly_giai: `Phien cuoi don le, trong 5 phien co ${c5} ${lastTX} >= 4 => bet theo ${last}`, detail };
  if (s === 1 && c5 <= 2) return { pred: anti, algo: 'Cnt5<=2->Nguoc', conf: 62,
    ly_giai: `Phien cuoi don le, trong 5 phien chi co ${c5} ${lastTX} <= 2 => dao sang ${anti}`, detail };
  if (c10 >= 6) return { pred: last, algo: 'Cnt10>=6->Bet', conf: 55,
    ly_giai: `Trong 10 phien co ${c10} ${lastTX} >= 6 => bet theo ${last}`, detail };

  return { pred: anti, algo: 'Nguoc cuoi (mac dinh)', conf: 54,
    ly_giai: `Khong co pattern ro rang, ap dung nguoc phien cuoi ${last} => ${anti}`, detail };
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
                const pred = runPredict(w);
                if (!pred) continue;
                const actual = missed.Ket_qua;
                const correct = pred.pred === actual;
                updateRecentPreds(pred.pred, actual);
                if (!predLog.some(p => p.phien === missed.Phien)) {
                  predLog.unshift({
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
              const pred = runPredict(w);
              if (!pred) continue;
              const actual = sorted[i].Ket_qua;
              const correct = pred.pred === actual;
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
          }

          // Tinh du doan cho phien tiep theo
          if (lichSu.length >= WINDOW && !pendingPred) {
            const w = lichSu.slice(0, WINDOW).map(x => x.Ket_qua).reverse();
            pendingPred = runPredict(w);
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
            updateRecentPreds(pendingPred.pred, result);
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
            pendingPred = runPredict(w);
            if (pendingPred) {
              console.log('[NEXT] Du doan phien tiep: '+pendingPred.pred+' ('+pendingPred.algo+', conf='+pendingPred.conf+'%)');
            }
          }
        }
        console.log('[NEW] Phien '+entry.Phien+': '+d1+'-'+d2+'-'+d3+'='+total+' ('+result+') | Total: '+lichSu.length);
        currentSessionId = null;
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
  const result = runPredict(w);
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

app.get('/', (req,res) => res.json({
  message: 'LC79 Data API - Soi Cau Tai Xiu (Pattern-7+5, 71.34%)',
  endpoints: [
    'GET /api/latest              — Phien moi nhat',
    'GET /api/lichsu?limit=N      — Lich su (mac dinh 100, max 5000)',
    'GET /api/lichsu/all          — Toan bo lich su',
    'GET /api/stats               — Thong ke Tai/Xiu',
    'GET /api/dudoan              — Du doan phien tiep theo',
    'GET /api/lichsu/dudoan?limit=N&page=N — Lich su du doan dung/sai',
    'GET /api/dudoan/stats        — Thong ke chi tiet du doan theo algo'
  ],
  id: '@tiendataox'
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log('LC79 API running on port '+PORT);
  connectWebSocket();
});
