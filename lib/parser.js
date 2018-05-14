'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint no-console: 0 */
/* eslint no-eval: 0 */


var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _cloneDeep = require('clone-deep');

var _cloneDeep2 = _interopRequireDefault(_cloneDeep);

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var _ensureArray = require('ensure-array');

var _ensureArray2 = _interopRequireDefault(_ensureArray);

var _esprima = require('esprima');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _parse = require('parse5');

var _parse2 = _interopRequireDefault(_parse);

var _sortobject = require('sortobject');

var _sortobject2 = _interopRequireDefault(_sortobject);

var _flattenObjectKeys = require('./flatten-object-keys');

var _flattenObjectKeys2 = _interopRequireDefault(_flattenObjectKeys);

var _omitEmptyObject = require('./omit-empty-object');

var _omitEmptyObject2 = _interopRequireDefault(_omitEmptyObject);

var _jsxParser = require('./jsx-parser');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaults = {
    debug: false, // verbose logging

    sort: false, // sort keys in alphabetical order

    attr: { // HTML attributes to parse
        list: ['data-i18n'],
        extensions: ['.html', '.htm']
    },

    func: { // function names to parse
        list: ['i18next.t', 'i18n.t'],
        extensions: ['.js', '.jsx']
    },

    trans: { // Trans component (https://github.com/i18next/react-i18next)
        component: 'Trans',
        i18nKey: 'i18nKey',
        extensions: ['.js', '.jsx'],
        fallbackKey: false
    },

    lngs: ['en'], // array of supported languages
    fallbackLng: 'en', // language to lookup key if not found while calling `parser.get(key, { lng: '' })`

    ns: [], // string or array of namespaces

    defaultLng: 'en', // default language used for checking default values

    defaultNs: 'translation', // default namespace used if not passed to translation function

    defaultValue: '', // default value used if not passed to `parser.set`

    // resource
    resource: {
        // The path where resources get loaded from. Relative to current working directory.
        loadPath: 'i18n/{{lng}}/{{ns}}.json',

        // The path to store resources. Relative to the path specified by `gulp.dest(path)`.
        savePath: 'i18n/{{lng}}/{{ns}}.json',

        // Specify the number of space characters to use as white space to insert into the output JSON string for readability purpose.
        jsonIndent: 2,

        // Normalize line endings to '\r\n', '\r', '\n', or 'auto' for the current operating system. Defaults to '\n'.
        // Aliases: 'CRLF', 'CR', 'LF', 'crlf', 'cr', 'lf'
        lineEnding: '\n'
    },

    keySeparator: '.', // char to separate keys
    nsSeparator: ':', // char to split namespace from key

    // Context Form
    context: true, // whether to add context form key
    contextFallback: true, // whether to add a fallback key as well as the context form key
    contextSeparator: '_', // char to split context from key

    // Plural Form
    plural: true, // whether to add plural form key
    pluralFallback: true, // whether to add a fallback key as well as the plural form key
    pluralSeparator: '_', // char to split plural from key

    // interpolation options
    interpolation: {
        prefix: '{{', // prefix for interpolation
        suffix: '}}' // suffix for interpolation
    }
};

// http://codereview.stackexchange.com/questions/45991/balanced-parentheses
var matchBalancedParentheses = function matchBalancedParentheses() {
    var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    var parentheses = '[]{}()';
    var stack = [];
    var bracePosition = void 0;
    var start = -1;
    var i = 0;

    str = '' + str; // ensure string
    for (i = 0; i < str.length; ++i) {
        if (start >= 0 && stack.length === 0) {
            return str.substring(start, i);
        }

        bracePosition = parentheses.indexOf(str[i]);
        if (bracePosition < 0) {
            continue;
        }
        if (bracePosition % 2 === 0) {
            if (start < 0) {
                start = i; // remember the start position
            }
            stack.push(bracePosition + 1); // push next expected brace position
            continue;
        }

        if (stack.pop() !== bracePosition) {
            return str.substring(start, i);
        }
    }

    return str.substring(start, i);
};

var transformOptions = function transformOptions(options) {
    // Attribute
    if (_lodash2.default.isUndefined(_lodash2.default.get(options, 'attr.list'))) {
        _lodash2.default.set(options, 'attr.list', defaults.attr.list);
    }
    if (_lodash2.default.isUndefined(_lodash2.default.get(options, 'attr.extensions'))) {
        _lodash2.default.set(options, 'attr.extensions', defaults.attr.extensions);
    }

    // Function
    if (_lodash2.default.isUndefined(_lodash2.default.get(options, 'func.list'))) {
        _lodash2.default.set(options, 'func.list', defaults.func.list);
    }
    if (_lodash2.default.isUndefined(_lodash2.default.get(options, 'func.extensions'))) {
        _lodash2.default.set(options, 'func.extensions', defaults.func.extensions);
    }

    // Trans
    if (_lodash2.default.isUndefined(_lodash2.default.get(options, 'trans.component'))) {
        _lodash2.default.set(options, 'trans.component', defaults.trans.component);
    }
    if (_lodash2.default.isUndefined(_lodash2.default.get(options, 'trans.i18nKey'))) {
        _lodash2.default.set(options, 'trans.i18nKey', defaults.trans.i18nKey);
    }
    if (_lodash2.default.isUndefined(_lodash2.default.get(options, 'trans.extensions'))) {
        _lodash2.default.set(options, 'trans.extensions', defaults.trans.extensions);
    }
    if (_lodash2.default.isUndefined(_lodash2.default.get(options, 'trans.fallbackKey'))) {
        _lodash2.default.set(options, 'trans.fallbackKey', defaults.trans.fallbackKey);
    }

    // Resource
    if (_lodash2.default.isUndefined(_lodash2.default.get(options, 'resource.loadPath'))) {
        _lodash2.default.set(options, 'resource.loadPath', defaults.resource.loadPath);
    }
    if (_lodash2.default.isUndefined(_lodash2.default.get(options, 'resource.savePath'))) {
        _lodash2.default.set(options, 'resource.savePath', defaults.resource.savePath);
    }
    if (_lodash2.default.isUndefined(_lodash2.default.get(options, 'resource.jsonIndent'))) {
        _lodash2.default.set(options, 'resource.jsonIndent', defaults.resource.jsonIndent);
    }
    if (_lodash2.default.isUndefined(_lodash2.default.get(options, 'resource.lineEnding'))) {
        _lodash2.default.set(options, 'resource.lineEnding', defaults.resource.lineEnding);
    }

    // Accept both nsseparator or nsSeparator
    if (!_lodash2.default.isUndefined(options.nsseparator)) {
        options.nsSeparator = options.nsseparator;
        delete options.nsseparator;
    }
    // Allowed only string or false
    if (!_lodash2.default.isString(options.nsSeparator)) {
        options.nsSeparator = false;
    }

    // Accept both keyseparator or keySeparator
    if (!_lodash2.default.isUndefined(options.keyseparator)) {
        options.keySeparator = options.keyseparator;
        delete options.keyseparator;
    }
    // Allowed only string or false
    if (!_lodash2.default.isString(options.keySeparator)) {
        options.keySeparator = false;
    }

    if (!_lodash2.default.isArray(options.ns)) {
        options.ns = [options.ns];
    }

    options.ns = _lodash2.default.union(_lodash2.default.flatten(options.ns.concat(options.defaultNs)));

    return options;
};

var getStringFromAttribute = function getStringFromAttribute(attr) {
    if (attr[0] === '"' || attr[0] === '\'') {
        return attr.slice(1, -1);
    }
    throw new Error('attribute value must be a string');
};

/**
* Creates a new parser
* @constructor
*/

var Parser = function () {

    // The resStore stores all translation keys including unused ones
    function Parser(options) {
        var _this = this;

        _classCallCheck(this, Parser);

        this.options = _extends({}, defaults);
        this.resStore = {};
        this.resScan = {};

        this.options = transformOptions(_extends({}, this.options, options));

        var lngs = this.options.lngs;
        var namespaces = this.options.ns;

        lngs.forEach(function (lng) {
            _this.resStore[lng] = _this.resStore[lng] || {};
            _this.resScan[lng] = _this.resScan[lng] || {};
            namespaces.forEach(function (ns) {
                var resPath = _this.formatResourceLoadPath(lng, ns);

                _this.resStore[lng][ns] = {};
                _this.resScan[lng][ns] = {};

                try {
                    if (_fs2.default.existsSync(resPath)) {
                        _this.resStore[lng][ns] = JSON.parse(_fs2.default.readFileSync(resPath, 'utf-8'));
                    }
                } catch (err) {
                    _this.log('i18next-scanner: Unable to load resource file ' + _chalk2.default.yellow(JSON.stringify(resPath)) + ': lng=' + lng + ', ns=' + ns);
                    _this.log(err);
                }
            });
        });

        this.log('i18next-scanner: options=' + JSON.stringify(this.options, null, 2));
    }

    // The resScan only stores translation keys parsed from code


    _createClass(Parser, [{
        key: 'log',
        value: function log() {
            var debug = this.options.debug;

            if (debug) {
                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                console.log.apply(this, args);
            }
        }
    }, {
        key: 'formatResourceLoadPath',
        value: function formatResourceLoadPath(lng, ns) {
            var options = this.options;

            var regex = {
                lng: new RegExp(_lodash2.default.escapeRegExp(options.interpolation.prefix + 'lng' + options.interpolation.suffix), 'g'),
                ns: new RegExp(_lodash2.default.escapeRegExp(options.interpolation.prefix + 'ns' + options.interpolation.suffix), 'g')
            };

            return options.resource.loadPath.replace(regex.lng, lng).replace(regex.ns, ns);
        }
    }, {
        key: 'formatResourceSavePath',
        value: function formatResourceSavePath(lng, ns) {
            var options = this.options;
            var regex = {
                lng: new RegExp(_lodash2.default.escapeRegExp(options.interpolation.prefix + 'lng' + options.interpolation.suffix), 'g'),
                ns: new RegExp(_lodash2.default.escapeRegExp(options.interpolation.prefix + 'ns' + options.interpolation.suffix), 'g')
            };

            return options.resource.savePath.replace(regex.lng, lng).replace(regex.ns, ns);
        }
        // i18next.t('ns:foo.bar') // matched
        // i18next.t("ns:foo.bar") // matched
        // i18next.t('ns:foo.bar') // matched
        // i18next.t("ns:foo.bar", { count: 1 }); // matched
        // i18next.t("ns:foo.bar" + str); // not matched

    }, {
        key: 'parseFuncFromString',
        value: function parseFuncFromString(content) {
            var _this2 = this;

            var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var customHandler = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

            if (_lodash2.default.isFunction(opts)) {
                customHandler = opts;
                opts = {};
            }

            var funcs = opts.list !== undefined ? (0, _ensureArray2.default)(opts.list) : (0, _ensureArray2.default)(this.options.func.list);

            if (funcs.length === 0) {
                return this;
            }

            var matchFuncs = funcs.map(function (func) {
                return '(?:' + func + ')';
            }).join('|').replace(/\./g, '\\.');
            // `\s` matches a single whitespace character, which includes spaces, tabs, form feeds, line feeds and other unicode spaces.
            var matchSpecialCharacters = '[\\r\\n\\s]*';
            var pattern = '(?:(?:^\\s*)|[^a-zA-Z0-9_])' + '(?:' + matchFuncs + ')' + '\\(' + '(' +
            // backtick (``)
            matchSpecialCharacters + '`(?:[^`\\\\]|\\\\(?:.|$))*`' + '|' +
            // double quotes ("")
            matchSpecialCharacters + '"(?:[^"\\\\]|\\\\(?:.|$))*"' + '|' +
            // single quote ('')
            matchSpecialCharacters + '\'(?:[^\'\\\\]|\\\\(?:.|$))*\'' + ')' + matchSpecialCharacters + '[\\,\\)]';
            var re = new RegExp(pattern, 'gim');

            var r = void 0;

            var _loop = function _loop() {
                var options = {};
                var full = r[0];

                var key = _lodash2.default.trim(r[1]); // Remove leading and trailing whitespace
                var firstChar = key[0];

                // Ignore key with embedded expressions in string literals
                if (firstChar === '`' && key.match(/\${.*?}/)) {
                    return 'continue';
                }

                if (_lodash2.default.includes(['\'', '"', '`'], firstChar)) {
                    // Remove first and last character
                    key = key.slice(1, -1);
                }

                // restore multiline strings
                key = key.replace(/(\\\n|\\\r\n)/g, '');

                // JavaScript character escape sequences
                // https://mathiasbynens.be/notes/javascript-escapes

                // Single character escape sequences
                // Note: IE < 9 treats '\v' as 'v' instead of a vertical tab ('\x0B'). If cross-browser compatibility is a concern, use \x0B instead of \v.
                // Another thing to note is that the \v and \0 escapes are not allowed in JSON strings.
                key = key.replace(/(\\b|\\f|\\n|\\r|\\t|\\v|\\0|\\\\|\\"|\\')/g, function (match) {
                    return eval('"' + match + '"');
                });

                // * Octal escapes have been deprecated in ES5.
                // * Hexadecimal escape sequences: \\x[a-fA-F0-9]{2}
                // * Unicode escape sequences: \\u[a-fA-F0-9]{4}
                key = key.replace(/(\\x[a-fA-F0-9]{2}|\\u[a-fA-F0-9]{4})/g, function (match) {
                    return eval('"' + match + '"');
                });

                var endsWithComma = full[full.length - 1] === ',';
                if (endsWithComma) {
                    var _opts = _extends({}, opts),
                        propsFilter = _opts.propsFilter;

                    var code = matchBalancedParentheses(content.substr(re.lastIndex));

                    if (typeof propsFilter === 'function') {
                        code = propsFilter(code);
                    }

                    try {
                        var syntax = (0, _esprima.parse)('(' + code + ')');
                        var props = _lodash2.default.get(syntax, 'body[0].expression.properties') || [];
                        // http://i18next.com/docs/options/
                        var supportedOptions = ['defaultValue', 'count', 'context', 'ns'];

                        props.forEach(function (prop) {
                            if (_lodash2.default.includes(supportedOptions, prop.key.name)) {
                                if (prop.value.type === 'Literal') {
                                    options[prop.key.name] = prop.value.value;
                                } else if (prop.value.type === 'TemplateLiteral') {
                                    options[prop.key.name] = prop.value.quasis.map(function (element) {
                                        return element.value.cooked;
                                    }).join('');
                                } else {
                                    // Unable to get value of the property
                                    options[prop.key.name] = '';
                                }
                            }
                        });
                    } catch (err) {
                        _this2.log('i18next-scanner: Unable to parse code "' + code + '"');
                        _this2.log(err);
                    }
                }

                if (customHandler) {
                    customHandler(key, options);
                    return 'continue';
                }

                _this2.set(key, options);
            };

            while (r = re.exec(content)) {
                var _ret = _loop();

                if (_ret === 'continue') continue;
            }

            return this;
        }
        // Parses translation keys from `Trans` components in JSX
        // <Trans i18nKey="some.key">Default text</Trans>

    }, {
        key: 'parseTransFromString',
        value: function parseTransFromString(content) {
            var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var customHandler = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

            if (_lodash2.default.isFunction(opts)) {
                customHandler = opts;
                opts = {};
            }

            var component = opts.component || this.options.trans.component;
            var i18nKey = opts.i18nKey || this.options.trans.i18nKey;

            var reTrans = new RegExp('<' + component + '[\\s]{1}([^]*?)>([^]*?)</\\s*' + component + '\\s*>', 'gim');
            var reAttribute = /\b(\S+)\s*=\s*({.*?}|".*?"|'.*?')/gm;
            var r = void 0;
            while (r = reTrans.exec(content)) {
                var attributes = {};
                var ar = void 0;
                while (ar = reAttribute.exec(r[1])) {
                    attributes[ar[1]] = ar[2];
                }
                var transKey = void 0;

                try {
                    transKey = attributes[i18nKey] ? getStringFromAttribute(attributes[i18nKey]) : '';
                } catch (e) {
                    this.log('i18next-scanner: i18nKey value must be a static string, saw ' + _chalk2.default.yellow(attributes[i18nKey]));
                    continue;
                }

                var _key2 = _lodash2.default.trim(transKey || '');
                var fragment = _lodash2.default.trim(r[2]).replace(/\s+/g, ' ');
                var _options = {
                    defaultValue: (0, _jsxParser.jsxToText)(fragment),
                    fallbackKey: opts.fallbackKey || this.options.trans.fallbackKey
                };
                if (attributes.count) {
                    _options.count = 1;
                }
                if (attributes.context) {
                    try {
                        _options.context = getStringFromAttribute(attributes.context);
                    } catch (e) {
                        this.log('i18next-scanner: Trans context attribute must be a string, saw ' + _chalk2.default.yellow(attributes.context));
                        continue;
                    }
                }

                if (customHandler) {
                    customHandler(_key2, _options);
                    continue;
                }

                this.set(_key2, _options);
            }

            return this;
        }
        // Parses translation keys from `data-i18n` attribute in HTML
        // <div data-i18n="[attr]ns:foo.bar;[attr]ns:foo.baz">
        // </div>

    }, {
        key: 'parseAttrFromString',
        value: function parseAttrFromString(content) {
            var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var customHandler = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

            var setter = this.set.bind(this);

            if (_lodash2.default.isFunction(opts)) {
                setter = opts;
                opts = {};
            } else if (_lodash2.default.isFunction(customHandler)) {
                setter = customHandler;
            }

            var attrs = opts.list !== undefined ? (0, _ensureArray2.default)(opts.list) : (0, _ensureArray2.default)(this.options.attr.list);

            if (attrs.length === 0) {
                return this;
            }

            var ast = _parse2.default.parse(content);

            var parseAttributeValue = function parseAttributeValue(key) {
                key = _lodash2.default.trim(key);
                if (key.length === 0) {
                    return;
                }
                if (key.indexOf('[') === 0) {
                    var parts = key.split(']');
                    key = parts[1];
                }
                if (key.indexOf(';') === key.length - 1) {
                    key = key.substr(0, key.length - 2);
                }

                setter(key);
            };

            var walk = function walk(nodes) {
                nodes.forEach(function (node) {
                    if (node.attrs) {
                        node.attrs.forEach(function (attr) {
                            if (attrs.indexOf(attr.name) !== -1) {
                                var values = attr.value.split(';');
                                values.forEach(parseAttributeValue);
                            }
                        });
                    }
                    if (node.childNodes) {
                        walk(node.childNodes);
                    }
                    if (node.content && node.content.childNodes) {
                        walk(node.content.childNodes);
                    }
                });
            };

            walk(ast.childNodes);

            return this;
        }
        // Get the value of a translation key or the whole resource store containing translation information
        // @param {string} [key] The translation key
        // @param {object} [opts] The opts object
        // @param {boolean} [opts.sort] True to sort object by key
        // @param {boolean} [opts.lng] The language to use
        // @return {object}

    }, {
        key: 'get',
        value: function get(key) {
            var _this3 = this;

            var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            if (_lodash2.default.isPlainObject(key)) {
                opts = key;
                key = undefined;
            }

            var resStore = {};
            if (this.options.removeUnusedKeys) {
                // Merge two objects `resStore` and `resScan` deeply, returning a new merged object with the elements from both `resStore` and `resScan`.
                var resMerged = (0, _deepmerge2.default)(this.resStore, this.resScan);

                Object.keys(this.resStore).forEach(function (lng) {
                    Object.keys(_this3.resStore[lng]).forEach(function (ns) {
                        var resStoreKeys = (0, _flattenObjectKeys2.default)(_lodash2.default.get(_this3.resStore, [lng, ns], {}));
                        var resScanKeys = (0, _flattenObjectKeys2.default)(_lodash2.default.get(_this3.resScan, [lng, ns], {}));
                        var unusedKeys = _lodash2.default.differenceWith(resStoreKeys, resScanKeys, _lodash2.default.isEqual);

                        for (var i = 0; i < unusedKeys.length; ++i) {
                            _lodash2.default.unset(resMerged[lng][ns], unusedKeys[i]);
                        }

                        // Omit empty object
                        resMerged[lng][ns] = (0, _omitEmptyObject2.default)(resMerged[lng][ns]);
                    });
                });

                resStore = resMerged;
            } else {
                resStore = (0, _cloneDeep2.default)(this.resStore);
            }

            if (opts.sort) {
                Object.keys(resStore).forEach(function (lng) {
                    var namespaces = resStore[lng];
                    Object.keys(namespaces).forEach(function (ns) {
                        // Deeply sort an object by its keys without mangling any arrays inside of it
                        resStore[lng][ns] = (0, _sortobject2.default)(namespaces[ns]);
                    });
                });
            }

            if (!_lodash2.default.isUndefined(key)) {
                var ns = this.options.defaultNs;

                // http://i18next.com/translate/keyBasedFallback/
                // Set nsSeparator and keySeparator to false if you prefer
                // having keys as the fallback for translation.
                // i18next.init({
                //   nsSeparator: false,
                //   keySeparator: false
                // })

                if (_lodash2.default.isString(this.options.nsSeparator) && key.indexOf(this.options.nsSeparator) > -1) {
                    var parts = key.split(this.options.nsSeparator);

                    ns = parts[0];
                    key = parts[1];
                }

                var keys = _lodash2.default.isString(this.options.keySeparator) ? key.split(this.options.keySeparator) : [key];
                var lng = opts.lng ? opts.lng : this.options.fallbackLng;
                var namespaces = resStore[lng] || {};

                var value = namespaces[ns];
                var x = 0;

                while (keys[x]) {
                    value = value && value[keys[x]];
                    x++;
                }

                return value;
            }

            return resStore;
        }
        // Set translation key with an optional defaultValue to i18n resource store
        // @param {string} key The translation key
        // @param {object} [options] The options object
        // @param {boolean|function} [options.fallbackKey] When the key is missing, pass `true` to return `options.defaultValue` as key, or pass a function to return user-defined key.
        // @param {string} [options.defaultValue] defaultValue to return if translation not found
        // @param {number} [options.count] count value used for plurals
        // @param {string} [options.context] used for contexts (eg. male)
        // @param {string} [options.ns] namespace for the translation
        // @param {string|boolean} [options.nsSeparator] The value used to override this.options.nsSeparator
        // @param {string|boolean} [options.keySeparator] The value used to override this.options.keySeparator

    }, {
        key: 'set',
        value: function set(key) {
            var _this4 = this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            // Backward compatibility
            if (_lodash2.default.isString(options)) {
                var _defaultValue = options;
                options = {
                    defaultValue: _defaultValue
                };
            }

            var nsSeparator = options.nsSeparator !== undefined ? options.nsSeparator : this.options.nsSeparator;
            var keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator;

            var ns = options.ns || this.options.defaultNs;

            console.assert(_lodash2.default.isString(ns) && !!ns.length, 'ns is not a valid string', ns);

            // http://i18next.com/translate/keyBasedFallback/
            // Set nsSeparator and keySeparator to false if you prefer
            // having keys as the fallback for translation.
            // i18next.init({
            //   nsSeparator: false,
            //   keySeparator: false
            // })

            if (_lodash2.default.isString(nsSeparator) && key.indexOf(nsSeparator) > -1) {
                var parts = key.split(nsSeparator);

                ns = parts[0];
                key = parts[1];
            }

            if (!key && options.fallbackKey === true) {
                key = options.defaultValue;
            }
            if (!key && typeof options.fallbackKey === 'function') {
                key = options.fallbackKey(ns, options.defaultValue);
            }
            if (!key) {
                // Ignore empty key
                return;
            }

            var _options2 = this.options,
                lngs = _options2.lngs,
                context = _options2.context,
                contextFallback = _options2.contextFallback,
                contextSeparator = _options2.contextSeparator,
                plural = _options2.plural,
                pluralFallback = _options2.pluralFallback,
                pluralSeparator = _options2.pluralSeparator,
                defaultLng = _options2.defaultLng,
                defaultValue = _options2.defaultValue;

            var keys = _lodash2.default.isString(keySeparator) ? key.split(keySeparator) : [key];

            lngs.forEach(function (lng) {
                var resLoad = _this4.resStore[lng] && _this4.resStore[lng][ns];
                var resScan = _this4.resScan[lng] && _this4.resScan[lng][ns];

                if (!_lodash2.default.isPlainObject(resLoad)) {
                    // Skip undefined namespace
                    _this4.log('i18next-scanner: The namespace ' + _chalk2.default.yellow(JSON.stringify(ns)) + ' does not exist:', { key: key, options: options });
                    return;
                }

                Object.keys(keys).forEach(function (index) {
                    var key = keys[index];

                    if (index < keys.length - 1) {
                        resLoad[key] = resLoad[key] || {};
                        resLoad = resLoad[key];
                        resScan[key] = resScan[key] || {};
                        resScan = resScan[key];
                        return; // continue
                    }

                    // Context & Plural
                    // http://i18next.com/translate/context/
                    // http://i18next.com/translate/pluralSimple/
                    //
                    // Format:
                    // "<key>[[{{contextSeparator}}<context>]{{pluralSeparator}}<plural>]"
                    //
                    // Example:
                    // {
                    //   "translation": {
                    //     "friend": "A friend",
                    //     "friend_male": "A boyfriend",
                    //     "friend_female": "A girlfriend",
                    //     "friend_male_plural": "{{count}} boyfriends",
                    //     "friend_female_plural": "{{count}} girlfriends"
                    //   }
                    // }
                    var resKeys = [];

                    // http://i18next.com/translate/context/
                    var containsContext = function () {
                        if (!context) {
                            return false;
                        }
                        if (_lodash2.default.isUndefined(options.context)) {
                            return false;
                        }
                        return _lodash2.default.isFunction(context) ? context(lng, ns, key, options) : !!context;
                    }();

                    // http://i18next.com/translate/pluralSimple/
                    var containsPlural = function () {
                        if (!plural) {
                            return false;
                        }
                        if (_lodash2.default.isUndefined(options.count)) {
                            return false;
                        }
                        return _lodash2.default.isFunction(plural) ? plural(lng, ns, key, options) : !!plural;
                    }();

                    if (!containsContext && !containsPlural) {
                        resKeys.push(key);
                    }

                    if (containsContext && contextFallback || containsPlural && pluralFallback) {
                        resKeys.push(key);
                    }

                    if (containsContext) {
                        resKeys.push('' + key + contextSeparator + options.context);
                    }

                    if (containsPlural) {
                        resKeys.push('' + key + pluralSeparator + 'plural');
                    }

                    if (containsContext && containsPlural) {
                        resKeys.push('' + key + contextSeparator + options.context + pluralSeparator + 'plural');
                    }

                    resKeys.forEach(function (resKey) {
                        if (resLoad[resKey] === undefined) {
                            if (options.defaultValue !== undefined) {
                                // Use `options.defaultValue` if specified
                                resLoad[resKey] = options.defaultValue;
                            } else {
                                // Fallback to `defaultValue`
                                resLoad[resKey] = _lodash2.default.isFunction(defaultValue) ? defaultValue(lng, ns, key, options) : defaultValue;
                            }
                            _this4.log('i18next-scanner: Added a new translation key { ' + _chalk2.default.yellow(JSON.stringify(resKey)) + ': ' + _chalk2.default.yellow(JSON.stringify(resLoad[resKey])) + ' } to ' + _chalk2.default.yellow(JSON.stringify(_this4.formatResourceLoadPath(lng, ns))));
                        } else if (options.defaultValue) {
                            if (!resLoad[resKey]) {
                                // Use `options.defaultValue` if specified
                                resLoad[resKey] = options.defaultValue;
                            } else if (resLoad[resKey] !== options.defaultValue && lng === defaultLng) {
                                // A default value has provided but it's different with the expected default
                                _this4.log('i18next-scanner: The translation key ' + _chalk2.default.yellow(JSON.stringify(resKey)) + ' has a different default value, you may need to check the translation key of default language (' + defaultLng + ')');
                            }
                        }

                        resScan[resKey] = resLoad[resKey];
                    });
                });
            });
        }
        // Returns a JSON string containing translation information
        // @param {object} [options] The options object
        // @param {boolean} [options.sort] True to sort object by key
        // @param {function|string[]|number[]} [options.replacer] The same as the JSON.stringify()
        // @param {string|number} [options.space] The same as the JSON.stringify() method
        // @return {string}

    }, {
        key: 'toJSON',
        value: function toJSON() {
            var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            var replacer = options.replacer,
                space = options.space,
                others = _objectWithoutProperties(options, ['replacer', 'space']);

            return JSON.stringify(this.get(others), replacer, space);
        }
    }]);

    return Parser;
}();

exports.default = Parser;