const express = require('express');
const router = express.Router();
const { isLoggedIn, isAuthor, validateArticle } = require('../middleware');

router.get('/aboutus', isLoggedIn,   (req, res) => {	//aboutusへのルーティング
    res.render('aboutus/aboutus');
});

module.exports = router;