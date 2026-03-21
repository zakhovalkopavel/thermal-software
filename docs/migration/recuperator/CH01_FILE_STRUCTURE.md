# CH01 — Target File Structure

## Backend module

```
backend/src/modules/recuperator/
├── recuperator.module.ts
├── controllers/
│   └── recuperator.controller.ts
├── services/
│   ├── air-properties.service.ts
│   ├── gas-composition.service.ts
│   ├── radiation.service.ts
│   ├── geometry.service.ts
│   ├── thermal-insulation.service.ts
│   ├── heat-transfer.service.ts
│   ├── material.service.ts
│   ├── furnace.service.ts
│   └── recuperator-optimizer.service.ts
├── dto/
│   ├── recuperator-input.dto.ts
│   ├── recuperator-result.dto.ts
│   ├── furnace-layer.dto.ts
│   └── gas-composition.dto.ts
├── interfaces/
│   ├── alpha-set.interface.ts
│   ├── surface-result.interface.ts
│   └── furnace-layer.interface.ts
├── enums/
│   ├── hole-form.enum.ts
│   ├── furnace-form.enum.ts
│   └── material-type.enum.ts
└── data/
    └── materials/
        ├── recuperator-material.interface.ts
        ├── chamotte-solid.data.ts
        ├── chamotte-1300.data.ts
        ├── chamotte-1000.data.ts
        ├── chamotte-900.data.ts
        ├── chamotte-600.data.ts
        ├── chamotte-400.data.ts
        ├── mullite-2300.data.ts
        ├── quartz-2000.data.ts
        ├── quartz-1000.data.ts
        ├── quartz-sand-1.data.ts
        ├── quartz-sand-05.data.ts
        ├── quartz-sand-02.data.ts
        ├── alumina-2500.data.ts
        ├── alumina-1300.data.ts
        ├── alumina-sand-1.data.ts
        ├── alumina-sand-05.data.ts
        ├── alumina-sand-02.data.ts
        ├── silicon-carbide.data.ts
        ├── basalt-fiber-mat.data.ts
        ├── aisi-304.data.ts
        └── mild-steel.data.ts
```

## Shared thermal library

Placed in `backend/src/common/thermal/` — shared with future modules.

```
backend/src/common/thermal/
├── interface/
│   ├── composition.interface.ts
│   ├── compound-value.interface.ts
│   ├── equation-value.interface.ts
│   ├── equation.interface.ts
│   ├── fluid.interface.ts
│   ├── chemical-composition.interface.ts
│   └── material-value.interface.ts
├── dto/
│   ├── equation-type.dto.ts
│   ├── chemical-compounds.dto.ts
│   └── thermal-conductivity-equation-type.dto.ts
├── utils/
│   ├── common.ts
│   ├── equation-methods.ts
│   └── temperature.utils.ts
├── compound/
│   └── gas/
│       ├── air.ts
│       ├── n2.ts  ├── o2.ts  ├── co2.ts  ├── co.ts
│       ├── h2o.ts ├── h2.ts  ├── ch4.ts  ├── nh3.ts
│       └── index.ts
└── fluid-condition/
    ├── fluid-condition-compound.ts
    ├── fluid-condition-composition.ts
    ├── gas-composition.ts
    └── fluid-dynamics.ts
```

> `CombustionService` was previously in `recuperator` services. It is **removed** from this module — combustion chemistry lives in `backend/src/modules/combustion/`. See `docs/migration/combustion/`.

