module.exports = (api) => {
  api.cache(true)

  return {
    presets: [['@babel/env', { targets: { node: '8' } }], '@babel/typescript'],
    plugins: [
      '@babel/proposal-class-properties',
      '@babel/proposal-optional-chaining',
      '@babel/proposal-nullish-coalescing-operator',
      '@babel/transform-react-jsx',
    ],
    sourceMaps: 'inline',
  }
}
