import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://htadelbjzgnrglackutq.supabase.co";
const SUPABASE_KEY = "sb_publishable_150CaBmtYRRl6jpI_aySng_SO4gxu-l";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUSINESS_TYPES = [
  { key:"barberia", label:"Barbería",         icon:"✂️", color:"#E8C547" },
  { key:"salon",    label:"Salón de Belleza",  icon:"💇", color:"#F472B6" },
  { key:"unas",     label:"Centro de Uñas",    icon:"💅", color:"#A78BFA" },
  { key:"mixto",    label:"Centro de Belleza", icon:"✨", color:"#4ECDC4" },
];
const ROLE_BY_TYPE    = { barberia:["Barbero","Aprendiz","Encargado"], salon:["Estilista","Colorista","Asistente","Encargada"], unas:["Técnica de Uñas","Manicurista","Encargada"], mixto:["Estilista","Barbero","Técnica de Uñas","Encargado/a"] };
const STATION_BY_TYPE = { barberia:"Silla", salon:"Silla", unas:"Mesa", mixto:"Puesto" };
const AVATAR_COLORS   = ["#E8C547","#4ECDC4","#FF6B6B","#A78BFA","#F97316","#34D399","#F472B6","#60A5FA"];
const SVC_EMOJIS      = ["✂️","⚡","🧔","💈","🎨","💅","💆","🌟","👑","🔥"];
const PROD_EMOJIS     = ["🧴","✂️","💈","🪒","💆","💅","🎨","🧼","🌿","⚡","🔥","🌟"];
const HOURS           = ["9:00","9:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];
const DAYS            = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const statusConfig    = { ocupado:{label:"Ocupado",dot:"#F59E0B"}, disponible:{label:"Disponible",dot:"#10B981"}, descanso:{label:"Descanso",dot:"#8B5CF6"} };
const apptStatus      = { confirmada:{label:"Confirmada",color:"#10B981"}, pendiente:{label:"Pendiente",color:"#F59E0B"}, cancelada:{label:"Cancelada",color:"#EF4444"}, completada:{label:"Completada",color:"#6366F1"} };
const today           = new Date();
const todayStr        = today.toISOString().split("T")[0];
const weekDates       = Array.from({length:7},(_,i)=>{ const d=new Date(today); d.setDate(today.getDate()-today.getDay()+i); return d.toISOString().split("T")[0]; });

const inp = (x={}) => ({ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"11px 14px", color:"#1e293b", fontFamily:"'Syne',sans-serif", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", ...x });
const card = (x={}) => ({ background:"#fff", borderRadius:16, boxShadow:"0 2px 12px #0000000d", border:"1px solid #e8edf5", ...x });
const sharedBg = { minHeight:"100vh", background:"#f1f5f9", color:"#1e293b", fontFamily:"'Syne',sans-serif" };
const GCSS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}.appt-card:hover{box-shadow:0 4px 20px #0000001a!important}`;

function Loader({ text="Cargando..." }) {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#f1f5f9",flexDirection:"column",gap:12}}>
    <style>{GCSS}</style>
    <div style={{width:44,height:44,border:"3px solid #e2e8f0",borderTop:"3px solid #E8C547",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <div style={{color:"#64748b",fontFamily:"'Space Mono',monospace",fontSize:12}}>{text}</div>
  </div>;
}

function AuthScreen({ onGuest }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const loginGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo: window.location.origin } });
    if(error){ setMsg("Error con Google. Intenta de nuevo."); setLoading(false); }
  };
  return (
    <div style={{...sharedBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
      <style>{GCSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{width:84,height:84,background:"linear-gradient(135deg,#E8C547,#f0a500)",borderRadius:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,margin:"0 auto 16px",boxShadow:"0 8px 32px #E8C54740"}}>✂</div>
        <div style={{fontSize:34,fontWeight:800,color:"#0f172a",letterSpacing:"-1px"}}>ProCita</div>
        <div style={{fontSize:12,color:"#64748b",marginTop:6,fontFamily:"'Space Mono',monospace"}}>RESERVAS PARA BARBERÍAS Y SALONES</div>
      </div>
      <div style={{width:"100%",maxWidth:400}}>
        <button onClick={loginGoogle} disabled={loading} style={{width:"100%",background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"15px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:12,cursor:"pointer",marginBottom:12,boxShadow:"0 2px 12px #0000001a",opacity:loading?0.7:1}}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.9 12 24 12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.6 0-14.2 4.1-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8H6.3C9.7 39.5 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.5 4.6-4.6 6l6.2 5.2C40.7 36.3 44 30.6 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:"#0f172a"}}>{loading?"Conectando...":"Continuar con Google"}</span>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:12,margin:"16px 0"}}><div style={{flex:1,height:1,background:"#e2e8f0"}}/><div style={{fontSize:11,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>O</div><div style={{flex:1,height:1,background:"#e2e8f0"}}/></div>
        <button onClick={onGuest} style={{width:"100%",background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"15px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer",marginBottom:24,boxShadow:"0 1px 6px #0000000d"}}>
          <span style={{fontSize:20}}>👤</span>
          <div style={{textAlign:"left"}}><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:"#334155"}}>Entrar como invitado</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#94a3b8",marginTop:2}}>SIN REGISTRO · SOLO PARA CLIENTES</div></div>
        </button>
        {msg&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#DC2626",textAlign:"center",marginBottom:16}}>{msg}</div>}
        <div style={{...card(),padding:16}}>
          <div style={{fontSize:11,fontWeight:700,color:"#334155",marginBottom:10}}>¿Por qué registrarse?</div>
          {[["✅","Guarda tu historial de citas"],["🏪","Registra y gestiona tu negocio"],["🔔","Notificaciones de citas nuevas"],["💾","Datos seguros en la nube"]].map(([i,t])=>(
            <div key={t} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}><span style={{fontSize:14}}>{i}</span><span style={{fontSize:12,color:"#64748b"}}>{t}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleSelector({ user, onSelect }) {
  return (
    <div style={{...sharedBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
      <style>{GCSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:32}}><div style={{fontSize:32,marginBottom:10}}>👋</div><div style={{fontSize:24,fontWeight:800,color:"#0f172a"}}>¡Hola{user?.user_metadata?.name?`, ${user.user_metadata.name.split(" ")[0]}`:""}!</div><div style={{fontSize:12,color:"#64748b",marginTop:6,fontFamily:"'Space Mono',monospace"}}>¿CÓMO VAS A USAR PROCITA?</div></div>
      <div style={{width:"100%",maxWidth:420,display:"flex",flexDirection:"column",gap:14}}>
        {[{role:"cliente",icon:"📅",title:"Soy cliente",desc:"Reservar citas en barberías, salones y centros de uñas.",pill:"VER NEGOCIOS →",c:"#10B981",bc:"#D1FAE5"},{role:"negocio",icon:"🏪",title:"Soy dueño de negocio",desc:"Registrar mi negocio y gestionar citas, empleados y servicios.",pill:"MI PANEL →",c:"#D97706",bc:"#FEF3C7"}].map(b=>(
          <div key={b.role} onClick={()=>onSelect(b.role)} style={{...card(),padding:"22px 20px",cursor:"pointer",borderLeft:`4px solid ${b.c}`}}>
            <div style={{fontSize:34,marginBottom:8}}>{b.icon}</div>
            <div style={{fontSize:17,fontWeight:800,color:"#0f172a",marginBottom:4}}>{b.title}</div>
            <div style={{fontSize:12,color:"#64748b",lineHeight:1.5,marginBottom:12}}>{b.desc}</div>
            <div style={{display:"inline-block",background:b.bc,borderRadius:20,padding:"4px 14px",fontSize:10,color:b.c,fontFamily:"'Space Mono',monospace",fontWeight:700}}>{b.pill}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Directory({ negocios, onSelect, user, onLogout, isGuest }) {
  const [filter, setFilter] = useState("todos");
  const filtered = filter==="todos"?negocios:negocios.filter(n=>n.tipo===filter);
  return (
    <div style={sharedBg}>
      <style>{GCSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 8px #00000008"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,background:"linear-gradient(135deg,#E8C547,#f0a500)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",fontWeight:800}}>✂</div>
          <div><div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>ProCita</div><div style={{fontSize:9,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>{isGuest?"MODO INVITADO":"CLIENTE"}</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {isGuest&&<div style={{background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:20,padding:"4px 10px",fontSize:9,color:"#92400E",fontFamily:"'Space Mono',monospace"}}>INVITADO</div>}
          {!isGuest&&user?.user_metadata?.picture&&<img src={user.user_metadata.picture} style={{width:30,height:30,borderRadius:"50%",border:"2px solid #e2e8f0"}} alt=""/>}
          <button onClick={onLogout} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Space Mono',monospace",fontSize:9,padding:"6px 10px",borderRadius:8,cursor:"pointer"}}>Salir</button>
        </div>
      </div>
      <div style={{padding:"20px"}}>
        <div style={{marginBottom:16}}><div style={{fontSize:22,fontWeight:800,color:"#0f172a",marginBottom:2}}>Elige tu negocio</div><div style={{fontSize:12,color:"#64748b"}}>{negocios.length} negocios disponibles</div></div>
        <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
          {[{k:"todos",l:"Todos",i:"🌟"},{k:"barberia",l:"Barberías",i:"✂️"},{k:"salon",l:"Salones",i:"💇"},{k:"unas",l:"Uñas",i:"💅"},{k:"mixto",l:"Mixtos",i:"✨"}].map(f=>(
            <button key={f.k} onClick={()=>setFilter(f.k)} style={{background:filter===f.k?"#E8C547":"#fff",border:`1px solid ${filter===f.k?"#E8C547":"#e2e8f0"}`,color:filter===f.k?"#0f172a":"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:11,padding:"7px 14px",borderRadius:20,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 1px 4px #00000010"}}>{f.i} {f.l}</button>
          ))}
        </div>
        {filtered.length===0?<div style={{textAlign:"center",padding:"48px 0",color:"#94a3b8"}}><div style={{fontSize:40,marginBottom:12}}>🏪</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:11}}>AÚN NO HAY NEGOCIOS</div></div>:(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {filtered.map(neg=>{
              const bt=BUSINESS_TYPES.find(t=>t.key===neg.tipo)||BUSINESS_TYPES[0];
              return <div key={neg.id} onClick={()=>onSelect(neg)} style={{...card(),overflow:"hidden",cursor:"pointer"}}>
                <div style={{background:`linear-gradient(135deg,${bt.color}18,${bt.color}06)`,borderBottom:`1px solid ${bt.color}20`,padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:54,height:54,borderRadius:14,border:`2px solid ${bt.color}40`,overflow:"hidden",flexShrink:0,background:`${bt.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,...(neg.foto_url?{backgroundImage:`url(${neg.foto_url})`,backgroundSize:"cover",backgroundPosition:"center"}:{})}}>{!neg.foto_url&&bt.icon}</div>
                  <div style={{flex:1}}><div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>{neg.nombre}</div><div style={{display:"inline-block",background:`${bt.color}20`,borderRadius:20,padding:"2px 10px",fontSize:9,color:bt.color,marginTop:4,fontFamily:"'Space Mono',monospace"}}>{bt.label.toUpperCase()}</div></div>
                  <div style={{color:"#94a3b8",fontSize:22}}>›</div>
                </div>
                <div style={{padding:"11px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:11,color:"#64748b"}}>Ver servicios y reservar</div>
                  <div style={{background:bt.color,borderRadius:20,padding:"5px 14px",fontSize:10,color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700}}>Reservar →</div>
                </div>
              </div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [authLoading,  setAuthLoading]  = useState(true);
  const [user,         setUser]         = useState(null);
  const [isGuest,      setIsGuest]      = useState(false);
  const [screen,       setScreen]       = useState("auth");
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
  const [activeTab,    setActiveTab]    = useState("empleados");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [selEmployee,  setSelEmployee]  = useState(null);
  const [agendaView,   setAgendaView]   = useState("dia");
  const [agendaDate,   setAgendaDate]   = useState(todayStr);
  const [agendaEmp,    setAgendaEmp]    = useState("todos");
  const [newApptAlert, setNewApptAlert] = useState(0);
  const [saving,       setSaving]       = useState(false);
  const [showAddEmp,   setShowAddEmp]   = useState(false);
  const [newEmpName,   setNewEmpName]   = useState(""); const [newEmpRole,setNewEmpRole]=useState(""); const [newEmpSpec,setNewEmpSpec]=useState("");
  const [showSvcModal, setShowSvcModal] = useState(false);
  const [editingSvc,   setEditingSvc]   = useState(null);
  const [svcForm,      setSvcForm]      = useState({name:"",category:"",price:"",duration:"",emoji:"✂️",desc:"",foto:""});
  const [showAppt,     setShowAppt]     = useState(false);
  const [editingAppt,  setEditingAppt]  = useState(null);
  const [apptForm,     setApptForm]     = useState({client:"",phone:"",employeeId:"",serviceId:"",date:todayStr,time:"10:00"});
  const [showProdModal,setShowProdModal]= useState(false);
  const [editingProd,  setEditingProd]  = useState(null);
  const [prodForm,     setProdForm]     = useState({name:"",category:"",price:"",stock:"",emoji:"🧴",desc:"",foto:""});
  const [clientView,   setClientView]   = useState("home");
  const [bookStep,     setBookStep]     = useState(1);
  const [bookService,  setBookService]  = useState(null);
  const [bookEmployee, setBookEmployee] = useState(null);
  const [bookDate,     setBookDate]     = useState(todayStr);
  const [bookTime,     setBookTime]     = useState(null);
  const [bookName,     setBookName]     = useState("");
  const [bookPhone,    setBookPhone]    = useState("");
  const [weekPopup,    setWeekPopup]    = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const bizType     = BUSINESS_TYPES.find(t=>t.key===businessType)||BUSINESS_TYPES[0];
  const accentColor = bizType.color;
  const stationWord = businessType?STATION_BY_TYPE[businessType]:"Puesto";
  const roles       = businessType?ROLE_BY_TYPE[businessType]:[];
  const filtered    = filterStatus==="todos"?employees:employees.filter(e=>e.status===filterStatus);
  const counts      = {todos:employees.length,disponible:employees.filter(e=>e.status==="disponible").length,ocupado:employees.filter(e=>e.status==="ocupado").length,descanso:employees.filter(e=>e.status==="descanso").length};

  const loadNegocios = async () => { const {data}=await supabase.from("negocios").select("*").order("created_at",{ascending:false}); setNegocios(data||[]); };
  const loadData = async (nId) => {
    const id=nId||negocioId; if(!id) return;
    const [{data:emps},{data:svcs},{data:apts},{data:prods}] = await Promise.all([
      supabase.from("empleados").select("*").eq("negocio_id",id).order("silla"),
      supabase.from("servicios").select("*").eq("negocio_id",id).order("created_at"),
      supabase.from("citas").select("*").eq("negocio_id",id).order("fecha").order("hora"),
      supabase.from("productos").select("*").eq("negocio_id",id).order("created_at"),
    ]);
    setEmployees(emps||[]); setServices(svcs||[]); setAppointments(apts||[]); setProducts(prods||[]);
  };

  // ── AUTH FIX: properly handle Google OAuth redirect ──
  useEffect(()=>{
    const init = async () => {
      try {
        const {data:{session}} = await supabase.auth.getSession();
        if(session?.user){
          setUser(session.user);
          // Check if user already has a business to decide where to go
          const {data:neg} = await supabase.from("negocios").select("*").eq("user_id",session.user.id).single();
          if(neg){
            setNegocioId(neg.id); setBusinessName(neg.nombre); setBusinessType(neg.tipo); setNegocioFoto(neg.foto_url||null);
            await loadData(neg.id);
            setScreen("dashboard");
          } else {
            setScreen("role");
          }
        } else {
          setScreen("auth");
        }
      } catch(e) {
        setScreen("auth");
      }
      setAuthLoading(false);
    };
    init();
    const {data:{subscription}} = supabase.auth.onAuthStateChange(async (event, session)=>{
      if(event==="SIGNED_IN" && session?.user){
        setUser(session.user);
        setAuthLoading(false);
        // Only redirect if still on auth screen (prevents loops)
        setScreen(prev => prev==="auth" ? "role" : prev);
      }
      if(event==="SIGNED_OUT"){
        setUser(null); setScreen("auth");
      }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  const handleRoleSelect = async (role) => {
    if(role==="cliente"){ await loadNegocios(); setScreen("directory"); }
    else {
      const {data}=await supabase.from("negocios").select("*").eq("user_id",user.id).single();
      if(data){ setNegocioId(data.id); setBusinessName(data.nombre); setBusinessType(data.tipo); setNegocioFoto(data.foto_url||null); await loadData(data.id); setScreen("dashboard"); }
      else setScreen("setup");
    }
  };

  const handleGuestMode = async () => { setIsGuest(true); await loadNegocios(); setScreen("directory"); };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setIsGuest(false); setScreen("auth");
    setNegocios([]); setSelectedNeg(null); setNegocioId(null);
    setBusinessName(""); setBusinessType(null); setEmployees([]); setServices([]); setAppointments([]); setProducts([]);
  };

  const saveBusiness = async () => {
    if(!businessName.trim()||!businessType) return; setSaving(true);
    const {data,error}=await supabase.from("negocios").insert({nombre:businessName.trim(),tipo:businessType,user_id:user?.id}).select().single();
    if(!error&&data){ setNegocioId(data.id); await loadData(data.id); setScreen("dashboard"); }
    setSaving(false);
  };

  // Delete business
  const deleteBusiness = async () => {
    if(!negocioId) return; setSaving(true);
    await Promise.all([
      supabase.from("citas").delete().eq("negocio_id",negocioId),
      supabase.from("empleados").delete().eq("negocio_id",negocioId),
      supabase.from("servicios").delete().eq("negocio_id",negocioId),
      supabase.from("productos").delete().eq("negocio_id",negocioId),
    ]);
    await supabase.from("negocios").delete().eq("id",negocioId);
    setSaving(false); setShowDeleteConfirm(false);
    setNegocioId(null); setBusinessName(""); setBusinessType(null);
    setEmployees([]); setServices([]); setAppointments([]); setProducts([]);
    setScreen("setup");
  };

  const addEmployee = async () => {
    if(!newEmpName.trim()) return;
    const ini=newEmpName.trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
    const {data}=await supabase.from("empleados").insert({negocio_id:negocioId,nombre:newEmpName.trim(),rol:newEmpRole||roles[0]||"Empleado",especialidad:newEmpSpec||"General",silla:employees.length+1,status:"disponible",avatar:ini,color:AVATAR_COLORS[Math.floor(Math.random()*AVATAR_COLORS.length)]}).select().single();
    if(data) setEmployees(p=>[...p,data]);
    setNewEmpName(""); setNewEmpRole(""); setNewEmpSpec(""); setShowAddEmp(false);
  };
  const changeStatus = async (id,status) => { await supabase.from("empleados").update({status}).eq("id",id); setEmployees(p=>p.map(e=>e.id===id?{...e,status}:e)); setSelEmployee(null); };
  const removeEmployee = async (id) => { await supabase.from("empleados").delete().eq("id",id); setEmployees(p=>p.filter(e=>e.id!==id)); setSelEmployee(null); };

  const openAddSvc  = () => { setEditingSvc(null); setSvcForm({name:"",category:"",price:"",duration:"",emoji:"✂️",desc:"",foto:""}); setShowSvcModal(true); };
  const openEditSvc = s  => { setEditingSvc(s); setSvcForm({name:s.nombre,category:s.categoria||"",price:String(s.precio),duration:String(s.duracion),emoji:s.emoji,desc:s.descripcion||"",foto:s.foto_url||""}); setShowSvcModal(true); };
  const saveSvc = async () => {
    if(!svcForm.name.trim()||!svcForm.price) return;
    const obj={negocio_id:negocioId,nombre:svcForm.name,categoria:svcForm.category||"General",precio:Number(svcForm.price),duracion:Number(svcForm.duration)||30,emoji:svcForm.emoji,descripcion:svcForm.desc,foto_url:svcForm.foto||null};
    if(editingSvc){ await supabase.from("servicios").update(obj).eq("id",editingSvc.id); setServices(p=>p.map(s=>s.id===editingSvc.id?{...s,...obj}:s)); }
    else{ const {data}=await supabase.from("servicios").insert(obj).select().single(); if(data) setServices(p=>[...p,data]); }
    setShowSvcModal(false);
  };
  const deleteSvc = async (id) => { await supabase.from("servicios").delete().eq("id",id); setServices(p=>p.filter(s=>s.id!==id)); };

  const openAddProd  = () => { setEditingProd(null); setProdForm({name:"",category:"",price:"",stock:"",emoji:"🧴",desc:"",foto:""}); setShowProdModal(true); };
  const openEditProd = p  => { setEditingProd(p); setProdForm({name:p.nombre,category:p.categoria||"",price:String(p.precio),stock:String(p.stock||0),emoji:p.emoji,desc:p.descripcion||"",foto:p.foto_url||""}); setShowProdModal(true); };
  const saveProd = async () => {
    if(!prodForm.name.trim()||!prodForm.price) return;
    const obj={negocio_id:negocioId,nombre:prodForm.name,categoria:prodForm.category||"Producto",precio:Number(prodForm.price),stock:Number(prodForm.stock)||0,emoji:prodForm.emoji,descripcion:prodForm.desc,foto_url:prodForm.foto||null};
    if(editingProd){ await supabase.from("productos").update(obj).eq("id",editingProd.id); setProducts(p=>p.map(x=>x.id===editingProd.id?{...x,...obj}:x)); }
    else{ const {data}=await supabase.from("productos").insert(obj).select().single(); if(data) setProducts(p=>[...p,data]); }
    setShowProdModal(false);
  };
  const deleteProd = async (id) => { await supabase.from("productos").delete().eq("id",id); setProducts(p=>p.filter(x=>x.id!==id)); };

  const openAddAppt  = () => { setEditingAppt(null); setApptForm({client:"",phone:"",employeeId:"",serviceId:"",date:todayStr,time:"10:00"}); setShowAppt(true); };
  const openEditAppt = a  => { setEditingAppt(a); setApptForm({client:a.cliente_nombre,phone:a.cliente_telefono||"",employeeId:a.empleado_id||"",serviceId:a.servicio_id||"",date:a.fecha,time:a.hora?.slice(0,5)||"10:00"}); setShowAppt(true); };
  const saveAppt = async () => {
    if(!apptForm.client.trim()) return;
    const obj={negocio_id:negocioId,cliente_nombre:apptForm.client,cliente_telefono:apptForm.phone,empleado_id:apptForm.employeeId||null,servicio_id:apptForm.serviceId||null,fecha:apptForm.date,hora:apptForm.time,status:"pendiente"};
    if(editingAppt){ await supabase.from("citas").update(obj).eq("id",editingAppt.id); setAppointments(p=>p.map(a=>a.id===editingAppt.id?{...a,...obj}:a)); }
    else{ const {data}=await supabase.from("citas").insert(obj).select().single(); if(data){ setAppointments(p=>[...p,data]); setNewApptAlert(n=>n+1); } }
    setShowAppt(false);
  };
  const deleteAppt = async (id) => { await supabase.from("citas").delete().eq("id",id); setAppointments(p=>p.filter(a=>a.id!==id)); };
  const updateApptStatus = async (id,status) => { await supabase.from("citas").update({status}).eq("id",id); setAppointments(p=>p.map(a=>a.id===id?{...a,status}:a)); };

  const confirmBooking = async () => {
    if(!bookName.trim()||!bookTime) return;
    const nId=selectedNeg?.id||negocioId;
    const {data}=await supabase.from("citas").insert({negocio_id:nId,cliente_nombre:bookName,cliente_telefono:bookPhone,empleado_id:bookEmployee?.id||null,servicio_id:bookService?.id||null,fecha:bookDate,hora:bookTime,status:"pendiente"}).select().single();
    if(data){ setAppointments(p=>[...p,data]); setNewApptAlert(n=>n+1); }
    setClientView("confirm");
  };

  const fileToBase64 = (file) => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsDataURL(file); });
  const waLink = (phone, appt) => { const c=phone.replace(/\D/g,""); const m=encodeURIComponent(`Hola, tu cita en ${businessName} está confirmada para el ${appt.fecha} a las ${appt.hora?.slice(0,5)}.`); return `https://wa.me/${c}?text=${m}`; };

  if(authLoading) return <Loader text="INICIANDO PROCITA..."/>;
  if(screen==="auth") return <AuthScreen onGuest={handleGuestMode}/>;
  if(screen==="role") return <RoleSelector user={user} onSelect={handleRoleSelect}/>;
  if(screen==="directory") return <Directory negocios={negocios} user={user} isGuest={isGuest} onLogout={handleLogout} onSelect={neg=>{ setSelectedNeg(neg); setBusinessType(neg.tipo); setBusinessName(neg.nombre); setNegocioFoto(neg.foto_url||null); loadData(neg.id).then(()=>{ setNegocioId(neg.id); setClientView("home"); setScreen("client"); }); }}/>;

  if(screen==="setup") return (
    <div style={{...sharedBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
      <style>{GCSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{marginBottom:32,textAlign:"center"}}>
        <div style={{width:64,height:64,background:"linear-gradient(135deg,#E8C547,#f0a500)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 14px"}}>🏪</div>
        <div style={{fontSize:22,fontWeight:800,color:"#0f172a"}}>Registra tu negocio</div>
        <div style={{fontSize:11,color:"#64748b",marginTop:6,fontFamily:"'Space Mono',monospace"}}>APARECERÁ EN EL DIRECTORIO DE PROCITA</div>
      </div>
      <div style={{width:"100%",maxWidth:480}}>
        <div style={{marginBottom:20}}><div style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:"#64748b",marginBottom:8}}>NOMBRE DEL NEGOCIO</div><input value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="Ej: Barbería Don Carlos…" style={inp({fontSize:15,fontWeight:600})}/></div>
        <div style={{marginBottom:28}}>
          <div style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:"#64748b",marginBottom:8}}>TIPO DE NEGOCIO</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {BUSINESS_TYPES.map(t=>(
              <div key={t.key} onClick={()=>setBusinessType(t.key)} style={{...card(),padding:"16px 14px",cursor:"pointer",borderLeft:`3px solid ${businessType===t.key?t.color:"transparent"}`,background:businessType===t.key?`${t.color}08`:"#fff"}}>
                <div style={{fontSize:26,marginBottom:6}}>{t.icon}</div>
                <div style={{fontSize:13,fontWeight:700,color:businessType===t.key?t.color:"#334155"}}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={saveBusiness} disabled={!businessName.trim()||!businessType||saving} style={{width:"100%",background:businessName.trim()&&businessType?"linear-gradient(135deg,#E8C547,#f0a500)":"#e2e8f0",border:"none",color:businessName.trim()&&businessType?"#0f172a":"#94a3b8",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,padding:14,borderRadius:12,cursor:"pointer"}}>{saving?"Guardando...":"Publicar mi negocio →"}</button>
        <button onClick={handleLogout} style={{width:"100%",background:"transparent",border:"none",color:"#94a3b8",fontFamily:"'Syne',sans-serif",fontSize:12,padding:"10px",cursor:"pointer",marginTop:6}}>← Volver</button>
      </div>
    </div>
  );

  if(screen==="client") {
    const neg=selectedNeg||{nombre:businessName,tipo:businessType};
    const bt=BUSINESS_TYPES.find(t=>t.key===neg.tipo)||BUSINESS_TYPES[0];
    const ac=bt.color;
    return (
      <div style={sharedBg}>
        <style>{GCSS}</style>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
        <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 8px #00000008"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setScreen("directory")} style={{background:"#f1f5f9",border:"none",color:"#64748b",fontSize:18,cursor:"pointer",padding:"4px 8px",borderRadius:8}}>‹</button>
            <div style={{width:34,height:34,borderRadius:10,border:`2px solid ${ac}40`,overflow:"hidden",background:`${ac}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,...(negocioFoto?{backgroundImage:`url(${negocioFoto})`,backgroundSize:"cover"}:{})}}>{!negocioFoto&&bt.icon}</div>
            <div><div style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{neg.nombre}</div><div style={{fontSize:9,color:ac,fontFamily:"'Space Mono',monospace"}}>{bt.label.toUpperCase()}</div></div>
          </div>
          {isGuest&&<div style={{background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:20,padding:"4px 10px",fontSize:9,color:"#92400E",fontFamily:"'Space Mono',monospace"}}>INVITADO</div>}
        </div>
        {clientView==="confirm"?(
          <div style={{padding:32,textAlign:"center"}}>
            <div style={{fontSize:60,marginBottom:16}}>🎉</div>
            <div style={{fontSize:20,fontWeight:800,color:"#0f172a",marginBottom:6}}>¡Cita confirmada!</div>
            <div style={{fontSize:12,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:24}}>TE ESPERAMOS</div>
            <div style={{...card(),padding:20,textAlign:"left",maxWidth:340,margin:"0 auto 20px"}}>
              {[[`${bt.icon} Servicio`,bookService?.nombre],[`💰 Precio`,`$${bookService?.precio}`],[`👤 Profesional`,bookEmployee?.nombre||"Cualquier disponible"],[`📅 Fecha`,bookDate],[`🕐 Hora`,bookTime],[`👤 Cliente`,bookName]].filter(([,v])=>v).map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f1f5f9"}}><span style={{fontSize:11,color:"#64748b"}}>{l}</span><span style={{fontSize:12,fontWeight:600,color:"#0f172a"}}>{v}</span></div>
              ))}
            </div>
            {bookPhone&&<a href={`https://wa.me/${bookPhone.replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${bookName}, tu cita en ${neg.nombre} está confirmada para el ${bookDate} a las ${bookTime}. ✂️`)}`} target="_blank" rel="noreferrer" style={{display:"block",background:"#25D366",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,padding:"12px 24px",borderRadius:12,textDecoration:"none",maxWidth:340,margin:"0 auto 10px",textAlign:"center"}}>📲 Confirmar por WhatsApp</a>}
            <div style={{display:"flex",gap:10,maxWidth:340,margin:"10px auto 0"}}>
              <button onClick={()=>{setClientView("home");setBookStep(1);setBookService(null);setBookEmployee(null);setBookTime(null);setBookName("");setBookPhone("");}} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"12px",borderRadius:12,cursor:"pointer"}}>Nueva cita</button>
              <button onClick={()=>setScreen("directory")} style={{flex:1,background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"12px",borderRadius:12,cursor:"pointer"}}>Más negocios</button>
            </div>
          </div>
        ):clientView==="book"?(
          <div style={{padding:"20px 20px 100px"}}>
            <div style={{display:"flex",alignItems:"center",marginBottom:24}}>
              {["Servicio","Profesional","Fecha","Confirmar"].map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",flex:1}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:bookStep>i+1?ac:bookStep===i+1?`${ac}20`:"#e2e8f0",border:`2px solid ${bookStep>=i+1?ac:"#e2e8f0"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:bookStep>i+1?"#0f172a":bookStep===i+1?ac:"#94a3b8",marginBottom:4}}>{bookStep>i+1?"✓":i+1}</div>
                    <div style={{fontSize:9,color:bookStep===i+1?ac:"#94a3b8",fontFamily:"'Space Mono',monospace",textAlign:"center",whiteSpace:"nowrap"}}>{s}</div>
                  </div>
                  {i<3&&<div style={{height:2,flex:0.5,background:bookStep>i+1?ac:"#e2e8f0",marginBottom:16}}/>}
                </div>
              ))}
            </div>
            {bookStep===1&&<div>
              <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:14}}>Selecciona un servicio</div>
              {services.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#94a3b8",fontFamily:"'Space Mono',monospace",fontSize:11}}>ESTE NEGOCIO AÚN NO TIENE SERVICIOS</div>}
              {services.map(svc=>{
                const cc={"Corte":"#E8C547","Barba":"#F97316","Combo":"#4ECDC4","Color":"#F472B6","Uñas":"#A78BFA"}[svc.categoria]||"#60A5FA";
                return <div key={svc.id} onClick={()=>{setBookService(svc);setBookStep(2);}} style={{...card(),padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,marginBottom:10,borderLeft:bookService?.id===svc.id?`3px solid ${cc}`:"3px solid transparent"}}>
                  {svc.foto_url?<img src={svc.foto_url} style={{width:44,height:44,borderRadius:10,objectFit:"cover"}} alt=""/>:<div style={{fontSize:26,width:44,height:44,background:`${cc}15`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}>{svc.emoji}</div>}
                  <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{svc.nombre}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{svc.descripcion}</div><div style={{display:"flex",gap:10,marginTop:6}}><span style={{fontSize:12,fontWeight:700,color:cc}}>${svc.precio}</span><span style={{fontSize:11,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>⏱ {svc.duracion}min</span></div></div>
                </div>;
              })}
            </div>}
            {bookStep===2&&<div>
              <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:14}}>Elige un profesional</div>
              <div onClick={()=>{setBookEmployee(null);setBookStep(3);}} style={{...card(),padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🎲</div>
                <div><div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>Cualquier disponible</div><div style={{fontSize:11,color:"#64748b"}}>Asignación automática</div></div>
              </div>
              {employees.map(emp=>(
                <div key={emp.id} onClick={()=>{setBookEmployee(emp);setBookStep(3);}} style={{...card(),padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,marginBottom:10,borderLeft:bookEmployee?.id===emp.id?`3px solid ${emp.color}`:"3px solid transparent"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:`${emp.color}20`,border:`2px solid ${emp.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:emp.color}}>{emp.avatar}</div>
                  <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{emp.nombre}</div><div style={{fontSize:11,color:"#64748b"}}>{emp.especialidad}</div><div style={{display:"inline-block",background:`${statusConfig[emp.status]?.dot||"#10B981"}15`,borderRadius:20,padding:"2px 10px",fontSize:9,color:statusConfig[emp.status]?.dot||"#10B981",marginTop:4,fontFamily:"'Space Mono',monospace"}}>{statusConfig[emp.status]?.label||"Disponible"}</div></div>
                </div>
              ))}
              <button onClick={()=>setBookStep(1)} style={{width:"100%",background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"10px",borderRadius:10,cursor:"pointer",marginTop:6}}>← Volver</button>
            </div>}
            {bookStep===3&&<div>
              <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:14}}>Fecha y hora</div>
              <div style={{marginBottom:14}}><div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>FECHA</div><input type="date" value={bookDate} onChange={e=>setBookDate(e.target.value)} style={inp()}/></div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>HORA DISPONIBLE</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                  {HOURS.map(h=>{
                    const taken=appointments.find(a=>a.fecha===bookDate&&a.hora?.startsWith(h)&&(bookEmployee?a.empleado_id===bookEmployee?.id:false));
                    return <button key={h} disabled={!!taken} onClick={()=>setBookTime(h)} style={{background:bookTime===h?ac:taken?"#f1f5f9":"#fff",border:`1px solid ${bookTime===h?ac:"#e2e8f0"}`,color:bookTime===h?"#0f172a":taken?"#cbd5e1":"#334155",fontFamily:"'Space Mono',monospace",fontSize:11,padding:"9px 4px",borderRadius:8,cursor:taken?"not-allowed":"pointer",fontWeight:600,opacity:taken?0.4:1}}>{h}</button>;
                  })}
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setBookStep(2)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>← Volver</button>
                <button disabled={!bookTime} onClick={()=>setBookStep(4)} style={{flex:2,background:bookTime?`linear-gradient(135deg,${ac},${ac}cc)`:"#e2e8f0",border:"none",color:bookTime?"#0f172a":"#94a3b8",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:bookTime?"pointer":"not-allowed"}}>Continuar →</button>
              </div>
            </div>}
            {bookStep===4&&<div>
              <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:14}}>Confirma tu cita</div>
              <div style={{...card(),padding:16,marginBottom:16}}>
                {[[`${bt.icon} Servicio`,bookService?.nombre],[`💰 Precio`,`$${bookService?.precio}`],[`⏱ Duración`,`${bookService?.duracion} min`],[`👤 Profesional`,bookEmployee?.nombre||"Cualquier disponible"],[`📅 Fecha`,bookDate],[`🕐 Hora`,bookTime]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f1f5f9"}}><span style={{fontSize:11,color:"#64748b"}}>{l}</span><span style={{fontSize:12,fontWeight:600,color:"#0f172a"}}>{v}</span></div>
                ))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                <input value={bookName} onChange={e=>setBookName(e.target.value)} placeholder="Tu nombre completo *" style={inp()}/>
                <input value={bookPhone} onChange={e=>setBookPhone(e.target.value)} placeholder="Teléfono / WhatsApp (opcional)" style={inp()}/>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setBookStep(3)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>← Volver</button>
                <button disabled={!bookName.trim()} onClick={confirmBooking} style={{flex:2,background:bookName.trim()?`linear-gradient(135deg,${ac},${ac}cc)`:"#e2e8f0",border:"none",color:bookName.trim()?"#0f172a":"#94a3b8",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:bookName.trim()?"pointer":"not-allowed"}}>Confirmar cita ✓</button>
              </div>
            </div>}
          </div>
        ):(
          <div style={{padding:"20px 20px 80px"}}>
            <button onClick={()=>setClientView("book")} style={{width:"100%",background:`linear-gradient(135deg,${ac},${ac}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,padding:16,borderRadius:14,cursor:"pointer",marginBottom:20,boxShadow:`0 4px 20px ${ac}40`}}>📅 Reservar cita</button>
            <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:12}}>Servicios disponibles</div>
            {services.length===0&&<div style={{textAlign:"center",padding:"24px 0",color:"#94a3b8",fontFamily:"'Space Mono',monospace",fontSize:11}}>AÚN SIN SERVICIOS</div>}
            {services.map(svc=>{
              const cc={"Corte":"#E8C547","Barba":"#F97316","Combo":"#4ECDC4","Color":"#F472B6","Uñas":"#A78BFA"}[svc.categoria]||"#60A5FA";
              return <div key={svc.id} style={{...card(),padding:"12px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                {svc.foto_url?<img src={svc.foto_url} style={{width:38,height:38,borderRadius:8,objectFit:"cover"}} alt=""/>:<div style={{fontSize:20}}>{svc.emoji}</div>}
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{svc.nombre}</div><div style={{fontSize:10,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>⏱ {svc.duracion} min</div></div>
                <div style={{fontSize:15,fontWeight:800,color:cc}}>${svc.precio}</div>
              </div>;
            })}
            {products.length>0&&<>
              <div style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:"20px 0 12px",display:"flex",alignItems:"center",gap:8}}>🛍️ Productos <span style={{fontSize:10,color:"#94a3b8",fontFamily:"'Space Mono',monospace",fontWeight:400}}>PAGO EN EL LOCAL</span></div>
              {products.map(prod=>(
                <div key={prod.id} style={{...card(),padding:"12px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                  {prod.foto_url?<img src={prod.foto_url} style={{width:38,height:38,borderRadius:8,objectFit:"cover"}} alt=""/>:<div style={{fontSize:20,width:38,height:38,background:"#60A5FA15",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>{prod.emoji}</div>}
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{prod.nombre}</div><div style={{fontSize:10,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>{prod.categoria} · Stock: {prod.stock}</div></div>
                  <div style={{fontSize:15,fontWeight:800,color:"#3B82F6"}}>${prod.precio}</div>
                </div>
              ))}
            </>}
          </div>
        )}
      </div>
    );
  }

  // ── ADMIN DASHBOARD ────────────────────────────────────────────────────────
  return (
    <div style={sharedBg}>
      <style>{GCSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>

      {/* Delete confirm modal */}
      {showDeleteConfirm&&<div style={{position:"fixed",inset:0,background:"#0000006d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
        <div style={{...card(),padding:28,maxWidth:380,width:"100%",animation:"slideUp .2s ease"}}>
          <div style={{fontSize:40,textAlign:"center",marginBottom:16}}>⚠️</div>
          <div style={{fontSize:17,fontWeight:800,color:"#0f172a",marginBottom:8,textAlign:"center"}}>¿Eliminar negocio?</div>
          <div style={{fontSize:13,color:"#64748b",marginBottom:24,textAlign:"center",lineHeight:1.5}}>Esto eliminará <b>{businessName}</b> junto con todos sus empleados, servicios, citas y productos. <b>Esta acción no se puede deshacer.</b></div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowDeleteConfirm(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"12px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
            <button onClick={deleteBusiness} disabled={saving} style={{flex:1,background:"#EF4444",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"12px",borderRadius:10,cursor:"pointer"}}>{saving?"Eliminando...":"Sí, eliminar"}</button>
          </div>
        </div>
      </div>}

      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"12px 20px",position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 8px #00000008"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:44,height:44,borderRadius:13,border:`2px solid ${accentColor}50`,overflow:"hidden",flexShrink:0,...(negocioFoto?{backgroundImage:`url(${negocioFoto})`,backgroundSize:"cover",backgroundPosition:"center"}:{background:`${accentColor}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}),cursor:"pointer"}} onClick={()=>document.getElementById("fotoNeg").click()}>
              {!negocioFoto&&bizType.icon}
            </div>
            <input id="fotoNeg" type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{ const f=e.target.files[0]; if(f){ const url=await fileToBase64(f); setNegocioFoto(url); await supabase.from("negocios").update({foto_url:url}).eq("id",negocioId); } }}/>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>{businessName}</div>
              <div style={{fontSize:9,color:accentColor,fontFamily:"'Space Mono',monospace"}}>{bizType.label.toUpperCase()} · {employees.length} EMPLEADOS</div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {user?.user_metadata?.picture&&<img src={user.user_metadata.picture} style={{width:28,height:28,borderRadius:"50%",border:"2px solid #e2e8f0"}} alt=""/>}
            <button onClick={handleLogout} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Space Mono',monospace",fontSize:9,padding:"6px 10px",borderRadius:8,cursor:"pointer"}}>Salir</button>
            <button onClick={()=>setShowDeleteConfirm(true)} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontFamily:"'Space Mono',monospace",fontSize:9,padding:"6px 10px",borderRadius:8,cursor:"pointer"}}>🗑 Eliminar negocio</button>
          </div>
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
          {[{l:`${counts.disponible} Libres`,c:"#10B981"},{l:`${counts.ocupado} Ocupados`,c:"#F59E0B"},{l:`${counts.descanso} Descanso`,c:"#8B5CF6"},{l:`${appointments.filter(a=>a.fecha===todayStr).length} Citas hoy`,c:"#3B82F6"}].map((p,i)=>(
            <div key={i} style={{background:`${p.c}12`,border:`1px solid ${p.c}30`,borderRadius:20,padding:"4px 10px",fontSize:10,color:p.c,fontWeight:600,whiteSpace:"nowrap"}}>{p.l}</div>
          ))}
          {newApptAlert>0&&<div onClick={()=>setNewApptAlert(0)} style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:20,padding:"4px 10px",fontSize:10,color:"#DC2626",fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",animation:"pulse 1.5s infinite"}}>🔔 {newApptAlert} nueva{newApptAlert>1?"s":""} cita{newApptAlert>1?"s":""}</div>}
        </div>
      </div>

      <div style={{background:"#fff",display:"flex",borderBottom:"1px solid #e2e8f0",padding:"0 20px",overflowX:"auto"}}>
        {[{k:"empleados",l:`${stationWord}s`,i:"👥"},{k:"agenda",l:"Agenda",i:"📅"},{k:"servicios",l:"Servicios",i:"📋"},{k:"productos",l:"Productos",i:"🛍️"}].map(t=>(
          <button key={t.k} onClick={()=>setActiveTab(t.k)} style={{background:"transparent",border:"none",borderBottom:activeTab===t.k?`3px solid ${accentColor}`:"3px solid transparent",color:activeTab===t.k?accentColor:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,padding:"12px 14px 10px",cursor:"pointer",marginBottom:-1,whiteSpace:"nowrap"}}>{t.i} {t.l}</button>
        ))}
      </div>

      {activeTab==="empleados"&&<div style={{padding:"18px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:8}}>
          <div style={{display:"flex",gap:6,overflowX:"auto"}}>
            {["todos","disponible","ocupado","descanso"].map(f=>{
              const C={todos:"#334155",disponible:"#10B981",ocupado:"#F59E0B",descanso:"#8B5CF6"}[f];
              const L={todos:"Todos",disponible:"Libres",ocupado:"Ocupados",descanso:"Descanso"}[f];
              return <button key={f} onClick={()=>setFilterStatus(f)} style={{background:filterStatus===f?`${C}15`:"#fff",border:`1px solid ${filterStatus===f?C:"#e2e8f0"}`,color:filterStatus===f?C:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:10,padding:"5px 10px",borderRadius:8,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
                <span style={{background:filterStatus===f?C:"#e2e8f0",color:filterStatus===f?"#fff":"#64748b",borderRadius:5,padding:"0 5px",fontSize:9,fontFamily:"'Space Mono',monospace"}}>{counts[f]}</span>{L}
              </button>;
            })}
          </div>
          <button onClick={()=>setShowAddEmp(true)} style={{background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 14px",borderRadius:10,cursor:"pointer",flexShrink:0}}>+ Agregar</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
          {filtered.map(emp=>{
            const cfg=statusConfig[emp.status]||statusConfig.disponible;
            const isSel=selEmployee===emp.id;
            return <div key={emp.id} onClick={()=>setSelEmployee(isSel?null:emp.id)} style={{...card(),padding:16,cursor:"pointer",borderLeft:isSel?`4px solid ${cfg.dot}`:"4px solid transparent",transition:"all .2s",position:"relative"}}>
              <div style={{position:"absolute",top:10,right:10,fontFamily:"'Space Mono',monospace",fontSize:9,color:"#94a3b8",background:"#f1f5f9",borderRadius:6,padding:"2px 6px"}}>{stationWord} {emp.silla}</div>
              <div style={{display:"flex",justifyContent:"center",margin:"8px 0 10px"}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:`${emp.color}18`,border:`2px solid ${emp.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:emp.color}}>{emp.avatar}</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:2}}>{emp.nombre}</div>
                <div style={{fontSize:9,color:accentColor,fontFamily:"'Space Mono',monospace",marginBottom:2}}>{emp.rol}</div>
                <div style={{fontSize:9,color:"#94a3b8",fontFamily:"'Space Mono',monospace",marginBottom:8}}>{emp.especialidad}</div>
                <div style={{display:"inline-flex",alignItems:"center",gap:5,background:`${cfg.dot}12`,border:`1px solid ${cfg.dot}25`,borderRadius:20,padding:"3px 10px",fontSize:9,fontWeight:600,color:cfg.dot}}><div style={{width:5,height:5,borderRadius:"50%",background:cfg.dot}}/>{cfg.label}</div>
              </div>
              {isSel&&<div style={{marginTop:12,animation:"slideUp .2s ease"}}>
                {["disponible","ocupado","descanso"].map(s=>(
                  <button key={s} onClick={e=>{e.stopPropagation();changeStatus(emp.id,s);}} style={{display:"flex",alignItems:"center",gap:7,width:"100%",background:emp.status===s?`${statusConfig[s].dot}12`:"transparent",border:`1px solid ${emp.status===s?statusConfig[s].dot:"#e2e8f0"}`,color:emp.status===s?statusConfig[s].dot:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:11,padding:"7px 10px",borderRadius:8,cursor:"pointer",marginBottom:4}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:statusConfig[s].dot}}/>{statusConfig[s].label}
                  </button>
                ))}
                <button onClick={e=>{e.stopPropagation();removeEmployee(emp.id);}} style={{width:"100%",background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:10,padding:"6px",borderRadius:8,cursor:"pointer",marginTop:2}}>Eliminar</button>
              </div>}
            </div>;
          })}
        </div>
      </div>}

      {activeTab==="agenda"&&<div style={{padding:"18px 20px"}}>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",background:"#f1f5f9",borderRadius:10,border:"1px solid #e2e8f0",overflow:"hidden"}}>
            {["dia","semana"].map(v=>(
              <button key={v} onClick={()=>setAgendaView(v)} style={{background:agendaView===v?accentColor:"transparent",border:"none",color:agendaView===v?"#0f172a":"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 14px",cursor:"pointer"}}>{v==="dia"?"📅 Día":"📆 Semana"}</button>
            ))}
          </div>
          {agendaView==="dia"&&<input type="date" value={agendaDate} onChange={e=>setAgendaDate(e.target.value)} style={inp({width:"auto",fontSize:12})}/>}
          <select value={agendaEmp} onChange={e=>setAgendaEmp(e.target.value)} style={inp({width:"auto",fontSize:12})}>
            <option value="todos">Todos</option>
            {employees.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <button onClick={openAddAppt} style={{background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 14px",borderRadius:10,cursor:"pointer",marginLeft:"auto"}}>+ Nueva cita</button>
        </div>
        {agendaView==="dia"&&(()=>{
          const dayAppts=appointments.filter(a=>a.fecha===agendaDate&&(agendaEmp==="todos"||a.empleado_id===agendaEmp));
          return <div>
            {dayAppts.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:"#94a3b8",fontFamily:"'Space Mono',monospace",fontSize:12}}>SIN CITAS PARA ESTE DÍA</div>}
            {dayAppts.sort((a,b)=>a.hora?.localeCompare(b.hora)).map(appt=>{
              const emp=employees.find(e=>e.id===appt.empleado_id);
              const svc=services.find(s=>s.id===appt.servicio_id);
              const sc=apptStatus[appt.status]||apptStatus.pendiente;
              return <div key={appt.id} className="appt-card" style={{...card(),padding:"14px 16px",display:"flex",gap:12,marginBottom:10,borderLeft:`4px solid ${sc.color}`}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,color:accentColor,minWidth:48,paddingTop:2}}>{appt.hora?.slice(0,5)}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{appt.cliente_nombre}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{svc?.emoji} {svc?.nombre}{svc?.duracion&&` · ${svc.duracion}min`}</div>
                      {emp&&<div style={{fontSize:10,color:emp.color,marginTop:2,fontWeight:600}}>{emp.nombre}</div>}
                      {appt.cliente_telefono&&<div style={{display:"flex",gap:6,marginTop:6}}>
                        <span style={{fontSize:11,color:"#475569",fontWeight:500}}>📱 {appt.cliente_telefono}</span>
                        <a href={`tel:${appt.cliente_telefono}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:6,padding:"3px 8px",fontSize:10,fontFamily:"'Syne',sans-serif",fontWeight:600,textDecoration:"none"}}>Llamar</a>
                        <a href={waLink(appt.cliente_telefono,appt)} target="_blank" rel="noreferrer" style={{background:"#F0FDF4",border:"1px solid #BBF7D0",color:"#166534",borderRadius:6,padding:"3px 8px",fontSize:10,fontFamily:"'Syne',sans-serif",fontWeight:600,textDecoration:"none"}}>WhatsApp</a>
                      </div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                      <div style={{background:`${sc.color}15`,border:`1px solid ${sc.color}30`,borderRadius:20,padding:"3px 10px",fontSize:9,color:sc.color,fontFamily:"'Space Mono',monospace",fontWeight:600}}>{sc.label}</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                        {appt.status==="pendiente"&&<button onClick={()=>updateApptStatus(appt.id,"confirmada")} style={{background:"#D1FAE5",border:"1px solid #6EE7B7",color:"#065F46",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"5px 10px",borderRadius:6,cursor:"pointer"}}>✓ Confirmar</button>}
                        {appt.status!=="completada"&&<button onClick={()=>updateApptStatus(appt.id,"completada")} style={{background:"#EDE9FE",border:"1px solid #C4B5FD",color:"#5B21B6",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"5px 10px",borderRadius:6,cursor:"pointer"}}>✅ Listo</button>}
                        <button onClick={()=>openEditAppt(appt)} style={{background:"#F1F5F9",border:"1px solid #CBD5E1",color:"#475569",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:11,padding:"5px 10px",borderRadius:6,cursor:"pointer"}}>✏ Editar</button>
                        <button onClick={()=>deleteAppt(appt.id)} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:11,padding:"5px 10px",borderRadius:6,cursor:"pointer"}}>✕ Borrar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>;
            })}
          </div>;
        })()}
        {agendaView==="semana"&&<div style={{overflowX:"auto",position:"relative"}}>
          {weekPopup&&<div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:"#0000003d"}} onClick={()=>setWeekPopup(null)}>
            <div style={{...card(),padding:22,maxWidth:360,width:"100%",animation:"slideUp .2s ease"}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>Detalles de la cita</div>
                <button onClick={()=>setWeekPopup(null)} style={{background:"#f1f5f9",border:"none",color:"#64748b",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:14}}>✕</button>
              </div>
              {(()=>{
                const a=weekPopup; const emp=employees.find(e=>e.id===a.empleado_id); const svc=services.find(s=>s.id===a.servicio_id); const sc=apptStatus[a.status]||apptStatus.pendiente;
                return <>
                  {[["👤 Cliente",a.cliente_nombre],["📞 Teléfono",a.cliente_telefono||"—"],["✂️ Servicio",svc?.nombre||"—"],["💰 Precio",svc?`$${svc.precio}`:"—"],["⏱ Duración",svc?`${svc.duracion} min`:"—"],["👨 Profesional",emp?.nombre||"—"],["📅 Fecha",a.fecha],["🕐 Hora",a.hora?.slice(0,5)]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f1f5f9"}}><span style={{fontSize:11,color:"#64748b"}}>{l}</span><span style={{fontSize:12,fontWeight:600,color:"#0f172a"}}>{v}</span></div>
                  ))}
                  <div style={{display:"inline-block",background:`${sc.color}15`,border:`1px solid ${sc.color}30`,borderRadius:20,padding:"4px 12px",fontSize:10,color:sc.color,fontFamily:"'Space Mono',monospace",fontWeight:600,marginTop:12}}>{sc.label}</div>
                  {a.cliente_telefono&&<div style={{display:"flex",gap:8,marginTop:12}}>
                    <a href={`tel:${a.cliente_telefono}`} style={{flex:1,background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:8,padding:"9px",fontSize:12,fontFamily:"'Syne',sans-serif",fontWeight:600,textDecoration:"none",textAlign:"center"}}>📞 Llamar</a>
                    <a href={waLink(a.cliente_telefono,a)} target="_blank" rel="noreferrer" style={{flex:1,background:"#F0FDF4",border:"1px solid #BBF7D0",color:"#166534",borderRadius:8,padding:"9px",fontSize:12,fontFamily:"'Syne',sans-serif",fontWeight:600,textDecoration:"none",textAlign:"center"}}>💬 WhatsApp</a>
                  </div>}
                </>;
              })()}
            </div>
          </div>}
          <div style={{display:"grid",gridTemplateColumns:"54px repeat(7,1fr)",gap:3,minWidth:560}}>
            <div/>
            {weekDates.map((d,i)=>{
              const isToday=d===todayStr;
              return <div key={d} style={{textAlign:"center",padding:"8px 4px",background:isToday?`${accentColor}15`:"transparent",borderRadius:8,border:isToday?`1px solid ${accentColor}30`:"1px solid transparent"}}>
                <div style={{fontSize:9,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>{DAYS[i]}</div>
                <div style={{fontSize:15,fontWeight:800,color:isToday?accentColor:"#334155",marginTop:2}}>{new Date(d).getUTCDate()}</div>
              </div>;
            })}
            {HOURS.filter((_,i)=>i%2===0).map(hour=>(
              <>
                <div key={`h-${hour}`} style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#94a3b8",padding:"8px 4px",textAlign:"right"}}>{hour}</div>
                {weekDates.map(d=>{
                  const cell=appointments.filter(a=>a.fecha===d&&a.hora?.startsWith(hour)&&(agendaEmp==="todos"||a.empleado_id===agendaEmp));
                  return <div key={`${d}-${hour}`} style={{background:"#fff",borderRadius:6,border:"1px solid #e2e8f0",minHeight:38,padding:2}}>
                    {cell.map(a=>{
                      const sc=apptStatus[a.status]||apptStatus.pendiente;
                      return <div key={a.id} onClick={()=>setWeekPopup(a)} style={{background:`${sc.color}20`,border:`1px solid ${sc.color}40`,borderRadius:4,padding:"3px 5px",fontSize:9,color:sc.color,lineHeight:1.4,cursor:"pointer",fontWeight:600,marginBottom:2}}>{a.cliente_nombre}</div>;
                    })}
                  </div>;
                })}
              </>
            ))}
          </div>
        </div>}
      </div>}

      {activeTab==="servicios"&&<div style={{padding:"18px 20px"}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
          <button onClick={openAddSvc} style={{background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 16px",borderRadius:10,cursor:"pointer"}}>+ Nuevo servicio</button>
        </div>
        {services.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:10}}>📋</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:11}}>SIN SERVICIOS AÚN</div></div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
          {services.map(svc=>{
            const cc={"Corte":"#E8C547","Barba":"#F97316","Combo":"#4ECDC4","Color":"#F472B6","Uñas":"#A78BFA","General":"#60A5FA"}[svc.categoria]||"#60A5FA";
            return <div key={svc.id} style={{...card(),overflow:"hidden"}}>
              {svc.foto_url?<img src={svc.foto_url} style={{width:"100%",height:120,objectFit:"cover"}} alt=""/>:
              <div style={{background:`${cc}10`,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${cc}15`}}>
                <div style={{fontSize:28}}>{svc.emoji}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{svc.nombre}</div>{svc.categoria&&<div style={{display:"inline-block",background:`${cc}20`,borderRadius:20,padding:"2px 10px",fontSize:9,color:cc,marginTop:4,fontFamily:"'Space Mono',monospace"}}>{svc.categoria}</div>}</div>
              </div>}
              <div style={{padding:"12px 16px"}}>
                {svc.foto_url&&<div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:4}}>{svc.nombre}</div>}
                <div style={{fontSize:10,color:"#64748b",marginBottom:10}}>{svc.descripcion}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:18,fontWeight:800,color:accentColor}}>${svc.precio}</div><div style={{fontSize:9,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>⏱ {svc.duracion} min</div></div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>openEditSvc(svc)} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#475569",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:600}}>Editar</button>
                    <button onClick={()=>deleteSvc(svc.id)} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:11}}>✕</button>
                  </div>
                </div>
              </div>
            </div>;
          })}
        </div>
      </div>}

      {activeTab==="productos"&&<div style={{padding:"18px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>Productos en venta</div><div style={{fontSize:10,color:"#94a3b8",fontFamily:"'Space Mono',monospace",marginTop:2}}>EL CLIENTE PAGA EN EL LOCAL</div></div>
          <button onClick={openAddProd} style={{background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,padding:"8px 16px",borderRadius:10,cursor:"pointer"}}>+ Nuevo producto</button>
        </div>
        {products.length===0&&<div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:40,marginBottom:12}}>🛍️</div><div style={{fontSize:13,fontWeight:700,color:"#94a3b8"}}>Sin productos aún</div></div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {products.map(prod=>(
            <div key={prod.id} style={{...card(),overflow:"hidden"}}>
              {prod.foto_url?<img src={prod.foto_url} style={{width:"100%",height:110,objectFit:"cover"}} alt=""/>:
              <div style={{background:"#60A5FA10",borderBottom:"1px solid #60A5FA15",padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:28,width:46,height:46,background:"#60A5FA15",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}>{prod.emoji}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{prod.nombre}</div>{prod.categoria&&<div style={{display:"inline-block",background:"#60A5FA20",borderRadius:20,padding:"2px 10px",fontSize:9,color:"#3B82F6",marginTop:4,fontFamily:"'Space Mono',monospace"}}>{prod.categoria}</div>}</div>
              </div>}
              <div style={{padding:"12px 16px"}}>
                {prod.foto_url&&<div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:4}}>{prod.nombre}</div>}
                <div style={{fontSize:10,color:"#64748b",marginBottom:8}}>{prod.descripcion}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:18,fontWeight:800,color:"#3B82F6"}}>${prod.precio}</div><div style={{fontSize:9,color:"#94a3b8",fontFamily:"'Space Mono',monospace"}}>📦 Stock: {prod.stock}</div></div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>openEditProd(prod)} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#475569",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:600}}>Editar</button>
                    <button onClick={()=>deleteProd(prod.id)} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:11}}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>}

      {showAddEmp&&<div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100}} onClick={()=>setShowAddEmp(false)}>
        <div style={{...card(),borderRadius:"20px 20px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:480,animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
          <div style={{width:36,height:4,background:"#e2e8f0",borderRadius:2,margin:"0 auto 20px"}}/>
          <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>Nuevo empleado — {stationWord} {employees.length+1}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            <input value={newEmpName} onChange={e=>setNewEmpName(e.target.value)} placeholder="Nombre completo" style={inp()}/>
            <select value={newEmpRole} onChange={e=>setNewEmpRole(e.target.value)} style={inp()}><option value="">Selecciona un rol</option>{roles.map(r=><option key={r} value={r}>{r}</option>)}</select>
            <input value={newEmpSpec} onChange={e=>setNewEmpSpec(e.target.value)} placeholder="Especialidad (opcional)" style={inp()}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowAddEmp(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
            <button onClick={addEmployee} style={{flex:2,background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Agregar</button>
          </div>
        </div>
      </div>}

      {showSvcModal&&<div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setShowSvcModal(false)}>
        <div style={{...card(),borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,maxHeight:"92vh",overflowY:"auto",animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>{editingSvc?"Editar servicio":"Nuevo servicio"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
            <div>
              <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>FOTO (OPCIONAL)</div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {svcForm.foto&&<img src={svcForm.foto} style={{width:60,height:60,borderRadius:10,objectFit:"cover",border:"1px solid #e2e8f0"}} alt=""/>}
                <label style={{background:"#f1f5f9",border:"1px dashed #cbd5e1",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:12,color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600}}>
                  📷 {svcForm.foto?"Cambiar foto":"Subir foto"}
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{ const f=e.target.files[0]; if(f){ const url=await fileToBase64(f); setSvcForm(x=>({...x,foto:url})); } }}/>
                </label>
                {svcForm.foto&&<button onClick={()=>setSvcForm(x=>({...x,foto:""}))} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11}}>✕</button>}
              </div>
            </div>
            <div><div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>EMOJI</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{SVC_EMOJIS.map(e=><button key={e} onClick={()=>setSvcForm(f=>({...f,emoji:e}))} style={{width:38,height:38,background:svcForm.emoji===e?`${accentColor}20`:"#f8fafc",border:`1px solid ${svcForm.emoji===e?accentColor:"#e2e8f0"}`,borderRadius:10,cursor:"pointer",fontSize:18}}>{e}</button>)}</div>
            </div>
            <input value={svcForm.name} onChange={e=>setSvcForm(f=>({...f,name:e.target.value}))} placeholder="Nombre del servicio *" style={inp()}/>
            <input value={svcForm.category} onChange={e=>setSvcForm(f=>({...f,category:e.target.value}))} placeholder="Categoría (ej: Corte, Barba, Color…)" style={inp()}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <input type="number" value={svcForm.price} onChange={e=>setSvcForm(f=>({...f,price:e.target.value}))} placeholder="Precio $" style={inp()}/>
              <input type="number" value={svcForm.duration} onChange={e=>setSvcForm(f=>({...f,duration:e.target.value}))} placeholder="Duración min" style={inp()}/>
            </div>
            <textarea value={svcForm.desc} onChange={e=>setSvcForm(f=>({...f,desc:e.target.value}))} placeholder="Descripción (opcional)" rows={2} style={inp({resize:"none"})}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowSvcModal(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
            <button onClick={saveSvc} style={{flex:2,background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Guardar</button>
          </div>
        </div>
      </div>}

      {showProdModal&&<div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setShowProdModal(false)}>
        <div style={{...card(),borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,maxHeight:"92vh",overflowY:"auto",animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>{editingProd?"Editar producto":"Nuevo producto"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
            <div>
              <div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>FOTO (OPCIONAL)</div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {prodForm.foto&&<img src={prodForm.foto} style={{width:60,height:60,borderRadius:10,objectFit:"cover",border:"1px solid #e2e8f0"}} alt=""/>}
                <label style={{background:"#f1f5f9",border:"1px dashed #cbd5e1",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:12,color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600}}>
                  📷 {prodForm.foto?"Cambiar foto":"Subir foto"}
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{ const f=e.target.files[0]; if(f){ const url=await fileToBase64(f); setProdForm(x=>({...x,foto:url})); } }}/>
                </label>
                {prodForm.foto&&<button onClick={()=>setProdForm(x=>({...x,foto:""}))} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11}}>✕</button>}
              </div>
            </div>
            <div><div style={{fontSize:10,color:"#64748b",fontFamily:"'Space Mono',monospace",marginBottom:6}}>EMOJI</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{PROD_EMOJIS.map(e=><button key={e} onClick={()=>setProdForm(f=>({...f,emoji:e}))} style={{width:38,height:38,background:prodForm.emoji===e?`${accentColor}20`:"#f8fafc",border:`1px solid ${prodForm.emoji===e?accentColor:"#e2e8f0"}`,borderRadius:10,cursor:"pointer",fontSize:18}}>{e}</button>)}</div>
            </div>
            <input value={prodForm.name} onChange={e=>setProdForm(f=>({...f,name:e.target.value}))} placeholder="Nombre del producto *" style={inp()}/>
            <input value={prodForm.category} onChange={e=>setProdForm(f=>({...f,category:e.target.value}))} placeholder="Categoría (ej: Pomada, Esmalte…)" style={inp()}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <input type="number" value={prodForm.price} onChange={e=>setProdForm(f=>({...f,price:e.target.value}))} placeholder="Precio $" style={inp()}/>
              <input type="number" value={prodForm.stock} onChange={e=>setProdForm(f=>({...f,stock:e.target.value}))} placeholder="Stock" style={inp()}/>
            </div>
            <textarea value={prodForm.desc} onChange={e=>setProdForm(f=>({...f,desc:e.target.value}))} placeholder="Descripción (opcional)" rows={2} style={inp({resize:"none"})}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowProdModal(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
            <button onClick={saveProd} style={{flex:2,background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Guardar</button>
          </div>
        </div>
      </div>}

      {showAppt&&<div style={{position:"fixed",inset:0,background:"#0000004d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setShowAppt(false)}>
        <div style={{...card(),borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:20}}>{editingAppt?"Editar cita":"Nueva cita"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            <input value={apptForm.client} onChange={e=>setApptForm(f=>({...f,client:e.target.value}))} placeholder="Nombre del cliente *" style={inp()}/>
            <input value={apptForm.phone} onChange={e=>setApptForm(f=>({...f,phone:e.target.value}))} placeholder="Teléfono / WhatsApp" style={inp()}/>
            <select value={apptForm.employeeId} onChange={e=>setApptForm(f=>({...f,employeeId:e.target.value}))} style={inp()}><option value="">Selecciona empleado</option>{employees.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select>
            <select value={apptForm.serviceId} onChange={e=>setApptForm(f=>({...f,serviceId:e.target.value}))} style={inp()}><option value="">Selecciona servicio</option>{services.map(s=><option key={s.id} value={s.id}>{s.emoji} {s.nombre} – ${s.precio}</option>)}</select>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <input type="date" value={apptForm.date} onChange={e=>setApptForm(f=>({...f,date:e.target.value}))} style={inp()}/>
              <select value={apptForm.time} onChange={e=>setApptForm(f=>({...f,time:e.target.value}))} style={inp()}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowAppt(false)} style={{flex:1,background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#64748b",fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Cancelar</button>
            <button onClick={saveAppt} style={{flex:2,background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,border:"none",color:"#0f172a",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,padding:"11px",borderRadius:10,cursor:"pointer"}}>Guardar</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
