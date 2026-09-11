'use client';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadProduct, disposeObject } from './load-product';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import type { Product } from '@/lib/catalog';
export type PoseAnchor = {
  x: number;
  y: number;
  width: number;
  angle: number;
  visible: boolean;
};
export type SpatialHandle = {
  capture: () => HTMLCanvasElement | null;
  reset: () => void;
};
type Props = {
  product: Product;
  camera: boolean;
  pose?: React.RefObject<PoseAnchor | null>;
  rotation: number;
  position: number;
  onError: () => void;
  onReady: () => void;
  // Reports drag/twist back so the accessible sliders stay in sync (camera mode).
  onManipulate?: (next: { rotation?: number; position?: number }) => void;
};
export const SpatialCanvas = forwardRef<SpatialHandle, Props>(
  function SpatialCanvas(
    {
      product,
      camera,
      pose,
      rotation,
      position,
      onError,
      onReady,
      onManipulate,
    },
    ref,
  ) {
    const host = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement | null>(null);
    const resetView = useRef<() => void>(() => {});
    const current = useRef({ rotation, position });
    useEffect(() => {
      current.current = { rotation, position };
    }, [rotation, position]);
    // Keep the manipulate callback current without re-running the scene effect.
    const manipulate = useRef(onManipulate);
    useEffect(() => {
      manipulate.current = onManipulate;
    }, [onManipulate]);
    useImperativeHandle(
      ref,
      () => ({
        capture: () => canvas.current,
        reset: () => resetView.current(),
      }),
      [],
    );
    useEffect(() => {
      if (!host.current) return;
      const el = host.current;
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: window.devicePixelRatio < 2,
          preserveDrawingBuffer: true,
        });
      } catch {
        onError();
        return;
      }
      canvas.current = renderer.domElement;
      let disposed = false;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnvironment = new RoomEnvironment();
      const roomMap = pmrem.fromScene(roomEnvironment, 0.04);
      roomEnvironment.dispose();
      scene.environment = roomMap.texture;
      scene.environmentIntensity = 0.9;
      let hdrTarget: THREE.WebGLRenderTarget | null = null;
      new HDRLoader().load(
        '/env/studio.hdr',
        (hdr) => {
          if (disposed) {
            hdr.dispose();
            return;
          }
          hdr.mapping = THREE.EquirectangularReflectionMapping;
          hdrTarget = pmrem.fromEquirectangular(hdr);
          hdr.dispose();
          scene.environment = hdrTarget.texture;
          scene.environmentIntensity = 1;
        },
        undefined,
        () => {},
      );
      const initialWidth = el.clientWidth || 600;
      const initialHeight = el.clientHeight || 560;
      const tracked = camera && product.category === 'fashion';
      const view = tracked
        ? new THREE.OrthographicCamera(
            -initialWidth / 2,
            initialWidth / 2,
            initialHeight / 2,
            -initialHeight / 2,
            0.1,
            3000,
          )
        : new THREE.PerspectiveCamera(
            38,
            initialWidth / initialHeight,
            0.01,
            100,
          );
      view.position.set(
        tracked
          ? 0
          : product.category === 'home'
            ? 2.4
            : product.model === 'watch'
              ? 0.35
              : product.category === 'gadgets'
                ? 0.6
                : 1.1,
        tracked
          ? 0
          : product.category === 'home'
            ? 1.4
            : product.model === 'watch'
              ? 0.12
              : product.category === 'gadgets'
                ? 0.32
                : 0.15,
        tracked
          ? 1000
          : product.category === 'home'
            ? 3.3
            : product.model === 'watch'
              ? 0.45
              : product.category === 'gadgets'
                ? 0.8
                : 1.6,
      );
      const center =
        product.model === 'chair'
          ? 0.43
          : product.model === 'watch'
            ? 0.04
            : product.model === 'garment'
              ? 0.45
              : 0;
      view.lookAt(0, tracked ? 0 : center, 0);
      const controls = new OrbitControls(view, renderer.domElement);
      controls.target.set(0, center, 0);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.enabled = !camera;
      controls.minDistance =
        product.category === 'home'
          ? 1.7
          : product.model === 'watch'
            ? 0.2
            : product.category === 'gadgets'
              ? 0.45
              : 1;
      controls.maxDistance = product.category === 'home' ? 7 : 3;
      controls.maxPolarAngle = Math.PI * 0.85;
      if (!camera) controls.update();
      controls.saveState();
      // Shared placement transform. Sliders, drag, pinch and twist all write
      // here so the render loop has a single source of truth.
      const manip = {
        rotY: THREE.MathUtils.degToRad(current.current.rotation),
        x: current.current.position / 100,
        z: 0,
        scale: 1,
        offX: 0,
        offY: 0,
      };
      let lastRotation = current.current.rotation;
      let lastPosition = current.current.position;
      resetView.current = () => {
        if (!camera) {
          controls.reset();
          return;
        }
        manip.rotY = 0;
        manip.x = 0;
        manip.z = 0;
        manip.scale = 1;
        manip.offX = 0;
        manip.offY = 0;
        lastRotation = 0;
        lastPosition = 0;
      };
      const productGroup = new THREE.Group();
      let assetReady = false;
      scene.add(productGroup);
      const bounds = new THREE.Box3();
      const ambient = new THREE.HemisphereLight('#fff8ed', '#3f4a42', 1.8);
      scene.add(ambient);
      const key = new THREE.DirectionalLight('#fff2e4', 2.7);
      key.position.set(3, 5, 4);
      key.castShadow = !tracked;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.normalBias = 0.03;
      scene.add(key);
      const fill = new THREE.DirectionalLight('#dce8ec', 0.9);
      fill.position.set(-3, 2, -3);
      scene.add(fill);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.ShadowMaterial({ opacity: 0.22 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      ground.receiveShadow = true;
      ground.visible = !tracked;
      scene.add(ground);
      let ready = false;
      function resize() {
        if (disposed || !assetReady) return;
        const w = el.clientWidth || 600,
          h = el.clientHeight || 560;
        renderer.setSize(w, h);
        if (view instanceof THREE.PerspectiveCamera) {
          view.aspect = w / h;
          const verticalFov = THREE.MathUtils.degToRad(view.fov);
          const horizontalFov =
            2 * Math.atan(Math.tan(verticalFov / 2) * view.aspect);
          const direction = view.position
            .clone()
            .sub(controls.target)
            .normalize();
          const right = new THREE.Vector3()
            .crossVectors(view.up, direction)
            .normalize();
          const up = new THREE.Vector3()
            .crossVectors(direction, right)
            .normalize();
          let distance = 0;
          for (const x of [bounds.min.x, bounds.max.x])
            for (const y of [bounds.min.y, bounds.max.y])
              for (const z of [bounds.min.z, bounds.max.z]) {
                const point = new THREE.Vector3(x, y, z).sub(controls.target);
                distance = Math.max(
                  distance,
                  Math.abs(point.dot(right)) / Math.tan(horizontalFov / 2) +
                    point.dot(direction),
                  Math.abs(point.dot(up)) / Math.tan(verticalFov / 2) +
                    point.dot(direction),
                );
              }
          distance *= 1.15;
          view.position
            .sub(controls.target)
            .normalize()
            .multiplyScalar(distance)
            .add(controls.target);
          controls.maxDistance = Math.max(
            product.category === 'home' ? 7 : 3,
            distance * 2,
          );
          controls.minDistance = Math.min(
            controls.minDistance,
            distance * 0.55,
          );
          controls.saveState();
        } else {
          view.left = -w / 2;
          view.right = w / 2;
          view.top = h / 2;
          view.bottom = -h / 2;
        }
        view.updateProjectionMatrix();
      }
      const observer = new ResizeObserver(resize);
      observer.observe(el);
      void loadProduct(product)
        .then((loaded) => {
          if (disposed) {
            disposeObject(loaded);
            return;
          }
          productGroup.add(loaded);
          bounds.setFromObject(productGroup);
          ground.position.y = bounds.min.y - 0.002;
          assetReady = true;
          resize();
        })
        .catch(() => {
          if (!disposed) onError();
        });
      const loop = () => {
        if (disposed) return;
        const s = current.current;
        if (s.rotation !== lastRotation) {
          manip.rotY = THREE.MathUtils.degToRad(s.rotation);
          lastRotation = s.rotation;
        }
        if (s.position !== lastPosition) {
          manip.x = s.position / 100;
          lastPosition = s.position;
        }
        if (tracked) {
          const anchor = pose?.current;
          if (anchor?.visible) {
            productGroup.visible = true;
            const scale = (anchor.width / 0.57) * manip.scale;
            productGroup.scale.setScalar(scale);
            productGroup.position.set(
              anchor.x + manip.offX,
              anchor.y + manip.offY,
              0,
            );
            productGroup.rotation.z = anchor.angle;
            productGroup.rotation.y = 0;
          } else productGroup.visible = false;
        } else {
          productGroup.rotation.y = manip.rotY;
          productGroup.position.set(manip.x, 0, manip.z);
          productGroup.scale.setScalar(manip.scale);
        }
        if (!camera) controls.update();
        renderer.render(scene, view);
        if (!ready && assetReady) {
          ready = true;
          onReady();
        }
      };
      // Direct manipulation (camera AR): drag = move, pinch = scale,
      // twist = rotate; wheel = scale, shift/right-drag = rotate for mouse.
      const clampN = (v: number, lo: number, hi: number) =>
        Math.min(hi, Math.max(lo, v));
      const raycaster = new THREE.Raycaster();
      const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const pointers = new Map<number, { x: number; y: number }>();
      let drag: {
        grabX: number;
        grabZ: number;
        startX: number;
        startY: number;
        baseOffX: number;
        baseOffY: number;
        baseRot: number;
        rotate: boolean;
      } | null = null;
      let pinch: {
        dist: number;
        angle: number;
        scale: number;
        rotY: number;
      } | null = null;
      const planePoint = (clientX: number, clientY: number) => {
        const rect = renderer.domElement.getBoundingClientRect();
        raycaster.setFromCamera(
          new THREE.Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1,
          ),
          view,
        );
        dragPlane.constant = -ground.position.y;
        const point = new THREE.Vector3();
        return raycaster.ray.intersectPlane(dragPlane, point) ? point : null;
      };
      const gap = () => {
        const [a, b] = [...pointers.values()];
        return {
          dist: Math.hypot(a.x - b.x, a.y - b.y),
          angle: Math.atan2(b.y - a.y, b.x - a.x),
        };
      };
      const startDrag = (clientX: number, clientY: number, rotate: boolean) => {
        const hit = tracked ? null : planePoint(clientX, clientY);
        drag = {
          grabX: hit ? manip.x - hit.x : 0,
          grabZ: hit ? manip.z - hit.z : 0,
          startX: clientX,
          startY: clientY,
          baseOffX: manip.offX,
          baseOffY: manip.offY,
          baseRot: manip.rotY,
          rotate,
        };
      };
      const pushSliders = () => {
        const rotation = Math.round(THREE.MathUtils.radToDeg(manip.rotY));
        const position = Math.round(clampN(manip.x * 100, -80, 80));
        lastRotation = rotation;
        lastPosition = position;
        manipulate.current?.({ rotation, position });
      };
      const onPointerDown = (e: PointerEvent) => {
        renderer.domElement.setPointerCapture?.(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 2) {
          const g = gap();
          pinch = {
            dist: g.dist,
            angle: g.angle,
            scale: manip.scale,
            rotY: manip.rotY,
          };
          drag = null;
        } else if (pointers.size === 1) {
          startDrag(
            e.clientX,
            e.clientY,
            e.pointerType === 'mouse' && (e.shiftKey || e.button === 2),
          );
        }
      };
      const onPointerMove = (e: PointerEvent) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && pointers.size >= 2) {
          const g = gap();
          manip.scale = clampN(
            pinch.scale * (g.dist / (pinch.dist || 1)),
            0.4,
            2.6,
          );
          if (!tracked) manip.rotY = pinch.rotY + (g.angle - pinch.angle);
          return;
        }
        if (!drag) return;
        if (tracked) {
          manip.offX = drag.baseOffX + (e.clientX - drag.startX);
          manip.offY = drag.baseOffY - (e.clientY - drag.startY);
        } else if (drag.rotate) {
          manip.rotY = drag.baseRot + (e.clientX - drag.startX) * 0.01;
        } else {
          const hit = planePoint(e.clientX, e.clientY);
          if (hit) {
            manip.x = clampN(hit.x + drag.grabX, -0.8, 0.8);
            manip.z = clampN(hit.z + drag.grabZ, -1.6, 1.2);
          }
        }
      };
      const endPointer = (e: PointerEvent) => {
        if (!pointers.delete(e.pointerId)) return;
        if (pointers.size < 2) pinch = null;
        if (pointers.size === 0) {
          if (drag) {
            drag = null;
            pushSliders();
          }
        } else if (pointers.size === 1) {
          const p = [...pointers.values()][0];
          startDrag(p.x, p.y, false);
        }
      };
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        manip.scale = clampN(manip.scale * (1 - e.deltaY * 0.001), 0.4, 2.6);
      };
      const onContextMenu = (e: Event) => e.preventDefault();
      if (camera) {
        const dom = renderer.domElement;
        dom.style.touchAction = 'none';
        dom.addEventListener('pointerdown', onPointerDown);
        dom.addEventListener('pointermove', onPointerMove);
        dom.addEventListener('pointerup', endPointer);
        dom.addEventListener('pointercancel', endPointer);
        dom.addEventListener('wheel', onWheel, { passive: false });
        dom.addEventListener('contextmenu', onContextMenu);
      }
      const contextLost = (event: Event) => {
        event.preventDefault();
        onError();
      };
      renderer.domElement.addEventListener('webglcontextlost', contextLost);
      renderer.setAnimationLoop(loop);
      return () => {
        disposed = true;
        renderer.setAnimationLoop(null);
        if (camera) {
          const dom = renderer.domElement;
          dom.removeEventListener('pointerdown', onPointerDown);
          dom.removeEventListener('pointermove', onPointerMove);
          dom.removeEventListener('pointerup', endPointer);
          dom.removeEventListener('pointercancel', endPointer);
          dom.removeEventListener('wheel', onWheel);
          dom.removeEventListener('contextmenu', onContextMenu);
        }
        observer.disconnect();
        controls.dispose();
        disposeObject(scene);
        roomMap.dispose();
        hdrTarget?.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.removeEventListener(
          'webglcontextlost',
          contextLost,
        );
        renderer.forceContextLoss();
        renderer.domElement.remove();
        canvas.current = null;
        resetView.current = () => {};
      };
    }, [product, camera, pose, onError, onReady]);
    return (
      <div
        className="spatial-canvas"
        ref={host}
        aria-label={`Interactive 3D ${product.name}`}
      />
    );
  },
);
