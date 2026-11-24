import {EditorButton, EditorInput, EditorSelect} from './Controls';
import {createElement, PureComponent, useEffect, useRef, useState} from 'react';
import {bindLabelAnchor, findPlacementViewport, isPlacementHotspot, listPlacementAnchors, observePlacementViewport, startLabelPlacement} from './placement';
import {sceneLabelEditorCss} from './EditorSetter';

export default function LabelPlacementSetter(props: any) {
  const mode = props.mode || 'full';
  const node = props.prop?.node || props.field?.node;
  const [message, setMessage] = useState('选中标注后，可绑定已有锚点，或在模型表面点选位置。');
  const [query, setQuery] = useState('');
  const [hotspotSearch, setHotspotSearch] = useState('');
  const [includeModels, setIncludeModels] = useState(false);
  const [anchors, setAnchors] = useState<{items: {id: string; label: string}[]; total: number}>({items: [], total: 0});
  const [, refresh] = useState(0);
  const stop = useRef<() => void>(null);
  useEffect(() => () => {stop.current?.();}, [node]);
  const items = node?.getPropValue?.('items');
  const labels = Array.isArray(items) ? items.filter(item => item?.id) : [];
  const selected = labels.find(item => item.id === node?.getPropValue?.('designItemId')) || labels[0];
  const follow = node?.getPropValue?.('designFollow') === true;
  const scope = node?.getPropValue?.('loaderId');
  useEffect(() => {
    return observePlacementViewport(node, viewport => {
      stop.current?.(); stop.current = null;
      setHotspotSearch('');
      if (mode !== 'tools') setAnchors(viewport ? listPlacementAnchors(viewport, query, includeModels ? 200 : Infinity, includeModels) : {items: [], total: 0});
    });
  }, [node, scope, query, includeModels, mode]);
  const cancel = () => {stop.current?.(); stop.current = null; setMessage('已取消拾取。');};
  const apply = (id: string, placement: object, message: string) => {
    const current = node?.getPropValue?.('items');
    if (!Array.isArray(current) || !current.some(item => item?.id === id)) {setMessage('该标注已移除，未写入位置。'); return;}
    node.setPropValue('items', current.map(item => item?.id === id ? {...item, ...placement} : item));
    node.setPropValue('designItemId', id); node.setPropValue('designFollow', true);
    setMessage(message); refresh(value => value + 1);
  };
  const loadAnchors = () => {
    const viewport = findPlacementViewport(node);
    if (!viewport) {setAnchors({items: [], total: 0}); setMessage('未找到三维视图，请先放入并加载三维场景。'); return;}
    setAnchors(listPlacementAnchors(viewport, query, includeModels ? 200 : Infinity, includeModels));
  };
  const pick = () => {
    stop.current?.(); stop.current = null;
    if (!selected) {setMessage('请先配置标注列表。表达式生成的列表需在表达式中设置坐标。'); return;}
    const viewport = findPlacementViewport(node);
    if (!viewport?.isActive) {setMessage('未找到就绪的三维视图，请等待场景加载完成。'); return;}
    const id = selected.id;
    setMessage('请点击三维视图中的模型表面；Esc 或“取消拾取”退出。');
    stop.current = startLabelPlacement(viewport, placement => {
      stop.current = null;
      apply(id, placement, '已放置到模型上，可旋转相机验证，或调整下方 X / Y / Z。');
    }, status => {setMessage(status);});
  };
  const buttonStyle = {marginTop: 8, marginRight: 4};
  const labelSelect = labels.length > 1 ? createElement(EditorSelect, {'aria-label': '定位标注', value: selected?.id || '', style: {width: '100%'}, onChange: event => {
    cancel(); node?.setPropValue?.('designItemId', event.currentTarget.value); refresh(value => value + 1);
  }}, ...labels.map(item => createElement('option', {key: item.id, value: item.id}, item.id))) : null;
  const target = typeof selected?.target === 'string' ? selected.target : '';
  const listedTarget = anchors.items.some(item => item.id === target);
  const hotspotSelect = createElement(EditorSelect, {'aria-label': '热点选择', value: listedTarget ? target : undefined,
    showSearch: true, searchValue: hotspotSearch, onSearch: setHotspotSearch, onSearchClear: () => setHotspotSearch(''), cacheValue: false,
    placeholder: selected?.target?.type === 'JSExpression' ? '当前由变量定位，搜索热点可替换' : '搜索当前场景热点名称或 UUID',
    notFoundContent: '当前场景没有匹配的热点', style: {width: '100%'}, onFocus: loadAnchors, onChange: event => {
    stop.current?.(); stop.current = null;
    if (!selected || !event.currentTarget.value) return;
    const viewport = findPlacementViewport(node);
    const object = viewport?.scene?.getObjectByProperty('uuid', event.currentTarget.value);
    if ((!includeModels || mode === 'hotspot') && !isPlacementHotspot(object)) {
      setMessage('该热点已不在当前场景，请重新选择。'); loadAnchors(); return;
    }
    const placement = viewport && bindLabelAnchor(viewport, event.currentTarget.value, Math.max(0, -(selected.offsetY || 0)));
    if (!placement) {setMessage('锚点已不在当前场景，请刷新列表后重选。'); return;}
    setHotspotSearch('');
    apply(selected.id, placement, '已绑定锚点：底部中心对齐，卡片显示在锚点上方。');
  }}, ...anchors.items.map(item => createElement('option', {key: item.id, value: item.id}, item.label)));
  const bindingHint = target && !listedTarget ? createElement('div', {style: {fontSize: 12, marginTop: 6}}, '已有位置绑定已保留；下拉仅列出当前场景热点，选择后会替换绑定。') : null;
  const gapInput = createElement('label', {style: {display: 'block', marginTop: 8}}, '上方间距（px）', createElement(EditorInput, {
      type: 'number', min: 0, step: 1, 'aria-label': '上方间距（px）', value: Math.max(0, -(selected?.offsetY || 0)), style: {width: '100%', boxSizing: 'border-box'},
      onChange: event => {
        const gap = Number(event.currentTarget.value);
        if (!selected || !Number.isFinite(gap) || gap < 0 || event.currentTarget.value === '') return;
        apply(selected.id, {centerX: 0.5, centerY: 1, offsetY: gap > 0 ? -gap : 0}, '已调整标注与锚点的上方间距。');
      },
    }));
  if (mode === 'hotspot') return createElement('div', {className: 'scene-label-editor'}, createElement('style', {}, sceneLabelEditorCss), labelSelect, hotspotSelect, bindingHint, gapInput,
    createElement(EditorButton, {type: 'button', style: buttonStyle, onClick: loadAnchors}, '刷新热点'),
    createElement('div', {role: 'status', style: {fontSize: 12, marginTop: 8}}, message));
  return createElement('div', {className: 'scene-label-editor'}, createElement('style', {}, sceneLabelEditorCss),
    labelSelect,
    mode === 'full' ? createElement(EditorInput, {'aria-label': '搜索场景锚点', placeholder: '锚点名称或 UUID', value: query, style: {width: '100%', boxSizing: 'border-box', marginTop: 8}, onChange: event => setQuery(event.currentTarget.value)}) : null,
    mode === 'full' ? createElement('label', {style: {display: 'block', marginTop: 8}}, createElement(EditorInput, {type: 'checkbox', checked: includeModels, onChange: event => setIncludeModels(event.currentTarget.checked)}), '同时显示模型和分组') : null,
    mode === 'full' ? createElement(EditorButton, {type: 'button', style: buttonStyle, onClick: loadAnchors}, '筛选 / 刷新场景锚点') : null,
    mode === 'full' ? hotspotSelect : null,
    mode === 'full' ? bindingHint : null,
    mode === 'full' && anchors.total > anchors.items.length ? createElement('div', {style: {fontSize: 12}}, `共 ${anchors.total} 个对象，仅列出前 ${anchors.items.length} 个，请搜索名称。`) : null,
    mode === 'full' ? gapInput : null,
    createElement(EditorButton, {type: 'button', style: buttonStyle, onClick: pick}, '在模型上拾取位置'),
    createElement(EditorButton, {type: 'button', style: buttonStyle, onClick: cancel}, '取消拾取'),
    createElement(EditorButton, {type: 'button', style: buttonStyle, onClick: () => {
      node?.setPropValue?.('designFollow', !follow); refresh(value => value + 1);
    }}, follow ? '返回卡片样式调试' : '预览三维位置'),
    createElement('div', {role: 'status', style: {fontSize: 12, marginTop: 8}}, message),
  );
}

/** Older low-code engines interpret function components as dynamic setter factories. */
export class SceneLabelHotspotSetter extends PureComponent<any> {
  static displayName = 'SceneLabelHotspotSetter';
  render() {return createElement(LabelPlacementSetter, {...this.props, mode: 'hotspot'});}
}

export class SceneLabelPlacementToolsSetter extends PureComponent<any> {
  static displayName = 'SceneLabelPlacementToolsSetter';
  render() {return createElement(LabelPlacementSetter, {...this.props, mode: 'tools'});}
}
