import { useState, useEffect } from "react";
import { api } from "./api";

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

const EMPTY_CROMOS = { quantities:{}, have:[], doubles:[] };

const normalizeCromosPayload = (row) => {
  const quantities = { ...(row?.quantities || {}) };

  if (Object.keys(quantities).length === 0 && Array.isArray(row?.inventory)) {
    (row.inventory || []).forEach((item) => {
      const id = item?.sticker_id || item?.stickerId;
      const qty = Number(item?.quantity || 0);
      if (id && qty > 0) quantities[id] = qty;
    });
  }

  if (Object.keys(quantities).length === 0) {
    (row?.have || []).forEach((id) => { quantities[id] = Math.max(1, Number(quantities[id] || 0)); });
    (row?.doubles || row?.need || []).forEach((id) => { quantities[id] = Math.max(2, Number(quantities[id] || 0)); });
  }

  const have = Object.keys(quantities).filter((id) => Number(quantities[id] || 0) > 0);
  const doubles = Object.keys(quantities).filter((id) => Number(quantities[id] || 0) > 1);
  return { quantities, have, doubles };
};

const getQtyMap = (cromoData) => cromoData?.quantities || {};
const getOwnedIds = (cromoData) => Object.entries(getQtyMap(cromoData))
  .filter(([, qty]) => Number(qty || 0) > 0)
  .map(([id]) => id);
const getDoubleIds = (cromoData) => Object.entries(getQtyMap(cromoData))
  .filter(([, qty]) => Number(qty || 0) > 1)
  .map(([id]) => id);
const getOwnedCount = (cromoData) => getOwnedIds(cromoData).length;
const getDoubleCount = (cromoData) => getDoubleIds(cromoData).length;
const getMissingIds = (cromoData) => {
  const owned = new Set(getOwnedIds(cromoData));
  return ALL_CROMOS.filter((c) => !owned.has(c.id)).map((c) => c.id);
};

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const G = {
  bg:"#080c14", card:"#0f1623", card2:"#161e2e",
  accent:"#C9A84C", accent2:"#4C9AC8", accent3:"#4CC87A",
  danger:"#C84C4C", text:"#EEF2FF", muted:"#6B7A99", border:"#1E2A3E",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:${G.bg};color:${G.text};font-family:'Nunito',sans-serif;min-height:100vh}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${G.bg}}::-webkit-scrollbar-thumb{background:${G.border};border-radius:3px}
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
.b-gold{background:rgba(201,168,76,.18);color:${G.accent};border:1px solid rgba(201,168,76,.35)}
.b-green{background:rgba(76,200,122,.15);color:${G.accent3};border:1px solid rgba(76,200,122,.3)}
.b-red{background:rgba(200,76,76,.15);color:#E07070;border:1px solid rgba(200,76,76,.3)}
.b-blue{background:rgba(76,154,200,.15);color:${G.accent2};border:1px solid rgba(76,154,200,.3)}
.nav-item{padding:7px 15px;border-radius:9px;cursor:pointer;font-weight:700;font-size:13px;transition:all .18s;color:${G.muted};border:1.5px solid transparent}
.nav-item:hover{color:${G.text};background:${G.border}}.nav-item.active{color:#08100a;background:linear-gradient(135deg,#C9A84C,#F0CC70)}
.chip{border-radius:9px;border:1.5px solid ${G.border};cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:all .13s;background:${G.card2};padding:4px 2px;width:4.5cm;min-height:6cm;font-size:10px;font-weight:700;text-align:center;gap:1px}
.chip:hover{transform:scale(1.08);z-index:2}
.chip.need{background:rgba(200,76,76,.22);border-color:#C84C4C;color:#E07070}
.chip.have{background:rgba(76,200,122,.18);border-color:#4CC87A;color:${G.accent3}}
.chip.both{background:rgba(201,168,76,.18);border-color:${G.accent};color:${G.accent}}
.chip-tile{position:relative;overflow:hidden;border-radius:8px;width:100%;height:6cm}
.chip-tile img{width:100%;height:100%;object-fit:cover;display:block;transition:filter .2s, transform .2s}
.chip-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#151f31,#253047);font-size:13px;font-weight:800}
.chip.need .chip-tile img{filter:grayscale(1) brightness(.35) saturate(.3)}
.chip.have .chip-tile img{filter:none}
.chip.both .chip-tile img{filter:saturate(1.15) contrast(1.05)}
.chip-tile .ov{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:3px;font-size:9px;font-weight:800;letter-spacing:.2px}
.chip.need .chip-tile .ov{background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(200,76,76,.4));color:#ffd7d7}
.chip.have .chip-tile .ov{background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(11,39,21,.25));color:#d8ffe7}
.chip.both .chip-tile .ov{background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(201,168,76,.35));color:#fff5d1}
.chip-id{position:absolute;top:3px;left:4px;font-size:8px;font-weight:700;color:#e9eefc;text-shadow:0 1px 2px rgba(0,0,0,.8)}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;z-index:999;padding:16px;backdrop-filter:blur(6px)}
.modal{background:${G.card};border:1px solid ${G.border};border-radius:18px;padding:26px;max-width:460px;width:100%;max-height:88vh;overflow-y:auto}
.stat{background:${G.card2};border-radius:11px;padding:12px 10px;text-align:center;border:1px solid ${G.border}}
.stat-n{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:30px;line-height:1}
.stat-l{font-size:10px;color:${G.muted};font-weight:700;margin-top:3px;letter-spacing:.5px}
.match-row{background:linear-gradient(135deg,rgba(76,154,200,.07),rgba(76,200,122,.05));border:1px solid rgba(76,154,200,.25);border-radius:12px;padding:15px}
.prog-bar{height:6px;border-radius:3px;background:${G.border};overflow:hidden}
.prog-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,${G.accent},${G.accent2})}
.alert{padding:9px 13px;border-radius:9px;font-size:13px;font-weight:600}
.alert-err{background:rgba(200,76,76,.15);border:1px solid rgba(200,76,76,.35);color:#E07070}
.alert-ok{background:rgba(76,200,122,.13);border:1px solid rgba(76,200,122,.3);color:${G.accent3}}
.spinner{width:36px;height:36px;border:3px solid ${G.border};border-top-color:${G.accent};border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.ani{animation:up .25s ease}
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
          <div style={{fontSize:52,marginBottom:6}}>⚽</div>
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
  const [data, setData]     = useState(EMPTY_CROMOS);
  const [sec,  setSec]      = useState(SECTIONS[0].id);
  const [filterMode, setFilterMode] = useState("all"); // all | missing | have | doubles
  const [stickerImgMap, setStickerImgMap] = useState({});

  useEffect(()=>{
    api.getUserCromos(user.id)
      .then((d)=>{
        if (d) setData(normalizeCromosPayload(d));
      })
      .catch(()=>{});
  },[user.id]);

  useEffect(() => {
    api.listStickerCatalog()
      .then((rows) => {
        const map = {};
        (rows || []).forEach((r) => {
          if (r?.id) map[r.id] = r.image_path || null;
        });
        setStickerImgMap(map);
      })
      .catch(() => {});
  }, []);

  const secInfo      = SECTIONS.find(s => s.id === sec);
  const secCromos    = ALL_CROMOS.filter(c => c.section === sec);
  const getQty = (id) => Number(data.quantities?.[id] || 0);
  const secHave      = secCromos.filter(c => getQty(c.id) > 0).length;
  const secPct       = Math.round((secHave / secInfo.count) * 100);
  const totalHave    = getOwnedCount(data);
  const totalPct     = Math.round((totalHave / TOTAL) * 100);
  const totalMissing = TOTAL - totalHave;

  const buildStickerImageCandidates = (sticker) => {
    const explicit = stickerImgMap[sticker.id] || null;
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

  const onStickerImgError = (ev) => {
    const img = ev.currentTarget;
    const paths = (img.dataset.fallbacks || "").split("|").filter(Boolean);
    const currentIdx = Number(img.dataset.fidx || "0");
    const nextIdx = currentIdx + 1;

    if (nextIdx < paths.length) {
      img.dataset.fidx = String(nextIdx);
      img.src = paths[nextIdx];
      return;
    }

    img.style.display = "none";
    const fallback = img.nextElementSibling;
    if (fallback) fallback.style.display = "flex";
  };

  const descargar = () => {
    const W = 1400;
    const COLS = 20; // columnas fijas como la planilla
    const COL_W = 58, COL_H = 28, GAP = 2, MARGIN = 16;
    const ROW_H = COL_H + GAP;
    const LABEL_W = 180; // ancho columna de país
    const gridW = COLS * (COL_W + GAP) - GAP;
    const totalW = LABEL_W + GAP + gridW + MARGIN * 2;

    function rr(ctx, x, y, w, h, r=4){
      ctx.beginPath();
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
      ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
      ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
      ctx.closePath();
    }

    // Calcular altura: header + 1 fila por sección + leyenda + footer
    const HEADER_H = 130;
    const LEGEND_H = 50;
    const FOOTER_H = 40;
    const H = HEADER_H + SECTIONS.length * (ROW_H + 2) + LEGEND_H + FOOTER_H + 20;

    const canvas = document.createElement("canvas");
    canvas.width = totalW; canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Fondo general oscuro (igual que el PDF: blanco, pero hacemos oscuro para verse bien digital)
    ctx.fillStyle = "#0f1923"; ctx.fillRect(0,0,totalW,H);

    // ── HEADER ──
    // Franja verde oscura superior
    ctx.fillStyle = "#1a2d1a"; ctx.fillRect(0,0,totalW,HEADER_H);

    // Línea decorativa
    ctx.fillStyle = "#C9A84C"; ctx.fillRect(0,HEADER_H-4,totalW,4);

    // Logo ⚽ y título
    ctx.font = "bold 52px 'Arial Black',Arial"; ctx.fillStyle="#ffffff"; ctx.textAlign="left";
    ctx.fillText("⚽",MARGIN,82);

    ctx.fillStyle="#ffffff";
    ctx.font="bold 38px 'Arial Black',Arial"; ctx.textAlign="left";
    ctx.fillText("PLANILLA DE CONTROL",MARGIN+70,52);
    ctx.font="bold 22px Arial"; ctx.fillStyle="#C9A84C";
    ctx.fillText("MUNDIAL 2026 · FIFA WORLD CUP 2026",MARGIN+70,82);
    ctx.font="18px Arial"; ctx.fillStyle="#aaaaaa";
    ctx.fillText(`${user.name}${user.provincia?` · 📍 ${user.provincia}${user.canton?`, ${user.canton}`:""}`:""} · ${new Date().toLocaleDateString("es-CR")}`,MARGIN+70,108);

    // Stats a la derecha
    const statsX = totalW - 420;
    ctx.fillStyle="#ffffff22"; rr(ctx,statsX,14,400,HEADER_H-24,8); ctx.fill();
    const sd=[
      {l:"TENGO",    v:totalHave,    c:"#4CC87A"},
      {l:"FALTAN",   v:totalMissing, c:"#ff6666"},
      {l:"DOBLES",   v:getDoubleCount(data),c:"#44aaff"},
      {l:"PROGRESO", v:`${totalPct}%`,c:"#C9A84C"},
    ];
    sd.forEach((s,i)=>{
      const x=statsX+10+i*98;
      ctx.fillStyle=s.c; ctx.font="bold 30px Arial"; ctx.textAlign="center";
      ctx.fillText(s.v,x+44,64);
      ctx.fillStyle="#aaaaaa"; ctx.font="bold 13px Arial";
      ctx.fillText(s.l,x+44,84);
    });

    // ── TABLA ──
    let curY = HEADER_H + 6;

    // Cabecera de columnas (números 1-20)
    ctx.fillStyle="#1e3a5f"; ctx.fillRect(MARGIN,curY,totalW-MARGIN*2,ROW_H);
    // Etiqueta vacía para columna de países
    ctx.fillStyle="#C9A84C"; ctx.font="bold 13px Arial"; ctx.textAlign="center";
    ctx.fillText("SELECCIÓN",MARGIN+LABEL_W/2,curY+ROW_H-8);
    // Números de columna
    for(let c=1;c<=COLS;c++){
      const cx=MARGIN+LABEL_W+GAP+(c-1)*(COL_W+GAP);
      ctx.fillStyle="#7aaadd"; ctx.font="bold 13px Arial"; ctx.textAlign="center";
      ctx.fillText(c,cx+COL_W/2,curY+ROW_H-8);
    }
    curY+=ROW_H+2;

    // Filas de selecciones
    SECTIONS.forEach((sec,si)=>{
      const rowBg = si%2===0?"#111d2e":"#0d1826";
      ctx.fillStyle=rowBg; ctx.fillRect(MARGIN,curY,totalW-MARGIN*2,ROW_H);

      // Celda de país
      ctx.fillStyle=sec.color+"33";
      ctx.fillRect(MARGIN,curY,LABEL_W,ROW_H);
      ctx.strokeStyle=sec.color+"66"; ctx.lineWidth=1;
      ctx.strokeRect(MARGIN+0.5,curY+0.5,LABEL_W-1,ROW_H-1);

      // Texto país (flag + nombre corto)
      ctx.fillStyle="#ffffff"; ctx.font="bold 13px Arial"; ctx.textAlign="left";
      const shortName = sec.name.length>14?sec.name.slice(0,13)+"…":sec.name;
      ctx.fillText(`${sec.flag} ${shortName}`,MARGIN+6,curY+ROW_H-8);

      // Celdas de cromos
      const secCromos = ALL_CROMOS.filter(c=>c.section===sec.id);
      for(let ci=0;ci<COLS;ci++){
        const cromo = secCromos[ci];
        const cx = MARGIN+LABEL_W+GAP+ci*(COL_W+GAP);

        if(!cromo){
          // Celda vacía (si la sección tiene <20 cromos)
          ctx.fillStyle="#0a1020"; ctx.fillRect(cx,curY,COL_W,ROW_H);
          continue;
        }

        const qty    = getQty(cromo.id);
        const have   = qty > 0;
        const dbl    = qty > 1;
        const missed = !have;

        let bg, tc, border;
        if(dbl)    { bg="#002244"; tc="#44aaff"; border="#44aaff88"; }
        else if(have) { bg="#003322"; tc="#4CC87A"; border="#4CC87A88"; }
        else        { bg="#2a0a0a"; tc="#ff6666"; border="#ff666666"; }

        ctx.fillStyle=bg; ctx.fillRect(cx,curY,COL_W,ROW_H);
        ctx.strokeStyle=border; ctx.lineWidth=1;
        ctx.strokeRect(cx+0.5,curY+0.5,COL_W-1,ROW_H-1);

        // ID del cromo
        ctx.fillStyle=tc; ctx.font="bold 12px Arial"; ctx.textAlign="center";
        ctx.fillText(cromo.id,cx+COL_W/2,curY+ROW_H-8);
      }

      // Línea separadora entre filas
      ctx.strokeStyle="#ffffff11"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(MARGIN,curY+ROW_H); ctx.lineTo(totalW-MARGIN,curY+ROW_H); ctx.stroke();

      curY+=ROW_H+2;
    });

    // ── LEYENDA ──
    curY+=8;
    ctx.fillStyle="#1e3a5f"; ctx.fillRect(MARGIN,curY,totalW-MARGIN*2,LEGEND_H);
    const leyenda=[
      {bg:"#003322",tc:"#4CC87A",border:"#4CC87A88",label:"Ya lo tengo pegado"},
      {bg:"#2a0a0a",tc:"#ff6666",border:"#ff666666",label:"Me falta"},
      {bg:"#002244",tc:"#44aaff",border:"#44aaff88",label:"Tengo doble (para intercambiar)"},
    ];
    let lx=MARGIN+16;
    ctx.font="14px Arial"; ctx.textAlign="left";
    leyenda.forEach(({bg,tc,border,label})=>{
      ctx.fillStyle=bg; ctx.fillRect(lx,curY+12,60,26);
      ctx.strokeStyle=border; ctx.lineWidth=1; ctx.strokeRect(lx+0.5,curY+12.5,59,25);
      ctx.fillStyle=tc; ctx.font="bold 12px Arial"; ctx.textAlign="center";
      ctx.fillText("CROMO",lx+30,curY+29);
      ctx.fillStyle="#cccccc"; ctx.font="14px Arial"; ctx.textAlign="left";
      ctx.fillText(label,lx+68,curY+29);
      lx+=260;
    });

    // ── FOOTER ──
    curY+=LEGEND_H+4;
    ctx.fillStyle="#C9A84C"; ctx.fillRect(0,curY,totalW,4);
    ctx.fillStyle="#1a2d1a"; ctx.fillRect(0,curY+4,totalW,FOOTER_H);
    ctx.fillStyle="#C9A84C"; ctx.font="bold 16px Arial"; ctx.textAlign="center";
    ctx.fillText("⚽  labolsadecromos.vercel.app  ·  ¡Encontrá con quién intercambiar cerca tuyo!  ⚽",totalW/2,curY+4+FOOTER_H/2+6);

    // Descargar JPG
    canvas.toBlob(blob=>{
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=`planilla_${user.username}_${Date.now()}.jpg`;
      a.click(); URL.revokeObjectURL(url);
    },"image/jpeg",0.95);
  };

  function roundRect(ctx,x,y,w,h,r=6){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }

    const THEMES = [
      { name:"Oro",      bg:"#0a0800", header:"#C9A84C", headerText:"#0a0800", secBg:"#1a1200", secText:"#FFD700", needBg:"#3d2800", needText:"#FFD700", haveBg:"#1a3300", haveText:"#4CC87A", dblBg:"#002233", dblText:"#00BFFF" },
      { name:"Azul",     bg:"#00051a", header:"#1a4dff", headerText:"#ffffff", secBg:"#000d33", secText:"#7aadff", needBg:"#1a0033", needText:"#cc88ff", haveBg:"#001a33", haveText:"#00ffcc", dblBg:"#001a00", dblText:"#4CC87A" },
      { name:"Verde",    bg:"#001a00", header:"#006600", headerText:"#ffffff", secBg:"#002200", secText:"#66ff66", needBg:"#330000", needText:"#ff6666", haveBg:"#003300", haveText:"#00ff44", dblBg:"#001a33", dblText:"#44aaff" },
      { name:"Rojo",     bg:"#1a0000", header:"#cc0000", headerText:"#ffffff", secBg:"#2a0000", secText:"#ff6666", needBg:"#330a00", needText:"#ffaa44", haveBg:"#002200", haveText:"#44ff88", dblBg:"#000033", dblText:"#88aaff" },
      { name:"Galaxia",  bg:"#0d0020", header:"#6600cc", headerText:"#ffffff", secBg:"#1a0033", secText:"#cc88ff", needBg:"#1a1a00", needText:"#ffff44", haveBg:"#001a1a", haveText:"#44ffff", dblBg:"#1a0000", dblText:"#ff6666" },
      { name:"Atardecer",bg:"#1a0800", header:"#cc5500", headerText:"#ffffff", secBg:"#2a1000", secText:"#ffaa44", needBg:"#001a1a", needText:"#44ffff", haveBg:"#1a2200", haveText:"#88ff44", dblBg:"#1a001a", dblText:"#ff88ff" },
      { name:"Cian",     bg:"#001a1a", header:"#007a7a", headerText:"#ffffff", secBg:"#002222", secText:"#00ffff", needBg:"#1a0000", needText:"#ff6666", haveBg:"#001a00", haveText:"#66ff88", dblBg:"#1a1a00", dblText:"#ffff44" },
      { name:"Rosa",     bg:"#1a0012", header:"#cc0066", headerText:"#ffffff", secBg:"#2a0020", secText:"#ff66cc", needBg:"#001a00", needText:"#66ff88", haveBg:"#001a1a", haveText:"#44ffff", dblBg:"#1a1a00", dblText:"#ffff44" },
      { name:"Plata",    bg:"#0a0f1a", header:"#334466", headerText:"#ffffff", secBg:"#111827", secText:"#aabbcc", needBg:"#1a0000", needText:"#ff8888", haveBg:"#001a00", haveText:"#88ff88", dblBg:"#001a1a", dblText:"#88ffff" },
      { name:"Dorado",   bg:"#0f0a00", header:"#aa7700", headerText:"#ffffff", secBg:"#1a1200", secText:"#ffcc44", needBg:"#1a0000", needText:"#ff6666", haveBg:"#001a00", haveText:"#66ff88", dblBg:"#001a2a", dblText:"#44aaff" },
    ];
  return (
    <div className="ani">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div className="h1" style={{fontSize:24,letterSpacing:2}}>MI ÁLBUM — <span style={{color:G.accent}}>{user.name}</span></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button className="btn btn-ghost btn-sm" onClick={descargar} title="Descargar lista de cromos">
            📥 Descargar lista
          </button>
        </div>
      </div>

      {/* Stats globales */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
        <div className="stat"><div className="stat-n" style={{color:G.accent}}>{TOTAL}</div><div className="stat-l">TOTAL ÁLBUM</div></div>
        <div className="stat"><div className="stat-n" style={{color:G.accent3}}>{totalHave}</div><div className="stat-l">TENGO</div></div>
        <div className="stat"><div className="stat-n" style={{color:"#E07070"}}>{totalMissing}</div><div className="stat-l">ME FALTAN</div></div>
        <div className="stat"><div className="stat-n" style={{color:G.accent2}}>{totalPct}%</div><div className="stat-l">COMPLETADO</div></div>
      </div>

      {/* Barra progreso global */}
      <div style={{marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:G.muted,marginBottom:5}}>
          <span>Progreso total del álbum</span>
          <span style={{color:G.accent,fontWeight:700}}>{totalPct}%</span>
        </div>
        <div className="prog-bar" style={{height:10,borderRadius:5}}>
          <div className="prog-fill" style={{width:`${totalPct}%`,transition:"width .4s"}}/>
        </div>
      </div>

      {/* Estado digital */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14,alignItems:"center",
        background:G.card2,borderRadius:10,padding:"10px 14px",border:`1px solid ${G.border}`}}>
        <span style={{fontSize:12,color:G.muted,fontWeight:700}}>¿Cómo funciona?</span>
        <span style={{fontSize:12,color:G.muted}}>
          <span style={{background:"rgba(76,200,122,.2)",border:"1px solid #4CC87A",borderRadius:5,padding:"2px 7px",color:G.accent3,fontWeight:700,marginRight:4}}>Cantidad 1</span>
          Lo tengo
        </span>
        <span style={{fontSize:12,color:G.muted}}>
          <span style={{background:"rgba(201,168,76,.2)",border:"1px solid #C9A84C",borderRadius:5,padding:"2px 7px",color:G.accent,fontWeight:700,marginRight:4}}>Cantidad 2+</span>
          Repetidas digitales
        </span>
        <span style={{fontSize:12,color:G.muted}}>
          <span style={{background:"rgba(200,76,76,.2)",border:"1px solid #C84C4C",borderRadius:5,padding:"2px 7px",color:"#E07070",fontWeight:700,marginRight:4}}>Cantidad 0</span>
          Falta
        </span>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          {[["all","Todos"],["missing","Me faltan"],["have","Tengo"],["doubles","Dobles"]].map(([k,l])=>(
            <button key={k} className="btn btn-sm" onClick={()=>setFilterMode(k)}
              style={{background:filterMode===k?G.accent:G.border,color:filterMode===k?"#08100a":G.muted}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de selección/país */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
        {SECTIONS.map(s=>{
          const sCromos  = ALL_CROMOS.filter(c=>c.section===s.id);
          const sGot     = sCromos.filter(c=>getQty(c.id) > 0).length;
          const sPct     = Math.round((sGot/s.count)*100);
          const sDoubles = sCromos.filter(c=>getQty(c.id) > 1).length;
          const active   = sec===s.id;
          const complete = sPct===100;
          return (
            <button key={s.id} onClick={()=>setSec(s.id)}
              style={{padding:"5px 10px",borderRadius:8,
                border:`2px solid ${active?s.color:complete?"rgba(76,200,122,.5)":"transparent"}`,
                background:active?`${s.color}20`:complete?"rgba(76,200,122,.08)":G.border,
                color:active?s.color:complete?G.accent3:G.muted,
                cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"Nunito",transition:"all .15s",
                display:"flex",alignItems:"center",gap:4}}>
              {complete?"✅":s.flag} {s.name}
              <span style={{fontSize:10,opacity:.8}}>{sPct}%</span>
              {sDoubles>0&&<span style={{background:"rgba(201,168,76,.3)",color:G.accent,borderRadius:10,padding:"0 5px",fontSize:10}}>{sDoubles}×2</span>}
            </button>
          );
        })}
      </div>

      {/* Grid de cromos */}
      <div className="card" style={{padding:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <span style={{fontSize:22}}>{secInfo.flag}</span>
          <div className="h1" style={{fontSize:20,letterSpacing:2}}>{secInfo.name}</div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:G.muted}}>
              <span style={{color:G.accent3,fontWeight:700}}>{secHave}</span>/{secInfo.count} pegados
              {secCromos.filter(c=>getQty(c.id) > 1).length>0&&
                <span style={{color:G.accent,marginLeft:8}}>· {secCromos.filter(c=>getQty(c.id) > 1).length} dobles</span>}
            </span>
          </div>
        </div>

        {/* Barra progreso sección */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:G.muted,marginBottom:4}}>
            <span>{secInfo.name}</span>
            <span style={{color:secPct===100?G.accent3:G.accent,fontWeight:700}}>{secPct}%{secPct===100?" ✅ ¡Completo!":""}</span>
          </div>
          <div className="prog-bar">
            <div className="prog-fill" style={{width:`${secPct}%`,
              background:secPct===100?"linear-gradient(90deg,#4CC87A,#06D6A0)":"linear-gradient(90deg,#C9A84C,#4C9AC8)",
              transition:"width .3s"}}/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(4.5cm, 4.5cm))",gap:8,justifyContent:"center"}}>
          {secCromos.map(c=>{
            const qty      = getQty(c.id);
            const got      = qty > 0;
            const isDouble = qty > 1;

            if(filterMode==="missing" && got)       return null;
            if(filterMode==="have"    && !got)      return null;
            if(filterMode==="doubles" && !isDouble) return null;

            const cls = isDouble?"both":got?"have":"need";

            const state = isDouble ? `x${qty} Repetida` : got ? "✓ Tengo" : "✗ Falta";
            const imageCandidates = buildStickerImageCandidates(c);
            const firstImage = imageCandidates[0] || null;

            return (
              <div key={c.id} className={`chip ${cls}`}
                onContextMenu={e=>e.preventDefault()}
                style={{userSelect:"none",WebkitUserSelect:"none",cursor:"default"}}
                title={`${c.id} — ${state}`}>
                <div className="chip-tile">
                  {firstImage ? (
                    <>
                      <img src={firstImage} alt={c.id} data-fidx="0" data-fallbacks={imageCandidates.join("|")} onError={onStickerImgError}/>
                      <div className="chip-fallback" style={{display:"none"}}>{c.num}</div>
                    </>
                  ) : (
                    <div className="chip-fallback">{c.num}</div>
                  )}
                  <span className="chip-id">{secInfo.id}</span>
                  <div className="ov">
                    {!got ? "FALTA" : isDouble ? `DOBLE x${qty}` : "TENGO"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{marginTop:12,fontSize:11,color:G.muted,display:"flex",gap:14,flexWrap:"wrap"}}>
          <span><span style={{color:"#E07070"}}>■</span> Falta (cantidad 0)</span>
          <span><span style={{color:G.accent3}}>■</span> Lo tengo (cantidad 1)</span>
          <span><span style={{color:G.accent}}>■</span> Repetidas (cantidad 2 o más)</span>
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
    if(!user.groups||user.groups.length===0){ setGroups([]); setLoading(false); return; }
    const data = await api.listGroupsByIds(user.groups);
    setGroups(data||[]);
    setLoading(false);
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
    if(detail?.id===gid) setDetail(null);
    flash("Saliste del grupo.");
  };

  if(detail) return <GroupDetail group={detail} user={user} onBack={()=>setDetail(null)} onLeave={leaveGroup} onChat={onChat}/>;

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
              <div key={g.id} className="card" style={{cursor:"pointer",borderColor:`${t.color}33`}} onClick={()=>setDetail(g)}>
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
function GroupDetail({ group, user, onBack, onLeave, onChat }) {
  const URGENT_TRADE_MS = 15 * 60 * 1000;
  const TRADE_REFRESH_MS = 30 * 1000;
  const [tab, setTab]       = useState("matches");
  const [members, setMembers] = useState([]);
  const [cromos,  setCromos]  = useState({});
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState([]);
  const [tradeFilter, setTradeFilter] = useState("all");
  const [pendingForMe, setPendingForMe] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());
  const [busyTrade, setBusyTrade] = useState(false);
  const [msg, setMsg] = useState({ t:"", k:"" });

  const flash = (t,k="ok")=>{ setMsg({t,k}); setTimeout(()=>setMsg({t:"",k:""}),3000); };

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

  const proposeTrade = async (member, iGive, theyGive) => {
    const give = iGive.slice(0, 5);
    const receive = theyGive.slice(0, 5);
    if (give.length === 0 && receive.length === 0) return;

    setBusyTrade(true);
    try {
      await api.proposeTrade({ to_user_id: member.id, give_ids: give, receive_ids: receive });
      flash("Propuesta de trueque enviada", "ok");
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

      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {["matches","trades","members"].map(tb=>(
          <div key={tb} className={`nav-item ${tab===tb?"active":""}`} onClick={()=>setTab(tb)}>
            {tb==="matches"?"🔄 Intercambios posibles":tb==="trades"?`🤝 Trueques${pendingForMe>0?` (${pendingForMe})`:""}`:"👥 Miembros"}
          </div>
        ))}
      </div>

      {msg.t && <div className={`alert alert-${msg.k}`} style={{marginBottom:12}}>{msg.t}</div>}

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
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {["all","PENDING","ACCEPTED","REJECTED","CANCELLED","EXPIRED"].map((f)=>(
                <button key={f} className="btn btn-sm" onClick={()=>setTradeFilter(f)}
                  style={{background:tradeFilter===f?G.accent:G.border,color:tradeFilter===f?"#08100a":G.muted}}>
                  {f==="all"?"Todos":f}
                </button>
              ))}
            </div>

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
function ProfileScreen({ user, onUserUpdate, onLogout }) {
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

  const save = async () => {
    await api.updateProfile(user.id, {city:city.trim(),whatsapp:whatsapp.trim(),provincia,canton:canton.trim()});
    onUserUpdate({...user,city:city.trim(),whatsapp:whatsapp.trim(),provincia,canton:canton.trim()});
    setSaved(true); setTimeout(()=>setSaved(false),2000);
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
          <option value="">{includeTodas?"Todas las provincias":"Seleccioná..."}</option>
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

  return (
    <div className="ani">
      <div className="h1" style={{fontSize:24,letterSpacing:2,marginBottom:6}}>MERCADO DE INTERCAMBIOS</div>
      <div style={{color:G.muted,fontSize:13,marginBottom:18}}>Encontrá usuarios para intercambiar sin necesidad de estar en el mismo grupo.</div>

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
                        style={{width:"100%",height:110,objectFit:"cover",borderRadius:8,marginBottom:8,border:`1px solid ${G.border}`}}/>
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
                        style={{width:"100%",height:110,objectFit:"cover",borderRadius:8,marginBottom:8,border:`1px solid ${G.border}`}}/>
                    )}
                    <div style={{fontWeight:800,fontSize:16}}>{it.sticker_id}</div>
                    <div style={{fontSize:11,color:it.rarity==="GOLD"?G.accent:it.rarity==="SPECIAL"?G.accent2:G.muted}}>{it.rarity}</div>
                    <div style={{marginTop:6,fontSize:11,color:it.is_new?G.accent3:G.accent}}>{it.is_new ? "✅ Nueva" : "🔁 Repetida"}</div>
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
  const [savingSticker, setSavingSticker] = useState(false);
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
    const reqs = [api.listProfiles(), api.listAllCromos()];
    if (user.is_superuser) reqs.push(api.listAdminStickers(), api.listAdminCoupons({ limit: 150 }));
    const [profs, crms, sts, cps] = await Promise.all(reqs);
    const map = {};
    (crms||[]).forEach(c=>{ map[c.user_id]=normalizeCromosPayload(c); });
    setUsers(profs||[]);
    setCromos(map);
    if (user.is_superuser) {
      setStickers(sts||[]);
      setCoupons(cps||[]);
      const logs = await api.listAuditLogs({ limit: 50 });
      setAuditLogs(logs || []);
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
                      <div style={{flex:1,minWidth:200}}>
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
        <div className="ani" style={{display:"grid",gridTemplateColumns:"1.1fr 1fr",gap:12}}>
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
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:G.bg}}>
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
        background:`radial-gradient(ellipse at 0% 0%,rgba(201,168,76,.06) 0%,transparent 50%),
                    radial-gradient(ellipse at 100% 100%,rgba(76,154,200,.05) 0%,transparent 50%),${G.bg}`}}>
        <div style={{borderBottom:`1px solid ${G.border}`,background:`${G.card}dd`,backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:50}}>
          <div style={{maxWidth:960,margin:"0 auto",padding:"10px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>⚽</span>
                <div>
                  <div className="h1" style={{fontSize:15,color:G.accent,letterSpacing:3,lineHeight:1}}>LA BOLSA DE CROMOS</div>
                  <div style={{fontSize:10,color:G.muted,letterSpacing:2,fontWeight:700}}>FIFA WORLD CUP 2026</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:700}}>{user.name}</div>
                {user.city&&<div style={{fontSize:11,color:G.muted}}>📍 {user.city}</div>}
              </div>
            </div>
            <div style={{display:"flex",gap:5}}>
              {TABS.map(t=>(
                <div key={t.id} className={`nav-item ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.label}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{maxWidth:960,margin:"0 auto",padding:"22px 16px"}}>
          {tab==="cromos"  && <CromosScreen user={user}/>}
          {tab==="sobres"  && <SobresScreen user={user}/>}
          {tab==="mercado" && <MercadoScreen user={user} onChat={uid=>{ setChatWith(uid); setTab("chat"); }}/>}
          {tab==="chat"    && <ChatScreen user={user} openWith={chatWith} onChatOpen={()=>setChatWith(null)}/>}
          {tab==="grupos"  && <GroupsScreen user={user} onUserUpdate={updateUser} onChat={uid=>{ setChatWith(uid); setTab("chat"); }}/>}
          {tab==="perfil"  && <ProfileScreen user={user} onUserUpdate={updateUser} onLogout={logout}/>}
          {tab==="admin"   && (user.is_admin || user.is_superuser) && <AdminScreen user={user}/>}
        </div>
      </div>
    </>
  );
}
