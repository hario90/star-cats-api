const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin}  = require('clean-webpack-plugin');

module.exports = env => ({
    entry: './ui/index.ts',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            { 
                test: /\.(jpe?g|gif|png|svg|woff|ttf|wav|mp3)$/, 
                use: "file-loader" 
            }
        ]
    },
    mode: env === "development" ? "development" : "production",
    resolve: {
        extensions: [ ".ts", ".js" ]
    },
    output: {
        filename: 'ui.js',
        path: path.resolve(__dirname, 'dist')
    },
    devServer: {
        contentBase: path.resolve(__dirname, '.'),
        hot: true
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            title: "Star Cats",
            template: "index.html",
        }),
    ]
});