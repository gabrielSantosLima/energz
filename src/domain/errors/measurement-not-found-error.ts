export class MeasurementNotFoundError extends Error {
  constructor(id: string) {
    super(`Measurement not found: ${id}`);
    this.name = 'MeasurementNotFoundError';
  }
}
