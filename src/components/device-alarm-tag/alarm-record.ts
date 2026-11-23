import {SceneLabelText} from './types';

/** 页面原来按这两个色表把告警类型画成标注颜色。 */
export const alarmStatusColors: Record<string, string> = {
  green: '#1f9d55',
  warning: '#d4a017',
  urgent: '#e11d2e',
};

/** 找模型根节点时使用的默认探针坐标。实时坐标优先。 */
export const alarmRootPositions = {
  overview: {
    X06: [66, 20, -91],
    X03: [-112, 21, -116],
    X02: [-128, 16, 95],
    X12: [64, 28, 80],
  },
  floor: {
    F1: [12, 16, -14],
    F2: [23, 16, -23],
    F3: [35, 16, -16],
  },
} as const;

export type AlarmRootScene = keyof typeof alarmRootPositions;

const alarmTypeAliases: Record<string, string> = {red: 'urgent', yellow: 'warning'};
const alarmTextFont = '500 20px SourceHanSansSC, "Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
const alarmTextXCache = new Map<string, number>();

export function alarmNameKey(name: unknown) {
  return String(name == null ? '' : name).trim().toUpperCase();
}

export function alarmRecord(data: unknown, id: string) {
  const key = alarmNameKey(id);
  if (!key) return undefined;
  if (Array.isArray(data)) {
    return data.find(item => item && alarmNameKey(item.name || item.id) === key);
  }
  if (data && typeof data === 'object') {
    const source = data as Record<string, any>;
    const record = source[id] ?? source[key];
    return record && typeof record === 'object' ? record : undefined;
  }
  return undefined;
}

/** 记录里的 color 优先。只有类型时按绿 / 警告 / 紧急取色，没有记录时留给默认色。 */
export function alarmLabelColor(record: any): string | undefined {
  if (!record || typeof record !== 'object') return undefined;
  if (Object.prototype.hasOwnProperty.call(record, 'color')) {
    return typeof record.color === 'string' && record.color.trim() || undefined;
  }
  const type = String(record.type || '').trim().toLowerCase();
  if (!type) return undefined;
  return alarmStatusColors[alarmTypeAliases[type] || type] || alarmStatusColors.green;
}

/** 标注文案为名称，或「名称-数量」，末尾保留不换行空格和 >。 */
export function alarmLabelCaption(record: any, name: string) {
  const source = record || {};
  const title = source.name == null || String(source.name).trim() === '' ? name : String(source.name).trim();
  const text = source.count == null || source.count === '' ? title : `${title}-${source.count}`;
  return `${text}\u00a0>`;
}

export function alarmLabelTextX(text: string) {
  const cached = alarmTextXCache.get(text);
  if (cached !== undefined) return cached;
  const context = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  let x = 52;
  if (context) {
    context.font = alarmTextFont;
    const width = context.measureText(text.replace('\u00a0>', '')).width + 6 + context.measureText('>').width;
    x = 52 + width <= 140 ? 52 : Math.max(44, 140 - width);
  }
  alarmTextXCache.set(text, x);
  return x;
}

export function layoutAlarmCaption(text: SceneLabelText, record: any, name: string): SceneLabelText {
  const content = alarmLabelCaption(record, name);
  const x = alarmLabelTextX(content);
  const fit = text.fitWidth ?? 140;
  return {...text, text: content, x, width: fit - x};
}

export function alarmLabelPosition(record: any, fallback?: [number, number, number]) {
  const position = record && Array.isArray(record.position) && record.position.length >= 3 ? record.position.slice(0, 3) : fallback;
  return position as [number, number, number] | undefined;
}

/** 有实时列表时用列表坐标选根节点，否则用该场景的默认坐标。 */
export function alarmProbePoints(data: unknown, scene: AlarmRootScene) {
  const defaults = alarmRootPositions[scene];
  const positions = defaults as Record<string, readonly number[]>;
  if (Array.isArray(data) && data.length) {
    return data.map(item => item?.position || positions[item?.name] || positions[alarmNameKey(item?.name)] || [0, 0, 0]);
  }
  return Object.keys(defaults).map(name => defaults[name]);
}
