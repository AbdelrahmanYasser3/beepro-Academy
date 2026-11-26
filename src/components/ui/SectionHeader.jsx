const SectionHeader = ({ eyebrow, title, description, action }) => (
  <div className="bepro-section-header">
    <div>
      {eyebrow && <span className="bepro-eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
    {action}
  </div>
);

export default SectionHeader;
