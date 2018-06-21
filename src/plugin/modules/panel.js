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
    'use strict';

    var t = html.tag,
        span = t('span');

    function factory(config) {
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

        ['beta', 'release', 'dev'].forEach((tag) => {
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
        });

        function init() {
            return null;
        }

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));

            return null;
        }
        function makePopup(){
            workspace.callFunc('get_objects2', [{
                objects: [{
                    objid: this.dataset.narrativeNum,
                    wsid: this.dataset.wsId
                }]
            }])
                .then((res) => {
                    var popUpContainer = document.getElementById('popup-container');
                    popUpContainer.innerHTML = '';

                    var modalDialog = document.createElement('div');
                    modalDialog.setAttribute('class', 'modal-dialog narrative-info-background');
                    popUpContainer.appendChild(modalDialog);



                    var summarySection = document.createElement('div');
                    summarySection.setAttribute('id', 'summary-section');

                    var narrativeTitle = document.createElement('h2');
                    narrativeTitle.textContent = this.dataset.narrativeName;
                    summarySection.appendChild(narrativeTitle);

                    var authorSection = document.createElement('div');
                    authorSection.style.fontStyle = 'italic';
                    authorSection.textContent = 'by ' + this.dataset.authorName + ', last updated '
                        + getNiceDate(this.dataset.createdDate);
                    summarySection.appendChild(authorSection);

                    modalDialog.appendChild(summarySection);
                    //rows of apps

                    let detailsSection;
                    if (res[0].data[0].data.cells){
                        detailsSection = makeDetails(res[0].data[0].data.cells, this.dataset.wsId);
                        modalDialog.appendChild(detailsSection);
                    } else if (res[0].data[0].data.worksheets[0].cells){
                        //old narratives
                        detailsSection = makeDetails(res[0].data[0].data.worksheets[0].cells, this.dataset.wsId);
                        modalDialog.appendChild(detailsSection);
                    }
                    var openNarrativeButton = document.createElement('a');
                    openNarrativeButton.textContent = 'Open this Narrative';
                    openNarrativeButton.href = 'narrative/ws.' + this.dataset.wsId + '.obj.' + this.dataset.narrativeNum;
                    openNarrativeButton.target = '_blank';
                    openNarrativeButton.setAttribute('class', 'btn btn-primary');
                    openNarrativeButton.style.width = '300px';

                    var buttonWrapper = document.createElement('div');
                    buttonWrapper.appendChild(openNarrativeButton);
                    buttonWrapper.style.textAlign = 'center';

                    modalDialog.appendChild(buttonWrapper);
                    return null;
                })
                .catch((error) => {
                    //obj usually has been deleted
                    console.error(error);
                });
        }

        function makeDetails(data, wsId){
            //add the first cell as abstract (if it exists)
            var abstract = document.createElement('div');
            abstract.setAttribute('class', 'abstract');
            document.getElementById('summary-section').appendChild(abstract);
            if (data[0].cell_type === 'markdown'){
                abstract.innerHTML = Marked(data[0].source);
            } else {
                abstract.textContent = 'no abstract for this narrative';
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

                if (cell.cell_type === 'markdown'){
                    // appDes.appendChild(textNode("Markdown"));
                    if (cell.metadata.kbase && cell.metadata.kbase.attributes && cell.metadata.kbase.attributes.title){
                        appDes.appendChild(textNode(cell.metadata.kbase.attributes.title));
                    } else {
                        appDes.appendChild(textNode(cell.source));
                    }
                    appLogo.appendChild(getDisplayIcons('markdown'));

                }
                else if (cell.cell_type === 'code'){
                    if (cell.metadata.kbase){
                        if (cell.metadata.kbase.type === 'data'){
                            appDes.appendChild(boldTextNode('Data Cell'));
                            if (cell.metadata.kbase.dataCell) {
                                appDes.appendChild(firstLine(cell.metadata.kbase.dataCell.objectInfo.name));
                            } else {
                                // appDes.appendChild(firstLine("Unknown"));
                            }
                            appLogo.appendChild(getDisplayIcons('big-data', cell.metadata.kbase.dataCell));

                        } else if (cell.metadata.kbase.type === 'output'){
                            //ignore output cells
                            return;
                        } else if (cell.metadata.kbase.type === 'app') {
                            var appName;
                            var appKey = cell.metadata.kbase.appCell.app.id;
                            var tag = cell.metadata.kbase.appCell.app.tag;

                            if (appKey){
                                var info = appsLib[tag][appKey];
                                if (info){
                                    appName = info.info.name;
                                    appLogo.appendChild(getDisplayIcons('app', info.info));
                                } else {
                                    //if app is not in catalog
                                    appName = appKey;
                                    appLogo.appendChild(getDisplayIcons('custom'));
                                }
                            } else {
                                appName = 'Dinosaur Code';
                                appLogo.appendChild(getDisplayIcons('emergency'));
                            }

                            appDes.appendChild(boldTextNode(appName));
                            // appDes.appendChild(firstLine(cell.source));

                            var params = cell.metadata.kbase.appCell;
                            var appInputs = renderAppInputs(params, appDes, appLogo, wsId);
                            if (appInputs){
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
                            appDes.appendChild(boldTextNode('Custom App'));
                            appDes.appendChild(textNode(cell.source));
                            appLogo.appendChild(getDisplayIcons('custom'));
                        }
                    } else {
                        //cell is a code cell
                        appDes.appendChild(boldTextNode('Code Cell'));
                        appLogo.appendChild(getDisplayIcons('custom'));
                        if (cell.input){
                            appDes.appendChild(textNode(cell.input));
                        } else if (cell.source){
                            appDes.appendChild(firstLine(cell.source));
                        } else {
                            //empty cell
                            appDes.appendChild(firstLine('Empty Cell'));
                        }
                    }
                }
                popUp.appendChild(row);
            });
            return popUp;
        }
        function renderAppInputs(appCell, appDes, appLogo, wsId){
            var params = appCell.params;
            var spec = appCell.app.spec.parameters;
            var inputs = spec.filter(spec => (spec.ui_class === 'input'));
            //we only want to show first input if there are multiple
            if (inputs.length > 0) {
                var inputObjects = inputs.map((input) => {
                    return params[input.id];
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
                input.split(';').forEach((seg) => {
                    if (!regex.test(seg)) {
                        isWsObject = false;
                    }
                });
            }
            else {
                isWsObject = false;
            }
            return isWsObject;
        }

        function attachAppInputs(inputObjects, appDes, appLogo, wsId) {
            var inputDiv = document.createElement('div');
            var multipleInputs = (inputObjects.length > 1) ? true : false;
            var objId = inputObjects[0];
            if (Array.isArray(objId)) {
                if (objId.length > 1) {
                    multipleInputs = false;
                }
                objId = objId[0];
            }

            if (objId === null || objId === undefined) {
                //no inputs
                // appDes.appendChild(textNode("there are no inputs"));
                return;
            }
            var objName,
                objects;

            if (isWsObject(objId)) {
                objects = { objects: [{ ref: objId }] };
            } else {
                objName = objId;
                objects = { objects: [{ wsid: wsId, name: objName }] };
            }
            workspace.callFunc('get_object_info3', [objects])
                .spread((objInfo) => {
                    objName = objInfo.infos[0][1];
                    // var typeModuleInfo = objInfo.infos[0][2].split('-')[0].split('.');

                    // if (info && info.objectInfo && info.objectInfo.typeModule && info.objectInfo.typeName) {
                    var info = {
                        objectInfo: {
                            type: objInfo.infos[0][2]
                        }
                    };
                    // var icon = getDisplayIcons('data', info);
                    inputDiv.appendChild(getDisplayIcons('data', info));

                    if (multipleInputs) {
                        objName += '...';
                    }
                    inputDiv.appendChild(firstLine(objName));
                    inputDiv.setAttribute('class', 'input-wrapper');
                    appDes.appendChild(inputDiv);
                })
                .catch((error) => {
                    console.error(error);
                    //usually obj has been deleted
                    // appDes.appendChild(textNode("there are no inputs or inputs are deleted"));
                    return;
                });
        }

        // function renderAppOutputs(exec){
        //     var output;
        //     if (exec) {
        //         if (exec.jobState) {
        //             //first one for now
        //             var result = exec.jobState.result;
        //             if (result && result[(result.length - 1)].report_ref) {
        //                 var refId = exec.jobState.result[0].report_ref;
        //                 output = document.createElement('div');

        //                 var res = attachAppOutputs(refId, output);
        //             }
        //         } else {
        //             //old apps skip

        //         }
        //     }
        //     return output;
        // }

        // function attachAppOutputs(refId, output){
        //     workspace.callFunc('get_objects2', [{ objects: [{ ref: refId }] }])
        //         .spread((returnedValue) => {
        //             var createdObjects = returnedValue.data[0].data.objects_created;

        //             return Promise.all(createdObjects.map((obj) => {
        //                 return workspace.callFunc('get_object_info3', [{ objects: [{ ref: obj.ref }] }])
        //                     .spread((objInfo) => {
        //                         let typeModuleInfo = objInfo.infos[0][2].split('-')[0].split('.');
        //                         let objName = objInfo.infos[0][1];
        //                         if (objName) {
        //                             output.appendChild(textNode('outputs are: ' + objName + ' with obj id: ' +
        //                             obj.ref + ' description is : ' + obj.description));
        //                         }
        //                         var type = {
        //                             type: {
        //                                 module: typeModuleInfo[0],
        //                                 name: typeModuleInfo[1]
        //                             }
        //                         };
        //                         var typeInfo = runtime.getService('type').getIcon(type);
        //                         console.log(typeInfo.html);
        //                     })
        //                     .catch((error) => {
        //                         console.error(error);
        //                         output.appendChild(textNode('outputs are probably deleted'));
        //                     });
        //             }));
        //         });
        // }

        function getDisplayIcons(state, info){
            var icon = document.createElement('i');
            switch (state) {
            case 'markdown':
                icon.innerHTML = prettyIcons('square', {
                    classes: ['fa', 'fa-paragraph grey-color'],
                    color: 'silver'
                });
                break;
            case 'custom':
                //custom code
                icon.innerHTML = prettyIcons('square', {
                    classes: ['fa', 'fa-terminal almond-color'],
                    color: 'silver'
                });
                break;
            case 'emergency':
                //apps or code that does not have standard fields
                icon.innerHTML = prettyIcons('square', {
                    classes: ['fa', 'fa-archive almond-color'],
                    color: 'rgb(240, 131, 131)'
                });
                break;
            case 'app':
                //app
                if (info.icon) {
                    var imageUrl = runtime.config('services.NarrativeMethodStore.image_url') + info.icon.url;
                    var customLogo = document.createElement('IMG');
                    customLogo.src = imageUrl;
                    icon.appendChild(customLogo);
                } else {
                    icon.innerHTML = prettyIcons('square', {
                        classes: ['fa', 'fa-cube grey-color'],
                        color: 'rgb(103,58,183)'
                    });
                }
                break;
            case 'data':
            // fallthrough
            case 'big-data':
                //data cells
                if (info && info.objectInfo && info.objectInfo.type) {
                    var type = runtime.service('type').parseTypeId(info.objectInfo.type);
                    const typeInfo = runtime.getService('type').getIcon({ type: type });
                    icon.innerHTML = prettyIcons(state, typeInfo);
                } else if (info && info.objectInfo && info.objectInfo.typeModule && info.objectInfo.typeName) {
                    var objectInfo = info.objectInfo;
                    //{ "type": { "module": "KBaseGenomes", "name": "Genome" } }
                    const typeInfo = runtime.getService('type').getIcon({
                        type: {
                            module: objectInfo.typeModule,
                            name: objectInfo.typeName
                        }
                    });
                    icon.innerHTML = prettyIcons(state, typeInfo);
                }
                else {
                    icon.innerHTML = prettyIcons(state, {
                        classes: ['fa-cube'],
                        color: 'cornflowerblue'
                    });
                }
            }

            return icon;
        }
        function prettyIcons(style, typeInfo){
            var shape, iconSize;
            if (style === 'data'){
                shape = 'fa fa-circle fa-stack-2x';
                iconSize = 'fa-stack fa-1x';
            } else if (style === 'big-data'){
                shape = 'fa fa-circle fa-stack-2x';
                iconSize = 'fa-stack fa-2x';
            } else if (style === 'square'){
                shape = 'fa fa-square fa-stack-2x';
                iconSize = 'fa-stack fa-2x';
            }
            return span({ class: iconSize }, [
                span({ class: shape, style: { color: typeInfo.color } }),
                span({ class: 'fa-inverse fa-stack-1x ' + typeInfo.classes.join(' ') })
            ]);
            // return t('span')({ class: 'fa-stack fa-2x' }, [
            //     t('i')({ class: 'fa-inverse fa-stack-1x ' + typeInfo.classes.join(' ') })
            // ])

        }

        // function appStateIcons(state){
        //     var stateIcon = document.createElement('div');
        //     stateIcon.style.fontSize = '3em';

        //     //app finished
        //     if (state === 'success'){
        //         stateIcon.setAttribute('class', 'fa fas fa-check-circle');

        //     //app finished with error
        //     } else if (state === 'error'){
        //         stateIcon.setAttribute('class', 'fa fas fa-exclamation-circle');

        //     //app canceled
        //     } else if (state === 'canceled'){
        //         stateIcon.setAttribute('class', 'fa fas fa-times');

        //     //really old apps
        //     } else if (state === 'emergency') {
        //         stateIcon.setAttribute('class', 'fa fas fa-ambulance');
        //     //app is running
        //     } else {
        //         stateIcon.setAttribute('class', 'fa fas fa-spinner');
        //     }
        //     return stateIcon;
        // }

        function textNode(text){
            var node = document.createElement('div');
            node.textContent = text;
            return node;
        }
        function boldTextNode(input){
            var line = textNode(input);
            line.style.fontWeight = 'bold';
            return line;
        }
        function firstLine(input){
            var line = textNode(input);
            line.setAttribute('class', 'app-first-line');
            return line;
        }
        function addCol(input){
            var colItem = document.createElement('td');
            colItem.setAttribute('class', 'narrative-buttons');
            colItem.textContent = input;
            return colItem;
        }
        function getNiceDate(d){
            var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            var date = new Date(d);
            return date.toLocaleDateString('en-US', options);

        }
        function start() {
            var narrativesContainer = document.createElement('table');
            narrativesContainer.setAttribute('class', 'table table-bordered');
            container.appendChild(narrativesContainer);

            var heading = document.createElement('tr');
            heading.appendChild(addCol('Narrative Names'));
            heading.appendChild(addCol('Author'));
            heading.appendChild(addCol('Created Date'));
            narrativesContainer.appendChild(heading);

            //owners: ['dianez']
            //, owners: [runtime.service('session').getUsername()]
            Promise.all([workspace.callFunc('list_workspace_info', [{
                meta: { is_temporary: 'false' },
                owners: [runtime.service('session').getUsername()]
            }])])
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
                    });
                });

            var popUpContainer = document.createElement('div');
            popUpContainer.setAttribute('id', 'popup-container');
            popUpContainer.setAttribute('class', 'modal fade');
            popUpContainer.setAttribute('role', 'dialog');
            popUpContainer.setAttribute('area-labelledby', 'narrativeLabel');

            container.appendChild(popUpContainer);

            runtime.send('ui', 'setTitle', 'test');
        }

        function stop() {
        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
            }
        }

        /* Returning the widget
        The widget is returned as a simple JS object. In this case we have also hardened the object
        by using Object.freeze, which ensures that properties may not be added or modified.
        */
        return Object.freeze({
            init: init,
            attach: attach,
            start: start,
            stop: stop,
            detach: detach,
        });
    }

    return {
        make: factory
    };
});