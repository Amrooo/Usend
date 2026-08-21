import { CourierAdapter } from './CourierAdapter';
import { AramexAdapter } from './AramexAdapter';
import { NoonAdapter } from './NoonAdapter';
import { GenericRestAdapter } from './GenericRestAdapter';

export class CourierEngine {
  private adapters: Map<string, CourierAdapter> = new Map();

  constructor() {
    this.registerAdapter(new AramexAdapter());
    this.registerAdapter(new NoonAdapter());
  }

  public registerAdapter(adapter: CourierAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  public getAdapter(id: string): CourierAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      // Fallback to a generic adapter for custom couriers added via Admin Portal
      return new GenericRestAdapter(id);
    }
    return adapter;
  }
}

export const courierEngine = new CourierEngine();
