import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  GraduationCap, BookOpen, Plus, Trash2, LogOut, LockKeyhole,
  Mail, Target, LayoutDashboard, RefreshCw, AlertCircle, CheckCircle2,
  Eye, EyeOff, Cloud, Calculator, X, Pencil, Download, Search
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const DEFAULT_MODULES = [
  'Programación', 'Bases de Datos', 'Lenguajes de Marcas',
  'Sistemas Informáticos', 'Entornos de Desarrollo', 'Inglés Técnico',
  'Acceso a Datos', 'Desarrollo de Interfaces',
  'Programación Multimedia y Dispositivos Móviles',
  'Programación de Servicios y Procesos', 'Sistemas de Gestión Empresarial',
  'Empresa e Iniciativa Emprendedora'
];

function average(items) {
  const weight = items.reduce((sum, item) => sum + Number(item.weight), 0);
  return weight ? items.reduce((sum, item) => sum + Number(item.grade) * Number(item.weight), 0) / weight : null;
}
function fmt(n) { return n == null ? '—' : n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);
  const [grades, setGrades] = useState([]);
  const [modules, setModules] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [pageError, setPageError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [gradeForm, setGradeForm] = useState({ module_id: '', title: '', grade: '', weight: '100', term: '1ª evaluación', date: '' });
  const [moduleName, setModuleName] = useState('');
  const [target, setTarget] = useState(5);

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadData() {
    if (!supabase || !session?.user) return;
    setLoadingData(true); setPageError('');
    const [m, g] = await Promise.all([
      supabase.from('modules').select('*').order('name'),
      supabase.from('grades').select('*, modules(id,name)').order('created_at', { ascending: false })
    ]);
    if (m.error || g.error) setPageError(m.error?.message || g.error?.message || 'No se han podido cargar tus datos.');
    else { setModules(m.data || []); setGrades(g.data || []); }
    setLoadingData(false);
  }
  useEffect(() => { if (session) loadData(); }, [session?.user?.id]);

  async function signIn(e) {
    e.preventDefault(); setBusy(true); setAuthError(''); setAuthMessage('');
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (result.error) setAuthError(result.error.message);
    else if (authMode === 'signup' && !result.data.session) setAuthMessage('Cuenta creada. Revisa tu correo para confirmar el registro y después inicia sesión.');
    setBusy(false);
  }
  async function resetPassword() {
    if (!email.trim()) { setAuthError('Escribe tu correo arriba para recibir el enlace.'); return; }
    setBusy(true); setAuthError(''); setAuthMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    if (error) setAuthError(error.message); else setAuthMessage('Si existe una cuenta para ese correo, recibirás instrucciones para restablecer la contraseña.');
    setBusy(false);
  }
  async function addModule(e) {
    e.preventDefault();
    const name = moduleName.trim();
    if (!name) return;
    const { data, error } = await supabase.from('modules').insert({ name, user_id: session.user.id }).select().single();
    if (error) setPageError(error.message);
    else { setModules(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name))); setModuleName(''); setShowModuleForm(false); }
  }
  async function deleteModule(module) {
    if (!confirm(`¿Eliminar "${module.name}" y todas sus notas?`)) return;
    const { error } = await supabase.from('modules').delete().eq('id', module.id);
    if (error) setPageError(error.message);
    else { setModules(prev => prev.filter(m => m.id !== module.id)); setGrades(prev => prev.filter(g => g.module_id !== module.id)); if (selectedModule === module.id) setSelectedModule('all'); }
  }
  async function addGrade(e) {
    e.preventDefault();
    const grade = Number(gradeForm.grade), weight = Number(gradeForm.weight);
    if (!gradeForm.module_id || !gradeForm.title.trim() || gradeForm.grade === '' || grade < 0 || grade > 10 || weight <= 0 || weight > 100) {
      setPageError('Comprueba el módulo, el nombre, la nota (0–10) y el peso (mayor que 0 y hasta 100).'); return;
    }
    setPageError('');
    const payload = {
      user_id: session.user.id, module_id: gradeForm.module_id, title: gradeForm.title.trim(),
      grade, weight, term: gradeForm.term, exam_date: gradeForm.date || null
    };
    const { data, error } = await supabase.from('grades').insert(payload).select('*, modules(id,name)').single();
    if (error) setPageError(error.message);
    else { setGrades(prev => [data, ...prev]); setShowGradeForm(false); setGradeForm({ module_id: '', title: '', grade: '', weight: '100', term: '1ª evaluación', date: '' }); }
  }
  async function deleteGrade(grade) {
    if (!confirm(`¿Eliminar la nota "${grade.title}"?`)) return;
    const { error } = await supabase.from('grades').delete().eq('id', grade.id);
    if (error) setPageError(error.message); else setGrades(prev => prev.filter(g => g.id !== grade.id));
  }

  const moduleStats = useMemo(() => modules.map(module => {
    const items = grades.filter(g => g.module_id === module.id);
    const totalWeight = items.reduce((s, g) => s + Number(g.weight), 0);
    const avg = average(items);
    const needed = totalWeight >= 100 ? null : (target * 100 - items.reduce((s, g) => s + Number(g.grade) * Number(g.weight), 0)) / (100 - totalWeight);
    return { ...module, items, avg, totalWeight, needed };
  }), [modules, grades, target]);
  const overall = average(grades);
  const visibleGrades = grades.filter(g =>
    (selectedModule === 'all' || g.module_id === selectedModule) &&
    `${g.title} ${g.modules?.name || ''} ${g.term || ''}`.toLowerCase().includes(query.toLowerCase())
  );
  const setupMissing = !supabase;

  if (authLoading) return <div className="loading-screen"><div className="brand-mark"><GraduationCap /></div><p>Cargando Mi DAM…</p></div>;
  if (setupMissing) return <div className="setup-screen"><div className="brand-mark"><GraduationCap /></div><h1>Mi DAM</h1><p className="muted">Tu espacio para organizar las notas de Desarrollo de Aplicaciones Multiplataforma.</p><div className="setup-card"><AlertCircle /><h2>Falta configurar la conexión a la nube</h2><p>Descarga el proyecto, crea el proyecto de Supabase y añade la URL y la clave pública en el archivo <code>.env</code>. En el README encontrarás los pasos.</p></div></div>;
  if (!session) return (
    <div className="auth-layout">
      <section className="auth-aside">
        <div className="brand"><span className="brand-mark"><GraduationCap /></span><span>Mi DAM</span></div>
        <div className="aside-copy"><span className="eyebrow">TU CURSO, BAJO CONTROL</span><h1>Tus notas.<br/>Tus objetivos.<br/><em>Tu progreso.</em></h1><p>Un solo sitio para organizar tus asignaturas, calcular medias y preparar la próxima evaluación.</p><div className="feature-line"><CheckCircle2 /> Tus datos sincronizados en la nube</div><div className="feature-line"><LockKeyhole /> Tu cuenta, tus notas privadas</div></div>
        <span className="aside-foot">Hecho para estudiantes de DAM</span>
      </section>
      <main className="auth-main"><form className="auth-card" onSubmit={signIn}>
        <span className="eyebrow">{authMode === 'signup' ? 'EMPIEZA GRATIS' : 'BIENVENIDO DE NUEVO'}</span>
        <h2>{authMode === 'signup' ? 'Crea tu cuenta' : 'Inicia sesión'}</h2>
        <p className="muted">{authMode === 'signup' ? 'Regístrate para guardar tus notas en la nube.' : 'Entra para continuar con tu curso.'}</p>
        {authError && <div className="notice error"><AlertCircle size={17}/>{authError}</div>}
        {authMessage && <div className="notice success"><CheckCircle2 size={17}/>{authMessage}</div>}
        <label htmlFor="email">Correo electrónico</label><div className="input-wrap"><Mail size={18}/><input id="email" type="email" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
        <label htmlFor="password">Contraseña</label><div className="input-wrap"><LockKeyhole size={18}/><input id="password" type={showPassword?'text':'password'} autoComplete={authMode==='signup'?'new-password':'current-password'} placeholder="Mínimo 6 caracteres" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required/><button type="button" className="icon-button" onClick={()=>setShowPassword(!showPassword)} aria-label="Mostrar u ocultar contraseña">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
        {authMode === 'login' && <button type="button" className="text-button forgot" onClick={resetPassword}>¿Has olvidado la contraseña?</button>}
        <button className="primary full" type="submit" disabled={busy}>{busy?'Un momento…':authMode==='signup'?'Crear cuenta':'Entrar'} <span>→</span></button>
        <p className="switch-auth">{authMode==='signup'?'¿Ya tienes cuenta?':'¿Todavía no tienes cuenta?'} <button type="button" className="text-button" onClick={()=>{setAuthMode(authMode==='signup'?'login':'signup');setAuthError('');setAuthMessage('');}}>{authMode==='signup'?'Inicia sesión':'Regístrate gratis'}</button></p>
        <div className="privacy-note"><LockKeyhole size={14}/> Tus calificaciones son privadas y están vinculadas a tu cuenta.</div>
      </form></main>
    </div>
  );

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><GraduationCap /></span><span>Mi DAM</span></div>
      <div className="side-label">ESPACIO DE ESTUDIO</div>
      <button className="nav-item active"><LayoutDashboard size={18}/> Resumen</button>
      <button className="nav-item" onClick={()=>{setShowGradeForm(true);window.scrollTo({top:0,behavior:'smooth'});}}><Plus size={18}/> Añadir nota</button>
      <div className="side-label modules-label">ASIGNATURAS <button className="mini-icon" title="Añadir asignatura" onClick={()=>setShowModuleForm(!showModuleForm)}><Plus size={16}/></button></div>
      <div className="module-nav"><button className={`nav-item ${selectedModule==='all'?'selected':''}`} onClick={()=>setSelectedModule('all')}><BookOpen size={17}/> Todas las notas <span>{grades.length}</span></button>
        {modules.map(m=><button key={m.id} className={`nav-item module-link ${selectedModule===m.id?'selected':''}`} onClick={()=>setSelectedModule(m.id)} title={m.name}><span className="module-dot"/><span className="module-name">{m.name}</span></button>)}
      </div>
      <div className="sidebar-bottom"><div className="cloud-status"><Cloud size={17}/><span><strong>Sincronización en la nube</strong><small>Tus datos se guardan online</small></span></div><div className="profile-row"><div className="avatar">{session.user.email?.[0]?.toUpperCase() || 'E'}</div><div className="profile-email">{session.user.email}<small>Cuenta personal</small></div><button className="icon-button" title="Cerrar sesión" onClick={()=>supabase.auth.signOut()}><LogOut size={17}/></button></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><div className="breadcrumb">Mi espacio <span>/</span> Resumen</div><h1>Hola, estudiante <span>✦</span></h1><p className="muted">Aquí tienes el estado de tu curso. Un paso cada vez.</p></div><button className="secondary" onClick={loadData} disabled={loadingData}><RefreshCw size={16} className={loadingData?'spin':''}/> Actualizar</button></header>
      {pageError && <div className="notice error page-notice"><AlertCircle size={17}/>{pageError}<button className="icon-button" onClick={()=>setPageError('')}><X size={16}/></button></div>}
      {showModuleForm && <form className="inline-form" onSubmit={addModule}><div><strong>Nueva asignatura</strong><p className="muted">Añade un módulo de tu ciclo.</p></div><input value={moduleName} onChange={e=>setModuleName(e.target.value)} placeholder="Nombre de la asignatura" required/><button className="primary" type="submit">Guardar módulo</button><button className="icon-button" type="button" onClick={()=>setShowModuleForm(false)}><X size={18}/></button></form>}
      {showGradeForm && <form className="panel grade-form" onSubmit={addGrade}><div className="panel-heading"><div><span className="eyebrow">REGISTRO ACADÉMICO</span><h2>Añadir evaluación</h2></div><button type="button" className="icon-button" onClick={()=>setShowGradeForm(false)}><X size={18}/></button></div>
        {modules.length===0 ? <p className="muted">Primero crea una asignatura desde el menú lateral.</p> : <div className="form-grid">
          <div className="field span-2"><label>Asignatura</label><select value={gradeForm.module_id} onChange={e=>setGradeForm({...gradeForm,module_id:e.target.value})} required><option value="">Selecciona un módulo</option>{modules.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div className="field span-2"><label>Nombre del examen o trabajo</label><input value={gradeForm.title} onChange={e=>setGradeForm({...gradeForm,title:e.target.value})} placeholder="Ej. Examen de consultas SQL" required/></div>
          <div className="field"><label>Nota (0–10)</label><input type="number" min="0" max="10" step="0.01" value={gradeForm.grade} onChange={e=>setGradeForm({...gradeForm,grade:e.target.value})} placeholder="7,5" required/></div>
          <div className="field"><label>Peso en la media (%)</label><input type="number" min="0.01" max="100" step="0.01" value={gradeForm.weight} onChange={e=>setGradeForm({...gradeForm,weight:e.target.value})} required/></div>
          <div className="field"><label>Evaluación</label><select value={gradeForm.term} onChange={e=>setGradeForm({...gradeForm,term:e.target.value})}><option>1ª evaluación</option><option>2ª evaluación</option><option>3ª evaluación</option><option>Final</option><option>Recuperación</option></select></div>
          <div className="field"><label>Fecha (opcional)</label><input type="date" value={gradeForm.date} onChange={e=>setGradeForm({...gradeForm,date:e.target.value})}/></div>
          <div className="form-actions span-2"><p className="muted">El peso debe reflejar los criterios de evaluación de tu profesor.</p><button className="primary" type="submit">Guardar nota</button></div>
        </div>}
      </form>}
      <section className="stats-grid">
        <article className="stat-card stat-featured"><div className="stat-top"><span>Media global</span><span className="stat-icon blue"><Calculator size={19}/></span></div><div className="stat-value">{fmt(overall)}<small>/ 10</small></div><div className="progress-track"><div className="progress-fill" style={{width:`${Math.min(100,(overall||0)*10)}%`}}/></div><div className="stat-foot">{grades.length} evaluaciones registradas</div></article>
        <article className="stat-card"><div className="stat-top"><span>Asignaturas</span><span className="stat-icon violet"><BookOpen size={19}/></span></div><div className="stat-value">{modules.length}</div><div className="stat-foot">{moduleStats.filter(m=>m.avg!==null).length} con calificaciones</div></article>
        <article className="stat-card"><div className="stat-top"><span>Objetivo alcanzado</span><span className="stat-icon green"><Target size={19}/></span></div><div className="stat-value">{moduleStats.filter(m=>m.avg!==null&&m.avg>=5).length}<small> / {moduleStats.filter(m=>m.avg!==null).length}</small></div><div className="stat-foot">Asignaturas con media ≥ 5</div></article>
      </section>
      <section className="section-block"><div className="section-heading"><div><span className="eyebrow">VISTA GENERAL</span><h2>Tus asignaturas</h2></div><button className="secondary" onClick={()=>setShowModuleForm(true)}><Plus size={16}/> Añadir asignatura</button></div>
        {modules.length===0 ? <div className="empty-state"><span className="empty-icon"><BookOpen size={25}/></span><h3>Empieza por tus asignaturas</h3><p>Añade los módulos de tu ciclo DAM para organizar tus notas.</p><button className="primary" onClick={()=>setShowModuleForm(true)}><Plus size={16}/> Crear asignatura</button></div> :
          <div className="subject-grid">{moduleStats.map(m=><article className="subject-card" key={m.id}><div className="subject-top"><span className="subject-icon"><BookOpen size={18}/></span><button className="icon-button delete-module" title="Eliminar asignatura" onClick={()=>deleteModule(m)}><Trash2 size={15}/></button></div><h3>{m.name}</h3><p>{m.items.length} {m.items.length===1?'evaluación':'evaluaciones'}</p><div className="subject-grade"><strong>{fmt(m.avg)}</strong><span>/ 10</span></div><div className="progress-track"><div className={`progress-fill ${m.avg!==null&&m.avg>=5?'good':''}`} style={{width:`${Math.min(100,(m.avg||0)*10)}%`}}/></div><button className="subject-action" onClick={()=>{setSelectedModule(m.id);document.getElementById('grades-history')?.scrollIntoView({behavior:'smooth'});}}>Ver notas <span>→</span></button></article>)}</div>}
      </section>
      <section className="section-block" id="grades-history"><div className="section-heading"><div><span className="eyebrow">SEGUIMIENTO</span><h2>Historial de notas</h2></div><button className="primary" onClick={()=>setShowGradeForm(true)}><Plus size={16}/> Nueva nota</button></div>
        <div className="history-toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar evaluación…"/></div><select value={selectedModule} onChange={e=>setSelectedModule(e.target.value)}><option value="all">Todas las asignaturas</option>{modules.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select><button className="secondary export-btn" onClick={()=>{const rows=[['Asignatura','Evaluación','Nota','Peso (%)','Evaluación académica','Fecha'],...grades.map(g=>[g.modules?.name||'',g.title,g.grade,g.weight,g.term||'',g.exam_date||''])];const csv=rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(';')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}));a.download='mis-notas-dam.csv';a.click();URL.revokeObjectURL(a.href);}}><Download size={16}/> Exportar</button></div>
        {visibleGrades.length===0 ? <div className="empty-history"><p>{grades.length?'No hay notas que coincidan con la búsqueda.':'Aún no has registrado ninguna nota.'}</p>{!grades.length&&<button className="text-button" onClick={()=>setShowGradeForm(true)}>Añade tu primera evaluación →</button>}</div> :
          <div className="table-wrap"><table><thead><tr><th>Evaluación</th><th>Asignatura</th><th>Periodo</th><th>Peso</th><th>Nota</th><th></th></tr></thead><tbody>{visibleGrades.map(g=><tr key={g.id}><td><strong>{g.title}</strong>{g.exam_date&&<small>{new Date(g.exam_date+'T12:00:00').toLocaleDateString('es-ES')}</small>}</td><td>{g.modules?.name||'—'}</td><td><span className="term-pill">{g.term||'Sin periodo'}</span></td><td>{g.weight}%</td><td><span className={`grade-pill ${g.grade>=5?'pass':'fail'}`}>{fmt(Number(g.grade))}</span></td><td><button className="icon-button" title="Eliminar nota" onClick={()=>deleteGrade(g)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>}
      </section>
      <section className="section-block target-panel"><div className="target-copy"><span className="target-icon"><Target size={22}/></span><div><span className="eyebrow">PLANIFICA TU OBJETIVO</span><h2>¿Qué nota necesitas?</h2><p>Calcula la nota necesaria en el porcentaje que te queda de cada asignatura.</p></div></div><div className="target-controls"><label htmlFor="target">Nota final deseada</label><select id="target" value={target} onChange={e=>setTarget(Number(e.target.value))}><option value="5">Aprobar · 5</option><option value="6">Bien · 6</option><option value="7">Notable · 7</option><option value="8">Notable alto · 8</option><option value="9">Sobresaliente · 9</option><option value="10">Matrícula · 10</option></select></div>
        <div className="target-results">{moduleStats.filter(m=>m.items.length).map(m=><div className="target-row" key={m.id}><span>{m.name}</span><strong className={m.totalWeight>=100?(m.avg>=target?'result-good':'result-muted'):m.needed>10?'result-bad':'result-good'}>{m.totalWeight>=100?(m.avg>=target?'Objetivo alcanzado':'Peso completado'):m.needed<=0?'Objetivo alcanzado':m.needed>10?'No alcanzable con el peso restante':`${fmt(m.needed)} / 10`}</strong></div>)}
          {!moduleStats.some(m=>m.items.length)&&<p className="muted">Registra notas para ver aquí los objetivos por asignatura.</p>}</div>
        <p className="footnote">Estimación orientativa: se supone que los pesos de las evaluaciones suman el 100 % de la nota final. Si tus porcentajes corresponden a un trimestre o a otro sistema, adapta el cálculo a los criterios de tu profesor.</p>
      </section>
      <footer className="footer"><span>Mi DAM · Tu progreso, a tu ritmo.</span><span><Cloud size={14}/> Datos sincronizados con Supabase</span></footer>
    </main>
  </div>;
}
