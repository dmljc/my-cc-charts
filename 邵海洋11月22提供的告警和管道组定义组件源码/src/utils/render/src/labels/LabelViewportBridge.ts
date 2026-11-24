import {LabelViewport} from './LabelViewport';

/** Metadata and view.js run in separate bundles (and sometimes separate frames). */
export const LABEL_VIEWPORT_BRIDGE = '__sceneLabelViewportBridge';
export interface LabelPlacement {target: string; sceneId: string; position: [number, number, number];}
export interface LabelViewportBridge {
  find(id?: string): LabelViewport | null;
  observe(listener: () => void): () => void;
  pick(viewport: LabelViewport, clientX: number, clientY: number): LabelPlacement | null;
}
