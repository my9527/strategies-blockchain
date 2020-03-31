import Http from './http';

import { writeFile, genClientOid, getPrecision } from '@lib/utils';
import { CustomObject } from '@lib/http';
import AbstractAIP, {
    TradeSide,
     AssetsmapType, 
     PriceInfoType,
      BaseCoin,
      QuotaCoin,
      TradeType,
      ConfigFilePath,
} from '@strategies/aip';

const SymbolPair = `${BaseCoin}${QuotaCoin}`;
export default class Aip_Binance extends AbstractAIP {
    
    assets: any[];

    constructor() {
        super();
        this.assets = [];
    }

    // 获取用户资产
    async checkUserAssets(): Promise<AssetsmapType> {
        // const http: Http = new Http();
        const result = await Http.GET('/api/v3/account');
        const assets:any [] = (result.balances || []).filter((v:any) => [BaseCoin, QuotaCoin].indexOf(v.asset) > -1);
        this.assets = assets;
        const assetsMap: CustomObject<number> = assets.reduce((sum, cur) => {
            return {
                ...sum,
                [cur.asset]: parseFloat(cur.free),
            };
        }, {});
        return assetsMap;

    }

    // 获取BaseCoin 相对 QuotaCoin的价格， 
    async getPrice(): Promise<PriceInfoType> {
        const result = await Http.GET('/api/v3/ticker/price', {
            symbol: SymbolPair,
        }, {
            noSign: true,
        });
       return result;
    }

    // 交易
    async trade(side: TradeSide, amount: number, config: any): Promise<void> {

        // const a = await Http.POST('/sapi/v1/account/disableFastWithdrawSwitch', {
        //     recvWindow: 10,
        // });
        // const b = await Http.POST('/sapi/v1/account/enableFastWithdrawSwitch');
        // console.log(a, b);
        // return;

        const clientOid = genClientOid();
        const pre = getPrecision(config.perAmount);
        // console.log(pre, amount.toFixed(pre), 'clientOid', clientOid);
        const result = await Http.POST('/api/v3/order/test', {
            newClientOrderId: clientOid,
            side: side.toUpperCase(),
            symbol: SymbolPair,
            type: TradeType.toUpperCase(),
            quoteOrderQty: amount.toFixed(pre),
            newOrderRespType: 'ACK',
            // hidden: true,
        });
        console.log("===================")
        console.log(result);
        if(result.code === '20000'){ 
            config.log.push({
                idx: config.log.length + 1,
                funds: amount,
                clientOid,
                side,
                vol:'',
                ...config.temp,
            });
            config.count += 1;
            delete config.temp;

            console.log('start write log');
            await writeFile(ConfigFilePath, JSON.stringify(config, null, 4));
            console.log('write log success');
        }else {
            await writeFile('./error-log.json', 'sd');
        }
        // console.log(result);
    }
}