import { USERS_MESSAGES } from "~/constants/messages";
import { checkSchema, ParamSchema } from "express-validator";
import { NAME_REGEXP } from "~/helpers/regex";
import { validate } from "~/utils/validations.util";
import usersService from "~/services/user.service";
import { ErrorWithStatus } from "~/utils/errors.util";
import HTTP_STATUS_CODES_CODES from "~/core/statusCodes";
import { envConfig } from "~/constants/config";
import { verifyToken } from "~/utils/tokens.util";
import { JsonWebTokenError } from "jsonwebtoken";
import HTTP_STATUS_CODES from "~/core/statusCodes";
import databaseServices from "~/services/database.service";
import { tokenType } from "~/constants/enums";

const usernameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_REQUIRED,
  },
  isString: {
    errorMessage: USERS_MESSAGES.NAME_MUST_BE_STRING,
  },
  isLength: {
    options: {
      min: 1,
      max: 100,
    },
    errorMessage: USERS_MESSAGES.NAME_LENGTH,
  },
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!NAME_REGEXP.test(value)) {
        throw new Error(USERS_MESSAGES.USERNAME_INVALID);
      }
    },
  },
};

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true,
    },
  },
};

const avatarURLSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: "Avatar URL must be a string",
  },
  isLength: {
    options: {
      min: 1,
      max: 500,
    },
    errorMessage: "Avatar URL length must be between 1 and 500 characters",
  },
  trim: true,
};

const passwordShema: ParamSchema = {
  isString: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRING,
  },
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_REQUIRED,
  },
  isLength: {
    options: {
      min: 6,
      max: 50,
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH,
  },
  trim: true,
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      returnScore: false,
      pointsForContainingLower: 1,
      pointsForContainingUpper: 1,
      pointsForContainingNumber: 1,
      pointsForContainingSymbol: 1,
    },
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG,
  },
};

const confirmPasswordSchema: ParamSchema = {
  isString: true,
  notEmpty: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_REQUIRED,
  },
  trim: true,
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_MATCH);
      }
      return value;
    },
  },
};

export const registerValidation = validate(
  checkSchema(
    {
      username: usernameSchema,
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_REQUIRED,
        },
        trim: true,
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_INVALID,
        },
        custom: {
          options: async (value) => {
            const isEmailExist = await usersService.checkEmailExist(value);
            if (isEmailExist) {
              throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXIST);
            }
            return !isEmailExist;
          },
        },
      },
      password: passwordShema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: dateOfBirthSchema,
      avatar_url: avatarURLSchema,
    },
    ["body"]
  )
);

export const loginValidation = validate(
  checkSchema(
    {
      email: {
        trim: true,
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_REQUIRED,
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_INVALID,
        },
      },
      password: passwordShema,
    },
    ["body"]
  )
);

export const accessTokenValidation = validate(
  checkSchema(
    {
      authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || "").split(" ")[1];

            if (!access_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_REQUIRED,
                status: HTTP_STATUS_CODES_CODES.UNAUTHORIZED,
              });
            }

            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                secretOrPublickey: envConfig.jwtSecretAccessToken,
              });

              req.decoded_authorization = decoded_authorization;
            } catch (error) {
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: HTTP_STATUS_CODES_CODES.UNAUTHORIZED,
              });
            }
            return true;
          },
        },
      },
    },
    ["headers"]
  )
);

export const refreshTokenValidation = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.REFRESH_TOKEN_REQUIRED,
                status: HTTP_STATUS_CODES.UNAUTHORIZED
              })
            }
            try {
              // kiểm tra refresh token có hợp lệ không
              const refreshTokenExist = await databaseServices.tokens.findOne({
                token: value,
                type: tokenType.RefreshToken
              })

              if (!refreshTokenExist) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID,
                  status: HTTP_STATUS_CODES.UNAUTHORIZED
                })
              }

              const decoded_refresh_token = await verifyToken({
                token: value,
                secretOrPublickey: envConfig.jwtSecretRefreshToken
              })

              req.decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: HTTP_STATUS_CODES.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

// export const verifiedUserValidation = (req: Request, res: Response, next: NextFunction) => {
//   const { verify } = req.decoded_authorization as TokenPayload
//   if (verify !== userVerificationStatus.Verified) {
//     return next(
//       new ErrorWithStatus({
//         message: USERS_MESSAGES.USER_NOT_VERIFIED,
//         status: HTTP_STATUS_CODES.FORBIDDEN
//       })
//     )
//   }
//   next()
// }