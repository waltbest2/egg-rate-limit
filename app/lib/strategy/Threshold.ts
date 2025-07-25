import { FlowCalculator } from "../algorithm/FlowCaculator";

export class Threshold {

  static async checkThresholdWarn(flowCalc: FlowCalculator, logger: any, alarm: any, url: string) {
    if (!alarm || !alarm.threshold) {
      return;
    }

    const thresholds = alarm.threshold.split(',');
    const usedRate: number = await (<number>flowCalc.getUsedNum());

    let metaData = flowCalc.getMetaData() || {};

    // 记录是否有告警过
    metaData.alarmSwitch = metaData.alarmSwitch || {};

    for (let i = 0; i < thresholds.length; i++) {
      if (usedRate * 100 >= parseFloat(thresholds[i]) && !metaData.alarmSwitch[thresholds[i]]) {
        metaData.alarmSwitch[thresholds[i]] = true;
        const [safeUrl] = url?.split('?') || [];
        logger.warn(`[egg-rate-limit] RateLimiter exceed threshold [${thresholds[i]}%], url: ${safeUrl}`);
        break;
      }

      metaData.alarmSwitch[thresholds[i]] = false;
    }

    flowCalc.setMetaData(metaData);
  }
}