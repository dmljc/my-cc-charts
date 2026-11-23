import {Box3, Object3D, Vector3} from 'three';

/** 清掉旧版 DOM 标注层，避免和当前投影层叠在一起。 */
export function removeLegacyAlarmOverlays(root?: ParentNode | null) {
  const roots = [root, typeof document === 'undefined' ? null : document].filter(Boolean) as ParentNode[];
  new Set(roots).forEach(node => {
    if (node.querySelectorAll) node.querySelectorAll('[data-marker-overlay="1"]').forEach(layer => layer.remove());
  });
}

/**
 * 优先按名称取根节点。否则在包含探针点最多的网格节点中，选包围盒更小的那个。
 * 场景还没有可选模型时返回 null，调用方继续等待。
 */
export function findAlarmModelRoot(scene: Object3D, points: number[][], rootName = '') {
  if (rootName) {
    const named = scene.getObjectByName?.(rootName);
    if (named) return named;
  }
  const candidates = (scene.children || []).filter(child => {
    if (!child || (child as any).isCamera || (child as any).isLight || (child as any).isHelper || !child.localToWorld) return false;
    let meshes = 0;
    child.traverse(node => {if ((node as any).isMesh) meshes++;});
    return meshes > 0;
  });
  if (candidates.length < 2) return candidates[0] || null;
  let best: {node: Object3D; contained: number; diagonal: number} | null = null;
  candidates.forEach(node => {
    try {
      node.updateWorldMatrix(true, true);
      const box = new Box3().setFromObject(node);
      if (box.isEmpty()) return;
      const size = box.getSize(new Vector3());
      const diagonal = size.length();
      const margin = Math.max(size.x, size.y, size.z, 1) * 0.08;
      const contained = points.filter(position => {
        const point = node.localToWorld(new Vector3(...position));
        return ['x', 'y', 'z'].every(axis => point[axis] >= box.min[axis] - margin && point[axis] <= box.max[axis] + margin);
      }).length;
      if (!best || contained > best.contained || contained === best.contained && diagonal < best.diagonal) {
        best = {node, contained, diagonal};
      }
    } catch (error) {
      console.warn('[DeviceAlarmTag] 模型根节点匹配失败', node.name, error);
    }
  });
  return best && best.contained > 0 ? best.node : null;
}
