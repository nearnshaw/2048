import * as DCL from 'decentraland-api'
import { Vector3Component, Vector2Component } from 'decentraland-api'
//import '/original game/2048-react-master/src/index.js'
//import '/original game/2048-react-master/src/board.js'
//import {BoardView} from 'src/index'
import {Board} from 'src/board'
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
    console.log("button clicked")
    this.setState({board: this.state.board.move(direction)});

  }

  restartGame() {
    this.setState({board: new Board});
  }

  gridToScene(row: number, col: number){
    var convertedPos: Vector3Component = {
      x: (row * 2) + 1,
      y: (col * 2) + 1,
      z: 8
    }
      return convertedPos
  }

  renderCells(){
    var cells = this.state.board.cells.map((row:any, rowIndex:any) => {
      return (
        <entity key={rowIndex}>
          { row.map((_:any, columnIndex:any) => 
          <plane 
            key={rowIndex * this.state.board.size + columnIndex} 
            position={this.gridToScene(rowIndex,columnIndex)}
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
        <entity
          key={tile.id}
          position={this.gridToScene(tile.row, tile.column)}
          transition={
              {position: { duration: 300, timing: 'linear' }}
            } >

          <box 
            key={tile.id.toString + "box"}      
            color={445643}       
            />
            <text
               key={tile.id.toString + "text"}
               value={ tile.value.toString()}
               position={{ x:0, y: 0, z: -1}}
              />
          </entity>
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
          position ={{x:1.5, y:1, z:3}}
          onClick={() => this.buttonClick(1)}
          />
        <box
          id="button2"
          position ={{x:3, y:2, z:3}}
          onClick={() => this.buttonClick(2)}
          />
        <box
          id="button3"
          position ={{x:4.5, y:1, z:3}}
          onClick={() => this.buttonClick(3)}
          />
        <box
          id="button4"
          position ={{x:3, y:0.5, z:3}}
          onClick={() => this.buttonClick(4)}
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
