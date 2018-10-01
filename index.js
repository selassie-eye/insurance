const express = require('express');
const search = require('./search.js');
const bodyParser = require('body-parser');
const app = express();
const port = 3002;

app.use(bodyParser.urlencoded({extended: true}));

var searchHandler = function(req, res, next) {
    // console.log('SEARCHHANDLER ACTING....');
    // console.log('REQUEST: ');
    // console.dir(req.body);
    // console.log('RESPONSE: ');
    // console.dir(res);
    // console.log('NEXT: ');
    // console.dir(next);
    next();
}; // app.use(searchHandler);

app.get('/', (req, res) => res.send('Hello World!'));
app.get('/search', (req, res) => {
    search.printHeader('begin-search request');
    search.printSubheader('QUERY: ');
    console.dir(req.query);
    let rawQuery = req.originalUrl.split('?')[1];
    console.log('RAW QUERY: ' + rawQuery);
    search.printMiniheader('SEARCHING...');
    search.querySearch(rawQuery).then(basePage => {
        search.printMiniheader('search complete');
        search.printHeader('end-search request');
        res.json(basePage);
    });
});
app.get('/details', (req, res) => {
    search.printHeader('begin-details request');
    search.printSubheader('query: ');
    console.dir(req.query);
    if(req.query.placeid) {
        console.log('Place id: ' + req.query.placeid);
        search.printMiniheader('requesting details for ' + req.query.placeid);
        search.getDetails(req.query.placeid).then(deets => {
            search.printMiniheader('request complete!');
            search.printHeader('end-search request');
            res.json(deets)
        });
    } else {
        search.printHeader('end-search request (error)');
        res.send('ERROR: NO PLACE ID');
    }
});

app.listen(port, () => console.log(`Listening on port ${port}...`));