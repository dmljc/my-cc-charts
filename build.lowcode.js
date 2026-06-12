const { library } = require('./build.json');

module.exports = {
  alias: {
    '@': './src',
  },
  plugins: [
    [
      'cc-plugin-lowcode',
      {
        library,
        engineScope: "@alilc"
      },
    ],
  ],
};
