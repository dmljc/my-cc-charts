import {Raycaster, Vector2} from 'three';
import {LabelViewport} from './LabelViewport';
import {LabelPlacement} from './LabelViewportBridge';

/** Execute picking in view.js, reusing its Three instance instead of bundling Three into metadata. */
export function pickLabelPlacement(viewport: LabelViewport, clientX: number, clientY: number): LabelPlacement | null {
  if (!viewport.isActive || viewport.disposed) return null;
  const surface = (viewport.webglRenderer as any).domElement || viewport.dom;
  const rect = surface.getBoundingClientRect();
  if (!rect.width || !rect.height || clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
  const ray = new Raycaster(); ray.layers.mask = viewport.camera.layers.mask;
  viewport.camera.updateMatrixWorld(); viewport.scene.updateMatrixWorld(true);
  ray.setFromCamera(new Vector2((clientX - rect.left) / rect.width * 2 - 1, 1 - (clientY - rect.top) / rect.height * 2), viewport.camera);
  const hit = ray.intersectObjects(viewport.scene.children, true).find(candidate => {
    if (!(candidate.object as any).isMesh) return false;
    for (let object = candidate.object; object; object = object.parent) {if (!object.visible) return false;}
    const projected = candidate.point.clone().project(viewport.camera);
    return projected.z >= -1 && projected.z <= 1;
  });
  if (!hit) return null;
  const local = hit.object.worldToLocal(hit.point.clone());
  if (![local.x, local.y, local.z].every(Number.isFinite)) return null;
  return {target: hit.object.uuid, sceneId: viewport.scene.uuid, position: local.toArray() as [number, number, number]};
}
