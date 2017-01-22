var mongoose = require('mongoose');

mongoose.connect('localhost:27017/shopping');

var Product = require('../models/product');
var done = 0;
var loopLength = 20;
for (var i = 1; i<loopLength; i++) {
    var product = new Product({
        imagePath: 'http://loremflickr.com/500/500?random=' + i,
        title: 'Товар ' + i,
        description: 'Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.',
        price: Math.floor(Math.random() * (2000 - 10 + 1)) + 10
    });

    product.save(function(err, result) {
        done++;
        if (done === loopLength) {
            exit();
        }
    });
}

function exit() {
    mongoose.disconnect();
}
