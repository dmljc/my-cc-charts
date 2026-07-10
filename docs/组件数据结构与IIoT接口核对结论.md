# 自定义组件数据结构与 IIoT API 核对结论

> 文档来源：工业物联平台(IIoT) 25.9.0.SPC002 API 参考（文档版本 01，2025-10-30）  
> 核对范围：截图中的自定义组件（`src/components`）  
> 生成日期：2026-07-10

---

## 一、总体结论

**组件侧的数据结构作为「展示模型」大体合理，但不能直接对接 PDF 中的 IIoT 接口响应，中间必须做一层适配转换（`api → viewModel`）。**

这份文档是华为工业物联平台通用 API，**没有**「告警概览 / 设备定检 / 操作日志 / 流出物」等业务专用接口。与组件相关的主要能力如下：

| 能力 | 接口 | 响应核心结构 |
|------|------|--------------|
| 实时值 | 物实例快照 / 批量快照 | `properties[propId] = { value, time }` |
| 趋势 | 属性历史 / 属性聚合 | `{ timestamps[], property_values: [{ property_path, values[] }] }` |
| 业务列表 | 表记录查询 | `{ columns[], values: [[...]] }` |

### 总评

| 维度 | 结论 |
|------|------|
| 作为低代码展示组件的 Props | **合理**（字段清晰，且普遍支持 `*Field` 可配置映射） |
| 作为 IIoT API 的直接消费结构 | **不合理 / 不能直连**，必须加适配层 |
| 告警 / 定检 / 操作日志 | 文档无对应 REST，只能走「自定义表 + 事件/分析任务」 |

**建议：** 对接时统一增加 `api → viewModel` 适配层（快照→卡片、历史→折线点、表记录→列表），组件继续消费当前展示结构即可。

---

## 二、相关 IIoT 接口形态摘要

### 2.1 查询物实例快照

- **URI：** `GET /v5/{project_id}/things/{thing_id}/snapshot`
- **响应核心：**

```json
{
  "properties": {
    "computer": { "value": "lenovo", "time": "2021-12-14T07:48:15.706Z" },
    "disk": { "value": "300G", "time": "2021-12-14T07:48:15.706Z" }
  },
  "components": { }
}
```

- **Property：** `{ value: Object, time: String }`

### 2.2 批量查询物实例快照

- **URI：** `POST /v5/{project_id}/snapshots/get`
- **响应核心：** `{ things: [{ thing_id, thing_name, properties, components }] }`
- **注意：** 文档示例中 `properties` 有时是裸值、有时是 `{ value, time }`，适配层需兼容两种形态。

### 2.3 查询 Thing 的属性历史值

- **URI：** `POST /v5/{project_id}/things/{thing_id}/time-series/query`
- **响应核心：**

```json
{
  "thing_id": "tobacco_shred_machine_01",
  "data": {
    "timestamps": [1701345268128, 1701345268127],
    "property_values": [
      { "property_path": "/rotation_speed", "values": [1, null, 3, 4] },
      { "property_path": "/engine/humidity", "values": [81.1, 82.2, null, 84.4] }
    ]
  },
  "page_info": { "next_marker": "..." }
}
```

- **特点：** 列式时序（时间戳列 + 多属性值列），不是组件常用的行式点数组。

### 2.4 查询 Thing 的属性聚合值

- **URI：** `POST /v5/{project_id}/things/{thing_id}/aggregate-series/query`
- **响应核心：** 与历史值类似，额外包含 `interval`、`function`（count/max/min/sum/avg）。

### 2.5 查询表记录

- **URI：** `POST /v5/{project_id}/tables/{table_id}/records/query`
- **响应核心：**

```json
{
  "count": 3,
  "columns": ["name", "severity"],
  "values": [["alarmdata1", "1"], ["alarmdata2", "2"]],
  "thing_names": ["thingName1", "thingName2"]
}
```

- **特点：** 行列矩阵，需先 `zip(columns, row)` 转成对象数组。

---

## 三、截图组件逐项核对

### 3.1 合理（展示层设计 OK，需适配）

| 组件 | 目录 | 当前结构 | 对接判断 |
|------|------|----------|----------|
| 数据监测-头部信息 | `data-monitoring-header` | `{ roomValue, deviceValue }` | UI 合理；快照是扁平 Map，需映射属性 ID |
| 数据监测-指标信息 | `data-monitoring-info` | `[{ value, unit, label }]` | 合理；`unit`/展示名在模型定义，不在快照 |
| 数据监测-趋势折线图 | `data-monitoring-line-chart` | `[{ label, value }]` | 合理；历史接口列式数据需转成点数组 |
| 数据监测卡片 | `data-monitoring-card` | `{ header, info, chart }` | UI 合理；需由快照+历史拼装 |
| 数据监测滚动面板 | `data-monitoring-panel` | `DataMonitoringCardData[]` | 同上，批量快照 + 多次历史查询后组装 |
| 详情弹框 | `detail-popup` | `{ label, value, time }` | 最接近 `Property{value,time}`，补属性显示名即可 |
| 流出物 | `effluent` | `{ label, value, trend }` | `value` 可来自快照；`trend` 接口无，需对比历史自行计算 |
| 可变Y轴步进折线图 | `variable-y-step-line-chart` | flat `{label,type,value,time}` 或 `xAxisData/yAxisData` | 合理；需先把历史接口转成 flat/系列结构 |
| 头部日期 | `header-date` | 无业务 data | 不依赖接口，无问题 |

### 3.2 部分合理（依赖业务表/事件，文档无专用接口）

| 组件 | 目录 | 当前结构 | 风险点 |
|------|------|----------|--------|
| 告警状态概览 | `alarm-status-overview` | `{ status, emergency, severe, general, runningText }` | 文档无告警汇总 API；数量需事件表/分析任务结果聚合，`status` 枚举需自行约定 |
| 设备警告 | `device-warning` | `{ name, level: urgent\|normal\|regular }` | 无告警查询 API；`level` 与平台事件等级未必一致 |
| 设备定检 | `device-check` | `{ name, status, days }` | 无定检 API；适合走「表记录」，`days/status` 多半要前端或中间层计算 |
| 操作日志 | `operation-log` | `{ action, name, time }` | 文档无操作日志 API；只能映射自定义表字段 |

---

## 四、各组件数据结构明细

### 4.1 告警状态概览（alarm-status-overview）

```typescript
export type AlarmStatusOverviewStatus = 'normal' | 'alarm';

export interface AlarmStatusOverviewData {
  id?: string | number;
  name?: string;
  status?: AlarmStatusOverviewStatus;
  runningText?: string;
  emergency?: number | string;
  severe?: number | string;
  general?: number | string;
}
```

**实际使用字段：** `name`、`status`、`runningText`、`emergency`、`severe`、`general`  
**核对结论：** 展示结构合理；无直接 API，需业务表/事件聚合后映射。

---

### 4.2 数据监测-头部信息（data-monitoring-header）

```typescript
export interface DataMonitoringHeaderData {
  [key: string]: unknown; // 默认 roomValue / deviceValue
}
```

**实际使用字段：** `roomValue`、`deviceValue`（可通过 `roomValueField` / `deviceValueField` 配置）  
**核对结论：** 合理；需从快照属性或实例信息映射。

---

### 4.3 数据监测-指标信息（data-monitoring-info）

```typescript
export interface DataMonitoringInfoItem {
  id?: string | number;
  value?: string | number;
  unit?: string;
  label?: string;
}
```

**核对结论：** 合理；`value` 来自快照，`unit`/`label` 来自模型或配置。

---

### 4.4 数据监测-趋势折线图（data-monitoring-line-chart）

```typescript
export interface DataMonitoringLineChartPoint {
  label?: string | number;
  value?: number;
}
```

**核对结论：** 合理；需将历史接口的 `timestamps + values` 转置为 `[{ label, value }]`。

---

### 4.5 数据监测卡片 / 面板（data-monitoring-card / data-monitoring-panel）

```typescript
export interface DataMonitoringCardData {
  id?: string | number;
  header?: DataMonitoringHeaderData;
  info?: DataMonitoringInfoItem[];
  chart?: DataMonitoringLineChartPoint[];
}
```

**核对结论：** 作为组合展示模型合理；不能直接对应单一接口，需多接口拼装。

---

### 4.6 详情弹框（detail-popup）

```typescript
export interface DetailPopupItem {
  id?: string | number;
  label?: string;
  value?: string | number;
  time?: string;
}
```

**核对结论：** 与快照 `Property{value,time}` 最接近，补 `label`（属性名）即可。

---

### 4.7 设备定检（device-check）

```typescript
export type DeviceCheckStatus = 'normal' | 'expiring' | 'overdue';

export interface DeviceCheckItem {
  id?: string | number;
  name?: string;
  status?: DeviceCheckStatus;
  days?: number;
}
```

**核对结论：** 展示合理；文档无定检接口，建议自定义表 + 中间层计算 `status/days`。

---

### 4.8 设备警告（device-warning）

```typescript
export type DeviceWarningLevel = 'urgent' | 'normal' | 'regular' | string;

export interface DeviceWarningItem {
  id?: string | number;
  name: string;
  level?: DeviceWarningLevel;
}
```

**核对结论：** 展示合理；无专用告警查询 API，`level` 枚举需与业务约定对齐。

---

### 4.9 流出物（effluent）

```typescript
export type EffluentTrend = 'up' | 'down' | 'flat' | string;

export interface EffluentItem {
  id?: string | number;
  label: string;
  value?: number | string;
  trend?: EffluentTrend;
}
```

**核对结论：** `value` 可对接快照；`trend` 需自行对比历史计算。

---

### 4.10 头部日期（header-date）

```typescript
export interface HeaderDateProps {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}
```

**核对结论：** 无外部业务 data，读取本地时间，不依赖 IIoT 接口。

---

### 4.11 操作日志（operation-log）

```typescript
export interface OperationLogItem {
  id?: string | number;
  action?: string;
  name?: string;
  time?: string;
}
```

**核对结论：** 展示合理；文档无操作日志 API，需映射自定义表字段（可用 `actionField` / `nameField` / `timeField`）。

---

### 4.12 可变Y轴步进折线图（variable-y-step-line-chart）

```typescript
export interface YAxisSeriesConfig {
  name: string;
  data: number[];
  color?: string;
}

// 支持两种模式：
// 1) 结构化：xAxisData + yAxisData
// 2) flat：[{ label, type, value, time }]
```

**核对结论：** 展示结构合理；需将历史/聚合接口列式数据转换为 flat 或系列结构。

---

## 五、主要结构错位（对接时必须处理）

### 5.1 实时数据形态不一致

| 来源 | 结构 |
|------|------|
| 接口 | `{ propId: { value, time } }` |
| 组件 | `{ roomValue, deviceValue }` / `{ label, value, unit }` |

→ `unit`、展示名在模型定义里，不在快照里。

### 5.2 时序是列式，组件是行式

| 来源 | 结构 |
|------|------|
| 接口 | `timestamps[]` + `property_values[].values[]` |
| 组件 | `[{ label, value }]` 或 `{ type, value }` |

→ 必须转置；`label` 需自行格式化时间。

### 5.3 表记录是行列矩阵

| 来源 | 结构 |
|------|------|
| 接口 | `columns + values[][]` |
| 组件 | 对象数组 |

→ 组件已有 `*Field` 映射，适合表数据，但要先 `zip(columns, row)`。

### 5.4 批量快照示例形态不统一

文档示例中 `properties` 有时是裸值、有时是 `{ value, time }`，适配层需兼容两种形态。

---

## 六、推荐对接策略

1. **保留现有组件 Props 作为 ViewModel**，不要为迁就 API 大改组件结构。
2. **统一增加适配层**，建议按数据源拆分：
   - `adaptSnapshotToCard`：快照 → 数据监测卡片
   - `adaptHistoryToPoints`：历史/聚合 → 折线点 / 多系列
   - `adaptTableRecordsToList`：表记录 → 告警/定检/日志/警告列表
3. **业务类组件（告警、定检、操作日志）** 先与后端约定：
   - 使用哪张表 / 哪个事件分类
   - 字段名与枚举值（如 `urgent/normal/regular`、`normal/expiring/overdue`）
4. **流出物 `trend`、告警汇总数量** 等派生字段，在适配层或后端计算后下发，不要期望接口原生返回。

---

## 七、组件与建议数据源对照表

| 组件 | 建议 IIoT 数据源 | 是否需适配 | 备注 |
|------|------------------|------------|------|
| 告警状态概览 | 表记录 / 事件分析结果 | 是 | 无专用 API |
| 数据监测-头部 | 快照 / 实例信息 | 是 | 属性 ID → room/device |
| 数据监测-指标 | 快照 + 模型 unit | 是 | |
| 数据监测-折线 | 属性历史 / 聚合 | 是 | 列式→行式 |
| 数据监测卡片/面板 | 批量快照 + 历史 | 是 | 多接口拼装 |
| 详情弹框 | 快照 | 轻量适配 | 最接近原生结构 |
| 设备定检 | 自定义表记录 | 是 | 无专用 API |
| 设备警告 | 自定义表 / 事件 | 是 | 无专用 API |
| 流出物 | 快照（+历史算 trend） | 是 | trend 需派生 |
| 头部日期 | 本地时间 | 否 | |
| 操作日志 | 自定义表记录 | 是 | 无专用 API |
| 可变Y轴步进折线 | 属性历史 / 聚合 | 是 | 支持多系列 |

---

## 八、附录：截图组件清单

对应低代码面板截图中的组件：

1. 告警状态概览
2. 数据监测-头部信息
3. 数据监测-指标信息
4. 数据监测-趋势折线图
5. 数据监测卡片 / 数据监测滚动面板
6. 详情弹框
7. 设备定检
8. 设备警告
9. 流出物
10. 头部日期
11. 操作日志
12. 可变Y轴步进折线图（对数轴折线图）

---

## 九、适配层实现

已在仓库中提供 TypeScript 适配草稿：

- 路径：`src/common/iiot-adapters.ts`
- 能力：
  - `adaptSnapshotToDetailPopup` / `adaptSnapshotToMonitoringInfo` / `adaptSnapshotToMonitoringHeader`
  - `adaptHistoryToLinePoints` / `adaptHistoryToVariableYFlat`
  - `adaptBatchSnapshotToCards` / `adaptSnapshotAndHistoryToCard`
  - `adaptTableRecordsToObjects` 及表记录 → 操作日志 / 设备警告 / 设备定检 / 告警概览
  - `adaptSnapshotToEffluent`（支持用 previousValue 计算 trend）

桌面副本（便于下载）：`~/Desktop/组件数据结构与IIoT接口核对结论.md`

---

*本文件由组件 Props 与 IIoT API 文档对照分析生成，供后续接口对接与适配层设计使用。*
