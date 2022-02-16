let params = {
    aPressure: 101325, // Pa
    tFlame:1553, // K
    tFlame1: 1553, // K
    tFlame1C: 1280, // C
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
            mass: {
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
            mass: {
                N2: 0,
                O2: 0,
                CO2: 0,
                CO: 0,
                H2O: 0,
                H2: 0,
            }
        },
    },
    wH2Om: 0, // mass fraction H2O to air
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
    maxIterations: 500,//1000,
    criteria: 100,// stop searching
    dTmin: 0.1, // minimal t step when stopping
    //criteriaDeviation: 0.01,
    thermalInsulationThicknessMM: 25, // mm
    thermalInsulationThickness: 0.025, // m
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
        'thermalInsulationThicknessMM',
        'wantedRecuperatorLength',
        'holeForm',
        'wH2Om',
    ],
    textParams: ['holeForm',],
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
    Table 7.2.3: Heat Capacity Coefficients for the Expansion: Cp,m = a + b T + c T2
+ d T3
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
    const data = {
        partial: {
            N2: mN2 / (28 * molesTotal),
            O2: mO2 / (32 * molesTotal),
            CO2: mCO2 / (44 * molesTotal),
            CO: mCO / (28 * molesTotal),
            H2O: mH2O / (28 * molesTotal),
            H2: mH2 / (28 * molesTotal),
        },
        mass: {
            N2: mN2,
            O2: mO2,
            CO2: mCO2,
            CO: mCO,
            H2O: mH2O,
            H2: mH2,
            Ash: mAsh,
            Fuel: mFuel,
        }
    };
    params.systemComposition[direction] = data;
}


const findIsobaricFlameT = (
    t0,
    wH2Om = params.wH2Om, // mass additional fraction to air
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
    f = 0.8,
    maxIterations = 100,
    dQmin = 10,
) => {
    // coke flame temperature
    const mFuel = 1;
    const mCarbon = q/carbonQ*mFuel;
    const mAsh = mFuel - mCarbon;
    const mAir = k*32/(pO2*12)*mCarbon;
    const mN2 = mAir*(1-pO2)*28/((1-pO2)*28+32*pO2);
    const mO2 = mAir - mN2;
    let kCO2 = k>=1 ? 1 : (k>0.5 ? 2*k-1: 0);
    let kCO = k>=1 ? 0 : (k>0.5 ? 2-2*k: 2*k);

    const mH2O = mAir*wH2Om;
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
    const Q = mCarbon*(kCO*carbonMonoxideQ + kCO2*carbonQ + kH2*dQHydrogenGas);

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
    }
    setSystemComposition(mN2, mO2, 0, 0, mH2O, 0, 0, mFuel, 'before');
    setSystemComposition(mN2, mO2after, mCO2, mCO, mH2Oafter, mH2, mAsh, 0,'after');
    return tStart;
};

const systemEnergyChange = (systemEnergy,  massFactor, t1, t2, isOnlyGases = true, fuelCapacity = params.fuelCapacity, ashCapacity = params.ashCapacity) => {
    const { N2, O2, CO2, CO, H2O, H2 } = systemEnergy;
    let { Ash, Fuel } = systemEnergy;
    if(isOnlyGases){
        Ash = 0;
        Fuel = 0;
    }
    const energyChanged = getSystemEnergy(N2, O2, CO2, CO, H2O, H2, Ash, Fuel, ashCapacity, fuelCapacity, t1, t2);
    //console.log({energyChanged, N2, O2, CO2, CO, H2O, H2, Ash, Fuel, ashCapacity, fuelCapacity, t1, t2});
    return Math.abs(energyChanged*massFactor);
}

const autosetParams = () => {
    for(const param of params.autosetParamsList){
        const textValue = document.getElementById(param).value;
        params[param] = params.textParams.includes(param) ? textValue: textValue*1;
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
    }
    return perimeter*factor;
};

const getArea = (a, holeForm = params.holeForm, type = 'air', nAir = params.nAir, nSmoke = params.nSmoke, h = params.refractoryMediumThickness) => {
    let area = 0;
    let factor = 1;
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
    //return 0.7200*tAir + 1356;
    return findIsobaricFlameT(tAir);
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

const airNusseltNumber = (tAir, tSurface, l, d, w=0) => {
    const tAverage = getLogariphmicAvearge(tAir, tSurface);
    const tHot = tAir > tSurface ? tAir : tSurface;
    const tCold = tAir < tSurface ? tAir : tSurface;
    const Ra = airRayleighNumber(tHot, tCold, l);
    const Re = airReynoldsNumber(tAverage, w, d);
    const Pr = airPrandtlnumber(tAverage);
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

const airConvectionAlpha = (tAir, tSurface, l, d, w = 0) => {
    const tAverage = getLogariphmicAvearge(tAir, tSurface);
    const {Nu, isNatural} = airNusseltNumber(tAir, tSurface, l, d, w);
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
    t=t-273;
    return 0.139-7.97*Math.pow(10, -5)*t+1.3*Math.pow(10, -7)*t*t+2.73*Math.pow(10, -10)*Math.pow(t, 3);
}

const getAverageThermalInsulationLambda = (t1, t2) => {
    return getLogariphmicAvearge(getThermalInsulationLambda(t1),getThermalInsulationLambda(t2));
}

const getMaxSurfaceTemperature = (tHot,  tRoom, h, alphaInner,  lInner = params.Lsmoke, dSurface = params.dSurface, lSurface = params.wantedRecuperatorLength, eSurface =params.surfaceEmissivity, tSurface = params.tSurfase, currentStep=0, iterations=20) => {
   //   tRoom  |<---tSurface      tInner ---> |   tHot
    tSurfase = tSurface>tHot ? tRoom+10 : tSurface;
    //tInner = tInner === 0  ? tHot*0.8 : tInner;

    let alpha = 0;

    if(tSurface<=423) {
        alpha = getAlphaForNaturalLowTempCooling (tRoom, tSurface);
    }
    else{
        const naturalConvectionAlpha = airConvectionAlpha(tRoom, tSurface, lSurface, dSurface);
        const radiationAlpha = fullRadiationAlpha(tSurface, tRoom, eSurface);
        //console.log({tSurface, tRoom, naturalConvectionAlpha, radiationAlpha});
        alpha = naturalConvectionAlpha + radiationAlpha;
    }

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
    // console.log({x1,x2});
    return (x1-x2)/Math.log(x1/x2);
};


const getAverageAlpha = (a1, a2, perimeter1, perimeter2, h, lambda) => {
    const perimeterAverage = getLogariphmicAvearge(perimeter1, perimeter2);
    return 1/(1/a1 + perimeter1/(perimeter2*a2) + h*perimeter1/(lambda*perimeterAverage));
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
    return Math.abs(5.67*(emissivity1*Math.pow(t1/100, 4) - emissivity2*Math.pow(t2/100, 4))/(t1-t2));
}

const getTsmokeStart = (tFlame) => {
    let tSmokeStart = tFlame / params.flameToSmokeTRatio;
    return params.tSmokeStartMax>tSmokeStart? tSmokeStart : params.tSmokeStartMax;
}

const setParams = () => {
    autosetParams();

    params.tAirStart = params.tAirStartC*1+273;
    params.densityAirStart = airDensity(params.tAirStart);

    params.d0 = params.d0mm/1000;
    params.thermalInsulationThickness = params.thermalInsulationThicknessMM/1000;

    //params.L0 =  getPerimeter(params.d0);
    //params.S0 = getArea(params.d0);
    params.Sair = getArea(params.d0, params.holeForm, 'air',params.nAir, params.nSmoke, params.refractoryMediumThickness);
    params.Ssmoke = getArea(params.d0, params.holeForm, 'smoke',params.nAir, params.nSmoke, params.refractoryMediumThickness);

    params.Lair =  getPerimeter(params.d0, params.holeForm, 'air',params.nAir, params.nSmoke, params.refractoryMediumThickness);
    params.Lsmoke = getPerimeter(params.d0, params.holeForm, 'smoke',params.nAir, params.nSmoke, params.refractoryMediumThickness);

    if(params.holeForm === 'triangle') {
        params.dSurface = params.d0*Math.pow(3/(Math.PI*16), 0.25)+4*params.refractoryMediumThickness+2*params.thermalInsulationThickness;
    }
    else{
        params.dSurface = Math.ceil(Math.pow(params.nAir + params.nSmoke, 0.5))*(params.d0+params.refractoryMediumThickness)+params.refractoryMediumThickness+2*params.thermalInsulationThickness;
    }
    params.fPower = params.fPowerKW*1000;

    params.mPerHour = params.fPower*3600/params.fuelQ;

    params.refractoryMediumThickness = params.refractoryMediumThicknessMM/1000;
    params.pCO2 = params.pO2/params.kExcessAir;


    params.tAirEnd = params.tAirEndC+273;
    params.tFlame = getFlameTemperature(params.tAirEnd);
    // console.log({tFlame: params.tFlame, tAirEnd: params.tAirEnd})
    params.tSmokeStart = getTsmokeStart(params.tFlame);
    params.tSmokeEnd = params.tAirStart*params.flameToSmokeTRatio;


    params.mAirPerHour = 32/(12*params.pO2)*params.kExcessAir*params.mPerHour*params.fuelQ/params.carbonQ;
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

    const tSmokeStartAirEndSurface = getLogariphmicAvearge(params.tAirEnd, params.tSmokeStart);
    const tSmokeEndAirStartSurface = getLogariphmicAvearge(params.tAirStart, params.tSmokeEnd);

    params.alpha.air.convective.start = airConvectionAlpha(params.tAirStart, tSmokeEndAirStartSurface, params.wantedRecuperatorLength, params.d0, params.wAirStart);//getConvectiveAlpha(params.wAirStart);
    params.alpha.air.convective.end = airConvectionAlpha(params.tAirEnd, tSmokeStartAirEndSurface, params.wantedRecuperatorLength, params.d0, params.wAirEnd);//getConvectiveAlpha(params.wAirEnd);

    const rayLength = 0.9*params.d0;
    params.alpha.air.radiation.start = getRadiationAlpha(params.tAirStart, tSmokeEndAirStartSurface, params.refractoryEmissivity, params.systemComposition.before.partial.H2O, params.systemComposition.before.partial.CO2, rayLength );
    params.alpha.air.radiation.end = getRadiationAlpha(params.tAirEnd, tSmokeStartAirEndSurface, params.refractoryEmissivity, params.systemComposition.before.partial.H2O, params.systemComposition.before.partial.CO2, rayLength);

    params.alpha.air.start = params.alpha.air.convective.start+params.alpha.air.radiation.start;
    params.alpha.air.end = params.alpha.air.convective.end+params.alpha.air.radiation.end;

    params.alpha.smoke.convective.start = airConvectionAlpha(params.tSmokeStart, tSmokeStartAirEndSurface, params.wantedRecuperatorLength, params.d0, params.wSmokeStart);//getConvectiveAlpha(params.wSmokeStart);
    params.alpha.smoke.convective.end = airConvectionAlpha(params.tSmokeEnd, tSmokeEndAirStartSurface, params.wantedRecuperatorLength, params.d0, params.wSmokeEnd);//getConvectiveAlpha(params.wSmokeEnd);


    params.alpha.smoke.radiation.start = getRadiationAlpha(params.tSmokeStart, tSmokeStartAirEndSurface, params.refractoryEmissivity, params.systemComposition.after.partial.H2O, params.systemComposition.after.partial.CO2, rayLength );
    params.alpha.smoke.radiation.end = getRadiationAlpha(params.tSmokeEnd, tSmokeEndAirStartSurface, params.refractoryEmissivity, params.systemComposition.after.partial.H2O, params.systemComposition.after.partial.CO2, rayLength);

    params.alpha.smoke.start = params.alpha.smoke.convective.start+params.alpha.smoke.radiation.start;
    params.alpha.smoke.end = params.alpha.smoke.convective.end+params.alpha.smoke.radiation.end;


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

    params.smokeEnergyDecrease = systemEnergyChange(params.systemComposition.after.mass, params.mPerHour, params.tSmokeStart, params.tSmokeEnd);
    //(params.mPerHour + params.mAirPerHour)*(params.tSmokeStart-params.tSmokeEnd)*params.cSmokeAverage;
    params.airEnergyIncrease = systemEnergyChange(params.systemComposition.before.mass, params.mPerHour, params.tAirEnd, params.tAirStart);
    //params.mAirPerHour*(params.tAirEnd-params.tAirStart)*params.cAirAverage;

    params.energyLost = getMaxThermalLose(tSmokeEnd, params.tSmokeStart, params.tRoom, params.alpha.smoke, params.thermalInsulationThickness, params.surfaceArea)*3600;

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
;    }
    const airData = []
    for(let t=273; t<1573; t+=100) {
        const Pr = airPrandtlnumber(t);
        const KinematicViscosity =airKinematicViscosity(t);
        const ThermalConductivity = airThermalConductivity(t);
        const Density = airDensity(t);
        const DynamicViscosity = airDynamicViscosity(t);
        const CapacityIsobaric = airCapacityIsobaric(t);
        const C =t-273;
        airData.push({C,t, Density, DynamicViscosity, KinematicViscosity, ThermalConductivity, CapacityIsobaric, Pr});
    }
    console.log({airData});
    for(let t = 273; t<1274; t+=50) {
        console.log({
            t: t - 273,
            flameC: findIsobaricFlameT(t) - 273,
            tFlame1C: findTflame(t, params.kExcessAir, params.aPressure, params.fuelQ) - 273
        });
    }
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

    //calculateTestData(testData);
};
//                                          * + * +
//   * +                    * + *           + * + *
//  + * *                   + * +           * + * +
//   * +                    * + *           + * + *
// + - air Sair = 3*S0
// * - smoke Ssmoke = 4*S0

