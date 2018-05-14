'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.parseJSX = parseJSX;
exports.astToText = astToText;
exports.jsxToText = jsxToText;

var _htmlparser = require('htmlparser2');

var _htmlparser2 = _interopRequireDefault(_htmlparser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var jsExpr = /(.*?)({+[^]+?}+)(.*)/;

function parseJSX(fragment) {
    var ast = {
        nodeName: '#root',
        childNodes: []
    };
    var stack = [ast];

    var handler = {
        onopentag: function onopentag(name) {
            var node = {
                nodeName: name,
                childNodes: []
            };
            stack[0].childNodes.push(node);
            stack.unshift(node);
        },

        onclosetag: function onclosetag() {
            stack.shift();
        },

        ontext: function ontext(text) {
            var txt = text;
            var m = jsExpr.exec(txt);

            var addText = function addText(txt) {
                var lastNode = stack[0].childNodes.slice(-1)[0];
                if (lastNode && lastNode.nodeName === '#text') {
                    lastNode.value += txt;
                } else {
                    stack[0].childNodes.push({
                        nodeName: '#text',
                        value: txt,
                        childNodes: []
                    });
                }
            };

            if (m) {
                while (m = jsExpr.exec(txt)) {
                    if (m[1]) {
                        addText(m[1]);
                    }
                    stack[0].childNodes.push({
                        nodeName: '#expression',
                        value: m[2],
                        childNodes: []
                    });
                    txt = m[3];
                }
            }
            if (txt) {
                addText(txt);
            }
        }
    };

    var parser = new _htmlparser2.default.Parser(handler, {
        xmlMode: true,
        decodeEntities: true
    });
    parser.write(fragment);

    return stack[0].childNodes;
}

function astToText(ast) {
    var output = '';

    function walk(nodes) {
        nodes.forEach(function (node, ix) {
            if (node.nodeName === '#text') {
                output += node.value;
            } else if (node.nodeName === '#expression') {
                output += '<' + ix + '>' + node.value + '</' + ix + '>';
            } else {
                output += '<' + ix + '>';
                walk(node.childNodes);
                output += '</' + ix + '>';
            }
        });
    }

    walk(ast);
    return output;
}

function jsxToText(fragment) {
    var ast = parseJSX(fragment);
    return astToText(ast);
}