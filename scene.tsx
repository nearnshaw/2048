import * as DCL from 'decentraland-api'
import { Vector3Component } from 'decentraland-api'
import {Tile} from 'components/tile'
//import '/original game/2048-react-master/src/index.js'
//import '/original game/2048-react-master/src/board.js'
//import {BoardView} from 'src/index'
import {Board} from 'src/board'
//const {Board} = require('./src/board')
//const {BoardView} = require('./src/index')


// This is an interface, you can use it to enforce the types of your state
export interface IState {
  board: Board,
  pointerDown: boolean,
  lookingDirection: Vector3Component,
  initialDirection: Vector3Component
}

export default class HouseScene extends DCL.ScriptableScene<any, IState> {
  // This is your initial state and it respects the given IState interface
  state = {
    board: new Board,
    pointerDown: false,
    lookingDirection: {x: 0, y:0, z:0},
    initialDirection: {x: 0, y:0, z:0},
  }

  sceneDidMount() {

    this.subscribeTo("pointerDown", e => {
      this.setState({ pointerDown: true, initialDirection:this.state.lookingDirection })
    })
    this.subscribeTo("pointerUp", e => {
      let deltaX : number = this.state.initialDirection.x - this.state.lookingDirection.x
      let deltaY : number = this.state.initialDirection.y - this.state.lookingDirection.y
      let direction: number = -1
      if(  Math.abs(deltaY) < 3 && deltaX < -5){
        direction = 0
      } else if (deltaY > 5 && Math.abs(deltaX) < 3){
        direction = 1
      } else if (  Math.abs(deltaY) < 3 && deltaX > 5){
        direction = 2
      } else if (deltaY < -5 && Math.abs(deltaX) < 3){
        direction = 3
      }
      console.log( direction + ", deltaX: " + deltaX + " deltaY: " + deltaY )
      this.shiftBlocks(direction)

      
      this.setState({ pointerDown: false })
    })

    this.subscribeTo("rotationChanged", e => {
      this.setState({ lookingDirection: e.rotation })
    })

 


  }

 

  shiftBlocks(direction:number){
    if (direction == -1){return}
    console.log("button clicked")
    this.setState({board: this.state.board.move(direction)});
    this.forceUpdate()

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
      .filter(tile => tile.value != 0 && !tile.mergedInto )
      .map(tile => 
        <Tile
          id= {tile.id}
          position= {this.gridToScene(tile.row, tile.column)}
          value={ tile.value.toString()}
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
          position ={{x:1.5, y:1, z:2}}
          onClick={() => this.shiftBlocks(1)}
          />
        <box
          id="button2"
          position ={{x:3, y:2, z:2}}
          onClick={() => this.shiftBlocks(2)}
          />
        <box
          id="button3"
          position ={{x:4.5, y:1, z:2}}
          onClick={() => this.shiftBlocks(3)}
          />
        <box
          id="button4"
          position ={{x:3, y:0.5, z:2}}
          onClick={() => this.shiftBlocks(4)}
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
