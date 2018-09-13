"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Check if CLI is used in development mode.
 */
exports.isDev = process.env.DCL_ENV === 'dev';
