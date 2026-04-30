import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { validateEmail } from "../../utils/validators"
import { FieldError, inputStyle } from "../components/FieldError"

function Login() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors]     = useState({})
  const [serverError, setServerError] = useState("")
  const [loading, setLoading]   = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleBlur = (field) => {
    if (field === "email") {
      const r = validateEmail(email)
      setErrors(prev => ({ ...prev, email: r.error }))
    } else if (field === "password" && !password) {
      setErrors(prev => ({ ...prev, password: "La contraseña es obligatoria" }))
    } else {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError("")

    const errs = {}
    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) errs.email = emailCheck.error
    if (!password)         errs.password = "La contraseña es obligatoria"

    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const result = await login(email.trim().toLowerCase(), password)
    setLoading(false)

    if (result.success) {
      if (result.role === "admin") navigate("/admin")
      else if (result.role === "restaurant") navigate("/restaurant-panel")
      else navigate("/")
    } else {
      setServerError(result.error || "Correo o contraseña incorrectos")
    }
  }

  return (
    <div style={S.page}>
      <div style={S.imagePanel} className="qb-auth-image-panel">
        <div style={S.imageBg} />
        <div style={S.imageOverlay} />
        <div style={S.imageContent}>
          <Link to="/" style={S.imageLogo}>🍔 QuickBite</Link>
          <h2 style={S.imageTitle}>El sabor que buscas,<br />en minutos.</h2>
          <p style={S.imageSub}>Los mejores restaurantes de tu ciudad, directo a tu puerta.</p>
          <div style={S.imageStats}>
            {[["4+","Restaurantes"],["20 min","Entrega promedio"],["Gratis","Primer envío"]].map(([n,l],i,a) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:"24px" }}>
                <div style={S.imageStat}><span style={S.imageStatNum}>{n}</span><span style={S.imageStatLabel}>{l}</span></div>
                {i < a.length-1 && <div style={S.imageStatDivider}/>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={S.formPanel} className="qb-auth-form-panel">
        <div style={S.formInner}>
          <div style={S.formHeader}>
            <h1 style={S.title}>Bienvenido de vuelta</h1>
            <p style={S.sub}>Ingresa con tu cuenta para continuar</p>
          </div>

          {serverError && <div style={S.error} role="alert"><span aria-hidden="true">⚠️</span> {serverError}</div>}

          <form onSubmit={handleSubmit} style={S.form} noValidate>
            <div style={S.field}>
              <label style={S.label} htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                style={inputStyle(!!errors.email)}
                type="text"
                inputMode="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => { setEmail(e.target.value); if(errors.email) setErrors(p => ({...p, email:""})) }}
                onBlur={() => handleBlur("email")}
                maxLength={100}
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "login-email-error" : undefined}
              />
              <FieldError error={errors.email} />
            </div>

            <div style={S.field}>
              <label style={S.label} htmlFor="login-password">Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  style={inputStyle(!!errors.password)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres con letras y números"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  maxLength={72}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={S.togglePw}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <FieldError error={errors.password} />
            </div>

            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Iniciar sesión →"}
            </button>
          </form>

          <div style={S.divider}><span style={S.dividerLine}/><span style={S.dividerText}>o continúa con</span><span style={S.dividerLine}/></div>
          <div style={S.socialBtns}>
            <button style={S.socialBtn}>🌐 Google</button>
            <button style={S.socialBtn}>📘 Facebook</button>
          </div>

          <p style={S.hint}>¿No tienes cuenta? <Link to="/register" style={S.link}>Crear cuenta gratis</Link></p>

          <div style={S.demoBox}>
            <p style={S.demoTitle}>🔑 Cuentas de prueba</p>
            <div style={S.demoItems}>
              {[["Admin","admin@quickbite.com / admin123"],["Restaurante","burgertown@quickbite.com / rest123"],["Cliente","user@quickbite.com / user123"]].map(([role,cred]) => (
                <div key={role} style={S.demoItem}>
                  <span style={S.demoRole}>{role}</span>
                  <span style={S.demoCredential}>{cred}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

const S = {
  page: { minHeight:"100vh", display:"flex" },
  imagePanel: { flex:1, position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-end" },
  imageBg: { position:"absolute", inset:0, backgroundImage:"url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80)", backgroundSize:"cover", backgroundPosition:"center" },
  imageOverlay: { position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(10,5,0,0.3) 0%, rgba(10,5,0,0.92) 100%)" },
  imageContent: { position:"relative", zIndex:1, padding:"56px" },
  imageLogo: { display:"block", fontFamily:"var(--font-display)", fontWeight:800, fontSize:"24px", color:"var(--brand)", textDecoration:"none", marginBottom:"48px" },
  imageTitle: { fontFamily:"var(--font-display)", fontSize:"var(--fs-3xl)", fontWeight:800, color:"white", lineHeight:1.15, letterSpacing:"-1px", marginBottom:"18px" },
  imageSub: { color:"rgba(255,255,255,0.7)", fontSize:"var(--fs-md)", lineHeight:1.6, marginBottom:"40px", maxWidth:"380px" },
  imageStats: { display:"flex", alignItems:"center", gap:"0" },
  imageStat: { display:"flex", flexDirection:"column", gap:"4px" },
  imageStatNum: { fontFamily:"var(--font-display)", fontSize:"var(--fs-xl)", fontWeight:800, color:"white" },
  imageStatLabel: { fontSize:"var(--fs-xs)", color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.5px" },
  imageStatDivider: { width:"1px", height:"40px", background:"rgba(255,255,255,0.2)", margin:"0 24px" },
  formPanel: { width:"560px", flexShrink:0, background:"var(--surface)", display:"flex", alignItems:"center", justifyContent:"center", padding:"48px" },
  formInner: { width:"100%", maxWidth:"440px" },
  formHeader: { marginBottom:"32px" },
  title: { fontFamily:"var(--font-display)", fontSize:"var(--fs-2xl)", fontWeight:800, letterSpacing:"-0.5px", marginBottom:"8px" },
  sub: { color:"var(--text-muted)", fontSize:"var(--fs-base)" },
  error: { background:"#fef2f2", border:"2px solid #fecaca", color:"var(--danger)", padding:"14px 18px", borderRadius:"var(--radius-sm)", fontSize:"var(--fs-base)", marginBottom:"20px", fontWeight:600, display:"flex", alignItems:"center", gap:"8px" },
  form: { display:"flex", flexDirection:"column", gap:"18px", marginBottom:"24px" },
  field: { display:"flex", flexDirection:"column", gap:"6px" },
  label: { fontSize:"var(--fs-base)", fontWeight:600, color:"var(--text)" },
  togglePw: { position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"22px", padding:"6px", borderRadius:"6px" },
  btn: { padding:"16px", background:"var(--brand)", color:"white", border:"none", borderRadius:"var(--radius-sm)", fontWeight:700, fontSize:"var(--fs-md)", cursor:"pointer", fontFamily:"var(--font-body)", marginTop:"6px", transition:"opacity 0.2s", width:"100%", minHeight:"52px" },
  divider: { display:"flex", alignItems:"center", gap:"14px", marginBottom:"20px" },
  dividerLine: { flex:1, height:"1px", background:"var(--border)" },
  dividerText: { fontSize:"var(--fs-sm)", color:"var(--text-muted)", whiteSpace:"nowrap" },
  socialBtns: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"24px" },
  socialBtn: { padding:"14px", border:"2px solid var(--border)", borderRadius:"var(--radius-sm)", background:"var(--surface)", fontSize:"var(--fs-base)", fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)", color:"var(--text)", minHeight:"var(--touch-min)" },
  hint: { textAlign:"center", fontSize:"var(--fs-base)", color:"var(--text-muted)", marginBottom:"24px" },
  link: { color:"var(--brand)", fontWeight:700, textDecoration:"none" },
  demoBox: { background:"var(--surface2)", borderRadius:"var(--radius-sm)", padding:"18px 20px", border:"1px solid var(--border)" },
  demoTitle: { fontSize:"var(--fs-sm)", fontWeight:700, color:"var(--text-muted)", marginBottom:"12px" },
  demoItems: { display:"flex", flexDirection:"column", gap:"8px" },
  demoItem: { display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"8px" },
  demoRole: { fontSize:"var(--fs-xs)", fontWeight:700, color:"var(--brand)", background:"var(--brand-light)", padding:"3px 10px", borderRadius:"100px" },
  demoCredential: { fontSize:"var(--fs-sm)", color:"var(--text-muted)", fontFamily:"monospace" },
}
