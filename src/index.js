/**
 * Starter kit
 * @flow
 */

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import 'dotenv/config';
import 'database/mongo';

import getSchema from './bootstrap';

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(bodyParser.json());

getSchema().then((schema) => {
  app.use('/graphql', graphqlExpress({ schema }));
  app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}).catch(err => console.log(err));
