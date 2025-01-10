import { Router } from 'express'
import usersRouters from './users.routes'
import accessRouters from './access.routes';
import projectRouters from './project.routes';


const rootRouterV1 = Router()
rootRouterV1.get("/helpers", (req, res) => {
    console.log("Hello World")
    res.status(200).send({ message: "Welcome to Express & TypeScript Server" });
});
rootRouterV1.use('/user', usersRouters)
rootRouterV1.use('/access', accessRouters)
rootRouterV1.use('/projects', projectRouters)

export default rootRouterV1
