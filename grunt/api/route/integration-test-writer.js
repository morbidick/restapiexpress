/**
 * Created by Samuel Schmid on 11.05.14.
 *
 * Class for writing integrations tests for resource and all supported VERBs
 *
 * @type {IntegrationTestWriter}
 */
module.exports = IntegrationTestWriter;

/**
 *
 * @param grunt
 * @param rootdir
 * @param testApiRouteWriter
 * @constructor
 */
function IntegrationTestWriter(grunt, rootdir, testApiRouteWriter) {
    this.grunt = grunt;
    this.rootdir = rootdir;
    this.testApiRouteWriter = testApiRouteWriter;
    this.permission = {

    }
}

/**
 * write a integrationtest for given apidoc
 *
 * @param doc
 * @param docs
 */
IntegrationTestWriter.prototype.write = function (doc, docs) {
    this.docs = docs;



    var allSupportedMethods = doc.apidescription.supportedMethods;
    var that = this;

    var grunt = this.grunt;
    var test = grunt.file.read('./grunt/templates/test.template');

    Object.keys(allSupportedMethods).forEach(function(verb) {
        var method = allSupportedMethods[verb];

        if(verb == "POST") {
            var collectionMethod = method.collection;
            var entityMethod = method.entity;

            that.grunt.log.writeln(verb + " c " + JSON.stringify(collectionMethod));
            that.grunt.log.writeln(verb + " e " +  JSON.stringify(entityMethod));

            //that.grunt.log.writeln("JSON of doc:" +  JSON.stringify(doc.json.model, null, 2));

            var fullModel = doc.readModel();

            //Create mandatory references
            Object.keys(fullModel).forEach(function(model) {

                if(fullModel[model].mandatory === false) return;

                if(fullModel[model].reference) {
                    that.grunt.log.writeln("create mandatory reference");
                    var type = doc.json.model[model].type.split("/")[1];
                    that.grunt.log.writeln("type:" +  type);

                    if(type.endsWith("[]")) {
                        type = type.replace("[]","");
                        var ids =  doc.json.model[model].test;
                        ids.forEach(function(id) {
                            that.grunt.log.writeln("id: " + id)
                            test = that.getCreateEntityContent(id,type,test, "create mandatory reference");
                        });
                    } else {
                        var id = doc.json.model[model].test;
                        test = that.getCreateEntityContent(id,type, test, "create mandatory reference");
                    }
                }
            });

            //Create self
            test = that.getCreateEntityContent(doc.json._testId, doc.json.type.split("/")[1], test, "integration test create self")

            //Read self
            test = that.getReadEntityContent(doc.json._testId, doc.json.type.split("/")[1], test, false, undefined, "Integrationtest first get");

            //Read reference
            Object.keys(fullModel).forEach(function(model) {

                if(fullModel[model].mandatory === false) return;

                if(fullModel[model].reference) {
                    that.grunt.log.writeln("read mandatory reference");
                    var type = doc.json.model[model].type.split("/")[1];
                    that.grunt.log.writeln("type:" +  type);

                    if(type.endsWith("[]")) {
                        type = type.replace("[]","");
                        var ids =  doc.json.model[model].test;
                        ids.forEach(function(id) {
                            that.grunt.log.writeln("id: " + id)
                            test = that.getReadEntityContent(id,type,test, true,undefined,"Read Reference");
                        });
                    } else {
                        var id = doc.json.model[model].test;
                        test = that.getReadEntityContent(id,type, test, true, undefined, "Read Reference");
                    }
                }
            });

            //Delete self
            test = that.getDeleteEntityContent(doc.json._testId, doc.json.type.split("/")[1], test)

            //Read self and Check If deleted
            test = that.getReadEntityContent(doc.json._testId, doc.json.type.split("/")[1], test, false, undefined, "Integrationtest check if deleted, expect deleted", true);

            //Check if referenceRule applied
            Object.keys(fullModel).forEach(function(model) {
                if(fullModel[model].mandatory === false) return;
                if(fullModel[model].reference) {
                    that.grunt.log.writeln("rule:" +  fullModel[model].referenceRule);
                    if(fullModel[model].referenceRule === "nullify") {

                        var type = doc.json.model[model].type.split("/")[1];
                        that.grunt.log.writeln("type:" +  type);

                        if(type.endsWith("[]")) {
                            type = type.replace("[]","");
                            var ids =  doc.json.model[model].test;
                            ids.forEach(function(id) {
                                that.grunt.log.writeln("id: " + id)
                                test = that.getReadEntityContent(id,type,test, true, {"reference" : fullModel[model].reference, "value" : doc.json._testId}, "GET after refernce rule applied");
                            });
                        } else {
                            var id = doc.json.model[model].test;
                            test = that.getReadEntityContent(id,type, test, true, {"reference" : fullModel[model].reference, "value" : doc.json._testId},"GET after refernce rule applied");
                        }
                    }

                }
            });

            //Delete created Reference
            Object.keys(fullModel).forEach(function(model) {

                if(fullModel[model].mandatory === false) return;

                if(fullModel[model].reference) {
                    that.grunt.log.writeln("read mandatory reference");
                    var type = doc.json.model[model].type.split("/")[1];
                    that.grunt.log.writeln("type:" +  type);

                    if(type.endsWith("[]")) {
                        type = type.replace("[]","");
                        var ids =  doc.json.model[model].test;
                        ids.forEach(function(id) {
                            that.grunt.log.writeln("id: " + id)
                            test = that.getDeleteEntityContent(id,type,test);
                        });
                    } else {
                        var id = doc.json.model[model].test;
                        test = that.getDeleteEntityContent(id,type, test);
                    }
                }
            });
         }
    });

    //TODO
    //put referenced entities if needed
    //put entity - xy
    //get entity
    //delete entity
    grunt.file.write(doc.testfolder + '/integrationTest.js', test);
}

IntegrationTestWriter.prototype.getCreateEntityContent = function(id, type, test, comment) {
    if(!this.docs) {
        this.grunt.log.writeln("Docs not set");
        return;
    }
    var doc = this.docs.docMap[type];
    //this.grunt.log.writeln("doc of " + type + " " + JSON.stringify(doc.readModel(), null, 2));
    return this.testApiRouteWriter.testPutResourceWriter.getInstanceTestContent(test,doc,"test",'../../../app.js', comment);

}

IntegrationTestWriter.prototype.getDeleteEntityContent = function(id, type, test, comment) {
    if(!this.docs) {
        this.grunt.log.writeln("Docs not set");
        return;
    }
    var doc = this.docs.docMap[type];
    return this.testApiRouteWriter.testDeleteResourceWriter.getInstanceTestContent(test,doc,"test",'../../../app.js', true, comment);

}

IntegrationTestWriter.prototype.getReadEntityContent = function(id, type, test, allData, removeFromJson, comment, expectDeleted) {
    if(!this.docs) {
        this.grunt.log.writeln("Docs not set");
        return;
    }
    var doc = this.docs.docMap[type];
    return this.testApiRouteWriter.testGetResourceWriter.getInstanceTestContent(test,doc,"test",'../../../app.js', allData, removeFromJson, comment, expectDeleted);

}
