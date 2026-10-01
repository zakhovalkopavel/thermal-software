import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FluidPropertyService } from '../services/fluid-property.service';
import { FluidBaseInputDto } from '../dto/fluid/fluid-base-input.dto';
import { FluidCpResultDto } from '../dto/fluid/fluid-cp-result.dto';
import { FluidViscosityResultDto } from '../dto/fluid/fluid-viscosity-result.dto';
import { FluidDensityResultDto } from '../dto/fluid/fluid-density-result.dto';
import { FluidThermalConductivityResultDto } from '../dto/fluid/fluid-thermal-conductivity-result.dto';
import { FluidListEntryDto } from '../dto/catalogue/fluid-list-entry.dto';
import { FlowModeEntryDto } from '../dto/catalogue/flow-mode-entry.dto';
import { GeometryListEntryDto } from '../dto/catalogue/geometry-list-entry.dto';
import { CorrelationListEntryDto } from '../dto/catalogue/correlation-list-entry.dto';

@ApiTags('thermodynamics')
@Controller('thermodynamics')
export class ThermodynamicsFluidController {
  constructor(private readonly fluidProps: FluidPropertyService) {}

  // ── Individual fluid properties ───────────────────────────────────────────

  @Post('fluid/cp')
  @ApiOperation({ summary: 'Isobaric heat capacity Cp [J/(kg·K)] for a pure species or gas mixture' })
  @ApiCreatedResponse({ type: FluidCpResultDto })
  getCp(@Body() dto: FluidBaseInputDto): FluidCpResultDto {
    return this.fluidProps.getCp(dto);
  }

  @Post('fluid/viscosity')
  @ApiOperation({ summary: 'Dynamic μ [Pa·s] and kinematic ν [m²/s] viscosity for a pure species or gas mixture' })
  @ApiCreatedResponse({ type: FluidViscosityResultDto })
  getViscosity(@Body() dto: FluidBaseInputDto): FluidViscosityResultDto {
    return this.fluidProps.getViscosity(dto);
  }

  @Post('fluid/density')
  @ApiOperation({ summary: 'Ideal-gas density ρ = P·M/(R·T) [kg/m³] for a pure species or gas mixture' })
  @ApiCreatedResponse({ type: FluidDensityResultDto })
  getDensity(@Body() dto: FluidBaseInputDto): FluidDensityResultDto {
    return this.fluidProps.getDensity(dto);
  }

  @Post('fluid/thermal-conductivity')
  @ApiOperation({ summary: 'Thermal conductivity λ [W/(m·K)] via Eucken-type relation' })
  @ApiCreatedResponse({ type: FluidThermalConductivityResultDto })
  getThermalConductivity(@Body() dto: FluidBaseInputDto): FluidThermalConductivityResultDto {
    return this.fluidProps.getThermalConductivity(dto);
  }

  // ── Metadata / discovery endpoints ───────────────────────────────────────

  @Get('fluid/list')
  @ApiOperation({ summary: 'List all available named fluids (species + convenience aliases)' })
  @ApiOkResponse({ type: [FluidListEntryDto] })
  listFluids() {
    return this.fluidProps.getFluidList();
  }

  @Get('fluid/flow-modes')
  @ApiOperation({ summary: 'List all FlowRegime values with descriptions' })
  @ApiOkResponse({ type: [FlowModeEntryDto] })
  listFlowModes() {
    return this.fluidProps.getFlowModes();
  }

  @Get('geometry/list')
  @ApiOperation({ summary: 'List all FlowGeometry values with required dimension fields' })
  @ApiOkResponse({ type: [GeometryListEntryDto] })
  listGeometries() {
    return this.fluidProps.getGeometryList();
  }

  @Get('correlations')
  @ApiOperation({ summary: 'List all Nusselt correlations with geometry and validity ranges' })
  @ApiOkResponse({ type: [CorrelationListEntryDto] })
  listCorrelations() {
    return this.fluidProps.getCorrelationList();
  }
}

