import { Application } from 'egg';
import { ResourceInfo } from '../../types/ResourceInfo';
import { DynamicDecision } from '../strategy/DynamicDecision';

export abstract class TokenBucketBase {
  /**
   * 和流控相关的元数据
   */
  protected metaData: any;

  constructor(protected interval: number = 1, protected threshold: number, protected app: Application) {

  }

  public setMetaData(metaData: any) {
    this.metaData = metaData;
  }

  public getMetaData() {
    return this.metaData;
  }

  public getThreshold(): number {
    return this.threshold;
  }

  protected refreshDynamicThreshold(threshold: number): number {
    if (!this.metaData.dynamic) {
      return threshold;
    }

    // 处理动态数据
    const { type, data } = this.metaData.dynamic;
    const resourceInfo: ResourceInfo = {
      type,
      ...data,
    }
    const resourceValue = this.metaData.sysinfo && this.metaData.sysinfo[type];
    const newThreshold = DynamicDecision.makeDecision(threshold, resourceInfo, resourceValue);
    if (newThreshold > 0 && threshold !== newThreshold) {
      this.app.logger.info(`[egg-rate-limit] change Threshold from ${this.threshold} to ${newThreshold}`);
      return newThreshold;
    }

    return threshold;
  }
}