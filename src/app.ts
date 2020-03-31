

// import KuCoinAIP from './strategies/AIP/KuCoin';
import AIP from './exchanges/kucoin/strategy_aip';


async function main(): Promise<void> {
    
    const aip = new AIP();
    aip.init();

}


main();