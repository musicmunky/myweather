// this file is all the javascript for the simple weather page setup
// it uses the FUSION library extensively, so see fusionlib.js for all
// functions that start with "FUSION."
// it also uses jQuery, because I'm inherently lazy and jQuery makes life
// so much easier sometimes.

var MYWEATHER = {
	directions:    ["N", "NNE", "NE", "ENE","E", "ESE", "SE", "SSE","S", "SSW", "SW", "WSW","W", "WNW", "NW", "NNW"],
	months:        ["Jan", "Feb", "Mar","Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	days:          ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	validunits:    ["us", "ca"],
	fulldays:      ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    hourfields:    ["hrwind", "hrtempactual", "hrtempapparent"],
    numhourfields: 0,
	convertfields: ["condition", "wind", "wind2", "wind3", "wind4", "wind5", "wind6", "wind7", "wind8",
                                 "high", "high2", "high3", "high4", "high5", "high6", "high7", "high8",
                                 "low", "low2", "low3", "low4", "low5", "low6", "low7", "low8"],
    units: { us: { wind: "mph", temp: "&deg; F" },
             ca: { wind: "kph", temp: "&deg; C" }
    }
};

$( document ).ready(function() {

	//IE doesn't like Google fonts...apparently it's Google's fault
	//at the moment, but whatever...load Web Safe font for IE users
	var gbr = FUSION.get.browser();
	if(gbr.browser && gbr.browser == "IE") {
		document.body.style.fontFamily = "'Trebuchet MS', Helvetica, sans-serif";
	}

	var dzip = FUSION.get.node("defaultzipcode").value;
    MYWEATHER.numhourfields = FUSION.get.node("hourlist").children.length;

	if(supportsHtml5Storage())
	{
		var lsa = [];
		var lso = {};
		var lss = "";

		var u = getUnits();
		FUSION.get.node("units" + u).checked = true;

		for(var i = 0; i < localStorage.length; i++)
		{
			lss = localStorage.getItem(localStorage.key(i));
			if(typeof lss !== undefined && /^geocodeid/.test(localStorage.key(i)))
			{
				//throwing in a try/catch here, due to IE11 creating *weird* items
				//that can not be parsed by JSON.  The match statement above
				//should catch them, but juuuust in case, this will filter out
				//any other weirdness
				try {
					lso = JSON.parse(lss);
					if(lso.place_id) {
						lsa.push(lso);
					}
				}
				catch(err) {
					FUSION.error.logError(err);
				}
			}
		}

		if(lsa.length > 0)
		{
			//sort descending by age, oldest to youngest entries
			try {
				lsa.sort(function(a,b) { return parseInt(a.time_added) - parseInt(b.time_added) } );
			}
			catch(err) {
				console.log("unable to sort - no time_added field");
			}
			//load the first item in the array into the main area
			locationClick(JSON.stringify(lsa[lsa.length - 1]));

			//create location divs for all localStorage items
			for(var j = 0; j < lsa.length; j++)
			{
				addCityDiv(lsa[j]);
			}
		}
		else
		{
			//no existing localStorage item matches, so load the info based on the
			//default zip code (10001)
			runSearch(dzip);
		}
	}
	else
	{
		//if an older browser that does not support localStorage,
		//just load the info by the default Zip code (10001)
		runSearch(dzip);
	}
});


function setUnits(u)
{
	var units = u || "us";
	try {
		if(MYWEATHER.validunits.indexOf(units) > -1){
			localStorage.setItem("defaultunits", units);
		}
		else {
			units = "us";
			FUSION.error.logError(err, "Invalid unit parameter supplied - defaulting to US: ");
			localStorage.setItem("defaultunits", units);
		}

		var jsonfield = null;
		var dispfield = null;

        for(var i = 0; i < MYWEATHER.hourfields.length; i++)
        {
            for(var j = 1; j <= MYWEATHER.numhourfields; j++)
            {
                jsonfield = FUSION.get.node(MYWEATHER.hourfields[i] + j + "_cnvrt");
                dispfield = FUSION.get.node(MYWEATHER.hourfields[i] + j);
                convertFieldValue(units, jsonfield, dispfield);
            }
        }

		for(var i = 0; i < MYWEATHER.convertfields.length; i++)
		{
			jsonfield = FUSION.get.node(MYWEATHER.convertfields[i] + "_cnvrt");
			dispfield = FUSION.get.node(MYWEATHER.convertfields[i]);
            convertFieldValue(units, jsonfield, dispfield);
		}
	}
	catch(err) {
		FUSION.error.logError(err, "Unable to set unit parameter: ");
	}
}


function convertFieldValue(units, jsonfield, displayfield)
{
    if(typeof jsonfield !== null && typeof displayfield !== null)
    {
		var windunits = MYWEATHER.units[units]['wind'];
		var tempunits = MYWEATHER.units[units]['temp'];

        try {
            var jsonvalue = JSON.parse(jsonfield.value);
            if(jsonvalue.units != units) //make sure you don't try to convert unless the units are different!
            {
                var origvalue = parseInt(jsonvalue.value);
                var cvrtvalue = (jsonvalue.type == "wind") ? convertWind(origvalue, units) : convertTemp(origvalue, units);
                var jsonstrng = jsonvalue.text.left + cvrtvalue + jsonvalue.text.right;
                displayfield.innerHTML = (jsonvalue.type == "wind") ? jsonstrng + " " + windunits : jsonstrng + tempunits;

                jsonvalue.value = cvrtvalue;
                jsonvalue.units = units;
                jsonfield.value = JSON.stringify(jsonvalue);
            }
        }
        catch(err) {
            FUSION.error.logError(err, "Error updating unit data for field " + MYWEATHER.convertfields[i] + "_cnvrt: ");
        }
    }
}


function getUnits()
{
	var uval = $("input[name=unitradio]:checked").val();
	var ls = (localStorage.getItem("defaultunits") === null) ? false : true;
	if(ls){
		try {
			uval = localStorage.getItem("defaultunits");
		}
		catch(err) {
			FUSION.error.logError(err, "Unable to retrieve stored unit parameter - defaulting to selected value: ");
		}
	}
	return uval;
}


function convertTemp(t, u)
{
	var ct = 0;
	if(u == "us") //convert from CA to US (metric to imperial)
	{
		//°C to °F	Multiply by 9, then divide by 5, then add 32
		ct = ((t * 9) / 5) + 32;
	}
	else if(u == "ca") //convert from US to CA (imperial to metric)
	{
		//°F to °C	Deduct 32, then multiply by 5, then divide by 9
		ct = ((t - 32) * 5) / 9;
	}
	return Math.round(ct);
}

function convertWind(v, u)
{
	var cw = 0;
	if(u == "us") //convert from CA to US (metric to imperial)
	{
		//1 Kilometer = 0.621371 Miles
		cw = v * 0.621371;
	}
	else if(u == "ca") //convert from US to CA (imperial to metric)
	{
		//1 Mile = 1.60934 Kilometers
		cw = v * 1.60934;
	}
	return Math.round(cw);
}


function supportsHtml5Storage()
{
	//generic function to check if the browser can handle
	//and use localStorage, or if they're living in the stone age
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	}
	catch(err) {
		FUSION.error.logError(err);
		return false;
	}
}


function showPane(t)
{
    var sType = t.id.split("_")[0];
    var aTypes = ["hour", "day", "map", "alerts"];

    for(var i = 0; i < aTypes.length; i++)
    {
        if( aTypes[i] == sType )
        {
            setActive(aTypes[i]);
        }
        else
        {
            setInactive(aTypes[i]);
        }
    }
}


function setInactive(sType)
{
    FUSION.get.node(sType + "_tab_highlight").style.backgroundColor = "#fafafa";
    FUSION.get.node(sType + "_wrapper").style.display = "none";
    FUSION.get.node(sType + "_tab").style.borderBottom = "1px solid #ddd";
    FUSION.get.node(sType + "_tab").style.backgroundColor = "#fafafa";
}


function setActive(sType)
{
    FUSION.get.node(sType + "_tab_highlight").style.backgroundColor = "#666";
    FUSION.get.node(sType + "_wrapper").style.display = "block";
    FUSION.get.node(sType + "_tab").style.borderBottom = "none";
    FUSION.get.node(sType + "_tab").style.backgroundColor = "#fff";
}


function hideSearchDiv(t)
{
	if(FUSION.lib.isBlank(t.value)){
		var ls = FUSION.get.node("locselect");
		ls.style.height = "0px";
		ls.innerHTML = "";
		ls.style.display = "none";
	}
}


function runSearch(s)
{
	var val = s || FUSION.get.node("searchbox").value;
	if(FUSION.lib.isBlank(val)){
		var atxt  = "<p style='margin:15px 5px 5px;text-align:center;font-size:16px;font-weight:bold;color:#D00;'>";
			atxt += "Please enter a search string!";
			atxt += "</p>";
		FUSION.lib.alert(atxt);
		return false;
	}

	val = val.replace(/\s/ig, "+");
	var units = $("input[name=unitradio]:checked").val();
	var info = {
		"type": "GET",
		"path": "pages/1/getForecastSearch",
		"data": {
			"search": val,
			"units":  units
		},
		"func": runSearchResponse
	};
	FUSION.lib.ajaxCall(info);
}


function locationClick(h)
{
	var hash = JSON.parse(h);
	var units = $("input[name=unitradio]:checked").val();
	var info = {
		"type": "GET",
		"path": "pages/1/getForecastLatLong",
		"data": {
			"geoinfo": hash,
			"units":   units
		},
		"func": runSearchResponse
	};
	FUSION.lib.ajaxCall(info);
}


function runSearchResponse(h)
{
	var hash = h || {};
	var rc = hash['geodata']['count'];
	if(parseInt(rc) > 1)
	{
		var locsel = FUSION.get.node("locselect");
		locsel.innerHTML = "";

		var geoinfo = {};
		var locs = 0;
		for(var key in hash['geodata']['data'])
		{
			if(locs < 5)
			{
				locs++;
				geoinfo = hash['geodata']['data'][key];
				var div = FUSION.lib.createHtmlElement({"type":"div",
														"attributes":{"class":"loclinkdiv"}});
				var lnk = FUSION.lib.createHtmlElement({"type":"a","text":geoinfo.formatted_address,
														"onclick":"locationClick('" + JSON.stringify(geoinfo) + "')",
													    "attributes":{
															"class":"locationresult",
															"href":"javascript:void(0)" }});
				div.appendChild(lnk);
				locsel.appendChild(div);
			}
		}
		locsel.style.height = (locs * 40) + "px";
		locsel.style.display = "block";
	}
	else
	{
		processForecast(hash);
	}
}


function processForecast(h)
{
	//the catch-all function for most responses from the server
	//basically just fills in the information for a given location
	//based on the array returned by the server to the AJAX request
	//names should make it clear what each line is doing
	var hash = h || {};
	var pid = Object.keys(hash['geodata']['data'])
	var geoinfo = hash['geodata']['data'][pid[0]];

	if(FUSION.get.objSize(geoinfo) > 1)
	{
		var units = $("input[name=unitradio]:checked").val();
		var tu = (units == "us") ? "F" : "C";
		var su = (units == "us") ? "mph" : "kph";

		var adv = (FUSION.get.node("geocodeid" + geoinfo.place_id) === null) ? true : false;
		var lcs = (localStorage.getItem("geocodeid" + geoinfo.place_id) === null) ? true : false;
		//if(lcs) {
		//	setLsActive(geoinfo.place_id);
		//}

        var map = FUSION.get.node('maplist');
        var lat = geoinfo.latitude;
        var lng = geoinfo.longitude;

        var ifr = document.createElement("iframe");
        ifr.id = "map-embed-iframe";
        ifr.frameBorder = "0";
        ifr.height = "370px";
        ifr.width  = "100%";
        ifr.src    = "https://maps.darksky.net/@radar," + lat + "," + lng + ",8";
//   <script src='https://darksky.net/map-embed/@radar,39.231,-77.166,9.js?embed=true&timeControl=true&fieldControl=true&defaultField=radar'></script>
//        ifr.src =  "https://maps.darksky.net/@radar," + lat + "," + lng + ",8?domain=";
//        ifr.src += encodeURIComponent(window.location.href);
//        ifr.src += "&auth=1507724619_25625fd9d21ffe92b29ba43a4260b50c&embed=true&amp;timeControl=true&amp;fieldControl=true&amp;defaultField=radar";
        map.innerHTML = "";
        map.appendChild(ifr);


		FUSION.get.node("footerlocation").innerHTML = geoinfo.formatted_address;
		FUSION.get.node("location").innerHTML = geoinfo.formatted_address;
		var sb = FUSION.get.node("searchbox");
		sb.value = "";
		hideSearchDiv(sb);

		var nreq = 1000 - parseInt(hash['forecast']['num_reqs']);
		FUSION.get.node("numreqs").innerHTML = "(" + nreq + ")";

		//offset for location timezone and user timezone
 		var rnow = new Date();
 		var tzos = rnow.getTimezoneOffset() / 60;
		var ofst = 3600 * (tzos + hash['forecast']['tz_offset']);

		var rain = 0;
		var humd = 0;
		var wind = 0;
		var drct = "";
		var brng = "";
		var wstr = "N/A 0 " + su;

		var ipp = 0;
		var skycons = new Skycons({
			"monochrome": true,
			"colors" : { "main": "#444" }
		});

		var hrly = hash['forecast']['hourly'];
		var hrtp = {};
		var hrat = {};
		var hrwd = {};
		var hitp = {};
		var lotp = {};

		for(var i = 0; i < hrly.length; i++)
		{
			ipp = i + 1;
			FUSION.get.node("hrdisplay" + ipp).innerHTML = "<span class='hrspan'>" + getTimeFromTs(hrly[i]['time'] + ofst) + "</span>" +
															"<span class='dtspan'>" + getDateFromTs(hrly[i]['time'] + ofst) + "</span>";
			FUSION.get.node("hrcondtion" + ipp).innerHTML = hrly[i]['summary'];
			FUSION.get.node("hrtempactual" + ipp).innerHTML = Math.round(hrly[i]['temperature']) + "&deg; " + tu;
			FUSION.get.node("hrtempapparent" + ipp).innerHTML = Math.round(hrly[i]['apparentTemperature']) + "&deg; " + tu;
			rain = Math.round(hrly[i]['precipProbability'] * 100);
			rain += "%";
			FUSION.get.node("hrrainchance" + ipp).innerHTML = rain;
			humd = Math.round(hrly[i]['humidity'] * 100);
			humd += "%";
			FUSION.get.node("hrhumidity" + ipp).innerHTML = humd;
			wind = Math.round(hrly[i]['windSpeed']);
			drct = hrly[i]['windBearing'];
			brng = wind > 0 ? getWindBearing(drct) : "N/A";
			wstr = brng + " " + wind + " " + su;

			hrtp = { "type":"temperature", "value":Math.round(hrly[i]['temperature']), "units":units, "text":{ "left":"", "right":"" }};
			hrat = { "type":"temperature", "value":Math.round(hrly[i]['apparentTemperature']), "units":units, "text":{ "left":"", "right":"" }};
			hrwd = { "type":"wind", "value":wind, "units":units, "text":{ "left":brng + " ", "right":"" }};

			FUSION.get.node("hrtempactual" + ipp + "_cnvrt").value = JSON.stringify(hrtp);
			FUSION.get.node("hrtempapparent" + ipp + "_cnvrt").value = JSON.stringify(hrat);
			FUSION.get.node("hrwind" + ipp + "_cnvrt").value = JSON.stringify(hrwd);

			FUSION.get.node("hrwind" + ipp).innerHTML = wstr;
			skycons.add("hricon" + ipp, hrly[i]['icon']);
		}

		var crnt = hash['forecast']['current'];
		var daly = hash['forecast']['daily'];
        var alrt = [];

        if(hash['forecast'].hasOwnProperty( 'alerts' ) && typeof hash['forecast']['alerts'] !== "undefined" && hash['forecast']['alerts'] !== null)
        {
            alrt = hash['forecast']['alerts'];
        }

		var ct = new Date((crnt['time'] + ofst) * 1000);
		var dstr = MYWEATHER.days[ct.getDay()] + " / " + MYWEATHER.months[ct.getMonth()] + " " + ct.getDate() + ", " + ct.getFullYear();
		FUSION.get.node("date").innerHTML = dstr;

		var cntp = { "type":"temperature",
					 "value":Math.round(crnt['temperature']), "units":units,
					 "text":{ "left":crnt['summary'] + ", ", "right":"" }};

		FUSION.get.node("condition_cnvrt").value = JSON.stringify(cntp);
		FUSION.get.node("condition").innerHTML  = crnt['summary'] + ", " + Math.round(crnt['temperature']) + "&deg; " + tu;

		skycons.add("condimg", crnt['icon']);

		var wspd = Math.round(crnt['windSpeed']);
		var wbrg = wspd > 0 ? getWindBearing(crnt['windBearing']) : "N/A";
		var wind = wbrg + " " + wspd + " " + su;

		var wscv = { "type":"wind", "value":wspd, "units":units, "text":{ "left":wbrg + " ", "right":"" }};
		FUSION.get.node("wind_cnvrt").value = JSON.stringify(wscv);

		FUSION.get.node("dailyfrc").innerHTML 	= daly[0]['summary'];
		FUSION.get.node("conditiontext").value 	= daly[0]['summary'];
		FUSION.get.node("wind").innerHTML		= wind;
		FUSION.get.node("sunrise").innerHTML	= getTimeFromTs(daly[0]['sunriseTime'] + ofst);
		FUSION.get.node("sunset").innerHTML		= getTimeFromTs(daly[0]['sunsetTime'] + ofst);

		hitp = { "type":"temperature", "value":Math.round(daly[0]['temperatureMax']), "units":units, "text":{ "left":"", "right":"" }};
		lotp = { "type":"temperature", "value":Math.round(daly[0]['temperatureMin']), "units":units, "text":{ "left":"", "right":"" }};

		FUSION.get.node("high_cnvrt").value = JSON.stringify(hitp);
		FUSION.get.node("low_cnvrt").value 	= JSON.stringify(lotp);
		FUSION.get.node("high").innerHTML 	= Math.round(daly[0]['temperatureMax']) + "&deg; " + tu;
		FUSION.get.node("low").innerHTML 	= Math.round(daly[0]['temperatureMin']) + "&deg; " + tu;

		var dte = 0;
		var dstr = "";
		var k = 0;

        wind = 0;
		drct = "";
		brng = "";
		wstr = "N/A 0 " + su;
        humd = 0;
		rain = 0;
		hitp = {};
		lotp = {};

		for(var j = 1; j < daly.length; j++)
		{
			k = j + 1;

			hitp = { "type":"temperature", "value":Math.round(daly[j]['temperatureMax']), "units":units, "text":{ "left":"", "right":"" }};
			lotp = { "type":"temperature", "value":Math.round(daly[j]['temperatureMin']), "units":units, "text":{ "left":"", "right":"" }};

			FUSION.get.node("high" + k + "_cnvrt").value = JSON.stringify(hitp);
			FUSION.get.node("low" + k + "_cnvrt").value  = JSON.stringify(lotp);

			dte  = new Date((daly[j]['time'] + ofst) * 1000);
			dstr = MYWEATHER.days[dte.getDay()] + ", " + MYWEATHER.months[dte.getMonth()] + " " + dte.getDate();
			FUSION.get.node("dayofweek" + k).innerHTML  = dstr;
			FUSION.get.node("condition" + k).innerHTML  = daly[j]['summary'];
			FUSION.get.node("conditiontext" + k).value 	= daly[j]['summary'];
			FUSION.get.node("high" + k).innerHTML 		= Math.round(daly[j]['temperatureMax']) + "&deg; " + tu;
			FUSION.get.node("low" + k).innerHTML 		= Math.round(daly[j]['temperatureMin']) + "&deg; " + tu;
			rain = Math.round(daly[j]['precipProbability'] * 100);
			rain += "%";
			FUSION.get.node("rainchance" + k).innerHTML = rain;
			skycons.add("condimg" + k, daly[j]['icon']);
            humd = Math.round(daly[j]['humidity'] * 100);
			humd += "%";
			FUSION.get.node("humidity" + k).innerHTML = humd;

            wind = Math.round(daly[j]['windSpeed']);
			drct = daly[j]['windBearing'];
			brng = wind > 0 ? getWindBearing(drct) : "N/A";
			wstr = brng + " " + wind + " " + su;
			hrwd = { "type":"wind", "value":wind, "units":units, "text":{ "left":brng + " ", "right":"" }};
			FUSION.get.node("wind" + k + "_cnvrt").value = JSON.stringify(hrwd);
			FUSION.get.node("wind" + k).innerHTML = wstr;
		}

        buildWeatherAlerts(alrt);

		skycons.play();

		//quick check to see if a new location div is required
		//this should be false if the user clicks an existing location div
		//to load info for that area
		addCityDiv(geoinfo);
	}
}


// Sample Alert JSON:
/*aAlerts = [{
    description:"...WIND CHILL ADVISORY REMAINS IN EFFECT UNTIL 10 AM EST SATURDAY... * WHAT...Very cold wind chills expected. The cold wind chills will cause frostbite in as little as 30 minutes to exposed skin. Expect wind chills to range from 15 to 20 below zero at times. * WHERE...Portions of northeast New Jersey, southern Connecticut and southeast New York. * WHEN...Until 10 AM EST Saturday. * ADDITIONAL DETAILS...Wind gusts around 45 mph will result in areas of blowing and drifting snow, and may lead to minor property damage and isolated power outages. PRECAUTIONARY/PREPAREDNESS ACTIONS... A Wind Chill Advisory means that cold air and the wind will combine to create low wind chills. Frost bite and hypothermia can occur if precautions are not taken. Make sure you wear a hat and gloves.",
    expires:1515250800,
    regions:[
        "Northern Fairfield",
        "Northern Middlesex",
        "Northern New Haven",
        "Northern New London",
        "Southern Fairfield",
        "Southern Middlesex",
        "Southern New Haven",
        "Southern New London"],
    severity:"warning",
    time:1515170400,
    title:"Wind Chill Advisory",
    uri:"https://alerts.weather.gov/cap/wwacapget.php?x=CT125A8BFFF4E0.WindChillAdvisory.125A8C0F0070CT.OKXWSWOKX.2d4b7a840dfb26dcd404585db5806853",
}];*/

function buildWeatherAlerts(aAlerts)
{
    var oAlert     = {};
    var sAlertHtml = "";
    var sAlertTab  = "";
    var oAlertDiv  = FUSION.get.node("alertlist");
    var oAlertTab  = FUSION.get.node('alert_tab_text');
    var oSeverity  = {
        "advisory": "alert_bg_info",
        "watch":    "alert_bg_warning",
        "warning":  "alert_bg_danger"
    };

    oAlertDiv.innerHTML = "";

    try {
        var nNumAlerts = aAlerts.length;
        if( nNumAlerts > 0 )
        {
            sAlertHtml = "<div class='panel-group' id='alert_items' role='tablist' aria-multiselectable='true'>";
            var sIn = "";
            for( var i = 0; i < nNumAlerts; i++ )
            {
                oAlert = aAlerts[i];
                sIn    = (i == 0) ? " in" : "";

                var nUTCSeconds = parseInt(oAlert['expires']);
                var oDate = new Date(0); // set the date to midnight dec 31, 1969
                oDate.setUTCSeconds(nUTCSeconds);
                var sDate = oDate.toString();

                sAlertHtml += "<div class='panel panel-default'>";
                sAlertHtml += "<div class='panel-heading " + oSeverity[oAlert['severity']] + "' role='tab' id='alert_heading_" + i + "'>";
                sAlertHtml += "<h4 class='panel-title'>";
                sAlertHtml += "<a role='button' data-toggle='collapse' data-parent='alert_items' href='#alert_collapse_" + i + "' aria-expanded='true' aria-controls='alert_collapse_" + i + "'>";
                sAlertHtml += oAlert['title'] + "</a>";
                sAlertHtml += "</h4>";
                sAlertHtml += "</div>";
                sAlertHtml += "<div id='alert_collapse_" + i + "' class='panel-collapse collapse" + sIn + "' role='tabpanel' aria-labelledby='alert_heading_" + i + "'>";
                sAlertHtml += "<div class='panel-body'>";
                sAlertHtml += "<div id='alert_description'><h5>DESCRIPTION</h5><span>" + oAlert['description'] + "</span></div>";
                if( oAlert['regions'].length > 0 )
                {
                    var sRegions = oAlert['regions'].join(', ');
                    sAlertHtml += "<div id='alert_regions'><h5>AFFECTED REGIONS</h5>" + sRegions + "</div>";
                }
                sAlertHtml += "<div id='alert_expires'><h5>EXPIRES</h5>" + sDate + "</div>";
                sAlertHtml += "<div id='alert_nws_link_div'><a id='alert_nws_link' target='_blank' href='" + oAlert['uri'] + "'>Alert Link</a>";
                sAlertHtml += "</div></div></div></div></div>";
            }
            sAlertHtml += "</div>";
            sAlertTab   = "Local Alerts <span class='glyphicon glyphicon-exclamation-sign alert_icon' aria-hidden='true'></span>";
        }
        else
        {
            sAlertHtml = "<div style='width: 100%;float: left;padding: 10px;font-size: 16px;font-weight: bold;'>No Alert Data to Display</div>";
            sAlertTab  = "Local Alerts";
        }

        oAlertDiv.innerHTML = sAlertHtml;
        oAlertTab.innerHTML = sAlertTab;
    }
    catch(err) {
        FUSION.error.logError(err, "Unable to create build Alert items: ");
    }
}



function addCityDiv(h)
{
	var hash = h  || {};

	if(localStorage.getItem("geocodeid" + hash['place_id']) === null)
	{
		//if no localStorage item exists, create one if possible
		try {
			localStorage.setItem("geocodeid" + hash['place_id'], JSON.stringify(hash));
		}
		catch(err) {
			FUSION.error.logError(err, "Unable to create localStorage item: ");
		}
	}

	$(".citydiv").each( function() {
		$(this).css("background-color", "#FFF");
	});

	if(FUSION.get.node("geocodeid" + hash['place_id']) === null)
	{
		var div = FUSION.get.node("oldcitydiv");
		var els = div.getElementsByTagName("div");
		if(els.length >= 4)
		{
			//if there are already 4 locations stored, remove the oldest one
			//techincally it removes the last div, which *should* be the oldest,
			//but I should really do a sort here to make sure...I'll come back to it
			var eid = els[3].id;
			FUSION.remove.node(eid);
			try {
				localStorage.removeItem(eid);
			}
			catch(err) {
				FUSION.error.logError(err, "Unable to remove localStorage item: ");
			}
		}

		//begin creating the location box - just a div that holds a link and a span,
		//pretty straight-forward
		var ndv = FUSION.lib.createHtmlElement({"type":"div",
												"style":{ "backgroundColor":"#EEE" },
												"attributes":{
													"id": "geocodeid" + hash['place_id'], "class":"citydiv" }});
		var regstr = hash.formatted_address;

		var lnk = FUSION.lib.createHtmlElement({"type":"a",
												"onclick":"locationClick('" + JSON.stringify(hash) + "')",
												"text": regstr,
												"attributes":{
													"href":"javascript:void(0);",
													"title": regstr,
													"class":"citylink" }});

		var img = FUSION.lib.createHtmlElement({"type":"img",
												"onclick":"removeCityDiv('geocodeid" + hash['place_id'] + "')",
												"style":{"width":"12px","height":"12px"},
												"attributes":{
													"src":"../assets/iconic/x-6x.png",
													"class":"removespan",
													"title":"Remove Location" }});
		ndv.appendChild(lnk);
		ndv.appendChild(img);

		//another concession for IE...insertBefore has issues in IE if there are no
		//existing elements in the parent div.  Because of course it does.
		if(els.length == 0)	{
			div.appendChild(ndv);
		}
		else {
			div.insertBefore(ndv, div.childNodes[0]);
		}
	}
	else
	{
		FUSION.get.node("geocodeid" + hash['place_id']).style.backgroundColor = "#EEE";
	}
}


function removeCityDiv(id)
{
	//remove the location div - need to add in a sexier confirm box
	//in place of the standard confirm...so ugly
	var geoid = id || 0;
	if(geoid == 0)
	{
		FUSION.lib.alert("Unable to determine PlaceID - please refresh page and try again");
		return false;
	}

	var yn = confirm("Are you sure you'd like to remove this entry?");
	if(yn)
	{
		FUSION.remove.node(geoid);
		try{
			//attempt to remove the localStorage item...sometimes causes
			//an issue in older versions of IE...because of course it does
			localStorage.removeItem(geoid);
		}
		catch(err){
			FUSION.error.logError(err);
		}
	}
}


//just a little shim pulled from the Net to handle Date.now() calls
//older versions of IE don't like it, so this makes it forward AND
//backwards compatible.  Thanks stranger from Stackoverflow!
if (!Date.now) { Date.now = function() { return new Date().getTime(); }}


function showCondition(c)
{
	var cnd = c || "";
	if(cnd != "")
	{
		var txt = FUSION.get.node(cnd).value;
		FUSION.lib.alert("<p style='margin-top:10px;text-align:center;'>" + txt + "</p>");
	}
}


function getWindBearing(b)
{
	var brng = b || 0;
	var drct = Math.floor((brng + 11.25) / 22.5);
	drct = drct % 16; //handling when drct >= 16
	return MYWEATHER.directions[drct];
}


function getTimeFromTs(ts)
{
	if(typeof ts === "undefined" || typeof ts !== "number" || FUSION.lib.isBlank(ts))
	{
		alert("Invalid timestamp given: " + ts + "\nUnable to determine time");
		return "";
	}
	else
	{
		var date  	= new Date(ts * 1000);
		var hours 	= date.getHours();
		var minutes = "0" + date.getMinutes();
		var hour  	= 0;
		var ampm  	= "AM";

		if(hours > 11) {
			hour = (hours == 12) ? hours : hours % 12;
			ampm = "PM";
		}
		else if(hours == 0) {
			hour = 12;
		}
		else {
			hour = hours;
		}
		return hour + ':' + minutes.substr(minutes.length - 2) + " " + ampm;
	}
}


function getDateFromTs(ts)
{
	if(typeof ts === "undefined" || typeof ts !== "number" || FUSION.lib.isBlank(ts))
	{
		alert("Invalid timestamp given: " + ts + "\nUnable to determine date");
		return "";
	}
	else
	{
		var date  	= new Date(ts * 1000);
		var day 	= MYWEATHER.days[date.getDay()];
		var dnum 	= "0" + date.getDate();
		var mnth  	= MYWEATHER.months[date.getMonth()];
		return day + ', ' + mnth + " " + dnum.substr(dnum.length - 2);
	}
}


function setLsActive(id)
{
	var pid = id || "";
	if(FUSION.lib.isBlank(pid)) {
		console.log("No place id - can not set active item");
		return false;
	}

	if(supportsHtml5Storage())
	{
		var lso = {};
		var lss = "";

		var lslen = localStorage.length;
		for(var i = 0; i < lslen; i++)
		{
			lss = localStorage.getItem(localStorage.key(i));
			if(typeof lss !== undefined && /^geocodeid/.test(localStorage.key(i)))
			{
				try {
					lso = JSON.parse(lss);
					if(lso.place_id && lso.place_id !== "geocodeid" + pid) {
						lso.active_location = false;
					}
					else {
						lso.active_location = true;
					}
					//need to make sure this doesn't create a NEW localStorage item!!!
					//right now it's creating duplicates...that's bad
					localStorage.setItem("geocodeid" + pid, JSON.stringify(lso));
				}
				catch(err) {
					FUSION.error.logError(err);
				}
			}
		}
	}
}
