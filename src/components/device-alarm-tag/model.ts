import {SceneLabelItem, SceneLabelText, DeviceAlarmTagProps} from './types';
import {isExampleLabelImage} from './presets';

export function readLabelField(value: any, path: string): any {
  if (!path) return value;
  return path.split('.').reduce((current, key) => current == null ? undefined : current[key], value);
}

export function getLabelData(item: SceneLabelItem, data: DeviceAlarmTagProps['data']) {
  // Label IDs can contain dots, so look up the key itself rather than a field path.
  return data?.[item.dataKey || item.id];
}

export function getLabelValue(item: SceneLabelItem, data: any, stateField = 'status') {
  if (item.value !== undefined) return item.value;
  return data !== null && typeof data === 'object' ? readLabelField(data, item.stateField || stateField) : data;
}

function numberMatchesText(number: number, text: string) {
  // Only decimal numeric text participates; do not coerce booleans, blanks or identifiers.
  return Number.isFinite(number) && (!Number.isInteger(number) || Number.isSafeInteger(number)) &&
    /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text.trim()) && Number(text) === number;
}

function matchesNumericState(rule: any, value: any) {
  if (typeof rule === 'number' && typeof value === 'string') return numberMatchesText(rule, value);
  if (typeof rule === 'string' && typeof value === 'number') return numberMatchesText(value, rule);
  return false;
}

export function getLabelImage(item: SceneLabelItem, value: any, props: DeviceAlarmTagProps) {
  const rules = item.backgroundRules === undefined ? props.backgroundRules : item.backgroundRules;
  // Preserve deliberately distinct typed rules before trying numeric string compatibility.
  const match = Array.isArray(rules) && (rules.find(rule => rule && rule.value === value) ||
    rules.find(rule => rule && matchesNumericState(rule.value, value)));
  const image = match ? match.image || '' : item.image || props.defaultImage || '';
  // Demo rules must not hide a user picture configured on the card or component.
  if (isExampleLabelImage(image)) {
    return [item.image, props.defaultImage].find(image => image && !isExampleLabelImage(image)) ||
      (getLabelColor(item, props) !== undefined ? '' : image);
  }
  return image;
}

export function getLabelMaskImage(item: SceneLabelItem, props: DeviceAlarmTagProps) {
  return item.maskImage === undefined ? props.maskImage : item.maskImage;
}

function usableLabelColor(color: any) {
  const value = typeof color === 'string' ? color.trim() : '';
  if (!value || value.startsWith('#') && !/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value) ||
    typeof CSS !== 'undefined' && CSS.supports && !CSS.supports('color', value)) return undefined;
  return value;
}

export function getLabelColor(item: SceneLabelItem, props: DeviceAlarmTagProps) {
  const color = item.color === undefined ? props.color : item.color;
  // Keep legacy image-only cards unchanged. The fallback applies in direct-color mode.
  if (color === undefined && !getLabelMaskImage(item, props)) return undefined;
  return usableLabelColor(color) || usableLabelColor(props.defaultColor) || '#808080';
}

export function getLabelText(text: SceneLabelText, data: any) {
  const value = text.text !== undefined ? text.text : readLabelField(data, text.field || '');
  const content = value == null ? '—' : String(value);
  return `${text.prefix || ''}${content}${text.suffix || ''}`;
}

export function validLabelItems(items: DeviceAlarmTagProps['items']): SceneLabelItem[] {
  const seen = new Set<string>();
  return (Array.isArray(items) ? items : []).filter(item => {
    if (!item || typeof item.id !== 'string' || !item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function labelSize(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Match the stack card's padding, row gap and line-height without measuring DOM per frame. */
export function stackLabelHeight(item: SceneLabelItem, data: any) {
  const texts = (Array.isArray(item.texts) ? item.texts : []).filter(Boolean);
  return 22 + Math.max(0, texts.length - 1) * 6 + texts.reduce((height, text) => {
    const lines = getLabelText(text, data).split(/\r\n|\r|\n/).length;
    return height + Math.ceil(labelSize(text.fontSize, 14) * 1.4) * lines;
  }, 0);
}
