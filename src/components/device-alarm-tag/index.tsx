// 设备告警标注
import {createElement, CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {findLabelViewport, LabelViewport, observeLabelViewports} from '../../utils/render/src/labels/LabelViewport';
import {alarmLabelColor, alarmLabelPosition, alarmProbePoints, alarmRecord, layoutAlarmCaption} from './alarm-record';
import {findAlarmModelRoot, removeLegacyAlarmOverlays} from './model-root';
import {getLabelColor, getLabelData, getLabelImage, getLabelMaskImage, getLabelText, getLabelValue, labelSize, stackLabelHeight, validLabelItems} from './model';
import {LabelProjection} from './Projection';
import {DeviceAlarmTagProps} from './types';
import {acquireLabelLayer, SharedLabelLayer} from '../../utils/render/src/labels/LabelLayer';
import {LabelCard, LabelCardModel} from './Card';
import {labelPixelSize, splitLabelStyle} from './style';
import {exampleLabelData, exampleLabelItems, exampleLabelRules, isExampleLabelImage} from './presets';
import {DesignLabelProjection} from './DesignProjection';
import {acquireHotspotVisibility} from '../../utils/render/src/labels/HotspotVisibility';

export * from './types';

interface Binding {viewport: LabelViewport; layer: SharedLabelLayer;}

export default function DeviceAlarmTag(props: DeviceAlarmTagProps) {
  const {loaderId, stateField = 'status', visible = true, onLabelClick} = props;
  const data = props.data === undefined && props.items === undefined ? exampleLabelData : props.data;
  const design = props.__designMode === 'design';
  const [binding, setBinding] = useState<Binding>(null);
  const [modelRoot, setModelRoot] = useState<{target: string; sceneId: string} | null>(null);
  const elements = useRef(new Map<string, HTMLElement>());
  const root = useRef<HTMLDivElement>(null);
  const projection = useRef<LabelProjection | DesignLabelProjection>(null);
  const {layout, appearance} = splitLabelStyle(props.style, props.cardStyle);
  const width = labelPixelSize(layout.width, labelSize(props.width, 180));
  const height = labelPixelSize(layout.height, labelSize(props.height, 90));
  const sourceItems = validLabelItems(props.items === undefined ? exampleLabelItems : props.items);
  const imageProps = props.items === undefined && props.backgroundRules === undefined ? {...props, backgroundRules: exampleLabelRules} : props;
  // Resolve the same dimensions for the designer, card and projection. A single card
  // can be resized through the style panel even when an older schema saved item sizes.
  const items = sourceItems.map(item => {
    const alarm = alarmRecord(data, item.id);
    const resolved: typeof item = {...item,
      position: alarmLabelPosition(alarm, item.position),
      texts: (Array.isArray(item.texts) ? item.texts : []).map(text => text?.field === 'alarmLabel' ? layoutAlarmCaption(text, alarm, item.id) : text),
    };
    if (resolved.color === undefined && props.color === undefined) resolved.color = alarmLabelColor(alarm);
    if (props.attachModelRoot && !resolved.target && modelRoot) {
      resolved.target = modelRoot.target;
      resolved.sceneId = resolved.sceneId || modelRoot.sceneId;
    }
    const record = getLabelData(resolved, data) || alarm;
    const image = getLabelImage(resolved, getLabelValue(resolved, record, stateField), imageProps);
    const customImage = !!image && !isExampleLabelImage(image) || hasLabelStyleImage(appearance) || getLabelColor(resolved, props) !== undefined;
    const styledHeight = labelPixelSize(layout.height, 0);
    const single = sourceItems.length === 1;
    const manualHeight = single && styledHeight > 0 && styledHeight !== labelSize(props.height, 90);
    const autoHeight = item.textLayout === 'stack' && item.autoHeight !== false && !customImage && !manualHeight;
    return {...resolved,
      width: single ? labelPixelSize(layout.width, labelSize(item.width, width)) : labelSize(item.width, width),
      height: autoHeight ? stackLabelHeight(resolved, record) : single ? labelPixelSize(layout.height, labelSize(item.height, height)) : labelSize(item.height, height),
    };
  });
  const designItem = items.find(item => item.id === props.designItemId) || items[0];
  const displayedItems = design ? designItem ? [designItem] : [] : items;
  const following = design && props.designFollow === true;
  const enabled = (!design || following) && visible && items.length > 0;
  const latest = useRef({props, items});
  latest.current = {props, items};
  const hotspotControl = useRef<() => void>(null);
  const onElement = useCallback((id: string, element: HTMLDivElement) => {
    if (element) elements.current.set(id, element); else elements.current.delete(id);
  }, []);
  const onActivate = useCallback((id: string) => {
    const current = latest.current;
    const item = current.items.find(label => label.id === id);
    if (!item) return;
    const source = current.props.data === undefined && current.props.items === undefined ? exampleLabelData : current.props.data;
    const record = alarmRecord(source, id) || getLabelData(item, source);
    current.props.onLabelClick?.({id, value: getLabelValue(item, record, current.props.stateField), data: record});
  }, []);

  useEffect(() => {
    if (!props.attachModelRoot || !visible) return undefined;
    let timer = 0;
    let stopped = false;
    const deadline = Date.now() + 30000;
    const attempt = () => {
      if (stopped) return;
      const viewport = findLabelViewport(loaderId);
      removeLegacyAlarmOverlays(viewport?.dom);
      const scene = viewport?.scene;
      const root = scene && findAlarmModelRoot(scene, alarmProbePoints(data, props.modelRootScene === 'floor' ? 'floor' : 'overview'));
      if (scene && root) {
        setModelRoot(current => current?.target === root.uuid && current.sceneId === scene.uuid ? current : {target: root.uuid, sceneId: scene.uuid});
        return;
      }
      if (Date.now() < deadline) timer = window.setTimeout(attempt, 100);
    };
    const stop = observeLabelViewports(attempt);
    attempt();
    return () => {stopped = true; window.clearTimeout(timer); stop();};
  }, [props.attachModelRoot, props.modelRootScene, visible, loaderId, data]);

  useEffect(() => {
    if (!enabled) {setBinding(null); return undefined;}
    let acquired: ReturnType<typeof acquireLabelLayer>;
    let previous: LabelViewport;
    let container: HTMLElement;
    const update = () => {
      const viewport = findLabelViewport(loaderId);
      if (previous === viewport && container === viewport?.dom) return;
      const old = acquired;
      previous = viewport;
      container = viewport?.dom;
      acquired = container ? acquireLabelLayer(viewport) : null;
      setBinding(acquired ? {viewport, layer: acquired.layer} : null);
      old?.release();
    };
    const stop = observeLabelViewports(update);
    update();
    return () => {stop(); acquired?.release();};
  }, [loaderId, enabled]);

  useEffect(() => {
    // Only this player's CSS2D renderer is controlled, including in the designer.
    // The editor's shared scene and Object3D.visible remain untouched.
    if (props.syncHotspotVisibility !== true) return undefined;
    let previous: LabelViewport;
    let lease: ReturnType<typeof acquireHotspotVisibility>;
    const update = () => {
      const viewport = findLabelViewport(loaderId);
      if (previous !== viewport) {
        lease?.release();
        previous = viewport;
        lease = viewport ? acquireHotspotVisibility(viewport) : null;
      }
      const current = latest.current;
      lease?.update(current.items.filter(item => item.target).map(item => ({
        target: item.target, sceneId: item.sceneId || viewport.scene?.uuid,
        visible: (current.props.visible === undefined || !!current.props.visible) && item.visible !== false,
      })));
    };
    hotspotControl.current = update;
    const stop = observeLabelViewports(update);
    update();
    return () => {stop(); lease?.release(); if (hotspotControl.current === update) hotspotControl.current = null;};
  }, [loaderId, design, props.syncHotspotVisibility]);

  useLayoutEffect(() => {hotspotControl.current?.();});

  useLayoutEffect(() => {
    if (!binding || !root.current || !enabled) return undefined;
    const current = following ? new DesignLabelProjection(binding.viewport, root.current) : new LabelProjection([], elements.current, root.current);
    projection.current = current;
    const stop = binding.layer.subscribe(current);
    return () => {stop(); if (projection.current === current) projection.current = null;};
  }, [binding, enabled, following]);

  useLayoutEffect(() => {
    if (projection.current?.reconcile(following ? displayedItems : items, elements.current, width, height)) binding?.layer.invalidateTargets();
  });

  if (!visible) return null;
  const cards = displayedItems.map(item => {
    const record = getLabelData(item, data);
    const value = getLabelValue(item, record, stateField);
    const image = getLabelImage(item, value, imageProps);
    const model: LabelCardModel = {id: item.id, width: labelSize(item.width, width), height: labelSize(item.height, height), image, color: getLabelColor(item, props), maskImage: getLabelMaskImage(item, props), design, clickable: !!onLabelClick && !design, style: appearance, textLayout: item.textLayout,
      texts: (Array.isArray(item.texts) ? item.texts : []).map((text, index) => text ? {
        key: text.id || index, field: text.field || text.id || index, content: getLabelText(text, record),
        x: text.x ?? 12, y: text.y ?? 10 + index * 24, width: text.width, fontSize: labelSize(text.fontSize, 14), color: text.color || '#ffffff', align: text.align || 'left',
      } : null).filter(Boolean),
    };
    return createElement(LabelCard, {key: item.id, model, onElement, onActivate});
  });

  if (design) return createElement('div', {
    ref: root,
    className: props.className, 'data-scene-labels-design': designItem?.id || 'empty',
    title: designItem ? `设备告警标注 · ${designItem.id}` : '设备告警标注',
    style: {position: 'absolute', left: 0, top: 0, zIndex: props.zIndex ?? 20, ...layout, width: labelSize(designItem?.width, width), height: labelSize(designItem?.height, height), boxSizing: 'border-box', pointerEvents: 'auto', ...(following ? {transform: undefined, margin: 0, visibility: 'hidden'} : {})},
  }, ...cards, cards.length ? null : createElement('div', {style: {width: '100%', height: '100%', boxSizing: 'border-box', border: '1px dashed #3396bf', borderRadius: 6, background: '#083247', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}, '添加标注'));
  if (!binding || !enabled) return null;
  return createPortal(createElement('div', {ref: root, className: props.className, 'data-scene-labels': loaderId || 'auto',
    style: {position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: props.zIndex ?? layout.zIndex ?? 20, visibility: 'hidden'},
  }, ...cards), binding.layer.element);
}

function hasLabelStyleImage(style: CSSProperties) {
  return /(?:url|(?:repeating-)?(?:linear|radial|conic)-gradient|image-set)\s*\(/i.test(`${style.background || ''} ${style.backgroundImage || ''}`);
}
