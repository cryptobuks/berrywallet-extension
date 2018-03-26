import Webpack from 'webpack';
import Path from 'path';
import CircularDependencyPlugin from 'circular-dependency-plugin';

const PATH = {
    ROOT: __dirname,
    SOURCE: Path.join(__dirname, './src'),
    TARGET: Path.join(__dirname, './dist')
};

const ENV = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production'
};

const isProd = NODE_ENV === ENV.PRODUCTION;

const NODE_ENV = process.env.NODE_ENV || ENV.DEVELOPMENT;

const Plugins = [
    new Webpack.NamedModulesPlugin(),
    new Webpack.optimize.ModuleConcatenationPlugin(),
    new CircularDependencyPlugin({
        // exclude detection of files based on a RegExp
        exclude: /a\.js|node_modules/,
        // add errors to webpack instead of warnings
        failOnError: true
    }),
    new Webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(NODE_ENV)
    }),
    new Webpack.EnvironmentPlugin({
        NODE_ENV: NODE_ENV
    })
];


if (isProd) {
    Plugins.push(
        new Webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false
        }),
        new Webpack.optimize.UglifyJsPlugin({
            compress: {
                conditionals: true,
                comparisons: true,
                sequences: true,
                dead_code: true,
                if_return: true,
                join_vars: true,
                screw_ie8: true,
                warnings: false,
                evaluate: true,
                unused: true,
            },
            output: {
                comments: false
            }
        })
    );
}

const Loaders = [
    {
        test: /\.json$/,
        loader: 'json-loader'
    }, {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader'
    }, {
        test: /\.tsx$/,
        loader: 'babel-loader'
    }, {
        test: /\.js(x)?$/,
        loader: 'babel-loader',
        exclude: /node_modules\/(?!(obs-store|etherscan-api))/,
        query: {
            presets: ['react', 'es2017', 'es2016', 'stage-0'],
            plugins: ['transform-decorators-legacy', 'transform-class-properties']
        }
    }
];


const WebpackConfig = {
    context: PATH.TARGET,
    node: {
        fs: 'empty' // avoids error messages
    },
    output: {
        filename: "js/[name].js"
    },
    resolve: {
        extensions: ["", ".ts", ".tsx", ".js", ".jsx", ".json"],
        modules: [
            PATH.SOURCE,
            Path.resolve(__dirname, 'node_modules'),
            Path.resolve(__dirname, 'node_modules')
        ],
        alias: {
            Core: Path.join(__dirname, 'src/Core'),
            Popup: Path.join(__dirname, 'src/Popup'),
            Background: Path.join(__dirname, 'src/Background')
        }
    },
    devtool: 'inline-source-map',
    plugins: Plugins,
    module: {
        loaders: Loaders
    },
    stats: {
        children: false
    }
};

export default WebpackConfig;