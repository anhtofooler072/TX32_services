import { Schema, model, Document } from 'mongoose'
import { EMAIL_REGEXP, NAME_REGEXP } from '~/helpers/regex'
import { ObjectId } from 'mongodb'
import collections from '~/constants/collections'

const UserSchema = new Schema({
    username: {
        type: String,
        trim: true,
        unique: true,
        match: NAME_REGEXP,
        required: true,
        index: true
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true,
        match: EMAIL_REGEXP,
        index: true
    },
    password: {
        type: String,
        required: function (this: any) {
            // Chỉ yêu cầu mật khẩu nếu người dùng không đăng nhập bằng Google
            return !this.googleId;
        }
    },
    googleId: {
        type: String, // Google ID
        unique: true,
        sparse: true // Dùng sparse để không bắt buộc phải có googleId cho người dùng thông thường
    },
    date_of_birth: { type: Date, default: Date.now },
    avatar_url: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    },
    forgot_password: {
        type: String,
        default: ''
    },
    verify: {
        type: String,
        enum: ["unverified", "verified", "expired"],
        default: "unverified"
    },
    role: {
        type: String,
        enum: ['leader', 'staff'],
        default: 'staff',
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    last_login_time: { type: Date, default: Date.now }
})

export interface IUser extends Document {
    _id: ObjectId
    username: string
    email: string
    password?: string // Mật khẩu không bắt buộc nếu đăng nhập bằng Google
    googleId?: string // ID từ Google
    date_of_birth: Date
    avatar_url?: string
    bio: string
    status: string
    tag: string
    forgot_password: string
    verify: string
    role: string
    created_at: Date
    updated_at: Date
    lastLoginTime: Date
}

const User = model<IUser>(collections.USERS, UserSchema)

export default User
