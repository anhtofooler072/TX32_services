import databaseServices from "./database.service"
import { ObjectId } from 'mongodb'
class UsersService {
    async checkEmailExist(email: string) {
        const user = await databaseServices.users.findOne({ email })
        return !!user
    }

    async checkUserExistById(id: string) {
        const user = await databaseServices.users.findOne({ _id: new ObjectId(id) })
        return !!user
    }
}

const usersService = new UsersService()
export default usersService


