const mongoose = require('mongoose');
const articleSeed = require('./articleSeed');
const Article = require('../models/article');

mongoose.connect('mongodb://127.0.0.1/jh-archive',  { useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log('MongoDBコネクションOK');
    })
    .catch(err => {
        console.log('MongoDBコネクションエラー');
        console.log(err);
    });

const seedDB = async() => {
    await Article.deleteMany({});
    for (let i=0; i<articleSeed.length; i++){
        console.log(i);
        const article = new Article({
            author: '6532205b20c13400236753bc',
            title: articleSeed[i].title,
            text: articleSeed[i].text
        });
  
        await article.save();
    }
    
}

seedDB().then(() => {
	mongoose.connection.close();
});

