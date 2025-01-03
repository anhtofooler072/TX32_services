import { Router } from 'express'
import usersRouters from './users.routes'


const rootRouterV1 = Router()
rootRouterV1.get("/", (req, res) => {
    console.log("Hello World")
    res.status(200).send({ message: "Welcome to Express & TypeScript Server" });
});
rootRouterV1.use('/user', usersRouters)

export default rootRouterV1
