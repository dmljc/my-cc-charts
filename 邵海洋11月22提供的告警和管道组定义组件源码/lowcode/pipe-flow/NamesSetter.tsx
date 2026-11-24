import {createElement, PureComponent, useEffect, useState} from 'react';
import {EditorButton} from '../scene-labels/Controls';
import {findPlacementViewport} from '../scene-labels/placement';
import {defaultPipeNames, importPipeNames, parsePipeNames} from '../../src/components/pipe-flow/model';

function NamesEditor(props: any) {
  const field = props.field || props.prop;
  const node = field?.node;
  const value = props.value ?? field?.getValue?.() ?? defaultPipeNames;
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [message, setMessage] = useState('填写一个名称数组；默认使用当前工程的 9 个流动模型。');
  const serialized = JSON.stringify(value);
  useEffect(() => {setText(JSON.stringify(value, null, 2));}, [serialized]);
  const save = (next: string[]) => {
    if (props.onChange) props.onChange(next); else field?.setValue?.(next);
    setText(JSON.stringify(next, null, 2)); setMessage(`已保存 ${next.length} 个名称。`);
  };
  return createElement('div', {style: {minWidth: 0, maxWidth: '100%', fontSize: 12}},
    createElement('textarea', {'aria-label': '管道名称数组', value: text, rows: 7, spellCheck: false,
      style: {boxSizing: 'border-box', width: '100%', resize: 'vertical', padding: 6, color: 'inherit',
        background: 'var(--color-fill1-1,transparent)', border: '1px solid var(--color-line1-2,#666)', borderRadius: 3},
      onChange: event => setText(event.currentTarget.value)}),
    createElement('div', {style: {display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6}},
      createElement(EditorButton, {onClick: () => {try {save(parsePipeNames(text));} catch (error) {setMessage(error.message);}}}, '应用名称数组'),
      createElement(EditorButton, {onClick: () => {
        const viewport = findPlacementViewport(node);
        if (!viewport) {setMessage('未找到唯一的三维视图，请先加载场景；多个加载器时指定加载器标识。'); return;}
        const next = importPipeNames(viewport.scene, node?.getPropValue?.('groupPrefix'));
        if (!next.length) {setMessage('没有匹配分组下带贴图的模型，请切换到管道所在场景或检查前缀。'); return;}
        save(next);
      }}, '从当前场景导入')),
    createElement('div', {role: 'status', style: {marginTop: 6, lineHeight: 1.6, overflowWrap: 'anywhere'}}, message));
}

export class PipeNamesSetter extends PureComponent<any> {
  static displayName = 'PipeNamesSetter';
  render() {return createElement(NamesEditor, this.props);}
}
