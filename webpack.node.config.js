const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const dotenv = require("dotenv");

dotenv.config();

module.exports = _ => ({
    entry: './server/bin/www.ts',
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
        extensions: [ ".ts"]
    },
    output: {
        filename: 'server.js',
        path: path.resolve(__dirname, 'dist')
    },
    mode: process.env.NODE_ENV === "development" ? "development" : "production",
    externalsPresets: { node: true }, // in order to ignore built-in modules like path, fs, etc.
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    ...(process.env.NODE_ENV === "development" ? {
        devtool: "inline-source-map"
    } : {}),
});