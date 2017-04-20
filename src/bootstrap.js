/* flow */

import recursive from 'recursive-readdir';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { makeExecutableSchema } from 'graphql-tools';

function getTypes () {
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

function getQueries () {
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

function getTypeDefs () {
  return new Promise((resolve, reject) => {
    Promise.all([getTypes(), getQueries()]).then((data) => {
      return resolve([data.join('\n')]);
    })
    .catch(err => reject(err));
  });
}

function getQueryResolvers () {
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

export function getSchema () {
  return new Promise((resolve, reject) => {
    return Promise.all([getTypeDefs(), getQueryResolvers()]).then((value) => {
      return resolve(makeExecutableSchema({
        typeDefs: value[0], 
        resolvers: {
          Query: value[1]
        },
      }))
    })
  });
}
