import * as DCL from 'decentraland-api'
//import '/original game/2048-react-master/src/index.js'
//import '/original game/2048-react-master/src/board.js'
//import {BoardView} from 'src/index'
import {Board} from './src/board.js'
//const {Board} = require('./src/board')
//const {BoardView} = require('./src/index')


// This is an interface, you can use it to enforce the types of your state
export interface IState {
  board: Board
}

export default class HouseScene extends DCL.ScriptableScene<any, IState> {
  // This is your initial state and it respects the given IState interface
  state = {
    board: new Board
  }

  sceneDidMount() {

  }

 

  buttonClick(direction:number){
    this.setState({board: this.state.board.move(direction)});

  }

  restartGame() {
    this.setState({board: new Board});
  }

  renderCells(){
    var cells = this.state.board.cells.map((row:any, rowIndex:any) => {
      return (
        <entity key={rowIndex}>
          { row.map((_:any, columnIndex:any) => 
          <box 
            key={rowIndex * Board.size + columnIndex} 
            position={{x: rowIndex *2, y:  columnIndex * 2 , z : 1}}
            />) }
        </entity>
      );
    });
    return cells
  }
  
  renderTiles(){
    var tiles = this.state.board.tiles
      .filter(tile => tile.value != 0)
      .map(tile => 
        <box 
          key={tile.id} 
          />
        );
    return tiles
  }
  //<div className='board' onTouchStart={this.handleTouchStart.bind(this)} onTouchEnd={this.handleTouchEnd.bind(this)} tabIndex="1">
  //<GameEndOverlay board={this.state.board} onRestart={this.restartGame.bind(this)} />

  renderButtons(){
    return(
      <entity>
        <box
          id="button1"
          position ={{x:3, y:3, z:1}}
          onClick={() => this.buttonClick(1)}
          />
        <box
          id="button2"
          position ={{x:3, y:3, z:1}}
          onClick={() => this.buttonClick(2)}
          />

      </entity>
    )

  }

  async render() {
    return (
      <scene>
        {this.renderCells()}
        {this.renderTiles()}
        {this.renderButtons()}

      </scene>
    )
  }
}
