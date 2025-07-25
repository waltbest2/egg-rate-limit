import { ResourceInfo } from "../../types/ResourceInfo";

export class DynamicDecision {
  static makeDecision(preThreshold: number, resource: ResourceInfo, usage: number): number {
    if (usage < 0 || usage > 100 || usage === undefined) {
      return 0;
    }

    // 限定currentUsageDouble为0-1.0（即0%-100%）之间的数
    const { maxResource, minResource, maxWal, minWal } = resource;
    let threshold = preThreshold;
    const currentUsage = usage / 100;
    if (currentUsage <= (minResource - 0.1)) {
      threshold = this.add(threshold, 20);
    } else if (currentUsage <= (minResource - 0.05)) {
      threshold = this.add(threshold, 10);
    } else if (currentUsage <= minResource) {
      threshold = this.add(threshold, 5);
    } else if (currentUsage <= maxResource) {
      // do nothing
    } else if (currentUsage <= (maxResource + 0.05)) {
      threshold = threshold * (100 - 5) / 100;
    } else if (currentUsage <= (maxResource + 0.1)) {
      threshold = threshold * (100 - 10) / 100;
    } else if (currentUsage <= 1) {
      threshold = threshold * (100 - 15) / 100;
    }

    if (threshold < minWal) {
      threshold = minWal;
    }

    if (threshold > maxWal) {
      threshold = maxWal;
    }

    return threshold;
  }

  private static add(preThreshold: number, incr: number): number {
    let temp = preThreshold * (100 + incr) / 100;
    if (preThreshold === temp) {
      temp++;
    }

    return temp;
  }
}