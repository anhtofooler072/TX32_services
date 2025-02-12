import { ErrorRequestHandler } from 'express';
import { omit } from 'lodash';
import { ErrorWithStatus } from '~/utils/errors.util';
import { HTTP_STATUS_CODES } from '~/core/httpStatusCode';

export const defaultErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof ErrorWithStatus) {
        console.log("defaultErrorHandler -> err", err);
        res.status(err.status).json(omit(err, 'status'));
        return;
    }

    Object.getOwnPropertyNames(err).forEach((key) => {
        Object.defineProperty(err, key, { enumerable: true });
    });

    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        message: err.message,
        errorInfo: omit(err, 'stack'),
    });
    return;
};
