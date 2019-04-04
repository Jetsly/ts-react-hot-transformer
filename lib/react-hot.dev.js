"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
// https://github.com/gaearon/react-hot-loader/blob/master/src/babel.dev.js
var PREFIX = '__reactstandin__';
var REGENERATE_METHOD = PREFIX + "regenerateByEval";
var placeholderPattern = /([A-Z0-9]+)([A-Z0-9_]+)/g;
var shouldIgnoreFile = function (file) {
    return !!file
        .split('\\')
        .join('/')
        .match(/node_modules\/(react|react-hot-loader)([\/]|$)/);
};
var template = function (tpl) { return function (data) {
    return tpl.replace(placeholderPattern, function (pattern) {
        return Array.isArray(data[pattern]) ? data[pattern].join('\n') : data[pattern];
    });
}; };
var emptyStatement = ts.createStatement(ts.createIdentifier('\n\n'));
var buildRegistration = template('reactHotLoader.register(ID, NAME, FILENAME);');
var headerTemplate = template("(function () {\n     var enterModule = require('react-hot-loader').enterModule;\n     enterModule && enterModule(module);\n   }())");
var evalTemplate = template('this[key] = eval(code)');
var buildTagger = template("(function () {\nvar reactHotLoader = require('react-hot-loader').default;\nvar leaveModule = require('react-hot-loader').leaveModule;\n\nif (!reactHotLoader) {\n  return;\n}\n\nREGISTRATIONS\n\nleaveModule(module);\n}())");
function shouldRegisterBinding(node) {
    switch (node.kind) {
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.VariableStatement:
            return true;
        default:
            return false;
    }
}
function filterVariableDeclaration(declaration) {
    if (declaration.modifiers &&
        declaration.modifiers.filter(function (_a) {
            var kind = _a.kind;
            return kind === ts.SyntaxKind.DeclareKeyword;
        }).length > 0) {
        return false;
    }
    if (declaration.initializer &&
        ts.isCallExpression(declaration.initializer) &&
        declaration.initializer.expression.getText() === 'require') {
        return false;
    }
    return true;
}
function isExportDefaultDeclaration(node) {
    return (node.modifiers &&
        node.modifiers.filter(function (_a) {
            var kind = _a.kind;
            return [ts.SyntaxKind.ExportKeyword, ts.SyntaxKind.DefaultKeyword].indexOf(kind) > -1;
        }).length === 2);
}
function forEachBindingPattern(node) {
    var ids = [];
    if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) {
        node.elements.forEach(function (e) {
            if (ts.isIdentifier(e.name)) {
                ids.push(e.name.getText());
            }
            else {
                ids.push.apply(ids, forEachBindingPattern(e.name));
            }
        });
    }
    return ids;
}
function transformer() {
    return function (context) {
        var visitorClass = function (node) {
            if (ts.isClassDeclaration(node)) {
                var hasRegenerateMethod_1 = false;
                var hasMethods_1 = false;
                node.members
                    .filter(function (member) {
                    return member.modifiers === undefined ||
                        member.modifiers.filter(function (_a) {
                            var kind = _a.kind;
                            return kind === ts.SyntaxKind.StaticKeyword;
                        }).length === 0;
                })
                    .forEach(function (member) {
                    if (ts.isConstructorDeclaration(member) ||
                        member.name.getText() !== REGENERATE_METHOD) {
                        hasMethods_1 = true;
                    }
                    else {
                        hasRegenerateMethod_1 = true;
                    }
                });
                if (hasMethods_1 && !hasRegenerateMethod_1) {
                    return ts.updateClassDeclaration(node, node.decorators, node.modifiers, node.name, node.typeParameters, node.heritageClauses, node.members.concat([
                        ts.createMethod(undefined, ts.createModifiersFromModifierFlags(ts.ModifierFlags.Public), undefined, REGENERATE_METHOD, undefined, undefined, [
                            ts.createParameter(undefined, undefined, undefined, 'key'),
                            ts.createParameter(undefined, undefined, undefined, 'code'),
                        ], undefined, ts.createBlock([
                            ts.createStatement(ts.createIdentifier(evalTemplate())),
                        ])),
                    ]));
                }
            }
            return ts.visitEachChild(node, visitorClass, context);
        };
        return function (sourceFile) {
            var fileName = sourceFile.fileName;
            var identifiers = sourceFile.identifiers;
            var ID = "_default";
            var idx = 1;
            if (typeof identifiers !== 'undefined') {
                while (identifiers.has(ID)) {
                    ID = "_default" + ++idx;
                }
            }
            var REGISTRATIONS = [];
            var visitor = function (node) {
                if (ts.isSourceFile(node)) {
                    try {
                        return ts.visitEachChild(node, visitor, context);
                    }
                    catch (error) {
                        return node;
                    }
                }
                else if (ts.isExportAssignment(node) ||
                    isExportDefaultDeclaration(node)) {
                    REGISTRATIONS.push(buildRegistration({
                        ID: ID,
                        NAME: "\"default\"",
                        FILENAME: "\"" + fileName + "\"",
                    }));
                    if (ts.isClassDeclaration(node) && node.decorators) {
                        var name_1 = node.name
                            ? ts.createIdentifier(node.name.getText())
                            : ts.createIdentifier(ID);
                        return [
                            ts.updateClassDeclaration(node, node.decorators, undefined, name_1, node.typeParameters, node.heritageClauses, node.members),
                            node.name
                                ? ts.createVariableDeclarationList([
                                    ts.createVariableDeclaration(ID, undefined, ts.createIdentifier(node.name.getText())),
                                ], ts.NodeFlags.Const)
                                : ts.createEmptyStatement(),
                            ts.createExportAssignment(undefined, undefined, false, ts.createIdentifier(ID)),
                        ];
                    }
                    var express = ts.isExportAssignment(node)
                        ? node.expression
                        : ts.isFunctionDeclaration(node)
                            ? ts.createFunctionExpression(undefined, undefined, node.name, node.typeParameters, node.parameters, node.type, node.body)
                            : ts.isClassDeclaration(node)
                                ? ts.createClassExpression(undefined, node.name, node.typeParameters, node.heritageClauses, node.members)
                                : undefined;
                    return [
                        ts.createVariableDeclarationList([ts.createVariableDeclaration(ID, undefined, express)], ts.NodeFlags.Const),
                        ts.createExportAssignment(undefined, undefined, false, ts.createIdentifier(ID)),
                    ];
                }
                else if (shouldRegisterBinding(node)) {
                    var ids_1 = [];
                    if (ts.isVariableStatement(node)) {
                        node.declarationList.declarations
                            .filter(filterVariableDeclaration)
                            .forEach(function (declaration) {
                            if (ts.isIdentifier(declaration.name)) {
                                ids_1.push(declaration.name.getText());
                            }
                            else {
                                ids_1.push.apply(ids_1, forEachBindingPattern(declaration.name));
                            }
                        });
                    }
                    else if (node.name) {
                        ids_1 = [node.name.getText()];
                    }
                    ids_1.forEach(function (id) {
                        return REGISTRATIONS.push(buildRegistration({
                            ID: id,
                            NAME: "\"" + id + "\"",
                            FILENAME: "\"" + fileName + "\"",
                        }));
                    });
                }
                return node;
            };
            var newSourceFile = ts.visitNode(sourceFile, visitorClass);
            newSourceFile = ts.visitNode(newSourceFile, visitor);
            if (REGISTRATIONS &&
                REGISTRATIONS.length &&
                !shouldIgnoreFile(fileName)) {
                var header = [
                    ts.createStatement(ts.createIdentifier(headerTemplate())),
                    emptyStatement,
                ];
                var footer = [
                    emptyStatement,
                    ts.createStatement(ts.createIdentifier(buildTagger({ REGISTRATIONS: REGISTRATIONS }))),
                    emptyStatement,
                ];
                return ts.updateSourceFileNode(newSourceFile, header.concat(newSourceFile.statements).concat(footer));
            }
            return newSourceFile;
        };
    };
}
exports.default = transformer;
//# sourceMappingURL=react-hot.dev.js.map