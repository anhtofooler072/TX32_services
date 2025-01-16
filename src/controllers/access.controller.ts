"use strict";

import { Request, Response } from "express";
import { envConfig } from "~/constants/config";
import { USERS_MESSAGES } from "~/constants/messages";
import HTTP_STATUS_CODES from "~/core/statusCodes";
import { CREATED, OK } from "~/core/succes.response";
import { TokenPayload } from "~/models/requests/user.request";
// import { LoginReqBody, RegisterReqBody } from "~/models/requests/user.request";
import accessService from "~/services/access.service";
import { ErrorWithStatus } from "~/utils/errors.util";

class AccessController {
    register = async (req: Request, res: Response) => {
        const result = await accessService.register(req.body)
        new CREATED({
            message: USERS_MESSAGES.EMAIL_VERIFIED_SUCCESSFULLY,
            metadata: result
        }).send(res);
    }

    login = async (req: Request, res: Response) => {
        const result = await accessService.login(req.body)
        new OK({
            message: USERS_MESSAGES.LOGIN_SUCCESSFULLY,
            metadata: result
        }).send(res);
    }

    googleLogin = async (req: Request, res: Response) => {
        const queryString = (await import('querystring')).default
        const user = req.body;

        if (!user) {
            throw new ErrorWithStatus({
                status: HTTP_STATUS_CODES.UNAUTHORIZED,
                message: USERS_MESSAGES.USER_NOT_FOUND
            })
        }

        const { access_token, refresh_token } = await accessService.googleLogin(req.user);

        const redirectUrl = envConfig.googleRedirectClientUrl;
        if (!redirectUrl) {
            throw new ErrorWithStatus({
                status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
                message: 'Redirect URL is not configured'
            })
        }

        const qs = queryString.stringify({
            access_token,
            refresh_token,
            status: HTTP_STATUS_CODES.OK
        })
        res.redirect(`${redirectUrl}?${qs}`);
    }

    logout = async (req: Request, res: Response) => {
        // const access_token = req.headers.authorization?.split(' ')[1] as string;
        const { refresh_token } = req.body;
        const { user_id } = req.decoded_authorization as TokenPayload;

        await accessService.logout({
            user_id,
            refresh_token,
            // req_metadata: {
            //     user_agent: req.headers['user-agent'],
            //     ip_address: req.ip
            // }
        });

        // Xóa refresh token cookie
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        new OK({
            message: USERS_MESSAGES.LOGOUT_SUCCESSFULLY
        }).send(res);
    }
}

export default new AccessController();
