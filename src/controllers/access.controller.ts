"use strict";

import { Request, Response } from "express";
import { USERS_MESSAGES } from "~/constants/messages";
import { CREATED, OK } from "~/core/succes.response";
// import { LoginReqBody, RegisterReqBody } from "~/models/requests/user.request";
import accessService from "~/services/access.service";

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
}

export default new AccessController();
