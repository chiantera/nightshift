import { useState } from 'react';
import { getPrefs, setPref, type AppPrefs } from '../settingsStore';

function Seg<K extends keyof AppPrefs>({ label, k, opts }:
  { label: string; k: K; opts: [AppPrefs[K], string][] }) {
  const [val, setVal] = useState(getPrefs()[k]);
  return (
    <div className="settings-row">
      <div><div className="settings-row-label">{label}</div></div>
      <div className="settings-row-control theme-toggle" role="group" aria-label={label}>
        {opts.map(([v, lbl]) => (
          <button key={String(v)} type="button" className={val === v ? 'active' : ''}
            onClick={() => { setPref(k, v); setVal(v); }}>{lbl}</button>
        ))}
      </div>
    </div>
  );
}

export default function UnitsSection() {
  return (
    <section className="settings-section">
      <p className="settings-section-label">Unità &amp; formato</p>
      <Seg label="Peso" k="weightUnit" opts={[['kg', 'kg'], ['lb', 'lb']]} />
      <Seg label="Lunghezza" k="lengthUnit" opts={[['cm', 'cm'], ['in', 'in']]} />
      <Seg label="Formato data" k="dateFormat" opts={[['dmy', 'gg/mm/aaaa'], ['mdy', 'mm/gg/aaaa'], ['iso', 'aaaa-mm-gg']]} />
      <Seg label="Inizio settimana" k="weekStart" opts={[['mon', 'Lun'], ['sun', 'Dom']]} />
    </section>
  );
}
