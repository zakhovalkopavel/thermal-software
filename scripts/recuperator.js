/*
interface LayerType = {
    h: number,
    material: string,
    start: number,
    end: number,
};*/

let params = {
    zero: 0.000000001,
    aPressure: 101325, // Pa
    tFlame:1553, // K
    tFlame1: 1553, // K
    tFlame1C: 1280, // C
    flameToSmokeTRatio: 1.2,//some energy may be already lost
    tSmokeStartC: 1200,// C
    tSmokeEndC: 200, // C
    tAirStartC: 20, // C
    tAirEndC: 800, // C
    tSmokeStartMax: 1750, // K
    tSmokeStart: 1573, // K
    tSmokeEnd: 473, // K
    tAirStart: 293, // K
    tRoom: 293,//K
    tAirEnd: 1073, // K
    nPasses: 1, // for circle in ring - it means, that there is 1 or more passes of air, it reduce Sair and increase vAir
    smokeTurbulence: false, // off or on  smoke turbulence
    nAir: 5,
    nSmoke: 4,
    d0: 0.03, //m
    d0mm: 30, // mmn
    h0: 0.02, //m
    h0mm: 20, //m
    densityAirStart: 1.29,// kg/m3
    fPowerKW: 12,
    fPower: 12000,
    fuelQ: 30000000,// J/kg
    carbonQ: 32900000,// J/kg
    dQHydrogenGas: 21000000,// J/kg
    carbonMonoxideQ: 9208333,// J/kg
    fuelCapacity: 1500, //J/(kg*K)
    ashCapacity: 1000, //J/(kg*K)
    kExcessAir: 1.3,
    //L0: 0,// m
    Lair: 0,// m
    Lsmoke: 0,// m
    //S0: 0,// m2
    Sair:0,// m2
    Ssmoke: 0,// m2
    mPerHour: 0, // kg/h
    mAirPerHour: 0, // kg/h
    mSmokePerSecond: 0, // kg/h
    refractoryEmissivity: 0.8,
    surfaceEmissivity: 0.8,
    refractoryLambda: 1.4,// W/(m*K)
    refractoryMediumThicknessMM: 15, // mm
    refractoryMediumThickness: 0.015,// m
    pCO2: 0,
    pO2: 0.21,
    systemComposition: {
        // partials/mole fractions
        before: {
            partial: {
                N2: 79,
                O2: 21,
                CO2: 0,
                CO: 0,
                H2O: 0,
                H2: 0,
            },
            weight: {
                N2: 0,
                O2: 0,
                CO2: 0,
                CO: 0,
                H2O: 0,
                H2: 0,
            },
            weightPartial: {
                N2: 0,
                O2: 0,
                CO2: 0,
                CO: 0,
                H2O: 0,
                H2: 0,
            }
        },
        after: {
            partial: {
                N2: 0,
                O2: 0,
                CO2: 0,
                CO: 0,
                H2O: 0,
                H2: 0,
            },
            weight: {
                N2: 0,
                O2: 0,
                CO2: 0,
                CO: 0,
                H2O: 0,
                H2: 0,
            },
            weightPartial: {
                N2: 0,
                O2: 0,
                CO2: 0,
                CO: 0,
                H2O: 0,
                H2: 0,
            }
        },
        room: {
            partial: {
                N2: 79,
                O2: 21,
                CO2: 0,
                CO: 0,
                H2O: 0,
                H2: 0,
            },
            weight: {
                N2: 76.7,
                O2: 23.3,
                CO2: 0,
                CO: 0,
                H2O: 0,
                H2: 0,
            },
            weightPartial: {
                N2: 0,
                O2: 0,
                CO2: 0,
                CO: 0,
                H2O: 0,
                H2: 0,
            }
        },
    },
    wH2Om: 0, // weight fraction H2O to air
    concentrationO2: 0.21,
    cAirAverage: 1200, //J/(kg*K),
    cSmokeAverage: 1200, //J/(kg*K),
    wAirStart: 0,
    wAirEnd: 0,
    wSmokeStart: 0,
    wSmokeEnd: 0,
    expansivityExponent: 1.35, //some average value, real is from 1.3 to 1.4 = Cp/Cv
    holeForm: 'circle',
    alpha: {
        air: {
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
    surfaces: {
        smokeEndAirStart: {},
        smokeStartAirEnd: {},
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
    maxIterations: 100,//5000,
    criteria: 100,// stop searching
    dTmin: 0.2, // minimal t step when stopping
    //criteriaDeviation: 0.01,
    thermalInsulationThicknessMM: 25, // mm
    thermalInsulationThickness: 0.025, // m
    surfaceArea: 0,
    roomTemperature: 20, //C
    tSurfase: 423, // C, surface between outer thermal insulation and room air
    furnaceForms: {
        sphere: 'sphere',
        cylinder: 'cylinder',
        cube:'cube',
    },
    materials: {
        chamotte_solid: 'chamotte_solid',
        chamotte_1300: 'chamotte_1300',
        chamotte_1000: 'chamotte_1000',
        chamotte_900: 'chamotte_900',
        chamotte_600: 'chamotte_600',
        chamotte_400: 'chamotte_400',
        mullite_2300: 'mullite_2300',
        quartz_2000: 'quartz_2000',
        quartz_1000: 'quartz_1000',
        quartz_sand_1: 'quartz_sand_1',
        quartz_sand_05: 'quartz_sand_05',
        quartz_sand_02: 'quartz_sand_02',
        alumina_2500: 'alumina_2500',
        alumina_1300: 'alumina_1300',
        alumina_sand_1: 'alumina_sand_1',
        alumina_sand_05: 'alumina_sand_05',
        alumina_sand_02: 'alumina_sand_02',
        silicon_carbide: 'silicon_carbide',
        basalt_fiber_mat: 'basalt_fiber_mat',
    },
    dSurface: 0.2, // m
    autosetParamsList: [
        'tSmokeStartC',
        'tSmokeEndC',
        'tAirStartC',
        'tAirEndC',
        'nPasses',
        'smokeTurbulence',
        'nAir',
        'nSmoke',
        'd0mm',
        'h0mm',
        'fPowerKW',
        'kExcessAir',
        'refractoryLambda',
        'refractoryEmissivity',
        'refractoryMediumThicknessMM',
        'thermalInsulationThicknessMM',
        'wantedRecuperatorLength',
        'holeForm',
        'wH2Om',
        'maxIterations',
        'furnaceForm',
        'tFlameFC',
        'furnaceW',
        'furnaceInternalSize_a_CM',
        'furnaceInternalSize_b_CM',
        'furnaceInternalSize_c_CM',

    ],
    textParams: [
        'holeForm',
        'layer[0].material',
        'layer[1].material',
        'layer[2].material',
        'layer[3].material',
        'layer[4].material',
        'furnaceForm',
    ],
    textParamsREGEX: [
        /betweenLayers\d+\.name/,
        /layer\[\d+\]\.material/
    ],
    layers:[],
    layersAmount:5,
    totalLayersThicknessMM: 0,//mm
    tFlameFC:0,//C
    furnaceW:0,//m/s
    ashPart: 0.06,
    furnaceForm: 'sphere',
    furnaceInternalSize_a_CM: 0,//cm
    furnaceInternalSizeA: 0,//m
    furnaceInternalSize_b_CM: 0,//cm
    furnaceInternalSizeB: 0,//m
    furnaceInternalSize_c_CM: 0,//cm
    furnaceInternalSizeC: 0,//m
};


const testData = [{
        tSurface: 773,
        tAir: 1073,
        w: 2,
        d: 0.2,
        l: 1
    },
    {
        tSurface: 773,
        tAir: 1073,
        w: 2,
        d: 0.03,
        l: 1
    },
    {
        tSurface: 773,
        tAir: 1073,
        w: 8,
        d: 0.03,
        l: 1
    },
    {
        tSurface: 773,
        tAir: 1073,
        w: 15,
        d: 0.03,
        l: 1
    },
    {
        tSurface: 373,
        tAir: 273,
        w: 8,
        d: 0.03,
        l: 1
    },

    {
        tSurface: 373,
        tAir: 273,
        w: 0,
        d: 0.05,
        l: 1
    },

    {
        tSurface: 373,
        tAir: 273,
        w: 0.495,
        d: 0.05,
        l: 1
    },
    {
        tSurface: 373,
        tAir: 273,
        w: 0.495,
        d: 0.05,
        l: 1
    },

    {
        tSurface: 373,
        tAir: 273,
        w: 1.16,
        d: 0.05,
        l: 1
    },
    {
        tSurface: 373,
        tAir: 273,
        w: 2.33,
        d: 0.05,
        l: 1
    },
    {
        tSurface: 373,
        tAir: 273,
        w: 4.65,
        d: 0.05,
        l: 1
    },
    {
        tSurface: 373,
        tAir: 273,
        w: 7,
        d: 0.05,
        l: 1
    },
    {
        tSurface: 373,
        tAir: 273,
        w: 11.63,
        d: 0.05,
        l: 1
    },
    {
        tSurface: 373,
        tAir: 273,
        w: 17.5,
        d: 0.05,
        l: 1
    },

];


const gasHeatCapacity = (t, gas, t0 = -1) => {
    /*
    Table 7.2.3: Heat Capacity Coefficients for the Expansion: Cp,m = a + b T + c T2 + d T3
 from
300 to 1800 K.3
Substance a
J K-1 mol-1
b
10-2 J K-2 mol-1
c
10-5 J K-3 mol-1
d
10-9 J K-4 mol-1
N2 (g) 28.883 -0.157 0.808 -2.871
O2 (g) 25.460 1.519 -0.715 1.311
H2 (g) 29.088 -0.192 0.400 -0.870
CO (g) 28.142 0.167 0.537 -2.221
CO2 (g) 22.243 5.977 -3.499 7.464
H2O (g) 32.218 0.192 1.055 -3.593
NH3 (g) 24.619 3.75 -0.138 –
CH4 (g) 19.875 5.021 1.268 -11.004
     */

    t = t>1800 ? 1800 : t;

    const vars = {
        N2 : {
            Mr: 0.028,
            a: 28.883,
            b: -0.157,
            c: 0.808,
            d: -2.871,
        },
        O2 : {
            Mr: 0.032,
            a: 25.460,
            b: 1.519,
            c: -0.715,
            d: 1.311,
        },
        H2 : {
            Mr: 0.002,
            a: 29.088,
            b: -0.192,
            c: 0.400,
            d: -0.870,
        },
        CO : {
            Mr: 0.028,
            a: 28.142,
            b: 0.167,
            c: 0.537,
            d: -2.221,
        },
        CO2 : {
            Mr: 0.044,
            a: 22.243,
            b: 5.977,
            c: -3.499,
            d: 7.464,
        },
        H2O : {
            Mr: 0.018,
            a: 32.218,
            b: 0.192,
            c: 1.055,
            d: -3.593,
        },
        NH3 : {
            Mr: 0.018,
            a: 24.619,
            b: 3.75,
            c: -0.138,
            d: 0,
        },
        CH4 : {
            Mr: 0.016,
            a: 19.875,
            b: 5.021,
            c: 1.268,
            d: -11.004,
        },
    };
    let result = 0;
    if(typeof vars[gas] !== 'undefined') {
        if(t0<0){
            result = capacityFunction(vars[gas], t);
        }
        else {
            result = capacityFunctionAverage( vars[gas], t, t0);
        }
    }
    return result;
};

const capacityValidInterval = (t) => {
    return t<300 ? 300 : (t>1800 ? 1800 : t);;
};

const capacityFunction = ( vars, t) => {
    t = capacityValidInterval(t);
    const {a, b, c, d, Mr} = vars;
    return (a + b*t/100 + c*t*t*Math.pow(10,-5) + d*t*t*t*Math.pow(10, -9))/Mr;
};

const capacityFunctionAverage = ( vars, t, t0) => {
    t0 = capacityValidInterval(t0);
    t = capacityValidInterval(t);
    if(t === t0) {
        return capacityFunction (vars, t0);
    }

    const {a, b, c, d, Mr} = vars;
    return Math.abs((a*(t-t0) + b*(t*t-t0*t0)/200 + c*(t*t*t-t0*t0*t0)*Math.pow(10,-5)/3 + d*(t*t*t*t-t0*t0*t0*t0)*Math.pow(10, -9)/4)/((t-t0)*Mr));
};

const findTflame = ( t0,  k=params.kExcessAir, pressure = params.aPressure, q = params.fuelQ ) => {
    const m0 = 15.5*k;
    const m1 = m0+1;
    const a = 968.00208;
    const b = 0.11904;
    const n = pressure/287.4;

    const A = m1*b/2;
    const B = - m0*pressure/n + m1*a;
    const C = -( m1*b*t0*t0/2 + m1*a*t0 + q );
    // At^2+Bt+C=0
    const D = Math.pow(B*B-4*A*C, 0.5);
    return (D - B)/(2*A);
};

const getGasSystemCapacity = (system, t, t0 = -1) => {
    let result =0;
    for ( const [gasName,partial] of Object.entries( system ) ) {
        result += partial*gasHeatCapacity(t, gasName, t0);
    }
    return result;
}

const getSystemEnergy = (mN2, mO2, mCO2, mCO, mH2O, mH2, mAsh, mFuel, ashCapacity, fuelCapacity, t, t0 = 0) => {
    return (
        mN2*gasHeatCapacity(t, 'N2', t0) +
        mO2*gasHeatCapacity(t, 'O2', t0) +
        mCO2*gasHeatCapacity(t, 'CO2', t0) +
        mCO*gasHeatCapacity(t, 'CO', t0) +
        mH2O*gasHeatCapacity(t, 'H2O', t0) +
        mH2*gasHeatCapacity(t, 'H2', t0) +
        mAsh*ashCapacity +
        mFuel*fuelCapacity
    ) * (t-t0);
};

const setSystemComposition = (mN2, mO2, mCO2, mCO, mH2O, mH2, mAsh, mFuel, direction = 'before') => {
    const molesTotal = mN2/28 + mO2/32 + mCO2/44 + mCO/28 + mH2O/18 + mH2/2;
    const weightTotal = mN2 + mO2 + mCO2 + mCO + mH2O + mH2;
    const data = {
        partial: {
            N2: mN2 / (28 * molesTotal),
            O2: mO2 / (32 * molesTotal),
            CO2: mCO2 / (44 * molesTotal),
            CO: mCO / (28 * molesTotal),
            H2O: mH2O / (28 * molesTotal),
            H2: mH2 / (28 * molesTotal),
        },
        weight: {
            N2: mN2,
            O2: mO2,
            CO2: mCO2,
            CO: mCO,
            H2O: mH2O,
            H2: mH2,
            Ash: mAsh,
            Fuel: mFuel,
        },
        //weight partial for gas composition
        weightPartial: {
            N2: mN2/weightTotal,
            O2: mO2/weightTotal,
            CO2: mCO2/weightTotal,
            CO: mCO/weightTotal,
            H2O: mH2O/weightTotal,
            H2: mH2/weightTotal,
        }
    };
    params.systemComposition[direction] = data;
}

const findIsobaricTwoStageFlame = (
    tAir,
    wH2Om, // weight additional fraction to air
    kExcessAir,
    kExcessAir1, // excess air first stage 0.5 - 100% CO, 0% CO2; 1 - 0% CO, 100% CO2
    mFuelPerHour,
    fuelQ,
    ashPart,
    maxIterations = 100,
    dQmin = 10,
    tStart = 3000,
    dtAir1 = 50,
    dtAir2 = 400,
) => {
    // coke flame temperature
    const mFuel = mFuelPerHour/3600;
    const mCarbon = fuelQ/carbonQ*mFuel;
    const mAsh = mFuel*ashPart;


    //first burning stage finishes at 100% CO
    const mAir1 = kExcessAir1*(32/(pO2*12)*mCarbon); //first stage air
    const mAir = kExcessAir*(32/(pO2*12)*mCarbon); //full air
    const mAir2 = mAir - mAir1; //second stage air

    // First stage

    const mN2Stage1 = mAir1*(1-pO2)*28/((1-pO2)*28+32*pO2);
    const mO2Stage1 = mAir1 - mN2Stage1;

    const mN2 = mAir*(1-pO2)*28/((1-pO2)*28+32*pO2);
    const mO2 = mAir - mN2;
    let kCO2 = k>=1 ? 1 : (k>0.5 ? 2*k-1: 0);
    let kCO = k>=1 ? 0 : (k>0.5 ? 2-2*k: 2*k);

    const mH2O = mAir*wH2Om;

    const mCO2 = 44/12*mCarbon*kCO2;
    const mCO = 28/12*mCarbon*kCO;
    const mH2 = 2/12*mCarbon*kH2;
    const mO2after = k>1 ? (k-1)*mO2 : 0;
    const energyBefore = t0*mFuel*fuelCapacity
        + mN2*gasHeatCapacity(t0, 'N2', 0)*t0
        + mO2*gasHeatCapacity(t0, 'O2', 0)*t0
        + mH2O*gasHeatCapacity(t0, 'H20', 0)*t0
    ;

    // Left this, but it no needed, it doesn't allow emission, fo flame T is too high
    /*const Q = mCarbon*(kCO*carbonMonoxideQ + kCO2*carbonQ + kH2*dQHydrogenGas);

    let factor = f0;
    for( let i=0; i<maxIterations; i++) {
        factor = factor*f;
        const dQ = [];
        const dT = (tStart-t0)*factor;
        const t1 = tStart - dT;
        const t2 = tStart + dT;
        dQ.push({t:tStart, dQ: Math.abs(Q + energyBefore -  getSystemEnergy(mN2, mO2after, mCO2, mCO, mH2Oafter, mH2, mAsh, 0, ashCapacity, fuelCapacity, tStart, t0))});
        dQ.push({t:t1, dQ: Math.abs(Q + energyBefore - getSystemEnergy(mN2, mO2after, mCO2, mCO, mH2Oafter, mH2, mAsh, 0, ashCapacity, fuelCapacity, t1, t0))});
        dQ.push({t:t2, dQ: Math.abs(Q + energyBefore - getSystemEnergy(mN2, mO2after, mCO2, mCO, mH2Oafter, mH2, mAsh, 0, ashCapacity, fuelCapacity, t2, t0))});
        dQ.sort((a, b) => { return a.dQ - b.dQ});

        tStart = dQ[0].t > t0 ? dQ[0].t : tStart;
        if(dQ[0].dQ<dQmin){
            //console.log({dQ,dT,mN2, mO2, mO2after, mCO2, mCO, mAsh, mFuel, mH2, ashCapacity, fuelCapacity, k, kCO, kCO2, kH2, kH2O, kH2Oafter});
            break;
        }
    }*/
    tStart = 6.23*Math.pow(1900 - t0, 0.74)*Math.pow(characteristicSize, -0.16)*mO2/mAir + t0;
    setSystemComposition(mN2, mO2, 0, 0, mH2O, 0, 0, mFuel, 'before');
    setSystemComposition(mN2, mO2after, mCO2, mCO, mH2Oafter, mH2, mAsh, 0,'after');
    return tStart;
}

const findIsobaricFlameT = (
    t0,
    wH2Om = params.wH2Om, // weight additional fraction to air
    tStart = 3000,
    k=params.kExcessAir,
    pressure = params.aPressure,
    pO2 = params.pO2,
    q = params.fuelQ,
    carbonQ = params.carbonQ,
    carbonMonoxideQ = params.carbonMonoxideQ,
    dQHydrogenGas = params.dQHydrogenGas,
    fuelCapacity = params.fuelCapacity,
    ashCapacity = params.ashCapacity,
    f0 = 0.2,
    f = 0.6,
    maxIterations = 100,
    dQmin = 10,
    characteristicSize = 0.0008 //800mkm , for higher size the same t, but for lower is much higher
) => {
    // coke flame temperature
    const mFuel = 1;
    const mCarbon = q/carbonQ*mFuel;
    const mAsh = mFuel - mCarbon;
    let mAir = k*32/(pO2*12)*mCarbon;
    const mN2 = mAir*(1-pO2)*28/((1-pO2)*28+32*pO2);
    const mO2 = mAir - mN2;
    let kCO2 = k>=1 ? 1 : (k>0.5 ? 2*k-1: 0);
    let kCO = k>=1 ? 0 : (k>0.5 ? 2-2*k: 2*k);

    const mH2O = mAir*wH2Om;
    mAir+=mH2O;
    const kH2O = mH2O*12/(18*mCarbon);

    //CO + H2O → CO2 + H2
    const kH2 = k<=1 ? (
        kH2O<kCO ? kH2O : kCO
    ) : 0;

    if(kH2>0) {
        kCO2 += kH2;
        kCO -= kH2;
    }

    const kH2Oafter = kH2O-kH2;
    const mH2Oafter = 12/12*mCarbon*kH2Oafter;

    const mCO2 = 44/12*mCarbon*kCO2;
    const mCO = 28/12*mCarbon*kCO;
    const mH2 = 2/12*mCarbon*kH2;
    const mO2after = k>1 ? (k-1)*mO2 : 0;
    const energyBefore = t0*mFuel*fuelCapacity
        + mN2*gasHeatCapacity(t0, 'N2', 0)*t0
        + mO2*gasHeatCapacity(t0, 'O2', 0)*t0
        + mH2O*gasHeatCapacity(t0, 'H20', 0)*t0
    ;

    // Left this, but it no needed, it doesn't allow emission, fo flame T is too high
    /*const Q = mCarbon*(kCO*carbonMonoxideQ + kCO2*carbonQ + kH2*dQHydrogenGas);

    let factor = f0;
    for( let i=0; i<maxIterations; i++) {
        factor = factor*f;
        const dQ = [];
        const dT = (tStart-t0)*factor;
        const t1 = tStart - dT;
        const t2 = tStart + dT;
        dQ.push({t:tStart, dQ: Math.abs(Q + energyBefore -  getSystemEnergy(mN2, mO2after, mCO2, mCO, mH2Oafter, mH2, mAsh, 0, ashCapacity, fuelCapacity, tStart, t0))});
        dQ.push({t:t1, dQ: Math.abs(Q + energyBefore - getSystemEnergy(mN2, mO2after, mCO2, mCO, mH2Oafter, mH2, mAsh, 0, ashCapacity, fuelCapacity, t1, t0))});
        dQ.push({t:t2, dQ: Math.abs(Q + energyBefore - getSystemEnergy(mN2, mO2after, mCO2, mCO, mH2Oafter, mH2, mAsh, 0, ashCapacity, fuelCapacity, t2, t0))});
        dQ.sort((a, b) => { return a.dQ - b.dQ});

        tStart = dQ[0].t > t0 ? dQ[0].t : tStart;
        if(dQ[0].dQ<dQmin){
            //console.log({dQ,dT,mN2, mO2, mO2after, mCO2, mCO, mAsh, mFuel, mH2, ashCapacity, fuelCapacity, k, kCO, kCO2, kH2, kH2O, kH2Oafter});
            break;
        }
    }*/
    tStart = 6.23*Math.pow(1900 - t0, 0.74)*Math.pow(characteristicSize, -0.16)*mO2/mAir + t0;
    setSystemComposition(mN2, mO2, 0, 0, mH2O, 0, 0, mFuel, 'before');
    setSystemComposition(mN2, mO2after, mCO2, mCO, mH2Oafter, mH2, mAsh, 0,'after');
    return tStart;
};

const systemEnergyChange = (systemEnergy,  weightFactor, t1, t2, isOnlyGases = true, fuelCapacity = params.fuelCapacity, ashCapacity = params.ashCapacity) => {
    const { N2, O2, CO2, CO, H2O, H2 } = systemEnergy;
    let { Ash, Fuel } = systemEnergy;
    if(isOnlyGases){
        Ash = 0;
        Fuel = 0;
    }
    const energyChanged = getSystemEnergy(N2, O2, CO2, CO, H2O, H2, Ash, Fuel, ashCapacity, fuelCapacity, t1, t2);
    //console.log({energyChanged, N2, O2, CO2, CO, H2O, H2, Ash, Fuel, ashCapacity, fuelCapacity, t1, t2});
    return Math.abs(energyChanged*weightFactor);
}

const getParam = (name, params) => {
    let result;
    const textValue = document.getElementById(name).value;
    if(typeof params[name] ==="boolean"){
        result = textValue !== '0';
    }
    result = params.textParams.includes(name) ? textValue: textValue*1;
    return result;
}

const autosetParams = () => {
    for(const name of params.autosetParamsList){
        params[name] = getParam(name, params);
    }
};

const getFactoByForm = (holeForm, type, nAir, nSmoke) => {
    return type === 'air' ? nAir : nSmoke;
}

const getPerimeter = (a, holeForm = params.holeForm, type = 'air', nAir = params.nAir, nSmoke = params.nSmoke, h = params.refractoryMediumThickness) => {
    let perimeter = 0;
    let factor = 1;
    switch(holeForm){
        case 'square':
            perimeter = 4*a;
            factor = getFactoByForm(holeForm, type, nAir, nSmoke);
            break;
        case 'circle':
            perimeter = Math.PI*a;
            factor = getFactoByForm(holeForm, type, nAir, nSmoke);
            break;
        case 'triangle':
            perimeter = type === 'air' ? 3*a : 3*(a+2*h);
        case 'circle_in_ring':
            perimeter = type === 'air' ? Math.PI*a : Math.PI*(a-2*h);
            break;
    }
    return perimeter*factor;
};

const getSizeByTypeForArea = (a,  type, holeForm, h, airDepth ) => {
    if(holeForm === 'circle_in_ring'){
        return type == 'smoke' ? a-2*h : Math.pow(Math.pow(a+2*airDepth, 2)-a*a, 0.5);
    }
    return a;
}

const getArea = (a,  holeForm = params.holeForm, type = 'air',  nAir = params.nAir, nSmoke = params.nSmoke, h = params.refractoryMediumThickness,  airDepth = params.h0, nPasses = params.nPasses) => {
    let area = 0;
    let factor = 1;
    a = getSizeByTypeForArea(a, type, holeForm, h, airDepth);
    switch(holeForm){
        case 'square':
            area = a*a;
            factor = type === 'air' ? nAir : nSmoke;
            break;
        case 'circle':
            area = Math.PI*a*a/4;
            factor = type === 'air' ? nAir : nSmoke;
            break;
        case 'triangle':
            area = a*a*Math.pow(3,0.5)/4;
            if(type === 'smoke'){
                const rInner = Math.pow(3/(16*Math.PI), 0.25)*a;
                const rOuter = rInner + h;
                factor = (Math.pow(rOuter, 2)*Math.PI - Math.pow(a+2*h, 2)*Math.pow(3,0.5)/4)/area;
            }
            break;
        case 'circle_in_ring':
            area = Math.PI * a * a / 4;
            if(type === 'air') {
                area = area / nPasses;
            }
            break;
    }
    return area*factor;
};

const getFlameTemperature = (tAir) =>{
    /*
        linear regression by data
        tAir    tFlame
        0       1280
        1000    2000
    */
    findIsobaricFlameT(tAir);
    return 0.7200*tAir + 1356;
};


const airThermalConductivity = (t) => {
    return 0.0244*Math.pow(t/273, 0.82);
}


const airCapacityIsobaric = (t) => {
    return (1.0005+1.1904*(t-273)/10000)*1000;
}

const airDynamicViscosity = (t) => {
    return 1.717*Math.pow(t/273, 0.693)/100000;
}

const airDensity = (t, p = params.aPressure) => {
    return p/(287.4*t);
}

const airKinematicViscosity = (t) => {
    return airDynamicViscosity(t)/airDensity(t);
}

const airPrandtlnumber = (t) => {
    return airCapacityIsobaric(t)*airDynamicViscosity(t)/airThermalConductivity(t);
}

const airGrashofNumber = (tHot, tCold, d) => {
    const kinematicViscosityHot = airKinematicViscosity(tHot);
    const kinematicViscosityCold = airKinematicViscosity(tCold);

    return 9.81*Math.pow(d, 3)*2*(tHot-tCold)/((tHot+tCold)*Math.pow(getLogariphmicAvearge(kinematicViscosityHot,kinematicViscosityCold), 2));
}

const airRayleighNumber = (tHot, tCold, d) => {
    return airPrandtlnumber((tHot+tCold)/2)*airGrashofNumber(tHot, tCold, d);
}

const airReynoldsNumber = (t, w, l) => {
    return w*l/airKinematicViscosity(t);
}

const airNaturalConvectionAlpha = (tHot, tCold, l, d) => {
    if(tHot<tCold){
        const tColdSafe = tCold;
        tCold = tHot;
        tHot = tColdSafe;
    }
    const tAverage = getLogariphmicAvearge(tHot, tCold);
    const Ra = airRayleighNumber(tHot, tCold, l);
    const Pr = airPrandtlnumber(tAverage);

    /*
        For cylinders with their axes vertical, the expressions for plane surfaces can be used provided the curvature effect is not too significant.
        This represents the limit where boundary layer thickness is small relative to cylinder diameter D.
        The correlations for vertical plane walls can be used when
    */
    const Gr = airGrashofNumber(tHot, tCold, l);
    const allowVerticalCylinder = d/l >= 35/Math.pow(Gr, 1/4);
    const lambda = airThermalConductivity(tAverage);
    //console.log({tHot, tCold, tAverage, Ra, Gr, Pr, allowVerticalCylinder});

    // Result is External flow for vertical plane
    return Ra< Math.pow(10, 9)
        ? lambda/l*(0.68+0.67*Math.pow(Ra, 1/4)/Math.pow((1+Math.pow(0.492/Pr, 9/16)),4/9))
        : lambda/l*Math.pow(0.825+0.387*Math.pow(Ra, 1/6)/Math.pow((1+Math.pow(0.492/Pr, 9/16)),8/27), 2)
        ;
}

const airNusseltNumber = (tAir, tSurface, l, d, w=0, isSphere = false, isDiffusion = false, isTurbulence = false) => {
    const tAverage = getLogariphmicAvearge(tAir, tSurface);
    const tHot = tAir > tSurface ? tAir : tSurface;
    const tCold = tAir < tSurface ? tAir : tSurface;
    const Ra = airRayleighNumber(tHot, tCold, l);
    const Re = isTurbulence? airReynoldsNumber(tAverage, w, d)*2 : airReynoldsNumber(tAverage, w, d);
    /*if(isTurbulence) {
        console.log({Re, Re0: airReynoldsNumber(tAverage, w, d), tAverage, w, d});
    }*/
    const Pr = airPrandtlnumber(tAverage);

    if(isSphere) {
        let NuSphere = 2;
        if(isDiffusion){
            NuSphere = 2+0.17*Math.pow(Re, 2/3);
        }
        else{
            NuSphere = 2+0.4*Math.pow(Re, 0.5)*Math.pow(Pr, 1/3);
        }
        return {Nu: NuSphere, isSphere, isDiffusion};
    }

    const PrAir = airPrandtlnumber(tAir);
    const PrSurface = airPrandtlnumber(tSurface);
    // dynamic viscosity, μ
    const airViscositySurface = airDynamicViscosity(tSurface);
    const airViscosityAir = airDynamicViscosity(tAir);

    /*
        For cylinders with their axes vertical, the expressions for plane surfaces can be used provided the curvature effect is not too significant.
        This represents the limit where boundary layer thickness is small relative to cylinder diameter D.
        The correlations for vertical plane walls can be used when
    */
    const Gr = airGrashofNumber(tHot, tCold, l);
    const allowVerticalCylinder = d/l >= 35/Math.pow(Gr, 1/4);

    const NuNaturalConvection =  Ra< Math.pow(10, 9)  && Re<2300
        ? (0.68+0.67*Math.pow(Ra, 1/4)/Math.pow((1+Math.pow(0.492/Pr, 9/16)),4/9))
        : Math.pow(0.825+0.387*Math.pow(Ra, 1/6)/Math.pow((1+Math.pow(0.492/Pr, 9/16)),8/27), 2)
    ;


    /*
        Laminar flow
     */

    //For fully developed laminar flow, the Nusselt number is constant and equal to 3.66. Mills combines the entrance effects and fully developed flow into one equation
    const NuLaminar = 3.66 + (0.065*Re*Pr*d/l)/(1+0.4*Math.pow(Re*Pr*d/l, 2/3));


    /*
        Sieder-Tate correlation
     */
    const NuLaminarSiederTate = 1.86*Math.pow(Re*Pr*d/l, 1/3)*Math.pow(airViscosityAir/airViscositySurface, 0.14)

    /*
        Transient flow (between laminar and turbulent)
        2300 < Re< 10000
     */
    const NuTransient = 0.008*Math.pow(Re, 0.9)*Math.pow(Pr, 0.43);

    /*
        Gnielinski correlation
        transient and turbulent flow
        0.5 <= Pr <= 2000
        3000 <= Re <= 5*10^6

     */

    // Darcy friction factor
    const f = Math.pow(0.79*Math.log(Re) - 1.64, -2);
    const NuTurbulentGnielinski = (f/8)*(Re-1000)*Pr/(1+12.7*Math.pow(f/8, 1/2)*(Math.pow(Pr, 2/3)-1));

    /*
        Sieder-Tate correlation
        0.7 <= Pr <= 16700
        Re >= 10000
        L/D>=10
     */
    const NuTurbulentSiederTate = 0.027*Math.pow(Re, 4/5)*Math.pow(Pr, 1/3)*Math.pow(airViscosityAir/airViscositySurface, 0.14);


    /*
        The empirical correlation of Dittus-Boelter [10-12] has gained widespread acceptance for prediction of the
        Nusselt number with turbulent flow in the smoothsurface tubes
        0.6<= Pr <= 160, Re>= 10^4  L/d>=60
        The exponent of the Prandtl number is n = 0.4 for heating of the fluid and n = 0.3 if the fluid is being
        cooled.
    */

    const n = tAir > tSurface ? 0.3 : 0.4;
    const NuTurbulentDittusBoelte = 0.023*Math.pow(Re, 0.8)*Math.pow(Pr,n);

    /*
     Величина коэффициента , входящая в уравнения (1.5), (1.6), (1.8), определяется из таблиц (1.2) и (1.3).
     */

    const el = 1.2;
    const NuTurbulent = 0.021*Math.pow(Re, 0.8)*Math.pow(PrAir, 0.43)*Math.pow(PrAir/PrSurface, 0.25)*el;


    const isLaminar = Re<2300;
    const isTransient = Re>=2300 && Re<= 10000;
    const isTurbulent = Re>10000;
    const isNatural = w===0 ||  (
        (isLaminar && NuNaturalConvection/l>NuLaminar/d)
        || (isTransient && NuNaturalConvection/l > NuTransient/d)
        || (isTurbulent && NuNaturalConvection/l > NuTurbulentGnielinski/d)
    );
    /*console.log({
        tAir,
        tSurface,
        l,
        d,
        w,
        tAverage,
        Ra,
        Gr,
        allowVerticalCylinder,
        dToL: d/l,
        '35/Gr^0.25': 35/Math.pow(Gr,0.25),
        Re,
        Pr,
        airViscositySurface,
        airViscosityAir,
        NuTurbulent,
        NuTransient,
        NuTurbulentSiederTate,
        NuTurbulentGnielinski,
        NuTurbulentDittusBoelte,
        NuNaturalConvection,
        NuLaminar,
        NuLaminarSiederTate,
        isNatural,
        isLaminar,
        isTransient,
        isTurbulent
    });*/
    return isNatural
        ? { Nu : NuNaturalConvection, isNatural }
        : { Nu : ( isLaminar
            ? NuLaminar
            : ( isTransient
                ? (Re<3000 ? NuTransient : NuTurbulentGnielinski)
                : NuTurbulentGnielinski
        )), isNatural};
}

const airConvectionAlpha = (tAir, tSurface, l, d, w = 0, isTurbulence = false) => {
    const tAverage = getLogariphmicAvearge(tAir, tSurface);
    const {Nu, isNatural} = airNusseltNumber(tAir, tSurface, l, d, w,false, false, isTurbulence);
    const lambda = airThermalConductivity(tAverage);
    return isNatural ? Nu*lambda/l : Nu*lambda/d;
}


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
    /*if(tStart<tEnd){
        return tEnd/(tStart*params.expansivityExponent);
    }
    else{
        return tEnd*params.expansivityExponent/tStart;
    }*/

    return airDensity(tStart)/airDensity(tEnd);
};

const getAlphaForNaturalLowTempCooling = (tRoom, tSurface) => {
    // tSurface below 150C
    return 9.8+0.07*(tSurface-tRoom);
};

const getThermalInsulationLambda = (t) => {
    //LYTX 312
    const tCelsius=celsiusFromKelvin(t);
    return 0.139-7.97*Math.pow(10, -5)*tCelsius+1.3*Math.pow(10, -7)*tCelsius*tCelsius+2.73*Math.pow(10, -10)*Math.pow(tCelsius, 3);
}

const getAverageThermalInsulationLambda = (t1, t2) => {
    return getLogariphmicAvearge(getThermalInsulationLambda(t1),getThermalInsulationLambda(t2));
}

const getFullNaturalConvectionAlpha = (tRoom, tSurface, lSurface, dSurface, eSurface) =>
{
    let alpha;
    if(tSurface<=423) {
        alpha = getAlphaForNaturalLowTempCooling (tRoom, tSurface);
    }
    else{
        const naturalConvectionAlpha = airConvectionAlpha(tRoom, tSurface, lSurface, dSurface);
        const radiationAlpha = fullRadiationAlpha(tSurface, tRoom, eSurface);
        //console.log({tSurface, tRoom, naturalConvectionAlpha, radiationAlpha});
        alpha = naturalConvectionAlpha + radiationAlpha;
    }
    return alpha;
}

const getMaxSurfaceTemperature = (tHot,  tRoom, h, alphaInner,  lInner = params.Lsmoke, dSurface = params.dSurface, lSurface = params.wantedRecuperatorLength, eSurface =params.surfaceEmissivity, tSurface = params.tSurfase, currentStep=0, iterations=20) => {
   //   tRoom  |<---tSurface      tInner ---> |   tHot
    tSurfase = tSurface>tHot ? tRoom+10 : tSurface;
    //tInner = tInner === 0  ? tHot*0.8 : tInner;

    const alpha = getFullNaturalConvectionAlpha(tRoom, tSurface, lSurface, dSurface, eSurface);

    const lambda = getAverageThermalInsulationLambda(tSurface, tHot);
    // console.log({tHot,  tRoom, h,  tSurface, currentStep, iterations, alpha, lambda});
    const dInner = dSurface - 2*h;
    const dMiddle = getLogariphmicAvearge(dSurface, dInner);

    const alphaMedium = 1/(2*dSurface*Math.PI/(alphaInner*lInner)+dSurface*h/(lambda*dMiddle)+1/alpha);
    const tSurfaceNew = alphaMedium*(tHot-tRoom)/alpha + tRoom;

    const powerSurface = dSurface*alpha*(tSurfaceNew-tRoom);
    const dTInsulation = powerSurface*h/(lambda*dMiddle);
    const tInner = tSurfaceNew+ dTInsulation;

    if(currentStep>=iterations){
        // console.log({tHot, tRoom, h, alpha, lambda, dSurface, dInner, dMiddle, lSurface, eSurface, alphaMedium, tRoom, tSurfaceNew, tInner, dTInsulation, alphaInner, lInner, tHot});
        return tSurfaceNew;
    }
    else{
        return getMaxSurfaceTemperature(tHot, tRoom, h, alphaInner, lInner, dSurface, lSurface, eSurface, tSurfaceNew,  currentStep+1, iterations);
    }
}

const getMaxThermalLose = (tCold, tHot, tRoom, alpha, h, area) => {
    // console.log({tCold, tHot, tRoom, h, area});
    const tSurfaceHot = getMaxSurfaceTemperature(tHot, tRoom, h, alpha.start);
    const tSurfaceCold = getMaxSurfaceTemperature(tCold, tRoom, h, alpha.end);
    const lambdaTCold = getAverageThermalInsulationLambda(tSurfaceCold, tCold);
    const lambdaTHot = getAverageThermalInsulationLambda(tSurfaceHot, tHot);
    const dTCold = tCold-tSurfaceCold;
    const dTHot = tHot-tSurfaceHot;
    const powerLose = getLogariphmicAvearge(lambdaTHot*dTHot, lambdaTCold*dTCold)*area/h;
    // console.log({tSurfaceCold, tSurfaceHot,tHot,tCold, dTCold, dTHot, lambdaTCold, lambdaTHot, powerLose});
    return powerLose;
}

const getLogariphmicAvearge = (x1, x2) => {
    if(x1 === x2){
        return x1;
    }
    return (x1-x2)/Math.log(x1/x2);
};


const getAverageAlpha = (a1, a2, perimeter1, perimeter2, h1, lambda1, h2  = 0, lambda2 =1000, perimeter11 = 0, perimeter22 = 1 ) => {
    perimeter11 = perimeter11 ?  perimeter11 : getLogariphmicAvearge(perimeter1, perimeter2);
    return 1/(1/a1 + perimeter1/(perimeter2*a2) + h1*perimeter1/(lambda1*perimeter11) + h2*perimeter1/(lambda2*perimeter22));
};

const getRadiationEmissivity = (t) => {
    const gasEmissionPower = 3.5*Math.pow((params.pCO2*0.9*params.d0), 0.333333)*Math.pow(t/100, 3.5);
    const blackBodyEmissionPower = 5.67*Math.pow(t/100, 4);
    return gasEmissionPower/blackBodyEmissionPower;
};


const gasRadiationEmissivity = (pH2O, pCO2, l, t) => {
    const pSum = pCO2+pH2O;
    const k = (0.78+1.6*pH2O -0.1*Math.pow(pSum, l/2))*(1-0.37*t/1000);
    return 1 - Math.exp(-k*Math.pow(pSum*l, 0.5));
}


const getRadiationAlpha = (Tg, Ts, Es, pH2O, pCO2, l) => {
    const Eg = gasRadiationEmissivity( pH2O, pCO2, l, Tg);
    const EgsCO2 = gasRadiationEmissivity(0, pCO2, l,Ts);
    const EgsH2O = gasRadiationEmissivity(pH2O, 0, l,Ts);
    const Egs = EgsCO2*Math.pow(Tg/Ts, 0.65) + EgsH2O*Math.pow(Tg/Ts, 0.45);
    const Ee = (Es+1)/2;

    const alpha = 5.67*Ee*(Eg*Math.pow(Tg/100, 4) - Egs*Math.pow(Ts/100, 4))/(Tg-Ts);
    //console.log({Ee, Eg, Egs, EgsCO2, EgsH2O, Tg, Ts, Es, pH2O, pCO2, l, alpha});
    return alpha;
}


const fullRadiationAlpha = (t1, t2, emissivity1 = 1, emissivity2= 1) => {
    //console.log({t1, t2, emissivity1, emissivity2});
    if(Math.abs(t1-t2)<params.zero){
        return 0;
    }
    return Math.abs(5.67*(emissivity1*Math.pow(t1/100, 4) - emissivity2*Math.pow(t2/100, 4))/(t1-t2));
}

const getTsmokeStart = (tFlame) => {
    let tSmokeStart = tFlame / params.flameToSmokeTRatio;
    return params.tSmokeStartMax>tSmokeStart? tSmokeStart : params.tSmokeStartMax;
}

const setParams = () => {
    autosetParams();

    params.tAirStart = kelvinFromCelsius(params.tAirStartC);
    params.densityAirStart = airDensity(params.tAirStart);

    params.d0 = params.d0mm/1000;
    params.h0 = params.h0mm/1000;
    params.thermalInsulationThickness = params.thermalInsulationThicknessMM/1000;
    params.refractoryMediumThickness = params.refractoryMediumThicknessMM/1000;

    //params.L0 =  getPerimeter(params.d0);
    //params.S0 = getArea(params.d0);
    params.Sair = getArea(params.d0, params.holeForm, 'air',params.nAir, params.nSmoke, params.refractoryMediumThickness, params.h0, params.nPasses);
    params.Ssmoke = getArea(params.d0, params.holeForm, 'smoke',params.nAir, params.nSmoke, params.refractoryMediumThickness, params.h0, params.nPasses);

    params.Lair =  getPerimeter(params.d0, params.holeForm, 'air',params.nAir, params.nSmoke, params.refractoryMediumThickness);
    params.Lsmoke = getPerimeter(params.d0, params.holeForm, 'smoke',params.nAir, params.nSmoke, params.refractoryMediumThickness);

    switch (params.holeForm) {
        case 'triangle':
            params.dSurface = params.d0*Math.pow(3/(Math.PI*16), 0.25)+4*params.refractoryMediumThickness+2*params.thermalInsulationThickness;
            break;
        case 'circle_in_ring':
            params.dSurface = params.d0+2*(params.thermalInsulationThickness+params.h0);
            break;
        default:
            params.dSurface = Math.ceil(Math.pow(params.nAir + params.nSmoke, 0.5))*(params.d0+params.refractoryMediumThickness)+params.refractoryMediumThickness+2*params.thermalInsulationThickness;
            break;
    }

    params.fPower = params.fPowerKW*1000;

    params.mPerHour = params.fPower*3600/params.fuelQ;

    params.refractoryMediumThickness = params.refractoryMediumThicknessMM/1000;
    params.pCO2 = params.pO2/params.kExcessAir;


    params.tAirEnd = kelvinFromCelsius(params.tAirEndC);
    params.tFlame = getFlameTemperature(params.tAirEnd);
    // console.log({tFlame: params.tFlame, tAirEnd: params.tAirEnd})
    params.tSmokeStart = getTsmokeStart(params.tFlame);
    params.tSmokeEnd = params.tAirStart*params.flameToSmokeTRatio;


    params.mAirPerHour = 32/(12*params.pO2)*params.kExcessAir*params.mPerHour*params.fuelQ/params.carbonQ;
    params.wAirStart = params.mAirPerHour/(params.densityAirStart*3600*params.Sair);
    params.wSmokeStart = params.wAirStart*getTemperetureExpansion(params.tAirStart, params.tSmokeStart)*params.Sair/params.Ssmoke;
    params.surfaceArea = Math.PI * params.dSurface * params.wantedRecuperatorLength;

    params.layers.splice(0);
    console.log(params.layers)
    for(let i=0; i<params.layersAmount; i++) {
        const layerData = {
            material: getParam(`layer[${i}].material`, params),
            h: getParam(`layer[${i}].h`, params)/1000,
            start: 0,
            end: 0,
        };
        if(layerData.h>0) {
            params.layers.push(layerData);
        }
    }
    params.totalLayersThicknessMM = 0;
    params.layers.forEach( layer => {
        params.totalLayersThicknessMM += layer.h*1000;
    });


    params.mSmokePerSecond = (params.mAirPerHour + params.mPerHour*( 1 - params.ashPart))/3600;
    params.furnaceInternalSizeA = params.furnaceInternalSize_a_CM/100;
    params.furnaceInternalSizeB = params.furnaceInternalSize_b_CM/100;
    params.furnaceInternalSizeC = params.furnaceInternalSize_c_CM/100;
};

const clearResult = () => {
    const elements = document.getElementsByClassName('clearable');
    Array.from(elements).forEach((element) => {
        element.textContent = '';
    });
}
const setResult = function(data){
    clearResult();
    for(let id in data) {
        const element = document.getElementById(id);
        if(element === null){
            console.log(`Element is null ${id}`);
            continue;
        }
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
                let isText = params.textParams.includes(id);
                params.textParamsREGEX.forEach((regex)=> isText = isText || regex.test(id));
                if(isText) {
                    element.textContent = data[id];
                }
                else {
                    element.textContent = data[id].toFixed(2).toString();
                }
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

    const tSmokeStartAirEndSurface = getLogariphmicAvearge(params.tAirEnd, params.tSmokeStart);
    const tSmokeEndAirStartSurface = getLogariphmicAvearge(params.tAirStart, params.tSmokeEnd);

    if(params.holeForm !== 'circle_in_ring') {
        params.alpha.air.convective.start = airConvectionAlpha(params.tAirStart, tSmokeEndAirStartSurface, params.wantedRecuperatorLength, params.d0, params.wAirStart);//getConvectiveAlpha(params.wAirStart);
        params.alpha.air.convective.end = airConvectionAlpha(params.tAirEnd, tSmokeStartAirEndSurface, params.wantedRecuperatorLength, params.d0, params.wAirEnd);//getConvectiveAlpha(params.wAirEnd);

        const rayLength = 0.9 * params.d0;
        params.alpha.air.radiation.start = getRadiationAlpha(params.tAirStart, tSmokeEndAirStartSurface, params.refractoryEmissivity, params.systemComposition.before.partial.H2O, params.systemComposition.before.partial.CO2, rayLength);
        params.alpha.air.radiation.end = getRadiationAlpha(params.tAirEnd, tSmokeStartAirEndSurface, params.refractoryEmissivity, params.systemComposition.before.partial.H2O, params.systemComposition.before.partial.CO2, rayLength);

        params.alpha.air.start = params.alpha.air.convective.start + params.alpha.air.radiation.start;
        params.alpha.air.end = params.alpha.air.convective.end + params.alpha.air.radiation.end;

        params.alpha.smoke.convective.start = airConvectionAlpha(params.tSmokeStart, tSmokeStartAirEndSurface, params.wantedRecuperatorLength, params.d0, params.wSmokeStart);//getConvectiveAlpha(params.wSmokeStart);
        params.alpha.smoke.convective.end = airConvectionAlpha(params.tSmokeEnd, tSmokeEndAirStartSurface, params.wantedRecuperatorLength, params.d0, params.wSmokeEnd);//getConvectiveAlpha(params.wSmokeEnd);


        params.alpha.smoke.radiation.start = getRadiationAlpha(params.tSmokeStart, tSmokeStartAirEndSurface, params.refractoryEmissivity, params.systemComposition.after.partial.H2O, params.systemComposition.after.partial.CO2, rayLength);
        params.alpha.smoke.radiation.end = getRadiationAlpha(params.tSmokeEnd, tSmokeEndAirStartSurface, params.refractoryEmissivity, params.systemComposition.after.partial.H2O, params.systemComposition.after.partial.CO2, rayLength);

        params.alpha.smoke.start = params.alpha.smoke.convective.start + params.alpha.smoke.radiation.start;
        params.alpha.smoke.end = params.alpha.smoke.convective.end + params.alpha.smoke.radiation.end;
    }
    else{
        const dSmoke = params.d0-2*params.refractoryMediumThickness;
        params.surfaces.smokeEndAirStart = calculateSurface (
            params.tSmokeEnd, dSmoke, params.wSmokeEnd, params.systemComposition.after.partial, 0.9*dSmoke,
            params.tAirStart, params.wAirStart, params.systemComposition.before.partial, 1.8*params.h0,
            params.refractoryEmissivity, params.refractoryMediumThickness, params.refractoryLambda,
            params.wantedRecuperatorLength,
            params.refractoryEmissivity,params.thermalInsulationThickness, 0.26,
            false,  false, params.tRoom,
            true,
            true,
            params.h0,
            params.smokeTurbulence,
        );

        params.surfaces.smokeStartAirEnd = calculateSurface (
            params.tSmokeStart, dSmoke, params.wSmokeStart, params.systemComposition.after.partial, 0.9*dSmoke,
            params.tAirEnd, params.wAirEnd, params.systemComposition.before.partial, 1.8*params.h0,
            params.refractoryEmissivity, params.refractoryMediumThickness, params.refractoryLambda,
            params.wantedRecuperatorLength,
            params.refractoryEmissivity,params.thermalInsulationThickness, 0.26,
            false,  false, params.tRoom,
            true,
            true,
            params.h0,
            params.smokeTurbulence,
        );

        params.alpha = {
            air: {
                start: params.surfaces.smokeEndAirStart.alpha.side23.total,
                end: params.surfaces.smokeStartAirEnd.alpha.side23.total,
                convective: {
                    start: params.surfaces.smokeEndAirStart.alpha.side23.convection,
                    end: params.surfaces.smokeStartAirEnd.alpha.side23.convection
                },

                radiation: {
                    start: params.surfaces.smokeEndAirStart.alpha.side23.radiation,
                    end: params.surfaces.smokeStartAirEnd.alpha.side23.radiation
                }
            },
            smoke: {
                start: params.surfaces.smokeStartAirEnd.alpha.side1.total,
                end: params.surfaces.smokeEndAirStart.alpha.side1.total,
                convective: {
                    start: params.surfaces.smokeStartAirEnd.alpha.side1.convection,
                    end: params.surfaces.smokeEndAirStart.alpha.side1.convection
                },

                radiation: {
                    start: params.surfaces.smokeStartAirEnd.alpha.side1.radiation,
                    end: params.surfaces.smokeEndAirStart.alpha.side1.radiation
                }
            },
            smokeEndAirStart:0,
            smokeStartAirEnd: 0,
            average: 0,
        }
    }
    params.alpha.smokeEndAirStart = getAverageAlpha(params.alpha.air.start, params.alpha.smoke.end, params.Lair, params.Lsmoke, params.refractoryMediumThickness, params.refractoryLambda);
    params.alpha.smokeStartAirEnd = getAverageAlpha(params.alpha.air.end, params.alpha.smoke.start, params.Lair, params.Lsmoke, params.refractoryMediumThickness, params.refractoryLambda);

    params.alpha.average = getLogariphmicAvearge(params.alpha.smokeEndAirStart, params.alpha.smokeStartAirEnd);

    params.averageDeltaT = getLogariphmicAvearge(params.tSmokeEnd-params.tAirStart, params.tSmokeStart-params.tAirEnd);

    const cSmokeStart = airCapacityIsobaric(params.tSmokeStart);
    const cSmokeEnd = airCapacityIsobaric(params.tSmokeEnd);
    params.cSmokeAverage = getLogariphmicAvearge(cSmokeStart, cSmokeEnd);

    const cAirStart = airCapacityIsobaric(params.tAirStart);
    const cAirEnd = airCapacityIsobaric(params.tAirEnd);
    params.cAirAverage = getLogariphmicAvearge(cAirStart, cAirEnd);

    params.smokeEnergyDecrease = systemEnergyChange(params.systemComposition.after.weightPartial, params.mPerHour, params.tSmokeStart, params.tSmokeEnd);
    //(params.mPerHour + params.mAirPerHour)*(params.tSmokeStart-params.tSmokeEnd)*params.cSmokeAverage;
    params.airEnergyIncrease = systemEnergyChange(params.systemComposition.before.weightPartial, params.mPerHour, params.tAirEnd, params.tAirStart);
    //params.mAirPerHour*(params.tAirEnd-params.tAirStart)*params.cAirAverage;

    if(params.holeForm !== 'circle_in_ring' ) {
        params.energyLost = getMaxThermalLose(tSmokeEnd, params.tSmokeStart, params.tRoom, params.alpha.smoke, params.thermalInsulationThickness, params.surfaceArea) * 3600;
    }
    else{
        params.energyLost = getMaxThermalLose(params.surfaces.smokeEndAirStart.tSurface3, params.surfaces.smokeStartAirEnd.tSurface3, params.tRoom, {start: 1000000, end: 1000000}, params.thermalInsulationThickness, params.surfaceArea) * 3600;
    }
    const totalEnergy = params.mPerHour*params.fuelQ;
    //params.energyReturnedPercents = params.airEnergyIncrease/totalEnergy*100;
    const smokeTotalEnergy = systemEnergyChange(params.systemComposition.after.weight, params.mPerHour, params.tSmokeStart, params.tAirStart);
    params.energyReturnedPercents = params.airEnergyIncrease/smokeTotalEnergy*100;

    if(params.smokeEnergyDecrease<params.airEnergyIncrease || params.airEnergyIncrease<0){
        return params.energyCriteriaError;
    }

    params.tAirEndC = celsiusFromKelvin(params.tAirEnd);
    params.tSmokeStartC = celsiusFromKelvin(params.tSmokeStart);
    params.tSmokeEndC = celsiusFromKelvin(params.tSmokeEnd);
    params.tFlameReal = celsiusFromKelvin(params.tFlame);

    params.recuperatorLength = params.airEnergyIncrease/(params.alpha.average*params.averageDeltaT*params.Lair*3600);
    params.realAirEnergyIncrease = params.recuperatorLength*params.airEnergyIncrease/params.wantedRecuperatorLength;
    params.realEnergyBalance = params.smokeEnergyDecrease - (params.airEnergyIncrease + params.energyLost)*params.recuperatorLength/params.wantedRecuperatorLength;
    params.currentTempEnergyBalance = params.smokeEnergyDecrease - params.airEnergyIncrease - params.energyLost;

    params.energyCriteria = Math.abs(params.realEnergyBalance) + Math.abs(params.currentTempEnergyBalance);

    //console.log({realEnergyBalance: params.realEnergyBalance,currentTempEnergyBalance:params.currentTempEnergyBalance })

    return params.energyCriteria;
}

const calculateTestData = (data) => {
    for(const item of data) {
        const {tSurface, tAir, w, d, l} = item;
        const forcedAlpha = airConvectionAlpha(tAir, tSurface, l, d, w);

        const naturalAlpha = airNaturalConvectionAlpha(tAir, tSurface, l, d, w);
        const naturalAlphaSimple = getConvectiveAlpha(w);
        const RadiationAlpha = getRadiationAlpha(tAir, tSurface, 0.8);
        console.log({tSurface, tAir, w, d, l, forcedAlpha, naturalAlpha, naturalAlphaSimple, RadiationAlpha});
    }
    const airData = []
    for(let t=273; t<1573; t+=100) {
        const Pr = airPrandtlnumber(t);
        const KinematicViscosity =airKinematicViscosity(t);
        const ThermalConductivity = airThermalConductivity(t);
        const Density = airDensity(t);
        const DynamicViscosity = airDynamicViscosity(t);
        const CapacityIsobaric = airCapacityIsobaric(t);
        const C =celsiusFromKelvin(t);
        airData.push({C,t, Density, DynamicViscosity, KinematicViscosity, ThermalConductivity, CapacityIsobaric, Pr});
    }
    console.log({airData});
    for(let t = 273; t<1274; t+=50) {
        console.log({
            t: celsiusFromKelvin(t),
            flameC: celsiusFromKelvin(findIsobaricFlameT(t)),
            tFlame1C: celsiusFromKelvin(findTflame(t, params.kExcessAir, params.aPressure, params.fuelQ))
        });
    }
}

const getEquivalentDiameter = (s) => {
    return Math.pow(4*s/Math.PI, 0.5);
}

const calculate = () => {
    setParams();


    for(let i=1; i<params.maxIterations; i++){
        const {tSmokeStart, tSmokeEnd, tAirStart, tAirEnd } = params;
        const currentCriteria = calculateCriteria(params, tSmokeEnd, tAirEnd);
        const divider = 2+Math.pow(i/5, 2);
        const dSmoke = (tSmokeStart - tSmokeEnd)/divider;
        const dAir = (tAirEnd - tAirStart)/divider;
        if( currentCriteria<params.criteria || (dSmoke < params.dTmin && dAir < params.dTmin) ) {
            /*console.log([tSmokeEnd>=tSmokeStart-50,
            tAirStart>=tAirEnd-50 ,
            tAirEnd>=tSmokeStart,
            tSmokeEnd<=tAirStart,
            currentCriteria<params.criteria
            ]);*/
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
            //console.log({criteriaResults, i, divider, dSmoke, dAir});
        }
    }

    console.log({params});
    console.log({surfaces: params.surfaces, refractoryMediumThicknessMM: params.refractoryMediumThicknessMM, refractoryLambda: params.refractoryLambda});
    let results = {
        tSmokeStartC: params.tSmokeStartC,
        tSmokeEndC: params.tSmokeEndC,
        sAirS: params.Sair*10000,
        sSmokeS: params.Ssmoke*10000,
        dAirS: getEquivalentDiameter(params.Sair)*100,
        dSmokeS: getEquivalentDiameter(params.Ssmoke)*100,
        wAirStart: params.wAirStart,
        wAirEnd: params.wAirEnd,
        wSmokeStart: params.wSmokeStart,
        wSmokeEnd: params.wSmokeEnd,
        energyReturnedPercents: params.energyReturnedPercents,
        recuperatorLength: params.recuperatorLength,
        tAirEndC: params.tAirEndC,
        tFlameReal: params.tFlameReal,
        mPerHour: params.mPerHour,
        airEnergyIncrease: params.airEnergyIncrease,
        smokeEnergyDecrease: params.smokeEnergyDecrease
    }

    const furnace = heatFluxFurnace(0.01,0.04 ,params.materials.chamotte_solid, params.materials.chamotte_400, params.refractoryEmissivity, params.wSmokeStart/5, params.systemComposition.after, kelvinFromCelsius(1400), params.tAirStart, 'cylinder', 0.1, 0.1);
    console.log(furnace);

    const furnace2 = heatFluxFurnace(0.02,0.03 ,params.materials.chamotte_1300, params.materials.chamotte_400, params.refractoryEmissivity, 19, params.systemComposition.after, kelvinFromCelsius(1500), params.tAirStart, 'sphere', 0.1, 0.1);
    console.log(furnace2);
    //calculateOptimalCoaxialTube(params);

    /*calculateFuelBurnLayer(
        params.mAirPerHour,
        params.mPerHour,
        Math.PI*0.2*0.2/4,// for now is area of circle with d=20cm
        params.systemComposition.before.partial,
        params.kExcessAir,
        params.tAirEnd, params.tFlame
    );*/

    //calculateTestData(testData);


    const furnaceMultyLayer = heatFluxFurnaceMultyLayer(
        params.layers,
        params.maxIterations,
        params.furnaceW,
        params.systemComposition.after,
        params.mSmokePerSecond,
        kelvinFromCelsius(params.tFlameFC),
        params.tAirStart,
        params.furnaceForm,
        params.furnaceInternalSizeA,
        params.furnaceInternalSizeB,
        params.furnaceInternalSizeC,

    );
    console.log({furnaceMultyLayer});
    results.tFurnaceInnerC = celsiusFromKelvin(furnaceMultyLayer.tInner);
    results.tFurnaceOuterC = celsiusFromKelvin(furnaceMultyLayer.tOuter);

    results.sInnerDM2 = furnaceMultyLayer.sInner*100;
    results.sOuterDM2 = furnaceMultyLayer.sOuter*100;

    results.furnaceTotalHeatLoss = furnaceMultyLayer.fluxOuter;
    results.furnaceHeatFluxInnerDensity = furnaceMultyLayer.fluxInner/results.sInnerDM2;


    results.alphaInnerTotal = furnaceMultyLayer.alphaInner.total;
    results.alphaInnerRadiation = furnaceMultyLayer.alphaInner.radiation;
    results.alphaInnerConvection = furnaceMultyLayer.alphaInner.convection;

    results.alphaOuter = furnaceMultyLayer.alphaOuter;
    results.totalLayersThicknessMM = params.totalLayersThicknessMM;
    results.tGasEndC = celsiusFromKelvin(furnaceMultyLayer.tGasEnd);
    results.tGasAverageC = celsiusFromKelvin(furnaceMultyLayer.tGasAverage);

    furnaceMultyLayer.betweenInsulation.forEach((betweenInsulation, index) => {
        results[`betweenLayers${index}.name`] = betweenInsulation.name;
        results[`betweenLayers${index}.tCelsius`] = betweenInsulation.tCelsius;
    });

    console.log(results);
    setResult(results);
    //Show results
    const resultElements = document.getElementsByClassName('calculation-results');
    Array.from(resultElements).forEach((element) => {
        element.classList.remove('results-hidden');
    });

};


const getSmokeArea = (dSmoke, dAir, hRefractory) => {
    return Math.PI*(Math.pow(dSmoke, 2) - Math.pow(dAir+2*hRefractory, 2))/4;
}


const fullGasAlpha = (Tg, Ts, Es, pH2O, pCO2, l, d, w = 0, isTurbulence = false) => {
    const convection = airConvectionAlpha (Tg, Ts, l, d, w, isTurbulence);
    const radiation =  getRadiationAlpha(Tg, Ts, Es, pH2O, pCO2, l);
    //  console.log({Tg, Ts, Es, pH2O, pCO2, l, d, w, convection, radiation});
    return {
        radiation,
        convection,
        total: radiation + convection
    };
}

const calculateSurface = (
    t1, d1, w1, systemComposition1, rayLength1, //inner side
    t2, w2, systemComposition2, rayLength2, //outer side
    E3, h3, lambda3,
    l,
    E4, h4=0, lambda4=1000,
    side1Toinfinity = false,
    side2Toinfinity = false,
    tInfinity = 273,
    infinityIsSurface3 = false,
    useInsulationFunctionForAverageLambda = false,
    h5 = 0.02, // air depth between 2 and 3
    smokeTurbulence = false,
    tSurface1 = 0,
    tSurface2 = 0,
    tSurface3 = 0,
    iteration = 0,
    maxIterations= params.maxIterations < 20 ? params.maxIterations : 20,
) => {
    /*                                  E4,h4,lambda4     E3,h3,lambda3
    t2, w2, systemComposition2     |----------------|++++++++++++++++|   t1, d1, w1, systemComposition1

                                      E3,h3,lambda3
    t2, w2, systemComposition2     |++++++++++++++++|   t1, d1, w1, systemComposition1



    infinityIsSurface3:
    used for scheme : core - smoke pipe into pipe with air and outer insulation

    |----insulation----|      Air      |++|        Smoke       |++|      Air      |----insulation----|      Room air


                    E4,h4,lambda4                                         E3,h3,lambda3
    tInfinity T4|----------------|T3     t2, w2, systemComposition2   |++++++++++++++++|   t1, d1, w1, systemComposition1
     */


    tSurface1 = tSurface1 === 0 ? (t1+t2)/2 : tSurface1;
    tSurface2 = tSurface2 === 0 ? (t1+t2)/2 : tSurface2;
    tSurface3 = tSurface3 === 0 && infinityIsSurface3 ? (tInfinity+t2)/2 : tSurface3;

    const alpha = {
        side1: fullGasAlpha (
            t1, tSurface1, E3, systemComposition1.H2O,
            systemComposition1.CO2, l, rayLength1/*0.9*d1*/, w1,
            smokeTurbulence
        ),
        side2: fullGasAlpha (
            t2, tSurface2, E4, systemComposition2.H2O,
            systemComposition2.CO2, l, rayLength2/*1.8*(dSmoke-d2)*/, w2
        ),
        side3: {},
        side23: {}, // average data for S2+S3 calculated as for side S2 (P23=alpha23*S2=alpha2*S2+alpha3*s3)
        average: 0,
    };

    const d2 = !infinityIsSurface3 ? d1+2*(h3+h4): d1+2*h3;
    const dT = Math.abs(t1-t2);

    if(side1Toinfinity){
        alpha.side1.radiation = fullRadiationAlpha(tSurface1, tInfinity, E3);
        alpha.side1.total =  alpha.side1.convection + alpha.side1.radiation;
    }
    if(side2Toinfinity){
        alpha.side2.radiation = fullRadiationAlpha(tSurface2, tInfinity, E4);
        alpha.side2.total =  alpha.side2.convection + alpha.side2.radiation;
    }


    if(!infinityIsSurface3) {
        alpha.average = getAverageAlpha(
            alpha.side1.total, alpha.side2.total, d1, d2, h3, lambda3, h4, lambda4, d1+h3, d2+2*h3+h4 );
    }
    else {
        alpha.average = getAverageAlpha(
            alpha.side1.total, alpha.side2.total, d1, d2, h3, lambda3);
    }
    const t1Factor = t1<t2 ? 1 : -1;
    tSurface1 = t1Factor*alpha.average*d1*dT/(alpha.side1.total*d1)+t1;
    tSurface2 = t2 - t1Factor*alpha.average*d1*dT/(alpha.side2.total*d2);
    if(infinityIsSurface3){
        //re-emission to back surface
        const radiation = fullRadiationAlpha(tSurface2, tSurface3, E4);
        const d3 = d1+2*(h3+h5);
        const d34 = d3+h4;
        if(useInsulationFunctionForAverageLambda) {
            lambda4 = getThermalInsulationLambda(tSurface2);
        }
        tSurface3 = (radiation*d2*tSurface2 + alpha.side2.convection*t2*d3 + lambda4*tInfinity*d34/h4)/
            (lambda4*d34/h4 + alpha.side2.convection*d3 + radiation*d2);
        alpha.side3 = fullGasAlpha (
            t2, tSurface3, E4, systemComposition2.H2O,
            systemComposition2.CO2, l, rayLength2/*1.8*(dSmoke-d2)*/, w2
        );
        alpha.side23 = {
            convection: alpha.side2.convection + alpha.side3.convection*d3/d2,
            radiation: alpha.side2.radiation + alpha.side3.radiation*d3/d2,
        };
        alpha.side23.total =  alpha.side23.convection + alpha.side23.radiation;

    }
    const standardLength = 1;
    const flux = alpha.average*Math.abs(t1-t2)*d1*standardLength;
    iteration++;
    if(iteration>=maxIterations) {
        // outer surface with cooling by room air
        const tSurface4 = infinityIsSurface3 ? getMaxSurfaceTemperature(tSurface3, tInfinity, h4, 1000000 ) : 0;

        return {
            alpha,
            t1, t2,
            tSurface1,
            tSurface2,
            tSurface3,
            tSurface4,
            flux
        }
    }
    else{
        return calculateSurface (
            t1, d1, w1, systemComposition1, rayLength1, //inner side
            t2, w2, systemComposition2, rayLength2, //outer side
            E3, h3, lambda3,
            l,
            E4, h4, lambda4,
            side1Toinfinity,
            side2Toinfinity,
            tInfinity,
            infinityIsSurface3,
            useInsulationFunctionForAverageLambda,
            h5,
            smokeTurbulence,
            tSurface1,
            tSurface2,
            tSurface3,
            iteration,
        );
    }
}

const getFormDimentions = (form, a, b=0, c=0, h = 0) => {
    /*
        lSurface - characteristic height (for example for natural convection)
        dSurface - characteristic diameter
     */
    let lSurface, dSurface;
    switch(form){
        case 'sphere':
            lSurface = 2*(a+h);
            dSurface = 2*(a+h);
            break;
        case 'cylinder':
            lSurface = b+2*h;
            dSurface = 2*a;
            break;
        case 'cube':
            lSurface = a+2*h;
            dSurface = a+2*h;
            break;
    }
    return {lSurface, dSurface};
}

const surfaceFunction = (form, a, b=0, c=0, h=0) => {
    /*
        sphere - a - radius
        cylinder - a - radius, b - height
        cube - a
        h - insulation thickness
     */
    let surface;
    switch(form){
        case 'sphere':
            surface = 4*Math.PI*Math.pow(a+h, 2);
            break;
        case 'cylinder':
            surface = 2*Math.PI*Math.pow(a+h, 2) + 2*Math.PI*(a+h)*(b+2*h);
            break;
        case 'cube':
            surface = 6*Math.pow(a+2*h, 2);
            break;
    }
    return surface;
}

const getRayLength = (form, a, b = 0, c = 0) => {
    /*
        sphere 0.6d
        cylinder h=d 0.6d
        cylinder infinite 0.9d
        parallel  infinite surface 1.8d
        cube 0.6h
        in general - 3.6V/S
     */
    let length;
    switch (form) {
        case 'sphere':
            length = 0.6*2*a;
            break;
        case 'cylinder':
            length = 3.6*a*b/(2*a+2*b);
            break;
        case 'cube':
            length = 0.6*a;
            break;
    }
    return length;
}
//Emissivity coefficient
const getEmissivity = (type, t) => {
    let E;
    switch (type) {
        //Fire brick (medium Al2O3 content)
        case params.materials.chamotte_solid:
            E = emissivityFunction(0.84, -20, 0, 0, t, 673, 1673)
            break;
        //Fire brick (medium Al2O3 content)
        case params.materials.chamotte_1300:
            E = emissivityFunction(0.84, -20, 0, 0, t, 673, 1673)
            break;
        //Fire brick (medium Al2O3 content)
        case params.materials.chamotte_1000:
            E = emissivityFunction(0.84, -20, 0, 0, t, 673, 1673)
            break;
        //Fire brick (medium Al2O3 content)
        case params.materials.chamotte_900:
            E = emissivityFunction(0.84, -20, 0, 0, t, 673, 1673)
            break;
        //Fire brick (medium Al2O3 content)
        case params.materials.chamotte_600:
            E = emissivityFunction(0.84, -20, 0, 0, t, 673, 1673)
            break;
        //Fire brick (medium Al2O3 content)
        case params.materials.chamotte_400:
            E = emissivityFunction(0.84, -20, 0, 0, t, 673, 1673)
            break;


        case params.materials.mullite_2300:
            //Fire brick (high Al2O3 content)
            E = emissivityFunction(0.8, -20, 0, 0, t, 673, 1673)
            //Mullite brick
            E = emissivityFunctionExponent(26.186, -0.555, 0, t, 600, 2000)
            break;
        //Fire brick (low Al2O3 content)
        case params.materials.quartz_2000:
            E = emissivityFunction(0.9, -10, 0, 0, t, 673, 1673)
            break;
        //Fire brick (low Al2O3 content)
        case params.materials.quartz_1000:
            E = emissivityFunction(0.9, -10, 0, 0, t, 673, 1673)
            break;
        case params.materials.quartz_sand_1:
            E = emissivityFunction(0.9, -10, 0, 0, t, 673, 1673)
            break;
        case params.materials.quartz_sand_02:
            E = emissivityFunction(0.9, -10, 0, 0, t, 673, 1673)
            break;
        case params.materials.quartz_sand_05:
            E = emissivityFunction(0.9, -10, 0, 0, t, 673, 1673)
            break;

        case params.materials.alumina_2500:
            E = emissivityFunction(0.98, -53, 10.2, 0, t, 300, 1800)

            break;
        // Lightweight alumina 1300g/l
        case params.materials.alumina_1300:
            E = emissivityFunctionExponent(5.6674, -0.3664, 0, t, 600, 2000)
            break;
        case params.materials.alumina_sand_1:
            E = emissivityFunction(0.98, -53, 10.2, 0, t, 300, 1800)
            break;
        case params.materials.alumina_sand_05:
            E = emissivityFunction(0.98, -53, 10.2, 0, t, 300, 1800)
            break;
        case params.materials.alumina_sand_02:
            E = emissivityFunction(0.98, -53, 10.2, 0, t, 300, 1800)
            break;

        case params.materials.silicon_carbide:
            E = emissivityFunction(0.8, 15.4, -9.01, 0, t, 400, 1850)
            break;

        case params.materials.basalt_fiber_mat:
            E = emissivityFunction(0.92, 0, 0, 0, t, 300, 400)
            break;
    }
    return E;
}
const emissivityFunctionExponent = (a, b, t, tMin, tMax) => {
    if(t>tMax){
        t = tMax;
    }
    if(t<tMin){
        t=tMin;
    }
    return a*Math.pow(t, b);
}

const emissivityFunction = (a, b, c, d, t, tMin, tMax) => {
    if(t>tMax){
        t = tMax;
    }
    if(t<tMin){
        t=tMin;
    }
    return a+1E-5*b*t+1E-8*c*t*t+1e-10*d*t*t*t;
}

//Coefficient of thermal conductivity
const getLambda = (type, t) =>
{
    let lambda;
    const tCelcius = celsiusFromKelvin(t);
    switch (type) {
        case params.materials.chamotte_solid:
            lambda = 0.7+0.00064*tCelcius;
            break;
        case params.materials.chamotte_1300:
            lambda = 0.47+0.00035*tCelcius;
            break;
        case params.materials.chamotte_1000:
            lambda = 0.35+0.00035*tCelcius;
            break;
        case params.materials.chamotte_900:
            lambda = 0.29+0.00023*tCelcius;
            break;
        case params.materials.chamotte_600:
            lambda = 0.13+0.00028*tCelcius;
            break;
        case params.materials.chamotte_400:
            lambda = 0.1+0.00021*tCelcius;
            break;

        case params.materials.mullite_2300:
            lambda = 1.55+0.0002*tCelcius;
            break;

        case params.materials.quartz_2000:
            lambda = 0.815+0.00067*tCelcius;
            break;
        case params.materials.quartz_1000:
            lambda = 0.55+0.0003*tCelcius;
            break;
        case params.materials.quartz_sand_1://quartz_1000
            lambda = 0.55+0.0003*tCelcius;
            break;
        case params.materials.quartz_sand_02://quartz_1000
            lambda = 0.55+0.0003*tCelcius;
            break;
        case params.materials.quartz_sand_05://quartz_1000
            lambda = 0.55+0.0003*tCelcius;
            break;

        case params.materials.alumina_2500:
            lambda = 1.9+0.0016*tCelcius;
            break;
        case params.materials.alumina_1300:
            lambda = 0.84-0.00035*tCelcius;
            break;
        case params.materials.alumina_sand_1://alumina_1300
            lambda = 0.84-0.00035*tCelcius;
            break;
        case params.materials.alumina_sand_05://alumina_1300
            lambda = 0.84-0.00035*tCelcius;
            break;
        case params.materials.alumina_sand_02://alumina_1300
            lambda = 0.84-0.00035*tCelcius;
            break;

        case params.materials.silicon_carbide:
            lambda = 13.73-0.004555*tCelcius;
            break;

        case params.materials.basalt_fiber_mat:
            lambda =  0.139 - 7.97*Math.pow(10,-5)*tCelcius + 1.3*Math.pow(10,-7)*Math.pow(tCelcius, 2) + 2.73*Math.pow(10,-10)*Math.pow(tCelcius, 3);
            break;
    }
    return lambda;
}

const heatFluxFurnace = (h1,h2,lambda1, lambda2, E, w, composition, tFlame, tAir, form, a, b =0, c=0, endFactor = 0.001) =>
{
    //console.log({h1,h2,lambda1, lambda2, E, w, composition, tFlame, tAir, form, a, b, c, endFactor});
    let tOuter = tAir;
    let tInnerMin = tOuter;
    let tInnerMax = tFlame;
    let tInner = getLogariphmicAvearge(tInnerMin,tInnerMax);
    let tBetweenInsulation;
    let fluxInner, fluxOuter;
    let alphaInner, alphaOuter;

    const h = h1+h2;
    const numberOfSteps = 50;
    const step = h/numberOfSteps;
    const rayLength = getRayLength(form, a, b, c);
    const sInner = surfaceFunction(form, a, b, c);
    const sOuter = surfaceFunction(form, a, b, c, h);
    const dimentionsInner = getFormDimentions(form, a, b, c);
    const dimentionsOuter = getFormDimentions(form, a, b, c, h);

    for(let i=0; i< numberOfSteps; i++) {
        tInner = getLogariphmicAvearge(tInnerMin,tInnerMax);
        alphaInner = fullGasAlpha (
                tFlame, tInner, E, composition.partial.H2O,
                composition.partial.CO2, dimentionsInner.dSurface, rayLength, w);
        fluxInner = alphaInner.total*(tFlame-tInner)*sInner;
        //console.log({tInner, alphaInner, fluxInner, sInner, sOuter});
        let isFirstLayer = true;
        let tCurrent = tInner;
        let x = 0;
        let surfaceCurrent = sInner;
        while(x<h) {
            let stepCurrent = step;
            let lambdaCurrent = isFirstLayer ? getLambda(lambda1,tCurrent) :  getLambda(lambda2,tCurrent);
            let isLayerBorder = false;
            if(isFirstLayer) {
                if(x + stepCurrent >= h1) {
                    stepCurrent = h1 - x;
                    isFirstLayer = false;
                    isLayerBorder = true;
                }
            }
            else if(x + step > h){
                stepCurrent = h - x;
            }
            x +=stepCurrent;
            const surfaceNext = surfaceFunction(form, a, b, c, x);
            const surfaceAverage = (surfaceNext + surfaceCurrent)/2;
            const dT = fluxInner*stepCurrent/(surfaceAverage*lambdaCurrent);
            tCurrent -= dT;
            if(isLayerBorder) {
                tBetweenInsulation = tCurrent;
            }
            if(tCurrent<tAir){
                x=h;
            }
        }
        tOuter = tCurrent;
        let currentEndFactor;
        if(tCurrent<tAir){
            tInnerMin = tInner;
        }
        else{
            alphaOuter = getFullNaturalConvectionAlpha(tAir, tOuter, dimentionsOuter.lSurface, dimentionsOuter.dSurface, E);
            fluxOuter = alphaOuter*(tOuter-tAir)*sOuter;
            currentEndFactor = Math.abs(2*(fluxInner - fluxOuter)/(fluxInner+fluxOuter));
            if(currentEndFactor <= endFactor) {
                console.log({i,
                    currentEndFactor,
                    tInnerC: celsiusFromKelvin(tInner),
                    tOuterC:celsiusFromKelvin(tOuter),
                    tBetweenInsulationC:celsiusFromKelvin(tBetweenInsulation),
                    dT_inner: tFlame-tInner,
                    fluxOuter,
                    fluxInner,
                    alphaInner,
                    alphaOuter});
                break;
            }
            else{
                if(fluxInner>fluxOuter) {
                    tInnerMin = tInner;
                }
                else{
                    tInnerMax = tInner
                }
            }
        }
    }
    return {tInner, tOuter, tBetweenInsulation, fluxOuter, fluxInner, alphaInner, alphaOuter}
}


const getLayerNumber = (x, layers) => {
    for (let i=0; i<= layers.length; i++) {
        if (x >= layers[i].start && x < layers[i].end) {
            return i;
        }
    }
    return -1;
}

const getFlameSmokeSurfaceBalance = (surface, tFlame, tSurface, dSurface, E, w, rayLength, composition, mComposition, maxStep = 50, step = 0) => {
    const alphaInner = fullGasAlpha (
        tFlame, tSurface, E, composition.partial.H2O,
        composition.partial.CO2, dSurface, rayLength, w);
    const fluxInner = alphaInner.total*(tFlame-tSurface)*surface;

}
const celsiusFromKelvin = (t) => {
    return t-273;
}

const kelvinFromCelsius = (t) => {
    return t+273;
}

const furnaceFluxInnerRecursion = (tFlame, tGasEnd, tInner, E, composition, dSurface, rayLength, w, sInner, mPerSecond, tGasEndDiff = 0.5, recursion = 50) => {
    const tGasEndOld = tGasEnd;
    let tGasAverage = getLogariphmicAvearge(tFlame, tGasEnd);

    const alphaInner = fullGasAlpha ( tGasAverage, tInner, E, composition.partial.H2O, composition.partial.CO2, dSurface, rayLength, w);

    let fluxInner = alphaInner.total*(tGasAverage-tInner)*sInner;
    const compositionHeatCapacity = getGasSystemCapacity(composition.weightPartial, tFlame, tGasEnd);
    let dT = fluxInner/(compositionHeatCapacity*mPerSecond);
    let tOverloaded = false;

    if(tFlame - dT > tInner) {
        tGasEnd = tFlame - dT;
    }
    else{
        tGasEnd = tInner;
        tOverloaded = true;
    }

    tGasAverage = getLogariphmicAvearge(tFlame, tGasEnd);
    const isInvalidTgasEnd = Math.abs(tGasEnd-tGasEndOld)>tGasEndDiff;
    console.log({recursion, tOverloaded, alphaInner, tInner, tFlame, tGasEnd, tGasEndOld, tGasAverage, fluxInner, sInner, compositionHeatCapacity});
    let dTaverage = tGasAverage - tInner;
    if(tOverloaded && !isInvalidTgasEnd){
        //Thermal flux is limited by gas energy capacity
        dT = tFlame - tGasEnd;
        const fluxInnerMax = compositionHeatCapacity*mPerSecond*dT;
        const alphaInnerTotalMax = fluxInnerMax/(dTaverage*sInner);
        fluxInner = fluxInnerMax;
        alphaInner.total = alphaInnerTotalMax;
    }
    console.log({recursion, tOverloaded, alphaInner,  tInner, tFlame, tGasEnd, tGasEndOld, tGasAverage, dT, dTaverage, fluxInner, sInner, compositionHeatCapacity});
    if(recursion>0 && isInvalidTgasEnd) {
        return furnaceFluxInnerRecursion(tFlame, tGasEnd, tInner, E, composition, dSurface, rayLength, w, sInner, mPerSecond, tGasEndDiff,recursion-1);
    }
    else {
        return {tGasEnd, tGasAverage, alphaInner, fluxInner};
    }
}

const heatFluxFurnaceMultyLayer = (layers, step, w, composition, mPerSecond, tFlame, tAir, form, a, b =0, c=0, endFactor = 0.001) =>
{
    //console.log({h1,h2,lambda1, lambda2, E, w, composition, tFlame, tAir, form, a, b, c, endFactor});
    let tGasEnd = tFlame;
    console.log({tFlame, tGasEnd});
    let tGasAverage = getLogariphmicAvearge(tFlame, tGasEnd);
    let tOuter = tAir;
    let tInnerMin = tOuter;
    let tInnerMax = tGasAverage;
    let tInner = getLogariphmicAvearge(tInnerMin,tInnerMax);
    let betweenInsulation = [];
    let fluxInner, fluxOuter;
    let alphaInner, alphaOuter;

    const h = layers.reduce(
        (totalThickness, currentValue) => totalThickness + currentValue.h,
        0,
    );

    let stepMax = h/step;
    let currentPosition = 0;
    for (let i=0; i< layers.length; i++) {
        layers[i].start= currentPosition;
        layers[i].end= currentPosition + layers[i].h;
        stepMax = stepMax<layers[i].h ? stepMax : layers[i].h;
        currentPosition = layers[i].end;
    }
    const rayLength = getRayLength(form, a, b, c);
    const sInner = surfaceFunction(form, a, b, c);
    const sOuter = surfaceFunction(form, a, b, c, h);
    const dimentionsInner = getFormDimentions(form, a, b, c);
    const dimentionsOuter = getFormDimentions(form, a, b, c, h);

    console.log({tFlame, tGasEnd});
    for(let i=0; i< step/10; i++) {
        tInner = (tInnerMin + tInnerMax)/2;

        const emissivityInner = getEmissivity(layers[0].material, tInner);
        console.log({tFlame, tGasEnd, tInner, material: layers[0].material, emissivityInner, composition});
        const recursionResult = furnaceFluxInnerRecursion(tFlame, tGasEnd, tInner, emissivityInner, composition, dimentionsInner.dSurface, rayLength, w, sInner, mPerSecond);
        alphaInner= recursionResult.alphaInner;
        fluxInner = recursionResult.fluxInner;
        tGasEnd = recursionResult.tGasEnd;
        tGasAverage = recursionResult.tGasAverage;

        let tCurrent = tInner;
        let x = 0;
        let surfaceCurrent = sInner;
        betweenInsulation = [];
        while(x<h) {
            let stepCurrent = stepMax;
            const layerNumber = getLayerNumber(x, layers);
            if(layerNumber < 0) {
                throw new Error("Undefined layer");
                break;
            }
            let lambdaCurrent =getLambda(layers[layerNumber].material,tCurrent);
            let isLayerBorder = false;
            if(x+stepCurrent>=layers[layerNumber].end){
                stepCurrent = layers[layerNumber].end - x;
                isLayerBorder = true;
            }
            x +=stepCurrent;
            const surfaceNext = surfaceFunction(form, a, b, c, x);
            const surfaceAverage = (surfaceNext + surfaceCurrent)/2;
            const dT = fluxInner*stepCurrent/(surfaceAverage*lambdaCurrent);
            surfaceCurrent = surfaceNext;
            tCurrent -= dT;
            if(isLayerBorder) {
                const nextLayerNumber = layerNumber+1 <= layers.length-1 ? layerNumber+1 : -1;
                if(nextLayerNumber>0) {
                    betweenInsulation.push({
                        name: `layer ${layerNumber} (${layers[layerNumber].material}) - layer ${nextLayerNumber} (${layers[nextLayerNumber].material})`,
                        t: tCurrent,
                        tCelsius: celsiusFromKelvin(tCurrent)
                    });
                }
            }
            surfaceCurrent = surfaceNext;
            if(tCurrent<tAir){
                x=h;
            }
        }
        tOuter = tCurrent;
       // let currentEndFactor;

        const emissivityOuter = getEmissivity(layers[layers.length-1].material, tOuter);
        console.log({emissivityOuter, material: layers[layers.length-1].material})
        alphaOuter = getFullNaturalConvectionAlpha(tAir, tOuter, dimentionsOuter.lSurface, dimentionsOuter.dSurface, emissivityOuter);
        fluxOuter = alphaOuter*(tOuter-tAir)*sOuter;
        const compositionHeatCapacity = getGasSystemCapacity(composition.weightPartial, tFlame, tGasEnd);
        tGasEnd = tFlame - fluxInner/(compositionHeatCapacity*mPerSecond);
        tGasAverage = getLogariphmicAvearge(tFlame, tGasEnd);
        const currentEndFactor = Math.abs((fluxInner*fluxInner - fluxOuter*fluxOuter)/(fluxInner*fluxOuter));
        //console.log({ i, currentEndFactor,tInner, tOuter, tInnerMin, tInnerMax,tGasEnd, tGasAverage,  fluxInner, fluxOuter, alphaInner, alphaOuter});
        if(tCurrent<tAir){
            tInnerMin = tInner;
        }
        else{
            if(currentEndFactor <= endFactor) {
                console.log({i,
                    currentEndFactor,
                    tInnerC: celsiusFromKelvin(tInner),
                    tOuterC:celsiusFromKelvin(tOuter),
                    betweenInsulation,
                    dtInner: tFlame-tInner,
                    fluxOuter,
                    fluxInner,
                    alphaInner,
                    alphaOuter,
                    tGasEndC: celsiusFromKelvin(tGasEnd),
                    tFlameC: celsiusFromKelvin(tFlame),
                    tGasAverage: celsiusFromKelvin(tGasAverage),
                });
                break;
            }
            else{if(fluxInner>fluxOuter) {
                    tInnerMin = tInner;
                }
                else{
                    tInnerMax = tInner;
                }
            }
        }
    }
    return {tInner, tOuter, sInner, sOuter, betweenInsulation, fluxOuter, fluxInner, alphaInner, alphaOuter, tGasEnd, tGasAverage};
}


const heatFlux = (
    tAir, tSmoke, tRoom,  Es, dSmoke, dAir,
    hRefractory, hInsulation, refractoryLambda, l,
    systemComposition, mAirPerHour, densityAirStart
) => {
    const sAir = Math.PI * Math.pow(dAir, 2) / 4;
    let sSmoke = getSmokeArea(dSmoke, dAir, hRefractory);
    if (sSmoke<=params.zero){
        return params.zero;
    }
    const wAir = mAirPerHour / (densityAirStart * 3600 * sAir);
    const wSmoke = wAir * getTemperetureExpansion(tAir, tSmoke) * sAir / sSmoke;
    console.log({wSmoke, wAir});

    const surfaceInner = calculateSurface (
        tAir, dAir, wAir, systemComposition.before.partial, 0.9*dAir,
        tSmoke, wSmoke, systemComposition.after.partial, 1.8*(dSmoke-dAir-2*hRefractory),
        Es, hRefractory, refractoryLambda,
        l,
        Es
    );

    const surfaceOuter = calculateSurface (
        tSmoke, dSmoke, wSmoke, systemComposition.after.partial, 1.8*(dSmoke-dAir),
        tRoom, 0, systemComposition.room.partial, 0,
        Es, hRefractory, refractoryLambda,
        l,
        Es, hInsulation, getLogariphmicAvearge(getThermalInsulationLambda(tRoom), getThermalInsulationLambda(tSmoke)),
        false, true,
        tRoom,
    );
    const outerSteelTubeWithAir = calculateSurface (
        tSmoke, dSmoke, wSmoke, systemComposition.after.partial, 1.8*(dSmoke-dAir),
        tAir, wAir, systemComposition.before.partial, 0.04,
        Es, hRefractory, refractoryLambda,
        l,
        Es,false, true,
        false,  true, tAir,
        true,

    );
    console.log({dSmoke, surfaceInner, surfaceOuter, outerSteelTubeWithAir});
    return surfaceInner.flux - surfaceOuter.flux;
}


const calculateOptimalCoaxialTube = (params) => {
    const {
        tAirEnd: tAir,
        tSmokeStart: tSmoke,
        d0: dAir,
        thermalInsulationThickness: hInsulation,
        refractoryMediumThickness: hRefractory,
        refractoryEmissivity: Es,
        refractoryLambda,
        wantedRecuperatorLength: l,
        systemComposition,
        mAirPerHour,
        densityAirStart,
        tRoom,
        maxIterations,
    } = params;

    let dSmoke = 1.5 * dAir + 2 * hRefractory;
    const k = 1; // min sSmoke/sAir
    const dSmokeMin = Math.pow(Math.pow(dAir+ 2 * hRefractory, 2) + k*Math.pow(dAir, 2), 0.5);
    let factor = 0.2;
    let f = 0.6;
    for(let i=0; i<maxIterations; i++) {
        const flux = [];
        const dX = (dSmoke-(dAir + 2 * hRefractory))*factor;
        const dSmoke1 = dSmoke + dX;
        const dSmoke2 = dSmoke - dX;
        flux.push( {dSmoke, flux: heatFlux(
            tAir, tSmoke, tRoom,  Es, dSmoke, dAir,
                hRefractory, hInsulation, refractoryLambda, l,
                systemComposition, mAirPerHour, densityAirStart
        )});
        flux.push( {dSmoke1, flux: heatFlux(
                tAir, tSmoke, tRoom,  Es, dSmoke1, dAir,
                hRefractory, hInsulation, refractoryLambda, l,
                systemComposition, mAirPerHour, densityAirStart
            )});
        flux.push( {dSmoke2, flux: heatFlux(
                tAir, tSmoke, tRoom,  Es, dSmoke2, dAir,
                hRefractory, hInsulation, refractoryLambda, l,
                systemComposition, mAirPerHour, densityAirStart
            )});
        flux.sort((a,b) => {return b.flux-a.flux});
        console.log({flux});
        dSmoke = flux[0].dSmoke > dSmokeMin ? flux[0].dSmoke : dSmokeMin;
        factor = factor*f;
        if(dX<0.0001){
            break;
        }
    }
    const sAir = Math.PI * Math.pow(dAir, 2) / 4;
    const sSmoke = getSmokeArea(dSmoke, dAir, hRefractory);
    console.log({dSmoke, 'dSmoke/dAir': dSmoke/dAir, 'sSmoke/sAir': sSmoke/sAir, });
}



getKburning = (
    E, // activation energy
    pX, // partial
    t
) => {
    const k0 = Math.pow(0.208*E/10000 + 1, 10);
    return k0*Math.exp(-E/(8.31*t))*pX;
}

const getDXMoles = (N, pX, pXc, S, aD, t) => {
    return (aD/(8.314*t))*1/(1+N)*pXc*S;
}

const getNewPartial = (N, pX, pXc, molesTotal, molesTotalNew, S, aD, t) => {
    const dM = getDXMoles(N, pX, pXc, S, aD, t);
    return (molesTotal*pX+dM)/molesTotalNew;
}

calculateFuelBurnLayer = (
    mAirPerHour,
    mPerHour,
    s0, // fuel box area
    systemComposition,
    kExcessAir,
    tAir, tFlame,
    V=0.005, // default 5l
    size = 0.04, // default 40mm
    volumeDensity = 0.5,
    density = 1, //g/cm3
    formFactor = 8, // S/V [1/d], 6 for sphere, this slightly more
    n = 1.9,
    maxIterations= 10,
 ) => {
    let {O2: pO2, CO2: pCO2, H2O: pH2O, CO: pCO, H2: pH2, N2: pN2} = systemComposition;
    const weightPerOneMole = pO2*0.032+pCO*0.044+pH2O*0.018+pCO*0.028+pH2*0.002+pN2*0.028;
    //let molesTotal = mAirPerHour/(3600*weightPerOneMole);
    //let molesTotalBefore = totalMolesInSecond;

    const S = Math.pow(volumeDensity, 2/3)*s0;
    const sArea = formFactor*V*volumeDensity/size;

    const tAverage = getLogariphmicAvearge(tAir, tFlame);
    const airDensityTair = airDensity(tAir);
    const airDensityTflame = airDensity(tFlame);

    const wAir = mAirPerHour/(3600*airDensityTair*S);
    const wFlame = mAirPerHour/(3600*airDensityTflame*S);
    const w = getLogariphmicAvearge(wAir, wFlame);

    console.log({wAir, wFlame, w: getLogariphmicAvearge(wAir, wFlame)});

    const E1 = 140000; // J/mol activation energy of reaction C+O2=>CO2+395kJ/mol
    const E2 = 1.1*E1; // 2C+O2=>2CO+219kJ/mol
    const E3 = 2.2*E1; // C+CO2=>2CO-175.5kJ/mol
    const E31 = 1.6*E1; // C+H2O=>CO+H2-130.5kJ/mol
    const E4 = 96300; // 2C0+O2=>2CO2+571kJ/mol


    let GcSum = 0;
    const h = V/s0;
    const dH = h/maxIterations;
    const dS = S/maxIterations;
    for(let i=0; i<maxIterations; i++) {
        const k1 = getKburning(E1, pO2, tAverage);
        const k2 = getKburning(E2, pO2, tAverage);
        const k3 = getKburning(E3, pCO2, tAverage);
        const k31 = getKburning(E31, pH2O, tAverage);
        const k4 = getKburning(E4, pCO*pO2, tAverage);
        /*
            Reaction 32,33,4,42,43 don't run or run very slow at the surface layer
            Reaction 41 not actual when use coke - no free hydrogen
        */

        /*
        const E32 = ?; // C+2H2O=>CO2+2H2-132kJ/mol
        const E33 = ?; // C+2H2=>CH4-74.9kJ/mol
        const E41 = ?; // 2H2+O2=>2H2O+231kJ/mol
        const E42 = ?; // CH4+2O2=>2H2O+CO2+892kJ/mol
        const E43 = ?; // CO+H2O=>CO2+H2+40.4kJ/mol
        */
        const { Nu } = airNusseltNumber(tAir, tFlame, size, size, w, true, true);

        const D0= (0.004+0.075*density)*Math.pow(tAverage/273, 2)/10000; // m/s
        //const D0 = 0.16/10000*Math.pow((tAir+tFlame)/2, n); //Бабий стр 106
        const aD = D0/size;


        const N1 = k1/aD;
        const N2 = k2/aD;
        const N3 = k3/aD;
        const N31 = k31/aD;
        const N4 = k4/aD;

        const r = size/2;
        //const Gc = aD/(8.314*tAverage)*1/((1+N3)*1+N1+N2)*
        const pO2c = pO2*101000/(1+N1+N2+N4);

        const pH2Oc = pH2O*101000/(1+N31);
        const pCOCO2c = pCO*pO2*101000/(1+N4);

        const dM1 = getDXMoles(N1, pO2, pO2c, dS, aD, tAverage );
        const dM2 = getDXMoles(N2, pO2, pO2c, dS, aD, tAverage );
        const dM3 = getDXMoles(N3, pO2, pO2c, dS, aD, tAverage );
        const dM31 = getDXMoles(N31, pO2, pO2c, dS, aD, tAverage );
        const dM4 = getDXMoles(N4, pCO*pO2, pO2c, dS, aD, tAverage );

        //const nnn = (aD/(8.314*tAverage));
        const GciO2CO2 = (aD/(8.314*tAverage))*1/((1+N3)*(1+N1+N2))
            *pO2c*(
                (N1*(1+2*N3) + 2*N2*(1+N3))
                + N3*(1+N1+N2)
            )*12;

        const GciH2O = (aD/(8.314*tAverage))*1/(1+N31)
            *pH2Oc*12;
        const Gci = GciO2CO2+GciH2O;
        console.log({ pO2, pCO2, pH2O, N1, N2, N3, N31, k1,k2,k3, aD,
            pCOO2c, Gci, D0, tAverage, tAir, tFlame, wAir, wFlame, w,
            Nu, s0, airDensityTflame, airDensityTair});

        GcSum += Gci;
        pO2-=dpO2;
        pCO2+=dpCO2;
        pH2O-=dpH2O;
    }
    const Gc = GcSum/maxIterations;
    const totalBurnPerSecond = Gc*sArea;
    const totalBurnPerHour = totalBurnPerSecond*3600;
    console.log({Gc, totalBurnPerSecond, totalBurnPerHour});
    return Gc;
}






//                                          * + * +
//   * +                    * + *           + * + *
//  + * *                   + * +           * + * +
//   * +                    * + *           + * + *
// + - air Sair = 3*S0
// * - smoke Ssmoke = 4*S0

