'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _cloneDeep = require('clone-deep');

var _cloneDeep2 = _interopRequireDefault(_cloneDeep);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// omitEmptyObject({
//   a: {
//     b: {
//       c: 1,
//       d: {
//         e: {
//         }
//       }
//     }
//   }
// });
//
// { a: { b: { c: 1 } } }
//
var unsetEmptyObject = function unsetEmptyObject(obj) {
    Object.keys(obj).forEach(function (key) {
        if (!(0, _isPlainObject2.default)(obj[key])) {
            return;
        }

        unsetEmptyObject(obj[key]);
        if ((0, _isPlainObject2.default)(obj[key]) && Object.keys(obj[key]).length === 0) {
            obj[key] = undefined;
            delete obj[key];
        }
    });

    return obj;
};

var omitEmptyObject = function omitEmptyObject(obj) {
    return unsetEmptyObject((0, _cloneDeep2.default)(obj));
};

exports.default = omitEmptyObject;