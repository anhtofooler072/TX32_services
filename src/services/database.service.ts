"use strict"

import { Collection, Db, MongoClient } from 'mongodb'
import { envConfig } from '~/constants/config'

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

    // get users(): Collection<UserDocument> {
    //     return this.db.collection(collection.USER)
    // }

}
const databaseServices = new DatabaseServices()
export default databaseServices

