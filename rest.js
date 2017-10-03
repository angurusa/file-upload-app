var http = require("http");
var https = require("https");

var options = {
    url: 'https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/040c6b7cd4bd43b936aacd7b7ce3a7f5387b0e5a4da0d27945f3e655bbcca391/cardsservice/getAllCards',
    host: 'service.us.apiconnect.ibmcloud.com/gws/apigateway/api/040c6b7cd4bd43b936aacd7b7ce3a7f5387b0e5a4da0d27945f3e655bbcca391/cardsservice',
    port: 443,
    path: '/getAllCards',
    method: 'GET',
    headers: {
        accept: 'application/json',
        'x-ibm-client-id': 'c9466723-ce3e-490c-9b19-bf052f569bf9'
    }
};

/**
 * getJSON:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */
exports.getJSON = function(options, onResult)
{
    console.log("rest::getJSON");

    var port = options.port == 443 ? https : http;
    var req = port.request(options, function(res)
    {
        var output = '';
        console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            onResult(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        //res.send('error: ' + err.message);
    });

    req.end();
};


res.getJSON(options, function(statusCode, result) {
    // I could work with the result html/json here.  I could also just return it
    console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    res.statusCode = statusCode;
    res.send(result);
});
