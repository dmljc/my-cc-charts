/** 最终版：保留同事精简后的业务和动画停止逻辑，三维告警标注逐个配置，共用投影层。 */
class LowcodeComponent extends Component {
  state = {
    btnClassoOverView: 'bottom-btn btn-background-click',
    btnClassX12Close: 'bottom-btn btn-background-click',
    btnClassX12Open: 'bottom-btn btn-background-unclick',
    btnClassX12F1: 'bottom-btn btn-background-unclick',
    btnClassX12F2: 'bottom-btn btn-background-unclick',
    btnClassX12F3: 'bottom-btn btn-background-unclick',
    btnClassX12Pipe: 'bottom-btn btn-background-unclick',
    sceneIndex: this._getWsTargetBuildingId() === 12 ? 1 : 0,
    floor: 0,
    alarmStats: {},
    disposalStats: {},
    effluentList: {},
    overviewStats: {},
    deviceTypes: {},
    inspectionStats: {},
    monitoringList: [],
    operationLogList: [],
    alarmList: [],
    inspectionList: [],
    qtcList: {},
    httpBaseUrl: 'https://115111ob8gw23.vicp.fun',
    overviewAlarmList: [],
    floorAlarmList: [],
    roomLabelList: [],
    alarmLabelDefaultColor: '#1f9d55',
    alarmLabelOffline: true,
    alarmLabelBindings: {},
    roomLabelImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGgAAAAwCAYAAAD9wT87AAAACXBIWXMAAAsTAAALEwEAmpwYAAABcElEQVR4nO3b0UoCURSF4cGoJ4heSymnXimrtyiKeqEstevAqxjv/9g1hDRnRi+Us3DWdyvI5vxwOoG7KBKAE+AKeASmwArbtVV9tnHGl3HmqRapOBfAYufj2CZz4LwrzBFwt/FrbN9ugUEqkOPomKSuNdMyWn8QxP1nWj5+Hg71a800lRHoKfcU1uohAr23f26ZTSNQlXsKa1VFIBPmQOIcSJwDiXMgcQ4kzoHEOZA4BxLnQOIcSJwDiXMgcQ4kzoHEOZA4BxLnQOIcSJwDifOPRrR9RaC33FNYq9ei3k8xTfdFvTxkmsYR6BiY5Z7EGhZ/W3ex2dX83DIb/t8Ris0u03Cd2rAbADe5JzMmyRXItVAj/03KYta41joixcOhjP2UeIt7A2Ivqvps44zHcebFIQFOgc8tDmIJnOWet5eA4RaBytxz9hrw0hHnOfd8vUf7VeerTfyqK3PPZe1Xna824atu6VebKH7/dzuoq+0by2GPz0M3lgMAAAAASUVORK5CYII=",
    pipeFlowList: [],
    pipeFlowNames: ["guan1_Flow", "guan2_Flow", "guan3_Flow", "guan4_Flow2", "guan5_Flow", "guan6_Flow", "guan7_Flow", "guan8_Flow", "guan9_Flow"],
    roomLabelForegroundImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGgAAAAwCAYAAAD9wT87AAAACXBIWXMAAAsTAAALEwEAmpwYAAADDUlEQVR4nO2bPW8TQRCG7c4S5PaMfLZTXYMirS/4JPDeJbKrWCIESwktUIAQCIEQHSWKLKWhAFq+fgmB/AegpwgQJARFUtENesM5Ssh9xTjZTTyvNN3d+vQ+N3Nr7UyhECMiKhJRiYhsInKIqE5Ekxw0Sg/qkbd25HUxjkUcHFxcvXj11hU36L6uTM98smXwS0j1m0ONzAN4Wpme/egGc6/mr91egufwPguOdf9xP6w222sMQx3pC1n12+8fLK8EYJAIZ/HGvV7Zm/nOcJSWagHvl27evbwPElILmcNwlPYyXvbCjYf9vtpT7lD/an5nVffDcai/5a7ZXou+ScXt7MGGgM1RRr0g89fvLG5nEbZ5ruq+yXHTpi2Dp5bXUrVm81RhSOFerGFL9Qxr6jZCGBpuOPcSbADIwVY67WJLtj7bU2GzMGLZXuBjbd1mCAMDW3CwAaC63Qh/ply8eRhwdkPiTFL7fAcTsAGgyTSSKGuHBWcHklTPdb+xwsAAm0xA1lRLJRlLRD0i+krZ+kJEC0nrWI0LgW4zxHEF5DQap1MAwfi8Wk9aB7+h2wxxXAGllSY6oNLW0m2GMDAYkBwjQP9zDWeQYkDCgIzgEif1m8qApH7jGJAB5ggDgjcJUj8EBiT1G20EIP6jqhiQMOCt5gwywBhhSHCJk/ohMCA53scNI9kknDkbWLrNECf0wG4k50F8YKeGB4TumxRACzkhrRPRpaR1+MhbpQLKbhrxAj/J3AhUbAnLKm27mka2dJcTYVjYjeDHoGkkX9tVCqRhAXHblUr0vHJu9sOg7crGmEkOqlsoRfhepG0csoR7J2QYRmWNM0fG++2G3ReDxsUS5lN0pzSH2uNBb9D6G5Uip+Z33rJJyphZoZ3m+QhQ6dHKk/NlL/ym++HGPcpx4ycRJAvDQ7hA90OOa5S9cCMa4JpI2o1ZGMOr+e13uh923KLmd1ajzImH888QsYP5FIxAYLuX8T+JQx7cA3gKb+FxtCFwMoeIY0DxGD4dzRh+bjAsFovFYrFYLBaLVTjZ+gOkn+Ios7/J/AAAAABJRU5ErkJggg=="
  };

  componentDidMount() {
    this._alarmUnmounted = false;

    this._alarmConfig();

    this._removeLegacyAlarmOverlay();

    const buildingId = this._getWsTargetBuildingId();

    this._wsTargetBuildingId = buildingId;

    const start = () => {
      this.handleWss();

      this._prepareAlarmLabelBinding();
    };

    if (buildingId === 12 && this.state.sceneIndex !== 1) {
      this.setState({
        sceneIndex: 1
      }, start);
    } else {
      start();
    }
  }

  componentWillUnmount() {
    this._alarmUnmounted = true;
    clearTimeout(this._alarmBindingTimer);
    this._alarmBindingTimer = 0;

    this._removeLegacyAlarmOverlay();

    if (this.ws) {
      ['onopen', 'onmessage', 'onerror', 'onclose'].forEach(key => {
        this.ws[key] = null;
      });
      this.ws.close();
      this.ws = null;
    }
  }

  runX12Open() {
    this._runDevAnimation("devanimation-95339045");
  }

  runX12Close() {
    this._runDevAnimation("devanimation-464782d2");
  }

  runX12F1() {
    this._runDevAnimation('devanimation-3');
  }

  runX12F2() {
    this._runDevAnimation('devanimation-4');
  }

  runX12F3() {
    this._runDevAnimation('devanimation-5');
  }

  runX12Pipe() {
    this._runDevAnimation('devanimation-6');
  }

  _runDevAnimation(ref) {
    try {
      const target = typeof this.$ === 'function' ? this.$(ref) : null;
      if (target && typeof target.runAnimation === 'function') target.runAnimation();
    } catch (error) {
      console.warn('[DevAnimation] 动画调用已跳过', ref, error);
    }
  }

  _stopDevAnimationsBeforeX12() {
    const refs = ["devanimation-95339045", "devanimation-464782d2", 'devanimation-3', 'devanimation-4', 'devanimation-5', 'devanimation-6'];
    refs.forEach(ref => {
      try {
        const target = typeof this.$ === 'function' ? this.$(ref) : null;
        if (target && typeof target.stopAnimation === 'function') target.stopAnimation(false);
      } catch (error) {
        console.warn('[DevAnimation] 停止动画已跳过', ref, error);
      }
    });
  }

  btnClick(e, params) {
    const names = ['Close', 'Open', 'F1', 'F2', 'F3', 'Pipe'];
    const active = names.find(n => n.toLowerCase() === params.key);
    if (!active) return;

    this._stopDevAnimationsBeforeX12();

    const next = {
      floor: {
        Close: 0,
        Open: 0,
        F1: 1,
        F2: 2,
        F3: 3,
        Pipe: null
      }[active]
    };
    names.forEach(n => {
      next[`btnClassX12${n}`] = `bottom-btn btn-background-${n === active ? 'click' : 'unclick'}`;
    });
    this.setState(next);
    this[`runX12${active}`]();
  }

  handleWss() {
    if (!this.state.alarmLabelOffline) this.setState({
      alarmLabelOffline: true
    });
    this.ws = new WebSocket('https://115111ob8gw23.vicp.fun/api/ws/realtime');

    this.ws.onopen = () => {
      console.log('✅ WebSocket 连接已建立');

      this._sendWsBuildingSubscription(this._wsTargetBuildingId);
    };

    this.ws.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        if (!msg || !msg.data) return;
        if (msg.topic === 'init_data') this.applyInitData(msg.data);else if (msg.topic === 'ws_data') this.applyWsData(msg.data);
      } catch (error) {
        console.error('❌ 解析消息失败:', error);
      }
    };

    const markOffline = () => {
      if (!this._alarmUnmounted && !this.state.alarmLabelOffline) this.setState({
        alarmLabelOffline: true
      });
    };

    this.ws.onerror = markOffline;
    this.ws.onclose = markOffline;
  }

  goX12() {
    this._setWsTargetBuildingId(12);

    this._sendWsBuildingSubscription(12);

    const next = {
      sceneIndex: 1,
      floor: 0
    };
    ['Close', 'Open', 'F1', 'F2', 'F3', 'Pipe'].forEach(name => {
      next[`btnClassX12${name}`] = `bottom-btn btn-background-${name === 'Close' ? 'click' : 'unclick'}`;
    });
    this.setState(next, () => this._prepareAlarmLabelBinding());
  }

  goHome() {
    this._setWsTargetBuildingId(null);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        topic: 'unsubscribe'
      }));
    }

    this.setState({
      sceneIndex: 0,
      floor: 0
    }, () => {
      this._prepareAlarmLabelBinding();
    });
  }

  asObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]' ? value : {};
  }

  hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  applyInitData(data) {
    const payload = Array.isArray(data) ? {
      buildingMarkers: data
    } : this.asObject(data);

    const cfg = this._alarmConfig();

    const lists = ['monitoringList', 'operationLogList', 'alarmList', 'inspectionList'];
    const next = {
      alarmLabelOffline: false,
      overviewAlarmList: this._mergeAlarmPositions(payload.overviewAlarmList, cfg.positions[0]),
      floorAlarmList: this._mergeAlarmPositions(payload.floorAlarmList, cfg.positions[1])
    };
    if (this.hasOwn(payload, 'roomLabelList')) next.roomLabelList = this._mergeRoomLabelList([], payload.roomLabelList);
    if (this.hasOwn(payload, 'pipeFlowList') && Array.isArray(payload.pipeFlowList)) next.pipeFlowList = this._mergePipeFlowList([], payload.pipeFlowList);
    ['alarmStats', 'disposalStats', 'effluentList', 'overviewStats', 'deviceTypes', 'inspectionStats', 'qtcList', ...lists].forEach(key => {
      next[key] = payload[key] || (lists.includes(key) ? [] : {});
    });
    const markers = Array.isArray(payload.buildingMarkers) ? payload.buildingMarkers : this._alarmNameKey(payload.name) && (this.hasOwn(payload, 'color') || this.hasOwn(payload, 'count') || this.hasOwn(payload, 'type')) ? [payload] : [];

    if (markers.length) {
      const index = this.state.sceneIndex === 1 ? 1 : 0,
            key = index === 1 ? 'floorAlarmList' : 'overviewAlarmList';
      next[key] = this._mergeAlarmUpdates(next[key], markers, cfg.positions[index]);
    }

    this._alarmPendingLists = {
      overviewAlarmList: next.overviewAlarmList,
      floorAlarmList: next.floorAlarmList
    };
    this.setState(next, () => this._bindAlarmLabelScene(true));
  }

  applyWsData(data) {
    const payload = Array.isArray(data) ? {
      buildingMarkers: data
    } : this.asObject(data);
    if (!Object.keys(payload).length) return;

    const cfg = this._alarmConfig(),
          current = this._alarmPendingLists || this.state,
          next = {};

    ['alarmStats', 'disposalStats', 'effluentList', 'overviewStats', 'deviceTypes', 'inspectionStats', 'monitoringList', 'operationLogList', 'alarmList', 'inspectionList', 'qtcList'].forEach(key => {
      if (this.hasOwn(payload, key)) next[key] = payload[key];
    });
    ['overviewAlarmList', 'floorAlarmList'].forEach((key, index) => {
      if (this.hasOwn(payload, key)) next[key] = this._mergeAlarmUpdates(current[key], payload[key], cfg.positions[index]);
    });
    const markers = Array.isArray(payload.buildingMarkers) ? payload.buildingMarkers : this._alarmNameKey(payload.name) && (this.hasOwn(payload, 'color') || this.hasOwn(payload, 'count') || this.hasOwn(payload, 'type')) ? [payload] : [];

    if (markers.length) {
      const index = this.state.sceneIndex === 1 ? 1 : 0,
            key = index === 1 ? 'floorAlarmList' : 'overviewAlarmList';
      next[key] = this._mergeAlarmUpdates(next[key] || current[key], markers, cfg.positions[index]);
    }

    const hasRoomUpdates = this.hasOwn(payload, 'roomLabelList');
    const hasPipeUpdates = this.hasOwn(payload, 'pipeFlowList') && Array.isArray(payload.pipeFlowList);

    if (Object.keys(next).length || hasRoomUpdates || hasPipeUpdates) {
      next.alarmLabelOffline = false;
      this._alarmPendingLists = {
        overviewAlarmList: next.overviewAlarmList || current.overviewAlarmList,
        floorAlarmList: next.floorAlarmList || current.floorAlarmList
      };
      this.setState(previous => {
        const update = { ...next
        };
        if (hasRoomUpdates) update.roomLabelList = this._mergeRoomLabelList(previous.roomLabelList, payload.roomLabelList);
        if (hasPipeUpdates) update.pipeFlowList = this._mergePipeFlowList(previous.pipeFlowList, payload.pipeFlowList);
        return update;
      });
    }
  }

  _setWsTargetBuildingId(buildingId) {
    this._wsTargetBuildingId = buildingId;
    window.__openViewWsBuildingId = buildingId;

    try {
      if (buildingId == null) window.sessionStorage.removeItem('openview.wsBuildingId');else window.sessionStorage.setItem('openview.wsBuildingId', String(buildingId));
    } catch (error) {
      console.warn('[WS] 保存厂房订阅状态失败', error);
    }
  }

  _getWsTargetBuildingId() {
    const saved = [this._wsTargetBuildingId, window.__openViewWsBuildingId].find(v => v != null);
    if (saved != null) return Number(saved);

    try {
      const value = window.sessionStorage.getItem('openview.wsBuildingId');
      return value ? Number(value) : null;
    } catch (error) {
      console.warn('[WS] 读取厂房订阅状态失败', error);
      return null;
    }
  }

  _sendWsBuildingSubscription(buildingId) {
    if (buildingId == null) return false;

    if (!this.ws || this.ws.readyState !== 1) {
      console.log('[WS] 等待连接后订阅厂房', buildingId);
      return false;
    }

    const message = {
      topic: 'subscribe',
      buildingId: Number(buildingId)
    };
    this.ws.send(JSON.stringify(message));
    console.log('[WS] 已发送厂房订阅', message);
    return true;
  }

  onAlarmLabelClick(event) {
    if (this.state.sceneIndex === 0 && event && this._alarmNameKey(event.id) === 'X12') this.goX12();
  }

  _alarmConfig() {
    if (!this._alarmLabelConfig) {
      this._alarmLabelConfig = {
        loaderId: 'node_ocmu0mvlo11',
        colors: {
          green: '#1f9d55',
          warning: '#d4a017',
          urgent: '#e11d2e'
        },
        mask: 'data:image/png;base64,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',
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADiNXWtAAABdElEQVRIDe2VvU7DMBSF4wqJdugIYkAM/ExIDCw8AUPfhK2vw8SLMHRgYukLtDAwVAghNhRAqOE7IUY3bVw7lZAYuNKR7XvPOddOnTTL/koURdEFPrqp++qkEtflLTVgi/tgt62hNNKu1FXmD4xTCSyZtQOHFdxCTebSSFtrsmGJzD8qHDCOIJ8453LGM9bn4BQoxuSuqd0y9liPgDR3QB7hQKDdTMAF6INLMAeLoZxq4ogrTe3UwS4Qe6ADbkAsxBFXJ0kPBMOYs6kP050rJuKZMYhNZ6EG5W1AbV+cd8jb4DEkCuR3yD+BTV/nErz5W5T7JOMR2DPr1OkxxD6YGIFbetGq4s8uDDk2bdT4E2wZ9QtznWKduEdkvbKyAc/q2brxm9hl8hyfOeSaV+gRJZvGiP8NYk/o+0duYL2SmzbkV6WkWYrad91XuUW60+0+XlmWc4v0FQgHxvpTuQKfoG1II23jpsuuFAdtXRv4g/ARfqHyBVXEyFnFScsuAAAAAElFTkSuQmCC',
        modelRootNames: ['', ''],
        positions: [{
          X06: [66, 20, -91],
          X03: [-112, 21, -116],
          X02: [-128, 16, 95],
          X12: [64, 28, 80]
        }, {
          F1: [12, 16, -14],
          F2: [23, 16, -23],
          F3: [35, 16, -16]
        }]
      };
    }

    return this._alarmLabelConfig;
  }

  _mergeAlarmPositions(list, positionMap) {
    return (Array.isArray(list) ? list : []).filter(item => item && this._alarmNameKey(item.name)).map(item => {
      const source = this.asObject(item);
      const position = Array.isArray(source.position) && source.position.length >= 3 ? source.position.slice(0, 3) : positionMap[this._alarmNameKey(source.name)];
      return { ...source,
        position: position ? [...position] : [0, 0, 0]
      };
    });
  }

  _mergeAlarmRecord(previous, update) {
    const next = { ...previous,
      ...update
    };
    if (update.type != null && update.color == null) delete next.color;
    return next;
  }

  _mergeAlarmUpdates(current, updates, positionMap) {
    const byName = new Map((Array.isArray(current) ? current : []).filter(Boolean).map(item => [this._alarmNameKey(item.name), item]));
    (Array.isArray(updates) ? updates : []).forEach(item => {
      const source = this.asObject(item),
            key = this._alarmNameKey(source.name);

      if (key) byName.set(key, this._mergeAlarmRecord(byName.get(key), source));
    });
    return this._mergeAlarmPositions(Array.from(byName.values()), positionMap);
  }

  getAlarmLabelRecord(index, name) {
    const list = index === 1 ? this.state.floorAlarmList : this.state.overviewAlarmList;

    const key = this._alarmNameKey(name);

    return (Array.isArray(list) ? list : []).find(item => item && this._alarmNameKey(item.name) === key);
  }

  getAlarmLabelPosition(index, name) {
    const record = this.getAlarmLabelRecord(index, name);
    return record && record.position || this._alarmConfig().positions[index][this._alarmNameKey(name)] || [0, 0, 0];
  }

  getAlarmLabelStatus(index, name) {
    const item = this.getAlarmLabelRecord(index, name) || {};
    const value = String(item.color || item.type || '').trim();
    if (/^(#[0-9a-f]{3,8}$|(rgb|hsl)a?\()/i.test(value)) return value;
    return {
      urgent: 'urgent',
      red: 'urgent',
      warning: 'warning',
      yellow: 'warning'
    }[value.toLowerCase()] || 'green';
  }

  getAlarmLabelText(index, name) {
    const item = this.getAlarmLabelRecord(index, name) || {};
    const title = item.name == null || String(item.name).trim() === '' ? name : String(item.name).trim();
    const text = item.count == null || item.count === '' ? title : title + '-' + item.count;
    return text + '\u00a0>';
  }

  getAlarmLabelTextX(index, name) {
    const text = this.getAlarmLabelText(index, name);
    if (!this._alarmTextMetrics) this._alarmTextMetrics = {};
    const key = `${index}:${name}`;
    const previous = this._alarmTextMetrics[key];
    if (previous && previous.text === text) return previous.x;
    if (!this._alarmTextContext) this._alarmTextContext = document.createElement('canvas').getContext('2d');
    const ctx = this._alarmTextContext;
    let x = 52;

    if (ctx) {
      ctx.font = '500 20px SourceHanSansSC, "Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
      const width = ctx.measureText(text.replace('\u00a0>', '')).width + 6 + ctx.measureText('>').width;
      x = 52 + width <= 140 ? 52 : Math.max(44, 140 - width);
    }

    this._alarmTextMetrics[key] = {
      text,
      x
    };
    return x;
  }

  getAlarmLabelImage(index, name) {
    const state = this.getAlarmLabelStatus(index, name);

    const colors = this._alarmConfig().colors;

    return this._alarmImage(colors[state] || state);
  }

  _alarmImage(color) {
    const cfg = this._alarmConfig();

    if (!this._alarmImages) this._alarmImages = new Map();
    if (this._alarmImages.has(color)) return this._alarmImages.get(color);
    const safe = String(color).replace(/[&<>"']/g, value => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    })[value]);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="156" height="156" viewBox="0 0 156 156"><defs><mask id="shape" style="mask-type:alpha"><image width="156" height="156" xlink:href="${cfg.mask}"/></mask><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".28"/></filter></defs><g filter="url(#shadow)"><rect width="156" height="156" fill="${safe}" mask="url(#shape)"/></g><image x="12" y="12" width="24" height="24" xlink:href="${cfg.icon}"/></svg>`;
    const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    if (this._alarmImages.size >= 32) this._alarmImages.delete(this._alarmImages.keys().next().value);

    this._alarmImages.set(color, image);

    return image;
  }

  _prepareAlarmLabelBinding() {
    clearTimeout(this._alarmBindingTimer);
    this._alarmBindingDeadline = Date.now() + 30000;

    this._bindAlarmLabelScene();
  }

  _removeLegacyAlarmOverlay() {
    clearTimeout(this._markerSwitchTimer);
    this._markerSwitchTimer = 0;
    this._markerInitId = (this._markerInitId || 0) + 1;
    this._markerInitRunning = false;

    if (this._markerRaf && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._markerRaf);
    }

    this._markerRaf = 0;
    if (this._markerDomLayer) this._markerDomLayer.remove();
    this._markerDomLayer = null;
    this._markers = [];

    const cfg = this._alarmConfig();

    const core = window.coreMgr && window.coreMgr.findOne && window.coreMgr.findOne(cfg.loaderId);
    const player = core && core.self && core.self.webglPlayer;
    const renderer = player && (player.webglRenderer || player.renderer);
    const canvas = renderer && renderer.domElement;
    const roots = [core && core.dom, player && player.dom, canvas && canvas.parentElement, document.getElementById(cfg.loaderId)].filter(Boolean);
    new Set(roots).forEach(root => {
      if (root.querySelectorAll) root.querySelectorAll('[data-marker-overlay="1"]').forEach(layer => layer.remove());
    });
  }

  _bindAlarmLabelScene(force = false) {
    clearTimeout(this._alarmBindingTimer);
    this._alarmBindingTimer = 0;
    if (this._alarmUnmounted) return;

    const cfg = this._alarmConfig();

    const index = this.state.sceneIndex; // Page expressions may run in the editor's parent window, while the loader
    // belongs to the simulator iframe. Use its explicit DOM bridge for both modes.

    const viewport = this._getAlarmLabelViewport();

    const owner = viewport && viewport.dom && viewport.dom.ownerDocument.defaultView;
    const manager = owner && owner.coreMgr || window.coreMgr;
    const core = manager && manager.findOne && manager.findOne(cfg.loaderId);
    const player = viewport || core && core.self && core.self.webglPlayer;
    const scene = player && player.scene;
    const expected = core && core.sceneMgr && core.sceneMgr.getScene && core.sceneMgr.getScene(index);

    if (!scene || core && (!core.ready || core.sceneIndex !== index) || expected && expected !== scene) {
      if (!this._alarmBindingDeadline) this._alarmBindingDeadline = Date.now() + 30000;

      if (Date.now() < this._alarmBindingDeadline) {
        this._alarmBindingTimer = setTimeout(() => this._bindAlarmLabelScene(), 100);
      }

      return;
    }

    this._removeLegacyAlarmOverlay();

    const bindings = this.state.alarmLabelBindings || {};
    if (!force && bindings[index] && bindings[index].sceneId === scene.uuid) return;

    const root = this._findAlarmLabelRoot(scene, cfg.positions[index], index);

    this.setState({
      alarmLabelBindings: { ...bindings,
        [index]: {
          target: root.uuid,
          sceneId: scene.uuid
        }
      }
    });
  }

  _getAlarmLabelViewport() {
    const found = new Set();
    const documents = new Set();

    const visit = (doc, depth) => {
      if (!doc || documents.has(doc) || depth > 3) return;
      documents.add(doc);
      doc.querySelectorAll('[data-scene-label-viewport]').forEach(element => {
        const bridge = element.__sceneLabelViewportBridge;
        const viewport = bridge && bridge.find(this._alarmConfig().loaderId);
        if (viewport && !viewport.disposed) found.add(viewport);
      });
      doc.querySelectorAll('iframe').forEach(frame => {
        try {
          visit(frame.contentDocument, depth + 1);
        } catch (_) {}
      });
    };

    visit(document, 0);
    return found.size === 1 ? Array.from(found)[0] : null;
  }

  _findAlarmLabelRoot(scene, positionMap, index) {
    const configured = this._alarmConfig().modelRootNames[index];

    if (configured) {
      const found = scene.getObjectByName(configured);
      if (found) return found;
    }

    const candidates = (scene.children || []).filter(child => {
      if (!child || child.isCamera || child.isLight || child.isHelper || !child.localToWorld) return false;
      let meshes = 0;
      child.traverse(node => {
        if (node.isMesh) meshes++;
      });
      return meshes > 0;
    });
    if (candidates.length < 2) return candidates[0] || scene;
    const Vector3 = scene.position.constructor;
    const list = index === 1 ? this.state.floorAlarmList : this.state.overviewAlarmList;
    const points = Array.isArray(list) && list.length ? list.map(item => item.position || positionMap[item.name] || [0, 0, 0]) : Object.keys(positionMap).map(name => positionMap[name]);
    let best = null;
    candidates.forEach(node => {
      try {
        node.updateWorldMatrix(true, true);
        let box = null;
        node.traverse(mesh => {
          const geometry = mesh.isMesh && mesh.geometry;
          if (box || !geometry) return;
          if (!geometry.boundingBox) geometry.computeBoundingBox();
          if (geometry.boundingBox) box = geometry.boundingBox.clone();
        });
        if (!box) return;
        box.setFromObject(node);
        if (box.isEmpty()) return;
        const size = box.getSize(new Vector3());
        const diagonal = size.length();
        const margin = Math.max(size.x, size.y, size.z, 1) * .08;
        const contained = points.filter(position => {
          const point = node.localToWorld(new Vector3(...position));
          return ['x', 'y', 'z'].every(axis => point[axis] >= box.min[axis] - margin && point[axis] <= box.max[axis] + margin);
        }).length;
        if (!best || contained > best.contained || contained === best.contained && diagonal < best.diagonal) best = {
          node,
          contained,
          diagonal
        };
      } catch (error) {
        console.warn('[SceneLabels] 模型根节点匹配失败', node.name, error);
      }
    });
    return best && best.contained > 0 ? best.node : scene;
  }

  _alarmNameKey(name) {
    return String(name == null ? '' : name).trim().toUpperCase();
  }

  getAlarmLabelColor(index, name) {
    if (this.state.alarmLabelOffline) return undefined;
    const record = this.getAlarmLabelRecord(index, name) || {}; // Leave missing/empty colors to the component's configurable defaultColor.

    if (this.hasOwn(record, 'color')) return typeof record.color === 'string' && record.color.trim() || undefined;
    const type = String(record.type || '').trim().toLowerCase();
    const aliases = {
      red: 'urgent',
      yellow: 'warning'
    };
    return type ? this._alarmConfig().colors[aliases[type] || type] || this._alarmConfig().colors.green : undefined;
  }

  _mergeRoomLabelList(current, updates) {
    const records = new Map();

    for (const item of [...(Array.isArray(current) ? current : []), ...(Array.isArray(updates) ? updates : [])]) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;

      const key = this._alarmNameKey(item.name);

      if (!key) continue;
      records.set(key, { ...records.get(key),
        ...item,
        name: String(item.name).trim()
      });
    }

    return Array.from(records.values());
  }

  getRoomLabelRecord(name) {
    const key = this._alarmNameKey(name);

    return (Array.isArray(this.state.roomLabelList) ? this.state.roomLabelList : []).find(item => item && this._alarmNameKey(item.name) === key);
  }

  getRoomLabelColor(name) {
    const record = this.getRoomLabelRecord(name) || {};
    return typeof record.color === 'string' && record.color.trim() || undefined;
  }

  _mergePipeFlowList(current, updates) {
    const allowed = new Set(Array.isArray(this.state.pipeFlowNames) ? this.state.pipeFlowNames : []);
    const records = new Map();

    for (const item of [...(Array.isArray(current) ? current : []), ...(Array.isArray(updates) ? updates : [])]) {
      if (!item || typeof item.name !== 'string') continue;
      const name = item.name.trim();
      if (!allowed.has(name)) continue;
      let status;
      if (item.status === 1 || item.status === true || item.status === '1') status = 1;else if (item.status === 0 || item.status === false || item.status === '0') status = 0;else continue;
      records.set(name, {
        name,
        status
      });
    }

    const next = Array.from(records.values());
    return Array.isArray(current) && current.length === next.length && current.every((item, index) => item && item.name === next[index].name && item.status === next[index].status) ? current : next;
  }

}
