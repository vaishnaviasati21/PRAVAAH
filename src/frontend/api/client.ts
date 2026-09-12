/* ==========================================================================
   PILGRIMOS API CLIENT FACTORY & SWITCHER
   Single point of configuration to toggle between Shadow (demo) and Source (real)
   ========================================================================== */

import type { PilgrimosApiAdapter } from './adapter-interface.js';
import { ShadowPilgrimosAdapter } from './adapter-shadow.js';
import { SourcePilgrimosAdapter } from './adapter-source.js';

export type AdapterMode = 'shadow' | 'source';

class ApiClientManager {
  private currentMode: AdapterMode = 'shadow';
  private shadowAdapter: ShadowPilgrimosAdapter = new ShadowPilgrimosAdapter();
  private sourceAdapter: SourcePilgrimosAdapter = new SourcePilgrimosAdapter();

  get adapter(): PilgrimosApiAdapter {
    return this.currentMode === 'shadow' ? this.shadowAdapter : this.sourceAdapter;
  }

  get mode(): AdapterMode {
    return this.currentMode;
  }

  setMode(mode: AdapterMode): void {
    this.currentMode = mode;
  }
}

export const apiClient = new ApiClientManager();
