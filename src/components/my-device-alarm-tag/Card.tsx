import {createElement, memo, useCallback, CSSProperties} from 'react';
import {isExampleLabelImage} from './presets';

export interface LabelCardText {
  key: string | number;
  field: string | number;
  content: string;
  x: number; y: number; width?: number; fontSize: number; color: string;
  align: 'left' | 'center' | 'right';
}

export interface LabelCardModel {
  id: string;
  width: number; height: number;
  image: string;
  color?: string;
  maskImage?: string;
  texts: LabelCardText[];
  textLayout?: 'stack' | 'free';
  design: boolean;
  clickable: boolean;
  style?: CSSProperties;
}

interface Props {
  model: LabelCardModel;
  onElement: (id: string, element: HTMLDivElement) => void;
  onActivate: (id: string) => void;
}

function equalStyle(a: CSSProperties, b: CSSProperties) {
  if (a === b) return true;
  const left = a || {}, right = b || {};
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every(key => left[key] === right[key]);
}

function equalProps(previous: Props, next: Props) {
  const a = previous.model, b = next.model;
  if (previous.onElement !== next.onElement || previous.onActivate !== next.onActivate || a.id !== b.id || a.width !== b.width || a.height !== b.height || a.image !== b.image || a.color !== b.color || a.maskImage !== b.maskImage || a.design !== b.design || a.clickable !== b.clickable || a.textLayout !== b.textLayout || !equalStyle(a.style, b.style) || a.texts.length !== b.texts.length) return false;
  return a.texts.every((text, index) => {
    const other = b.texts[index];
    return text.key === other.key && text.field === other.field && text.content === other.content && text.x === other.x && text.y === other.y && text.width === other.width && text.fontSize === other.fontSize && text.color === other.color && text.align === other.align;
  });
}

/** Compare displayed values, so freshly-created state objects do not redraw all labels. */
export const LabelCard = memo(function LabelCard({model, onElement, onActivate}: Props) {
  const {id, width, height, design, clickable, image, color, maskImage, texts, style} = model;
  const stacked = model.textLayout === 'stack';
  const appearance = {...style};
  const shorthandImage = /(?:url|(?:repeating-)?(?:linear|radial|conic)-gradient|image-set)\s*\(/i.test(appearance.background || '');
  const styledImage = shorthandImage || !!appearance.backgroundImage && !/^(?:none|initial|unset|revert(?:-layer)?)$/i.test(appearance.backgroundImage.trim());
  // The style panel may replace the saved demo SVG, but a real state image stays authoritative.
  const cardImage = styledImage && isExampleLabelImage(image) ? '' : image;
  if (cardImage) {
    delete appearance.backgroundImage;
    if (shorthandImage) delete appearance.background;
  }
  const hasColor = color !== undefined;
  const hasImage = !!cardImage || styledImage || hasColor;
  const mask = maskImage ? `url(${JSON.stringify(maskImage)})` : undefined;
  const ref = useCallback((element: HTMLDivElement) => onElement(id, element), [id, onElement]);
  const click = () => onActivate(id);
  return createElement('div', {
    'data-scene-label': id, ref,
    style: {position: design ? 'relative' : 'absolute', left: 0, top: 0, width: design ? '100%' : width, height: design ? '100%' : height, visibility: design ? 'visible' : 'hidden', pointerEvents: design || clickable ? 'auto' : 'none'},
  }, createElement('div', {
    role: clickable ? 'button' : undefined, tabIndex: clickable ? 0 : undefined, 'aria-label': id,
    onClick: clickable ? event => {event.stopPropagation(); click();} : undefined,
    onPointerDown: clickable ? event => event.stopPropagation() : undefined,
    onKeyDown: clickable ? event => {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); event.stopPropagation(); click();}} : undefined,
    style: {boxSizing: 'border-box', overflow: 'hidden', borderRadius: 6, backgroundColor: hasImage ? 'transparent' : '#083247e6', border: hasImage ? 'none' : '1px solid #3396bf', backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', color: '#ffffff', cursor: clickable ? 'pointer' : 'default', ...appearance, ...(hasColor ? {backgroundColor: mask ? 'transparent' : color} : {}), position: 'relative', width: '100%', height: '100%', ...(stacked ? {display: 'flex', flexDirection: 'column', gap: 6, padding: 10} : {})},
  }, hasColor && mask ? createElement('div', {
    'data-label-color': true,
    style: {position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', backgroundColor: color, maskImage: mask, WebkitMaskImage: mask, maskSize: '100% 100%', WebkitMaskSize: '100% 100%', maskPosition: 'center', WebkitMaskPosition: 'center', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', pointerEvents: 'none'},
  }) : null, cardImage ? createElement('img', {
    'data-label-image': true, src: cardImage, alt: '', draggable: false,
    style: {position: 'absolute', left: 0, top: 0, display: 'block', width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none', objectFit: 'fill', pointerEvents: 'none'},
  }) : null, ...texts.map(text => createElement('span', {
    key: text.key, 'data-label-text': text.field,
    style: {position: stacked ? 'relative' : 'absolute', ...(stacked ? {flexShrink: 0, lineHeight: `${Math.ceil(labelFontSize(text.fontSize) * 1.4)}px`, whiteSpace: 'pre', overflow: 'hidden'} : {left: text.x, top: text.y, whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}), width: text.width, fontSize: text.fontSize, color: text.color, textAlign: text.align, pointerEvents: 'none'},
  }, text.content))));
}, equalProps);

function labelFontSize(value: number) {return Number.isFinite(value) && value > 0 ? value : 14;}
