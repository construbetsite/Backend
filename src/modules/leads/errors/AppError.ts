// ============================================================
// ERROS DO MÓDULO DE LEADS
// Padrão do projeto: cada módulo possui seu próprio AppError.
// ============================================================

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito ao processar o recurso') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}
