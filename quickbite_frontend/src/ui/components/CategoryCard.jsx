function CategoryCard({ name, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`cat-btn ${active ? "active" : ""}`}
    >
      <span style={{ fontSize: "28px", lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.2px" }}>{name}</span>
    </button>
  )
}

export default CategoryCard
