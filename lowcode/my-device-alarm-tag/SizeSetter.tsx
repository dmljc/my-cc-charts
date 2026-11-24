import {createElement, PureComponent} from 'react';
import {EditorInput} from './Controls';
import {labelPixelSize} from '../../src/components/my-device-alarm-tag/style';
import {sceneLabelEditorCss} from './EditorSetter';

/** Resize the selected card, rather than a different outer layout box. */
export class SceneLabelSizeSetter extends PureComponent<any> {
  static displayName = 'SceneLabelSizeSetter';
  render() {
    const node = (this.props.field || this.props.prop)?.node;
    const raw = node?.getPropValue?.('items');
    const items = Array.isArray(raw) ? raw : [];
    const current = items.find(item => item?.id === node?.getPropValue?.('designItemId')) || items[0];
    const style = node?.getPropValue?.('style') || {};
    const update = (key: 'width' | 'height', value: string) => {
      const size = Number(value);
      if (!current || !value || !Number.isFinite(size) || size <= 0) return;
      node.setPropValue('items', items.map(item => item === current ? {...item, [key]: size, ...(key === 'height' ? {autoHeight: false} : {})} : item));
      if (items.length === 1) {
        node.setPropValue(key, size);
        node.setPropValue('style', {...style, [key]: size});
      }
      this.forceUpdate();
    };
    return createElement('div', {className: 'scene-label-editor'}, createElement('style', {}, sceneLabelEditorCss),
      createElement('div', {style: {display: 'flex', gap: 8}}, ...(['width', 'height'] as const).map(key => {
        const fallback = labelPixelSize(current?.[key], labelPixelSize(node?.getPropValue?.(key), key === 'width' ? 180 : 90));
        return createElement('label', {key, style: {flex: 1, minWidth: 0}}, createElement('span', {}, key === 'width' ? '宽度（px）' : '高度（px）'),
          createElement(EditorInput, {type: 'number', min: 1, disabled: !current, 'aria-label': `标注${key === 'width' ? '宽度' : '高度'}`,
            value: items.length === 1 ? labelPixelSize(style[key], fallback) : fallback, onChange: event => update(key, event.currentTarget.value)}));
      })),
      createElement('p', {className: 'scene-label-hint'}, current ? '修改当前标注的实际尺寸。设置高度后使用固定高度，背景图片铺满卡片。' : '请先添加卡片；列表变量生成的尺寸需在表达式中设置。'));
  }
}
