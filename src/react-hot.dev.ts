import * as ts from 'typescript';
// https://github.com/gaearon/react-hot-loader/blob/master/src/babel.dev.js
const PREFIX = '__reactstandin__';
const REGENERATE_METHOD = `${PREFIX}regenerateByEval`;
const placeholderPattern = /([A-Z0-9]+)([A-Z0-9_]+)/g;
const shouldIgnoreFile = file =>
  !!file
    .split('\\')
    .join('/')
    .match(/node_modules\/(react|react-hot-loader)([\/]|$)/);
const template = (tpl: string) => (data?: { [key: string]: any }) =>
  tpl.replace(placeholderPattern, pattern =>
    Array.isArray(data[pattern]) ? data[pattern].join('\n') : data[pattern],
  );
const emptyStatement = ts.createStatement(ts.createIdentifier('\n\n'));
const buildRegistration = template(
  'reactHotLoader.register(ID, NAME, FILENAME);',
);
const headerTemplate = template(`(function () {
     var enterModule = require('react-hot-loader').enterModule;
     enterModule && enterModule(module);
   }())`);
const evalTemplate = template('this[key] = eval(code)');
const buildTagger = template(`(function () {
var reactHotLoader = require('react-hot-loader').default;
var leaveModule = require('react-hot-loader').leaveModule;

if (!reactHotLoader) {
  return;
}

REGISTRATIONS

leaveModule(module);
}())`);
function shouldRegisterBinding(node: ts.Node) {
  switch (node.kind) {
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.VariableStatement:
      return true;
    default:
      return false;
  }
}
function filterVariableDeclaration(declaration: ts.VariableDeclaration) {
  if (
    declaration.modifiers &&
    declaration.modifiers.filter(
      ({ kind }) => kind === ts.SyntaxKind.DeclareKeyword,
    ).length > 0
  ) {
    return false;
  }
  if (
    declaration.initializer &&
    ts.isCallExpression(declaration.initializer) &&
    declaration.initializer.expression.getText() === 'require'
  ) {
    return false;
  }
  return true;
}
function isExportDefaultDeclaration(node) {
  return (
    node.modifiers &&
    node.modifiers.filter(
      ({ kind }) =>
        [ts.SyntaxKind.ExportKeyword, ts.SyntaxKind.DefaultKeyword].indexOf(
          kind,
        ) > -1,
    ).length === 2
  );
}

function forEachBindingPattern(node) {
  const ids: string[] = [];
  if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) {
    node.elements.forEach(e => {
      if (ts.isIdentifier(e.name)) {
        ids.push(e.name.getText());
      } else {
        ids.push(...forEachBindingPattern(e.name));
      }
    });
  }
  return ids;
}

export default function transformer() {
  return (context: ts.TransformationContext) => {
    const visitorClass: ts.Visitor = node => {
      if (ts.isClassDeclaration(node)) {
        let hasRegenerateMethod = false;
        let hasMethods = false;
        node.members
          .filter(
            member =>
              member.modifiers === undefined ||
              member.modifiers.filter(
                ({ kind }) => kind === ts.SyntaxKind.StaticKeyword,
              ).length === 0,
          )
          .forEach(member => {
            if (
              ts.isConstructorDeclaration(member) ||
              member.name.getText() !== REGENERATE_METHOD
            ) {
              hasMethods = true;
            } else {
              hasRegenerateMethod = true;
            }
          });
        if (hasMethods && !hasRegenerateMethod) {
          return ts.updateClassDeclaration(
            node,
            node.decorators,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            node.members.concat([
              ts.createMethod(
                undefined,
                ts.createModifiersFromModifierFlags(ts.ModifierFlags.Public),
                undefined,
                REGENERATE_METHOD,
                undefined,
                undefined,
                [
                  ts.createParameter(undefined, undefined, undefined, 'key'),
                  ts.createParameter(undefined, undefined, undefined, 'code'),
                ],
                undefined,

                ts.createBlock([
                  ts.createStatement(ts.createIdentifier(evalTemplate())),
                ]),
              ),
            ]),
          );
        }
      }
      return ts.visitEachChild(node, visitorClass, context);
    };
    return (sourceFile: ts.SourceFile) => {
      const fileName = sourceFile.fileName;
      const identifiers = (sourceFile as any).identifiers as Map<string, any>;
      let ID = `_default`;
      let idx = 1;
      if (typeof identifiers !== 'undefined') {
        while (identifiers.has(ID)) {
          ID = `_default${++idx}`;
        }
      }
      const REGISTRATIONS = [];
      const visitor: ts.Visitor = node => {
        if (ts.isSourceFile(node)) {
          try {
            return ts.visitEachChild(node, visitor, context);
          } catch (error) {
            return node;
          }
        } else if (
          ts.isExportAssignment(node) ||
          isExportDefaultDeclaration(node)
        ) {
          REGISTRATIONS.push(
            buildRegistration({
              ID,
              NAME: `"default"`,
              FILENAME: `"${fileName}"`,
            }),
          );
          const modifiers = node.modifiers
            ? node.modifiers.filter(
                modifier => modifier.kind !== ts.SyntaxKind.DefaultKeyword,
              )
            : undefined;
          if (ts.isClassDeclaration(node)) {
            return [
              ts.updateClassDeclaration(
                node,
                node.decorators,
                modifiers,
                ts.createIdentifier(ID),
                node.typeParameters,
                node.heritageClauses,
                node.members,
              ),
              ts.createExportAssignment(
                undefined,
                undefined,
                false,
                ts.createIdentifier(ID),
              ),
            ];
          } else if (ts.isFunctionDeclaration(node)) {
            return [
              ts.updateFunctionDeclaration(
                node,
                node.decorators,
                modifiers,
                node.asteriskToken,
                ts.createIdentifier(ID),
                node.typeParameters,
                node.parameters,
                node.type,
                node.body,
              ),
              ts.createExportAssignment(
                undefined,
                undefined,
                false,
                ts.createIdentifier(ID),
              ),
            ];
          } else if (ts.isExportAssignment(node)) {
            return [
              ts.createVariableStatement(
                undefined,
                ts.createVariableDeclarationList(
                  [
                    ts.createVariableDeclaration(
                      ID,
                      undefined,
                      node.expression,
                    ),
                  ],
                  ts.NodeFlags.Const,
                ),
              ),
              ts.createExportAssignment(
                undefined,
                undefined,
                false,
                ts.createIdentifier(ID),
              ),
            ];
          }
          return node;
        } else if (shouldRegisterBinding(node)) {
          let ids: string[] = [];
          if (ts.isVariableStatement(node)) {
            node.declarationList.declarations
              .filter(filterVariableDeclaration)
              .forEach(declaration => {
                if (ts.isIdentifier(declaration.name)) {
                  ids.push(declaration.name.getText());
                } else {
                  ids.push(...forEachBindingPattern(declaration.name));
                }
              });
          } else if ((node as ts.FunctionDeclaration).name) {
            ids = [(node as ts.FunctionDeclaration).name.getText()];
          }
          ids.forEach(id =>
            REGISTRATIONS.push(
              buildRegistration({
                ID: id,
                NAME: `"${id}"`,
                FILENAME: `"${fileName}"`,
              }),
            ),
          );
        }
        return node;
      };
      let newSourceFile = ts.visitNode(sourceFile, visitorClass);
      newSourceFile = ts.visitNode(newSourceFile, visitor);
      if (
        REGISTRATIONS &&
        REGISTRATIONS.length &&
        !shouldIgnoreFile(fileName)
      ) {
        const header: ts.Statement[] = [
          ts.createStatement(ts.createIdentifier(headerTemplate())),
          emptyStatement,
        ];
        const footer: ts.Statement[] = [
          emptyStatement,
          ts.createStatement(
            ts.createIdentifier(buildTagger({ REGISTRATIONS })),
          ),
          emptyStatement,
        ];
        return ts.updateSourceFileNode(
          newSourceFile,
          header.concat(newSourceFile.statements).concat(footer),
        );
      }
      return newSourceFile;
    };
  };
}
