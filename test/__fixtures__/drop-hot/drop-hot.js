import React from 'react';
import { hot } from 'react-hot-loader/root';
import { hot as namedHot, foo as namedFoo } from 'react-hot-loader/root';
import { hot as namedHot2 } from 'react-hot-loader';
import { hot as notRHLHot } from 'not-react-hot-loader';
import * as RHL from 'react-hot-loader/root';
import * as RHL2 from 'react-hot-loader/root';
import * as NOTRHL from 'not-react-hot-loader';

const App = () => <div>Hello World!</div>;

const a = hot(App);
const c = namedHot2(module)(App);
const d = RHL.hot(App);
const e = RHL2.hot(App);

foo(App);
notRHLHot(App);
namedFoo(App);
RHL.foo(App);
NOTRHL.hot(App);

export { a, b, c, d, e };

(function(namedHot2) {
  const b = namedHot(App);
  const c = namedHot2(module)(App);
})(1);
