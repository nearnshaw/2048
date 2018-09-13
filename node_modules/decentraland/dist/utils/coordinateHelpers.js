"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns metaverse coordinates bounds.
 */
function getBounds() {
    return {
        minX: -150,
        minY: -150,
        maxX: 150,
        maxY: 150
    };
}
exports.getBounds = getBounds;
/**
 * Parses a string-based set of coordinates.
 * - All spaces are removed
 * - Leading zeroes are removed
 * - `-0` is converted to `0`
 * @param coordinates An string containing coordinates in the `x,y; x,y; ...` format
 */
function parse(coordinates) {
    return coordinates.split(';').map((coord) => {
        const [x = 0, y = 0] = coord.split(',').map($ => {
            return parseInt($, 10)
                .toString() // removes spaces :)
                .replace('-0', '0')
                .replace(/undefined|NaN/g, '0');
        });
        return `${x},${y}`;
    });
}
exports.parse = parse;
/**
 * Returns a promise that resolves `true` if the given set of coordinates is valid.
 * For invalid coordinates, the promise will reject with an error message.
 * *This is meant to be used as an inquirer validator.*
 *
 * Empty inputs will resolve `true`
 * @param answers An string containing coordinates in the `x,y; x,y; ...` format
 */
function validate(answers) {
    return new Promise((resolve, reject) => {
        if (answers.trim().length === 0) {
            resolve(true);
        }
        else {
            answers.split(/;\s/g).forEach(answer => {
                if (!isValid(answer)) {
                    reject(new Error(`Invalid coordinate ${answer}`));
                }
            });
            resolve(true);
        }
    });
}
exports.validate = validate;
/**
 * Returns true if the given coordinate's format is valid
 *
 * ```
 * isValid('0,0') // returns true
 * isValid(', 0') // returns false
 * ```
 * @param val The coodinate string
 */
function isValid(val) {
    if (!val.match(/^(-?\d)+\,(-?\d)+$/g)) {
        return false;
    }
    return true;
}
exports.isValid = isValid;
/**
 * Converts a string-based set of coordinates to an object
 * @param coords A string containing a set of coordinates
 */
function getObject(coords) {
    const parsed = parse(coords)[0];
    const [x, y] = parsed.split(',');
    return { x: parseInt(x, 10), y: parseInt(y, 10) };
}
exports.getObject = getObject;
/**
 * Converts a ICoords object to a string-based set of coordinates
 */
function getString({ x, y }) {
    return `${x},${y}`;
}
exports.getString = getString;
/**
 * Returns true if the given coordinates are in metaverse bounds
 */
function inBounds(x, y) {
    const { minX, minY, maxX, maxY } = getBounds();
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
}
exports.inBounds = inBounds;
/**
 * Returns true if the given parcels array are connected
 */
function areConnected(parcels) {
    if (parcels.length === 1) {
        return true;
    }
    return areConnectedRecursive(parcels);
}
exports.areConnected = areConnected;
function areConnectedRecursive(parcels, alreadyTraveled = [], stack = [...parcels]) {
    if (alreadyTraveled.length === parcels.length) {
        return true;
    }
    if (stack.length === 0) {
        return false;
    }
    const { x, y } = stack.pop();
    const neighbours = getAdjacentsFrom(x, y, parcels).filter(coords => {
        return parcels.some(coords2 => isEqual(coords, coords2)) && !alreadyTraveled.some(coords2 => isEqual(coords, coords2));
    });
    return areConnectedRecursive(parcels, [...alreadyTraveled, ...neighbours], stack);
}
function getAdjacentsFrom(x, y, parcels) {
    return parcels.filter(coords => isAdjacent(x, y, coords));
}
function isAdjacent(x, y, coords) {
    return (coords.x === x && (coords.y + 1 === y || coords.y - 1 === y)) || (coords.y === y && (coords.x + 1 === x || coords.x - 1 === x));
}
function isEqual(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
}
exports.isEqual = isEqual;
