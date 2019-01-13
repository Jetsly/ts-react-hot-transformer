"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var RHLPackageRoot = "'react-hot-loader/root'";
var RHLPackage = "'react-hot-loader'";
var propertyName = 'hot';
var ImportKind;
(function (ImportKind) {
    ImportKind[ImportKind["named"] = 0] = "named";
    ImportKind[ImportKind["namespace"] = 1] = "namespace";
})(ImportKind || (ImportKind = {}));
function transformer(context) {
    return function (sourceFile) {
        var imports = [];
        var visitorImports = function (node) {
            if (ts.isSourceFile(node)) {
                return ts.visitEachChild(node, visitorImports, context);
            }
            else if (ts.isImportDeclaration(node)) {
                if ([RHLPackageRoot, RHLPackage].indexOf(node.moduleSpecifier.getText()) > -1) {
                    if (ts.isNamedImports(node.importClause.namedBindings)) {
                        node.importClause.namedBindings.elements.forEach(function (element) {
                            if (element.propertyName && element.propertyName.text === propertyName) {
                                imports.push({
                                    kind: ImportKind.named,
                                    local: element.name.text,
                                });
                            }
                            else if (element.name.text === propertyName) {
                                imports.push({
                                    kind: ImportKind.named,
                                    local: element.name.text,
                                });
                            }
                        });
                    }
                    else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                        imports.push({
                            kind: ImportKind.namespace,
                            local: node.importClause.namedBindings.name.text,
                        });
                    }
                }
            }
            return node;
        };
        var visitor = function (node) {
            if (ts.isCallExpression(node)) {
                if (ts.isPropertyAccessExpression(node.expression)) {
                    var pkgName = node.expression.expression.getText();
                    for (var index = 0; index < imports.length; index++) {
                        var element = imports[index];
                        if (element.kind === ImportKind.namespace &&
                            pkgName === element.local &&
                            node.expression.name.text === propertyName) {
                            return node.arguments[0];
                        }
                    }
                }
                else {
                    var methodName = node.expression.getText();
                    for (var index = 0; index < imports.length; index++) {
                        var element = imports[index];
                        if (element.kind === ImportKind.named && methodName === element.local) {
                            return node.arguments[0];
                        }
                    }
                }
            }
            return ts.visitEachChild(node, visitor, context);
        };
        ts.visitNode(sourceFile, visitorImports);
        return ts.visitNode(sourceFile, visitor);
    };
}
exports.default = transformer;
//# sourceMappingURL=react-hot.prod.js.map