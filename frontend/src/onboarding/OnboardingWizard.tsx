/**
 * OnboardingWizard — first-run spotlight tour for new users.
 *
 * Mounted ONCE in the authenticated `App` return with `view = current screen`.
 * Tour (one panel per step): crea cliente → carica materiale → opzioni → analizza.
 * (SchedaPRO has its own AuthScreen + welcome OnboardingScreen, so this tour
 *  starts after login — no auth step.)
 *
 * Each STEP declares the screen it belongs to, the `[data-tour="…"]` element to
 * spotlight, and the `wizardBus` event that advances it (emitted by the real UI
 * action). Behaviours: rAF rect tracking, synchronous scroll-into-view, viewport-
 * clamped tooltip, suppression while the upload drawer is open (inDrawer panels
 * exempt), click-outside dismiss (keeps advancing), × session-close vs permanent
 * "Non mostrare più" opt-out.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { wizardBus, isOnboardingDismissed, dismissOnboarding, type WizardEvent } from './wizardBus';
import { useAnyOverlayOpen } from '../value/overlayGate';
import './onboarding.css';

type Screen = 'cases' | 'case';

interface Step {
  id: string;
  screen: Screen;
  selector?: string;
  title: string;
  body: string;
  advanceOn?: WizardEvent;
  /** Shown while the upload drawer is open (exempt from drawer suppression);
   *  rendered as a top-pinned informational panel, not a spotlight. */
  inDrawer?: boolean;
}

const STEPS: Step[] = [
  {
    id: 'create',
    screen: 'cases',
    selector: '[data-tour="new-case"]',
    title: 'Crea la tua prima scheda cliente',
    body: 'Tocca «Nuovo cliente» qui evidenziato: dai un nome al cliente (anche un soprannome) e creo la scheda.',
    advanceOn: 'new-case-drawer-opened',
  },
  {
    id: 'add-doc',
    screen: 'case',
    inDrawer: true,
    selector: '[data-tour="add-in-upload"]',
    title: 'Aggiungi il materiale del cliente',
    body: 'Scrivi qui gli appunti del cliente (o incolla testo, carica un file, registra una nota vocale) e tocca «Aggiungi». Più materiale dai, più Aria personalizza: condizioni, progressi e obiettivi.',
    advanceOn: 'material-added',
  },
  {
    id: 'drawer-actions',
    screen: 'case',
    inDrawer: true,
    title: 'Materiale aggiunto!',
    body: 'Da qui puoi: aggiungere altri elementi, chiudere il drawer per tornare alla scheda, oppure avviare subito l’analisi. L’analisi consuma crediti.',
    advanceOn: 'upload-closed',
  },
  {
    id: 'analyze',
    screen: 'case',
    selector: '[data-tour="analyze"]',
    title: 'Analizza con AI',
    body: "Qui Aria legge i dati della scheda e prepara le bozze — piano, report, messaggio al cliente — pronte da rifinire. Prima di avviare puoi darle istruzioni aggiuntive su cosa guardare.",
    // ends via the global 'analyze-started' listener (works from here or the drawer)
  },
];

type Hole = { top: number; left: number; width: number; height: number };

// Position the tooltip beside the spotlight when there's room, otherwise center
// it — always fully inside the viewport (maxHeight + scroll as a safety net).
function tooltipStyle(hole: Hole | null, pinTop = false): React.CSSProperties {
  const TT_WIDTH = 300;
  const TT_H = 200; // height estimate for placement; maxHeight keeps it bounded
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const base = { width: TT_WIDTH, maxHeight: Math.max(140, vh - 24), overflowY: 'auto' as const };
  const centered: React.CSSProperties = { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  if (!hole) return pinTop ? { ...base, top: 16, left: '50%', transform: 'translateX(-50%)' } : centered;
  const left = Math.max(12, Math.min(hole.left + hole.width / 2 - TT_WIDTH / 2, vw - TT_WIDTH - 12));
  const belowTop = hole.top + hole.height + 12;
  const aboveTop = hole.top - 12 - TT_H;
  if (belowTop + TT_H <= vh) return { ...base, top: belowTop, left };                  // fits below
  if (aboveTop >= 12 && hole.top - 12 <= vh) return { ...base, top: aboveTop, left };  // fits above
  return centered;                                                                     // target too tall
}

export default function OnboardingWizard({ view }: { view: Screen }) {
  const [active, setActive] = useState(() => !isOnboardingDismissed());
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [suppressed, setSuppressed] = useState(false);
  const [hiddenStep, setHiddenStep] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastKeyRef = useRef('');
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const step = STEPS[stepIndex];
  const onCurrentScreen = !!step && step.screen === view;

  const advance = useCallback(() => {
    setStepIndex(i => {
      const next = i + 1;
      if (next >= STEPS.length) { setActive(false); return i; }
      return next;
    });
  }, []);

  // Advance when the matching real action fires.
  useEffect(() => {
    if (!active || !step || !step.advanceOn) return;
    return wizardBus.on(step.advanceOn, advance);
  }, [active, step, advance]);

  // Hide the overlay while the upload drawer is open; restore when it closes.
  useEffect(() => {
    if (!active) return;
    const offOpen = wizardBus.on('upload-opened', () => setSuppressed(true));
    const offClose = wizardBus.on('upload-closed', () => setSuppressed(false));
    return () => { offOpen(); offClose(); };
  }, [active]);

  // Analysis started (from the main button or inside the drawer) ends the tour.
  useEffect(() => {
    if (!active) return;
    return wizardBus.on('analyze-started', () => setActive(false));
  }, [active]);

  // The "drawer-actions" panel re-appears after each material is added, even if
  // the user dismissed it by clicking outside.
  useEffect(() => {
    if (!active || step?.id !== 'drawer-actions') return;
    return wizardBus.on('material-added', () => setHiddenStep(null));
  }, [active, step]);

  // Click outside the panel hides just this step (advancement keeps listening).
  useEffect(() => {
    if (!active) return;
    const onDown = (e: Event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setHiddenStep(stepIndex);
      }
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [active, stepIndex]);

  // Track the target rect via rAF (handles async/lazy mount, scroll, resize).
  useEffect(() => {
    if (!active || !step || !onCurrentScreen || (suppressed && !step.inDrawer) || hiddenStep === stepIndex) return;
    const selector = step.selector;
    if (!selector) return; // informational panel (no spotlight / no target tracking)
    const scrollTargetIntoView = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && (r.top < 0 || r.bottom > window.innerHeight || r.left < 0 || r.right > window.innerWidth)) {
        el.scrollIntoView({ block: 'center', inline: 'center' });
      }
    };
    scrollTargetIntoView();
    const timers = [350, 900, 1800].map(ms => window.setTimeout(scrollTargetIntoView, ms));

    let mounted = true;
    lastKeyRef.current = '';
    const tick = () => {
      if (!mounted) return;
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          const key = `${Math.round(r.top)}|${Math.round(r.left)}|${Math.round(r.width)}|${Math.round(r.height)}`;
          if (key !== lastKeyRef.current) { lastKeyRef.current = key; setRect(r); }
        }
      } else if (lastKeyRef.current !== 'none') {
        lastKeyRef.current = 'none';
        setRect(null);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      timers.forEach(clearTimeout);
      lastKeyRef.current = '';
      setRect(null);
    };
  }, [active, step, onCurrentScreen, suppressed, hiddenStep, stepIndex]);

  const closeForSession = useCallback(() => setActive(false), []);
  const dontShow = useCallback(() => { dismissOnboarding(); setActive(false); }, []);

  // Mentre un pannello valore è aperto, metti in pausa il tour (niente deadlock).
  const overlayOpen = useAnyOverlayOpen();

  // inDrawer steps show only while the drawer is open; regular steps hide while it is open.
  if (!active || !step || !onCurrentScreen || (step.inDrawer ? !suppressed : suppressed) || hiddenStep === stepIndex || overlayOpen) return null;

  const PAD = 8;
  const hole = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;
  const ttStyle = tooltipStyle(hole, step.inDrawer);

  return (
    <div className="tour-overlay">
      {hole && <div className="tour-spotlight" style={{ position: 'fixed', ...hole }} aria-hidden="true" />}
      <div ref={tooltipRef} className="tour-tooltip" aria-live="polite" aria-label="Tutorial guidato" style={{ position: 'fixed', ...ttStyle }}>
        <button type="button" className="tour-close" aria-label="Chiudi il tutorial per ora" onClick={closeForSession}>✕</button>
        <h3 className="tour-title">{step.title}</h3>
        <p className="tour-body">{step.body}</p>
        <label className="tour-dontshow">
          <input type="checkbox" onChange={e => { if (e.target.checked) dontShow(); }} />
          Non mostrare più
        </label>
      </div>
    </div>
  );
}
