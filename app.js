if(process.env.NODE_ENV !== 'production' ) {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');


const userRoutes = require('./routes/users');
const articleRoutes = require('./routes/articles');
const aboutusRoutes = require('./routes/aboutus');


const mongoSanitize = require('express-mongo-sanitize');

const MongoStore = require('connect-mongo');

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1/jh-archive'; 

mongoose.connect(dbUrl,  //process.env.DB_URL
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('MongoDBコネクションOK');
    })
    .catch(err => {
        console.log('MongoDBコネクションエラー');
        console.log(err);
    });


const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');	//ejs読み込めるようにする
app.set('views', path.join(__dirname, 'views'));	//どこのディレクトリから実行してもok

app.use(express.json());
app.use(express.urlencoded({extended: true}));  //expressに対してフォームのリクエストをパースするよう知らせる
app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

const secret = process.env.SECRET || 'mysecret';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret
    },
    touchAfter: 24 * 3600
  });

  store.on('error', e => {
    console.log('セッションストアエラー', e);
  });

const sessionConfig = { //セッション定義
    store,
    secret: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        //secure: true,
        maxAge: 1000 * 60 * 60 * 6
    }

};
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

 
app.use(flash());
app.use(helmet());



const scriptSrcUrls = [
    'https://api.mapbox.com',
    'https://cdn.jsdelivr.net'
];
const styleSrcUrls = [
    'https://api.mapbox.com',
    'https://cdn.jsdelivr.net'
];
const connectSrcUrls = [
    'https://api.mapbox.com',
    'https://*.tiles.mapbox.com',
    'https://events.mapbox.com'
];
const fontSrcUrls = [];
const imgSrcUrls = [
    `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`,
    'https://images.unsplash.com'
];

app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: [],
        connectSrc: ["'self'", ...connectSrcUrls],
        scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
        styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
        workerSrc: ["'self'", "blob:"],
        childSrc: ["blob:"],
        objectSrc: [],
        imgSrc: ["'self'", 'blob:', 'data:', ...imgSrcUrls],
        fontSrc: ["'self'", ...fontSrcUrls]
    }
}));

app.use((req, res, next) => {   //res.localsを使うことで、一回のリクエストで使える変数を一時的に保存できる。テンプレートから自動的に使えるようになる。
    console.log(req.session);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.get('/', (req, res) => {	//homeディレクトリへのルーティング
    res.render('home');
});

app.use('/', aboutusRoutes);
app.use('/', userRoutes);
app.use('/articles', articleRoutes);

app.all('*', (req, res, next) => {  //全てにExpressErrorを通す
    next(new ExpressError('ページが見つかりませんでした', 404));
});

app.use((err, req, res, next) => {  //カスタムエラーハンドラー
    const {statusCode=500} = err;
    if(!err.message){
        err.message = '問題が起きました';
    }
    res.status(statusCode).render('error', { err });
});

const port = process.env.PORT || 3000

app.listen(port, () => {
	console.log(`ポート${port}でリクエスト待受中！`);
});
