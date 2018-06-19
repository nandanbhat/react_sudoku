var React = require('react');
var Store = require('./store');
var Sudoku = require('./sudoku');
var Boards = require('./boards');
import {Link} from 'react-router';

class Cell extends React.Component {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    var oldCell = this.props.cell;
    var newCell = newProps.cell;
    return (
      oldCell.value !== newCell.value ||
      oldCell.editable !== newCell.editable ||
      oldCell.hasConflict !== newCell.hasConflict
    );
  }

  render() {
    var cell = this.props.cell;

    var classes = [];
    classes.push('i'+cell.i);
    classes.push('j'+cell.j);
    classes.push(cell.editable ? 'editable' : 'not-editable');
    classes.push(cell.hasConflict ? 'has-conflict' : 'no-conflict');

    return (
      <td className={classes.join(' ')}>
        <input
          type="tel"
          value={cell.value}
          onClick={this.onClick}
          onChange={this.onChange} />
      </td>
    );
  }

  onClick(event) {
    event.preventDefault();
    if (this.props.cell.editable) {
      event.target.select();
    } else {
      event.target.blur();
    }
  }

  onChange(event) {
    event.preventDefault();
    var cell = this.props.cell;
    if (!cell.editable) {
      return;
    }
    var newValue = event.target.value;
    if (newValue !== '' && !/^[1-9]$/.test(newValue)) {
      event.target.value = cell.value;
      return;
    }
    Store.dispatch({
      type: 'CHANGE_VALUE',
      i: cell.i,
      j: cell.j,
      value: newValue === '' ? null : parseInt(newValue)
    });
  }
}

class Controls extends React.Component {
  constructor(props) {
    super(props);
    this.state = Store.getState();
  }

  componentDidMount() {
    var self = this;
    self.unsubscribe = Store.subscribe(function() {
      self.setState(Store.getState());
    });
  }

  undo(){
    let lastState = localStorage.currentGame.splice(localStorage.currentGame.lastState -1, 1);
    return lastState;
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    var time = this.state.game.time;
    function f(num) {
      if (num < 10) {
        return '0'+num;
      } else {
        return ''+num;
      }
    }
    return (
      <div className="controls">
        <button onClick='undo'>Undo</button>
        <p><Link to="/">Back</Link></p>
        {Sudoku.isComplete(this.state.game.cells)
          ? <p className="congratulations">Congratulations!</p>
          : <p>{f(time.getHours())+':'+f(time.getMinutes())+':'+f(time.getSeconds())}</p>}
      </div>
    )
  }
}

class DifficultyDialog extends React.Component {
  shouldComponentUpdate(newProps, newState) {
    return false;
  }

  constructor(props) {
    super(props);
    this.state = Store.getState();

    this.difficultyClick = this.difficultyClick.bind(this);
  }

  componentDidMount() {
    var self = this;
    self.unsubscribe =  Store.subscribe(function() {
      self.setState(Store.getState());
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return (
      <div className="dialog">
        <Link to="/" className="dialog-close">&#x2715;</Link>
        <p>Please, choose the difficulty:</p>
        <button data-difficulty="easy" onClick={this.difficultyClick}>Easy</button>
      </div>
    );
  }

  difficultyClick(event) {
    event.preventDefault();
    var difficulty = event.target.getAttribute('data-difficulty');
    Store.dispatch({type: 'NEW_GAME', difficulty});
    location.hash = 'play';
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = Store.getState();
  }

  componentDidMount() {
    var self = this;
    this.unsubscribe = Store.subscribe(function() {
      self.setState(Store.getState());
    });

    this.addSecond = setInterval(function() {
      Store.dispatch({type: 'ADD_SECOND'});
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.addSecond);
    this.unsubscribe();
  }

  render() {
    if (typeof localStorage.currentGame === 'undefined') {
      location.hash = '/';
      return <div></div>;
    }

    return (
      <div>
        <table className="sudoku-table">
          <tbody>
            {this.state.game.cells.map(function(line, i) {
              return (
                <tr key={i}>
                  {line.map(function(cell) {
                    return <Cell cell={cell} key={cell.j} />;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <Controls />
      </div>
    );
  }
}

class Index extends React.Component {
  render() {
    return (
      <div className="index">
        <h1>Sudoku</h1>
        <p><Link to="new-game">Start a new game</Link></p>
        {this.hasExistingGame()
          ? <p>or <Link to="play">resume the existing one</Link></p>
          : null}
      </div>
    );
  }

  hasExistingGame() {
    return (typeof localStorage.currentGame !== 'undefined');
  }
}

function App(props) {
  return (
    <div>
      {props.children}
    </div>
  );
}

module.exports = {App, DifficultyDialog, Game, Index};
