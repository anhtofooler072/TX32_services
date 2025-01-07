import { ProjectReqBody } from "~/models/requests/project.request"
import databaseServices from "./database.service"
import Project from "~/models/schemas/project.schema"
import { ObjectId } from "mongodb"
import Participant from "~/models/schemas/participant.schema";
import { ErrorWithStatus } from "~/utils/errors.util";
import HTTP_STATUS_CODES from "~/core/statusCodes";
import { PROJECTS_MESSAGES } from "~/constants/messages";


class ProjectService {
    async checkProjectExist(id: string): Promise<boolean> {
        const project = await databaseServices.projects.findOne({ _id: new ObjectId(id) })
        return !!project
    }

    async addParticipantToProject(
        projectId: ObjectId,
        creatorId: string,
        participants: string[]
    ): Promise<void> {
        const participantDocs = participants.map((userId) => (
            new Participant({
                _id: new ObjectId(),
                project_id: projectId,
                user_id: new ObjectId(userId),
                role: userId === creatorId ? 'Leader' : 'Staff',
                status: 'active',
                joined_at: new Date()
            })
        ))

        await databaseServices.participants.insertMany(participantDocs)
    }

    async createNewProject(payload: ProjectReqBody) {
        const { title, description, creator, participants = [] } = payload

        // đảm bảo creator có trong danh sách participants
        if (!participants.includes(creator)) {
            participants.push(creator)
        }

        const project = new Project({
            _id: new ObjectId(),
            title,
            description,
            creator: new ObjectId(creator),
            created_at: new Date(),
            updated_at: new Date()
        })

        const result = await databaseServices.projects.insertOne(project)

        if (participants.length > 0) {
            await this.addParticipantToProject(result.insertedId, creator, participants)
        }

        return {
            _id: result.insertedId,
            title,
            description,
            creator,
            participants
        }
    }

    // async getProjectById(projectId: string) {
    //     const projectIdObj = new ObjectId(projectId);

    //     const project = await databaseServices.projects.aggregate([
    //         // Bước 1: Tìm dự án theo ID
    //         {
    //             $match: { _id: projectIdObj }
    //         },

    //         // Bước 2: Lookup để lấy participants từ collection Participant
    //         {
    //             $lookup: {
    //                 from: 'Participant',
    //                 localField: '_id',
    //                 foreignField: 'project_id',
    //                 as: 'participants'
    //             }
    //         },

    //         // Bước 3: Lookup để lấy thông tin user từ collection User
    //         {
    //             $lookup: {
    //                 from: 'User',
    //                 localField: 'participants.user_id',
    //                 foreignField: '_id',
    //                 as: 'userDetails'
    //             }
    //         },

    //         // Bước 4: Gộp dữ liệu từ participants và userDetails
    //         {
    //             $addFields: {
    //                 participants: {
    //                     $map: {
    //                         input: '$participants',
    //                         as: 'participant',
    //                         in: {
    //                             _id: '$$participant.user_id',
    //                             project_id: '$$participant.project_id',
    //                             role: '$$participant.role',
    //                             status: '$$participant.status',
    //                             joined_at: '$$participant.joined_at',
    //                             username: {
    //                                 $arrayElemAt: [
    //                                     {
    //                                         $map: {
    //                                             input: {
    //                                                 $filter: {
    //                                                     input: '$userDetails',
    //                                                     as: 'user',
    //                                                     cond: { $eq: ['$$user._id', '$$participant.user_id'] }
    //                                                 }
    //                                             },
    //                                             as: 'user',
    //                                             in: '$$user.username'
    //                                         }
    //                                     },
    //                                     0
    //                                 ]
    //                             },
    //                             email: {
    //                                 $arrayElemAt: [
    //                                     {
    //                                         $map: {
    //                                             input: {
    //                                                 $filter: {
    //                                                     input: '$userDetails',
    //                                                     as: 'user',
    //                                                     cond: { $eq: ['$$user._id', '$$participant.user_id'] }
    //                                                 }
    //                                             },
    //                                             as: 'user',
    //                                             in: '$$user.email'
    //                                         }
    //                                     },
    //                                     0
    //                                 ]
    //                             },
    //                             avatar_url: {
    //                                 $arrayElemAt: [
    //                                     {
    //                                         $map: {
    //                                             input: {
    //                                                 $filter: {
    //                                                     input: '$userDetails',
    //                                                     as: 'user',
    //                                                     cond: { $eq: ['$$user._id', '$$participant.user_id'] }
    //                                                 }
    //                                             },
    //                                             as: 'user',
    //                                             in: '$$user.avatar_url'
    //                                         }
    //                                     },
    //                                     0
    //                                 ]
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         },

    //         // Bước 5: Sắp xếp participants theo `joined_at` (giảm dần)
    //         {
    //             $addFields: {
    //                 participants: {
    //                     $sortArray: {
    //                         input: '$participants',
    //                         sortBy: { joined_at: -1 }
    //                     }
    //                 }
    //             }
    //         },

    //         // Bước 6: Chỉ chọn các trường cần thiết
    //         {
    //             $project: {
    //                 _id: 1,
    //                 title: 1,
    //                 description: 1,
    //                 creator: 1,
    //                 participants: 1
    //             }
    //         }
    //     ]).toArray();

    //     // Kiểm tra nếu dự án không tồn tại
    //     if (!project || project.length === 0) {
    //         throw new ErrorWithStatus({
    //             message: PROJECTS_MESSAGES.PROJECT_NOT_FOUND,
    //             status: HTTP_STATUS_CODES.NOT_FOUND
    //         });
    //     }

    //     // Trả về dự án đầu tiên
    //     return project[0];
    // }

    async getProjectById(projectId: string) {
        const projectIdObj = new ObjectId(projectId);

        const project = await databaseServices.projects.aggregate([
            // Bước 1: Tìm dự án theo ID
            { $match: { _id: projectIdObj } },

            // Bước 2: Lookup participants từ bảng Participant
            {
                $lookup: {
                    from: 'Participant',
                    localField: '_id',
                    foreignField: 'project_id',
                    as: 'participants'
                }
            },

            // Bước 3: Lookup thông tin user từ bảng User
            {
                $lookup: {
                    from: 'User',
                    localField: 'participants.user_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },

            // Bước 4: Gộp participants với thông tin user
            {
                $addFields: {
                    participants: {
                        $map: {
                            input: '$participants',
                            as: 'participant',
                            in: {
                                _id: '$$participant.user_id',
                                project_id: '$$participant.project_id',
                                role: '$$participant.role',
                                status: '$$participant.status',
                                joined_at: '$$participant.joined_at',
                                username: {
                                    $arrayElemAt: [
                                        {
                                            $map: {
                                                input: {
                                                    $filter: {
                                                        input: '$userDetails',
                                                        as: 'user',
                                                        cond: { $eq: ['$$user._id', '$$participant.user_id'] }
                                                    }
                                                },
                                                as: 'user',
                                                in: '$$user.username'
                                            }
                                        },
                                        0
                                    ]
                                },
                                email: {
                                    $arrayElemAt: [
                                        {
                                            $map: {
                                                input: {
                                                    $filter: {
                                                        input: '$userDetails',
                                                        as: 'user',
                                                        cond: { $eq: ['$$user._id', '$$participant.user_id'] }
                                                    }
                                                },
                                                as: 'user',
                                                in: '$$user.email'
                                            }
                                        },
                                        0
                                    ]
                                },
                                avatar_url: {
                                    $arrayElemAt: [
                                        {
                                            $map: {
                                                input: {
                                                    $filter: {
                                                        input: '$userDetails',
                                                        as: 'user',
                                                        cond: { $eq: ['$$user._id', '$$participant.user_id'] }
                                                    }
                                                },
                                                as: 'user',
                                                in: '$$user.avatar_url'
                                            }
                                        },
                                        0
                                    ]
                                }
                            }
                        }
                    }
                }
            },

            // Bước 5: Sắp xếp participants
            {
                $addFields: {
                    participants: {
                        $sortArray: {
                            input: '$participants',
                            sortBy: { joined_at: -1 }
                        }
                    }
                }
            },

            // Bước 6: Lookup tasks từ bảng Task
            {
                $lookup: {
                    from: 'Task',
                    localField: '_id',
                    foreignField: 'project',
                    as: 'tasks'
                }
            },

            // Bước 7: Chọn các trường cần thiết từ tasks
            {
                $addFields: {
                    tasks: {
                        $map: {
                            input: '$tasks',
                            as: 'task',
                            in: {
                                _id: '$$task._id',
                                title: '$$task.title',
                                description: '$$task.description',
                                type: '$$task.type',
                                status: '$$task.status',
                                priority: '$$task.priority',
                                progress: '$$task.progress',
                                dueDate: '$$task.dueDate',
                                assignee: '$$task.assignee',
                                created_at: '$$task.created_at',
                                updated_at: '$$task.updated_at'
                            }
                        }
                    }
                }
            },

            // Bước 8: Lookup attachments qua bảng ProjectAttachment
            {
                $lookup: {
                    from: 'ProjectAttachment',
                    localField: '_id',
                    foreignField: 'project_id',
                    as: 'projectAttachments'
                }
            },
            {
                $lookup: {
                    from: 'Attachment',
                    localField: 'projectAttachments.attachment_id',
                    foreignField: '_id',
                    as: 'attachments'
                }
            },

            // Bước 9: Chọn các trường cần thiết từ attachments
            {
                $addFields: {
                    attachments: {
                        $map: {
                            input: '$attachments',
                            as: 'attachment',
                            in: {
                                _id: '$$attachment._id',
                                attachment_type: '$$attachment.attachment_type',
                                file_url: '$$attachment.file_url',
                                created_at: '$$attachment.created_at'
                            }
                        }
                    }
                }
            },

            // Bước 10: Chỉ chọn các trường cần thiết trong dự án
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    creator: 1,
                    participants: 1,
                    tasks: 1,
                    attachments: 1
                }
            }
        ]).toArray();

        // Kiểm tra nếu dự án không tồn tại
        if (!project || project.length === 0) {
            throw new ErrorWithStatus({
                message: PROJECTS_MESSAGES.PROJECT_NOT_FOUND,
                status: HTTP_STATUS_CODES.NOT_FOUND
            });
        }

        // Trả về dự án đầu tiên
        return project[0];
    }


}

const projectService = new ProjectService()
export default projectService;