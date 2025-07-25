export interface FlowCalculator {
  /**
   * 判断该次请求是否流控，返回 true 流控；返回 false 放通
   */
  isOverFlow(): boolean | Promise<boolean>;

  /**
   * 获取1s内使用令牌数，请求来后立即调用，否则无效
   */
  getUsedNum(): number | Promise<number>;

  /**
   * 设置元数据
   * @param metaData 
   */
  setMetaData(metaData: any): void;

  /**
   * 获取元数据
   */
  getMetaData(): any;

  /**
   * 获取当前最新的阈值
   */
  getThreshold(): number;
}