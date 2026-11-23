import {Object3D, Scene} from 'three';

export const defaultPipeNames = ['guan1_Flow', 'guan2_Flow', 'guan3_Flow', 'guan4_Flow2',
  'guan5_Flow', 'guan6_Flow', 'guan7_Flow', 'guan8_Flow', 'guan9_Flow'];
export const flowTextureKeys = ['map', 'emissiveMap', 'metalnessMap', 'roughnessMap', 'normalMap', 'alphaMap'];
export type PipeState = boolean | number | string;
export interface PipeMessage {name: string; status: PipeState;}
export type PipeData = Record<string, PipeState> | PipeMessage[];

export function parsePipeNames(value: unknown): string[] {
  const array = typeof value === 'string' ? JSON.parse(value) : value;
  if (!Array.isArray(array) || array.some(name => typeof name !== 'string' || !name.trim())) {
    throw new Error('请填写名称字符串数组，例如 ["guan1_Flow", "guan2_Flow"]。');
  }
  return Array.from(new Set(array.map(name => name.trim())));
}

export function pipeRunning(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  if (typeof value === 'string') {
    const text = value.trim().toLowerCase();
    if (['1', 'true', 'flow', 'flowing', 'running', 'on', '流动', '运行'].includes(text)) return true;
    if (['0', 'false', 'static', 'stopped', 'stop', 'off', '静止', '停止'].includes(text)) return false;
  }
  throw new Error(`不支持的管道状态：${String(value)}。请使用 true/false、1/0 或 flowing/static。`);
}

/** Validate a whole batch before applying it; names such as __proto__ remain ordinary keys. */
function pipeMessages(data: unknown): {name: string; status: unknown}[] | null {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.name === 'string' && Object.prototype.hasOwnProperty.call(record, 'status')) return [record as {name: string; status: unknown}];
    return Object.entries(record).map(([name, status]) => ({name, status}));
  }
  return null;
}

/** 丢掉名单外或状态无法识别的管道，其余照常应用。省略的名称由调用方决定是保持还是停止。 */
export function sanitizePipeFlow(data: unknown, allowed?: ReadonlySet<string>): Map<string, boolean> {
  const result = new Map<string, boolean>();
  if (data == null) return result;
  const messages = pipeMessages(data);
  if (!messages) throw new Error('状态数据须为 {名称: 状态}、{name, status} 或消息数组。');
  messages.forEach(message => {
    if (!message || typeof message.name !== 'string' || !message.name.trim()) return;
    const name = message.name.trim();
    if (allowed && !allowed.has(name)) return;
    try {result.set(name, pipeRunning(message.status));} catch (_) { /* 无法识别的状态不阻断其余管道。 */ }
  });
  return result;
}

export function pipeStates(data: PipeData | PipeMessage): Map<string, boolean> {
  const result = new Map<string, boolean>();
  if (data == null) return result;
  const messages = Array.isArray(data) ? data : typeof data === 'object' &&
    Object.prototype.hasOwnProperty.call(data, 'name') && typeof data.name === 'string' &&
    Object.prototype.hasOwnProperty.call(data, 'status') ? [data as PipeMessage] :
    typeof data === 'object' ? Object.entries(data).map(([name, status]) => ({name, status})) : null;
  if (!messages) throw new Error('状态数据须为 {名称: 状态}、{name, status} 或消息数组。');
  messages.forEach(message => {
    if (!message || typeof message.name !== 'string' || !message.name.trim()) throw new Error('每条状态数据须包含非空 name。');
    result.set(message.name.trim(), pipeRunning(message.status));
  });
  return result;
}

export function samePipeNames(left: string[], right: string[]) {
  return left.length === right.length && left.every((name, index) => name === right[index]);
}

/** Keep only active, configured names. Identical WS messages retain the same React state object. */
export function reconcilePipeStates(current: Map<string, boolean>, incoming: ReadonlyMap<string, boolean>,
  allowed: ReadonlySet<string>, replace = false): Map<string, boolean> {
  let next: Map<string, boolean>;
  const remove = (name: string) => {if (!next) next = new Map(current); next.delete(name);};
  current.forEach((running, name) => {
    if (!allowed.has(name) || !running || replace && incoming.get(name) !== true) remove(name);
  });
  incoming.forEach((running, name) => {
    if (!allowed.has(name)) return;
    const value = next || current;
    if (running && value.get(name) !== true) {if (!next) next = new Map(current); next.set(name, true);}
    else if (!running && value.has(name)) remove(name);
  });
  return next || current;
}

/** One name index per scene/configuration refresh; duplicate names must be resolved explicitly. */
export function indexPipeModels(scene: Scene) {
  const index = new Map<string, Object3D[]>();
  scene.traverse(object => {
    if (!(object as any).isMesh || !object.name) return;
    const matches = index.get(object.name) || [];
    matches.push(object); index.set(object.name, matches);
  });
  return index;
}

export function importPipeNames(scene: Scene, prefix = 'QYguan'): string[] {
  const normalize = (text: string) => text.trim().toLowerCase().replace(/^qyquan/, 'qyguan');
  const filter = normalize(prefix || 'QYguan');
  const names = new Set<string>();
  const visit = (object: Object3D, inside: boolean) => {
    const selected = inside || normalize(object.name || '').startsWith(filter);
    const mesh = object as any;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    // Metal bodies without a UV texture cannot produce a scrolling effect.
    if (selected && mesh.isMesh && !mesh.isInstancedMesh && object.name && materials.some(material =>
      material && flowTextureKeys.some(key => material[key]?.isTexture))) names.add(object.name);
    object.children.forEach(child => visit(child, selected));
  };
  visit(scene, false);
  return Array.from(names);
}

/** Select a proper subset when possible, rather than accidentally starting every pipe. */
export function simulatePipeStates(names: string[], ratio = 0.5, random = Math.random): PipeMessage[] {
  const fraction = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0.5));
  const count = fraction === 0 ? 0 : fraction === 1 || names.length < 2 ? names.length :
    Math.max(1, Math.min(names.length - 1, Math.round(names.length * fraction)));
  const shuffled = [...names];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const target = Math.max(0, Math.min(index, Math.floor(random() * (index + 1))));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  const running = new Set(shuffled.slice(0, count));
  return names.map(name => ({name, status: running.has(name)}));
}
