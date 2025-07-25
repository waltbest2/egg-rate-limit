import { SpyEventType } from './SpyEventType';

export interface SpyEvent {
  /**
   * 事件名称，全局唯一
   */
  eventName: string;

  /**
   * 事件类型
   */
  eventType: SpyEventType;

  /**
   * 触发回调事件
   * callback(e) e: 将event的信息传递给回调函数
   */
  callback: Function;
}