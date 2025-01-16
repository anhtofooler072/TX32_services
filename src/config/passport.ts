import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { envConfig } from "~/constants/config";
import { userVerificationStatus } from "~/constants/enums";
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

            // Thêm dòng này để lấy thông tin email 
            // userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',

            passReqToCallback: true, // Thêm dòng này để truyền req vào callback
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                const existingUser = await databaseServices.users.findOne({ googleId: profile.id });
                if (existingUser) {
                    return done(null, existingUser);
                }

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
                        // username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.random().toString(36).slice(-4),
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
