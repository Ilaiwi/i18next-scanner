'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _eol = require('eol');

var _eol2 = _interopRequireDefault(_eol);

var _get = require('lodash/get');

var _get2 = _interopRequireDefault(_get);

var _includes = require('lodash/includes');

var _includes2 = _interopRequireDefault(_includes);

var _vinyl = require('vinyl');

var _vinyl2 = _interopRequireDefault(_vinyl);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _parser = require('./parser');

var _parser2 = _interopRequireDefault(_parser);

var _jsxParser = require('./jsx-parser');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var transform = function transform(parser, customTransform) {
    return function _transform(file, enc, done) {
        var options = parser.options;

        var content = _fs2.default.readFileSync(file.path, enc);
        var extname = _path2.default.extname(file.path);

        if ((0, _includes2.default)((0, _get2.default)(options, 'attr.extensions'), extname)) {
            // Parse attribute (e.g. data-i18n="key")
            parser.parseAttrFromString(content);
        }

        if ((0, _includes2.default)((0, _get2.default)(options, 'func.extensions'), extname)) {
            // Parse translation function (e.g. i18next.t('key'))
            parser.parseFuncFromString(content);
        }

        if ((0, _includes2.default)((0, _get2.default)(options, 'trans.extensions'), extname)) {
            // Look for Trans components in JSX
            parser.parseTransFromString(content);
        }

        if (typeof customTransform === 'function') {
            this.parser = parser;
            customTransform.call(this, file, enc, done);
            return;
        }

        done();
    };
}; /* eslint-disable no-buffer-constructor */


var flush = function flush(parser, customFlush) {
    return function _flush(done) {
        var _this = this;

        var options = parser.options;


        if (typeof customFlush === 'function') {
            this.parser = parser;
            customFlush.call(this, done);
            return;
        }

        // Flush to resource store
        var resStore = parser.get({ sort: options.sort });
        var jsonIndent = options.resource.jsonIndent;

        var lineEnding = String(options.resource.lineEnding).toLowerCase();

        Object.keys(resStore).forEach(function (lng) {
            var namespaces = resStore[lng];

            Object.keys(namespaces).forEach(function (ns) {
                var obj = namespaces[ns];
                var resPath = parser.formatResourceSavePath(lng, ns);
                var text = JSON.stringify(obj, null, jsonIndent) + '\n';

                if (lineEnding === 'auto') {
                    text = _eol2.default.auto(text);
                } else if (lineEnding === '\r\n' || lineEnding === 'crlf') {
                    text = _eol2.default.crlf(text);
                } else if (lineEnding === '\n' || lineEnding === 'lf') {
                    text = _eol2.default.lf(text);
                } else if (lineEnding === '\r' || lineEnding === 'cr') {
                    text = _eol2.default.cr(text);
                } else {
                    // Defaults to LF
                    text = _eol2.default.lf(text);
                }

                var contents = null;

                try {
                    // "Buffer.from(string[, encoding])" is added in Node.js v5.10.0
                    contents = Buffer.from(text);
                } catch (e) {
                    // Fallback to "new Buffer(string[, encoding])" which is deprecated since Node.js v6.0.0
                    contents = new Buffer(text);
                }

                _this.push(new _vinyl2.default({
                    path: resPath,
                    contents: contents
                }));
            });
        });

        done();
    };
};

// @param {object} options The options object.
// @param {function} [customTransform]
// @param {function} [customFlush]
// @return {object} Returns a through2.obj().
var createStream = function createStream(options, customTransform, customFlush) {
    var parser = new _parser2.default(options);
    var stream = _through2.default.obj(transform(parser, customTransform), flush(parser, customFlush));

    return stream;
};

// Convenience API
module.exports = function () {
    var _module$exports;

    return (_module$exports = module.exports).createStream.apply(_module$exports, arguments);
};

// Basic API
module.exports.createStream = createStream;

// Parser
module.exports.Parser = _parser2.default;

// jsxToText
module.exports.jsxToText = _jsxParser.jsxToText;