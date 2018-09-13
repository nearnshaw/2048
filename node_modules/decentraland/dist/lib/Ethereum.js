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
const fetch = require("isomorphic-fetch");
const CSV = require("comma-separated-values");
const eth_connect_1 = require("eth-connect");
const env_1 = require("../utils/env");
const errors_1 = require("../utils/errors");
const coordinateHelpers_1 = require("../utils/coordinateHelpers");
const { abi } = require('../../abi/LANDRegistry.json');
const provider = process.env.RPC_URL || (env_1.isDev ? 'https://ropsten.infura.io/' : 'https://mainnet.infura.io/');
const requestManager = new eth_connect_1.RequestManager(new eth_connect_1.providers.HTTPProvider(provider));
const factory = new eth_connect_1.ContractFactory(requestManager, abi);
exports.landContract = factory.at(env_1.isDev ? '0x7a73483784ab79257bb11b96fd62a2c3ae4fb75b' : '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d');
/**
 * Events emitted by this class:
 *
 * ethereum:get-ipns         - An attempt to load landData from the ethereum blockchain
 * ethereum:get-ipns-empty   - No IPNS was found on the blockchain
 * ethereum:get-ipns-success - Successfully fetched and parsed landData
 */
class Ethereum extends events_1.EventEmitter {
    static getDclContracts() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dclContracts) {
                return this.dclContracts;
            }
            const raw = yield fetch('https://contracts.decentraland.org/addresses.json');
            this.dclContracts = yield raw.json();
            return this.dclContracts;
        });
    }
    static getLandContractAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            const envContract = process.env.LAND_REGISTRY_CONTRACT_ADDRESS;
            if (envContract) {
                return envContract;
            }
            try {
                const data = yield this.getDclContracts();
                if (env_1.isDev) {
                    return data.ropsten.LANDProxy;
                }
                else {
                    return data.mainnet.LANDProxy;
                }
            }
            catch (error) {
                errors_1.fail(errors_1.ErrorType.ETHEREUM_ERROR, `Unable to fetch land contract: ${error.message}`);
            }
        });
    }
    static getManaContractAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            const envContract = process.env.MANA_TOKEN_CONTRACT_ADDRESS;
            if (envContract) {
                return envContract;
            }
            try {
                const data = yield this.getDclContracts();
                if (env_1.isDev) {
                    return data.ropsten.MANAToken;
                }
                else {
                    return data.mainnet.MANAToken;
                }
            }
            catch (error) {
                errors_1.fail(errors_1.ErrorType.ETHEREUM_ERROR, `Unable to fetch mana contract: ${error.message}`);
            }
        });
    }
    getLandOf(address) {
        return __awaiter(this, void 0, void 0, function* () {
            let res;
            try {
                const contract = yield exports.landContract;
                const [x, y] = yield contract['landOf'](address.toUpperCase());
                res = x.map(($, i) => ({ x: $.toNumber(), y: y[i].toNumber() }));
            }
            catch (e) {
                errors_1.fail(errors_1.ErrorType.ETHEREUM_ERROR, `Unable to fetch LANDs: ${e.message}`);
            }
            return res;
        });
    }
    getLandData(x, y) {
        return __awaiter(this, void 0, void 0, function* () {
            let landData;
            try {
                const contract = yield exports.landContract;
                landData = yield contract['landData'](x, y);
            }
            catch (e) {
                errors_1.fail(errors_1.ErrorType.ETHEREUM_ERROR, `Unable to fetch LAND data: ${e.message}`);
            }
            return this.decodeLandData(landData);
        });
    }
    getLandOwner(x, y) {
        return __awaiter(this, void 0, void 0, function* () {
            let owner;
            try {
                const contract = yield exports.landContract;
                owner = yield contract['ownerOfLand'](x, y);
            }
            catch (e) {
                errors_1.fail(errors_1.ErrorType.ETHEREUM_ERROR, `Unable to fetch LAND owner: ${e.message}`);
            }
            return owner;
        });
    }
    getLandOperator(x, y) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const contract = yield exports.landContract;
                const assetId = yield contract['encodeTokenId'](x, y);
                return yield contract['updateOperator'](assetId);
            }
            catch (e) {
                errors_1.fail(errors_1.ErrorType.ETHEREUM_ERROR, `Unable to fetch LAND operator: ${e.message}`);
            }
        });
    }
    /**
     * It fails if the owner address isn't able to update given parcels (as an owner or operator)
     */
    validateAuthorization(owner, parcels) {
        return __awaiter(this, void 0, void 0, function* () {
            const sParcels = parcels.map(coordinateHelpers_1.getString);
            const ownerParcels = new Set((yield this.getLandOf(owner)).map(coordinateHelpers_1.getString));
            const invalidParcels = sParcels.filter(parcel => !ownerParcels.has(parcel));
            const pParcels = invalidParcels.map((sParcel) => __awaiter(this, void 0, void 0, function* () {
                const { x, y } = coordinateHelpers_1.getObject(sParcel);
                return { x, y, operator: yield this.getLandOperator(x, y) };
            }));
            const operatorParcels = yield Promise.all(pParcels);
            operatorParcels.forEach(({ x, y, operator }) => {
                if (operator !== owner) {
                    errors_1.fail(errors_1.ErrorType.ETHEREUM_ERROR, `Provided address ${owner} is not authorized to update LAND ${x},${y}`);
                }
            });
        });
    }
    /**
     * Queries the Blockchain and returns the IPNS return by `landData`
     * @param coordinates An object containing the base X and Y coordinates for the parcel.
     */
    getIPNS(x, y) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit('ethereum:get-ipns', x, y);
            const landData = yield this.getLandData(x, y);
            if (!landData || !landData.ipns) {
                this.emit('ethereum:get-ipns-empty');
                return null;
            }
            this.emit('ethereum:get-ipns-success');
            return landData.ipns.replace('ipns:', '');
        });
    }
    decodeLandData(data = '') {
        // this logic can also be found in decentraland-eth, but we can't rely on node-hid
        const version = data.charAt(0);
        switch (version) {
            case '0': {
                const [, name, description, ipns] = CSV.parse(data)[0];
                return { version: 0, name: name || null, description: description || null, ipns: ipns || null };
            }
            default:
                return null;
        }
    }
}
exports.Ethereum = Ethereum;
