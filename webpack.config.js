const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin}  = require('clean-webpack-plugin');
const dotenv = require("dotenv");

module.exports = env => {
    dotenv.config();
    const isProduction = process.env.NODE_ENV === "production";
    const host = process.env.HOST || "localhost";
    const protocol = process.env.PROTOCOL || "http";
    const port = process.env.PORT;
    return ({
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
        mode: isProduction ? "production" : "development",
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
            new webpack.DefinePlugin({
                HOST: JSON.stringify(host),
                PORT: JSON.stringify(port),
                PROTOCOL: JSON.stringify(protocol)
            })
        ]
    });
};