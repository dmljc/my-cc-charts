class LowcodeComponent extends Component {
    state = {
      btnClass1: 'bottom-btn btn-background-click',
      /**
       * 当前场景索引（枚举）
       * 0 = 首页 / 大屏概览页
       * 1 = X12 厂房
       */
      sceneIndex: 0,
      effluentList: {
        X12: [],
        X03: [],
      },
      alertOverviewList: [],
      monitoringList: [],
      operationLogList: [],
      alarmList: [],
      inspectionList: [],
      qtcList: {},
    };

    componentDidMount() {
      this.handleWss();
    }

    /**
     * 页面只负责 WebSocket 连接与按字段分发。
     * 列表覆盖、监测卡折线合并、QTC 增量拼接 / 裁窗均在对应自定义组件内维护。
     */
    handleWss() {
      this.ws = new WebSocket('ws://192.168.1.2:8088/api/ws/realtime');
      this.ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (!msg || !msg.data) {
            return;
          }
          if (msg.topic === 'init_data') {
            this.applyInitData(msg.data);
            return;
          }
          if (msg.topic === 'ws_data') {
            this.applyWsData(msg.data);
          }
        } catch (error) {
          console.error('❌ 解析消息失败:', error);
        }
      };
    }

    goX12(e, params) {
      if (params && params.key === 1) {
        this.setState({
          btnClass1: 'bottom-btn btn-background-click',
          sceneIndex: 1,
        });

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            topic: 'subscribe',
            buildingId: 12
          }));
        }
      }
    }

    goHome() {
      this.setState({
        btnClass1: 'bottom-btn btn-background-click',
        sceneIndex: 0,
      });

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          topic: 'unsubscribe'
        }));
      }
    }

    asObject(value) {
      return Object.prototype.toString.call(value) === '[object Object]' ? value : {};
    }

    hasOwn(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }

    applyInitData(data) {
      const payload = this.asObject(data);
      this.setState({
        effluentList: payload.effluentList || {},
        alertOverviewList: payload.alertOverviewList || [],
        monitoringList: payload.monitoringList || [],
        operationLogList: payload.operationLogList || [],
        alarmList: payload.alarmList || [],
        inspectionList: payload.inspectionList || [],
        qtcList: payload.qtcList || {},
      });
    }

    applyWsData(data) {
      const payload = this.asObject(data);
      if (!Object.keys(payload).length) {
        return;
      }

      const keys = [
        'effluentList',
        'alertOverviewList',
        'monitoringList',
        'operationLogList',
        'alarmList',
        'inspectionList',
        'qtcList',
      ];
      const next = {};

      keys.forEach((key) => {
        if (this.hasOwn(payload, key)) {
          next[key] = payload[key];
        }
      });

      if (Object.keys(next).length) {
        this.setState(next);
      }
    }

    componentWillUnmount() {
      if (this.ws) {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
        this.ws = null;
      }
    }
  }
