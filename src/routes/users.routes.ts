import { Router } from 'express'


const usersRouters = Router()

/* 
Description: This route is used to register a new user
Method: POST
Body: { "username": "string", "email": "string", "password": "string", "confirmPassword": "string" ,"data_of_birth": ISO08601}
 */
// usersRouters.post('/register', registerValidation, wrapRequestHandler(registerController))

/*
Description: This route is used to login a user
Method: POST
Body: { "email": "string", "password": "string"}
*/
// usersRouters.post('/login', loginValidation, wrapRequestHandler(loginController))

export default usersRouters