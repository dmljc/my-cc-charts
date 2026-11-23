# 管道流动 WS 字段

复用现有 WS 连接，字段名为 **`pipeFlowList`**，与 `roomLabelList` 等字段并列放在消息的 `data` 中。

```json
{
  "topic": "init_data",
  "data": {
    "pipeFlowList": [
      {"name": "guan1_Flow", "status": 1},
      {"name": "guan2_Flow", "status": 0},
      {"name": "guan3_Flow", "status": 1},
      {"name": "guan4_Flow2", "status": 0},
      {"name": "guan5_Flow", "status": 0},
      {"name": "guan6_Flow", "status": 0},
      {"name": "guan7_Flow", "status": 0},
      {"name": "guan8_Flow", "status": 0},
      {"name": "guan9_Flow", "status": 0}
    ]
  }
}
```

- `name`：管道流动模型名，大小写须与组件的“管道名称数组”一致；第四条是 **`guan4_Flow2`**。
- `status`：数字 **`1` 流动，`0` 停止**。前端也兼容 `"1"/"0"` 和布尔值。
- `init_data`：全量快照。携带空数组表示全部停止；省略该字段时保留已有管道状态。
- `ws_data`：增量更新，同名覆盖，未出现的管道保持原状态。停止某条管道须显式发送 `status:0`；空数组不改变状态。
- 重复名称以本批最后一条有效记录为准；无效项和组件未配置的名称忽略。

例如停止第一条、启动第二条：

```json
{"topic":"ws_data","data":{"pipeFlowList":[{"name":"guan1_Flow","status":0},{"name":"guan2_Flow","status":1}]}}
```

交付 schema 的 `PipeFlow.data` 已绑定 `this.state.pipeFlowList`，无需再写推送调用。组件不创建第二条 WS 连接，也不播放场景动画。调试面板保留“开始模拟 WS”“推送一次”“停止模拟”；默认不开模拟，手动模拟会在收到真实管道数据后自动停止。
