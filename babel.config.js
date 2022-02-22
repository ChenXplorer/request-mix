const presets = ['@babel/preset-env'];
const plugins = [
  '@vue/babel-plugin-jsx',
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-proposal-nullish-coalescing-operator',
];

const babelConfig = {
  presets,
  plugins,
};

if (process.env.NODE_ENV === 'test') {
  babelConfig.plugins.push('@babel/plugin-transform-runtime');
  babelConfig.targets = { node: 'current' };
} else {
  babelConfig.plugins.push([
    '@babel/plugin-transform-runtime',
    {
      corejs: 3,
    },
  ]);
}

module.exports = babelConfig;
