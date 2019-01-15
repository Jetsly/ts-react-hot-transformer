import * as ts from 'typescript';
const RHLPackageRoot = `'react-hot-loader/root'`;
const RHLPackage = `'react-hot-loader'`;
const propertyName = 'hot';
enum ImportKind {
  named,
  namespace,
}
export default function transformer(context: ts.TransformationContext) {
  return (sourceFile: ts.SourceFile) => {
    const imports: Array<{
      kind: ImportKind;
      local: string;
    }> = [];
    const visitorImports: ts.Visitor = node => {
      if (ts.isSourceFile(node)) {
        return ts.visitEachChild(node, visitorImports, context);
      } else if (ts.isImportDeclaration(node)) {
        if ([RHLPackageRoot, RHLPackage].indexOf(node.moduleSpecifier.getText()) > -1) {
          if (ts.isNamedImports(node.importClause.namedBindings)) {
            node.importClause.namedBindings.elements.forEach(element => {
              if (element.propertyName && element.propertyName.text === propertyName) {
                imports.push({
                  kind: ImportKind.named,
                  local: element.name.text,
                });
              } else if (element.name.text === propertyName) {
                imports.push({
                  kind: ImportKind.named,
                  local: element.name.text,
                });
              }
            });
          } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
            imports.push({
              kind: ImportKind.namespace,
              local: node.importClause.namedBindings.name.text,
            });
          }
        }
      }
      return node;
    };
    const visitor: ts.Visitor = node => {
      if (ts.isCallExpression(node)) {
        if (ts.isPropertyAccessExpression(node.expression)) {
          const pkgName = node.expression.expression.getText();
          for (let index = 0; index < imports.length; index++) {
            const element = imports[index];
            if (
              element.kind === ImportKind.namespace &&
              pkgName === element.local &&
              node.expression.name.text === propertyName
            ) {
              return node.arguments[0];
            }
          }
        } else {
          const methodName = node.expression.getText();
          for (let index = 0; index < imports.length; index++) {
            const element = imports[index];
            if (element.kind === ImportKind.named && methodName === element.local) {
              return node.arguments[0];
            }
          }
        }
      }
      return ts.visitEachChild(node, visitor, context);
    };
    ts.visitNode(sourceFile, visitorImports);
    return imports.length ? ts.visitNode(sourceFile, visitor) : sourceFile;
  };
}
