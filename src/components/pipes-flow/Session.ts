import {ClampToEdgeWrapping, Color, Material, Object3D, Scene} from 'three';
import {LabelViewport} from '../../utils/render/src/labels/LabelViewport';
import {MaterialController, MaterialResourceStats} from '../../utils/render/src/material/MaterialController';
import {MaterialUvProperties, SetMaterialCommand, UvPair} from '../../utils/render/src/material/MaterialTypes';
import {flowTextureKeys, indexPipeModels} from './model';
import {subscribePipeFlowFrame} from './Scheduler';

export interface PipeFlowReport {
  scene: string;
  total: number;
  running: string[];
  waiting: string[];
  errors: string[];
}
export interface PipeFlowOptions {
  speed: UvPair; stopMode: 'freeze' | 'reset'; updateFps?: number;
  highlightEnabled?: boolean; highlightColor?: string | number; highlightIntensity?: number;
}
export interface PipeFlowDiagnostics extends MaterialResourceStats {
  names: number; indexedModels: number; waiting: number; frameSubscriptions: number; queuedMessages: number; disposed: boolean;
}

// Do not clone another component's temporary material and later restore its disposed clone.
const leases = new WeakMap<Object3D, PipeFlowSession>();

/** Bounded to the current scene/configuration; clones survive ordinary start/stop cycles. */
export class PipeFlowSession {
  private controller = new MaterialController({boundedScroll: true});
  private index: Map<string, Object3D[]>;
  private objects = new Map<string, Object3D>();
  private applied = new Map<string, string>();
  private desired = new Map<string, boolean>();
  private touched = new Set<string>();
  private pending = new Set<string>();
  private deadlines = new Map<string, number>();
  private failures = new Map<string, string>();
  private stopFrame: () => void;
  private lastTime = 0;
  private retryTime = 0;
  private names: string[] = [];
  private options: PipeFlowOptions = {speed: [0.2, 0], stopMode: 'freeze'};
  private signatures = {running: '', stopped: ''};
  private lastReport = '';
  private disposed = false;
  private reporting = true;
  private frameInterval = 0;
  private nextUpdate = 0;
  private pendingDelta = 0;
  private highlight = {enabled: false, input: '#00e5ff' as string | number, color: new Color('#00e5ff'), intensity: 1};
  // Keys are already-owned material clones, never original shared materials or scene objects.
  private appearances = new WeakMap<Material, {color: Color; intensity?: number; emissive: boolean}>();
  scene: Scene;

  constructor(private viewport: LabelViewport, private report: (report: PipeFlowReport) => void,
    private now: () => number = () => performance.now()) {
    this.scene = viewport.scene;
    this.index = indexPipeModels(this.scene);
    this.index.forEach(objects => objects.forEach(object => this.objects.set(object.uuid, object)));
  }

  configure(names: string[], states: Map<string, boolean>, options: PipeFlowOptions) {
    if (this.disposed) return;
    const interval = Number.isFinite(options.updateFps) && options.updateFps > 0 ? 1000 / options.updateFps : 0;
    const released = interval !== this.frameInterval && this.flushAnimation();
    if (interval !== this.frameInterval) {this.frameInterval = interval; this.nextUpdate = this.now() + interval;}
    const highlightEnabled = options.highlightEnabled === true, highlightColor = options.highlightColor ?? '#00e5ff';
    const highlightIntensity = Number.isFinite(options.highlightIntensity) ? Math.max(0, Math.min(10, options.highlightIntensity)) : 1;
    const changedHighlight = highlightEnabled !== this.highlight.enabled || highlightColor !== this.highlight.input ||
      highlightIntensity !== this.highlight.intensity;
    if (changedHighlight) this.highlight = {enabled: highlightEnabled, input: highlightColor,
      color: new Color('#00e5ff').set(highlightColor), intensity: highlightIntensity};
    const changedOptions = options.speed[0] !== this.options.speed[0] || options.speed[1] !== this.options.speed[1] ||
      options.stopMode !== this.options.stopMode || changedHighlight;
    const changedNames = names.length !== this.names.length || names.some((name, index) => name !== this.names[index]);
    if (changedNames) {
      const allowed = new Set(names);
      this.names.forEach(name => {
        if (allowed.has(name)) return;
        this.releaseName(name); this.desired.delete(name); this.failures.delete(name);
        this.pending.delete(name); this.deadlines.delete(name);
      });
      this.names = [...names];
    }
    if (changedOptions) this.options = {speed: [options.speed[0], options.speed[1]], stopMode: options.stopMode};
    if (changedOptions || !this.signatures.running) {
      const signature = options.speed[0] + '/' + options.speed[1] + '/' + options.stopMode + '/' +
        this.highlight.enabled + '/' + this.highlight.input + '/' + this.highlight.intensity;
      this.signatures = {running: '1/' + signature, stopped: '0/' + signature};
    }
    const dirty = new Set<string>();
    this.names.forEach(name => {
      const running = states.get(name) === true;
      if (!this.desired.has(name) || this.desired.get(name) !== running || changedOptions) {
        dirty.add(name); this.failures.delete(name);
        if (running) this.deadlines.set(name, this.now() + 30000);
        else {this.pending.delete(name); this.deadlines.delete(name);}
      }
      this.desired.set(name, running);
    });
    if (dirty.size) this.apply(dirty);
    else if (changedNames || released) {this.syncFrame(); this.notify();}
  }

  /** A WS delta visits only its changed names. False means the binding has not been configured yet. */
  patchStates(incoming: ReadonlyMap<string, boolean>): boolean {
    if (this.disposed) return false;
    for (const name of incoming.keys()) if (!this.desired.has(name)) return false;
    const dirty = new Set<string>();
    incoming.forEach((running, name) => {
      if (this.desired.get(name) === running) return;
      this.desired.set(name, running); dirty.add(name); this.failures.delete(name);
      if (running) this.deadlines.set(name, this.now() + 30000);
      else {this.pending.delete(name); this.deadlines.delete(name);}
    });
    if (dirty.size) this.apply(dirty);
    return true;
  }

  setReportingEnabled(enabled: boolean, refresh = false) {
    if (this.disposed || this.reporting === enabled && !refresh) return;
    this.reporting = enabled;
    if (enabled) {this.lastReport = ''; this.notify();}
  }

  private releaseName(name: string) {
    const object = this.index.get(name)?.[0];
    if (object) {
      this.controller.releaseObject(object);
      if (leases.get(object) === this) leases.delete(object);
    }
    this.touched.delete(name); this.applied.delete(name);
  }

  private belongs(object: Object3D) {
    let root = object;
    while (root !== this.scene && root.parent) root = root.parent;
    return root === this.scene;
  }

  private forgetDetached(name: string) {
    this.index.get(name)?.forEach(object => this.objects.delete(object.uuid));
    this.index.delete(name);
  }

  private applyHighlight(material: any, running: boolean) {
    const active = running && this.highlight.enabled && this.options.speed.some(value => value !== 0);
    let original = this.appearances.get(material);
    if (active) {
      if (!original) {
        const emissive = material.emissive?.isColor === true;
        const color = emissive ? material.emissive : material.color;
        if (!color?.isColor) return;
        original = {color: color.clone(), intensity: material.emissiveIntensity, emissive};
        this.appearances.set(material, original);
      }
      if (original.emissive) {
        material.emissive.copy(this.highlight.color); material.emissiveIntensity = this.highlight.intensity;
      } else material.color.copy(this.highlight.color).multiplyScalar(this.highlight.intensity);
    } else if (original) {
      if (original.emissive) {
        material.emissive.copy(original.color); material.emissiveIntensity = original.intensity;
      } else material.color.copy(original.color);
    }
  }

  private apply(dirty: Iterable<string>) {
    if (this.disposed) return;
    if (this.viewport.disposed || this.viewport.scene !== this.scene) {this.dispose(); return;}
    // Settle the old running set before a state transition, including in the optional capped mode.
    this.flushAnimation();
    const commands: SetMaterialCommand[] = [];
    const entries: {name: string; signature: string; object: Object3D}[] = [];
    for (const name of dirty) {
      this.pending.delete(name);
      const objects = this.index.get(name) || [];
      if (objects.length !== 1) {
        this.failures.set(name, objects.length ? '同名模型不唯一，请在场景中改名' : '当前场景未找到模型');
        this.deadlines.delete(name); continue;
      }
      const object = objects[0] as any;
      if (!this.belongs(object)) {
        this.releaseName(name); this.forgetDetached(name); this.deadlines.delete(name);
        this.failures.set(name, '模型已移出当前场景，请刷新模型'); continue;
      }
      if (object.isInstancedMesh) {this.failures.set(name, '实例化模型需先拆为独立 Mesh'); this.deadlines.delete(name); continue;}
      const running = this.desired.get(name) === true;
      const signature = running ? this.signatures.running : this.signatures.stopped;
      if (this.applied.get(name) === signature || !running && !this.touched.has(name)) continue;
      if (leases.has(object) && leases.get(object) !== this) {
        this.failures.set(name, '已由另一个管道流动组件控制，请勿重复绑定'); this.deadlines.delete(name); continue;
      }
      if (running && !this.touched.has(name) && !this.options.speed.some(value => value !== 0)) {this.deadlines.delete(name); continue;}
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      let slots = 0;
      materials.forEach((material: any, materialIndex: number) => {
        const textures = flowTextureKeys.map(key => material?.[key]).filter(texture => texture?.isTexture);
        if (!textures.length) return;
        slots++;
        const uv: MaterialUvProperties = {scroll: {enabled: running, speed: this.options.speed, stopMode: this.options.stopMode}};
        // Preserve repeat/mirrored-repeat and untouched axes; clone a sampler only when required.
        if (running && this.options.speed[0] && textures.some(texture => texture.wrapS === ClampToEdgeWrapping)) uv.wrapS = 'repeat';
        if (running && this.options.speed[1] && textures.some(texture => texture.wrapT === ClampToEdgeWrapping)) uv.wrapT = 'repeat';
        commands.push({targets: [object.uuid], materialIndex, properties: {uv}});
        entries.push({name, signature, object});
      });
      if (!slots) {this.failures.set(name, '材质没有流动贴图，请选择 _Flow 模型'); this.deadlines.delete(name);}
    }
    if (commands.length) {
      const result = this.controller.apply(this.scene, commands, this.objects);
      result.applied.forEach(applied => {
        const entry = entries[applied.commandIndex];
        if (entry) {
          this.touched.add(entry.name); leases.set(entry.object, this);
          const assigned = (entry.object as any).material;
          this.applyHighlight(Array.isArray(assigned) ? assigned[applied.materialIndex] : assigned, this.desired.get(entry.name) === true);
        }
      });
      const failedNames = new Set(result.errors.map(error => entries[error.commandIndex]?.name));
      result.errors.forEach(error => {
        const name = entries[error.commandIndex]?.name;
        if (!name) return;
        if (error.code === 'NO_UV' && this.now() < (this.deadlines.get(name) ?? 0)) {
          this.pending.add(name); this.failures.delete(name);
        } else {
          this.pending.delete(name); this.deadlines.delete(name); this.failures.set(name, error.message);
          this.releaseName(name);
        }
      });
      entries.forEach(entry => {
        if (failedNames.has(entry.name)) return;
        this.pending.delete(entry.name); this.deadlines.delete(entry.name); this.failures.delete(entry.name);
        this.applied.set(entry.name, entry.signature);
      });
    }
    this.syncFrame(); this.notify();
  }

  private syncFrame() {
    if (!this.controller.getResourceStats().flowing && !this.pending.size) {
      this.stopFrame?.(); this.stopFrame = null; this.lastTime = 0; this.pendingDelta = 0; return;
    }
    if (this.stopFrame) return;
    this.lastTime = this.now(); this.retryTime = this.lastTime + 500;
    this.nextUpdate = this.lastTime + this.frameInterval; this.pendingDelta = 0;
    this.stopFrame = subscribePipeFlowFrame(this.viewport, this.onFrame, () => this.dispose());
  }

  private flushAnimation() {
    if (!this.pendingDelta) return false;
    const delta = this.pendingDelta; this.pendingDelta = 0;
    const released = this.controller.update(delta, this.scene);
    if (released) this.touched.forEach(name => {
      const object = this.index.get(name)?.[0];
      if (object && this.controller.hasOverride(object)) return;
      this.releaseName(name);
      if (object && !this.belongs(object)) this.forgetDetached(name);
      this.failures.set(name, '模型已移除或材质被外部替换，请刷新模型');
    });
    return released;
  }

  private onFrame = () => {
    if (this.disposed) return;
    if (this.viewport.disposed || this.viewport.scene !== this.scene) {this.dispose(); return;}
    const time = this.now();
    const delta = Math.min(0.1, Math.max(0, (time - this.lastTime) / 1000));
    this.lastTime = time;
    if (!this.viewport.isActive || this.viewport.dom?.ownerDocument?.hidden) {
      this.pendingDelta = 0; this.nextUpdate = time + this.frameInterval; return;
    }
    this.pendingDelta += delta;
    const due = !this.frameInterval || time + 0.000001 >= this.nextUpdate;
    let released = false;
    if (due) {
      released = this.flushAnimation();
      if (this.frameInterval) this.nextUpdate += this.frameInterval * Math.max(1,
        Math.floor((time - this.nextUpdate + 0.000001) / this.frameInterval) + 1);
    }
    if (released) {
      this.syncFrame(); this.notify();
    }
    if (this.pending.size && time >= this.retryTime) {
      this.retryTime = time + 500;
      this.apply(Array.from(this.pending));
    }
  };

  private notify() {
    if (!this.reporting) return;
    const moving = this.options.speed.some(value => value !== 0);
    const value: PipeFlowReport = {scene: this.scene.name || this.scene.uuid, total: this.names.length,
      running: this.names.filter(name => moving && this.desired.get(name) && this.applied.has(name) &&
        !this.failures.has(name) && !this.pending.has(name)),
      waiting: Array.from(this.pending), errors: Array.from(this.failures, ([name, message]) => name + '：' + message)};
    const serialized = JSON.stringify(value);
    if (serialized !== this.lastReport) {this.lastReport = serialized; this.report(value);}
  }

  getDiagnostics(): PipeFlowDiagnostics {
    return {...this.controller.getResourceStats(), names: this.names.length, indexedModels: this.objects.size,
      waiting: this.pending.size, frameSubscriptions: this.stopFrame ? 1 : 0, queuedMessages: 0, disposed: this.disposed};
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stopFrame?.(); this.stopFrame = null;
    this.touched.forEach(name => {const object = this.index.get(name)?.[0]; if (object && leases.get(object) === this) leases.delete(object);});
    this.controller.clear(); this.touched.clear(); this.applied.clear(); this.pending.clear();
    this.desired.clear(); this.deadlines.clear(); this.failures.clear(); this.index.clear(); this.objects.clear();
    this.names = []; this.lastReport = '';
    this.pendingDelta = 0;
    this.appearances = new WeakMap();
    // A late React cleanup or an old ref must not retain an entire scene or DOM subtree.
    this.scene = null; this.viewport = null; this.report = null; this.now = null;
  }
}

