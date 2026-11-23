class LowcodeComponent extends Component {
    state = {
      btnClassoOverView: 'bottom-btn btn-background-click',
  
      btnClassX12Close: 'bottom-btn btn-background-click',
      btnClassX12Open: 'bottom-btn btn-background-unclick',
      btnClassX12F1: 'bottom-btn btn-background-unclick',
      btnClassX12F2: 'bottom-btn btn-background-unclick',
      btnClassX12F3: 'bottom-btn btn-background-unclick',
      btnClassX12Pipe: 'bottom-btn btn-background-unclick',
      /**
       * 当前场景索引
       * 0 = 首页 / 大屏概览
       * 1 = X12 厂房
       * 刷新必须在首帧就是 1。若从 0 起画，播放器会先绑概览模型，之后 setState 只改 UI。
       */
      sceneIndex: this._getWsTargetBuildingId() === 12 ? 1 : 0,
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
    };
  
    // ===========================================================================
    // 生命周期
    // ===========================================================================
  
    /** 组件挂载：连接 WS。 */
    componentDidMount() {
      const buildingId = this._getWsTargetBuildingId();
      this._wsTargetBuildingId = buildingId;
      const start = () => {
        this.handleWss();
      };
      // OpenView 场景跳转会重新挂载组件，需恢复 X12 场景状态与订阅目标。
      if (buildingId === 12 && this.state.sceneIndex !== 1) {
        this.setState({ sceneIndex: 1 }, start);
      } else {
        start();
      }
    }
  
    /** 组件卸载：关闭 WebSocket */
    componentWillUnmount() {
      if (this.ws) {
        ['onopen', 'onmessage', 'onerror', 'onclose'].forEach((k) => {
          this.ws[k] = null;
        });
        this.ws.close();
        this.ws = null;
      }
    }
  
    // x12 厂房动画：分层 / 合并分层 / 设备1~3 / 管道（OpenView 按钮按方法名绑定，需保留）
    runX12Open() {
      this._runDevAnimation('devanimation-1');
    }
    runX12Close() {
      this._runDevAnimation('devanimation-2');
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
      const refs = [
        'devanimation-1', // 拆解视图
        'devanimation-2', // 整体视图
        'devanimation-3', // 1F
        'devanimation-4', // 2F
        'devanimation-5', // 3F
        'devanimation-6', // 管道
      ];
      refs.forEach((ref) => {
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
  
    // 点击 X12 底部按钮，切换整体 / 拆解 / 楼层 / 管道视图。
    btnClick(e, params) {
      const names = ['Close', 'Open', 'F1', 'F2', 'F3', 'Pipe'];
      const active = names.find((n) => n.toLowerCase() === params.key);
      if (!active) return;
      this._stopDevAnimationsBeforeX12();
      const next = {};
      names.forEach((n) => {
        next[`btnClassX12${n}`] = `bottom-btn btn-background-${n === active ? 'click' : 'unclick'}`;
      });
      this.setState(next);
      this[`runX12${active}`]();
    }
  
    // ===========================================================================
    // WebSocket / 业务逻辑（大屏数据与场景切换）
    // ===========================================================================
  
    /** 连接实时 WebSocket，接收 init_data / ws_data */
    handleWss() {
      this.ws = new WebSocket('https://115111ob8gw23.vicp.fun/api/ws/realtime');
  
      this.ws.onopen = () => {
        console.log('✅ WebSocket 连接已建立');
        // 场景跳转后的新连接也必须恢复目标厂房订阅。
        this._sendWsBuildingSubscription(this._wsTargetBuildingId);
      };
  
      this.ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (!msg || !msg.data) {
            return;
          }
          if (msg.topic === 'init_data') {
            this.applyInitData(msg.data);
          } else if (msg.topic === 'ws_data') {
            this.applyWsData(msg.data);
          }
        } catch (error) {
          console.error('❌ 解析消息失败:', error);
        }
      };
  
      this.ws.onerror = () => { };
    }
  
    /**
     * 进入 X12 厂房场景（底部按钮）
     * 平台按钮可能只传事件对象，因此不能依赖 params.key 才订阅。
     */
    goX12() {
      this._setWsTargetBuildingId(12);
      this._sendWsBuildingSubscription(12);
      const viewNames = ['Close', 'Open', 'F1', 'F2', 'F3', 'Pipe'];
      const next = { sceneIndex: 1 };
      viewNames.forEach((n) => {
        next[`btnClassX12${n}`] = `bottom-btn btn-background-${n === 'Close' ? 'click' : 'unclick'}`;
      });
      this.setState(next);
    }
  
    /** 返回首页大屏，取消厂房订阅。 */
    goHome() {
      this._setWsTargetBuildingId(null);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ topic: 'unsubscribe' }));
      }
      this.setState({ sceneIndex: 0 });
    }
  
    /** 安全转普通对象，非 object 返回 {} */
    asObject(value) {
      return Object.prototype.toString.call(value) === '[object Object]' ? value : {};
    }
  
    hasOwn(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }
  
    /** 处理 WS 全量初始化数据。 */
    applyInitData(data) {
      const payload = this.asObject(data);
      const lists = ['monitoringList', 'operationLogList', 'alarmList', 'inspectionList'];
      const next = {};
      [
        'alarmStats', 'disposalStats', 'effluentList', 'overviewStats', 'deviceTypes',
        'inspectionStats', 'qtcList', ...lists,
      ].forEach((key) => {
        next[key] = payload[key] || (lists.includes(key) ? [] : {});
      });
      this.setState(next);
    }
  
    /** 处理 WS 增量推送。 */
    applyWsData(data) {
      const payload = this.asObject(data);
      if (!Object.keys(payload).length) return;
  
      const next = {};
      [
        'alarmStats', 'disposalStats', 'effluentList', 'overviewStats', 'deviceTypes',
        'inspectionStats', 'monitoringList', 'operationLogList', 'alarmList',
        'inspectionList', 'qtcList',
      ].forEach((key) => {
        if (this.hasOwn(payload, key)) {
          next[key] = payload[key];
        }
      });
  
      if (Object.keys(next).length) {
        this.setState(next);
      }
    }
  
    // ===========================================================================
    // WebSocket 厂房订阅
    // ===========================================================================
  
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
      const saved = [this._wsTargetBuildingId, window.__openViewWsBuildingId].find((v) => v != null);
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
      if (buildingId == null) {
        return false;
      }
      if (!this.ws || this.ws.readyState !== 1) {
        console.log('[WS] 等待连接后订阅厂房', buildingId);
        return false;
      }
      const message = { topic: 'subscribe', buildingId: Number(buildingId) };
      this.ws.send(JSON.stringify(message));
      console.log('[WS] 已发送厂房订阅', message);
      return true;
    }
  }
