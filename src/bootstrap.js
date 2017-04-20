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
      `);
    });
  });
}

function getMutations() {
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

function getTypeDefs() {
  return new Promise((resolve, reject) => {
    Promise.all([getTypes(), getQueries(), getMutations()]).then(data => resolve([data.join('\n')]))
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

function getMutationResolvers() {
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

export default function getSchema() {
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
