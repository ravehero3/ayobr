import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NM = "'Neue Montreal', 'Inter', sans-serif";
const BLUE = '#3b82f6';
const BLUE2 = '#0ea5e9';
const PURPLE = '#a78bfa';
const GREEN = '#10b981';
const CARD = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(255,255,255,0.08)';

export default function JourneyTab() {
  const [journeys, setJourneys] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const [selectedJourneyId, setSelectedJourneyId] = useState('purchase_pro');
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [editorLang, setEditorLang] = useState('cs'); // 'cs' | 'en'
  const [previewLang, setPreviewLang] = useState('cs');

  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Fetch journeys on load
  const loadJourneys = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/journeys');
      if (!res.ok) throw new Error('Nepodařilo se načíst cesty');
      const data = await res.json();
      setJourneys(data.journeys || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Error loading journeys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJourneys();
  }, []);

  const currentJourney = journeys.find(j => j.id === selectedJourneyId) || journeys[0];
  const steps = currentJourney?.steps || [];
  const currentStep = steps[selectedStepIndex] || steps[0];

  // Update a field in the current step
  const updateCurrentStep = (field, value) => {
    if (!currentJourney || !currentStep) return;
    const updatedJourneys = journeys.map(j => {
      if (j.id !== currentJourney.id) return j;
      const updatedSteps = j.steps.map((st, idx) => {
        if (idx !== selectedStepIndex) return st;
        return { ...st, [field]: value };
      });
      return { ...j, steps: updatedSteps };
    });
    setJourneys(updatedJourneys);
  };

  // Add a new step to current journey
  const addStep = () => {
    if (!currentJourney) return;
    const lastStep = steps[steps.length - 1];
    const newStepNumber = (lastStep?.step_number || steps.length) + 1;
    const defaultDelay = lastStep ? (lastStep.delay_hours || 0) + 48 : 24;

    const newStep = {
      id: `${currentJourney.id}_step_${Date.now()}`,
      step_number: newStepNumber,
      delay_hours: defaultDelay,
      enabled: true,
      badge: 'NÁSLEDNÁ PÉČE',
      subject_cs: 'Jak se ti daří s TypeBeatz? 👋',
      subject_en: 'How is your experience with TypeBeatz? 👋',
      title_cs: 'Máme pro tebe další inspiraci',
      title_en: 'Here is some more inspiration for you',
      body_cs: 'Chtěli jsme se ujistit, že všechno funguje na jedničku. Pokud potřebuješ s čímkoliv poradit, stačí odpovědět na tento e-mail.',
      body_en: 'We wanted to check in and see how everything is going. If you have any questions, simply reply to this email.',
      cta_text_cs: 'Otevřít TypeBeatz →',
      cta_text_en: 'Open TypeBeatz →',
      cta_url: '/app',
    };

    const updatedJourneys = journeys.map(j => {
      if (j.id !== currentJourney.id) return j;
      return { ...j, steps: [...j.steps, newStep] };
    });

    setJourneys(updatedJourneys);
    setSelectedStepIndex(steps.length);
  };

  // Remove a step
  const removeStep = (stepIdx) => {
    if (!currentJourney || steps.length <= 1) {
      alert('Cesta musí obsahovat alespoň 1 e-mail');
      return;
    }
    if (!window.confirm('Opravdu chceš smazat tento krok z automatické cesty?')) return;

    const updatedJourneys = journeys.map(j => {
      if (j.id !== currentJourney.id) return j;
      const filtered = j.steps.filter((_, idx) => idx !== stepIdx);
      // Re-number
      const renumbered = filtered.map((s, idx) => ({ ...s, step_number: idx + 1 }));
      return { ...j, steps: renumbered };
    });

    setJourneys(updatedJourneys);
    setSelectedStepIndex(Math.max(0, stepIdx - 1));
  };

  // Save changes to server
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      const res = await fetch('/api/admin/journeys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journeys }),
      });
      if (!res.ok) throw new Error('Uložení selhalo');
      setSaveMessage({ type: 'success', text: 'Změny v sekvencích byly úspěšně uloženy! 🚀' });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Chyba při ukládání: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  // Send test email
  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Zadej platnou e-mailovou adresu');
      return;
    }
    try {
      setSendingTest(true);
      setTestResult(null);
      const res = await fetch('/api/admin/journeys/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journeyId: currentJourney.id,
          stepId: currentStep.id,
          targetEmail: testEmail,
          toEmail: testEmail,
          lang: previewLang,
          step: currentStep,
          journeys: journeys,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Nepodařilo se odeslat test');
      setTestResult({ type: 'success', text: `Testovací e-mail byl úspěšně odeslán na ${testEmail}! 📬 (s vašimi aktuálními úpravami textů)` });
      setTimeout(() => setTestResult(null), 6000);
    } catch (err) {
      setTestResult({ type: 'error', text: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: NM }}>
        Načítám zákaznické cesty a frontu odesílání...
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ fontFamily: NM }}>
      {/* ── TOP HEADER & STATS ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 9999, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
              CUSTOMER AUTOMATION ENGINE
            </span>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 9999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
              AKTIVNÍ CRON (KAŽDÝCH 15 MIN)
            </span>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', margin: 0, color: '#fff' }}>
            Customer Journey Editor
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6, maxWidth: 680, lineHeight: 1.6 }}>
            Nastav automatické uvítací a post-purchase e-mailové sekvence s časovým odstupem (např. ihned po nákupu, za 48 hodin nebo za 7 dní).
          </p>
        </div>

        {/* Global Action / Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saveMessage && (
            <span style={{ fontSize: 12, fontWeight: 700, color: saveMessage.type === 'success' ? '#34d399' : '#ef4444' }}>
              {saveMessage.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 28px',
              borderRadius: 9999,
              background: '#fff',
              color: '#000',
              border: 'none',
              fontFamily: NM,
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(255,255,255,0.2)',
              opacity: saving ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Ukládám...' : '💾 Uložit všechny změny'}
          </button>
        </div>
      </div>

      {/* ── QUEUE STATS CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 20px', borderLeft: `3px solid ${BLUE}` }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
            Čekající ve frontě
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginTop: 4 }}>
            {stats?.pending ?? 0}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            Naplánováno k odeslání
          </div>
        </div>

        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 20px', borderLeft: `3px solid ${GREEN}` }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
            Odesláno sekvencí
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#34d399', marginTop: 4 }}>
            {stats?.sent ?? 0}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            Doručeno zákazníkům
          </div>
        </div>

        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 20px', borderLeft: `3px solid ${PURPLE}` }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
            Aktivní cesty
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#c084fc', marginTop: 4 }}>
            {journeys.length}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            Předem připravené workflow
          </div>
        </div>
      </div>

      {/* ── JOURNEY TABS (SELECTOR) ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', paddingBottom: 6 }}>
        {journeys.map(j => {
          const active = j.id === selectedJourneyId;
          return (
            <button
              key={j.id}
              onClick={() => {
                setSelectedJourneyId(j.id);
                setSelectedStepIndex(0);
              }}
              style={{
                background: active ? '#fff' : 'rgba(255,255,255,0.04)',
                color: active ? '#000' : 'rgba(255,255,255,0.6)',
                border: `1px solid ${active ? '#fff' : BORDER}`,
                padding: '10px 20px',
                borderRadius: 9999,
                cursor: 'pointer',
                fontFamily: NM,
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: active ? '0 4px 16px rgba(0,0,0,0.5)' : 'none',
              }}
            >
              {j.name} ({j.steps?.length || 0} e-maily)
            </button>
          );
        })}
      </div>

      {/* ── CURRENT JOURNEY INFO BANNER ── */}
      {currentJourney && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLUE2 }}>
              TRIGGER / SPÚŠTĚČ
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 2 }}>
              {currentJourney.trigger}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {currentJourney.description}
            </div>
          </div>
          <button
            onClick={addStep}
            style={{
              padding: '8px 18px',
              borderRadius: 9999,
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#93c5fd',
              fontFamily: NM,
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            + Přidat další e-mail do sekvence
          </button>
        </div>
      )}

      {/* ── VISUAL SEQUENCE TIMELINE CANVAS ── */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '24px 28px', marginBottom: 32, overflowX: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
          Vizuální tok sekvence (Timeline)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 'max-content' }}>
          {/* Node 0: Trigger */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(14,165,233,0.1) 100%)',
            border: '1px solid rgba(59,130,246,0.4)',
            borderRadius: 14,
            padding: '14px 18px',
            textAlign: 'center',
            minWidth: 140,
          }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#93c5fd' }}>
              ⚡ SPÚŠTĚCÍ UDÁLOST
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginTop: 4 }}>
              Aktivace plánu
            </div>
          </div>

          {/* Steps */}
          {steps.map((step, idx) => {
            const isSelected = idx === selectedStepIndex;
            const delay = step.delay_hours || 0;
            const delayLabel = delay === 0 ? 'Ihned (0h)' : delay < 24 ? `+${delay} hod` : delay % 24 === 0 ? `+${delay / 24} dny` : `+${delay}h`;

            return (
              <React.Fragment key={step.id || idx}>
                {/* Arrow & Delay badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 4px' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: '#60a5fa', background: 'rgba(59,130,246,0.12)', padding: '2px 8px', borderRadius: 9999, border: '1px solid rgba(59,130,246,0.25)', whiteSpace: 'nowrap' }}>
                    ⏱ {delayLabel}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16, lineHeight: 1 }}>→</div>
                </div>

                {/* Step Node */}
                <button
                  onClick={() => setSelectedStepIndex(idx)}
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isSelected ? '#fff' : BORDER}`,
                    borderRadius: 14,
                    padding: '14px 20px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    minWidth: 200,
                    maxWidth: 240,
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 0 20px rgba(59,130,246,0.25)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: isSelected ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                      Krok {idx + 1}
                    </span>
                    <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 9999, background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}>
                      {step.badge || 'INFO'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: NM }}>
                    {step.subject_cs || step.subject_en || 'Bez předmětu'}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                    {step.enabled ? '● Aktivní' : '○ Pozastaveno'}
                  </div>
                </button>
              </React.Fragment>
            );
          })}

          {/* Add Step Node */}
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
            <button
              onClick={addStep}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px dashed rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Přidat další krok"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN MAIN AREA: STEP EDITOR & LIVE PREVIEW ── */}
      {currentStep && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1fr) minmax(440px, 1fr)', gap: 28, alignItems: 'start' }}>
          {/* ════ LEFT COLUMN: STEP CONFIGURATION ════ */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#60a5fa' }}>
                  NASTAVENÍ KROKU {selectedStepIndex + 1} Z {steps.length}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', margin: '4px 0 0', color: '#fff' }}>
                  Obsah a načasování e-mailu
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {steps.length > 1 && (
                  <button
                    onClick={() => removeStep(selectedStepIndex)}
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      color: '#ef4444',
                      padding: '6px 12px',
                      borderRadius: 9999,
                      fontFamily: NM,
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Smazat krok
                  </button>
                )}
              </div>
            </div>

            {/* Delay Setting */}
            <div style={{ marginBottom: 24, padding: '16px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: `1px solid ${BORDER}` }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                Časová prodleva před odesláním (Delay)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                {[
                  { label: 'Ihned (0h)', hours: 0 },
                  { label: '24 hodin (1 den)', hours: 24 },
                  { label: '48 hodin (2 dny)', hours: 48 },
                  { label: '72 hodin (3 dny)', hours: 72 },
                  { label: '7 dní (168h)', hours: 168 },
                  { label: '14 dní (336h)', hours: 336 },
                ].map(preset => (
                  <button
                    key={preset.hours}
                    type="button"
                    onClick={() => updateCurrentStep('delay_hours', preset.hours)}
                    style={{
                      background: currentStep.delay_hours === preset.hours ? '#fff' : 'rgba(255,255,255,0.04)',
                      color: currentStep.delay_hours === preset.hours ? '#000' : 'rgba(255,255,255,0.5)',
                      border: 'none',
                      borderRadius: 9999,
                      padding: '5px 12px',
                      fontSize: 10,
                      fontWeight: 800,
                      fontFamily: NM,
                      cursor: 'pointer',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Vlastní počet hodin:</span>
                <input
                  type="number"
                  min="0"
                  value={currentStep.delay_hours ?? 0}
                  onChange={e => updateCurrentStep('delay_hours', Math.max(0, parseInt(e.target.value) || 0))}
                  style={{
                    width: 90,
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${BORDER}`,
                    color: '#fff',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                  ({Math.round(((currentStep.delay_hours || 0) / 24) * 10) / 10} dnů od spuštění)
                </span>
              </div>
            </div>

            {/* Language toggle for content editing */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                Jazyková verze textů
              </span>
              <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)', padding: 3, borderRadius: 9999 }}>
                <button
                  type="button"
                  onClick={() => { setEditorLang('cs'); setPreviewLang('cs'); }}
                  style={{
                    background: editorLang === 'cs' ? '#fff' : 'transparent',
                    color: editorLang === 'cs' ? '#000' : 'rgba(255,255,255,0.6)',
                    border: 'none',
                    borderRadius: 9999,
                    padding: '4px 12px',
                    fontSize: 10,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  🇨🇿 Čeština
                </button>
                <button
                  type="button"
                  onClick={() => { setEditorLang('en'); setPreviewLang('en'); }}
                  style={{
                    background: editorLang === 'en' ? '#fff' : 'transparent',
                    color: editorLang === 'en' ? '#000' : 'rgba(255,255,255,0.6)',
                    border: 'none',
                    borderRadius: 9999,
                    padding: '4px 12px',
                    fontSize: 10,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            {/* Badge pill */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                Odznak (Badge v pravém horním rohu)
              </label>
              <input
                type="text"
                value={currentStep.badge || ''}
                onChange={e => updateCurrentStep('badge', e.target.value)}
                placeholder="např. PLATBA POTVRZENA, PRO TIPY..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Subject */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                Předmět e-mailu ({editorLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={editorLang === 'cs' ? (currentStep.subject_cs || '') : (currentStep.subject_en || '')}
                onChange={e => updateCurrentStep(editorLang === 'cs' ? 'subject_cs' : 'subject_en', e.target.value)}
                placeholder="Předmět, který zákazník uvidí ve schránce..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Title */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                Hlavní titulek uvnitř e-mailu (H1)
              </label>
              <input
                type="text"
                value={editorLang === 'cs' ? (currentStep.title_cs || '') : (currentStep.title_en || '')}
                onChange={e => updateCurrentStep(editorLang === 'cs' ? 'title_cs' : 'title_en', e.target.value)}
                placeholder="Velký nadpis zprávy..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Body */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                  Text zprávy ({editorLang.toUpperCase()})
                </label>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Lze použít &#123;&#123;firstName&#125;&#125;</span>
              </div>
              <textarea
                rows={5}
                value={editorLang === 'cs' ? (currentStep.body_cs || '') : (currentStep.body_en || '')}
                onChange={e => updateCurrentStep(editorLang === 'cs' ? 'body_cs' : 'body_en', e.target.value)}
                placeholder="Detailní sdělení zákazníkovi..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: 13,
                  lineHeight: 1.6,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* CTA Button Text & URL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                  Text CTA tlačítka
                </label>
                <input
                  type="text"
                  value={editorLang === 'cs' ? (currentStep.cta_text_cs || '') : (currentStep.cta_text_en || '')}
                  onChange={e => updateCurrentStep(editorLang === 'cs' ? 'cta_text_cs' : 'cta_text_en', e.target.value)}
                  placeholder="např. Otevřít aplikaci →"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                  Cílová URL tlačítka
                </label>
                <input
                  type="text"
                  value={currentStep.cta_url || ''}
                  onChange={e => updateCurrentStep('cta_url', e.target.value)}
                  placeholder="/app, /upgrade, /account..."
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Direct Save Button inside editor */}
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                {saveMessage ? (
                  <span style={{ color: saveMessage.type === 'success' ? '#34d399' : '#ef4444', fontWeight: 700 }}>
                    {saveMessage.text}
                  </span>
                ) : (
                  'Změny se uloží do databáze a projeví se ve všech nově odesílaných e-mailech.'
                )}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  borderRadius: 9999,
                  background: '#fff',
                  color: '#000',
                  border: 'none',
                  fontFamily: NM,
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(255,255,255,0.2)',
                  opacity: saving ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {saving ? 'Ukládám...' : '💾 Uložit úpravy'}
              </button>
            </div>
          </div>

          {/* ════ RIGHT COLUMN: LIVE EMAIL PREVIEW & TEST SEND ════ */}
          <div>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: PURPLE }}>
                    ŽIVÝ NÁHLED E-MAILU
                  </span>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    Přesně takto se zpráva zobrazí v Gmailu / Apple Mailu
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setPreviewLang('cs')}
                    style={{
                      background: previewLang === 'cs' ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: previewLang === 'cs' ? '#fff' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${previewLang === 'cs' ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
                      borderRadius: 9999,
                      padding: '4px 10px',
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    CZ
                  </button>
                  <button
                    onClick={() => setPreviewLang('en')}
                    style={{
                      background: previewLang === 'en' ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: previewLang === 'en' ? '#fff' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${previewLang === 'en' ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
                      borderRadius: 9999,
                      padding: '4px 10px',
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* Subject Bar */}
              <div style={{ background: 'rgba(0,0,0,0.6)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Předmět:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {previewLang === 'cs' ? (currentStep.subject_cs || '—') : (currentStep.subject_en || '—')}
                </span>
              </div>

              {/* Live Rendered Canvas / Mock Frame */}
              <div style={{
                background: '#000',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 16,
                padding: '32px 24px',
                minHeight: 380,
                boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
              }}>
                <div style={{
                  maxWidth: 440,
                  margin: '0 auto',
                  background: 'linear-gradient(180deg, rgba(1,5,10,0.98) 0%, rgba(7,30,87,0.92) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 18,
                  overflow: 'hidden',
                  boxShadow: '0 0 50px rgba(59,130,246,0.18), 0 20px 40px rgba(0,0,0,0.9)',
                }}>
                  <div style={{ padding: '32px 28px 24px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                      <img src="/typebeatz-logo.png" alt="TypeBeatz" style={{ height: 22, width: 'auto', display: 'block' }} />
                      <span style={{
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.45)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: 9999,
                        padding: '3px 10px',
                      }}>
                        {currentStep.badge || 'TYPEBEATZ'}
                      </span>
                    </div>

                    {/* Thin divider */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 0 20px' }} />

                    {/* Title */}
                    <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.2, color: '#fff', margin: '0 0 16px' }}>
                      {(previewLang === 'cs' ? (currentStep.title_cs || '') : (currentStep.title_en || '')).replace('{{firstName}}', 'Jan')}
                    </h3>

                    {/* Body */}
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', whiteSpace: 'pre-line', fontWeight: 400 }}>
                      {(previewLang === 'cs' ? (currentStep.body_cs || '') : (currentStep.body_en || '')).replace('{{firstName}}', 'Jan')}
                    </p>

                    {/* Thin divider */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 0 24px' }} />

                    {/* CTA button */}
                    <div style={{ textAlign: 'center', margin: '0 0 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '12px 36px',
                        borderRadius: 9999,
                        fontWeight: 600,
                        fontSize: 13,
                        letterSpacing: '-0.01em',
                        background: '#ffffff',
                        color: '#000000',
                        boxShadow: '0 4px 18px rgba(255,255,255,0.15)',
                      }}>
                        {previewLang === 'cs' ? (currentStep.cta_text_cs || 'Přejít do aplikace →') : (currentStep.cta_text_en || 'Open TypeBeatz →')}
                      </span>
                    </div>

                    {/* Footer */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '24px 0 14px' }} />
                    <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.6, fontWeight: 400 }}>
                      © {new Date().getFullYear()} TypeBeatz • jan@example.com<br />
                      {previewLang === 'cs' ? 'Automatická zpráva odeslaná na základě tvé aktivity.' : 'Automated message sent based on your activity.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── TEST EMAIL SENDER ── */}
              <div style={{ marginTop: 20, padding: '16px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                  Odeslat reálný testovací e-mail
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="email"
                    placeholder="tvuj@email.cz"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 9999,
                      padding: '8px 16px',
                      color: '#fff',
                      fontSize: 12,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={sendingTest}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 9999,
                      background: 'rgba(59,130,246,0.2)',
                      border: '1px solid rgba(59,130,246,0.4)',
                      color: '#93c5fd',
                      fontFamily: NM,
                      fontWeight: 800,
                      fontSize: 11,
                      cursor: sendingTest ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sendingTest ? 'Odesílám...' : 'Odeslat test'}
                  </button>
                </div>
                {testResult && (
                  <div style={{ fontSize: 11, fontWeight: 700, marginTop: 8, color: testResult.type === 'success' ? '#34d399' : '#ef4444' }}>
                    {testResult.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
