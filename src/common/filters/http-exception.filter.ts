import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;

    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : null;

    let message: string | string[];
    let error: string;
    let extraFields: Record<string, unknown> = {};

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      error = exception instanceof HttpException ? exception.name : 'Error';
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const { message: msg, error: err, statusCode: _sc, ...rest } =
        exceptionResponse as any;
      message = msg;
      error = err ?? (exception instanceof HttpException ? exception.name : 'Error');
      extraFields = rest; // เก็บ field พิเศษอื่นๆ ที่เหลือไว้ทั้งหมด
    } else {
      message = 'Internal server error';
      error = 'Internal Server Error';
    }

    if (statusCode >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `${request.method} ${request.url} - ${statusCode}: ${message}`,
        stack,
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      ...extraFields,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}