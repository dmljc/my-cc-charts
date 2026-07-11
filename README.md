# my-cc-charts

面向 PC 的 React 业务图表 / 监控组件库，基于 Fusion Design（`@alifd/next`），内置 BizCharts、ECharts，并支持低代码物料接入。

## 特性

- React 16 组件库，提供 CommonJS（`lib/`）与 ES Module（`es/`）双构建产物
- 图表能力：BizCharts、ECharts
- UI 基础：Fusion Design（`@alifd/next`）
- 低代码：支持 prototype / prototypeView 物料导出
- 文档站点：基于 dumi

## 环境要求

| 依赖 | 版本 |
| --- | --- |
| React | `^16.x` |
| React DOM | `^16.x` |
| moment | `latest` |

## 开发

```bash
# 安装依赖
npm install

# 低代码开发环境（默认调试入口）
npm run dev

# 组件文档站（dumi）
npm start
# 或
npm run dumi
```

## 构建

```bash
# 组件库构建（lib / es / types 等）
npm run build

# 低代码物料构建
npm run lowcode:build

# 文档站构建
npm run dumi:build
```

发布前会自动执行：

```bash
npm run prepublishOnly
# 等价于：build + lowcode:build + dumi:build
```

## 目录说明

| 产物 | 说明 |
| --- | --- |
| `lib/` | CommonJS 构建 |
| `es/` | ES Module 构建 |
| `types/` | TypeScript 类型声明 |
| `lowcode_lib/` / `lowcode_es/` | 低代码物料构建产物 |
| `build/` / `dist/` | 构建产物与预览资源 |
| `docs/` | dumi 文档源码 |