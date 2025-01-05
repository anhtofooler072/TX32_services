import databaseServices from "./database.service"

class UsersService {
    async checkEmailExist(email: string) {
        const user = await databaseServices.users.findOne({ email })
        return !!user
    }
}

const usersService = new UsersService()
export default usersService