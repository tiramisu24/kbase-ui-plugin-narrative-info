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
    './lib/rpc'
], function (
    Promise, 
    html, 
    BS,
    Utils,
    GenericClient,
    RPC
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
        function layout() {
            /* DOC: return some structure
                * The render function returns enough structure to represent
                * what needs to be rendered. This is not hard-coded at all, 
                * and is just a convention within this panel. It has turned
                * out, however, to be a useful pattern.
                */
            return div({
                class: 'plugin_narrative-info_panel container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({class: 'col-sm-6'}, [
                        h2('Test'),
                        p([
                            'This is a very simple sample plugin. It consists of just a single panel, with ',
                            'some helper functions in lib/utils.js.'
                        ]),
                        p([
                            'From this starting point one may build a more complex plugin.'
                        ]),
                        p([
                            'For instance, it is easy to hook in jquery widgets by instantiating them in either the ',
                            'attach or start methods. Knockout components can likewise be integrated simply by creating the ',
                            'appropriate markup.'
                        ]),
                        p([
                            'In the old days, as can be seen in the dashboard plugin, the plugin is composed of ',
                            'kbase-ui style widgets which are defined and then composed through the kb_widget module. ',
                            'This method was especially useful for migrating jquery-style widgets into kbase-ui, as can be ',
                            'seen in the dataview landing page plugin.',
                            'It was also useful for composing factory-style widgets based on the nunjucks (jinja clone) templating ',
                            'library, since the widgets are simply modules which can be composed of submodules, etc.'
                        ]),
                        p([
                            'A more recent approach is to compose a plugin out of knockout components, as can be seen in ',
                            'the auth2, RESKE search, and JGI search plugins.'
                        ]),
                        p([
                            'Hopefully there will be sample plugins demonstrating each of these techniques in a simplified and ',
                            'documented form.'
                        ])
                    ]),
                    div({class: 'col-sm-6'}, [
                        BS.buildPanel({
                            title: 'Sample Panel',
                            body: div([
                                p('This is a simple panel in a simple widget'),
                                p([
                                    'It does\'t do much other than demonstrate the relatively easy creation of ',
                                    'a bootstrap panel within a ui panel.'
                                ]),
                                p(Utils.something())
                            ])
                        })
                    ])
                ])
            ]);
        }

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

            Promise.all([workspace.callFunc('get_objects2',
                [{ objects: [{ objid: this.dataset.narrativeNum, wsid: this.dataset.wsId }]}])])
                .spread((res) => {
                    var popUpContainer = document.getElementById('popup-container');
                    popUpContainer.innerHTML = "";


                    var summarySection = document.createElement('div');
                    summarySection.setAttribute('id', 'summary-section')

                    var narrativeTitle = document.createElement('h2');
                    narrativeTitle.textContent = this.dataset.narrativeName;
                    summarySection.appendChild(narrativeTitle);

                    var authorSection = document.createElement('div');
                    authorSection.style.fontStyle = "italic";
                    authorSection.textContent = "by " + this.dataset.authorName + ", last updated " + this.dataset.createdDate;
                    summarySection.appendChild(authorSection);

                    popUpContainer.appendChild(summarySection);
                    //rows of apps
                    if (res[0].data[0].data.cells){
                        var detailsSection = makeDetails(res[0].data[0].data.cells);
                        popUpContainer.appendChild(detailsSection);
                    } else if (res[0].data[0].data.worksheets[0].cells){
                        //old narratives
                        var detailsSection = makeDetails(res[0].data[0].data.worksheets[0].cells);
                        popUpContainer.appendChild(detailsSection);                                
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

                    popUpContainer.appendChild(buttonWrapper);
                });
            
        }

        function makeDetails(data){
            //add the first cell as abstract (if it exists)
            var abstract = document.createElement('div');
            document.getElementById('summary-section').appendChild(abstract);
            if(data[0].cell_type === 'markdown'){
                abstract.textContent = data[0].source;
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
                appLogo.setAttribute('class', 'col-sm-2 right-align');
                appDes.setAttribute('class', 'col-sm-9 ellipsis');
                runState.setAttribute('class', 'col-sm-2 right-align');

                row.appendChild(appLogo);
                row.appendChild(appDes);
                row.appendChild(runState);

                if(cell.cell_type === "markdown"){
                    appDes.appendChild(textNode("Markdown"));
                    appDes.appendChild(textNode(cell.source));
                    appLogo.appendChild(getDisplayIcons("markdown"));

                }else if(cell.cell_type === "code"){
                    if(cell.metadata.kbase){
                        if (cell.metadata.kbase.type === "data"){
                            appDes.appendChild(textNode("Data Cell"));
                            if (cell.metadata.kbase.dataCell) {
                                appDes.appendChild(textNode("Data: " + cell.metadata.kbase.dataCell.objectInfo.name));
                            } else {
                                appDes.appendChild(textNode("Unknown"));
                            }
                            appLogo.appendChild(getDisplayIcons("data", cell.metadata.kbase.dataCell));

                        } else if (cell.metadata.kbase.type === "app") {

                            var appName;
                            var appKey = cell.metadata.kbase.appCell.app.id;
                            var tag = cell.metadata.kbase.appCell.app.tag;

                            if(appKey){                            
                                var info = appsLib[tag][appKey];
                                appName = info.info.name;
                                appLogo.appendChild(getDisplayIcons("app", info.info));
                            }else{
                                appName = "Dinosaur Code";
                                appLogo.appendChild(getDisplayIcons("emergency")); 
                            }

                            appDes.appendChild(textNode(appName));
                            var params = cell.metadata.kbase.appCell.params;
                            var output = "Input: ";
                            appDes.appendChild(textNode(output))
                            var regex = RegExp('^\\d+(/\\d+)+$');

                            Object.keys(params).forEach((key) => {
                                var isWsObject = true;
                                var value = params[key];

                                if (typeof value === 'string' || value instanceof String){
                                    // debugger;
                                    value.split(";").forEach((seg) => {
                                        if(!regex.test(seg)){
                                            isWsObject = false;
                                        }
                                    })
                                }else{
                                    isWsObject = false;
                                }
                                if(isWsObject){
                                    appDes.appendChild(textNode(key + ": " + value))
                                }
                            })
                            // debugger;
                            var appOutputs = renderAppOutputs(cell.metadata.kbase.appCell.exec)
                            if(appOutputs) {
                                appDes.appendChild(appOutputs);
                            }
                            var jobState = cell.metadata.kbase.appCell.fsm.currentState.mode;
                            output = "Job State is: " + jobState;
                            runState.appendChild(appStateIcons(jobState));
    
                        } else {
                            //cell is a script
                            appDes.appendChild(textNode("Custom Code"));
                            appLogo.appendChild(getDisplayIcons("custom"));
                        }
                    }else {
                        //cell is a script
                        appDes.appendChild(textNode("Dinosaur Code"));
                        appLogo.appendChild(getDisplayIcons("emergency")); 
                        runState.appendChild(appStateIcons("emergency"));
                }
            }
                popUp.appendChild(row);
            })
            return popUp;
        }
        function renderAppInputs(){

        }
        function renderAppOutputs(exec){
            var output;
            if (exec) {
                if (exec.jobState) {
                    // debugger;
                    //first one for now
                    if (exec.jobState.result && exec.jobState.result[0].report_ref) {
                        // debugger;
                        var refId = exec.jobState.result[0].report_ref;
                        output = document.createElement('div');
                        Promise.all([workspace.callFunc('get_objects2',
                            [{ objects: [{ ref: refId }] }])])
                            .spread((res) => {
                                var result = res[0].data[0].data.objects_created;
                                result.forEach((obj) => {
                                    output.appendChild(textNode(
                                        "outputs are: " + obj.ref + " description is : " + obj.description
                                    ))
                                })
                                // debugger;
                            });

                        // output = textNode("output is: " + exec.jobState.result[0].report_ref);

                        // debugger;
                        // console.log("reports object is" + exec.jobState.result[0]);
                    }
                } else {
                    //old apps skip
                    debugger;
                }
            }
            return output;
        }

        function getAppOutputs(){

        }
        
        function getDisplayIcons(state, info){
            var icon = document.createElement('div');
            icon.style.fontSize = "3em";
            if(state === "markdown"){
                icon.setAttribute('class', 'fa fa-paragraph ');
            }
            //custom code
            if (state === "custom") {
                icon.setAttribute('class', 'fa fas fa-archive fa-3x');
            }
            //apps or code that does not have standard fields
            if (state === "emergency"){
                icon.setAttribute('class', 'fa fas fa-archive fa-3x');
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
                    icon.setAttribute('class', 'fa fas fa-terminal fa-3x');
                }
            }
            //data cells
            if(state === "data"){
                if (info && info.objectInfo && info.objectInfo.typeModule && info.objectInfo.typeName) {
                    var objectInfo = info.objectInfo;
                    //{ "type": { "module": "KBaseGenomes", "name": "Genome" } }
                    var type = { "type": { module: objectInfo.typeModule, "name": objectInfo.typeName } };
                    var typeInfo = runtime.getService('type').getIcon(type);
                    icon.innerHTML = typeInfo.html;
                } else {
                    icon.setAttribute('class', 'fa fas fa-cube fa-3x');
                }
            }
            return icon;
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
        function start(params) {
            /* DOC: dom access
            * In this case we are keeping things simple by using 
            * the plain DOM API. We could also use jquery 
            * here if we wish to.
            */
            // container.innerHTML = layout();
            var narrativesContainer = document.createElement('div');
            narrativesContainer.setAttribute('id', 'narratives-container');
            narrativesContainer.setAttribute('class', 'col-sm-4');
            container.appendChild(narrativesContainer);
 //owners: ['dianez']
            Promise.all([workspace.callFunc('list_workspace_info', [{ meta: { is_temporary: "false" }}])])
            .spread((res) => {
                res[0].forEach((obj) => {
                    if (obj[8] && obj[8].narrative && obj[8].narrative_nice_name){
                        var node = document.createElement('div');
                        node.setAttribute('data-ws-id', obj[0]);
                        node.setAttribute('data-author-name', obj[2]);
                        node.setAttribute('data-created-date', obj[3]);
                        node.setAttribute('data-narrative-name', obj[8].narrative_nice_name);
                        node.setAttribute('data-narrative-num', obj[8].narrative);
                        node.setAttribute('class', 'narrative_buttons');
                        var narrative = document.createTextNode("Workspace with Narrative: " + obj[8].narrative_nice_name);
                        node.appendChild(narrative);
                        node.onclick = makePopup;
                        narrativesContainer.appendChild(node);
                    }
                })
            });

            var popUpContainer = document.createElement('div');
            popUpContainer.setAttribute('id', 'popup-container');
            popUpContainer.setAttribute('class', 'col-sm-7');
            container.appendChild(popUpContainer);

      

            //TODO: make call to workspace then send to layout


            // return rpc.call('KBaseSearchEngine', 'search_objects', [param])

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