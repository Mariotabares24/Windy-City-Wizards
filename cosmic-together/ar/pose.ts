import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { PoseAnchor } from './spatial-canvas';
export async function startPose(
  video: HTMLVideoElement,
  viewport: HTMLElement,
  onPose: (pose: PoseAnchor | null) => void,
  onStatus: (status: string) => void,
) {
  const vision = await FilesetResolver.forVisionTasks('/tracking/wasm');
  const detector = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/tracking/pose_landmarker_lite.task',
      delegate: 'CPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  let stopped = false;
  let frame = 0;
  let lastTime = -1;
  let smoothed: PoseAnchor | null = null;
  let lastGood = 0;
  let lastStatus = '';
  const status = (s: string) => {
    if (lastStatus !== s) {
      lastStatus = s;
      onStatus(s);
    }
  };
  function detect() {
    if (stopped) return;
    if (video.readyState >= 2 && video.currentTime !== lastTime) {
      lastTime = video.currentTime;
      try {
        const r = detector.detectForVideo(video, performance.now());
        const p = r.landmarks[0];
        if (p && [11, 12, 23, 24].every((i) => (p[i].visibility ?? 0) > 0.45)) {
          const w = viewport.clientWidth,
            h = viewport.clientHeight;
          const scale = Math.max(w / video.videoWidth, h / video.videoHeight);
          const offsetX = (video.videoWidth * scale - w) / 2,
            offsetY = (video.videoHeight * scale - h) / 2;
          const toScreen = (i: number) => ({
            x: w - (p[i].x * video.videoWidth * scale - offsetX),
            y: p[i].y * video.videoHeight * scale - offsetY,
          });
          const a = toScreen(11),
            b = toScreen(12),
            hipA = toScreen(23),
            hipB = toScreen(24);
          const shoulderY = (a.y + b.y) / 2,
            hipY = (hipA.y + hipB.y) / 2;
          const next: PoseAnchor = {
            x: (a.x + b.x) / 2 - w / 2,
            y: h / 2 - (shoulderY * 0.52 + hipY * 0.48),
            width: Math.hypot(a.x - b.x, a.y - b.y) * 1.17,
            angle: Math.atan2(-(a.y - b.y), a.x - b.x),
            visible: true,
          };
          if (Math.abs(next.angle) > Math.PI / 2)
            next.angle += next.angle > 0 ? -Math.PI : Math.PI;
          if (smoothed) {
            for (const k of ['x', 'y', 'width', 'angle'] as const)
              next[k] = smoothed[k] + (next[k] - smoothed[k]) * 0.24;
          }
          smoothed = next;
          lastGood = performance.now();
          onPose(next);
          status('Shoulders tracked · approximate fit');
        } else if (performance.now() - lastGood > 700) {
          onPose(null);
          status('Step back until your shoulders and hips are visible.');
        }
      } catch {
        onPose(null);
        status('Tracking paused. Try the camera-free 3D preview.');
      }
    }
    frame = window.setTimeout(detect, 66);
  }
  detect();
  return () => {
    stopped = true;
    clearTimeout(frame);
    detector.close();
    onPose(null);
  };
}
