const path = require('path');
const { library } = require('./build.json');

const threeModule = path.resolve(__dirname, 'node_modules/three/build/three.module.js');

const inlineAssetsPlugin = ({ onGetWebpackConfig }) => {
  onGetWebpackConfig((config) => {
    config.resolve.alias.set('three$', threeModule);
    if (config.module.rules.has('img')) {
      config.module.rule('img').use('img').tap((options) => ({
        ...options,
        limit: 1024 * 512,
      }));
    }
  });
};

module.exports = {
  alias: {
    '@': './src',
  },
  plugins: [
    [
      'cc-plugin-lowcode',
      {
        library,
        engineScope: '@alilc',
        // PipeFlow 的导出名会生成 lowcode/pipe-flow，并覆盖 lowcode/my-pipe-flow 里的原 setter。
        noParse: true,
      },
    ],
    [
      '@alilc/build-plugin-alt',
      {
        type: 'component',
        inject: true,
        library,
        openUrl: 'http://localhost:5556?debug',
      },
    ],
    inlineAssetsPlugin,
  ],
};
