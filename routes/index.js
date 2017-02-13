var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');

var csrfProtection = csrf();
router.use(csrfProtection);

var Catalog = require('../models/catalog');
var Product = require('../models/product');

/* GET home page. */
router.get('/', function(req, res, next) {
  var successMsg = req.flash('success')[0];

  Product.find().limit(25).exec(function(err, list) {
    var chunks = [];
    var chunkSize = 3;

    for (var i = 0; i < list.length; i+=chunkSize) {
      chunks.push(list.slice(i, i + chunkSize));
    } 

    Catalog.find().populate({
      path: 'childs',
      populate: {
        path: 'childs',
        populate: {
          path: 'childs'
        }
      }
    }).exec(function (err, catalogs) {
      var roots = catalogs.filter(function(catalog) {
        return catalog.parentId === null;
      });

      res.render('index', {
        catalog_active: {name: "Каталог", code: null, childs: []},
        withProducts: true,
        product_chunks: chunks, 
        noMessage: !successMsg, 
        successMsg: successMsg, 
        roots: roots
      });
    });
  }); 
});

router.get(/^\/catalog\/.*?$/, function(req, res, next) {
  var successMsg = req.flash('success')[0];
  var locals = {
    noMessage: !successMsg, 
    successMsg: successMsg
  };

  // ищем раздел каталога
  Catalog.findOne({full_path: req.originalUrl}).populate('childs').exec()
  
  // подбираем товары для данного раздела  
  .then(function(catalog) {
    console.log(catalog);
    if (catalog) {
      // передаем информацию о текущем разделе каталога
      locals.catalog_active = catalog;

      return Product.find({catalog: catalog._id}).limit(25).exec();
    } else {
      throw new Error('Раздел каталога не существует');
    }
  })

  // организуем вывод товаров по три в ряд
  .then(function(list) {
        console.log(list);
        var chunks = [];
        var chunkSize = 3;

        if (list) {
          for (var i = 0; i < list.length; i+=chunkSize) {
            chunks.push(list.slice(i, i + chunkSize));
          }
        }

        locals.product_chunks = chunks;
        locals.withProducts = list.length;
  })

  // формируем навигацию по каталогу
  .then(function() {
    console.log('navigation')
    return Catalog.find().populate({
      path: 'childs',
      populate: {
        path: 'childs',
        populate: {
          path: 'childs'
        }
      }
    }).exec();
  })

  // получаем корневые разделы
  .then(function (catalogs) {
    console.log(catalogs);
    locals.roots = catalogs.filter(function(catalog) {
      return catalog.parentId === null;
    })
  })

  // отрисовываем шаблон
  .then(function() {
    console.log(locals);
    return res.render('index', locals);
  })

  // обрабатываем ошибки
  .catch(function(err){
    console.log('error:', err);
  });  
});

module.exports = router;
