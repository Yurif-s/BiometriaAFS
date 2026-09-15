import './PageHeader.css';

export default function PageHeader({ icon: Icon, title, description, children }) {
  return (
    <header className="page-heading">
      <div className="page-heading-main">
        <span className="page-heading-icon"><Icon aria-hidden="true" /></span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children && <div className="page-heading-actions">{children}</div>}
    </header>
  );
}
