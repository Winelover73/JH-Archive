const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const Article = require('../models/article');
const { isLoggedIn, isAuthor, validateArticle, prUrlReset, favoriteArticleNow } = require('../middleware');

router.get('/', isLoggedIn, prUrlReset, catchAsync(async (req, res) => {  //一覧ページへのルーティング
    const articles = await Article.find({}).populate('author');
    res.render('articles/index', { articles });
}));

router.get('/new', isLoggedIn, (req, res) => {  //新規投稿フォームへのルーティング
    const profileRedirectUrl = req.session.returnToProfile;  //プロフィール画面からアクセスした際にパスをセッションに保持している

    res.render('articles/new', { profileRedirectUrl });
});

router.get('/:id', isLoggedIn, favoriteArticleNow, catchAsync(async (req, res) => {  //詳細ページへのルーティング
    const article = await Article.findById(req.params.id).populate('author');
    if(!article){   //存在しない記事にアクセスしたらフラッシュが飛ぶようにする
        req.flash('error', '記事が見つかりませんでした');
        return res.redirect('/articles');
    }

    //ユーザのお気に入り記事と現在参照している記事を比較（お気に入り登録ボタンの表示用）
    const checkFav = req.userFavorites.some(favArticle => favArticle._id.equals(article._id));

    const profileRedirectUrl = req.session.returnToProfile;  //プロフィール画面からアクセスした際にパスをセッションに保持している
    //delete req.session.returnToProfile;

    res.render('articles/show', { article, profileRedirectUrl, checkFav });
}));

router.post('/', isLoggedIn, validateArticle, catchAsync(async (req, res) => { //新規投稿を保存するためのルーティング
    //if(!req.body.article) throw new ExpressError('不正な記事のデータです', 400);
    const article = new Article(req.body.article);
    article.author = req.user._id;
    await article.save();
    req.flash('success', '新しい記事を投稿しました！')

    //プロフィール画面からアクセスした際にパスをセッションに保持している
    console.log(`req.session.returnToProfile(新規投稿時) : ${req.session.returnToProfile}`);
    let profileRedirectUrl = `/articles/${article._id}`;
    if(req.session.returnToProfile){
        profileRedirectUrl = req.session.returnToProfile;
        delete req.session.returnToProfile;
    }
    
    res.redirect(profileRedirectUrl);
}));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(async (req, res) => { //更新フォームへのルーティング
    const { id } = req.params;
    const article = await Article.findById(req.params.id);
    if(!article){   //存在しない記事にアクセスしたらフラッシュが飛ぶようにする
        req.flash('error', '記事が見つかりませんでした');
        return res.redirect('/articles');
    }

    const profileRedirectUrl = req.session.returnToProfile;  //プロフィール画面からアクセスした際にパスをセッションに保持している
    //delete req.session.returnToProfile;

    res.render('articles/edit', { article, profileRedirectUrl });
}));

router.put('/:id', isLoggedIn, isAuthor, validateArticle, catchAsync(async (req, res) => {  //更新処理のルーティング
    const { id } = req.params;
    const article = await Article.findByIdAndUpdate(id, { ...req.body.article});
    req.flash('success', '記事を更新しました！');
    res.redirect(`/articles/${article._id}`);
}));

router.delete('/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {   //削除処理のルーティング
    const { id } = req.params;
    await Article.findByIdAndDelete(id);
    req.flash('success', '記事を削除しました！')

    //プロフィール画面からアクセスした際にパスをセッションに保持している
    console.log(`req.session.returnToProfile（delete時） : ${req.session.returnToProfile}`);
    let profileRedirectUrl = '/articles'
    if(req.session.returnToProfile){
        profileRedirectUrl = req.session.returnToProfile;
        delete req.session.returnToProfile;
    }
    
    res.redirect(profileRedirectUrl);
}));

module.exports = router;