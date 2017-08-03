// Set testing or production API key
var api_key_test = 'AIzaSyAnVtjnSaDRbK6gFfMT4WGTjMsGeayetQc';
var api_key_production = 'AIzaSyAwS5_NRmOWVflqxz8WtxmShSBBxIGX6eQ';
var api_key = (location.hostname == '127.0.0.1' ? api_key_test : api_key_production);

// Identifier for the research database spreadsheet
var spreadsheet_id = '1fZQS-MFG6Dvk7TtqQOjC6-F7RLXZmQLlDUQ72cSgEfw';

var data = {};

var scripts = [{'src':'https://apis.google.com/js/api.js'}, {'src':'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js'}];
var loaded = 0;
var t = null;

function load_scripts() {
	var load_time = performance.now();
	for (var i=0; i<scripts.length; i++) {
		scripts[i].script_element = document.createElement("script");
		scripts[i].loaded = false;
		var elt = scripts[i].script_element;
		elt.src = scripts[i].src;
		elt.type = 'text/javascript';
		elt.index = i;
		elt.onload = function() {
			scripts[this.index].loaded = true;
			console.log('Dynamically loaded script ' + scripts[this.index].src + ' (' + Math.floor(performance.now() - load_time) + 'ms)');
			for (var j=0; j<scripts.length; j++) {
				if (!scripts[j].loaded) return;
			}
			research_1();
		};
		document.getElementsByTagName("head")[0].appendChild(elt);
	}
}
load_scripts();

// Authorize Google Sheets API object
var gapi_load_time;
function research_1() {

    // Authorize the API object
    gapi_load_time = performance.now();
    gapi.load('client:auth2', function() {
        gapi.client
            .init({'apiKey': api_key, 'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4']})
            .then(research_2);
    });
}

// Get data from the spreadsheet
var script_tag;
function research_2() {

	// Find the script tag
	script_tag = ($('script').filter(function(index, value) {
		return value.src.includes('research.js')
	}));

	console.log('Authorized Google API object (' + Math.floor(performance.now() - gapi_load_time) + 'ms)');

    var script_element = document.getElementById('script-programme');

	var ranges = ["Papers", "Talks", "Updates"];
    var params = {
        spreadsheetId: spreadsheet_id,
        ranges: ranges,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
    };
    var request = gapi.client.sheets.spreadsheets.values.batchGet(params);
    var data_request_time = performance.now();
    request.then(function(response) {
    	console.log('Received spreadsheet data (' + Math.floor(performance.now() - data_request_time) + 'ms)');
        var results = response.result.valueRanges;
        for (var i=0; i<results.length; i++) {
        	data[ranges[i].toLowerCase()] = process_spreadsheet_data(results[i].values);
        }
        process_updates();
    }, function (reason) {
    	console.error('error: ' + reason.result.error.message);
    });
}

function process_updates() {
	var now = new Date();

	$('<h3 id="heading-future">The future</h3>').insertBefore(script_tag);
	$ul_future = $('<ul id="ul-future"></ul>').insertBefore(script_tag);
	$('<h3 id="heading-past">The past</h3>').insertBefore(script_tag);
	$ul_past = $('<ul id="ul-past"></ul>').insertBefore(script_tag);

	for (var i=0; i<data.updates.length; i++) {
		var update = data.updates[i];
		var target = (new Date(update.date) < now ? $ul_past : $ul_future)
		var $li = $('<li><b>' + update.date + '.</b> ' + update.text + '</li>').appendTo(target);
		$li[0].date = new Date(update.date);
	}

	$('#ul-future>li').sort(function(a, b) {
		return b.date - a.date;
	}).detach().appendTo('#ul-future');
	$('#ul-past>li').sort(function(a, b) {
		return b.date - a.date;
	}).detach().appendTo('#ul-past');
}

function process_spreadsheet_data(response) {
    if (!response) return null;
    var header = response[0];
    if (!header) return;
    for (var i=0; i<header.length; i++) {
        header[i] = header[i].toLowerCase().replace(/ /g,"_");
    }
    var array = [];
    for (var row=1; row<response.length; row++) {
        var obj = {};
        for (var field=0; field < header.length; field ++) {
            obj[header[field]] = response[row][field];
        }
        array.push(obj);
    }
    return array;
}

