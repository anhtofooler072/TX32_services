"use strict"

import { Collection, Db, MongoClient } from 'mongodb'
import collections from '~/constants/collections'
import { envConfig } from '~/constants/config'
import { IToken } from '~/models/schemas/token.schema'
import { IUser } from '~/models/schemas/user.schema'

const uri = `mongodb+srv://${envConfig.dbUsername}:${envConfig.dbPassword}@final-semester.pmo5t.mongodb.net/${envConfig.dbName}?retryWrites=true&w=majority&appName=final-semester`

class DatabaseServices {
    private client: MongoClient
    private db: Db

    constructor() {
        this.client = new MongoClient(uri)
        this.db = this.client.db(envConfig.dbName)
    }

    async connect() {
        try {
            await this.client.connect()
            await this.db.command({ ping: 1 })
            console.log('Pinged your deployment. You successfully connected to MongoDB!')
        } catch (error) {
            console.log('Error connecting to the database', error)
            throw error
        }
    }

    get users(): Collection<IUser> {
        return this.db.collection(collections.USERS)
    }

    get tokens(): Collection<IToken> {
        return this.db.collection(collections.TOKENS)
    }
}
const databaseServices = new DatabaseServices()
export default databaseServices

