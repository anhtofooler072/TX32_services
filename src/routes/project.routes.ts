import { Router } from "express";
import projectController from "~/controllers/project.controller";
import projectMiddlewares from "~/middlewares/project.middlewares";
import { accessTokenValidation } from "~/middlewares/user.middlewares";
import { ProjectQuerySchema } from "~/models/schemas/project.schema";
import { wrapRequestHandler } from "~/utils/wrapHandler";

const projectRouters = Router();

/*
Description: Get all projects for current user
Method: GET
*/
// có thể viết 1 middleware riêng để rate limit cho tất cả các route liên quan đến project
projectRouters.get(
  "/",
  accessTokenValidation,
  projectMiddlewares.createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
  }),
  projectMiddlewares.validateProjectQuery(ProjectQuerySchema),
  wrapRequestHandler(projectController.getAllParticipatingProjects)
);

/*
Description: This route is used to create a new project
Method: POST
Body: { "name": "string", "description": "string", "due_date": ISO08601}
*/
projectRouters.post(
  "/create",
  accessTokenValidation,
  projectMiddlewares.createProjectValidation,
  wrapRequestHandler(projectController.createNewProject)
);

/*
Description: Get project by ID
Method: GET
Params: id
*/
projectRouters.get(
  "/:projectId",
  accessTokenValidation,
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  wrapRequestHandler(projectController.getProjectById)
);

/*
Description: Update a project - only leader/creator can update
Method: PATCH
Path: /:project_id
Body: { title?: string, description?: string, key?: string }
*/
projectRouters.patch(
  "/:projectId",
  accessTokenValidation,
  projectMiddlewares.validateUpdateProject,
  wrapRequestHandler(
    projectMiddlewares.checkProjectPermissions(["Leader", "Creator"])
  ),
  wrapRequestHandler(projectController.updateProjectById)
);

/*
Description: Delete a project - only leader/creator can delete
Method: DELETE  
Path: /:project_id
*/
projectRouters.delete(
  "/:projectId",
  accessTokenValidation,
  wrapRequestHandler(
    projectMiddlewares.checkProjectPermissions(["Leader", "Creator"])
  ),
  wrapRequestHandler(projectController.deleteProjectById)
);

/*
Description: Get project activity logs
Method: GET
Path: /:project_id/activities
*/
// cần chỉnh sửa để lấy chi tiết hơn các hoạt động của project
projectRouters.get(
  "/:projectId/activities",
  accessTokenValidation,
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  wrapRequestHandler(projectController.getProjectActivities)
);

// /*
// Description: Archive/Unarchive project
// Method: PATCH
// Path: /:project_id/archive
// */
// projectRouters.patch(
//   "/:project_id/archive",
//   accessTokenValidation,
//   projectMiddlewares.checkProjectPermissions(["Leader", "Creator"]),
//   wrapRequestHandler(projectController.toggleProjectArchive)
// );

// /*
// Description: Get project members
// Method: GET
// Path: /:project_id/members
// */
// projectRouters.get(
//   "/:project_id/members",
//   accessTokenValidation,
//   projectMiddlewares.verifyUserProjectAccess,
//   wrapRequestHandler(projectController.getProjectMembers)
// );

// /*
// Description: Add member to project
// Method: POST
// Path: /:project_id/members
// */
// projectRouters.post(
//   "/:project_id/members",
//   accessTokenValidation,
//   projectMiddlewares.checkProjectPermissions(["Leader", "Creator"]),
//   wrapRequestHandler(projectController.addProjectMember)
// );

// /*
// Description: Update member role
// Method: PATCH
// Path: /:project_id/members/:member_id
// */
// projectRouters.patch(
//   "/:project_id/members/:member_id",
//   accessTokenValidation,
//   projectMiddlewares.checkProjectPermissions(["Leader", "Creator"]),
//   wrapRequestHandler(projectController.updateMemberRole)
// );

// /*
// Description: Leave/Remove from project
// Method: DELETE
// Path: /:project_id/members/:member_id
// */
// projectRouters.delete(
//   "/:project_id/members/:member_id",
//   accessTokenValidation,
//   projectMiddlewares.verifyUserProjectAccess,
//   wrapRequestHandler(projectController.removeMember)
// );

export default projectRouters;
