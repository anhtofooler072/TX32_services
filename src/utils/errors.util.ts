import { USERS_MESSAGES } from "~/constants/messages"
import { HTTP_STATUS_CODES } from "./httpStatusCode"

interface ErrorBodyType {
    message: string
    status: number
}
// { [key: string]: string }
type ErrorsType = Record<
    string,
    {
        msg: string
        [key: string]: any
    }
>

export class ErrorWithStatus {
    message: string
    status: number
    constructor({ message, status }: ErrorBodyType) {
        this.message = message
        this.status = status
    }
}

export class EntityError extends ErrorWithStatus {
    errors: ErrorsType
    constructor({ message = USERS_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
        super({ message, status: HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY })
        this.errors = errors
    }
}
