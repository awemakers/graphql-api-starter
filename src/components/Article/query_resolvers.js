import Article from './model';

export default {
  articles() {
    return Article.find().lean();
  },
};
