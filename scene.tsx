import * as DCL from 'decentraland-api'
import { Vector3Component } from 'decentraland-api'
import {Tile} from 'components/tile'
import {Board} from 'src/board'
import {EventManager} from 'ts/EventManager'

const gemSpeed: number = 300



export function sleep(ms: number = 0) {
  return new Promise(r => setTimeout(r, ms));
}

export enum chestState {
 open,
 closed,
 opening,
 closing
}

// This is an interface, you can use it to enforce the types of your state
export interface IState {
  board: Board,
  pointerDown: boolean,
  lookingDirection: Vector3Component,
  initialDirection: Vector3Component,
  openChest: chestState,
  boardHeight: number,
  boardSize: number,
  playingBling1: boolean,
  playingBling2: boolean,
  playingOpenChest: boolean,
  playingBackgroundMusic: boolean
}

export default class the2048Game extends DCL.ScriptableScene<any, IState> {
  // This is your initial state and it respects the given IState interface
  state = {
    board: new Board,
    pointerDown: false,
    lookingDirection: {x: 0, y:0, z:0},
    initialDirection: {x: 0, y:0, z:0},
    openChest: chestState.closed,
    boardHeight: 0,
    boardSize: 0.05,
    playingBling1: false,
    playingBling2: false,
    playingOpenChest: false,
    playingBackgroundMusic: false,
  }

  sceneDidMount() {
    EventManager.init(this.eventSubscriber)
    this.eventSubscriber.on('merge', e => this.mergeTiles());
    this.eventSubscriber.on('loose', e => this.loose());
    this.eventSubscriber.on('win', e => this.win());

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
    this.playSoundMoveTiles()
  }

  async openChest(){
    console.log("chestState: " + this.state.openChest)
    switch (this.state.openChest){
      case chestState.open :
        this.setState({
          openChest: chestState.closing,
          boardHeight: 0,
          boardSize: 0.05,
          playingBackgroundMusic: false
        });
        console.log("chestState: " + this.state.openChest)
        await sleep (1000)
        this.setState({
          playingOpenChest:false, 
          openChest:chestState.closed
        })
        console.log("chestState: " + this.state.openChest)
        break
      case chestState.closed || chestState.closing:
        this.setState({
          openChest: chestState.opening,
          board: new Board,
          boardHeight: 4.5,
          boardSize: 0.45,
          playingOpenChest: true,
          playingBackgroundMusic: true
        });
        await sleep (1000)
        this.setState({
          playingOpenChest:false, 
          openChest:chestState.open
        })
        break
    }

  }

  async mergeTiles(){
    console.log("merged tiles")
    this.setState({playingBling1: true})
    await sleep(400)
    this.setState({playingBling1: false})
  }

  async playSoundMoveTiles(){
    this.setState({playingBling2: true})
    await sleep(400)
    this.setState({playingBling2: false})
  }

  win(){
    console.log("win")
  }

  loose(){
    console.log("loose")
  }


  gridToScene(row: number, col: number){
    var convertedPos: Vector3Component = {
      x: (row * 2) -3,
      y: (col * 2) -2,
      z: 0
    }
    return convertedPos
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
          justAdded = {tile.justAdded}
         />
        );
    return tiles
  }
  
  renderSounds(){
    return(
      <entity
      position={{x:5, y:0.2, z:5}}
      sound={{
        src: "sounds/music.mp3",
        loop: true,
        playing: this.state.playingBackgroundMusic,
        volume: 1
      }}
      >
        <entity
          id="chest_open"
          sound={{
            src: "sounds/bling4.wav",
            loop: false,
            playing: this.state.playingOpenChest,
            volume: 1
          }}
          />
        <entity
          id="bling2"
          sound={{
            src: "sounds/bling3.wav",
            loop: false,
            playing: this.state.playingBling2,
            volume: 0.3
          }}
        />
        <entity
          id="bling1"
          sound={{
            src: "sounds/bling1.wav",
            loop: false,
            playing: this.state.playingBling1,
            volume: 0.6
          }}
        />
      </entity>
    )

  }

  renderChest(){
    let chestAnimations : any[] = []
    let lightAnimations : any[] = []
    switch (this.state.openChest){
    case chestState.closed:
      chestAnimations = [
          { clip: "Close", playing: false },
          { clip: "Open", playing: false, loop: false}
        ]
      lightAnimations = [
          { clip: "Light_Close", playing: false, loop: false },
          { clip: "Light_Open", playing: false }
        ]
      break
    case chestState.opening:
      chestAnimations = [
        { clip: "Close", playing: false },
        { clip: "Open", playing: true, loop: false}
      ]
      lightAnimations = [
          { clip: "Light_Close", playing: false, loop: false },
          { clip: "Light_Open", playing: true, loop:false }
        ]
      break
    case chestState.open:
      chestAnimations = [
        { clip: "Close", playing: false },
        { clip: "Open", playing: false, loop: false}
      ]
      lightAnimations = [
          { clip: "Light_Close", playing: false, loop: false },
          { clip: "Light_Open", playing: false }
        ]
      break
    case chestState.closing:
      chestAnimations = [
        { clip: "Close", playing: true, loop:false },
        { clip: "Open", playing: false, loop: false}
      ]
      lightAnimations = [
          { clip: "Light_Close", playing: true, loop: false },
          { clip: "Light_Open", playing: false }
        ]
      break
    }

    return  (  
      
      <entity
      position={{x:5, y:0.2, z:5}}
      rotation={{x:0, y:90, z: 0}}
      scale={0.8}
    >     
        <gltf-model
          id="chest"
          src="models/Chest.gltf"
          skeletalAnimation={chestAnimations}
        />
        <gltf-model
          id="light"
          src="models/Light.gltf"
          skeletalAnimation={lightAnimations}  
        />
      </entity>
      )

  }




  async render() {
    return (
      <scene>
        <gltf-model
          src="models/Island.gltf"
          position={{x:5, y:0, z:5}}
          rotation={{x:0, y:90, z: 0}}    
        />
        <basic-material
          id="logoTexture"
          texture="textures/Logo2048.png"   
        />
        <plane
          id="logo"
          material="#logoTexture"
          position={{x:5, y:8, z:5}}
          scale={6}
        />
      
        {this.renderChest()}
        
        <entity
              id= "board"
              scale = {this.state.boardSize}
              position = {{x:5, y:this.state.boardHeight, z:5}}
              transition={{
                scale: { duration: 300, timing: 'linear' },
                position : { duration: 300, timing: 'sin-in' }
              }}
              >
              <gltf-model
                src="models/Map.gltf"
                scale={2}
                position={{x:0, y:1, z:0}}
                />
                {(this.state.openChest == chestState.closed)? 
                  <entity/> :
                  <entity
                    id="wrapper"
                    >    
                    {this.renderTiles()}
                    {this.renderSounds()}
                  </entity>
                
                } 
         </entity>
       
      </scene>
    )
  }
}
