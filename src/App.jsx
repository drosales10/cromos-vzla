import { useState, useEffect, useRef } from "react";
import { api } from "./api";
import AlbumSticker from "./components/AlbumSticker";
import { TradePropose } from "./components/TradePropose";
import {
  EMPTY_CROMOS,
  normalizeCromosPayload,
  getDoubleIds,
  getOwnedCount,
  getDoubleCount,
  getMissingIds,
  TRADE_MAX_STICKERS,
} from "./cromosUtils";
import { openGroupKey, readGroupNav, writeGroupNav, clearOpenGroup } from "./groupNavStorage";

// ─── DATOS DEL ÁLBUM LA BOLSA DE CROMOS ─────────────────────────────────────
const SECTIONS_RAW = [
  { id:"FWC",  name:"FIFA World Cup",   flag:"🏆", color:"#FFD700", count:20, start:0, special:true },
  { id:"MEX",  name:"México",           flag:"🇲🇽", color:"#006847", count:20 },
  { id:"RSA",  name:"Sudáfrica",        flag:"🇿🇦", color:"#007A4D", count:20 },
  { id:"KOR",  name:"Corea del Sur",    flag:"🇰🇷", color:"#CD2E3A", count:20 },
  { id:"CZE",  name:"Rep. Checa",       flag:"🇨🇿", color:"#D7141A", count:20 },
  { id:"CAN",  name:"Canadá",           flag:"🇨🇦", color:"#FF0000", count:20 },
  { id:"BIH",  name:"Bosnia-Herz.",     flag:"🇧🇦", color:"#002395", count:20 },
  { id:"QAT",  name:"Qatar",            flag:"🇶🇦", color:"#8D153A", count:20 },
  { id:"SUI",  name:"Suiza",            flag:"🇨🇭", color:"#FF0000", count:20 },
  { id:"BRA",  name:"Brasil",           flag:"🇧🇷", color:"#009C3B", count:20 },
  { id:"MAR",  name:"Marruecos",        flag:"🇲🇦", color:"#C1272D", count:20 },
  { id:"HAI",  name:"Haití",            flag:"🇭🇹", color:"#00209F", count:20 },
  { id:"SCO",  name:"Escocia",          flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", color:"#003DA5", count:20 },
  { id:"USA",  name:"Estados Unidos",   flag:"🇺🇸", color:"#3C3B6E", count:20 },
  { id:"PAR",  name:"Paraguay",         flag:"🇵🇾", color:"#D52B1E", count:20 },
  { id:"AUS",  name:"Australia",        flag:"🇦🇺", color:"#00843D", count:20 },
  { id:"TUR",  name:"Turquía",          flag:"🇹🇷", color:"#E30A17", count:20 },
  { id:"GER",  name:"Alemania",         flag:"🇩🇪", color:"#555555", count:20 },
  { id:"CUW",  name:"Curazao",          flag:"🇨🇼", color:"#003DA5", count:20 },
  { id:"CIV",  name:"Costa de Marfil",  flag:"🇨🇮", color:"#F77F00", count:20 },
  { id:"ECU",  name:"Ecuador",          flag:"🇪🇨", color:"#FFD100", count:20 },
  { id:"NED",  name:"Países Bajos",     flag:"🇳🇱", color:"#FF6600", count:20 },
  { id:"JPN",  name:"Japón",            flag:"🇯🇵", color:"#BC002D", count:20 },
  { id:"SWE",  name:"Suecia",           flag:"🇸🇪", color:"#006AA7", count:20 },
  { id:"TUN",  name:"Túnez",            flag:"🇹🇳", color:"#E70013", count:20 },
  { id:"BEL",  name:"Bélgica",          flag:"🇧🇪", color:"#EF3340", count:20 },
  { id:"EGY",  name:"Egipto",           flag:"🇪🇬", color:"#CE1126", count:20 },
  { id:"IRN",  name:"Irán",             flag:"🇮🇷", color:"#239F40", count:20 },
  { id:"NZL",  name:"Nueva Zelanda",    flag:"🇳🇿", color:"#00247D", count:20 },
  { id:"ESP",  name:"España",           flag:"🇪🇸", color:"#AA151B", count:20 },
  { id:"CPV",  name:"Cabo Verde",       flag:"🇨🇻", color:"#003893", count:20 },
  { id:"KSA",  name:"Arabia Saudí",     flag:"🇸🇦", color:"#006C35", count:20 },
  { id:"URU",  name:"Uruguay",          flag:"🇺🇾", color:"#5EB6E4", count:20 },
  { id:"FRA",  name:"Francia",          flag:"🇫🇷", color:"#002395", count:20 },
  { id:"SEN",  name:"Senegal",          flag:"🇸🇳", color:"#00853F", count:20 },
  { id:"IRQ",  name:"Irak",             flag:"🇮🇶", color:"#007A3D", count:20 },
  { id:"NOR",  name:"Noruega",          flag:"🇳🇴", color:"#EF2B2D", count:20 },
  { id:"ARG",  name:"Argentina",        flag:"🇦🇷", color:"#74ACDF", count:20 },
  { id:"ALG",  name:"Argelia",          flag:"🇩🇿", color:"#006233", count:20 },
  { id:"AUT",  name:"Austria",          flag:"🇦🇹", color:"#ED2939", count:20 },
  { id:"JOR",  name:"Jordania",         flag:"🇯🇴", color:"#007A3D", count:20 },
  { id:"POR",  name:"Portugal",         flag:"🇵🇹", color:"#006600", count:20 },
  { id:"COD",  name:"R.D. Congo",       flag:"🇨🇩", color:"#007FFF", count:20 },
  { id:"UZB",  name:"Uzbekistán",       flag:"🇺🇿", color:"#1EB53A", count:20 },
  { id:"COL",  name:"Colombia",         flag:"🇨🇴", color:"#FCD116", count:20 },
  { id:"ENG",  name:"Inglaterra",       flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", color:"#CF142B", count:20 },
  { id:"CRO",  name:"Croacia",          flag:"🇭🇷", color:"#FF0000", count:20 },
  { id:"GHA",  name:"Ghana",            flag:"🇬🇭", color:"#006B3F", count:20 },
  { id:"PAN",  name:"Panamá",           flag:"🇵🇦", color:"#DA121A", count:20 },
  { id:"CC",   name:"Coca-Cola",        flag:"🥤", color:"#F40009", count:14, special:true },
];

// FIFA World Cup primero, luego países A-Z, luego especiales al final
const SECTIONS = [
  ...SECTIONS_RAW.filter(s=>s.id==="FWC"),
  ...SECTIONS_RAW.filter(s=>!s.special).sort((a,b)=>a.name.localeCompare(b.name,"es")),
  ...SECTIONS_RAW.filter(s=>s.special&&s.id!=="FWC"),
];

function buildAllCromos() {
  const all = [];
  SECTIONS.forEach(s => {
    const start = s.start ?? 1;
    for (let i = start; i < start + s.count; i++) {
      const num = s.start === 0 ? String(i).padStart(2,"0") : i;
      all.push({ id:`${s.id}${num}`, section:s.id, num });
    }
  });
  return all;
}
const ALL_CROMOS = buildAllCromos();
const TOTAL = ALL_CROMOS.length;
const genId   = () => Math.random().toString(36).slice(2,10);
const genCode = () => Math.random().toString(36).slice(2,7).toUpperCase();

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const THEME_PRESETS = {
  dark: {
    "--app-bg": "#080c14",
    "--app-card": "#0f1623",
    "--app-card-2": "#161e2e",
    "--app-accent": "#C9A84C",
    "--app-accent-2": "#4C9AC8",
    "--app-accent-3": "#4CC87A",
    "--app-danger": "#C84C4C",
    "--app-text": "#EEF2FF",
    "--app-muted": "#6B7A99",
    "--app-border": "#1E2A3E",
    "--app-nav-hover": "#253045",
    "--app-scroll-track": "#080c14",
    "--app-body-glow-1": "rgba(201,168,76,.06)",
    "--app-body-glow-2": "rgba(76,154,200,.05)",
    "--app-chip-fallback": "linear-gradient(135deg,#151f31,#253047)",
    "--app-chip-need": "rgba(200,76,76,.22)",
    "--app-chip-have": "rgba(76,200,122,.18)",
    "--app-chip-both": "rgba(201,168,76,.18)",
    "--app-chip-need-text": "#E07070",
    "--app-chip-have-text": "#4CC87A",
    "--app-chip-both-text": "#C9A84C",
    "--app-chip-need-overlay": "linear-gradient(180deg,rgba(0,0,0,.1),rgba(200,76,76,.4))",
    "--app-chip-have-overlay": "linear-gradient(180deg,rgba(0,0,0,.05),rgba(11,39,21,.25))",
    "--app-chip-both-overlay": "linear-gradient(180deg,rgba(0,0,0,.05),rgba(201,168,76,.35))",
    "--app-chip-id": "#e9eefc",
    "--app-modal-overlay": "rgba(0,0,0,.78)",
    "--app-stage-bg": "linear-gradient(145deg,#0b111d,#111a2a)",
    "--app-stage-shadow": "rgba(0,0,0,.65)",
    "--app-page-border": "rgba(255,255,255,.12)",
    "--app-page-shadow": "rgba(0,0,0,.42)",
    "--app-page-inner": "rgba(255,255,255,.08)",
    "--app-page-shine": "rgba(255,255,255,.28)",
    "--app-cover-fit-bg": "#0b1220",
    "--app-cover-copy": "#f8fafc",
    "--app-cinema-bg": "rgba(7,12,20,.72)",
    "--app-cinema-border": "rgba(255,255,255,.18)",
    "--app-edge-hit": "rgba(255,255,255,.1)",
    "--app-spotlight-1": "rgba(90,170,255,.28)",
    "--app-spotlight-2": "rgba(255,245,190,.26)",
  },
  light: {
    "--app-bg": "#f5f7fb",
    "--app-card": "#ffffff",
    "--app-card-2": "#eef3f8",
    "--app-accent": "#A67C00",
    "--app-accent-2": "#256F9C",
    "--app-accent-3": "#188A58",
    "--app-danger": "#CF4A4A",
    "--app-text": "#16202D",
    "--app-muted": "#5B6675",
    "--app-border": "#D7E0EA",
    "--app-nav-hover": "#DBE4EE",
    "--app-scroll-track": "#f5f7fb",
    "--app-body-glow-1": "rgba(166,124,0,.08)",
    "--app-body-glow-2": "rgba(37,111,156,.08)",
    "--app-chip-fallback": "linear-gradient(135deg,#edf2f7,#d7e3ef)",
    "--app-chip-need": "rgba(207,74,74,.14)",
    "--app-chip-have": "rgba(24,138,88,.14)",
    "--app-chip-both": "rgba(166,124,0,.14)",
    "--app-chip-need-text": "#B93E3E",
    "--app-chip-have-text": "#188A58",
    "--app-chip-both-text": "#A67C00",
    "--app-chip-need-overlay": "linear-gradient(180deg,rgba(255,255,255,.2),rgba(207,74,74,.22))",
    "--app-chip-have-overlay": "linear-gradient(180deg,rgba(255,255,255,.1),rgba(24,138,88,.18))",
    "--app-chip-both-overlay": "linear-gradient(180deg,rgba(255,255,255,.1),rgba(166,124,0,.18))",
    "--app-chip-id": "#1b2735",
    "--app-modal-overlay": "rgba(15,23,42,.48)",
    "--app-stage-bg": "linear-gradient(145deg,#ffffff,#edf3f8)",
    "--app-stage-shadow": "rgba(15,23,42,.22)",
    "--app-page-border": "rgba(15,23,42,.12)",
    "--app-page-shadow": "rgba(15,23,42,.14)",
    "--app-page-inner": "rgba(15,23,42,.08)",
    "--app-page-shine": "rgba(255,255,255,.8)",
    "--app-cover-fit-bg": "#dfe8f2",
    "--app-cover-copy": "#10202f",
    "--app-cinema-bg": "rgba(255,255,255,.8)",
    "--app-cinema-border": "rgba(15,23,42,.12)",
    "--app-edge-hit": "rgba(15,23,42,.08)",
    "--app-spotlight-1": "rgba(37,111,156,.18)",
    "--app-spotlight-2": "rgba(166,124,0,.16)",
  },
};

const G = {
  bg: "var(--app-bg)",
  card: "var(--app-card)",
  card2: "var(--app-card-2)",
  accent: "var(--app-accent)",
  accent2: "var(--app-accent-2)",
  accent3: "var(--app-accent-3)",
  danger: "var(--app-danger)",
  text: "var(--app-text)",
  muted: "var(--app-muted)",
  border: "var(--app-border)",
};

const getThemeModeFromPrefs = (prefs) => {
  const value = prefs?.theme_mode;
  if (value === "light" || value === "dark" || value === "system") return value;
  return "dark";
};

const getThemeVars = (mode) => THEME_PRESETS[mode] || THEME_PRESETS.dark;

const getEffectiveThemeMode = (themeMode, prefersLight) => (themeMode === "system" ? (prefersLight ? "light" : "dark") : themeMode);

const APP_LAYOUT_MAX_WIDTH = 1540;

const CSS = `
 :root{
  --app-bg:#080c14;
  --app-card:#0f1623;
  --app-card-2:#161e2e;
  --app-accent:#C9A84C;
  --app-accent-2:#4C9AC8;
  --app-accent-3:#4CC87A;
  --app-danger:#C84C4C;
  --app-text:#EEF2FF;
  --app-muted:#6B7A99;
  --app-border:#1E2A3E;
  --app-nav-hover:#253045;
  --app-scroll-track:#080c14;
  --app-body-glow-1:rgba(201,168,76,.06);
  --app-body-glow-2:rgba(76,154,200,.05);
  --app-chip-fallback:linear-gradient(135deg,#151f31,#253047);
  --app-chip-need:rgba(200,76,76,.22);
  --app-chip-have:rgba(76,200,122,.18);
  --app-chip-both:rgba(201,168,76,.18);
  --app-chip-need-text:#E07070;
  --app-chip-have-text:#4CC87A;
  --app-chip-both-text:#C9A84C;
  --app-chip-need-overlay:linear-gradient(180deg,rgba(0,0,0,.1),rgba(200,76,76,.4));
  --app-chip-have-overlay:linear-gradient(180deg,rgba(0,0,0,.05),rgba(11,39,21,.25));
  --app-chip-both-overlay:linear-gradient(180deg,rgba(0,0,0,.05),rgba(201,168,76,.35));
  --app-chip-id:#e9eefc;
  --app-modal-overlay:rgba(0,0,0,.78);
  --app-stage-bg:linear-gradient(145deg,#0b111d,#111a2a);
  --app-stage-shadow:rgba(0,0,0,.65);
  --app-page-border:rgba(255,255,255,.12);
  --app-page-shadow:rgba(0,0,0,.42);
  --app-page-inner:rgba(255,255,255,.08);
  --app-page-shine:rgba(255,255,255,.28);
  --app-cover-fit-bg:#0b1220;
  --app-cover-copy:#f8fafc;
  --app-cinema-bg:rgba(7,12,20,.72);
  --app-cinema-border:rgba(255,255,255,.18);
  --app-edge-hit:rgba(255,255,255,.1);
  --app-spotlight-1:rgba(90,170,255,.28);
  --app-spotlight-2:rgba(255,245,190,.26);
 }
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--app-bg);color:var(--app-text);font-family:'Nunito',sans-serif;min-height:100vh}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--app-scroll-track)}::-webkit-scrollbar-thumb{background:var(--app-border);border-radius:3px}
.h1{font-family:'Barlow Condensed',sans-serif;font-weight:900;letter-spacing:2px}
.btn{padding:9px 18px;border:none;border-radius:9px;cursor:pointer;font-family:'Nunito',sans-serif;font-weight:700;font-size:13px;transition:all .18s;display:inline-flex;align-items:center;gap:6px}
.btn-gold{background:linear-gradient(135deg,#C9A84C,#F0CC70);color:#08100a}
.btn-gold:hover{filter:brightness(1.1);transform:translateY(-1px)}
.btn-blue{background:${G.accent2};color:#fff}.btn-blue:hover{filter:brightness(1.12)}
.btn-ghost{background:${G.border};color:${G.text}}.btn-ghost:hover{background:#253045}
.btn-danger{background:${G.danger};color:#fff}
.btn-sm{padding:5px 12px;font-size:12px;border-radius:7px}
.input{background:${G.card2};border:1.5px solid ${G.border};border-radius:9px;color:${G.text};padding:10px 13px;font-family:'Nunito',sans-serif;font-size:14px;width:100%;outline:none;transition:border-color .2s}
.input:focus{border-color:${G.accent}}.input::placeholder{color:${G.muted}}
.card{background:${G.card};border:1px solid ${G.border};border-radius:14px;padding:18px}
.card2{background:${G.card2};border:1px solid ${G.border};border-radius:12px;padding:14px}
.badge{padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;display:inline-block}
.b-gold{background:rgba(201,168,76,.18);color:var(--app-accent);border:1px solid rgba(201,168,76,.35)}
.b-green{background:rgba(76,200,122,.15);color:var(--app-accent-3);border:1px solid rgba(76,200,122,.3)}
.b-red{background:rgba(200,76,76,.15);color:#E07070;border:1px solid rgba(200,76,76,.3)}
.b-blue{background:rgba(76,154,200,.15);color:var(--app-accent-2);border:1px solid rgba(76,154,200,.3)}
.nav-item{padding:7px 15px;border-radius:9px;cursor:pointer;font-weight:700;font-size:13px;transition:all .18s;color:${G.muted};border:1.5px solid transparent}
.nav-item:hover{color:var(--app-text);background:var(--app-nav-hover)}.nav-item.active{color:#08100a;background:linear-gradient(135deg,var(--app-accent),#F0CC70)}
.chip{border-radius:9px;border:1.5px solid ${G.border};cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:all .13s;background:${G.card2};padding:4px 2px;width:4.5cm;min-height:6cm;font-size:10px;font-weight:700;text-align:center;gap:1px}
.chip:hover{transform:scale(1.08);z-index:2}
.chip.need{background:var(--app-chip-need);border-color:#C84C4C;color:var(--app-chip-need-text)}
.chip.have{background:var(--app-chip-have);border-color:#4CC87A;color:var(--app-chip-have-text)}
.chip.both{background:var(--app-chip-both);border-color:var(--app-accent);color:var(--app-chip-both-text)}
.chip-tile{position:relative;overflow:hidden;border-radius:8px;width:4.5cm;height:6cm}
.chip-tile img{width:100%;height:100%;object-fit:cover;display:block;transition:filter .2s, transform .2s}
.chip-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--app-chip-fallback);font-size:13px;font-weight:800}
.chip.need .chip-tile img{filter:grayscale(1) brightness(.35) saturate(.3)}
.chip.have .chip-tile img{filter:none}
.chip.both .chip-tile img{filter:saturate(1.15) contrast(1.05)}
.chip-tile .ov{position:relative;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:3px;font-size:9px;font-weight:800;letter-spacing:.2px}
.chip.need .chip-tile .ov{background:var(--app-chip-need-overlay);color:#ffd7d7}
.chip.have .chip-tile .ov{background:var(--app-chip-have-overlay);color:#d8ffe7}
.chip.both .chip-tile .ov{background:var(--app-chip-both-overlay);color:#fff5d1}
.chip-id{position:absolute;top:3px;left:4px;font-size:8px;font-weight:700;color:var(--app-chip-id);text-shadow:0 1px 2px rgba(0,0,0,.8)}
.modal-bg{position:fixed;inset:0;background:var(--app-modal-overlay);display:flex;align-items:center;justify-content:center;z-index:999;padding:16px;backdrop-filter:blur(6px)}
.modal{background:var(--app-card);border:1px solid var(--app-border);border-radius:18px;padding:26px;max-width:460px;width:100%;max-height:88vh;overflow-y:auto}
.stat{background:var(--app-card-2);border-radius:11px;padding:12px 10px;text-align:center;border:1px solid var(--app-border)}
.stat-n{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:30px;line-height:1}
.stat-l{font-size:10px;color:var(--app-muted);font-weight:700;margin-top:3px;letter-spacing:.5px}
.match-row{background:linear-gradient(135deg,rgba(76,154,200,.07),rgba(76,200,122,.05));border:1px solid rgba(76,154,200,.25);border-radius:12px;padding:15px}
.prog-bar{height:6px;border-radius:3px;background:var(--app-border);overflow:hidden}
.prog-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--app-accent),var(--app-accent-2))}
.alert{padding:9px 13px;border-radius:9px;font-size:13px;font-weight:600}
.alert-err{background:rgba(200,76,76,.15);border:1px solid rgba(200,76,76,.35);color:#E07070}
.alert-ok{background:rgba(76,200,122,.13);border:1px solid rgba(76,200,122,.3);color:var(--app-accent-3)}
.spinner{width:36px;height:36px;border:3px solid var(--app-border);border-top-color:var(--app-accent);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.ani{animation:up .25s ease}
.book-shell{display:flex;flex-direction:column;gap:12px}
.book-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;padding-bottom:4px;scrollbar-width:thin}
.book-toolbar > *{flex:0 0 auto}
.book-toolbar-group{display:flex;gap:8px;align-items:center;flex:0 0 auto;white-space:nowrap}
.book-stage{position:relative;perspective:2400px;background:var(--app-stage-bg);border:1px solid var(--app-border);border-radius:14px;padding:12px;min-height:clamp(640px,78vh,980px);overflow:hidden;--flip-ms:620ms;--flip-depth:1;--flip-blur:10px}
.book-stage.fullscreen{position:fixed;inset:10px;z-index:9999;min-height:calc(100vh - 20px);border-radius:16px;box-shadow:0 24px 80px var(--app-stage-shadow)}
.book-stage::after{content:"";position:absolute;inset:-12%;pointer-events:none;opacity:0;mix-blend-mode:screen;filter:blur(var(--flip-blur))}
.book-stage.fx-next::after{animation:stageSweepNext var(--flip-ms) ease both;background:linear-gradient(100deg,rgba(90,170,255,0) 20%,var(--app-spotlight-1) 46%,var(--app-spotlight-2) 56%,rgba(90,170,255,0) 82%)}
.book-stage.fx-prev::after{animation:stageSweepPrev var(--flip-ms) ease both;background:linear-gradient(80deg,rgba(90,170,255,0) 20%,var(--app-spotlight-2) 44%,var(--app-spotlight-1) 52%,rgba(90,170,255,0) 82%)}
.book-edge-hit{
  position:absolute;
  top:50%;
  left:auto;
  right:auto;
  transform:translateY(-50%);
  height:60%;
  width:6%;
  min-width:28px;
  z-index:14;
  border:none;
  background:transparent;
  cursor:pointer;
  opacity:.22;
  transition:opacity .2s ease, background .2s ease;
}
.book-edge-hit.left{left:8px;background:linear-gradient(90deg,var(--app-edge-hit),rgba(255,255,255,0))}
.book-edge-hit.right{right:8px;background:linear-gradient(270deg,var(--app-edge-hit),rgba(255,255,255,0))}
.book-edge-hit:hover{opacity:.52}
.book-edge-hit:disabled{opacity:0;cursor:default}
.book-stage.fullscreen .book-edge-hit{width:9%;min-width:64px}
.book-stage>.book-page,.book-stage>.book-spread,.book-stage>.book-spread>.book-page{height:100%}
.book-page{position:relative;border-radius:12px;min-height:0;border:1px solid var(--app-page-border);box-shadow:0 16px 54px var(--app-page-shadow), inset 0 0 0 1px var(--app-page-inner);overflow:hidden;transform-origin:left center;transform-style:preserve-3d;backface-visibility:hidden}
.book-spread{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.book-page-spread-left{transform-origin:right center}
.book-page-spread-right{transform-origin:left center}
.book-page::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.15),transparent 14%,transparent 86%,rgba(0,0,0,.1));opacity:calc(.7 + .15 * var(--flip-depth))}
.book-page::after{content:"";position:absolute;inset:-25%;pointer-events:none;opacity:0;background:linear-gradient(105deg,rgba(255,255,255,0) 30%,var(--app-page-shine) 47%,rgba(255,255,255,0) 65%)}
.book-flip-next{animation:bookFlipNext var(--flip-ms) cubic-bezier(.2,.85,.24,1) both}
.book-flip-prev{animation:bookFlipPrev var(--flip-ms) cubic-bezier(.2,.85,.24,1) both}
.book-flip-next::after{animation:pageShineNext var(--flip-ms) ease both}
.book-flip-prev::after{animation:pageShinePrev var(--flip-ms) ease both}
.book-page-spread-left.book-flip-next{animation:spreadLeftNext var(--flip-ms) cubic-bezier(.2,.85,.24,1) both}
.book-page-spread-right.book-flip-next{animation:spreadRightNext var(--flip-ms) cubic-bezier(.2,.85,.24,1) both}
.book-page-spread-left.book-flip-prev{animation:spreadLeftPrev var(--flip-ms) cubic-bezier(.2,.85,.24,1) both}
.book-page-spread-right.book-flip-prev{animation:spreadRightPrev var(--flip-ms) cubic-bezier(.2,.85,.24,1) both}
@keyframes bookFlipNext{0%{opacity:.04;transform:rotateY(calc(-68deg - 8deg * var(--flip-depth))) translateX(-40px) translateZ(-26px) scale(.95)}52%{opacity:1;transform:rotateY(calc(14deg + 4deg * var(--flip-depth))) translateX(10px) translateZ(8px) scale(1.01)}100%{opacity:1;transform:rotateY(0) translateX(0) translateZ(0) scale(1)}}
@keyframes bookFlipPrev{0%{opacity:.04;transform:rotateY(calc(68deg + 8deg * var(--flip-depth))) translateX(40px) translateZ(-26px) scale(.95)}52%{opacity:1;transform:rotateY(calc(-14deg - 4deg * var(--flip-depth))) translateX(-10px) translateZ(8px) scale(1.01)}100%{opacity:1;transform:rotateY(0) translateX(0) translateZ(0) scale(1)}}
@keyframes spreadLeftNext{0%{opacity:.06;transform:rotateY(calc(74deg + 10deg * var(--flip-depth))) translateX(34px) translateZ(-22px) scale(.95)}60%{opacity:1;transform:rotateY(calc(-12deg - 4deg * var(--flip-depth))) translateX(-10px) translateZ(8px) scale(1.01)}100%{opacity:1;transform:rotateY(0) translateX(0) translateZ(0) scale(1)}}
@keyframes spreadRightNext{0%{opacity:.06;transform:rotateY(calc(-74deg - 10deg * var(--flip-depth))) translateX(-34px) translateZ(-22px) scale(.95)}60%{opacity:1;transform:rotateY(calc(12deg + 4deg * var(--flip-depth))) translateX(10px) translateZ(8px) scale(1.01)}100%{opacity:1;transform:rotateY(0) translateX(0) translateZ(0) scale(1)}}
@keyframes spreadLeftPrev{0%{opacity:.06;transform:rotateY(calc(-74deg - 10deg * var(--flip-depth))) translateX(-34px) translateZ(-22px) scale(.95)}60%{opacity:1;transform:rotateY(calc(12deg + 4deg * var(--flip-depth))) translateX(10px) translateZ(8px) scale(1.01)}100%{opacity:1;transform:rotateY(0) translateX(0) translateZ(0) scale(1)}}
@keyframes spreadRightPrev{0%{opacity:.06;transform:rotateY(calc(74deg + 10deg * var(--flip-depth))) translateX(34px) translateZ(-22px) scale(.95)}60%{opacity:1;transform:rotateY(calc(-12deg - 4deg * var(--flip-depth))) translateX(-10px) translateZ(8px) scale(1.01)}100%{opacity:1;transform:rotateY(0) translateX(0) translateZ(0) scale(1)}}
@keyframes pageShineNext{0%{opacity:0;transform:translateX(-34%) skewX(-10deg)}35%{opacity:.95}100%{opacity:0;transform:translateX(34%) skewX(-10deg)}}
@keyframes pageShinePrev{0%{opacity:0;transform:translateX(34%) skewX(10deg)}35%{opacity:.95}100%{opacity:0;transform:translateX(-34%) skewX(10deg)}}
@keyframes stageSweepNext{0%{opacity:0;transform:translateX(-26%) scale(1.04)}35%{opacity:1}100%{opacity:0;transform:translateX(26%) scale(1.01)}}
@keyframes stageSweepPrev{0%{opacity:0;transform:translateX(26%) scale(1.04)}35%{opacity:1}100%{opacity:0;transform:translateX(-26%) scale(1.01)}}
.book-meta{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--app-page-border)}
.book-content{position:relative;z-index:2;padding:14px;display:flex;flex-direction:column;gap:10px;height:calc(100% - 58px)}
.book-cover-page{position:relative;flex:1;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:0}
.book-cover-frame{position:relative;width:100%;height:100%;border-radius:10px;overflow:hidden;display:flex;align-items:flex-end;justify-content:center}
.book-cover-frame.fit-image{width:auto;height:auto;max-width:100%;max-height:100%;aspect-ratio:var(--cover-ratio, 3 / 4);min-height:100%}
.book-cover-media{position:absolute;inset:0;width:100%;height:100%;background-size:cover;background-position:center;background-repeat:no-repeat;z-index:1;pointer-events:none}
.book-cover-frame.fit-image .book-cover-media{background-size:contain;background-color:var(--app-cover-fit-bg)}
.book-cover-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.12) 0%,rgba(0,0,0,.52) 72%,rgba(0,0,0,.68) 100%)}
.book-cover-copy{position:relative;z-index:2;padding:18px 16px 20px;display:flex;flex-direction:column;gap:8px;align-items:center;text-align:center;color:var(--app-cover-copy);width:100%}
.book-section-layout{display:grid;grid-template-rows:auto auto 1fr auto;gap:8px;min-height:100%}
.book-grid{display:grid;gap:6px;grid-auto-rows:1fr;align-content:stretch;justify-content:stretch;height:100%;overflow:hidden}
.book-grid .chip{width:100%;height:100%;padding:0;display:block;border-radius:10px;overflow:hidden;cursor:default}
.book-grid .chip:hover{transform:none}
.book-grid .chip-tile{width:4.5cm;height:6cm;border-radius:10px}
.book-stage.fullscreen .book-grid .chip-tile{height:100%}
.book-nav{display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap}
.book-shell.cinema-on .book-toolbar,.book-shell.cinema-on .book-nav{opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .25s ease, transform .25s ease}
.book-shell.cinema-on.show-ui .book-toolbar,.book-shell.cinema-on.show-ui .book-nav{opacity:1;transform:translateY(0);pointer-events:auto}
.cinema-float{position:absolute;left:100%;bottom:16px;transform:translateX(-50%);z-index:12;display:flex;gap:8px;align-items:center;padding:8px 10px;border-radius:999px;background:var(--app-cinema-bg);border:1px solid var(--app-cinema-border);backdrop-filter:blur(10px);box-shadow:0 8px 28px rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity .25s ease, transform .25s ease}
.cinema-float.visible{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
.cinema-float .btn{padding:6px 10px;font-size:12px}
@media (max-width:860px){.book-stage{min-height:250px}.book-page{min-height:0}.book-grid .chip-tile{height:100%}.book-stage.fullscreen .book-grid .chip-tile{height:100%}.book-spread{grid-template-columns:1fr}}
`;

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const TERMS = `TÉRMINOS Y CONDICIONES DE USO — LA BOLSA DE CROMOS

Esta plataforma es un servicio gratuito para facilitar el intercambio de cromos entre usuarios. Al registrarte aceptás lo siguiente:

1. RESPONSABILIDAD DE LOS INTERCAMBIOS: Los intercambios de cromos se realizan directamente entre usuarios. Esta plataforma actúa únicamente como intermediario informativo y NO se hace responsable por intercambios no completados, cromos perdidos, dañados o cualquier disputa entre usuarios.

2. DATOS PERSONALES: Tu nombre, ciudad y número de WhatsApp serán visibles para los miembros de los grupos a los que pertenezcas. Al registrarte autorizás esta visibilidad.

3. CONDUCTA: Los usuarios se comprometen a actuar de buena fe en los intercambios. El uso indebido de la plataforma puede resultar en la eliminación de la cuenta.

4. EXENCIÓN DE RESPONSABILIDAD: Los administradores de esta plataforma no son responsables por pérdidas económicas, daños o perjuicios derivados del uso de la misma.

5. MENORES DE EDAD: Si sos menor de 18 años, necesitás autorización de un adulto responsable para registrarte.

Al crear una cuenta confirmás haber leído y aceptado estos términos.`;

function ThemeModeSwitcher({ themeMode, onChange, compact = false }) {
  const options = [
    { value: "dark", label: compact ? "🌙" : "🌙 Oscuro", title: "Modo oscuro" },
    { value: "light", label: compact ? "☀️" : "☀️ Claro", title: "Modo claro" },
    { value: "system", label: compact ? "🖥️" : "🖥️ Sistema", title: "Seguir sistema" },
  ];

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
      {options.map((option) => {
        const active = themeMode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className="btn btn-sm"
            title={option.title}
            onClick={() => onChange(option.value)}
            style={{
              justifyContent:"center",
              background:active ? "linear-gradient(135deg,var(--app-accent),#F0CC70)" : "var(--app-card)",
              color:active ? "#08100a" : "var(--app-text)",
              border:`1px solid ${active ? "transparent" : "var(--app-border)"}`,
              minWidth: compact ? 44 : 0,
              paddingInline: compact ? 10 : 14,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ email:"", password:"", name:"", username:"", city:"", whatsapp:"", provincia:"", canton:"" });
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);
  const [terms, setTerms]   = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const hc = e => setF(p=>({...p,[e.target.name]:e.target.value}));

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode === "login") {
        let out = null;
        try {
          out = await api.login(f.email, f.password);
        } catch {
          return setErr("Email o contraseña incorrectos.");
        }
        const profile = out?.profile || null;
        if (out?.token) localStorage.setItem("auth_token", out.token);
        if (profile?.blocked) {
          localStorage.removeItem("auth_token");
          return setErr("Tu cuenta ha sido suspendida. Contactá al administrador.");
        }
        onLogin(profile);
      } else {
        if (!f.name.trim()||!f.username.trim()||!f.email.trim()||!f.password.trim()||!f.city.trim())
          return setErr("Completa todos los campos.");
        if (!terms) return setErr("Debés aceptar los términos y condiciones.");
        if (f.username.trim().length < 3) return setErr("El usuario debe tener al menos 3 caracteres.");
        if (f.password.length < 6) return setErr("La contraseña debe tener mínimo 6 caracteres.");
        const key = f.username.toLowerCase().replace(/\s/g,"");
        let existing = null;
        try {
          existing = await api.getProfileByUsername(key);
        } catch {
          existing = null;
        }
        if (existing) return setErr("Ese usuario ya está registrado.");
        try {
          const out = await api.register({
            name: f.name.trim(),
            username: key,
            email: f.email.trim(),
            password: f.password,
            city: f.city.trim(),
            whatsapp: f.whatsapp.trim(),
            provincia: f.provincia || "",
            canton: f.canton.trim(),
          });
          if (out?.token) localStorage.setItem("auth_token", out.token);
          onLogin(out.profile);
        } catch (e) {
          return setErr("Error registro: " + e.message);
        }
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,
      background:`radial-gradient(ellipse at 30% 40%,rgba(201,168,76,.09) 0%,transparent 55%),
                  radial-gradient(ellipse at 70% 60%,rgba(76,154,200,.07) 0%,transparent 55%),${G.bg}`}}>
      <div className="ani" style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:30}}>
          <div style={{marginBottom:6}}>
            <video
              src="/video/Mundial2026.mp4"
              autoPlay
              loop
              controls
              style={{width:360, height:180, borderRadius:12, objectFit:"cover", boxShadow:"0 2px 12px #0002"}}
            />
          </div>
          <div className="h1" style={{fontSize:32,color:G.accent,letterSpacing:4}}>LA BOLSA DE CROMOS</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,color:G.accent2,letterSpacing:6,marginTop:2}}>FIFA WORLD CUP 2026</div>
          <div style={{color:G.muted,fontSize:12,marginTop:8}}>Intercambiá postales con tu comunidad</div>
        </div>
        <div className="card">
          <div style={{display:"flex",background:G.bg,borderRadius:9,padding:4,marginBottom:20}}>
            {["login","register"].map(m=>(
              <button key={m} className="btn" onClick={()=>{setMode(m);setErr("");}}
                style={{flex:1,justifyContent:"center",background:mode===m?"linear-gradient(135deg,#C9A84C,#F0CC70)":"transparent",
                  color:mode===m?"#08100a":G.muted,borderRadius:7}}>
                {m==="login"?"Iniciar sesión":"Registrarse"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {mode==="register" && <>
              <div>
                <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>NOMBRE COMPLETO</div>
                <input className="input" name="name" placeholder="Tu nombre" value={f.name} onChange={hc}/>
              </div>
              <div>
                <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>USUARIO</div>
                <input className="input" name="username" placeholder="@usuario (sin espacios)" value={f.username} onChange={hc}/>
              </div>
              <div>
                <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>CIUDAD / ZONA</div>
                <input className="input" name="city" placeholder="Ej: Barrio, urbanización…" value={f.city} onChange={hc}/>
              </div>
              <ProvinciaCantonSelect
                provincia={f.provincia} canton={f.canton}
                onProvincia={v=>setF(p=>({...p,provincia:v,canton:""}))}
                onCanton={v=>setF(p=>({...p,canton:v}))}/>
              <div>
                <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>WHATSAPP <span style={{color:G.muted,fontWeight:400}}>(con código de país)</span></div>
                <input className="input" name="whatsapp" placeholder="Ej: 50688887777" value={f.whatsapp} onChange={hc}/>
              </div>
            </>}
            <div>
              <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>EMAIL</div>
              <input className="input" name="email" type="email" placeholder="tu@email.com" value={f.email} onChange={hc}/>
            </div>
            <div>
              <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>CONTRASEÑA</div>
              <input className="input" type="password" name="password" placeholder="••••••••" value={f.password} onChange={hc}
                onKeyDown={e=>e.key==="Enter"&&submit()}/>
            </div>
            {err && <div className="alert alert-err">{err}</div>}
            {mode==="register" && (
              <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",
                background:G.bg,borderRadius:9,border:`1px solid ${G.border}`}}>
                <input type="checkbox" id="terms" checked={terms} onChange={e=>setTerms(e.target.checked)}
                  style={{marginTop:2,accentColor:G.accent,width:16,height:16,cursor:"pointer",flexShrink:0}}/>
                <label htmlFor="terms" style={{fontSize:12,color:G.muted,cursor:"pointer",lineHeight:1.5}}>
                  He leído y acepto los{" "}
                  <span onClick={e=>{e.preventDefault();setShowTerms(true);}}
                    style={{color:G.accent,textDecoration:"underline",cursor:"pointer"}}>
                    términos y condiciones
                  </span>
                  {" "}de uso de la plataforma.
                </label>
              </div>
            )}
            <button className="btn btn-gold" onClick={submit} disabled={loading}
              style={{width:"100%",justifyContent:"center",padding:12,fontSize:15,marginTop:4,opacity:loading?.7:1}}>
              {loading ? "Cargando..." : mode==="login" ? "⚽ Entrar" : "🏆 Crear cuenta"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal términos */}
      {showTerms && (
        <div className="modal-bg" onClick={()=>setShowTerms(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:540}}>
            <div className="h1" style={{fontSize:20,letterSpacing:2,marginBottom:16}}>TÉRMINOS Y CONDICIONES</div>
            <div style={{fontSize:13,color:G.muted,lineHeight:1.7,whiteSpace:"pre-line",marginBottom:20}}>
              {TERMS}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-ghost" onClick={()=>setShowTerms(false)} style={{flex:1,justifyContent:"center"}}>Cerrar</button>
              <button className="btn btn-gold" onClick={()=>{setTerms(true);setShowTerms(false);}} style={{flex:1,justifyContent:"center"}}>
                ✅ Acepto los términos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MIS CROMOS ───────────────────────────────────────────────────────────────
function CromosScreen({ user }) {
  const [data, setData] = useState(EMPTY_CROMOS);
  const [filterMode, setFilterMode] = useState("all");
  const [stickerCatalogMap, setStickerCatalogMap] = useState({});
  const [pageIndex, setPageIndex] = useState(0);
  const [flipDir, setFlipDir] = useState("next");
  const [flipTick, setFlipTick] = useState(0);
  const [bookMode, setBookMode] = useState("single");
  const [prefsReady, setPrefsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [showCinemaUi, setShowCinemaUi] = useState(true);
  const [stageFxClass, setStageFxClass] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [autoplayMs, setAutoplayMs] = useState(2600);
  const [flipMs, setFlipMs] = useState(620);
  const [flipDepth, setFlipDepth] = useState(1);
  const [flipBlur, setFlipBlur] = useState(10);
  const [pageImageById, setPageImageById] = useState({
    coverFront: "",
    coverBack: "",
  });
  const [defaultPageImageById, setDefaultPageImageById] = useState({
    coverFront: "",
    coverBack: "",
  });
  const [pageImageRatioById, setPageImageRatioById] = useState({
    coverFront: "",
    coverBack: "",
  });
  const [defaultPageImageRatioById, setDefaultPageImageRatioById] = useState({
    coverFront: "",
    coverBack: "",
  });
  const [pageBgById, setPageBgById] = useState({
    coverFront: "coverGold",
    intro: "paperClassic",
    coverBack: "coverDark",
  });

  const stageRef = useRef(null);
  const audioCtxRef = useRef(null);
  const coverFrontInputRef = useRef(null);
  const coverBackInputRef = useRef(null);
  const lastNavAtRef = useRef(0);
  const saveTimerRef = useRef(null);
  const saveHashRef = useRef("");

  const BOOK_BG_PRESETS = {
    coverGold: { label: "Portada dorada", value: "linear-gradient(140deg,#7d5f1f 0%,#c9a84c 42%,#f2d687 100%)" },
    coverDark: { label: "Portada oscura", value: "linear-gradient(145deg,#111827 0%,#0a0f19 100%)" },
    paperClassic: { label: "Papel clásico", value: "linear-gradient(180deg,#f7f0dc 0%,#ede3c6 100%)" },
    stadiumNight: { label: "Estadio nocturno", value: "radial-gradient(circle at 30% 16%,#2a4a75 0%,#182742 48%,#0b1528 100%)" },
    greenField: { label: "Campo verde", value: "linear-gradient(160deg,#1f5932 0%,#164a2a 40%,#0f3320 100%)" },
    sunset: { label: "Atardecer", value: "linear-gradient(160deg,#f4b06b 0%,#df8451 44%,#8f4a4b 100%)" },
  };

  const BOOK_PREFS_KEY = `album_book_prefs_${user.id}`;

  useEffect(() => {
    api.getUserCromos(user.id)
      .then((d) => {
        if (d) setData(normalizeCromosPayload(d));
      })
      .catch(() => {});
  }, [user.id]);

  useEffect(() => {
    api.listStickerCatalog()
      .then((rows) => {
        const map = {};
        (rows || []).forEach((r) => {
          if (r?.id) {
            map[r.id] = {
              image_path: r.image_path || null,
              rarity: r.rarity || "COMMON",
              active: r.active !== false,
            };
          }
        });
        setStickerCatalogMap(map);
      })
      .catch(() => {});
  }, []);

  const computeCoverRatio = (pageId, dataUrl, setRatioState) => {
    if (!dataUrl || !String(dataUrl).startsWith("data:image/")) return;
    const img = new Image();
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      setRatioState((prev) => ({ ...prev, [pageId]: `${img.naturalWidth} / ${img.naturalHeight}` }));
    };
    img.src = dataUrl;
  };

  useEffect(() => {
    api.getAlbumCoverDefaults()
      .then((d) => {
        if (!d || typeof d !== "object") return;
        const coverFront = typeof d.coverFront === "string" ? d.coverFront : "";
        const coverBack = typeof d.coverBack === "string" ? d.coverBack : "";
        setDefaultPageImageById({ coverFront, coverBack });
      })
      .catch(() => {});
  }, []);

  const bookPages = [
    { id: "coverFront", type: "cover", title: "La Bolsa de Cromos", subtitle: "FIFA World Cup 2026" },
    { id: "intro", type: "intro", title: "Mi Album", subtitle: user.name },
    ...SECTIONS.map((s) => ({
      id: `sec-${s.id}`,
      type: "section",
      sectionId: s.id,
      title: s.name,
      subtitle: `${s.flag} Seccion ${s.id}`,
    })),
    { id: "coverBack", type: "back-cover", title: "Contraportada", subtitle: "Intercambia, completa y disfruta" },
  ];

  const normalizePageIndex = (idx, mode = bookMode) => {
    const maxIndex = Math.max(0, bookPages.length - 1);
    let next = Math.max(0, Math.min(idx, maxIndex));
    if (mode === "spread" && next % 2 !== 0) next -= 1;
    return Math.max(0, next);
  };

  useEffect(() => {
    let cancelled = false;
    const applyPrefs = (parsed) => {
      if (!parsed || typeof parsed !== "object") return;
      if (parsed.mode === "single" || parsed.mode === "spread") setBookMode(parsed.mode);
      if (typeof parsed.cinemaMode === "boolean") setCinemaMode(parsed.cinemaMode);
      if (typeof parsed.soundEnabled === "boolean") setSoundEnabled(parsed.soundEnabled);
      if (typeof parsed.autoplayEnabled === "boolean") setAutoplayEnabled(parsed.autoplayEnabled);
      if (Number.isInteger(parsed.autoplayMs) && parsed.autoplayMs >= 1200 && parsed.autoplayMs <= 6000) setAutoplayMs(parsed.autoplayMs);
      if (parsed.pageBgById && typeof parsed.pageBgById === "object") setPageBgById((prev) => ({ ...prev, ...parsed.pageBgById }));
      //if (parsed.pageImageById && typeof parsed.pageImageById === "object") setPageImageById((prev) => ({ ...prev, ...parsed.pageImageById }));
      if (parsed.pageImageById && typeof parsed.pageImageById === "object") {
        // Sanitiza portada y contraportada: solo string o vacío
        const sanitized = { ...parsed.pageImageById };
        ["coverFront", "coverBack"].forEach((key) => {
          if (sanitized[key] && typeof sanitized[key] !== "string") sanitized[key] = "";
        });
        setPageImageById((prev) => ({ ...prev, ...sanitized }));
      }
      if (Number.isInteger(parsed.pageIndex) && parsed.pageIndex >= 0) setPageIndex(normalizePageIndex(parsed.pageIndex, parsed.mode || bookMode));
    };

    (async () => {
      try {
        const raw = localStorage.getItem(BOOK_PREFS_KEY);
        if (raw) {
          try {
            applyPrefs(JSON.parse(raw));
          } catch {
            // ignore invalid local data
          }
        }

        try {
          const profile = await api.getProfileById(user.id);
          const remotePrefs = profile?.album_prefs;
          applyPrefs(remotePrefs);
        } catch {
          // ignore backend fetch failures
        }
      } finally {
        if (!cancelled) setPrefsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [BOOK_PREFS_KEY, user.id]);

  useEffect(() => {
    if (!prefsReady) return;
    const basePrefs = user.album_prefs && typeof user.album_prefs === "object" ? user.album_prefs : {};
    const payload = {
      ...basePrefs,
      mode: bookMode,
      cinemaMode,
      soundEnabled,
      autoplayEnabled,
      autoplayMs,
      pageIndex,
      pageBgById,
      pageImageById,
    };
    try {
      localStorage.setItem(BOOK_PREFS_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota errors; backend save remains the source of truth
    }

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    const nextHash = JSON.stringify(payload);
    if (nextHash === saveHashRef.current) return;
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        await api.updateProfile(user.id, { album_prefs: payload });
        saveHashRef.current = nextHash;
      } catch {
        // localStorage remains the fallback
      }
    }, 700);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [BOOK_PREFS_KEY, user.id, user.album_prefs, bookMode, cinemaMode, soundEnabled, autoplayEnabled, autoplayMs, pageIndex, pageBgById, pageImageById, prefsReady]);

  useEffect(() => {
    if (!prefsReady) return;
    const maxIndex = Math.max(0, bookPages.length - 1);
    if (pageIndex > maxIndex) setPageIndex(maxIndex);
  }, [prefsReady, pageIndex, bookPages.length]);

  useEffect(() => {
    if (!prefsReady) return;
    if (bookMode === "spread" && pageIndex % 2 !== 0) {
      setPageIndex((prev) => Math.max(0, prev - 1));
    }
  }, [bookMode, pageIndex, prefsReady]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === stageRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const activePage = bookPages[pageIndex] || bookPages[0];
  const spreadStartIndex = bookMode === "spread" ? normalizePageIndex(pageIndex) : pageIndex;
  const spreadLeftPage = bookPages[spreadStartIndex] || null;
  const spreadRightPage = bookMode === "spread" ? (bookPages[spreadStartIndex + 1] || null) : null;
  const getQty = (id) => Number(data.quantities?.[id] || 0);
  const totalHave = getOwnedCount(data);
  const totalPct = Math.round((totalHave / TOTAL) * 100);
  const totalMissing = TOTAL - totalHave;
  const maxSpreadIndex = bookPages.length % 2 === 0 ? Math.max(0, bookPages.length - 2) : Math.max(0, bookPages.length - 1);
  const maxNavIndex = bookMode === "spread" ? maxSpreadIndex : Math.max(0, bookPages.length - 1);

  const resolveBg = (page) => {
    const selected = pageBgById[page.id];
    if (selected && BOOK_BG_PRESETS[selected]) return BOOK_BG_PRESETS[selected].value;
    if (page.type === "cover") return BOOK_BG_PRESETS.coverGold.value;
    if (page.type === "back-cover") return BOOK_BG_PRESETS.coverDark.value;
    return BOOK_BG_PRESETS.paperClassic.value;
  };

  const buildStickerImageCandidates = (sticker) => {
    const explicit = stickerCatalogMap[sticker.id]?.image_path || null;
    const guessed = [
      `/album/${sticker.id}.png`,
      `/album/${sticker.id}.jpg`,
      `/album/${sticker.id}.jpeg`,
      `/album/${sticker.id}.webp`,
      `/album/${sticker.section}${String(sticker.num).padStart(2, "0")}.png`,
      `/album/${sticker.section}-${String(sticker.num).padStart(2, "0")}.png`,
    ];
    const all = [explicit, ...guessed].filter(Boolean);
    return all.filter((p, i) => all.indexOf(p) === i);
  };

  const getStickerRarity = (sticker) => stickerCatalogMap[sticker.id]?.rarity || "COMMON";

  const updateCurrentPageBg = (key) => {
    setPageBgById((prev) => ({ ...prev, [activePage.id]: key }));
  };

  const triggerCoverUpload = () => {
    if (activePage.id === "coverFront") {
      coverFrontInputRef.current?.click();
      return;
    }
    if (activePage.id === "coverBack") {
      coverBackInputRef.current?.click();
    }
  };

  const onCoverImageSelected = (pageId, ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 1024 * 1024) {
      window.alert("La imagen debe pesar máximo 1MB para asegurar persistencia.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setPageImageById((prev) => ({ ...prev, [pageId]: dataUrl }));
      computeCoverRatio(pageId, dataUrl, setPageImageRatioById);
    };
    reader.readAsDataURL(file);
  };

  const clearCoverImage = (pageId) => {
    setPageImageById((prev) => ({ ...prev, [pageId]: "" }));
    setPageImageRatioById((prev) => ({ ...prev, [pageId]: "" }));
  };

  useEffect(() => {
    ["coverFront", "coverBack"].forEach((pageId) => {
      const dataUrl = pageImageById[pageId];
      if (!dataUrl || pageImageRatioById[pageId]) return;
      computeCoverRatio(pageId, dataUrl, setPageImageRatioById);
    });
  }, [pageImageById, pageImageRatioById]);

  useEffect(() => {
    ["coverFront", "coverBack"].forEach((pageId) => {
      const dataUrl = defaultPageImageById[pageId];
      if (!dataUrl || defaultPageImageRatioById[pageId]) return;
      computeCoverRatio(pageId, dataUrl, setDefaultPageImageRatioById);
    });
  }, [defaultPageImageById, defaultPageImageRatioById]);

  const playPageTurnSound = (dir = "next") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      master.connect(ctx.destination);

      const whoosh = ctx.createOscillator();
      whoosh.type = "sawtooth";
      whoosh.frequency.setValueAtTime(dir === "next" ? 840 : 760, now);
      whoosh.frequency.exponentialRampToValueAtTime(dir === "next" ? 180 : 160, now + 0.2);
      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0.0001, now);
      whooshGain.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
      whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      whoosh.connect(whooshGain).connect(master);

      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.18), ctx.sampleRate);
      const chan = noiseBuffer.getChannelData(0);
      for (let i = 0; i < chan.length; i++) {
        chan[i] = (Math.random() * 2 - 1) * (1 - i / chan.length);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(dir === "next" ? 1200 : 900, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.045, now + 0.015);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      noise.connect(noiseFilter).connect(noiseGain).connect(master);

      whoosh.start(now);
      noise.start(now);
      whoosh.stop(now + 0.24);
      noise.stop(now + 0.19);
    } catch {
      // ignore audio failures
    }
  };

  const applyFlipDynamics = (impulse = 1) => {
    const speed = Math.max(0.8, Math.min(2.2, impulse));
    const nextMs = Math.max(360, Math.min(820, Math.round(680 - (speed - 1) * 260)));
    const depth = Math.max(0.8, Math.min(1.8, speed));
    setFlipMs(nextMs);
    setFlipDepth(depth);
    setFlipBlur(Math.round(8 + depth * 4));
  };

  const goToPage = (nextIdx, opts = {}) => {
    const normalizedNext = normalizePageIndex(nextIdx);
    if (normalizedNext === pageIndex) return;
    const dir = normalizedNext > pageIndex ? "next" : "prev";

    applyFlipDynamics(opts.impulse || 1);
    if (autoplayEnabled && !opts.auto) setAutoplayEnabled(false);

    setFlipDir(dir);
    setPageIndex(normalizedNext);
    setFlipTick((n) => n + 1);
    setStageFxClass("");
    requestAnimationFrame(() => setStageFxClass(dir === "next" ? "fx-next" : "fx-prev"));
    playPageTurnSound(dir);
  };

  const step = bookMode === "spread" ? 2 : 1;
  const nextPage = (opts = {}) => goToPage(pageIndex + step, opts);
  const prevPage = (opts = {}) => goToPage(pageIndex - step, opts);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === stageRef.current) {
        await document.exitFullscreen();
        return;
      }
      if (stageRef.current?.requestFullscreen) await stageRef.current.requestFullscreen();
    } catch {
      // ignore if browser blocks fullscreen
    }
  };

  useEffect(() => {
    if (!stageFxClass) return;
    const t = setTimeout(() => setStageFxClass(""), flipMs + 80);
    return () => clearTimeout(t);
  }, [stageFxClass, flipMs]);

  useEffect(() => {
    if (!autoplayEnabled) return;
    const timer = setInterval(() => {
      if (pageIndex >= maxNavIndex) {
        goToPage(0, { auto: true, impulse: 0.9 });
      } else {
        goToPage(pageIndex + step, { auto: true, impulse: 1.1 });
      }
    }, autoplayMs);
    return () => clearInterval(timer);
  }, [autoplayEnabled, autoplayMs, pageIndex, maxNavIndex, step]);

  useEffect(() => {
    if (!(isFullscreen && cinemaMode)) {
      setShowCinemaUi(true);
      return;
    }
    const resetHide = () => {
      setShowCinemaUi(true);
      window.clearTimeout(resetHide._t);
      resetHide._t = window.setTimeout(() => setShowCinemaUi(false), 1800);
    };
    resetHide();
    window.addEventListener("mousemove", resetHide);
    window.addEventListener("keydown", resetHide);
    window.addEventListener("touchstart", resetHide, { passive: true });
    return () => {
      window.removeEventListener("mousemove", resetHide);
      window.removeEventListener("keydown", resetHide);
      window.removeEventListener("touchstart", resetHide);
      window.clearTimeout(resetHide._t);
    };
  }, [isFullscreen, cinemaMode]);

  useEffect(() => {
    const onKey = (e) => {
      const now = Date.now();
      const delta = lastNavAtRef.current ? now - lastNavAtRef.current : 240;
      lastNavAtRef.current = now;
      const impulse = Math.max(0.9, Math.min(2.2, 260 / Math.max(90, delta)));

      if (e.key === "ArrowRight") nextPage({ impulse });
      if (e.key === "ArrowLeft") prevPage({ impulse });
      if (e.key.toLowerCase() === "p") setAutoplayEnabled((v) => !v);
      if (e.key.toLowerCase() === "s") setSoundEnabled((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageIndex, bookMode]);

  const descargar = () => {
    const secRows = SECTIONS.map((sec) => {
      const secCromos = ALL_CROMOS.filter((c) => c.section === sec.id);
      const have = secCromos.filter((c) => getQty(c.id) > 0).length;
      const pct = Math.round((have / sec.count) * 100);
      return `${sec.flag} ${sec.name}: ${have}/${sec.count} (${pct}%)`;
    });

    const content = [
      "LA BOLSA DE CROMOS - RESUMEN",
      `Usuario: ${user.name} (@${user.username})`,
      `Total: ${totalHave}/${TOTAL} (${totalPct}%)`,
      `Faltan: ${totalMissing}`,
      "",
      "SECCIONES",
      ...secRows,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `album_${user.username}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderBookPage = (page, extraClass = "") => {
    if (!page) return null;

    const pageSection = page.type === "section" ? SECTIONS.find((s) => s.id === page.sectionId) : null;
    const pageSecCromos = pageSection ? ALL_CROMOS.filter((c) => c.section === pageSection.id) : [];
    const pageSecHave = pageSecCromos.filter((c) => getQty(c.id) > 0).length;
    const pageSecPct = pageSection ? Math.round((pageSecHave / pageSection.count) * 100) : 0;
    const pageColumns = pageSecCromos.length >= 18 ? 5 : pageSecCromos.length >= 12 ? 4 : 3;
    const localCoverImage = pageImageById[page.id] || "";
    const defaultCoverImage = defaultPageImageById[page.id] || "";
    const coverImage = localCoverImage || defaultCoverImage;
    const coverRatio = (localCoverImage
      ? pageImageRatioById[page.id]
      : defaultPageImageRatioById[page.id]) || "3 / 4";

    return (
      <div
        key={`${page.id}-${flipTick}-${bookMode}`}
        className={`book-page ${extraClass} ${flipDir === "next" ? "book-flip-next" : "book-flip-prev"}`}
        style={{ background: resolveBg(page) }}
      >
        <div className="book-meta" style={{ color: page.type === "section" ? "#171717" : G.text }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>
            {page.type === "section" ? `SECCION ${pageSection?.id}` : page.type.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>
            Página {bookPages.findIndex((p) => p.id === page.id) + 1} / {bookPages.length}
          </div>
        </div>

        <div className="book-content">
          {page.type === "cover" && (
            <div className="book-cover-page">
              <div className={`book-cover-frame ${coverImage ? "fit-image" : ""}`} style={coverImage ? { "--cover-ratio": coverRatio } : undefined}>
                <div
                  className="book-cover-media"
                  style={{ backgroundImage: coverImage ? `url(${coverImage})` : "linear-gradient(140deg,#7d5f1f 0%,#c9a84c 42%,#f2d687 100%)" }}
                />
                <div className="book-cover-copy">
                  <div className="h1" style={{ fontSize: 42, letterSpacing: 5, color: "#fff", textShadow: "0 4px 14px rgba(0,0,0,.35)" }}>LA BOLSA DE CROMOS</div>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 4, color: "#fff", marginTop: 8 }}>FIFA WORLD CUP 2026</div>
                  <div style={{ marginTop: 20, fontSize: 14, color: "#fff", fontWeight: 700 }}>Edición digital de {user.name}</div>
                </div>
              </div>
            </div>
          )}

          {page.type === "intro" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 12, height: "100%" }}>
              <div className="card" style={{ background: "rgba(255,255,255,.78)", borderColor: "rgba(0,0,0,.08)", color: "#1b2131" }}>
                <div className="h1" style={{ fontSize: 28, letterSpacing: 3 }}>MI ALBUM</div>
                <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: "#30435f" }}>Coleccionista: {user.name}</div>
                <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.7, color: "#2d3548" }}>
                  Navega como un libro usando los botones, el selector de páginas, los bordes o las flechas del teclado.
                  Puedes personalizar el fondo de cada página y usar modo cine en pantalla completa.
                </div>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <div className="stat" style={{ background: "rgba(255,255,255,.78)", borderColor: "rgba(0,0,0,.08)" }}><div className="stat-n" style={{ color: "#7d5f1f" }}>{TOTAL}</div><div className="stat-l" style={{ color: "#42506a" }}>TOTAL</div></div>
                <div className="stat" style={{ background: "rgba(255,255,255,.78)", borderColor: "rgba(0,0,0,.08)" }}><div className="stat-n" style={{ color: "#2f8f5f" }}>{totalHave}</div><div className="stat-l" style={{ color: "#42506a" }}>PEGADOS</div></div>
                <div className="stat" style={{ background: "rgba(255,255,255,.78)", borderColor: "rgba(0,0,0,.08)" }}><div className="stat-n" style={{ color: "#b15252" }}>{totalMissing}</div><div className="stat-l" style={{ color: "#42506a" }}>FALTAN</div></div>
              </div>
            </div>
          )}

          {page.type === "section" && pageSection && (
            <div className="book-section-layout">
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", color: "#1f2738" }}>
                <span style={{ fontSize: 24 }}>{pageSection.flag}</span>
                <div className="h1" style={{ fontSize: 24, letterSpacing: 2, color: "#1f2738" }}>{pageSection.name}</div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#3a465f", fontWeight: 700 }}>
                    <span style={{ color: "#1e7a4f", fontWeight: 800 }}>{pageSecHave}</span>/{pageSection.count} pegados
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#3d4963", marginBottom: 4, fontWeight: 700 }}>
                  <span>{pageSection.name}</span>
                  <span style={{ color: pageSecPct === 100 ? "#18724c" : "#8d6a1f" }}>{pageSecPct}%{pageSecPct === 100 ? " ✅ ¡Completo!" : ""}</span>
                </div>
                <div className="prog-bar" style={{ background: "rgba(17,24,39,.2)" }}>
                  <div className="prog-fill" style={{ width: `${pageSecPct}%`, background: pageSecPct === 100 ? "linear-gradient(90deg,#4CC87A,#06D6A0)" : "linear-gradient(90deg,#C9A84C,#4C9AC8)", transition: "width .3s" }} />
                </div>
              </div>

              <div className="book-grid" style={{ gridTemplateColumns: `repeat(${pageColumns}, minmax(0, 1fr))` }}>
                {pageSecCromos.map((c) => {
                  const qty = getQty(c.id);
                  const got = qty > 0;
                  const isDouble = qty > 1;

                  if (filterMode === "missing" && got) return null;
                  if (filterMode === "have" && !got) return null;
                  if (filterMode === "doubles" && !isDouble) return null;

                  const cls = isDouble ? "both" : got ? "have" : "need";
                  const imageCandidates = buildStickerImageCandidates(c);

                  return (
                    <AlbumSticker
                      key={c.id}
                      sticker={c}
                      sectionId={pageSection.id}
                      quantity={qty}
                      rarity={getStickerRarity(c)}
                      imageCandidates={imageCandidates}
                    />
                  );
                })}
              </div>

              <div style={{ marginTop: 6, fontSize: 11, color: "#33415c", display: "flex", gap: 14, flexWrap: "wrap", fontWeight: 700 }}>
                <span><span style={{ color: "#B84F4F" }}>■</span> Falta (cantidad 0)</span>
                <span><span style={{ color: "#2E8F5D" }}>■</span> Lo tengo (cantidad 1)</span>
                <span><span style={{ color: "#8F6E2E" }}>■</span> Repetidas (cantidad 2 o más)</span>
              </div>
            </div>
          )}

          {page.type === "back-cover" && (
            <div className="book-cover-page">
              <div className={`book-cover-frame ${coverImage ? "fit-image" : ""}`} style={coverImage ? { "--cover-ratio": coverRatio } : undefined}>
                <div
                  className="book-cover-media"
                  style={{ backgroundImage: coverImage ? `url(${coverImage})` : "linear-gradient(145deg,#111827 0%,#0a0f19 100%)" }}
                />
                <div className="book-cover-copy">
                  <div className="h1" style={{ fontSize: 34, letterSpacing: 4, color: "#f3f4f6" }}>CONTRAPORTADA</div>
                  <div style={{ marginTop: 12, fontSize: 14, color: "#cad5e8", fontWeight: 700 }}>Album digital completado al {totalPct}%</div>
                  <div style={{ marginTop: 14, fontSize: 13, color: "#cad5e8", maxWidth: 440, lineHeight: 1.7 }}>
                    Sigue abriendo sobres y haciendo trueques para cerrar el album. Esta vista tipo libro te permite revisar todo con una experiencia de lectura por páginas.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="ani">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div className="h1" style={{ fontSize: 24, letterSpacing: 2 }}>MI ÁLBUM — <span style={{ color: G.accent }}>{user.name}</span></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-ghost btn-sm" onClick={descargar} title="Descargar lista de cromos">📥 Descargar lista</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
        <div className="stat"><div className="stat-n" style={{ color: G.accent }}>{TOTAL}</div><div className="stat-l">TOTAL ÁLBUM</div></div>
        <div className="stat"><div className="stat-n" style={{ color: G.accent3 }}>{totalHave}</div><div className="stat-l">TENGO</div></div>
        <div className="stat"><div className="stat-n" style={{ color: "#E07070" }}>{totalMissing}</div><div className="stat-l">ME FALTAN</div></div>
        <div className="stat"><div className="stat-n" style={{ color: G.accent2 }}>{totalPct}%</div><div className="stat-l">COMPLETADO</div></div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: G.muted, marginBottom: 5 }}>
          <span>Progreso total del álbum</span>
          <span style={{ color: G.accent, fontWeight: 700 }}>{totalPct}%</span>
        </div>
        <div className="prog-bar" style={{ height: 10, borderRadius: 5 }}>
          <div className="prog-fill" style={{ width: `${totalPct}%`, transition: "width .4s" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "center", background: G.card2, borderRadius: 10, padding: "10px 14px", border: `1px solid ${G.border}` }}>
        <span style={{ fontSize: 12, color: G.muted, fontWeight: 700 }}>Filtro</span>
        <div style={{ display: "flex", gap: 6 }}>
          {[ ["all", "Todos"], ["missing", "Me faltan"], ["have", "Tengo"], ["doubles", "Dobles"] ].map(([k, l]) => (
            <button key={k} className="btn btn-sm" onClick={() => setFilterMode(k)} style={{ background: filterMode === k ? G.accent : G.border, color: filterMode === k ? "#08100a" : G.muted }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className={`book-shell ${isFullscreen && cinemaMode ? `cinema-on ${showCinemaUi ? "show-ui" : ""}` : ""}`}>
        <div className="book-toolbar">
          <div className="book-toolbar-group">
            <span style={{ fontSize: 12, color: G.muted, fontWeight: 700 }}>Página</span>
            <select className="input" value={pageIndex} onChange={(e) => goToPage(Number(e.target.value), { impulse: 1 })} style={{ minWidth: 260, padding: "8px 10px", height: 36, cursor: "pointer" }}>
              {bookPages.map((p, idx) => (
                <option key={p.id} value={idx}>{idx + 1}. {p.type === "section" ? `${SECTIONS.find((s) => s.id === p.sectionId)?.flag || ""} ${p.title}` : p.title}</option>
              ))}
            </select>
          </div>
          <div className="book-toolbar-group">
            <span style={{ fontSize: 12, color: G.muted, fontWeight: 700 }}>Vista</span>
            <select className="input" value={bookMode} onChange={(e) => setBookMode(e.target.value)} style={{ minWidth: 140, padding: "8px 10px", height: 36, cursor: "pointer" }}>
              <option value="single">Página simple</option>
              <option value="spread">Doble página</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => setCinemaMode((v) => !v)}>{cinemaMode ? "🎬 Modo cine: ON" : "🎬 Modo cine: OFF"}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSoundEnabled((v) => !v)}>{soundEnabled ? "🔊 Sonido ON" : "🔈 Sonido OFF"}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setAutoplayEnabled((v) => !v)}>{autoplayEnabled ? "⏸ Presentación" : "▶ Presentación"}</button>
            <select className="input" value={autoplayMs} onChange={(e) => setAutoplayMs(Number(e.target.value))} style={{ minWidth: 140, padding: "8px 10px", height: 36, cursor: "pointer" }}>
              <option value={1800}>Velocidad: Rápida</option>
              <option value={2600}>Velocidad: Media</option>
              <option value={3600}>Velocidad: Lenta</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={toggleFullscreen}>{isFullscreen ? "🗗 Salir pantalla completa" : "🗖 Pantalla completa"}</button>
            {(activePage.id === "coverFront" || activePage.id === "coverBack") && (
              <>
                <button className="btn btn-blue btn-sm" onClick={triggerCoverUpload}>🖼 Cargar imagen portada</button>
                {pageImageById[activePage.id] && <button className="btn btn-ghost btn-sm" onClick={() => clearCoverImage(activePage.id)}>🧹 Quitar imagen</button>}
              </>
            )}
            <span style={{ fontSize: 12, color: G.muted, fontWeight: 700 }}>Fondo de esta página</span>
            <select className="input" value={pageBgById[activePage.id] || ""} onChange={(e) => updateCurrentPageBg(e.target.value)} style={{ minWidth: 190, padding: "8px 10px", height: 36, cursor: "pointer" }}>
              <option value="">Automático</option>
              {Object.entries(BOOK_BG_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <input ref={coverFrontInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onCoverImageSelected("coverFront", e)} />
            <input ref={coverBackInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onCoverImageSelected("coverBack", e)} />
          </div>
        </div>

        <div ref={stageRef} className={`book-stage ${isFullscreen ? "fullscreen" : ""} ${stageFxClass}`} style={{ "--flip-ms": `${flipMs}ms`, "--flip-depth": String(flipDepth), "--flip-blur": `${flipBlur}px` }}>
          <button type="button" className="book-edge-hit left" onClick={() => prevPage({ impulse: 1.15 })} disabled={pageIndex === 0} aria-label="Página anterior" title="Página anterior" />
          <button type="button" className="book-edge-hit right" onClick={() => nextPage({ impulse: 1.15 })} disabled={pageIndex >= maxNavIndex} aria-label="Página siguiente" title="Página siguiente" />

          {bookMode === "single" ? (
            renderBookPage(activePage)
          ) : (
            <div className="book-spread">
              {renderBookPage(spreadLeftPage, "book-page-spread-left")}
              {spreadRightPage ? renderBookPage(spreadRightPage, "book-page-spread-right") : <div className="book-page book-page-spread-right" style={{ background: "linear-gradient(180deg,#101827,#0b1322)" }} />}
            </div>
          )}

          {isFullscreen && cinemaMode && (
            <div className={`cinema-float ${showCinemaUi ? "visible" : ""}`}>
              <button className="btn btn-ghost btn-sm" onClick={() => prevPage({ impulse: 1.2 })} disabled={pageIndex === 0}>◀</button>
              <span style={{ fontSize: 12, color: "#d7deee", fontWeight: 700, minWidth: 110, textAlign: "center" }}>
                {bookMode === "spread" ? `${spreadStartIndex + 1}-${Math.min(spreadStartIndex + 2, bookPages.length)}` : `${pageIndex + 1}`} / {bookPages.length}
              </span>
              <button className="btn btn-gold btn-sm" onClick={() => nextPage({ impulse: 1.2 })} disabled={pageIndex >= maxNavIndex}>▶</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAutoplayEnabled((v) => !v)}>{autoplayEnabled ? "⏸" : "⏯"}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSoundEnabled((v) => !v)}>{soundEnabled ? "🔊" : "🔈"}</button>
              <button className="btn btn-ghost btn-sm" onClick={toggleFullscreen}>✕</button>
            </div>
          )}
        </div>

        <div className="book-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => prevPage({ impulse: 1.1 })} disabled={pageIndex === 0}>← Página anterior</button>
          <div style={{ fontSize: 12, color: G.muted, fontWeight: 700 }}>{bookMode === "spread" ? "Modo doble página activo" : "Usa también ← y → para pasar página"}</div>
          <button className="btn btn-gold btn-sm" onClick={() => nextPage({ impulse: 1.1 })} disabled={pageIndex >= maxNavIndex}>Página siguiente →</button>
        </div>
      </div>
    </div>
  );
}

// ─── GRUPOS ───────────────────────────────────────────────────────────────────
const GTYPES = [
  {id:"vecinos",label:"Vecinos",  icon:"🏘️", color:"#C87A4C"},
  {id:"trabajo",label:"Trabajo",  icon:"💼", color:"#4C7AC8"},
  {id:"amigos", label:"Amigos",   icon:"👥", color:"#4CC87A"},
  {id:"familia",label:"Familia",  icon:"👨‍👩‍👧",color:"#C8AA4C"},
  {id:"escuela",label:"Escuela",  icon:"🎓", color:"#AA4CC8"},
  {id:"deporte",label:"Deporte",  icon:"⚽", color:"#4CC8C8"},
];

function GroupsScreen({ user, onUserUpdate, onChat }) {
  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState({name:"",type:"vecinos",code:""});
  const [msg,    setMsg]    = useState({t:"",k:""});
  const [detail, setDetail] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading,setLoading]= useState(true);

  const flash = (t,k="ok")=>{ setMsg({t,k}); setTimeout(()=>setMsg({t:"",k:""}),3000); };

  useEffect(()=>{
    loadGroups();
  },[user.groups]);

  const loadGroups = async () => {
    if(!user.groups||user.groups.length===0){
      setGroups([]);
      setLoading(false);
      clearOpenGroup(user.id);
      return;
    }
    const data = await api.listGroupsByIds(user.groups);
    setGroups(data||[]);
    const savedId = sessionStorage.getItem(openGroupKey(user.id));
    if (savedId) {
      const g = (data||[]).find((x) => x.id === savedId);
      if (g) setDetail(g);
      else clearOpenGroup(user.id);
    }
    setLoading(false);
  };

  const openDetail = (g) => {
    setDetail(g);
    sessionStorage.setItem(openGroupKey(user.id), g.id);
  };

  const closeDetail = () => {
    setDetail(null);
    clearOpenGroup(user.id);
  };

  const createGroup = async () => {
    if(!form.name.trim()) return flash("Ponle un nombre al grupo.","err");
    const id=genId(), code=genCode();
    const g={id,name:form.name.trim(),type:form.type,code,members:[user.id],admin_id:user.id};
    await api.createGroup(g);
    const newGroups=[...(user.groups||[]),id];
    await api.updateProfile(user.id, {groups:newGroups});
    const upd={...user,groups:newGroups};
    onUserUpdate(upd);
    setGroups(prev=>[...prev,g]);
    setModal(null); flash(`Grupo "${form.name}" creado. Código: ${code}`);
  };

  const joinGroup = async () => {
    const code = form.code.toUpperCase().trim();
    let g = null;
    try {
      g = await api.getGroupByCode(code);
    } catch {
      g = null;
    }
    if(!g) return flash("Código inválido.","err");
    if((user.groups||[]).includes(g.id)) return flash("Ya eres miembro.","err");
    const newMembers=[...g.members,user.id];
    await api.updateGroup(g.id, {members:newMembers});
    const newGroups=[...(user.groups||[]),g.id];
    await api.updateProfile(user.id, {groups:newGroups});
    const upd={...user,groups:newGroups};
    onUserUpdate(upd);
    setGroups(prev=>[...prev,{...g,members:newMembers}]);
    setModal(null); flash(`¡Unido a "${g.name}"!`);
  };

  const leaveGroup = async (gid) => {
    const g = groups.find(x=>x.id===gid);
    if(g){ await api.updateGroup(gid, {members:g.members.filter(m=>m!==user.id)}); }
    const newGroups=(user.groups||[]).filter(x=>x!==gid);
    await api.updateProfile(user.id, {groups:newGroups});
    onUserUpdate({...user,groups:newGroups});
    setGroups(prev=>prev.filter(x=>x.id!==gid));
    if(detail?.id===gid) closeDetail();
    flash("Saliste del grupo.");
  };

  if(detail) return <GroupDetail group={detail} user={user} onBack={closeDetail} onLeave={leaveGroup} onChat={onChat}/>;

  const gt = id=>GTYPES.find(t=>t.id===id)||GTYPES[0];

  return (
    <div className="ani">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div className="h1" style={{fontSize:24,letterSpacing:2}}>MIS GRUPOS</div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setModal("join")}>🔑 Unirse</button>
          <button className="btn btn-gold btn-sm"  onClick={()=>setModal("create")}>➕ Crear grupo</button>
        </div>
      </div>

      {msg.t && <div className={`alert alert-${msg.k} ani`} style={{marginBottom:14}}>{msg.t}</div>}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:40}}><div className="spinner"/></div>
      ) : groups.length===0 ? (
        <div className="card" style={{textAlign:"center",padding:44}}>
          <div style={{fontSize:44,marginBottom:12}}>🏘️</div>
          <div style={{color:G.muted,marginBottom:18}}>Aún no pertenecés a ningún grupo.</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btn btn-ghost" onClick={()=>setModal("join")}>🔑 Unirse con código</button>
            <button className="btn btn-gold"  onClick={()=>setModal("create")}>➕ Crear mi grupo</button>
          </div>
        </div>
      ) : (
        <div style={{display:"grid",gap:11,gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))"}}>
          {groups.map(g=>{
            const t=gt(g.type);
            return (
              <div key={g.id} className="card" style={{cursor:"pointer",borderColor:`${t.color}33`}} onClick={()=>openDetail(g)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:24,marginBottom:4}}>{t.icon}</div>
                    <div style={{fontWeight:800,fontSize:16}}>{g.name}</div>
                    <div style={{color:G.muted,fontSize:12,marginTop:2}}>{t.label}</div>
                  </div>
                  <span className="badge b-gold">👥 {g.members.length}</span>
                </div>
                <div style={{marginTop:12,background:G.bg,borderRadius:8,padding:"7px 11px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:G.muted}}>Código: <strong style={{color:G.text,letterSpacing:2}}>{g.code}</strong></span>
                  {g.admin_id===user.id && <span className="badge b-gold" style={{fontSize:10}}>ADMIN</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal==="create" && (
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="h1" style={{fontSize:22,marginBottom:20,letterSpacing:2}}>CREAR GRUPO</div>
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <div>
                <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>NOMBRE DEL GRUPO</div>
                <input className="input" placeholder="Ej: Vecinos Los Pinos" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
              </div>
              <div>
                <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:8}}>TIPO</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
                  {GTYPES.map(t=>(
                    <button key={t.id} onClick={()=>setForm(p=>({...p,type:t.id}))}
                      style={{padding:"9px 8px",borderRadius:9,border:`2px solid ${form.type===t.id?t.color:G.border}`,
                        background:form.type===t.id?`${t.color}18`:G.bg,color:form.type===t.id?t.color:G.muted,
                        cursor:"pointer",fontFamily:"Nunito",fontWeight:700,fontSize:12,display:"flex",
                        flexDirection:"column",alignItems:"center",gap:3,transition:"all .15s"}}>
                      <span style={{fontSize:18}}>{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button className="btn btn-ghost" onClick={()=>setModal(null)} style={{flex:1,justifyContent:"center"}}>Cancelar</button>
                <button className="btn btn-gold"  onClick={createGroup}        style={{flex:1,justifyContent:"center"}}>✨ Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal==="join" && (
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="h1" style={{fontSize:22,marginBottom:14,letterSpacing:2}}>UNIRSE A UN GRUPO</div>
            <p style={{color:G.muted,fontSize:13,marginBottom:16}}>Pedí el código al admin del grupo e ingrésalo aquí.</p>
            <input className="input" placeholder="Código (ej: AB3F7)" value={form.code}
              onChange={e=>setForm(p=>({...p,code:e.target.value}))}
              style={{textAlign:"center",fontSize:22,letterSpacing:6,fontWeight:800,marginBottom:14}}/>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-ghost" onClick={()=>setModal(null)} style={{flex:1,justifyContent:"center"}}>Cancelar</button>
              <button className="btn btn-blue"  onClick={joinGroup}          style={{flex:1,justifyContent:"center"}}>🔑 Unirse</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DETALLE GRUPO ────────────────────────────────────────────────────────────
const TRADE_STATUS_FILTERS = ["all", "PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "EXPIRED"];

function GroupDetail({ group, user, onBack, onLeave, onChat }) {
  const URGENT_TRADE_MS = 15 * 60 * 1000;
  const TRADE_REFRESH_MS = 30 * 1000;
  const [tab, setTab] = useState(() => readGroupNav(user.id, group.id, "tab", "matches"));
  const [members, setMembers] = useState([]);
  const [cromos,  setCromos]  = useState({});
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState([]);
  const [tradeFilter, setTradeFilter] = useState(() => readGroupNav(user.id, group.id, "tradeFilter", "all"));
  const [pendingForMe, setPendingForMe] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());
  const [busyTrade, setBusyTrade] = useState(false);
  const [tradeNote, setTradeNote] = useState("");
  const [customTrade, setCustomTrade] = useState(null);
  const [msg, setMsg] = useState({ t:"", k:"" });

  const flash = (t,k="ok")=>{ setMsg({t,k}); setTimeout(()=>setMsg({t:"",k:""}),3000); };

  useEffect(() => { writeGroupNav(user.id, group.id, "tab", tab); }, [tab, user.id, group.id]);
  useEffect(() => { writeGroupNav(user.id, group.id, "tradeFilter", tradeFilter); }, [tradeFilter, user.id, group.id]);

  const selectTab = (nextTab) => setTab(nextTab);

  const selectTradeFilter = (filter) => {
    setTradeFilter(filter);
    setTab("trades");
  };

  useEffect(()=>{
    const load = async () => {
      const profs = await api.listProfiles({ ids: group.members.join(","), blocked: false });
      setMembers(profs||[]);
      const crms = await api.listUserCromos(group.members);
      const map = {};
      (crms||[]).forEach(c=>{ map[c.user_id] = normalizeCromosPayload(c); });
      setCromos(map);
      setLoading(false);
    };
    load();
  },[group.id]);

  const myData    = cromos[user.id] || EMPTY_CROMOS;
  const myMissing = getMissingIds(myData);

  const matches = members.filter(m => m.id !== user.id).map(m => {
    const md       = cromos[m.id] || EMPTY_CROMOS;
    const mMissing = getMissingIds(md);
    // Yo le doy: mis dobles que él necesita
    const iGive    = getDoubleIds(myData).filter(id => mMissing.includes(id));
    // Él me da: sus dobles que yo necesito
    const theyGive = getDoubleIds(md).filter(id => myMissing.includes(id));
    return { member:m, iGive, theyGive, score:iGive.length + theyGive.length };
  }).filter(x => x.score > 0).sort((a,b) => b.score - a.score);

  const t = GTYPES.find(x => x.id === group.type) || GTYPES[0];
  const secOf = id => { const c = ALL_CROMOS.find(x => x.id === id); return c ? SECTIONS.find(s => s.id === c.section) : null; };

  const formatCountdown = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = String(Math.floor(total / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const seconds = String(total % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const loadTrades = async (status = tradeFilter) => {
    const statusParam = status === "all" ? undefined : status;
    const [filteredRows, pendingRows] = await Promise.all([
      api.listTrades(statusParam),
      api.listTrades("PENDING"),
    ]);

    const insideFiltered = (filteredRows || []).filter((tr) => group.members.includes(tr.from_user_id) && group.members.includes(tr.to_user_id));
    const insidePending = (pendingRows || []).filter((tr) => group.members.includes(tr.from_user_id) && group.members.includes(tr.to_user_id));

    setTrades(insideFiltered);
    setPendingForMe(insidePending.filter((tr) => tr.to_user_id === user.id).length);
  };

  useEffect(()=>{ loadTrades(tradeFilter).catch(()=>{}); },[group.id, tradeFilter]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      loadTrades(tradeFilter).catch(() => {});
    }, TRADE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [group.id, tradeFilter]);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) {
        loadTrades(tradeFilter).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [group.id, tradeFilter]);

  useEffect(()=>{
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedTrades = [...trades].sort((a, b) => {
    const rank = (tr) => {
      if (tr.status !== "PENDING") return 3;
      if (!tr.expires_at) return 2;
      const msLeft = new Date(tr.expires_at).getTime() - nowTick;
      if (msLeft > 0 && msLeft <= URGENT_TRADE_MS) return 0;
      if (msLeft > 0) return 1;
      return 2;
    };

    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;

    if (ra <= 2) {
      const ta = a.expires_at ? new Date(a.expires_at).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.expires_at ? new Date(b.expires_at).getTime() : Number.MAX_SAFE_INTEGER;
      if (ta !== tb) return ta - tb;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const proposeTrade = async (member, iGive, theyGive, note = tradeNote) => {
    const give = iGive.slice(0, TRADE_MAX_STICKERS);
    const receive = theyGive.slice(0, TRADE_MAX_STICKERS);
    if (give.length === 0 && receive.length === 0) return;

    setBusyTrade(true);
    try {
      await api.proposeTrade({
        to_user_id: member.id,
        give_ids: give,
        receive_ids: receive,
        note: note?.trim() || undefined,
      });
      flash("Propuesta de trueque enviada", "ok");
      setCustomTrade(null);
      await loadTrades(tradeFilter);
    } catch (e) {
      flash(e.message || "No se pudo enviar el trueque", "err");
    } finally {
      setBusyTrade(false);
    }
  };

  const actionTrade = async (id, action) => {
    setBusyTrade(true);
    try {
      if (action === "accept") await api.acceptTrade(id);
      if (action === "reject") await api.rejectTrade(id);
      if (action === "cancel") await api.cancelTrade(id);
      await Promise.all([loadTrades(tradeFilter), (async ()=>{
        const profs = await api.listProfiles({ ids: group.members.join(","), blocked: false });
        setMembers(profs||[]);
        const crms = await api.listUserCromos(group.members);
        const map = {};
        (crms||[]).forEach(c=>{ map[c.user_id] = normalizeCromosPayload(c); });
        setCromos(map);
      })()]);
      flash("Trueque actualizado", "ok");
    } catch (e) {
      flash(e.message || "No se pudo actualizar el trueque", "err");
    } finally {
      setBusyTrade(false);
    }
  };

  return (
    <div className="ani">
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{marginBottom:16}}>← Volver</button>
      <div className="card" style={{marginBottom:18,borderColor:`${t.color}30`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:26,marginBottom:2}}>{t.icon}</div>
            <div className="h1" style={{fontSize:24,letterSpacing:2}}>{group.name}</div>
            <div style={{color:G.muted,fontSize:13}}>{t.label} · {group.members.length} miembro{group.members.length!==1?"s":""}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:G.bg,borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
              <div style={{fontSize:10,color:G.muted,fontWeight:700,letterSpacing:1}}>CÓDIGO</div>
              <div className="h1" style={{fontSize:20,letterSpacing:6,color:G.accent}}>{group.code}</div>
            </div>
            {group.admin_id!==user.id && <button className="btn btn-danger btn-sm" onClick={()=>onLeave(group.id)}>Salir</button>}
          </div>
        </div>
      </div>

      <div className="group-trade-nav" style={{
        position:"sticky", top:88, zIndex:45, marginBottom:18,
        background:`${G.bg}ee`, backdropFilter:"blur(10px)",
        borderRadius:12, padding:"10px 12px", border:`1px solid ${G.border}`,
      }}>
        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
          {["matches","trades","members"].map(tb=>(
            <div key={tb} className={`nav-item ${tab===tb?"active":""}`} onClick={()=>selectTab(tb)}>
              {tb==="matches"?"🔄 Intercambios posibles":tb==="trades"?`🤝 Trueques${pendingForMe>0?` (${pendingForMe})`:""}`:"👥 Miembros"}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {TRADE_STATUS_FILTERS.map((f)=>(
            <button key={f} className="btn btn-sm" onClick={()=>selectTradeFilter(f)}
              style={{background:tradeFilter===f?G.accent:G.border,color:tradeFilter===f?"#08100a":G.muted}}>
              {f==="all"?"Todos":f}
            </button>
          ))}
        </div>
      </div>

      {msg.t && <div className={`alert alert-${msg.k}`} style={{marginBottom:12}}>{msg.t}</div>}

      {customTrade && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setCustomTrade(null)}>
          <div style={{maxWidth:520,width:"100%",maxHeight:"90vh",overflow:"auto"}} onClick={(e)=>e.stopPropagation()}>
            <TradePropose
              currentUserId={user.id}
              targetUserId={customTrade.member.id}
              targetUserName={customTrade.member.name}
              cromosMap={cromos}
              onTradeCreated={()=>{
                setCustomTrade(null);
                flash("Propuesta de trueque enviada", "ok");
                loadTrades(tradeFilter).catch(()=>{});
              }}
              onCancel={()=>setCustomTrade(null)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:40}}><div className="spinner"/></div>
      ) : tab==="matches" ? (
        matches.length===0 ? (
          <div className="card" style={{textAlign:"center",padding:40}}>
            <div style={{fontSize:40,marginBottom:10}}>🔍</div>
            <div style={{color:G.muted,fontSize:14,lineHeight:1.7}}>
              No hay intercambios posibles aún.<br/>
              Para que aparezcan intercambios, los miembros deben:<br/>
              <span style={{color:G.accent3}}>✓ Marcar los cromos que ya pegaron</span><br/>
              <span style={{color:G.accent}}>× 2 toques para marcar los que tienen dobles</span>
            </div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div className="card2" style={{padding:12}}>
              <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:6}}>NOTA PARA EL TRUEQUE (OPCIONAL)</div>
              <input className="input" value={tradeNote} onChange={(e)=>setTradeNote(e.target.value)} maxLength={500}
                placeholder="Ej: ¿Podemos quedar mañana para el intercambio?" style={{fontSize:13}}/>
            </div>
            {matches.map(({member,iGive,theyGive})=>(
              <div key={member.id} className="match-row">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {member.avatar_url
                      ? <img src={member.avatar_url} style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",border:`2px solid ${G.accent}`}}/>
                      : <div style={{width:38,height:38,borderRadius:"50%",background:G.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👤</div>}
                    <div>
                      <div style={{fontWeight:800,fontSize:15}}>{member.name}
                        {group.admin_id===member.id && <span className="badge b-gold" style={{marginLeft:6,fontSize:10}}>ADMIN</span>}
                      </div>
                      <div style={{fontSize:12,color:G.muted}}>
                        @{member.username}
                        {member.provincia && <span className="badge b-blue" style={{marginLeft:6,fontSize:10}}>📍 {member.provincia}{member.canton?`, ${member.canton}`:""}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span className="badge b-gold">🔄 {iGive.length+theyGive.length}</span>
                    <button className="btn btn-sm" onClick={()=>proposeTrade(member, iGive, theyGive)} disabled={busyTrade}
                      style={{background:"rgba(201,168,76,.2)",color:G.accent,border:`1px solid ${G.accent}55`}}>
                      🤝 Proponer trueque
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={()=>setCustomTrade({ member, iGive, theyGive })} disabled={busyTrade}>
                      ✏️ Personalizar
                    </button>
                    <button className="btn btn-blue btn-sm" onClick={()=>onChat(member.id)}>
                      💬 Chat
                    </button>
                    {member.whatsapp && (
                      <a href={`https://wa.me/${member.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(
                        `¡Hola ${member.name}! Vi en La Bolsa de Cromos que podemos intercambiar:\n\n`+
                        (iGive.length>0?`✅ Yo te doy: ${iGive.slice(0,5).join(", ")}${iGive.length>5?` y ${iGive.length-5} más`:""}\n`:"")+
                        (theyGive.length>0?`🔄 Yo necesito: ${theyGive.slice(0,5).join(", ")}${theyGive.length>5?` y ${theyGive.length-5} más`:""}`:"")+
                        `\n\n¿Hacemos un intercambio?`
                      )}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{background:"#25D366",color:"#fff",padding:"5px 12px",borderRadius:8,
                          fontSize:12,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:5}}>
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div className="card2" style={{borderColor:"rgba(76,200,122,.2)"}}>
                    <div style={{fontSize:11,color:G.accent3,fontWeight:700,marginBottom:7}}>YO LE DOY ({iGive.length})</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                      {iGive.slice(0,12).map(id=>{ const s=secOf(id); return <span key={id} className="badge b-green" style={{fontSize:10}}>{s?.flag} {id}</span>; })}
                      {iGive.length>12&&<span style={{fontSize:11,color:G.muted}}>+{iGive.length-12}</span>}
                    </div>
                  </div>
                  <div className="card2" style={{borderColor:"rgba(200,76,76,.2)"}}>
                    <div style={{fontSize:11,color:"#E07070",fontWeight:700,marginBottom:7}}>ÉL/ELLA ME DA ({theyGive.length})</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                      {theyGive.slice(0,12).map(id=>{ const s=secOf(id); return <span key={id} className="badge b-red" style={{fontSize:10}}>{s?.flag} {id}</span>; })}
                      {theyGive.length>12&&<span style={{fontSize:11,color:G.muted}}>+{theyGive.length-12}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab==="trades" ? (
        trades.length===0 ? (
          <div className="card" style={{textAlign:"center",padding:40}}>
            <div style={{fontSize:40,marginBottom:10}}>🤝</div>
            <div style={{color:G.muted,fontSize:14}}>
              {tradeFilter === "all"
                ? "No hay trueques todavía en este grupo."
                : "No hay trueques con ese estado en este grupo."}
            </div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {sortedTrades.map(tr=>{
              const amSender = tr.from_user_id === user.id;
              const amReceiver = tr.to_user_id === user.id;
              const other = amSender ? tr.to_user : tr.from_user;
              const pending = tr.status === "PENDING";
              const expiresAt = tr.expires_at ? new Date(tr.expires_at) : null;
              const msLeft = expiresAt ? (expiresAt.getTime() - nowTick) : null;
              const isUrgent = pending && msLeft !== null && msLeft > 0 && msLeft <= URGENT_TRADE_MS;
              const isOverdue = pending && msLeft !== null && msLeft <= 0;
              return (
                <div key={tr.id} className="card" style={{borderColor:isUrgent?"rgba(200,76,76,.45)":pending?"rgba(201,168,76,.35)":G.border}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:10}}>
                    <div style={{fontWeight:800,fontSize:15}}>
                      {amSender?"Enviaste":"Recibiste"} trueque con {other?.name || "usuario"}
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      {isUrgent && <span className="badge b-red">URGENTE</span>}
                      <span className={`badge ${tr.status==="ACCEPTED"?"b-green":tr.status==="PENDING"?"b-gold":"b-red"}`}>{tr.status}</span>
                    </div>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div className="card2" style={{borderColor:"rgba(76,200,122,.2)"}}>
                      <div style={{fontSize:11,color:G.accent3,fontWeight:700,marginBottom:6}}>TÚ DAS ({tr.give_ids.length})</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                        {tr.give_ids.map(id=>{ const s=secOf(id); return <span key={`${tr.id}-g-${id}`} className="badge b-green" style={{fontSize:10}}>{s?.flag} {id}</span>; })}
                      </div>
                    </div>
                    <div className="card2" style={{borderColor:"rgba(200,76,76,.2)"}}>
                      <div style={{fontSize:11,color:"#E07070",fontWeight:700,marginBottom:6}}>TÚ RECIBES ({tr.receive_ids.length})</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                        {tr.receive_ids.map(id=>{ const s=secOf(id); return <span key={`${tr.id}-r-${id}`} className="badge b-red" style={{fontSize:10}}>{s?.flag} {id}</span>; })}
                      </div>
                    </div>
                  </div>

                  {tr.note && (
                    <div style={{fontSize:12,color:G.muted,fontStyle:"italic",marginBottom:8,padding:"8px 10px",background:G.bg,borderRadius:8,borderLeft:`3px solid ${G.accent}`}}>
                      💬 {tr.note}
                    </div>
                  )}

                  {pending && expiresAt && (
                    <div style={{fontSize:11,color:isUrgent||isOverdue?"#E07070":G.muted,marginBottom:8,fontWeight:isUrgent?800:600}}>
                      Expira: {expiresAt.toLocaleString("es-CR")} · {msLeft > 0 ? `faltan ${formatCountdown(msLeft)}` : "expirando..."}
                    </div>
                  )}

                  {pending && (
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {amReceiver && <button className="btn btn-sm btn-gold" disabled={busyTrade} onClick={()=>actionTrade(tr.id,"accept")}>✅ Aceptar</button>}
                      {amReceiver && <button className="btn btn-sm btn-ghost" disabled={busyTrade} onClick={()=>actionTrade(tr.id,"reject")}>❌ Rechazar</button>}
                      {amSender && <button className="btn btn-sm btn-danger" disabled={busyTrade} onClick={()=>actionTrade(tr.id,"cancel")}>🛑 Cancelar</button>}
                    </div>
                  )}
                </div>
              );
            })}

            {trades.length===0 && (
              <div className="card" style={{textAlign:"center",padding:24,color:G.muted,fontSize:13}}>No hay trueques con ese estado.</div>
            )}
          </div>
        )
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {members.map(m=>{
            const md = cromos[m.id]||EMPTY_CROMOS;
            const mHave    = getOwnedCount(md);
            const mDoubles = getDoubleCount(md);
            const mMissing = ALL_CROMOS.length - mHave;
            const mPct     = Math.round((mHave/ALL_CROMOS.length)*100);
            return (
              <div key={m.id} className="card" style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {m.avatar_url
                    ? <img src={m.avatar_url} style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",border:`2px solid ${G.border}`}}/>
                    : <div style={{width:38,height:38,borderRadius:"50%",background:G.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👤</div>}
                  <div>
                    <div style={{fontWeight:800}}>
                      {m.name}
                      {group.admin_id===m.id && <span className="badge b-gold" style={{marginLeft:6,fontSize:10}}>ADMIN</span>}
                      {m.id===user.id && <span className="badge" style={{marginLeft:6,fontSize:10,background:"rgba(76,154,200,.2)",color:G.accent2,border:`1px solid ${G.accent2}44`}}>YO</span>}
                    </div>
                    <div style={{color:G.muted,fontSize:12}}>
                      @{m.username}
                      {m.provincia && ` · 📍 ${m.provincia}${m.canton?`, ${m.canton}`:""}`}
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  <span className="badge b-green">{mHave} pegados ({mPct}%)</span>
                  <span className="badge b-red">{mMissing} faltan</span>
                  {mDoubles>0 && <span className="badge b-gold">{mDoubles} dobles</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PERFIL ───────────────────────────────────────────────────────────────────
function ProfileScreen({ user, onUserUpdate, onLogout, themeMode, onThemeChange }) {
  const [city,     setCity]   = useState(user.city||"");
  const [whatsapp, setWa]     = useState(user.whatsapp||"");
  const [provincia,setProv]   = useState(user.provincia||"");
  const [canton,   setCanton] = useState(user.canton||"");
  const [saved,    setSaved]  = useState(false);
  const [avatar,   setAvatar] = useState(user.avatar_url||null);
  const [uploading,setUploading] = useState(false);
  const [cromos,   setCromos] = useState(EMPTY_CROMOS);

  useEffect(()=>{
    api.getUserCromos(user.id)
      .then((d)=>{ if(d) setCromos(normalizeCromosPayload(d)); })
      .catch(()=>{});
  },[user.id]);

  const saveProfile = async () => {
    const nextAlbumPrefs = user.album_prefs && typeof user.album_prefs === "object" ? user.album_prefs : {};
    const updatedUser = {
      ...user,
      city: city.trim(),
      whatsapp: whatsapp.trim(),
      provincia,
      canton: canton.trim(),
      album_prefs: nextAlbumPrefs,
    };
    await api.updateProfile(user.id, {
      city: updatedUser.city,
      whatsapp: updatedUser.whatsapp,
      provincia: updatedUser.provincia,
      canton: updatedUser.canton,
      album_prefs: nextAlbumPrefs,
    });
    onUserUpdate(updatedUser);
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  const save = async () => {
    await saveProfile();
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2*1024*1024) return alert("La foto debe pesar menos de 2MB.");
    setUploading(true);
    try {
      const url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
        reader.readAsDataURL(file);
      });
      await api.saveAvatar(user.id, url);
      setAvatar(url);
      onUserUpdate({...user,avatar_url:url});
    } finally {
      setUploading(false);
    }
  };

  const totalHave    = getOwnedCount(cromos);
  const totalPct     = Math.round((totalHave/TOTAL)*100);

  return (
    <div className="ani">
      <div className="h1" style={{fontSize:24,letterSpacing:2,marginBottom:18}}>MI PERFIL</div>
      <div style={{display:"grid",gap:14,gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))"}}>
        <div className="card">
          <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:14,letterSpacing:1}}>DATOS PERSONALES</div>

          {/* Foto de perfil */}
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:18}}>
            <div style={{position:"relative"}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:G.border,
                border:`3px solid ${G.accent}`,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {avatar
                  ? <img src={avatar} alt="foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:28}}>👤</span>}
              </div>
              {uploading && <div style={{position:"absolute",inset:0,borderRadius:"50%",
                background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div className="spinner" style={{width:24,height:24,borderWidth:2}}/>
              </div>}
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:15,marginBottom:4}}>{user.name}</div>
              <div style={{color:G.accent2,fontSize:13,marginBottom:8}}>@{user.username}</div>
              <label style={{cursor:"pointer"}}>
                <input type="file" accept="image/*" onChange={uploadPhoto} style={{display:"none"}}/>
                <span className="btn btn-ghost btn-sm" style={{cursor:"pointer"}}>📷 Cambiar foto</span>
              </label>
            </div>
          </div>

          <div className="card2" style={{marginBottom:14}}>
            <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:8,letterSpacing:1}}>APARIENCIA</div>
            <ThemeModeSwitcher themeMode={themeMode} onChange={onThemeChange} />
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>CIUDAD / ZONA</div>
              <input className="input" value={city} onChange={e=>setCity(e.target.value)} placeholder="Barrio, urbanización…"/>
            </div>
            <ProvinciaCantonSelect
              provincia={provincia} canton={canton}
              onProvincia={v=>{ setProv(v); setCanton(""); }}
              onCanton={v=>setCanton(v)}/>
            <div>
              <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>WHATSAPP <span style={{color:G.muted,fontWeight:400}}>(con código de país)</span></div>
              <input className="input" value={whatsapp} onChange={e=>setWa(e.target.value)} placeholder="Ej: 50688887777"/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-gold btn-sm" onClick={save}>{saved?"✅ Guardado":"💾 Guardar"}</button>
              <button className="btn btn-danger btn-sm" onClick={onLogout}>Cerrar sesión</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:14,letterSpacing:1}}>RESUMEN DE CROMOS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div className="stat"><div className="stat-n" style={{color:G.accent3}}>{totalHave}</div><div className="stat-l">TENGO</div></div>
            <div className="stat"><div className="stat-n" style={{color:G.accent2}}>{totalPct}%</div><div className="stat-l">COMPLETADO</div></div>
          </div>
          <div style={{marginBottom:14}}>
            <div className="prog-bar"><div className="prog-fill" style={{width:`${totalPct}%`}}/></div>
          </div>
          <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:8}}>POR SELECCIÓN</div>
          <div style={{maxHeight:220,overflowY:"auto"}}>
            {SECTIONS.map(s=>{
              const sH=ALL_CROMOS.filter(c=>c.section===s.id && Number(cromos.quantities?.[c.id] || 0) > 0).length;
              const sD=ALL_CROMOS.filter(c=>c.section===s.id && Number(cromos.quantities?.[c.id] || 0) > 1).length;
              const sPct=Math.round((sH/s.count)*100);
              if(!sH) return null;
              return (
                <div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${G.border}`,fontSize:12,alignItems:"center"}}>
                  <span>{s.flag} {s.name}</span>
                  <span>
                    <span style={{color:G.accent3}}>{sH}/{s.count}</span>
                    {sD>0&&<span style={{color:G.accent,marginLeft:6}}>{sD}×2</span>}
                    <span style={{color:G.muted,marginLeft:6}}>{sPct}%</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MERCADO PÚBLICO ──────────────────────────────────────────────────────────
const PROVINCIAS = ["Venezuela"];

const CANTONES = {
  "Venezuela":    ["Amazonas","Anzoategui","Apure","Aragua","Barinas","Bolivar","Carabobo",
"Cojedes",
"Delta Amacuro",
"Distrito Capital",
"Falcon",
"Guarico",
"Lara",
"Merida",
"Miranda",
"Monagas",
"Nueva Esparta",
"Portuguesa",
"Sucre",
"Tachira",
"Trujillo",
"La Guaira",
"Yaracuy",
"Zona en Reclamacion",
"Zulia"],
};

function ProvinciaCantonSelect({ provincia, canton, onProvincia, onCanton, includeTodas=false }) {
  const cantones = provincia && CANTONES[provincia] ? CANTONES[provincia] : [];
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <div>
        <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>PAÍS</div>
        <select className="input" value={provincia} onChange={e=>{ onProvincia(e.target.value); onCanton(""); }} style={{cursor:"pointer"}}>
          <option value="">{includeTodas?"Todas los paises":"Seleccioná..."}</option>
          {PROVINCIAS.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>ESTADO</div>
        <select className="input" value={canton} onChange={e=>onCanton(e.target.value)}
          disabled={!provincia||cantones.length===0} style={{cursor:provincia?"pointer":"not-allowed",opacity:provincia?1:.5}}>
          <option value="">{provincia?"Todos los cantones":"Primero elegí provincia"}</option>
          {cantones.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}

function MercadoScreen({ user, onChat }) {
  const [users,    setUsers]    = useState([]);
  const [cromos,   setCromos]   = useState({});
  const [loading,  setLoading]  = useState(true);
  const [filtProv, setFiltProv] = useState("");
  const [filtCant, setFiltCant] = useState("");
  const [filtSec,  setFiltSec]  = useState("all");
  const [search,   setSearch]   = useState("");
  const [mode,     setMode]     = useState("necesitan"); // necesitan | tienen
  const [busyTrade, setBusyTrade] = useState(false);
  const [customTrade, setCustomTrade] = useState(null);
  const [msg, setMsg] = useState({ t:"", k:"" });

  const flash = (t,k="ok")=>{ setMsg({t,k}); setTimeout(()=>setMsg({t:"",k:""}),3000); };

  useEffect(()=>{
    const load = async () => {
      const profs = await api.listProfiles({ excludeId: user.id, blocked: false });
      const crms  = await api.listAllCromos();
      const map = {};
      (crms||[]).forEach(c=>{ map[c.user_id]=normalizeCromosPayload(c); });
      setUsers(profs||[]);
      setCromos(map);
      setLoading(false);
    };
    load();
  },[]);

  const myData    = cromos[user.id]||EMPTY_CROMOS;
  const myMissing = getMissingIds(myData);

  const filtered = users.filter(u=>{
    if(filtProv && u.provincia!==filtProv) return false;
    if(filtCant && u.canton!==filtCant) return false;
    if(search.trim() && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.username.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const secCromos = filtSec==="all" ? ALL_CROMOS : ALL_CROMOS.filter(c=>c.section===filtSec);
  const secInfo   = SECTIONS.find(s=>s.id===filtSec);

  const proposeTrade = async (targetUser, iGive, theyGive) => {
    const give = iGive.slice(0, TRADE_MAX_STICKERS);
    const receive = theyGive.slice(0, TRADE_MAX_STICKERS);
    if (give.length === 0 && receive.length === 0) return;

    setBusyTrade(true);
    try {
      await api.proposeTrade({ to_user_id: targetUser.id, give_ids: give, receive_ids: receive });
      flash(`Trueque propuesto a ${targetUser.name}`, "ok");
      setCustomTrade(null);
    } catch (e) {
      flash(e.message || "No se pudo enviar el trueque", "err");
    } finally {
      setBusyTrade(false);
    }
  };

  return (
    <div className="ani">
      <div className="h1" style={{fontSize:24,letterSpacing:2,marginBottom:6}}>MERCADO DE INTERCAMBIOS</div>
      <div style={{color:G.muted,fontSize:13,marginBottom:18}}>Encontrá usuarios para intercambiar sin necesidad de estar en el mismo grupo.</div>

      {msg.t && <div className={`alert alert-${msg.k}`} style={{marginBottom:12}}>{msg.t}</div>}

      {customTrade && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setCustomTrade(null)}>
          <div style={{maxWidth:520,width:"100%",maxHeight:"90vh",overflow:"auto"}} onClick={(e)=>e.stopPropagation()}>
            <TradePropose
              currentUserId={user.id}
              targetUserId={customTrade.user.id}
              targetUserName={customTrade.user.name}
              cromosMap={cromos}
              onTradeCreated={()=>{
                setCustomTrade(null);
                flash(`Trueque propuesto a ${customTrade.user.name}`, "ok");
              }}
              onCancel={()=>setCustomTrade(null)}
            />
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{marginBottom:16,padding:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:12}}>
          <ProvinciaCantonSelect
            provincia={filtProv} canton={filtCant}
            onProvincia={v=>{ setFiltProv(v); setFiltCant(""); }}
            onCanton={v=>setFiltCant(v)}
            includeTodas={true}/>
          <div>
            <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>BUSCAR USUARIO</div>
            <input className="input" placeholder="Nombre o @usuario" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>SELECCIÓN / PAÍS</div>
            <select className="input" value={filtSec} onChange={e=>setFiltSec(e.target.value)} style={{cursor:"pointer"}}>
              <option value="all">Todas las selecciones</option>
              {SECTIONS.map(s=><option key={s.id} value={s.id}>{s.flag} {s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Modo */}
        <div style={{display:"flex",gap:8}}>
          <div style={{fontSize:12,color:G.muted,fontWeight:700,alignSelf:"center"}}>Ver quién:</div>
          {[["necesitan","🔴 Necesita lo que yo tengo doble"],["tienen","🟢 Tiene lo que a mí me falta"]].map(([k,l])=>(
            <button key={k} className="btn btn-sm" onClick={()=>setMode(k)}
              style={{background:mode===k?G.accent:G.border,color:mode===k?"#08100a":G.muted}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:40}}><div className="spinner"/></div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.length===0 ? (
            <div className="card" style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:40,marginBottom:10}}>🔍</div>
              <div style={{color:G.muted}}>No hay usuarios con esos filtros.</div>
            </div>
          ) : filtered.map(u=>{
            const ud = cromos[u.id]||EMPTY_CROMOS;
            const uMissing = getMissingIds(ud);

            // Lo que yo le puedo dar (tengo doble y él necesita)
            const iCanGive  = getDoubleIds(myData).filter(id=>uMissing.includes(id) && secCromos.find(c=>c.id===id));
            // Lo que él me puede dar (tiene doble y yo necesito)
            const theyGive  = getDoubleIds(ud).filter(id=>myMissing.includes(id) && secCromos.find(c=>c.id===id));

            const relevant  = mode==="necesitan" ? iCanGive : theyGive;
            if(relevant.length===0) return null;

            return (
              <div key={u.id} className="match-row">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",border:`2px solid ${G.accent}`}}/>
                      : <div style={{width:40,height:40,borderRadius:"50%",background:G.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>👤</div>}
                    <div>
                      <div style={{fontWeight:800,fontSize:15}}>{u.name}</div>
                      <div style={{fontSize:12,color:G.muted}}>
                        @{u.username}
                        {u.provincia && <span className="badge b-blue" style={{marginLeft:6,fontSize:10}}>📍 {u.provincia}{u.canton?`, ${u.canton}`:""}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span className="badge b-gold">{relevant.length} cromos</span>
                    {(iCanGive.length > 0 || theyGive.length > 0) && (
                      <>
                        <button className="btn btn-sm" disabled={busyTrade} onClick={()=>proposeTrade(u, iCanGive, theyGive)}
                          style={{background:"rgba(201,168,76,.2)",color:G.accent,border:`1px solid ${G.accent}55`}}>
                          🤝 Proponer trueque
                        </button>
                        <button className="btn btn-sm btn-ghost" disabled={busyTrade} onClick={()=>setCustomTrade({ user: u, iCanGive, theyGive })}>
                          ✏️ Personalizar
                        </button>
                      </>
                    )}
                    <button className="btn btn-blue btn-sm" onClick={()=>onChat(u.id)}>
                      💬 Chat
                    </button>
                    {u.whatsapp && (
                      <a href={`https://wa.me/${u.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(
                        `¡Hola ${u.name}! Te encontré en La Bolsa de Cromos.\n\n`+
                        (iCanGive.length>0?`✅ Yo te puedo dar: ${iCanGive.slice(0,5).join(", ")}${iCanGive.length>5?` y ${iCanGive.length-5} más`:""}\n`:"")+
                        (theyGive.length>0?`🔄 Yo necesito: ${theyGive.slice(0,5).join(", ")}${theyGive.length>5?` y ${theyGive.length-5} más`:""}`:"")+
                        `\n\n¿Hacemos un intercambio?`
                      )}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{background:"#25D366",color:"#fff",padding:"5px 12px",borderRadius:8,
                          fontSize:12,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:5}}>
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {relevant.slice(0,15).map(id=>{
                    const s = SECTIONS.find(sec=>id.startsWith(sec.id));
                    return <span key={id} className={`badge ${mode==="necesitan"?"b-green":"b-red"}`} style={{fontSize:10}}>{s?.flag} {id}</span>;
                  })}
                  {relevant.length>15&&<span style={{fontSize:11,color:G.muted}}>+{relevant.length-15} más</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CHAT ────────────────────────────────────────────────────────────────────
function ChatScreen({ user, openWith, onChatOpen }) {
  const [convs,    setConvs]   = useState([]);
  const [active,   setActive]  = useState(null);
  const [messages, setMessages]= useState([]);
  const [text,     setText]    = useState("");
  const [loading,  setLoading] = useState(true);
  const [sending,  setSending] = useState(false);

  const loadConvs = async () => {
    const data = await api.listConversationsByUser(user.id);
    if (!data) return setLoading(false);
    const otherIds = data.map(c => c.user1_id === user.id ? c.user2_id : c.user1_id);
    const profs = otherIds.length > 0
      ? await api.listProfiles({ ids: otherIds.join(",") })
      : [];
    const profMap = {};
    (profs||[]).forEach(p => { profMap[p.id] = p; });
    const enriched = data.map(c => ({
      ...c, other: profMap[c.user1_id === user.id ? c.user2_id : c.user1_id]
    }));
    setConvs(enriched);
    setLoading(false);
    return enriched;
  };

  const startConv = async (otherId) => {
    // Buscar conversación existente
    let existing = null;
    try {
      existing = await api.getConversationBetween(user.id, otherId);
    } catch {
      existing = null;
    }
    let prof = null;
    try {
      prof = await api.getProfileById(otherId);
    } catch {
      prof = null;
    }
    if (existing) {
      setActive({ ...existing, other:prof });
      return;
    }
    const newConv = { id:genId(), user1_id:user.id, user2_id:otherId, last_message:"", last_at:new Date().toISOString() };
    await api.createConversation(newConv);
    setActive({ ...newConv, other:prof });
    loadConvs();
  };

  // Auto-abrir chat cuando viene de Mercado/Grupos
  useEffect(() => {
    if (openWith) {
      startConv(openWith);
      if (onChatOpen) onChatOpen();
    }
  }, [openWith]);

  useEffect(() => { loadConvs(); }, []);

  // Mensajes con recarga periódica
  useEffect(() => {
    if (!active) return;
    const load = async () => {
      const data = await api.listMessages(active.id);
      setMessages(data||[]);
      setTimeout(() => {
        const el = document.getElementById("msg-end");
        if (el) el.scrollIntoView({ behavior:"smooth" });
      }, 100);
    };
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [active?.id]);

  const sendMessage = async () => {
    if (!text.trim() || !active || sending) return;
    setSending(true);
    const msg = { id:genId(), conversation_id:active.id, sender_id:user.id, text:text.trim(), created_at:new Date().toISOString() };
    setText("");
    await api.createMessage(msg);
    setSending(false);
    const data = await api.listMessages(active.id);
    setMessages(data||[]);
  };

  const Avatar = ({u, size=38}) => u?.avatar_url
    ? <img src={u.avatar_url} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:`2px solid ${G.border}`,flexShrink:0}}/>
    : <div style={{width:size,height:size,borderRadius:"50%",background:G.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.4,flexShrink:0}}>👤</div>;

  // Vista de conversación activa
  if (active) return (
    <div className="ani" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 140px)"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${G.border}`}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>setActive(null)}>← Volver</button>
        <Avatar u={active.other} size={40}/>
        <div>
          <div style={{fontWeight:800,fontSize:16}}>{active.other?.name}</div>
          <div style={{fontSize:12,color:G.muted}}>@{active.other?.username}
            {active.other?.provincia && ` · 📍 ${active.other.provincia}${active.other.canton?`, ${active.other.canton}`:""}`}
          </div>
        </div>
        {active.other?.whatsapp && (
          <a href={`https://wa.me/${active.other.whatsapp.replace(/\D/g,"")}`}
            target="_blank" rel="noopener noreferrer" className="btn btn-sm"
            style={{marginLeft:"auto",background:"#25D366",color:"#fff",textDecoration:"none"}}>
            💬 WhatsApp
          </a>
        )}
      </div>

      {/* Mensajes */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,paddingBottom:8}}>
        {messages.length===0 && (
          <div style={{textAlign:"center",color:G.muted,fontSize:13,padding:40}}>
            Aún no hay mensajes. ¡Empezá la conversación! 👋
          </div>
        )}
        {messages.map(m => {
          const mine = m.sender_id === user.id;
          const time = new Date(m.created_at).toLocaleTimeString("es-CR",{hour:"2-digit",minute:"2-digit"});
          return (
            <div key={m.id} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
              {!mine && <Avatar u={active.other} size={28}/>}
              <div style={{maxWidth:"70%"}}>
                <div style={{
                  background: mine ? G.accent : G.card2,
                  color: mine ? "#08100a" : G.text,
                  padding:"10px 14px",borderRadius:mine?"14px 14px 4px 14px":"14px 14px 14px 4px",
                  fontSize:14,lineHeight:1.5,wordBreak:"break-word",
                  border:`1px solid ${mine?"transparent":G.border}`
                }}>
                  {m.text}
                </div>
                <div style={{fontSize:10,color:G.muted,marginTop:3,textAlign:mine?"right":"left"}}>{time}</div>
              </div>
              {mine && <Avatar u={user} size={28}/>}
            </div>
          );
        })}
        <div id="msg-end"/>
      </div>

      {/* Input */}
      <div style={{display:"flex",gap:8,paddingTop:12,borderTop:`1px solid ${G.border}`}}>
        <input className="input" placeholder="Escribí un mensaje..." value={text}
          onChange={e=>setText(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()}
          style={{flex:1}}/>
        <button className="btn btn-gold" onClick={sendMessage} disabled={!text.trim()||sending}
          style={{padding:"10px 16px",opacity:!text.trim()||sending?.6:1}}>
          {sending?"...":"Enviar ➤"}
        </button>
      </div>
    </div>
  );

  // Lista de conversaciones
  return (
    <div className="ani">
      <div className="h1" style={{fontSize:24,letterSpacing:2,marginBottom:18}}>💬 MENSAJES</div>

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:40}}><div className="spinner"/></div>
      ) : convs.length===0 ? (
        <div className="card" style={{textAlign:"center",padding:44}}>
          <div style={{fontSize:44,marginBottom:12}}>💬</div>
          <div style={{color:G.muted,fontSize:14,marginBottom:16}}>
            Aún no tenés conversaciones.<br/>
            Iniciá un chat desde el <strong style={{color:G.accent2}}>Mercado</strong> o los <strong style={{color:G.accent}}>Grupos</strong>.
          </div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {convs.map(c=>(
            <div key={c.id} className="card" style={{cursor:"pointer",display:"flex",alignItems:"center",gap:12}}
              onClick={()=>setActive(c)}>
              <Avatar u={c.other} size={46}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:15}}>{c.other?.name}</div>
                <div style={{fontSize:12,color:G.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {c.last_message || "Sin mensajes aún"}
                </div>
              </div>
              <div style={{fontSize:11,color:G.muted,flexShrink:0}}>
                {c.last_at ? new Date(c.last_at).toLocaleDateString("es-CR",{day:"2-digit",month:"2-digit"}) : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SOBRES ──────────────────────────────────────────────────────────────────
function SobresScreen({ user }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [eco, setEco] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [couponHistory, setCouponHistory] = useState([]);
  const [msg, setMsg] = useState({ t:"", k:"ok" });
  const [lastOpenings, setLastOpenings] = useState([]);

  const flash = (t, k="ok") => {
    setMsg({ t, k });
    setTimeout(() => setMsg({ t:"", k:"" }), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [data, redemptions] = await Promise.all([
        api.getEconomyMe(),
        api.listCouponRedemptions({ limit: 8 }),
      ]);
      setEco(data);
      setCouponHistory(redemptions || []);
    } catch (e) {
      flash(e.message || "No se pudo cargar la economía", "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const claimDaily = async () => {
    setBusy(true);
    try {
      await api.claimDailyBonus();
      flash("Bono diario reclamado", "ok");
      await load();
    } catch (e) {
      flash(e.message || "No se pudo reclamar el bono", "err");
    } finally {
      setBusy(false);
    }
  };

  const buyOne = async () => {
    setBusy(true);
    try {
      await api.buyPack("STD5", 1);
      flash("Compraste 1 sobre", "ok");
      await load();
    } catch (e) {
      flash(e.message || "No se pudo comprar", "err");
    } finally {
      setBusy(false);
    }
  };

  const openOne = async () => {
    setBusy(true);
    try {
      const out = await api.openPack("STD5", 1);
      setLastOpenings(out.openings || []);
      flash("Sobre abierto", "ok");
      await load();
    } catch (e) {
      flash(e.message || "No se pudo abrir", "err");
    } finally {
      setBusy(false);
    }
  };

  const redeem = async () => {
    if (!coupon.trim()) return;
    setBusy(true);
    try {
      const out = await api.redeemCoupon(coupon.trim().toUpperCase());
      setCoupon("");
      if (out?.reward?.type === "PACK") {
        flash(`Cupón aplicado: +${out.reward.quantity || 0} sobre(s) ${out.reward.pack_type_id || ""}`.trim(), "ok");
      } else if (out?.reward?.type === "COINS") {
        flash(`Cupón aplicado: +${out.reward.coins || 0} monedas`, "ok");
      } else {
        flash("Cupón aplicado", "ok");
      }
      await load();
    } catch (e) {
      flash(e.message || "Cupón inválido", "err");
    } finally {
      setBusy(false);
    }
  };

  const stdPack = eco?.packs?.find((p) => p.pack_type_id === "STD5");
  const totalPacks = (eco?.packs || []).reduce((acc, p) => acc + Number(p.quantity || 0), 0);

  return (
    <div className="ani">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div className="h1" style={{fontSize:24,letterSpacing:2}}>🎴 SOBRES</div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={busy}>🔄 Actualizar</button>
      </div>

      {msg.t && <div className={`alert alert-${msg.k} ani`} style={{marginBottom:12}}>{msg.t}</div>}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:40}}><div className="spinner"/></div>
      ) : (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10,marginBottom:14}}>
            <div className="stat"><div className="stat-n" style={{color:G.accent}}>{eco?.wallet?.coins ?? 0}</div><div className="stat-l">MONEDAS</div></div>
            <div className="stat"><div className="stat-n" style={{color:G.accent3}}>{stdPack?.quantity ?? 0}</div><div className="stat-l">SOBRES DISPONIBLES</div></div>
            <div className="stat"><div className="stat-n" style={{color:G.accent2}}>{totalPacks}</div><div className="stat-l">TOTAL SOBRES</div></div>
            <div className="stat"><div className="stat-n" style={{color:G.accent2}}>{eco?.wallet?.daily_bonus ?? 0}</div><div className="stat-l">BONO DIARIO</div></div>
          </div>

          {(eco?.packs || []).length > 0 && (
            <div className="card" style={{marginBottom:12}}>
              <div className="h1" style={{fontSize:16,letterSpacing:2,marginBottom:10}}>INVENTARIO DE SOBRES</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
                {(eco?.packs || []).map((p) => (
                  <div key={p.pack_type_id} className="card2" style={{padding:10}}>
                    <div style={{fontSize:11,color:G.muted}}>{p.pack_type?.name || "Sobre"}</div>
                    <div style={{fontWeight:800,fontSize:16}}>{p.pack_type_id}</div>
                    <div style={{fontSize:12,color:G.accent3}}>x{p.quantity || 0}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="h1" style={{fontSize:16,letterSpacing:2,marginBottom:10}}>ÚLTIMA APERTURA</div>
            {lastOpenings.length === 0 ? (
              <div style={{fontSize:13,color:G.muted}}>Todavía no abriste sobres en esta sesión.</div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
                {lastOpenings[0].items.map((it)=> (
                  <div key={`${lastOpenings[0].id}-${it.slot}`} className="card2" style={{padding:10,borderColor:it.rarity==="GOLD"?"#C9A84C66":G.border}}>
                    <div style={{fontSize:11,color:G.muted,marginBottom:4}}>Slot {it.slot}</div>
                    {it.image_path && (
                      <img src={it.image_path} alt={it.sticker_id}
                        style={{width:"100%",height:"60%",objectFit:"cover",borderRadius:8,marginBottom:8,border:`1px solid ${G.border}`}}/>
                    )}
                    <div style={{fontWeight:800,fontSize:16}}>{it.sticker_id}</div>
                    <div style={{fontSize:11,color:it.rarity==="GOLD"?G.accent:it.rarity==="SPECIAL"?G.accent2:G.muted}}>{it.rarity}</div>
                    <div style={{marginTop:6,fontSize:11,color:it.is_new?G.accent3:G.accent}}>{it.is_new ? "✅ Nueva" : "🔁 Repetida"}</div>
                  </div>
                ))}
              </div>
            )}
          </div><br/>

          <div className="card" style={{marginBottom:12}}>
            <div className="h1" style={{fontSize:16,letterSpacing:2,marginBottom:10}}>ACCIONES RÁPIDAS</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="btn btn-gold" onClick={claimDaily} disabled={busy || !eco?.wallet?.can_claim_daily}>🎁 Reclamar bono diario</button>
              <button className="btn btn-blue" onClick={buyOne} disabled={busy}>🪙 Comprar sobre (100)</button>
              <button className="btn btn-ghost" onClick={openOne} disabled={busy || (stdPack?.quantity ?? 0) < 1}>📦 Abrir 1 sobre</button>
            </div>
          </div>

          <div className="card" style={{marginBottom:12}}>
            <div className="h1" style={{fontSize:16,letterSpacing:2,marginBottom:10}}>CANJEAR CUPÓN</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <input className="input" value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} placeholder="Ej: FAM2026" style={{maxWidth:240}}/>
              <button className="btn btn-blue" onClick={redeem} disabled={busy || !coupon.trim()}>Canjear</button>
            </div>
          </div>

          <div className="card" style={{marginBottom:12}}>
            <div className="h1" style={{fontSize:16,letterSpacing:2,marginBottom:10}}>CANJES RECIENTES</div>
            {couponHistory.length === 0 ? (
              <div style={{fontSize:13,color:G.muted}}>Todavía no tenés canjes registrados.</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {couponHistory.map((row) => (
                  <div key={row.id} className="card2" style={{padding:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <div style={{fontWeight:800,fontSize:13}}>{row.code}</div>
                      <div style={{fontSize:11,color:G.muted}}>{new Date(row.created_at).toLocaleString("es-CR")}</div>
                    </div>
                    <div style={{fontSize:12,color:G.muted,marginTop:4}}>
                      {row.reward?.type === "PACK"
                        ? `Recompensa: +${row.reward.pack_quantity || 0} sobre(s) ${row.reward.pack_type_id || ""}`
                        : row.reward?.type === "COINS"
                          ? `Recompensa: +${row.reward.coins_amount || 0} monedas`
                          : "Recompensa registrada"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── PANEL ADMIN ─────────────────────────────────────────────────────────────
function AdminScreen({ user }) {
  const [users,    setUsers]   = useState([]);
  const [cromos,   setCromos]  = useState({});
  const [stickers, setStickers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState("");
  const [filter,   setFilter]  = useState("all"); // all | active | blocked | admin | super
  const [tab,      setTab]     = useState("users"); // users | stats | album | coupons | audit
  const [stickerSearch, setStickerSearch] = useState("");
  const [couponFilters, setCouponFilters] = useState({
    search: "",
    reward_type: "",
    status: "",
    active: "",
  });
  const [couponForm, setCouponForm] = useState({
    code: "",
    reward_type: "PACK",
    coins_amount: 50,
    pack_type_id: "STD5",
    pack_quantity: 1,
    starts_at: "",
    ends_at: "",
    max_global_uses: "",
    max_per_user: 1,
    active: true,
  });
  const [editingCouponCode, setEditingCouponCode] = useState("");
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [stickerForm, setStickerForm] = useState({
    id: "",
    section: "",
    number: "",
    rarity: "COMMON",
    weight: 100,
    image_path: "",
    active: true,
  });
  const [defaultCoversForm, setDefaultCoversForm] = useState({
    coverFront: "",
    coverBack: "",
  });
  const [savingSticker, setSavingSticker] = useState(false);
  const [savingDefaultCovers, setSavingDefaultCovers] = useState(false);
  const [msg,      setMsg]     = useState("");

  const flash = t => { setMsg(t); setTimeout(()=>setMsg(""),3000); };

  const normalizeCouponPayload = (form) => {
    const rewardType = form.reward_type === "COINS" ? "COINS" : "PACK";
    return {
      code: String(form.code || "").trim().toUpperCase(),
      reward_type: rewardType,
      coins_amount: rewardType === "COINS" ? Number(form.coins_amount || 0) : null,
      pack_type_id: rewardType === "PACK" ? String(form.pack_type_id || "STD5").trim().toUpperCase() : null,
      pack_quantity: rewardType === "PACK" ? Number(form.pack_quantity || 1) : 1,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      max_global_uses: form.max_global_uses === "" ? null : Number(form.max_global_uses),
      max_per_user: Number(form.max_per_user || 1),
      active: !!form.active,
    };
  };

  const resetCouponForm = () => {
    setCouponForm({
      code: "",
      reward_type: "PACK",
      coins_amount: 50,
      pack_type_id: "STD5",
      pack_quantity: 1,
      starts_at: "",
      ends_at: "",
      max_global_uses: "",
      max_per_user: 1,
      active: true,
    });
    setEditingCouponCode("");
  };

  const load = async () => {
    setLoading(true);
    const baseResults = await Promise.allSettled([api.listProfiles(), api.listAllCromos()]);
    const [profilesRes, cromosRes] = baseResults;

    if (profilesRes.status === "fulfilled") {
      setUsers(profilesRes.value || []);
    } else {
      setUsers([]);
      flash(profilesRes.reason?.message || "No se pudo cargar la lista de usuarios.");
    }

    if (cromosRes.status === "fulfilled") {
      const map = {};
      (cromosRes.value || []).forEach(c=>{ map[c.user_id]=normalizeCromosPayload(c); });
      setCromos(map);
    } else {
      setCromos({});
      flash(cromosRes.reason?.message || "No se pudo cargar el inventario global.");
    }

    if (user.is_superuser) {
      const adminResults = await Promise.allSettled([
        api.listAdminStickers(),
        api.listAdminCoupons({ limit: 150 }),
        api.getAdminAlbumCoverDefaults(),
        api.listAuditLogs({ limit: 50 }),
      ]);
      const [stickersRes, couponsRes, coverDefaultsRes, logsRes] = adminResults;

      setStickers(stickersRes.status === "fulfilled" ? (stickersRes.value || []) : []);
      setCoupons(couponsRes.status === "fulfilled" ? (couponsRes.value || []) : []);
      setDefaultCoversForm(coverDefaultsRes.status === "fulfilled" ? {
        coverFront: typeof coverDefaultsRes.value?.coverFront === "string" ? coverDefaultsRes.value.coverFront : "",
        coverBack: typeof coverDefaultsRes.value?.coverBack === "string" ? coverDefaultsRes.value.coverBack : "",
      } : {
        coverFront: "",
        coverBack: "",
      });
      setAuditLogs(logsRes.status === "fulfilled" ? (logsRes.value || []) : []);

      const adminErrors = [stickersRes, couponsRes, coverDefaultsRes, logsRes]
        .filter((r) => r.status === "rejected")
        .map((r) => r.reason?.message)
        .filter(Boolean);
      if (adminErrors.length > 0) flash(adminErrors[0]);
    }

    setLoading(false);
  };

  useEffect(()=>{ load(); },[]);

  const toggleBlock = async (u) => {
    const newVal = !u.blocked;
    await api.updateProfile(u.id, {blocked:newVal});
    setUsers(prev=>prev.map(x=>x.id===u.id?{...x,blocked:newVal}:x));
    flash(`Usuario ${u.name} ${newVal?"bloqueado":"desbloqueado"}.`);
  };

  const toggleAdmin = async (u) => {
    if (u.id === user.id) return flash("No podés quitarte el admin a vos mismo.");
    const newVal = !u.is_admin;
    await api.updateProfile(u.id, {is_admin:newVal});
    setUsers(prev=>prev.map(x=>x.id===u.id?{...x,is_admin:newVal}:x));
    flash(`${u.name} ${newVal?"ahora es admin":"ya no es admin"}.`);
  };

  const toggleSuperuser = async (u) => {
    if (u.id === user.id && u.is_superuser) return flash("No podés quitarte el superusuario a vos mismo.");
    const newVal = !u.is_superuser;
    await api.setUserSuperuser(u.id, newVal);
    setUsers(prev=>prev.map(x=>x.id===u.id?{...x,is_superuser:newVal,is_admin:newVal?true:x.is_admin}:x));
    flash(`${u.name} ${newVal?"ahora es superusuario":"ya no es superusuario"}.`);
  };

  const deleteUser = async (u) => {
    if (!confirm(`¿Seguro que querés eliminar a ${u.name}? Esta acción no se puede deshacer.`)) return;
    await api.deleteUserCromos(u.id);
    await api.deleteProfile(u.id);
    setUsers(prev=>prev.filter(x=>x.id!==u.id));
    flash(`Usuario ${u.name} eliminado.`);
  };

  const loadStickers = async () => {
    if (!user.is_superuser) return;
    const rows = await api.listAdminStickers({ search: stickerSearch });
    setStickers(rows || []);
  };

  const loadAuditLogs = async () => {
    if (!user.is_superuser) return;
    const rows = await api.listAuditLogs({ limit: 100 });
    setAuditLogs(rows || []);
  };

  const loadCoupons = async () => {
    if (!user.is_superuser) return;
    const params = {
      search: couponFilters.search || undefined,
      reward_type: couponFilters.reward_type || undefined,
      status: couponFilters.status || undefined,
      active: couponFilters.active === "" ? undefined : couponFilters.active,
      limit: 200,
    };
    const rows = await api.listAdminCoupons(params);
    setCoupons(rows || []);
  };

  const saveCoupon = async () => {
    if (!user.is_superuser) return;
    const payload = normalizeCouponPayload(couponForm);
    if (!editingCouponCode && !payload.code) return flash("El código del cupón es obligatorio.");
    setSavingCoupon(true);
    try {
      if (editingCouponCode) {
        const updatePayload = { ...payload };
        delete updatePayload.code;
        await api.updateAdminCoupon(editingCouponCode, updatePayload);
        flash(`Cupón ${editingCouponCode} actualizado.`);
      } else {
        await api.createAdminCoupon(payload);
        flash(`Cupón ${payload.code} creado.`);
      }
      await loadCoupons();
      resetCouponForm();
    } catch (e) {
      flash(e.message || "No se pudo guardar el cupón.");
    } finally {
      setSavingCoupon(false);
    }
  };

  const editCoupon = (coupon) => {
    setEditingCouponCode(coupon.code);
    setCouponForm({
      code: coupon.code || "",
      reward_type: coupon.reward_type || "PACK",
      coins_amount: coupon.coins_amount ?? 50,
      pack_type_id: coupon.pack_type_id || "STD5",
      pack_quantity: coupon.pack_quantity || 1,
      starts_at: coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : "",
      ends_at: coupon.ends_at ? new Date(coupon.ends_at).toISOString().slice(0, 16) : "",
      max_global_uses: coupon.max_global_uses ?? "",
      max_per_user: coupon.max_per_user || 1,
      active: !!coupon.active,
    });
    setTab("coupons");
  };

  const toggleCoupon = async (coupon) => {
    if (!user.is_superuser) return;
    try {
      await api.toggleAdminCoupon(coupon.code, !coupon.active);
      await loadCoupons();
      flash(`Cupón ${coupon.code} ${coupon.active ? "desactivado" : "activado"}.`);
    } catch (e) {
      flash(e.message || "No se pudo cambiar estado del cupón.");
    }
  };

  const createEventCoupon = async () => {
    if (!user.is_superuser) return;
    setSavingCoupon(true);
    try {
      const out = await api.createAutoEventCoupon({
        reward_type: "PACK",
        pack_type_id: "STD5",
        pack_quantity: 1,
        duration_hours: 48,
        max_global_uses: 30,
        max_per_user: 1,
      });
      flash(`Cupón evento creado: ${out?.coupon?.code || "OK"}`);
      await loadCoupons();
    } catch (e) {
      flash(e.message || "No se pudo crear cupón evento.");
    } finally {
      setSavingCoupon(false);
    }
  };

  const saveSticker = async () => {
    if (!user.is_superuser) return;
    if (!stickerForm.id.trim() || !stickerForm.section.trim() || !stickerForm.number.trim()) {
      return flash("Completa id, sección y número de la barajita.");
    }

    setSavingSticker(true);
    try {
      await api.upsertAdminSticker({
        id: stickerForm.id.trim().toUpperCase(),
        section: stickerForm.section.trim().toUpperCase(),
        number: stickerForm.number.trim(),
        rarity: stickerForm.rarity,
        weight: Number(stickerForm.weight || 100),
        image_path: stickerForm.image_path || null,
        active: !!stickerForm.active,
      });
      await loadStickers();
      flash("Barajita guardada en el pool.");
    } catch (e) {
      flash(e.message || "No se pudo guardar la barajita.");
    } finally {
      setSavingSticker(false);
    }
  };

  const editSticker = (s) => {
    setStickerForm({
      id: s.id || "",
      section: s.section || "",
      number: s.number || "",
      rarity: s.rarity || "COMMON",
      weight: s.weight || 100,
      image_path: s.image_path || "",
      active: !!s.active,
    });
    setTab("album");
  };

  const toggleStickerActive = async (s) => {
    try {
      await api.updateAdminSticker(s.id, { active: !s.active });
      await loadStickers();
      flash(`Barajita ${s.id} ${s.active ? "desactivada" : "activada"}.`);
    } catch (e) {
      flash(e.message || "No se pudo actualizar estado.");
    }
  };

  const uploadStickerImage = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return flash("El archivo debe ser una imagen.");

    const reader = new FileReader();
    reader.onload = () => setStickerForm((prev) => ({ ...prev, image_path: String(reader.result || "") }));
    reader.readAsDataURL(file);
    ev.target.value = "";
  };

  const uploadDefaultCoverImage = (coverKey, ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return flash("El archivo debe ser una imagen.");
    if (file.size > 1024 * 1024) return flash("La imagen debe pesar máximo 1MB.");

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      setDefaultCoversForm((prev) => ({ ...prev, [coverKey]: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const clearDefaultCoverImage = (coverKey) => {
    setDefaultCoversForm((prev) => ({ ...prev, [coverKey]: "" }));
  };

  const saveDefaultCovers = async () => {
    if (!user.is_superuser) return;
    setSavingDefaultCovers(true);
    try {
      const payload = {
        coverFront: defaultCoversForm.coverFront || "",
        coverBack: defaultCoversForm.coverBack || "",
      };
      const out = await api.updateAdminAlbumCoverDefaults(payload);
      setDefaultCoversForm({
        coverFront: typeof out?.coverFront === "string" ? out.coverFront : "",
        coverBack: typeof out?.coverBack === "string" ? out.coverBack : "",
      });
      flash("Portadas predeterminadas actualizadas.");
    } catch (e) {
      flash(e.message || "No se pudieron guardar las portadas predeterminadas.");
    } finally {
      setSavingDefaultCovers(false);
    }
  };

  const filtered = users.filter(u=>{
    if(filter==="blocked" && !u.blocked) return false;
    if(filter==="active"  &&  u.blocked) return false;
    if(filter==="admin"   && !u.is_admin) return false;
    if(filter==="super"   && !u.is_superuser) return false;
    if(search.trim() && !u.name.toLowerCase().includes(search.toLowerCase()) &&
       !u.username.toLowerCase().includes(search.toLowerCase()) &&
       !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Estadísticas
  const totalUsers   = users.length;
  const blocked      = users.filter(u=>u.blocked).length;
  const withCromos   = users.filter(u=>getOwnedCount(cromos[u.id]||EMPTY_CROMOS)>0).length;
  const withDoubles  = users.filter(u=>getDoubleCount(cromos[u.id]||EMPTY_CROMOS)>0).length;
  const avgPct       = users.length>0 ? Math.round(users.reduce((acc,u)=>{
    const h=getOwnedCount(cromos[u.id]||EMPTY_CROMOS);
    return acc+Math.round((h/TOTAL)*100);
  },0)/users.length) : 0;
  const byProv = PROVINCIAS.reduce((acc,p)=>{
    acc[p] = users.filter(u=>u.provincia===p).length;
    return acc;
  },{});

  return (
    <div className="ani">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div className="h1" style={{fontSize:24,letterSpacing:2}}>🛡️ PANEL ADMIN</div>
        <button className="btn btn-ghost btn-sm" onClick={load}>🔄 Actualizar</button>
      </div>

      {msg && <div className="alert alert-ok ani" style={{marginBottom:14}}>{msg}</div>}

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:18}}>
        {[["users","👥 Usuarios"],["stats","📊 Estadísticas"], ...(user.is_superuser ? [["album","🎴 Álbum/Pools"],["coupons","🎟️ Cupones"],["audit","🧾 Auditoría"]] : [])].map(([k,l])=>(
          <div key={k} className={`nav-item ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</div>
        ))}
      </div>

      {tab==="stats" && (
        <div className="ani">
          {/* Stats globales */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:20}}>
            <div className="stat"><div className="stat-n" style={{color:G.accent}}>{totalUsers}</div><div className="stat-l">USUARIOS TOTAL</div></div>
            <div className="stat"><div className="stat-n" style={{color:G.accent3}}>{withCromos}</div><div className="stat-l">ACTIVOS</div></div>
            <div className="stat"><div className="stat-n" style={{color:G.accent2}}>{withDoubles}</div><div className="stat-l">CON DOBLES</div></div>
            <div className="stat"><div className="stat-n" style={{color:"#E07070"}}>{blocked}</div><div className="stat-l">BLOQUEADOS</div></div>
            <div className="stat"><div className="stat-n" style={{color:G.accent}}>{avgPct}%</div><div className="stat-l">PROGRESO PROM.</div></div>
          </div>

          {/* Por provincia */}
          <div className="card" style={{marginBottom:14}}>
            <div className="h1" style={{fontSize:16,letterSpacing:2,marginBottom:14}}>USUARIOS POR PROVINCIA</div>
            {PROVINCIAS.map(p=>{
              const count = byProv[p]||0;
              const pct   = totalUsers>0?Math.round((count/totalUsers)*100):0;
              return (
                <div key={p} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                    <span style={{color:G.text}}>{p}</span>
                    <span style={{color:G.muted}}>{count} usuarios ({pct}%)</span>
                  </div>
                  <div className="prog-bar">
                    <div className="prog-fill" style={{width:`${pct}%`}}/>
                  </div>
                </div>
              );
            })}
            <div style={{marginTop:10,fontSize:12,color:G.muted}}>
              Sin provincia: {users.filter(u=>!u.provincia).length} usuarios
            </div>
          </div>

          {/* Top usuarios más avanzados */}
          <div className="card">
            <div className="h1" style={{fontSize:16,letterSpacing:2,marginBottom:14}}>🏆 TOP 10 MÁS AVANZADOS</div>
            {[...users].sort((a,b)=>getOwnedCount(cromos[b.id]||EMPTY_CROMOS)-getOwnedCount(cromos[a.id]||EMPTY_CROMOS))
              .slice(0,10).map((u,i)=>{
              const have = getOwnedCount(cromos[u.id]||EMPTY_CROMOS);
              const pct  = Math.round((have/TOTAL)*100);
              return (
                <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,
                  padding:"8px 10px",background:G.bg,borderRadius:9}}>
                  <div style={{width:24,textAlign:"center",fontFamily:"'Barlow Condensed',sans-serif",
                    fontSize:18,fontWeight:900,color:i<3?G.accent:G.muted}}>
                    {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}
                  </div>
                  {u.avatar_url
                    ? <img src={u.avatar_url} style={{width:32,height:32,borderRadius:"50%",objectFit:"cover"}}/>
                    : <div style={{width:32,height:32,borderRadius:"50%",background:G.border,display:"flex",alignItems:"center",justifyContent:"center"}}>👤</div>}
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13}}>{u.name}</div>
                    <div style={{fontSize:11,color:G.muted}}>@{u.username}{u.provincia?` · ${u.provincia}`:""}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{color:G.accent3,fontWeight:700,fontSize:14}}>{pct}%</div>
                    <div style={{fontSize:11,color:G.muted}}>{have}/{TOTAL}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab==="users" && (
        <div className="ani">
          {/* Filtros */}
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <input className="input" placeholder="🔍 Buscar por nombre, usuario o email..."
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{flex:1,minWidth:200}}/>
            <div style={{display:"flex",gap:6}}>
              {[["all","Todos"],["active","Activos"],["blocked","Bloqueados"],["admin","Admins"], ...(user.is_superuser ? [["super","Superusuarios"]] : [])].map(([k,l])=>(
                <button key={k} className="btn btn-sm" onClick={()=>setFilter(k)}
                  style={{background:filter===k?G.accent:G.border,color:filter===k?"#08100a":G.muted}}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div style={{fontSize:12,color:G.muted,marginBottom:10}}>{filtered.length} usuarios</div>

          {loading ? (
            <div style={{display:"flex",justifyContent:"center",padding:40}}><div className="spinner"/></div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {filtered.map(u=>{
                const ud   = cromos[u.id]||EMPTY_CROMOS;
                const have = getOwnedCount(ud);
                const pct  = Math.round((have/TOTAL)*100);
                return (
                  <div key={u.id} className="card" style={{borderColor:u.blocked?"rgba(200,76,76,.3)":u.is_admin?"rgba(201,168,76,.3)":G.border}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        {u.avatar_url
                          ? <img src={u.avatar_url} style={{width:42,height:42,borderRadius:"50%",objectFit:"cover",border:`2px solid ${G.border}`}}/>
                          : <div style={{width:42,height:42,borderRadius:"50%",background:G.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>👤</div>}
                        <div>
                          <div style={{fontWeight:800,fontSize:15,display:"flex",alignItems:"center",gap:6}}>
                            {u.name}
                            {u.is_admin && <span className="badge b-gold" style={{fontSize:10}}>ADMIN</span>}
                            {u.is_superuser && <span className="badge b-blue" style={{fontSize:10}}>SUPERUSER</span>}
                            {u.blocked  && <span className="badge b-red"  style={{fontSize:10}}>BLOQUEADO</span>}
                            {u.id===user.id && <span className="badge b-blue" style={{fontSize:10}}>YO</span>}
                          </div>
                          <div style={{fontSize:12,color:G.muted}}>
                            @{u.username}
                            {u.provincia && ` · 📍 ${u.provincia}${u.canton?`, ${u.canton}`:""}`}
                          </div>
                          {u.whatsapp && <div style={{fontSize:11,color:G.muted}}>📱 {u.whatsapp}</div>}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <button className="btn btn-sm" onClick={()=>toggleSuperuser(u)} disabled={!user.is_superuser || u.id===user.id}
                          style={{background:u.is_superuser?"rgba(76,154,200,.2)":"rgba(76,200,122,.15)",
                            color:u.is_superuser?G.accent2:G.accent3,
                            border:`1px solid ${u.is_superuser?"rgba(76,154,200,.35)":"rgba(76,200,122,.35)"}`}}>
                          {u.is_superuser?"⬇️ Quitar superuser":"⬆️ Hacer superuser"}
                        </button>
                        <button className="btn btn-sm" onClick={()=>toggleAdmin(u)} disabled={!user.is_superuser}
                          style={{background:u.is_admin?"rgba(201,168,76,.2)":"rgba(76,154,200,.15)",
                            color:u.is_admin?G.accent:G.accent2,
                            border:`1px solid ${u.is_admin?"rgba(201,168,76,.4)":"rgba(76,154,200,.3)"}`}}>
                          {u.is_admin?"⬇️ Quitar admin":"⬆️ Hacer admin"}
                        </button>
                        <button className="btn btn-sm" onClick={()=>toggleBlock(u)} disabled={!user.is_superuser}
                          style={{background:u.blocked?"rgba(76,200,122,.15)":"rgba(200,76,76,.15)",
                            color:u.blocked?G.accent3:"#E07070",
                            border:`1px solid ${u.blocked?"rgba(76,200,122,.3)":"rgba(200,76,76,.3)"}`}}>
                          {u.blocked?"✅ Desbloquear":"🚫 Bloquear"}
                        </button>
                        {u.id!==user.id && user.is_superuser && (
                          <button className="btn btn-sm btn-danger" onClick={()=>deleteUser(u)}>
                            🗑️ Eliminar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats del usuario */}
                    <div style={{display:"flex",gap:10,marginTop:12,flexWrap:"wrap"}}>
                      <div style={{flex:1,minWidth:100}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:G.muted,marginBottom:4}}>
                          <span>Progreso álbum</span>
                          <span style={{color:G.accent3,fontWeight:700}}>{pct}% ({have}/{TOTAL})</span>
                        </div>
                        <div className="prog-bar">
                          <div className="prog-fill" style={{width:`${pct}%`}}/>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <span className="badge b-green" style={{fontSize:11}}>{have} pegados</span>
                        <span className="badge b-gold"  style={{fontSize:11}}>{getDoubleCount(ud)} dobles</span>
                        <span className="badge b-red"   style={{fontSize:11}}>{TOTAL-have} faltan</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab==="album" && user.is_superuser && (
        <div className="ani" style={{display:"flex",flexDirection:"column",gap:12}}>
          <div className="card">
            <div className="h1" style={{fontSize:16,letterSpacing:2,marginBottom:12}}>PORTADAS PREDETERMINADAS DEL ÁLBUM</div>
            <div style={{fontSize:12,color:G.muted,marginBottom:10}}>
              Estas imágenes se aplican por defecto a todos los usuarios. Cada usuario puede cambiarlas luego desde su propio álbum.
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div className="card2" style={{padding:10}}>
                <div style={{fontWeight:800,fontSize:13,marginBottom:8}}>Portada frontal</div>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <label className="btn btn-ghost btn-sm" style={{cursor:"pointer"}}>
                    📷 Subir imagen
                    <input type="file" accept="image/*" onChange={(e)=>uploadDefaultCoverImage("coverFront", e)} style={{display:"none"}}/>
                  </label>
                  <button className="btn btn-sm" onClick={()=>clearDefaultCoverImage("coverFront")} style={{background:G.border,color:G.text}}>🧹 Limpiar</button>
                </div>
                <textarea className="input" rows={3} value={defaultCoversForm.coverFront}
                  onChange={e=>setDefaultCoversForm(p=>({...p,coverFront:e.target.value}))}
                  placeholder="Data URL portada frontal"/>
                {defaultCoversForm.coverFront && (
                  <img src={defaultCoversForm.coverFront} alt="Portada frontal"
                    style={{marginTop:8,width:120,height:160,objectFit:"contain",background:G.bg,borderRadius:8,border:`1px solid ${G.border}`}}/>
                )}
              </div>

              <div className="card2" style={{padding:10}}>
                <div style={{fontWeight:800,fontSize:13,marginBottom:8}}>Contraportada</div>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <label className="btn btn-ghost btn-sm" style={{cursor:"pointer"}}>
                    📷 Subir imagen
                    <input type="file" accept="image/*" onChange={(e)=>uploadDefaultCoverImage("coverBack", e)} style={{display:"none"}}/>
                  </label>
                  <button className="btn btn-sm" onClick={()=>clearDefaultCoverImage("coverBack")} style={{background:G.border,color:G.text}}>🧹 Limpiar</button>
                </div>
                <textarea className="input" rows={3} value={defaultCoversForm.coverBack}
                  onChange={e=>setDefaultCoversForm(p=>({...p,coverBack:e.target.value}))}
                  placeholder="Data URL contraportada"/>
                {defaultCoversForm.coverBack && (
                  <img src={defaultCoversForm.coverBack} alt="Contraportada"
                    style={{marginTop:8,width:120,height:160,objectFit:"contain",background:G.bg,borderRadius:8,border:`1px solid ${G.border}`}}/>
                )}
              </div>
            </div>

            <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
              <button className="btn btn-gold btn-sm" onClick={saveDefaultCovers} disabled={savingDefaultCovers}>
                {savingDefaultCovers ? "Guardando..." : "💾 Guardar portadas predeterminadas"}
              </button>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1.1fr 1fr",gap:12}}>
          <div className="card">
            <div className="h1" style={{fontSize:16,letterSpacing:2,marginBottom:12}}>CARGAR BARAJITA AL POOL</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <input className="input" placeholder="ID (ej: CRC01)" value={stickerForm.id}
                onChange={e=>setStickerForm(p=>({...p,id:e.target.value.toUpperCase()}))}/>
              <input className="input" placeholder="Sección (ej: CRC)" value={stickerForm.section}
                onChange={e=>setStickerForm(p=>({...p,section:e.target.value.toUpperCase()}))}/>
              <input className="input" placeholder="Número" value={stickerForm.number}
                onChange={e=>setStickerForm(p=>({...p,number:e.target.value}))}/>
              <input className="input" type="number" min={1} max={10000} placeholder="Peso" value={stickerForm.weight}
                onChange={e=>setStickerForm(p=>({...p,weight:Number(e.target.value||100)}))}/>
              <select className="input" value={stickerForm.rarity}
                onChange={e=>setStickerForm(p=>({...p,rarity:e.target.value}))}>
                <option value="COMMON">COMMON</option>
                <option value="SPECIAL">SPECIAL</option>
                <option value="GOLD">GOLD</option>
              </select>
              <label className="btn btn-ghost btn-sm" style={{justifyContent:"center",cursor:"pointer"}}>
                📷 Subir imagen
                <input type="file" accept="image/*" onChange={uploadStickerImage} style={{display:"none"}}/>
              </label>
            </div>

            <div style={{marginTop:8}}>
              <div style={{fontSize:11,color:G.muted,fontWeight:700,marginBottom:5}}>IMAGE_PATH (URL o Data URL)</div>
              <textarea className="input" rows={3} value={stickerForm.image_path}
                onChange={e=>setStickerForm(p=>({...p,image_path:e.target.value}))}/>
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
              <label style={{fontSize:12,color:G.muted,display:"flex",alignItems:"center",gap:6}}>
                <input type="checkbox" checked={stickerForm.active}
                  onChange={e=>setStickerForm(p=>({...p,active:e.target.checked}))}/>
                Activa para el pool de sobres
              </label>
              <button className="btn btn-gold btn-sm" onClick={saveSticker} disabled={savingSticker}>
                {savingSticker?"Guardando...":"💾 Guardar en pool"}
              </button>
            </div>

            {stickerForm.image_path && (
              <div style={{marginTop:10}}>
                <div style={{fontSize:11,color:G.muted,marginBottom:6}}>Previsualización</div>
                <img src={stickerForm.image_path} alt="preview"
                  style={{width:72,height:96,objectFit:"cover",borderRadius:8,border:`1px solid ${G.border}`}}/>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <input className="input" placeholder="Buscar por id, sección o número" value={stickerSearch}
                onChange={e=>setStickerSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadStickers()}/>
              <button className="btn btn-ghost btn-sm" onClick={loadStickers}>🔎</button>
            </div>
            <div style={{fontSize:12,color:G.muted,marginBottom:8}}>{stickers.length} barajitas en vista</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:540,overflow:"auto",paddingRight:2}}>
              {stickers.map(s=>(
                <div key={s.id} className="card2" style={{padding:10,borderColor:s.active?"rgba(76,200,122,.35)":G.border}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {s.image_path
                        ? <img src={s.image_path} alt={s.id} style={{width:36,height:46,objectFit:"cover",borderRadius:6,border:`1px solid ${G.border}`}}/>
                        : <div style={{width:36,height:46,borderRadius:6,border:`1px dashed ${G.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:G.muted}}>IMG</div>}
                      <div>
                      <div style={{fontWeight:800,fontSize:14}}>{s.id}</div>
                      <div style={{fontSize:11,color:G.muted}}>{s.section} #{s.number} · {s.rarity} · peso {s.weight}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button className="btn btn-sm" onClick={()=>editSticker(s)} style={{background:G.border,color:G.text}}>✏️ Editar</button>
                      <button className="btn btn-sm" onClick={()=>toggleStickerActive(s)}
                        style={{background:s.active?"rgba(200,76,76,.15)":"rgba(76,200,122,.15)",color:s.active?"#E07070":G.accent3}}>
                        {s.active?"⏸️ Desactivar":"▶️ Activar"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {stickers.length===0 && <div style={{fontSize:12,color:G.muted}}>Sin resultados.</div>}
            </div>
          </div>
        </div>
        </div>
      )}

      {tab==="coupons" && user.is_superuser && (
        <div className="ani" style={{display:"grid",gridTemplateColumns:"1.1fr 1fr",gap:12}}>
          <div className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:8,flexWrap:"wrap"}}>
              <div className="h1" style={{fontSize:16,letterSpacing:2}}>{editingCouponCode ? `EDITAR CUPON ${editingCouponCode}` : "CREAR CUPON"}</div>
              <div style={{display:"flex",gap:6}}>
                <button className="btn btn-ghost btn-sm" onClick={resetCouponForm}>↺ Limpiar</button>
                <button className="btn btn-sm" onClick={createEventCoupon} disabled={savingCoupon}
                  style={{background:"rgba(201,168,76,.2)",color:G.accent,border:`1px solid ${G.accent}55`}}>
                  ⚡ Auto evento
                </button>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <input className="input" placeholder="Codigo (ej: FINAL2026)" value={couponForm.code}
                disabled={!!editingCouponCode}
                onChange={e=>setCouponForm(p=>({...p,code:e.target.value.toUpperCase()}))}/>
              <select className="input" value={couponForm.reward_type}
                onChange={e=>setCouponForm(p=>({...p,reward_type:e.target.value}))}>
                <option value="PACK">PACK</option>
                <option value="COINS">COINS</option>
              </select>

              {couponForm.reward_type==="COINS" ? (
                <input className="input" type="number" min={1} placeholder="Monedas" value={couponForm.coins_amount}
                  onChange={e=>setCouponForm(p=>({...p,coins_amount:Number(e.target.value||0)}))}/>
              ) : (
                <input className="input" placeholder="Pack type id" value={couponForm.pack_type_id}
                  onChange={e=>setCouponForm(p=>({...p,pack_type_id:e.target.value.toUpperCase()}))}/>
              )}

              {couponForm.reward_type==="PACK" ? (
                <input className="input" type="number" min={1} placeholder="Cantidad de sobres" value={couponForm.pack_quantity}
                  onChange={e=>setCouponForm(p=>({...p,pack_quantity:Number(e.target.value||1)}))}/>
              ) : (
                <div className="card2" style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:G.muted}}>
                  Cupón de monedas
                </div>
              )}

              <input className="input" type="datetime-local" value={couponForm.starts_at}
                onChange={e=>setCouponForm(p=>({...p,starts_at:e.target.value}))}/>
              <input className="input" type="datetime-local" value={couponForm.ends_at}
                onChange={e=>setCouponForm(p=>({...p,ends_at:e.target.value}))}/>

              <input className="input" type="number" min={1} placeholder="Max usos globales (vacío = sin límite)" value={couponForm.max_global_uses}
                onChange={e=>setCouponForm(p=>({...p,max_global_uses:e.target.value}))}/>
              <input className="input" type="number" min={1} placeholder="Max usos por usuario" value={couponForm.max_per_user}
                onChange={e=>setCouponForm(p=>({...p,max_per_user:Number(e.target.value||1)}))}/>
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
              <label style={{fontSize:12,color:G.muted,display:"flex",alignItems:"center",gap:6}}>
                <input type="checkbox" checked={couponForm.active}
                  onChange={e=>setCouponForm(p=>({...p,active:e.target.checked}))}/>
                Activo para canje
              </label>
              <button className="btn btn-gold btn-sm" onClick={saveCoupon} disabled={savingCoupon}>
                {savingCoupon ? "Guardando..." : editingCouponCode ? "💾 Guardar cambios" : "➕ Crear cupón"}
              </button>
            </div>
          </div>

          <div className="card">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <input className="input" placeholder="Buscar por código" value={couponFilters.search}
                onChange={e=>setCouponFilters(p=>({...p,search:e.target.value}))}
                onKeyDown={e=>e.key==="Enter"&&loadCoupons()}/>
              <select className="input" value={couponFilters.reward_type}
                onChange={e=>setCouponFilters(p=>({...p,reward_type:e.target.value}))}>
                <option value="">Tipo: todos</option>
                <option value="PACK">PACK</option>
                <option value="COINS">COINS</option>
              </select>

              <select className="input" value={couponFilters.status}
                onChange={e=>setCouponFilters(p=>({...p,status:e.target.value}))}>
                <option value="">Estado: todos</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="EXHAUSTED">EXHAUSTED</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
              <select className="input" value={couponFilters.active}
                onChange={e=>setCouponFilters(p=>({...p,active:e.target.value}))}>
                <option value="">Activo: todos</option>
                <option value="true">Solo activos</option>
                <option value="false">Solo inactivos</option>
              </select>
            </div>

            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <button className="btn btn-ghost btn-sm" onClick={loadCoupons}>🔎 Aplicar filtros</button>
              <div style={{fontSize:12,color:G.muted,display:"flex",alignItems:"center"}}>{coupons.length} cupones</div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:560,overflow:"auto",paddingRight:2}}>
              {coupons.map((c)=>(
                <div key={c.code} className="card2" style={{padding:10,borderColor:c.active?"rgba(76,200,122,.25)":G.border}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:14,display:"flex",alignItems:"center",gap:6}}>
                        {c.code}
                        <span className="badge b-blue" style={{fontSize:10}}>{c.reward_type}</span>
                        <span className="badge b-gold" style={{fontSize:10}}>{c.status}</span>
                      </div>
                      <div style={{fontSize:11,color:G.muted,marginTop:2}}>
                        {c.reward_type === "COINS"
                          ? `Recompensa: ${c.coins_amount} monedas`
                          : `Recompensa: ${c.pack_quantity} sobre(s) ${c.pack_type_id}`}
                      </div>
                      <div style={{fontSize:11,color:G.muted}}>
                        Usos: {c.used_count}/{c.max_global_uses ?? "∞"} · por usuario: {c.max_per_user}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button className="btn btn-sm" onClick={()=>editCoupon(c)} style={{background:G.border,color:G.text}}>✏️ Editar</button>
                      <button className="btn btn-sm" onClick={()=>toggleCoupon(c)}
                        style={{background:c.active?"rgba(200,76,76,.15)":"rgba(76,200,122,.15)",color:c.active?"#E07070":G.accent3}}>
                        {c.active ? "⏸️ Desactivar" : "▶️ Activar"}
                      </button>
                    </div>
                  </div>
                  <div style={{fontSize:10,color:G.muted,marginTop:6}}>
                    {c.starts_at ? `inicio: ${new Date(c.starts_at).toLocaleString("es-CR")}` : "sin fecha de inicio"}
                    {" · "}
                    {c.ends_at ? `fin: ${new Date(c.ends_at).toLocaleString("es-CR")}` : "sin fecha de expiración"}
                  </div>
                </div>
              ))}
              {coupons.length===0 && <div style={{fontSize:12,color:G.muted}}>Sin cupones para los filtros seleccionados.</div>}
            </div>
          </div>
        </div>
      )}

      {tab==="audit" && user.is_superuser && (
        <div className="ani card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div className="h1" style={{fontSize:16,letterSpacing:2}}>BITÁCORA DE AUDITORÍA</div>
            <button className="btn btn-ghost btn-sm" onClick={loadAuditLogs}>🔄 Recargar</button>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:560,overflow:"auto",paddingRight:2}}>
            {auditLogs.map((log)=>(
              <div key={log.id} className="card2" style={{padding:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <div style={{fontWeight:800,fontSize:13}}>{log.action}</div>
                  <div style={{fontSize:11,color:G.muted}}>{new Date(log.created_at).toLocaleString("es-CR")}</div>
                </div>
                <div style={{fontSize:12,color:G.muted,marginTop:4}}>
                  actor: {log.actor?.username ? `@${log.actor.username}` : "sistema"} · target: {log.target_type}{log.target_id?`/${log.target_id}`:""}
                </div>
                {log.details && (
                  <pre style={{marginTop:6,fontSize:11,whiteSpace:"pre-wrap",color:G.accent2,background:G.bg,padding:8,borderRadius:8,border:`1px solid ${G.border}`}}>
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            {auditLogs.length===0 && <div style={{fontSize:12,color:G.muted}}>Sin eventos de auditoría.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("cromos");
  const [chatWith, setChatWith] = useState(null); // uid para abrir chat directo
  const [prefersLight, setPrefersLight] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  });
  const themePreference = getThemeModeFromPrefs(user?.album_prefs);
  const themeMode = getEffectiveThemeMode(themePreference, prefersLight);

  useEffect(() => {
    if (themePreference !== "system") return;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const update = (event) => setPrefersLight(event.matches);
    setPrefersLight(mediaQuery.matches);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }
    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, [themePreference]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const vars = getThemeVars(themeMode);
    const root = document.documentElement.style;
    Object.entries(vars).forEach(([key, value]) => {
      root.setProperty(key, value);
    });
  }, [themeMode]);

  const updateThemePreference = async (nextMode) => {
    if (!user) return;
    const nextAlbumPrefs = {
      ...(user.album_prefs && typeof user.album_prefs === "object" ? user.album_prefs : {}),
      theme_mode: nextMode,
    };
    const previousUser = user;
    const nextUser = { ...user, album_prefs: nextAlbumPrefs };
    setUser(nextUser);
    try {
      await api.updateProfile(user.id, { album_prefs: nextAlbumPrefs });
    } catch {
      setUser(previousUser);
    }
  };

  useEffect(()=>{
    const loadSession = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const out = await api.me();
        setUser(out?.profile || null);
      } catch {
        localStorage.removeItem("auth_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  },[]);

  const logout = async () => { localStorage.removeItem("auth_token"); setUser(null); };
  const updateUser = u => setUser(u);

  if(loading) return (
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 0% 0%,var(--app-body-glow-1) 0%,transparent 50%),radial-gradient(ellipse at 100% 100%,var(--app-body-glow-2) 0%,transparent 50%),var(--app-bg)`}}>
        <div style={{textAlign:"center"}}>
          <div className="spinner" style={{margin:"0 auto 16px"}}/>
          <div style={{color:G.muted,fontSize:13}}>Cargando...</div>
        </div>
      </div>
    </>
  );

  if(!user) return (
    <>
      <style>{CSS}</style>
      <AuthScreen onLogin={setUser}/>
    </>
  );

  const TABS = [
    {id:"cromos", label:"⚽ Mi Álbum"},
    {id:"sobres", label:"🎴 Sobres"},
    {id:"mercado",label:"🔄 Mercado"},
    {id:"chat",   label:"💬 Mensajes"},
    {id:"grupos", label:"🏘️ Grupos"},
    {id:"perfil", label:"👤 Perfil"},
    ...((user.is_admin || user.is_superuser) ? [{id:"admin", label:"🛡️ Admin"}] : []),
  ];

  return (
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",
        background:`radial-gradient(ellipse at 0% 0%,var(--app-body-glow-1) 0%,transparent 50%),
                    radial-gradient(ellipse at 100% 100%,var(--app-body-glow-2) 0%,transparent 50%),var(--app-bg)`}}>
        <div style={{borderBottom:`1px solid ${G.border}`,background:`color-mix(in srgb, var(--app-card) 88%, transparent)`,backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:50}}>
          <div style={{maxWidth:APP_LAYOUT_MAX_WIDTH,margin:"0 auto",padding:"10px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>⚽</span>
                <div>
                  <div className="h1" style={{fontSize:15,color:G.accent,letterSpacing:3,lineHeight:1}}>LA BOLSA DE CROMOS</div>
                  <div style={{fontSize:10,color:G.muted,letterSpacing:2,fontWeight:700}}>FIFA WORLD CUP 2026</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",justifyContent:"flex-end"}}>
                <ThemeModeSwitcher themeMode={themePreference} onChange={updateThemePreference} compact />
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700}}>{user.name}</div>
                  {user.city&&<div style={{fontSize:11,color:G.muted}}>📍 {user.city}</div>}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:5}}>
              {TABS.map(t=>(
                <div key={t.id} className={`nav-item ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.label}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{maxWidth:APP_LAYOUT_MAX_WIDTH,margin:"0 auto",padding:"22px 16px"}}>
          {tab==="cromos"  && <CromosScreen user={user}/>}
          {tab==="sobres"  && <SobresScreen user={user}/>}
          {tab==="mercado" && <MercadoScreen user={user} onChat={uid=>{ setChatWith(uid); setTab("chat"); }}/>}
          {tab==="chat"    && <ChatScreen user={user} openWith={chatWith} onChatOpen={()=>setChatWith(null)}/>}
          {tab==="grupos"  && <GroupsScreen user={user} onUserUpdate={updateUser} onChat={uid=>{ setChatWith(uid); setTab("chat"); }}/>}
          {tab==="perfil"  && <ProfileScreen user={user} onUserUpdate={updateUser} onLogout={logout} themeMode={themePreference} onThemeChange={updateThemePreference}/>}
          {tab==="admin"   && (user.is_admin || user.is_superuser) && <AdminScreen user={user}/>}
        </div>
      </div>
    </>
  );
}
