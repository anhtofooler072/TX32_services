import { Request, Response } from "express";
import { USERS_MESSAGES } from "~/constants/messages";
import { TokenPayload } from "~/models/requests/user.request";
import usersService from "~/services/user.service";
import { OK } from "~/core/succes.response";

class UserController {
    getProfile = async (req: Request, res: Response) => {
        const { user_id } = req.decoded_authorization as TokenPayload;
        const user = await usersService.getUserById(user_id);
        new OK({
            message: USERS_MESSAGES.GET_USER_SUCCESSFULLY,
            metadata: user,
        }).send(res);
    }
}

export default new UserController();