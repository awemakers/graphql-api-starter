/**
 * Starter kit
 * @flow
 */

import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';

import getSchema from './bootstrap';

const PORT = 3000;

const app = express();

getSchema().then((schema) => {
  app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
  app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));
  app.listen(PORT);
  console.log(`Server listening on ${PORT}`);
}).catch(err => console.log(err));
