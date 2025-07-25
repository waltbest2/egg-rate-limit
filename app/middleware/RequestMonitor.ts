import { FlowCalculator } from "../lib/algorithm/FlowCaculator";
import { TokenBucketByRedisImpl } from "../lib/algorithm/TokenBucketByRedisImpl";
import { TokenBucketImpl } from "../lib/algorithm/TokenBucketImpl";
import { Threshold } from "../lib/strategy/Threshold";
import { checkUrl } from "../lib/tools/checkUrl";
import { Constant } from "../types/Constant";

export default () => {
  return async (ctx, next) => {
    const { app, request, host } = ctx;
    const { reqSpyList, reqFlowInfo } = app;
    let { url } = request;
    const ii = url.indexOf('?');
    if (ii > -1) {
      url = url.substring(0, ii);
    }

    const info: any = checkUrl(url, reqSpyList, host);

    if (!info) {
      await next();
      return;
    }

    const reqSpyObj = reqSpyList[info];

    const {
      interval,
      callback,
      threshold,
      alarm,
      dynamic,
    } = reqSpyObj;

    let key = url;
    if (info[0] === Constant.CATEGORY_PREFIX) {
      key = info;
    }

    if (!reqFlowInfo[key]) {
      const { useRedis } = app.config.spyInfo;
      if (useRedis) {
        const podName = process.env.HOSTNAME;
        let newKey = key;
        if (podName) {
          const pods = podName.split('-');
          newKey = pods[0] + '-' + (pods[2] || '') + ':' + key;
        }
        reqFlowInfo[key] = new TokenBucketByRedisImpl(interval, threshold, app, newKey);
      } else {
        reqFlowInfo[key] = new TokenBucketImpl(interval, threshold, app);
      }

      const metaData = {
        dynamic,
        sysinfo: app.sysinfo,
      }

      reqFlowInfo[key].setMetaData(metaData);
    }

    const flowCalc: FlowCalculator = reqFlowInfo[key];
    const isOverFlow = await flowCalc.isOverFlow();

    // 流控触发回调
    if (isOverFlow) {
      const threshold = await flowCalc.getThreshold();
      callback({
        flowNumber: threshold,
      }, ctx);

      return;
    }

    // 判断是否需要告警
    await Threshold.checkThresholdWarn(flowCalc, app.logger, alarm, url);

    await next();

  }
}