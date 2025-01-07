import { Router } from 'express';
import projectController from '~/controllers/project.controller';
import projectMiddlewares from '~/middlewares/project.middlewares';
import { accessTokenValidation } from '~/middlewares/user.middlewares';
import { wrapRequestHandler } from '~/utils/wrapHandler';


const projectRouters = Router()

/*
Description: This route is used to create a new project
Method: POST
Body: { "name": "string", "description": "string", "due_date": ISO08601}
*/
projectRouters.post('/create', accessTokenValidation, projectMiddlewares.createProjectValidation, wrapRequestHandler(projectController.createNewProject))

/*
Description: Get project by ID
Method: GET
Params: id
*/
projectRouters.get('/:projectId', accessTokenValidation, projectMiddlewares.verifyUserProjectAccess, wrapRequestHandler(projectController.getProjectById))

export default projectRouters