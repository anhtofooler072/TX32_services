import { HTTP_STATUS_CODES, REASON_PHRASES } from "./httpStatusCode";

interface ErrorResponseParams {
  message?: string;
  statusCode?: number;
  reasonStatusCode?: string;
  metadata?: any;
}

class ErrorResponse {
  message: string;
  status: number;
  metadata: any;

  constructor({
    message,
    statusCode,
    reasonStatusCode,
    metadata = null,
  }: ErrorResponseParams) {
    this.message = message || reasonStatusCode || "Unknown error";
    this.status = statusCode || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
    this.metadata = metadata;
  }

  send(res: any, headers: Record<string, string> = {}) {
    res.status(this.status).send(this);
  }
}

const createErrorResponse = (statusCode: number, reasonStatusCode: string) => {
  return class extends ErrorResponse {
    constructor({ message, metadata }: { message?: string; metadata?: any }) {
      super({ message, statusCode, reasonStatusCode, metadata });
    }
  };
};

// Định nghĩa các lỗi HTTP cụ thể
const BAD_REQUEST = createErrorResponse(
  HTTP_STATUS_CODES.BAD_REQUEST,
  REASON_PHRASES.BAD_REQUEST
);
const UNAUTHORIZED = createErrorResponse(
  HTTP_STATUS_CODES.UNAUTHORIZED,
  REASON_PHRASES.UNAUTHORIZED
);
const NOT_FOUND = createErrorResponse(
  HTTP_STATUS_CODES.NOT_FOUND,
  REASON_PHRASES.NOT_FOUND
);
const FORBIDDEN = createErrorResponse(
  HTTP_STATUS_CODES.FORBIDDEN,
  REASON_PHRASES.FORBIDDEN
);
export { ErrorResponse, BAD_REQUEST, UNAUTHORIZED, NOT_FOUND, FORBIDDEN };
