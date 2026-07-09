const { library } = require('./build.json');

const inlineAssetsPlugin = ({ onGetWebpackConfig }) => {
  onGetWebpackConfig((config) => {
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
