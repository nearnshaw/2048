
import { Vector3Component, ISimplifiedNode } from 'decentraland-api'
import * as DCL from 'decentraland-api'



export interface ITileProps 
{
  id: string,
  position: Vector3Component,
  value: Number
}
export const Tile = (props: ITileProps) => {
  let srcPath = "/models/" + props.value.toString() + ".gltf"

  return (
  <gltf-model
    key={props.id}
    position={props.position}
    transition={
      {position: { duration: 300, timing: 'linear' }}
      }
    src={srcPath}
    />
    )
}


// export const Tile = (props: ITileProps) => {
//   return <entity
//     key={props.id}
//     position={props.position}
//     transition={
//       {position: { duration: 300, timing: 'linear' }}
//       }
//     >
//       <box 
//         key={props.id}      
//         color={445643}       
//       />
//       <text
//           key={props.id}
//           value={ props.value.toString()}
//           position={{ x:0, y: 0, z: -1}}
//         />
//   </entity>
// }


// class TileView extends React.Component {
//     shouldComponentUpdate(nextProps) {
//       if (this.props.tile != nextProps.tile) {
//         return true;
//       }
//       if (!nextProps.tile.hasMoved() && !nextProps.tile.isNew()) {
//         return false;
//       }
//       return true;
//     }
//     render() {
//       var tile = this.props.tile;
//       var classArray = ['tile'];
//       classArray.push('tile' + this.props.tile.value);
//       if (!tile.mergedInto) {
//         classArray.push('position_' + tile.row + '_' + tile.column);
//       }
//       if (tile.mergedInto) {
//         classArray.push('merged');
//       }
//       if (tile.isNew()) {
//         classArray.push('new');
//       }
//       if (tile.hasMoved()) {
//         classArray.push('row_from_' + tile.fromRow() + '_to_' + tile.toRow());
//         classArray.push('column_from_' + tile.fromColumn() + '_to_' + tile.toColumn());
//         classArray.push('isMoving');
//       }
//       var classes = classArray.join(' ');
//       return (
//         <box

//         />
//         // <box className={classes}>{tile.value}</span>
//       );
//     }
//   }