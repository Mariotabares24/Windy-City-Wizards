'use client';
import { useEffect, useState } from 'react';
import { Check, ShieldCheck, Trash2 } from 'lucide-react';
import { Header, Footer } from './brand';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { api } from '@/lib/client';
import { colorHex } from '@/lib/catalog';
import type { Preferences } from '@/lib/contracts';
export function Settings() {
  const [prefs, setPrefs] = useState<Preferences>({
    name: 'Mario',
    mode: 'solo',
    history: false,
    location: 'Chicago',
    colors: [],
  });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [erase, setErase] = useState(false);
  useEffect(() => {
    api<{ preferences: Preferences }>('/api/profile')
      .then((d) => setPrefs(d.preferences))
      .catch((e) => setMessage(e.message));
  }, []);
  async function save() {
    setBusy(true);
    try {
      await api('/api/profile', prefs, 'PUT');
      setMessage('Your preferences are saved.');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="settings-page">
        <div className="eyebrow">A LITTLE PERSONAL. ALWAYS YOURS.</div>
        <h1>Your comfort zone.</h1>
        <p className="muted">
          Choose what Cosmic remembers and what stays just for this session.
        </p>
        <section className="settings-section">
          <h2>Make yourself at home.</h2>
          <label>
            Your name
            <input
              value={prefs.name}
              maxLength={30}
              onChange={(e) => setPrefs({ ...prefs, name: e.target.value })}
            />
          </label>
          <label>
            Your market
            <select
              value={prefs.location}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  location: e.target.value as Preferences['location'],
                })
              }
            >
              {['Chicago', 'New York', 'London'].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <p className="fine-print">
            Market labels use the same illustrative inventory. All sample prices
            are in USD.
          </p>
        </section>
        <section className="settings-section">
          <h2>Your shopping mode</h2>
          <div className="privacy-options">
            {[
              {
                id: 'solo',
                name: 'Solo',
                detail:
                  'Recommendations use only what you tell us during this visit.',
              },
              {
                id: 'personalized',
                name: 'Private personalized',
                detail: 'Use the color preferences you explicitly save below.',
              },
            ].map((m) => (
              <button
                key={m.id}
                className={
                  prefs.mode === m.id ? 'privacy-card chosen' : 'privacy-card'
                }
                aria-pressed={prefs.mode === m.id}
                onClick={() =>
                  setPrefs({ ...prefs, mode: m.id as Preferences['mode'] })
                }
              >
                <ShieldCheck size={22} />
                <strong>{m.name}</strong>
                <span>{m.detail}</span>
                {prefs.mode === m.id && <Check size={18} />}
              </button>
            ))}
          </div>
          <p className="fine-print">
            Shopping circles are optional in either mode. They share the current
            shortlist, messages, votes, and previews you choose to share. Your
            saved profile is private.
          </p>
        </section>
        <section className="settings-section">
          <h2>Your kind of color</h2>
          <div className="color-preferences">
            {['Midnight', 'Charcoal', 'Camel', 'Ivory', 'Forest'].map((c) => (
              <button
                className={prefs.colors.includes(c) ? 'chosen' : ''}
                key={c}
                aria-pressed={prefs.colors.includes(c)}
                onClick={() =>
                  setPrefs({
                    ...prefs,
                    colors: prefs.colors.includes(c)
                      ? prefs.colors.filter((v) => v !== c)
                      : [...prefs.colors, c],
                  })
                }
              >
                <i style={{ background: colorHex[c] }} />
                {c}
              </button>
            ))}
          </div>
          <div className="settings-switch">
            <div>
              <strong>Remember my preference choices</strong>
              <p>
                When off, your selected colors are not saved for future visits.
                Browsing and purchase history never influence recommendations.
              </p>
            </div>
            <Switch
              checked={prefs.history}
              onCheckedChange={(history) => setPrefs({ ...prefs, history })}
              aria-label="Remember preference choices"
            />
          </div>
        </section>
        <div className="settings-section">
          <h2>Your camera, your call.</h2>
          <p>
            Camera processing runs on your device. Video is never uploaded. A
            captured photo stays local until you explicitly share it with a
            circle. You can always shop and use 3D previews without a camera.
          </p>
          <p className="fine-print">
            Circles expire after 24 hours. Anyone with a circle invitation can
            join until the host ends it.
          </p>
        </div>
        <button
          className="button primary"
          disabled={busy || !prefs.name.trim()}
          onClick={save}
        >
          {busy ? 'Saving…' : 'Save preferences'}
        </button>
        <button className="button danger" onClick={() => setErase(true)}>
          <Trash2 size={15} /> Clear my shopping data
        </button>
        {message && <output className="notice">{message}</output>}
        <Dialog open={erase} onOpenChange={setErase}>
          <DialogContent className="cosmic-modal">
            <DialogTitle>Clear your shopping data?</DialogTitle>
            <DialogDescription>
              This removes your saved preferences and bag, ends circles you
              host, and removes your participation and votes. Messages already
              shared with friends remain in their circle until expiry.
            </DialogDescription>
            <button
              className="button danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api('/api/profile', undefined, 'DELETE');
                  setPrefs({
                    name: 'Mario',
                    mode: 'solo',
                    history: false,
                    location: 'Chicago',
                    colors: [],
                  });
                  setMessage('Your private shopping data has been cleared.');
                  setErase(false);
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Clear my data
            </button>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </>
  );
}
