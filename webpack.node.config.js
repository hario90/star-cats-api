const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = env => ({
    entry: './server/bin/.ts',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
        ]
    },
    target: "node",
    resolve: {
        extensions: [ ".ts", ".js" ]
    },
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'server', 'public', 'javascripts')
    },
    mode: env === "development" ? "development" : "production",
    externalsPresets: { node: true }, // in order to ignore built-in modules like path, fs, etc.
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    ...(env === "development" ? {
        devtool: "inline-source-map"
    } : {}),
    // devServer: {
    //     contentBase: path.resolve(__dirname, '.'),
    //     hot: true
    // },
    plugins: [
        new CleanWebpackPlugin(),
        // new HtmlWebpackPlugin({
        //     title: "Star Cats",
        //     template: "index.html",
        // }),
    ]
});
