import fs from 'node:fs/promises';
import path from 'node:path';
import type { PersistedData } from '../types/domain.js';

const EMPTY: PersistedData = { sessions: [], sosEvents: [], responders: [] };

export class JsonStore {
  private data: PersistedData = structuredClone(EMPTY);
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filename: string) {}

  async init(): Promise<void> {
    await fs.mkdir(path.dirname(path.resolve(this.filename)), { recursive: true });
    try {
      const raw = await fs.readFile(this.filename, 'utf8');
      this.data = JSON.parse(raw) as PersistedData;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await this.persist();
    }
  }

  read(): PersistedData {
    return structuredClone(this.data);
  }

  async replace(next: PersistedData): Promise<void> {
    this.data = structuredClone(next);
    await this.persist();
  }

  private async persist(): Promise<void> {
    const snapshot = JSON.stringify(this.data, null, 2);
    this.writeQueue = this.writeQueue.then(() => fs.writeFile(this.filename, snapshot, 'utf8'));
    await this.writeQueue;
  }
}
