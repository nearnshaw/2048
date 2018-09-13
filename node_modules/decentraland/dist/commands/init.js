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
const inquirer = require("inquirer");
const wrapCommand_1 = require("../utils/wrapCommand");
const moduleHelpers_1 = require("../utils/moduleHelpers");
const Project_1 = require("../lib/Project");
const analytics_1 = require("../utils/analytics");
const logging_1 = require("../utils/logging");
const Decentraland_1 = require("../lib/Decentraland");
const errors_1 = require("../utils/errors");
const Coordinates = require("../utils/coordinateHelpers");
function init(vorpal) {
    vorpal
        .command('init')
        .description('Generates new Decentraland scene.')
        .option('--path <path>', 'output path (default is the current working directory).')
        .option('--boilerplate', 'static, singleplayer or multiplayer')
        .action(wrapCommand_1.wrapCommand((args) => __awaiter(this, void 0, void 0, function* () {
        const dcl = new Decentraland_1.Decentraland({
            workingDir: args.options.path
        });
        yield dcl.project.validateNewProject();
        const isEmpty = yield dcl.project.isProjectDirEmpty();
        if (!isEmpty) {
            const results = yield inquirer.prompt({
                type: 'confirm',
                name: 'continue',
                message: logging_1.warning(`Project directory isn't empty. Do you want to continue?`)
            });
            if (!results.continue) {
                process.exit(0);
            }
        }
        const sceneMeta = yield inquirer.prompt([
            {
                type: 'input',
                name: 'display.title',
                message: 'Scene title: \n',
                default: dcl.project.getRandomName()
            },
            {
                type: 'input',
                name: 'owner',
                message: `${'Your ethereum address: '}\n${logging_1.comment('(optional, recommended -- used to check ownership of parcels when deploying your scene)')}\n`
            },
            {
                type: 'input',
                name: 'contact.name',
                message: `${'Your name: '}\n${logging_1.comment('(optional -- shown to other users so that they can contact you)')}\n`
            },
            {
                type: 'input',
                name: 'contact.email',
                message: `${'Your email: '}\n${logging_1.comment('(optional -- shown to other users so that they can contact you)')}\n`
            },
            {
                type: 'input',
                name: 'scene.parcels',
                message: `${'Parcels comprising the scene'}\n${logging_1.comment('(optional, recommended -- used to show the limts of your scene and upload to these coordinates)\nPlease use this format: `x,y; x,y; x,y ...`')}\n`,
                validate: Coordinates.validate
            }
        ]);
        sceneMeta.communications = {
            type: 'webrtc',
            signalling: 'https://rendezvous.decentraland.org'
        };
        sceneMeta.policy = {
            fly: true,
            voiceEnabled: true,
            blacklist: [],
            teleportPosition: '0,0,0'
        };
        sceneMeta.scene.parcels = sceneMeta.scene.parcels ? Coordinates.parse(sceneMeta.scene.parcels) : ['0,0'];
        sceneMeta.main = 'scene.xml'; // replaced by chosen template
        sceneMeta.scene.base = sceneMeta.scene.parcels[0];
        let boilerplateType = args.options.boilerplate;
        let websocketServer;
        if (args.options.boilerplate === undefined) {
            const results = yield inquirer.prompt({
                type: 'list',
                name: 'archetype',
                message: logging_1.warning('Which scene template would you like to generate?'),
                choices: [
                    { name: 'Basic', value: Project_1.BoilerplateType.TYPESCRIPT_STATIC },
                    { name: 'Interactive', value: Project_1.BoilerplateType.TYPESCRIPT_DYNAMIC },
                    { name: 'Remote', value: Project_1.BoilerplateType.WEBSOCKETS },
                    { name: 'Static', value: Project_1.BoilerplateType.STATIC }
                ],
                default: Project_1.BoilerplateType.TYPESCRIPT_STATIC
            });
            boilerplateType = results.archetype;
            if (boilerplateType === Project_1.BoilerplateType.WEBSOCKETS) {
                const ws = yield inquirer.prompt({
                    type: 'input',
                    name: 'server',
                    message: `Your websocket server`,
                    default: 'ws://localhost:8087'
                });
                websocketServer = ws.server;
            }
        }
        yield dcl.init(sceneMeta, boilerplateType, websocketServer);
        if (yield dcl.project.needsDependencies()) {
            if (yield moduleHelpers_1.isOnline()) {
                const spinner = logging_1.loading('Installing dependencies');
                yield moduleHelpers_1.installDependencies(true);
                spinner.succeed();
            }
            else {
                errors_1.fail(errors_1.ErrorType.PREVIEW_ERROR, 'Unable to install dependencies: no internet connection');
            }
        }
        analytics_1.Analytics.sceneCreated({ boilerplateType });
        vorpal.log(logging_1.positive(`\nSuccess! Run 'dcl start' to see your scene`));
    })));
}
exports.init = init;
