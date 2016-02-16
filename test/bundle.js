(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return pattern.test(str);
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

},{}],2:[function(require,module,exports){
var PDataStore = require('../lib/pdatastore.js');
var pStore = new PDataStore();


describe('PDataStore', function(){

    describe('#retrieveData', function(){
        it("Should return null if the data-source doesn't exist <--> ", function(){
            var data = pStore.retrieveData("data-mole");
            assert(null === data, 'The result returned from retrieveData isnt null');
        });
    });


    describe('#findDataByKey', function(){
        it('should return an empty array if the data source doesnt exist -- ', function(){
            var result = pStore.findDataByKeyValue('s', 'b', 'data-source-no-exist').result;
            assert(0 === result.length, 'the result is not empty');
        });
    });

    describe('#findDataByKey on a Wrong Data Source Format', function(){
        it('should throw Error if the data source value isn;t in a json or url format-- ', function(){
            var result;
            try{
               result = pStore.findDataByKeyValue('k', 'v', 'data-wrong-format');
            }catch (e){
                if(e){
                    assert(e instanceof Error)
                }
            }
            if(result){
                assert(false);
            }
        });
    })

});
},{"../lib/pdatastore.js":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi4uL2xpYi9wZGF0YXN0b3JlLmpzIiwidGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQGF1dGhvciBPa2VrZSBQYXVsXG4gKlxuICogTGljZW5jZSA6IE1JVC5cbiAqXG4gKiBARGVzY3JpcHRpb24gUERhdGFTdG9yZSByZXF1aXJlcyB0aGF0IGEgZGl2IHdpdGggdGhlIElEIHAtc3RvcmUgTVVTVCBleGlzdFxuICogICAgICAgICAgICAgIGFuZCB0aGF0IHRoaXMgZGl2IHdpbGwgY29udGFpbiBhbGwgZGF0YSBpbnRlbmRlZCB0byBiZSBsb2FkZWQgaW50byBtZW1vcnkuXG4gKiAgICAgICAgICAgICAgVG8gc2F2ZSBhIGRhdGEgaW50byBwLXN0b3JlIGNyZWF0ZSBhbiBhdHRyaWJ1dGUgb24gdGhlIGRpdiB3aGljaCB3aWxsIHNlcnZlIGFzXG4gKiAgICAgICAgICAgICAgdGhlIGRhdGFTb3VyY2Ugd2hlcmUgUERhdGFTdG9yZSB3aWxsIHJldHJpZXZlIGl0cyB2YWx1ZXMgZnJvbS5cbiAqICAgICAgICAgICAgICBAZXhhbXBsZSA6IDxkaXYgaWQ9J3Atc3RvcmUnIGRhdGEtc291cmNlMT0nanNvbl9zdHJpbmcnIGRhdGEtc291cmNlMj0naHR0cDovL3VybC90by9mZXRjaC9qc29uJz48L2Rpdj5cbiAqICAgICAgICAgICAgICBQRGF0YVN0b3JlIHdpbGwgZmV0Y2ggaXRzIGRhdGEgZnJvbSB0aGUgZGF0YVNvdXJjZSBhbmQgd2lsbCBjYWNoZSBpdCBpbnRvIGl0cyBtZW1vcnkuXG4gKiAgICAgICAgICAgICAgSGVuY2UgeW91ciBIVE1MIHBhZ2Ugd291bGRuJ3QgY29udGFpbiBhbWJpZ3VvdXMgZGF0YSBldmVuIHdoZW4geW91IHZpZXcgdGhlIHBhZ2Ugc291cmNlLlxuICpcbiAqICAgICAgICAgICAgICBQbGVhc2Ugbm90ZSB0aGF0IFBEYXRhU3RvcmUgcmVxdWlyZXMgdGhhdCB0aGUgZGF0YVNvdXJjZSBpcyBhIHZhbGlkIGpzb24gb3IgYSB2YWxpZCB1cmxcbiAqICAgICAgICAgICAgICB0byBmZXRjaCBqc29uIGRhdGEsIGlmIG5vdCBQRGF0YVNvcmUgd2lsbCB0aHJvdyBFcnJvci5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gUERhdGFTdG9yZTtcblxuZnVuY3Rpb24gUERhdGFTdG9yZShzeW5jKXtcbiAgICB0aGlzLnBTdG9yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwLXN0b3JlJyk7Ly9naXZlbiB0aGF0IGFsbCBkYXRhIHdpbGwgYmUgbG9hZGVkIHRvIHRoaXMgZGl2XG4gICAgaWYodGhpcy5wU3RvcmU9PW51bGwpIHRocm93IG5ldyBFcnJvcignVG8gdXNlIFBEYXRhU3RvcmUgeW91IG11c3Qgc3BlY2lmeSBhIGRpdiB3aXRoIHRoZSBpZCBwLXN0b3JlJyk7XG4gICAgdGhpcy5wQ2FjaGUgPSB7fTtcbiAgICAod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdwLWRhdGEtc3RvcmUtY2FjaGUnKT09PW51bGwpXG4gICAgICAgID8gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdwLWRhdGEtc3RvcmUtY2FjaGUnLCBKU09OLnN0cmluZ2lmeSh0aGlzLnBDYWNoZSkpXG4gICAgICAgIDogdGhpcy5wQ2FjaGUgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgncC1kYXRhLXN0b3JlLWNhY2hlJykpO1xuICAgIGlmKHN5bmMpIHRoaXMuc3luY2hyb25pemVEYXRhKCk7XG4gICAgdGhpcy5yZXN1bHQgPSBbXTtcbn1cblxuUERhdGFTdG9yZS5wcm90b3R5cGUuc3luY2hyb25pemVEYXRhID0gZnVuY3Rpb24oKXtcbiAgICAvL3N5bmNocm9uaXplIGRhdGEgd2lsbCBsb2FkIGFsbCB0aGUgZGF0YSB0byB0aGUgc3RvcmFnZSBhdCBvbmNlIGJlZm9yZSBhbnkgZXZlbnQgaXMgdHJpZ2dlcmVkXG4gICAgdmFyIGRhdGFQb29sID0gdGhpcy5wU3RvcmUuYXR0cmlidXRlcztcbiAgICBmb3IodmFyIGk9MDtpPGRhdGFQb29sLmxlbmd0aDtpKyspe1xuICAgICAgICB2YXIgbmFtZWROb2RlID0gZGF0YVBvb2xbaV07Ly9hIG5hbWVkIG5vZGUgaXMgc2FtZSB0aGluZyBhcyBhdHRyaWJ1dGVzIGluIGpzLi4gOilcbiAgICAgICAgaWYobmFtZWROb2RlLm5hbWUhPT0naWQnKXtcbiAgICAgICAgICAgIGlmKHRoaXMuaXNKc29uKG5hbWVkTm9kZS5ub2RlVmFsdWUpKXtcbiAgICAgICAgICAgICAgICB0aGlzLnBDYWNoZVtuYW1lZE5vZGUubmFtZV0gPSBKU09OLnBhcnNlKG5hbWVkTm9kZS5ub2RlVmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZih0aGlzLmlzVmFsaWRVcmwobmFtZWROb2RlLm5vZGVWYWx1ZSkpe1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0KG5hbWVkTm9kZS5ub2RlVmFsdWUsIG5hbWVkTm9kZS5uYW1lLCBmdW5jdGlvbihyZXN1bHQsIHNyYyl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucENhY2hlW3NyY10gPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3RvcmFnZSgpO1xuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5QRGF0YVN0b3JlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbih1cmwsIHNyY05hbWUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHJlcS5vcGVuKCdHRVQnLCB1cmwpO1xuICAgIC8vbW9zdCB3ZWIgZnJhbWV3b3JrIG1pZ2h0IGNoZWNrIGlmIGl0cyBuIGFqYXggcmVxdWVzdCBzbyB3ZSBzZXQgdGhlIGhlYWRlclxuICAgIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0Jyk7XG4gICAgcmVxLm9ubG9hZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gMjAwKSBjYWxsYmFjayh0aGlzLnJlc3BvbnNlLCBzcmNOYW1lKTtcbiAgICB9O1xuICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAvL3dlIGNhbiBldmVuIHRyeSB0aGlzIG1vcmUgdGltZXMuLi4gdXNpbmcgYW4gZXhwb25lbnRpYWwgY2FsbGJhY2sgZnVuY3Rpb24uLiBobW0gbGF0ZXJcbiAgICAgICAgLy90aGlzLmdldCh1cmwsIGNhbGxiYWNrKTtcbiAgICB9O1xuICAgIHJlcS5yZXNwb25zZVR5cGUgPSBcImpzb25cIjtcbiAgICByZXEuc2VuZCgpO1xufTtcblxuUERhdGFTdG9yZS5wcm90b3R5cGUuaXNKc29uID0gZnVuY3Rpb24oc3RyKXtcbiAgICB0cnl7XG4gICAgICAgIEpTT04ucGFyc2Uoc3RyKVxuICAgIH1jYXRjaChlKXtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cblBEYXRhU3RvcmUucHJvdG90eXBlLmlzVmFsaWRVcmwgPSBmdW5jdGlvbihzdHIpe1xuICAgIHZhciBwYXR0ZXJuID0gbmV3IFJlZ0V4cCgnXihodHRwcz86XFxcXC9cXFxcLyk/JysgLy8gcHJvdG9jb2xcbiAgICAgICAgJygoKFthLXpcXFxcZF0oW2EtelxcXFxkLV0qW2EtelxcXFxkXSkqKVxcXFwuPykrW2Etel17Mix9fCcrIC8vIGRvbWFpbiBuYW1lXG4gICAgICAgICcoKFxcXFxkezEsM31cXFxcLil7M31cXFxcZHsxLDN9KSknKyAvLyBPUiBpcCAodjQpIGFkZHJlc3NcbiAgICAgICAgJyhcXFxcOlxcXFxkKyk/KFxcXFwvWy1hLXpcXFxcZCVfLn4rXSopKicrIC8vIHBvcnQgYW5kIHBhdGhcbiAgICAgICAgJyhcXFxcP1s7JmEtelxcXFxkJV8ufis9LV0qKT8nKyAvLyBxdWVyeSBzdHJpbmdcbiAgICAgICAgJyhcXFxcI1stYS16XFxcXGRfXSopPyQnLCdpJyk7IC8vIGZyYWdtZW50IGxvY2F0b3JcbiAgICByZXR1cm4gcGF0dGVybi50ZXN0KHN0cik7XG59O1xuXG5QRGF0YVN0b3JlLnByb3RvdHlwZS51cGRhdGVTdG9yYWdlID0gZnVuY3Rpb24oKXtcbiAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3AtZGF0YS1zdG9yZS1jYWNoZScsIEpTT04uc3RyaW5naWZ5KHRoaXMucENhY2hlKSk7XG59O1xuXG5QRGF0YVN0b3JlLnByb3RvdHlwZS5yZXRyaWV2ZURhdGEgPSBmdW5jdGlvbihhdHRyKXtcbiAgICB2YXIgZGF0YSA9IG51bGw7XG4gICAgaWYodGhpcy5wQ2FjaGUuaGFzT3duUHJvcGVydHkoYXR0cikpe1xuICAgICAgICBkYXRhID0gdGhpcy5wQ2FjaGVbYXR0cl07XG4gICAgfWVsc2UgaWYodGhpcy5wU3RvcmUuaGFzQXR0cmlidXRlKGF0dHIpKXtcbiAgICAgICAgLy93ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIHZhbGlkIHVybFxuICAgICAgICB2YXIgYXR0clZhbCA9IHRoaXMucFN0b3JlLmdldEF0dHJpYnV0ZShhdHRyKTtcbiAgICAgICAgaWYodGhpcy5pc0pzb24oYXR0clZhbCkpe1xuICAgICAgICAgICAgZGF0YSA9IHRoaXMucENhY2hlW2F0dHJdID0gSlNPTi5wYXJzZShhdHRyVmFsKTtcbiAgICAgICAgfWVsc2UgaWYodGhpcy5pc1ZhbGlkVXJsKGF0dHJWYWwpKXtcbiAgICAgICAgICAgIHRoaXMuZ2V0KGF0dHJWYWwsIGF0dHIsIGZ1bmN0aW9uKHJlc3VsdCwgc3JjKXtcbiAgICAgICAgICAgICAgICB0aGlzLnBDYWNoZVtzcmNdID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3RvcmFnZSgpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgRGF0YSBTb3VyY2UgRm9ybWF0IFNwZWNpZmllZDsgJyArXG4gICAgICAgICAgICAgICAgJ0RhdGEgc291cmNlIGNhbiBlaXRoZXIgYmUganNvbiBvciBhIHVybCB0aGF0IHdpbGwgJyArXG4gICAgICAgICAgICAgICAgJ2JlIHVzZWQgdG8gZmV0Y2ggdGhlIGRhdGEnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZVN0b3JhZ2UoKTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGE7XG59O1xuXG4vKipcbiAqIEBhdXRob3IgT2tla2UgUGF1bFxuICogQHBhcmFtIHtTdHJpbmd9IGsgLSB0aGUga2V5IG5hbWUgdG8gc2VhcmNoLlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2IC0gdGhlIHZhbHVlIHRvIHNlYXJjaCBhbmQgY29tcGFyZSB3aXRoIHRoZSB2YWx1ZSBvZiBAcGFyYW0gay5cbiAqIEBwYXJhbSB7U3RyaW5nfSBhdHRyIC0gdGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0aGF0IGhvbGRzIHRoZSBvcmlnaW5hbCBkYXRhIHRvIHBlcmZvcm0gYSBzZWFyY2ggb24uXG4gKiBAcmV0dXJucyB7UERhdGFTdG9yZX1cbiAqL1xuUERhdGFTdG9yZS5wcm90b3R5cGUuZmluZERhdGFCeUtleVZhbHVlID0gZnVuY3Rpb24oaywgdiwgYXR0cil7XG4gICAgdmFyIGRhdGEgPSB0aGlzLnJldHJpZXZlRGF0YShhdHRyKTtcbiAgICB2YXIgcmVzdWx0ID0gW107Ly9hcnJheSBvZiBhbGwgbWF0Y2ggd2hlcmUgcm93LmsgPT09IHZcbiAgICBpZihkYXRhKXtcbiAgICAgICAgZm9yKHZhciBqPTA7ajxkYXRhLmxlbmd0aDtqKyspe1xuICAgICAgICAgICAgdmFyIHJvdyA9IGRhdGFbal07XG4gICAgICAgICAgICB2YXIgcyA9IHJvd1trXTtcbiAgICAgICAgICAgIGlmKCFpc05hTih2KSkgeyB2ID0gcGFyc2VJbnQodik7ICBzID0gcGFyc2VJbnQocm93W2tdKX1cbiAgICAgICAgICAgIGlmKHMgPT09IHYpe1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wU3RvcmUucmVtb3ZlQXR0cmlidXRlKGF0dHIpOy8vbGV0cyByZW1vdmUgaXQgZnJvbSB0aGUgcGFnZS4uLiB3ZSBkb24ndCBuZWVkIGl0IHRoZXJlIGFueW1vcmVcbiAgICB9XG4gICAgdGhpcy5yZXN1bHQgPSByZXN1bHQ7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5QRGF0YVN0b3JlLnByb3RvdHlwZS5sb2FkRGF0YUZyb21Tb3VyY2UgPSBmdW5jdGlvbihkYXRhU291cmNlKXtcbiAgICB0aGlzLnJlc3VsdCA9IHRoaXMucmV0cmlldmVEYXRhKGRhdGFTb3VyY2UpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuUERhdGFTdG9yZS5wcm90b3R5cGUuZ2V0UmVzdWx0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gdGhpcy5yZXN1bHQ7XG59O1xuXG4vKipcbiAqIEBhdXRob3IgT2tla2UgUGF1bFxuICogQHBhcmFtIHtTdHJpbmd9IGsgLSB0aGUga2V5IHRoYXQgaXRzIHZhbHVlIHdpbGwgYmVjb21lIHRoZSB2YWx1ZSBvZiB0aGUgSFRNTE9wdGlvbkVsZW1lbnRcbiAqIEBwYXJhbSB7U3RyaW5nfSB2ayAtIHRoZSBrZXkgdGhhdCBpdHMgdmFsdWUgd2lsbCBiZWNvbWUgdGhlIHRleHQgb2YgdGhlIEhUTUxPcHRpb25FbGVtZW50XG4gKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0TmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBIVE1MU2VsZWN0RWxlbWVudCB0aGF0IHdpbGwgaG9sZCB0aGUgbGlzdCBkYXRhXG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IGRlZiAtIHRoaXMgaXMgZGVmYXVsdCB2YWx1ZSB0aGF0IHNob3VsZCBiZSBzZWxlY3RlZCBpbiB0aGUgbGlzdFxuICovXG5QRGF0YVN0b3JlLnByb3RvdHlwZS50b0h0bWxMaXN0ID0gZnVuY3Rpb24oaywgdmssIHNlbGVjdE5hbWUsIGRlZil7XG4gICAgaWYoIWlzTmFOKGRlZikpIGRlZiA9IHBhcnNlSW50KGRlZik7XG4gICAgdmFyIGh0bWxTZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZShzZWxlY3ROYW1lKVswXTtcbiAgICBpZighaHRtbFNlbGVjdCBpbnN0YW5jZW9mIEhUTUxTZWxlY3RFbGVtZW50KSB0aHJvdyBuZXcgVHlwZUVycm9yKCd0aGUgc2VsZWN0TmFtZSBtdXN0IGJlIGEgbmFtZSBvZiBhIEhUTUxTZWxlY3RFbGVtZW50Jyk7XG4gICAgaHRtbFNlbGVjdC5vcHRpb25zLmxlbmd0aCA9IDA7XG4gICAgdmFyIG9iaj0ge307IG9ialtrXSA9ICcnOyBvYmpbdmtdID0gJy0tIFNlbGVjdCBhbiBpdGVtIC0tJztcbiAgICB0aGlzLnJlc3VsdC51bnNoaWZ0KG9iaik7XG4gICAgdGhpcy5yZXN1bHQuZm9yRWFjaChmdW5jdGlvbihpdGVtLCBpbmRleCwgaSl7XG4gICAgICAgIGlmKGl0ZW0uaGFzT3duUHJvcGVydHkoaykgJiYgaXRlbS5oYXNPd25Qcm9wZXJ0eSh2aykpe1xuICAgICAgICAgICAgdmFyIG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgICAgICAgICAgb3B0aW9uLnZhbHVlID0gaXRlbVtrXTtcbiAgICAgICAgICAgIG9wdGlvbi50ZXh0ID0gaXRlbVt2a107XG4gICAgICAgICAgICBpZighaXNOYU4oaXRlbVtrXSkpIHZhciBzZWwgPSBwYXJzZUludChpdGVtW2tdKTtcbiAgICAgICAgICAgIGlmKHNlbCA9PT0gZGVmKSBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaHRtbFNlbGVjdC5hZGQob3B0aW9uKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVpdGhlciB0aGUga2V5IG9yIHRoZSB2YWx1ZSBrZXkgZG9lc24ndCBleGlzdFwiKTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcbiIsInZhciBQRGF0YVN0b3JlID0gcmVxdWlyZSgnLi4vbGliL3BkYXRhc3RvcmUuanMnKTtcbnZhciBwU3RvcmUgPSBuZXcgUERhdGFTdG9yZSgpO1xuXG5cbmRlc2NyaWJlKCdQRGF0YVN0b3JlJywgZnVuY3Rpb24oKXtcblxuICAgIGRlc2NyaWJlKCcjcmV0cmlldmVEYXRhJywgZnVuY3Rpb24oKXtcbiAgICAgICAgaXQoXCJTaG91bGQgcmV0dXJuIG51bGwgaWYgdGhlIGRhdGEtc291cmNlIGRvZXNuJ3QgZXhpc3QgPC0tPiBcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcFN0b3JlLnJldHJpZXZlRGF0YShcImRhdGEtbW9sZVwiKTtcbiAgICAgICAgICAgIGFzc2VydChudWxsID09PSBkYXRhLCAnVGhlIHJlc3VsdCByZXR1cm5lZCBmcm9tIHJldHJpZXZlRGF0YSBpc250IG51bGwnKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cblxuICAgIGRlc2NyaWJlKCcjZmluZERhdGFCeUtleScsIGZ1bmN0aW9uKCl7XG4gICAgICAgIGl0KCdzaG91bGQgcmV0dXJuIGFuIGVtcHR5IGFycmF5IGlmIHRoZSBkYXRhIHNvdXJjZSBkb2VzbnQgZXhpc3QgLS0gJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBwU3RvcmUuZmluZERhdGFCeUtleVZhbHVlKCdzJywgJ2InLCAnZGF0YS1zb3VyY2Utbm8tZXhpc3QnKS5yZXN1bHQ7XG4gICAgICAgICAgICBhc3NlcnQoMCA9PT0gcmVzdWx0Lmxlbmd0aCwgJ3RoZSByZXN1bHQgaXMgbm90IGVtcHR5Jyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJyNmaW5kRGF0YUJ5S2V5IG9uIGEgV3JvbmcgRGF0YSBTb3VyY2UgRm9ybWF0JywgZnVuY3Rpb24oKXtcbiAgICAgICAgaXQoJ3Nob3VsZCB0aHJvdyBFcnJvciBpZiB0aGUgZGF0YSBzb3VyY2UgdmFsdWUgaXNuO3QgaW4gYSBqc29uIG9yIHVybCBmb3JtYXQtLSAnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgIHJlc3VsdCA9IHBTdG9yZS5maW5kRGF0YUJ5S2V5VmFsdWUoJ2snLCAndicsICdkYXRhLXdyb25nLWZvcm1hdCcpO1xuICAgICAgICAgICAgfWNhdGNoIChlKXtcbiAgICAgICAgICAgICAgICBpZihlKXtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KGUgaW5zdGFuY2VvZiBFcnJvcilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihyZXN1bHQpe1xuICAgICAgICAgICAgICAgIGFzc2VydChmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG5cbn0pOyJdfQ==
