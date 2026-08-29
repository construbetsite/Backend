export class AppError extends Error {
  public readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;

    Object.setPrototypeOf(
      this,
      AppError.prototype
    );
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}
