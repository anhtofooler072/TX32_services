import {
  ProjectReqBody,
  UpdateProjectReqBody,
} from "~/models/requests/project.request";
import databaseServices from "./database.service";
import Project from "~/models/schemas/project.schema";
import { ObjectId } from "mongodb";
import Participant from "~/models/schemas/participant.schema";
import { ErrorWithStatus } from "~/utils/errors.util";
import HTTP_STATUS_CODES from "~/core/statusCodes";
import { PROJECTS_MESSAGES, USERS_MESSAGES } from "~/constants/messages";
import activityService from "~/services/activity.service";
import collections from "~/constants/collections";

class ProjectService {
  async findProjects(query = {}) {
    return databaseServices.projects
      .find({
        ...query,
        deleted: { $ne: true },
      })
      .toArray();
  }

  async checkProjectExist(id: string): Promise<boolean> {
    const project = await databaseServices.projects.findOne({
      _id: new ObjectId(id),
    });
    return !!project;
  }

  async addParticipantToProject(
    projectId: ObjectId,
    creatorId: string,
    participants: string[]
  ): Promise<void> {
    const participantDocs = participants.map(
      (userId) =>
        new Participant({
          _id: new ObjectId(),
          project_id: projectId,
          user_id: new ObjectId(userId),
          role: userId === creatorId ? "leader" : "staff",
          status: "active",
          joined_at: new Date(),
        })
    );

    await databaseServices.participants.insertMany(participantDocs);
  }

  async createNewProject(payload: ProjectReqBody) {
    const { title, description, creator, key, participants = [] } = payload;

    // đảm bảo creator có trong danh sách participants
    if (!participants.includes(creator)) {
      participants.push(creator);
    }

    const project = new Project({
      _id: new ObjectId(),
      title,
      description,
      creator: new ObjectId(creator),
      key,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const result = await databaseServices.projects.insertOne(project);

    if (participants.length > 0) {
      await this.addParticipantToProject(
        result.insertedId,
        creator,
        participants
      );
    }

    return {
      _id: result.insertedId,
      title,
      description,
      creator,
      key,
      participants,
    };
  }

  async getAllParticipatingProjects(userId: string) {
    const userIdObj = new ObjectId(userId);

    const projects = await databaseServices.participants
      .aggregate([
        {
          $match: {
            user_id: userIdObj,
            status: "active",
          },
        },
        {
          $lookup: {
            from: collections.PROJECT,
            localField: "project_id",
            foreignField: "_id",
            pipeline: [{ $match: { deleted: false } }],
            as: "project",
          },
        },
        { $unwind: "$project" },
        {
          $lookup: {
            from: collections.USER,
            localField: "project.creator",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  username: 1,
                  email: 1,
                  avatar_url: 1,
                },
              },
            ],
            as: "creator_info",
          },
        },
        // Add lookup for leader information
        {
          $lookup: {
            from: collections.PARTICIPANT,
            let: { project_id: "$project._id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$project_id", "$$project_id"] },
                      { $eq: ["$role", "leader"] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: collections.USER,
                  localField: "user_id",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $project: {
                        username: 1,
                        email: 1,
                        avatar_url: 1,
                      },
                    },
                  ],
                  as: "leader_info",
                },
              },
              { $unwind: "$leader_info" },
            ],
            as: "leader",
          },
        },
        {
          $project: {
            _id: "$project._id",
            title: "$project.title",
            description: "$project.description",
            key: "$project.key",
            created_at: "$project.created_at",
            updated_at: "$project.updated_at",
            role: "$role",
            creator: { $arrayElemAt: ["$creator_info", 0] },
            leader: {
              $let: {
                vars: {
                  leaderDoc: { $arrayElemAt: ["$leader", 0] },
                },
                in: {
                  _id: "$$leaderDoc._id",
                  project_id: "$$leaderDoc.project_id",
                  role: "$$leaderDoc.role",
                  status: "$$leaderDoc.status",
                  joined_at: "$$leaderDoc.joined_at",
                  username: "$$leaderDoc.leader_info.username",
                  email: "$$leaderDoc.leader_info.email",
                  avatar_url: "$$leaderDoc.leader_info.avatar_url",
                },
              },
            },
          },
        },
      ])
      .toArray();

    return projects;
  }

  async getProjectById(projectId: string) {
    const projectIdObj = new ObjectId(projectId);

    const project = await databaseServices.projects
      .aggregate([
        // Bước 1: Tìm dự án theo ID
        { $match: { _id: projectIdObj, deleted: false } },

        // Bước 2: Lookup participants từ bảng Participant
        {
          $lookup: {
            from: collections.PARTICIPANT,
            localField: "_id",
            foreignField: "project_id",
            as: "participants",
          },
        },

        // Bước 3: Lookup thông tin user từ bảng User
        {
          $lookup: {
            from: collections.USER,
            localField: "participants.user_id",
            foreignField: "_id",
            as: "userDetails",
          },
        },

        // Bước 4: Gộp participants với thông tin user
        {
          $addFields: {
            participants: {
              $map: {
                input: "$participants",
                as: "participant",
                in: {
                  _id: "$$participant.user_id",
                  project_id: "$$participant.project_id",
                  role: "$$participant.role",
                  status: "$$participant.status",
                  joined_at: "$$participant.joined_at",
                  username: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$userDetails",
                              as: "user",
                              cond: {
                                $eq: ["$$user._id", "$$participant.user_id"],
                              },
                            },
                          },
                          as: "user",
                          in: "$$user.username",
                        },
                      },
                      0,
                    ],
                  },
                  email: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$userDetails",
                              as: "user",
                              cond: {
                                $eq: ["$$user._id", "$$participant.user_id"],
                              },
                            },
                          },
                          as: "user",
                          in: "$$user.email",
                        },
                      },
                      0,
                    ],
                  },
                  avatar_url: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$userDetails",
                              as: "user",
                              cond: {
                                $eq: ["$$user._id", "$$participant.user_id"],
                              },
                            },
                          },
                          as: "user",
                          in: "$$user.avatar_url",
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },

        // Bước 5: Sắp xếp participants
        {
          $addFields: {
            participants: {
              $sortArray: {
                input: "$participants",
                sortBy: { joined_at: -1 },
              },
            },
          },
        },

        // Bước 6: Lookup tasks từ bảng Task
        {
          $lookup: {
            from: collections.TASK,
            localField: "_id",
            foreignField: "project",
            as: "tasks",
          },
        },

        // Bước 7: Chọn các trường cần thiết từ tasks
        {
          $addFields: {
            tasks: {
              $map: {
                input: "$tasks",
                as: "task",
                in: {
                  _id: "$$task._id",
                  title: "$$task.title",
                  description: "$$task.description",
                  type: "$$task.type",
                  status: "$$task.status",
                  priority: "$$task.priority",
                  progress: "$$task.progress",
                  dueDate: "$$task.dueDate",
                  assignee: "$$task.assignee",
                  created_at: "$$task.created_at",
                  updated_at: "$$task.updated_at",
                },
              },
            },
          },
        },

        // Bước 8: Lookup attachments qua bảng ProjectAttachment
        {
          $lookup: {
            from: collections.PROJECT_ATTACHMENT,
            localField: "_id",
            foreignField: "project_id",
            as: "projectAttachments",
          },
        },
        {
          $lookup: {
            from: collections.ATTACHMENT,
            localField: "projectAttachments.attachment_id",
            foreignField: "_id",
            as: "attachments",
          },
        },

        // Bước 9: Chọn các trường cần thiết từ attachments
        {
          $addFields: {
            attachments: {
              $map: {
                input: "$attachments",
                as: "attachment",
                in: {
                  _id: "$$attachment._id",
                  attachment_type: "$$attachment.attachment_type",
                  file_url: "$$attachment.file_url",
                  created_at: "$$attachment.created_at",
                },
              },
            },
          },
        },

        // Bước 10: Chỉ chọn các trường cần thiết trong dự án
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            creator: 1,
            key: 1,
            participants: 1,
            tasks: 1,
            attachments: 1,
          },
        },
      ])
      .toArray();

    // Kiểm tra nếu dự án không tồn tại
    if (!project || project.length === 0) {
      throw new ErrorWithStatus({
        message: PROJECTS_MESSAGES.PROJECT_NOT_FOUND,
        status: HTTP_STATUS_CODES.NOT_FOUND,
      });
    }

    // Trả về dự án đầu tiên
    return project[0];
  }

  async updateProjectById(projectId: string, updateData: UpdateProjectReqBody) {
    const { userId, ...projectUpdateData } = updateData;
    const existingProject = await databaseServices.projects.findOne({
      _id: new ObjectId(projectId),
      deleted: { $ne: true },
    });

    if (!existingProject) {
      throw new ErrorWithStatus({
        message: PROJECTS_MESSAGES.PROJECT_NOT_FOUND,
        status: HTTP_STATUS_CODES.NOT_FOUND,
      });
    }

    const userInfo = await databaseServices.users.findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          _id: 1,
          username: 1,
          email: 1,
          avatar_url: 1,
        },
      }
    );

    if (!userInfo) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS_CODES.NOT_FOUND,
      });
    }

    const changes: Record<string, { from: any; to: any }> = {};

    Object.keys(projectUpdateData).forEach((key) => {
      if (
        key in existingProject &&
        existingProject[key as keyof typeof existingProject]?.toString() !==
          projectUpdateData[key as keyof typeof projectUpdateData]?.toString()
      ) {
        changes[key] = {
          from: existingProject[key as keyof typeof existingProject],
          to: projectUpdateData[key as keyof typeof projectUpdateData],
        };
      }
    });

    const changeDescriptions = Object.entries(changes).map(
      ([field, { from, to }]) => {
        return `${userInfo.username} changed ${field} from "${
          from || "empty"
        }" to "${to}"`;
      }
    );

    const result = await databaseServices.projects.findOneAndUpdate(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          ...projectUpdateData,
          hasBeenModified: true,
          updated_at: new Date(),
        },
        $push: {
          revisionHistory: {
            modifiedAt: new Date(),
            modifiedBy: {
              _id: new ObjectId(userInfo._id),
              username: userInfo.username,
              email: userInfo.email,
              avatar_url: userInfo?.avatar_url || "",
            },
            changes,
            changeDescription: changeDescriptions.join(", "),
          },
        },
      },
      { returnDocument: "after" }
    );

    await activityService.logActivity({
      projectId,
      entity: "project",
      action: "UPDATE",
      modifiedBy: {
        _id: new ObjectId(userInfo._id),
        username: userInfo.username,
        email: userInfo.email,
        avatar_url: userInfo?.avatar_url || "",
      },
      changes,
      detail: `Project "${result?.title}" was updated by ${userInfo.username}`,
    });

    return result;
  }

  async deleteProjectById(projectId: string, userId: string) {
    const existingProject = await databaseServices.projects.findOne({
      _id: new ObjectId(projectId),
      deleted: { $ne: true },
    });

    if (!existingProject) {
      throw new ErrorWithStatus({
        message: PROJECTS_MESSAGES.PROJECT_NOT_FOUND,
        status: HTTP_STATUS_CODES.NOT_FOUND,
      });
    }

    const tasksUpdateResult = await databaseServices.tasks.updateMany(
      { project_id: new ObjectId(projectId), deleted: { $ne: true } },
      { $set: { deleted: true, deletedAt: new Date() } }
    );

    const attachmentsUpdateResult =
      await databaseServices.project_attachments.updateMany(
        { project_id: new ObjectId(projectId), deleted: { $ne: true } },
        { $set: { deleted: true, deletedAt: new Date() } }
      );

    const participantsUpdateResult =
      await databaseServices.participants.updateMany(
        { project_id: new ObjectId(projectId), deleted: { $ne: true } },
        { $set: { deleted: true, deletedAt: new Date() } }
      );

    const logsUpdateResult = await databaseServices.activities.updateMany(
      { project_id: new ObjectId(projectId), deleted: { $ne: true } },
      { $set: { deleted: true, deletedAt: new Date() } }
    );

    const projectUpdateResult = await databaseServices.projects.updateOne(
      { _id: new ObjectId(projectId), deleted: { $ne: true } },
      { $set: { deleted: true, deletedAt: new Date() } }
    );

    if (!projectUpdateResult.modifiedCount) {
      throw new ErrorWithStatus({
        message: "Failed to delete project.",
        status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      });
    }

    return {
      projectId,
      taskCount: tasksUpdateResult.modifiedCount,
      attachmentCount: attachmentsUpdateResult.modifiedCount,
      participantCount: participantsUpdateResult.modifiedCount,
      logCount: logsUpdateResult.modifiedCount,
    };
  }

  async getProjectActivities(projectId: string) {
    const projectIdObj = new ObjectId(projectId);

    const activities = await databaseServices.activities
      .aggregate([
        {
          $match: {
            project_id: projectIdObj,
            deleted: { $ne: true },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $project: {
            _id: 1,
            project_id: 1,
            action: 1,
            createdAt: 1,
            modifiedBy: 1,
            changes: 1,
            detail: 1,
          },
        },
      ])
      .toArray();

    return activities;
  }

  async getProjectParticipants(projectId: string) {
    const projectIdObj = new ObjectId(projectId);

    // Get participants with user details
    const participants = await databaseServices.participants
      .aggregate([
        {
          $match: {
            project_id: projectIdObj,
            deleted: { $ne: true },
          },
        },
        {
          $lookup: {
            from: collections.USER,
            localField: "user_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  username: 1,
                  email: 1,
                  avatar_url: 1,
                },
              },
            ],
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
        {
          $project: {
            _id: 1,
            user: {
              _id: "$userDetails._id",
              username: "$userDetails.username",
              email: "$userDetails.email",
              avatar_url: "$userDetails.avatar_url",
            },
            role: 1,
            status: 1,
            joined_at: 1,
          },
        },
      ])
      .toArray();

    return participants;
  }

  async addProjectParticipant(
    projectId: string,
    payload: { userId: string; role: string }
  ) {
    const { userId, role } = payload;

    const projectIdObj = new ObjectId(projectId);
    const userIdObj = new ObjectId(userId);

    // Kiểm tra nếu user đã là participant
    const existingParticipant = await databaseServices.participants.findOne({
      project_id: projectIdObj,
      user_id: userIdObj,
      deleted: false,
    });

    if (existingParticipant) {
      throw new ErrorWithStatus({
        message: PROJECTS_MESSAGES.PARTICIPANT_ALREADY_EXIST,
        status: HTTP_STATUS_CODES.BAD_REQUEST,
      });
    }

    const participant = new Participant({
      project_id: projectIdObj,
      user_id: userIdObj,
      role,
    });

    await databaseServices.participants.insertOne(participant);

    return participant;
  }

  async updateProjectParticipantRole(
    projectId: string,
    payload: {
      userId: string;
      role: string;
    }
  ) {
    const { userId, role } = payload;
    const projectIdObj = new ObjectId(projectId);
    const userIdObj = new ObjectId(userId);

    const updatedParticipant =
      await databaseServices.participants.findOneAndUpdate(
        { project_id: projectIdObj, user_id: userIdObj, deleted: false },
        { $set: { role } },
        { returnDocument: "after" }
      );

    if (!updatedParticipant) {
      throw new ErrorWithStatus({
        message: PROJECTS_MESSAGES.PARTICIPANT_NOT_FOUND,
        status: HTTP_STATUS_CODES.NOT_FOUND,
      });
    }

    return updatedParticipant;
  }

  async removeProjectParticipant(
    projectId: string,
    payload: { userId: string }
  ) {
    const { userId } = payload;
    const projectIdObj = new ObjectId(projectId);
    const userIdObj = new ObjectId(userId);

    const updatedParticipant = await Participant.findOneAndUpdate(
      { project_id: projectIdObj, user_id: userIdObj, deleted: false },
      { $set: { deleted: true, deletedAt: new Date() } },
      { new: true }
    );

    if (!updatedParticipant) {
      throw new ErrorWithStatus({
        message: "Participant not found or has already been removed.",
        status: HTTP_STATUS_CODES.NOT_FOUND,
      });
    }

    return updatedParticipant;
  }
}

const projectService = new ProjectService();
export default projectService;
