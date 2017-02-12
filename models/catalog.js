var mongoose = require('mongoose');
var materializedPlugin = require('mongoose-materialized');
var Schema = mongoose.Schema;

var catalogSchema = new Schema({
    _export_id: {type: Number, defult: 0},
    childs: [{type: Schema.Types.ObjectId, ref: 'Catalog'},],
    name: {type: String, required: true},
    code: {type: String, required: true},
    full_path: {type: String}
});
catalogSchema.plugin(materializedPlugin);

catalogSchema.pre('save', function (next) {
    if (!this.full_path) {
        this.full_path = '/catalog/' + this.code + '/';
        // console.log(this.full_path);
    }

    next();
});

catalogSchema.post('save', function (catalog) {
    catalog.getParent(function(error, parent) {
        if (parent) {
            catalog.full_path = parent.full_path + catalog.code + '/';
            // console.log('by parent ', catalog.full_path);
            if (catalog.modified) {
                catalog.save();
            }        
        }
    });
    
    catalog.getChildren(function(err, childs){
        if (childs) {                
            childs.forEach(function(child) {
                child.full_path = catalog.full_path + child.code + '/';
                // console.log('by childs ', child.full_path);
                child.childs = childs;
                if (child.modified) {
                    child.save();
                }
            });
        }
    }); 
});

var Catalog = mongoose.model('Catalog', catalogSchema);

module.exports = Catalog;