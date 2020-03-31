/**
 * http 请求工具
 */

// type Header
import fetch from 'node-fetch';

import Middleware, { MiddlewareFunc } from './middleware';

export const enum RequestMethods {
    GET = 'GET',
    POST = 'POST',
    DEL = 'DEL',
}


type RequestData = {
    body: string | undefined | URLSearchParams,
    query: string,
}

export type HttpBaseConfig = {
    baseUrl: string,
}

// 泛object
export type CustomObject<T> = {
    [key: string]: T
}


export type HttpRequestCtx = {
    url: string,
    query: string,
    baseUrl: string,
    body: string | undefined | URLSearchParams,
    method: string,
    headers: CustomObject<string>,
}

export class HttpBase {

    middleware:Middleware;
    afterMiddleware:Middleware;
    baseConfig: HttpBaseConfig;
    constructor(baseConfig: HttpBaseConfig) {
        this.baseConfig = baseConfig;
        this.middleware = new Middleware();
        this.afterMiddleware = new Middleware();
    }

    useBefore(middleFn: MiddlewareFunc) {
        this.middleware.use(middleFn);
    }

    useAfter(middleFn: MiddlewareFunc) {
        this.afterMiddleware.use(middleFn);
    }

    /**
     * 处理请求数据
     *
     * @param   {[type]}  method:         [method: 请求方法]
     * @param   {[type]}  data:           [data: 参数]
     *
     * @return  {RequestData}             [return description]
     */
    private resolveData(method: RequestMethods, data: any = {}): RequestData {
        if(method === RequestMethods.POST) {
            return {
                query: '',
                body: JSON.stringify(data || {}),
            }
        } else {
            return {
                query: Object.keys(data).map(v => `${v}=${data[v]}`).join('&'),
                body: undefined,
            }
        }
    }

    /**
     * 发请求
     *
     * @param   {[type]}        method:         [method: description]
     * @param   {[type]}        RequestMethods  [RequestMethods description]
     * @param   {string}        url             [url description]
     * @param   {[type]}        data:          [data?: description]
     *
     * @return  {Promise<any>}                  [return description]
     */
    async makeRequest(method: RequestMethods, url:string, data?: any, headers?: any): Promise<any> {

        const { body, query } = this.resolveData(method, data || {});
        const { baseUrl } = this.baseConfig;
        const [uri, _query = ''] = url.split('?');
        const ctx: HttpRequestCtx = {
            url,
            query: _query + (_query ? '&': '') + query ,
            baseUrl,
            body,
            method,
            headers: headers || '',
        };
        // 执行中间件
        await this.middleware.run(ctx);

        console.log(ctx.query, ctx.body);
        // const authHeaders: CustomObject<string> = auth(method, url + query, body || '');
        const result = await fetch(ctx.baseUrl + uri + '?' +  ctx.query, {
            body: ctx.body,
            method,
            headers: ctx.headers,
        }).then(res => {
            if(res.json && typeof res.json === 'function'){
                return res.json()
            }else {
                return res
            }
        })
        .then(async res => {
            await this.afterMiddleware.run(res);
            return res;
        })
        ;

        return result;
    }

}

/**
 * 初始化一个Http 类，并初始化一个 中间件(闭包独立性)
 *
 * @return  {[type]}  [return description]
 */
export default function createHttp (baseConfig: HttpBaseConfig): any {
    const middlewares: MiddlewareFunc[] = [];
    const afterMiddlewares: MiddlewareFunc[] = [];

    class Http  {

        // 使用时重载此方法可以注入固定中间件
        static useBefore(middle: MiddlewareFunc) {
            middlewares.push(middle); 
        }
        // 使用时重载此方法可以注入固定中间件
        static useAfter(middle: MiddlewareFunc) {
            afterMiddlewares.push(middle); 
        }
    
        private static registerMiddle(httpIns: HttpBase) {
            middlewares.forEach((md: MiddlewareFunc) => {
                httpIns.useBefore(md);
            });
            afterMiddlewares.forEach((md: MiddlewareFunc) => {
                httpIns.useAfter(md);
            });

        }
        
        static createRequest(method: RequestMethods, url: string, data?:any, headers?:any) {
            const http = new HttpBase(baseConfig);
            Http.registerMiddle(http);
            return http.makeRequest(method, url, data, headers);
        }
    
        public static POST(url: string, data?:any, headers?:any): Promise<any> {
            return Http.createRequest(RequestMethods.POST, url, data, headers);
        }
    
        public static GET(url: string, data?:any, headers?:any): Promise<any> {
            return Http.createRequest(RequestMethods.GET, url, data, headers);
        }
    
        public static DEL(url: string, data?:any): Promise<any> {
            return Http.createRequest(RequestMethods.DEL, url, data);
        }
    }

    return Http; 
}
