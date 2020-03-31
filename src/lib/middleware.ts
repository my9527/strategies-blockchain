export interface AsyncFunc {
    (ctx: any): Promise<any>;
  }
  
export interface MiddlewareFunc {
 (ctx: any, next: AsyncFunc): Promise<any> | void;
}

export default class Middleware {
    
    middlewares: MiddlewareFunc[];

    constructor() {
        this.middlewares = [];
    }
    
    use(middleware: MiddlewareFunc) {
        this.middlewares.push(middleware);
    }

    async run(ctx: any) {
        const middlewares: MiddlewareFunc[] = [...this.middlewares];
        const func = middlewares.reduceRight(
          (next: AsyncFunc, middle): AsyncFunc => {
            return async () => {
                await middle(ctx, next);
            };
          },
          async () => {
            Promise.resolve();
          }
        );
        const result = await func(ctx);
        return result;
      }
}