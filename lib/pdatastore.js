/**
 * @author Okeke Paul
 *
 * Licence : MIT.
 *
 * @Description PDataStore requires that a div with the ID p-store MUST exist
 *              and that this div will contain all data intended to be loaded into memory.
 *              To save a data into p-store create an attribute on the div which will serve as
 *              the dataSource where PDataStore will retrieve its values from.
 *              @example : <div id='p-store' data-source1='json_string' data-source2='http://url/to/fetch/json'></div>
 *              PDataStore will fetch its data from the dataSource and will cache it into its memory.
 *              Hence your HTML page wouldn't contain ambiguous data even when you view the page source.
 *
 *              Please note that PDataStore requires that the dataSource is a valid json or a valid url
 *              to fetch json data, if not PDataSore will throw Error.
 * @constructor
 */

module.exports = PDataStore;

function PDataStore(sync){
    this.pStore = document.getElementById('p-store');//given that all data will be loaded to this div
    if(this.pStore==null) throw new Error('To use PDataStore you must specify a div with the id p-store');
    this.pCache = {};
    (window.localStorage.getItem('p-data-store-cache')===null)
        ? window.localStorage.setItem('p-data-store-cache', JSON.stringify(this.pCache))
        : this.pCache = JSON.parse(window.localStorage.getItem('p-data-store-cache'));
    if(sync) this.synchronizeData();
    this.result = [];
}

PDataStore.prototype.synchronizeData = function(){
    //synchronize data will load all the data to the storage at once before any event is triggered
    var dataPool = this.pStore.attributes;
    for(var i=0;i<dataPool.length;i++){
        var namedNode = dataPool[i];//a named node is same thing as attributes in js.. :)
        if(namedNode.name!=='id'){
            if(this.isJson(namedNode.nodeValue)){
                this.pCache[namedNode.name] = JSON.parse(namedNode.nodeValue);
            }
            else if(this.isValidUrl(namedNode.nodeValue)){
                this.get(namedNode.nodeValue, namedNode.name, function(result, src){
                    this.pCache[src] = result;
                    this.updateStorage();
                }.bind(this));
            }
        }
    }
};

PDataStore.prototype.get = function(url, srcName, callback) {
    var req = new XMLHttpRequest();
    req.open('GET', url);
    //most web framework might check if its n ajax request so we set the header
    req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    req.onload = function (e) {
        if (this.status === 200) callback(this.response, srcName);
    };
    req.onerror = function (err) {
        //we can even try this more times... using an exponential callback function.. hmm later
        //this.get(url, callback);
    };
    req.responseType = "json";
    req.send();
};

PDataStore.prototype.isJson = function(str){
    try{
        JSON.parse(str)
    }catch(e){
        return false;
    }
    return true;
};

PDataStore.prototype.isValidUrl = function(str){
    var anc = document.createElement('a');//we can use the anchor element to know if its a true url
    anc.href = str;
    return (anc.host && anc.origin) ? true : false;
};

PDataStore.prototype.updateStorage = function(){
    window.localStorage.setItem('p-data-store-cache', JSON.stringify(this.pCache));
};

PDataStore.prototype.retrieveData = function(attr){
    var data = null;
    if(this.pCache.hasOwnProperty(attr)){
        data = this.pCache[attr];
    }else if(this.pStore.hasAttribute(attr)){
        //we need to check if the value is a valid url
        var attrVal = this.pStore.getAttribute(attr);
        if(this.isJson(attrVal)){
            data = this.pCache[attr] = JSON.parse(attrVal);
        }else if(this.isValidUrl(attrVal)){
            this.get(attrVal, attr, function(result, src){
                this.pCache[src] = result;
                this.updateStorage();
            }.bind(this));
        }else{
            throw new Error('Invalid Data Source Format Specified; ' +
                'Data source can either be json or a url that will ' +
                'be used to fetch the data');
        }
        this.updateStorage();
    }
    return data;
};

/**
 * @author Okeke Paul
 * @param {String} k - the key name to search.
 * @param {String|Number} v - the value to search and compare with the value of @param k.
 * @param {String} attr - the name of the attribute that holds the original data to perform a search on.
 * @returns {PDataStore}
 */
PDataStore.prototype.findDataByKeyValue = function(k, v, attr){
    var data = this.retrieveData(attr);
    var result = [];//array of all match where row.k === v
    if(data){
        for(var j=0;j<data.length;j++){
            var row = data[j];
            var s = row[k];
            if(!isNaN(v)) { v = parseInt(v);  s = parseInt(row[k])}
            if(s === v){
                result.push(row);
            }
        }
        this.pStore.removeAttribute(attr);//lets remove it from the page... we don't need it there anymore
    }
    this.result = result;
    return this;
};

PDataStore.prototype.loadDataFromSource = function(dataSource){
    this.result = this.retrieveData(dataSource);
    return this;
};

PDataStore.prototype.getResult = function(){
    return this.result;
};

/**
 * @author Okeke Paul
 * @param {String} k - the key that its value will become the value of the HTMLOptionElement
 * @param {String} vk - the key that its value will become the text of the HTMLOptionElement
 * @param {String} selectName - the name of the HTMLSelectElement that will hold the list data
 * @param {String|Number} def - this is default value that should be selected in the list
 */
PDataStore.prototype.toHtmlList = function(k, vk, selectName, def){
    if(!isNaN(def)) def = parseInt(def);
    var htmlSelect = document.getElementsByName(selectName)[0];
    if(!htmlSelect instanceof HTMLSelectElement) throw new TypeError('the selectName must be a name of a HTMLSelectElement');
    htmlSelect.options.length = 0;
    var obj= {}; obj[k] = ''; obj[vk] = '-- Select an item --';
    this.result.unshift(obj);
    this.result.forEach(function(item, index, i){
        if(item.hasOwnProperty(k) && item.hasOwnProperty(vk)){
            var option = document.createElement('option');
            option.value = item[k];
            option.text = item[vk];
            if(!isNaN(item[k])) var sel = parseInt(item[k]);
            if(sel === def) option.selected = true;
            htmlSelect.add(option);
        }else{
            console.log("either the key or the value key doesn't exist");
        }
    });
};
