import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'
import collections from '~/constants/collections'

const LogingProjectActivitySchema = new Schema({
    project: {
        type: ObjectId,
        ref: collections.PROJECT,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    task: {
        type: ObjectId,
        ref: collections.TASK,
    },
    user: {
        type: ObjectId,
        ref: collections.USER,
        required: true
    },
    detail: {
        type: String,
        default: ''
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

export interface ILogingProjectActivity extends Document {
    _id: ObjectId
    project: ObjectId
    action: string
    task: ObjectId
    user: ObjectId
    detail: string
    createdAt: Date
    updatedAt: Date
}

const LogingProjectActivity = model<ILogingProjectActivity>(collections.LOGING_PROJECT_ACTIVITY, LogingProjectActivitySchema)

export default LogingProjectActivity