function extractHTML(paramURL)
{
    //let s = new XMLSerializer().serializeToString(document);
    $.get('http://www.whateverorigin.org/get?url=' + encodeURIComponent(paramURL) + '&callback=?', function(response) { 
        console.log(response);
        alert(response);
    });
    return "";
}

function clearURLField() {
    document.getElementById('inputURL').value = '';
}