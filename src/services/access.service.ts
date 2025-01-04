"use strict";

import { ObjectId } from "mongodb";
import { LoginReqBody, RegisterReqBody } from "~/models/requests/user.request";
import User from "~/models/schemas/user.schema";
import databaseServices from "./database.service";
import { tokenType, userVerificationStatus } from "~/constants/enums";
import { envConfig } from "~/constants/config";
import bcrypt from 'bcrypt'
import { signToken, verifyToken } from "~/utils/tokens.util";
import { Token } from "~/models/schemas/token.schema";
import { ErrorWithStatus } from "~/utils/errors.util";
import { USERS_MESSAGES } from "~/constants/messages";
import HTTP_STATUS_CODES from "~/core/statusCodes";

class AccessService {
    private signAccessToken({ user_id, verify }: { user_id: string; verify: userVerificationStatus }) {
        return signToken({
            payload: {
                user_id,
                token_type: tokenType.AccessToken,
                verify
            },
            privateKey: envConfig.jwtSecretAccessToken,
            options: {
                expiresIn: envConfig.accessTokenExpiresIn
            }
        })
    }

    private signRefreshToken({
        user_id,
        verify,
        exp
    }: {
        user_id: string
        verify: userVerificationStatus
        exp?: number
    }) {
        if (exp) {
            return signToken({
                payload: {
                    user_id,
                    token_type: tokenType.RefreshToken,
                    verify,
                    exp
                },
                privateKey: envConfig.jwtSecretRefreshToken,
                options: {
                    expiresIn: exp
                }
            })
        }
        return signToken({
            payload: {
                user_id,
                token_type: tokenType.RefreshToken,
                verify
            },
            privateKey: envConfig.jwtSecretRefreshToken,
            options: {
                expiresIn: envConfig.refreshTokenExpiresIn
            }
        })
    }

    private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: userVerificationStatus }) {
        return signToken({
            payload: {
                user_id,
                token_type: tokenType.EmailVerificationToken,
                verify
            },
            privateKey: envConfig.jwtSecretEmailVerifyToken,
            options: {
                expiresIn: envConfig.emailVerifyTokenExpiresIn
            }
        })
    }

    private decodeEmailVerifyToken(email_verify_token: string) {
        return verifyToken({
            token: email_verify_token,
            secretOrPublickey: envConfig.jwtSecretEmailVerifyToken
        })
    }

    async decodeRefreshToken(refresh_token: string) {
        return verifyToken({
            token: refresh_token,
            secretOrPublickey: envConfig.jwtSecretRefreshToken
        })
    }

    async signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: userVerificationStatus }) {
        return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
    }

    async register(payload: RegisterReqBody) {
        const user_id = new ObjectId()
        // Tạo mã token xác minh email
        const email_verify_token = await this.signEmailVerifyToken({
            user_id: user_id.toString(),
            verify: userVerificationStatus.Unverified
        })
        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(payload.password, 10)

        // Tạo người dùng mới với mật khẩu đã mã hóa
        const newUser = new User({
            _id: user_id,
            ...payload,
            password: hashedPassword
        })

        // Lưu người dùng mới vào cơ sở dữ liệu
        await databaseServices.users.insertOne(newUser)
        // Lưu verify email token  và refresh token vào cơ sở dữ liệu
        const { iat: iat_email_verify_token, exp: exp_email_verify_token } =
            await this.decodeEmailVerifyToken(email_verify_token)

        const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
            user_id: user_id.toString(),
            verify: userVerificationStatus.Unverified
        })
        const { iat: iat_refresh_token, exp: exp_refresh_token } = await this.decodeRefreshToken(refresh_token)

        await databaseServices.tokens.insertOne(
            new Token({
                user_id,
                token: email_verify_token,
                type: tokenType.EmailVerificationToken,
                expires_at: new Date((exp_email_verify_token as number) * 1000),
                created_at: new Date((iat_email_verify_token as number) * 1000)
            })
        )
        await databaseServices.tokens.insertOne(
            new Token({
                user_id,
                token: refresh_token,
                type: tokenType.RefreshToken,
                expires_at: new Date((exp_refresh_token as number) * 1000),
                created_at: new Date((iat_refresh_token as number) * 1000)
            })
        )

        // await databaseServices.tokens.deleteMany({ user_id: user_id, type: tokenType.RefreshToken })

        // Tạo email verify token (nếu có yêu cầu xác minh email)
        // await sendVerifyRegisterEmail(payload.email, payload.username, email_verify_token)

        console.info('Email Verify Token:', email_verify_token)

        return {
            access_token,
            refresh_token
        }
    }

    async login(payload: LoginReqBody) {
        const { email, password } = payload

        const user = (await databaseServices.users.findOne({ email })) as {
            _id: { toString: () => string }
            password: string
            verify: userVerificationStatus
        }

        if (!user) {
            throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT,
                status: HTTP_STATUS_CODES.NOT_FOUND
            })
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password)

        if (!isPasswordMatch) {
            throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT,
                status: HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY
            })
        }

        const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
            user_id: user._id.toString(),
            verify: user.verify
        })

        await databaseServices.tokens.deleteMany({ user_id: user._id, type: tokenType.RefreshToken })

        const { exp } = await this.decodeRefreshToken(refresh_token)

        await databaseServices.tokens.insertOne(
            new Token({
                user_id: user._id.toString(),
                token: refresh_token,
                type: tokenType.RefreshToken,
                expires_at: new Date(exp * 1000)
            })
        )

        return {
            access_token,
            refresh_token
        }
    }

}
const accessService = new AccessService()
export default accessService;