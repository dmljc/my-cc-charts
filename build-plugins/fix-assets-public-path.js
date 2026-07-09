/**
 * @file 修复组件库 UMD 产物（dist/）中静态资源无法在消费方项目中显示的问题。
 *
 * 背景：
 *   1. publicPath 双层 dist/ 问题：build-plugin-component 默认 output.publicPath = './dist/'，
 *      导致 CSS 里的大图路径变成 dist/assets/xxx.png，浏览器解析成 dist/dist/assets/xxx.png → 404。
 *
 *   2. 消费方二次打包问题（根本原因）：
 *      即使第一个问题解决，当消费方项目（如 openview）把 ccCharts.css 通过自己的 webpack
 *      再打包一次时，css-loader 会尝试把 CSS 里的 url(assets/xxx.png) 当作本地源文件重新解析。
 *      由于这个路径不是一个真实存在的本地文件，路径解析失败，图片无法显示。
 *
 * 方案：
 *   将 url-loader 的 limit 调大到 512KB（远超最大图片 bg-card_@2x.png 的 211KB），
 *   让所有图片都以 base64 内联到 CSS 中，完全消除对外部文件路径的依赖。
 *   同时保留 publicPath 修复，兜底处理其他可能的外部资源。
 *
 * 代价：CSS 体积增大约 340KB（png → base64 约 1.37 倍）。
 *   对于组件库 UMD 产物，这是确保跨项目、跨部署环境图片正常显示的最可靠方案。
 */
module.exports = ({ onGetWebpackConfig }) => {
  onGetWebpackConfig('component-dist', (config) => {
    config.output.publicPath('./');

    if (config.module.rules.has('img')) {
      config.module.rule('img').use('img').tap((options) => ({
        ...options,
        limit: 1024 * 512, // 512KB，内联所有图片为 base64
      }));
    }
  });
};
