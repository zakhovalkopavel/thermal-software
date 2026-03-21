# CH05 — Controller

```typescript
@Controller('recuperator')
@ApiTags('recuperator')
export class RecuperatorController {
  constructor(private readonly optimizer: RecuperatorOptimizerService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate recuperator and furnace heat exchange' })
  async calculate(@Body() dto: RecuperatorInputDto): Promise<RecuperatorResultDto> {
    return this.optimizer.calculate(dto);
  }

  // Development/debug only — remove before production
  @Get('test-data')
  @ApiOperation({ summary: 'Air property lookup table (dev only)' })
  async testData(): Promise<object> {
    return this.airProps.testDataTable();
  }
}
```

## Deleted browser logic

| `recuperator.js` function | Reason removed |
|---|---|
| `getParam()` | DOM read → replaced by DTO |
| `autosetParams()` | DOM read → replaced by DTO |
| `setParams()` | DOM read + business logic → split into DTO + service init |
| `setResult()` | DOM write → replaced by return DTO |
| `clearResult()` | DOM write → deleted |
| `calculateOptimalCoaxialTube()` | Incomplete prototype → deferred |
| `calculateFuelBurnLayer()` | Undefined variables → deferred |
| `heatFlux()` | Only called from deferred function → deferred |

