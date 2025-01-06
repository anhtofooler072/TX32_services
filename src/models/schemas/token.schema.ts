import { Schema, model, Document } from 'mongoose'
import collections from '~/constants/collections'
import { IUser } from './user.schema'

const TokenSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: collections.USER,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    expires_at: {
        type: Date,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})

export interface IToken extends Document {
    user_id: IUser['_id'] // Tham chiếu đến người dùng sở hữu token này
    token: string // Mã token
    type: string // Loại token (vd: 'reset-password', 'verify-email', )
    expires_at: Date // Thời gian hết hạn token
    created_at: Date // Thời gian tạo token
}

export const Token = model<IToken>(collections.TOKEN, TokenSchema)
