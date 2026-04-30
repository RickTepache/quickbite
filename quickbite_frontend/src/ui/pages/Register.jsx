import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { validateName, validateEmail, validatePassword, validatePasswordConfirm, validatePhone, validateAll } from "../../utils/validators"
import { FieldError, inputStyle } from "../components/FieldError"

function Register() {
  const [form, setForm]     = useState({ name:"", email:"", phone:"", password:"", confirm:"" })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const getChecks = (f) => ({
    name:     validateName(f.name),
    email:    validateEmail(f.email),
    phone:    validatePhone(f.phone),
    password: validatePassword(f.password),
    confirm:  validatePasswordConfirm(f.confirm, f.password),
  })

  const handleChange = (field) => (e) => {
    let value = e.target.value
    // Para teléfono, limitamos caracteres aceptados al escribir
    if (field === "phone") {
      value = value.replace(/[^0-9+\s\-().]/g, "").slice(0, 18)
    }
    const updated = { ...form, [field]: value }
    setForm(updated)
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }))
    if (field === "email") setServerError("")
    if (field === "password" && form.confirm) {
      const r = validatePasswordConfirm(form.confirm, value)
      setErrors(prev => ({ ...prev, confirm: r.error }))
    }
  }

  const handleBlur = (field) => {
    const checks = getChecks(form)
    setErrors(prev => ({ ...prev, [field]: checks[field].error }))
  }

  // Indicador de fortaleza de contraseña
  const pwStrength = () => {
    const p = form.password
    if (!p) return null
    let score = 0
    if (p.length >= 6) score++
    if (p.length >= 10) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^a-zA-Z0-9]/.test(p)) score++
    const levels = [
      { label: "Muy débil", color: "#dc2626" },
      { label: "Débil",     color: "#ea580c" },
      { label: "Regular",   color: "#ca8a04" },
      { label: "Buena",     color: "#16a34a" },
      { label: "Fuerte",    color: "#15803d" },
    ]
    return { score, ...levels[Math.min(score, 4)] }
  }
  const strength = pwStrength()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const checks = getChecks(form)
    const { isValid, errors: errs } = validateAll(checks)
    setErrors(errs)
    if (!isValid) return

    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    // Limpiar teléfono al enviar (solo dígitos)
    const cleanPhone = form.phone.replace(/[^0-9]/g, "").replace(/^52(\d{10})$/, "$1")
    const result = await register(form.name.trim(), form.email.trim().toLowerCase(), form.password, cleanPhone)
    if (!result.success) {
      const fieldErrors = result.errors || {}
      setErrors(fieldErrors)
      if (Object.keys(fieldErrors).length === 0) setServerError(result.error || "Error al crear la cuenta")
      setLoading(false); return
    }
    setLoading(false)
    navigate("/")
  }

  return (
    <div style={S.page}>
      <div style={S.imagePanel} className="qb-auth-image-panel">
        <div style={S.imageBg} />
        <div style={S.imageOverlay} />
        <div style={S.imageContent}>
          <Link to="/" style={S.imageLogo}>🍔 QuickBite</Link>
          <h2 style={S.imageTitle}>Únete y empieza<br />a pedir hoy.</h2>
          <p style={S.imageSub}>Crea tu cuenta gratis y accede a los mejores restaurantes con envío rápido.</p>
          <div style={S.benefits}>
            {[["🎁","Envío gratis en tu primer pedido"],["⚡","Entrega en menos de 20 minutos"],["🔒","Pago 100% seguro y protegido"],["⭐","Acumula puntos con cada pedido"]].map(([icon,text]) => (
              <div key={text} style={S.benefit}><span style={S.benefitIcon} aria-hidden="true">{icon}</span><span style={S.benefitText}>{text}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div style={S.formPanel} className="qb-auth-form-panel">
        <div style={S.formInner}>
          <div style={S.formHeader}>
            <h1 style={S.title}>Crear cuenta</h1>
            <p style={S.sub}>Únete gratis y empieza a pedir</p>
          </div>

          <form onSubmit={handleSubmit} style={S.form} noValidate>
            <div style={S.field}>
              <label style={S.label} htmlFor="reg-name">Nombre completo</label>
              <input id="reg-name" style={inputStyle(!!errors.name)} placeholder="Tu nombre completo"
                value={form.name} onChange={handleChange("name")} onBlur={() => handleBlur("name")}
                maxLength={60} autoComplete="name" aria-invalid={!!errors.name} />
              <FieldError error={errors.name} />
            </div>

            <div style={S.field}>
              <label style={S.label} htmlFor="reg-email">Correo electrónico</label>
              <input id="reg-email" style={inputStyle(!!errors.email)} type="email" placeholder="tu@correo.com"
                value={form.email} onChange={handleChange("email")} onBlur={() => handleBlur("email")}
                maxLength={100} autoComplete="email" aria-invalid={!!errors.email} />
              <FieldError error={errors.email} />
            </div>

            <div style={S.field}>
              <label style={S.label} htmlFor="reg-phone">Teléfono <span style={S.hintLabel}>(10 dígitos)</span></label>
              <input id="reg-phone" style={inputStyle(!!errors.phone)} type="tel"
                inputMode="tel"
                placeholder="961 234 5678"
                value={form.phone} onChange={handleChange("phone")} onBlur={() => handleBlur("phone")}
                maxLength={18} autoComplete="tel" aria-invalid={!!errors.phone} />
              <FieldError error={errors.phone} />
            </div>

            <div style={S.row} className="qb-auth-row">
              <div style={S.field}>
                <label style={S.label} htmlFor="reg-pw">Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input id="reg-pw" style={inputStyle(!!errors.password)} type={showPassword ? "text" : "password"} placeholder="Letras + números"
                    value={form.password} onChange={handleChange("password")} onBlur={() => handleBlur("password")}
                    maxLength={72} autoComplete="new-password" aria-invalid={!!errors.password} />
                  <button type="button" onClick={() => setShowPassword(s => !s)} style={S.togglePw} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <FieldError error={errors.password} />
                {strength && (
                  <div style={{ marginTop:"8px" }}>
                    <div style={{ display:"flex", gap:"4px", marginBottom:"4px" }}>
                      {[0,1,2,3,4].map(i => (
                        <div key={i} style={{ flex:1, height:"5px", borderRadius:"3px", background: i < strength.score ? strength.color : "var(--border)", transition:"background 0.3s" }} />
                      ))}
                    </div>
                    <span style={{ fontSize:"var(--fs-sm)", color: strength.color, fontWeight:600 }}>{strength.label}</span>
                  </div>
                )}
              </div>

              <div style={S.field}>
                <label style={S.label} htmlFor="reg-confirm">Confirmar</label>
                <input id="reg-confirm" style={inputStyle(!!errors.confirm)} type={showPassword ? "text" : "password"} placeholder="Repite tu contraseña"
                  value={form.confirm} onChange={handleChange("confirm")} onBlur={() => handleBlur("confirm")}
                  maxLength={72} autoComplete="new-password" aria-invalid={!!errors.confirm} />
                <FieldError error={errors.confirm} />
                {form.confirm && !errors.confirm && form.confirm === form.password && (
                  <span style={{ fontSize:"var(--fs-sm)", color:"var(--success)", fontWeight:600, marginTop:"4px", display: "flex", alignItems:"center", gap:"4px" }}>
                    <span aria-hidden="true">✓</span> Las contraseñas coinciden
                  </span>
                )}
              </div>
            </div>

            {serverError && (
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"var(--radius-sm)", padding:"12px 16px", color:"#dc2626", fontSize:"var(--fs-sm)", fontWeight:600 }}>
                ⚠️ {serverError}
              </div>
            )}
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta gratis →"}
            </button>
          </form>

          <div style={S.divider}><span style={S.dividerLine}/><span style={S.dividerText}>o regístrate con</span><span style={S.dividerLine}/></div>
          <div style={S.socialBtns}>
            <button style={S.socialBtn}>🌐 Google</button>
            <button style={S.socialBtn}>📘 Facebook</button>
          </div>
          <p style={S.hint}>¿Ya tienes cuenta? <Link to="/login" style={S.link}>Iniciar sesión</Link></p>
          <p style={S.terms}>Al registrarte aceptas nuestros <a href="#" style={S.termsLink}>Términos de uso</a> y <a href="#" style={S.termsLink}>Política de privacidad</a>.</p>
        </div>
      </div>
    </div>
  )
}

export default Register

const S = {
  page: { minHeight:"100vh", display:"flex" },
  imagePanel: { flex:1, position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-end" },
  imageBg: { position:"absolute", inset:0, backgroundImage:"url(https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80)", backgroundSize:"cover", backgroundPosition:"center" },
  imageOverlay: { position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(10,5,0,0.3) 0%, rgba(10,5,0,0.93) 100%)" },
  imageContent: { position:"relative", zIndex:1, padding:"56px" },
  imageLogo: { display:"block", fontFamily:"var(--font-display)", fontWeight:800, fontSize:"24px", color:"var(--brand)", textDecoration:"none", marginBottom:"48px" },
  imageTitle: { fontFamily:"var(--font-display)", fontSize:"var(--fs-3xl)", fontWeight:800, color:"white", lineHeight:1.15, letterSpacing:"-1px", marginBottom:"18px" },
  imageSub: { color:"rgba(255,255,255,0.7)", fontSize:"var(--fs-md)", lineHeight:1.6, marginBottom:"40px", maxWidth:"380px" },
  benefits: { display:"flex", flexDirection:"column", gap:"14px" },
  benefit: { display:"flex", alignItems:"center", gap:"14px" },
  benefitIcon: { fontSize:"24px", flexShrink:0 },
  benefitText: { color:"rgba(255,255,255,0.85)", fontSize:"var(--fs-base)", fontWeight:500 },
  formPanel: { width:"580px", flexShrink:0, background:"var(--surface)", display:"flex", alignItems:"center", justifyContent:"center", padding:"48px", overflowY:"auto" },
  formInner: { width:"100%", maxWidth:"460px" },
  formHeader: { marginBottom:"28px" },
  title: { fontFamily:"var(--font-display)", fontSize:"var(--fs-2xl)", fontWeight:800, letterSpacing:"-0.5px", marginBottom:"8px" },
  sub: { color:"var(--text-muted)", fontSize:"var(--fs-base)" },
  form: { display:"flex", flexDirection:"column", gap:"16px", marginBottom:"24px" },
  row: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" },
  field: { display:"flex", flexDirection:"column", gap:"6px" },
  label: { fontSize:"var(--fs-base)", fontWeight:600, color:"var(--text)" },
  hintLabel: { fontSize:"var(--fs-sm)", fontWeight:400, color:"var(--text-muted)" },
  togglePw: { position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"22px", padding:"6px", borderRadius:"6px" },
  btn: { padding:"16px", background:"var(--brand)", color:"white", border:"none", borderRadius:"var(--radius-sm)", fontWeight:700, fontSize:"var(--fs-md)", cursor:"pointer", fontFamily:"var(--font-body)", marginTop:"6px", transition:"opacity 0.2s", width:"100%", minHeight:"52px" },
  divider: { display:"flex", alignItems:"center", gap:"14px", marginBottom:"20px" },
  dividerLine: { flex:1, height:"1px", background:"var(--border)" },
  dividerText: { fontSize:"var(--fs-sm)", color:"var(--text-muted)", whiteSpace:"nowrap" },
  socialBtns: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"24px" },
  socialBtn: { padding:"14px", border:"2px solid var(--border)", borderRadius:"var(--radius-sm)", background:"var(--surface)", fontSize:"var(--fs-base)", fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)", color:"var(--text)", minHeight:"var(--touch-min)" },
  hint: { textAlign:"center", fontSize:"var(--fs-base)", color:"var(--text-muted)", marginBottom:"20px" },
  link: { color:"var(--brand)", fontWeight:700, textDecoration:"none" },
  terms: { textAlign:"center", fontSize:"var(--fs-sm)", color:"var(--text-muted)", lineHeight:1.6 },
  termsLink: { color:"var(--brand)", textDecoration:"none" },
}
