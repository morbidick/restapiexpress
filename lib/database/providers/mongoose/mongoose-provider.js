/**
 * Created by samschmid on 24.03.14.
 */
var mongoose = require('mongoose');

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
function MongooseProvider(config) {
    this.config = config;
}

MongooseProvider.prototype.connect = function()  {

    var options = {
        server: { poolSize: 5 }
    };
    options.server.socketOptions = { keepAlive: 1 };
    mongoose.connect('mongodb://'+ this.config.location, options)
    console.log(this.config.name + " with mongoose provider on "+this.config.location+" connected");

    var Schemes = require("../../../../database/schemes/v1/schemes.js");
    new Schemes();

}

MongooseProvider.prototype.createEntity = function(model, data, handleError, success)  {

    var Document = mongoose.model(model);
    console.log(Document);
    console.log(data);

    Document.create(data, function(err, object) {
        if(err){
            return handleError(err)
        } else {
            success(object)
        };
    });

}

MongooseProvider.prototype.find = function(model, resource, callback)  {

    var scope = {};
    var limit = 0;
    var page = 0;
    var fields = "";
    resource.documentationJson = {};
    console.log(resource);

    if(resource.fields) {
        fields = resource.fields.replaceAll(",", " ");
    }
    if(fields === "") {
        callback(undefined,[]);
    }
    if(resource.scope.length === 0) {

    }
    if(resource.limit) {
        limit = resource.limit;
    }
    if(resource.page) {
        page = resource.page;
    }
    var Document = mongoose.model(model);
    var query = Document.find(scope).skip(page * limit).limit(limit).select(fields);
    query.exec(callback);

}
module.exports = MongooseProvider;