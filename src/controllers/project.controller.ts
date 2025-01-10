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
    const { user_id } = req.decoded_authorization as TokenPayload;
    const result = await projectService.getAllParticipatingProjects(user_id);
    new OK({
      message: PROJECTS_MESSAGES.GET_ALL_PROJECTS_SUCCESSFULLY,
      metadata: result,
    }).send(res);
  };

  updateProjectById = async (req: Request, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const updateData = { ...req.body, userId: user_id };
    const result = await projectService.updateProjectById(
      req.params.projectId,
      updateData
    );
    new OK({
      message: PROJECTS_MESSAGES.UPDATE_PROJECT_SUCCESSFULLY,
      metadata: result,
    }).send(res);
  };

  deleteProjectById = async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { user_id } = req.decoded_authorization as TokenPayload;
    const result = await projectService.deleteProjectById(projectId, user_id);
    new OK({
      message: PROJECTS_MESSAGES.DELETE_PROJECT_SUCCESSFULLY,
      metadata: result,
    }).send(res);
  };

  getProjectActivities = async (req: Request, res: Response) => {
    const result = await projectService.getProjectActivities(
      req.params.projectId
    );
    new OK({
      message: PROJECTS_MESSAGES.GET_PROJECT_ACTIVITIES_SUCCESSFULLY,
      metadata: result,
    }).send(res);
  };

  getProjectParticipants = async (req: Request, res: Response) => {
    const result = await projectService.getProjectParticipants(
      req.params.projectId
    );
    new OK({
      message: PROJECTS_MESSAGES.GET_PARTICIPANTS_SUCCESSFULLY,
      metadata: result,
    }).send(res);
  };

  addProjectParticipant = async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { user_id } = req.decoded_authorization as TokenPayload;
    const result = await projectService.addProjectParticipant(
      projectId,
      req.body
    );
    new OK({
      message: PROJECTS_MESSAGES.ADD_PARTICIPANT_SUCCESSFULLY,
      metadata: result,
    }).send(res);
  };

  updateProjectParticipantRole = async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const result = await projectService.updateProjectParticipantRole(
      projectId,
      req.body
    );
    new OK({
      message: PROJECTS_MESSAGES.UPDATE_PARTICIPANT_ROLE_SUCCESSFULLY,
      metadata: result,
    }).send(res);
  };

  removeProjectParticipant = async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const result = await projectService.removeProjectParticipant(
      projectId,
      req.body
    );
    new OK({
      message: PROJECTS_MESSAGES.REMOVE_PARTICIPANT_SUCCESSFULLY,
      metadata: result,
    }).send(res);
  };
}

export default new ProjectController();
