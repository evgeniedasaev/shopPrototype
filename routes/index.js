var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');

var csrfProtection = csrf();
router.use(csrfProtection);

var Product = require('../models/product');

/* GET home page. */
router.get('/', function(req, res, next) {
  Product.find(function(err, list) {
    var chunks = [];
    var chunkSize = 3;

    for (var i = 0; i < list.length; i+=chunkSize) {
      chunks.push(list.slice(i, i + chunkSize));
    } 

    res.render('index', { product_chunks: chunks });
  }); 
});

module.exports = router;
