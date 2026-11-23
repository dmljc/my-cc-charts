/** 最终版：保留同事精简后的业务和动画停止逻辑，三维告警标注逐个配置，共用投影层。 */
class LowcodeComponent extends Component {
    state = {
      btnClassoOverView: 'bottom-btn btn-background-click',
      btnClassX12Close: 'bottom-btn btn-background-click',
      btnClassX12Open: 'bottom-btn btn-background-unclick',
      btnClassX12F1: 'bottom-btn btn-background-unclick',
      btnClassX12F2: 'bottom-btn btn-background-unclick',
      btnClassX12F3: 'bottom-btn btn-background-unclick',
      /**
       * 当前场景索引
       * 0 = 首页 / 大屏概览
       * 1 = X12 厂房
       * 刷新必须在首帧就是 1。若从 0 起画，播放器会先绑概览模型，之后 setState 只改 UI。
       */
      sceneIndex: this._getWsTargetBuildingId() === 12 ? 1 : 0,
      floor: 0, // 当前楼层：0 整体，1/2/3 为对应楼层
      alarmStats: {}, // 警告统计
      disposalStats: {}, // 处置统计
      effluentList: {}, // 流出物
      overviewStats: {}, // 设备概览
      deviceTypes: {}, // 设备类型
      inspectionStats: {}, // 设备点检
      monitoringList: [], // 数据监测
      operationLogList: [], // 操作日志
      alarmList: [], // 设备告警
      inspectionList: [], // 设备定检
      qtcList: {}, // 流出物折线图
      httpBaseUrl: 'https://115111ob8gw23.vicp.fun',
      overviewAlarmList: [], // 概览场景告警标注
      floorAlarmList: [], // X12 楼层告警标注
      roomLabelList: [], // 房间标注
      alarmLabelDefaultColor: '#1f9d55', // 未收到颜色时的默认色
      alarmLabelOffline: true, // WS 未连通时不套状态色。离线时不把颜色传给标注组件
      // 房间标注着色蒙版
      roomLabelImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGgAAAAwCAYAAAD9wT87AAAACXBIWXMAAAsTAAALEwEAmpwYAAABcElEQVR4nO3b0UoCURSF4cGoJ4heSymnXimrtyiKeqEstevAqxjv/9g1hDRnRi+Us3DWdyvI5vxwOoG7KBKAE+AKeASmwArbtVV9tnHGl3HmqRapOBfAYufj2CZz4LwrzBFwt/FrbN9ugUEqkOPomKSuNdMyWn8QxP1nWj5+Hg71a800lRHoKfcU1uohAr23f26ZTSNQlXsKa1VFIBPmQOIcSJwDiXMgcQ4kzoHEOZA4BxLnQOIcSJwDiXMgcQ4kzoHEOZA4BxLnQOIcSJwDifOPRrR9RaC33FNYq9ei3k8xTfdFvTxkmsYR6BiY5Z7EGhZ/W3ex2dX83DIb/t8Ris0u03Cd2rAbADe5JzMmyRXItVAj/03KYta41joixcOhjP2UeIt7A2Ivqvps44zHcebFIQFOgc8tDmIJnOWet5eA4RaBytxz9hrw0hHnOfd8vUf7VeerTfyqK3PPZe1Xna824atu6VebKH7/dzuoq+0by2GPz0M3lgMAAAAASUVORK5CYII=",
      pipeFlowList: [], // 管道流动状态，名称过滤和启停由管道组件处理
      pipeFlowReplace: true, // true 按全量重算，false 时没出现的管道保持上次状态
      // 房间标注前景：深色底板与白色图标
      roomLabelForegroundImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGgAAAAwCAYAAAD9wT87AAAACXBIWXMAAAsTAAALEwEAmpwYAAADDUlEQVR4nO2bPW8TQRCG7c4S5PaMfLZTXYMirS/4JPDeJbKrWCIESwktUIAQCIEQHSWKLKWhAFq+fgmB/AegpwgQJARFUtENesM5Ssh9xTjZTTyvNN3d+vQ+N3Nr7UyhECMiKhJRiYhsInKIqE5Ekxw0Sg/qkbd25HUxjkUcHFxcvXj11hU36L6uTM98smXwS0j1m0ONzAN4Wpme/egGc6/mr91egufwPguOdf9xP6w222sMQx3pC1n12+8fLK8EYJAIZ/HGvV7Zm/nOcJSWagHvl27evbwPElILmcNwlPYyXvbCjYf9vtpT7lD/an5nVffDcai/5a7ZXou+ScXt7MGGgM1RRr0g89fvLG5nEbZ5ruq+yXHTpi2Dp5bXUrVm81RhSOFerGFL9Qxr6jZCGBpuOPcSbADIwVY67WJLtj7bU2GzMGLZXuBjbd1mCAMDW3CwAaC63Qh/ply8eRhwdkPiTFL7fAcTsAGgyTSSKGuHBWcHklTPdb+xwsAAm0xA1lRLJRlLRD0i+krZ+kJEC0nrWI0LgW4zxHEF5DQap1MAwfi8Wk9aB7+h2wxxXAGllSY6oNLW0m2GMDAYkBwjQP9zDWeQYkDCgIzgEif1m8qApH7jGJAB5ggDgjcJUj8EBiT1G20EIP6jqhiQMOCt5gwywBhhSHCJk/ohMCA53scNI9kknDkbWLrNECf0wG4k50F8YKeGB4TumxRACzkhrRPRpaR1+MhbpQLKbhrxAj/J3AhUbAnLKm27mka2dJcTYVjYjeDHoGkkX9tVCqRhAXHblUr0vHJu9sOg7crGmEkOqlsoRfhepG0csoR7J2QYRmWNM0fG++2G3ReDxsUS5lN0pzSH2uNBb9D6G5Uip+Z33rJJyphZoZ3m+QhQ6dHKk/NlL/ym++HGPcpx4ycRJAvDQ7hA90OOa5S9cCMa4JpI2o1ZGMOr+e13uh923KLmd1ajzImH888QsYP5FIxAYLuX8T+JQx7cA3gKb+FxtCFwMoeIY0DxGD4dzRh+bjAsFovFYrFYLBaLVTjZ+gOkn+Ios7/J/AAAAABJRU5ErkJggg=="
    };
  
    /** 组件挂载：连接 WS。标注挂接和管道启停由对应组件处理。 */
    componentDidMount() {
      this._alarmUnmounted = false;
      this._alarmConfig();
      const buildingId = this._getWsTargetBuildingId();
      this._wsTargetBuildingId = buildingId;
      const start = () => {
        this.handleWss();
      };
      // OpenView 场景跳转会重新挂载组件，需恢复 X12 场景状态与订阅目标。
      if (buildingId === 12 && this.state.sceneIndex !== 1) {
        this.setState({
          sceneIndex: 1
        }, start);
      } else {
        start();
      }
    }
  
    /** 组件卸载：关闭 WebSocket。 */
    componentWillUnmount() {
      this._alarmUnmounted = true;
      if (this.ws) {
        ['onopen', 'onmessage', 'onerror', 'onclose'].forEach(key => {
          this.ws[key] = null;
        });
        this.ws.close();
        this.ws = null;
      }
    }
  
    /** 播放 X12 拆解动画。 */
    runX12Open() {
      this._runDevAnimation("devanimation-95339045");
    }
  
    /** 播放 X12 整体（合并分层）动画。 */
    runX12Close() {
      this._runDevAnimation("devanimation-464782d2");
    }
  
    /** 播放 X12 一楼动画。 */
    runX12F1() {
      this._runDevAnimation('devanimation-3');
    }
  
    /** 播放 X12 二楼动画。 */
    runX12F2() {
      this._runDevAnimation('devanimation-4');
    }
  
    /** 播放 X12 三楼动画。 */
    runX12F3() {
      this._runDevAnimation('devanimation-5');
    }
  
    /** 动画组件未挂载或模型未就绪时跳过，避免 runAnimation 抛错。 */
    _runDevAnimation(ref) {
      try {
        const target = typeof this.$ === 'function' ? this.$(ref) : null;
        if (target && typeof target.runAnimation === 'function') {
          target.runAnimation();
        }
      } catch (error) {
        console.warn('[DevAnimation] 动画调用已跳过', ref, error);
      }
    }
  
    /** 播放 X12 按钮动画前，停止并复位本脚本中已知的动画，避免动画重叠。 */
    _stopDevAnimationsBeforeX12() {
      // 95339045 拆解，464782d2 整体，3/4/5 为 1F/2F/3F。
      const refs = [
        "devanimation-95339045", 
        "devanimation-464782d2",
        'devanimation-3',
        'devanimation-4',
        'devanimation-5'
      ];
      refs.forEach(ref => {
        try {
          const target = typeof this.$ === 'function' ? this.$(ref) : null;
          // keepState=false：停止并将动画涉及的节点复位到动画起点。
          if (target && typeof target.stopAnimation === 'function') {
            target.stopAnimation(false);
          }
        } catch (error) {
          console.warn('[DevAnimation] 停止动画已跳过', ref, error);
        }
      });
    }
  
    // 点击 X12 底部按钮，切换整体 / 拆解 / 楼层视图。
    btnClick(e, params) {
      const names = ['Close', 'Open', 'F1', 'F2', 'F3'];
      const active = names.find(n => n.toLowerCase() === params.key);
      if (!active) return;
      this._stopDevAnimationsBeforeX12();
      const next = {
        floor: {
          Close: 0,
          Open: 0,
          F1: 1,
          F2: 2,
          F3: 3
        }[active]
      };
      names.forEach(n => {
        next[`btnClassX12${n}`] = `bottom-btn btn-background-${n === active ? 'click' : 'unclick'}`;
      });
      this.setState(next);
      this[`runX12${active}`]();
    }

    /** 连接实时 WebSocket，接收 init_data / ws_data。断线后告警标注回到离线色。 */
    handleWss() {
      if (!this.state.alarmLabelOffline) {
        this.setState({
          alarmLabelOffline: true
        });
      }
      this.ws = new WebSocket('https://115111ob8gw23.vicp.fun/api/ws/realtime');
      this.ws.onopen = () => {
        console.log('✅ WebSocket 连接已建立');
        // 场景跳转后的新连接也必须恢复目标厂房订阅。
        this._sendWsBuildingSubscription(this._wsTargetBuildingId);
      };
      this.ws.onmessage = e => {
        try {
          const msg = JSON.parse(e.data);
          if (!msg || !msg.data) return;
          if (msg.topic === 'init_data') {
            this.applyInitData(msg.data);
          } else if (msg.topic === 'ws_data') {
            this.applyWsData(msg.data);
          }
        } catch (error) {
          console.error('❌ 解析消息失败:', error);
        }
      };
      const markOffline = () => {
        if (!this._alarmUnmounted && !this.state.alarmLabelOffline) {
          this.setState({
            alarmLabelOffline: true
          });
        }
      };
      this.ws.onerror = markOffline;
      this.ws.onclose = markOffline;
    }
  
    /**
     * 进入 X12 厂房场景（底部按钮）。
     * 平台按钮可能只传事件对象，因此不能依赖 params.key 才订阅。
     */
    goX12() {
      this._setWsTargetBuildingId(12);
      this._sendWsBuildingSubscription(12);
      const next = {
        sceneIndex: 1,
        floor: 0
      };
      ['Close', 'Open', 'F1', 'F2', 'F3'].forEach(name => {
        next[`btnClassX12${name}`] = `bottom-btn btn-background-${name === 'Close' ? 'click' : 'unclick'}`;
      });
      this.setState(next);
    }
  
    /** 返回首页大屏，取消厂房订阅。 */
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
      });
    }
  
    /** 安全转普通对象，非 object 返回 {}。 */
    asObject(value) {
      return Object.prototype.toString.call(value) === '[object Object]' ? value : {};
    }
  
    /** 判断对象自身是否包含指定字段，不走原型链。 */
    hasOwn(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }
  
    /** 处理 WS 全量初始化数据。 */
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
      if (this.hasOwn(payload, 'roomLabelList')) {
        next.roomLabelList = this._mergeRoomLabelList([], payload.roomLabelList);
      }
      if (this.hasOwn(payload, 'pipeFlowList') && Array.isArray(payload.pipeFlowList)) {
        next.pipeFlowList = payload.pipeFlowList;
        next.pipeFlowReplace = true;
      }
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
      this.setState(next);
    }
  
    /** 处理 WS 增量推送。省略的字段保持上次状态。 */
    applyWsData(data) {
      const payload = Array.isArray(data) ? {
        buildingMarkers: data
      } : this.asObject(data);
      if (!Object.keys(payload).length) return;
      const cfg = this._alarmConfig(),
            current = this._alarmPendingLists || this.state,
            next = {};
      ['alarmStats', 'disposalStats', 'effluentList', 'overviewStats', 'deviceTypes', 'inspectionStats', 'monitoringList', 'operationLogList', 'alarmList', 'inspectionList', 'qtcList'].forEach(key => {
        if (this.hasOwn(payload, key)) {
          next[key] = payload[key];
        }
      });
      ['overviewAlarmList', 'floorAlarmList'].forEach((key, index) => {
        if (this.hasOwn(payload, key)) {
          next[key] = this._mergeAlarmUpdates(current[key], payload[key], cfg.positions[index]);
        }
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
          if (hasRoomUpdates) {
            update.roomLabelList = this._mergeRoomLabelList(previous.roomLabelList, payload.roomLabelList);
          }
          if (hasPipeUpdates) {
            update.pipeFlowList = payload.pipeFlowList;
            update.pipeFlowReplace = false;
          }
          return update;
        });
      }
    }
  
    /** 保存目标厂房，使 OpenView 场景跳转后的新组件实例能够恢复订阅。 */
    _setWsTargetBuildingId(buildingId) {
      this._wsTargetBuildingId = buildingId;
      window.__openViewWsBuildingId = buildingId;
      try {
        if (buildingId == null) {
          window.sessionStorage.removeItem('openview.wsBuildingId');
        } else {
          window.sessionStorage.setItem('openview.wsBuildingId', String(buildingId));
        }
      } catch (error) {
        console.warn('[WS] 保存厂房订阅状态失败', error);
      }
    }
  
    /** 读取场景跳转前保存的目标厂房。 */
    _getWsTargetBuildingId() {
      const saved = [this._wsTargetBuildingId, window.__openViewWsBuildingId].find(v => v != null);
      if (saved != null) {
        return Number(saved);
      }
      try {
        const value = window.sessionStorage.getItem('openview.wsBuildingId');
        return value ? Number(value) : null;
      } catch (error) {
        console.warn('[WS] 读取厂房订阅状态失败', error);
        return null;
      }
    }
  
    /** 在连接可用时发送厂房订阅，并输出明确的上行日志。 */
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

    /** 概览场景点击 X12 标注时进入厂房。 */
    onAlarmLabelClick(event) {
      if (this.state.sceneIndex === 0 && event && this._alarmNameKey(event.id) === 'X12') this.goX12();
    }
  
    /** 告警标注的加载器、状态色和两个场景的默认坐标。 */
    _alarmConfig() {
      if (!this._alarmLabelConfig) {
        this._alarmLabelConfig = {
          loaderId: 'node_ocmu0mvlo11',
          colors: {
            green: '#1f9d55',
            warning: '#d4a017',
            urgent: '#e11d2e'
          },
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
  
    /** 给告警列表补齐坐标：已有三维坐标则保留，否则用场景默认坐标。 */
    _mergeAlarmPositions(list, positionMap) {
      return (Array.isArray(list) ? list : []).filter(item => item && this._alarmNameKey(item.name)).map(item => {
        const source = this.asObject(item);
        const position = Array.isArray(source.position) && source.position.length >= 3 ? source.position.slice(0, 3) : positionMap[this._alarmNameKey(source.name)];
        return { ...source,
          position: position ? [...position] : [0, 0, 0]
        };
      });
    }
  
    /** 合并单条告警。只改类型、不带颜色时清掉旧颜色，避免沿用上次色值。 */
    _mergeAlarmRecord(previous, update) {
      const next = { ...previous,
        ...update
      };
      if (update.type != null && update.color == null) delete next.color;
      return next;
    }
  
    /** 按名称合并告警增量，并重新补齐坐标。 */
    _mergeAlarmUpdates(current, updates, positionMap) {
      const byName = new Map((Array.isArray(current) ? current : []).filter(Boolean).map(item => [this._alarmNameKey(item.name), item]));
      (Array.isArray(updates) ? updates : []).forEach(item => {
        const source = this.asObject(item),
              key = this._alarmNameKey(source.name);
        if (key) {
          byName.set(key, this._mergeAlarmRecord(byName.get(key), source));
        }
      });
      return this._mergeAlarmPositions(Array.from(byName.values()), positionMap);
    }
  
    /** 把名称规范成去空白的大写键，空值得到空字符串。 */
    _alarmNameKey(name) {
      return String(name == null ? '' : name).trim().toUpperCase();
    }
  
    /** 按房间名合并标注列表，同名记录以后一次为准。 */
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
  
    /** 按房间名取标注记录，找不到时返回 undefined。 */
    getRoomLabelRecord(name) {
      const key = this._alarmNameKey(name);
      return (Array.isArray(this.state.roomLabelList) ? this.state.roomLabelList : []).find(item => item && this._alarmNameKey(item.name) === key);
    }
  
    /** 按房间名取标注颜色，没有有效颜色时返回 undefined。 */
    getRoomLabelColor(name) {
      const record = this.getRoomLabelRecord(name) || {};
      return typeof record.color === 'string' && record.color.trim() || undefined;
    }
  
  }

  
