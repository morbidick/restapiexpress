/**
 * Created by Samuel Schmid on 10.03.14.
 *
 * handles requested resource
 *
 * adds information from request:
 *
 * - role: role from signed in user
 * - type: type of resource (instance|collection)
 * - version: version number
 * - pathResource: Array of path elements
 * - ids: Array of requested Ids
 * - path: relative path of requested instance (eg. news/)
 * - restlet: path to requested restlet (news/get/public/instance.js)
 * - documentation: path to doc file
 * - documentationJson: json of doc file content
 * - method: requested VERB (GET|POST|etc)
 * - expands: Array of {Expands}
 * - scope: Array of {Scope}
 * - fileds: Array of database fields
 * - page: page number
 * - limit: limit
 * - sort: sort by
 * - q: search string
 * - isCollection: Boolean True if isCollection
 *
 * @type {Resource}
 */
module.exports = Resource;

var Expand = require('./expand');
var Scope = require('./scope');

/**
 * @constructor
 */
function Resource() {
    this.role = undefined;
	this.type = undefined;
	this.version = undefined;
	this.pathResources = [];
	this.ids = [];
	this.path = undefined;
	this.restlet = undefined;
    this.documentationPath = undefined;
    this.documentationJson = undefined;
	this.method = undefined;
	this.expands = [];
	this.scope = [];
	this.fields = [];
	this.page = undefined;
	this.limit = undefined;
    this.sort = undefined;
    this.q = undefined;
	this.isCollection = undefined;

}

/**
 * get the version of the resource
 *
 * @returns String
 */
Resource.prototype.getVersion = function() {
    return this.version;
}

/**
 * get the path to the js file of the restlet
 *
 * @returns String
 */
Resource.prototype.getRestletPath = function() {
    return this.restlet;
}

/**
 * get the path to the documentation file of the restlet
 *
 * @returns String
 */
Resource.prototype.getDocumentationPath = function() {
    return this.documentationPath;
}

/**
 * get the JSON of the documentation file of the restlet
 *
 * @returns String
 */
Resource.prototype.getDocumentation = function() {
    return this.documentationJson;
}
/**
 * get the relative path to requested resource
 *
 * http://localhost:3000/v1/news/123 returns news/
 * @returns String
 */
Resource.prototype.getRelativePath = function() {
    return this.path;
}


Resource.prototype.initWithRequest = function(req) {

    this.role = req.role;
    this.method = req.method;
    this.resolvePathWithReq(req);
    this.resolveRestlet();
    this.resolveDocumentation();
    this.resolveQueryString(req);
    //console.log("load Resource... ");

}

Resource.prototype.initWithPath = function(path) {

    //console.log("load Resource " + path);

    this.resolvePathWithPath(path);
    this.resolveDocumentation();
    console.log(JSON.stringify(this));

}

Resource.prototype.resolvePathWithReq = function(req) {
	
	var tmpPath = [];
	var that = this;
    req.originalUrl.match(/(\/(\w+))/g).map(function (e) {
        tmpPath.push(e.substring(1));
    })
    this.version = tmpPath[0];
    tmpPath.splice(0, 1);
    tmpPath.map(function (e, index) {
        (index % 2 == 0) ? that.pathResources.push(e) : that.ids.push(e);
        (index % 2 == 0) ? that.isCollection = true : that.isCollection = false;
    });

    (tmpPath.length % 2 == 0) ? this.type = 'instance' : this.type = 'collection';
    this.path =  this.pathResources.join('/') + '/';
}

Resource.prototype.resolvePathWithPath = function(path) {


    var that = this;
    var tmpPath = path.split("/");
    this.version = tmpPath[0];
    tmpPath.splice(0, 1);
    tmpPath.map(function (e, index) {
        (index % 2 == 0) ? that.pathResources.push(e) : that.ids.push(e);

    });
    (tmpPath.length % 2 == 0) ? that.isCollection = true : that.isCollection = false;
    (tmpPath.length % 2 == 0) ? this.type = 'instance' : this.type = 'collection';
    this.path =  this.pathResources.join('/') + '/';
}

Resource.prototype.resolveRestlet = function() {

    this.restlet = this.version + '/' + this.pathResources.join('/') + '/' + this.method.toLowerCase() + '/' + this.role + '/' + this.type + '.js';
    //console.log("restlet:"+this.restlet);


}

Resource.prototype.resolveDocumentation = function() {

    this.documentationPath = this.version + '/' + this.pathResources.join('/')+'/'+this.pathResources.join('/')+'.json';
    //console.log("doc:" + this.documentation);

}

Resource.prototype.resolveQueryString = function(req) {
	
	this.resolveExpands(req);
	this.resolveScope(req);
	this.fields = req.query.fields;
	this.page = req.query.page;
	this.limit = req.query.limit;
	this.sort = req.query.sort;
    this.q = req.query.q;
}
Resource.prototype.resolveExpands = function(req) {
	if(req.query.expands) {
		this.expands = [];
        var that = this;
        req.query.expands.match(/(\w.+?\))/g).map(function(e){
            that.expands.push(new Expand(e));
        });
	}
}

Resource.prototype.resolveScope = function(req) {
    if(req.query.scope) {
        this.scope = [];
        var that = this;
        req.query.scope.match(/\[(.+?)\]/g).map(function(e){

            var scope = new Scope();
            scope.initWithQueryString(e);
            that.scope.push(scope);
        });
    }
}

Resource.prototype.setMethod = function(method) {
	this.method = method;
}



