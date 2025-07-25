import { Application } from "egg";
import { FlowCalculator } from "./FlowCaculator";
import { TokenBucketBase } from "./TokenBucketBase";

export class TokenBucketByRedisImpl extends TokenBucketBase implements FlowCalculator {
  private keyUrl: string;

  private redis: any;

  private process_num: number;

  /**
   * 
   * @param interval 时间窗大小，默认1s
   * @param threshold 桶内允许最大令牌数
   * @param app 
   * @param keyUrl 
   */
  constructor(interval: number = 1, threshold: number, app: Application, keyUrl: string) {
    super(interval, threshold, app);

    this.process_num = 1;
    if (app.workers && typeof app.workers === 'number') {
      this.process_num = app.workers;
    }
    this.threshold = threshold;

    const { redisInstanceId } = app.config.spyInfo;
    this.keyUrl = keyUrl;
    if (!app.redis) {
      this.app.logger.error('[egg-rate-limit] error: no redis in app');
    } else {
      if (redisInstanceId) {
        this.redis = app.redis.get(redisInstanceId);
      } else {
        this.redis = app.redis;
      }
    }
  }

  /**
   * 该请求是否超过流量
   * @returns 
   */
  public async isOverFlow(): Promise<boolean> {
    const script = this.app.luaScripts;
    if (!script || !this.redis) {
      this.app.logger.error('[egg-rate-limit] error: no redis in ap or lua script');
      return false;
    }

    if (!this.app.luaSha) {
      try {
        const sha1 = await this.redis.script('load', script);
        this.app.luaSha = sha1;
      } catch (e) {
        this.app.logger.error('[egg-rate-limit] load redis script error');
      }
    }

    const now = Date.now();
    this.threshold = this.refreshDynamicThreshold(this.threshold);

    const args = [1, this.keyUrl, now, this.threshold * this.process_num, this.interval];

    let result;
    try {
      if (this.app.luaSha) {
        result = await this.redis.evalsha(this.app.luaSha, ...args);
      } else {
        result = await this.redis.eval(script, ...args);
      }

      return Boolean(result);
    } catch (e) {
      this.app.logger.error('[egg-rate-limit] eval exception in redis');
      return false;
    }
  }

  /**
   * 返回已经使用的令牌数，请求来后立即调用，否则无效
   * @returns 
   */
  public async getUsedNum(): Promise<number> {
    if (this.threshold === 0 || !this.redis) {
      return 0;
    }

    try {
      const avaNumStr = await this.redis.hmget(this.keyUrl, 'avaNum');
      const avaNum = parseInt(avaNumStr, 10);
      return 1 - avaNum / this.threshold / this.process_num;
    } catch (e) {
      this.app.logger.error('[egg-rate-limit] error: redis get avaNum exception ');
      return 0;
    }
  }
}