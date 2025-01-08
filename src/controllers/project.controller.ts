"use strict";

import { Request, Response } from "express";
import { PROJECTS_MESSAGES } from "~/constants/messages";
import { CREATED, OK } from "~/core/succes.response";
import { TokenPayload } from "~/models/requests/user.request";
import projectService from "~/services/project.service";

declare module "express-serve-static-core" {
  interface Request {
    decoded_authorization?: TokenPayload;
  }
}

class ProjectController {
  createNewProject = async (req: Request, res: Response) => {
    const result = await projectService.createNewProject(req.body);
    new CREATED({
      message: PROJECTS_MESSAGES.CREATE_PROJECT_SUCCESSFULLY,
      metadata: result,
    }).send(res);
  };

  getProjectById = async (req: Request, res: Response) => {
    const result = await projectService.getProjectById(req.params.projectId);
    new OK({
      message: PROJECTS_MESSAGES.GET_PROJECT_SUCCESSFULLY,
      metadata: result,
    }).send(res);
  };

  getAllParticipatingProjects = async (req: Request, res: Response) => {
    const user_id = req.decoded_authorization?.user_id;
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const result = await projectService.getAllParticipatingProjects(
      user_id
      //   req.query
    );
    new OK({
      message: PROJECTS_MESSAGES.GET_ALL_PROJECTS_SUCCESSFULLY,
      metadata: result,
    }).send(res);
  };
}

export default new ProjectController();
