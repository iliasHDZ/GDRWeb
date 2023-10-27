const path = require('path');

module.exports = {
    entry: './build/src/main.js',
    output: {
        library: {
            name: "GDR",
            type: "var"
        },
        filename: 'gdrweb.min.js',
        path: path.resolve(__dirname, 'dist'),
    },
};
