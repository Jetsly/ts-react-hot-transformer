import * as ts from 'typescript';
export default function transformer(): (context: ts.TransformationContext) => (sourceFile: ts.SourceFile) => ts.SourceFile;
