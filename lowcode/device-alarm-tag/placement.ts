import {LabelViewport} from '../../src/utils/render/src/labels/LabelViewport';
import {LABEL_VIEWPORT_BRIDGE, LabelPlacement, LabelViewportBridge} from '../../src/utils/render/src/labels/LabelViewportBridge';

export function isPlacementHotspot(object: any) {
  return object?.type === 'CSS2DObject' || object?.isCSS2DObject === true;
}

export function listPlacementAnchors(viewport: LabelViewport, query = '', limit = Infinity, includeModels = false) {
  const buckets: {id: string; label: string}[][] = [[], [], []];
  const search = query.trim().toLowerCase();
  let total = 0;
  if (!viewport?.scene || viewport.disposed) return {items: [], total};
  viewport.scene.traverse(object => {
    if (object === viewport.scene || (object as any).isCamera || (object as any).isLight || /Helper$/.test(object.type) || (object as any).hideInHierarchy) return;
    const anchor = isPlacementHotspot(object);
    if (!includeModels && !anchor) return;
    const names: string[] = [];
    for (let current = object; current && current !== viewport.scene; current = current.parent) {
      if (current.name) names.unshift(current.name);
    }
    const label = `${names.join(' / ') || object.type} · ${object.type} · ${object.uuid}`;
    if (search && !`${label} ${object.uuid}`.toLowerCase().includes(search)) return;
    total++;
    const priority = anchor ? 0 : (object as any).isGroup ? 1 : 2;
    if (buckets[priority].length < limit) buckets[priority].push({id: object.uuid, label});
  });
  return {items: ([] as {id: string; label: string}[]).concat(...buckets).slice(0, limit), total};
}

export function bindLabelAnchor(viewport: LabelViewport, id: string, gap = 0) {
  const target = viewport.scene.getObjectByProperty('uuid', id);
  if (!target || target === viewport.scene || viewport.disposed) return null;
  return {target: id, sceneId: viewport.scene.uuid, position: [0, 0, 0] as [number, number, number],
    centerX: 0.5, centerY: 1, offsetX: 0, offsetY: Number.isFinite(gap) && gap > 0 ? -gap : 0};
}

function placementDocuments(node: any) {
  const nodeDom = node?.getDOMNode?.();
  const dom = Array.isArray(nodeDom) ? nodeDom[0] : nodeDom;
  const docs: Document[] = [];
  if (dom?.ownerDocument) docs.push(dom.ownerDocument);
  else if (typeof document !== 'undefined') {
    docs.push(document);
    // Only inspect the simulator frames of this editor, and only explicit bridges.
    document.querySelectorAll('iframe').forEach(frame => {
      try {if (frame.contentDocument) docs.push(frame.contentDocument);} catch (_) { /* another origin */ }
    });
  }
  return docs;
}

export function findPlacementViewport(node: any): LabelViewport | null {
  const found = new Set<LabelViewport>();
  const scope = node?.getPropValue?.('loaderId');
  placementDocuments(node).forEach(doc => doc.querySelectorAll('[data-scene-label-viewport]').forEach(element => {
    const bridge = element[LABEL_VIEWPORT_BRIDGE] as LabelViewportBridge;
    const viewport = bridge?.find(scope);
    if (viewport && !viewport.disposed) found.add(viewport);
  }));
  return found.size === 1 ? Array.from(found)[0] : null;
}

/** Observe registration/scene events, and discover a loader that mounts later. */
export function observePlacementViewport(node: any, callback: (viewport: LabelViewport | null) => void) {
  const subscriptions = new Map<LabelViewportBridge, () => void>();
  let viewport: LabelViewport, scene, initialized = false;
  const sync = () => {
    const bridges = new Set<LabelViewportBridge>();
    placementDocuments(node).forEach(doc => doc.querySelectorAll('[data-scene-label-viewport]').forEach(element => {
      const bridge = element[LABEL_VIEWPORT_BRIDGE] as LabelViewportBridge;
      if (bridge?.observe) bridges.add(bridge);
    }));
    subscriptions.forEach((stop, bridge) => {if (!bridges.has(bridge)) {stop(); subscriptions.delete(bridge);}});
    bridges.forEach(bridge => {if (!subscriptions.has(bridge)) subscriptions.set(bridge, bridge.observe(sync));});
    const next = findPlacementViewport(node);
    if (!initialized || viewport !== next || scene !== next?.scene) {
      initialized = true; viewport = next; scene = next?.scene; callback(next);
    }
  };
  const observers = placementDocuments(node).map(doc => {
    const observer = new doc.defaultView.MutationObserver(sync);
    observer.observe(doc.documentElement, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-scene-label-viewport']});
    return observer;
  });
  sync();
  return () => {observers.forEach(observer => observer.disconnect()); subscriptions.forEach(stop => stop()); subscriptions.clear();};
}

export function pickLabelPlacement(viewport: LabelViewport, clientX: number, clientY: number): LabelPlacement | null {
  const bridge = viewport.dom[LABEL_VIEWPORT_BRIDGE] as LabelViewportBridge;
  return bridge?.pick(viewport, clientX, clientY) || null;
}

const activePicks = new WeakMap<LabelViewport, () => void>();

/** A temporary, one-click picker. No raycasting in the render loop. */
export function startLabelPlacement(viewport: LabelViewport, onPick: (placement: LabelPlacement) => void, onStatus: (message: string) => void) {
  activePicks.get(viewport)?.();
  const doc = viewport.dom.ownerDocument, win = doc.defaultView;
  const keyWindows = new Set([win, typeof window === 'undefined' ? win : window]);
  const overlay = doc.createElement('div');
  overlay.setAttribute('data-scene-label-picker', 'true');
  overlay.setAttribute('aria-label', '点击模型放置标注');
  Object.assign(overlay.style, {position: 'absolute', inset: '0px', zIndex: '2147483646', cursor: 'crosshair', touchAction: 'none'});
  const hint = doc.createElement('div'); hint.textContent = '点击模型放置标注 · Esc 取消';
  Object.assign(hint.style, {position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', padding: '6px 12px', color: '#fff', background: '#123247', pointerEvents: 'none'});
  overlay.appendChild(hint); viewport.dom.appendChild(overlay);
  const style = doc.createElement('style');
  style.textContent = '[data-scene-labels-design],[data-scene-labels-design] *{pointer-events:none!important}';
  doc.head.appendChild(style);
  let stopped = false, down: {x: number; y: number};
  const inside = (event: Event) => overlay.contains(event.target as Node);
  const stop = () => {
    if (stopped) return; stopped = true;
    ['pointerdown', 'pointermove', 'pointerup', 'click'].forEach(type => win.removeEventListener(type, pointer, true));
    keyWindows.forEach(target => target.removeEventListener('keydown', keyboard, true));
    overlay.remove(); style.remove();
    if (activePicks.get(viewport) === stop) activePicks.delete(viewport);
  };
  const pointer = (event: MouseEvent) => {
    if (!inside(event)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.type === 'pointerdown') {down = {x: event.clientX, y: event.clientY}; return;}
    if (event.type !== 'click' || event.button !== 0) return;
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) {down = null; return;}
    if (!viewport.isActive || viewport.disposed || !viewport.dom.contains(overlay)) {stop(); onStatus('三维视口已关闭，请重新选择。'); return;}
    try {
      const placement = pickLabelPlacement(viewport, event.clientX, event.clientY);
      if (!placement) {onStatus('未命中可见模型，请点击模型表面。'); return;}
      stop(); onPick(placement);
    } catch (error) {stop(); onStatus(`拾取失败：${error instanceof Error ? error.message : String(error)}`);}
  };
  const keyboard = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault(); event.stopImmediatePropagation(); stop(); onStatus('已取消拾取。');
  };
  ['pointerdown', 'pointermove', 'pointerup', 'click'].forEach(type => win.addEventListener(type, pointer, true));
  keyWindows.forEach(target => target.addEventListener('keydown', keyboard, true));
  activePicks.set(viewport, stop);
  return stop;
}
