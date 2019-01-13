import React from 'react';
import { hot } from 'react-hot-loader/root';
const a = 1;
class AA extends React.Component {
  public state = {
    a: 'aaa',
  };
  public render() {
    return (
      <a onClick={() => this.setState({ a: 'done' })}>
        {this.state.a}
        <br />1111
      </a>
    );
  }
}
class Counter extends React.Component {
  state: { count: number } = { count: 0 };
  interval: any;
  componentDidMount() {
    this.interval = setInterval(
      () => this.setState((prevState: any) => ({ count: prevState.count + 1 })),
      1000
    );
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <div>
        1#{this.state.count}
        <span>5</span>
        <AA />
      </div>
    );
  }
}
export default hot(Counter);
