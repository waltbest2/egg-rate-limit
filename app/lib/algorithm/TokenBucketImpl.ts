import { Application } from "egg";
import { FlowCalculator } from "./FlowCaculator";
import { TokenBucketBase } from "./TokenBucketBase";

export class TokenBucketImpl extends TokenBucketBase implements FlowCalculator {
  /**
   * 可用令牌桶数量
   */
  private avaNum: number;

  /**
   * 最后一次请求的时间戳
   */
  private lastTimeStamp: number;

  /**
   * 补偿时间
   */
  private extraTime: number;

  constructor(interval: number = 1, threshold: number, app: Application) {
    super(interval, threshold, app);
    this.avaNum = 0;
    this.lastTimeStamp = 0;
    this.extraTime = 0;
  }

  public isOverFlow(): boolean  {
    // 刷新动态门限制
    this.threshold = this.refreshDynamicThreshold(this.threshold);

    const now = Date.now();
    const tempExtraTime = this.extraTime;
    let avaNum = this.avaNum;
    const lastTimeStamp = this.lastTimeStamp;
    const result = this.refreshAvailableBucket(now, avaNum, lastTimeStamp, tempExtraTime);

    // 令牌桶满了，没有可用令牌
    if (result.avaNum <= 0) {
      // 还原补偿时间
      this.extraTime = tempExtraTime;
      this.avaNum = 0;
      return true;
    }

    // 有可用令牌，则使用一个
    this.avaNum = result.avaNum - 1;
    this.extraTime = result.extraTime;
    this.lastTimeStamp = now;
    return false;
  }

  /**
   * 返回已经使用的令牌数，请求来后立即调用，否则无效
   * @returns 
   */
  public getUsedNum(): number {
    if (this.threshold === 0) {
      return 0;
    }

    return 1 - (this.avaNum / this.threshold);
  }

  private refreshAvailableBucket(
    timeStamp: number,
    lastAvaNum: number,
    lastTimeStamp: number,
    extraTime: number
  ): {avaNum: number, extraTime: number} {
    const time = timeStamp - lastTimeStamp;
    if (time <= 0) {
      return {
        avaNum: lastAvaNum,
        extraTime,
      }
    }

    let newThreshold = {
      extraTime: 0,
      avaNum: 0,
    };

    if (time >= this.interval * 1000) {
      return {
        avaNum: this.threshold,
        extraTime,
      }
    } else {
      newThreshold = this.getExtraThreshold(time, extraTime);
    }

    return {
      avaNum: Math.min(newThreshold.avaNum + lastAvaNum, this.threshold),
      extraTime: newThreshold.extraTime
    }
  }

  /**
   * 获取精确的桶次数，补偿
   * @param time 请求时间
   * @param extraTime 
   * @returns 
   */
  private getExtraThreshold(time: number, extraTime: number): {extraTime: number, avaNum: number} {
    const data = parseFloat((time / this.interval / 1000 * this.threshold).toFixed(16)) + extraTime;
    const result = Math.floor(data);

    const newExtraTime = parseFloat((data - result).toFixed(16));
    return {
      extraTime: newExtraTime,
      avaNum: result
    }
  }
}