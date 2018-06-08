/* DOC: requirejs define
 * Note that this is an anonymous define. The module name for this panel is 
 * provided in require-config.js, which associates a string key with this module file.
 * The only dependency required to implement a panel is a promises library,
 * in this case Q (cit. here).
 * It is very commong to have jquery and kb.html also included, as they
 * assist greatly in building html and manipulating the DOM, and kb.runtime
 * since it is the primary interface to the user interface runtime.
 * In addition, any widgets will need to be included here as well.
 * (Well, some usage patterns may load widgets in a different way, but this
 *  sample panel represents a moderately straightforward implementation.)
 *  
 *  Formatting: I find that listing each module name on a separate line 
 *  enhances readability.
 * 
 */
define([
    'bluebird',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    './lib/utils',
    'kb_common/jsonRpc/genericClient',
    './lib/rpc',
    'jquery',
    'marked',
    'bootstrap'
], function (
    Promise, 
    html, 
    BS,
    Utils,
    GenericClient,
    RPC,
    $,
    Marked
) {
    /* DOC: strict mode
        * We always set strict mode with the following magic javascript
        * incantation.
        */
    'use strict';

    /*
    * DOC: html helper module
    * The html helper module is quite useful for building 
    * html in a functional style. It has a generic tag function
    * builder, as well as methods to build more complex html
    * structures.
    */
    var t = html.tag,
        h2 = t('h1'),
        p = t('p'),
        div = t('div');
    
    function factory(config) {
        /* DOC: widget variables and factory pattern
            * In the factory pattery for object creation, we can just
            * declare variables within the factory function, and they 
            * are naturally available to all functions defined within.
            * 
            * In this case we need to store references to the original 
            * DOM node passed during attachment (mount), the DOM node
            * created by the Panel for its own use (container),
            * and an array of subwidgets (children).
            */
        var hostNode, container, appsLib = {},
            runtime = config.runtime,
            workspace = new GenericClient({
                module: 'Workspace',
                url: runtime.config('services.workspace.url'),
                token: runtime.service('session').getAuthToken()
            });

        var rpc = RPC.make({
            runtime: runtime
        });

        ["beta", "release", "dev"].forEach((tag) => {
            rpc.call('NarrativeMethodStore', 'list_methods', { tag: tag })
                .then((result) => {
                    var appMap = {};
                    result[0].forEach(function (app) {
                        appMap[app.id] = {
                            info: app
                        };
                    });
                    appsLib[tag] = appMap;
                });
        })

        /* DOC helper functions
            * Although not part of the Panel Interface, a common pattern is
            * to have a sert of helper functions. This assists in meeting 
            * the coding standard of short, understandable, single-purposed
            * functions.
            * A very common helper funcion is a renderer. A panel may have 
            * more then one render function, e.g. to represent different
            * states. In this case, the render function simply builds a
            * layout upon which it will attache widgets.
            * 
            */


        /* DOC: init event
        * Since a panel implements the widget interface, it starts 
        * with an init event handler. The init event gives the panel
        * a chance to set up whetever it needs, and to fail early if
        * the proper conditions are not met.
        * In this case, we really just need to initialize the sub-widgets.
        * 
        */
        function init(config) {
            return null;
        }

        /* DOC: attach event
        * This attach() function implements the attach lifecycle event
        * in the Panel Widget lifecycle interface.
        * It is invoked at  point at which the parent environment has
        * obtained a concerete DOM node at which to attach this Panel,
        * and is ready to allow the Panel to attach itself to it.
        * The Panel should not do anything with the provided node
        * other than attach its own container node. This is because 
        * in some environments, it may be that the provided node is
        * long lived. A panel should not, for example, attach DOM listeners
        * to it.
        * 
        */
        function attach(node) {
            /* DOC: creating our attachment point
            *  Here we save the provided node in the mount variable,
            *  and attach our own container node to it. This pattern
            *  allows us to attach event listeners as we wish to 
            *  our own container, so that we have more control
            *  over it. E.g. we can destroy and recreate it if we
            *  want another set of event listeners and don't want
            *  to bother with managing them all individually.
            */
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));

            /* DOC: implement widget manager attach lifecycle event
                * Okay, here we run all of the widgets through the 
                * 
                */
            return null;
        }
        function makePopup(){
            workspace.callFunc('get_objects2',
                [{ objects: [{ objid: this.dataset.narrativeNum, wsid: this.dataset.wsId }]}])
                .then((res) => {
                    var popUpContainer = document.getElementById('popup-container');
                    popUpContainer.innerHTML = "";

                    var modalDialog = document.createElement('div');
                    modalDialog.setAttribute('class', 'modal-dialog narrative-info-background');
                    popUpContainer.appendChild(modalDialog);



                    var summarySection = document.createElement('div');
                    summarySection.setAttribute('id', 'summary-section')

                    var narrativeTitle = document.createElement('h2');
                    narrativeTitle.textContent = this.dataset.narrativeName;
                    summarySection.appendChild(narrativeTitle);

                    var authorSection = document.createElement('div');
                    authorSection.style.fontStyle = "italic";
                    authorSection.textContent = "by " + this.dataset.authorName + ", last updated " 
                        + getNiceDate(this.dataset.createdDate);
                    summarySection.appendChild(authorSection);

                    modalDialog.appendChild(summarySection);
                    //rows of apps

                    if (res[0].data[0].data.cells){
                        var detailsSection = makeDetails(res[0].data[0].data.cells, this.dataset.wsId);
                        modalDialog.appendChild(detailsSection);
                    } else if (res[0].data[0].data.worksheets[0].cells){
                        //old narratives
                        var detailsSection = makeDetails(res[0].data[0].data.worksheets[0].cells, this.dataset.wsId);
                        modalDialog.appendChild(detailsSection);                                
                    }
                    var openNarrativeButton = document.createElement('a');
                    openNarrativeButton.textContent = "Open this Narrative";
                    openNarrativeButton.href = "narrative/ws." + this.dataset.wsId + ".obj." + this.dataset.narrativeNum;
                    openNarrativeButton.target = "_blank";
                    openNarrativeButton.setAttribute('class', "btn btn-primary");
                    openNarrativeButton.style.width = "300px";

                    var buttonWrapper = document.createElement('div');
                    buttonWrapper.appendChild(openNarrativeButton);
                    buttonWrapper.style.textAlign = "center";

                    modalDialog.appendChild(buttonWrapper);
                    return null;
                })
                .catch((er) => {
                    //obj usually has been deleted
                });
        }

        function makeDetails(data, wsId){
            //add the first cell as abstract (if it exists)
            var abstract = document.createElement('div');
            abstract.setAttribute('class', 'abstract');
            document.getElementById('summary-section').appendChild(abstract);
            if(data[0].cell_type === 'markdown'){
                abstract.innerHTML = Marked(data[0].source);
            }else{
                abstract.textContent = "no abstract for this narrative"
            }

            //details view
            var popUp = document.createElement('div');
            popUp.setAttribute('id', 'details-section');

            data.forEach((cell) => {

                var row = document.createElement('div'),
                    appLogo = document.createElement('div'),
                    appDes = document.createElement('div'),
                    runState = document.createElement('div');

                row.setAttribute('class', 'data-cells');
                appLogo.setAttribute('class', 'col-sm-2 right-align icon-wrapper');
                appDes.setAttribute('class', 'col-sm-9 ellipsis');
                runState.setAttribute('class', 'col-sm-2 right-align');

                row.appendChild(appLogo);
                row.appendChild(appDes);
                // row.appendChild(runState);

                if(cell.cell_type === "markdown"){
                    // appDes.appendChild(textNode("Markdown"));
                    if (cell.metadata.kbase && cell.metadata.kbase.attributes && cell.metadata.kbase.attributes.title){
                        appDes.appendChild(textNode(cell.metadata.kbase.attributes.title));
                    }else{
                        appDes.appendChild(textNode(cell.source));
                    }
                    appLogo.appendChild(getDisplayIcons("markdown"));

                }
                else if(cell.cell_type === "code"){
                    // debugger;
                    if(cell.metadata.kbase){
                        if (cell.metadata.kbase.type === "data"){
                            appDes.appendChild(boldTextNode("Data Cell"));
                            if (cell.metadata.kbase.dataCell) {
                                appDes.appendChild(firstLine(cell.metadata.kbase.dataCell.objectInfo.name));
                            } else {
                                // appDes.appendChild(firstLine("Unknown"));
                            }
                            appLogo.appendChild(getDisplayIcons("data", cell.metadata.kbase.dataCell));

                        } else if (cell.metadata.kbase.type === "output"){
                            //ignore output cells
                            return;
                        }else if (cell.metadata.kbase.type === "app") {

                            var appName;
                            var appKey = cell.metadata.kbase.appCell.app.id;
                            var tag = cell.metadata.kbase.appCell.app.tag;

                            if(appKey){ 
                                var info = appsLib[tag][appKey];
                                if(info){
                                    appName = info.info.name;
                                    appLogo.appendChild(getDisplayIcons("app", info.info));
                                }else{
                                    //if app is not in catalog
                                    appName = appKey;
                                    appLogo.appendChild(getDisplayIcons("custom"));
                                }
                            }else{
                                appName = "Dinosaur Code";
                                appLogo.appendChild(getDisplayIcons("emergency")); 
                            }

                            appDes.appendChild(boldTextNode(appName));
                            // appDes.appendChild(firstLine(cell.source));
                            
                            var params = cell.metadata.kbase.appCell;
                            var appInputs = renderAppInputs(params, appDes, appLogo, wsId);
                            if(appInputs){
                                appDes.appendChild(appInputs);
                            }                            

                            //hide outputs and jobState
                            /**
                             var appOutputs = renderAppOutputs(cell.metadata.kbase.appCell.exec)
                             if(appOutputs) {
                                 appDes.appendChild(appOutputs);
                             }
                             var jobState = cell.metadata.kbase.appCell.fsm.currentState.mode;
                             runState.appendChild(appStateIcons(jobState));
                            **/
    
                        } else {
                            //cell is a script
                            appDes.appendChild(boldTextNode("Custom App"));
                            appDes.appendChild(textNode(cell.source));
                            appLogo.appendChild(getDisplayIcons("custom"));
                        }
                    }else {
                        //cell is a code cell
                        appDes.appendChild(boldTextNode("Code Cell"));
                        appLogo.appendChild(getDisplayIcons("custom")); 
                        if(cell.input){
                            appDes.appendChild(textNode(cell.input));
                        }else if(cell.source){
                            appDes.appendChild(firstLine(cell.source));
                        }else{
                            //empty cell
                            appDes.appendChild(firstLine("Empty Cell"));
                        }
                }
            }
                popUp.appendChild(row);
            })
            return popUp;
        }
        function renderAppInputs(appCell, appDes, appLogo, wsId){
            var params = appCell.params;
            var spec = appCell.app.spec.parameters;
            var inputs = spec.filter(spec => (spec.ui_class === "input"));
            //we only want to show first input if there are multiple
            if(inputs.length > 0){
                var inputObjects = inputs.map((input) => {
                    return params[input.id]
                });
                attachAppInputs(inputObjects, appDes, appLogo, wsId);
            }
            // else{
            //     appDes.appendChild(textNode("no inputs"));
            // }
        }

        function isWsObject(input){
            var isWsObject = true;
            var regex = RegExp('^\\d+(/\\d+)+$');

            if (typeof input === 'string' || input instanceof String) {
                input.split(";").forEach((seg) => {
                    if (!regex.test(seg)) {
                        isWsObject = false;
                    }
                })
            } 
            else {
                isWsObject = false;
            }
            return isWsObject; 
        }

        async function attachAppInputs(inputObjects, appDes, appLogo, wsId) {
            var multipleInputs = (inputObjects.length >1) ? true : false; 
            var objId = inputObjects[0];
            if(Array.isArray(objId)){
                if(objId.length > 1){
                    multipleInputs ==false;
                }
                objId = objId[0];
            }

            if(objId === null || objId === undefined){
                //no inputs
                // appDes.appendChild(textNode("there are no inputs"));
                return;
            }
            var objName,
                objects;

            if(isWsObject(objId)){
                objects = { objects: [{ ref: objId }] };
            }else{
                objName = objId;
                objects = { objects: [{ wsid: wsId, name: objName }] };
            }
            try {
                var objInfo = await workspace.callFunc('get_object_info3', [objects]);
                objName = objInfo[0].infos[0][1];
                var typeModuleInfo = objInfo[0].infos[0][2].split("-")[0].split(".");

                //                if (info && info.objectInfo && info.objectInfo.typeModule && info.objectInfo.typeName) {
                var info = {
                    objectInfo: {
                        type: objInfo[0].infos[0][2]
                    }
                }
                var icon = getDisplayIcons("data", info);
                appLogo.appendChild(getDisplayIcons("data", info))
            } catch (er) {
                //usually obj has been deleted
                // appDes.appendChild(textNode("there are no inputs or inputs are deleted"));
                return;

            }
            if(multipleInputs){
                objName += "...";
            }
            appDes.appendChild(firstLine(objName));

        }
        function renderAppOutputs(exec){
            var output;
            if (exec) {
                if (exec.jobState) {
                    //first one for now
                    var result = exec.jobState.result;
                    if (result && result[(result.length - 1)].report_ref) {
                        var refId = exec.jobState.result[0].report_ref;
                        output = document.createElement('div');
                       
                        var res = attachAppOutputs(refId, output);
                    }
                } else {
                    //old apps skip

                }
            }
            return output;
        }

        async function attachAppOutputs(refId, output){
            var returnedValue = await workspace.callFunc('get_objects2', [{ objects: [{ ref: refId }] }]);
            var results = returnedValue[0].data[0].data.objects_created;
            var names = await Promise.all(results.map(async (obj) => {
                var objName;
                try{
                    var objInfo = await workspace.callFunc('get_object_info3', [{ objects: [{ ref: obj.ref }] }]);
                    var typeModuleInfo = objInfo[0].infos[0][2].split("-")[0].split(".");
                    objName = objInfo[0].infos[0][1];
                    var type = { "type": { module: typeModuleInfo[0], "name": typeModuleInfo[1] } };
                    var typeInfo = runtime.getService('type').getIcon(type);
                    console.log(typeInfo.html);
                }catch (er){
                    //usually obj has been deleted
                    output.appendChild(textNode("outputs are probably deleted" ))

                }
                if(objName){
                    output.appendChild(textNode("outputs are: " + objName + " with obj id: " + 
                    obj.ref + " description is : " + obj.description))
                }
            }))
        }

        function getDisplayIcons(state, info){
            var icon = document.createElement('i');
            if(state === "markdown"){
                var typeInfo = {
                    classes: ["fa", "fa-paragraph grey-color"],
                    color: "silver"
                }
                icon.innerHTML = prettyIcons("square", typeInfo);
            }
            //custom code
            if (state === "custom") {
                var typeInfo = {
                    classes: ["fa", "fa-terminal almond-color"],
                    color: "silver"
                }
                icon.innerHTML = prettyIcons("square", typeInfo);
            }
            //apps or code that does not have standard fields
            if (state === "emergency"){
                var typeInfo = {
                    classes: ["fa", "fa-archive almond-color"],
                    color: "rgb(240, 131, 131)"
                }
                icon.innerHTML = prettyIcons("square", typeInfo);
            }
            //app
            if(state === "app"){
                if (info.icon) {
                    //TODO: need to get env from runtime. For now hardcoded
                    var imageUrl = "https://kbase.us/services/narrative_method_store/" + info.icon.url;
                    var customLogo = document.createElement('IMG');
                    customLogo.src = imageUrl;
                    icon.appendChild(customLogo);
                } else {
                    var typeInfo = {
                        classes: ["fa", "fa-cube grey-color"],
                        color: "rgb(103,58,183)"
                    }
                    icon.innerHTML = prettyIcons("square", typeInfo);                }
            }
            //data cells
            if(state === "data"){
                if (info && info.objectInfo && info.objectInfo.type) {
                    var type = runtime.service('type').parseTypeId(info.objectInfo.type);
                    var typeInfo = runtime.getService('type').getIcon({ type: type });
                    icon.innerHTML = prettyIcons("data", typeInfo);
                } else if (info && info.objectInfo && info.objectInfo.typeModule && info.objectInfo.typeName) {
                    var objectInfo = info.objectInfo;
                    //{ "type": { "module": "KBaseGenomes", "name": "Genome" } }
                    var type = { "type": { module: objectInfo.typeModule, "name": objectInfo.typeName } };
                    var typeInfo = runtime.getService('type').getIcon(type);
                    icon.innerHTML = prettyIcons("data", typeInfo);                    
                } 
                else {
                    var typeInfo = {
                        classes: ["fa-cube"],
                        color: "cornflowerblue"
                    }
                    icon.innerHTML = prettyIcons("data", typeInfo);                    
                }
            }

            return icon;
        }
        function prettyIcons(style, typeInfo){
            var iconHtml, shape;
            if(style === "data"){
                shape = 'fa fa-circle fa-stack-2x'
            }else if (style === "square"){
                shape = 'fa fa-square fa-stack-2x';
            }
            return t('span')({ class: 'fa-stack fa-2x' }, [
                t('i')({ class: shape, style: { color: typeInfo.color } }),
                t('i')({ class: 'fa-inverse fa-stack-1x ' + typeInfo.classes.join(' ') })
            ])
            // return t('span')({ class: 'fa-stack fa-2x' }, [
            //     t('i')({ class: 'fa-inverse fa-stack-1x ' + typeInfo.classes.join(' ') })
            // ])
            
        }

        function appStateIcons(state){
            var stateIcon = document.createElement('div');
            stateIcon.style.fontSize = "3em";

            //app finished
            if(state === "success"){
                stateIcon.setAttribute('class', 'fa fas fa-check-circle');
            
            //app finished with error
            }else if (state === "error"){
                stateIcon.setAttribute('class', 'fa fas fa-exclamation-circle');

            //app canceled
            }else if (state === "canceled"){
                stateIcon.setAttribute('class', 'fa fas fa-times');
            
            //really old apps
            }else if (state === "emergency" ) {
                stateIcon.setAttribute('class', 'fa fas fa-ambulance');
            //app is running
            }else {
                stateIcon.setAttribute('class', 'fa fas fa-spinner');
            }
            return stateIcon;
        }

        function textNode(text){
            var node = document.createElement('div');
            node.textContent = text;
            return node;
        }
        function boldTextNode(input){
            var line = textNode(input);
            line.style.fontWeight = "bold";
            return line
        }
        function firstLine(input){ 
            var line = textNode(input);
            line.setAttribute('class', 'app-first-line');
            return line
        }
        function addCol(input){
            var colItem = document.createElement('td');
            colItem.setAttribute('class', 'narrative-buttons')
            colItem.textContent = input;
            return colItem;
        }
        function getNiceDate(d){
            var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            var date = new Date(d);
            return date.toLocaleDateString('en-US', options);

        }
        function start(params) {
            /* DOC: dom access
            * In this case we are keeping things simple by using 
            * the plain DOM API. We could also use jquery 
            * here if we wish to.
            */
      
           
           var narrativesContainer = document.createElement('table');
            narrativesContainer.setAttribute('class', 'table table-bordered');
            container.appendChild(narrativesContainer);

            var heading = document.createElement('tr');
            heading.appendChild(addCol("Narrative Names"));
            heading.appendChild(addCol("Author"));
            heading.appendChild(addCol("Created Date"));
            narrativesContainer.appendChild(heading);

 //owners: ['dianez']
 //, owners: [runtime.service('session').getUsername()]
            Promise.all([workspace.callFunc('list_workspace_info', [{ meta: { is_temporary: "false" }, owners: [runtime.service('session').getUsername()]}])])
            .spread((res) => {
                res[0].forEach((obj) => {
                    if (obj[8] && obj[8].narrative && obj[8].narrative_nice_name){
                        var node = document.createElement('tr');
                        node.setAttribute('data-ws-id', obj[0]);
                        node.setAttribute('data-author-name', obj[2]);
                        node.setAttribute('data-created-date', obj[3]);
                        node.setAttribute('data-narrative-name', obj[8].narrative_nice_name);
                        node.setAttribute('data-narrative-num', obj[8].narrative);
                        node.setAttribute('class', 'narrative_buttons');

                        node.appendChild(addCol(obj[8].narrative_nice_name));
                        node.appendChild(addCol(obj[2]));

                        node.appendChild(addCol(getNiceDate(obj[3])));
                        node.onclick = makePopup;
                        node.setAttribute('data-toggle', 'modal');
                        node.setAttribute('data-target', '#popup-container');
                        narrativesContainer.appendChild(node);
                    }
                })
            });

            var popUpContainer = document.createElement('div');
            popUpContainer.setAttribute('id', 'popup-container');
            popUpContainer.setAttribute('class', 'modal fade');
            popUpContainer.setAttribute('role', 'dialog');
            popUpContainer.setAttribute('area-labelledby', 'narrativeLabel');

            container.appendChild(popUpContainer);


            /* DOC: runtime interface
            * Since a panel title is also, logically, the title of
            * the "page" we use the runtimes event bus to emit the
            * 'title' event to the application. The application 
            * takes care of modifying the window panel to accomodate
            * it.
            */
            runtime.send('ui', 'setTitle', 'test');
        }
        function run(params) {
        }
        function stop() {
            
        }
        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
            }
        }
        function destroy() {
            
        }

        /* Returning the widget
        The widget is returned as a simple JS object. In this case we have also hardened the object
        by usinng Object.freeze, which ensures that properties may not be added or modified.
        */
        return Object.freeze({
            init: init,
            attach: attach,
            start: start,
            run: run,
            stop: stop,
            detach: detach,
            destroy: destroy
        });
    }

    return {
        make: factory
    };
});