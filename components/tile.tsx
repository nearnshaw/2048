
import { Vector3Component, ISimplifiedNode } from 'decentraland-api'
import * as DCL from 'decentraland-api'

// const modelsById: { [key: string]: string } = {
//   B: 'assets/LP Bishop_White.gltf',
//   b: 'assets/LP Bishop_Black.gltf',
//   K: 'assets/LP King_White.gltf',
//   k: 'assets/LP King_Black.gltf',
//   N: 'assets/LP Knight_White.gltf',
//   n: 'assets/LP Knight_Black.gltf',
//   P: 'assets/LP Pawn_White.gltf',
//   p: 'assets/LP Pawn_Black.gltf',
//   Q: 'assets/LP Queen_White.gltf',
//   q: 'assets/LP Queen_Black.gltf',
//   R: 'assets/LP Rook_White.gltf',
//   r: 'assets/LP Rook_Black.gltf'
// }


export interface ITileProps 
{
  id: string,
  position: Vector3Component,
  value: number
}
export const Tile = (props: ITileProps) => {
  return <entity
    key={props.id}
    position={props.position}
    transition={
      {position: { duration: 300, timing: 'linear' }}
      }
    >
      <box 
        key={props.id}      
        color={445643}       
      />
      <text
          key={props.id}
          value={ props.value.toString()}
          position={{ x:0, y: 0, z: -1}}
        />
  </entity>
}



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