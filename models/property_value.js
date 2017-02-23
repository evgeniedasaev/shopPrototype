var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
var Schema = mongoose.Schema;

var schema = new Schema({
    _export_id: {type: Number, index: true},
    property: {type: Schema.Types.ObjectId, ref: 'Property'},
    name: {type: String, required: true},
    code: {type: String, required: true}
});
schema.plugin(findOrCreate);

module.exports = mongoose.model('PropertyValue', schema);