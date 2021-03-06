/**
 * Created by Samuel Schmid
 *
 * handles routing of RESTAPIEXPRESS for resources
 * for example http://localhost:3000/v1/news
 *
 */
var Resource = require('./../resource/resource');
var config = require('./../config.js');
var Error = require('./../error');
var Util = require('./../util');

/**
 *
 * @type {ResourceRouter}
 */
module.exports = ResourceRouter;

/**
 * @class ResourceRouter
 * @constructor
 */
function ResourceRouter(apirouter) {
    this.apirouter = apirouter;
}

/**
 * route the requested resource and send response back to the caller
 *
 * @param req
 * @param res
 */
ResourceRouter.prototype.route = function(req, res) {

    var resource = new Resource();
    var apirouter = this.apirouter;

    resource.initWithRequest(req);
    //console.log("load doc");

    var handle = {req: req, res: res, resource: resource, apirouter: apirouter};
    Util.getFileFromFileSystem(apirouter.rootdir, apirouter.DOC_FOLDER, resource.getDocumentationPath(), evaluatePermissions, handle);

}

function evaluatePermissions(error, doc, handle) {

    var res = handle.res;
    var req = handle.req;
    var resource = handle.resource;
    var apirouter = handle.apirouter;

    if(error) {
        console.log("error" + JSON.stringify(error));
        res.status(error.getCode()).send(error.getMessage());
        return;
    }
    resource.documentationJson = doc;

    // TBD:: define CORS on a per restlet basis and how do we handle Access-Control-Allow-Method ?
    //  res.header('Access-Control-Allow-Origin', config.CORSAllowOrigin);

    var _method = req.method;
    var isAllowed = false;
    //console.log("doc loaded");
    //console.log("permission: " + JSON.stringify(resource.documentationJson.permission));
    if(req.role == "test") {
        isAllowed = true;
    } else {
        if(resource.getDocumentation().permission) {
            resource.getDocumentation().permission.forEach(function(permission) {
                if(permission.role.toLowerCase() === req.role.toLowerCase()) {
                    permission.methods.forEach(function(method) {
                        if(method === _method) isAllowed = true;

                    });
                }
            });
        } else {
            res.status(302).json('{"error":"not authentificated}');
        }

    }
    if(isAllowed === false) {
        res.status(302).json('{"error":"not authentificated}');
        return;
    }
    //console.log("is allowed" + isAllowed);

    // OPTIONS
    // TODO:: send  documentation for implemented verbs as json  we will not violate RFC2616 http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html
    //
    // @ssNamics this is a express problem
    // see https://github.com/visionmedia/express/pull/772/files
    // see https://groups.google.com/forum/#!topic/express-js/0oNFpyH51_k
    // OPTIONS

    //@veith
    //note that require only reads the file once, following calls return the result from cache

    //console.log(util.inspect(resource,false,null));

    Util.getFileFromFileSystem(apirouter.rootdir, apirouter.API_FOLDER, resource.getRestletPath(), sendResponse, handle);
}

function sendResponse(error, restlet, handle) {

    var req = handle.req;
    var res = handle.res;
    var resource = handle.resource;

    if(error) {
        console.log("error" + JSON.stringify(error));
        res.status(error.getCode()).send(error.getMessage());
        return;
    }
    //console.log("Doc:");
    //console.log(util.inspect(doc,false,null));

    // TODO prove attribute constraints

    // load and execute restlet

    // TODO find implementations for documented verbs

    restlet.send(req, res, resource);

};