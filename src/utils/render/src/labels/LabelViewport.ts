import {Camera, Scene, Vector2} from 'three';
import {LABEL_VIEWPORT_BRIDGE, LabelViewportBridge} from './LabelViewportBridge';
import {pickLabelPlacement} from './LabelPicking';

export interface LabelViewport {
  scene: Scene;
  camera: Camera;
  dom: HTMLElement;
  isActive: boolean;
  disposed: boolean;
  webglRenderer: {getSize(target: Vector2): Vector2};
  subscribeFrame(listener: () => void): () => void;
}

const viewports = new Map<string, {viewport: LabelViewport; dom: HTMLElement}>();
const listeners = new Set<() => void>();
const bridge = {find: findLabelViewport, observe: observeLabelViewports, pick: pickLabelPlacement};

function bindDom(dom: HTMLElement) {
  if (!dom?.setAttribute) return;
  dom[LABEL_VIEWPORT_BRIDGE] = bridge;
  dom.setAttribute('data-scene-label-viewport', 'true');
}

function releaseDom(dom: HTMLElement) {
  if (!dom || Array.from(viewports.values()).some(entry => entry.dom === dom)) return;
  if (dom[LABEL_VIEWPORT_BRIDGE] === bridge) {
    delete dom[LABEL_VIEWPORT_BRIDGE];
    dom.removeAttribute('data-scene-label-viewport');
  }
}

function notify() {listeners.forEach(listener => listener());}

/** view.js and the designer panel are separate bundles, sometimes in nested frames. */
function eachDocument(visit: (doc: Document) => void) {
  if (typeof document === 'undefined') return;
  const seen = new Set<Document>();
  const walk = (doc: Document, depth: number) => {
    if (!doc || seen.has(doc) || depth > 4) return;
    seen.add(doc);
    visit(doc);
    doc.querySelectorAll('iframe').forEach(frame => {
      try {if (frame.contentDocument) walk(frame.contentDocument, depth + 1);} catch (_) { /* another origin */ }
    });
  };
  walk(document, 0);
}

function eachForeignBridge(visit: (bridge: LabelViewportBridge) => void) {
  const seen = new Set<LabelViewportBridge>();
  eachDocument(doc => doc.querySelectorAll('[data-scene-label-viewport]').forEach(element => {
    const foreign = element[LABEL_VIEWPORT_BRIDGE] as LabelViewportBridge;
    if (!foreign || foreign === bridge || foreign.find === findLabelViewport || seen.has(foreign)) return;
    seen.add(foreign);
    visit(foreign);
  }));
}

function findLocalViewport(id?: string): LabelViewport | null {
  if (id) {
    const viewport = viewports.get(id)?.viewport;
    return viewport && !viewport.disposed ? viewport : null;
  }
  const active = Array.from(new Set(Array.from(viewports.values()).map(entry => entry.viewport))).filter(viewport => !viewport.disposed);
  // An ambiguous loader must not silently attach labels to the wrong scene.
  return active.length === 1 ? active[0] : null;
}

let finding = false;
function findForeignViewport(id?: string): LabelViewport | null {
  if (finding) return null;
  finding = true;
  try {
    const found = new Set<LabelViewport>();
    eachForeignBridge(foreign => {
      const viewport = foreign.find(id);
      if (viewport && !viewport.disposed) found.add(viewport);
    });
    return found.size === 1 ? Array.from(found)[0] : null;
  } finally {finding = false;}
}

/** A scene switch is an event, not an extra per-frame scene scan. */
export function notifyLabelViewportSceneChanged(viewport: LabelViewport) {
  if (Array.from(viewports.values()).some(entry => entry.viewport === viewport)) notify();
}

/** Register only the runtime player's viewport, never the parent editor's DOM. */
export function registerLabelViewport(id: string, viewport: LabelViewport): () => void {
  const registration = {viewport, dom: viewport.dom};
  const previous = viewports.get(id);
  viewports.set(id, registration);
  if (previous) releaseDom(previous.dom);
  bindDom(registration.dom);
  notify();
  return () => {
    if (viewports.get(id) === registration) {
      viewports.delete(id);
      releaseDom(registration.dom);
      notify();
    }
  };
}

export function findLabelViewport(id?: string): LabelViewport | null {
  return findLocalViewport(id) || findForeignViewport(id);
}

let scanning = false;
export function observeLabelViewports(listener: () => void) {
  listeners.add(listener);
  const stops = new Map<LabelViewportBridge, () => void>();
  const sync = () => {
    if (scanning) return;
    scanning = true;
    try {
      const bridges = new Set<LabelViewportBridge>();
      eachForeignBridge(foreign => bridges.add(foreign));
      stops.forEach((stop, foreign) => {if (!bridges.has(foreign)) {stop(); stops.delete(foreign);}});
      bridges.forEach(foreign => {if (!stops.has(foreign)) stops.set(foreign, foreign.observe(listener));});
    } finally {scanning = false;}
  };
  let observer: MutationObserver;
  if (typeof document !== 'undefined' && document.documentElement) {
    const marksViewport = (node: Node) => node instanceof Element && (node.hasAttribute('data-scene-label-viewport') || !!node.querySelector('[data-scene-label-viewport]'));
    observer = new MutationObserver(records => {
      if (records.some(record => record.type === 'attributes' || [...record.addedNodes, ...record.removedNodes].some(marksViewport))) sync();
    });
    observer.observe(document.documentElement, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-scene-label-viewport']});
    sync();
  }
  return () => {
    listeners.delete(listener);
    observer?.disconnect();
    stops.forEach(stop => stop());
    stops.clear();
  };
}

export function removeLabelViewport(viewport: LabelViewport) {
  let changed = false;
  const doms = new Set<HTMLElement>();
  viewports.forEach((entry, id) => {
    if (entry.viewport === viewport) {doms.add(entry.dom); viewports.delete(id); changed = true;}
  });
  doms.forEach(releaseDom);
  if (changed) notify();
}
