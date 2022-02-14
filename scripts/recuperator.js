let params = {
    tFlame:1553, //K
    flameToSmokeTRatio: 1.2,
    tSmokeStartC: 1200,// C
    tSmokeEndC: 200, // C
    tAirStartC: 20, // C
    tAirEndC: 800, // C
    tSmokeStartMax: 1950, // K
    tSmokeStart: 1573, // K
    tSmokeEnd: 473, // K
    tAirStart: 293, // K
    tRoom: 293,//K
    tAirEnd: 1073, // K
    nAir: 5,
    nSmoke: 4,
    d0: 0.03, //m
    d0mm: 30, // mm
    densityAirStart: 1.29,// kg/m3
    fPowerKW: 12,
    fPower: 12000,
    fuelQ: 30000000,// J/kg
    kExcessAir: 1.3,
    L0: 0,// m
    Lair: 0,// m
    Lsmoke: 0,// m
    S0: 0,// m2
    Sair:0,// m2
    Ssmoke: 0,// m2
    mPerHour: 0, // kg/h
    mAirPerHour: 0, // kg/h
    refractoryEmissivity: 0.8,
    refractoryLambda: 1.4,// W/(m*K)
    refractoryMediumThicknessMM: 15, // mm
    refractoryMediumThickness: 0.015,// m
    pCO2: 0,
    pO2: 0.19,
    concentrationO2: 0.21,
    cAir: 1200, //J/(kg*K),
    wAirStart: 0,
    wAirEnd: 0,
    wSmokeStart: 0,
    wSmokeEnd: 0,
    mAirPerHour: 0,
    expansivityExponent: 1.35, //some average value, real is from 1.3 to 1.4 = Cp/Cv
    holeForm: 'circle',
    alpha: {
        air: {
            start: 0,
            end: 0,
        },
        smoke: {
            start: 0,
            end: 0,
            convective: {
                start: 0,
                end: 0
            },

            radiation: {
                start: 0,
                end: 0
            }
        },
        smokeEndAirStart:0,
        smokeStartAirEnd: 0,
        average: 0,
    },
    averageDeltaT: 0, // K
    smokeEnergyDecrease: 0, // J/h
    airEnergyIncrease: 0, // J/h
    realAirEnergyIncrease: 0, // J/h
    realEnergyBalance: 0, // J/h
    currentTempEnergyBalance: 0, // J/h
    energyLost: 0, // J/h
    energyCriteria: 0, // airEnergyIncrease/(smokeEnergyDecrease-energyLost),
    energyCriteriaError: 9e20,
    //smokeToAirK: 0.7,
    energyReturnedPercents: 0,
    tSmokeEndReal: 0,
    tAirEndReal: 0,
    tFlameReal: 0,
    wantedRecuperatorLength: 1, // m
    recuperatorLength: 0, // m
    maxIterations: 2000,
    criteria: 100,// stop searching
    //criteriaDeviation: 0.01,
    thermalInsulationThickness: 0.025, //m
    surfaceArea: 0,
    roomTemperature: 20, //C
    tSurfase: 423, // C, surface between outer thermal insulation and room air
    dSurface: 0.2, // m
    autosetParamsList: [
        'tSmokeStartC',
        'tSmokeEndC',
        'tAirStartC',
        'tAirEndC',
        'nAir',
        'nSmoke',
        'd0mm',
        'fPowerKW',
        'kExcessAir',
        'refractoryLambda',
        'refractoryEmissivity',
        'refractoryMediumThicknessMM',
        'wantedRecuperatorLength',
        'holeForm',
    ],
    textParams: ['holeForm',],
};


const autosetParams = () => {
    for(const param of params.autosetParamsList){
        const textValue = document.getElementById(param).value;
        params[param] = params.textParams.includes(param) ? textValue: textValue*1;
    }
};

const getPerimeter = (a) => {
    let perimeter = 0;
    switch(params.holeForm){
        case 'square':
            perimeter = 4*a;
            break;
        case 'circle':
            perimeter = Math.PI*a;
            break;

    }
    return perimeter;
};


const getArea = (a) => {
    let area = 0;
    switch(params.holeForm){
        case 'square':
            area = a*a;
            break;
        case 'circle':
            area = Math.PI*a*a/4;
            break;

    }
    return area;
};

const getFlameTemperature = (tAir) =>{
    /*
        linear regression by data
        tAir    tFlame
        0       1280
        1000    2000
    */
    return 0.7200*tAir + 1356;
};

const getConvectiveAlpha = (w) => {
    // by gas velocity in m/s
    /*
        Table data for pipe diameter 50mm
        w(m/s) a(W/(m*K))
        0.495   7.6
        0.7     8.5
        0.93    9.45
        1.16    10.5
        1.75    12.7
        2.33    15.0
        2.92    17.7
        3.5     20.2
        4.65    25.0
        5.83    29.6
        7.0     34.1
        9.3     41.0
        11.63   50.0
        17.5    67.5
        22.33   84.0
        29.2    99.0
        35.0    113.0


        Mode: normal x,y analysis
        Polynomial degree 2, 17 x,y data pairs.
        Correlation coefficient = 0.9996116289449107
        Standard error = 0.6827457095951309

        Output form: simple list (ordered x^0 to x^n):

         5.8101901520974142e+000
         4.1481905509696588e+000
        -3.1462959958790719e-002
    */
    return 5.81+4.1482*w-3.1463*w*w*0.01
};

const getTemperetureExpansion = (tStart, tEnd) => {
    if(tStart<tEnd){
        return tEnd/(tStart*params.expansivityExponent);
    }
    else{
        return tEnd*params.expansivityExponent/tStart;
    }
};

const getAlphaForNaturalLowTempCooling = (tRoom, tSurface) => {
    // tSurface below 150C
    return 9.8+0.07*(tSurface-tRoom);
};

const getThermalInsulationLambda = (t) => {
    //LYTX 312
    t=t-273;
    return 0.139-7.97*Math.pow(10, -5)*t+1.3*Math.pow(10, -7)*t*t+2.73*Math.pow(10, -10)*Math.pow(t, 3);
}

const getAverageThermalInsulationLambda = (t1, t2) => {
    return getThermalInsulationLambda(t1)+getThermalInsulationLambda(t2)/2;
}

const getMaxSurfaceTemperature = (tHot,  tRoom, h,  tSurface = params.tSurfase, currentStep=0, iterations=20) => {
    tSurfase=tSurface>tHot?tRoom+10:tSurface;
    const alpha = getAlphaForNaturalLowTempCooling (tRoom, tSurface);
    const lambda = getAverageThermalInsulationLambda(tSurface, tHot);
    // console.log({tHot,  tRoom, h,  tSurface, currentStep, iterations, alpha, lambda});
    const tSurfaceNew = (tHot*lambda/h+tRoom*alpha)/(alpha+lambda/h);
    if(currentStep>=iterations){
        return tSurfaceNew;
    }
    else{
        return getMaxSurfaceTemperature(tHot, tRoom, h, tSurfaceNew, currentStep+1, iterations);
    }
}

const getMaxThermalLose = (tCold, tHot, tRoom, h, area) => {
    // console.log({tCold, tHot, tRoom, h, area});
    const tSurfaceHot = getMaxSurfaceTemperature(tHot, tRoom, h);
    const tSurfaceCold = getMaxSurfaceTemperature(tCold, tRoom, h);
    const lambdaTCold = getAverageThermalInsulationLambda(tSurfaceCold, tCold);
    const lambdaTHot = getAverageThermalInsulationLambda(tSurfaceHot, tHot);
    const dTCold = tCold-tSurfaceCold;
    const dTHot = tHot-tSurfaceHot;
    const powerLose = getLogariphmicAvearge(lambdaTHot*dTHot, lambdaTCold*dTCold)*area/h;
    //  console.log({tSurfaceCold, tSurfaceHot,tHot,tCold, dTCold, dTHot, lambdaTCold, lambdaTHot, powerLose});
    return powerLose;
}

const getLogariphmicAvearge = (x1, x2) => {
    // console.log({x1,x2});
    return (x1-x2)/Math.log(x1/x2);
};


const getAverageAlpha = (a1, a2) => {
    return 1/(1/a1+1/a2+params.refractoryMediumThickness/params.refractoryLambda);
};

const getRadiationEmissivity = (t) => {
    const gasEmissionPower = 3.5*Math.pow((params.pCO2*0.9*params.d0), 0.333333)*Math.pow(t/100, 3.5);
    const blackBodyEmissionPower = 5.67*Math.pow(t/100, 4);
    return gasEmissionPower/blackBodyEmissionPower;
};


const getRadiationAlpha = (Tg, Ts, Es) => {
    const Eg = getRadiationEmissivity(Tg);
    const Egs = getRadiationEmissivity(Ts);
    const Ee = (Es+1)/2;
    return 5.67*Ee*(Eg*Math.pow(Tg/100, 4) - Egs*Math.pow(Tg/Ts, 0.65)*Math.pow(Ts/100, 4))/(Tg-Ts);
}

const getTsmokeStart = (tFlame) => {
    let tSmokeStart = tFlame / params.flameToSmokeTRatio;
    return params.tSmokeStartMax>tSmokeStart? tSmokeStart : params.tSmokeStartMax;
}

const setParams = () => {
    autosetParams();

    params.tAirStart = params.tAirStartC*1+273;

    params.d0 = params.d0mm/1000;

    params.L0 =  getPerimeter(params.d0);
    params.S0 = getArea(params.d0);
    params.Sair = params.nAir*params.S0;
    params.Ssmoke = params.nSmoke*params.S0;

    params.Lair =  params.nAir*params.L0;
    params.Lsmoke = params.nSmoke*params.L0;

    params.fPower = params.fPowerKW*1000;

    params.mPerHour = params.fPower*3600/params.fuelQ;

    params.refractoryMediumThickness = params.refractoryMediumThicknessMM/1000;
    params.pCO2 = params.pO2/params.kExcessAir;


    params.tAirEnd = params.tAirEndC+273;
    params.tFlame = getFlameTemperature(params.tAirEnd);
    // console.log({tFlame: params.tFlame, tAirEnd: params.tAirEnd})
    params.tSmokeStart = getTsmokeStart(params.tFlame);
    params.tSmokeEnd = params.tAirStart*params.flameToSmokeTRatio;


    params.mAirPerHour = 12.5*params.kExcessAir*params.mPerHour;
    params.wAirStart = params.mAirPerHour/(params.densityAirStart*3600*params.Sair);

    params.wSmokeStart = params.wAirStart*getTemperetureExpansion(params.tAirStart, params.tSmokeStart)*params.Sair/params.Ssmoke;
    params.surfaceArea = Math.PI*params.dSurface*params.wantedRecuperatorLength;
};

let setResult = function(data){
    for(let id in data) {
        const element = document.getElementById(id);
        if(element instanceof HTMLInputElement){
            if(data[id]>0.1){
                element.value = data[id].toFixed(2).toString();
            }
            else{
                element.value = data[id].toFixed(8).toString();
            }
        }
        else{
            if(data[id]>1){
                if(data[id]>100){
                    element.textContent = Math.ceil(data[id]);
                }
                else{
                    element.textContent = data[id].toFixed(1).toString();
                }
            }
            else{
                element.textContent = data[id].toFixed(2).toString();
            }
        }
    }
};

const goalCriteria = (x) => {
    return Math.abs(1-x/params.wantedRecuperatorLength);
};

const calculateCriteria = (params, tSmokeEnd, tAirEnd) => {
    params.tFlame = getFlameTemperature(params.tAirEnd);

    params.tSmokeStart = getTsmokeStart(params.tFlame);


    // console.log(params.tSmokeStart );

    if(tSmokeEnd<=params.tAirStart || tSmokeEnd>=params.tSmokeStart || tAirEnd>=params.tSmokeStart || tAirEnd <=params.tAirStart){
        return params.energyCriteriaError;
    }

    params.tAirEnd = tAirEnd;
    params.tSmokeEnd = tSmokeEnd;

    params.wAirEnd = params.wAirStart*getTemperetureExpansion(params.tAirStart, params.tAirEnd);
    params.wSmokeEnd = params.wSmokeStart*getTemperetureExpansion(params.tSmokeStart, params.tSmokeEnd);


    params.alpha.air.start = getConvectiveAlpha(params.wAirStart);
    params.alpha.air.end = getConvectiveAlpha(params.wAirEnd);


    params.alpha.smoke.convective.start = getConvectiveAlpha(params.wSmokeStart);
    params.alpha.smoke.convective.end = getConvectiveAlpha(params.wSmokeEnd);


    params.alpha.smoke.radiation.start = getRadiationAlpha(params.tSmokeStart, (params.tAirEnd+params.tSmokeStart)/2, params.refractoryEmissivity);
    params.alpha.smoke.radiation.end = getRadiationAlpha(params.tSmokeEnd, (params.tAirStart+params.tSmokeEnd)/2, params.refractoryEmissivity);


    params.alpha.smoke.start = params.alpha.smoke.convective.start+params.alpha.smoke.radiation.start;
    params.alpha.smoke.end = params.alpha.smoke.convective.end+params.alpha.smoke.radiation.end;


    params.alpha.smokeEndAirStart = getAverageAlpha(params.alpha.air.start, params.alpha.smoke.end);
    params.alpha.smokeStartAirEnd = getAverageAlpha(params.alpha.air.end, params.alpha.smoke.start);

    params.alpha.average = getLogariphmicAvearge(params.alpha.smokeEndAirStart, params.alpha.smokeStartAirEnd);

    params.averageDeltaT = getLogariphmicAvearge(params.tSmokeEnd-params.tAirStart, params.tSmokeStart-params.tAirEnd);

    params.smokeEnergyDecrease = (params.mPerHour + params.mAirPerHour)*(params.tSmokeStart-params.tSmokeEnd)*params.cAir;
    params.airEnergyIncrease = params.mAirPerHour*(params.tAirEnd-params.tAirStart)*params.cAir;

    params.energyLost = getMaxThermalLose(tSmokeEnd, params.tSmokeStart, params.tRoom, params.thermalInsulationThickness, params.surfaceArea)*3600;

    params.energyReturnedPercents = params.airEnergyIncrease/(params.mPerHour*params.fuelQ)*100;

    if(params.smokeEnergyDecrease<params.airEnergyIncrease || params.airEnergyIncrease<0){
        return params.energyCriteriaError;
    }

    params.tAirEndC = params.tAirEnd-273;
    params.tSmokeStartC = params.tSmokeStart-273;
    params.tSmokeEndC = params.tSmokeEnd-273;
    params.tFlameReal = params.tFlame-273;

    params.recuperatorLength = params.airEnergyIncrease/(params.alpha.average*params.averageDeltaT*params.Lair*3600);
    params.realAirEnergyIncrease = params.recuperatorLength*params.airEnergyIncrease/params.wantedRecuperatorLength;
    params.realEnergyBalance = params.smokeEnergyDecrease - params.realAirEnergyIncrease - params.energyLost;
    params.currentTempEnergyBalance = params.smokeEnergyDecrease - params.airEnergyIncrease - params.energyLost;

    params.energyCriteria = Math.abs(params.realEnergyBalance) + Math.abs(params.currentTempEnergyBalance);

    console.log({realEnergyBalance: params.realEnergyBalance,currentTempEnergyBalance:params.currentTempEnergyBalance })
   /* const lengthDivider =
        Math.abs(params.recuperatorLength - params.wantedRecuperatorLength)>1
            ? 100*params.recuperatorLength/params.wantedRecuperatorLength
            : Math.pow(10, Math.abs(params.recuperatorLength - params.wantedRecuperatorLength));
    params.energyCriteria = Math.abs(1 - params.airEnergyIncrease/((params.smokeEnergyDecrease - params.energyLost)*lengthDivider));
*/
    return params.energyCriteria;
}

const calculate = () => {
    setParams();


    for(let i=1; i<params.maxIterations; i++){
        const {tSmokeStart, tSmokeEnd, tAirStart, tAirEnd } = params;

        //console.log({tSmokeEnd, tAirEnd});
        const currentCriteria = calculateCriteria(params, tSmokeEnd, tAirEnd);

        const divider = 2+Math.pow(i/5, 2);
        const dSmoke = (tSmokeStart - tSmokeEnd)/divider;
        const dAir = (tAirEnd - tAirStart)/divider;
        if(/*params.airEnergyIncrease/params.smokeEnergyDecrease>=params.smokeToAirK ||*/
            /*tSmokeEnd>=tSmokeStart-50 ||
            tAirStart>=tAirEnd-50 ||
            tAirEnd>=tSmokeStart ||
            tSmokeEnd<=tAirStart ||*/
            currentCriteria<params.criteria
        ) {
            console.log([tSmokeEnd>=tSmokeStart-50,
            tAirStart>=tAirEnd-50 ,
            tAirEnd>=tSmokeStart,
            tSmokeEnd<=tAirStart,
            currentCriteria<params.criteria
            ]);
            break;
        }
        else{


            const dataItems =[
                //01
                [tSmokeEnd, tAirEnd - dAir],
                //02
                [tSmokeEnd, tAirEnd + dAir],
                //10
                [tSmokeEnd - dSmoke, tAirEnd],
                //11
                [tSmokeEnd - dSmoke, tAirEnd - dAir],
                //12
                [tSmokeEnd - dSmoke, tAirEnd + dAir],
                //20

                [tSmokeEnd + dSmoke, tAirEnd],
                //21

                [tSmokeEnd + dSmoke, tAirEnd - dAir],
                //22

                [tSmokeEnd + dSmoke, tAirEnd + dAir],
            ];

            const criteriaResults = [{data:[tSmokeEnd, tAirEnd], result: currentCriteria}];
            for(const data of dataItems) {
                criteriaResults.push({data, result: calculateCriteria(params, data[0], data[1])});
            }

            criteriaResults.sort(function(a,b){
                return a.result-b.result;
            });
            params.tSmokeEnd = criteriaResults[0].data[0];
            params.tAirEnd = criteriaResults[0].data[1];
            console.log({criteriaResults, i, divider, dSmoke, dAir});
        }
    }

    console.log({params});
    const results = {
        tSmokeStartC: params.tSmokeStartC,
        tSmokeEndC: params.tSmokeEndC,
        energyReturnedPercents: params.energyReturnedPercents,
        recuperatorLength: params.recuperatorLength,
        tAirEndC: params.tAirEndC,
        tFlameReal: params.tFlameReal,
        mPerHour: params.mPerHour,
        airEnergyIncrease: params.airEnergyIncrease,
        smokeEnergyDecrease: params.smokeEnergyDecrease
    }

    setResult(results);

};

//   * +
//  + * *
//   * +
// + - air Sair = 3*S0
// * - smoke Ssmoke = 4*S0




/*

Ideal gas specific heat capacities of air

    Temperature K	CP kJ/kg.K	Cv kJ/kg.K	 k
250	 1.003	 0.716	 1.401
300	 1.005	 0.718	 1.400
350	 1.008	 0.721	1.398
400	 1.013	0.726	1.395
450	 1.020	0.733	1.391
500	 1.029	0.742	1.387
550	 1.040	0.753	1.381
600	1.051	0.764	1.376
650	1.063	0.776	1.370
700	1.075	0.788	1.364
750	1.087	0.800	1.359
800	1.099	0.812	1.354
900	1.121	0.834	1.344
1000	1.142	0.855	1.336
1100	1.155	0.868	1.331
1200	1.173	0.886	1.324
1300	1.190	0.903	1.318
1400	1.204	0.917	1.313
1500	1.216	0.929	1.309

*/