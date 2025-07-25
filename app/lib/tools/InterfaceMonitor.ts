import { Application } from 'egg';
import { FlowInfo } from '../../types/FlowInfo';

export class InterfaceMonitor {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  start() {
    const { itfSpyList } = this.app;
    this.listenRequest(itfSpyList);
    this.listenResponse(itfSpyList);
  }

  private handleFlow(reqTime: number, interval: number) {
    return Math.floor(reqTime / 1000 / interval);
  }

  private listenResponse(itfSpyList: any) {
    this.app.httpclient.on('response', result => {
      const { ctx, req } = result;
      if (!ctx || !req) {
        return;
      }

      const { args } = req;
      const path = args.reqPath;
      if (!itfSpyList[path]) {
        return;
      }

      const { respTime, interval } = itfSpyList[path];
      const timeUsed = Date.now() - args.reqTime;
      if (timeUsed <= respTime) {
        return;
      }

      const time = this.handleFlow(args.reqTime, interval);
      const flowInfo: FlowInfo = itfSpyList[path].flowInfo;
      if (flowInfo.threshold === time) {
        flowInfo.flowNumber++;
      } else {
        flowInfo.threshold = time;
        flowInfo.flowNumber = 1;
      }
    });
  }

  private listenRequest(itfSpyList: any) {
    this.app.httpclient.on('request', req => {
      const { ctx, args, url } = req;
      if (!ctx || !args || !url) {
        return;
      }

      const indexParam = url.indexOf('?');
      const indexDomain = url.indexOf('//');
      let path = '';
      if (indexParam > -1) {
        path = url.substring(url.indexOf('/', indexDomain + 1), indexParam);
      } else {
        path = url.substring(url.indexOf('/', indexDomain + 1));
      }

      if (!path || !itfSpyList[path]) {
        return;
      }

      args.reqPath = path;
      args.reqTime = Date.now();

      const { interval, callback, threshold } = itfSpyList[path];
      const time = this.handleFlow(args.reqTime, interval);
      itfSpyList[path].flowInfo = itfSpyList[path].flowInfo || {
        threshold: time,
        flowNumber: 1,
      };

      const flowInfo: FlowInfo = itfSpyList[path].flowInfo;
      if (flowInfo.threshold === time && flowInfo.flowNumber > threshold) {
        callback(flowInfo, req);
      }
    });
  }
}