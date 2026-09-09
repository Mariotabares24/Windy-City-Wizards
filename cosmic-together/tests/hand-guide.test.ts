import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { alignHandToControl } from '../ar/hand-guide';
import { makeGhostHand } from '../ar/models';

test('the posed index fingertip stays at the control after product rotation, movement, scale and ear folding', () => {
  for (const normal of [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
  ]) {
    const scene = new THREE.Scene(),
      product = new THREE.Group(),
      ear = new THREE.Group(),
      anchor = new THREE.Object3D();
    scene.add(product);
    product.add(ear);
    ear.add(anchor);
    anchor.position.set(0.047, -0.127, 0.025);
    anchor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    const { hand, joints, tip } = makeGhostHand();
    joints.forEach((joint, i) => (joint.rotation.x = i === 0 ? -0.08 : -1.05));
    for (const angle of [-Math.PI, -0.7, 0, 0.9, Math.PI])
      for (const fold of [0, -0.5, -1])
        for (const scale of [0.7, 1, 1.4]) {
          product.rotation.y = angle;
          product.position.set(0.3, -0.07, 0.2);
          product.scale.setScalar(scale);
          ear.rotation.z = fold;
          alignHandToControl(hand, tip, anchor, 0.009);
          scene.updateMatrixWorld(true);
          const actual = tip.getWorldPosition(new THREE.Vector3());
          const expected = anchor.localToWorld(new THREE.Vector3(0, 0.009, 0));
          assert(actual.distanceTo(expected) < 1e-8);
          assert.equal(hand.parent, anchor);
        }
  }
});
