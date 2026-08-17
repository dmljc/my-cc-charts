class LowcodeComponent extends Component {
    state = {
      btnClass1: 'bottom-btn btn-background-click',
      // btnClass2: 'bottom-btn btn-background-unclick',
      // btnClass3: 'bottom-btn btn-background-unclick',
      /**
       * 当前场景索引（枚举）
       * 0 = 首页 / 大屏概览页
       * 1 = X12 厂房
       */
      sceneIndex: 0,
      // 流出物
      effluentList: {
        X12: [],
        X03: [],
      },
      // 告警状态概览
      alertOverviewList: [],
      // 数据监测卡片
      monitoringList: [],
      // 操作日志
      operationLogList: [],
      // 设备警告
      alarmList: [],
      // 设备定检
      inspectionList: [],
      // QTC流出物
      qtcList: {},
    };
  
    // 内置加载器配置
    // {
    //   "componentName": "DevLoader",
    //   "id": "node_ocmca8tqmc1",
    //   "props": {
    //     "width": "100vw",
    //     "height": "100vh",
    //     "sceneIndex": 0
    //   },
    //   "hidden": false,
    //   "title": "",
    //   "isLocked": false,
    //   "condition": true,
    //   "conditionGroup": ""
    // },
  
    componentDidMount() {
      this.handleWss();
    }
  
    /**
     * WebSocket
     * - init_data：全量写入
     * - ws_data：字段结构一致
     *   · alarmList / operationLogList / inspectionList / alertOverviewList：整表覆盖
     *   · effluentList：按厂房编码保存完整指标列表，整组覆盖
     *   · monitoringList：卡片按 id 合并；tritiumConcentration 增量拼接，裁 30 分钟
     *   · qtcList：折线增量拼接 / 整窗替换，裁 30 分钟
     */
    handleWss() {
      this.ws = new WebSocket('ws://192.168.1.2:8088/api/ws/realtime');
  
      this.ws.onopen = () => {
        console.log('✅ WebSocket 连接已建立');
      };
  
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
  
      this.ws.onerror = () => { };
    }
  
    // 跳转到x12 厂房
    goX12(e, params) {
      if (params && params.key === 1) {
        this.setState({
          btnClass1: 'bottom-btn btn-background-click',
          // btnClass2: 'bottom-btn btn-background-click',
          // btnClass3: 'bottom-btn btn-background-unclick',
          sceneIndex: 1,
        });
  
        // 发送切换指令:subscribe订阅
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            topic: 'subscribe',
            buildingId: 12
          }));
        }
      }
    }
  
    // 跳转到概览页
    goHome() {
      this.setState({
        btnClass1: 'bottom-btn btn-background-click',
        sceneIndex: 0,
      });
  
      // 发送切换指令:unsubscribe 取消订阅
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          topic: 'unsubscribe'
        }));
      }
    }
  
    /** 折线窗口：最近 30 分钟（1 秒 1 点 ≈ 1800） */
    getMaxChartPoints() {
      return 30 * 60;
    }
  
    asArray(value) {
      return Object.prototype.toString.call(value) === '[object Array]' ? value : [];
    }
  
    asObject(value) {
      return Object.prototype.toString.call(value) === '[object Object]' ? value : {};
    }
  
    hasOwn(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }
  
    /** 整表覆盖：拷贝新引用，避免低代码复用旧数组不刷新 */
    replaceList(value) {
      return this.asArray(value).slice();
    }
  
    /** 流出物按厂房分组：复制每个厂房的数组，保留接口返回的动态厂房编码。 */
    replaceEffluentGroups(value) {
      const groups = this.asObject(value);
      return Object.keys(groups).reduce((result, buildingCode) => {
        result[buildingCode] = this.replaceList(groups[buildingCode]);
        return result;
      }, {});
    }
  
    tail(list, max) {
      const arr = this.asArray(list);
      return arr.length > max ? arr.slice(-max) : arr;
    }
  
    getCardPoints(card) {
      if (!card || typeof card !== 'object') {
        return [];
      }
      const points = card.tritiumConcentration != null ? card.tritiumConcentration : card.chart;
      return this.asArray(points);
    }
  
    /** 监测卡折线裁到 30 分钟窗口 */
    trimMonitoring(list) {
      const maxPoints = this.getMaxChartPoints();
      return this.asArray(list).map((card) => {
        if (!card || typeof card !== 'object') {
          return card;
        }
        const points = this.getCardPoints(card);
        if (!points.length && card.tritiumConcentration == null && card.chart == null) {
          return card;
        }
        return {
          ...card,
          tritiumConcentration: this.tail(points, maxPoints),
        };
      });
    }
  
    /**
     * 合并监测列表（ws_data）
     * - 卡片按 id（无 id 用下标）更新字段
     * - tritiumConcentration：≤5 点视为增量 append，否则整窗替换；空数组不覆盖已有时序
     */
    mergeMonitoring(prevList, incomingList) {
      const incoming = this.asArray(incomingList);
      if (!incoming.length) {
        return this.trimMonitoring(prevList);
      }
  
      const maxPoints = this.getMaxChartPoints();
      const map = new Map();
  
      this.asArray(prevList).forEach((card, i) => {
        const key = card && card.id != null ? String(card.id) : `i_${i}`;
        map.set(key, {
          ...card,
          tritiumConcentration: this.getCardPoints(card).slice(),
        });
      });
  
      incoming.forEach((card, i) => {
        const key = card && card.id != null ? String(card.id) : `i_${i}`;
        const addPoints = this.getCardPoints(card);
        const prev = map.get(key);
  
        if (!prev) {
          map.set(key, {
            ...card,
            tritiumConcentration: this.tail(addPoints, maxPoints),
          });
          return;
        }
  
        const prevPts = this.asArray(prev.tritiumConcentration);
        let mergedPts = prevPts;
        if (addPoints.length) {
          const isIncremental = prevPts.length > 0 && addPoints.length <= 5;
          mergedPts = isIncremental ? prevPts.concat(addPoints) : addPoints.slice();
        }
  
        map.set(key, {
          ...prev,
          ...card,
          tritiumConcentration: this.tail(mergedPts, maxPoints),
        });
      });
  
      return Array.from(map.values());
    }
  
    /** 取 qtc 系列数值：优先 topic，其次非空的 data / init_data */
    pickQtcSeriesValues(seriesItem, topic) {
      if (!seriesItem || typeof seriesItem !== 'object') {
        return [];
      }
      const keys = topic ? [topic, 'data', 'init_data'] : ['data', 'init_data'];
      let fallback = null;
      for (let i = 0; i < keys.length; i += 1) {
        const arr = seriesItem[keys[i]];
        if (!Array.isArray(arr)) {
          continue;
        }
        if (arr.length) {
          return arr;
        }
        if (fallback == null) {
          fallback = arr;
        }
      }
      return fallback || [];
    }
  
    /** 裁剪 qtc：xAxis / data / init_data 对齐到最近窗口 */
    trimQtc(qtc) {
      const maxPoints = this.getMaxChartPoints();
      const source = this.asObject(qtc);
      const xAxis = this.asArray(source.xAxis);
      const start = xAxis.length > maxPoints ? xAxis.length - maxPoints : 0;
      const trimmedX = start > 0 ? xAxis.slice(start) : xAxis.slice();
      const len = trimmedX.length;
      const topic =
        typeof source.topic === 'string' && source.topic.trim() !== ''
          ? source.topic.trim()
          : undefined;
  
      return {
        ...source,
        xAxis: trimmedX,
        legend: this.asArray(source.series)
          .map((item) => (item && item.name != null ? String(item.name) : ''))
          .filter(Boolean),
        series: this.asArray(source.series).map((item) => {
          if (!item || typeof item !== 'object') {
            return item;
          }
          const next = { ...item };
          const values = this.pickQtcSeriesValues(item, topic);
          const aligned = values.length > start ? values.slice(start) : values.slice();
          const synced = aligned.length > len ? aligned.slice(-len) : aligned;
          if (Array.isArray(item.data) || topic === 'data' || !topic) {
            next.data = synced;
          }
          if (Array.isArray(item.init_data) || topic === 'init_data') {
            next.init_data = synced.slice();
          }
          if (!Array.isArray(next.data) && !Array.isArray(next.init_data)) {
            next.data = synced;
          }
          return next;
        }),
      };
    }
  
    /**
     * 合并 qtc（ws_data）
     * - 短横轴增量：append 后裁窗
     * - 整窗快照 / 系列名不重叠：直接替换
     */
    mergeQtc(prevQtc, incomingQtc) {
      const prev = this.asObject(prevQtc);
      const next = this.asObject(incomingQtc);
      const nextX = this.asArray(next.xAxis);
      if (!nextX.length) {
        return this.trimQtc(prev);
      }
  
      const prevX = this.asArray(prev.xAxis);
      const nextSeries = this.asArray(next.series);
      const topic =
        (typeof next.topic === 'string' && next.topic.trim()) ||
        (typeof prev.topic === 'string' && prev.topic.trim()) ||
        undefined;
  
      const incomingValueLens = nextSeries.map((item) => this.pickQtcSeriesValues(item, topic).length);
      const maxIncomingVals = incomingValueLens.length
        ? Math.max.apply(null, incomingValueLens)
        : 0;
  
      const isIncremental =
        prevX.length > 0 &&
        nextX.length <= 5 &&
        maxIncomingVals > 0 &&
        maxIncomingVals <= nextX.length;
  
      const prevNames = new Set(
        this.asArray(prev.series)
          .map((item) => (item && item.name != null ? String(item.name) : ''))
          .filter(Boolean),
      );
      const hasNameOverlap = nextSeries.some(
        (item) => item && item.name != null && prevNames.has(String(item.name)),
      );
  
      if (!isIncremental || !hasNameOverlap) {
        return this.trimQtc({
          ...prev,
          ...next,
          topic: topic || next.topic || prev.topic,
          xAxis: nextX,
          series: nextSeries.map((item) =>
            item && typeof item === 'object' ? { ...item } : item,
          ),
        });
      }
  
      const mergedX = prevX.concat(nextX);
      const seriesMap = new Map();
  
      this.asArray(prev.series).forEach((item, i) => {
        seriesMap.set(item && item.name != null ? String(item.name) : `s_${i}`, { ...item });
      });
  
      nextSeries.forEach((item, i) => {
        const name = item && item.name != null ? String(item.name) : `s_${i}`;
        const prevItem = seriesMap.get(name);
        const addPts = this.pickQtcSeriesValues(item, topic);
        if (!prevItem) {
          const seeded = item && typeof item === 'object' ? { ...item } : { name };
          const pts = addPts.slice();
          seeded.data = pts;
          seeded.init_data = pts.slice();
          seriesMap.set(name, seeded);
          return;
        }
        const mergedPts = this.pickQtcSeriesValues(prevItem, topic).concat(addPts);
        const merged = { ...prevItem, ...item };
        merged.data = mergedPts;
        merged.init_data = mergedPts.slice();
        seriesMap.set(name, merged);
      });
  
      return this.trimQtc({
        ...prev,
        ...next,
        topic: topic || next.topic || prev.topic,
        xAxis: mergedX,
        series: Array.from(seriesMap.values()),
      });
    }
  
    applyInitData(data) {
      const payload = this.asObject(data);
      this.setState({
        effluentList: this.replaceEffluentGroups(payload.effluentList),
        alertOverviewList: this.replaceList(payload.alertOverviewList),
        monitoringList: this.trimMonitoring(payload.monitoringList),
        operationLogList: this.replaceList(payload.operationLogList),
        alarmList: this.replaceList(payload.alarmList),
        inspectionList: this.replaceList(payload.inspectionList),
        qtcList: this.trimQtc(payload.qtcList),
      });
    }
  
    applyWsData(data) {
      const payload = this.asObject(data);
      if (!Object.keys(payload).length) {
        return;
      }
  
      const s = this.state;
      const next = {};
  
      // 流出物：接口按厂房返回完整分组，直接整体覆盖。
      if (this.hasOwn(payload, 'effluentList')) {
        next.effluentList = this.replaceEffluentGroups(payload.effluentList);
      }
      // 整表覆盖（空数组表示当前无数据，如告警「正常」）
      if (this.hasOwn(payload, 'alertOverviewList')) {
        next.alertOverviewList = this.replaceList(payload.alertOverviewList);
      }
      if (this.hasOwn(payload, 'operationLogList')) {
        next.operationLogList = this.replaceList(payload.operationLogList);
      }
      if (this.hasOwn(payload, 'alarmList')) {
        next.alarmList = this.replaceList(payload.alarmList);
      }
      if (this.hasOwn(payload, 'inspectionList')) {
        next.inspectionList = this.replaceList(payload.inspectionList);
      }
  
      // 监测卡：直接使用接口返回的完整列表，不与旧数据合并。
      if (this.hasOwn(payload, 'monitoringList')) {
        next.monitoringList = this.trimMonitoring(payload.monitoringList);
      }
  
      // qtc：增量拼接 / 整窗替换
      if (this.hasOwn(payload, 'qtcList')) {
        next.qtcList = this.mergeQtc(s.qtcList, payload.qtcList);
      }
  
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
  