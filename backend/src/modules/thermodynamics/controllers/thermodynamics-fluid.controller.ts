import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FluidPropertyService } from '../services/fluid-property.service';
import { FluidBaseInputDto } from '../dto/fluid-base-input.dto';
import { FluidCpResultDto } from '../dto/fluid-cp-result.dto';
import { FluidViscosityResultDto } from '../dto/fluid-viscosity-result.dto';
import { FluidDensityResultDto } from '../dto/fluid-density-result.dto';
import { FluidThermalConductivityResultDto } from '../dto/fluid-thermal-conductivity-result.dto';

@ApiTags('thermodynamics')
@Controller('thermodynamics')
export class ThermodynamicsFluidController {
  constructor(private readonly fluidProps: FluidPropertyService) {}

  // ── Individual fluid properties ───────────────────────────────────────────

  @Post('fluid/cp')
  @ApiOperation({ summary: 'Isobaric heat capacity Cp [J/(kg·K)] for a pure species or gas mixture' })
  getCp(@Body() dto: FluidBaseInputDto): FluidCpResultDto {
    return this.fluidProps.getCp(dto);
  }

  @Post('fluid/viscosity')
  @ApiOperation({ summary: 'Dynamic μ [Pa·s] and kinematic ν [m²/s] viscosity for a pure species or gas mixture' })
  getViscosity(@Body() dto: FluidBaseInputDto): FluidViscosityResultDto {
    return this.fluidProps.getViscosity(dto);
  }

  @Post('fluid/density')
  @ApiOperation({ summary: 'Ideal-gas density ρ = P·M/(R·T) [kg/m³] for a pure species or gas mixture' })
  getDensity(@Body() dto: FluidBaseInputDto): FluidDensityResultDto {
    return this.fluidProps.getDensity(dto);
  }

  @Post('fluid/thermal-conductivity')
  @ApiOperation({ summary: 'Thermal conductivity λ [W/(m·K)] via Eucken-type relation' })
  getThermalConductivity(@Body() dto: FluidBaseInputDto): FluidThermalConductivityResultDto {
    return this.fluidProps.getThermalConductivity(dto);
  }

  // ── Metadata / discovery endpoints ───────────────────────────────────────

  @Get('fluid/list')
  @ApiOperation({ summary: 'List all available named fluids (species + convenience aliases)' })
  listFluids() {
    return this.fluidProps.getFluidList();
  }

  @Get('fluid/flow-modes')
  @ApiOperation({ summary: 'List all FlowRegime values with descriptions' })
  listFlowModes() {
    return this.fluidProps.getFlowModes();
  }

  @Get('geometry/list')
  @ApiOperation({ summary: 'List all FlowGeometry values with required dimension fields' })
  listGeometries() {
    return this.fluidProps.getGeometryList();
  }

  @Get('correlations')
  @ApiOperation({ summary: 'List all Nusselt correlations with geometry and validity ranges' })
  listCorrelations() {
    return this.fluidProps.getCorrelationList();
  }
}

