import { Router } from 'express'
import userController from '~/controllers/user.controller'
import { accessTokenValidation } from '~/middlewares/user.middlewares'
import { wrapRequestHandler } from '~/utils/wrapHandler'

const usersRouters = Router()
/*
Description: This route is used to get the user profile
Method: GET
Headers: { Authorization : Bearer <accessToken> }
*/
usersRouters.get('/profile', accessTokenValidation, wrapRequestHandler(userController.getProfile))



export default usersRouters