declare module 'egg' {
  interface Application {
    luaScripts: string;

    luaSha: string;

    redis: any;

    workers: number;

    itfSpyList: any;

    reqSpyList: any;

    spyEvents: any;

    reqFlowInfo: any;

  }
}