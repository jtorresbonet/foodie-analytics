const webpack = require('webpack')

module.exports = {
  mode: 'development',
  entry: './src/index.js',  // entry file to all our js modules
  devtool: "source-map",  // add source mapping
  output: {
    path: __dirname,
    filename: './dist/main.js',  // path to output files
  },
  target: 'web', // Important to set the target to 'web'
  module: {
    rules: [
      { 
        test: /\.css$/, 
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/inline",
    }
    ]
  }
}
