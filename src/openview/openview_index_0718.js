class LowcodeComponent extends Component {
    state = {
      page: 'home', // 'home', 'x12', 'x03'
      btnX12: 'bottom-btn btn-background-unclick', // x12 厂房按钮默认未选中
      // 流出物
      effluentData: [],
      // 告警状态列表
      alertListOverview: [],
      // 数据监测
      monitoringData: [],
      // 操作日志
      operationLog: [],
      // 设备警告
      alarmList: [],
      // 设备定检
      inspectionList: [],
      // qtcData
      qtcData: {}
    }
  
    componentDidMount() {
      console.log('componentDidMount===>');
      this.handleWss();
    }
  
    handleWss() {
      this.ws = new WebSocket('ws://192.168.1.4:8088/api/ws/realtime');
  
      // ✅ 连接成功回调
      this.ws.onopen = () => {
        console.log('✅ WebSocket 连接已建立');
        // 根据您的业务需求订阅主题
        // this.ws.send(JSON.stringify({
        //   action: 'subscribe',
        //   topic: 'device_data'
        // }));
      };
  
      // ✅ 接收消息回调（使用箭头函数）
      this.ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
  
          switch (msg.topic) {
            case 'init_data':
              this.setState({
                effluentData: msg.data.effluentData,
                alertListOverview: msg.data.alertListOverview,
                monitoringData: msg.data.monitoringData,
                operationLog: msg.data.operationLog,
                alarmList: msg.data.alarmList,
                inspectionList: msg.data.inspectionList,
                qtcData: msg.data.qtcData
              })
              break;
  
            case 'table':
              this.setState({
                tableData: msg.data
              });
              break;
  
            default:
              console.log('未知 topic:', msg.topic);
          }
        } catch (error) {
          console.error('❌ 解析消息失败:', error);
        }
      };
    }
  
  
    // 跳转到 X12 厂房
    goX12(e, params) {
      if (params.key === 'x12') {
        this.setState({
          btnX12: 'bottom-btn btn-background-click',
          page: 'x12',
        })
      }
  
    }
  
    // 跳转到大屏概览页 
    goHome() {
      this.setState({
        btnX12: 'bottom-btn btn-background-unclick',
        page: 'home',
      })
    }
    // 卸载钩子
    componentWillUnmount() {
      console.log('componentWillUnmount===>');
        if (this.ws) {
          this.ws.close();
        }
    }
  }