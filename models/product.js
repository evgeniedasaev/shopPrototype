var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
var Schema = mongoose.Schema;

var schema = new Schema({
    _export_id: {type: Number},    
    imagePath: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true}
});
schema.plugin(findOrCreate);

module.exports = mongoose.model('Product', schema);