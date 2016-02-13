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