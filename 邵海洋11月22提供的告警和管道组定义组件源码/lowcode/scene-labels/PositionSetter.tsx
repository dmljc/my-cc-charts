import {EditorInput} from './Controls';
import {createElement, PureComponent} from 'react';

interface Props {value?: number[] | {type: string; value: string; mock?: number[]}; onChange?: (value: number[]) => void;}

/** Array-valued numeric inputs, without turning coordinates into strings. */
export default function LabelPositionSetter({value, onChange}: Props) {
  const bound = !Array.isArray(value) && value?.type === 'JSExpression';
  const source = Array.isArray(value) ? value : bound ? value.mock : undefined;
  const coordinates = [0, 1, 2].map(index => Number.isFinite(source?.[index]) ? source[index] : 0);
  return createElement('div', {}, bound ? createElement('div', {style: {fontSize: 12, marginBottom: 6}}, '当前坐标由变量提供；修改坐标或选择热点后使用手动位置。') : null,
    createElement('div', {style: {display: 'flex', gap: 6}}, ...['X', 'Y', 'Z'].map((axis, index) =>
    createElement('label', {key: axis, style: {flex: 1, minWidth: 0}}, axis,
      createElement(EditorInput, {'aria-label': `标注坐标 ${axis}`, type: 'number', step: 'any', value: coordinates[index],
        style: {width: '100%', boxSizing: 'border-box'},
        onChange: event => {
          if (event.currentTarget.value === '') return;
          const next = Number(event.currentTarget.value);
          if (!Number.isFinite(next)) return;
          const updated = [...coordinates]; updated[index] = next; onChange?.(updated);
        },
      })))),
  );
}

export class SceneLabelPositionSetter extends PureComponent<Props> {
  static displayName = 'SceneLabelPositionSetter';
  render() {return createElement(LabelPositionSetter, this.props);}
}
