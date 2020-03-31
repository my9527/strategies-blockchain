
import Http from './http';

import { writeFile, genClientOid } from '@lib/utils';
import { CustomObject } from '@lib/http';
import AbstractAIP, {
    TradeSide,
     AssetsmapType, 
     PriceInfoType,
      BaseCoin,
      QuotaCoin,
      SymbolPair,
      TradeType,
      ConfigFilePath,
} from '@strategies/aip';


// const BaseCoin = ["BTC", 'USDT'];
// const BaseCoin:string = "BTC";
// const QuotaCoin:string = "USDT";
// const SymbolPair:string = `${BaseCoin}-${QuotaCoin}`;
// const TradeType: string = "market";

// const ConfigFilePath: string = "./trade-log.json";

// export const enum TradeSide {
//     BUY = "buy",
//     SELL = "sell"
// }

export default class AIP_KuCoin extends AbstractAIP {

    assets: any[];

    constructor() {
        super();
        this.assets = [];
    }


    // 获取用户资产
    async checkUserAssets(): Promise<AssetsmapType> {
        // const http: Http = new Http();
        const result = await Http.GET('/api/v1/accounts', {
            type: 'trade'
        });
        const assets:any [] = (result.data || []).filter((v:any) => [BaseCoin, QuotaCoin].indexOf(v.currency) > -1);
        this.assets = assets;
        const assetsMap: CustomObject<number> = assets.reduce((sum, cur) => {
            return {
                ...sum,
                [cur.currency]: parseFloat(cur.available),
            };
        }, {});
        return assetsMap;

    }

    // 获取BaseCoin 相对 QuotaCoin的价格， 
    async getPrice(): Promise<PriceInfoType> {
        const result = await Http.GET('/api/v1/market/orderbook/level1', {
            symbol: SymbolPair,
        });
       return result.data;
    }

    // 交易
    async trade(side: TradeSide, amount: number, config: any): Promise<void> {
        const clientOid = genClientOid();
        console.log(amount);
        const result = await Http.POST('/api/v1/orders', {
            clientOid,
            side,
            symbol: SymbolPair,
            type: TradeType,
            stp: "CB",
            funds: amount,
            hidden: true,
        });
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
            // await writeFile('./error-log.json', 'sd');
        }
        console.log(result);
    }
} 
