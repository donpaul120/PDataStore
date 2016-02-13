# PDataStore

#Synopsis
PDataStore retrieves data from a data-source in html, saves the data into memory and provides quick access to this data.
You can therefore also convert stored data to certain HTMLElements e.g HTMLSelectElement options

## Code Example

PDataStore will search for an element with the id "p-store"
This div should hold all data-sources as an attribute.
``<div id="p-store"></div>``

Inject data-sources to the store like this:
`` div id="p-store" data-books='[{"id":"1", "book_name":"PDataStore Book"},{}]'></div>``

An Example Using PHP(Laravel) and Blade Template:

```php
    function __construct(BooksInterface $books){
        //You can as well pass the url for PDataStore to fetch the books
        $this->data['book_source'] = route('get.all.books');
    }

    function getHomePageWithBooks(Request $request){
        $this->data['books'] = Books::findAll()->toJson();
        return $this->view('my.view')->with($this->data);//pass the data to the view
    }
```

```html
    <!--Inject the data-->
    <div id=p-store data-source-books='{{$books}}' data-book-route='{{book_source}}'></div>
```

PDataStore Implementation
We will use PDataStore to load the list of books to an HTMLSelectElement

```javascript
    var PDataStore = require('pdatastore');
    function Books(){
        var pStore = new PDataStore();
        //so we are looking for all books in data-source-books whose authors name is equals paul
        var result = pStore.findDataByKeyValue('authors_name', 'paul', 'data-source-books').result;
        
        /**you can as well load the data into an htmlSelectElement.
         *  You only have to pass the parameters;
         *  id : is the key that its value will be the HTMLOptionElement value
         *  authors_name : is the key that its value will be the text of the HTMLOptionElement
         *  books : The input name of HTMLSelectElement
         *  2 : The default value of the HTMLOption
         **/
        pStore.findDataByKeyValue('authors_name', 'paul', 'data-books').toHtmlList('id', 'authors_name', 'books', '2');
    }
```

We can also Load all Data Source At Once into Memory.
```javascript
    var PDataStore = require('pdatastore');
    function Books(){
        //initialize PDataStore and pass a boolean to its contructor.
        //This will automatically load all data to memory on page load
        var pStore = new PDataStore(true);
    }
```



## Installation
npm install pdatastore


## Tests
open the file pdatastoretest.html in your browser

## License
MIT