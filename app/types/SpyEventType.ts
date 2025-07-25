export interface SpyEventType {
  /**
   * 北向请求，cpu占用率，内存占用率，南向接口
   */
  key: 'REQ' | 'CPU' | 'MEM' | 'ITF';

  /**
   * 北向请求：平均响应时间，CPU，MEM：门限制，南向接口：响应时间
   */
  value: {
    /**
     * 监控的url列表
     */
    url?: string[],

    /**
     * 响应时间门限制
     */
    respTime?: number,

    /**
     * cpu占用率
     */
    cpu?: number,

    /**
     * 内存占用率
     */
    mem?: number,

    /**
     * 时间间隔 10s
     */
    interval?: number,

    /**
     * 超过门限制的次数
     */
    threshold?: number,
  }
}