import {CSSProperties} from 'react';

// The designer writes placement into style. Never apply it to every inner card.
const layoutKeys = new Set([
  'position', 'left', 'top', 'right', 'bottom', 'inset', 'insetBlock', 'insetInline',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'transform', 'transformOrigin', 'translate', 'rotate', 'scale', 'zIndex',
  'display', 'float', 'clear', 'flex', 'flexGrow', 'flexShrink', 'flexBasis',
  'alignSelf', 'justifySelf', 'order', 'gridArea', 'gridRow', 'gridColumn',
  'pointerEvents', 'visibility',
]);

export function splitLabelStyle(style: CSSProperties = {}, cardStyle: CSSProperties = {}) {
  const layout: CSSProperties = {}, appearance: CSSProperties = {};
  Object.keys(style).forEach(key => {(layoutKeys.has(key) ? layout : appearance)[key] = style[key];});
  Object.keys(cardStyle).forEach(key => {if (!layoutKeys.has(key)) appearance[key] = cardStyle[key];});
  return {layout, appearance};
}

/** Projection uses CSS pixels; percentages/calc remain designer-only layout. */
export function labelPixelSize(value: string | number, fallback: number) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && /^\d+(?:\.\d+)?(?:px)?$/.test(value.trim()) ? Number(value.trim().replace(/px$/, '')) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
