export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = "blue",
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-title">{title}</span>

        <div className={`stat-icon ${color}`}>
          <Icon size={21} strokeWidth={1.8} />
        </div>
      </div>

      <h2>{value}</h2>

      <p>{description}</p>
    </div>
  );
}
