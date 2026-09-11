'use client';
import { Photo } from '@/components/photo';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
} from 'react';
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Download,
  Maximize,
  Minimize,
  RotateCcw,
  Scan,
  Share2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/brand';
import { AddToBag } from '@/components/commerce';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { money, type Product } from '@/lib/catalog';
import { api, circlePath } from '@/lib/client';
import type { CircleState } from '@/lib/contracts';
import type { PoseAnchor, SpatialHandle } from './spatial-canvas';
import { PreviewBoundary } from './preview-boundary';
const SpatialCanvas = lazy(() =>
  import('./spatial-canvas').then((m) => ({ default: m.SpatialCanvas })),
);
export function Experience({ product: p }: { product: Product }) {
  const camera = false;
  const [error, setError] = useState('');
  const [tracking] = useState('Camera-free 3D preview');
  const [renderFailed, setRenderFailed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState(0);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [captureBlob, setCaptureBlob] = useState<Blob | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [circle, setCircle] = useState<CircleState | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const spatial = useRef<SpatialHandle>(null);
  const mounted = useRef(true);
  const pose = useRef<PoseAnchor | null>(null);
  const onRenderError = useCallback(() => {
    setRenderFailed(true);
    setSceneReady(false);
    setError(
      '3D rendering is unavailable on this device. The product photo is still available.',
    );
  }, []);
  const onSceneReady = useCallback(() => setSceneReady(true), []);
  useEffect(() => {
    const update = () =>
      setFullscreen(document.fullscreenElement === viewport.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  useEffect(() => {
    mounted.current = true;
    queueMicrotask(() => {
      if (mounted.current) setClientReady(true);
    });
    const active = sessionStorage.getItem('cosmic-active-circle');
    if (active)
      api<CircleState>(circlePath(active))
        .then((c) => {
          if (c.members) setCircle(c);
        })
        .catch(() => {});
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(
    () => () => {
      if (snapshot) URL.revokeObjectURL(snapshot);
    },
    [snapshot],
  );
  async function capture() {
    const source = spatial.current?.capture();
    if (!source || !viewport.current) {
      setError('Open the 3D preview before capturing.');
      return;
    }
    const out = document.createElement('canvas');
    out.width = Math.min(source.width, 1200);
    const imageHeight = Math.round((out.width * source.height) / source.width);
    out.height = imageHeight + 60;
    const ctx = out.getContext('2d')!;
    ctx.fillStyle = '#232346';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(source, 0, 0, out.width, imageHeight);
    ctx.fillStyle = '#0a0a1abb';
    ctx.fillRect(0, out.height - 60, out.width, 60);
    ctx.fillStyle = '#efecf5';
    ctx.font = '16px sans-serif';
    ctx.fillText(p.name + ' · approximate preview', 20, out.height - 25);
    out.toBlob(
      (b) => {
        if (!b) return;
        setCaptureBlob(b);
        setSnapshot(URL.createObjectURL(b));
        setShared(false);
      },
      'image/jpeg',
      0.83,
    );
  }
  async function share() {
    if (!circle || !captureBlob) return;
    setSharing(true);
    try {
      const form = new FormData();
      form.append('image', captureBlob, 'preview.jpg');
      form.append('productId', p.id);
      const r = await fetch(circlePath(circle.id) + '/snapshot', {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(20000),
      });
      if (!r.ok)
        throw new Error(
          ((await r.json()) as { error?: string }).error ||
            'Snapshot could not be shared.',
        );
      setShared(true);
      setShareOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSharing(false);
    }
  }
  return (
    <>
      <Header />
      <main className="ar-page">
        <div className="ar-heading">
          <a className="text-button" href={'/product/' + p.id}>
            <ArrowLeft size={15} /> Back to your find
          </a>
          <span>
            <ShieldCheck size={13} /> Interactive 3D preview
          </span>
        </div>
        <div className="ar-layout">
          <section>
            <div
              className={
                'ar-viewport camera-off' +
                (p.category === 'gadgets' ? ' gadget-preview' : '')
              }
              ref={viewport}
            >
              {!renderFailed && clientReady ? (
                <PreviewBoundary onError={onRenderError}>
                  <Suspense fallback={null}>
                    <SpatialCanvas
                      ref={spatial}
                      product={p}
                      camera={camera}
                      pose={pose}
                      rotation={rotation}
                      position={position}
                      onError={onRenderError}
                      onReady={onSceneReady}
                      onManipulate={(n) => {
                        if (n.rotation !== undefined) setRotation(n.rotation);
                        if (n.position !== undefined) setPosition(n.position);
                      }}
                    />
                  </Suspense>
                </PreviewBoundary>
              ) : renderFailed ? (
                <Photo
                  className="ar-photo-fallback"
                  src={p.image}
                  alt={p.name}
                />
              ) : null}
              {!sceneReady && !renderFailed && (
                <output className="ar-loading">
                  <Sparkles size={25} />
                  <span>Preparing your preview…</span>
                </output>
              )}
              <div className="ar-topbar">
                <span className="ar-mode">
                  <Scan size={14} />
                  INTERACTIVE 3D
                </span>
                <button
                  className="icon-button"
                  aria-label="Reset view"
                  disabled={!sceneReady}
                  onClick={() => {
                    setRotation(0);
                    setPosition(0);
                    spatial.current?.reset();
                  }}
                >
                  <RotateCcw size={17} />
                </button>
              </div>
              <div className="ar-caption">
                <span className="status-dot" />
                {tracking}
              </div>
              {p.category === 'home' && (
                <div className="dimension-tag">
                  {p.specs.Dimensions}
                  <span>Prototype dimensions · fixed object scale</span>
                </div>
              )}
              <div className="ar-controls">
                <button
                  className="button"
                  type="button"
                  disabled
                  title="Live camera try-on is disabled in this demo build."
                >
                  <CameraOff size={17} /> Camera try-on — coming soon
                </button>
                <button
                  className="capture-button"
                  aria-label="Capture 3D preview"
                  title="Capture 3D preview"
                  disabled={!sceneReady || renderFailed}
                  onClick={capture}
                >
                  <Camera size={23} />
                </button>
                <button
                  className="button"
                  aria-label={fullscreen ? 'Exit fullscreen' : 'Expand preview'}
                  onClick={() => {
                    if (document.fullscreenElement) {
                      void document
                        .exitFullscreen()
                        .catch(() =>
                          setError('Press Escape to exit fullscreen.'),
                        );
                      return;
                    }
                    const element = viewport.current;
                    if (!element?.requestFullscreen) {
                      setError('Fullscreen is unavailable in this browser.');
                      return;
                    }
                    void element
                      .requestFullscreen()
                      .catch(() =>
                        setError('Fullscreen is unavailable in this browser.'),
                      );
                  }}
                >
                  {fullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
                  <span>{fullscreen ? 'Exit fullscreen' : 'Expand'}</span>
                </button>
              </div>
            </div>
            {error && <output className="notice">{error}</output>}
            {p.category === 'home' && (
              <div className="spatial-adjustments">
                <div>
                  <span>Rotate · {rotation}°</span>
                  <Slider
                    min={-180}
                    max={180}
                    value={[rotation]}
                    onValueChange={(v) =>
                      setRotation(Array.isArray(v) ? v[0] : v)
                    }
                    aria-label="Rotate product"
                  />
                </div>
                <div>
                  <span>Move left or right</span>
                  <Slider
                    min={-80}
                    max={80}
                    value={[position]}
                    onValueChange={(v) =>
                      setPosition(Array.isArray(v) ? v[0] : v)
                    }
                    aria-label="Horizontal placement"
                  />
                </div>
              </div>
            )}
            <p className="fine-print">
              {p.category === 'fashion'
                ? 'Preview the silhouette in 3D. This preview does not measure your body or predict exact garment fit.'
                : p.category === 'home'
                  ? 'Drag to orbit and zoom in 3D. Verify real dimensions before purchase.'
                  : 'Explore the product from every angle in 3D.'}
            </p>
            {snapshot && (
              <div className="snapshot-panel">
                <Photo
                  src={snapshot}
                  alt="Your private captured product preview"
                />
                <div>
                  <h3>
                    {shared
                      ? 'Shared with your circle.'
                      : 'A private little preview.'}
                  </h3>
                  <p>
                    {shared
                      ? 'Your friends can now view this image in the circle.'
                      : 'This image stays on your device until you choose to share it.'}
                  </p>
                  <a
                    className="button small"
                    download="cosmic-mart-preview.jpg"
                    href={snapshot}
                  >
                    <Download size={14} /> Save image
                  </a>
                  {circle ? (
                    <button
                      className="button primary small"
                      onClick={() => setShareOpen(true)}
                    >
                      <Share2 size={14} /> Share to circle
                    </button>
                  ) : (
                    <a className="button small" href="/shop?circle=1">
                      Start a circle to share
                    </a>
                  )}
                </div>
              </div>
            )}
          </section>
          <aside className="ar-info">
            <div className="eyebrow">
              {p.category === 'fashion'
                ? 'WEAR IT'
                : p.category === 'home'
                  ? 'PLACE IT'
                  : 'HOLD IT'}
            </div>
            <h1>
              A little less <br />
              “what if?”
            </h1>
            <p className="ar-description">
              {p.category === 'fashion'
                ? 'See a new direction on your own terms.'
                : p.category === 'home'
                  ? 'Find the right feeling for your favorite space.'
                  : 'Get a feel for it, before it’s in your hands.'}
            </p>
            <div className="ar-product">
              <Photo src={p.image} alt={p.name} />
              <div>
                <h2>{p.name}</h2>
                <strong>{money(p.price)}</strong>
              </div>
            </div>
            <div className="ar-note">
              <Sparkles size={17} />
              <p>
                {p.category === 'fashion'
                  ? 'Drag to orbit the garment in 3D. Live camera try-on is coming soon.'
                  : p.category === 'home'
                    ? 'Keep the product’s scale fixed, then use rotation and position to explore the scene.'
                    : 'Drag to orbit the product in 3D from every angle.'}
              </p>
            </div>
            <AddToBag
              product={p}
              rationale="Chosen after exploring the product preview."
            />
            <a
              className="text-button"
              href={circle ? '/party/' + circle.id : '/shop'}
            >
              Back to {circle ? 'your circle' : 'shopping'} →
            </a>
          </aside>
        </div>
        <Dialog open={shareOpen} onOpenChange={setShareOpen}>
          <DialogContent className="cosmic-modal">
            <DialogTitle>Share this snapshot?</DialogTitle>
            <DialogDescription>
              Everyone in “{circle?.goal}” will be able to view this image. It
              may include your face or surroundings. Video is never shared.
            </DialogDescription>
            {snapshot && (
              <Photo
                className="share-preview"
                src={snapshot}
                alt="Snapshot to share"
              />
            )}
            <button
              className="button primary full"
              onClick={share}
              disabled={sharing}
            >
              {sharing ? 'Sharing…' : 'Share this image with my circle'}
            </button>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
