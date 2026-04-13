import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const TIPOS = [
  { id: 'barberia', label: 'Barbería', emoji: '✂️', color: '#6c63ff', rol: 'Barbero', estacion: 'Silla' },
  { id: 'salon', label: 'Salón de Belleza', emoji: '💇', color: '#ff6584', rol: 'Estilista', estacion: 'Mesa' },
  { id: 'unas', label: 'Centro de Uñas', emoji: '💅', color: '#fbbf24', rol: 'Técnica', estacion: 'Puesto' },
  { id: 'mixto', label: 'Centro Mixto', emoji: '🌟', color: '#4ade80', rol: 'Profesional', estacion: 'Silla' },
]

const ESTADOS = {
  disponible: { label: 'Disponible', color: '#4ade80', bg: '#14532d22' },
  ocupado: { label: 'Ocupado', color: '#f87171', bg: '#7f1d1d22' },
  descanso: { label: 'Descanso', color: '#fbbf24', bg: '#78350f22' },
}

const HORAS = Array.from({ length: 13 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`)

const SERVICIOS_DEFAULT = [
  { nombre: 'Corte clásico', precio: 350, duracion: 30, categoria: 'Corte', emoji: '✂️' },
  { nombre: 'Corte + Barba', precio: 550, duracion: 45, categoria: 'Combo', emoji: '🧔' },
  { nombre: 'Fade/Degradado', precio: 450, duracion: 40, categoria: 'Corte', emoji: '💈' },
]

export default function App() {
  const [vista, setVista] = useState('setup') // setup | admin | cliente
  const [negocio, setNegocio] = useState(null)
  const [tab, setTab] = useState('empleados')
  const [empleados, setEmpleados] = useState([])
  const [citas, setCitas] = useState([])
  const [servicios, setServicios] = useState(SERVICIOS_DEFAULT)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [diaVista, setDiaVista] = useState('dia') // dia | semana
  const [productos, setProductos] = useState([
    { id: 1, nombre: 'Pomada para cabello', precio: 350, stock: 10, emoji: '🧴', descripcion: 'Fijación fuerte, acabado mate', categoria: 'Cabello' },
    { id: 2, nombre: 'Aceite para barba', precio: 280, stock: 5, emoji: '🫙', descripcion: 'Hidrata y suaviza la barba', categoria: 'Barba' },
  ])
  const [pedidos, setPedidos] = useState([])

  // Booking flow
  const [booking, setBooking] = useState({ paso: 1, servicio: null, empleado: null, fecha: '', hora: '', nombre: '', tel: '' })
  const [carrito, setCarrito] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('procita_negocio')
    if (saved) {
      const n = JSON.parse(saved)
      setNegocio(n)
      setVista('admin')
      cargarDatos(n.id)
    }
  }, [])

  async function cargarDatos(negocioId) {
    try {
      const [{ data: emps }, { data: cts }] = await Promise.all([
        supabase.from('empleados').select('*').eq('negocio_id', negocioId),
        supabase.from('citas').select('*').eq('negocio_id', negocioId).order('fecha').order('hora')
      ])
      if (emps) setEmpleados(emps)
      if (cts) setCitas(cts)
    } catch (e) { console.log(e) }
  }

  async function crearNegocio(nombre, tipo, whatsapp) {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('negocios').insert({ nombre, tipo, whatsapp }).select().single()
      if (error) throw error
      const n = { ...data, tipoInfo: TIPOS.find(t => t.id === tipo) }
      localStorage.setItem('procita_negocio', JSON.stringify(n))
      setNegocio(n)
      setVista('admin')
    } catch (e) {
      const n = { id: Date.now(), nombre, tipo, whatsapp, tipoInfo: TIPOS.find(t => t.id === tipo) }
      localStorage.setItem('procita_negocio', JSON.stringify(n))
      setNegocio(n)
      setVista('admin')
    }
    setLoading(false)
  }

  async function agregarEmpleado(nombre, especialidad) {
    const num = empleados.length + 1
    const nuevo = { nombre, especialidad, estado: 'disponible', negocio_id: negocio.id, numero: num }
    try {
      const { data } = await supabase.from('empleados').insert(nuevo).select().single()
      setEmpleados(prev => [...prev, data || { ...nuevo, id: Date.now() }])
    } catch {
      setEmpleados(prev => [...prev, { ...nuevo, id: Date.now() }])
    }
  }

  async function cambiarEstado(emp, estado) {
    setEmpleados(prev => prev.map(e => e.id === emp.id ? { ...e, estado } : e))
    try { await supabase.from('empleados').update({ estado }).eq('id', emp.id) } catch {}
  }

  async function eliminarEmpleado(id) {
    setEmpleados(prev => prev.filter(e => e.id !== id))
    try { await supabase.from('empleados').delete().eq('id', id) } catch {}
  }

  async function agendarCita(datos) {
    const nueva = { ...datos, estado: 'pendiente', negocio_id: negocio.id }
    try {
      const { data } = await supabase.from('citas').insert(nueva).select().single()
      setCitas(prev => [...prev, data || { ...nueva, id: Date.now() }])
    } catch {
      setCitas(prev => [...prev, { ...nueva, id: Date.now() }])
    }
  }

  async function cambiarEstadoCita(id, estado) {
    setCitas(prev => prev.map(c => c.id === id ? { ...c, estado } : c))
    try { await supabase.from('citas').update({ estado }).eq('id', id) } catch {}
  }

  async function eliminarCita(id) {
    setCitas(prev => prev.filter(c => c.id !== id))
    try { await supabase.from('citas').delete().eq('id', id) } catch {}
  }

  const tipoInfo = negocio?.tipoInfo || TIPOS[0]
  const hoy = new Date().toISOString().split('T')[0]

  if (vista === 'setup') return <Setup onCrear={crearNegocio} loading={loading} />
  async function hacerPedido(datos) {
    const nuevo = { ...datos, estado: 'pendiente', negocio_id: negocio.id, id: Date.now(), fecha: new Date().toISOString() }
    setPedidos(prev => [...prev, nuevo])
    try { await supabase.from('pedidos').insert(nuevo) } catch {}
  }

  if (vista === 'cliente') return (
    <ClienteView
      negocio={negocio}
      servicios={servicios}
      empleados={empleados}
      productos={productos}
      booking={booking}
      setBooking={setBooking}
      carrito={carrito}
      setCarrito={setCarrito}
      onAgendar={agendarCita}
      onPedido={hacerPedido}
      onVolver={() => setVista('admin')}
      tipoInfo={tipoInfo}
    />
  )

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: tipoInfo.color + '22', display: 'grid', placeItems: 'center', fontSize: 18 }}>{tipoInfo.emoji}</div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>{negocio?.nombre}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{tipoInfo.label}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small ghost onClick={() => setVista('setup')}>✏️ Editar</Btn>
          <Btn small onClick={() => setVista('cliente')} style={{ background: tipoInfo.color }}>📱 Vista cliente</Btn>
        </div>
      </header>

      {/* Tabs */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', padding: '0 20px' }}>
        {[
          { id: 'empleados', label: '👥 Equipo' },
          { id: 'agenda', label: '📅 Agenda' },
          { id: 'servicios', label: '📋 Servicios' },
          { id: 'tienda', label: '🛍️ Tienda' },
          { id: 'pedidos', label: '📦 Pedidos' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 16px', background: 'none', border: 'none', color: tab === t.id ? tipoInfo.color : 'var(--muted)',
            borderBottom: tab === t.id ? `2px solid ${tipoInfo.color}` : '2px solid transparent',
            fontWeight: tab === t.id ? 600 : 400, fontSize: 13, transition: 'all .2s'
          }}>{t.label}</button>
        ))}
      </nav>

      <main style={{ flex: 1, padding: 20, maxWidth: 700, margin: '0 auto', width: '100%' }}>
        {tab === 'empleados' && (
          <EmpleadosTab empleados={empleados} tipoInfo={tipoInfo} onCambiarEstado={cambiarEstado} onEliminar={eliminarEmpleado} onAgregar={agregarEmpleado} />
        )}
        {tab === 'agenda' && (
          <AgendaTab citas={citas} empleados={empleados} hoy={hoy} diaVista={diaVista} setDiaVista={setDiaVista} onCambiarEstado={cambiarEstadoCita} onEliminar={eliminarCita} tipoInfo={tipoInfo} />
        )}
        {tab === 'servicios' && (
          <ServiciosTab servicios={servicios} setServicios={setServicios} tipoInfo={tipoInfo} />
        )}
        {tab === 'tienda' && (
          <TiendaAdminTab productos={productos} setProductos={setProductos} tipoInfo={tipoInfo} />
        )}
        {tab === 'pedidos' && (
          <PedidosTab pedidos={pedidos} setPedidos={setPedidos} tipoInfo={tipoInfo} />
        )}
      </main>
    </div>
  )
}

// ===================== SETUP =====================
function Setup({ onCrear, loading }) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>Pro<span style={{ color: '#6c63ff' }}>Cita</span></div>
        <div style={{ color: 'var(--muted)', marginTop: 6 }}>Configura tu negocio para empezar</div>
      </div>
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, border: '1px solid var(--border)' }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>Nombre del negocio</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Barbería El Maestro"
          style={{ width: '100%', padding: '12px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 15, marginBottom: 16, outline: 'none' }} />
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>WhatsApp del negocio</label>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 14 }}>+1</span>
          <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="8091234567" type="tel"
            style={{ width: '100%', padding: '12px 16px 12px 36px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 15, outline: 'none' }} />
        </div>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 13, color: 'var(--muted)' }}>Tipo de negocio</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {TIPOS.map(t => (
            <button key={t.id} onClick={() => setTipo(t.id)} style={{
              padding: '14px 10px', borderRadius: 12, border: `2px solid ${tipo === t.id ? t.color : 'var(--border)'}`,
              background: tipo === t.id ? t.color + '18' : 'var(--surface2)', color: 'var(--text)', textAlign: 'center',
              transition: 'all .2s', cursor: 'pointer'
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{t.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{t.label}</div>
            </button>
          ))}
        </div>
        <Btn full disabled={!nombre || !tipo || loading} onClick={() => onCrear(nombre, tipo, whatsapp)} style={{ background: tipo ? TIPOS.find(t => t.id === tipo)?.color : 'var(--accent)' }}>
          {loading ? 'Creando...' : 'Empezar →'}
        </Btn>
      </div>
    </div>
  )
}

// ===================== EMPLEADOS =====================
function EmpleadosTab({ empleados, tipoInfo, onCambiarEstado, onEliminar, onAgregar }) {
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [esp, setEsp] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const filtrados = filtro === 'todos' ? empleados : empleados.filter(e => e.estado === filtro)

  function handleAgregar() {
    if (!nombre) return
    onAgregar(nombre, esp)
    setNombre(''); setEsp(''); setShowForm(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20 }}>Personal</h2>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{empleados.length} {tipoInfo.rol.toLowerCase()}s registrados</div>
        </div>
        <Btn small onClick={() => setShowForm(!showForm)} style={{ background: tipoInfo.color }}>+ Agregar</Btn>
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder={`Nombre del ${tipoInfo.rol.toLowerCase()}`}
            style={{ width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 10, outline: 'none' }} />
          <input value={esp} onChange={e => setEsp(e.target.value)} placeholder="Especialidad (opcional)"
            style={{ width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 10, outline: 'none' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn full onClick={handleAgregar} style={{ background: tipoInfo.color }}>Agregar</Btn>
            <Btn full ghost onClick={() => setShowForm(false)}>Cancelar</Btn>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['todos', 'disponible', 'ocupado', 'descanso'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '6px 14px', borderRadius: 99, border: `1px solid ${filtro === f ? tipoInfo.color : 'var(--border)'}`,
            background: filtro === f ? tipoInfo.color + '20' : 'transparent', color: filtro === f ? tipoInfo.color : 'var(--muted)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize'
          }}>{f}</button>
        ))}
      </div>

      {filtrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{tipoInfo.emoji}</div>
          <div>No hay {tipoInfo.rol.toLowerCase()}s aún</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {filtrados.map((emp, i) => {
          const est = ESTADOS[emp.estado] || ESTADOS.disponible
          return (
            <div key={emp.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: tipoInfo.color + '22', display: 'grid', placeItems: 'center', fontFamily: 'Syne', fontWeight: 700, color: tipoInfo.color, fontSize: 16, flexShrink: 0 }}>
                {tipoInfo.estacion[0]}{emp.numero || i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{emp.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{emp.especialidad || tipoInfo.rol}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select value={emp.estado} onChange={e => onCambiarEstado(emp, e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${est.color}`, background: est.bg, color: est.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                  {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button onClick={() => onEliminar(emp.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', padding: 4 }}>🗑</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===================== AGENDA =====================
function AgendaTab({ citas, empleados, hoy, diaVista, setDiaVista, onCambiarEstado, onEliminar, tipoInfo }) {
  const [fecha, setFecha] = useState(hoy)
  const citasHoy = citas.filter(c => c.fecha === fecha)

  const estadoColors = { pendiente: '#fbbf24', confirmada: '#6c63ff', completada: '#4ade80', cancelada: '#f87171' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20 }}>Agenda</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {['dia', 'semana'].map(v => (
            <button key={v} onClick={() => setDiaVista(v)} style={{
              padding: '6px 14px', borderRadius: 8, border: `1px solid ${diaVista === v ? tipoInfo.color : 'var(--border)'}`,
              background: diaVista === v ? tipoInfo.color + '20' : 'transparent', color: diaVista === v ? tipoInfo.color : 'var(--muted)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize'
            }}>{v === 'dia' ? '📋 Día' : '📅 Semana'}</button>
          ))}
        </div>
      </div>

      <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: 14, marginBottom: 16, outline: 'none' }} />

      {diaVista === 'dia' ? (
        <div>
          {citasHoy.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
              <div>No hay citas para este día</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {citasHoy.sort((a, b) => a.hora?.localeCompare(b.hora)).map(cita => {
                const color = estadoColors[cita.estado] || '#fbbf24'
                const emp = empleados.find(e => e.id == cita.empleado_id)
                return (
                  <div key={cita.id} style={{ background: 'var(--surface)', border: `1px solid ${color}44`, borderLeft: `3px solid ${color}`, borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{cita.cliente_nombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{cita.servicio} · {cita.hora} · {emp?.nombre || 'Sin asignar'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: color + '22', color, fontWeight: 600 }}>{cita.estado}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {['confirmada', 'completada', 'cancelada'].map(s => (
                        <button key={s} onClick={() => onCambiarEstado(cita.id, s)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${estadoColors[s]}44`, background: estadoColors[s] + '15', color: estadoColors[s], fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                          {s}
                        </button>
                      ))}
                      <button onClick={() => onEliminar(cita.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 11, cursor: 'pointer' }}>🗑</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <SemanaView citas={citas} empleados={empleados} fecha={fecha} estadoColors={estadoColors} tipoInfo={tipoInfo} />
      )}
    </div>
  )
}

function SemanaView({ citas, empleados, fecha, estadoColors, tipoInfo }) {
  const start = new Date(fecha + 'T00:00:00')
  const day = start.getDay()
  const monday = new Date(start)
  monday.setDate(start.getDate() - (day === 0 ? 6 : day - 1))
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
  const DIAS_LABEL = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', minWidth: 500, gap: 1, background: 'var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: 'var(--surface2)', padding: '8px 4px' }} />
        {dias.map((d, i) => (
          <div key={d} style={{ background: 'var(--surface2)', padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700 }}>
            <div style={{ color: 'var(--muted)' }}>{DIAS_LABEL[i]}</div>
            <div style={{ color: d === new Date().toISOString().split('T')[0] ? tipoInfo.color : 'var(--text)' }}>{d.slice(8)}</div>
          </div>
        ))}
        {HORAS.slice(0, 10).map(hora => (
          <>
            <div key={hora} style={{ background: 'var(--surface)', padding: '8px 4px', fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>{hora}</div>
            {dias.map(d => {
              const cita = citas.find(c => c.fecha === d && c.hora === hora)
              return (
                <div key={d} style={{ background: 'var(--surface)', padding: 4, minHeight: 36 }}>
                  {cita && (
                    <div style={{ background: (estadoColors[cita.estado] || '#fbbf24') + '30', borderRadius: 6, padding: '3px 5px', fontSize: 10, color: estadoColors[cita.estado] || '#fbbf24', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {cita.cliente_nombre}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}

// ===================== SERVICIOS =====================
function ServiciosTab({ servicios, setServicios, tipoInfo }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', precio: '', duracion: 30, categoria: 'Corte', emoji: '✂️' })
  const EMOJIS = ['✂️', '💈', '🧔', '💇', '💅', '🌟', '👑', '💆']

  function agregar() {
    if (!form.nombre || !form.precio) return
    setServicios(prev => [...prev, { ...form, precio: +form.precio }])
    setForm({ nombre: '', precio: '', duracion: 30, categoria: 'Corte', emoji: '✂️' })
    setShowForm(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20 }}>Servicios</h2>
        <Btn small onClick={() => setShowForm(!showForm)} style={{ background: tipoInfo.color }}>+ Agregar</Btn>
      </div>
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))} style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${form.emoji === e ? tipoInfo.color : 'var(--border)'}`, background: form.emoji === e ? tipoInfo.color + '20' : 'var(--surface2)', fontSize: 18, cursor: 'pointer' }}>{e}</button>
            ))}
          </div>
          {[
            { key: 'nombre', placeholder: 'Nombre del servicio' },
            { key: 'precio', placeholder: 'Precio (RD$)', type: 'number' },
            { key: 'duracion', placeholder: 'Duración (min)', type: 'number' },
            { key: 'categoria', placeholder: 'Categoría' },
          ].map(({ key, placeholder, type }) => (
            <input key={key} type={type || 'text'} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, outline: 'none' }} />
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn full onClick={agregar} style={{ background: tipoInfo.color }}>Guardar</Btn>
            <Btn full ghost onClick={() => setShowForm(false)}>Cancelar</Btn>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gap: 10 }}>
        {servicios.map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: tipoInfo.color + '18', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>{s.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{s.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.categoria} · {s.duracion} min</div>
            </div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, color: tipoInfo.color }}>RD${s.precio}</div>
            <button onClick={() => setServicios(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===================== CLIENTE VIEW =====================
function ClienteView({ negocio, servicios, empleados, productos, booking, setBooking, carrito, setCarrito, onAgendar, onPedido, onVolver, tipoInfo }) {
  const disponibles = empleados.filter(e => e.estado === 'disponible')
  const hoy = new Date().toISOString().split('T')[0]
  const [confirmado, setConfirmado] = useState(false)
  const [tabCliente, setTabCliente] = useState('cita') // cita | tienda
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false)

  async function confirmar() {
    if (!booking.nombre || !booking.fecha || !booking.hora || !booking.servicio || !booking.empleado) return
    await onAgendar({
      cliente_nombre: booking.nombre,
      cliente_tel: booking.tel,
      servicio: booking.servicio.nombre,
      empleado_id: booking.empleado.id,
      fecha: booking.fecha,
      hora: booking.hora,
    })
    setConfirmado(true)
  }

  function abrirWhatsApp() {
    const tel = negocio?.whatsapp ? `1${negocio.whatsapp.replace(/\D/g,'')}` : ''
    const msg = encodeURIComponent(
      `Hola ${negocio?.nombre} 👋\n\nAcabo de agendar una cita:\n\n` +
      `📋 Servicio: ${booking.servicio?.nombre}\n` +
      `👤 ${tipoInfo.rol}: ${booking.empleado?.nombre}\n` +
      `📅 Fecha: ${booking.fecha}\n` +
      `⏰ Hora: ${booking.hora}\n` +
      `💰 Total: RD$${booking.servicio?.precio}\n\n` +
      `Mi nombre: ${booking.nombre}\n` +
      (booking.tel ? `Tel: ${booking.tel}` : '')
    )
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
  }

  if (confirmado) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>¡Cita agendada!</div>
      <div style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 8 }}>Te esperamos el {booking.fecha} a las {booking.hora}</div>
      <div style={{ color: 'var(--muted)', textAlign: 'center', fontSize: 13, marginBottom: 28 }}>Toca el botón para notificar al negocio por WhatsApp</div>

      <button onClick={abrirWhatsApp} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px',
        background: '#25D366', borderRadius: 14, border: 'none', color: 'white',
        fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 14, width: '100%', maxWidth: 320, justifyContent: 'center'
      }}>
        <span style={{ fontSize: 22 }}>💬</span> Avisar por WhatsApp
      </button>

      <Btn onClick={() => { setConfirmado(false); setBooking({ paso: 1, servicio: null, empleado: null, fecha: '', hora: '', nombre: '', tel: '' }) }} ghost style={{ width: '100%', maxWidth: 320 }}>
        Agendar otra cita
      </Btn>
    </div>
  )

  const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)

  async function confirmarPedido(nombre, tel) {
    if (!nombre || carrito.length === 0) return
    await onPedido({ cliente_nombre: nombre, cliente_tel: tel, items: carrito, total: totalCarrito })
    setCarrito([])
    setPedidoConfirmado(true)
  }

  return (
    <div style={{ minHeight: '100dvh' }}>
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onVolver} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700 }}>{negocio?.nombre}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{tipoInfo.label}</div>
        </div>
        {carrito.length > 0 && (
          <div style={{ background: tipoInfo.color, borderRadius: 99, width: 22, height: 22, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
            {carrito.reduce((s, i) => s + i.cantidad, 0)}
          </div>
        )}
      </header>

      {/* Tabs cliente */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', padding: '0 20px' }}>
        {[{ id: 'cita', label: '📅 Agendar cita' }, { id: 'tienda', label: '🛍️ Tienda' }].map(t => (
          <button key={t.id} onClick={() => setTabCliente(t.id)} style={{
            padding: '12px 16px', background: 'none', border: 'none',
            color: tabCliente === t.id ? tipoInfo.color : 'var(--muted)',
            borderBottom: tabCliente === t.id ? `2px solid ${tipoInfo.color}` : '2px solid transparent',
            fontWeight: tabCliente === t.id ? 600 : 400, fontSize: 13, cursor: 'pointer'
          }}>{t.label}</button>
        ))}
      </nav>

      <div style={{ padding: 20, maxWidth: 500, margin: '0 auto' }}>

        {tabCliente === 'tienda' && (
          <TiendaClienteView
            productos={productos}
            carrito={carrito}
            setCarrito={setCarrito}
            tipoInfo={tipoInfo}
            negocio={negocio}
            onConfirmar={confirmarPedido}
            pedidoConfirmado={pedidoConfirmado}
            setPedidoConfirmado={setPedidoConfirmado}
            totalCarrito={totalCarrito}
          />
        )}

        {tabCliente === 'cita' && <>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1, 2, 3, 4].map(p => (
            <div key={p} style={{ flex: 1, height: 3, borderRadius: 99, background: booking.paso >= p ? tipoInfo.color : 'var(--border)', transition: 'background .3s' }} />
          ))}
        </div>

        {booking.paso === 1 && (
          <div>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>¿Qué servicio quieres?</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {servicios.map((s, i) => (
                <button key={i} onClick={() => setBooking(b => ({ ...b, servicio: s, paso: 2 }))}
                  style={{ background: 'var(--surface)', border: `2px solid ${booking.servicio?.nombre === s.nombre ? tipoInfo.color : 'var(--border)'}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <span style={{ fontSize: 28 }}>{s.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.duracion} min</div>
                  </div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, color: tipoInfo.color }}>RD${s.precio}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {booking.paso === 2 && (
          <div>
            <button onClick={() => setBooking(b => ({ ...b, paso: 1 }))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginBottom: 12 }}>← Atrás</button>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>Elige tu {tipoInfo.rol.toLowerCase()}</h3>
            {disponibles.length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>No hay {tipoInfo.rol.toLowerCase()}s disponibles ahora</div>}
            <div style={{ display: 'grid', gap: 10 }}>
              {disponibles.map(emp => (
                <button key={emp.id} onClick={() => setBooking(b => ({ ...b, empleado: emp, paso: 3 }))}
                  style={{ background: 'var(--surface)', border: `2px solid ${booking.empleado?.id === emp.id ? tipoInfo.color : 'var(--border)'}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: tipoInfo.color + '22', display: 'grid', placeItems: 'center', fontFamily: 'Syne', fontWeight: 700, color: tipoInfo.color, fontSize: 16 }}>
                    {tipoInfo.estacion[0]}{emp.numero}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{emp.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{emp.especialidad || tipoInfo.rol}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {booking.paso === 3 && (
          <div>
            <button onClick={() => setBooking(b => ({ ...b, paso: 2 }))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginBottom: 12 }}>← Atrás</button>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>Fecha y hora</h3>
            <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Fecha</label>
            <input type="date" value={booking.fecha} min={hoy} onChange={e => setBooking(b => ({ ...b, fecha: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', marginBottom: 16, outline: 'none' }} />
            <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Hora disponible</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {HORAS.map(h => (
                <button key={h} onClick={() => setBooking(b => ({ ...b, hora: h }))} style={{
                  padding: '10px 6px', borderRadius: 10, border: `2px solid ${booking.hora === h ? tipoInfo.color : 'var(--border)'}`,
                  background: booking.hora === h ? tipoInfo.color + '20' : 'var(--surface)', color: booking.hora === h ? tipoInfo.color : 'var(--text)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}>{h}</button>
              ))}
            </div>
            <Btn full disabled={!booking.fecha || !booking.hora} onClick={() => setBooking(b => ({ ...b, paso: 4 }))} style={{ marginTop: 20, background: tipoInfo.color }}>Continuar →</Btn>
          </div>
        )}

        {booking.paso === 4 && (
          <div>
            <button onClick={() => setBooking(b => ({ ...b, paso: 3 }))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginBottom: 12 }}>← Atrás</button>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>Tus datos</h3>
            <input value={booking.nombre} onChange={e => setBooking(b => ({ ...b, nombre: e.target.value }))} placeholder="Tu nombre completo"
              style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', marginBottom: 10, outline: 'none' }} />
            <input value={booking.tel} onChange={e => setBooking(b => ({ ...b, tel: e.target.value }))} placeholder="Teléfono (opcional)"
              style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', marginBottom: 20, outline: 'none' }} />

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10, fontWeight: 600 }}>Resumen</div>
              {[
                ['Servicio', booking.servicio?.nombre],
                [tipoInfo.rol, booking.empleado?.nombre],
                ['Fecha', booking.fecha],
                ['Hora', booking.hora],
                ['Total', `RD$${booking.servicio?.precio}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                  <span style={{ color: 'var(--muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            <Btn full disabled={!booking.nombre} onClick={confirmar} style={{ background: tipoInfo.color }}>✅ Confirmar cita</Btn>
          </div>
        )}
        </>}
      </div>
    </div>
  )
}

// ===================== TIENDA CLIENTE =====================
function TiendaClienteView({ productos, carrito, setCarrito, tipoInfo, negocio, onConfirmar, pedidoConfirmado, setPedidoConfirmado, totalCarrito }) {
  const [paso, setPaso] = useState('catalogo') // catalogo | carrito | datos
  const [nombre, setNombre] = useState('')
  const [tel, setTel] = useState('')

  function agregarAlCarrito(p) {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === p.id)
      if (existe) return prev.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { ...p, cantidad: 1 }]
    })
  }

  function quitarDelCarrito(id) {
    setCarrito(prev => {
      const item = prev.find(i => i.id === id)
      if (item?.cantidad === 1) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i)
    })
  }

  function abrirWhatsAppPedido() {
    const tel_neg = negocio?.whatsapp ? `1${negocio.whatsapp.replace(/\D/g,'')}` : ''
    const lista = carrito.map(i => `• ${i.nombre} x${i.cantidad} = RD$${i.precio * i.cantidad}`).join('\n')
    const msg = encodeURIComponent(
      `Hola ${negocio?.nombre} 👋\n\nQuiero hacer un pedido:\n\n${lista}\n\n💰 Total: RD$${totalCarrito}\n\nMi nombre: ${nombre}\n${tel ? `Tel: ${tel}` : ''}`
    )
    window.open(`https://wa.me/${tel_neg}?text=${msg}`, '_blank')
  }

  if (pedidoConfirmado) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
      <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>¡Pedido enviado!</div>
      <div style={{ color: 'var(--muted)', marginBottom: 8 }}>Tu pedido por RD${totalCarrito} fue registrado</div>
      <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>Avisa al negocio por WhatsApp para coordinarlo</div>
      <button onClick={abrirWhatsAppPedido} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px',
        background: '#25D366', borderRadius: 14, border: 'none', color: 'white',
        fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 14, width: '100%', justifyContent: 'center'
      }}>💬 Avisar por WhatsApp</button>
      <Btn ghost full onClick={() => { setPedidoConfirmado(false); setPaso('catalogo') }}>Ver más productos</Btn>
    </div>
  )

  if (paso === 'catalogo') return (
    <div>
      <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Productos disponibles</h3>
      {productos.filter(p => p.stock > 0).length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
          <div>No hay productos disponibles por ahora</div>
        </div>
      )}
      <div style={{ display: 'grid', gap: 10 }}>
        {productos.filter(p => p.stock > 0).map(p => {
          const enCarrito = carrito.find(i => i.id === p.id)
          return (
            <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: tipoInfo.color + '18', display: 'grid', placeItems: 'center', fontSize: 26, flexShrink: 0 }}>{p.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.descripcion}</div>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, color: tipoInfo.color, marginTop: 2 }}>RD${p.precio}</div>
              </div>
              {enCarrito ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => quitarDelCarrito(p.id)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${tipoInfo.color}`, background: 'transparent', color: tipoInfo.color, fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>-</button>
                  <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{enCarrito.cantidad}</span>
                  <button onClick={() => agregarAlCarrito(p)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: tipoInfo.color, color: 'white', fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>+</button>
                </div>
              ) : (
                <button onClick={() => agregarAlCarrito(p)} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: tipoInfo.color, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Agregar</button>
              )}
            </div>
          )
        })}
      </div>
      {carrito.length > 0 && (
        <div style={{ position: 'sticky', bottom: 16, marginTop: 20 }}>
          <Btn full onClick={() => setPaso('carrito')} style={{ background: tipoInfo.color, boxShadow: `0 4px 20px ${tipoInfo.color}55` }}>
            🛒 Ver carrito ({carrito.reduce((s, i) => s + i.cantidad, 0)}) · RD${totalCarrito}
          </Btn>
        </div>
      )}
    </div>
  )

  if (paso === 'carrito') return (
    <div>
      <button onClick={() => setPaso('catalogo')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginBottom: 16 }}>← Seguir comprando</button>
      <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Tu carrito</h3>
      <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
        {carrito.map(item => (
          <div key={item.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>{item.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>RD${item.precio} c/u</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => quitarDelCarrito(item.id)} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${tipoInfo.color}`, background: 'transparent', color: tipoInfo.color, cursor: 'pointer', fontSize: 16 }}>-</button>
              <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.cantidad}</span>
              <button onClick={() => setCarrito(prev => prev.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i))} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: tipoInfo.color, color: 'white', cursor: 'pointer', fontSize: 16 }}>+</button>
            </div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, color: tipoInfo.color, minWidth: 60, textAlign: 'right' }}>RD${item.precio * item.cantidad}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>Total a pagar en local</span>
        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: tipoInfo.color }}>RD${totalCarrito}</span>
      </div>
      <Btn full onClick={() => setPaso('datos')} style={{ background: tipoInfo.color }}>Continuar →</Btn>
    </div>
  )

  if (paso === 'datos') return (
    <div>
      <button onClick={() => setPaso('carrito')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginBottom: 16 }}>← Atrás</button>
      <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Tus datos</h3>
      <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>Pagas cuando recoges en el local</div>
      <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre completo"
        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', marginBottom: 10, outline: 'none' }} />
      <input value={tel} onChange={e => setTel(e.target.value)} placeholder="Teléfono (opcional)"
        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', marginBottom: 20, outline: 'none' }} />
      <Btn full disabled={!nombre} onClick={() => onConfirmar(nombre, tel)} style={{ background: tipoInfo.color }}>✅ Confirmar pedido · RD${totalCarrito}</Btn>
    </div>
  )

  return null
}

// ===================== HELPERS =====================
function Btn({ children, onClick, disabled, full, small, ghost, style = {}, ...props }) {
  return (
    <button onClick={onClick} disabled={disabled} {...props} style={{
      padding: small ? '8px 14px' : '12px 20px',
      borderRadius: 10, border: ghost ? '1px solid var(--border)' : 'none',
      background: ghost ? 'transparent' : 'var(--accent)', color: ghost ? 'var(--muted)' : 'white',
      fontWeight: 600, fontSize: small ? 12 : 14, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, width: full ? '100%' : 'auto',
      fontFamily: 'inherit', transition: 'opacity .2s', ...style
    }}>{children}</button>
  )
}

// ===================== TIENDA ADMIN =====================
function TiendaAdminTab({ productos, setProductos, tipoInfo }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', precio: '', stock: '', descripcion: '', categoria: '', emoji: '🧴' })
  const EMOJIS = ['🧴', '🫙', '✂️', '💈', '🪒', '🧼', '💊', '🛍️', '📦', '🎁']

  function agregar() {
    if (!form.nombre || !form.precio) return
    setProductos(prev => [...prev, { ...form, precio: +form.precio, stock: +form.stock || 0, id: Date.now() }])
    setForm({ nombre: '', precio: '', stock: '', descripcion: '', categoria: '', emoji: '🧴' })
    setShowForm(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20 }}>Tienda</h2>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{productos.length} productos en catálogo</div>
        </div>
        <Btn small onClick={() => setShowForm(!showForm)} style={{ background: tipoInfo.color }}>+ Producto</Btn>
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>Ícono del producto</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                style={{ width: 38, height: 38, borderRadius: 8, border: `2px solid ${form.emoji === e ? tipoInfo.color : 'var(--border)'}`, background: form.emoji === e ? tipoInfo.color + '20' : 'var(--surface2)', fontSize: 20, cursor: 'pointer' }}>{e}</button>
            ))}
          </div>
          {[
            { key: 'nombre', placeholder: 'Nombre del producto' },
            { key: 'descripcion', placeholder: 'Descripción breve' },
            { key: 'categoria', placeholder: 'Categoría (Cabello, Barba, Uñas...)' },
            { key: 'precio', placeholder: 'Precio (RD$)', type: 'number' },
            { key: 'stock', placeholder: 'Cantidad en stock', type: 'number' },
          ].map(({ key, placeholder, type }) => (
            <input key={key} type={type || 'text'} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', marginBottom: 8, outline: 'none', fontSize: 14 }} />
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Btn full onClick={agregar} style={{ background: tipoInfo.color }}>Guardar producto</Btn>
            <Btn full ghost onClick={() => setShowForm(false)}>Cancelar</Btn>
          </div>
        </div>
      )}

      {productos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Sin productos aún</div>
          <div style={{ fontSize: 13 }}>Agrega productos que quieras vender a tus clientes</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {productos.map((p) => (
          <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: tipoInfo.color + '18', display: 'grid', placeItems: 'center', fontSize: 24, flexShrink: 0 }}>{p.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{p.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>{p.descripcion}</div>
              <div style={{ fontSize: 11, color: p.stock > 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                {p.stock > 0 ? `✅ ${p.stock} en stock` : '❌ Sin stock'}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, color: tipoInfo.color, fontSize: 16 }}>RD${p.precio}</div>
              <button onClick={() => setProductos(prev => prev.filter(x => x.id !== p.id))}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, marginTop: 4 }}>🗑 Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===================== PEDIDOS ADMIN =====================
function PedidosTab({ pedidos, setPedidos, tipoInfo }) {
  const estadoColors = { pendiente: '#fbbf24', preparando: '#6c63ff', listo: '#4ade80', entregado: '#8888a0' }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20 }}>Pedidos</h2>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{pedidos.filter(p => p.estado !== 'entregado').length} pedidos activos</div>
      </div>

      {pedidos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Sin pedidos aún</div>
          <div style={{ fontSize: 13 }}>Cuando un cliente haga un pedido aparecerá aquí</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {[...pedidos].reverse().map(p => {
          const color = estadoColors[p.estado] || '#fbbf24'
          return (
            <div key={p.id} style={{ background: 'var(--surface)', border: `1px solid ${color}44`, borderLeft: `3px solid ${color}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{p.cliente_nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.items?.length || 0} producto(s) · RD${p.total}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{p.fecha ? new Date(p.fecha).toLocaleDateString('es-DO') : ''}</div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: color + '22', color, fontWeight: 600 }}>{p.estado}</span>
              </div>
              {p.items?.map((item, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>• {item.nombre} x{item.cantidad} — RD${item.precio * item.cantidad}</div>
              ))}
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {['preparando', 'listo', 'entregado'].map(s => (
                  <button key={s} onClick={() => setPedidos(prev => prev.map(x => x.id === p.id ? { ...x, estado: s } : x))}
                    style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${estadoColors[s]}44`, background: estadoColors[s] + '15', color: estadoColors[s], fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
