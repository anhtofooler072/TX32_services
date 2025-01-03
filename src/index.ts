import express, { Application } from "express";
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import cors from 'cors'
import rootRouterV1 from "~/routes";
import { envConfig } from "~/constants/config";
import databaseServices from "./services/database.service";

// Khởi tạo socket service
const app: Application = express();

// init middleware
app.use(helmet())
app.use(compression())
app.use(morgan('dev'))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

databaseServices.connect()

// init route
app.use('/api/v1', rootRouterV1)


app.listen(envConfig.port, () => {
  console.log("Welcome to Express & TypeScript Server");
  console.log(`Server is Fire at http://localhost:${envConfig.port}`);
});
