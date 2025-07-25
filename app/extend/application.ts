/**
 * 检查是否存在
 * @param arr 
 * @param e 
 * @returns 
 */
function existsEvent(arr, e) {
  for (const el of arr) {
    if (el.eventName === e.eventName) {
      return true;
    }
  }

  return false;
}

export default {
  get spyEvent() {
    if (!this._spyEvent) {
      return [];
    }
    return this._spyEvent;
  },

  set spyEvent(s) {
    this._spyEvent = s;
  },

  get reqSpy() {
    return this._reqSpy;
  },

  set reqSpy(s) {
    this._reqSpy = s;
  },

  get itfSpy() {
    return this._itfSpy;
  },

  set itfSpy(s) {
    this._itfSpy = s;
  },

  addSpyEvent(e: SpyEvent) {
    if (existsEvent(this._spyEvent, e)) {
      throw new Error('exist');
    }
    this._spyEvent.push(e);
  }
} 