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
  Hand,
  Maximize,
  Minimize,
  Move,
  Pause,
  Play,
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
import { colorHex, money, type Product } from '@/lib/catalog';
import { api, circlePath } from '@/lib/client';
import type { CircleState } from '@/lib/contracts';
import type { PoseAnchor, SpatialHandle } from './spatial-canvas';
import { PreviewBoundary } from './preview-boundary';
const SpatialCanvas = lazy(() =>
  import('./spatial-canvas').then((m) => ({ default: m.SpatialCanvas })),
);
export function Experience({ product: p }: { product: Product }) {
  const [color, setColor] = useState(p.color);
  const [camera, setCamera] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState('Camera-free 3D preview');
  const [renderFailed, setRenderFailed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState(0);
  const [tutorial, setTutorial] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [ghost, setGhost] = useState(true);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [captureBlob, setCaptureBlob] = useState<Blob | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [circle, setCircle] = useState<CircleState | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [help, setHelp] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const spatial = useRef<SpatialHandle>(null);
  const stream = useRef<MediaStream | null>(null);
  const stopTracking = useRef<(() => void) | null>(null);
  const generation = useRef(0);
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
  const captions =
    p.model === 'speaker'
      ? [
          'Press the top center to play or pause your music.',
          'Touch + on the top panel to raise the volume.',
          'Hold the top center to start Bluetooth pairing.',
        ]
      : [
          'Press the lower right-earcup button to play or pause.',
          'Press the upper right-earcup control to change volume.',
          'Gently rotate the earcup inward before packing.',
        ];
  function chooseColor(next: string) {
    if (next === color) return;
    setSceneReady(false);
    setColor(next);
  }
  function stopCamera() {
    generation.current++;
    stopTracking.current?.();
    stopTracking.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    pose.current = null;
    setCamera(false);
    setCameraBusy(false);
    setTracking('Camera-free 3D preview');
  }
  const releaseResources = useCallback(() => {
    mounted.current = false;
    generation.current++;
    stopTracking.current?.();
    stream.current?.getTracks().forEach((t) => t.stop());
  }, []);
  useEffect(() => {
    mounted.current = true;
    // Keep the WebGL module out of server Suspense. It only runs in a browser.
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
    return releaseResources;
  }, [releaseResources]);
  useEffect(
    () => () => {
      if (snapshot) URL.revokeObjectURL(snapshot);
    },
    [snapshot],
  );
  async function enableCamera() {
    setCameraBusy(true);
    setError('');
    const gen = ++generation.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          'Your browser does not offer camera access here. You can use the 3D preview.',
        );
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: p.category === 'fashion' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (!mounted.current || gen !== generation.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = s;
      setCamera(true);
      const v = video.current;
      if (!v) throw new Error('Camera preview is unavailable.');
      v.srcObject = s;
      await v.play();
      if (!mounted.current || gen !== generation.current) return;
      if (p.category === 'fashion' && viewport.current) {
        setTracking('Loading shoulder tracking…');
        try {
          const { startPose } = await import('./pose');
          if (!mounted.current || gen !== generation.current) return;
          const stop = await startPose(
            v,
            viewport.current,
            (a) => {
              if (mounted.current && gen === generation.current)
                pose.current = a;
            },
            (status) => {
              if (mounted.current && gen === generation.current)
                setTracking(status);
            },
          );
          if (!mounted.current || gen !== generation.current) stop();
          else stopTracking.current = stop;
        } catch {
          if (!mounted.current || gen !== generation.current) return;
          setError(
            'Shoulder tracking could not load. Switch to 3D to continue.',
          );
          setTracking('Tracking unavailable · use camera-free 3D');
        }
      } else setTracking('Camera overlay · placement is approximate');
    } catch (e) {
      if (!mounted.current || gen !== generation.current) return;
      stopCamera();
      setError(
        (e as Error).name === 'NotAllowedError'
          ? 'Camera access was declined. You can keep exploring in 3D or try again.'
          : (e as Error).message,
      );
    } finally {
      if (mounted.current && gen === generation.current) setCameraBusy(false);
    }
  }
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
    ctx.fillStyle = '#272d29';
    ctx.fillRect(0, 0, out.width, out.height);
    if (camera && video.current && video.current.readyState >= 2) {
      const v = video.current;
      const scale = Math.max(
        out.width / v.videoWidth,
        imageHeight / v.videoHeight,
      );
      ctx.save();
      if (p.category === 'fashion') {
        ctx.translate(out.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        v,
        (out.width - v.videoWidth * scale) / 2,
        (imageHeight - v.videoHeight * scale) / 2,
        v.videoWidth * scale,
        v.videoHeight * scale,
      );
      ctx.restore();
    }
    ctx.drawImage(source, 0, 0, out.width, imageHeight);
    ctx.fillStyle = '#101514bb';
    ctx.fillRect(0, out.height - 60, out.width, 60);
    ctx.fillStyle = '#f4f0e8';
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
            <ShieldCheck size={13} /> Camera stays on your device
          </span>
        </div>
        <div className="ar-layout">
          <section>
            <div
              className={
                'ar-viewport ' +
                (camera ? 'camera-on' : 'camera-off') +
                (p.category === 'gadgets' ? ' gadget-preview' : '')
              }
              ref={viewport}
            >
              <video
                ref={video}
                className={
                  (camera ? 'camera-visible' : '') +
                  (p.category === 'fashion' ? ' mirrored' : '')
                }
                muted
                playsInline
                aria-label="Your private camera preview"
              />
              {!renderFailed && clientReady ? (
                <PreviewBoundary onError={onRenderError}>
                  <Suspense fallback={null}>
                    <SpatialCanvas
                      ref={spatial}
                      product={p}
                      color={color}
                      camera={camera}
                      pose={pose}
                      rotation={rotation}
                      position={position}
                      tutorial={tutorial}
                      playing={playing}
                      ghost={ghost}
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
                  {camera
                    ? p.category === 'fashion'
                      ? 'LIVE SHOULDER TRACKING'
                      : 'CAMERA OVERLAY'
                    : 'INTERACTIVE 3D'}
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
              {p.category === 'gadgets' && (
                <div className="tutorial-caption">
                  <span>0{tutorial + 1} / 03</span>
                  <p>{captions[tutorial]}</p>
                </div>
              )}
              <div className="ar-controls">
                <button
                  className="button"
                  onClick={camera || cameraBusy ? stopCamera : enableCamera}
                  disabled={renderFailed}
                >
                  {camera ? <CameraOff size={17} /> : <Camera size={17} />}{' '}
                  {camera
                    ? 'Stop camera'
                    : cameraBusy
                      ? 'Cancel camera request'
                      : 'Use my camera'}
                </button>
                <button
                  className="capture-button"
                  aria-label="Capture a private snapshot"
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
            {camera && (
              <div className="ar-gesture-bar">
                <span>
                  <Move size={15} /> Drag to move · pinch to resize · twist to
                  rotate
                </span>
                <button
                  className="text-button"
                  disabled={!sceneReady}
                  onClick={() => {
                    setRotation(0);
                    setPosition(0);
                    spatial.current?.reset();
                  }}
                >
                  <RotateCcw size={14} /> Reset placement
                </button>
              </div>
            )}
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
            {p.category === 'gadgets' && (
              <div className="gadget-controls">
                <div className="tutorial-buttons">
                  {[
                    'Play & pause',
                    'Volume',
                    '' + (p.model === 'speaker' ? 'Pair' : 'Fold & pack'),
                  ].map((t, i) => (
                    <button
                      key={t}
                      className={tutorial === i ? 'button primary' : 'button'}
                      onClick={() => {
                        setTutorial(i);
                        setPlaying(true);
                      }}
                    >
                      {i + 1}. {t}
                    </button>
                  ))}
                  <button
                    className="icon-button"
                    aria-label={playing ? 'Pause tutorial' : 'Play tutorial'}
                    onClick={() => setPlaying(!playing)}
                  >
                    {playing ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Toggle ghost hand"
                    aria-pressed={ghost}
                    onClick={() => setGhost(!ghost)}
                  >
                    <Hand size={19} />
                  </button>
                </div>
                <form
                  className="tutorial-ask"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = help.toLowerCase();
                    setTutorial(
                      /volume|loud|quiet/.test(v)
                        ? 1
                        : /fold|pack|pair|connect/.test(v)
                          ? 2
                          : 0,
                    );
                    setPlaying(true);
                  }}
                >
                  <Sparkles size={17} />
                  <input
                    aria-label="Ask how to use this gadget"
                    placeholder="How do I change the volume?"
                    value={help}
                    onChange={(e) => setHelp(e.target.value)}
                    maxLength={200}
                  />
                  <button className="text-button">Show me →</button>
                </form>
              </div>
            )}
            <p className="fine-print">
              {p.category === 'fashion'
                ? 'Preview the silhouette and color. Shoulder tracking is approximate; it does not measure your body or predict exact garment fit.'
                : p.category === 'home'
                  ? 'Drag to orbit and zoom in 3D. Camera overlays are manually positioned and do not measure your room or detect surfaces. Verify real dimensions before purchase.'
                  : 'A pre-authored, captioned tutorial for the prototype product. Controls and specifications are illustrative.'}
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
                    download="cosmic-together-preview.jpg"
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
                  : 'LEARN IT'}
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
            <div className="option-row">
              <span>
                Preview finish <strong>{color}</strong>
              </span>
            </div>
            <div className="swatches large">
              {p.colors.map((c) => (
                <button
                  key={c}
                  aria-label={'Preview ' + c}
                  aria-pressed={color === c}
                  className={color === c ? 'chosen' : ''}
                  style={{ background: colorHex[c] }}
                  onClick={() => chooseColor(c)}
                />
              ))}
            </div>
            <div className="ar-note">
              <Sparkles size={17} />
              <p>
                {p.category === 'fashion'
                  ? 'Stand back so your shoulders and hips are visible. Bright, even lighting helps tracking.'
                  : p.category === 'home'
                    ? 'Keep the product’s scale fixed, then use rotation and position to explore the scene.'
                    : 'Follow the translucent hand. Every gesture has a caption, and you can pause at any time.'}
              </p>
            </div>
            <AddToBag
              key={color}
              product={{ ...p, color }}
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
