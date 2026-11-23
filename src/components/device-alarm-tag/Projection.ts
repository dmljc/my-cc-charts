import {Matrix4, Object3D, Scene, Vector4} from 'three';
import {LabelViewport} from '../../utils/render/src/labels/LabelViewport';
import {LabelFrame, LabelFrameState} from '../../utils/render/src/labels/LabelFrame';
import {SceneLabelItem} from './types';
import {labelSize} from './model';

interface Layout {
  target: string; sceneId: string; visible: boolean;
  x: number; y: number; z: number; offsetX: number; offsetY: number;
  centerX: number; centerY: number; width: number; height: number;
}

interface Entry {
  id: string;
  layout: Layout;
  element: HTMLElement;
  target?: Object3D;
  matrix: Matrix4;
  positioned: boolean;
  lookupAttempted?: boolean;
  projectedVisible?: boolean;
  transform?: string;
  visibility?: string;
}

function visibilityInScene(object: Object3D, scene: Scene) {
  let visible = true;
  for (let current = object; current; current = current.parent) {
    if (!current.visible) visible = false;
    if (current === scene) return visible ? 1 : 0;
  }
  return -1;
}

/** Owns only positions. React owns the image/text nodes inside each label. */
export class LabelProjection {
  private entries: Entry[] = [];
  private byId = new Map<string, Entry>();
  targetIds: ReadonlySet<string> = new Set<string>();
  private scene: Scene;
  private point = new Vector4();
  private cameraVersion = -1;
  private standaloneFrame: LabelFrameState;
  private frame = 0;
  private active: boolean;

  constructor(items: SceneLabelItem[], elements: Map<string, HTMLElement>, private root: HTMLElement, width = 180, height = 90) {
    this.reconcile(items, elements, width, height);
  }

  /** Keep geometry caches when only status/image/text data changes. */
  reconcile(items: SceneLabelItem[], elements: Map<string, HTMLElement>, width = 180, height = 90) {
    const next: Entry[] = [];
    const ids = new Set<string>();
    let targetsChanged = false;
    for (const item of items) {
      const element = elements.get(item.id);
      if (!element) continue;
      ids.add(item.id);
      let entry = this.byId.get(item.id);
      if (!entry || entry.element !== element) {
        entry = {id: item.id, element, layout: null, matrix: new Matrix4(), positioned: false};
        this.byId.set(item.id, entry);
        targetsChanged = true;
      }
      const old = entry.layout, p = item.position;
      const target = item.target || '', sceneId = item.sceneId || '', visible = item.visible !== false;
      const x = p?.[0] ?? 0, y = p?.[1] ?? 0, z = p?.[2] ?? 0;
      const offsetX = item.offsetX || 0, offsetY = item.offsetY || 0;
      const centerX = item.centerX ?? 0.5, centerY = item.centerY ?? 1;
      const itemWidth = labelSize(item.width, width), itemHeight = labelSize(item.height, height);
      if (!old || old.target !== target || old.sceneId !== sceneId || old.visible !== visible || old.x !== x || old.y !== y || old.z !== z || old.offsetX !== offsetX || old.offsetY !== offsetY || old.centerX !== centerX || old.centerY !== centerY || old.width !== itemWidth || old.height !== itemHeight) {
        if (!old || old.target !== target) {entry.target = undefined; entry.lookupAttempted = false; targetsChanged = true;}
        entry.layout = {target, sceneId, visible, x, y, z, offsetX, offsetY, centerX, centerY, width: itemWidth, height: itemHeight};
        entry.positioned = false;
      }
      next.push(entry);
    }
    this.byId.forEach((entry, id) => {if (!ids.has(id)) {this.byId.delete(id); targetsChanged = true;}});
    this.entries = next;
    if (targetsChanged) this.targetIds = new Set(next.map(entry => entry.layout.target).filter(Boolean));
    return targetsChanged;
  }

  private show(entry: Entry, visible: boolean) {
    const value = visible ? 'visible' : 'hidden';
    if (entry.visibility !== value) {
      entry.element.style.visibility = value;
      entry.visibility = value;
    }
  }

  update(viewport: LabelViewport, pageVisible = true): number {
    if (!this.standaloneFrame) this.standaloneFrame = new LabelFrameState();
    return this.updateFrame(this.standaloneFrame.capture(viewport, pageVisible));
  }

  updateFrame(frame: LabelFrame): number {
    this.frame++;
    const {width, height, active} = frame;
    if (this.active !== active) {
      // A child's explicit visibility:visible can override a hidden ancestor.
      // Display none also removes all children from hit testing/accessibility.
      this.root.style.display = active ? '' : 'none';
      this.root.style.visibility = active ? 'visible' : 'hidden';
      this.active = active;
    }
    if (!active) return 0;
    const sceneChanged = this.scene !== frame.scene;
    const changed = sceneChanged || this.cameraVersion !== frame.cameraVersion;
    this.cameraVersion = frame.cameraVersion;
    this.scene = frame.scene;
    let writes = 0;
    for (const entry of this.entries) {
      const item = entry.layout;
      if (sceneChanged) {entry.target = undefined; entry.positioned = false; entry.lookupAttempted = false;}
      if (!item.visible || (item.sceneId && item.sceneId !== this.scene.uuid)) {this.show(entry, false); continue;}
      if (item.target) {
        if (frame.resolveTarget) {
          const target = frame.resolveTarget(item.target);
          if (entry.target !== target) {entry.target = target; entry.positioned = false;}
        } else if (entry.target && visibilityInScene(entry.target, this.scene) < 0) {entry.target = undefined; entry.positioned = false; entry.lookupAttempted = false;}
        // Retry missing dynamically-created anchors at most once per 60 frames.
        if (!frame.resolveTarget && !entry.target && (!entry.lookupAttempted || this.frame % 60 === 0)) {
          entry.target = this.scene.getObjectByProperty('uuid', item.target);
          // Registration can precede the scene's first rendered frame.
          entry.target?.updateWorldMatrix(true, false);
          entry.lookupAttempted = true;
        }
        const state = entry.target ? visibilityInScene(entry.target, this.scene) : -1;
        if (entry.target && state < 0) frame.invalidateTargets?.();
        if (!entry.target || state !== 1 || !(entry.target.layers.mask & frame.cameraLayerMask)) {this.show(entry, false); continue;}
      }
      if (!changed && entry.positioned && (!entry.target || entry.matrix.equals(entry.target.matrixWorld))) {this.show(entry, entry.projectedVisible); continue;}
      this.point.set(item.x, item.y, item.z, 1);
      if (entry.target) {
        entry.matrix.copy(entry.target.matrixWorld);
        this.point.applyMatrix4(entry.matrix);
      }
      this.point.applyMatrix4(frame.viewProjection);
      // A wall does not hide a label; the camera's back/near/far planes do.
      const w = this.point.w;
      const z = this.point.z / w;
      const x = Math.round(((this.point.x / w + 1) * width / 2 + item.offsetX) * 10) / 10;
      const y = Math.round(((1 - this.point.y / w) * height / 2 + item.offsetY) * 10) / 10;
      const left = x - item.centerX * item.width, top = y - item.centerY * item.height;
      const valid = w > 0.000001 && Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z) && z >= -1 && z <= 1 && left <= width && left + item.width >= 0 && top <= height && top + item.height >= 0;
      entry.projectedVisible = valid;
      this.show(entry, valid);
      entry.positioned = true;
      if (!valid) continue;
      const transform = `translate(${x}px,${y}px) translate(${-100 * item.centerX}%,${-100 * item.centerY}%)`;
      if (entry.transform !== transform) {entry.element.style.transform = transform; entry.transform = transform; writes++;}
    }
    return writes;
  }
}
