import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://htadelbjzgnrglackutq.supabase.co";
const SUPABASE_KEY = "sb_publishable_150CaBmtYRRl6jpI_aySng_SO4gxu-l";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUSINESS_TYPES = [
  { key:"barberia", label:"Barbería",         icon:"✂️", color:"#E8C547", desc:"Cortes, fade, barba" },
  { key:"salon",    label:"Salón de Belleza",  icon:"💇", color:"#F472B6", desc:"Cabello, coloración" },
  { key:"unas",     label:"Centro de Uñas",    icon:"💅", color:"#A78BFA", desc:"Manicure, pedicure" },
  { key:"mixto",    label:"Centro de Belleza", icon:"✨", color:"#4ECDC4", desc:"Servicios combinados" },
];
const ROLE_BY_TYPE    = { barberia:["Barbero","Aprendiz","Encargado"], salon:["Estilista","Colorista","Asistente","Encargada"], unas:["Técnica de Uñas","Manicurista","Encargada"], mixto:["Estilista","Barbero","Técnica de Uñas","Encargado/a"] };
const STATION_BY_TYPE = { barberia:"Silla", salon:"Silla", unas:"Mesa", mixto:"Puesto" };
const AVATAR_COLORS   = ["#E8C547","#4ECDC4","#FF6B6B","#A78BFA","#F97316","#34D399","#F472B6","#60A5FA"];
const CATEGORIES      = ["Corte","Barba","Combo","Color","Uñas","General"];
const PROD_CATS_BY_TYPE = {
  barberia: ["Pomadas","Aceites","Máquinas","Navajas","Aftershave","Otro"],
  salon:    ["Champús","Tintes","Tratamientos","Accesorios","Otro"],
  unas:     ["Esmaltes","Geles","Nail Art","Herramientas","Otro"],
  mixto:    ["Pomadas","Esmaltes","Champús","Accesorios","Otro"],
};
const PROD_EMOJIS = ["🧴","✂️","💈","🪒","💆","💅","🎨","🧼","🌿","⚡","🔥","🌟"];
const EMOJIS          = ["✂️","⚡","🧔","💈","🎨","💅","💆","🌟","👑","🔥"];
const HOURS           = ["9:00","9:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];
const DAYS            = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const statusConfig    = { ocupado:{label:"Ocupado",dot:"#E8C547"}, disponible:{label:"Disponible",dot:"#4ECDC4"}, descanso:{label:"Descanso",dot:"#A78BFA"} };
const apptStatus      = { confirmada:{label:"Confirmada",color:"#4ECDC4"}, pendiente:{label:"Pendiente",color:"#E8C547"}, cancelada:{label:"Cancelada",color:"#FF6B6B"}, completada:{label:"Completada",color:"#34D399"} };
const today           = new Date();
const todayStr        = today.toISOString().split("T")[0];
const weekDates       = Array.from({length:7},(_,i)=>{ const d=new Date(today); d.setDate(today.getDate()-today.getDay()+i); return d.toISOString().split("T")[0]; });

const inp = (extra={}) => ({ background:"#080c14", border:"1px solid #1e2a3a", borderRadius:10, padding:"11px 14px", color:"#f0ebe0", fontFamily:"'Syne',sans-serif", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", ...extra });
const sharedBg = { minHeight:"100vh", background:"#080c14", color:"#e8e0d0", fontFamily:"'Syne',sans-serif", backgroundImage:"radial-gradient(ellipse at 20% 50%, #0d1f3c33 0%, transparent 50%)" };

function Loader({ text="Cargando..." }) {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#080c14",flexDirection:"column",gap:12}}>
    <div style={{width:40,height:40,border:"3px solid #1e2a3a",borderTop:"3px solid #E8C547",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <div style={{color:"#4a5a6a",fontFamily:"'Space Mono',monospace",fontSize:12}}>{text}</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}

// ── AUTH SCREEN ───────────────────────────────────────────────────────────────
function AuthScreen({ onGuest }) {
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");

  const loginGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if(error) { setMsg("Error al conectar con Google. Intenta de nuevo."); setLoading(false); }
  };

  return (
    <div style={{...sharedBg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 20px"}}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>

      {/* Logo */}
      <div style={{textAlign:"center", marginBottom:40}}>
        <div style={{width:72,height:72,background:"linear-gradient(135deg,#E8C547,#f0a500)",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 16px",boxShadow:"0 8px 40px #E8C54740"}}>✂</div>
        <div style={{fontSize:28,fontWeight:800,color:"#f0ebe0",letterSpacing:"-1px"}}>ProCita</div>
        <div style={{fontSize:12,color:"#4a5a6a",marginTop:6,fontFamily:"'Space Mono',monospace"}}>RESERVAS PARA BARBERÍAS Y SALONES</div>
      </div>

      <div style={{width:"100%",maxWidth:400}}>
        {/* Google login */}
        <button onClick={loginGoogle} disabled={loading} style={{
          width:"100%", background:"#ffffff", border:"none", borderRadius:14,
          padding:"15px 20px", display:"flex", alignItems:"center", justifyContent:"center",
          gap:12, cursor:"pointer", marginBottom:12, boxShadow:"0 4px 20px #00000040",
          transition:"all .2s", opacity:loading?0.7:1
        }}>
          {/* Google icon SVG */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.9 12 24 12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.6 0-14.2 4.1-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8H6.3C9.7 39.5 16.4 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.5 4.6-4.6 6l6.2 5.2C40.7 36.3 44 30.6 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:"#1a1a1a"}}>
            {loading ? "Conectando..." : "Continuar con Google"}
          </span>
        </button>

        {/* Divider */}
        <div style={{display:"flex",alignItems:"center",gap:12,margin:"16px 0"}}>
          <div style={{flex:1,height:1,background:"#1e2a3a"}}/>
          <div style={{fontSize:11,color:"#3a4a5a",fontFamily:"'Space Mono',monospace"}}>O</div>
          <div style={{flex:1,height:1,background:"#1e2a3a"}}/>
        </div>

        {/* Guest mode */}
        <button onClick={onGuest} style={{
          width:"100%", background:"transparent", border:"1px solid #1e2a3a",
          borderRadius:14, padding:"15px 20px", display:"flex", alignItems:"center",
          justifyContent:"center", gap:10, cursor:"pointer", marginBottom:24,
          transition:"all .2s"
        }}>
          <span style={{fontSize:20}}>👤</span>
          <div style={{textAlign:"left"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:"#c8c0b0"}}>Entrar como invitado</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#3a4a5a",marginTop:2}}>SIN REGISTRO · SOLO PARA CLIENTES</div>
          </div>
        </button>

        {msg && <div style={{background:"#FF6B6B15",border:"1px solid #FF6B6B30",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#FF6B6B",textAlign:"center",marginBottom:16}}>{msg}</div>}

        {/* Info */}
        <div style={{background:"#0d1525",border:"1px solid #1e2a3a",borderRadius:14,padding:"16px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#f0ebe0",marginBottom:10}}>¿Por qué registrarse?</div>
          {[["✅","Guarda tu historial de citas"],["🏪","Registra tu negocio y gestiona todo"],["🔔","Recibe recordatorios"],["💾","Tus datos seguros y sincronizados"]].map(([i,t])=>(
            <div key={t} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:14}}>{i}</span>
              <span style={{fontSize:12,color:"#4a5a6a"}}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ROLE SELECTOR ─────────────────────────────────────────────────────────────
function RoleSelector({ user, onSelect }) {
  return (
    <div style={{...sharedBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:28,marginBottom:8}}>👋</div>
        <div style={{fontSize:20,fontWeight:800,color:"#f0ebe0"}}>¡Hola{user?.user_metadata?.name ? `, ${user.user_metadata.name.split(" ")[0]}` : ""}!</div>
        <div style={{fontSize:12,color:"#4a5a6a",marginTop:6,fontFamily:"'Space Mono',monospace"}}>¿CÓMO VAS A USAR PROCITA?</div>
      </div>
      <div style={{width:"100%",maxWidth:400,display:"flex",flexDirection:"column",gap:14}}>
        <div onClick={()=>onSelect("cliente")} style={{background:"#0d1525",border:"1px solid #4ECDC430",borderRadius:18,padding:"24px 20px",cursor:"pointer",transition:"all .2s"}}>
          <div style={{fontSize:36,marginBottom:10}}>📅</div>
          <div style={{fontSize:17,fontWeight:800,color:"#f0ebe0",marginBottom:4}}>Soy cliente</div>
          <div style={{fontSize:12,color:"#4a5a6a",lineHeight:1.5}}>Quiero reservar citas en barberías, salones y centros de uñas cercanos.</div>
          <div style={{marginTop:12,display:"inline-block",background:"#4ECDC415",border:"1px solid #4ECDC430",borderRadius:20,padding:"4px 14px",fontSize:10,color:"#4ECDC4",fontFamily:"'Space Mono',monospace"}}>VER NEGOCIOS →</div>
        </div>
        <div onClick={()=>onSelect("negocio")} style={{background:"#0d1525",border:"1px solid #E8C54730",borderRadius:18,padding:"24px 20px",cursor:"pointer",transition:"all .2s"}}>
          <div style={{fontSize:36,marginBottom:10}}>🏪</div>
          <div style={{fontSize:17,fontWeight:800,color:"#f0ebe0",marginBottom:4}}>Soy dueño de negocio</div>
          <div style={{fontSize:12,color:"#4a5a6a",lineHeight:1.5}}>Quiero registrar mi barbería, salón o centro de uñas y gestionar mis citas y empleados.</div>
          <div style={{marginTop:12,display:"inline-block",background:"#E8C54715",border:"1px solid #E8C54730",borderRadius:20,padding:"4px 14px",fontSize:10,color:"#E8C547",fontFamily:"'Space Mono',monospace"}}>GESTIONAR MI NEGOCIO →</div>
        </div>
      </div>
    </div>
  );
}

// ── BUSINESS DIRECTORY ────────────────────────────────────────────────────────
function Directory({ negocios, onSelect, user, onLogout, isGuest }) {
  const [filter, setFilter] = useState("todos");
  const filtered = filter==="todos" ? negocios : negocios.filter(n=>n.tipo===filter);

  return (
    <div style={sharedBg}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{borderBottom:"1px solid #1e2a3a",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,background:"linear-gradient(135deg,#E8C547,#f0a500)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#080c14"}}>✂</div>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#f0ebe0"}}>ProCita</div>
            <div style={{fontSize:9,color:"#4a5a6a",fontFamily:"'Space Mono',monospace"}}>{isGuest?"MODO INVITADO":"CLIENTE"}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {isGuest && <div style={{background:"#E8C54715",border:"1px solid #E8C54730",borderRadius:20,padding:"4px 10px",fontSize:9,color:"#E8C547",fontFamily:"'Space Mono',monospace"}}>INVITADO</div>}
          {!isGuest && user?.user_metadata?.picture && <img src={user.user_metadata.picture} style={{width:30,height:30,borderRadius:"50%",border:"2px solid #1e2a3a"}} alt="avatar"/>}
          <button onClick={onLogout} style={{background:"transparent",border:"1px solid #1e2a3a",color:"#4a5a6a",fontFamily:"'Space Mono',monospace",fontSize:9,padding:"6px 10px",borderRadius:8,cursor:"pointer"}}>Salir</button>
        </div>
      </div>

      <div style={{padding:"20px"}}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:800,color:"#f0ebe0",marginBottom:4}}>Elige tu negocio</div>
          <div style={{fontSize:12,color:"#4a5a6a"}}>{negocios.length} negocios disponibles</div>
        </div>

        {/* Filters */}
        <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
          {[{k:"todos",l:"Todos",i:"🌟"},{k:"barberia",l:"Barberías",i:"✂️"},{k:"salon",l:"Salones",i:"💇"},{k:"unas",l:"Uñas",i:"💅"},{k:"mixto",l:"Mixtos",i:"✨"}].map(f=>(
            <button key={f.k} onClick={()=>setFilter(f.k)} style={{background:filter===f.k?"#E8C54720":"transparent",border:`1px solid ${filter===f.k?"#E8C547":"#1e2a3a"}`,color:filter===f.k?"#E8C547":"#4a5a6a",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:11,padding:"7px 14px",borderRadius:20,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
              {f.i} {f.l}
            </button>
          ))}
        </div>

        {/* Business list */}
        {filtered.length===0 ? (
          <div style={{textAlign:"center",padding:"48px 0",color:"#3a4a5a"}}>
            <div style={{fontSize:40,marginBottom:12}}>🏪</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:11}}>AÚN NO HAY NEGOCIOS REGISTRADOS</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {filtered.map(neg=>{
              const bt=BUSINESS_TYPES.find(t=>t.key===neg.tipo)||BUSINESS_TYPES[0];
              return (
                <div key={neg.id} onClick={()=>onSelect(neg)} style={{background:"#0d1525",border:"1px solid #1e2a3a",borderRadius:18,overflow:"hidden",cursor:"pointer",transition:"all .2s"}}>
                  <div style={{background:`${bt.color}12`,borderBottom:`1px solid ${bt.color}20`,padding:"18px 18px 14px",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:52,height:52,background:`${bt.color}20`,border:`2px solid ${bt.color}40`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{bt.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:16,fontWeight:800,color:"#f0ebe0"}}>{neg.nombre}</div>
                      <div style={{display:"inline-block",background:`${bt.color}15`,border:`1px solid ${bt.color}25`,borderRadius:20,padding:"2px 10px",fontSize:9,color:bt.color,marginTop:4,fontFamily:"'Space Mono',monospace"}}>{bt.label.toUpperCase()}</div>
                    </div>
                    <div style={{color:"#3a4a5a",fontSize:20}}>›</div>
                  </div>
                  <div style={{padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:11,color:"#4a5a6a"}}>Toca para ver servicios y reservar</div>
                    <div style={{background:`${bt.color}15`,border:`1px solid ${bt.color}30`,borderRadius:20,padding:"4px 12px",fontSize:10,color:bt.color,fontFamily:"'Syne',sans-serif",fontWeight:600}}>Reservar →</div>
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
  const [authLoading,  setAuthLoading]  = useState(true);
  const [user,         setUser]         = useState(null);
  const [isGuest,      setIsGuest]      = useState(false);
  const [userRole,     setUserRole]     = useState(null); // cliente | negocio
  const [screen,       setScreen]       = useState("auth"); // auth | role | directory | business | setup | dashboard
  const [negocios,     setNegocios]     = useState([]);
  const [selectedNeg,  setSelectedNeg]  = useState(null);
  const [negocioId,    setNegocioId]    = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState(null);
  const [employees,    setEmployees]    = useState([]);
  const [services,     setServices]     = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab,    setActiveTab]    = useState("empleados");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [selEmployee,  setSelEmployee]  = useState(null);
  const [agendaView,   setAgendaView]   = useState("dia");
  const [agendaDate,   setAgendaDate]   = useState(todayStr);
  const [agendaEmp,    setAgendaEmp]    = useState("todos");
  const [showAddEmp,   setShowAddEmp]   = useState(false);
  const [newEmpName,   setNewEmpName]   = useState("");
  const [newEmpRole,   setNewEmpRole]   = useState("");
  const [newEmpSpec,   setNewEmpSpec]   = useState("");
  const [showSvcModal, setShowSvcModal] = useState(false);
  const [editingSvc,   setEditingSvc]   = useState(null);
  const [svcForm,      setSvcForm]      = useState({name:"",category:"Corte",price:"",duration:"",emoji:"✂️",desc:""});
  const [showAppt,     setShowAppt]     = useState(false);
  const [editingAppt,  setEditingAppt]  = useState(null);
  const [apptForm,     setApptForm]     = useState({client:"",phone:"",employeeId:"",serviceId:"",date:todayStr,time:"10:00"});
  const [clientView,   setClientView]   = useState("home");
  const [bookStep,     setBookStep]     = useState(1);
  const [bookService,  setBookService]  = useState(null);
  const [bookEmployee, setBookEmployee] = useState(null);
  const [bookDate,     setBookDate]     = useState(todayStr);
  const [bookTime,     setBookTime]     = useState(null);
  const [bookName,     setBookName]     = useState("");
  const [bookPhone,    setBookPhone]    = useState("");
  const [saving,       setSaving]       = useState(false);
  const [products,     setProducts]     = useState([]);
  const [showProdModal,setShowProdModal]= useState(false);
  const [editingProd,  setEditingProd]  = useState(null);
  const [prodForm,     setProdForm]     = useState({name:"",category:"",price:"",stock:"",emoji:"🧴",desc:""});

  const bizType     = BUSINESS_TYPES.find(t=>t.key===businessType)||BUSINESS_TYPES[0];
  const accentColor = bizType.color;
  const stationWord = businessType ? STATION_BY_TYPE[businessType] : "Puesto";
  const roles       = businessType ? ROLE_BY_TYPE[businessType]    : [];
  const filtered    = filterStatus==="todos" ? employees : employees.filter(e=>e.status===filterStatus);
  const counts      = { todos:employees.length, disponible:employees.filter(e=>e.status==="disponible").length, ocupado:employees.filter(e=>e.status==="ocupado").length, descanso:employees.filter(e=>e.status==="descanso").length };

  // Auth listener
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

  // Load all businesses for directory
  const loadNegocios = async () => {
    const {data} = await supabase.from("negocios").select("*").order("created_at",{ascending:false});
    setNegocios(data||[]);
  };

  // Load business data
  const loadData = async (nId) => {
    const id=nId||negocioId;
    if(!id) return;
    const [{data:emps},{data:svcs},{data:apts},{data:prods}] = await Promise.all([
      supabase.from("empleados").select("*").eq("negocio_id",id).order("silla"),
      supabase.from("servicios").select("*").eq("negocio_id",id).order("created_at"),
      supabase.from("citas").select("*").eq("negocio_id",id).order("fecha").order("hora"),
      supabase.from("productos").select("*").eq("negocio_id",id).order("created_at"),
    ]);
    setEmployees(emps||[]);
    setServices(svcs||[]);
    setAppointments(apts||[]);
    setProducts(prods||[]);
  };

  const handleRoleSelect = async (role) => {
    setUserRole(role);
    if(role==="cliente"){
      await loadNegocios();
      setScreen("directory");
    } else {
      // Check if user already has a business
      const {data} = await supabase.from("negocios").select("*").eq("user_id",user.id).single();
      if(data){ setNegocioId(data.id); setBusinessName(data.nombre); setBusinessType(data.tipo); await loadData(data.id); setScreen("dashboard"); }
      else setScreen("setup");
    }
  };

  const handleGuestMode = async () => {
    setIsGuest(true);
    await loadNegocios();
    setScreen("directory");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setIsGuest(false); setUserRole(null); setScreen("auth");
    setNegocios([]); setSelectedNeg(null); setNegocioId(null);
  };

  const saveBusiness = async () => {
    if(!businessName.trim()||!businessType) return;
    setSaving(true);
    const {data,error} = await supabase.from("negocios").insert({nombre:businessName.trim(),tipo:businessType,user_id:user?.id}).select().single();
    if(!error&&data){ setNegocioId(data.id); await loadData(data.id); setScreen("dashboard"); }
    setSaving(false);
  };

  // Employee actions
  const addEmployee = async () => {
    if(!newEmpName.trim()) return;
    const ini=newEmpName.trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
    const {data}=await supabase.from("empleados").insert({negocio_id:negocioId,nombre:newEmpName.trim(),rol:newEmpRole||roles[0]||"Empleado",especialidad:newEmpSpec||"General",silla:employees.length+1,status:"disponible",avatar:ini,color:AVATAR_COLORS[Math.floor(Math.random()*AVATAR_COLORS.length)]}).select().single();
    if(data) setEmployees(p=>[...p,data]);
    setNewEmpName("");setNewEmpRole("");setNewEmpSpec("");setShowAddEmp(false);
  };
  const changeStatus = async (id,status) => { await supabase.from("empleados").update({status}).eq("id",id); setEmployees(p=>p.map(e=>e.id===id?{...e,status}:e)); setSelEmployee(null); };
  const removeEmployee = async (id) => { await supabase.from("empleados").delete().eq("id",id); setEmployees(p=>p.filter(e=>e.id!==id)); setSelEmployee(null); };

  // Service actions
  const openAddSvc  = ()  => { setEditingSvc(null); setSvcForm({name:"",category:"Corte",price:"",duration:"",emoji:"✂️",desc:""}); setShowSvcModal(true); };
  const openEditSvc = svc => { setEditingSvc(svc); setSvcForm({name:svc.nombre,category:svc.categoria,price:String(svc.precio),duration:String(svc.duracion),emoji:svc.emoji,desc:svc.descripcion||""}); setShowSvcModal(true); };
  const saveSvc = async () => {
    if(!svcForm.name.trim()||!svcForm.price) return;
    const obj={negocio_id:negocioId,nombre:svcForm.name,categoria:svcForm.category,precio:Number(svcForm.price),duracion:Number(svcForm.duration)||30,emoji:svcForm.emoji,descripcion:svcForm.desc};
    if(editingSvc){ await supabase.from("servicios").update(obj).eq("id",editingSvc.id); setServices(p=>p.map(s=>s.id===editingSvc.id?{...s,...obj}:s)); }
    else{ const {data}=await supabase.from("servicios").insert(obj).select().single(); if(data) setServices(p=>[...p,data]); }
    setShowSvcModal(false);
  };
  const deleteSvc = async (id) => { await supabase.from("servicios").delete().eq("id",id); setServices(p=>p.filter(s=>s.id!==id)); };

  // Product actions
  const openAddProd  = ()   => { setEditingProd(null); setProdForm({name:"",category:PROD_CATS_BY_TYPE[businessType]?.[0]||"Otro",price:"",stock:"",emoji:"🧴",desc:""}); setShowProdModal(true); };
  const openEditProd = prod => { setEditingProd(prod); setProdForm({name:prod.nombre,category:prod.categoria,price:String(prod.precio),stock:String(prod.stock||0),emoji:prod.emoji,desc:prod.descripcion||""}); setShowProdModal(true); };
  const saveProd = async () => {
    if(!prodForm.name.trim()||!prodForm.price) return;
    const obj={negocio_id:negocioId,nombre:prodForm.name,categoria:prodForm.category,precio:Number(prodForm.price),stock:Number(prodForm.stock)||0,emoji:prodForm.emoji,descripcion:prodForm.desc};
    if(editingProd){ await supabase.from("productos").update(obj).eq("id",editingProd.id); setProducts(p=>p.map(x=>x.id===editingProd.id?{...x,...obj}:x)); }
    else{ const {data}=await supabase.from("productos").insert(obj).select().single(); if(data) setProducts(p=>[...p,data]); }
    setShowProdModal(false);
  };
  const deleteProd = async (id) => { await supabase.from("productos").delete().eq("id",id); setProducts(p=>p.filter(x=>x.id!==id)); };

  // Appointment actions
  const openAddAppt  = ()   => { setEditingAppt(null); setApptForm({client:"",phone:"",employeeId:"",serviceId:"",date:todayStr,time:"10:00"}); setShowAppt(true); };
  const openEditAppt = appt => { setEditingAppt(appt); setApptForm({client:appt.cliente_nombre,phone:appt.cliente_telefono||"",employeeId:appt.empleado_id||"",serviceId:appt.servicio_id||"",date:appt.fecha,time:appt.hora?.slice(0,5)||"10:00"}); setShowAppt(true); };
  const saveAppt = async () => {
    if(!apptForm.client.trim()) return;
    const obj={negocio_id:negocioId,cliente_nombre:apptForm.client,cliente_telefono:apptForm.phone,empleado_id:apptForm.employeeId||null,servicio_id:apptForm.serviceId||null,fecha:apptForm.date,hora:apptForm.time,status:"pendiente"};
    if(editingAppt){ await supabase.from("citas").update(obj).eq("id",editingAppt.id); setAppointments(p=>p.map(a=>a.id===editingAppt.id?{...a,...obj}:a)); }
    else{ const {data}=await supabase.from("citas").insert(obj).select().single(); if(data) setAppointments(p=>[...p,data]); }
    setShowAppt(false);
  };
  const deleteAppt = async (id) => { await supabase.from("citas").delete().eq("id",id); setAppointments(p=>p.filter(a=>a.id!==id)); };
  const updateApptStatus = async (id,status) => { await supabase.from("citas").update({status}).eq("id",id); setAppointments(p=>p.map(a=>a.id===id?{...a,status}:a)); };

  // Client booking
  const confirmBooking = async () => {
    if(!bookName.trim()||!bookTime) return;
    const nId = selectedNeg?.id||negocioId;
    const obj={negocio_id:nId,cliente_nombre:bookName,cliente_telefono:bookPhone,empleado_id:bookEmployee?.id||null,servicio_id:bookService?.id||null,fecha:bookDate,hora:bookTime,status:"pendiente"};
    const {data}=await supabase.from("citas").insert(obj).select().single();
    if(data) setAppointments(p=>[...p,data]);
    setClientView("confirm");
  };

  // ── SCREENS ────────────────────────────────────────────────────────────────
  if(authLoading) return <Loader text="INICIANDO PROCITA..."/>;

  if(screen==="auth") return <AuthScreen onGuest={handleGuestMode}/>;

  if(screen==="role") return <RoleSelector user={user} onSelect={handleRoleSelect}/>;

  if(screen==="directory") return (
    <Directory
      negocios={negocios}
      user={user}
      isGuest={isGuest}
      onLogout={handleLogout}
      onSelect={neg=>{
        setSelectedNeg(neg);
        const bt=BUSINESS_TYPES.find(t=>t.key===neg.tipo)||BUSINESS_TYPES[0];
        setBusinessType(neg.tipo);
        setBusinessName(neg.nombre);
        loadData(neg.id).then(()=>{ setNegocioId(neg.id); setClientView("home"); setScreen("client"); });
      }}
    />
  );

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if(screen==="setup") return (
    <div style={{...sharedBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{marginBottom:32,textAlign:"center"}}>
        <div style={{width:60,height:60,background:"linear-gradient(135deg,#E8C547,#f0a500)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 14px"}}>🏪</div>
        <div style={{fontSize:22,fontWeight:800,color:"#f0ebe0"}}>Registra tu negocio</div>
        <div style={{fontSize:11,color:"#4a5a6a",marginTop:6,fontFamily:"'Space Mono',monospace"}}>APARECERÁ EN EL DIRECTORIO DE PROCITA</div>
      </div>
      <div style={{width:"100%",maxWidth:480}}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:"#4a5a6a",marginBottom:8}}>NOMBRE DEL NEGOCIO</div>
          <input value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="Ej: Barbería Don Carlos…" style={inp({fontSize:15,fontWeight:600})} onFocus={e=>e.target.style.borderColor="#E8C547"} onBlur={e=>e.target.style.borderColor="#1e2a3a"}/>
        </div>
        <div style={{marginBottom:28}}>
          <div style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:"#4a5a6a",marginBottom:8}}>TIPO DE NEGOCIO</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {BUSINESS_TYPES.map(t=>(
              <div key={t.key} onClick={()=>setBusinessType(t.key)} style={{background:businessType===t.key?`${t.color}12`:"#0d1525",border:`1.5px solid ${businessType===t.key?t.color:"#1e2a3a"}`,borderRadius:14,padding:"16px 14px",cursor:"pointer",transition:"all .2s"}}>
                <div style={{fontSize:26,marginBottom:6}}>{t.icon}</div>
                <div style={{fontSize:13,fontWeight:700,color:businessType===t.key?t.color:"#c8c0b0",marginBottom:3}}>{t.label}</div>
                <div style={{fontSize:10,color:"#3a4a5a",fontFamily:"'Space Mono',monospace",lineHeight:1.4}}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={saveBusiness} disabled={!businessName.trim()||!businessType||saving} style={{width:"100%",background:businessName.trim()&&businessType?"linear-gradient(135deg,#E8C547,#f0a500)":"#1e2a3a",border:"none",color:businessName.trim()&&businessType?"#080c14":"#3a4a5a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,padding:14,borderRadius:12,cursor:"pointer"}}>
          {saving?"Guardando...":"Publicar mi negocio →"}
        </button>
        <button onClick={handleLogout} style={{width:"100%",background:"transparent",border:"none",color:"#3a4a5a",fontFamily:"'Syne',sans-serif",fontSize:12,padding:"12px",cursor:"pointer",marginTop:8}}>← Volver</button>
      </div>
    </div>
  );

  // ── CLIENT VIEW ────────────────────────────────────────────────────────────
  if(screen==="client") {
    const neg = selectedNeg || { nombre:businessName, tipo:businessType };
    const bt  = BUSINESS_TYPES.find(t=>t.key===neg.tipo)||BUSINESS_TYPES[0];
    const ac  = bt.color;

    return (
      <div style={sharedBg}>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
        <div style={{borderBottom:"1px solid #1e2a3a",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setScreen("directory")} style={{background:"transparent",border:"none",color:"#4a5a6a",fontSize:20,cursor:"pointer",padding:"0 4px"}}>‹</button>
            <div style={{width:34,height:34,background:`linear-gradient(135deg,${ac},${ac}99)`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{bt.icon}</div>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#f0ebe0"}}>{neg.nombre}</div>
              <div style={{fontSize:9,color:ac,fontFamily:"'Space Mono',monospace"}}>{bt.label.toUpperCase()}</div>
            </div>
          </div>
          {isGuest && <div style={{background:"#E8C54715",border:"1px solid #E8C54730",borderRadius:20,padding:"4px 10px",fontSize:9,color:"#E8C547",fontFamily:"'Space Mono',monospace"}}>INVITADO</div>}
        </div>

        {clientView==="confirm" ? (
          <div style={{padding:32,textAlign:"center"}}>
            <div style={{fontSize:60,marginBottom:16}}>🎉</div>
            <div style={{fontSize:20,fontWeight:800,color:"#f0ebe0",marginBottom:6}}>¡Cita confirmada!</div>
            <div style={{fontSize:12,color:"#4a5a6a",fontFamily:"'Space Mono',monospace",marginBottom:28}}>TE ESPERAMOS</div>
            <div style={{background:"#0d1525",border:`1px solid ${ac}30`,borderRadius:16,padding:20,textAlign:"left",maxWidth:340,margin:"0 auto 24px"}}>
              {[[`${bt.icon} Negocio`,neg.nombre],[`🛍 Servicio`,bookService?.nombre],[`💰 Precio`,`$${bookService?.precio}`],[`👤 Profesional`,bookEmployee?.nombre||"Cualquier disponible"],[`📅 Fecha`,bookDate],[`🕐 Hora`,bookTime],[`👤 Cliente`,bookName]].filter(([,v])=>v).map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #1e2a3a"}}>
                  <span style={{fontSize:11,color:"#4a5a6a"}}>{l}</span>
                  <span style={{fontSize:12,fontWeight:600,color:"#f0ebe0"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,maxWidth:340,margin:"0 auto"}}>
              <button onClick={()=>{setClientView("home");setBookStep(1);setBookService(null);setBookEmployee(null);setBookTime(null);setBookName("");setBookPhone("");}} style={{flex:1,background:"transparent",border:"1px solid #1e2a3a",color:"#4a5a6a",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"12px",borderRadius:12,cursor:"pointer"}}>Nueva cita</button>
              <button onClick={()=>setScreen("directory")} style={{flex:1,background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#080c14",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"12px",borderRadius:12,cursor:"pointer"}}>Ver más negocios</button>
            </div>
          </div>
        ) : clientView==="book" ? (
          <div style={{padding:"20px 20px 100px"}}>
            {/* Steps */}
            <div style={{display:"flex",alignItems:"center",marginBottom:24}}>
              {["Servicio","Profesional","Fecha","Confirmar"].map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",flex:1}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:bookStep>i+1?ac:bookStep===i+1?`${ac}20`:"#1e2a3a",border:`2px solid ${bookStep>=i+1?ac:"#1e2a3a"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:bookStep>i+1?"#080c14":bookStep===i+1?ac:"#3a4a5a",marginBottom:4}}>{bookStep>i+1?"✓":i+1}</div>
                    <div style={{fontSize:9,color:bookStep===i+1?ac:"#3a4a5a",fontFamily:"'Space Mono',monospace",textAlign:"center",whiteSpace:"nowrap"}}>{s}</div>
                  </div>
                  {i<3&&<div style={{height:2,flex:0.5,background:bookStep>i+1?ac:"#1e2a3a",marginBottom:16}}/>}
                </div>
              ))}
            </div>

            {bookStep===1&&<div>
              <div style={{fontSize:16,fontWeight:800,color:"#f0ebe0",marginBottom:14}}>Selecciona un servicio</div>
              {services.length===0 && <div style={{textAlign:"center",padding:"32px 0",color:"#3a4a5a",fontFamily:"'Space Mono',monospace",fontSize:11}}>ESTE NEGOCIO AÚN NO TIENE SERVICIOS</div>}
              {services.map(svc=>{
                const cc={"Corte":"#E8C547","Barba":"#F97316","Combo":"#4ECDC4","Color":"#F472B6","Uñas":"#A78BFA"}[svc.categoria]||"#60A5FA";
                return <div key={svc.id} onClick={()=>{setBookService(svc);setBookStep(2);}} style={{background:bookService?.id===svc.id?`${cc}10`:"#0d1525",border:`1px solid ${bookService?.id===svc.id?cc:"#1e2a3a"}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                  <div style={{fontSize:26,width:44,height:44,background:`${cc}15`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}>{svc.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#f0ebe0"}}>{svc.nombre}</div>
                    <div style={{fontSize:11,color:"#4a5a6a",marginTop:2}}>{svc.descripcion}</div>
                    <div style={{display:"flex",gap:10,marginTop:6}}><span style={{fontSize:12,fontWeight:700,color:cc}}>${svc.precio}</span><span style={{fontSize:11,color:"#3a4a5a",fontFamily:"'Space Mono',monospace"}}>⏱ {svc.duracion}min</span></div>
                  </div>
                </div>;
              })}
            </div>}

            {bookStep===2&&<div>
              <div style={{fontSize:16,fontWeight:800,color:"#f0ebe0",marginBottom:14}}>Elige un profesional</div>
              <div onClick={()=>{setBookEmployee(null);setBookStep(3);}} style={{background:"#0d1525",border:"1px solid #1e2a3a",borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:"#1e2a3a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🎲</div>
                <div><div style={{fontSize:14,fontWeight:700,color:"#f0ebe0"}}>Cualquier disponible</div><div style={{fontSize:11,color:"#4a5a6a"}}>Asignación automática</div></div>
              </div>
              {employees.map(emp=>(
                <div key={emp.id} onClick={()=>{setBookEmployee(emp);setBookStep(3);}} style={{background:"#0d1525",border:"1px solid #1e2a3a",borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:`${emp.color}20`,border:`2px solid ${emp.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:emp.color}}>{emp.avatar}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#f0ebe0"}}>{emp.nombre}</div>
                    <div style={{fontSize:11,color:"#4a5a6a"}}>{emp.especialidad}</div>
                    <div style={{display:"inline-block",background:`${statusConfig[emp.status]?.dot||"#4ECDC4"}15`,borderRadius:20,padding:"2px 10px",fontSize:9,color:statusConfig[emp.status]?.dot||"#4ECDC4",marginTop:4,fontFamily:"'Space Mono',monospace"}}>{statusConfig[emp.status]?.label||"Disponible"}</div>
                  </div>
                </div>
              ))}
              <button onClick={()=>setBookStep(1)} style={{width:"100%",background:"transparent",border:"1px solid #1e2a3a",color:"#4a5a6a",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"10px",borderRadius:10,cursor:"pointer",marginTop:6}}>← Volver</button>
            </div>}

            {bookStep===3&&<div>
              <div style={{fontSize:16,fontWeight:800,color:"#f0ebe0",marginBottom:14}}>Fecha y hora</div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#4a5a6a",fontFamily:"'Space Mono',monospace",marginBottom:6}}>FECHA</div>
                <input type="date" value={bookDate} onChange={e=>setBookDate(e.target.value)} style={inp()}/>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:10,color:"#4a5a6a",fontFamily:"'Space Mono',monospace",marginBottom:6}}>HORA DISPONIBLE</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                  {HOURS.map(h=>{
                    const taken=appointments.find(a=>a.fecha===bookDate&&a.hora?.startsWith(h)&&(bookEmployee?a.empleado_id===bookEmployee?.id:false));
                    return <button key={h} disabled={!!taken} onClick={()=>setBookTime(h)} style={{background:bookTime===h?ac:taken?"#0a0e18":"#0d1525",border:`1px solid ${bookTime===h?ac:"#1e2a3a"}`,color:bookTime===h?"#080c14":taken?"#2a3a4a":"#c8c0b0",fontFamily:"'Space Mono',monospace",fontSize:11,padding:"9px 4px",borderRadius:8,cursor:taken?"not-allowed":"pointer",fontWeight:600,opacity:taken?0.4:1}}>{h}</button>;
                  })}
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setBookStep(2)} style={{flex:1,background:"transparent",border:"1px solid #1e2a3a",color:"#4a5a6a",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>← Volver</button>
                <button disabled={!bookTime} onClick={()=>setBookStep(4)} style={{flex:2,background:bookTime?`linear-gradient(135deg,${ac},${ac}cc)`:"#1e2a3a",border:"none",color:bookTime?"#080c14":"#3a4a5a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:bookTime?"pointer":"not-allowed"}}>Continuar →</button>
              </div>
            </div>}

            {bookStep===4&&<div>
              <div style={{fontSize:16,fontWeight:800,color:"#f0ebe0",marginBottom:14}}>Confirma tu cita</div>
              <div style={{background:"#0d1525",border:`1px solid ${ac}20`,borderRadius:14,padding:16,marginBottom:16}}>
                {[[`${bt.icon} Servicio`,bookService?.nombre],[`💰 Precio`,`$${bookService?.precio}`],[`⏱ Duración`,`${bookService?.duracion} min`],[`👤 Profesional`,bookEmployee?.nombre||"Cualquier disponible"],[`📅 Fecha`,bookDate],[`🕐 Hora`,bookTime]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #1e2a3a"}}>
                    <span style={{fontSize:11,color:"#4a5a6a"}}>{l}</span>
                    <span style={{fontSize:12,fontWeight:600,color:"#f0ebe0"}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                <input value={bookName} onChange={e=>setBookName(e.target.value)} placeholder="Tu nombre completo *" style={inp()}/>
                <input value={bookPhone} onChange={e=>setBookPhone(e.target.value)} placeholder="Teléfono (opcional)" style={inp()}/>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setBookStep(3)} style={{flex:1,background:"transparent",border:"1px solid #1e2a3a",color:"#4a5a6a",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>← Volver</button>
                <button disabled={!bookName.trim()} onClick={confirmBooking} style={{flex:2,background:bookName.trim()?`linear-gradient(135deg,${ac},${ac}cc)`:"#1e2a3a",border:"none",color:bookName.trim()?"#080c14":"#3a4a5a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:bookName.trim()?"pointer":"not-allowed"}}>Confirmar cita ✓</button>
              </div>
            </div>}
          </div>
        ) : (
          <div style={{padding:"24px 20px"}}>
            <button onClick={()=>setClientView("book")} style={{width:"100%",background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#080c14",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,padding:16,borderRadius:14,cursor:"pointer",marginBottom:20}}>📅 Reservar cita</button>
            <div style={{fontSize:13,fontWeight:700,color:"#f0ebe0",marginBottom:12}}>Servicios disponibles</div>
            {services.length===0 && <div style={{textAlign:"center",padding:"32px 0",color:"#3a4a5a",fontFamily:"'Space Mono',monospace",fontSize:11}}>ESTE NEGOCIO AÚN NO TIENE SERVICIOS</div>}
            {services.map(svc=>{
              const cc={"Corte":"#E8C547","Barba":"#F97316","Combo":"#4ECDC4","Color":"#F472B6","Uñas":"#A78BFA"}[svc.categoria]||"#60A5FA";
              return <div key={svc.id} style={{background:"#0d1525",border:"1px solid #1e2a3a",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <div style={{fontSize:22}}>{svc.emoji}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#f0ebe0"}}>{svc.nombre}</div><div style={{fontSize:10,color:"#4a5a6a",fontFamily:"'Space Mono',monospace"}}>⏱ {svc.duracion} min</div></div>
                <div style={{fontSize:15,fontWeight:800,color:cc}}>${svc.precio}</div>
              </div>;
            })}
          </div>
        )}
      </div>
    );
  }

  // ── ADMIN DASHBOARD ────────────────────────────────────────────────────────
  return (
    <div style={sharedBg}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{borderBottom:"1px solid #1e2a3a",padding:"14px 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,background:`linear-gradient(135deg,${accentColor},${accentColor}99)`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{bizType.icon}</div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#f0ebe0"}}>{businessName}</div>
              <div style={{fontSize:9,color:accentColor,fontFamily:"'Space Mono',monospace"}}>{bizType.label.toUpperCase()} · {employees.length} EMPLEADOS</div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {user?.user_metadata?.picture && <img src={user.user_metadata.picture} style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${accentColor}40`}} alt="avatar"/>}
            <button onClick={handleLogout} style={{background:"transparent",border:"1px solid #1e2a3a",color:"#4a5a6a",fontFamily:"'Space Mono',monospace",fontSize:9,padding:"6px 10px",borderRadius:8,cursor:"pointer"}}>Salir</button>
          </div>
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto"}}>
          {[{l:`${counts.disponible} Libres`,c:"#4ECDC4"},{l:`${counts.ocupado} Ocupados`,c:"#E8C547"},{l:`${counts.descanso} Descanso`,c:"#A78BFA"},{l:`${appointments.filter(a=>a.fecha===todayStr).length} Citas hoy`,c:accentColor}].map((p,i)=>(
            <div key={i} style={{background:`${p.c}10`,border:`1px solid ${p.c}25`,borderRadius:20,padding:"4px 10px",fontSize:10,color:p.c,fontWeight:600,whiteSpace:"nowrap"}}>{p.l}</div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",borderBottom:"1px solid #1e2a3a",padding:"0 20px",overflowX:"auto"}}>
        {[{k:"empleados",l:`${stationWord}s`,i:"👥"},{k:"agenda",l:"Agenda",i:"📅"},{k:"servicios",l:"Servicios",i:"📋"},{k:"productos",l:"Productos",i:"🛍️"}].map(t=>(
          <button key={t.k} onClick={()=>setActiveTab(t.k)} style={{background:"transparent",border:"none",borderBottom:activeTab===t.k?`2px solid ${accentColor}`:"2px solid transparent",color:activeTab===t.k?accentColor:"#4a5a6a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,padding:"12px 14px 10px",cursor:"pointer",marginBottom:-1,whiteSpace:"nowrap"}}>{t.i} {t.l}</button>
        ))}
      </div>

      {/* EMPLEADOS */}
      {activeTab==="empleados"&&<div style={{padding:"18px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:8}}>
          <div style={{display:"flex",gap:6,overflowX:"auto"}}>
            {["todos","disponible","ocupado","descanso"].map(f=>{
              const C={todos:"#e8e0d0",disponible:"#4ECDC4",ocupado:"#E8C547",descanso:"#A78BFA"}[f];
              const L={todos:"Todos",disponible:"Libres",ocupado:"Ocupados",descanso:"Descanso"}[f];
              return <button key={f} onClick={()=>setFilterStatus(f)} style={{background:filterStatus===f?`${C}15`:"transparent",border:`1px solid ${filterStatus===f?C:"#1e2a3a"}`,color:filterStatus===f?C:"#4a5a6a",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:10,padding:"5px 10px",borderRadius:8,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
                <span style={{background:filterStatus===f?C:"#1e2a3a",color:filterStatus===f?"#080c14":"#4a5a6a",borderRadius:5,padding:"0 5px",fontSize:9,fontFamily:"'Space Mono',monospace"}}>{counts[f]}</span>{L}
              </button>;
            })}
          </div>
          <button onClick={()=>setShowAddEmp(true)} style={{background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#080c14",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"7px 12px",borderRadius:10,cursor:"pointer",flexShrink:0}}>+ Agregar</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
          {filtered.map(emp=>{
            const cfg=statusConfig[emp.status]||statusConfig.disponible;
            const isSel=selEmployee===emp.id;
            return <div key={emp.id} onClick={()=>setSelEmployee(isSel?null:emp.id)} style={{background:isSel?"#0f1a2e":"#0d1525",border:`1px solid ${isSel?cfg.dot:"#1e2a3a"}`,borderRadius:14,padding:16,cursor:"pointer",transition:"all .25s",position:"relative",boxShadow:isSel?`0 0 20px ${cfg.dot}15`:"none",transform:isSel?"translateY(-2px)":"none"}}>
              <div style={{position:"absolute",top:12,left:12,width:7,height:7,borderRadius:"50%",background:cfg.dot,boxShadow:`0 0 6px ${cfg.dot}`}}/>
              <div style={{position:"absolute",top:10,right:10,fontFamily:"'Space Mono',monospace",fontSize:9,color:"#3a4a5a",background:"#080c14",border:"1px solid #1e2a3a",borderRadius:6,padding:"2px 6px"}}>{stationWord.toUpperCase()} {emp.silla}</div>
              <div style={{display:"flex",justifyContent:"center",margin:"10px 0 10px"}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:`${emp.color}18`,border:`2px solid ${emp.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:emp.color}}>{emp.avatar}</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#f0ebe0",marginBottom:2}}>{emp.nombre}</div>
                <div style={{fontSize:9,color:accentColor,fontFamily:"'Space Mono',monospace",marginBottom:2}}>{emp.rol}</div>
                <div style={{fontSize:9,color:"#3a4a5a",fontFamily:"'Space Mono',monospace",marginBottom:8}}>{emp.especialidad}</div>
                <div style={{display:"inline-block",background:`${cfg.dot}12`,border:`1px solid ${cfg.dot}25`,borderRadius:20,padding:"3px 10px",fontSize:9,fontWeight:600,color:cfg.dot}}>{cfg.label}</div>
              </div>
              {isSel&&<div style={{marginTop:12}}>
                {["disponible","ocupado","descanso"].map(s=>(
                  <button key={s} onClick={e=>{e.stopPropagation();changeStatus(emp.id,s);}} style={{display:"flex",alignItems:"center",gap:7,width:"100%",background:emp.status===s?`${statusConfig[s].dot}15`:"transparent",border:`1px solid ${emp.status===s?statusConfig[s].dot:"#1e2a3a"}`,color:emp.status===s?statusConfig[s].dot:"#5a6a7a",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:11,padding:"6px 10px",borderRadius:8,cursor:"pointer",marginBottom:4}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:statusConfig[s].dot}}/>{statusConfig[s].label}
                  </button>
                ))}
                <button onClick={e=>{e.stopPropagation();removeEmployee(emp.id);}} style={{width:"100%",background:"transparent",border:"1px solid #FF6B6B25",color:"#FF6B6B60",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:10,padding:"5px",borderRadius:8,cursor:"pointer",marginTop:2}}>Eliminar</button>
              </div>}
            </div>;
          })}
        </div>
      </div>}

      {/* AGENDA */}
      {activeTab==="agenda"&&<div style={{padding:"18px 20px"}}>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",background:"#0d1525",borderRadius:10,border:"1px solid #1e2a3a",overflow:"hidden"}}>
            {["dia","semana"].map(v=>(
              <button key={v} onClick={()=>setAgendaView(v)} style={{background:agendaView===v?accentColor:"transparent",border:"none",color:agendaView===v?"#080c14":"#4a5a6a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 14px",cursor:"pointer"}}>{v==="dia"?"📅 Día":"📆 Semana"}</button>
            ))}
          </div>
          {agendaView==="dia"&&<input type="date" value={agendaDate} onChange={e=>setAgendaDate(e.target.value)} style={inp({width:"auto",fontSize:12})}/>}
          <select value={agendaEmp} onChange={e=>setAgendaEmp(e.target.value)} style={inp({width:"auto",fontSize:12})}>
            <option value="todos">Todos</option>
            {employees.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <button onClick={openAddAppt} style={{background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#080c14",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 14px",borderRadius:10,cursor:"pointer",marginLeft:"auto"}}>+ Nueva cita</button>
        </div>
        {agendaView==="dia"&&(()=>{
          const dayAppts=appointments.filter(a=>a.fecha===agendaDate&&(agendaEmp==="todos"||a.empleado_id===agendaEmp));
          return <div>
            {dayAppts.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#3a4a5a",fontFamily:"'Space Mono',monospace",fontSize:12}}>SIN CITAS PARA ESTE DÍA</div>}
            {dayAppts.sort((a,b)=>a.hora?.localeCompare(b.hora)).map(appt=>{
              const emp=employees.find(e=>e.id===appt.empleado_id);
              const svc=services.find(s=>s.id===appt.servicio_id);
              const sc=apptStatus[appt.status]||apptStatus.pendiente;
              return <div key={appt.id} style={{background:"#0d1525",border:`1px solid ${sc.color}25`,borderRadius:14,padding:"14px 16px",display:"flex",gap:14,marginBottom:10}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,color:accentColor,minWidth:48,paddingTop:2}}>{appt.hora?.slice(0,5)}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#f0ebe0"}}>{appt.cliente_nombre}</div>
                      <div style={{fontSize:11,color:"#4a5a6a",marginTop:2}}>{svc?.emoji} {svc?.nombre} · {svc?.duracion}min</div>
                      {emp&&<div style={{fontSize:10,color:emp.color,marginTop:2}}>{emp.nombre}</div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                      <div style={{background:`${sc.color}15`,borderRadius:20,padding:"3px 10px",fontSize:9,color:sc.color,fontFamily:"'Space Mono',monospace"}}>{sc.label}</div>
                      <div style={{display:"flex",gap:4}}>
                        {appt.status==="pendiente"&&<button onClick={()=>updateApptStatus(appt.id,"confirmada")} style={{background:"#4ECDC415",border:"1px solid #4ECDC430",color:"#4ECDC4",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:10,padding:"4px 8px",borderRadius:6,cursor:"pointer"}}>✓</button>}
                        {appt.status!=="completada"&&<button onClick={()=>updateApptStatus(appt.id,"completada")} style={{background:"#34D39915",border:"1px solid #34D39930",color:"#34D399",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:10,padding:"4px 8px",borderRadius:6,cursor:"pointer"}}>✅</button>}
                        <button onClick={()=>openEditAppt(appt)} style={{background:"#1e2a3a",border:"none",color:"#c8c0b0",fontSize:10,padding:"4px 8px",borderRadius:6,cursor:"pointer"}}>✏</button>
                        <button onClick={()=>deleteAppt(appt.id)} style={{background:"transparent",border:"1px solid #FF6B6B25",color:"#FF6B6B60",borderRadius:6,padding:"4px 7px",cursor:"pointer",fontSize:10}}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>;
            })}
          </div>;
        })()}
        {agendaView==="semana"&&<div style={{overflowX:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"60px repeat(7,1fr)",gap:4,minWidth:560}}>
            <div/>
            {weekDates.map((d,i)=>{
              const isToday=d===todayStr;
              return <div key={d} style={{textAlign:"center",padding:"8px 4px",background:isToday?`${accentColor}15`:"transparent",borderRadius:8,border:isToday?`1px solid ${accentColor}30`:"1px solid transparent"}}>
                <div style={{fontSize:9,color:"#4a5a6a",fontFamily:"'Space Mono',monospace"}}>{DAYS[i]}</div>
                <div style={{fontSize:14,fontWeight:700,color:isToday?accentColor:"#c8c0b0",marginTop:2}}>{new Date(d).getUTCDate()}</div>
              </div>;
            })}
            {HOURS.filter((_,i)=>i%2===0).map(hour=>(
              <>
                <div key={`h-${hour}`} style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#3a4a5a",padding:"8px 4px",textAlign:"right"}}>{hour}</div>
                {weekDates.map(d=>{
                  const cell=appointments.filter(a=>a.fecha===d&&a.hora?.startsWith(hour)&&(agendaEmp==="todos"||a.empleado_id===agendaEmp));
                  return <div key={`${d}-${hour}`} style={{background:"#0d1525",borderRadius:6,border:"1px solid #1e2a3a",minHeight:36,padding:2}}>
                    {cell.map(a=>{
                      const sc=apptStatus[a.status]||apptStatus.pendiente;
                      return <div key={a.id} style={{background:`${sc.color}20`,borderRadius:4,padding:"2px 4px",fontSize:8,color:sc.color,lineHeight:1.3}}><b>{a.cliente_nombre}</b></div>;
                    })}
                  </div>;
                })}
              </>
            ))}
          </div>
        </div>}
      </div>}

      {/* SERVICIOS */}
      {activeTab==="servicios"&&<div style={{padding:"18px 20px"}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
          <button onClick={openAddSvc} style={{background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#080c14",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 16px",borderRadius:10,cursor:"pointer"}}>+ Nuevo servicio</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
          {services.map(svc=>{
            const cc={"Corte":"#E8C547","Barba":"#F97316","Combo":"#4ECDC4","Color":"#F472B6","Uñas":"#A78BFA","General":"#60A5FA"}[svc.categoria]||"#60A5FA";
            return <div key={svc.id} style={{background:"#0d1525",border:"1px solid #1e2a3a",borderRadius:16,overflow:"hidden"}}>
              <div style={{background:`${cc}15`,borderBottom:`1px solid ${cc}20`,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:28}}>{svc.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#f0ebe0"}}>{svc.nombre}</div>
                  <div style={{display:"inline-block",background:`${cc}20`,borderRadius:20,padding:"2px 10px",fontSize:9,color:cc,marginTop:4,fontFamily:"'Space Mono',monospace"}}>{svc.categoria}</div>
                </div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{fontSize:10,color:"#4a5a6a",marginBottom:8}}>{svc.descripcion}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:18,fontWeight:800,color:accentColor}}>${svc.precio}</div><div style={{fontSize:9,color:"#3a4a5a",fontFamily:"'Space Mono',monospace"}}>⏱ {svc.duracion} min</div></div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>openEditSvc(svc)} style={{background:"#1e2a3a",border:"none",color:"#c8c0b0",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:600}}>Editar</button>
                    <button onClick={()=>deleteSvc(svc.id)} style={{background:"transparent",border:"1px solid #FF6B6B25",color:"#FF6B6B60",borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:11}}>✕</button>
                  </div>
                </div>
              </div>
            </div>;
          })}
        </div>
      </div>}

      {/* PRODUCTOS */}
      {activeTab==="productos"&&<div style={{padding:"18px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#f0ebe0"}}>Productos en venta</div>
            <div style={{fontSize:10,color:"#4a5a6a",fontFamily:"'Space Mono',monospace",marginTop:2}}>EL CLIENTE PAGA EN EL LOCAL</div>
          </div>
          <button onClick={openAddProd} style={{background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#080c14",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 16px",borderRadius:10,cursor:"pointer"}}>+ Nuevo producto</button>
        </div>
        {products.length===0&&<div style={{textAlign:"center",padding:"40px 0"}}>
          <div style={{fontSize:40,marginBottom:12}}>🛍️</div>
          <div style={{fontSize:13,fontWeight:700,color:"#c8c0b0",marginBottom:6}}>Sin productos aún</div>
          <div style={{fontSize:11,color:"#3a4a5a",fontFamily:"'Space Mono',monospace"}}>AGREGA POMADAS, ESMALTES, ACCESORIOS Y MÁS</div>
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {products.map(prod=>{
            const cc={"Pomadas":"#E8C547","Aceites":"#F97316","Máquinas":"#4ECDC4","Esmaltes":"#F472B6","Geles":"#A78BFA","Champús":"#60A5FA","Tintes":"#FF6B6B"}[prod.categoria]||"#60A5FA";
            return <div key={prod.id} style={{background:"#0d1525",border:"1px solid #1e2a3a",borderRadius:16,overflow:"hidden"}}>
              <div style={{background:`${cc}12`,borderBottom:`1px solid ${cc}20`,padding:"16px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:32,width:52,height:52,background:`${cc}20`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{prod.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#f0ebe0"}}>{prod.nombre}</div>
                  <div style={{display:"inline-block",background:`${cc}20`,borderRadius:20,padding:"2px 10px",fontSize:9,color:cc,marginTop:4,fontFamily:"'Space Mono',monospace"}}>{prod.categoria}</div>
                </div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{fontSize:10,color:"#4a5a6a",marginBottom:10,lineHeight:1.5}}>{prod.descripcion}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:800,color:accentColor}}>${prod.precio}</div>
                    <div style={{fontSize:9,color:"#3a4a5a",fontFamily:"'Space Mono',monospace"}}>📦 Stock: {prod.stock}</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>openEditProd(prod)} style={{background:"#1e2a3a",border:"none",color:"#c8c0b0",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:600}}>Editar</button>
                    <button onClick={()=>deleteProd(prod.id)} style={{background:"transparent",border:"1px solid #FF6B6B25",color:"#FF6B6B60",borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:11}}>✕</button>
                  </div>
                </div>
              </div>
            </div>;
          })}
        </div>
      </div>}

      {/* MODAL PRODUCTO */}
      {showProdModal&&<div style={{position:"fixed",inset:0,background:"#000000cc",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setShowProdModal(false)}>
        <div style={{background:"#0d1525",border:"1px solid #1e2a3a",borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:16,fontWeight:800,color:"#f0ebe0",marginBottom:20}}>{editingProd?"Editar producto":"Nuevo producto"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            <div>
              <div style={{fontSize:9,color:"#4a5a6a",fontFamily:"'Space Mono',monospace",marginBottom:6}}>EMOJI</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{PROD_EMOJIS.map(e=><button key={e} onClick={()=>setProdForm(f=>({...f,emoji:e}))} style={{width:38,height:38,background:prodForm.emoji===e?`${accentColor}20`:"#080c14",border:`1px solid ${prodForm.emoji===e?accentColor:"#1e2a3a"}`,borderRadius:10,cursor:"pointer",fontSize:18}}>{e}</button>)}</div>
            </div>
            <input value={prodForm.name} onChange={e=>setProdForm(f=>({...f,name:e.target.value}))} placeholder="Nombre del producto *" style={inp()}/>
            <select value={prodForm.category} onChange={e=>setProdForm(f=>({...f,category:e.target.value}))} style={inp()}>
              {(PROD_CATS_BY_TYPE[businessType]||["Otro"]).map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <input type="number" value={prodForm.price} onChange={e=>setProdForm(f=>({...f,price:e.target.value}))} placeholder="Precio $" style={inp()}/>
              <input type="number" value={prodForm.stock} onChange={e=>setProdForm(f=>({...f,stock:e.target.value}))} placeholder="Stock" style={inp()}/>
            </div>
            <textarea value={prodForm.desc} onChange={e=>setProdForm(f=>({...f,desc:e.target.value}))} placeholder="Descripción (opcional)" rows={2} style={inp({resize:"none"})}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowProdModal(false)} style={{flex:1,background:"transparent",border:"1px solid #1e2a3a",color:"#4a5a6a",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
            <button onClick={saveProd} style={{flex:2,background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#080c14",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Guardar</button>
          </div>
        </div>
      </div>}
      {showAddEmp&&<div style={{position:"fixed",inset:0,background:"#000000cc",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100}} onClick={()=>setShowAddEmp(false)}>
        <div style={{background:"#0d1525",border:"1px solid #1e2a3a",borderRadius:"20px 20px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:480}} onClick={e=>e.stopPropagation()}>
          <div style={{width:36,height:4,background:"#1e2a3a",borderRadius:2,margin:"0 auto 20px"}}/>
          <div style={{fontSize:16,fontWeight:800,color:"#f0ebe0",marginBottom:20}}>Nuevo empleado — {stationWord} {employees.length+1}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            <input value={newEmpName} onChange={e=>setNewEmpName(e.target.value)} placeholder="Nombre completo" style={inp()}/>
            <select value={newEmpRole} onChange={e=>setNewEmpRole(e.target.value)} style={inp()}>
              <option value="">Selecciona un rol</option>
              {roles.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            <input value={newEmpSpec} onChange={e=>setNewEmpSpec(e.target.value)} placeholder="Especialidad" style={inp()}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowAddEmp(false)} style={{flex:1,background:"transparent",border:"1px solid #1e2a3a",color:"#4a5a6a",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
            <button onClick={addEmployee} style={{flex:2,background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#080c14",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Agregar</button>
          </div>
        </div>
      </div>}

      {/* MODAL SERVICIO */}
      {showSvcModal&&<div style={{position:"fixed",inset:0,background:"#000000cc",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setShowSvcModal(false)}>
        <div style={{background:"#0d1525",border:"1px solid #1e2a3a",borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:16,fontWeight:800,color:"#f0ebe0",marginBottom:20}}>{editingSvc?"Editar servicio":"Nuevo servicio"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            <div><div style={{fontSize:9,color:"#4a5a6a",fontFamily:"'Space Mono',monospace",marginBottom:6}}>EMOJI</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{EMOJIS.map(e=><button key={e} onClick={()=>setSvcForm(f=>({...f,emoji:e}))} style={{width:38,height:38,background:svcForm.emoji===e?`${accentColor}20`:"#080c14",border:`1px solid ${svcForm.emoji===e?accentColor:"#1e2a3a"}`,borderRadius:10,cursor:"pointer",fontSize:18}}>{e}</button>)}</div>
            </div>
            <input value={svcForm.name} onChange={e=>setSvcForm(f=>({...f,name:e.target.value}))} placeholder="Nombre del servicio *" style={inp()}/>
            <select value={svcForm.category} onChange={e=>setSvcForm(f=>({...f,category:e.target.value}))} style={inp()}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <input type="number" value={svcForm.price} onChange={e=>setSvcForm(f=>({...f,price:e.target.value}))} placeholder="Precio $" style={inp()}/>
              <input type="number" value={svcForm.duration} onChange={e=>setSvcForm(f=>({...f,duration:e.target.value}))} placeholder="Duración min" style={inp()}/>
            </div>
            <textarea value={svcForm.desc} onChange={e=>setSvcForm(f=>({...f,desc:e.target.value}))} placeholder="Descripción" rows={2} style={inp({resize:"none"})}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowSvcModal(false)} style={{flex:1,background:"transparent",border:"1px solid #1e2a3a",color:"#4a5a6a",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
            <button onClick={saveSvc} style={{flex:2,background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#080c14",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Guardar</button>
          </div>
        </div>
      </div>}

      {/* MODAL CITA */}
      {showAppt&&<div style={{position:"fixed",inset:0,background:"#000000cc",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setShowAppt(false)}>
        <div style={{background:"#0d1525",border:"1px solid #1e2a3a",borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:16,fontWeight:800,color:"#f0ebe0",marginBottom:20}}>{editingAppt?"Editar cita":"Nueva cita"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            <input value={apptForm.client} onChange={e=>setApptForm(f=>({...f,client:e.target.value}))} placeholder="Nombre del cliente *" style={inp()}/>
            <input value={apptForm.phone} onChange={e=>setApptForm(f=>({...f,phone:e.target.value}))} placeholder="Teléfono" style={inp()}/>
            <select value={apptForm.employeeId} onChange={e=>setApptForm(f=>({...f,employeeId:e.target.value}))} style={inp()}>
              <option value="">Selecciona empleado</option>
              {employees.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <select value={apptForm.serviceId} onChange={e=>setApptForm(f=>({...f,serviceId:e.target.value}))} style={inp()}>
              <option value="">Selecciona servicio</option>
              {services.map(s=><option key={s.id} value={s.id}>{s.emoji} {s.nombre} – ${s.precio}</option>)}
            </select>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <input type="date" value={apptForm.date} onChange={e=>setApptForm(f=>({...f,date:e.target.value}))} style={inp()}/>
              <select value={apptForm.time} onChange={e=>setApptForm(f=>({...f,time:e.target.value}))} style={inp()}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowAppt(false)} style={{flex:1,background:"transparent",border:"1px solid #1e2a3a",color:"#4a5a6a",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
            <button onClick={saveAppt} style={{flex:2,background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#080c14",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Guardar</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
