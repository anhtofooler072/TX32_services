import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'
import collections from '~/constants/collections'

const ParticipantSchema = new Schema({
    user: {
        type: ObjectId,
        ref: collections.USER,
        required: true
    },
    project: {
        type: ObjectId,
        ref: collections.PROJECT,
        required: true
    },
    role: {
        type: String,
        enum: ['leader', 'staff'],
        default: 'staff'
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
})

export interface IParticipant extends Document {
    _id: ObjectId
    user: ObjectId
    project: ObjectId
    role: string
    created_at: Date
    updated_at: Date
}

const Participant = model<IParticipant>(collections.PARTICIPANT, ParticipantSchema)

export default Participant