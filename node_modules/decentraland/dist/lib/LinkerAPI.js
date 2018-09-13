"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const https = require("https");
const events_1 = require("events");
const urlParse = require("url");
const express = require("express");
const portfinder = require("portfinder");
/**
 * Events emitted by this class:
 *
 * link:ready   - The server is up and running
 * link:success - The IPNS hash was successfully submitted to the blockchain
 * link:error   - The transaction failed and the server was closed
 */
class LinkerAPI extends events_1.EventEmitter {
    constructor(project, landRegistryContract, manaTokenContract) {
        super();
        this.app = express();
        this.project = project;
        this.landContract = landRegistryContract;
        this.manaContract = manaTokenContract;
    }
    link(port, isHttps) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let resolvedPort = port;
            if (!resolvedPort) {
                try {
                    resolvedPort = yield portfinder.getPortPromise();
                }
                catch (e) {
                    resolvedPort = 4044;
                }
            }
            const url = `${isHttps ? 'https' : 'http'}://localhost:${resolvedPort}/linker`;
            this.setRoutes();
            this.on('link:error', err => {
                reject(err);
            });
            const serverHandler = () => this.emit('link:ready', url);
            const eventHandler = () => (e) => {
                if (e.errno === 'EADDRINUSE') {
                    reject(new Error(`Port ${resolvedPort} is already in use by another process`));
                }
                else {
                    reject(new Error(`Failed to start Linker App: ${e.message}`));
                }
            };
            if (isHttps) {
                const privateKey = yield fs.readFile(path.resolve(__dirname, '../certs/localhost.key'), 'utf-8');
                const certificate = yield fs.readFile(path.resolve(__dirname, '../certs/localhost.crt'), 'utf-8');
                const credentials = { key: privateKey, cert: certificate };
                const httpsServer = https.createServer(credentials, this.app);
                httpsServer.listen(resolvedPort, serverHandler).on('error', eventHandler);
            }
            else {
                this.app.listen(resolvedPort, serverHandler).on('error', eventHandler);
            }
        }));
    }
    setRoutes() {
        this.app.get('/linker.js', (req, res) => {
            res.sendFile(path.resolve(__dirname, '../../linker-app/build/src/index.js'));
        });
        this.app.get('/linker', (req, res) => __awaiter(this, void 0, void 0, function* () {
            res.writeHead(200, 'OK', { 'Content-Type': 'text/html' });
            const baseParcel = yield this.project.getParcelCoordinates();
            const parcels = yield this.project.getParcels();
            const owner = yield this.project.getOwner();
            const { ipfsKey } = yield this.project.getProjectFile();
            res.write(`
        <head>
          <title>Link scene</title>
          <meta charset="utf-8">
          <link href="https://ui.decentraland.org/styles.css" rel="stylesheet" />
          <link href="https://ui.decentraland.org/dark-theme.css" rel="stylesheet" />
        </head>
        <body>
          <div id="main">
            <script src="linker.js" env=${process.env.DCL_ENV} mana-contract=${this.manaContract} land-contract=${this.landContract} base-parcel=${JSON.stringify(baseParcel)} parcels=${JSON.stringify(parcels)} owner=${owner} ipfs-key=${ipfsKey}></script>
          </div>
        </body>
      `);
            res.end();
        }));
        this.app.get('/api/close', (req, res) => {
            res.writeHead(200);
            res.end();
            const { ok, reason } = urlParse.parse(req.url, true).query;
            if (ok === 'true') {
                this.emit('link:success');
            }
            if (process.env.DEBUG) {
                return;
            }
            // we can't throw an error for this one, koa will handle and log it
            this.emit('link:error', new Error(`Failed to link: ${reason}`));
        });
    }
}
exports.LinkerAPI = LinkerAPI;
