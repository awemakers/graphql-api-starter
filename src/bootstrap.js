/* flow */

import recursive from 'recursive-readdir';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { makeExecutableSchema } from 'graphql-tools';

import { Spinner } from 'cli-spinner';

const spinner = new Spinner('Server is starting.. %s');
spinner.setSpinnerString('|/-\\');
spinner.start();

function getTypes() {
  return new Promise((resolve, reject) => {
    recursive('./src/components', ['!types.graphql'], (err, files) => {
      if (err) return reject(err);

      let types:String = '';
      files.forEach((file) => {
        types += fs.readFileSync(file, 'utf8');
      });
      return resolve(types);
    });
  });
}

function getQueries() {
  return new Promise((resolve, reject) => {
    recursive('./src/components', ['!query.graphql'], (err, files) => {
      if (err) return reject(err);

      let queries:String = '';
      files.forEach((file) => {
        queries += fs.readFileSync(file, 'utf8');
      });
      return resolve(`
        type Query {${queries}}

        schema {
          query: Query
        }
      `);
    });
  });
}

function getTypeDefs() {
  return new Promise((resolve, reject) => {
    Promise.all([getTypes(), getQueries()]).then(data => resolve([data.join('\n')]))
    .catch(err => reject(err));
  });
}

function getQueryResolvers() {
  return new Promise((resolve, reject) => {
    const resolvers = {};

    recursive('./src/components', ['!query_resolvers.js'], (err, files) => {
      if (err) return reject(err);

      files.forEach((file) => {
        const r = require(path.join(__dirname, '../', file));
        if (typeof r.default !== 'undefined' && typeof r.default !== 'undefined') _.extend(resolvers, r.default);
      });

      return resolve(resolvers);
    });
  });
}

export default function getSchema() {
  return new Promise((resolve, reject) => {
    Promise
      .all([getTypeDefs(), getQueryResolvers()])
      .then((value) => {
        spinner.stop(true);
        const schema = makeExecutableSchema({
          typeDefs: value[0],
          resolvers: {
            Query: value[1],
          },
        });

        return resolve(schema);
      })
      .catch(err => reject(err));
  });
}
