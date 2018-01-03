const path = require('path');

module.exports = {
    entry: './vis1.ts',
    module: {
        rules: [
            {
                test: /\.ts|\.jsx$/,
                use: 'ts-loader'
            }
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    devtool: "source-map",
    output: {
        filename: 'output.js',
        path: path.resolve(__dirname, 'dist')
    }
};