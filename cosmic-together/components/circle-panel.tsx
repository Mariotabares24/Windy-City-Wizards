'use client';
import { Photo } from '@/components/photo';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Check,
  Copy,
  Send,
  Sparkles,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { api, circlePath } from '@/lib/client';
import type { CircleState } from '@/lib/contracts';
// Fallback copy for non-secure contexts (LAN IP over http) that lack the async
// Clipboard API. execCommand is deprecated but remains the only such fallback.
function legacyCopy(input: HTMLInputElement | null): boolean {
  if (!input) return false;
  input.focus();
  input.select();
  try {
    // oxlint-disable-next-line typescript/no-deprecated
    return document.execCommand('copy');
  } catch {
    return false;
  }
}
export function useCircle(id: string | null) {
  const [circle, setCircle] = useState<CircleState | null>(null);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const result = await api<CircleState>(circlePath(id));
      if (!('members' in result)) return;
      setCircle(result);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    queueMicrotask(() => setCircle(null));
    if (!id) return;
    queueMicrotask(() => void refresh());
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 2500);
    return () => clearInterval(timer);
  }, [id, refresh]);
  const act = useCallback(
    async (body: unknown) => {
      if (!id) return;
      await api(circlePath(id), body);
      await refresh();
    },
    [id, refresh],
  );
  return { circle, error, act, refresh };
}
export function CirclePanel({
  circle,
  error,
  onAction,
  onEnd,
}: {
  circle: CircleState | null;
  error: string;
  onAction: (body: unknown) => Promise<void>;
  onEnd?: () => void;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState('');
  const linkInput = useRef<HTMLInputElement>(null);
  async function action(body: unknown) {
    setBusy(true);
    setLocalError('');
    try {
      await onAction(body);
    } catch (e) {
      setLocalError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onAction({ action: 'message', text });
      setText('');
      setLocalError('');
    } catch (e) {
      setLocalError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const link =
    typeof window !== 'undefined' && circle
      ? window.location.origin + '/party/' + circle.id
      : '';
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(link);
  async function copyLink() {
    setLocalError('');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else if (!legacyCopy(linkInput.current)) {
        throw new Error('copy failed');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const input = linkInput.current;
      input?.focus();
      input?.select();
      setLocalError('Copy didn’t work here — the link is selected, press Ctrl/⌘+C.');
    }
  }
  return (
    <aside className="circle-panel">
      <div className="panel-title">
        <UsersRound size={19} />
        <h2>Your shopping circle</h2>
        {circle && (
          <span className="live-pill">{error ? 'Reconnecting' : 'Live'}</span>
        )}
      </div>
      {!circle ? (
        <p className="muted">{error || 'Opening your circle…'}</p>
      ) : (
        <>
          <div className="members">
            {circle.members.map((m) => (
              <div className="member" key={m.id}>
                <span className={'avatar ' + (m.demo ? 'lavender' : '')}>
                  {m.name.charAt(0)}
                </span>
                <span>
                  {m.name}
                  <small>
                    {m.demo
                      ? 'Simulated friend'
                      : m.online
                        ? 'Here with you'
                        : 'Away'}
                  </small>
                </span>
                {circle.host && m.id !== circle.memberId && (
                  <button
                    className="icon-button"
                    aria-label={'Remove ' + m.name}
                    onClick={() => action({ action: 'remove', memberId: m.id })}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="invite-controls">
            <input
              ref={linkInput}
              aria-label="Circle invitation link"
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button className="button small" onClick={copyLink}>
              {copied ? <Check size={15} /> : <Copy size={15} />}{' '}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          {isLocal && (
            <p className="fine-print">
              You’re on <strong>localhost</strong>. To open this on another
              device, replace it with your computer’s LAN IP (e.g.
              http://192.168.x.x:PORT) or share a tunnel URL.
            </p>
          )}
          <p className="fine-print">
            Only this shortlist and circle conversation are shared. Anyone with
            this invitation can join. Expires after 24 hours.
          </p>
          <div
            className="circle-chat"
            aria-live="polite"
            aria-label="Shopping circle messages"
          >
            {circle.messages.map((m) => (
              <div
                key={m.id}
                className={
                  'chat-message ' + (m.type === 'system' ? 'system' : '')
                }
              >
                <strong>
                  {m.type === 'system' && <Sparkles size={12} />} {m.name}
                </strong>
                <p>{m.text}</p>
                {m.type === 'snapshot' && (
                  <Photo
                    className="shared-snapshot"
                    src={circlePath(circle.id) + '/snapshot?message=' + m.id}
                    alt="A snapshot explicitly shared by a circle member"
                  />
                )}
                {(m.type === 'preview' || m.type === 'snapshot') &&
                  m.productId && (
                    <a
                      className="text-button"
                      href={'/product/' + m.productId}
                    >
                      Open shared product →
                    </a>
                  )}
              </div>
            ))}
          </div>
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              aria-label="Message your circle"
              maxLength={1000}
              placeholder="Your take? Try @cosmic…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button aria-label="Send message" disabled={busy || !text.trim()}>
              <Send size={17} />
            </button>
          </form>
          {circle.host && (
            <div className="circle-tools">
              <button
                className="text-button"
                disabled={busy || circle.members.some((m) => m.demo)}
                onClick={() => action({ action: 'demo' })}
              >
                <UserPlus size={14} /> Add demo friend
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={async () => {
                  try {
                    await onAction({ action: 'end' });
                    onEnd?.();
                  } catch (e) {
                    setLocalError((e as Error).message);
                  }
                }}
              >
                End circle
              </button>
            </div>
          )}
          {!circle.host && (
            <button
              className="text-button"
              onClick={async () => {
                await action({ action: 'leave' });
                onEnd?.();
              }}
            >
              Leave circle
            </button>
          )}
        </>
      )}
      {(localError || error) && (
        <p role="alert" className="error-text">
          {localError || error}
        </p>
      )}
    </aside>
  );
}
