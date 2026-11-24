import {LabelViewport} from '../../utils/render/src/labels/LabelViewport';

interface FrameListener {callback: () => void; onError?: () => void; active: boolean;}
interface FrameGroup {listeners: Set<FrameListener>; snapshot: FrameListener[]; dispatching: boolean; stop: () => void;}
const groups = new WeakMap<LabelViewport, FrameGroup>();

function releaseEmpty(viewport: LabelViewport, group: FrameGroup) {
  if (!group.dispatching && !group.listeners.size && groups.get(viewport) === group) {
    group.stop(); groups.delete(viewport);
  }
}

/** Even disjoint PipeFlow components share a single player frame subscription. */
export function subscribePipeFlowFrame(viewport: LabelViewport, listener: () => void, onError?: () => void): () => void {
  let group = groups.get(viewport);
  if (!group) {
    const created: FrameGroup = {listeners: new Set(), snapshot: [], dispatching: false, stop: null};
    const dispatch = () => {
      // Rebuild only on membership changes. New listeners always start on the next frame.
      const current = created.snapshot;
      created.dispatching = true;
      try {
        for (const entry of current) {
          if (!entry.active) continue;
          try {entry.callback();} catch (error) {
            entry.active = false; created.listeners.delete(entry);
            created.snapshot = Array.from(created.listeners);
            try {entry.onError?.();} catch (cleanupError) {console.error('管道流动清理失败', cleanupError);}
            console.error('管道流动帧更新失败', error);
          }
        }
      } finally {created.dispatching = false; releaseEmpty(viewport, created);}
    };
    created.stop = viewport.subscribeFrame(dispatch);
    group = created;
    groups.set(viewport, group);
  }
  const registration = group;
  const entry = {callback: listener, onError, active: true};
  registration.listeners.add(entry);
  registration.snapshot = Array.from(registration.listeners);
  return () => {
    if (!entry.active) return;
    entry.active = false;
    registration.listeners.delete(entry);
    registration.snapshot = Array.from(registration.listeners);
    releaseEmpty(viewport, registration);
  };
}
