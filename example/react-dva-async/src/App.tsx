import React from 'react';
import { hot } from 'react-hot-loader/root';
import { Route, Router, Switch } from 'react-router';
import * as Loadable from 'react-loadable';

const App = ({ history }) => (
  <Router history={history}>
    <Switch>
      <Route
        component={Loadable({
          loader: () => import('./Counter'),
          loading: () => 'loading',
        })}
      />
    </Switch>
  </Router>
);

const HotApp = hot(App);
export default ({ app, history }) => <HotApp history={history} />;
