/* flow */

import Mongoose from 'mongoose';

Mongoose.promise = global.Promise;

Mongoose.connect(process.env.MONGO_URI);

const dbConnect = Mongoose.connection;

dbConnect.on('error', (err) => {
  if (err) console.error(err.message);
});
