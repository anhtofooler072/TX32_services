import { Schema, model, Document } from 'mongoose'
import collections from '~/constants/collections'

const AttachmentSchema = new Schema({
    attachment_type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document'],
        required: true
    },
    file_url: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})

// Kiểu dữ liệu cho AttachmentDocument
export interface AttachmentDocument extends Document {
    attachment_type: string // Loại file đính kèm:  image, video, audio, document
    file_url: string
    created_at: Date
}

// Tạo model cho Attachment
export const Attachment = model<AttachmentDocument>(collections.ATTACHMENT, AttachmentSchema)
