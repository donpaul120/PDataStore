# PDataStore

#Synopsis
PDataStore retrieves data from a data-source in an HTMLElement, saves the data into memory and provides quick access to this data.
You can therefore also convert stored data to certain HTMLElements e.g HTMLSelectElement options


## PDataStore Implementation


### Injecting the data (data sources)

PDataStore will search for an element with the id "p-store"
This div should hold all data-sources as an attribute.

```html
<div id="p-store"></div>
```

Inject data-sources to the store like this:
```html
<div id="p-store" data-books='[{
        "id":"1", 
        "book_name":"PDataStore Book", 
        "author_name":"Paul"
     }]'>
</div>
```
Note:: PDataStore loads data from its sources, saves it into memory and removes loaded data-sources from **p-store**.

You can as well pass the url to where PDataStore will fetch the data as the data-source value

```html
<!--Inject the data: blade templates-->
<div id=p-store data-source-books='{{$books}}' 
                data-book-route='{{$book_source_url}}'></div>
```

### Retrieving and Manipulating Data
We will use PDataStore to load the list of books to a HTMLSelectElement

```javascript
var PDataStore = require('pdatastore');
function Books(){
    var pStore = new PDataStore();
    //so we are looking for all books in data-source-books 
    //whose authors name is equals paul
    var result = pStore.findDataByKeyValue('authors_name', 'paul', 'data-source-books').result;
        
    /**you can as well load the data into an htmlSelectElement.
    *  You only have to pass the parameters;
    *  id : is the key that its value will be the HTMLOptionElement value
    *  authors_name : is the key that its value will be the text of the HTMLOptionElement
    *  books : The input name of HTMLSelectElement
    *  2 : The default value of the HTMLOption
    **/
    pStore.findDataByKeyValue('authors_name', 'paul', 'data-books')
            .toHtmlList('id', 'authors_name', 'books', '2');
}
```

We can also Load all Data Source At Once into Memory.
We advice you to use this mostly when your data-source contains url to fetch the data.
```javascript
var PDataStore = require('pdatastore');
function Books(){
    //initialize PDataStore and pass a boolean to its contructor.
    //This will automatically load all data to memory on page load
    var pStore = new PDataStore(true);
    
    //or
    
    var pStore = new PDataStore();
    //lets loads all data into memory.. 
    pStore.synchronizeData();
}
```

## More Examples

```html
<div id="p-store" data-source-products='[
    {'id':1,'product_category_id':23, 'product_name':'Samsung S6'},
    {'id':16,'product_category_id':24, 'product_name':'Bournvita'},
    {'id':14,'product_category_id':23, 'product_name':'Blackberry'},
    {'id':4,'product_category_id':25, 'product_name':'Origin'}
    ]'>
</div>
    
<!--form-->
<select name='product_cat'>
    <option value="23">Mobile Devices</option>
    <option value="24">Beverages</option>
    <option value="25">Beer</option>
    <option value="26">Detergent</option>
</select>
    
<select name='products'></select>
```

```javascript
var PDataStore = require('pdatastore');
var pStore = new PDataStore(true);
    
var category = document.getElementsByName('product_cat')[0];
if(category!==null && category!==undefined){
    category.addEventListener('change', function(){
        var value = this.options[this.selectedIndex].value;
        pStore.findDataByKeyValue('product_category_id', value, 'data-source-products')
            .toHtmlList('id', 'product_name', 'products', '14');
    });
    
//JQuery Developers
$('input[name=product_cat]').change(function(){
    pStore.findDataByKeyValue('product_category_id', $(this).va(), 'data-source-products')
            .toHtmlList('id', 'product_name', 'products', '14');
});
}
```

#### Next Example
Try it Out.



## Installation
npm install pdatastore


## Tests
open the file **pdatastoretest.html** in your browser

## License
MIT
