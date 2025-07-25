import * as fs from 'fs';
import { SpyEventType } from '../../types/SpyEventType';
import { Application } from 'egg';

export class SpyRegister {
  private app: Application;
  private itfSpyList;
  private reqSpyList;
  private spyEvents;
  private spyConfig;

  constructor(app: Application) {
    this.app = app;
    const { itfSpyList, reqSpyList, spyEvents, config } = this.app;
    this.itfSpyList = itfSpyList;
    this.reqSpyList = reqSpyList;
    this.spyEvents = spyEvents;
    this.spyConfig = this.parseConfig(config);
  }

  public init() {
    this.app.logger.info('[egg-rate-limit] app didReady');

    if (!this.spyConfig) {
      return;
    }

    const handle = {
      REQ: this.handleREQ,
      ITF: this.handleITF,
    }

    this.spyEvents.push(this.registerCallback('ITF'));
    this.spyEvents.push(this.registerCallback('REQ'));

    for (const spyEvent of this.spyEvents) {
      const { eventType, callback }: {eventType: SpyEventType; callback: Function} = spyEvent;
      if (handle[eventType.key]) {
        handle[eventType.key].call(this, eventType, callback);
      }
    }
  }

  private parseConfig(config) {
    if (config.spy) {
      this.spyConfig = config.spy;
    } else if (fs.existsSync(config.spyFile)) {
      const olc = fs.readFileSync(config.spyFile);
      this.spyConfig = JSON.parse(olc.toString());
    }
  }


  private singleREQ(v, callback) {
    const { url, ...extInfo } = v;

    if (!url.length) {
      return;
    }

    for (const u of url) {
      if (u) {
        this.reqSpyList[u] = {
          url: u,
          ...extInfo,
          callback,
        };
      }
    }
  }

  private singleITF(v, callback) {
    const { url, ...extInfo } = v;

    if (!url.length) {
      return;
    }

    for (const u of url) {
      if (u) {
        this.itfSpyList[u] = {
          url: u,
          ...extInfo,
          callback,
        };
      }
    }
  }

  private handleREQ(eventType, callback) {
    if (!eventType.value) {
      return;
    }

    const { length } = eventType.value;
    if (length) {
      for (const element of eventType.value) {
        this.singleREQ(element, callback);
      }
    } else {
      this.singleREQ(eventType.value, callback);
    }
  }

  private handleITF(eventType, callback) {
    if (!eventType.value) {
      return;
    }

    const { length } = eventType.value;
    if (length) {
      for (const element of eventType.value) {
        this.singleITF(element, callback);
      }
    } else {
      this.singleITF(eventType.value, callback);
    }
  }

  private registerCallback(type) {
    const that = this;
    const event = {
      ITF: {
        eventName: 'InnerITF',
        eventType: {
          key: 'ITF',
          value: that.spyConfig.ITF,
        },
        callback(flowInfo, req) {
          const [ safeUrl ] = req.url?.split('?') || [];
          that.app.logger.error(`[egg-rate-limit] south request in flow control. url is ${safeUrl}`);
          throw new Error(`%terminate call interface% ${req.url}, ${flowInfo.flowNumber}`);
        },
      },
      REQ: {
        eventName: 'InnerREQ',
        eventType: {
          key: 'REQ',
          value: that.spyConfig.REQ,
        },
        callback(flowInfo, ctx) {
          const [ safeUrl ] = ctx.request.url?.split('?') || [];
          that.app.logger.error(`[egg-rate-limit] north request in flow control. url is ${safeUrl}, flowNumber: ${flowInfo.flowNumber}`);
          ctx.response.status = 429;
          ctx.body = {
            ret_code: -1,
            ret_msg: `Over flow control, ${flowInfo.flowNumber}`,
          };
        },
      }
    }

    return event[type];
  }
}