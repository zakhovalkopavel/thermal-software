export class Common {
    public static logarithmicAverage(x1: number, x2: number): number {
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
    public static average(data: number[]): number {
        return data.reduce((accumulator, current) => accumulator + current)/data.length;
    }

    public static rootMeanSquare(data: number[]): number {
        return Math.pow(data.reduce((accumulator, current) => accumulator + current*current)/data.length, 0.5);
    }

    public static validInterval(x: number, min: number, max: number): number {
        return x<min ? min : (x>max) ? max : x;
    }

    public static isValidInterval(x: number, min: number, max: number): boolean {
        return x>=min && x<=max ? true : false;
    }
}