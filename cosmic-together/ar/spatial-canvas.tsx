'use client';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeGhostHand } from './models';
import { loadProduct, disposeObject } from './load-product';
import { alignHandToControl } from './hand-guide';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
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
  color: string;
  camera: boolean;
  pose?: React.RefObject<PoseAnchor | null>;
  rotation: number;
  position: number;
  tutorial: number;
  playing: boolean;
  ghost: boolean;
  onError: () => void;
  onReady: () => void;
};
export const SpatialCanvas = forwardRef<SpatialHandle, Props>(
  function SpatialCanvas(
    {
      product,
      color,
      camera,
      pose,
      rotation,
      position,
      tutorial,
      playing,
      ghost,
      onError,
      onReady,
    },
    ref,
  ) {
    const host = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement | null>(null);
    const resetView = useRef<() => void>(() => {});
    const current = useRef({ rotation, position, tutorial, playing, ghost });
    useEffect(() => {
      current.current = { rotation, position, tutorial, playing, ghost };
    }, [rotation, position, tutorial, playing, ghost]);
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const environment = new RoomEnvironment();
      const environmentMap = pmrem.fromScene(environment, 0.04);
      scene.environment = environmentMap.texture;
      scene.environmentIntensity = 0.8;
      environment.dispose();
      pmrem.dispose();
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
            : product.category === 'gadgets'
              ? 0.6
              : 1.1,
        tracked
          ? 0
          : product.category === 'home'
            ? 1.4
            : product.category === 'gadgets'
              ? 0.32
              : 0.15,
        tracked
          ? 1000
          : product.category === 'home'
            ? 3.3
            : product.category === 'gadgets'
              ? 0.8
              : 1.6,
      );
      const center =
        product.model === 'lamp'
          ? 0.77
          : product.model === 'chair'
            ? 0.43
            : product.model === 'speaker'
              ? 0.12
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
          : product.category === 'gadgets'
            ? 0.45
            : 1;
      controls.maxDistance = product.category === 'home' ? 7 : 3;
      controls.maxPolarAngle = Math.PI * 0.85;
      if (!camera) controls.update();
      controls.saveState();
      resetView.current = () => {
        if (!camera) controls.reset();
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
      ground.position.y =
        product.category === 'home' || product.model === 'speaker'
          ? 0
          : product.category === 'fashion'
            ? -0.42
            : -0.17;
      ground.receiveShadow = true;
      ground.visible = !tracked;
      scene.add(ground);
      const { hand, joints, tip } = makeGhostHand();
      scene.add(hand);
      hand.visible = false;
      let tick = 0;
      let previous = performance.now();
      let disposed = false;
      let ready = false;
      const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      function resize() {
        if (disposed || !assetReady) return;
        const w = el.clientWidth || 600,
          h = el.clientHeight || 560;
        renderer.setSize(w, h);
        if (view instanceof THREE.PerspectiveCamera) {
          view.aspect = w / h;
          // Fit the full object at both desktop and portrait aspect ratios.
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
      void loadProduct(product, color)
        .then((loaded) => {
          if (disposed) {
            disposeObject(loaded);
            return;
          }
          productGroup.add(loaded);
          bounds.setFromObject(productGroup);
          if (product.category === 'gadgets') {
            bounds.max.x += 0.17;
            controls.target.x = 0.045;
          }
          ground.position.y = bounds.min.y - 0.002;
          assetReady = true;
          resize();
        })
        .catch(() => {
          if (!disposed) onError();
        });
      const loop = () => {
        if (disposed) return;
        const now = performance.now();
        const delta = Math.min(0.05, (now - previous) / 1000);
        previous = now;
        const s = current.current;
        if (s.playing && !reduce) tick += delta;
        productGroup.rotation.y = THREE.MathUtils.degToRad(s.rotation);
        productGroup.position.x = s.position / 100;
        hand.visible = product.category === 'gadgets' && s.ghost;
        const phase = (Math.sin(tick * 1.9) + 1) / 2;
        if (tracked) {
          const anchor = pose?.current;
          if (anchor?.visible) {
            productGroup.visible = true;
            const scale = anchor.width / 0.57;
            productGroup.scale.setScalar(scale);
            productGroup.position.set(anchor.x, anchor.y, 0);
            productGroup.rotation.z = anchor.angle;
            productGroup.rotation.y = 0;
          } else productGroup.visible = false;
        }
        if (product.category === 'gadgets' && assetReady) {
          const ear = productGroup.getObjectByName('right-ear');
          if (ear) ear.rotation.z = s.tutorial === 2 ? -phase * 1.0 : 0;
          joints.forEach((joint, i) => {
            joint.rotation.x = i === 0 ? -0.08 : -1.05;
          });
          const anchor = productGroup.getObjectByName('control-' + s.tutorial);
          if (anchor) {
            productGroup.updateMatrixWorld(true);
            alignHandToControl(
              hand,
              tip,
              anchor,
              0.006 + (s.tutorial === 2 ? 0.008 : (1 - phase) * 0.035),
            );
          } else hand.visible = false;
        }
        if (!camera) controls.update();
        renderer.render(scene, view);
        if (!ready && assetReady) {
          ready = true;
          onReady();
        }
      };
      const contextLost = (event: Event) => {
        event.preventDefault();
        onError();
      };
      renderer.domElement.addEventListener('webglcontextlost', contextLost);
      renderer.setAnimationLoop(loop);
      return () => {
        disposed = true;
        renderer.setAnimationLoop(null);
        observer.disconnect();
        controls.dispose();
        disposeObject(scene);
        environmentMap.dispose();
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
    }, [product, color, camera, pose, onError, onReady]);
    return (
      <div
        className="spatial-canvas"
        ref={host}
        aria-label={`Interactive 3D ${product.name}`}
      />
    );
  },
);
