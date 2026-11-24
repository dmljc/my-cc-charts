interface HotspotState {
  target: string;
  sceneId: string;
  visible: boolean;
}

/** Per-player display overrides; never change the editor's shared Object3D.visible. */
class HotspotVisibility {
  private owners = new Map<object, HotspotState[]>();
  private scenes = new Map<string, Map<string, boolean>>();

  update(owner: object, states: HotspotState[]) {
    const previous = this.owners.get(owner);
    if (previous?.length === states.length && previous.every((state, index) => {
      const next = states[index];
      return state.target === next.target && state.sceneId === next.sceneId && state.visible === next.visible;
    })) return;
    this.owners.set(owner, states);
    this.rebuild();
  }

  release(owner: object) {
    if (this.owners.delete(owner)) this.rebuild();
    return this.owners.size;
  }

  get(sceneId: string): ReadonlyMap<string, boolean> {return this.scenes.get(sceneId);}

  private rebuild() {
    this.scenes.clear();
    this.owners.forEach(states => states.forEach(state => {
      if (!state.target || !state.sceneId) return;
      let scene = this.scenes.get(state.sceneId);
      if (!scene) {scene = new Map(); this.scenes.set(state.sceneId, scene);}
      // Several labels can share a hotspot. Keep it visible if any owner shows it.
      scene.set(state.target, scene.get(state.target) === true || state.visible);
    }));
  }
}

const controls = new WeakMap<object, HotspotVisibility>();

export function acquireHotspotVisibility(viewport: object) {
  let control = controls.get(viewport);
  if (!control) {control = new HotspotVisibility(); controls.set(viewport, control);}
  const owner = {};
  control.update(owner, []);
  let released = false;
  return {
    update(states: HotspotState[]) {if (!released) control.update(owner, states);},
    release() {
      if (released) return;
      released = true;
      if (!control.release(owner) && controls.get(viewport) === control) controls.delete(viewport);
    },
  };
}

/** Called once per render; no traversal or map rebuilding on animation frames. */
export function getHotspotVisibility(viewport: object, sceneId: string) {
  return controls.get(viewport)?.get(sceneId);
}
