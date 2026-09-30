import { combustionApi } from './combustion.api';
import type { CombustionRequest } from '../types/combustion-request.type';
import type { CombustionResponse } from '../types/combustion-response.type';

/** Sends the request to the endpoint of its mode and tags the result with the mode. */
export async function callCombustion(request: CombustionRequest): Promise<CombustionResponse> {
  switch (request.mode) {
    case 'solid-direct':
      return { mode: request.mode, result: await combustionApi.solidDirect(request.input) };
    case 'solid-two-step':
      return { mode: request.mode, result: await combustionApi.solidTwoStep(request.input) };
    case 'fluid':
      return { mode: request.mode, result: await combustionApi.fluid(request.input) };
    case 'bed':
      return { mode: request.mode, result: await combustionApi.bed(request.input) };
  }
}
