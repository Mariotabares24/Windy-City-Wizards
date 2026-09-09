import * as THREE from 'three';
/** Solve the palm from the posed index fingertip, in the control's local frame. */
export function alignHandToControl(
  hand: THREE.Group,
  tip: THREE.Object3D,
  anchor: THREE.Object3D,
  clearance: number,
) {
  if (hand.parent !== anchor) anchor.add(hand);
  hand.position.set(0, 0, 0);
  hand.rotation.set(0, 0, Math.PI);
  hand.scale.setScalar(0.68);
  hand.updateMatrixWorld(true);
  const fingertip = anchor.worldToLocal(
    tip.getWorldPosition(new THREE.Vector3()),
  );
  hand.position.copy(new THREE.Vector3(0, clearance, 0).sub(fingertip));
}
