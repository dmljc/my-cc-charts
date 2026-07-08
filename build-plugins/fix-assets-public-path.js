/**
 * @file 修复组件库 UMD 产物（dist/）中静态资源路径错误的问题。
 *
 * 背景：build-plugin-component 生成 UMD 产物时，
 *   output.path 已经是 `<root>/dist`，但 output.publicPath 又被设置成 `./dist/`，
 *   导致 css-loader/url-loader 在 ccCharts.css 里生成的图片地址变成 `dist/assets/xxx.png`。
 *   而 ccCharts.css 自身就放在 `dist/` 目录下，浏览器会按照 css 文件所在目录去解析相对路径，
 *   最终请求地址变成 `dist/dist/assets/xxx.png`，多了一层 `dist`，请求 404。
 *
 * 现象：小于 8KB 的图片会被 url-loader 直接转成 base64 内联，不受路径影响，能正常显示；
 *   大于等于 8KB 的图片才会走独立文件 + publicPath 拼接的逻辑，从而暴露这个路径 bug。
 *
 * 方案：把 publicPath 改成与产物同级的相对路径 `./`，
 *   这样生成的引用永远是 `assets/xxx.png`，只要 dist 整体目录结构不被拆散，
 *   不管最终部署在什么域名、什么子路径下都能正确解析，一次修复，长期有效，
 *   与图片大小无关，无需再对单张图片做压缩或转 base64 处理。
 */
module.exports = ({ onGetWebpackConfig }) => {
  onGetWebpackConfig('component-dist', (config) => {
    config.output.publicPath('./');
  });
};
