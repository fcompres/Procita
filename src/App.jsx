import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://htadelbjzgnrglackutq.supabase.co";
const SUPABASE_KEY = "sb_publishable_150CaBmtYRRl6jpI_aySng_SO4gxu-l";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const BIZ_TYPES = [
  { key:"barberia", label:"Barbería",           icon:"✂️", color:"#E8C547" },
  { key:"salon",    label:"Salón de Belleza",    icon:"💇", color:"#F472B6" },
  { key:"unas",     label:"Centro de Uñas",      icon:"💅", color:"#A78BFA" },
  { key:"mixto",    label:"Centro de Belleza",   icon:"✨", color:"#4ECDC4" },
  { key:"masajes",  label:"Masajes / Spa",        icon:"💆", color:"#34D399" },
  { key:"domicilio",label:"Servicios a Domicilio",icon:"🏠", color:"#60A5FA" },
];
const ROLES = {
  barberia: ["Barbero","Aprendiz","Encargado"],
  salon:    ["Estilista","Colorista","Asistente","Encargada"],
  unas:     ["Técnica de Uñas","Manicurista","Encargada"],
  mixto:    ["Estilista","Barbero","Técnica de Uñas","Encargado/a"],
  masajes:  ["Masajista","Terapeuta","Esteticista","Encargado/a"],
  domicilio:["Profesional","Estilista","Barbero","Técnica","Terapeuta"],
};
const STATION = { barberia:"Silla", salon:"Silla", unas:"Mesa", mixto:"Puesto", masajes:"Camilla", domicilio:"Puesto" };
const COLORS  = ["#E8C547","#4ECDC4","#FF6B6B","#A78BFA","#F97316","#34D399","#F472B6","#60A5FA"];
const SVC_EMOJI  = ["✂️","⚡","🧔","💈","🎨","💅","💆","🌟","👑","🔥"];
const PROD_EMOJI = ["🧴","✂️","💈","🪒","💆","💅","🎨","🧼","🌿","⚡","🔥","🌟"];
const HOURS = ["9:00","9:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];
const DAYS  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const STATUS_CFG  = { ocupado:{label:"Ocupado",dot:"#F59E0B"}, disponible:{label:"Disponible",dot:"#10B981"}, descanso:{label:"Descanso",dot:"#8B5CF6"} };
const APPT_STATUS = { confirmada:{label:"Confirmada",color:"#10B981"}, pendiente:{label:"Pendiente",color:"#F59E0B"}, cancelada:{label:"Cancelada",color:"#EF4444"}, completada:{label:"Completada",color:"#6366F1"} };
const today    = new Date();
const todayStr = today.toISOString().split("T")[0];
const weekDates = Array.from({length:7},(_,i)=>{ const d=new Date(today); d.setDate(today.getDate()-today.getDay()+i); return d.toISOString().split("T")[0]; });

// ── HELPERS ───────────────────────────────────────────────────────────────────
const inp  = (x={}) => ({ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"11px 14px", color:"#1e293b", fontFamily:"'Syne',sans-serif", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", ...x });
const card = (x={}) => ({ background:"#fff", borderRadius:16, boxShadow:"0 2px 12px #0000000d", border:"1px solid #e8edf5", ...x });
const bg   = { minHeight:"100vh", background:"#f1f5f9", color:"#1e293b", fontFamily:"'Syne',sans-serif" };
const CSS  = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}`;
const f2b  = (file) => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsDataURL(file); });
const uploadToStorage = async (file, path) => {
  const ext = file.name.split(".").pop();
  const fileName = `${path}-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from("imagenes").upload(fileName, file, { upsert:true, contentType:file.type });
  if(error) { const url = await f2b(file); return url; }
  const { data:pub } = supabase.storage.from("imagenes").getPublicUrl(fileName);
  return pub.publicUrl;
};
const waMsg = (phone, neg, fecha, hora) => `https://wa.me/${phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Hola, tu cita en ${neg} está confirmada para el ${fecha} a las ${hora}.`)}`;
const waMsgDueno = (phone, neg, cliente, svc, fecha, hora) => `https://wa.me/${phone.replace(/\D/g,"")}?text=${encodeURIComponent(`🔔 Nueva cita en ${neg}!\n👤 Cliente: ${cliente}\n✂️ Servicio: ${svc}\n📅 Fecha: ${fecha}\n🕐 Hora: ${hora}`)}`;
const addToCalendar = (neg, svc, fecha, hora) => { const dt=fecha.replace(/-/g,""); const h=hora.replace(":",""); const end=`${dt}T${h}00`; const start=`${dt}T${h}00`; return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Cita en ${neg}`)}&details=${encodeURIComponent(`Servicio: ${svc}`)}&dates=${start}/${end}`; };
const bzColor = (tipo) => BIZ_TYPES.find(t=>t.key===tipo)?.color || "#E8C547";
const bzIcon  = (tipo) => BIZ_TYPES.find(t=>t.key===tipo)?.icon  || "✂️";

// ── LOADER ────────────────────────────────────────────────────────────────────
function Loader({text="Cargando..."}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#f1f5f9",flexDirection:"column",gap:12}}>
      <style>{CSS}</style>
      <div style={{width:44,height:44,border:"3px solid #e2e8f0",borderTop:"3px solid #E8C547",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{color:"#64748b",fontFamily:"'Space Mono',monospace",fontSize:12}}>{text}</div>
    </div>
  );
}

// ── AUTH SCREEN ───────────────────────────────────────────────────────────────
function AuthScreen({onGuest}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const loginGoogle = async () => {
    setLoading(true);
    const {error} = await supabase.auth.signInWithOAuth({
      provider:"google",
      options:{ redirectTo:window.location.origin, queryParams:{prompt:"select_account"} }
    });
    if(error){ setMsg("Error con Google. Intenta de nuevo."); setLoading(false); }
  };

  return (
    <div style={{...bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
      <style>{CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{width:84,height:84,background:"linear-gradient(135deg,#E8C547,#f0a500)",borderRadius:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,margin:"0 auto 16px",boxShadow:"0 8px 32px #E8C54740"}}>✂</div>
        <div style={{fontSize:34,fontWeight:800,color:"#0f172a",letterSpacing:"-1px"}}>ProCita</div>
        <div style={{fontSize:12,color:"#64748b",marginTop:6,fontFamily:"'Space Mono',monospace"}}>RESERVAS PARA BARBERÍAS Y SALONES</div>
      </div>
      <div style={{width:"100%",maxWidth:400}}>
        <button onClick={loginGoogle} disabled={loading} style={{width:"100%",background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"15px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:12,cursor:"pointer",marginBottom:12,boxShadow:"0 2px 12px #0000001a",opacity:loading?0.7:1}}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.9 12 24 12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.6 0-14.2 4.1-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8H6.3C9.7 39.5 16.4 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.5 4.6-4.6 6l6.2 5.2C40.7 36.3 44 30.6 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:"#0f172a"}}>{loading?"Conectando...":"Continuar con Google"}</span>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:12,margin:"16px 0"}}>
          <hr style={{flex:1,height:1,background:"#e2e8f0",border:"none"}}/>
          <div style={{fontSize:11,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>O</div>
          <hr style={{flex:1,height:1,background:"#e2e8f0",border:"none"}}/>
        </div>
        <button onClick={onGuest} style={{width:"100%",background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"15px 20px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:24,boxShadow:"0 1px 6px #0000000d"}}>
          <span style={{fontSize:20}}>👤</span>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:"#334155"}}>Entrar como invitado</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#94a3b8",marginTop:2}}>SIN REGISTRO · SOLO PARA CLIENTES</div>
          </div>
        </button>
        {msg && <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#DC2626",textAlign:"center",marginBottom:16}}>{msg}</div>}
        <div style={{...card(),padding:16}}>
          <div style={{fontSize:11,fontWeight:700,color:"#334155",marginBottom:10}}>¿Por qué registrarse?</div>
          {[["✅","Guarda tu historial de citas"],["🏪","Registra y gestiona tu negocio"],["🔔","Notificaciones de citas nuevas"],["💾","Datos seguros en la nube"]].map(([i,t])=>(
            <div key={t} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:14}}>{i}</span>
              <span style={{fontSize:12,color:"#64748b"}}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ROLE SELECTOR ─────────────────────────────────────────────────────────────
function RoleSelector({user, onSelect, onLogout}) {
  return (
    <div style={{...bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
      <style>{CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:32,marginBottom:10}}>👋</div>
        <div style={{fontSize:24,fontWeight:800,color:"#0f172a"}}>¡Hola{user?.user_metadata?.name?`, ${user.user_metadata.name.split(" ")[0]}`:""}!</div>
        <div style={{fontSize:12,color:"#64748b",marginTop:6,fontFamily:"'Space Mono',monospace"}}>¿CÓMO VAS A USAR PROCITA?</div>
      </div>
      <div style={{width:"100%",maxWidth:420,display:"flex",flexDirection:"column",gap:14}}>
        {[
          {role:"cliente", icon:"📅", title:"Soy cliente",          desc:"Reservar citas en barberías, salones y centros de uñas.",          pill:"VER NEGOCIOS →",   c:"#10B981", bc:"#D1FAE5"},
          {role:"negocio", icon:"🏪", title:"Soy dueño de negocio", desc:"Registrar mi negocio y gestionar citas, empleados y servicios.",   pill:"MI PANEL →",     c:"#D97706", bc:"#FEF3C7"},
        ].map(b=>(
          <div key={b.role} onClick={()=>onSelect(b.role)} style={{...card(),padding:"22px 20px",cursor:"pointer",borderLeft:`4px solid ${b.c}`,transition:"all .15s"}}>
            <div style={{fontSize:34,marginBottom:8}}>{b.icon}</div>
            <div style={{fontSize:17,fontWeight:800,color:"#0f172a",marginBottom:4}}>{b.title}</div>
            <div style={{fontSize:12,color:"#64748b",lineHeight:1.5,marginBottom:12}}>{b.desc}</div>
            <div style={{display:"inline-block",background:b.bc,borderRadius:20,padding:"4px 14px",fontSize:10,color:b.c,fontFamily:"'Space Mono',monospace",fontWeight:700}}>{b.pill}</div>
          </div>
        ))}
        <button onClick={onLogout} style={{background:"transparent",border:"none",color:"#94a3b8",fontFamily:"'Syne',sans-serif",fontSize:12,cursor:"pointer",padding:"8px"}}>Cerrar sesión</button>
      </div>
    </div>
  );
}

// ── DIRECTORY ─────────────────────────────────────────────────────────────────
function Directory({negocios, user, isGuest, onSelect, onLogout}) {
  const [filter, setFilter] = useState("todos");
  const shown = filter==="todos" ? negocios : negocios.filter(n=>n.tipo===filter);

  return (
    <div style={bg}>
      <style>{CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 8px #00000008"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,background:"linear-gradient(135deg,#E8C547,#f0a500)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",fontWeight:800}}>✂</div>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>ProCita</div>
            <div style={{fontSize:9,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>{isGuest?"MODO INVITADO":"CLIENTE"}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {isGuest && <div style={{background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:20,padding:"4px 10px",fontSize:9,color:"#92400E",fontFamily:"'Space Mono',monospace"}}>INVITADO</div>}
          {!isGuest && user?.user_metadata?.picture && <img src={user.user_metadata.picture} style={{width:30,height:30,borderRadius:"50%",border:"2px solid #e2e8f0"}} alt=""/>}
          <button onClick={onLogout} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Space Mono',monospace",fontSize:9,padding:"6px 10px",borderRadius:8,cursor:"pointer"}}>Salir</button>
        </div>
      </div>
      <div style={{padding:"20px"}}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:22,fontWeight:800,color:"#0f172a",marginBottom:2}}>Elige tu negocio</div>
          <div style={{fontSize:12,color:"#64748b"}}>{negocios.length} negocios disponibles</div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
          {[{k:"todos",l:"Todos",i:"🌟"},{k:"barberia",l:"Barberías",i:"✂️"},{k:"salon",l:"Salones",i:"💇"},{k:"unas",l:"Uñas",i:"💅"},{k:"mixto",l:"Mixtos",i:"✨"}].map(f=>(
            <button key={f.k} onClick={()=>setFilter(f.k)} style={{background:filter===f.k?"#E8C547":"#fff",border:`1px solid ${filter===f.k?"#E8C547":"#e2e8f0"}`,color:filter===f.k?"#0f172a":"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:11,padding:"7px 14px",borderRadius:20,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 1px 4px #00000010"}}>{f.i} {f.l}</button>
          ))}
        </div>
        {shown.length===0 ? (
          <div style={{textAlign:"center",padding:"48px 0",color:"#94a3b8"}}>
            <div style={{fontSize:40,marginBottom:12}}>🏪</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:11}}>AÚN NO HAY NEGOCIOS</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {shown.map(neg=>{
              const c = bzColor(neg.tipo);
              const ic = bzIcon(neg.tipo);
              const bt = BIZ_TYPES.find(t=>t.key===neg.tipo)||BIZ_TYPES[0];
              return (
                <div key={neg.id} onClick={()=>onSelect(neg)} style={{...card(),overflow:"hidden",cursor:"pointer"}}>
                  <div style={{background:`linear-gradient(135deg,${c}18,${c}06)`,borderBottom:`1px solid ${c}20`,padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:54,height:54,borderRadius:14,border:`2px solid ${c}40`,overflow:"hidden",flexShrink:0,background:`${c}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,...(neg.foto_url?{backgroundImage:`url(${neg.foto_url})`,backgroundSize:"cover",backgroundPosition:"center"}:{})}}>{!neg.foto_url && ic}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>{neg.nombre}</div>
                      <div style={{display:"inline-block",background:`${c}20`,borderRadius:20,padding:"2px 10px",fontSize:9,color:c,marginTop:4,fontFamily:"'Space Mono',monospace"}}>{bt.label.toUpperCase()}</div>
                      {neg.direccion && <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>📍 {neg.direccion}</div>}
                    </div>
                    <div style={{color:"#94a3b8",fontSize:22}}>›</div>
                  </div>
                  <div style={{padding:"11px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:11,color:"#64748b"}}>Ver servicios y reservar</div>
                    <div style={{background:c,borderRadius:20,padding:"5px 14px",fontSize:10,color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700}}>Reservar →</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  // Auth
  const [authLoading, setAuthLoading] = useState(true);
  const [user,        setUser]        = useState(null);
  const [isGuest,     setIsGuest]     = useState(false);
  const [screen,      setScreen]      = useState("auth"); // auth|role|directory|setup|dashboard|client

  // Business data
  const [negocios,     setNegocios]     = useState([]);
  const [selectedNeg,  setSelectedNeg]  = useState(null);
  const [negocioId,    setNegocioId]    = useState(null);
  const [negocioFoto,  setNegocioFoto]  = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState(null);
  const [employees,    setEmployees]    = useState([]);
  const [services,     setServices]     = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [products,     setProducts]     = useState([]);
  const [galeria,      setGaleria]      = useState([]);
  const [resenas,      setResenas]      = useState([]);
  const [listaEspera,  setListaEspera]  = useState([]);
  const [bloqueos,     setBloqueos]     = useState([]);
  const [negWA,        setNegWA]        = useState("");
  const [fidelActiva,  setFidelActiva]  = useState(false);
  const [citasPremio,  setCitasPremio]  = useState(5);
  const [domActivo,    setDomActivo]    = useState(false);
  const [domCosto,     setDomCosto]     = useState(0);

  // Admin UI
  const [activeTab,    setActiveTab]    = useState("empleados");
  const [filterSt,     setFilterSt]     = useState("todos");
  const [selEmp,       setSelEmp]       = useState(null);
  const [agendaView,   setAgendaView]   = useState("dia");
  const [agendaDate,   setAgendaDate]   = useState(todayStr);
  const [agendaEmp,    setAgendaEmp]    = useState("todos");
  const [weekPopup,    setWeekPopup]    = useState(null);
  const [newAlert,     setNewAlert]     = useState(0);
  const [saving,       setSaving]       = useState(false);

  // Modals – employee
  const [showEmp,  setShowEmp]  = useState(false);
  const [empName,  setEmpName]  = useState("");
  const [empRole,  setEmpRole]  = useState("");
  const [empSpec,  setEmpSpec]  = useState("");

  // Modals – service
  const [showSvc,  setShowSvc]  = useState(false);
  const [editSvc,  setEditSvc]  = useState(null);
  const [svcF,     setSvcF]     = useState({name:"",cat:"",price:"",dur:"",emoji:"✂️",desc:"",foto:""});

  // Modals – product
  const [showProd, setShowProd] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [prodF,    setProdF]    = useState({name:"",cat:"",price:"",stock:"",emoji:"🧴",desc:"",foto:""});

  // Modals – appointment
  const [showAppt, setShowAppt] = useState(false);
  const [editAppt, setEditAppt] = useState(null);
  const [apptF,    setApptF]    = useState({client:"",phone:"",empId:"",svcId:"",date:todayStr,time:"10:00"});

  // Modals – gallery
  const [showGal,  setShowGal]  = useState(false);
  const [galFoto,  setGalFoto]  = useState("");
  const [galDesc,  setGalDesc]  = useState("");

  // Modals – bloqueo
  const [showBloqueo, setShowBloqueo] = useState(false);
  const [bloqueoF,    setBloqueoF]    = useState({empId:"",fecha:todayStr,horaInicio:"12:00",horaFin:"13:00",motivo:"Almuerzo",tipo:"bloqueo"});
  const MOTIVOS = ["Almuerzo","Reunión","Sin cita previa","Reservado","Descanso","Personal","Otro"];
  const TIPOS   = [{k:"bloqueo",l:"No disponible",c:"#EF4444"},{k:"reservado",l:"Reservado (sin cita)",c:"#F97316"},{k:"almuerzo",l:"Almuerzo",c:"#F59E0B"}];

  // Modals – resena & espera (client side)
  const [showResena, setShowResena] = useState(false);
  const [resenaF,    setResenaF]    = useState({nombre:"",cal:5,comentario:""});
  const [showEspera, setShowEspera] = useState(false);
  const [esperaF,    setEsperaF]    = useState({nombre:"",tel:"",svcId:"",fecha:todayStr});

  // Client booking
  const [clientView, setClientView] = useState("home");
  const [step,       setStep]       = useState(1);
  const [bkSvc,      setBkSvc]      = useState(null);
  const [bkEmp,      setBkEmp]      = useState(null);
  const [bkDate,     setBkDate]     = useState(todayStr);
  const [bkTime,     setBkTime]     = useState(null);
  const [bkName,     setBkName]     = useState("");
  const [bkPhone,    setBkPhone]    = useState("");
  const [bkDomicilio, setBkDomicilio] = useState(false);
  const [bkDireccion, setBkDireccion] = useState("");
  const [misCitas,   setMisCitas]   = useState([]);
  const [miNombre,   setMiNombre]   = useState(localStorage.getItem("cutq_nombre")||"");
  const [showReschedule, setShowReschedule] = useState(null);

  // Derived
  const biz     = BIZ_TYPES.find(t=>t.key===businessType) || BIZ_TYPES[0];
  const ac      = biz.color;
  const sw      = businessType ? STATION[businessType] : "Puesto";
  const roles   = businessType ? ROLES[businessType]   : [];
  const visible = filterSt==="todos" ? employees : employees.filter(e=>e.status===filterSt);
  const counts  = { todos:employees.length, disponible:employees.filter(e=>e.status==="disponible").length, ocupado:employees.filter(e=>e.status==="ocupado").length, descanso:employees.filter(e=>e.status==="descanso").length };

  // ── AUTH LISTENER ──────────────────────────────────────────────────────────
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user){ setUser(session.user); setScreen("role"); }
      setAuthLoading(false);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>{
      if(session?.user){ setUser(session.user); setAuthLoading(false); setScreen("role"); }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  // ── DATA LOADING ───────────────────────────────────────────────────────────
  const loadNegocios = async () => {
    const {data} = await supabase.from("negocios").select("*").order("created_at",{ascending:false});
    setNegocios(data||[]);
  };

  const loadData = async (nId) => {
    const id = nId||negocioId;
    if(!id) return;
    const [r1,r2,r3,r4,r5,r6,r7,r8,r9] = await Promise.all([
      supabase.from("empleados").select("*").eq("negocio_id",id).order("silla"),
      supabase.from("servicios").select("*").eq("negocio_id",id).order("created_at"),
      supabase.from("citas").select("*").eq("negocio_id",id).order("fecha").order("hora"),
      supabase.from("productos").select("*").eq("negocio_id",id).order("created_at"),
      supabase.from("galeria").select("*").eq("negocio_id",id).order("created_at",{ascending:false}),
      supabase.from("resenas").select("*").eq("negocio_id",id).order("created_at",{ascending:false}),
      supabase.from("lista_espera").select("*").eq("negocio_id",id).order("created_at"),
      supabase.from("negocios").select("*").eq("id",id).single(),
      supabase.from("bloqueos").select("*").eq("negocio_id",id).order("fecha").order("hora_inicio"),
    ]);
    setEmployees(r1.data||[]);
    setServices(r2.data||[]);
    setAppointments(r3.data||[]);
    setProducts(r4.data||[]);
    setGaleria(r5.data||[]);
    setResenas(r6.data||[]);
    setListaEspera(r7.data||[]);
    setBloqueos(r9.data||[]);
    if(r8.data){ setFidelActiva(r8.data.fidelizacion_activa||false); setCitasPremio(r8.data.citas_x_premio||5); setNegWA(r8.data.whatsapp||""); setDomActivo(r8.data.domicilio_activo||false); setDomCosto(r8.data.domicilio_costo||0); }
  };

  // ── AUTH ACTIONS ───────────────────────────────────────────────────────────
  const handleGuestMode = async () => { setIsGuest(true); await loadNegocios(); setScreen("directory"); };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setIsGuest(false); setScreen("auth");
    setNegocios([]); setSelectedNeg(null); setNegocioId(null);
    setEmployees([]); setServices([]); setAppointments([]); setProducts([]);
    setGaleria([]); setResenas([]); setListaEspera([]);
  };

  const handleRoleSelect = async (role) => {
    if(role==="cliente"){
      await loadNegocios();
      setScreen("directory");
    } else {
      const {data} = await supabase.from("negocios").select("*").eq("user_id",user.id).single();
      if(data){
        setNegocioId(data.id); setBusinessName(data.nombre); setBusinessType(data.tipo);
        setNegocioFoto(data.foto_url||null);
        await loadData(data.id);
        setScreen("dashboard");
      } else {
        setScreen("setup");
      }
    }
  };

  const saveBusiness = async () => {
    if(!businessName.trim()||!businessType) return;
    setSaving(true);
    const {data,error} = await supabase.from("negocios").insert({nombre:businessName.trim(),tipo:businessType,user_id:user?.id}).select().single();
    if(!error&&data){ setNegocioId(data.id); await loadData(data.id); setScreen("dashboard"); }
    setSaving(false);
  };

  // ── EMPLOYEE ACTIONS ───────────────────────────────────────────────────────
  const addEmp = async () => {
    if(!empName.trim()) return;
    const ini = empName.trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
    const {data} = await supabase.from("empleados").insert({negocio_id:negocioId,nombre:empName.trim(),rol:empRole||roles[0]||"Empleado",especialidad:empSpec||"General",silla:employees.length+1,status:"disponible",avatar:ini,color:COLORS[Math.floor(Math.random()*COLORS.length)]}).select().single();
    if(data) setEmployees(p=>[...p,data]);
    setEmpName(""); setEmpRole(""); setEmpSpec(""); setShowEmp(false);
  };
  const changeStatus = async (id,status) => { await supabase.from("empleados").update({status}).eq("id",id); setEmployees(p=>p.map(e=>e.id===id?{...e,status}:e)); setSelEmp(null); };
  const removeEmp    = async (id)         => { await supabase.from("empleados").delete().eq("id",id); setEmployees(p=>p.filter(e=>e.id!==id)); setSelEmp(null); };

  // ── SERVICE ACTIONS ────────────────────────────────────────────────────────
  const openAddSvc  = ()  => { setEditSvc(null); setSvcF({name:"",cat:"",price:"",dur:"",emoji:"✂️",desc:"",foto:""}); setShowSvc(true); };
  const openEditSvc = (s) => { setEditSvc(s); setSvcF({name:s.nombre,cat:s.categoria||"",price:String(s.precio),dur:String(s.duracion),emoji:s.emoji,desc:s.descripcion||"",foto:s.foto_url||""}); setShowSvc(true); };
  const saveSvc = async () => {
    if(!svcF.name.trim()||!svcF.price) return;
    const obj = {negocio_id:negocioId,nombre:svcF.name,categoria:svcF.cat||"General",precio:Number(svcF.price),duracion:Number(svcF.dur)||30,emoji:svcF.emoji,descripcion:svcF.desc,foto_url:svcF.foto||null};
    if(editSvc){ await supabase.from("servicios").update(obj).eq("id",editSvc.id); setServices(p=>p.map(s=>s.id===editSvc.id?{...s,...obj}:s)); }
    else { const {data}=await supabase.from("servicios").insert(obj).select().single(); if(data) setServices(p=>[...p,data]); }
    setShowSvc(false);
  };
  const deleteSvc = async (id) => { await supabase.from("servicios").delete().eq("id",id); setServices(p=>p.filter(s=>s.id!==id)); };

  // ── PRODUCT ACTIONS ────────────────────────────────────────────────────────
  const openAddProd  = ()  => { setEditProd(null); setProdF({name:"",cat:"",price:"",stock:"",emoji:"🧴",desc:"",foto:""}); setShowProd(true); };
  const openEditProd = (p) => { setEditProd(p); setProdF({name:p.nombre,cat:p.categoria||"",price:String(p.precio),stock:String(p.stock||0),emoji:p.emoji,desc:p.descripcion||"",foto:p.foto_url||""}); setShowProd(true); };
  const saveProd = async () => {
    if(!prodF.name.trim()||!prodF.price) return;
    const obj = {negocio_id:negocioId,nombre:prodF.name,categoria:prodF.cat||"Producto",precio:Number(prodF.price),stock:Number(prodF.stock)||0,emoji:prodF.emoji,descripcion:prodF.desc,foto_url:prodF.foto||null};
    if(editProd){ await supabase.from("productos").update(obj).eq("id",editProd.id); setProducts(p=>p.map(x=>x.id===editProd.id?{...x,...obj}:x)); }
    else { const {data}=await supabase.from("productos").insert(obj).select().single(); if(data) setProducts(p=>[...p,data]); }
    setShowProd(false);
  };
  const deleteProd = async (id) => { await supabase.from("productos").delete().eq("id",id); setProducts(p=>p.filter(x=>x.id!==id)); };

  // ── APPOINTMENT ACTIONS ────────────────────────────────────────────────────
  const openAddAppt  = ()  => { setEditAppt(null); setApptF({client:"",phone:"",empId:"",svcId:"",date:todayStr,time:"10:00"}); setShowAppt(true); };
  const openEditAppt = (a) => { setEditAppt(a); setApptF({client:a.cliente_nombre,phone:a.cliente_telefono||"",empId:a.empleado_id||"",svcId:a.servicio_id||"",date:a.fecha,time:a.hora?.slice(0,5)||"10:00"}); setShowAppt(true); };
  const saveAppt = async () => {
    if(!apptF.client.trim()) return;
    const obj = {negocio_id:negocioId,cliente_nombre:apptF.client,cliente_telefono:apptF.phone,empleado_id:apptF.empId||null,servicio_id:apptF.svcId||null,fecha:apptF.date,hora:apptF.time,status:"pendiente"};
    if(editAppt){ await supabase.from("citas").update(obj).eq("id",editAppt.id); setAppointments(p=>p.map(a=>a.id===editAppt.id?{...a,...obj}:a)); }
    else { const {data}=await supabase.from("citas").insert(obj).select().single(); if(data){ setAppointments(p=>[...p,data]); setNewAlert(n=>n+1); } }
    setShowAppt(false);
  };
  const deleteAppt       = async (id)     => { await supabase.from("citas").delete().eq("id",id); setAppointments(p=>p.filter(a=>a.id!==id)); };
  const updateApptStatus = async (id,st)  => { await supabase.from("citas").update({status:st}).eq("id",id); setAppointments(p=>p.map(a=>a.id===id?{...a,status:st}:a)); };

  // ── GALLERY ACTIONS ────────────────────────────────────────────────────────
  const saveGal  = async () => { if(!galFoto) return; const {data}=await supabase.from("galeria").insert({negocio_id:negocioId,foto_url:galFoto,descripcion:galDesc}).select().single(); if(data) setGaleria(p=>[data,...p]); setShowGal(false); setGalFoto(""); setGalDesc(""); };
  const deleteGal = async (id) => { await supabase.from("galeria").delete().eq("id",id); setGaleria(p=>p.filter(g=>g.id!==id)); };

  // ── BLOQUEOS ───────────────────────────────────────────────────────────────
  const saveBloqueo = async () => {
    const obj = {negocio_id:negocioId,empleado_id:bloqueoF.empId||null,fecha:bloqueoF.fecha,hora_inicio:bloqueoF.horaInicio,hora_fin:bloqueoF.horaFin,motivo:bloqueoF.motivo,tipo:bloqueoF.tipo};
    const {data} = await supabase.from("bloqueos").insert(obj).select().single();
    if(data) setBloqueos(p=>[...p,data]);
    setShowBloqueo(false);
  };
  const deleteBloqueo = async (id) => { await supabase.from("bloqueos").delete().eq("id",id); setBloqueos(p=>p.filter(b=>b.id!==id)); };

  const isHourBlocked = (date, hour, empId) => {
    return bloqueos.some(b => {
      if(b.fecha !== date) return false;
      if(b.empleado_id && empId && b.empleado_id !== empId) return false;
      const hNum = parseInt(hour.replace(":",""));
      const start = parseInt(b.hora_inicio.replace(":","").slice(0,4));
      const end   = parseInt(b.hora_fin.replace(":","").slice(0,4));
      return hNum >= start && hNum < end;
    });
  };

  // ── FIDELIZACIÓN ───────────────────────────────────────────────────────────
  const toggleFidel = async (val) => { setFidelActiva(val); await supabase.from("negocios").update({fidelizacion_activa:val}).eq("id",negocioId); };
  const setPremio   = async (val) => { setCitasPremio(val); await supabase.from("negocios").update({citas_x_premio:val}).eq("id",negocioId); };

  // ── DELETE NEGOCIO ─────────────────────────────────────────────────────────
  const deleteNegocio = async () => {
    if(!window.confirm("¿Estás seguro? Esto eliminará tu negocio y todos sus datos permanentemente.")) return;
    await supabase.from("negocios").delete().eq("id",negocioId);
    handleLogout();
  };

  // ── CLIENT BOOKING ─────────────────────────────────────────────────────────
  const confirmBooking = async () => {
    if(!bkName.trim()||!bkTime) return;
    const nId = selectedNeg?.id||negocioId;
    const negNombre = selectedNeg?.nombre||businessName;
    const {data} = await supabase.from("citas").insert({negocio_id:nId,cliente_nombre:bkName,cliente_telefono:bkPhone,empleado_id:bkEmp?.id||null,servicio_id:bkSvc?.id||null,fecha:bkDate,hora:bkTime,status:"pendiente",es_domicilio:bkDomicilio,direccion_cliente:bkDomicilio?bkDireccion:null}).select().single();
    if(data){ setAppointments(p=>[...p,data]); setNewAlert(n=>n+1); }
    localStorage.setItem("cutq_nombre", bkName);
    setMiNombre(bkName);
    const negWANum = selectedNeg?.whatsapp || negWA;
    if(negWANum) {
      const waUrl = `https://wa.me/${negWANum.replace(/\D/g,"")}?text=${encodeURIComponent(`🔔 Nueva cita en ${negNombre}!\n👤 Cliente: ${bkName}\n✂️ Servicio: ${bkSvc?.nombre||"Servicio"}\n📅 Fecha: ${bkDate}\n🕐 Hora: ${bkTime}${bkDomicilio?`\n🏠 A DOMICILIO${bkDireccion?`: ${bkDireccion}`:""}`:""}`)}`;
      window.open(waUrl, "_blank");
    }
    setClientView("confirm");
  };

  // Mis citas del cliente
  const loadMisCitas = async () => {
    if(!miNombre) return;
    const nId = selectedNeg?.id||negocioId;
    const {data} = await supabase.from("citas").select("*").eq("negocio_id",nId).ilike("cliente_nombre",miNombre).order("fecha").order("hora");
    setMisCitas(data||[]);
  };

  const reagendarCita = async (citaId, newDate, newTime) => {
    await supabase.from("citas").update({fecha:newDate, hora:newTime, status:"pendiente"}).eq("id",citaId);
    setAppointments(p=>p.map(a=>a.id===citaId?{...a,fecha:newDate,hora:newTime,status:"pendiente"}:a));
    setMisCitas(p=>p.map(a=>a.id===citaId?{...a,fecha:newDate,hora:newTime,status:"pendiente"}:a));
    setShowReschedule(null);
  };

  const cancelarCitaCliente = async (citaId) => {
    await supabase.from("citas").update({status:"cancelada"}).eq("id",citaId);
    setMisCitas(p=>p.map(a=>a.id===citaId?{...a,status:"cancelada"}:a));
  };

  // ── CLIENT RESENA ──────────────────────────────────────────────────────────
  const saveResena = async () => {
    if(!resenaF.nombre.trim()) return;
    const nId = selectedNeg?.id||negocioId;
    const {data} = await supabase.from("resenas").insert({negocio_id:nId,cliente_nombre:resenaF.nombre,calificacion:resenaF.cal,comentario:resenaF.comentario}).select().single();
    if(data) setResenas(p=>[data,...p]);
    setShowResena(false); setResenaF({nombre:"",cal:5,comentario:""});
  };

  // ── CLIENT ESPERA ──────────────────────────────────────────────────────────
  const saveEspera = async () => {
    if(!esperaF.nombre.trim()) return;
    const nId = selectedNeg?.id||negocioId;
    const {data} = await supabase.from("lista_espera").insert({negocio_id:nId,cliente_nombre:esperaF.nombre,cliente_telefono:esperaF.tel,servicio_id:esperaF.svcId||null,fecha_preferida:esperaF.fecha}).select().single();
    if(data) setListaEspera(p=>[...p,data]);
    setShowEspera(false); setEsperaF({nombre:"",tel:"",svcId:"",fecha:todayStr});
  };
  const deleteEspera = async (id) => { await supabase.from("lista_espera").delete().eq("id",id); setListaEspera(p=>p.filter(e=>e.id!==id)); };

  // ── SCREENS ────────────────────────────────────────────────────────────────
  if(authLoading)    return <Loader text="INICIANDO PROCITA..."/>;
  if(screen==="auth") return <AuthScreen onGuest={handleGuestMode}/>;
  if(screen==="role") return <RoleSelector user={user} onSelect={handleRoleSelect} onLogout={handleLogout}/>;
  if(screen==="directory") return <Directory negocios={negocios} user={user} isGuest={isGuest} onLogout={handleLogout} onSelect={neg=>{ setSelectedNeg(neg); setBusinessType(neg.tipo); setBusinessName(neg.nombre); setNegocioFoto(neg.foto_url||null); loadData(neg.id).then(()=>{ setNegocioId(neg.id); setClientView("home"); setScreen("client"); }); }}/>;

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if(screen==="setup") {
    return (
      <div style={{...bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
        <style>{CSS}</style>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
        <div style={{marginBottom:32,textAlign:"center"}}>
          <div style={{width:64,height:64,background:"linear-gradient(135deg,#E8C547,#f0a500)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 14px"}}>🏪</div>
          <div style={{fontSize:22,fontWeight:800,color:"#0f172a"}}>Registra tu negocio</div>
          <div style={{fontSize:11,color:"#64748b",marginTop:6,fontFamily:"'Space Mono',monospace"}}>APARECERÁ EN EL DIRECTORIO DE PROCITA</div>
        </div>
        <div style={{width:"100%",maxWidth:480}}>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:"#64748b",marginBottom:8}}>NOMBRE DEL NEGOCIO</div>
            <input value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="Ej: Barbería Don Carlos…" style={inp({fontSize:15,fontWeight:600})}/>
          </div>
          <div style={{marginBottom:28}}>
            <div style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:"#64748b",marginBottom:8}}>TIPO DE NEGOCIO</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {BIZ_TYPES.map(t=>(
                <div key={t.key} onClick={()=>setBusinessType(t.key)} style={{...card(),padding:"16px 14px",cursor:"pointer",borderLeft:`3px solid ${businessType===t.key?t.color:"transparent"}`,background:businessType===t.key?`${t.color}08`:"#fff"}}>
                  <div style={{fontSize:26,marginBottom:6}}>{t.icon}</div>
                  <div style={{fontSize:13,fontWeight:700,color:businessType===t.key?t.color:"#334155"}}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={saveBusiness} disabled={!businessName.trim()||!businessType||saving} style={{width:"100%",background:businessName.trim()&&businessType?"linear-gradient(135deg,#E8C547,#f0a500)":"#e2e8f0",border:"none",color:businessName.trim()&&businessType?"#0f172a":"#94a3b8",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,padding:14,borderRadius:12,cursor:"pointer"}}>
            {saving?"Guardando...":"Publicar mi negocio →"}
          </button>
          <button onClick={handleLogout} style={{width:"100%",background:"transparent",border:"none",color:"#94a3b8",fontFamily:"'Syne',sans-serif",fontSize:12,padding:"10px",cursor:"pointer",marginTop:6}}>← Volver</button>
        </div>
      </div>
    );
  }

  // ── CLIENT VIEW ────────────────────────────────────────────────────────────
  if(screen==="client") {
    const neg = selectedNeg||{nombre:businessName,tipo:businessType,foto_url:negocioFoto};
    const bt  = BIZ_TYPES.find(t=>t.key===neg.tipo)||BIZ_TYPES[0];
    const cc  = bt.color;

    return (
      <div style={bg}>
        <style>{CSS}</style>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>

        {/* Header */}
        <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 8px #00000008"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setScreen("directory")} style={{background:"#f1f5f9",border:"none",color:"#64748b",fontSize:18,cursor:"pointer",padding:"4px 8px",borderRadius:8}}>‹</button>
            <div style={{width:34,height:34,borderRadius:10,border:`2px solid ${cc}40`,overflow:"hidden",background:`${cc}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,...(neg.foto_url?{backgroundImage:`url(${neg.foto_url})`,backgroundSize:"cover",backgroundPosition:"center"}:{})}}>{!neg.foto_url && bt.icon}</div>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{neg.nombre}</div>
              <div style={{fontSize:9,color:cc,fontFamily:"'Space Mono',monospace"}}>{bt.label.toUpperCase()}</div>
            </div>
          </div>
          {isGuest && <div style={{background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:20,padding:"4px 10px",fontSize:9,color:"#92400E",fontFamily:"'Space Mono',monospace"}}>INVITADO</div>}
        </div>

        {/* Confirm screen */}
        {clientView==="confirm" && (
          <div style={{padding:32,textAlign:"center"}}>
            <div style={{fontSize:60,marginBottom:16}}>🎉</div>
            <div style={{fontSize:20,fontWeight:800,color:"#0f172a",marginBottom:6}}>¡Cita confirmada!</div>
            <div style={{fontSize:12,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:24}}>TE ESPERAMOS</div>
            <div style={{...card(),padding:20,textAlign:"left",maxWidth:340,margin:"0 auto 20px"}}>
              {[[`${bt.icon} Servicio`,bkSvc?.nombre],[`💰 Precio`,bkDomicilio&&(domCosto||(selectedNeg?.domicilio_costo))>0?`$${(bkSvc?.precio||0)+(domCosto||selectedNeg?.domicilio_costo||0)} (incluye domicilio)`:bkSvc?`$${bkSvc.precio}`:null],[`📍 Modalidad`,bkDomicilio?`🏠 A domicilio`:`🏪 En el local`],[bkDomicilio?`🗺️ Dirección`:null,bkDireccion||null],[`👤 Profesional`,bkEmp?.nombre||"Cualquier disponible"],[`📅 Fecha`,bkDate],[`🕐 Hora`,bkTime],[`👤 Cliente`,bkName]].filter(([l,v])=>l&&v).map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f1f5f9"}}>
                  <span style={{fontSize:11,color:"#64748b"}}>{l}</span>
                  <span style={{fontSize:12,fontWeight:600,color:"#0f172a"}}>{v}</span>
                </div>
              ))}
            </div>
            {bkPhone && (
              <a href={waMsg(bkPhone,neg.nombre,bkDate,bkTime)} target="_blank" rel="noreferrer" style={{display:"block",background:"#25D366",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,padding:"12px 24px",borderRadius:12,textDecoration:"none",maxWidth:340,margin:"0 auto 10px",textAlign:"center"}}>
                📲 Confirmar por WhatsApp
              </a>
            )}
            <a href={addToCalendar(neg.nombre,bkSvc?.nombre||"Cita",bkDate,bkTime)} target="_blank" rel="noreferrer" style={{display:"block",background:"#4285F4",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,padding:"11px 24px",borderRadius:12,textDecoration:"none",maxWidth:340,margin:"0 auto 10px",textAlign:"center"}}>
              📅 Agregar a Google Calendar
            </a>
            <div style={{display:"flex",gap:10,maxWidth:340,margin:"10px auto 0"}}>
              <button onClick={()=>{setClientView("home");setStep(1);setBkSvc(null);setBkEmp(null);setBkTime(null);setBkName("");setBkPhone("");setBkDomicilio(false);setBkDireccion("");}} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"12px",borderRadius:12,cursor:"pointer"}}>Nueva cita</button>
              <button onClick={()=>setScreen("directory")} style={{flex:1,background:`linear-gradient(135deg,${cc},${cc}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"12px",borderRadius:12,cursor:"pointer"}}>Más negocios</button>
            </div>
          </div>
        )}

        {/* Booking flow */}
        {clientView==="book" && (
          <div style={{padding:"20px 20px 100px"}}>
            {/* Steps */}
            <div style={{display:"flex",alignItems:"center",marginBottom:24}}>
              {["Servicio","Profesional","Fecha","Confirmar"].map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",flex:1}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:step>i+1?cc:step===i+1?`${cc}20`:"#e2e8f0",border:`2px solid ${step>=i+1?cc:"#e2e8f0"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:step>i+1?"#0f172a":step===i+1?cc:"#94a3b8",marginBottom:4}}>{step>i+1?"✓":i+1}</div>
                    <div style={{fontSize:9,color:step===i+1?cc:"#94a3b8",fontFamily:"'Space Mono',monospace",textAlign:"center",whiteSpace:"nowrap"}}>{s}</div>
                  </div>
                  {i<3 && <div style={{height:2,flex:0.5,background:step>i+1?cc:"#e2e8f0",marginBottom:16}}/>}
                </div>
              ))}
            </div>

            {/* Step 1 – Service */}
            {step===1 && (
              <div>
                <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:14}}>Selecciona un servicio</div>
                {services.length===0 && <div style={{textAlign:"center",padding:"32px 0",color:"#94a3b8",fontFamily:"'Space Mono',monospace",fontSize:11}}>ESTE NEGOCIO AÚN NO TIENE SERVICIOS</div>}
                {services.map(svc=>{
                  const sc = {"Corte":"#E8C547","Barba":"#F97316","Combo":"#4ECDC4","Color":"#F472B6","Uñas":"#A78BFA"}[svc.categoria]||"#60A5FA";
                  return (
                    <div key={svc.id} onClick={()=>{setBkSvc(svc);setStep(2);}} style={{...card(),padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,marginBottom:10,borderLeft:bkSvc?.id===svc.id?`3px solid ${sc}`:"3px solid transparent"}}>
                      {svc.foto_url ? <img src={svc.foto_url} style={{width:44,height:44,borderRadius:10,objectFit:"cover"}} alt=""/> : <div style={{fontSize:26,width:44,height:44,background:`${sc}15`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}>{svc.emoji}</div>}
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{svc.nombre}</div>
                        <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{svc.descripcion}</div>
                        <div style={{display:"flex",gap:10,marginTop:6}}>
                          <span style={{fontSize:12,fontWeight:700,color:sc}}>${svc.precio}</span>
                          <span style={{fontSize:11,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>⏱ {svc.duracion}min</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 2 – Employee */}
            {step===2 && (
              <div>
                <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:14}}>Elige un profesional</div>
                <div onClick={()=>{setBkEmp(null);setStep(3);}} style={{...card(),padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🎲</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>Cualquier disponible</div>
                    <div style={{fontSize:11,color:"#64748b"}}>Asignación automática</div>
                  </div>
                </div>
                {employees.map(emp=>(
                  <div key={emp.id} onClick={()=>{setBkEmp(emp);setStep(3);}} style={{...card(),padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,marginBottom:10,borderLeft:bkEmp?.id===emp.id?`3px solid ${emp.color}`:"3px solid transparent"}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:`${emp.color}20`,border:`2px solid ${emp.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:emp.color}}>{emp.avatar}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{emp.nombre}</div>
                      <div style={{fontSize:11,color:"#64748b"}}>{emp.especialidad}</div>
                      <div style={{display:"inline-block",background:`${STATUS_CFG[emp.status]?.dot||"#10B981"}15`,borderRadius:20,padding:"2px 10px",fontSize:9,color:STATUS_CFG[emp.status]?.dot||"#10B981",marginTop:4,fontFamily:"'Space Mono',monospace"}}>{STATUS_CFG[emp.status]?.label||"Disponible"}</div>
                    </div>
                  </div>
                ))}
                <button onClick={()=>setStep(1)} style={{width:"100%",background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"10px",borderRadius:10,cursor:"pointer",marginTop:6}}>← Volver</button>
              </div>
            )}

            {/* Step 3 – Date & Time */}
            {step===3 && (
              <div>
                <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:14}}>Fecha y hora</div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>FECHA</div>
                  <input type="date" value={bkDate} onChange={e=>setBkDate(e.target.value)} style={inp()}/>
                </div>
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>HORA DISPONIBLE</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    {HOURS.map(h=>{
                      const taken = appointments.find(a=>a.fecha===bkDate&&a.hora?.startsWith(h)&&(bkEmp?a.empleado_id===bkEmp?.id:false));
                      const blocked = isHourBlocked(bkDate, h, bkEmp?.id||null);
                      const unavailable = !!taken || blocked;
                      return (
                        <button key={h} disabled={unavailable} onClick={()=>setBkTime(h)} style={{background:bkTime===h?cc:unavailable?"#f1f5f9":"#fff",border:`1px solid ${bkTime===h?cc:"#e2e8f0"}`,color:bkTime===h?"#0f172a":unavailable?"#cbd5e1":"#334155",fontFamily:"'Space Mono',monospace",fontSize:11,padding:"9px 4px",borderRadius:8,cursor:unavailable?"not-allowed":"pointer",fontWeight:600,opacity:unavailable?0.4:1,position:"relative"}}>
                          {h}
                          {blocked && <span style={{position:"absolute",top:-2,right:-2,fontSize:6}}>🚫</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setStep(2)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>← Volver</button>
                  <button disabled={!bkTime} onClick={()=>setStep(4)} style={{flex:2,background:bkTime?`linear-gradient(135deg,${cc},${cc}cc)`:"#e2e8f0",border:"none",color:bkTime?"#0f172a":"#94a3b8",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:bkTime?"pointer":"not-allowed"}}>Continuar →</button>
                </div>
              </div>
            )}

            {/* Step 4 – Confirm */}
            {step===4 && (
              <div>
                <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:14}}>Confirma tu cita</div>
                <div style={{...card(),padding:16,marginBottom:16}}>
                  {[[`${bt.icon} Servicio`,bkSvc?.nombre],[`💰 Precio`,`$${bkSvc?.precio}`],[`⏱ Duración`,`${bkSvc?.duracion} min`],[`👤 Profesional`,bkEmp?.nombre||"Cualquier disponible"],[`📅 Fecha`,bkDate],[`🕐 Hora`,bkTime]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f1f5f9"}}>
                      <span style={{fontSize:11,color:"#64748b"}}>{l}</span>
                      <span style={{fontSize:12,fontWeight:600,color:"#0f172a"}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                  <input value={bkName} onChange={e=>setBkName(e.target.value)} placeholder="Tu nombre completo *" style={inp()}/>
                  <input value={bkPhone} onChange={e=>setBkPhone(e.target.value)} placeholder="Teléfono / WhatsApp (opcional)" style={inp()}/>
                  {(domActivo||(selectedNeg?.domicilio_activo))&&(
                    <div style={{...card(),padding:14}}>
                      <div style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:"#64748b",marginBottom:10}}>MODALIDAD DEL SERVICIO</div>
                      <div style={{display:"flex",gap:10,marginBottom:bkDomicilio?10:0}}>
                        <button onClick={()=>setBkDomicilio(false)} style={{flex:1,padding:"10px",borderRadius:10,border:`2px solid ${!bkDomicilio?cc:"#e2e8f0"}`,background:!bkDomicilio?`${cc}15`:"#f8fafc",color:!bkDomicilio?cc:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>🏪 En el local</button>
                        <button onClick={()=>setBkDomicilio(true)} style={{flex:1,padding:"10px",borderRadius:10,border:`2px solid ${bkDomicilio?cc:"#e2e8f0"}`,background:bkDomicilio?`${cc}15`:"#f8fafc",color:bkDomicilio?cc:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>🏠 A domicilio{(domCosto||(selectedNeg?.domicilio_costo))>0?` (+$${domCosto||selectedNeg?.domicilio_costo})`:"" }</button>
                      </div>
                      {bkDomicilio&&<input value={bkDireccion} onChange={e=>setBkDireccion(e.target.value)} placeholder="Tu dirección completa *" style={inp()}/>}
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setStep(3)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>← Volver</button>
                  <button disabled={!bkName.trim()} onClick={confirmBooking} style={{flex:2,background:bkName.trim()?`linear-gradient(135deg,${cc},${cc}cc)`:"#e2e8f0",border:"none",color:bkName.trim()?"#0f172a":"#94a3b8",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:bkName.trim()?"pointer":"not-allowed"}}>Confirmar cita ✓</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mis Citas view */}
        {clientView==="miscitas" && (
          <div style={{padding:"20px 20px 80px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <button onClick={()=>setClientView("home")} style={{background:"#f1f5f9",border:"none",color:"#64748b",fontSize:18,cursor:"pointer",padding:"4px 8px",borderRadius:8}}>‹</button>
              <div style={{fontSize:18,fontWeight:800,color:"#0f172a"}}>📋 Mis citas</div>
            </div>
            {misCitas.length===0 && (
              <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}>
                <div style={{fontSize:40,marginBottom:10}}>📅</div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:11}}>NO TIENES CITAS AÚN</div>
              </div>
            )}
            {misCitas.map(cita=>{
              const svc = services.find(s=>s.id===cita.servicio_id);
              const emp = employees.find(e=>e.id===cita.empleado_id);
              const sc  = APPT_STATUS[cita.status]||APPT_STATUS.pendiente;
              const isPast = cita.fecha < todayStr;
              const isUpcoming = cita.fecha >= todayStr && cita.status !== "cancelada" && cita.status !== "completada";
              return (
                <div key={cita.id} style={{...card(),padding:"14px 16px",marginBottom:12,borderLeft:`4px solid ${sc.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{svc?.nombre||"Servicio"}</div>
                      <div style={{fontSize:12,color:"#64748b",marginTop:2}}>📅 {cita.fecha} · 🕐 {cita.hora?.slice(0,5)}</div>
                      {emp && <div style={{fontSize:11,color:emp.color,marginTop:2,fontWeight:600}}>👤 {emp.nombre}</div>}
                    </div>
                    <div style={{background:`${sc.color}15`,border:`1px solid ${sc.color}30`,borderRadius:20,padding:"3px 10px",fontSize:9,color:sc.color,fontFamily:"'Space Mono',monospace",fontWeight:600}}>{sc.label}</div>
                  </div>
                  {isUpcoming && (
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <button onClick={()=>setShowReschedule(cita)} style={{flex:1,background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:12,padding:"8px",borderRadius:8,cursor:"pointer"}}>🔄 Reagendar</button>
                      <button onClick={()=>cancelarCitaCliente(cita.id)} style={{flex:1,background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:12,padding:"8px",borderRadius:8,cursor:"pointer"}}>✕ Cancelar</button>
                      <a href={addToCalendar(neg.nombre,svc?.nombre||"Cita",cita.fecha,cita.hora?.slice(0,5))} target="_blank" rel="noreferrer" style={{flex:1,background:"#F0FDF4",border:"1px solid #BBF7D0",color:"#166534",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:12,padding:"8px",borderRadius:8,cursor:"pointer",textDecoration:"none",textAlign:"center"}}>📅 Calendario</a>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Reschedule modal */}
            {showReschedule && (()=>{
              const [rDate, setRDate] = useState(showReschedule.fecha);
              const [rTime, setRTime] = useState("10:00");
              return (
                <div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}} onClick={()=>setShowReschedule(null)}>
                  <div style={{...card(),borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:400,animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>🔄 Reagendar cita</div>
                    <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
                      <div>
                        <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>NUEVA FECHA</div>
                        <input type="date" value={rDate} onChange={e=>setRDate(e.target.value)} style={inp()} min={todayStr}/>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>NUEVA HORA</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                          {HOURS.map(h=>{
                            const taken = appointments.find(a=>a.id!==showReschedule.id&&a.fecha===rDate&&a.hora?.startsWith(h)&&(showReschedule.empleado_id?a.empleado_id===showReschedule.empleado_id:false));
                            const blocked = isHourBlocked(rDate, h, showReschedule.empleado_id);
                            const unav = !!taken || blocked;
                            return <button key={h} disabled={unav} onClick={()=>setRTime(h)} style={{background:rTime===h?cc:unav?"#f1f5f9":"#fff",border:`1px solid ${rTime===h?cc:"#e2e8f0"}`,color:rTime===h?"#0f172a":unav?"#cbd5e1":"#334155",fontFamily:"'Space Mono',monospace",fontSize:10,padding:"7px 2px",borderRadius:6,cursor:unav?"not-allowed":"pointer",opacity:unav?0.4:1}}>{h}</button>;
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={()=>setShowReschedule(null)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
                      <button onClick={()=>reagendarCita(showReschedule.id,rDate,rTime)} style={{flex:2,background:`linear-gradient(135deg,${cc},${cc}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Confirmar reagenda</button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
          <div style={{padding:"20px 20px 80px"}}>
            <button onClick={()=>setClientView("book")} style={{width:"100%",background:`linear-gradient(135deg,${cc},${cc}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,padding:16,borderRadius:14,cursor:"pointer",marginBottom:12,boxShadow:`0 4px 20px ${cc}40`}}>📅 Reservar cita</button>

            {/* Mis citas */}
            {miNombre && (
              <button onClick={async()=>{ await loadMisCitas(); setClientView("miscitas"); }} style={{width:"100%",background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,padding:14,borderRadius:14,cursor:"pointer",marginBottom:20}}>📋 Ver mis citas</button>
            )}

            {/* Services */}
            <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:12}}>Servicios disponibles</div>
            {services.length===0 && <div style={{textAlign:"center",padding:"24px 0",color:"#94a3b8",fontFamily:"'Space Mono',monospace",fontSize:11}}>AÚN SIN SERVICIOS</div>}
            {services.map(svc=>{
              const sc = {"Corte":"#E8C547","Barba":"#F97316","Combo":"#4ECDC4","Color":"#F472B6","Uñas":"#A78BFA"}[svc.categoria]||"#60A5FA";
              return (
                <div key={svc.id} style={{...card(),padding:"12px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                  {svc.foto_url ? <img src={svc.foto_url} style={{width:38,height:38,borderRadius:8,objectFit:"cover"}} alt=""/> : <div style={{fontSize:20}}>{svc.emoji}</div>}
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{svc.nombre}</div>
                    <div style={{fontSize:10,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>⏱ {svc.duracion} min</div>
                  </div>
                  <div style={{fontSize:15,fontWeight:800,color:sc}}>${svc.precio}</div>
                </div>
              );
            })}

            {/* Products */}
            {products.length>0 && (
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:"20px 0 12px",display:"flex",alignItems:"center",gap:8}}>🛍️ Productos <span style={{fontSize:10,color:"#94a3b8",fontFamily:"'Space Mono',monospace",fontWeight:400}}>PAGO EN EL LOCAL</span></div>
                {products.map(prod=>(
                  <div key={prod.id} style={{...card(),padding:"12px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                    {prod.foto_url ? <img src={prod.foto_url} style={{width:38,height:38,borderRadius:8,objectFit:"cover"}} alt=""/> : <div style={{fontSize:20,width:38,height:38,background:"#60A5FA15",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>{prod.emoji}</div>}
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{prod.nombre}</div>
                      <div style={{fontSize:10,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>{prod.categoria} · Stock: {prod.stock}</div>
                    </div>
                    <div style={{fontSize:15,fontWeight:800,color:"#3B82F6"}}>${prod.precio}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Gallery */}
            {galeria.length>0 && (
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:"20px 0 12px"}}>📸 Galería de trabajos</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:8}}>
                  {galeria.slice(0,6).map(g=>(
                    <div key={g.id} style={{borderRadius:10,overflow:"hidden",aspectRatio:"1"}}>
                      <img src={g.foto_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={g.descripcion||""}/>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div style={{margin:"20px 0 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>⭐ Reseñas{resenas.length>0&&` (${resenas.length})`}</div>
              <button onClick={()=>setShowResena(true)} style={{background:cc,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"6px 12px",borderRadius:8,cursor:"pointer"}}>+ Dejar reseña</button>
            </div>
            {resenas.length===0 && <div style={{textAlign:"center",padding:"16px 0",color:"#94a3b8",fontSize:12}}>Sé el primero en dejar una reseña</div>}
            {resenas.slice(0,3).map(r=>(
              <div key={r.id} style={{...card(),padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{r.cliente_nombre}</div>
                  <div style={{fontSize:14}}>{"⭐".repeat(r.calificacion)}</div>
                </div>
                {r.comentario && <div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>{r.comentario}</div>}
              </div>
            ))}

            {/* Waitlist */}
            <div style={{...card(),padding:16,marginTop:20,background:"#FFF7ED",border:"1px solid #FED7AA"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#9A3412",marginBottom:4}}>⏳ ¿No hay hora disponible?</div>
              <div style={{fontSize:11,color:"#C2410C",marginBottom:12}}>Apúntate a la lista de espera y te avisamos cuando haya disponibilidad.</div>
              <button onClick={()=>setShowEspera(true)} style={{background:"#F97316",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,padding:"9px 18px",borderRadius:10,cursor:"pointer"}}>Unirme a la lista de espera</button>
            </div>

            {/* Review modal */}
            {showResena && (
              <div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}} onClick={()=>setShowResena(false)}>
                <div style={{...card(),borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:400,animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
                  <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>⭐ Dejar una reseña</div>
                  <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
                    <input value={resenaF.nombre} onChange={e=>setResenaF(f=>({...f,nombre:e.target.value}))} placeholder="Tu nombre *" style={inp()}/>
                    <div>
                      <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:8}}>CALIFICACIÓN</div>
                      <div style={{display:"flex",gap:8}}>
                        {[1,2,3,4,5].map(n=>(
                          <button key={n} onClick={()=>setResenaF(f=>({...f,cal:n}))} style={{flex:1,background:resenaF.cal>=n?"#FEF3C7":"#f1f5f9",border:`1px solid ${resenaF.cal>=n?"#FDE68A":"#e2e8f0"}`,borderRadius:8,padding:"10px",cursor:"pointer",fontSize:18}}>⭐</button>
                        ))}
                      </div>
                    </div>
                    <textarea value={resenaF.comentario} onChange={e=>setResenaF(f=>({...f,comentario:e.target.value}))} placeholder="Cuéntanos tu experiencia (opcional)" rows={3} style={inp({resize:"none"})}/>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setShowResena(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
                    <button onClick={saveResena} style={{flex:2,background:"linear-gradient(135deg,#E8C547,#f0a500)",border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Publicar reseña</button>
                  </div>
                </div>
              </div>
            )}

            {/* Waitlist modal */}
            {showEspera && (
              <div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}} onClick={()=>setShowEspera(false)}>
                <div style={{...card(),borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:400,animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
                  <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>⏳ Lista de espera</div>
                  <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                    <input value={esperaF.nombre} onChange={e=>setEsperaF(f=>({...f,nombre:e.target.value}))} placeholder="Tu nombre *" style={inp()}/>
                    <input value={esperaF.tel} onChange={e=>setEsperaF(f=>({...f,tel:e.target.value}))} placeholder="WhatsApp para avisarte" style={inp()}/>
                    <select value={esperaF.svcId} onChange={e=>setEsperaF(f=>({...f,svcId:e.target.value}))} style={inp()}>
                      <option value="">Cualquier servicio</option>
                      {services.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                    <input type="date" value={esperaF.fecha} onChange={e=>setEsperaF(f=>({...f,fecha:e.target.value}))} style={inp()}/>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setShowEspera(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
                    <button onClick={saveEspera} style={{flex:2,background:"linear-gradient(135deg,#F97316,#ea6a0a)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Apuntarme</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── ADMIN DASHBOARD ────────────────────────────────────────────────────────
  return (
    <div style={bg}>
      <style>{CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"12px 20px",position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 8px #00000008"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div onClick={()=>document.getElementById("fotoNeg").click()} style={{width:44,height:44,borderRadius:13,border:`2px solid ${ac}50`,overflow:"hidden",flexShrink:0,cursor:"pointer",...(negocioFoto?{backgroundImage:`url(${negocioFoto})`,backgroundSize:"cover",backgroundPosition:"center"}:{background:`${ac}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20})}}>
              {!negocioFoto && biz.icon}
            </div>
            <input id="fotoNeg" type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{ const f=e.target.files[0]; if(f){ const url=await uploadToStorage(f,"negocio"); setNegocioFoto(url); await supabase.from("negocios").update({foto_url:url}).eq("id",negocioId); } }}/>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>{businessName}</div>
              <div style={{fontSize:9,color:ac,fontFamily:"'Space Mono',monospace"}}>{biz.label.toUpperCase()} · {employees.length} EMPLEADOS</div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {user?.user_metadata?.picture && <img src={user.user_metadata.picture} style={{width:28,height:28,borderRadius:"50%",border:"2px solid #e2e8f0"}} alt=""/>}
            <button onClick={handleLogout} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontFamily:"'Space Mono',monospace",fontSize:9,padding:"6px 10px",borderRadius:8,cursor:"pointer"}}>Salir</button>
          </div>
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
          {[{l:`${counts.disponible} Libres`,c:"#10B981"},{l:`${counts.ocupado} Ocupados`,c:"#F59E0B"},{l:`${counts.descanso} Descanso`,c:"#8B5CF6"},{l:`${appointments.filter(a=>a.fecha===todayStr).length} Citas hoy`,c:"#3B82F6"}].map((p,i)=>(
            <div key={i} style={{background:`${p.c}12`,border:`1px solid ${p.c}30`,borderRadius:20,padding:"4px 10px",fontSize:10,color:p.c,fontWeight:600,whiteSpace:"nowrap"}}>{p.l}</div>
          ))}
          {newAlert>0 && <div onClick={()=>setNewAlert(0)} style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:20,padding:"4px 10px",fontSize:10,color:"#DC2626",fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",animation:"pulse 1.5s infinite"}}>🔔 {newAlert} nueva{newAlert>1?"s":""} cita{newAlert>1?"s":""}</div>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:"#fff",display:"flex",borderBottom:"1px solid #e2e8f0",padding:"0 20px",overflowX:"auto"}}>
        {[{k:"empleados",l:`${sw}s`,i:"👥"},{k:"agenda",l:"Agenda",i:"📅"},{k:"servicios",l:"Servicios",i:"📋"},{k:"productos",l:"Productos",i:"🛍️"},{k:"galeria",l:"Galería",i:"📸"},{k:"espera",l:"Espera",i:"⏳"},{k:"bloqueos",l:"Bloqueos",i:"🚫"},{k:"fidelizacion",l:"Fidelización",i:"🎁"},{k:"config",l:"Config",i:"⚙️"}].map(t=>(
          <button key={t.k} onClick={()=>setActiveTab(t.k)} style={{background:"transparent",border:"none",borderBottom:activeTab===t.k?`3px solid ${ac}`:"3px solid transparent",color:activeTab===t.k?ac:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,padding:"12px 14px 10px",cursor:"pointer",marginBottom:-1,whiteSpace:"nowrap"}}>{t.i} {t.l}</button>
        ))}
      </div>

      {/* ── EMPLEADOS ── */}
      {activeTab==="empleados" && (
        <div style={{padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:8}}>
            <div style={{display:"flex",gap:6,overflowX:"auto"}}>
              {["todos","disponible","ocupado","descanso"].map(f=>{
                const C = {todos:"#334155",disponible:"#10B981",ocupado:"#F59E0B",descanso:"#8B5CF6"}[f];
                const L = {todos:"Todos",disponible:"Libres",ocupado:"Ocupados",descanso:"Descanso"}[f];
                return (
                  <button key={f} onClick={()=>setFilterSt(f)} style={{background:filterSt===f?`${C}15`:"#fff",border:`1px solid ${filterSt===f?C:"#e2e8f0"}`,color:filterSt===f?C:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:10,padding:"5px 10px",borderRadius:8,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
                    <span style={{background:filterSt===f?C:"#e2e8f0",color:filterSt===f?"#fff":"#64748b",borderRadius:5,padding:"0 5px",fontSize:9,fontFamily:"'Space Mono',monospace"}}>{counts[f]}</span>{L}
                  </button>
                );
              })}
            </div>
            <button onClick={()=>setShowEmp(true)} style={{background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 14px",borderRadius:10,cursor:"pointer",flexShrink:0}}>+ Agregar</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
            {visible.map(emp=>{
              const cfg = STATUS_CFG[emp.status]||STATUS_CFG.disponible;
              const sel = selEmp===emp.id;
              return (
                <div key={emp.id} onClick={()=>setSelEmp(sel?null:emp.id)} style={{...card(),padding:16,cursor:"pointer",borderLeft:`3px solid ${sel?cfg.dot:"transparent"}`,transition:"all .15s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:cfg.dot,boxShadow:`0 0 6px ${cfg.dot}`,marginTop:4}}/>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#94a3b8",background:"#f1f5f9",borderRadius:6,padding:"2px 6px"}}>{sw.toUpperCase()} {emp.silla}</div>
                  </div>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
                    <div style={{width:52,height:52,borderRadius:"50%",background:`${emp.color}20`,border:`2px solid ${emp.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:emp.color}}>{emp.avatar}</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:2}}>{emp.nombre}</div>
                    <div style={{fontSize:9,color:ac,fontFamily:"'Space Mono',monospace",marginBottom:2}}>{emp.rol}</div>
                    <div style={{fontSize:9,color:"#94a3b8",fontFamily:"'Space Mono',monospace",marginBottom:8}}>{emp.especialidad}</div>
                    <div style={{display:"inline-block",background:`${cfg.dot}12`,border:`1px solid ${cfg.dot}25`,borderRadius:20,padding:"3px 10px",fontSize:9,fontWeight:600,color:cfg.dot}}>{cfg.label}</div>
                  </div>
                  {sel && (
                    <div style={{marginTop:12}}>
                      {["disponible","ocupado","descanso"].map(s=>(
                        <button key={s} onClick={e=>{e.stopPropagation();changeStatus(emp.id,s);}} style={{display:"flex",alignItems:"center",gap:7,width:"100%",background:emp.status===s?`${STATUS_CFG[s].dot}15`:"transparent",border:`1px solid ${emp.status===s?STATUS_CFG[s].dot:"#e2e8f0"}`,color:emp.status===s?STATUS_CFG[s].dot:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:11,padding:"6px 10px",borderRadius:8,cursor:"pointer",marginBottom:4}}>
                          <div style={{width:5,height:5,borderRadius:"50%",background:STATUS_CFG[s].dot}}/>{STATUS_CFG[s].label}
                        </button>
                      ))}
                      <button onClick={e=>{e.stopPropagation();removeEmp(emp.id);}} style={{width:"100%",background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:10,padding:"5px",borderRadius:8,cursor:"pointer",marginTop:2}}>Eliminar</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AGENDA ── */}
      {activeTab==="agenda" && (
        <div style={{padding:"18px 20px"}}>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{display:"flex",background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",overflow:"hidden"}}>
              {["dia","semana"].map(v=>(
                <button key={v} onClick={()=>setAgendaView(v)} style={{background:agendaView===v?ac:"transparent",border:"none",color:agendaView===v?"#0f172a":"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 14px",cursor:"pointer"}}>{v==="dia"?"📅 Día":"📆 Semana"}</button>
              ))}
            </div>
            {agendaView==="dia" && <input type="date" value={agendaDate} onChange={e=>setAgendaDate(e.target.value)} style={inp({width:"auto",fontSize:12})}/>}
            <select value={agendaEmp} onChange={e=>setAgendaEmp(e.target.value)} style={inp({width:"auto",fontSize:12})}>
              <option value="todos">Todos</option>
              {employees.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <button onClick={openAddAppt} style={{background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 14px",borderRadius:10,cursor:"pointer",marginLeft:"auto"}}>+ Nueva cita</button>
          </div>

          {/* Day view */}
          {agendaView==="dia" && (()=>{
            const dayAppts = appointments.filter(a=>a.fecha===agendaDate&&(agendaEmp==="todos"||a.empleado_id===agendaEmp));
            const dayBloqueos = bloqueos.filter(b=>b.fecha===agendaDate&&(agendaEmp==="todos"||!b.empleado_id||b.empleado_id===agendaEmp));
            return (
              <div>
                {dayBloqueos.map(b=>{
                  const emp = employees.find(e=>e.id===b.empleado_id);
                  const tipoCfg = TIPOS.find(t=>t.k===b.tipo)||TIPOS[0];
                  return (
                    <div key={`b-${b.id}`} style={{...card(),padding:"12px 16px",display:"flex",gap:12,marginBottom:8,borderLeft:`4px solid ${tipoCfg.c}`,background:`${tipoCfg.c}06`}}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,color:tipoCfg.c,minWidth:48,paddingTop:2}}>{b.hora_inicio?.slice(0,5)}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:tipoCfg.c}}>🚫 {b.motivo}</div>
                        <div style={{fontSize:11,color:"#64748b",marginTop:2}}>Hasta {b.hora_fin?.slice(0,5)}{emp?` · ${emp.nombre}`:` · Todos`}</div>
                      </div>
                      <button onClick={()=>deleteBloqueo(b.id)} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"5px 8px",cursor:"pointer",fontSize:11,alignSelf:"center"}}>✕</button>
                    </div>
                  );
                })}
                {dayAppts.length===0 && dayBloqueos.length===0 && <div style={{textAlign:"center",padding:"48px 0",color:"#94a3b8",fontFamily:"'Space Mono',monospace",fontSize:12}}>SIN CITAS PARA ESTE DÍA</div>}
                {dayAppts.sort((a,b)=>a.hora?.localeCompare(b.hora)).map(appt=>{
                  const emp = employees.find(e=>e.id===appt.empleado_id);
                  const svc = services.find(s=>s.id===appt.servicio_id);
                  const sc  = APPT_STATUS[appt.status]||APPT_STATUS.pendiente;
                  return (
                    <div key={appt.id} style={{...card(),padding:"14px 16px",display:"flex",gap:12,marginBottom:10,borderLeft:`4px solid ${sc.color}`}}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,color:ac,minWidth:48,paddingTop:2}}>{appt.hora?.slice(0,5)}</div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                          <div>
                            <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{appt.cliente_nombre}</div>
                            <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{svc?.emoji} {svc?.nombre}{svc?.duracion&&` · ${svc.duracion}min`}</div>
                            {emp && <div style={{fontSize:10,color:emp.color,marginTop:2,fontWeight:600}}>{emp.nombre}</div>}
                            {appt.es_domicilio&&<div style={{display:"inline-flex",alignItems:"center",gap:4,background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:6,padding:"3px 8px",fontSize:10,color:"#1D4ED8",fontWeight:600,marginTop:4}}>🏠 A domicilio{appt.direccion_cliente?` · ${appt.direccion_cliente}`:""}</div>}
                            {appt.cliente_telefono && (
                              <div style={{display:"flex",gap:6,marginTop:6}}>
                                <a href={`tel:${appt.cliente_telefono}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:6,padding:"4px 10px",fontSize:10,fontFamily:"'Syne',sans-serif",fontWeight:600,textDecoration:"none"}}>📞 Llamar</a>
                                <a href={waMsg(appt.cliente_telefono,businessName,appt.fecha,appt.hora?.slice(0,5))} target="_blank" rel="noreferrer" style={{background:"#F0FDF4",border:"1px solid #BBF7D0",color:"#166534",borderRadius:6,padding:"4px 10px",fontSize:10,fontFamily:"'Syne',sans-serif",fontWeight:600,textDecoration:"none"}}>💬 WhatsApp</a>
                              </div>
                            )}
                          </div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                            <div style={{background:`${sc.color}15`,border:`1px solid ${sc.color}30`,borderRadius:20,padding:"3px 10px",fontSize:9,color:sc.color,fontFamily:"'Space Mono',monospace",fontWeight:600}}>{sc.label}</div>
                            <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                              {appt.status==="pendiente" && <button title="Confirmar" onClick={()=>updateApptStatus(appt.id,"confirmada")} style={{background:"#D1FAE5",border:"1px solid #6EE7B7",color:"#065F46",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,padding:"4px 8px",borderRadius:6,cursor:"pointer"}}>✓ Confirmar</button>}
                              {appt.status!=="completada" && <button title="Completada" onClick={()=>updateApptStatus(appt.id,"completada")} style={{background:"#EDE9FE",border:"1px solid #C4B5FD",color:"#5B21B6",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,padding:"4px 8px",borderRadius:6,cursor:"pointer"}}>✅ Listo</button>}
                              <button title="Editar" onClick={()=>openEditAppt(appt)} style={{background:"#F1F5F9",border:"1px solid #CBD5E1",color:"#475569",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:10,padding:"4px 8px",borderRadius:6,cursor:"pointer"}}>✏ Editar</button>
                              <button title="Eliminar" onClick={()=>deleteAppt(appt.id)} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:10,padding:"4px 8px",borderRadius:6,cursor:"pointer"}}>✕ Borrar</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Week view */}
          {agendaView==="semana" && (
            <div style={{overflowX:"auto",position:"relative"}}>
              {weekPopup && (
                <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:"#0000003d"}} onClick={()=>setWeekPopup(null)}>
                  <div style={{...card(),padding:22,maxWidth:360,width:"100%",animation:"slideUp .2s ease"}} onClick={e=>e.stopPropagation()}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                      <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>Detalles de la cita</div>
                      <button onClick={()=>setWeekPopup(null)} style={{background:"#f1f5f9",border:"none",color:"#64748b",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:14}}>✕</button>
                    </div>
                    {(()=>{
                      const a = weekPopup;
                      const emp = employees.find(e=>e.id===a.empleado_id);
                      const svc = services.find(s=>s.id===a.servicio_id);
                      const sc  = APPT_STATUS[a.status]||APPT_STATUS.pendiente;
                      return (
                        <div>
                          {[["👤 Cliente",a.cliente_nombre],["📞 Teléfono",a.cliente_telefono||"—"],["📍 Modalidad",a.es_domicilio?"🏠 A domicilio":"🏪 En el local"],a.es_domicilio&&a.direccion_cliente?["🗺️ Dirección",a.direccion_cliente]:null,["✂️ Servicio",svc?.nombre||"—"],["💰 Precio",svc?`$${svc.precio}`:"—"],["⏱ Duración",svc?`${svc.duracion} min`:"—"],["👨 Profesional",emp?.nombre||"—"],["📅 Fecha",a.fecha],["🕐 Hora",a.hora?.slice(0,5)]].filter(Boolean).map(([l,v])=>(
                            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f1f5f9"}}>
                              <span style={{fontSize:11,color:"#64748b"}}>{l}</span>
                              <span style={{fontSize:12,fontWeight:600,color:"#0f172a"}}>{v}</span>
                            </div>
                          ))}
                          <div style={{display:"inline-block",background:`${sc.color}15`,border:`1px solid ${sc.color}30`,borderRadius:20,padding:"4px 12px",fontSize:10,color:sc.color,fontFamily:"'Space Mono',monospace",fontWeight:600,marginTop:12}}>{sc.label}</div>
                          {a.cliente_telefono && (
                            <div style={{display:"flex",gap:8,marginTop:12}}>
                              <a href={`tel:${a.cliente_telefono}`} style={{flex:1,background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:8,padding:"9px",fontSize:12,fontFamily:"'Syne',sans-serif",fontWeight:600,textDecoration:"none",textAlign:"center"}}>📞 Llamar</a>
                              <a href={waMsg(a.cliente_telefono,businessName,a.fecha,a.hora?.slice(0,5))} target="_blank" rel="noreferrer" style={{flex:1,background:"#F0FDF4",border:"1px solid #BBF7D0",color:"#166534",borderRadius:8,padding:"9px",fontSize:12,fontFamily:"'Syne',sans-serif",fontWeight:600,textDecoration:"none",textAlign:"center"}}>💬 WhatsApp</a>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"54px repeat(7,1fr)",gap:3,minWidth:560}}>
                <div/>
                {weekDates.map((d,i)=>{
                  const isToday = d===todayStr;
                  return (
                    <div key={d} style={{textAlign:"center",padding:"8px 4px",background:isToday?`${ac}15`:"transparent",borderRadius:8,border:isToday?`1px solid ${ac}30`:"1px solid transparent"}}>
                      <div style={{fontSize:9,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>{DAYS[i]}</div>
                      <div style={{fontSize:15,fontWeight:800,color:isToday?ac:"#334155",marginTop:2}}>{new Date(d).getUTCDate()}</div>
                    </div>
                  );
                })}
                {HOURS.filter((_,i)=>i%2===0).map(hour=>(
                  <div key={hour} style={{display:"contents"}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#94a3b8",padding:"8px 4px",textAlign:"right"}}>{hour}</div>
                    {weekDates.map(d=>{
                      const cell = appointments.filter(a=>a.fecha===d&&a.hora?.startsWith(hour)&&(agendaEmp==="todos"||a.empleado_id===agendaEmp));
                      return (
                        <div key={`${d}-${hour}`} style={{background:"#fff",borderRadius:6,border:"1px solid #e2e8f0",minHeight:38,padding:2}}>
                          {cell.map(a=>{
                            const sc = APPT_STATUS[a.status]||APPT_STATUS.pendiente;
                            return <div key={a.id} onClick={()=>setWeekPopup(a)} style={{background:`${sc.color}20`,border:`1px solid ${sc.color}40`,borderRadius:4,padding:"3px 5px",fontSize:9,color:sc.color,lineHeight:1.4,cursor:"pointer",fontWeight:600,marginBottom:2}}>{a.cliente_nombre}</div>;
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SERVICIOS ── */}
      {activeTab==="servicios" && (
        <div style={{padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
            <button onClick={openAddSvc} style={{background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 16px",borderRadius:10,cursor:"pointer"}}>+ Nuevo servicio</button>
          </div>
          {services.length===0 && <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:10}}>📋</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:11}}>SIN SERVICIOS AÚN</div></div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
            {services.map(svc=>{
              const sc = {"Corte":"#E8C547","Barba":"#F97316","Combo":"#4ECDC4","Color":"#F472B6","Uñas":"#A78BFA","General":"#60A5FA"}[svc.categoria]||"#60A5FA";
              return (
                <div key={svc.id} style={{...card(),overflow:"hidden"}}>
                  {svc.foto_url ? <img src={svc.foto_url} style={{width:"100%",height:120,objectFit:"cover"}} alt=""/> : (
                    <div style={{background:`${sc}10`,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${sc}15`}}>
                      <div style={{fontSize:28}}>{svc.emoji}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{svc.nombre}</div>
                        {svc.categoria && <div style={{display:"inline-block",background:`${sc}20`,borderRadius:20,padding:"2px 10px",fontSize:9,color:sc,marginTop:4,fontFamily:"'Space Mono',monospace"}}>{svc.categoria}</div>}
                      </div>
                    </div>
                  )}
                  <div style={{padding:"12px 16px"}}>
                    {svc.foto_url && <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:4}}>{svc.nombre}</div>}
                    <div style={{fontSize:10,color:"#64748b",marginBottom:10}}>{svc.descripcion}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:18,fontWeight:800,color:ac}}>${svc.precio}</div>
                        <div style={{fontSize:9,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>⏱ {svc.duracion} min</div>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>openEditSvc(svc)} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#475569",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:600}}>Editar</button>
                        <button onClick={()=>deleteSvc(svc.id)} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:11}}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PRODUCTOS ── */}
      {activeTab==="productos" && (
        <div style={{padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>Productos en venta</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>El cliente paga en el local</div>
            </div>
            <button onClick={openAddProd} style={{background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 14px",borderRadius:10,cursor:"pointer"}}>+ Nuevo producto</button>
          </div>
          {products.length===0 && <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}><div style={{fontSize:40,marginBottom:10}}>🛍️</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:11}}>SIN PRODUCTOS AÚN</div></div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
            {products.map(prod=>(
              <div key={prod.id} style={{...card(),overflow:"hidden"}}>
                {prod.foto_url ? <img src={prod.foto_url} style={{width:"100%",height:110,objectFit:"cover"}} alt=""/> : (
                  <div style={{background:"#f8fafc",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:30}}>{prod.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{prod.nombre}</div>
                      {prod.categoria && <div style={{fontSize:10,color:"#94a3b8",fontFamily:"'Space Mono',monospace",marginTop:2}}>{prod.categoria}</div>}
                    </div>
                  </div>
                )}
                <div style={{padding:"12px 16px"}}>
                  {prod.foto_url && <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:4}}>{prod.nombre}</div>}
                  <div style={{fontSize:10,color:"#64748b",marginBottom:8}}>{prod.descripcion}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:18,fontWeight:800,color:ac}}>${prod.precio}</div>
                      <div style={{fontSize:9,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>📦 Stock: {prod.stock}</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>openEditProd(prod)} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#475569",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:600}}>Editar</button>
                      <button onClick={()=>deleteProd(prod.id)} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:11}}>✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GALERÍA ── */}
      {activeTab==="galeria" && (
        <div style={{padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>Galería de trabajos</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>Muestra tus mejores trabajos a los clientes</div>
            </div>
            <button onClick={()=>setShowGal(true)} style={{background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 14px",borderRadius:10,cursor:"pointer"}}>+ Agregar foto</button>
          </div>
          {galeria.length===0 && <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}><div style={{fontSize:40,marginBottom:10}}>📸</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:11}}>SIN FOTOS AÚN</div></div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12}}>
            {galeria.map(g=>(
              <div key={g.id} style={{position:"relative",borderRadius:14,overflow:"hidden",aspectRatio:"1",boxShadow:"0 2px 12px #0000001a"}}>
                <img src={g.foto_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
                {g.descripcion && <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,#000000aa)",padding:"8px",fontSize:10,color:"#fff",fontFamily:"'Syne',sans-serif"}}>{g.descripcion}</div>}
                <button onClick={()=>deleteGal(g.id)} style={{position:"absolute",top:6,right:6,background:"#FF000099",border:"none",color:"#fff",borderRadius:"50%",width:24,height:24,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LISTA DE ESPERA ── */}
      {activeTab==="espera" && (
        <div style={{padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>Lista de espera</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>Clientes esperando disponibilidad</div>
            </div>
            <span style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:20,padding:"4px 12px",fontSize:11,color:"#1D4ED8",fontWeight:700}}>{listaEspera.length} en espera</span>
          </div>
          {listaEspera.length===0 && <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}><div style={{fontSize:40,marginBottom:10}}>⏳</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:11}}>LISTA DE ESPERA VACÍA</div></div>}
          {listaEspera.map(e=>{
            const svc = services.find(s=>s.id===e.servicio_id);
            return (
              <div key={e.id} style={{...card(),padding:"14px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                <div style={{width:40,height:40,background:"#EFF6FF",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⏳</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{e.cliente_nombre}</div>
                  <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{svc?.nombre||"Cualquier servicio"} · {e.fecha_preferida}</div>
                  {e.cliente_telefono && (
                    <div style={{display:"flex",gap:6,marginTop:6}}>
                      <a href={`tel:${e.cliente_telefono}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:6,padding:"4px 8px",fontSize:10,fontFamily:"'Syne',sans-serif",fontWeight:600,textDecoration:"none"}}>📞 Llamar</a>
                      <a href={`https://wa.me/${e.cliente_telefono.replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${e.cliente_nombre}, tenemos disponibilidad en ${businessName}. ¿Te interesa agendar?`)}`} target="_blank" rel="noreferrer" style={{background:"#F0FDF4",border:"1px solid #BBF7D0",color:"#166534",borderRadius:6,padding:"4px 8px",fontSize:10,fontFamily:"'Syne',sans-serif",fontWeight:600,textDecoration:"none"}}>💬 WhatsApp</a>
                    </div>
                  )}
                </div>
                <button onClick={()=>deleteEspera(e.id)} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:11}}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BLOQUEOS ── */}
      {activeTab==="bloqueos" && (
        <div style={{padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>🚫 Horas no disponibles</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>Bloquea horarios para almuerzo, reservados o sin cita</div>
            </div>
            <button onClick={()=>setShowBloqueo(true)} style={{background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 14px",borderRadius:10,cursor:"pointer"}}>+ Agregar bloqueo</button>
          </div>
          {bloqueos.length===0 && (
            <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}>
              <div style={{fontSize:40,marginBottom:10}}>🚫</div>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:11}}>SIN BLOQUEOS · TODOS LOS HORARIOS DISPONIBLES</div>
            </div>
          )}
          {bloqueos.map(b=>{
            const emp = employees.find(e=>e.id===b.empleado_id);
            const tipoCfg = TIPOS.find(t=>t.k===b.tipo)||TIPOS[0];
            return (
              <div key={b.id} style={{...card(),padding:"14px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:10,borderLeft:`4px solid ${tipoCfg.c}`}}>
                <div style={{width:40,height:40,background:`${tipoCfg.c}15`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🚫</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{b.motivo}</div>
                  <div style={{fontSize:11,color:"#64748b",marginTop:2}}>📅 {b.fecha} · 🕐 {b.hora_inicio?.slice(0,5)} – {b.hora_fin?.slice(0,5)}</div>
                  {emp && <div style={{fontSize:10,color:emp.color,marginTop:2,fontWeight:600}}>👤 Solo para: {emp.nombre}</div>}
                  {!emp && <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>Aplica a todos los empleados</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                  <div style={{background:`${tipoCfg.c}15`,border:`1px solid ${tipoCfg.c}30`,borderRadius:20,padding:"3px 10px",fontSize:9,color:tipoCfg.c,fontFamily:"'Space Mono',monospace",fontWeight:600}}>{tipoCfg.l}</div>
                  <button onClick={()=>deleteBloqueo(b.id)} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"5px 8px",cursor:"pointer",fontSize:11}}>✕ Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FIDELIZACIÓN ── */}
      {activeTab==="fidelizacion" && (
        <div style={{padding:"18px 20px"}}>
          <div style={{...card(),padding:20,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>🎁 Sistema de fidelización</div>
                <div style={{fontSize:11,color:"#64748b",marginTop:4}}>Premia a tus clientes frecuentes</div>
              </div>
              <div onClick={()=>toggleFidel(!fidelActiva)} style={{width:44,height:24,background:fidelActiva?"#10B981":"#e2e8f0",borderRadius:12,cursor:"pointer",position:"relative",transition:"all .3s"}}>
                <div style={{width:20,height:20,background:"#fff",borderRadius:"50%",position:"absolute",top:2,left:fidelActiva?22:2,transition:"all .3s",boxShadow:"0 1px 4px #00000030"}}/>
              </div>
            </div>
            {fidelActiva ? (
              <div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:8}}>CITAS PARA GANAR PREMIO</div>
                  <div style={{display:"flex",gap:8}}>
                    {[3,5,8,10].map(n=>(
                      <button key={n} onClick={()=>setPremio(n)} style={{flex:1,background:citasPremio===n?ac:"#f1f5f9",border:`1px solid ${citasPremio===n?ac:"#e2e8f0"}`,color:citasPremio===n?"#0f172a":"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,padding:"10px",borderRadius:10,cursor:"pointer"}}>{n}</button>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:8}}>Cada cliente que complete {citasPremio} citas gana una recompensa 🎁</div>
                </div>
                <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:12,padding:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#166534",marginBottom:8}}>Sistema activo</div>
                  <div style={{fontSize:11,color:"#64748b"}}>Los puntos se acumulan automáticamente con cada cita completada.</div>
                </div>
              </div>
            ) : (
              <div style={{textAlign:"center",padding:"20px 0",color:"#94a3b8",fontSize:12}}>Activa el interruptor para habilitar la fidelización en tu negocio</div>
            )}
          </div>
        </div>
      )}

      {/* ── CONFIG ── */}
      {activeTab==="config" && (
        <div style={{padding:"18px 20px"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:16}}>⚙️ Configuración</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{...card(),padding:16}}>
              <div style={{fontSize:12,fontWeight:700,color:"#334155",marginBottom:10}}>📍 Dirección y contacto</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <input placeholder="Dirección del negocio" style={inp()} onChange={async e=>{ await supabase.from("negocios").update({direccion:e.target.value}).eq("id",negocioId); }}/>
                <input placeholder="WhatsApp (con código de país: 18091234567)" style={inp()} onChange={async e=>{ await supabase.from("negocios").update({whatsapp:e.target.value}).eq("id",negocioId); }}/>
              </div>
            </div>
            <div style={{...card(),padding:16}}>
              <div style={{fontSize:12,fontWeight:700,color:"#334155",marginBottom:10}}>🏠 Servicio a domicilio</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:domActivo?12:0}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>Ofrecer servicio a domicilio</div>
                  <div style={{fontSize:11,color:"#64748b",marginTop:2}}>Los clientes podrán elegir si quieren el servicio en el local o en su casa</div>
                </div>
                <button onClick={async()=>{ const v=!domActivo; setDomActivo(v); await supabase.from("negocios").update({domicilio_activo:v}).eq("id",negocioId); }} style={{width:48,height:26,borderRadius:99,background:domActivo?"#10B981":"#e2e8f0",border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:domActivo?25:3,transition:"left .2s"}}/>
                </button>
              </div>
              {domActivo&&(
                <div>
                  <div style={{fontSize:11,color:"#64748b",marginBottom:6,fontFamily:"'Space Mono',monospace"}}>COSTO ADICIONAL A DOMICILIO ($)</div>
                  <input type="number" defaultValue={domCosto} placeholder="Ej: 200" style={inp()} onBlur={async e=>{ const v=Number(e.target.value)||0; setDomCosto(v); await supabase.from("negocios").update({domicilio_costo:v}).eq("id",negocioId); }}/>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>Pon 0 si el servicio a domicilio no tiene costo adicional</div>
                </div>
              )}
            </div>
            <div style={{...card(),padding:16}}>
              <div style={{fontSize:12,fontWeight:700,color:"#334155",marginBottom:4}}>🗑️ Zona de peligro</div>
              <div style={{fontSize:11,color:"#64748b",marginBottom:12}}>Esta acción es irreversible. Se eliminará el negocio y todos sus datos.</div>
              <button onClick={deleteNegocio} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,padding:"10px 20px",borderRadius:10,cursor:"pointer"}}>🗑️ Eliminar mi negocio</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODALS ══ */}

      {/* Modal – Employee */}
      {showEmp && (
        <div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100}} onClick={()=>setShowEmp(false)}>
          <div style={{...card(),borderRadius:"20px 20px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:480,animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:4,background:"#e2e8f0",borderRadius:2,margin:"0 auto 20px"}}/>
            <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>Nuevo empleado — {sw} {employees.length+1}</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
              <input value={empName} onChange={e=>setEmpName(e.target.value)} placeholder="Nombre completo" style={inp()}/>
              <select value={empRole} onChange={e=>setEmpRole(e.target.value)} style={inp()}>
                <option value="">Selecciona un rol</option>
                {roles.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
              <input value={empSpec} onChange={e=>setEmpSpec(e.target.value)} placeholder="Especialidad" style={inp()}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowEmp(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
              <button onClick={addEmp} style={{flex:2,background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal – Service */}
      {showSvc && (
        <div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setShowSvc(false)}>
          <div style={{...card(),borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,maxHeight:"92vh",overflowY:"auto",animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>{editSvc?"Editar servicio":"Nuevo servicio"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
              <div>
                <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>FOTO (OPCIONAL)</div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {svcF.foto && <img src={svcF.foto} style={{width:60,height:60,borderRadius:10,objectFit:"cover",border:"1px solid #e2e8f0"}} alt=""/>}
                  <label style={{background:"#f1f5f9",border:"1px dashed #cbd5e1",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:12,color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600}}>
                    📷 {svcF.foto?"Cambiar":"Subir foto"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{ const f=e.target.files[0]; if(f){ const url=await uploadToStorage(f,"servicio"); setSvcF(x=>({...x,foto:url})); } }}/>
                  </label>
                  {svcF.foto && <button onClick={()=>setSvcF(x=>({...x,foto:""}))} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11}}>✕</button>}
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>EMOJI</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {SVC_EMOJI.map(e=><button key={e} onClick={()=>setSvcF(f=>({...f,emoji:e}))} style={{width:38,height:38,background:svcF.emoji===e?`${ac}20`:"#f8fafc",border:`1px solid ${svcF.emoji===e?ac:"#e2e8f0"}`,borderRadius:10,cursor:"pointer",fontSize:18}}>{e}</button>)}
                </div>
              </div>
              <input value={svcF.name} onChange={e=>setSvcF(f=>({...f,name:e.target.value}))} placeholder="Nombre del servicio *" style={inp()}/>
              <input value={svcF.cat} onChange={e=>setSvcF(f=>({...f,cat:e.target.value}))} placeholder="Categoría (ej: Corte, Barba, Color…)" style={inp()}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <input type="number" value={svcF.price} onChange={e=>setSvcF(f=>({...f,price:e.target.value}))} placeholder="Precio $" style={inp()}/>
                <input type="number" value={svcF.dur} onChange={e=>setSvcF(f=>({...f,dur:e.target.value}))} placeholder="Duración min" style={inp()}/>
              </div>
              <textarea value={svcF.desc} onChange={e=>setSvcF(f=>({...f,desc:e.target.value}))} placeholder="Descripción (opcional)" rows={2} style={inp({resize:"none"})}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowSvc(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
              <button onClick={saveSvc} style={{flex:2,background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal – Product */}
      {showProd && (
        <div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setShowProd(false)}>
          <div style={{...card(),borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,maxHeight:"92vh",overflowY:"auto",animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>{editProd?"Editar producto":"Nuevo producto"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
              <div>
                <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>FOTO (OPCIONAL)</div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {prodF.foto && <img src={prodF.foto} style={{width:60,height:60,borderRadius:10,objectFit:"cover",border:"1px solid #e2e8f0"}} alt=""/>}
                  <label style={{background:"#f1f5f9",border:"1px dashed #cbd5e1",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:12,color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600}}>
                    📷 {prodF.foto?"Cambiar":"Subir foto"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{ const f=e.target.files[0]; if(f){ const url=await uploadToStorage(f,"producto"); setProdF(x=>({...x,foto:url})); } }}/>
                  </label>
                  {prodF.foto && <button onClick={()=>setProdF(x=>({...x,foto:""}))} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11}}>✕</button>}
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>EMOJI</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {PROD_EMOJI.map(e=><button key={e} onClick={()=>setProdF(f=>({...f,emoji:e}))} style={{width:38,height:38,background:prodF.emoji===e?`${ac}20`:"#f8fafc",border:`1px solid ${prodF.emoji===e?ac:"#e2e8f0"}`,borderRadius:10,cursor:"pointer",fontSize:18}}>{e}</button>)}
                </div>
              </div>
              <input value={prodF.name} onChange={e=>setProdF(f=>({...f,name:e.target.value}))} placeholder="Nombre del producto *" style={inp()}/>
              <input value={prodF.cat} onChange={e=>setProdF(f=>({...f,cat:e.target.value}))} placeholder="Categoría (ej: Pomada, Esmalte…)" style={inp()}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <input type="number" value={prodF.price} onChange={e=>setProdF(f=>({...f,price:e.target.value}))} placeholder="Precio $" style={inp()}/>
                <input type="number" value={prodF.stock} onChange={e=>setProdF(f=>({...f,stock:e.target.value}))} placeholder="Stock" style={inp()}/>
              </div>
              <textarea value={prodF.desc} onChange={e=>setProdF(f=>({...f,desc:e.target.value}))} placeholder="Descripción (opcional)" rows={2} style={inp({resize:"none"})}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowProd(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
              <button onClick={saveProd} style={{flex:2,background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal – Gallery */}
      {showGal && (
        <div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setShowGal(false)}>
          <div style={{...card(),borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>📸 Agregar foto a la galería</div>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
              {galFoto && <img src={galFoto} style={{width:"100%",height:180,objectFit:"cover",borderRadius:12,border:"1px solid #e2e8f0"}} alt=""/>}
              <label style={{background:"#f1f5f9",border:"1px dashed #cbd5e1",borderRadius:10,padding:"14px",cursor:"pointer",fontSize:13,color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,textAlign:"center"}}>
                📷 {galFoto?"Cambiar foto":"Seleccionar foto"}
                <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{ const f=e.target.files[0]; if(f){ const url=await f2b(f); setGalFoto(url); } }}/>
              </label>
              <input value={galDesc} onChange={e=>setGalDesc(e.target.value)} placeholder="Descripción (ej: Fade clásico con diseño)" style={inp()}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowGal(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
              <button onClick={saveGal} disabled={!galFoto} style={{flex:2,background:galFoto?`linear-gradient(135deg,${ac},${ac}cc)`:"#e2e8f0",border:"none",color:galFoto?"#0f172a":"#94a3b8",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:galFoto?"pointer":"not-allowed"}}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal – Bloqueo */}
      {showBloqueo && (
        <div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setShowBloqueo(false)}>
          <div style={{...card(),borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>🚫 Agregar bloqueo de horario</div>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
              <div>
                <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>TIPO DE BLOQUEO</div>
                <div style={{display:"flex",gap:8}}>
                  {TIPOS.map(t=>(
                    <button key={t.k} onClick={()=>setBloqueoF(f=>({...f,tipo:t.k,motivo:t.l}))} style={{flex:1,background:bloqueoF.tipo===t.k?`${t.c}20`:"#f1f5f9",border:`1px solid ${bloqueoF.tipo===t.k?t.c:"#e2e8f0"}`,color:bloqueoF.tipo===t.k?t.c:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:10,padding:"8px 4px",borderRadius:8,cursor:"pointer"}}>{t.l}</button>
                  ))}
                </div>
              </div>
              <select value={bloqueoF.empId} onChange={e=>setBloqueoF(f=>({...f,empId:e.target.value}))} style={inp()}>
                <option value="">Todos los empleados</option>
                {employees.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              <input value={bloqueoF.motivo} onChange={e=>setBloqueoF(f=>({...f,motivo:e.target.value}))} placeholder="Motivo (ej: Almuerzo, Reunión…)" style={inp()}/>
              <input type="date" value={bloqueoF.fecha} onChange={e=>setBloqueoF(f=>({...f,fecha:e.target.value}))} style={inp()} min={todayStr}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>HORA INICIO</div>
                  <select value={bloqueoF.horaInicio} onChange={e=>setBloqueoF(f=>({...f,horaInicio:e.target.value}))} style={inp()}>
                    {HOURS.map(h=><option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>HORA FIN</div>
                  <select value={bloqueoF.horaFin} onChange={e=>setBloqueoF(f=>({...f,horaFin:e.target.value}))} style={inp()}>
                    {HOURS.map(h=><option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowBloqueo(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
              <button onClick={saveBloqueo} style={{flex:2,background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Guardar bloqueo</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal – Appointment */}
      {showAppt && (
        <div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setShowAppt(false)}>
          <div style={{...card(),borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>{editAppt?"Editar cita":"Nueva cita"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
              <input value={apptF.client} onChange={e=>setApptF(f=>({...f,client:e.target.value}))} placeholder="Nombre del cliente *" style={inp()}/>
              <input value={apptF.phone} onChange={e=>setApptF(f=>({...f,phone:e.target.value}))} placeholder="Teléfono / WhatsApp" style={inp()}/>
              <select value={apptF.empId} onChange={e=>setApptF(f=>({...f,empId:e.target.value}))} style={inp()}>
                <option value="">Selecciona empleado</option>
                {employees.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              <select value={apptF.svcId} onChange={e=>setApptF(f=>({...f,svcId:e.target.value}))} style={inp()}>
                <option value="">Selecciona servicio</option>
                {services.map(s=><option key={s.id} value={s.id}>{s.emoji} {s.nombre} – ${s.precio}</option>)}
              </select>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <input type="date" value={apptF.date} onChange={e=>setApptF(f=>({...f,date:e.target.value}))} style={inp()}/>
                <select value={apptF.time} onChange={e=>setApptF(f=>({...f,time:e.target.value}))} style={inp()}>
                  {HOURS.map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowAppt(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
              <button onClick={saveAppt} style={{flex:2,background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
