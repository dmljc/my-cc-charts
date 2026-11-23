// 管道流动控制
import {Component, createElement, CSSProperties, useEffect, useMemo, useRef, useState} from 'react';
import {findLabelViewport, LabelViewport, observeLabelViewports} from '../../utils/render/src/labels/LabelViewport';
import {defaultPipeNames, importPipeNames, parsePipeNames, PipeData, PipeMessage, pipeStates, reconcilePipeStates, samePipeNames, sanitizePipeFlow, simulatePipeStates} from './model';
import {PipeFlowDiagnostics, PipeFlowReport, PipeFlowSession} from './Session';
import {subscribePipeFlowFrame} from './Scheduler';

export type {PipeData, PipeMessage, PipeState} from './model';
export type {PipeFlowDiagnostics, PipeFlowReport, PipeFlowDiagnostics as PipesFlowDiagnostics, PipeFlowReport as PipesFlowReport} from './Session';
export interface PipesFlowHandle {
  /** WS delta: omitted names retain their previous state. */
  push(data: PipeData | PipeMessage): void;
  setRunningNames(names: string[]): void;
  stopAll(): void;
  refresh(): void;
  getDiagnostics(): PipeFlowDiagnostics;
}
export interface PipesFlowProps {
  names?: string[];
  data?: PipeData | PipeMessage;
  loaderId?: string;
  groupPrefix?: string;
  enabled?: boolean;
  speedU?: number;
  speedV?: number;
  stopMode?: 'freeze' | 'reset';
  updateFps?: number;
  highlightEnabled?: boolean;
  highlightColor?: string | number;
  highlightIntensity?: number;
  simulationEnabled?: boolean;
  simulationInterval?: number;
  simulationRatio?: number;
  /** 为 false 时，本次数据里没出现的管道保持上次状态。默认按全量数据重算，省略的管道停止。 */
  replaceData?: boolean;
  showDebugger?: boolean;
  style?: CSSProperties;
  className?: string;
  onStatusChange?: (report: PipeFlowReport) => void;
  __designMode?: string;
}
interface PipesFlowViewProps extends PipesFlowProps {
  imperativeRef?: (handle: PipesFlowHandle | null) => void;
}

const buttonStyle: CSSProperties = {padding: '5px 9px', border: '1px solid #527284', borderRadius: 4,
  background: '#15394b', color: '#fff', cursor: 'pointer', fontSize: 12};
const emptyReport: PipeFlowReport = {scene: '', total: 0, running: [], waiting: [], errors: []};
const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;

function PipesFlowView(props: PipesFlowViewProps) {
  const design = props.__designMode === 'design';
  const enabled = props.enabled !== false;
  const [names, setNames] = useState(() => {
    try {return parsePipeNames(props.names ?? defaultPipeNames);} catch (_) {return [];}
  });
  const [draft, setDraft] = useState(() => JSON.stringify(names, null, 2));
  const [stateVersion, setStateVersion] = useState(0);
  const states = useRef(new Map<string, boolean>());
  const [simulating, setSimulating] = useState(props.simulationEnabled === true);
  const [report, setReport] = useState<PipeFlowReport>(emptyReport);
  const [message, updateMessage] = useState('');
  const messageValue = useRef('');
  const setMessage = (value: string) => {
    if (messageValue.current === value) return;
    messageValue.current = value; updateMessage(value);
  };
  const [refreshKey, setRefreshKey] = useState(0);
  const [binding, setBinding] = useState<{viewport: LabelViewport; session: PipeFlowSession}>(null);
  const session = useRef<PipeFlowSession>(null);
  const queued = useRef(new Map<string, boolean>());
  const stopQueuedFrame = useRef<() => void>(null);
  const mounted = useRef(false);
  const allowed = useMemo(() => new Set(names), [names]);
  const latest = useRef({props, names, allowed, simulating, binding});
  latest.current = {props, names, allowed, simulating, binding};
  const speedU = finite(props.speedU, 0.2), speedV = finite(props.speedV, 0);
  const stopMode = props.stopMode === 'reset' ? 'reset' : 'freeze';
  const updateFps = Math.min(60, Math.max(0, finite(props.updateFps, 0)));
  const highlightEnabled = props.highlightEnabled === true, highlightColor = props.highlightColor ?? '#00e5ff';
  const highlightIntensity = Math.min(10, Math.max(0, finite(props.highlightIntensity, 1)));
  const interval = Math.min(60000, Math.max(250, finite(props.simulationInterval, 2000)));

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelQueue();
      states.current.clear();
      latest.current = {props: {}, names: [], allowed: new Set(), simulating: false, binding: null};
    };
  }, []);

  const setSimulation = (value: boolean) => {
    if (latest.current.simulating === value) return;
    latest.current.simulating = value;
    setSimulating(value);
  };

  const commitStates = (incoming: ReadonlyMap<string, boolean>, replace = false) => {
    const next = reconcilePipeStates(states.current, incoming, latest.current.allowed, replace);
    if (next === states.current) return;
    states.current = next; setStateVersion(version => version + 1);
  };

  const cancelQueue = () => {
    stopQueuedFrame.current?.(); stopQueuedFrame.current = null; queued.current.clear();
  };
  const flushQueue = () => {
    stopQueuedFrame.current?.(); stopQueuedFrame.current = null;
    if (!queued.current.size) return;
    const incoming = queued.current; queued.current = new Map();
    if (!mounted.current) return;
    // This bounded Map is authoritative even before React's next render. A delta never copies all names.
    incoming.forEach((running, name) => {
      if (!latest.current.allowed.has(name)) {incoming.delete(name); return;}
      if (running) states.current.set(name, true); else states.current.delete(name);
    });
    const current = latest.current;
    if (session.current && session.current === current.binding?.session && !session.current.patchStates(incoming)) {
      setStateVersion(version => version + 1);
    }
  };

  useEffect(() => {
    try {
      const next = parsePipeNames(props.names ?? defaultPipeNames);
      setNames(current => samePipeNames(current, next) ? current : next);
      setDraft(JSON.stringify(next, null, 2)); setMessage('');
    } catch (error) {setNames([]); setMessage(error.message);}
  }, [props.names]);
  useEffect(() => {
    setSimulation(props.simulationEnabled === true);
    if (!props.simulationEnabled) {
      cancelQueue();
      try {
        if (props.data !== undefined) commitStates(sanitizePipeFlow(props.data, latest.current.allowed), props.replaceData !== false);
      } catch (error) {setMessage(error.message);}
    }
  }, [props.simulationEnabled]);

  useEffect(() => {
    if (props.data === undefined) return;
    // Explicit simulation mode keeps producing samples. A manual debugging
    // session yields to a new bound WS snapshot, so it cannot mask live data.
    if (latest.current.simulating && props.simulationEnabled === true) return;
    try {
      const incoming = sanitizePipeFlow(props.data, allowed);
      setSimulation(false);
      cancelQueue();
      commitStates(incoming, props.replaceData !== false); setMessage('');
    } catch (error) {setMessage(error.message);}
  }, [props.data, allowed, props.replaceData]);

  useEffect(() => {
    queued.current.forEach((_, name) => {if (!allowed.has(name)) queued.current.delete(name);});
    if (!queued.current.size) cancelQueue();
    commitStates(new Map());
  }, [allowed]);

  useEffect(() => {
    if (design || !enabled) {setBinding(null); setReport(emptyReport); return undefined;}
    let previous: LabelViewport, scene;
    const update = () => {
      const viewport = findLabelViewport(props.loaderId);
      if (viewport === previous && scene === viewport?.scene) return;
      previous = viewport; scene = viewport?.scene;
      flushQueue();
      session.current?.dispose();
      const next = viewport?.scene ? new PipeFlowSession(viewport, value => {
        if (!mounted.current) return;
        if (latest.current.props.showDebugger !== false) setReport(value);
        latest.current.props.onStatusChange?.(value);
      }) : null;
      next?.setReportingEnabled(latest.current.props.showDebugger !== false || !!latest.current.props.onStatusChange);
      session.current = next;
      setReport(emptyReport);
      setBinding(next ? {viewport, session: next} : null);
    };
    const stop = observeLabelViewports(update); update();
    return () => {stop(); if (mounted.current) flushQueue(); else cancelQueue(); session.current?.dispose(); session.current = null;};
  }, [design, enabled, props.loaderId, refreshKey]);

  useEffect(() => {
    binding?.session.setReportingEnabled(props.showDebugger !== false || !!props.onStatusChange, props.showDebugger !== false);
  }, [binding, props.showDebugger, props.onStatusChange]);

  useEffect(() => {
    if (!design && enabled) binding?.session.configure(names, states.current,
      {speed: [speedU, speedV], stopMode, updateFps, highlightEnabled, highlightColor, highlightIntensity});
  }, [design, enabled, binding, names, stateVersion, speedU, speedV, stopMode, updateFps, highlightEnabled, highlightColor, highlightIntensity]);

  const receive = (data: PipeData | PipeMessage, replace = false) => {
    if (!mounted.current) return;
    try {
      const incoming = pipeStates(data), allowed = latest.current.allowed;
      const unknown = Array.from(incoming.keys()).filter(name => !allowed.has(name));
      if (unknown.length) throw new Error(`名称未在控制数组中：${unknown.join('、')}`);
      if (replace) cancelQueue();
      commitStates(incoming, replace);
      setMessage('');
    } catch (error) {setMessage(error.message);}
  };
  const enqueue = (data: PipeData | PipeMessage) => {
    if (!mounted.current) return;
    try {
      const incoming = pipeStates(data), current = latest.current;
      const unknown = Array.from(incoming.keys()).filter(name => !current.allowed.has(name));
      if (unknown.length) throw new Error(`名称未在控制数组中：${unknown.join('、')}`);
      incoming.forEach((running, name) => {
        if ((states.current.get(name) === true) === running) queued.current.delete(name);
        else queued.current.set(name, running);
      });
      if (!queued.current.size) {cancelQueue(); setMessage(''); return;}
      const viewport = current.binding?.viewport;
      if (viewport && !viewport.disposed) {
        if (!stopQueuedFrame.current && queued.current.size) {
          stopQueuedFrame.current = subscribePipeFlowFrame(viewport, () => {
            if (!viewport.isActive || viewport.dom?.ownerDocument?.hidden) return;
            flushQueue();
          });
        }
      } else flushQueue();
      setMessage('');
    } catch (error) {setMessage(error.message);}
  };
  const sample = () => {
    const current = latest.current;
    receive(simulatePipeStates(current.names, current.props.simulationRatio), true);
  };
  useEffect(() => {
    if (design || !simulating || !enabled || !names.length || !binding) return undefined;
    const generation = binding.session;
    sample();
    const timer = setInterval(() => {
      if (!mounted.current || !latest.current.simulating || latest.current.binding?.session !== generation) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      if (latest.current.binding?.viewport.isActive) sample();
    }, interval);
    return () => clearInterval(timer);
  }, [design, simulating, interval, names, props.simulationRatio, enabled, binding]);

  const commands = useRef<PipesFlowHandle>(null);
  commands.current = {
    push: (data: PipeData | PipeMessage) => {if (mounted.current) {setSimulation(false); enqueue(data);}},
    setRunningNames: (running: string[]) => {
      if (!mounted.current) return;
      try {
        const selected = new Set(parsePipeNames(running));
        const unknown = Array.from(selected).filter(name => !latest.current.allowed.has(name));
        if (unknown.length) throw new Error(`名称未在控制数组中：${unknown.join('、')}`);
        setSimulation(false); receive(latest.current.names.map(name => ({name, status: selected.has(name)})), true);
      } catch (error) {setMessage(error.message);}
    },
    stopAll: () => {if (mounted.current) {setSimulation(false); cancelQueue(); commitStates(new Map(), true);}},
    refresh: () => {if (mounted.current) setRefreshKey(key => key + 1);},
    getDiagnostics: () => {
      const value = session.current?.getDiagnostics() || {objects: 0, materials: 0, flowing: 0, textures: 0,
        names: 0, indexedModels: 0, waiting: 0, frameSubscriptions: 0, queuedMessages: 0, disposed: true};
      return {...value, queuedMessages: queued.current.size, frameSubscriptions: value.frameSubscriptions || (stopQueuedFrame.current ? 1 : 0)};
    },
  };
  const publishCommands = props.imperativeRef;
  useEffect(() => {
    const handle: PipesFlowHandle = {
      push: data => commands.current.push(data),
      setRunningNames: names => commands.current.setRunningNames(names),
      stopAll: () => commands.current.stopAll(),
      refresh: () => commands.current.refresh(),
      getDiagnostics: () => commands.current.getDiagnostics(),
    };
    publishCommands?.(handle);
    return () => publishCommands?.(null);
  }, [publishCommands]);

  if (props.showDebugger === false && !design) return null;
  const updateNames = (next: string[]) => {setNames(current => samePipeNames(current, next) ? current : next); setDraft(JSON.stringify(next, null, 2)); setMessage(`已配置 ${next.length} 个名称。`);};
  const button = (label: string, onClick: () => void, disabled = false) => createElement('button',
    {type: 'button', style: {...buttonStyle, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer'}, disabled, onClick}, label);
  return createElement('div', {className: props.className, 'data-pipe-flow': true,
    style: {position: 'absolute', left: 20, top: 120, width: 330, maxWidth: '100%', boxSizing: 'border-box',
      padding: 12, color: '#fff', background: 'rgba(8,35,49,.94)', border: '1px solid #527284', borderRadius: 6,
      fontSize: 12, lineHeight: 1.6, zIndex: 20, pointerEvents: 'auto', ...props.style}},
  createElement('strong', {}, '管道流动调试'),
  createElement('div', {style: {color: '#b9d3e0', margin: '4px 0 8px'}}, design
    ? '在右侧配置名称；打开预览后可模拟推送。' : !enabled ? '控制已禁用，运行时材质已释放。' : binding
      ? `${report.scene || binding.viewport.scene.name} · ${names.length} 条 · 流动 ${report.running.length} 条${props.enabled === false ? ' · 控制已禁用' : ''}`
      : '等待内置加载器；多个加载器时请指定加载器标识。'),
  design ? createElement('div', {}, `已配置 ${names.length} 个名称${simulating ? '，预览后自动模拟' : ''}。`) : createElement('div', {},
    createElement('textarea', {'aria-label': '管道名称数组', value: draft, rows: 4, spellCheck: false,
      style: {boxSizing: 'border-box', width: '100%', resize: 'vertical', color: '#fff', background: '#0d2939', border: '1px solid #527284', borderRadius: 4, padding: 6},
      onChange: event => setDraft(event.currentTarget.value)}),
    createElement('div', {style: {display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6}},
      button('应用名称数组', () => {try {updateNames(parsePipeNames(draft));} catch (error) {setMessage(error.message);}}),
      button('导入当前场景', () => {
        const next = binding && importPipeNames(binding.viewport.scene, props.groupPrefix);
        if (!next?.length) {setMessage('当前场景没有匹配分组下带贴图的模型，请检查场景和分组前缀。'); return;}
        updateNames(next);
      }, !binding)),
    createElement('div', {style: {display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8}},
      button(simulating ? '停止模拟' : '开始模拟 WS', () => {
        cancelQueue(); setSimulation(!simulating);
        if (simulating) receive(latest.current.props.data ?? [], true);
      }, !binding || !enabled),
      button('推送一次', sample, !binding || props.enabled === false),
      button('全部停止', () => {setSimulation(false); cancelQueue(); commitStates(new Map(), true);}),
      button('刷新模型', () => setRefreshKey(key => key + 1)))),
  !design && simulating ? createElement('div', {style: {marginTop: 6}}, `每 ${interval / 1000} 秒推送一批开关状态`) : null,
  !design ? createElement('div', {style: {marginTop: 6, color: '#b9d3e0'}}, '名称修改仅本次预览生效；保存请使用右侧配置。') : null,
  !design && report.running.length > 0 ? createElement('div', {style: {marginTop: 6, overflowWrap: 'anywhere'}}, `流动：${report.running.join('、')}`) : null,
  !design && report.waiting.length > 0 ? createElement('div', {}, `等待模型 UV 就绪：${report.waiting.length} 条`) : null,
  createElement('div', {role: 'status', style: {marginTop: 6, maxHeight: 120, overflow: 'auto', overflowWrap: 'anywhere'}},
    message, ...report.errors.map(error => createElement('div', {key: error, style: {color: '#ffcb8b'}}, error))));
}

const emptyDiagnostics: PipeFlowDiagnostics = {objects: 0, materials: 0, flowing: 0, textures: 0,
  names: 0, indexedModels: 0, waiting: 0, frameSubscriptions: 0, queuedMessages: 0, disposed: true};

class PipesFlow extends Component<PipesFlowProps> implements PipesFlowHandle {
  static displayName = 'PipesFlow';
  private handle: PipesFlowHandle | null = null;
  private bindHandle = (handle: PipesFlowHandle | null) => {this.handle = handle;};

  push(data: PipeData | PipeMessage) {this.handle?.push(data);}
  setRunningNames(names: string[]) {this.handle?.setRunningNames(names);}
  stopAll() {this.handle?.stopAll();}
  refresh() {this.handle?.refresh();}
  getDiagnostics() {return this.handle?.getDiagnostics() || emptyDiagnostics;}

  render() {
    return createElement(PipesFlowView, {...this.props, imperativeRef: this.bindHandle});
  }
}

export default PipesFlow;
