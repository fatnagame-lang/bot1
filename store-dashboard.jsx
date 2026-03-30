import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_ROLES = [
  { id: 1, name: "VIP", price: 50,  color: "#f5c842", description: "وصول لقنوات VIP الحصرية" },
  { id: 2, name: "MVP", price: 100, color: "#00d4a8", description: "كل مميزات VIP + شارة خاصة" },
  { id: 3, name: "Elite", price: 200, color: "#7c5cf5", description: "أعلى رتبة في السيرفر" },
  { id: 4, name: "Booster", price: 30, color: "#ff73fa", description: "رتبة بوستر السيرفر" },
];
const SEED_PRODUCTS = [
  { id: 10, name: "باقة نيترو شهري", price: 25, description: "اشتراك ديسكورد نيترو لشهر" },
  { id: 11, name: "باقة نيترو سنوي", price: 250, description: "اشتراك ديسكورد نيترو لسنة" },
];
const SEED_INVOICES = [
  { id: 1, customer: "محمد العمري",  items: [{ name:"VIP",    price:50,  qty:1 }], total:50,  type:"revenue", date:"2024-03-01" },
  { id: 2, customer: "سارة الغامدي", items: [{ name:"Elite",  price:200, qty:1 }], total:200, type:"revenue", date:"2024-03-05" },
  { id: 3, customer: "",             items: [{ name:"رسوم سيرفر", price:80, qty:1 }], total:80, type:"expense", date:"2024-03-07" },
  { id: 4, customer: "خالد الشهري", items: [{ name:"MVP",    price:100, qty:1 }], total:100, type:"revenue", date:"2024-03-10" },
];
const SEED_PH = [
  { id:1, productId:1, productName:"VIP",   oldPrice:40,  newPrice:50,  date:"2024-02-15T10:30:00" },
  { id:2, productId:3, productName:"Elite", oldPrice:150, newPrice:200, date:"2024-03-01T09:00:00" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size=20, color="currentColor" }) => {
  const d = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
    invoice:   <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    product:   <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
    history:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    profit:    <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
    plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit:      <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:     <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    search:    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    close:     <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    up:        <><polyline points="18 15 12 9 6 15"/></>,
    down:      <><polyline points="6 9 12 15 18 9"/></>,
    menu:      <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    tag:       <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    store:     <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    role:      <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    discord:   <><path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d[name]}
    </svg>
  );
};

const fmt = (n) => Number(n||0).toLocaleString("ar-SA") + " ر.س";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#070d1a;--bg2:#0d1526;--bg3:#111d35;
  --card:#0f1a2e;--border:#1e2f4d;--border2:#243657;
  --gold:#f5c842;--gold2:#e6b800;--gold-dim:rgba(245,200,66,.12);--gold-glow:rgba(245,200,66,.25);
  --teal:#00d4a8;--teal-dim:rgba(0,212,168,.12);
  --red:#ff4757;--red-dim:rgba(255,71,87,.12);
  --blue:#4a9eff;--purple:#7c5cf5;
  --text:#e8edf8;--text2:#8fa0c0;--text3:#4d6080;
  --r:14px;--rs:8px;--sh:0 8px 32px rgba(0,0,0,.4);--tr:all .2s cubic-bezier(.4,0,.2,1);
}
body{font-family:'IBM Plex Sans Arabic',sans-serif;background:var(--bg);color:var(--text);direction:rtl;text-align:right;overflow-x:hidden}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
button{cursor:pointer;font-family:inherit;border:none;outline:none}
input,textarea,select{font-family:inherit;outline:none}
.mono{font-family:'Space Mono',monospace}

/* Login */
.lw{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.lbg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 40%,rgba(245,200,66,.06),transparent 60%),radial-gradient(ellipse 60% 80% at 80% 70%,rgba(0,212,168,.05),transparent 60%)}
.lgrid{position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:40px 40px;opacity:.3}
.lcard{position:relative;z-index:1;background:var(--card);border:1px solid var(--border2);border-radius:20px;padding:48px 40px;width:420px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.llogo{display:flex;align-items:center;gap:12px;margin-bottom:32px;justify-content:center}
.licon{width:48px;height:48px;background:var(--gold-dim);border:1px solid var(--gold-glow);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--gold)}
.ltit{font-size:22px;font-weight:700}
.lsub{font-size:14px;color:var(--text2);text-align:center;margin-bottom:32px}
.fld{margin-bottom:20px}
.fld label{display:block;font-size:13px;font-weight:500;color:var(--text2);margin-bottom:8px}
.fld input{width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--rs);padding:12px 16px;color:var(--text);font-size:15px;transition:var(--tr)}
.fld input:focus{border-color:var(--gold);box-shadow:0 0 0 3px var(--gold-dim)}
.bgold{width:100%;background:var(--gold);color:#0a0a0a;font-size:15px;font-weight:700;padding:14px;border-radius:var(--rs);transition:var(--tr)}
.bgold:hover{background:var(--gold2);transform:translateY(-1px);box-shadow:0 8px 20px var(--gold-glow)}
.lhint{text-align:center;margin-top:16px;font-size:12px;color:var(--text3)}

/* Layout */
.app{display:flex;min-height:100vh}
.sb{width:260px;background:var(--card);border-left:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;right:0;bottom:0;z-index:100;transition:transform .3s ease}
.sb-hd{padding:24px 20px;border-bottom:1px solid var(--border)}
.sb-brand{display:flex;align-items:center;gap:10px}
.brand-ico{width:38px;height:38px;background:var(--gold-dim);border:1px solid var(--gold-glow);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--gold);flex-shrink:0}
.brand-nm{font-size:16px;font-weight:700}
.brand-sb{font-size:11px;color:var(--text3)}
.sb-nav{flex:1;padding:16px 12px;overflow-y:auto}
.nav-sec{font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:1px;padding:0 8px;margin:16px 0 8px}
.nav-it{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:var(--rs);font-size:14px;font-weight:500;color:var(--text2);cursor:pointer;transition:var(--tr);margin-bottom:2px;border:1px solid transparent}
.nav-it:hover{background:var(--bg3);color:var(--text)}
.nav-it.act{background:var(--gold-dim);color:var(--gold);border-color:var(--gold-glow)}
.nb{margin-right:auto;background:var(--gold);color:#0a0a0a;font-size:11px;font-weight:700;padding:2px 7px;border-radius:20px}
.sb-ft{padding:16px 12px;border-top:1px solid var(--border)}
.uc{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--rs);background:var(--bg2)}
.uav{width:36px;height:36px;border-radius:50%;background:var(--gold-dim);border:2px solid var(--gold-glow);display:flex;align-items:center;justify-content:center;color:var(--gold);font-weight:700;font-size:14px}
.unm{font-size:13px;font-weight:600}
.url{font-size:11px;color:var(--text3)}
.blg{margin-top:8px;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:9px;background:var(--red-dim);border:1px solid rgba(255,71,87,.2);border-radius:var(--rs);color:var(--red);font-size:13px;font-weight:500;transition:var(--tr)}
.blg:hover{background:rgba(255,71,87,.2)}

/* Main */
.main{flex:1;margin-right:260px;min-height:100vh;display:flex;flex-direction:column}
.tb{background:var(--card);border-bottom:1px solid var(--border);padding:16px 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:99}
.tb-r{display:flex;align-items:center;gap:12px}
.hbg{display:none;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--rs);padding:8px;color:var(--text2)}
.tb-t{font-size:18px;font-weight:700}
.tb-s{font-size:13px;color:var(--text3)}
.sbar{display:flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--rs);padding:8px 14px;width:240px;transition:var(--tr)}
.sbar:focus-within{border-color:var(--gold);box-shadow:0 0 0 3px var(--gold-dim)}
.sbar input{background:transparent;border:none;color:var(--text);font-size:14px;width:100%}
.sbar input::placeholder{color:var(--text3)}
.content{flex:1;padding:28px}

/* Stats */
.sg{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.sc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:20px;position:relative;overflow:hidden;transition:var(--tr)}
.sc:hover{border-color:var(--border2);transform:translateY(-2px);box-shadow:var(--sh)}
.sc::before{content:'';position:absolute;top:0;right:0;width:3px;height:100%;border-radius:0 var(--r) var(--r) 0}
.sc.gold::before{background:var(--gold)}.sc.teal::before{background:var(--teal)}.sc.red::before{background:var(--red)}.sc.blue::before{background:var(--blue)}.sc.purple::before{background:var(--purple)}
.sl{font-size:12px;font-weight:500;color:var(--text3);margin-bottom:10px;display:flex;align-items:center;gap:6px}
.sv{font-size:26px;font-weight:700;margin-bottom:6px;font-family:'Space Mono',monospace}
.sv.gold{color:var(--gold)}.sv.teal{color:var(--teal)}.sv.red{color:var(--red)}.sv.blue{color:var(--blue)}.sv.purple{color:var(--purple)}
.sch{font-size:12px;color:var(--text3);display:flex;align-items:center;gap:4px}
.si{position:absolute;top:18px;left:18px;opacity:.1}

/* Charts */
.cr{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:24px}
.cc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:20px}
.ct{font-size:15px;font-weight:600;margin-bottom:4px}
.cs{font-size:12px;color:var(--text3);margin-bottom:20px}

/* Table */
.tc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:20px}
.th{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:10px}
.th h3{font-size:15px;font-weight:600}
.ta{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fps{display:flex;gap:6px}
.pill{padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;transition:var(--tr);background:var(--bg2);border:1px solid var(--border2);color:var(--text2)}
.pill.act{background:var(--gold-dim);border-color:var(--gold-glow);color:var(--gold)}
table{width:100%;border-collapse:collapse}
th{padding:12px 20px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);background:var(--bg2);border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.5px}
td{padding:13px 20px;font-size:14px;border-bottom:1px solid var(--border);transition:var(--tr)}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--bg2)}
.bdg{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500}
.bdg.revenue{background:var(--teal-dim);color:var(--teal)}.bdg.expense{background:var(--red-dim);color:var(--red)}
.ab{display:flex;gap:6px;justify-content:flex-end}
.bi{width:32px;height:32px;border-radius:var(--rs);display:flex;align-items:center;justify-content:center;transition:var(--tr)}
.bi.ed{background:rgba(74,158,255,.12);color:var(--blue)}.bi.ed:hover{background:rgba(74,158,255,.25)}
.bi.dl{background:var(--red-dim);color:var(--red)}.bi.dl:hover{background:rgba(255,71,87,.25)}

/* Buttons */
.bp{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:var(--gold);color:#0a0a0a;font-size:13px;font-weight:700;border-radius:var(--rs);transition:var(--tr)}
.bp:hover{background:var(--gold2);box-shadow:0 4px 14px var(--gold-glow)}
.bs{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:var(--bg2);border:1px solid var(--border2);color:var(--text2);font-size:13px;font-weight:500;border-radius:var(--rs);transition:var(--tr)}
.bs:hover{border-color:var(--text2);color:var(--text)}

/* Modal */
.ov{position:fixed;inset:0;background:rgba(5,10,20,.85);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
.md{background:var(--card);border:1px solid var(--border2);border-radius:18px;padding:32px;width:560px;max-width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.5);animation:su .2s ease}
@keyframes su{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.mh{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
.mt{font-size:18px;font-weight:700}
.mx{width:34px;height:34px;border-radius:var(--rs);background:var(--bg2);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;color:var(--text2);transition:var(--tr)}
.mx:hover{border-color:var(--red);color:var(--red)}
.mf{margin-bottom:14px}
.mf label{display:block;font-size:13px;font-weight:500;color:var(--text2);margin-bottom:6px}
.mf input,.mf textarea,.mf select{width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--rs);padding:11px 14px;color:var(--text);font-size:14px;transition:var(--tr);resize:vertical}
.mf input:focus,.mf textarea:focus,.mf select:focus{border-color:var(--gold);box-shadow:0 0 0 3px var(--gold-dim)}
.mf select option{background:var(--bg2);color:var(--text)}
.mft{display:flex;gap:10px;justify-content:flex-end;margin-top:24px}
.r2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.r3{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px}

/* Invoice item */
.ii{background:var(--bg2);border:1px solid var(--border);border-radius:var(--rs);padding:14px;margin-bottom:10px;position:relative}
.ix{position:absolute;top:10px;left:10px;width:26px;height:26px;border-radius:6px;background:var(--red-dim);display:flex;align-items:center;justify-content:center;color:var(--red);font-size:13px;cursor:pointer;border:none;font-family:inherit;transition:var(--tr)}
.ix:hover{background:rgba(255,71,87,.3)}
.bai{display:flex;align-items:center;gap:6px;width:100%;padding:10px;border:1px dashed var(--border2);border-radius:var(--rs);color:var(--text2);font-size:13px;background:transparent;justify-content:center;transition:var(--tr);margin-bottom:14px}
.bai:hover{border-color:var(--gold);color:var(--gold)}
.tp{background:var(--bg3);border-radius:var(--rs);padding:14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border:1px solid var(--border)}
.tl{font-size:13px;color:var(--text3)}
.ta2{font-size:22px;font-weight:700;color:var(--gold);font-family:'Space Mono',monospace}

/* Role cards */
.rg{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;margin-bottom:20px}
.rc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:20px;transition:var(--tr);position:relative;overflow:hidden}
.rc:hover{transform:translateY(-2px);box-shadow:var(--sh)}
.rct{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.rdot{width:11px;height:11px;border-radius:50%;flex-shrink:0}
.rn{font-size:18px;font-weight:700;flex:1;margin-right:10px}
.rd{font-size:13px;color:var(--text2);margin-bottom:12px;line-height:1.5}
.rp{font-size:19px;font-weight:700;color:var(--gold);font-family:'Space Mono',monospace;margin-bottom:12px}
.rac{display:flex;gap:8px}
.rstr{position:absolute;top:0;right:0;width:4px;height:100%}

/* Warn */
.wb{background:var(--gold-dim);border:1px solid var(--gold-glow);border-radius:var(--rs);padding:10px 14px;margin-bottom:12px;font-size:13px;color:var(--gold)}

/* Empty */
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:var(--text3)}
.empty svg{margin-bottom:16px;opacity:.3}
.empty p{font-size:14px}

/* Toast */
.twr{position:fixed;bottom:24px;left:24px;z-index:999;display:flex;flex-direction:column;gap:8px}
.tst{background:var(--card);border:1px solid var(--border2);border-radius:var(--rs);padding:12px 16px;font-size:14px;box-shadow:var(--sh);animation:ti .3s ease;display:flex;align-items:center;gap:8px}
.tst.success{border-color:rgba(0,212,168,.4)}.tst.error{border-color:rgba(255,71,87,.4)}
@keyframes ti{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}

/* Divider label */
.div-lbl{font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}

/* Product catalog select highlight */
select optgroup{color:var(--text3);font-size:12px}

@media(max-width:1100px){.sg{grid-template-columns:repeat(2,1fr)}.cr{grid-template-columns:1fr}}
@media(max-width:768px){
  .sb{transform:translateX(260px)}.sb.open{transform:translateX(0)}
  .main{margin-right:0}.hbg{display:flex}
  .sg{grid-template-columns:1fr 1fr}.content{padding:16px}.tb{padding:12px 16px}
  .sbar{width:150px}
  th,td{padding:10px 12px}
  .md{padding:20px}.r2,.r3{grid-template-columns:1fr}
  .rg{grid-template-columns:1fr}
}
@media(max-width:480px){.sg{grid-template-columns:1fr}}
`;

// ─── Toast ────────────────────────────────────────────────────────────────────
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type="success") => {
    const id = Date.now();
    setToasts(t => [...t, {id,msg,type}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id!==id)), 3000);
  };
  return {toasts, show};
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [sbOpen, setSbOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [roles, setRoles] = useState(SEED_ROLES);
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [invoices, setInvoices] = useState(SEED_INVOICES);
  const [priceHistory, setPH] = useState(SEED_PH);
  const [modal, setModal] = useState(null);
  const {toasts, show} = useToast();

  // combined catalog for invoice dropdown
  const catalog = [
    ...roles.map(r    => ({...r, cat:"role"})),
    ...products.map(p => ({...p, cat:"product"})),
  ];

  const rev = invoices.filter(i=>i.type==="revenue").reduce((s,i)=>s+i.total,0);
  const exp = invoices.filter(i=>i.type==="expense").reduce((s,i)=>s+i.total,0);
  const net = rev - exp;

  const chartData = useMemo(()=>{
    return ["يناير","فبراير","مارس","أبريل","مايو","يونيو"].map(n=>({
      name:n, أرباح:Math.round(Math.random()*300+100), مصاريف:Math.round(Math.random()*100+20)
    }));
  },[]);
  const pieData=[{name:"أرباح",value:rev,color:"#00d4a8"},{name:"مصاريف",value:exp,color:"#ff4757"}];

  const titles={dashboard:"لوحة التحكم",invoices:"إدارة الفواتير",roles:"رتب السيرفر",products:"المنتجات الأخرى",profit:"الأرباح والخسائر",priceHistory:"سجل الأسعار"};

  if(!loggedIn) return <Login onLogin={()=>setLoggedIn(true)}/>;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {sbOpen && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:99}} onClick={()=>setSbOpen(false)}/>}

        {/* Sidebar */}
        <div className={`sb ${sbOpen?"open":""}`}>
          <div className="sb-hd">
            <div className="sb-brand">
              <div className="brand-ico"><Icon name="discord" size={18}/></div>
              <div><div className="brand-nm">متجر ديسكورد</div><div className="brand-sb">لوحة الإدارة</div></div>
            </div>
          </div>
          <nav className="sb-nav">
            <div className="nav-sec">الرئيسية</div>
            <NI id="dashboard" icon="dashboard" label="لوحة التحكم" page={page} setPage={setPage} sb={setSbOpen}/>
            <div className="nav-sec">المبيعات</div>
            <NI id="invoices" icon="invoice" label="الفواتير" page={page} setPage={setPage} sb={setSbOpen} count={invoices.length}/>
            <div className="nav-sec">الكتالوج</div>
            <NI id="roles" icon="role" label="رتب السيرفر" page={page} setPage={setPage} sb={setSbOpen} count={roles.length}/>
            <NI id="products" icon="product" label="منتجات أخرى" page={page} setPage={setPage} sb={setSbOpen} count={products.length}/>
            <div className="nav-sec">التقارير</div>
            <NI id="profit" icon="profit" label="الأرباح والخسائر" page={page} setPage={setPage} sb={setSbOpen}/>
            <NI id="priceHistory" icon="history" label="سجل الأسعار" page={page} setPage={setPage} sb={setSbOpen} count={priceHistory.length}/>
          </nav>
          <div className="sb-ft">
            <div className="uc">
              <div className="uav">م</div>
              <div><div className="unm">المدير</div><div className="url">مالك السيرفر</div></div>
            </div>
            <button className="blg" onClick={()=>setLoggedIn(false)}><Icon name="logout" size={14}/>تسجيل الخروج</button>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          <div className="tb">
            <div className="tb-r">
              <button className="hbg" onClick={()=>setSbOpen(o=>!o)}><Icon name="menu" size={18}/></button>
              <div>
                <div className="tb-t">{titles[page]}</div>
                <div className="tb-s">{new Date().toLocaleDateString("ar-SA",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
              </div>
            </div>
            <div className="sbar">
              <Icon name="search" size={15} color="var(--text3)"/>
              <input placeholder="بحث..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
          <div className="content">
            {page==="dashboard"    && <Dashboard invoices={invoices} roles={roles} chartData={chartData} pieData={pieData} rev={rev} exp={exp} net={net} priceHistory={priceHistory} setPage={setPage}/>}
            {page==="invoices"     && <Invoices invoices={invoices} catalog={catalog} setInvoices={setInvoices} search={search} filter={filter} setFilter={setFilter} show={show} modal={modal} setModal={setModal}/>}
            {page==="roles"        && <Roles roles={roles} setRoles={setRoles} setPH={setPH} search={search} show={show} modal={modal} setModal={setModal}/>}
            {page==="products"     && <Products products={products} setProducts={setProducts} setPH={setPH} search={search} show={show} modal={modal} setModal={setModal}/>}
            {page==="profit"       && <Profit invoices={invoices} rev={rev} exp={exp} net={net} chartData={chartData} filter={filter} setFilter={setFilter}/>}
            {page==="priceHistory" && <PriceHistory priceHistory={priceHistory} search={search}/>}
          </div>
        </div>
      </div>
      <div className="twr">
        {toasts.map(t=><div key={t.id} className={`tst ${t.type}`}>{t.type==="success"?"✓":"✕"} {t.msg}</div>)}
      </div>
    </>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NI({id,icon,label,page,setPage,sb,count}){
  return(
    <div className={`nav-it ${page===id?"act":""}`} onClick={()=>{setPage(id);sb(false)}}>
      <Icon name={icon} size={17}/>{label}
      {count!==undefined&&<span className="nb">{count}</span>}
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function Login({onLogin}){
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [e,setE]=useState("");
  const go=()=>{ if(u==="admin"&&p==="1234") onLogin(); else setE("بيانات غير صحيحة"); };
  return(
    <>
      <style>{css}</style>
      <div className="lw">
        <div className="lbg"/><div className="lgrid"/>
        <div className="lcard">
          <div className="llogo"><div className="licon"><Icon name="discord" size={26}/></div><div className="ltit">متجر ديسكورد</div></div>
          <div className="lsub">أدخل بياناتك للدخول إلى لوحة التحكم</div>
          <div className="fld"><label>اسم المستخدم</label><input placeholder="admin" value={u} onChange={e=>{setU(e.target.value);setE("")}} onKeyDown={e=>e.key==="Enter"&&go()}/></div>
          <div className="fld"><label>كلمة المرور</label><input type="password" placeholder="••••" value={p} onChange={e=>{setP(e.target.value);setE("")}} onKeyDown={e=>e.key==="Enter"&&go()}/></div>
          {e&&<div style={{color:"var(--red)",fontSize:13,marginBottom:12}}>{e}</div>}
          <button className="bgold" onClick={go}>تسجيل الدخول</button>
          <div className="lhint">بيانات تجريبية: admin / 1234</div>
        </div>
      </div>
    </>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({invoices,roles,chartData,pieData,rev,exp,net,priceHistory,setPage}){
  return(
    <>
      <div className="sg">
        <SC label="إجمالي الأرباح"   val={fmt(rev)} cls="teal"   icon="profit"  sub={`${invoices.filter(i=>i.type==="revenue").length} فاتورة`} up/>
        <SC label="إجمالي المصاريف"  val={fmt(exp)} cls="red"    icon="tag"     sub={`${invoices.filter(i=>i.type==="expense").length} فاتورة`}/>
        <SC label="صافي الربح"        val={fmt(net)} cls="gold"   icon="profit"  sub={net>=0?"ربح 📈":"خسارة 📉"} up={net>=0}/>
        <SC label="رتب السيرفر"       val={roles.length} cls="purple" icon="role" sub="رتبة متاحة للبيع" up/>
      </div>
      <div className="cr">
        <div className="cc">
          <div className="ct">أداء الأرباح والمصاريف</div>
          <div className="cs">مقارنة شهرية</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4a8" stopOpacity={.3}/><stop offset="95%" stopColor="#00d4a8" stopOpacity={0}/></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff4757" stopOpacity={.3}/><stop offset="95%" stopColor="#ff4757" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2f4d"/>
              <XAxis dataKey="name" tick={{fill:"#4d6080",fontSize:12}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#4d6080",fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:"#0f1a2e",border:"1px solid #1e2f4d",borderRadius:8,color:"#e8edf8"}}/>
              <Area type="monotone" dataKey="أرباح" stroke="#00d4a8" strokeWidth={2} fill="url(#g1)"/>
              <Area type="monotone" dataKey="مصاريف" stroke="#ff4757" strokeWidth={2} fill="url(#g2)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="cc">
          <div className="ct">توزيع الإيرادات</div>
          <div className="cs">أرباح مقابل مصاريف</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={4} dataKey="value">
                {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip contentStyle={{background:"#0f1a2e",border:"1px solid #1e2f4d",borderRadius:8,color:"#e8edf8"}} formatter={v=>fmt(v)}/>
              <Legend formatter={v=><span style={{color:"#8fa0c0",fontSize:13}}>{v}</span>}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="tc">
        <div className="th"><h3>آخر الفواتير</h3><button className="bs" onClick={()=>setPage("invoices")} style={{fontSize:12}}>عرض الكل</button></div>
        <table>
          <thead><tr><th>#</th><th>العميل</th><th>المنتجات</th><th>الإجمالي</th><th>النوع</th></tr></thead>
          <tbody>
            {[...invoices].reverse().slice(0,5).map(inv=>(
              <tr key={inv.id}>
                <td className="mono" style={{color:"var(--text3)"}}>#{inv.id}</td>
                <td style={{color:inv.customer?"var(--text)":"var(--text3)"}}>{inv.customer||"—"}</td>
                <td style={{fontSize:13,color:"var(--text2)"}}>{inv.items.map(i=>i.name).join("، ")}</td>
                <td className="mono" style={{color:inv.type==="revenue"?"var(--teal)":"var(--red)",fontWeight:700}}>{fmt(inv.total)}</td>
                <td><span className={`bdg ${inv.type}`}>{inv.type==="revenue"?"إيراد":"مصروف"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function SC({label,val,cls,icon,sub,up}){
  return(
    <div className={`sc ${cls}`}>
      <div className="si"><Icon name={icon} size={52}/></div>
      <div className="sl"><Icon name={icon} size={13} color={`var(--${cls})`}/>{label}</div>
      <div className={`sv ${cls}`}>{val}</div>
      <div className="sch">
        {up?<Icon name="up" size={11} color="var(--teal)"/>:<Icon name="down" size={11} color="var(--red)"/>}
        <span style={{color:up?"var(--teal)":"var(--red)"}}>{sub}</span>
      </div>
    </div>
  );
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
function Invoices({invoices,catalog,setInvoices,search,filter,setFilter,show,modal,setModal}){
  const EI = {itemId:"",name:"",price:"",qty:1};
  const [form,setForm]=useState({type:"revenue",date:new Date().toISOString().split("T")[0],customer:"",items:[{...EI}]});
  const [editId,setEditId]=useState(null);

  const filtered=invoices.filter(inv=>{
    const s=search.toLowerCase();
    return (!s||(inv.customer||"").toLowerCase().includes(s)||inv.items.some(i=>i.name.toLowerCase().includes(s)))
      &&(filter==="all"||inv.type===filter);
  });

  const total=items=>items.reduce((s,i)=>s+(parseFloat(i.price)||0)*(parseInt(i.qty)||0),0);

  const upd=(idx,k,v)=>setForm(f=>({...f,items:f.items.map((it,i)=>i===idx?{...it,[k]:v}:it)}));

  // Auto-fill from catalog dropdown
  const pick=(idx,id)=>{
    const found=catalog.find(x=>String(x.id)===String(id));
    setForm(f=>({...f,items:f.items.map((it,i)=>i!==idx?it:found?{itemId:id,name:found.name,price:found.price,qty:it.qty||1}:{...it,itemId:""})}));
  };

  const openAdd=()=>{setEditId(null);setForm({type:"revenue",date:new Date().toISOString().split("T")[0],customer:"",items:[{...EI}]});setModal("inv")};
  const openEdit=inv=>{setEditId(inv.id);setForm({type:inv.type,date:inv.date,customer:inv.customer||"",items:inv.items.map(i=>({itemId:"",name:i.name,price:i.price,qty:i.qty}))});setModal("inv")};

  const save=()=>{
    const t=total(form.items);
    if(!t||form.items.some(i=>!i.name)){show("يرجى اختيار منتج وإدخال الكمية","error");return}
    const inv={...form,total:t,id:editId||Date.now()};
    editId?setInvoices(p=>p.map(x=>x.id===editId?inv:x)):setInvoices(p=>[...p,inv]);
    show(editId?"تم تعديل الفاتورة":"تم إضافة الفاتورة");
    setModal(null);
  };

  const roles=catalog.filter(x=>x.cat==="role");
  const prods=catalog.filter(x=>x.cat==="product");

  return(
    <>
      <div className="tc">
        <div className="th">
          <h3>الفواتير ({filtered.length})</h3>
          <div className="ta">
            <div className="fps">
              {[["all","الكل"],["revenue","إيرادات"],["expense","مصاريف"]].map(([v,l])=>(
                <span key={v} className={`pill ${filter===v?"act":""}`} onClick={()=>setFilter(v)}>{l}</span>
              ))}
            </div>
            <button className="bp" onClick={openAdd}><Icon name="plus" size={14}/>فاتورة جديدة</button>
          </div>
        </div>
        <table>
          <thead><tr><th>#</th><th>العميل</th><th>المنتجات</th><th>التاريخ</th><th>الإجمالي</th><th>النوع</th><th></th></tr></thead>
          <tbody>
            {filtered.length===0?(
              <tr><td colSpan={7}><div className="empty"><Icon name="invoice" size={40}/><p>لا توجد فواتير</p></div></td></tr>
            ):filtered.map(inv=>(
              <tr key={inv.id}>
                <td className="mono" style={{color:"var(--text3)"}}>#{inv.id}</td>
                <td style={{color:inv.customer?"var(--text)":"var(--text3)"}}>{inv.customer||"—"}</td>
                <td style={{fontSize:13,color:"var(--text2)"}}>{inv.items.map(i=>i.name).join("، ")}</td>
                <td style={{color:"var(--text3)",fontSize:13}}>{inv.date}</td>
                <td className="mono" style={{color:inv.type==="revenue"?"var(--teal)":"var(--red)",fontWeight:700}}>{fmt(inv.total)}</td>
                <td><span className={`bdg ${inv.type}`}>{inv.type==="revenue"?"إيراد":"مصروف"}</span></td>
                <td><div className="ab">
                  <button className="bi ed" onClick={()=>openEdit(inv)}><Icon name="edit" size={14}/></button>
                  <button className="bi dl" onClick={()=>{setInvoices(p=>p.filter(x=>x.id!==inv.id));show("تم حذف الفاتورة")}}><Icon name="trash" size={14}/></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal==="inv"&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="md">
            <div className="mh">
              <div className="mt">{editId?"تعديل الفاتورة":"فاتورة جديدة"}</div>
              <button className="mx" onClick={()=>setModal(null)}><Icon name="close" size={14}/></button>
            </div>

            <div className="r2">
              <div className="mf">
                <label>نوع الفاتورة</label>
                <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  <option value="revenue">إيراد (بيعة)</option>
                  <option value="expense">مصروف</option>
                </select>
              </div>
              <div className="mf">
                <label>التاريخ</label>
                <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
              </div>
            </div>

            <div className="mf">
              <label>اسم العميل (اختياري)</label>
              <input placeholder="مثل: محمد العمري" value={form.customer} onChange={e=>setForm(f=>({...f,customer:e.target.value}))}/>
            </div>

            <div className="div-lbl" style={{marginBottom:8}}>البنود</div>

            {form.items.map((item,idx)=>(
              <div key={idx} className="ii">
                {form.items.length>1&&(
                  <button className="ix" onClick={()=>setForm(f=>({...f,items:f.items.filter((_,i)=>i!==idx)}))}>✕</button>
                )}

                {/* ★ Dropdown picks from roles & products → auto-fills name & price */}
                <div className="mf" style={{marginBottom:8}}>
                  <label>اختر من الكتالوج</label>
                  <select value={item.itemId} onChange={e=>pick(idx,e.target.value)}>
                    <option value="">— اختر رتبة أو منتج —</option>
                    {roles.length>0&&(
                      <optgroup label="🎖 رتب السيرفر">
                        {roles.map(r=><option key={r.id} value={r.id}>{r.name}  —  {fmt(r.price)}</option>)}
                      </optgroup>
                    )}
                    {prods.length>0&&(
                      <optgroup label="📦 منتجات أخرى">
                        {prods.map(p=><option key={p.id} value={p.id}>{p.name}  —  {fmt(p.price)}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="r3">
                  <div className="mf" style={{marginBottom:0}}>
                    <label>الاسم</label>
                    <input placeholder="اسم تلقائي من الكتالوج" value={item.name} onChange={e=>upd(idx,"name",e.target.value)}/>
                  </div>
                  <div className="mf" style={{marginBottom:0}}>
                    <label>السعر</label>
                    <input type="number" placeholder="0" value={item.price} onChange={e=>upd(idx,"price",e.target.value)}/>
                  </div>
                  <div className="mf" style={{marginBottom:0}}>
                    <label>الكمية</label>
                    <input type="number" min={1} value={item.qty} onChange={e=>upd(idx,"qty",e.target.value)}/>
                  </div>
                </div>
              </div>
            ))}

            <button className="bai" onClick={()=>setForm(f=>({...f,items:[...f.items,{...EI}]}))}>
              <Icon name="plus" size={14}/> إضافة بند جديد
            </button>

            <div className="tp">
              <span className="tl">الإجمالي</span>
              <span className="ta2">{fmt(total(form.items))}</span>
            </div>

            <div className="mft">
              <button className="bs" onClick={()=>setModal(null)}>إلغاء</button>
              <button className="bp" onClick={save}><Icon name="invoice" size={14}/>{editId?"حفظ التعديل":"حفظ الفاتورة"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Roles ────────────────────────────────────────────────────────────────────
function Roles({roles,setRoles,setPH,search,show,modal,setModal}){
  const [editR,setEditR]=useState(null);
  const [form,setForm]=useState({name:"",price:"",color:"#f5c842",description:""});

  const filtered=roles.filter(r=>!search||r.name.toLowerCase().includes(search.toLowerCase())||r.description.includes(search));

  const openAdd=()=>{setEditR(null);setForm({name:"",price:"",color:"#f5c842",description:""});setModal("role")};
  const openEdit=r=>{setEditR(r);setForm({name:r.name,price:r.price,color:r.color,description:r.description});setModal("role")};

  const save=()=>{
    if(!form.name||!form.price){show("يرجى إدخال الاسم والسعر","error");return}
    const np=parseFloat(form.price);
    if(editR){
      if(editR.price!==np) setPH(h=>[...h,{id:Date.now(),productId:editR.id,productName:form.name,oldPrice:editR.price,newPrice:np,date:new Date().toISOString()}]);
      setRoles(p=>p.map(x=>x.id===editR.id?{...x,...form,price:np}:x));
      show("تم تعديل الرتبة");
    }else{
      setRoles(p=>[...p,{id:Date.now(),...form,price:np}]);
      show("تم إضافة الرتبة");
    }
    setModal(null);
  };

  return(
    <>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontSize:17,fontWeight:700,marginBottom:4}}>رتب السيرفر</h2>
          <p style={{fontSize:13,color:"var(--text3)"}}>أضف وعدّل رتب متجرك — تظهر تلقائياً في الفواتير</p>
        </div>
        <button className="bp" onClick={openAdd}><Icon name="plus" size={14}/>رتبة جديدة</button>
      </div>

      {filtered.length===0?(
        <div className="empty" style={{padding:"80px 20px"}}><Icon name="role" size={48}/><p>لا توجد رتب — أضف أول رتبة!</p></div>
      ):(
        <div className="rg">
          {filtered.map(r=>(
            <div key={r.id} className="rc">
              <div className="rstr" style={{background:r.color}}/>
              <div className="rct">
                <div className="rn" style={{color:r.color}}>{r.name}</div>
                <div className="rdot" style={{background:r.color}}/>
              </div>
              <div className="rd">{r.description||"—"}</div>
              <div className="rp">{fmt(r.price)}</div>
              <div className="rac">
                <button className="bi ed" onClick={()=>openEdit(r)}><Icon name="edit" size={14}/></button>
                <button className="bi dl" onClick={()=>{setRoles(p=>p.filter(x=>x.id!==r.id));show("تم حذف الرتبة")}}><Icon name="trash" size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal==="role"&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="md">
            <div className="mh">
              <div className="mt">{editR?"تعديل الرتبة":"إضافة رتبة جديدة"}</div>
              <button className="mx" onClick={()=>setModal(null)}><Icon name="close" size={14}/></button>
            </div>
            <div className="r2">
              <div className="mf"><label>اسم الرتبة *</label><input placeholder="مثال: VIP, Elite, MVP" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              <div className="mf"><label>السعر *</label><input type="number" placeholder="0" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
            </div>

            {editR&&parseFloat(form.price)!==editR.price&&(
              <div className="wb">⚠ سيُسجّل تغيير السعر: {fmt(editR.price)} ← {fmt(parseFloat(form.price)||0)}</div>
            )}

            <div className="mf">
              <label>لون الرتبة</label>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <input type="color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} style={{width:46,height:40,padding:2,background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:"var(--rs)",cursor:"pointer"}}/>
                <input value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} style={{flex:1,fontFamily:"'Space Mono',monospace"}} placeholder="#f5c842"/>
                <div style={{width:40,height:40,borderRadius:10,background:form.color,border:"2px solid var(--border2)",flexShrink:0}}/>
              </div>
            </div>

            <div className="mf"><label>وصف الرتبة</label><textarea rows={3} placeholder="مميزات هذه الرتبة..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>

            {/* Live preview */}
            <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"var(--rs)",padding:14,marginBottom:8}}>
              <div style={{fontSize:11,color:"var(--text3)",marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>معاينة مباشرة</div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:form.color||"#ccc"}}/>
                <span style={{color:form.color||"#ccc",fontWeight:700,fontSize:16}}>{form.name||"اسم الرتبة"}</span>
                <span style={{marginRight:"auto",color:"var(--gold)",fontFamily:"'Space Mono',monospace",fontWeight:700}}>{fmt(parseFloat(form.price)||0)}</span>
              </div>
              {form.description&&<div style={{fontSize:12,color:"var(--text2)",marginTop:6,paddingRight:20}}>{form.description}</div>}
            </div>

            <div className="mft">
              <button className="bs" onClick={()=>setModal(null)}>إلغاء</button>
              <button className="bp" onClick={save}><Icon name="role" size={14}/>{editR?"حفظ التعديلات":"إضافة الرتبة"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────
function Products({products,setProducts,setPH,search,show,modal,setModal}){
  const [editP,setEditP]=useState(null);
  const [form,setForm]=useState({name:"",price:"",description:""});
  const filtered=products.filter(p=>!search||p.name.includes(search));
  const openAdd=()=>{setEditP(null);setForm({name:"",price:"",description:""});setModal("prod")};
  const openEdit=p=>{setEditP(p);setForm({name:p.name,price:p.price,description:p.description});setModal("prod")};
  const save=()=>{
    if(!form.name||!form.price){show("يرجى ملء الحقول","error");return}
    const np=parseFloat(form.price);
    if(editP){
      if(editP.price!==np) setPH(h=>[...h,{id:Date.now(),productId:editP.id,productName:form.name,oldPrice:editP.price,newPrice:np,date:new Date().toISOString()}]);
      setProducts(p=>p.map(x=>x.id===editP.id?{...x,...form,price:np}:x));
      show("تم تعديل المنتج");
    }else{
      setProducts(p=>[...p,{id:Date.now(),...form,price:np}]);
      show("تم إضافة المنتج");
    }
    setModal(null);
  };
  return(
    <>
      <div className="tc">
        <div className="th"><h3>المنتجات ({filtered.length})</h3><button className="bp" onClick={openAdd}><Icon name="plus" size={14}/>منتج جديد</button></div>
        <table>
          <thead><tr><th>#</th><th>الاسم</th><th>الوصف</th><th>السعر</th><th></th></tr></thead>
          <tbody>
            {filtered.length===0?(<tr><td colSpan={5}><div className="empty"><Icon name="product" size={40}/><p>لا توجد منتجات</p></div></td></tr>)
            :filtered.map((p,i)=>(
              <tr key={p.id}>
                <td className="mono" style={{color:"var(--text3)"}}>{i+1}</td>
                <td style={{fontWeight:600}}>{p.name}</td>
                <td style={{color:"var(--text2)",fontSize:13}}>{p.description}</td>
                <td className="mono" style={{color:"var(--gold)",fontWeight:700}}>{fmt(p.price)}</td>
                <td><div className="ab">
                  <button className="bi ed" onClick={()=>openEdit(p)}><Icon name="edit" size={14}/></button>
                  <button className="bi dl" onClick={()=>{setProducts(pr=>pr.filter(x=>x.id!==p.id));show("تم الحذف")}}><Icon name="trash" size={14}/></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal==="prod"&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="md">
            <div className="mh"><div className="mt">{editP?"تعديل المنتج":"منتج جديد"}</div><button className="mx" onClick={()=>setModal(null)}><Icon name="close" size={14}/></button></div>
            <div className="mf"><label>اسم المنتج *</label><input placeholder="اسم المنتج" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div className="mf"><label>السعر *</label><input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
            {editP&&parseFloat(form.price)!==editP.price&&<div className="wb">⚠ سيُسجّل تغيير السعر: {fmt(editP.price)} ← {fmt(parseFloat(form.price)||0)}</div>}
            <div className="mf"><label>الوصف</label><textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
            <div className="mft"><button className="bs" onClick={()=>setModal(null)}>إلغاء</button><button className="bp" onClick={save}>{editP?"حفظ":"إضافة"}</button></div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Profit ───────────────────────────────────────────────────────────────────
function Profit({invoices,rev,exp,net,chartData,filter,setFilter}){
  return(
    <>
      <div className="sg" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
        <div className="sc teal"><div className="sl">إجمالي الإيرادات</div><div className="sv teal">{fmt(rev)}</div></div>
        <div className="sc red"><div className="sl">إجمالي المصاريف</div><div className="sv red">{fmt(exp)}</div></div>
        <div className={`sc ${net>=0?"gold":"red"}`}><div className="sl">صافي الربح</div><div className={`sv ${net>=0?"gold":"red"}`}>{fmt(net)}</div></div>
      </div>
      <div className="cc" style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div><div className="ct">الأداء الشهري</div><div className="cs">مقارنة الإيرادات والمصاريف</div></div>
          <div className="fps">{[["all","الكل"],["week","أسبوع"],["month","شهر"]].map(([v,l])=><span key={v} className={`pill ${filter===v?"act":""}`} onClick={()=>setFilter(v)}>{l}</span>)}</div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2f4d"/>
            <XAxis dataKey="name" tick={{fill:"#4d6080",fontSize:12}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:"#4d6080",fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:"#0f1a2e",border:"1px solid #1e2f4d",borderRadius:8,color:"#e8edf8"}}/>
            <Legend formatter={v=><span style={{color:"#8fa0c0",fontSize:13}}>{v}</span>}/>
            <Bar dataKey="أرباح" fill="#00d4a8" radius={[4,4,0,0]}/>
            <Bar dataKey="مصاريف" fill="#ff4757" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="tc">
        <div className="th"><h3>تفاصيل الفواتير</h3></div>
        <table>
          <thead><tr><th>#</th><th>التاريخ</th><th>العميل</th><th>المنتجات</th><th>الإجمالي</th><th>النوع</th></tr></thead>
          <tbody>{invoices.map(inv=>(
            <tr key={inv.id}>
              <td className="mono" style={{color:"var(--text3)"}}>#{inv.id}</td>
              <td>{inv.date}</td>
              <td style={{color:inv.customer?"var(--text)":"var(--text3)"}}>{inv.customer||"—"}</td>
              <td style={{fontSize:13,color:"var(--text2)"}}>{inv.items.map(i=>i.name).join("، ")}</td>
              <td className="mono" style={{color:inv.type==="revenue"?"var(--teal)":"var(--red)",fontWeight:700}}>{inv.type==="revenue"?"+":"-"}{fmt(inv.total)}</td>
              <td><span className={`bdg ${inv.type}`}>{inv.type==="revenue"?"إيراد":"مصروف"}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}

// ─── Price History ────────────────────────────────────────────────────────────
function PriceHistory({priceHistory,search}){
  const list=[...priceHistory].reverse().filter(ph=>!search||ph.productName.includes(search));
  return(
    <div className="tc">
      <div className="th"><h3>سجل تغيّر الأسعار ({list.length})</h3></div>
      <table>
        <thead><tr><th>#</th><th>الرتبة / المنتج</th><th>السعر القديم</th><th>السعر الجديد</th><th>التغيير</th><th>التاريخ</th></tr></thead>
        <tbody>
          {list.length===0?(
            <tr><td colSpan={6}><div className="empty"><Icon name="history" size={40}/><p>لا توجد تغييرات مسجّلة بعد</p></div></td></tr>
          ):list.map((ph,i)=>{
            const up=ph.newPrice>ph.oldPrice;
            const pct=((Math.abs(ph.newPrice-ph.oldPrice)/ph.oldPrice)*100).toFixed(1);
            return(
              <tr key={ph.id}>
                <td className="mono" style={{color:"var(--text3)"}}>{list.length-i}</td>
                <td style={{fontWeight:600}}>{ph.productName}</td>
                <td className="mono" style={{color:"var(--text3)",textDecoration:"line-through"}}>{fmt(ph.oldPrice)}</td>
                <td className="mono" style={{color:up?"var(--teal)":"var(--red)",fontWeight:700}}>{fmt(ph.newPrice)}</td>
                <td><span className={`bdg ${up?"revenue":"expense"}`}>{up?"▲":"▼"} {pct}%</span></td>
                <td style={{color:"var(--text3)",fontSize:13}}>{new Date(ph.date).toLocaleString("ar-SA")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
