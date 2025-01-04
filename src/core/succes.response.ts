import { HTTP_STATUS_CODES, REASON_PHRASES } from "~/core/httpStatusCode";

interface SuccessResponseParams {
    message?: string;
    statusCode?: number;
    reasonStatusCode?: string;
    metadata?: any;
}

class SuccessResponse {
    message: string;
    status: number;
    metadata: any;

    constructor({ message, statusCode = HTTP_STATUS_CODES.OK, reasonStatusCode = REASON_PHRASES.OK, metadata }: SuccessResponseParams) {
        this.message = message || reasonStatusCode;
        this.status = statusCode;
        this.metadata = metadata;
    }

    send(res: any, headers: Record<string, string> = {}) {
        res.status(this.status).send(this);
    }
}

interface OKParams {
    message?: string;
    metadata?: any;
}

class OK extends SuccessResponse {
    constructor({ message, metadata }: OKParams) {
        super({ message, metadata });
    }
}

interface CreatedParams {
    message?: string;
    metadata?: any;
}

class CREATED extends SuccessResponse {
    constructor({ message, metadata }: CreatedParams) {
        super({ message, statusCode: HTTP_STATUS_CODES.CREATED, reasonStatusCode: REASON_PHRASES.CREATED, metadata });
    }
}

export { SuccessResponse, OK, CREATED };