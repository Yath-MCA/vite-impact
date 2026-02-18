import { UNIQUE_FORMAT_CONFIG } from './presets';

export class PresetRegistry {
  private presets: Record<string, any>;
  private version: string;

  constructor(config?: { presets?: Record<string, any>; version?: string }) {
    this.presets = (config?.presets ?? UNIQUE_FORMAT_CONFIG) as Record<string, any>;
    this.version = config?.version ?? 'v1';
  }

  getPreset(name: string) {
    return this.presets?.[name];
  }

  hasPreset(name: string) {
    return Object.prototype.hasOwnProperty.call(this.presets, name);
  }

  getAllPresets() {
    return this.presets;
  }

  getVersion() {
    return this.version;
  }
}

const registry = new PresetRegistry();
export default registry;
