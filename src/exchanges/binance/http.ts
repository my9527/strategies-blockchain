import createHttp, { HttpRequestCtx, HttpBaseConfig, RequestMethods } from '@lib/http';

import * as config from './config';
import { AsyncFunc } from '@lib/middleware';
import * as utils from '@lib/utils';
import { URLSearchParams } from 'url';


const baseConfig: HttpBaseConfig = {
    baseUrl: 'https://api.binance.com',
}
const Http = createHttp(baseConfig);

// // 签名中间件注入
Http.useBefore(async (ctx: HttpRequestCtx, next: AsyncFunc) => {
    ctx.headers = {
        ...ctx.headers,
        'X-MBX-APIKEY': config.ApiKey.secret,
    }
    
    const _body = JSON.parse(<string>ctx.body || '{}');

    if(!ctx.headers || !ctx.headers.noSign) {
        ctx.query += (ctx.query ? '&':'') + `timestamp=${Date.now()}`;
        
        const bodyStr = Object.keys(_body).map((cur) => {
            return  `${cur}=${_body[cur]}`;
        }).join('&');

        const signature = utils.sign(ctx.query + bodyStr, config.ApiKey.passphrase, 'hex');
    
        ctx.query +=  `&signature=${signature}`;
        delete ctx.headers.needSign;
    }
    if(ctx.method === RequestMethods.POST){
        
        const formdata = new URLSearchParams();
        ctx.body = Object.keys(_body).reduce((formdata, cur) => {
            formdata.append(cur, _body[cur]);
            return formdata;
        }, formdata);
        ctx.headers = {
            ...ctx.headers,
        };
    }
    next(ctx);
});
export default Http;