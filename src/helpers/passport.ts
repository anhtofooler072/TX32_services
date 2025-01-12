import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { envConfig } from "~/constants/config";
import User from "~/models/schemas/user.schema";
import databaseServices from "~/services/database.service";

passport.use(
    new GoogleStrategy(
        {
            clientID: envConfig.googleClientId,
            clientSecret: envConfig.googleClientSecret,
            callbackURL:
                envConfig.nodeEnv === "development"
                    ? envConfig.googleCallbackURLDev
                    : envConfig.googleCallbackURLProd,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Kiểm tra xem profile.emails có tồn tại hay không
                const email = profile.emails?.[0]?.value;

                if (!email) {
                    return done(new Error('Email is required for authentication'), false);
                }

                const profileJson = profile._json as any;
                const dateOfBirth = profileJson.birthday || null;

                let user = await databaseServices.users.findOne({ email });

                // Nếu người dùng chưa tồn tại, tạo người dùng mới
                if (!user) {
                    const newUser = new User({
                        googleId: profile.id,
                        email: email,
                        username: profile.displayName,
                        avatar_url: profile.photos?.[0]?.value || '',
                        date_of_birth: dateOfBirth,
                        bio: '',
                        status: 'active',
                    });

                    const result = await databaseServices.users.insertOne(newUser.toObject());
                    user = await databaseServices.users.findOne({
                        _id: result.insertedId,
                    });
                }
                if (user) {
                    return done(null, user);
                } else {
                    return done(new Error('User not found'), false);
                }
            } catch (error) {
                return done(error, false);
            }
        }
    )
);
