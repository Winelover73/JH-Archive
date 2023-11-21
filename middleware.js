const ExpressError = require('./utils/ExpressError');
const { articleSchema } = require('./schemas');
const Article = require('./models/article');
const User = require('./models/user');

const checkKeyword = require('./utils/checkKeyword');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        //req.session.returnTo = req.originalUrl;
        req.flash('error', 'ログインしてください');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateArticle = (req, res, next) => {
    const { error } = articleSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(detail => detail.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

module.exports.isAuthor = async (req, res, next) => {   //記事に関するアクション権限
    const { id } = req.params;
    const article = await Article.findById(id);
    if (!article.author.equals(req.user._id)) {
        req.flash('error', 'そのアクションの権限がありません');
        return res.redirect(`/articles/${id}`);
    }
    next();
}

module.exports.isUser = async (req, res, next) => {   //ユーザに関するアクション権限
    const { id } = req.params;
    const userProfile = await User.findById(id);
    if (!userProfile.equals(req.user._id)) {
        req.flash('error', 'そのアクションの権限がありません');
        return res.redirect(`/profile/${id}`);
    }
    next();
}

module.exports.checkKeywordM = (req, res, next) => { //合言葉を照合するミドルウェア
    try{
        const keyword = req.body.keyword;
        const keywordErr = checkKeyword(keyword);   //合言葉に誤りがあれば keywordErrにエラーが投げられる
        if(keywordErr){
            return next(keywordErr); //keywordにエラーがあったらキャッチ
        } else {
            next();
        }
    } catch(e) {
        req.flash('error', e.message);
        res.redirect('/login');
    }  
}

module.exports.prUrlReset = (req, res, next) => {
    delete req.session.returnToProfile; //returnToProfileのセッションの削除
    next();
}

module.exports.favoriteArticleNow = async(req, res, next) => {   
    if (req.isAuthenticated()) {
        try {
          // ログイン中のユーザーのID
          const userId = req.user._id;
    
          // ユーザーをデータベースから取得
          const user = await User.findById(userId);
    
          // ユーザーが見つかった場合、お気に入り記事情報をreqオブジェクトに追加
          if (user) {
            req.userFavorites = user.favoriteArticle;
          }
        } catch (error) {
          console.error('Error populating user favorites:', error);
        }
      }
    
      next();

}