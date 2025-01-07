declare global {
    namespace Express {
        interface Request {
            user?: IUser
            decoded_authorization?: TokenPayload
            project?: IProject
            // decoded_refresh_token?: TokenPayload
            // decoded_email_verify_token?: TokenPayload
            // decoded_forgot_password_token?: TokenPayload
        }
    }
}
