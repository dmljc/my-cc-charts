# 树模型保存重开后预览丢失：修复说明

已在两仓库的 openview-personal-my 分支修复。Three.js 版本保持不变，物料运行时仍为 r159。

## 修改内容

- 两端按几何文件名末尾的“数组类型、itemSize、normalized”读取属性，保留 color_1 等含下划线的属性名。原有保存格式、常见几何和交错属性存档继续兼容。
- 编码 worker 重建 BufferAttribute 原型，正确读取整数归一化颜色，并拒绝无效属性、顶点数和索引。
- 材质分组保留原数组类型及 normalized；修正非索引三角形导出的面数。
- Worker 错误向上传递。任一分段失败时整份几何回退为无损文件，避免生成缺段或夹杂 undefined 的压缩文件。
- 压缩缓存加入 geometry-v2 版本标记，自动绕过旧结果；导出时固定本次压缩档位，避免异步期间切换设置导致缓存和实际算法不一致。
- 新压缩文件标记顶点色空间，运行端正确转换；未标记的旧压缩文件保留原解码行为。

## 部署和恢复

需要同步更新以下两处：

1. 三维编辑器：D:/code/ietm-editor/dist 整个目录。
2. 物料组件：D:/code/configuration-materials-ov/build/lowcode 内的 view.js、meta.js、view.css 和 assets，复制到实际静态组件目录。

更新后重新打开项目，重新生成预览并重新发布。旧的坏预览包或发布包需要重新生成，单独替换 view.js 不能补回已经丢失的 Draco 属性。

不要清空整个 IndexedDB；新代码会自动避开旧版压缩缓存。

- 原始几何存档仍含有效主颜色和 color_1：重新打开即可正确恢复，无须重新导入模型。
- 旧代码读坏颜色后又保存覆盖：新代码使用白色顶点色保留模型和贴图，并提示恢复办法；原始顶点色需要从未损坏的备份恢复或重新导入原 GLB。

## 验证

- 四个原始 GLB × 首次导入/保存重开 × 不压缩/低/中/高，共 32 组实际链路验证全部通过。使用真实编码 worker 和 r159 运行时解码器，检查属性、拓扑、材质分组、颜色范围，图片加载使用测试占位纹理。
- 编辑器 10 项回归测试通过：node --test test/geometry-preview.test.cjs
- 物料库新增 5 项测试和现有 49 项迁移测试通过：node --test test/geometry-archive.test.cjs test/migration.test.cjs
- 两端生产构建成功。编辑器全量 vue-tsc 仍有原有 18 项错误，与替换本次修改前文件的只读基线结果完全相同，本次没有新增。
- 未接入内网页面进行界面验收，未修改原始 GLB。

当前环境使用 Node 24，npm 不在 PATH 中，等效构建命令：

    # ietm-editor
    node node_modules/vite/bin/vite.js build

    # configuration-materials-ov（PowerShell，环境变量仅对当前构建进程生效）
    $env:NODE_OPTIONS='--openssl-legacy-provider --no-experimental-strip-types'
    node node_modules/@alib/build-scripts/bin/build-scripts.js build --config ./build.lowcode.js

## 本次源文件

ietm-editor：

- src/webgl/assets/utils.ts
- src/webgl/assets/DracoMesh.ts
- src/webgl/assets/release/GeometryRes.ts
- src/webgl/assets/release/CompressCache.ts
- src/webgl/utils/WorkerPool.ts
- src/webgl/utils/DRACOExporter.js
- src/webgl/utils/DRACOLoader.d.ts
- test/geometry-preview.test.cjs

configuration-materials-ov：

- src/utils/render/src/utils/utils.ts
- src/utils/render/src/utils/DRACOLoader.d.ts
- src/utils/render/src/assets/GeometryRes.ts
- test/geometry-archive.test.cjs
- docs/tree-preview-fix.md
