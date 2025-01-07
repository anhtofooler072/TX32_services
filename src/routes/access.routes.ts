import { Router } from 'express'
import AccessController from '~/controllers/access.controller'
import { loginValidation, registerValidation } from '~/middlewares/user.middlewares'
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


export default accessRouters
