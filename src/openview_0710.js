class LowcodeComponent extends Component {
    state = {
      "text": "outer",
      "isShowDialog": false,
      "fontLineGradient": [
        '#ffffff', '#b7def9', '#059aff', '#0073ff'
      ],
      locationPage: 'ZJ',
  
      btnClass1: 'bottom-btn btn-background-unclick',
      btnClass2: 'bottom-btn btn-background-unclick',
      btnClass3: 'bottom-btn btn-background-unclick',
      sceneIndex: 0,
      chartList: [],
      baseUrl: 'https://116.205.118.129/v5',
    }
    componentDidMount() {
      console.log('did mount');
      // this.getLocationParsm();
      this.fetchChartList();
    }
  
    //  fetch 逻辑抽离
    request(url) {
      return fetch(`${this.state.baseUrl}${url}`, {
        headers: {
          // 'X-Auth-Token': TOKEN,
          'Content-Type': 'application/json',
        },
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json();
      });
    }
  
  
    fetchChartList() {
      // 使用时
      request('/080dd91e.../things/thermometer_test/snapshot')
        .then(data => {
          this.setState({ chartList: data?.data || [] });
        })
        .catch(err => {
          this.setState({ chartList: [] });
        });
  
    }
    componentWillUnmount() {
      console.log('will unmount');
    }
  
    onClickAA() {
      console.log('111111111')
    }
  
    onClick() {
      this.setState({
        isShowDialog: true
      })
      console.log('点击啦')
    }
    closeDialog() {
      this.setState({
        isShowDialog: false
      })
    }
  
    runslow() {
      this.$('devanimation-e49d1094').runAnimation()
    }
    runFast() {
      this.$('devanimation-d59aa716').runAnimation()
    }
    stop() {
      this.$('devanimation-e499e435').runAnimation()
    }
  
  
    btnClick(e, params) {
  
      console.error('-----e----params--', e, params, this.state.sceneIndex)
  
      if (params.key === 0) {
        this.setState({
          btnClass1: 'bottom-btn btn-background-click',
          btnClass3: 'bottom-btn btn-background-unclick',
          btnClass2: 'bottom-btn btn-background-unclick',
          sceneIndex: 0,
          isShowDialog: false
        })
      } else if (params.key === 1) {
        this.setState({
          btnClass2: 'bottom-btn btn-background-click',
          btnClass1: 'bottom-btn btn-background-unclick',
          btnClass3: 'bottom-btn btn-background-unclick',
          sceneIndex: 1,
          isShowDialog: false
        })
      } else if (params.key === 2) {
        this.setState({
          btnClass3: 'bottom-btn btn-background-click',
          btnClass1: 'bottom-btn btn-background-unclick',
          btnClass2: 'bottom-btn btn-background-unclick',
          sceneIndex: 2
        })
        // setTimeout(() => {
        //   this.$('devanimation-e49d1094').runAnimation()
        // }, 1200)
      } else {
  
      }
  
      // 通信
    }
  
  // 跳转到大屏概览页 
    goHome() {
      this.setState({
        btnClass3: 'bottom-btn btn-background-unclick',
        btnClass1: 'bottom-btn btn-background-unclick',
        btnClass2: 'bottom-btn btn-background-unclick',
        sceneIndex: 0
      })
    }
  
    // ue通信文件
    onloadUeJs() {
      const sc = document.createElement('script');
      sc.src = '/simu/static/ue.js';
      document.head.append(sc)
    }
  
    // backRoute() {
    //   window.ue4 && window.ue4('changeModel', { value: 'showModel' });
    //   window.history.back();
    // }
  
    // // 获取URL参数
    // getLocationParsm(key) {
    //   const params = new URLSearchParams(window.location.search);
    //   const locationKey = params.get('location');
    //   this.setState({
    //     locationPage: locationKey
    //   })
    // }
  }