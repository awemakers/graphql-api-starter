/* flow */

import Mongoose from 'mongoose';

const ArticleSchema = new Mongoose.Schema(
  {
    title: String,
    slug: String,
    description: String,
  },
  {
    timestamps: true,
  },
);

const Article = Mongoose.model('Article', ArticleSchema);

export default Article;
