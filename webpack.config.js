module.exports = {
    entry: "./app/js/app.js",
    output: {
        path: __dirname + "/build/app/js",
        filename: "app.js",
        libraryTarget: 'var',
        library: 'splitter'
    },
    module: {
        rules: []
    },
    watch: true
};