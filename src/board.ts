
const BoardSize = 4;

const fourProbability = 0.1;

const deltaX = [-1, 0, 1, 0];
const deltaY = [0, -1, 0, 1];


var rotateLeft = function (matrix) {
  var rows = matrix.length;
  var columns = matrix[0].length;
  var res: any = [];
  for (var row = 0; row < rows; ++row) {
    res.push([]);
    for (var column = 0; column < columns; ++column) {
      res[row][column] = matrix[column][columns - row - 1];
    }
  }
  return res;
};

var mergeTiles = async function (old: Tile, target: Tile){
  await sleep(250)
  old.mergedInto = target;
}

export function sleep(ms: number = 0) {
  return new Promise(r => setTimeout(r, ms));
}
   



let TileId: number = 0;

export class Tile {
  value: Number
  row: number
  column: number
  oldRow: number
  oldColumn: number
  markForDeletion: boolean
  mergedInto?: Tile 
  id: number

  constructor (value, row, column)  {
    this.value  =  value || 0;
    this.row = row || -1;
    this.column = column || -1;
    this.oldRow = -1;
    this.oldColumn = -1;
    this.markForDeletion = false;
    this.id = TileId++;
  }
  moveTo(row, column) {
    this.oldRow = this.row;
    this.oldColumn = this.column;
    this.row = row;
    this.column = column;
  }
  isNew() {
    return this.oldRow == -1 && !this.mergedInto;
  }
  hasMoved() {
    return (this.fromRow() != -1 && (this.fromRow() != this.toRow() || this.fromColumn() != this.toColumn())) ||
      this.mergedInto;
  }
  fromRow() {
    return this.mergedInto ? this.row : this.oldRow;
  }
  fromColumn() {
    return this.mergedInto ? this.column : this.oldColumn;
  }
  toRow() {
    return this.mergedInto ? this.mergedInto.row : this.row;
  }
  toColumn() {
    return this.mergedInto ? this.mergedInto.column : this.column;
  }
}








export class Board {
  tiles: Tile[]
  cells: Tile[][]
  won : boolean
  size: number
  fourProbability: number
  deltaX : number[]
  deltaY: number[]

  constructor() {
    this.tiles = [];
    this.cells = [];
    this.size = BoardSize;

    for (var i = 0; i < this.size; ++i) {
      this.cells[i] = [this.addTile(0,i,1), this.addTile(0,i,2), this.addTile(0,i,3), this.addTile(0,i,4)];
    }
    this.addRandomTile();
    this.setPositions();
    this.won = false;

    this.fourProbability = fourProbability;
    this.deltaX = deltaX;
    this.deltaY = deltaY;

  }
  addTile(value, row, column) {
    var res: Tile = new Tile(value, row, column);
    this.tiles.push(res);
    return res;
  }
  moveLeft() {
    var hasChanged: boolean = false;
    for (var row = 0; row < this.size; ++row) {
      var currentRow = this.cells[row].filter(tile => tile.value != 0);
      var resultRow: Tile[] = [];
      for (var target = 0; target < this.size; ++target) {
        var targetTile : any = currentRow.length ? currentRow.shift() : this.addTile(0,-1,-1);
        if (currentRow.length > 0 && currentRow[0].value == targetTile.value) {
          var tile1 : Tile = targetTile;
          targetTile = this.addTile(targetTile.value, targetTile.row, targetTile.column  );
          tile1.mergedInto = targetTile;
          var tile2 : any = currentRow.shift();
          tile2.row = tile1.row
          tile2.column = tile1.column
          mergeTiles(tile2, targetTile)
          targetTile.value += tile2.value;
        }
        resultRow[target] = targetTile;
        this.won = (targetTile.value == 2048? true : this.won);
        hasChanged = (targetTile.value != this.cells[row][target].value ? true: hasChanged);
      }
      this.cells[row] = resultRow;
    }
    return hasChanged;
  }

  setPositions() {
    this.cells.forEach((row, rowIndex) => {
      row.forEach((tile, columnIndex) => {
        tile.oldRow = tile.row;
        tile.oldColumn = tile.column;
        tile.row = rowIndex;
        tile.column = columnIndex;
        tile.markForDeletion = false;
      });
    });
  }
  addRandomTile() {
    var emptyCells: any[] = [];
    for (var r:number = 0; r < this.size; ++r) {
      for (var c:number = 0; c < this.size; ++c) {
        if (this.cells[r][c].value == 0) {
          emptyCells.push({ r: r, c: c });
        }
      }
    }
    var index = ~~(Math.random() * emptyCells.length);
    var cell = emptyCells[index];
    var newValue = Math.random() < this.fourProbability ? 4 : 2;
    console.log("new cell added, " + cell.r + " & " + cell.c)
    this.cells[cell.r][cell.c] = this.addTile(newValue, cell.r, cell.c);
    
  }
  move(direction) {
    // 0 -> left, 1 -> up, 2 -> right, 3 -> down
    this.clearOldTiles();
    for (var i : number = 0; i < direction; ++i) {
      this.cells = rotateLeft(this.cells);
    }
    var hasChanged = this.moveLeft();
    for (var i : number = direction; i < 4; ++i) {
      this.cells = rotateLeft(this.cells);
    }
    if (hasChanged) {
      this.addRandomTile();
    }
    this.setPositions();
    
    return this;
  }
  clearOldTiles() {
    this.tiles = this.tiles.filter(tile => tile.markForDeletion == false);
    this.tiles.forEach(tile => { tile.markForDeletion = true; });
  }
  hasWon() {
    return this.won;
  }
  hasLost() {
    var canMove: boolean = false;
    for (var row = 0; row < this.size; ++row) {
      for (var column = 0; column < this.size; ++column) {
        canMove = (this.cells[row][column].value == 0? true : canMove);
        for (var dir = 0; dir < 4; ++dir) {
          var newRow = row + this.deltaX[dir];
          var newColumn = column + this.deltaY[dir];
          if (newRow < 0 || newRow >= this.size || newColumn < 0 || newColumn >= this.size) {
            continue;
          }
          canMove = (this.cells[row][column].value == this.cells[newRow][newColumn].value? true: canMove)
        }
      }
    }
    return !canMove;
  }
}




