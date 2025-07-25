export interface FlowInfo {
  /**
   * 流控阈值
   */
  threshold: number; 

  /**
   * 固定时长的请求数量
   */
  flowNumber: number;
}