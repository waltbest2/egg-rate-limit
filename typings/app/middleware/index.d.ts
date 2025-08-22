// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportRequestMonitor from '../../../app/middleware/RequestMonitor';

declare module 'egg' {
  interface IMiddleware {
    requestMonitor: typeof ExportRequestMonitor;
  }
}
