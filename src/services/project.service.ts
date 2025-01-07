import { ProjectReqBody } from "~/models/requests/project.request"
import databaseServices from "./database.service"
import Project from "~/models/schemas/project.schema"
import { ObjectId } from "mongodb"
import Participant from "~/models/schemas/participant.schema";


class ProjectService {
    async checkProjectExist(projectName: string): Promise<boolean> {
        const project = await databaseServices.projects.findOne({ projectName })
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
}

const projectService = new ProjectService()
export default projectService;