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

describe('copies arrow function body block onto hidden class methods', () => {
  const fixturesDir = join(FIXTURES_DIR, 'class-properties');
  readdirSync(fixturesDir).forEach(fixtureName => {
    const fixtureFile = join(fixturesDir, fixtureName);
    const testFile: Array<string> = ['arguments.js'];
    // if (statSync(fixtureFile).isFile() && testFile.indexOf(fixtureName) > -1) {
    if (statSync(fixtureFile).isFile()) {
      it(fixtureName.split('-').join(' '), () => {
        const sourceCode = readFileSync(fixtureFile, 'utf-8');
        const source = ts.createSourceFile(fixtureName, sourceCode, ts.ScriptTarget.ES2016, true);
        const result = ts.transform(source, [addRHLPlugin()()]);
        const transformedSourceFile = result.transformed[0];
        const resultCode = printer.printFile(transformedSourceFile);
        expect(resultCode).toMatchSnapshot();
      });
    }
  });
});
