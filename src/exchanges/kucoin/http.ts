import createHttp, { HttpRequestCtx } from '@lib/http';

import * as config from './config';
import { AsyncFunc } from '@lib/middleware';
import { CustomObject, HttpBaseConfig } from '@lib/http';
import * as utils from '@lib/utils';

const baseConfig: HttpBaseConfig = {
    baseUrl: 'https://api.kucoin.com',
}

function auth(ApiKey: any, method: string, url: string, data: any) {
    const timestamp = Date.now();
    const signature = utils.sign(timestamp + method.toUpperCase() + url + data, ApiKey.secret);
  
  
    return {
      'KC-API-KEY': ApiKey.key,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp.toString(),
      'KC-API-PASSPHRASE': ApiKey.passphrase || '',
      'Content-Type': 'application/json',
    };
  }


const Http = createHttp(baseConfig);


// 签名中间件注入
Http.useBefore(async (ctx: HttpRequestCtx, next: AsyncFunc) => {
    const authHeaders: CustomObject<string> = auth(
        config.ApiKey,
        ctx.method,
        ctx.url + (/\?/g.test(ctx.url) ? '&' : '?') +ctx.query,
        ctx.body || ''
    );
    ctx.headers = {
        ...ctx.headers,
        ...authHeaders,
    };
    next(ctx);
});
export default Http;