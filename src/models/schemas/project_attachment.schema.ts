import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'
import collections from '~/constants/collections'

const ProjectAttachmentSchema = new Schema({
    project_id: {
        type: ObjectId,
        ref: collections.PROJECT,
        required: true
    },
    attachment_id: {
        type: ObjectId,
        ref: collections.ATTACHMENT,
        required: true
    },
    created_at: { type: Date, default: Date.now },
})

export interface IProjectAttachment extends Document {
    _id: ObjectId
    project_id: ObjectId
    attachment_id: ObjectId
    created_at: Date
}

const ProjectAttachment = model<IProjectAttachment>(collections.PROJECT_ATTACHMENT, ProjectAttachmentSchema)

export default ProjectAttachment

