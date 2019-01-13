import * as ts from 'typescript';
import { join } from 'path';
import { readdirSync, readFileSync, statSync } from 'fs';
import transformerFactory from '../src/react-hot.dev';
import transformerProdFactory from '../src/react-hot.prod';
const printer = ts.createPrinter();
const FIXTURES_DIR = join(__dirname, '__fixtures__');
function addRHLPlugin(prod = false) {
  return prod ? transformerProdFactory : transformerFactory;
}

describe('React components', () => {
  readdirSync(FIXTURES_DIR).forEach(fixtureName => {
    const fixtureFile = join(FIXTURES_DIR, fixtureName);
    const isForProd = fixtureName.endsWith('.prod.js');
    if (statSync(fixtureFile).isFile()) {
      // if (statSync(fixtureFile).isFile()) {
      it(fixtureName.split('-').join(' '), () => {
        const sourceCode = readFileSync(fixtureFile, 'utf-8');
        const source = ts.createSourceFile(fixtureName, sourceCode, ts.ScriptTarget.ES2016, true);
        const result = ts.transform(source, [addRHLPlugin(isForProd)]);
        const transformedSourceFile = result.transformed[0];
        const resultCode = printer.printFile(transformedSourceFile);
        expect(resultCode).toMatchSnapshot();
      });
    }
  });
});
