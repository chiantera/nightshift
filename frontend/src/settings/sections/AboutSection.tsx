export default function AboutSection() {
  return (
    <section className="settings-section">
      <p className="settings-section-label">Info</p>
      <div className="settings-row">
        <div><div className="settings-row-label">Versione</div></div>
        <div className="settings-row-control settings-row-desc">{__APP_VERSION__}</div>
      </div>
      <div className="settings-row">
        <div><div className="settings-row-desc">SchedaPRO — il secondo cervello del personal trainer.</div></div>
      </div>
    </section>
  );
}
