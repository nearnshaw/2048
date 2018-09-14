import * as DCL from 'decentraland-api'
import { Vector3Component } from 'decentraland-api'
import {Tile} from 'components/tile'
import {Board} from 'src/board'
import {EventManager} from 'ts/EventManager'

const gemSpeed: number = 300



export function sleep(ms: number = 0) {
  return new Promise(r => setTimeout(r, ms));
}

// This is an interface, you can use it to enforce the types of your state
export interface IState {
  board: Board,
  pointerDown: boolean,
  lookingDirection: Vector3Component,
  initialDirection: Vector3Component,
  openChest: boolean
}

export default class the2048Game extends DCL.ScriptableScene<any, IState> {
  // This is your initial state and it respects the given IState interface
  state = {
    board: new Board,
    pointerDown: false,
    lookingDirection: {x: 0, y:0, z:0},
    initialDirection: {x: 0, y:0, z:0},
    openChest: false
  }

  sceneDidMount() {
    EventManager.init(this.eventSubscriber)
    this.eventSubscriber.on('merge', e => this.mergeTiles());

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
      //console.log( direction + ", deltaX: " + deltaX + " deltaY: " + deltaY )
      this.shiftBlocks(direction)

      
      this.setState({ pointerDown: false })
    })

    this.subscribeTo("rotationChanged", e => {
      this.setState({ lookingDirection: e.rotation })
    })
    this.eventSubscriber.on("chest_click", () => {
      this.openChest()
    })
    


  }

 

  async shiftBlocks(direction:number){
    if (direction == -1){return}
    //console.log("button clicked")
    this.setState({board: this.state.board.move(direction)});
    this.forceUpdate()
    await sleep(gemSpeed-50)
    this.forceUpdate()
  }

  openChest(){
    this.setState({
      openChest: !this.state.openChest,
      board: new Board
    });
    console.log("action chest")
  }

  mergeTiles(){
    console.log("merged tiles")
  }


  gridToScene(row: number, col: number){
    var convertedPos: Vector3Component = {
      x: (row * 2) -3,
      y: (col * 2) -2,
      z: 0
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
          id= {tile.id.toString()}
          position= {this.gridToScene(tile.row, tile.column)}
          value={ tile.value}
          speed ={gemSpeed}
         />
        );
    return tiles
  }
  //<div className='board' onTouchStart={this.handleTouchStart.bind(this)} onTouchEnd={this.handleTouchEnd.bind(this)} tabIndex="1">
  //<GameEndOverlay board={this.state.board} onRestart={this.restartGame.bind(this)} />



  async render() {
    return (
      <scene>
        <gltf-model
          src="models/Island.gltf"
          position={{x:5, y:0, z:5}}
          rotation={{x:0, y:90, z: 0}}
        />
        <gltf-model
          id="chest"
          src="models/Chest.gltf"
          position={{x:5, y:0.3, z:5}}
          rotation={{x:0, y:90, z: 0}}
          scale={0.8}
          skeletalAnimation={
            this.state.openChest
                ? [
                      { clip: "Close", playing: false },
                      { clip: "Open", playing: true, loop: false}
                  ]
                : [
                      { clip: "Close", playing: true, loop: false },
                      { clip: "Open", playing: true }
                  ]
        }
         
          />
        {this.state.openChest?
            <entity
              scale = {0.5}
              position = {{x:5, y:4.5, z:5}}
              >
              {this.renderCells()}
              {this.renderTiles()}
            </entity>
          : <entity/> 
        } 
       
      </scene>
    )
  }
}
