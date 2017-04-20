import Article from './model';

export default {
  createArticle(root, args) {
    return new Promise((resolve, reject) => {
      Article
        .create(args)
        .then(article => resolve(article))
        .catch(err => reject(err));
    });
  },
};
