import { BackSide, ClampToEdgeWrapping, Color, DoubleSide, FrontSide, Material,
  MirroredRepeatWrapping, Object3D, RepeatWrapping, Scene, Texture, Vector2 } from 'three';
import { MaterialErrorCode, MaterialProperties, MaterialUvProperties, SetMaterialCommand,
  SetMaterialInput, SetMaterialResult, materialFailure } from './MaterialTypes';

import {hasCustomMaterialCompile} from '../utils/MaterialUv';

// 与 MaterialUv.ts 中整体 UV 采样变换的通道保持一致。
const textureKeys = ['map', 'emissiveMap', 'metalnessMap', 'roughnessMap', 'normalMap', 'alphaMap'];
const wrapValues = { repeat: RepeatWrapping, clamp: ClampToEdgeWrapping, 'mirrored-repeat': MirroredRepeatWrapping };
const sideValues = { front: FrontSide, back: BackSide, double: DoubleSide };
const propertyKeys = ['color', 'emissive', 'emissiveIntensity', 'opacity', 'transparent',
  'depthWrite', 'depthTest', 'roughness', 'metalness', 'side', 'uv'];
const record = (value: any): value is Record<string, any> => value !== null && typeof value === 'object' && !Array.isArray(value);
const pair = (value: any) => Array.isArray(value) && value.length === 2 && value.every(v => typeof v === 'number' && Number.isFinite(v));
const finite = (value: any) => typeof value === 'number' && Number.isFinite(value);
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const colorValid = (value: any) => typeof value === 'number'
  ? Number.isInteger(value) && value >= 0 && value <= 0xffffff
  : typeof value === 'string' && (/^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(value) || own(Color.NAMES, value.toLowerCase()));

interface TextureLease { source: Texture; texture: Texture; key: string; refs: number }
interface Owner { object: Object3D; original: Material | Material[]; assigned: Material | Material[]; entries: Map<number, Entry> }
interface Entry {
  owner: Owner;
  index: number;
  original: Material;
  material: Material;
  textures: Map<string, TextureLease>;
  scroll: { enabled: boolean; speed: Vector2; origin: Vector2; phase: Vector2 };
}

export interface MaterialResourceStats {objects: number; materials: number; flowing: number; textures: number;}

class MaterialControlError extends Error {
  constructor(public code: MaterialErrorCode, message: string) { super(message); }
}

/** 每个播放器持有；只保留运行时覆盖，不向资源管理器注册克隆。 */
export class MaterialController {
  private owners = new Map<Object3D, Owner>();
  private flowing = new Set<Entry>();
  private texturePool = new Map<Texture, Map<string, TextureLease>>();
  private textureOrigins = new Map<Texture, TextureLease>();
  private materialCount = 0;

  constructor(private options: {boundedScroll?: boolean} = {}) {}

  apply(scene: Scene, input: SetMaterialInput, cachedObjects?: ReadonlyMap<string, Object3D>): SetMaterialResult {
    const commands = Array.isArray(input) ? input : [input];
    if (!commands.length) return materialFailure('INVALID_ARGUMENT', '至少需要一条材质操作。');
    const result: SetMaterialResult = { ok: true, applied: [], errors: [] };
    const objects = cachedObjects || new Map<string, Object3D>();
    if (!cachedObjects) scene.traverse(object => (objects as Map<string, Object3D>).set(object.uuid, object));
    commands.forEach((command, commandIndex) => {
      const invalid = this.validate(command);
      if (invalid) {
        result.errors.push({ commandIndex, code: 'INVALID_ARGUMENT', message: invalid });
        return;
      }
      const targets = new Set<Object3D>();
      command.targets.forEach(id => {
        const object = objects.get(id);
        let root = object;
        if (cachedObjects) while (root && root !== scene && root.parent) root = root.parent;
        if (!object || cachedObjects && root !== scene) result.errors.push({ commandIndex, target: id, code: 'TARGET_NOT_FOUND', message: '目标对象不存在。' });
        else if (command.recursive) {
          let count = 0;
          object.traverse(child => { if ((child as any).material) { targets.add(child); count++; } });
          if (!count) result.errors.push({ commandIndex, target: id, code: 'NO_MATERIAL', message: '目标及其子节点没有材质。' });
        } else targets.add(object);
      });
      targets.forEach(object => this.applyObject(object, command, commandIndex, result));
    });
    result.ok = result.errors.length === 0;
    return result;
  }

  private validate(command: SetMaterialCommand): string | undefined {
    if (!record(command)) return '操作必须是对象。';
    if (Object.keys(command).some(key => !['targets', 'materialIndex', 'recursive', 'properties', 'reset'].includes(key))) return '存在不支持的操作字段。';
    if (!Array.isArray(command.targets) || !command.targets.length || command.targets.some(id => typeof id !== 'string' || !id.trim())) return 'targets 必须是非空对象 UUID 数组。';
    if (command.materialIndex !== undefined && (!Number.isInteger(command.materialIndex) || command.materialIndex < 0)) return 'materialIndex 必须是非负整数。';
    if (command.recursive !== undefined && typeof command.recursive !== 'boolean') return 'recursive 必须是布尔值。';
    if (command.reset !== undefined && typeof command.reset !== 'boolean') return 'reset 必须是布尔值。';
    if (command.reset) return command.properties !== undefined ? 'reset 与 properties 不能同时设置。' : undefined;
    const props = command.properties;
    if (!record(props) || !Object.keys(props).length) return 'properties 必须是非空属性对象。';
    for (const key of Object.keys(props)) {
      if (!propertyKeys.includes(key)) return `不支持材质属性 ${key}。`;
      const value = props[key];
      if (['color', 'emissive'].includes(key) && !colorValid(value)) return `${key} 仅支持 #RGB、#RRGGBB、颜色名称或 0xRRGGBB 数值。`;
      if (['opacity', 'roughness', 'metalness'].includes(key) && (!finite(value) || value < 0 || value > 1)) return `${key} 必须在 0 到 1 之间。`;
      if (key === 'emissiveIntensity' && (!finite(value) || value < 0)) return 'emissiveIntensity 必须是非负有限数值。';
      if (['transparent', 'depthWrite', 'depthTest'].includes(key) && typeof value !== 'boolean') return `${key} 必须是布尔值。`;
      if (key === 'side' && (typeof value !== 'string' || !own(sideValues, value))) return 'side 仅支持 front、back、double。';
      if (key === 'uv') {
        const error = this.validateUv(value);
        if (error) return error;
      }
    }
    return undefined;
  }

  private validateUv(uv: MaterialUvProperties): string | undefined {
    if (!record(uv) || !Object.keys(uv).length) return 'uv 必须是非空对象。';
    for (const key of Object.keys(uv)) {
      const value = uv[key];
      if (!['offset', 'repeat', 'rotation', 'center', 'wrapS', 'wrapT', 'scroll'].includes(key)) return `不支持 UV 属性 ${key}。`;
      if (['offset', 'repeat', 'center'].includes(key) && !pair(value)) return `${key} 必须是两个有限数值组成的数组。`;
      if (key === 'rotation' && !finite(value)) return 'rotation 必须是有限数值，单位为弧度。';
      if (['wrapS', 'wrapT'].includes(key) && (typeof value !== 'string' || !own(wrapValues, value))) return `${key} 仅支持 repeat、clamp、mirrored-repeat。`;
      if (key === 'scroll') {
        if (!record(value) || !Object.keys(value).length || Object.keys(value).some(name => !['enabled', 'speed', 'stopMode'].includes(name))) return 'scroll 字段无效。';
        if (own(value, 'enabled') && typeof value.enabled !== 'boolean') return 'scroll.enabled 必须是布尔值。';
        if (own(value, 'speed') && !pair(value.speed)) return 'scroll.speed 必须是两个有限数值，单位为 UV/秒。';
        if (own(value, 'stopMode') && !['freeze', 'reset'].includes(value.stopMode)) return 'stopMode 仅支持 freeze、reset。';
      }
    }
    return undefined;
  }

  private applyObject(object: Object3D, command: SetMaterialCommand, commandIndex: number, result: SetMaterialResult) {
    let current = (object as any).material as Material | Material[];
    const owner = this.owners.get(object);
    if (owner && current !== owner.assigned) this.releaseOwner(owner);
    current = (object as any).material;
    const materials = Array.isArray(current) ? current : current ? [current] : [];
    if (!materials.length) {
      result.errors.push({ commandIndex, target: object.uuid, code: 'NO_MATERIAL', message: '对象没有材质；组节点请显式设置 recursive。' });
      return;
    }
    const indices = command.materialIndex === undefined ? materials.map((_, index) => index) : [command.materialIndex];
    indices.forEach(index => {
      let created: Entry | undefined;
      try {
        const original = materials[index];
        if (!original?.isMaterial) throw new MaterialControlError('MATERIAL_INDEX_OUT_OF_RANGE', '材质槽位不存在。');
        const oldEntry = this.owners.get(object)?.entries.get(index);
        if (oldEntry && oldEntry.material !== original) this.releaseEntry(oldEntry);
        if (command.reset) {
          const entry = this.owners.get(object)?.entries.get(index);
          if (entry) this.releaseEntry(entry);
        } else {
          const existing = this.owners.get(object)?.entries.get(index);
          this.checkCapabilities(object, original, command.properties, existing);
          const entry = this.ensureEntry(object, index, original);
          if (!existing) created = entry;
          this.patch(entry, command.properties);
        }
        result.applied.push({ commandIndex, target: object.uuid, materialIndex: index, action: command.reset ? 'reset' : 'set' });
      } catch (error) {
        if (created) this.releaseEntry(created);
        result.errors.push({ commandIndex, target: object.uuid, materialIndex: index,
          code: error instanceof MaterialControlError ? error.code : 'OPERATION_FAILED',
          message: error instanceof Error ? error.message : '材质操作失败。' });
      }
    });
  }

  private checkCapabilities(object: Object3D, material: Material, properties: MaterialProperties, entry?: Entry) {
    const mat = material as any;
    for (const key of Object.keys(properties)) {
      if (key === 'uv') continue;
      if (!(key in material)) throw new MaterialControlError('UNSUPPORTED_PROPERTY', `${material.type} 不支持 ${key}。`);
      if (['color', 'emissive'].includes(key) && !mat[key]?.isColor) throw new MaterialControlError('UNSUPPORTED_PROPERTY', `${key} 不是可设置的颜色属性。`);
    }
    const uv = properties.uv;
    if (!uv) return;
    if (!(mat.isMeshBasicMaterial || mat.isMeshStandardMaterial || mat.isMeshLambertMaterial || mat.isMeshPhongMaterial || mat.isMeshToonMaterial || mat.isMeshMatcapMaterial) || hasCustomMaterialCompile(material)) {
      throw new MaterialControlError('UNSUPPORTED_MATERIAL', '该材质不支持通用 UV 变换，自定义 Shader 需单独适配。');
    }
    const textures = textureKeys.map(key => mat[key] as Texture).filter(texture => texture?.isTexture);
    if (!textures.length) throw new MaterialControlError('NO_TEXTURE', '材质没有支持 UV 控制的二维贴图。');
    const geometry = (object as any).geometry;
    if (!geometry || textures.some(texture => !geometry.attributes?.[texture.channel ? `uv${texture.channel}` : 'uv'])) {
      throw new MaterialControlError('NO_UV', '几何体尚未就绪，或缺少贴图使用的 UV 通道。');
    }
    const enabled = uv.scroll?.enabled ?? entry?.scroll.enabled ?? false;
    const speed = uv.scroll?.speed ?? entry?.scroll.speed.toArray() ?? [0, 0];
    if (enabled && textures.some(texture =>
      (speed[0] !== 0 && (uv.wrapS === undefined ? texture.wrapS : wrapValues[uv.wrapS]) === ClampToEdgeWrapping) ||
      (speed[1] !== 0 && (uv.wrapT === undefined ? texture.wrapT : wrapValues[uv.wrapT]) === ClampToEdgeWrapping))) {
      throw new MaterialControlError('UV_WRAP_REQUIRED', '持续偏移方向需使用 repeat 或 mirrored-repeat，可通过 uv.wrapS/wrapT 同时设置。');
    }
  }

  private ensureEntry(object: Object3D, index: number, original: Material): Entry {
    let owner = this.owners.get(object);
    if (owner?.entries.has(index)) return owner.entries.get(index);
    const material = original.clone();
    const source = original as any;
    const mat = material as any;
    mat.tilling = new Vector2(source.tilling?.x ?? 1, source.tilling?.y ?? 1);
    mat.offset = new Vector2(source.offset?.x ?? 0, source.offset?.y ?? 0);
    mat.ovUvCenter = new Vector2(source.ovUvCenter?.x ?? 0, source.ovUvCenter?.y ?? 0);
    mat.ovUvRotation = { value: source.ovUvRotation?.value ?? 0 };
    // Material.copy 不复制编译回调；保留非 UV 自定义材质的既有回调。
    if (own(original, 'onBeforeCompile')) material.onBeforeCompile = original.onBeforeCompile;
    if (own(original, 'customProgramCacheKey')) material.customProgramCacheKey = original.customProgramCacheKey;
    if (!owner) {
      const current = (object as any).material;
      owner = { object, original: current, assigned: Array.isArray(current) ? [...current] : material, entries: new Map() };
      this.owners.set(object, owner);
      (object as any).material = owner.assigned;
    }
    if (Array.isArray(owner.assigned)) owner.assigned[index] = material;
    else { owner.assigned = material; (object as any).material = material; }
    const entry: Entry = { owner, index, original, material, textures: new Map(),
      scroll: { enabled: false, speed: new Vector2(), origin: mat.offset.clone(), phase: new Vector2() } };
    owner.entries.set(index, entry);
    this.materialCount++;
    return entry;
  }

  private patch(entry: Entry, properties: MaterialProperties) {
    const mat = entry.material as any;
    for (const key of Object.keys(properties)) {
      const value = properties[key];
      if (key === 'uv') continue;
      if (key === 'color' || key === 'emissive') mat[key].set(typeof value === 'string' ? value.toLowerCase() : value);
      else if (key === 'side') { if (mat.side !== sideValues[value]) { mat.side = sideValues[value]; mat.needsUpdate = true; } }
      else {
        if (key === 'transparent' && mat[key] !== value) mat.needsUpdate = true;
        mat[key] = value;
      }
    }
    const uv = properties.uv;
    if (!uv) return;
    if (uv.offset !== undefined) {
      mat.offset.fromArray(uv.offset);
      entry.scroll.origin.copy(mat.offset);
      entry.scroll.phase.set(0, 0);
    }
    if (uv.repeat !== undefined) mat.tilling.fromArray(uv.repeat);
    if (uv.center !== undefined) mat.ovUvCenter.fromArray(uv.center);
    if (uv.rotation !== undefined) mat.ovUvRotation.value = uv.rotation;
    if (uv.wrapS !== undefined || uv.wrapT !== undefined) this.patchWrapping(entry, uv);
    if (uv.scroll) {
      const scroll = entry.scroll;
      if (uv.scroll.speed !== undefined) scroll.speed.fromArray(uv.scroll.speed);
      if (uv.scroll.enabled === true && !scroll.enabled) {
        scroll.origin.copy(mat.offset);
        scroll.phase.set(0, 0);
      }
      if (uv.scroll.enabled !== undefined) scroll.enabled = uv.scroll.enabled;
      // Period 2 preserves both repeat and mirrored-repeat. Opt-in avoids changing public offset values.
      if (scroll.enabled && this.options.boundedScroll) {
        if (scroll.speed.x !== 0) scroll.origin.x %= 2;
        if (scroll.speed.y !== 0) scroll.origin.y %= 2;
      }
      if (!scroll.enabled && uv.scroll.stopMode === 'reset') {
        mat.offset.copy(scroll.origin);
        scroll.phase.set(0, 0);
      }
      if (scroll.enabled && scroll.speed.lengthSq() > 0) this.flowing.add(entry);
      else this.flowing.delete(entry);
    }
  }

  private patchWrapping(entry: Entry, uv: MaterialUvProperties) {
    const mat = entry.material as any;
    textureKeys.forEach(key => {
      const current = mat[key] as Texture;
      if (!current?.isTexture) return;
      const wrapS = uv.wrapS === undefined ? current.wrapS : wrapValues[uv.wrapS];
      const wrapT = uv.wrapT === undefined ? current.wrapT : wrapValues[uv.wrapT];
      if (wrapS === current.wrapS && wrapT === current.wrapT) return;
      const source = this.textureOrigins.get(current)?.source ?? current;
      const cacheKey = `${wrapS}:${wrapT}`;
      let cache = this.texturePool.get(source);
      if (!cache) { cache = new Map(); this.texturePool.set(source, cache); }
      let lease = cache.get(cacheKey);
      if (!lease) {
        const texture = source.clone();
        texture.wrapS = wrapS;
        texture.wrapT = wrapT;
        texture.needsUpdate = true;
        lease = { source, texture, key: cacheKey, refs: 0 };
        cache.set(cacheKey, lease);
        this.textureOrigins.set(texture, lease);
      }
      lease.refs++;
      const old = entry.textures.get(key);
      mat[key] = lease.texture;
      entry.textures.set(key, lease);
      if (old) this.releaseTexture(old);
    });
  }

  update(delta: number, scene: Scene): boolean {
    if (!Number.isFinite(delta) || delta <= 0) return false;
    let released = false;
    this.flowing.forEach(entry => {
      let root = entry.owner.object;
      while (root !== scene && root.parent) root = root.parent;
      if (root !== scene || !this.isAssigned(entry)) { this.releaseEntry(entry); released = true; return; }
      const scroll = entry.scroll;
      // 整体变换后由各贴图采样器决定 repeat/mirrored-repeat；周期 2 同时兼容两种模式。
      scroll.phase.x = (scroll.phase.x + scroll.speed.x * delta) % 2;
      scroll.phase.y = (scroll.phase.y + scroll.speed.y * delta) % 2;
      (entry.material as any).offset.copy(scroll.origin).add(scroll.phase);
    });
    return released;
  }

  getResourceStats(): MaterialResourceStats {
    return {objects: this.owners.size, materials: this.materialCount,
      flowing: this.flowing.size, textures: this.textureOrigins.size};
  }

  hasOverride(object: Object3D): boolean {return this.owners.has(object);}

  /** Release one owned object without looking it up in a potentially changed scene. */
  releaseObject(object: Object3D) {
    const owner = this.owners.get(object);
    if (owner) this.releaseOwner(owner);
  }

  private isAssigned(entry: Entry) {
    const current = (entry.owner.object as any).material;
    return Array.isArray(current) ? current[entry.index] === entry.material : current === entry.material;
  }

  private releaseTexture(lease: TextureLease) {
    lease.refs--;
    if (lease.refs > 0) return;
    lease.texture.dispose();
    const cache = this.texturePool.get(lease.source);
    cache?.delete(lease.key);
    if (!cache?.size) this.texturePool.delete(lease.source);
    this.textureOrigins.delete(lease.texture);
  }

  private releaseEntry(entry: Entry) {
    this.flowing.delete(entry);
    const owner = entry.owner;
    if (this.isAssigned(entry)) {
      const current = (owner.object as any).material;
      if (Array.isArray(current)) {
        if (current === owner.assigned) current[entry.index] = entry.original;
        else {
          const restored = [...current];
          restored[entry.index] = entry.original;
          (owner.object as any).material = restored;
        }
      } else (owner.object as any).material = entry.original;
    }
    entry.textures.forEach(lease => this.releaseTexture(lease));
    entry.material.dispose();
    owner.entries.delete(entry.index);
    this.materialCount--;
    if (!owner.entries.size) {
      const current = (owner.object as any).material;
      // 外部替换过某一槽位时保留外部结果，不用旧数组覆盖它。
      if (current === owner.assigned && Array.isArray(current) && Array.isArray(owner.original) &&
        current.length === owner.original.length && current.every((material, index) => material === owner.original[index])) {
        (owner.object as any).material = owner.original;
      }
      this.owners.delete(owner.object);
    }
  }

  private releaseOwner(owner: Owner) { [...owner.entries.values()].forEach(entry => this.releaseEntry(entry)); }

  clear() { [...this.owners.values()].forEach(owner => this.releaseOwner(owner)); }
}
