
var CURRENCY_SERVICE_URL = "http://api.fixer.io/latest";
var refreshTimeDelay = 5000;
var continousLoad;

var app = angular.module("currencyCalc", ["ngStorage", "ngAnimate"]);

app.directive("inputBlock", function($parse) {
    return {
        scope: {
            inputBlockLength: "="
        },
        link: function(scope, elm, attrs) {
            elm.bind("keypress", function(e) {
                if (elm[0].value.length > scope.inputBlockLength) {
                    e.preventDefault();
                    return false;
                }
            });
        }
    };
});

app.filter("myFormat", function() {
    return function(obj, currentCur) {

        var myArray = [];
        for (var c in obj) {
            if (obj[c]["currency"] != currentCur) {
                myArray.push(obj[c]);
            }
        }

        // myArray =  _.sortBy(myArray,['currency']);
        myArray = _.orderBy(myArray, ["currency"], ["asc"]);

        return myArray;
    };
});

app.controller("CalcController", ["$scope", "$http", "$localStorage", function($scope, $http, $localStorage) {

    $scope.validLength = 8;
    $scope.parsedList = [];
    $scope.selectedCur = "EUR";
    //$localStorage.$reset();
    loadData();

    function loadData() {
        console.log("LOAD DATA!");
        if (isInternet()) {
            $http({
                method: "GET",
                url: CURRENCY_SERVICE_URL
            }).then(function mySucces(response) {
                $scope.currencyData = response.data;
                $localStorage.curData = $scope.currencyData;
                $scope.netConnectivity = 0; // CONNECTED!
                parseData();
                //console.log("netcon0");
            }, function myError(response) {
                console.log("ERROR STATUS = " + response.statusText);
                $scope.netConnectivity = 1; // CONNECTION ERROR
                continousLoad = setTimeout(loadData, refreshTimeDelay);
                //console.log("netcon1");
            });
        } else {
            if ($localStorage.curData != null) {
                $scope.netConnectivity = 2; // NOT CONNECTED AND RETRIEVE PAST DATA IF EXISTS
                $scope.currencyData = $localStorage.curData;
                parseData();
                //console.log("netcon2");
            } else { // NOT CONNECTED TRY TO CONNECT TO THe INTERNET
                $scope.netConnectivity = 3;
                clearInterval(continousLoad);
                continousLoad = setTimeout(loadData, refreshTimeDelay);
                //console.log("netcon3");
            }
        }
    }

    function parseData() {
        $scope.currencyData.rates["EUR"] = 1;
        fx.rates = $scope.currencyData.rates;
        for (var cu in $scope.currencyData.rates) {
            if (cu) {
                var cuVal = $scope.currencyData.rates[cu];
                var parsedObject = {
                    "rate": cuVal,
                    "currency": cu
                };
                $scope.parsedList.push(parsedObject);
            }
        }
        $scope.parsedList = _.orderBy($scope.parsedList, ["currency"], ["asc"]);
    }

    $scope.currencyChanged = function(money, cur) {
        if (cur != null && money != null) {
            $scope.currencyList = [];

            for (var i = 0; i < $scope.parsedList.length; i++) {
                // console.log("cur = " + $scope.parsedList[i]['currency'] + " ,rate = " + $scope.parsedList[i]['rate']);
                var tmpCur = $scope.parsedList[i]["currency"];
                var rate = fx(money).from(cur).to(tmpCur).toFixed(4);

                var currObject = {
                    "amount": money,
                    "base": cur,
                    "rate": rate,
                    "currency": tmpCur
                };
                $scope.currencyList.push(currObject);
            }
        } else {
            $scope.currencyList = []; // reset the list when the input cash amount field is empty
        }
    };

    // check if there is Internet connectivity
    function isInternet() {
        var xhr = new XMLHttpRequest();
        var file = CURRENCY_SERVICE_URL;
        var randomNum = Math.round(Math.random() * 10000);
        xhr.open("HEAD", file + "?rand=" + randomNum, false);
        try {
            xhr.send();
            if (xhr.status >= 200 && xhr.status < 304) {
                console.log("XHR status = " + xhr.status);
                return true;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }
}]);

//add eventListener for tizenhwkey
document.addEventListener("tizenhwkey", function(e) {
    if (e.keyName == "back") {
        try {
            tizen.application.getCurrentApplication().exit();
        } catch (error) {
            console.error("getCurrentApplication(): " + error.message);
        }
    }
});