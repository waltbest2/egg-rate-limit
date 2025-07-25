import { Application } from "egg";
import path from "path";
import fs from 'fs';
import { SpyRegister } from "./app/lib/tools/SpyRegister";
import { InterfaceMonitor } from "./app/lib/tools/InterfaceMonitor";

export default class AppBookHook {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
    this.app.logger.info('[egg-rate-limit] start to init app');
    this.app.itfSpyList = {};
    this.app.reqSpyList = {};
    this.app.spyEvents = [];
    this.app.reqFlowInfo = {};
  }

  async configWillLoad() {
    this.app.logger.info('[egg-rate-limit] app configWillLoad');
    const index = this.app.config.coreMiddleware.indexOf('accesslog');
    if (index === -1) {
      this.app.config.coreMiddleware.unshift('requestMonitor');
    } else {
      this.app.config.coreMiddleware.splice(index + 1, 0, 'requestMonitor');
    }
  }

  async beforeStart() {
    this.app.logger.info('[egg-rate-limit] app beforeStart');
  }

  async didLoad() {
    this.app.logger.info('[egg-rate-limit] app didLoad');
  }

  async willReady() {
    this.calcWorkers();
    this.app.logger.info('[egg-rate-limit] app willReady');
  }

  async didReady() {
    const lua = this.loadLua();
    if (lua) {
      this.app.luaScripts = lua;
    }

    const register = new SpyRegister(this.app);
    register.init();

    const interfaceMonitor: InterfaceMonitor = new InterfaceMonitor(this.app);
    interfaceMonitor.start();
  }

  async serverDidReady() {
    this.app.logger.info('[egg-rate-limit] app serverDidReady');
  }

  async beforeClose() {
    this.app.logger.info('[egg-rate-limit] app beforeClose');
  }

  private loadLua() {
    const { useRedis } = this.app.config.spyInfo;
    if (!useRedis) {
      return '';
    }

    const luaFile = path.join(__dirname, './app/lib/lua-scripts/token-bucket.lua');

    if (!fs.existsSync(luaFile)) {
      return '';
    }

    return fs.readFileSync(luaFile, { encoding: 'utf-8'});
  }

  private calcWorkers() {
    let { workers } = this.app.config.spyInfo;

    try {
      const processWorkers = JSON.parse(process.argv[2])['workers'];
      if (typeof processWorkers === 'number') {
        workers = processWorkers;
      }
    } catch(e) {
      this.app.logger.error('[egg-rate-limit] get worker number from process error', e.message);
    }

    this.app.workers = workers;
  }
}