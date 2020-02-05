function extractHTML(paramURL)
{
    //const request = require(['request'], function (request) {});
    //request('https://news.ycombinator.com', function (error, response, html) {
        //if (!error && response.statusCode == 200) {
            //console.log(html);
        //}
    //});

    //$.ajax({
         //url: 'http://www.whateverorigin.org/get?url=' + encodeURIComponent(paramURL) + '&callback=?',
         //dataType: 'text',
         //success: function(data) {
              //var elements = $("<div>").html(data)[0].getElementsByTagName("title");
              //for (var i = 0; i < elements.length; i++) {
                    //var theText = elements[i].firstChild.nodeValue;
                    //// Do something here
                    //alert(theText);
              //}
         //}
    //});

    $.get('http://www.whateverorigin.org/get?url=' + encodeURIComponent(paramURL) + '&callback=?', function(response) {
        console.log(response);
        alert(response);
    });
    return "";
}

function clearURLField() {
    document.getElementById('inputURL').value = '';
}