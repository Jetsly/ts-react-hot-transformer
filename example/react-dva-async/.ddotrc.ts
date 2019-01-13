export default {
  plugins: [
    [
      'webpack',
      {
        alias: {
          'react-dom':'@hot-loader/react-dom',
        },
        transformers: {
          before: [require('../../')],
        },
        chainWebpack(config) {
          config
            .entry('index')
            .add('./src/index')
            .end();
        },
      },
    ],
  ],
};
