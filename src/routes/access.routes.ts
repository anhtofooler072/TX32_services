import { Router } from 'express'
import passport from 'passport'
import AccessController from '~/controllers/access.controller'
import { accessTokenValidation, loginValidation, refreshTokenValidation, registerValidation } from '~/middlewares/user.middlewares'
import { wrapRequestHandler } from '~/utils/wrapHandler'

const accessRouters = Router()

/* 
Description: This route is used to register a new user
Method: POST
Body: { "username": "string", "email": "string", "password": "string", "confirmPassword": "string" ,"data_of_birth": ISO08601}
 */
accessRouters.post('/register', registerValidation, wrapRequestHandler(AccessController.register))

/*
Description: This route is used to login a user
Method: POST
Body: { "email": "string", "password": "string"}
*/
accessRouters.post('/login', loginValidation, wrapRequestHandler(AccessController.login))

/*
Description: This route is used to logout
Path: /logout
Method: POST
Headers: { Authorization : Bearer <accessToken> }
Body: { refresh_token : string}
*/
accessRouters.delete('/logout', accessTokenValidation, refreshTokenValidation, wrapRequestHandler(AccessController.logout))

/*
Description: This route is used to login with google
Method: GET
*/
// usersRouters.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
accessRouters.get(
    '/login/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

accessRouters.get('/google/callback', passport.authenticate('google', { session: false }), wrapRequestHandler(AccessController.googleLogin))

export default accessRouters
