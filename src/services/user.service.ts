import { ErrorWithStatus } from "~/utils/errors.util";
import databaseServices from "./database.service";
import { ObjectId } from "mongodb";
import { USERS_MESSAGES } from "~/constants/messages";
import HTTP_STATUS_CODES from "~/core/statusCodes";
class UsersService {
  async checkEmailExist(email: string) {
    const user = await databaseServices.users.findOne({ email });
    return !!user;
  }

  async checkUserExistById(id: string) {
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(id),
    });
    return !!user;
  }

  async getUserById(id: string) {
    const user = await databaseServices.users.findOne(
      {
        _id: new ObjectId(id)
      },
      {
        projection: {
          _id: 0,
          password: 0,
          forgot_password_token: 0,
          email_verify_token: 0,
          forgot_password: 0,
        }
      }
    );

    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS_CODES.NOT_FOUND,
      });
    }

    return user;
  }
}

const usersService = new UsersService();
export default usersService;
