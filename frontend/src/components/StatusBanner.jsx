export default function StatusBanner({ message }) {
  return (
    <div className="status-banner">
      <span>{message}</span>
      <div className="loading-bar" />
    </div>
  );
}