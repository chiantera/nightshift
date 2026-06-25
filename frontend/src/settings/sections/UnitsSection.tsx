import { useState } from 'react';
import { getPrefs, setPref, type AppPrefs } from '../settingsStore';
import { useT } from '../../i18n/index.ts';

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
  const t = useT();
  return (
    <section className="settings-section">
      <p className="settings-section-label">{t('settings.language.title')}</p>
      <Seg label={t('settings.language.title')} k="locale" opts={[['it', 'Italiano'], ['en', 'English']]} />
      <p className="settings-section-label">{t('settings.units.title')}</p>
      <Seg label={t('settings.units.weight')} k="weightUnit" opts={[['kg', 'kg'], ['lb', 'lb']]} />
      <Seg label={t('settings.units.length')} k="lengthUnit" opts={[['cm', 'cm'], ['in', 'in']]} />
      <Seg label={t('settings.units.dateFormat')} k="dateFormat"
        opts={[['dmy', t('settings.units.date.dmy')], ['mdy', t('settings.units.date.mdy')], ['iso', t('settings.units.date.iso')]]} />
      <Seg label={t('settings.units.weekStart')} k="weekStart"
        opts={[['mon', t('settings.units.weekStart.mon')], ['sun', t('settings.units.weekStart.sun')]]} />
    </section>
  );
}
