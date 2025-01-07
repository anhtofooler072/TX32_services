import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'
import collections from '~/constants/collections'

const ParticipantSchema = new Schema({
    project_id: {
        type: ObjectId,
        ref: collections.PROJECT,
        required: true
    },
    user_id: {
        type: ObjectId,
        ref: collections.USER,
        required: true
    },
    role: {
        type: String,
        enum: ['Leader', 'Staff'],
        default: 'staff'
    },
    status: {
        type: String,
        enum: ['Active', 'Left', 'Banned'],
        default: 'Active',
    },
    joined_at: {
        type: Date,
        default: Date.now,
    },
})

export interface IParticipant extends Document {
    _id: ObjectId
    project_id: ObjectId
    user_id: ObjectId
    role: string
    status: string
    joined_at: Date
}

const Participant = model<IParticipant>(collections.PARTICIPANT, ParticipantSchema)

export default Participant