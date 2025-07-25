import { Constant } from "../../types/Constant";

export function checkUrl(url: string, reqSpyList: any, host?: string) {
  const list = Object.keys(reqSpyList);
  const length = list.length;
  let defaultConfig;
  for (let i = 0; i < length; i++) {
    const pattern = list[i];
    if (!pattern) {
      continue;
    }

    const { domain } = reqSpyList[pattern];
    if (domain && host !== domain) {
      continue;
    }

    // 正则， 必须 ^开头
    if (pattern[0] === Constant.REG_PREFIX) {
      const reg = new RegExp(pattern);
      if (reg.test(url)) {
        return pattern;
      }
    } else if(pattern[0] === Constant.CATEGORY_PREFIX) { // 按目录匹配
      const prefix = pattern.substring(1);
      const length = prefix.length;
      if (url.substring(0, length) === prefix) {
        return pattern;
      }
      if (prefix === Constant.BASELINE) { // 所有共享兜底，要和 *互斥
        defaultConfig = pattern;
      }
    } else if (pattern === url) {
      return url;
    } else if (pattern === Constant.BASELINE) { // 记录兜底
      defaultConfig = pattern;
    }
  }

  // 都没有匹配到，并且配置了兜底，则用兜底配置
  if (defaultConfig) {
    return defaultConfig;
  }

  return undefined;
}