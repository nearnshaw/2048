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
const events_1 = require("events");
const IPFS_1 = require("./IPFS");
const Project_1 = require("./Project");
const Ethereum_1 = require("./Ethereum");
const events = require("wildcards");
const project_1 = require("../utils/project");
const LinkerAPI_1 = require("./LinkerAPI");
const Preview_1 = require("./Preview");
const errors_1 = require("../utils/errors");
class Decentraland extends events_1.EventEmitter {
    constructor(args = {}) {
        super();
        this.options = {};
        this.options = args;
        this.options.workingDir = args.workingDir || project_1.getRootPath();
        this.localIPFS = new IPFS_1.IPFS(args.ipfsHost, args.ipfsPort);
        this.project = new Project_1.Project(this.options.workingDir);
        this.ethereum = new Ethereum_1.Ethereum();
        // Pipe all events
        events(this.localIPFS, 'ipfs:*', this.pipeEvents.bind(this));
        events(this.ethereum, 'ethereum:*', this.pipeEvents.bind(this));
    }
    init(sceneMeta, boilerplateType, websocketServer) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.project.writeDclIgnore();
            yield this.project.initProject();
            yield this.project.writeSceneFile(sceneMeta);
            yield this.project.scaffoldProject(boilerplateType, websocketServer);
        });
    }
    deploy(files) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.project.validateParcelOptions();
            yield this.validateOwnership();
            const { x, y } = yield this.project.getParcelCoordinates();
            const projectFile = yield this.project.getProjectFile();
            const filesAdded = yield this.localIPFS.addFiles(files);
            const rootFolder = filesAdded[filesAdded.length - 1];
            const ipns = yield this.ethereum.getIPNS(x, y);
            let ipfsKey = projectFile.ipfsKey;
            if (!ipfsKey) {
                ipfsKey = yield this.localIPFS.genIPFSKey(projectFile.id);
                yield this.project.writeProjectFile({
                    ipfsKey
                });
                this.localIPFS.genKeySuccess();
            }
            yield this.localIPFS.publish(projectFile.id, `/ipfs/${rootFolder.hash}`);
            if (ipfsKey !== ipns) {
                try {
                    yield this.link();
                }
                catch (e) {
                    errors_1.fail(errors_1.ErrorType.LINKER_ERROR, e.message);
                }
            }
            yield this.pin(rootFolder.hash);
        });
    }
    link() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.project.validateExistingProject();
            yield this.project.validateParcelOptions();
            yield this.validateOwnership();
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const landContract = yield Ethereum_1.Ethereum.getLandContractAddress();
                const manaContract = yield Ethereum_1.Ethereum.getManaContractAddress();
                const linker = new LinkerAPI_1.LinkerAPI(this.project, landContract, manaContract);
                events(linker, '*', this.pipeEvents.bind(this));
                linker.on('link:success', () => __awaiter(this, void 0, void 0, function* () {
                    resolve();
                }));
                try {
                    yield linker.link(this.options.linkerPort, this.options.isHttps);
                }
                catch (e) {
                    reject(e);
                }
            }));
        });
    }
    pin(ipfsHash) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.project.validateExistingProject();
            const coords = yield this.project.getParcelCoordinates();
            const peerId = yield this.localIPFS.getPeerId();
            yield this.localIPFS.pinFiles(peerId, coords, ipfsHash);
        });
    }
    preview() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.project.validateExistingProject();
            yield this.project.validateParcelOptions();
            const preview = new Preview_1.Preview(yield this.project.getDCLIgnore(), this.getWatch());
            events(preview, '*', this.pipeEvents.bind(this));
            yield preview.startServer(this.options.previewPort);
        });
    }
    getAddressInfo(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const coords = yield this.ethereum.getLandOf(address);
            const info = coords.map((coord) => __awaiter(this, void 0, void 0, function* () {
                const data = yield this.ethereum.getLandData(coord.x, coord.y);
                return {
                    x: coord.x,
                    y: coord.y,
                    name: data ? data.name : '',
                    description: data ? data.description : '',
                    ipns: data ? data.ipns : ''
                };
            }));
            return Promise.all(info);
        });
    }
    getWatch() {
        return !!this.options.watch;
    }
    getProjectInfo(x, y) {
        return __awaiter(this, void 0, void 0, function* () {
            const scene = yield this.project.getSceneFile();
            const land = yield this.ethereum.getLandData(x, y);
            const owner = yield this.ethereum.getLandOwner(x, y);
            return { scene, land: Object.assign({}, land, { owner }) };
        });
    }
    getParcelInfo(x, y) {
        return __awaiter(this, void 0, void 0, function* () {
            const scene = yield this.localIPFS.getRemoteSceneMetadata(x, y);
            const land = yield this.ethereum.getLandData(x, y);
            const owner = yield this.ethereum.getLandOwner(x, y);
            return { scene, land: Object.assign({}, land, { owner }) };
        });
    }
    getParcelStatus(x, y) {
        return __awaiter(this, void 0, void 0, function* () {
            const { url } = yield this.localIPFS.resolveParcel(x, y);
            if (!url)
                return { files: [] };
            const result = {
                files: url.dependencies
            };
            if (url.lastModified) {
                // only available in redis metadata >= 2
                result.lastModified = url.lastModified;
            }
            return result;
        });
    }
    pipeEvents(event, ...args) {
        this.emit(event, ...args);
    }
    validateOwnership() {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = yield this.project.getOwner();
            const parcels = yield this.project.getParcels();
            yield this.ethereum.validateAuthorization(owner, parcels);
        });
    }
}
exports.Decentraland = Decentraland;
