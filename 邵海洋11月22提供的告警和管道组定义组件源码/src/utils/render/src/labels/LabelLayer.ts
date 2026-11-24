import {Object3D, Scene} from 'three';
import {LabelFrame, LabelFrameState} from './LabelFrame';
import {LabelViewport} from './LabelViewport';

export interface LabelLayerConsumer {
  readonly targetIds: ReadonlySet<string>;
  updateFrame(frame: LabelFrame): number;
}

const layers = new WeakMap<LabelViewport, SharedLabelLayer>();

/** Runtime HTML layer. It does not borrow CSS2D objects or their mutable DOM. */
export class SharedLabelLayer {
  readonly element: HTMLDivElement;
  private references = 0;
  private consumers = new Set<LabelLayerConsumer>();
  private stopFrame: () => void;
  private owner: Document;
  private frame = new LabelFrameState();
  private scene: Scene;
  private targets = new Map<string, Object3D>();
  private missing = false;
  private targetsDirty = true;
  private ticks = 0;
  private displayed: boolean;

  constructor(private viewport: LabelViewport, readonly container: HTMLElement) {
    this.owner = container.ownerDocument;
    this.element = this.owner.createElement('div');
    this.element.setAttribute('data-scene-label-layer', 'true');
    Object.assign(this.element.style, {position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', display: 'none'});
    // No transform/opacity/z-index: groups keep their configured stacking order.
    container.appendChild(this.element);
    this.frame.resolveTarget = id => this.targets.get(id);
    this.frame.invalidateTargets = () => {this.targetsDirty = true;};
    this.owner.addEventListener('visibilitychange', this.onVisibility);
    this.stopFrame = viewport.subscribeFrame(this.update);
  }

  retain() {this.references++;}

  release() {
    if (--this.references > 0) return;
    this.stopFrame();
    this.owner.removeEventListener('visibilitychange', this.onVisibility);
    this.consumers.clear();
    this.targets.clear();
    this.element.remove();
    if (layers.get(this.viewport) === this) layers.delete(this.viewport);
  }

  subscribe(consumer: LabelLayerConsumer) {
    this.consumers.add(consumer);
    this.targetsDirty = true;
    return () => {this.consumers.delete(consumer); this.targetsDirty = true;};
  }

  invalidateTargets() {this.targetsDirty = true;}

  private onVisibility = () => {
    // Wait for the next native rendered frame before showing fresh positions.
    if (this.owner.hidden) this.update();
  };

  private show(displayed: boolean) {
    if (this.displayed === displayed) return;
    this.element.style.display = displayed ? '' : 'none';
    this.displayed = displayed;
  }

  private collectTargets(sceneChanged: boolean) {
    if (!sceneChanged && !this.targetsDirty && !(this.missing && this.ticks % 60 === 0)) return;
    const wanted = new Set<string>();
    this.consumers.forEach(consumer => consumer.targetIds.forEach(id => wanted.add(id)));
    this.targets.clear();
    // Keep only requested anchors in memory; do not index every scene object.
    if (wanted.size) this.frame.scene.traverse(object => {
      if (wanted.has(object.uuid)) {this.targets.set(object.uuid, object); wanted.delete(object.uuid);}
    });
    this.missing = wanted.size > 0;
    this.targetsDirty = false;
  }

  private update = () => {
    this.ticks++;
    this.frame.capture(this.viewport, !this.owner.hidden);
    this.show(this.frame.active && this.consumers.size > 0);
    if (!this.consumers.size) return;
    if (this.frame.active) {
      const sceneChanged = this.scene !== this.frame.scene;
      this.scene = this.frame.scene;
      this.collectTargets(sceneChanged);
    }
    this.consumers.forEach(consumer => {
      try {consumer.updateFrame(this.frame);} catch (error) {
        this.consumers.delete(consumer);
        this.targetsDirty = true;
        console.error('三维标注更新失败', error);
      }
    });
  };
}

export function acquireLabelLayer(viewport: LabelViewport) {
  let layer = layers.get(viewport);
  if (!layer || layer.container !== viewport.dom) {
    layer = new SharedLabelLayer(viewport, viewport.dom);
    layers.set(viewport, layer);
  }
  layer.retain();
  const current = layer;
  let released = false;
  return {layer: current, release() {if (!released) {released = true; current.release();}}};
}
