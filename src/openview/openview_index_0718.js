class LowcodeComponent extends Component {
  state = {
    /**
     * 当前场景索引（枚举）
     * 0 = 首页（大屏概览页）
     * 1 = X12 厂房
     */
    sceneIndex: 0,
    /** X12 厂房底部按钮样式类名（未选中 / 选中） */
    btnX12: 'bottom-btn btn-background-unclick',
    /** 流出物列表数据 */
    effluentData: [],
    /** 告警状态概览列表 */
    alertListOverview: [],
    /** 数据监测卡片列表 */
    monitoringData: [],
    /** 操作日志列表 */
    operationLog: [],
    /** 设备告警列表 */
    alarmList: [],
    /** 设备定检列表 */
    inspectionList: [],
    /** 可变 Y 轴折线图数据（qtc） */
    qtcData: {},
  };

  /**
   * 组件挂载：初始化 WebSocket 推送相关内部状态并建立连接
   */
  componentDidMount() {
    // 显式初始化，兼容低代码按 methods 挂载（无 class field）的运行时
    this._pendingWsData = null;
    this._wsFlushRaf = 0;
    this._onVisibilityChange = null;
    this.handleWss();
  }

  /**
   * 裁剪监测卡片中的时序点，防止长时间推送导致内存膨胀
   * @param {Array} list 监测卡片列表
   * @returns {Array}
   */
  windowMonitoringData(list) {
    // 监测卡折线时序点滑动窗口上限（方法内常量，兼容低代码独立挂载 methods）
    const MAX_CHART_POINTS = 500;
    if (!Array.isArray(list)) {
      return [];
    }

    return list.map((card) => {
      const points = card && card.tritiumConcentration;
      if (!Array.isArray(points) || points.length <= MAX_CHART_POINTS) {
        return card;
      }

      return {
        ...card,
        tritiumConcentration: points.slice(-MAX_CHART_POINTS),
      };
    });
  }

  /**
   * 裁剪 qtc 折线数据（xAxis 与各系列对齐截取）
   * @param {Object} qtc qtc 图表载荷
   * @returns {Object}
   */
  windowQtcData(qtc) {
    // 监测卡折线时序点滑动窗口上限（方法内常量，兼容低代码独立挂载 methods）
    const MAX_CHART_POINTS = 500;
    if (!qtc || typeof qtc !== 'object') {
      return {};
    }

    const xAxis = Array.isArray(qtc.xAxis) ? qtc.xAxis : null;
    if (!xAxis || xAxis.length <= MAX_CHART_POINTS) {
      return qtc;
    }

    const start = xAxis.length - MAX_CHART_POINTS;
    const series = Array.isArray(qtc.series)
      ? qtc.series.map((item) => {
        if (!item || typeof item !== 'object') {
          return item;
        }

        const next = { ...item };
        if (Array.isArray(item.data)) {
          next.data = item.data.slice(start);
        }
        if (Array.isArray(item.init_data)) {
          next.init_data = item.init_data.slice(start);
        }
        return next;
      })
      : qtc.series;

    return {
      ...qtc,
      xAxis: xAxis.slice(start),
      series,
    };
  }

  /**
   * 裁剪普通列表数据（日志、告警等）
   * @param {Array} list 原始列表
   * @returns {Array}
   */
  windowListData(list) {
    // 日志 / 告警 / 定检等列表滑动窗口上限（方法内常量，兼容低代码独立挂载 methods）
    const MAX_LIST_ITEMS = 100;
    if (!Array.isArray(list)) {
      return [];
    }
    return list.length > MAX_LIST_ITEMS ? list.slice(-MAX_LIST_ITEMS) : list;
  }

  /**
   * 调度 WebSocket 数据合并刷新（同一帧内多次消息只 flush 一次）
   */
  scheduleWsFlush() {
    if (this._wsFlushRaf) {
      return;
    }
    this._wsFlushRaf = requestAnimationFrame(() => {
      this._wsFlushRaf = 0;
      this.flushWsData();
    });
  }

  /**
   * 将缓存的最新一帧推送数据写入 state
   * 仅在首页场景（sceneIndex === 0）且页面可见时更新，降低无效渲染
   */
  flushWsData() {
    const data = this._pendingWsData;
    if (!data) {
      return;
    }

    // 页面不可见时只保留最新包，回到前台再刷
    if (typeof document !== 'undefined' && document.hidden) {
      return;
    }

    // 非首页（sceneIndex !== 0）不灌监测/日志等大块数据
    if (this.state.sceneIndex !== 0) {
      return;
    }

    this._pendingWsData = null;

    this.setState({
      effluentData: Array.isArray(data.effluentData) ? data.effluentData : [],
      alertListOverview: this.windowListData(data.alertListOverview),
      monitoringData: this.windowMonitoringData(data.monitoringData),
      operationLog: this.windowListData(data.operationLog),
      alarmList: this.windowListData(data.alarmList),
      inspectionList: this.windowListData(data.inspectionList),
      qtcData: this.windowQtcData(data.qtcData),
    });
  }

  /**
   * 建立实时 WebSocket 连接，接收 init_data 主题推送
   */
  handleWss() {
    this.ws = new WebSocket('ws://192.168.1.4:8088/api/ws/realtime');

    this.ws.onopen = () => {
      console.log('✅ WebSocket 连接已建立');
    };

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        if (msg.topic === 'init_data' && msg.data) {
          // 只保留最新一帧，由 rAF 合并写入，避免高频全量 setState
          this._pendingWsData = msg.data;
          this.scheduleWsFlush();
          return;
        }

        // 其它 topic 忽略（避免无效 setState / 日志刷屏）
      } catch (error) {
        console.error('❌ 解析消息失败:', error);
      }
    };

    this.ws.onerror = () => {
      // 保持静默，避免异常刷屏；可按需加重连
    };

    if (typeof document !== 'undefined') {
      this._onVisibilityChange = () => {
        if (!document.hidden) {
          this.scheduleWsFlush();
        }
      };
      document.addEventListener('visibilitychange', this._onVisibilityChange);
    }
  }

  /**
   * 跳转到 X12 厂房场景（sceneIndex = 1）
   * @param {*} e 事件对象
   * @param {{ key?: string }} params 低代码事件参数，key 为 x12 时生效
   */
  goX12(e, params) {
    if (params && params.key === 'x12') {
      this.setState({
        btnX12: 'bottom-btn btn-background-click',
        sceneIndex: 1, // X12 厂房
      });
    }
  }

  /**
   * 跳转回大屏概览首页（sceneIndex = 0），并立即刷新缓存的推送数据
   */
  goHome() {
    this.setState(
      {
        btnX12: 'bottom-btn btn-background-unclick',
        sceneIndex: 0, // 首页 / 大屏概览
      },
      () => {
        // 回到首页后立刻刷出缓存的最新数据
        this.scheduleWsFlush();
      },
    );
  }

  /**
   * 组件卸载：清理定时器、可见性监听与 WebSocket 连接
   */
  componentWillUnmount() {
    if (this._wsFlushRaf) {
      cancelAnimationFrame(this._wsFlushRaf);
      this._wsFlushRaf = 0;
    }

    this._pendingWsData = null;

    if (this._onVisibilityChange && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._onVisibilityChange);
      this._onVisibilityChange = null;
    }

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
