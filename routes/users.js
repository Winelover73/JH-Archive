const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const checkKeyword = require('../utils/checkKeyword');
const { checkKeywordM, returnToProfile, isLoggedIn, isUser } = require('../middleware');
const Article = require('../models/article');
const catchAsync = require('../utils/catchAsync');


router.get('/register', (req, res) => { //登録フォームルーティング
    res.render('users/register');
});

router.post('/register', async (req, res, next) => {    //登録処理ルーティング
    try {
        const { email, username, password, keyword } = req.body;

        const keywordErr = checkKeyword(keyword);   //合言葉に誤りがあれば keywordErrにエラーが投げられる
        if(keywordErr) return next(keywordErr); //keywordにエラーがあったらキャッチ
        
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'JH-Achiveへようこそ！');
            res.redirect('/articles');
        })

    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
});

router.get('/login', (req, res) => {    //ログインフォームルーティング
    res.render('users/login');
});

//ログイン処理ルーティング
router.post('/login', checkKeywordM, passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'おかえりなさい！！');
    const redirectUrl = req.session.returnTo || '/articles';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
});

router.get('/logout', (req, res) => {   //ログアウト処理ルーティング
    req.logout(req.user, err => {
        if(err) return next(err);
        req.flash('success', 'ログアウトしました');
    res.redirect('/articles');
    });
});

// router.get('/profile', isLoggedIn, catchAsync(async (req, res) => {  //自分のプロフィールへのルーティング
//     req.session.returnToProfile = req.originalUrl;
    
//     const usr = req.user;
//     const articles = await Article.find({ author: usr._id });
//     res.render('users/profile', { usr, articles });
// }));

router.get('/profile/:id', isLoggedIn, catchAsync(async (req, res) => {    //プロフィールへのルーティング
    req.session.returnToProfile = req.originalUrl;
    
    const usr = await User.findById(req.params.id).populate('favoriteArticle');
    const favoriteArticles = usr.favoriteArticle;
    console.log(`取得したユーザ情報：${usr}`);
    const articles = await Article.find({author: req.params.id});
    res.render('users/profile', { usr, articles, favoriteArticles });
}));

router.get('/updateIntroduction/:id', isLoggedIn, catchAsync(async (req, res) => { //自己紹介文編集ページへのルーティング
    const user = await User.findById(req.params.id);
    if(!user){   //存在しないuserにアクセスしたらフラッシュが飛ぶようにする
        req.flash('error', '記事が見つかりませんでした');
        return res.redirect(`/profile/${req.params.id}`);
    }
    res.render('users/updateIntroduction', { user });
}));

router.post('/updateIntroduction/:id', isLoggedIn, isUser, catchAsync(async (req, res) => { //自己紹介文の更新ルーティング
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { ...req.body.user});
    req.flash('success', '自己紹介文を更新しました！');
    res.redirect(`/profile/${user._id}`);
}));

router.get('/favoriteArticle/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params; // お気に入りに追加したい記事のID
    const userId = req.user._id; // ログインユーザーのID
  
    try {
      // $addToSetを使用してお気に入り記事を追加
      const updatedUser = await User.findByIdAndUpdate(userId, { $addToSet: { favoriteArticle: id } }, { new: true });
  
      if (!updatedUser) {
        console.error('User not found.');
        req.flash('error', 'ユーザーが見つかりませんでした。');
        return res.redirect(`/articles/${id}`);
      }
  
      req.flash('success', '記事をお気に入り登録しました！');
      res.redirect(`/articles/${id}`);
    } catch (error) {
      console.error(error);
      req.flash('error', 'お気に入り登録中にエラーが発生しました。');
      res.redirect(`/articles/${id}`);
    }
  }));

module.exports = router;