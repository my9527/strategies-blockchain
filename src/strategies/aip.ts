import { readFile } from '@lib/utils';
import { CustomObject } from '@lib/http';


// const BaseCoin = ["BTC", 'USDT'];
export const BaseCoin:string = "BTC";
export const QuotaCoin:string = "USDT";
export const SymbolPair:string = `${BaseCoin}-${QuotaCoin}`;
export const TradeType: string = "market";

// 修改到相应交易所下面
export const ConfigFilePath: string = "./trade-log.json";

export type AssetsmapType = {
    [key:string]: number
}

export type PriceInfoType = {
    price: number,
    [key: string]: any,
}

export const enum TradeSide {
    BUY = "buy",
    SELL = "sell"
}
export default abstract class AIP {

    async init() {
        try {
            const priceInfo = await this.getPrice();
            const assetsMap: CustomObject<number> = await this.checkUserAssets();
            
            // console.log(priceInfo, assets);
            const config = await this.getConfig();

            const expectCurRoundVol:number = config.count * config.perAmount;
            const nextRoundVol:number = expectCurRoundVol + config.perAmount;
            const curRoundVol:number = assetsMap[BaseCoin] * priceInfo.price;
            const curMoney:number = assetsMap[QuotaCoin];
            let toInvestAmount:number = config.perAmount;
            let side:TradeSide = TradeSide.BUY;
            const dRoundVol:number = nextRoundVol - curRoundVol;

            if(dRoundVol < config.perAmount) {
                toInvestAmount -= dRoundVol;
            } else if(dRoundVol > config.perAmount) {
                // 如果此时暴涨，那么就卖出
                toInvestAmount = dRoundVol - toInvestAmount;
                side = TradeSide.SELL;
            }

            if(side === TradeSide.BUY && curMoney < toInvestAmount) {
                throw new Error(`交易账户${QuotaCoin} 不足`);
            }
            const newConfig = Object.create(config);
            newConfig.temp = {
                beforeTrade: curRoundVol,
                expectCurRoundVol,
                toInvestment: (side === TradeSide.BUY ? '买入' : '卖出') + toInvestAmount,
            }

            this.trade(side, Math.abs(toInvestAmount), newConfig);

            console.log(config);
        } catch(e){
            console.log('error', e);
            // await writeFile('./trade-log.json', JSON.stringify({
            //     data: 'asd'
            // }, null, 4));
        }
       
    }

    // 从数据库获取当前的
    async getConfig(): Promise<CustomObject<any>> {
        // 返回当前账户应该持有的资金以及
        const config:string = await readFile(ConfigFilePath);
        return JSON.parse(config);
    }

    // 获取用户资产
    abstract async checkUserAssets(): Promise<AssetsmapType>;

    // 获取BaseCoin 相对 QuotaCoin的价格， 
    abstract async getPrice():Promise<PriceInfoType>;

    // 交易
    abstract async trade(side: TradeSide, amount: number, config: any): Promise<void>;


}