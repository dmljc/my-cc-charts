import {Matrix4, Object3D, Scene, Vector2} from 'three';
import {LabelViewport} from './LabelViewport';

export interface LabelFrame {
  scene: Scene;
  width: number;
  height: number;
  active: boolean;
  cameraVersion: number;
  cameraLayerMask: number;
  viewProjection: Matrix4;
  resolveTarget?: (id: string) => Object3D;
  invalidateTargets?: () => void;
}

/** One snapshot per viewport/frame; consumers never repeat camera multiplication. */
export class LabelFrameState implements LabelFrame {
  scene: Scene;
  width = 0;
  height = 0;
  active = false;
  cameraVersion = 0;
  cameraLayerMask = 0;
  viewProjection = new Matrix4();
  resolveTarget: (id: string) => Object3D;
  invalidateTargets: () => void;
  private next = new Matrix4();
  private size = new Vector2();

  capture(viewport: LabelViewport, pageVisible = true) {
    this.active = viewport.isActive && pageVisible && !viewport.disposed;
    if (!this.active) return this;
    viewport.webglRenderer.getSize(this.size);
    this.active = this.size.x > 0 && this.size.y > 0;
    if (!this.active) return this;
    this.next.multiplyMatrices(viewport.camera.projectionMatrix, viewport.camera.matrixWorldInverse);
    if (this.scene !== viewport.scene || this.width !== this.size.x || this.height !== this.size.y || !this.viewProjection.equals(this.next)) this.cameraVersion++;
    this.scene = viewport.scene;
    this.width = this.size.x;
    this.height = this.size.y;
    this.cameraLayerMask = viewport.camera.layers.mask;
    this.viewProjection.copy(this.next);
    return this;
  }
}
