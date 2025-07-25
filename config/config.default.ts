import { EggAppConfig, PowerPartial } from 'egg';
import path from 'path';

export default () => {
  const config = {} as PowerPartial<EggAppConfig>;

  config.spyInfo = {
    useRedis: false, // true表示启用redist，否则使用内存
    // redisInstanceId: 0, // 如果时多redis模式，选择其中一个实例
    // workers: 3, // service 的数量
  }

  config.spyFile = path.join(__dirname, './olc.json');

  return {
    ...config
  }
}