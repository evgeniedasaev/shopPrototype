var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
var Schema = mongoose.Schema;

var schema = new Schema({
    _export_id: {type: Number, index: true},
    name: {type: String, required: true},
    code: {type: String, required: true},
    unit: {type: String, required: false}
});
schema.plugin(findOrCreate);

module.exports = mongoose.model('Property', schema);