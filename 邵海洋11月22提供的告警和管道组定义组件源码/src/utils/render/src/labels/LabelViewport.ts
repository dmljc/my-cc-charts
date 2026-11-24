import {Camera, Scene, Vector2} from 'three';
import {LABEL_VIEWPORT_BRIDGE} from './LabelViewportBridge';
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
  if (id) {
    const viewport = viewports.get(id)?.viewport;
    return viewport && !viewport.disposed ? viewport : null;
  }
  const active = Array.from(new Set(Array.from(viewports.values()).map(entry => entry.viewport))).filter(viewport => !viewport.disposed);
  // An ambiguous loader must not silently attach labels to the wrong scene.
  return active.length === 1 ? active[0] : null;
}

export function observeLabelViewports(listener: () => void) {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
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
