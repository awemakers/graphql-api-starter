/* flow */

import recursive from 'recursive-readdir';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { makeExecutableSchema } from 'graphql-tools';

/**
 * Loader
 */
import { Spinner } from 'cli-spinner';
const spinner = new Spinner('Server is starting.. %s');
spinner.setSpinnerString('|/-\\');
spinner.start();

/**
 * Get Type of components graphql
 */
function getTypes(): Promise<String> {
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

/**
 * Get Queries graphql of components
 */
function getQueries(): Promise<String> {
  return new Promise((resolve, reject) => {
    recursive('./src/components', ['!query.graphql'], (err, files) => {
      if (err) return reject(err);

      let queries:String = '';
      files.forEach((file) => {
        queries += fs.readFileSync(file, 'utf8');
      });
      return resolve(`
        type Query {${queries}}
      `);
    });
  });
}

/**
 * Get Mutation of graphql components
 */
function getMutations(): Promise<String> {
  return new Promise((resolve, reject) => {
    recursive('./src/components', ['!mutation.graphql'], (err, files) => {
      if (err) return reject(err);

      let mutations:String = '';
      files.forEach((file) => {
        mutations += fs.readFileSync(file, 'utf8');
      });
      return resolve(`
        type Mutation {${mutations}}
      `);
    });
  });
}

/**
 * Return an array of type definition (mutation, query)
 */
function getTypeDefs(): Promise<Array> {
  return new Promise((resolve, reject) => {
    Promise.all([getTypes(), getQueries(), getMutations()]).then(data => resolve([data.join('\n')]))
    .catch(err => reject(err));
  });
}

/**
 * Get Resolvers for each query
 */
function getQueryResolvers(): Promise<Object> {
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

/**
 * Get mutation for each mutaton
 */
function getMutationResolvers(): Promise<Object> {
  return new Promise((resolve, reject) => {
    const mutations = {};

    recursive('./src/components', ['!mutation_resolvers.js'], (err, files) => {
      if (err) return reject(err);

      files.forEach((file) => {
        const r = require(path.join(__dirname, '../', file));
        if (typeof r.default !== 'undefined' && typeof r.default !== 'undefined') _.extend(mutations, r.default);
      });

      return resolve(mutations);
    });
  });
}

/**
 * Retun makeExecutableSchema for Apollo server with
 * Query and Mutation
 */
export default function getSchema(): Promise<Object> {
  return new Promise((resolve, reject) => {
    Promise
      .all([getTypeDefs(), getQueryResolvers(), getMutationResolvers()])
      .then((value) => {
        spinner.stop(true);
        const schema = makeExecutableSchema({
          typeDefs: value[0],
          resolvers: {
            Query: value[1],
            Mutation: value[2],
          },
        });

        return resolve(schema);
      })
      .catch(err => reject(err));
  });
}
