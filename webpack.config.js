const path = require('path');
module.exports = {
  mode: 'development',
  entry: [ 
    './src/TouchRegion.ts', 
    './src/TouchState.ts', 
    './src/TouchSurface.ts',
    './src/TouchGamepad.ts'
  ],
  output: {
    filename: 'touch-gamepad.js',
    path: path.resolve(__dirname, 'dist/umd'),
    library: 'touchGamepad',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: [
          /node_modules/
        ]
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  devtool: 'source-map'
};