import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { restaurants } from "../../data/mockData"
import { validateName, validatePhone, validateStreet, validateColony, validateComments, validateAll } from "../../utils/validators"
import { FieldError, inputStyle } from "../components/FieldError"
import { ordersAPI, restaurantsAPI } from "../../infrastructure/api/api"

const API_ENABLED = import.meta.env.VITE_USE_BACKEND === 'true'

function getRestaurantFromCart(cart) {
  if (!cart.length) return restaurants[0]
  const firstItem = cart[0]
  return restaurants.find(r => r.id === firstItem.restaurantId) || restaurants[0]
}

function PayStep({ form, setForm, onBack, onNext, styles }) {
  return (
    <>
      <div style={styles.payOptions}>
        {[
          { value: "efectivo", icon: "💵", title: "Efectivo", sub: "Paga al recibir tu pedido" },
          { value: "tarjeta", icon: "💳", title: "Tarjeta", sub: "Débito o crédito al recibir" },
        ].map(m => (
          <button key={m.value}
            onClick={() => setForm(prev => ({ ...prev, payMethod: m.value }))}
            style={{
              ...styles.payCard,
              border: form.payMethod === m.value ? "2px solid var(--brand)" : "2px solid var(--border)",
              background: form.payMethod === m.value ? "var(--brand-light)" : "var(--surface2)",
              boxShadow: form.payMethod === m.value ? "0 4px 16px rgba(255,69,0,0.15)" : "none"
            }}
          >
            <span style={{ fontSize: "36px" }}>{m.icon}</span>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "3px", fontFamily: "var(--font-display)" }}>{m.title}</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{m.sub}</p>
            </div>
            {form.payMethod === m.value && <div style={styles.payCheck}>✓</div>}
          </button>
        ))}
      </div>
      <div style={styles.secureNote}>🔒 Tus datos están protegidos y seguros</div>
      <div style={styles.btnRow}>
        <button style={styles.backBtn} onClick={onBack}>← Regresar</button>
        <button style={styles.nextBtn} onClick={onNext}>Revisar pedido →</button>
      </div>
    </>
  )
}

function Checkout() {
  const { cart, total, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [orderError, setOrderError] = useState("")
  const [restaurant, setRestaurant] = useState(null)
  const [orderNum, setOrderNum] = useState(null)
  const [deliveryType, setDeliveryType] = useState(null)
  const [mapCoords, setMapCoords] = useState({ lat: 16.7520, lng: -93.1152 })
  const [mapAddress, setMapAddress] = useState("")
  const [locating, setLocating] = useState(false)
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const markerRef = useRef(null)


  const [form, setForm] = useState({
    name: user?.name || "",
    phone: "",
    street: "",
    colony: "",
    city: "Tuxtla Gutiérrez",
    references: "",
    payMethod: "efectivo"
  })
  const [addrErrors, setAddrErrors] = useState({})

  // Cargar restaurante real desde backend
  useEffect(() => {
    const loadRestaurant = async () => {
      if (!cart.length) return
      const firstItem = cart[0]
      try {
        if (API_ENABLED) {
          const data = await restaurantsAPI.getById(firstItem.restaurantId)
          // puede venir como { data: {} } o el objeto directo
          setRestaurant(data?.data || (data?.id ? data : null))
        } else {
          const found = restaurants.find(r => r.id === firstItem.restaurantId) || restaurants[0]
          setRestaurant(found)
        }
      } catch {
        const found = restaurants.find(r => r.id === firstItem.restaurantId) || restaurants[0]
        setRestaurant(found)
      }
    }
    loadRestaurant()
  }, [cart])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (addrErrors[name]) setAddrErrors(prev => ({ ...prev, [name]: "" }))
  }

  const handleAddrBlur = (field) => {
    const checks = {
      name:   validateName(form.name),
      phone:  validatePhone(form.phone),
      street: validateStreet(form.street),
      colony: validateColony(form.colony),
    }
    if (checks[field]) setAddrErrors(prev => ({ ...prev, [field]: checks[field].error }))
  }

  const validateAddress = () => {
    const { isValid, errors } = validateAll({
      name:   validateName(form.name),
      phone:  validatePhone(form.phone),
      street: validateStreet(form.street),
      colony: validateColony(form.colony),
    })
    setAddrErrors(errors)
    return isValid
  }

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      const data = await res.json()
      const addr = data.address || {}
      setMapAddress(data.display_name || "")
      setForm(prev => ({
        ...prev,
        street: [addr.road, addr.house_number].filter(Boolean).join(" ") || prev.street,
        colony: addr.suburb || addr.neighbourhood || addr.quarter || prev.colony,
        city: addr.city || addr.town || addr.village || prev.city
      }))
    } catch (e) { console.error("Geocode error", e) }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setMapCoords({ lat, lng })
        reverseGeocode(lat, lng)
        if (leafletMap.current) {
          leafletMap.current.setView([lat, lng], 16)
          markerRef.current?.setLatLng([lat, lng])
        }
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  useEffect(() => {
    if (step !== 1 || deliveryType !== "delivery") return
    const initMap = () => {
      if (leafletMap.current || !window.L || !mapRef.current) return
      const L = window.L
      const map = L.map(mapRef.current).setView([mapCoords.lat, mapCoords.lng], 15)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map)
      const icon = L.divIcon({ html: `<div style="font-size:32px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">📍</div>`, className: "", iconAnchor: [16, 32] })
      const marker = L.marker([mapCoords.lat, mapCoords.lng], { icon, draggable: true }).addTo(map)
      markerRef.current = marker
      leafletMap.current = map
      marker.on("dragend", () => { const p = marker.getLatLng(); setMapCoords({ lat: p.lat, lng: p.lng }); reverseGeocode(p.lat, p.lng) })
      map.on("click", (e) => { const { lat, lng } = e.latlng; marker.setLatLng([lat, lng]); setMapCoords({ lat, lng }); reverseGeocode(lat, lng) })
    }
    if (window.L) { initMap() } else {
      const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link)
      const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = initMap; document.head.appendChild(script)
    }
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; markerRef.current = null } }
  }, [step, deliveryType])

  const isAddressValid = !Object.values(addrErrors).some(Boolean) &&
    form.name && form.phone && form.street && form.colony

  const handleOrder = async () => {
    setOrderError("")
    setLoading(true)
    try {
      if (API_ENABLED) {
        // Construir payload para el backend
        // restaurant_id: primero el que cargamos del back, luego el que tiene el primer item del carrito
        const resolvedRestaurantId = restaurant?.id || cart[0]?.restaurantId
        const orderPayload = {
          restaurant_id: resolvedRestaurantId,
          delivery_type: deliveryType,
          pay_method:    form.payMethod,
          // Datos de entrega (solo si es delivery)
          address_street: deliveryType === 'delivery' ? form.street   : null,
          address_colony: deliveryType === 'delivery' ? form.colony   : null,
          address_city:   deliveryType === 'delivery' ? form.city     : null,
          address_refs:   deliveryType === 'delivery' ? form.references : null,
          customer_phone: deliveryType === 'delivery' ? form.phone    : null,
          pickup_name:    deliveryType === 'pickup'   ? form.name     : null,
          // Items del carrito
          items: cart.map(item => ({
            menu_item_id: item.id,
            quantity:     item.quantity,
            extras_price: item.extrasPrice || 0,
            extras:       item.customization?.extras  || [],
            removed:      item.customization?.removed || [],
            spicy_level:  item.customization?.spicy   || 'normal',
            comments:     item.customization?.comments || '',
          }))
        }

        const raw = await ordersAPI.create(orderPayload)
        // El back puede responder { data: { id } }, { order: { id } }, { id }, etc.
        const created = raw?.data || raw?.order || raw
        setOrderNum(created?.id || created?.order_id || Math.floor(Math.random() * 9000) + 1000)
      } else {
        // Mock: simular pedido
        await new Promise(r => setTimeout(r, 1800))
        setOrderNum(Math.floor(Math.random() * 9000) + 1000)
      }

      clearCart()
      setStep(99)
    } catch (err) {
      console.error('Error al crear pedido:', err.message)
      // Mostrar error al usuario
      setOrderError(err.message || "Error al procesar el pedido. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const visibleSteps = deliveryType === "pickup" ? ["Entrega", "Pago", "Confirmar"] : ["Entrega", "Dirección", "Pago", "Confirmar"]
  // step lógico: 0=entrega, 1=dir(delivery)/pago(pickup), 2=pago(delivery)/confirmar(pickup), 3=confirmar(delivery)
  const confirmStep = deliveryType === "pickup" ? 2 : 3
  const payStep = deliveryType === "pickup" ? 1 : 2

  // ── SUCCESS ─────────────────────────────────
  if (step === 99) {
    const isPickup = deliveryType === "pickup"
    const timeline = isPickup
      ? [{ icon: "✅", label: "Recibido", done: true }, { icon: "👨‍🍳", label: "Preparando", active: true }, { icon: "🔔", label: "Listo para recoger" }]
      : [{ icon: "✅", label: "Recibido", done: true }, { icon: "👨‍🍳", label: "Preparando", active: true }, { icon: "🛵", label: "En camino" }, { icon: "🏠", label: "Entregado" }]
    return (
      <div style={S.successPage}>
        <div style={S.successBg} />
        <div style={S.successOverlay} />
        <div style={S.successContent}>
          <div style={S.successCard}>
            <div style={S.successAnimation}>
              <div style={S.successRing} />
              <div style={S.successCheckWrapper}><span style={S.successCheck}>✓</span></div>
            </div>
            <h1 style={S.successTitle}>¡Pedido confirmado!</h1>
            <p style={S.successOrderNum}>Pedido #{orderNum}</p>
            <p style={S.successSub}>{isPickup ? `Tu pedido está siendo preparado. Te avisaremos cuando esté listo para recoger en ${restaurant?.name || "el restaurante"}.` : "Estamos preparando tu pedido. Recibirás una notificación cuando esté en camino."}</p>
            <div style={S.timeline}>
              {timeline.map((s, i) => (
                <div key={i} style={S.timelineItem}>
                  <div style={{ ...S.timelineDot, background: s.done ? "var(--brand)" : s.active ? "#fef9c3" : "var(--surface2)", border: (s.done || s.active) ? "2px solid var(--brand)" : "2px solid var(--border)" }}>{s.icon}</div>
                  {i < timeline.length - 1 && <div style={{ ...S.timelineLine, background: s.done ? "var(--brand)" : "var(--border)" }} />}
                  <span style={{ ...S.timelineLabel, color: (s.done || s.active) ? "var(--text)" : "var(--text-muted)", fontWeight: (s.done || s.active) ? 700 : 400 }}>{s.label}</span>
                </div>
              ))}
            </div>
            <div style={S.deliveryInfo}>
              <div style={S.deliveryItem}><span style={S.deliveryIcon}>{isPickup ? "🏪" : "📍"}</span><div><p style={S.deliveryLabel}>{isPickup ? "Recoger en" : "Dirección"}</p><p style={S.deliveryValue}>{isPickup ? restaurant?.address : `${form.street}, ${form.colony}`}</p></div></div>
              <div style={S.deliveryItem}><span style={S.deliveryIcon}>⏱</span><div><p style={S.deliveryLabel}>Tiempo estimado</p><p style={S.deliveryValue}>{isPickup ? `${restaurant?.pickupTime} para recoger` : `${restaurant?.deliveryTime}`}</p></div></div>
              <div style={S.deliveryItem}><span style={S.deliveryIcon}>💳</span><div><p style={S.deliveryLabel}>Pago</p><p style={S.deliveryValue}>{form.payMethod === "efectivo" ? "Efectivo" : "Tarjeta"}</p></div></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <Link to="/my-orders" style={S.successBtn}>
                📦 Ver mis pedidos
              </Link>
              <Link to="/" style={{ ...S.successBtn, background: "transparent", color: "var(--brand)", border: "2px solid var(--brand)", boxShadow: "none" }}>
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Carrito vacío
  if (!cart.length && step !== 99) {
    return (
      <div style={S.page}>
        <Navbar />
        <div style={{ maxWidth: "600px", margin: "96px auto", padding: "0 28px", textAlign: "center" }}>
          <div style={{ fontSize: "72px", marginBottom: "20px" }} aria-hidden="true">🛒</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-2xl)", fontWeight: 800, marginBottom: "12px" }}>Tu carrito está vacío</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "var(--fs-base)" }}>Agrega productos antes de continuar con el checkout.</p>
          <Link to="/" style={{ display: "inline-block", padding: "16px 36px", background: "var(--brand)", color: "white", borderRadius: "100px", fontWeight: 700, textDecoration: "none", fontSize: "var(--fs-base)", minHeight: "var(--touch-min)" }}>
            Ver restaurantes →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.inner} className="qb-checkout-inner">
        <div style={S.header}>
          <Link to="/cart" style={S.backLink}>← Volver al carrito</Link>
          <h1 style={S.pageTitle}>Finalizar pedido</h1>
          <div style={S.progressBar}>
            {visibleSteps.map((label, i) => (
              <div key={i} style={S.progressStep}>
                <div style={{ ...S.progressDot, background: i <= step ? "var(--brand)" : "var(--border)", color: i <= step ? "white" : "var(--text-muted)", boxShadow: i === step ? "0 0 0 4px rgba(255,69,0,0.2)" : "none" }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{ ...S.progressLabel, color: i === step ? "var(--brand)" : i < step ? "var(--text)" : "var(--text-muted)", fontWeight: i === step ? 700 : 400 }}>{label}</span>
                {i < visibleSteps.length - 1 && <div style={{ ...S.progressLine, background: i < step ? "var(--brand)" : "var(--border)" }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={S.body} className="qb-checkout-body">
          <div style={S.left}>

            {/* STEP 0 — Tipo de entrega */}
            {step === 0 && (
              <div style={S.card} className="animate-fadeUp">
                <div style={S.cardHeader}><span style={S.cardIcon}>🚀</span><h2 style={S.cardTitle}>¿Cómo quieres recibir tu pedido?</h2></div>
                <div style={S.deliveryOptions} className="qb-checkout-delivery-options">
                  {[
                    { type: "delivery", icon: "🛵", title: "Entrega a domicilio", sub: `Te lo llevamos a donde estés · ${restaurant?.deliveryTime}`, tag: "Envío gratis 🎉", tagStyle: {} },
                    { type: "pickup", icon: "🏪", title: "Recoger en sucursal", sub: `Recoge directo en el restaurante · ${restaurant?.pickupTime}`, tag: "Más rápido 🔥", tagStyle: { background: "#e0f2fe", color: "#0369a1" } }
                  ].map(opt => (
                    <button key={opt.type} onClick={() => setDeliveryType(opt.type)}
                      style={{ ...S.deliveryOptionCard, border: deliveryType === opt.type ? "2px solid var(--brand)" : "2px solid var(--border)", background: deliveryType === opt.type ? "var(--brand-light)" : "var(--surface2)", boxShadow: deliveryType === opt.type ? "0 4px 20px rgba(255,69,0,0.15)" : "none" }}
                    >
                      <div style={S.deliveryOptionIcon}>{opt.icon}</div>
                      <div style={S.deliveryOptionInfo}>
                        <p style={S.deliveryOptionTitle}>{opt.title}</p>
                        <p style={S.deliveryOptionSub}>{opt.sub}</p>
                        <span style={{ ...S.deliveryTag, ...opt.tagStyle }}>{opt.tag}</span>
                      </div>
                      {deliveryType === opt.type && <div style={S.deliveryCheck}>✓</div>}
                    </button>
                  ))}
                </div>

                {deliveryType === "pickup" && restaurant && (
                  <div style={S.pickupInfoCard} className="animate-fadeUp">
                    <p style={S.pickupInfoTitle}>📍 Información de la sucursal</p>
                    {[
                      { icon: "🗺️", label: "Dirección", value: restaurant.address },
                      { icon: "🕐", label: "Horario", value: restaurant.hours },
                      { icon: "⏱", label: "Tiempo estimado de espera", value: restaurant.pickupTime, highlight: true }
                    ].map((row, i) => (
                      <div key={i} style={S.pickupInfoRow}>
                        <span style={S.pickupInfoIcon}>{row.icon}</span>
                        <div><p style={S.pickupInfoLabel}>{row.label}</p><p style={{ ...S.pickupInfoValue, ...(row.highlight ? { color: "var(--brand)", fontWeight: 800 } : {}) }}>{row.value}</p></div>
                      </div>
                    ))}
                  </div>
                )}

                <button style={{ ...S.nextBtn, opacity: deliveryType ? 1 : 0.4, marginTop: "8px" }} onClick={() => setStep(1)} disabled={!deliveryType}>
                  Continuar →
                </button>
              </div>
            )}

            {/* STEP 1 delivery — Dirección */}
            {step === 1 && deliveryType === "delivery" && (
              <div style={S.card} className="animate-fadeUp">
                <div style={S.cardHeader}><span style={S.cardIcon}>📍</span><h2 style={S.cardTitle}>¿A dónde enviamos tu pedido?</h2></div>
                <div style={S.mapSection}>
                  <div style={S.mapHeader}>
                    <p style={S.mapLabel}>📌 Selecciona tu ubicación en el mapa</p>
                    <button style={{ ...S.gpsBtn, opacity: locating ? 0.7 : 1 }} onClick={useMyLocation} disabled={locating}>{locating ? "⌛ Localizando..." : "🎯 Usar mi ubicación"}</button>
                  </div>
                  <div ref={mapRef} style={S.mapContainer} />
                  {mapAddress && <p style={S.mapAddressNote}>📌 {mapAddress.split(",").slice(0, 3).join(",")}</p>}
                  <p style={S.mapHint}>Arrastra el marcador o toca el mapa para ajustar la ubicación</p>
                </div>
                <div style={S.formGrid} className="qb-checkout-form-grid">
                  <div style={S.field}><label style={S.label}>Nombre completo</label><input style={inputStyle(!!addrErrors.name)} name="name" placeholder="Tu nombre completo" value={form.name} onChange={handleChange} onBlur={() => handleAddrBlur("name")} maxLength={60} /><FieldError error={addrErrors.name} /></div>
                  <div style={S.field}><label style={S.label}>Teléfono (10 dígitos)</label><input style={inputStyle(!!addrErrors.phone)} name="phone" placeholder="961 123 4567" value={form.phone} onChange={handleChange} onBlur={() => handleAddrBlur("phone")} maxLength={15} /><FieldError error={addrErrors.phone} /></div>
                  <div style={{ ...S.field, gridColumn: "1/-1" }}><label style={S.label}>Calle y número</label><input style={inputStyle(!!addrErrors.street)} name="street" placeholder="Av. Central 123" value={form.street} onChange={handleChange} onBlur={() => handleAddrBlur("street")} maxLength={100} /><FieldError error={addrErrors.street} /></div>
                  <div style={S.field}><label style={S.label}>Colonia</label><input style={inputStyle(!!addrErrors.colony)} name="colony" placeholder="Col. Centro" value={form.colony} onChange={handleChange} onBlur={() => handleAddrBlur("colony")} maxLength={60} /><FieldError error={addrErrors.colony} /></div>
                  <div style={S.field}><label style={S.label}>Ciudad</label><input style={S.input} name="city" value={form.city} onChange={handleChange} maxLength={50} /></div>
                  <div style={{ ...S.field, gridColumn: "1/-1" }}><label style={S.label}>Referencias <span style={S.optionalTag}>Opcional</span></label><input style={S.input} name="references" placeholder="Casa azul, frente al parque..." value={form.references} onChange={handleChange} maxLength={100} /></div>
                </div>
                <div style={S.btnRow}>
                  <button style={S.backBtn} onClick={() => setStep(0)}>← Regresar</button>
                  <button style={{ ...S.nextBtn, opacity: isAddressValid ? 1 : 0.5 }} onClick={() => { if (validateAddress()) setStep(2) }} disabled={!isAddressValid}>Continuar con el pago →</button>
                </div>
              </div>
            )}

            {/* STEP 1 pickup / STEP 2 delivery — Pago */}
            {step === payStep && (
              <div style={S.card} className="animate-fadeUp">
                <div style={S.cardHeader}><span style={S.cardIcon}>💳</span><h2 style={S.cardTitle}>¿Cómo vas a pagar?</h2></div>
                <PayStep form={form} setForm={setForm} onBack={() => setStep(step - 1)} onNext={() => setStep(confirmStep)} styles={S} />
              </div>
            )}

            {/* STEP 2 pickup / STEP 3 delivery — Confirmar */}
            {step === confirmStep && (
              <div style={S.card} className="animate-fadeUp">
                <div style={S.cardHeader}><span style={S.cardIcon}>📋</span><h2 style={S.cardTitle}>Confirma tu pedido</h2></div>

                <div style={S.confirmBlock}>
                  <div style={S.confirmRow}>
                    <span style={S.confirmIcon}>{deliveryType === "pickup" ? "🏪" : "🛵"}</span>
                    <div style={{ flex: 1 }}>
                      <p style={S.confirmBlockTitle}>{deliveryType === "pickup" ? "Recoger en sucursal" : "Entrega a domicilio"}</p>
                      <p style={S.confirmBlockText}>{deliveryType === "pickup" ? restaurant?.address : `${form.street}, ${form.colony}, ${form.city}`}</p>
                      {deliveryType === "pickup" && <p style={{ ...S.confirmBlockText, color: "var(--brand)", fontWeight: 600 }}>⏱ Listo en {restaurant?.pickupTime}</p>}
                    </div>
                    <button style={S.editBtn} onClick={() => setStep(0)}>Editar</button>
                  </div>
                </div>

                <div style={S.confirmBlock}>
                  <div style={S.confirmRow}>
                    <span style={S.confirmIcon}>💳</span>
                    <div style={{ flex: 1 }}><p style={S.confirmBlockTitle}>Método de pago</p><p style={S.confirmBlockText}>{form.payMethod === "efectivo" ? "💵 Efectivo al recibir" : "💳 Tarjeta al recibir"}</p></div>
                    <button style={S.editBtn} onClick={() => setStep(payStep)}>Editar</button>
                  </div>
                </div>

                <div style={S.confirmBlock}>
                  <p style={S.confirmBlockTitle}>🛒 Productos</p>
                  {cart.map((item, i) => (
                    <div key={i} style={S.confirmItem}>
                      <span style={S.confirmQty}>{item.quantity}×</span>
                      <span style={S.confirmName}>{item.name}</span>
                      {item.customization?.comments && <span style={S.confirmNote}>"{item.customization.comments}"</span>}
                      <span style={S.confirmPrice}>${(item.price + (item.extrasPrice || 0)) * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {orderError && (
                  <div style={{ background: "#fef2f2", border: "2px solid #fecaca", borderRadius: "var(--radius-sm)", padding: "14px 18px", marginBottom: "14px", color: "var(--danger)", fontSize: "var(--fs-base)", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" }} role="alert">
                    <span aria-hidden="true">⚠️</span> {orderError}
                  </div>
                )}
                <div style={S.btnRow}>
                  <button style={S.backBtn} onClick={() => setStep(step - 1)}>← Regresar</button>
                  <button style={{ ...S.orderBtn, opacity: loading ? 0.8 : 1 }} onClick={handleOrder} disabled={loading}>
                    {loading ? "Procesando pedido..." : `Confirmar · $${total} MXN 🚀`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Resumen */}
          <div style={S.right} className="qb-checkout-right">
            <div style={S.summary}>
              <h3 style={S.summaryTitle}>Tu pedido</h3>
              {deliveryType && (
                <div style={S.deliveryTypeBadge}>{deliveryType === "delivery" ? "🛵 A domicilio" : "🏪 Recoger en sucursal"}</div>
              )}
              <div style={S.summaryItems}>
                {cart.map((item, i) => (
                  <div key={i} style={S.summaryItem}>
                    <div style={S.summaryItemLeft}>
                      <span style={S.summaryQty}>{item.quantity}</span>
                      <div>
                        <p style={S.summaryName}>{item.name}</p>
                        {item.extrasPrice > 0 && <p style={S.summaryNote}>+${item.extrasPrice} extras</p>}
                        {item.customization?.comments && <p style={S.summaryNote}>📝 {item.customization.comments}</p>}
                      </div>
                    </div>
                    <span style={S.summaryPrice}>${(item.price + (item.extrasPrice || 0)) * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div style={S.summaryDivider} />
              <div style={S.summaryRow}><span>Subtotal</span><span>${total} MXN</span></div>
              <div style={S.summaryRow}><span>Envío</span><span style={{ color: "#16a34a", fontWeight: 700 }}>Gratis 🎉</span></div>
              <div style={S.summaryTotal}><span>Total</span><span>${total} MXN</span></div>
              <div style={S.estimatedTime}>
                ⏱ {deliveryType === "pickup" ? `Listo en: ${restaurant?.pickupTime || "10-15 min"}` : `Entrega: ${restaurant?.deliveryTime || "25-35 min"}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout

const S = {
  page: { minHeight: "100vh", background: "var(--bg)" },
  inner: { maxWidth: "1200px", margin: "0 auto", padding: "36px 44px 88px" },
  header: { marginBottom: "40px" },
  backLink: { color: "var(--text-muted)", fontSize: "var(--fs-base)", textDecoration: "none", display: "inline-block", marginBottom: "18px", fontWeight: 500 },
  pageTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-2xl)", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "28px" },
  progressBar: { display: "flex", alignItems: "center" },
  progressStep: { display: "flex", alignItems: "center", gap: "12px", flex: 1 },
  progressDot: { width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-base)", fontWeight: 800, flexShrink: 0, transition: "all 0.3s", fontFamily: "var(--font-display)" },
  progressLabel: { fontSize: "var(--fs-sm)", whiteSpace: "nowrap", transition: "color 0.3s", fontWeight: 500 },
  progressLine: { flex: 1, height: "3px", borderRadius: "2px", margin: "0 10px", transition: "background 0.3s" },
  body: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "32px", alignItems: "start" },
  left: {},
  card: { background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "32px 36px", boxShadow: "var(--shadow)" },
  cardHeader: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" },
  cardIcon: { fontSize: "32px" },
  cardTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)", fontWeight: 800, letterSpacing: "-0.3px" },
  deliveryOptions: { display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" },
  deliveryOptionCard: { display: "flex", alignItems: "center", gap: "20px", padding: "22px 24px", borderRadius: "var(--radius)", cursor: "pointer", fontFamily: "var(--font-body)", textAlign: "left", transition: "all 0.2s", position: "relative", minHeight: "100px" },
  deliveryOptionIcon: { fontSize: "44px", flexShrink: 0 },
  deliveryOptionInfo: { flex: 1 },
  deliveryOptionTitle: { fontWeight: 700, fontSize: "var(--fs-md)", marginBottom: "6px", fontFamily: "var(--font-display)", color: "var(--text)" },
  deliveryOptionSub: { fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginBottom: "10px" },
  deliveryTag: { display: "inline-block", background: "var(--brand-light)", color: "var(--brand)", fontSize: "var(--fs-xs)", fontWeight: 700, padding: "4px 12px", borderRadius: "100px" },
  deliveryCheck: { width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-base)", fontWeight: 800, flexShrink: 0 },
  pickupInfoCard: { background: "#f0f9ff", border: "2px solid #bae6fd", borderRadius: "var(--radius)", padding: "20px 24px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "14px" },
  pickupInfoTitle: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--fs-base)", color: "#0369a1", marginBottom: "6px" },
  pickupInfoRow: { display: "flex", alignItems: "flex-start", gap: "14px" },
  pickupInfoIcon: { fontSize: "22px", flexShrink: 0, marginTop: "2px" },
  pickupInfoLabel: { fontSize: "var(--fs-xs)", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "3px" },
  pickupInfoValue: { fontSize: "var(--fs-base)", color: "var(--text)", fontWeight: 500 },
  mapSection: { marginBottom: "24px", borderRadius: "12px", overflow: "hidden", border: "2px solid var(--border)" },
  mapHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "var(--surface2)", flexWrap: "wrap", gap: "10px" },
  mapLabel: { fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)" },
  gpsBtn: { padding: "10px 20px", borderRadius: "100px", background: "var(--brand)", color: "white", border: "none", fontSize: "var(--fs-sm)", fontWeight: 700, cursor: "pointer", minHeight: "var(--touch-min)" },
  mapContainer: { width: "100%", height: "300px" },
  mapAddressNote: { padding: "10px 18px", fontSize: "var(--fs-sm)", color: "var(--text-muted)", background: "var(--surface2)", borderTop: "1px solid var(--border)" },
  mapHint: { padding: "8px 18px 12px", fontSize: "var(--fs-sm)", color: "var(--text-muted)", background: "var(--surface2)", fontStyle: "italic" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)" },
  optionalTag: { fontWeight: 400, color: "var(--text-muted)", fontSize: "var(--fs-sm)" },
  input: { padding: "14px 18px", borderRadius: "var(--radius-sm)", border: "2px solid var(--border)", fontSize: "var(--fs-base)", outline: "none", fontFamily: "var(--font-body)", background: "var(--surface2)", color: "var(--text)", minHeight: "var(--touch-min)" },
  payOptions: { display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" },
  payCard: { display: "flex", alignItems: "center", gap: "20px", padding: "20px 24px", borderRadius: "var(--radius)", cursor: "pointer", fontFamily: "var(--font-body)", textAlign: "left", transition: "all 0.2s", position: "relative", minHeight: "80px" },
  payCheck: { position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", width: "30px", height: "30px", borderRadius: "50%", background: "var(--brand)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-base)", fontWeight: 700 },
  secureNote: { fontSize: "var(--fs-base)", color: "var(--text-muted)", textAlign: "center", padding: "14px", background: "var(--surface2)", borderRadius: "var(--radius-sm)", marginBottom: "24px", fontWeight: 500 },
  confirmBlock: { background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "20px", marginBottom: "14px" },
  confirmRow: { display: "flex", alignItems: "flex-start", gap: "14px" },
  confirmIcon: { fontSize: "24px", flexShrink: 0, marginTop: "2px" },
  confirmBlockTitle: { fontWeight: 700, fontSize: "var(--fs-base)", marginBottom: "8px", fontFamily: "var(--font-display)" },
  confirmBlockText: { fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginBottom: "3px" },
  editBtn: { marginLeft: "auto", background: "none", border: "2px solid var(--border)", padding: "8px 16px", borderRadius: "100px", fontSize: "var(--fs-sm)", cursor: "pointer", color: "var(--brand)", fontWeight: 700, fontFamily: "var(--font-body)", flexShrink: 0, minHeight: "36px" },
  confirmItem: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap" },
  confirmQty: { fontWeight: 700, color: "var(--brand)", fontSize: "var(--fs-base)", flexShrink: 0 },
  confirmName: { flex: 1, fontSize: "var(--fs-base)" },
  confirmNote: { fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontStyle: "italic" },
  confirmPrice: { fontWeight: 700, fontSize: "var(--fs-base)", flexShrink: 0 },
  btnRow: { display: "flex", gap: "14px", marginTop: "8px" },
  nextBtn: { flex: 1, padding: "16px", background: "var(--brand)", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "var(--fs-md)", cursor: "pointer", fontFamily: "var(--font-body)", transition: "opacity 0.2s", minHeight: "52px" },
  backBtn: { padding: "16px 24px", border: "2px solid var(--border)", borderRadius: "var(--radius-sm)", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: "var(--fs-base)", fontFamily: "var(--font-body)", color: "var(--text)", minHeight: "52px" },
  orderBtn: { flex: 1, padding: "16px", background: "linear-gradient(135deg, #ff4500, #ff7043)", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 800, fontSize: "var(--fs-md)", cursor: "pointer", fontFamily: "var(--font-display)", letterSpacing: "-0.3px", boxShadow: "0 4px 16px rgba(255,69,0,0.4)", minHeight: "52px" },
  right: { position: "sticky", top: "100px" },
  summary: { background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "26px", boxShadow: "var(--shadow)" },
  summaryTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-lg)", fontWeight: 800, marginBottom: "14px", letterSpacing: "-0.3px" },
  deliveryTypeBadge: { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "100px", padding: "6px 14px", fontSize: "var(--fs-sm)", fontWeight: 600, display: "inline-block", marginBottom: "16px" },
  summaryItems: { display: "flex", flexDirection: "column", gap: "14px", marginBottom: "18px" },
  summaryItem: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" },
  summaryItemLeft: { display: "flex", alignItems: "flex-start", gap: "12px", flex: 1, minWidth: 0 },
  summaryQty: { width: "28px", height: "28px", borderRadius: "50%", background: "var(--brand)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-sm)", fontWeight: 800, flexShrink: 0 },
  summaryName: { fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)" },
  summaryNote: { fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginTop: "3px" },
  summaryPrice: { fontSize: "var(--fs-base)", fontWeight: 700, flexShrink: 0 },
  summaryDivider: { height: "1px", background: "var(--border)", margin: "16px 0" },
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: "var(--fs-base)", color: "var(--text-muted)", marginBottom: "10px" },
  summaryTotal: { display: "flex", justifyContent: "space-between", fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)", fontWeight: 800, marginTop: "12px", paddingTop: "14px", borderTop: "1px solid var(--border)" },
  estimatedTime: { marginTop: "16px", background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "12px 16px", fontSize: "var(--fs-base)", color: "var(--text-muted)", textAlign: "center", fontWeight: 500 },
  successPage: { minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "44px" },
  successBg: { position: "fixed", inset: 0, backgroundImage: "url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80)", backgroundSize: "cover", backgroundPosition: "center" },
  successOverlay: { position: "fixed", inset: 0, background: "rgba(10,5,0,0.88)" },
  successContent: { position: "relative", zIndex: 1, width: "100%", maxWidth: "560px" },
  successCard: { background: "var(--surface)", borderRadius: "24px", padding: "52px 44px", textAlign: "center", boxShadow: "0 32px 80px rgba(0,0,0,0.55)" },
  successAnimation: { position: "relative", width: "100px", height: "100px", margin: "0 auto 28px" },
  successRing: { position: "absolute", inset: 0, borderRadius: "50%", border: "4px solid var(--brand)", opacity: 0.3, animation: "float 2s ease-in-out infinite" },
  successCheckWrapper: { width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, #ff4500, #ff7043)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(255,69,0,0.4)" },
  successCheck: { fontSize: "44px", color: "white", fontWeight: 800 },
  successTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-2xl)", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.5px" },
  successOrderNum: { color: "var(--brand)", fontWeight: 700, fontSize: "var(--fs-md)", marginBottom: "12px" },
  successSub: { color: "var(--text-muted)", fontSize: "var(--fs-base)", lineHeight: 1.6, marginBottom: "32px" },
  timeline: { display: "flex", alignItems: "flex-start", justifyContent: "center", marginBottom: "32px" },
  timelineItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", flex: 1 },
  timelineDot: { width: "52px", height: "52px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" },
  timelineLine: { width: "100%", height: "3px", marginTop: "-26px", zIndex: -1 },
  timelineLabel: { fontSize: "var(--fs-sm)", textAlign: "center" },
  deliveryInfo: { background: "var(--surface2)", borderRadius: "var(--radius)", padding: "20px", marginBottom: "28px", textAlign: "left", display: "flex", flexDirection: "column", gap: "14px" },
  deliveryItem: { display: "flex", alignItems: "center", gap: "14px" },
  deliveryIcon: { fontSize: "24px", flexShrink: 0 },
  deliveryLabel: { fontSize: "var(--fs-xs)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" },
  deliveryValue: { fontSize: "var(--fs-base)", fontWeight: 600 },
  successBtn: { display: "inline-block", background: "var(--brand)", color: "white", padding: "16px 44px", borderRadius: "100px", textDecoration: "none", fontWeight: 700, fontSize: "var(--fs-md)", boxShadow: "0 4px 16px rgba(255,69,0,0.4)", minHeight: "52px" }
}
