const path = require('path');

module.exports = {
    entry: './vis1.ts',
    module: {
        rules: [
            {
                test: /\.ts|\.jsx$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        filename: 'vis.js',
        path: path.resolve(__dirname, 'dist')
    }
};