const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), vm = require('node:vm');
const parser = require('@babel/parser'), generate = require('@babel/generator').default;
const {JSDOM} = require('jsdom');
const info = {...JSON.parse(fs.readFileSync('.tmp/room-delivery-current.json', 'utf8')), ...JSON.parse(fs.readFileSync('.tmp/hotspot-pipe-delivery-current.json', 'utf8'))};
const schema = JSON.parse(fs.readFileSync(path.join(info.directory, 'final.schema.json'), 'utf8'));
const original = JSON.parse(fs.readFileSync(path.join(info.base, 'final.schema.json'), 'utf8'));
const code = fs.readFileSync(path.join(info.directory, 'index.js'), 'utf8');
const checks = [];
const check = (name, run) => {run(); checks.push(name);};
const nodes = root => [root, ...(root.children || []).flatMap(nodes)];
const labels = nodes(schema).filter(node => node.componentName === 'SceneLabels');
const rooms = labels.filter(node => /^node_room_label_/.test(node.id));
check('原 7 个标注全部保留，新增 15 个独立房间标注，无重复节点 ID', () => {
  assert.equal(labels.length, 22); assert.equal(rooms.length, 15);
  assert.equal(new Set(nodes(schema).map(node => node.id)).size, nodes(schema).length);
  for (const node of nodes(original).filter(node => node.componentName === 'SceneLabels')) assert(labels.some(item => item.id === node.id));
  assert.deepEqual(rooms.map(node => node.props.items[0].id), ['101','102','103','104','105','201','202','203','204','205','301','302','303','304','305']);
});
check('房间热点留空、编号固定、底部中心对齐、透明 PNG 配置正确', () => {
  for (const node of rooms) {
    const item = node.props.items[0];
    assert.equal(item.target, ''); assert.equal(item.sceneId, '');
    assert.deepEqual(item.position, [0, 0, 0]); assert.equal(item.centerY, 1);
    assert.equal(item.centerX, 0.5); assert.equal(item.texts[0].text, item.id);
    if (info.imageStatus === 'applied-user-png') {
      assert.equal(node.props.maskImage,'');
      assert.equal(node.props.color,'transparent');
      assert.equal(node.props.defaultImage.value,`this.getRoomLabelImage('${item.id}')`);
      assert.equal(node.props.width,80);assert.equal(node.props.height,99);
    } else {
      assert(node.props.maskImage.startsWith('data:image/png;base64,'));
      assert.equal(node.props.maskImage, original.children.find(node => node.id === 'node_alarm_labels_f1').props.maskImage);
    }
    assert.equal(node.props.designFollow, false);
  }
});
check('原有非标注节点、页面布局和动画配置保持不变', () => {
  const untouched = value => nodes(value).filter(node => !['SceneLabels','PipeFlow'].includes(node.componentName)).map(node => {
    const result = {...node}; delete result.children;
    if (node.componentName === 'Page') for (const key of ['originCode', 'state', 'methods', 'lifeCycles']) delete result[key];
    return result;
  });
  assert.deepEqual(untouched(schema), untouched(original));
});
check('schema 的 JS、state、方法及生命周期与 index.js 同步，表达式均可解析', () => {
  assert.equal(schema.originCode, code);
  const klass = parser.parse(code, {plugins: ['classProperties']}).program.body.find(node => node.type === 'ClassDeclaration');
  for (const node of klass.body.body) {
    if (node.type === 'ClassProperty' && node.key.name === 'state') {
      for (const prop of node.value.properties) assert.equal(schema.state[prop.key.name].value, generate(prop.value).code);
    } else if (node.type === 'ClassMethod') {
      const fn = schema.methods[node.key.name] || schema.lifeCycles[node.key.name];
      assert.equal(fn.source, fn.value);
      assert.equal(generate(node.body, {compact:true, comments:false}).code,
        generate(parser.parseExpression(fn.value).body, {compact:true, comments:false}).code);
    }
  }
  const walk = value => {
    if (!value || typeof value !== 'object') return;
    if (value.type === 'JSExpression' || value.type === 'JSFunction') new vm.Script('(' + value.value + ')');
    for (const [key, item] of Object.entries(value)) if (key !== 'originCode') walk(item);
  };
  walk(schema);
});
const dom = new JSDOM('<div id="root"></div>', {url: 'http://localhost/', pretendToBeVisual: true});
for (const key of ['window','document','self','location','HTMLElement','Element','Node','sessionStorage']) global[key] = key === 'self' ? dom.window : dom.window[key];
Object.defineProperty(global,'navigator',{configurable:true,value:dom.window.navigator});
global.MessageChannel = undefined;
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
dom.window.HTMLCanvasElement.prototype.getContext = () => ({measureText: text => ({width: String(text).length * 10})});
const React = require('react'), ReactDOM = require('react-dom'), {act} = require('react-dom/test-utils');
window.React = React; window.ReactDOM = ReactDOM; window.Next = require('@alifd/next');
for (const ext of ['.css','.scss','.less']) require.extensions[ext] = () => {};
const Module = require('node:module'), originalLoad = Module._load;
Module._load = function(name,...args) {if (name === 'react') return React; if (name === 'react-dom') return ReactDOM; return originalLoad.call(this,name,...args);};
const originalLog = console.log, originalWarn = console.warn, originalError = console.error;
const warnings = [];
console.log = () => {}; console.warn = console.error = (...args) => warnings.push(args.map(String).join(' ').slice(0,200));
const components = require(path.join(info.directory,'configuration-material/view.js'));
const metadataSandbox = {React,Next:window.Next,window,self:window,document,console};
vm.runInNewContext(fs.readFileSync(path.join(info.directory,'configuration-material/meta.js'),'utf8'),metadataSandbox);
check('当前运行包导出 SceneLabels，meta 含“三维状态标注”及热点选择配置', () => {
  assert.equal(typeof components.SceneLabels, 'function');
  const metadata = (metadataSandbox.CcChartsMeta || window.CcChartsMeta).components.find(node => node.componentName === 'SceneLabels');
  assert(metadata); assert.equal(metadata.title, '三维状态标注');
  assert(metadata.configure.props.some(prop => prop.name === 'hotspotSelection'));
  assert(metadata.snippets.some(snippet => snippet.schema.componentName === 'SceneLabels'));
});
const Renderer = require('D:/code/lowcode-editor/lowcode-editor/node_modules/@alilc/lowcode-react-renderer/lib').default;
const THREE = require('three');
const scenes = [new THREE.Scene(),new THREE.Scene()];
for (const scene of scenes) scene.add(new THREE.Mesh(new THREE.BoxGeometry(400,400,400),new THREE.MeshBasicMaterial()));
const player = {scene:scenes[1],dom:document.getElementById('root')};
const core = {ready:true,self:{webglPlayer:player},sceneMgr:{getScene:index=>scenes[index]}};
let plays=0,stops=0;
window.coreMgr = {findOne:()=>core,playAnimation(){plays++;},stopAnimation(){stops++;}};
window.__openViewWsBuildingId = 12;
const sockets=[];
class Socket {static OPEN=1; constructor(url){this.url=url;this.readyState=1;sockets.push(this);}send(){}close(){this.readyState=3;}}
global.WebSocket=window.WebSocket=Socket;
const Stub = React.forwardRef(({children},ref)=>React.createElement('div',{ref},children));
const mapping = Object.fromEntries(nodes(schema).map(node=>[node.componentName,Stub]));
delete mapping.Page;
mapping.SceneLabels = props => React.createElement(components.SceneLabels,{...props,__designMode:'design',designFollow:false});
mapping.DevAnimation = components.DevAnimation;
let pipeProps;
mapping.PipeFlow = React.forwardRef((props,ref) => {pipeProps=props;return React.createElement(components.PipeFlow,{...props,ref});});
let page;
const root=document.getElementById('root');
try {
  act(()=>{ReactDOM.render(React.createElement(Renderer,{schema,components:mapping,onCompGetRef(node,ref){if(node.componentName==='Page'&&ref)page=ref;}}),root);});
  assert(page); assert.equal(sockets.length,1);
  const send=(topic,data)=>act(()=>{sockets[0].onmessage({data:JSON.stringify({topic,data})});});
  const set=values=>act(()=>{page.setState(values);});
  const rendered=()=>Array.from(root.querySelectorAll('[data-scene-label]')).map(element=>element.getAttribute('data-scene-label'));
  const color=id=>{
    const fill=root.querySelector(`[data-scene-label="${id}"] [data-label-color]`);
    if(fill)return fill.style.backgroundColor;
    const image=root.querySelector(`[data-scene-label="${id}"] [data-label-image]`);
    if(!image)return undefined;
    const svg=decodeURIComponent(image.getAttribute('src').split(',').slice(1).join(','));
    const channels=['R','G','B'].map(channel=>{
      const value=new RegExp('<feFunc'+channel+' type="table" tableValues="0 ([\\d.]+) 1"').exec(svg);
      assert(value,channel+' 图像滤镜');return Math.round(Number(value[1])*255);
    });
    return 'rgb('+channels.join(', ')+')';
  };
  check('整体视图显示 F1/F2/F3，各楼层恰好显示对应 5 个房间，概览不泄漏房间',()=>{
    assert.deepEqual(rendered(),['F1','F2','F3']);
    for(const floor of [1,2,3]) {set({floor});assert.deepEqual(rendered(),Array.from({length:5},(_,i)=>String(floor*100+i+1)));}
    set({sceneIndex:0,floor:0});assert.deepEqual(rendered(),['X06','X03','X02','X12']);
    set({sceneIndex:1,floor:1});
  });
  check('无房间数据时默认绿色，init_data 接收 roomLabelList 并只更新对应房间',()=>{
    assert.equal(color('101'),'rgb(31, 157, 85)');
    send('init_data',{roomLabelList:[{name:'101',color:'#e11d2e'},{name:'201',color:'#123456'}]});
    assert.equal(color('101'),'rgb(225, 29, 46)');assert.equal(color('102'),'rgb(31, 157, 85)');
    assert.equal(page.getRoomLabelColor('201'),'#123456');
  });
  check('增量 WS 支持数字/字符串编号及空格，保留其他房间，不重播动画',()=>{
    send('ws_data',{roomLabelList:[{name:101,color:'#112233'},{name:' 102 ',color:'#445566'}]});
    assert.equal(color('101'),'rgb(17, 34, 51)');assert.equal(color('102'),'rgb(68, 85, 102)');
    assert.equal(page.getRoomLabelColor('201'),'#123456');
    assert.equal(page.state.roomLabelList.filter(item=>page._alarmNameKey(item.name)==='101').length,1);
    assert.equal(plays,0);assert.equal(stops,0);
  });
  check('同一 React 批次连续 WS 增量不丢失先到的数据',()=>{
    act(()=>{for(const name of ['103','104'])sockets[0].onmessage({data:JSON.stringify({topic:'ws_data',data:{roomLabelList:[{name,color:'#778899'}]}})});});
    assert.equal(color('103'),'rgb(119, 136, 153)');assert.equal(color('104'),'rgb(119, 136, 153)');
  });
  check('直接 setState 更新数组即时换色，空/无效颜色回退绿色',()=>{
    set({roomLabelList:[{name:'101',color:'#aabbcc'},{name:'102',color:''},{name:'103',color:'#no-color'}]});
    assert.equal(color('101'),'rgb(170, 187, 204)');assert.equal(color('102'),'rgb(31, 157, 85)');assert.equal(color('103'),'rgb(31, 157, 85)');
    assert.equal(root.querySelector('[data-scene-label="101"] [data-label-text]').textContent,'101');
  });
  check('手动 state 更新后再接收 WS 增量，保留最新 state 而非旧缓存',()=>{
    send('ws_data',{roomLabelList:[{name:'104',color:'#456789'}]});
    assert.equal(color('101'),'rgb(170, 187, 204)');
    assert.equal(color('102'),'rgb(31, 157, 85)');
    assert.equal(color('104'),'rgb(69, 103, 137)');
  });
  check('显式初始化空数组回退绿色，随后消息不会复活旧房间状态',()=>{
    send('init_data',{roomLabelList:[]});
    assert.equal(color('101'),'rgb(31, 157, 85)');
    send('ws_data',{roomLabelList:[{name:'105',color:'#abcdef'}]});
    assert.equal(color('101'),'rgb(31, 157, 85)');assert.equal(color('105'),'rgb(171, 205, 239)');
  });
  check('不含房间字段的消息不清空房间状态，房间颜色更新不修改 floor/sceneIndex',()=>{
    send('init_data',{overviewAlarmList:[{name:'X12',color:'#334455'}]});
    assert.equal(page.getRoomLabelColor('105'),'#abcdef');
    send('ws_data',{roomLabelList:[{name:'105',color:'#345678'}],floor:3,sceneIndex:0});
    assert.equal(page.state.floor,1);assert.equal(page.state.sceneIndex,1);
  });
  if(info.imageStatus==='applied-user-png')check('原 PNG 完整内嵌、白色及透明度保留，图片缓存有界',()=>{
    const bytes=fs.readFileSync(path.join(info.directory,info.imageFile));
    assert.equal(page.state.roomLabelImage,'data:image/png;base64,'+bytes.toString('base64'));
    assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),info.imageSha256);
    assert.equal(bytes.readUInt32BE(16),58);assert.equal(bytes.readUInt32BE(20),77);assert.equal(bytes[25],6);
    const svg=decodeURIComponent(page.getRoomLabelImage('105').split(',').slice(1).join(','));
    assert(svg.includes('x="11" y="22" width="58" height="77"'));
    assert(svg.includes('type="table" tableValues="0 '));
    assert(svg.includes('color-interpolation-filters="sRGB"'));
    assert.equal(page.getRoomLabelImage('105'),page.getRoomLabelImage('105'));
    for(let i=0;i<50;i++){set({roomLabelList:[{name:'105',color:'#'+i.toString(16).padStart(6,'0')}]});}
    assert(page._roomLabelImageCache.size<=32);
    set({roomLabelList:[{name:'101',color:'#1f9d55'},{name:'102',color:'#e11d2e'},{name:'103',color:'#d4a017'}]});
    const cards=['101','102','103'].map(id=>({id,image:page.getRoomLabelImage(id)}));
    const html='<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#152332;color:white;font:16px Microsoft YaHei,sans-serif;display:flex;gap:60px;padding:40px}.card{position:relative;width:80px;height:99px}.card img{width:80px;height:99px}.card span{position:absolute;left:0;top:0;width:80px;text-align:center;text-shadow:0 2px 4px black}</style></head><body>'+cards.map(card=>'<div class="card"><img src="'+card.image+'"><span>'+card.id+'</span></div>').join('')+'</body></html>';
    fs.writeFileSync(path.join(info.directory,'verification/room-image-preview.html'),html);
  });

  check('全部标注开启同步控制，管道组件直接绑定 state 数组并保留模拟配置',()=>{
    assert(labels.every(node=>node.props.syncHotspotVisibility===true&&node.condition===true));
    const pipe=nodes(schema).find(node=>node.componentName==='PipeFlow'); assert(pipe);
    assert.equal(pipe.props.data.value,'this.state.pipeFlowList');
    assert.equal(pipe.props.names.value,'this.state.pipeFlowNames');
    assert.equal(pipe.props.simulationEnabled,false); assert.equal(pipe.props.simulationInterval,2000);
    assert.equal(pipeProps.data,page.state.pipeFlowList);
    assert.equal(page.state.pipeFlowNames.length,9); assert.equal(page.state.pipeFlowNames[3],'guan4_Flow2');
    const metadata=(metadataSandbox.CcChartsMeta||window.CcChartsMeta).components.find(node=>node.componentName==='PipeFlow');
    assert(metadata); assert(components.PipeFlow); assert(metadata.configure.props.some(prop=>prop.name==='simulationEnabled'));
  });
  check('管道 init_data 替换全量，ws_data 按名称合并，数字字符串和布尔值兼容',()=>{
    send('init_data',{pipeFlowList:[{name:'guan1_Flow',status:1},{name:'guan2_Flow',status:0}]});
    assert.deepEqual(page.state.pipeFlowList,[{name:'guan1_Flow',status:1},{name:'guan2_Flow',status:0}]);
    send('ws_data',{pipeFlowList:[{name:'guan2_Flow',status:'1'},{name:'guan3_Flow',status:true}]});
    assert.deepEqual(page.state.pipeFlowList.map(item=>item.status),[1,1,1]);
    assert.equal(pipeProps.data,page.state.pipeFlowList);
    send('ws_data',{pipeFlowList:[{name:'guan1_Flow',status:'0'}]});
    assert.deepEqual(page.state.pipeFlowList.map(item=>item.status),[0,1,1]);
  });
  check('同批管道 WS 增量不丢失，不变数据复用数组，无效项不污染状态',()=>{
    act(()=>{for(const name of ['guan4_Flow2','guan5_Flow'])sockets[0].onmessage({data:JSON.stringify({topic:'ws_data',data:{pipeFlowList:[{name,status:1}]}})});});
    assert.equal(page.state.pipeFlowList.length,5);
    const before=page.state.pipeFlowList;
    send('ws_data',{pipeFlowList:[{name:'guan1_Flow',status:0}]}); assert.equal(page.state.pipeFlowList,before);
    send('ws_data',{pipeFlowList:[{name:'outside',status:1},{name:'guan2_Flow',status:2},null]}); assert.equal(page.state.pipeFlowList,before);
    send('ws_data',{pipeFlowList:'invalid'}); assert.equal(page.state.pipeFlowList,before);
    send('ws_data',{pipeFlowList:[{name:'guan2_Flow',status:0},{name:'guan2_Flow',status:1}]}); assert.equal(page.state.pipeFlowList,before);
  });
  check('管道空快照清空，缺字段和空增量保留，房间和管道同包独立更新且不重播动画',()=>{
    send('init_data',{pipeFlowList:[]}); assert.deepEqual(page.state.pipeFlowList,[]);
    send('ws_data',{pipeFlowList:[{name:'guan1_Flow',status:1}],roomLabelList:[{name:'101',color:'#112233'}]});
    assert.equal(page.getRoomLabelColor('101'),'#112233'); assert.deepEqual(page.state.pipeFlowList,[{name:'guan1_Flow',status:1}]);
    const before=page.state.pipeFlowList;
    send('init_data',{roomLabelList:[]}); assert.equal(page.state.pipeFlowList,before);
    send('ws_data',{pipeFlowList:[]}); assert.equal(page.state.pipeFlowList,before);
    for(let i=0;i<20;i++)send('ws_data',{pipeFlowList:[{name:'guan1_Flow',status:i%2}]});
    assert.equal(pipeProps.data,page.state.pipeFlowList); assert.equal(plays,0); assert.equal(stops,0);
  });
} finally {
  act(()=>{ReactDOM.unmountComponentAtNode(root);});
  Module._load=originalLoad;console.log=originalLog;console.warn=originalWarn;console.error=originalError;dom.window.close();
}
const report={checkedAt:new Date().toISOString(),passed:checks.length,failed:0,checks,
  scope:'当前实际构建组件及meta、真实低代码渲染器、实际页面WS回调；标注以设计态渲染核对颜色及内容，未接入内网/GPU。',
  components:{name:'SceneLabels',title:'三维状态标注',total:labels.length,roomLabels:rooms.length},warnings:warnings.slice(0,4)};
fs.writeFileSync(path.join(info.directory,'verification/hotspot-pipe-page-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
