export class Common {
    public static getLogarithmicAverage(x1: number, x2: number): number {
        if(x1<0 || x2<0){
            throw new Error("For method getLogarithmicAverage both arguments must be >= 0")
        }
        else if(x1 === x2){
            return x1;
        }
        else if(x1 ===0 || x2 === 0) {
            return 0;
        }
        else {
            return (x1 - x2) / Math.log(x1 / x2);
        }
    }
    public static getAverage(data: number[]): number {
        return data.reduce((accumulator, current) => accumulator + current)/data.length;
    }
}