# OpenView 一体式设备标注交付包

本次重新设计 15 个设备标注：104×48 深色圆角底板，左侧小型白色电气机柜，右侧 22px 半粗文案。状态色统一用于图标徽标、边框和底部箭头，外围透明。预览见 verification/device-color-preview.png。

## 使用

- 更新 final.schema.json；index.js 已同步内嵌。现场已有热点 UUID、动画或布局时，保留这些配置再合并。
- 图片与颜色均已绑定：roomLabelImage 是着色蒙版，roomLabelForegroundImage 是深色底板与白色小图标。均为内嵌 PNG，无外网图片请求。
- roomLabelList 的 name/color、默认绿色、各楼层显隐和同步热点开关继续生效。文字可以独立配置；图片不会烘焙房间号。
- 两张图片和对应变量详见 图片颜色配置说明.md、图片与颜色绑定.json。
- 原 7 个标注、管道 pipeFlowList 与 mock、动画及 WS 处理均保留。物料、ietm-editor 和其他业务组件与前包逐文件相同，本次只需更新页面配置。

## 验证

19 项真实低代码渲染器/页面 WS 检查通过，覆盖字号、文字位置、变色和自定义绑定。已检查预览，并核对合成后的像素：绿色/红色/黄色均能显示在左侧徽标，前景不会盖住状态色。内网 GPU 实景尚未复测。

图形为项目内自绘 SVG；原始文件位于 label-images/label-mask.svg、label-images/label-foreground.svg 和 label-images/device-icon.svg。
