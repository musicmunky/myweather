/**
 *	FUSION javascipt library
 *
 *  This is a library of functions created by Tim Andrews and infrequently updated with new functionality.
 *  It is essentially a set of wrapper functions for code/behaviors that I use most often and honestly
 *  don't feel like writing over and over again.
 *
 */

//create the FUSION object
var FUSION = FUSION || {};
var $F = FUSION;

var loadjq = window.jQuery ? true : false;
if(!loadjq){
	console.log("NOTICE: jQuery library is not loaded");
}


// Example uses for array.clean:
// test = new Array("","One","Two","", "Three","","Four").clean("");
// test2 = [1,2,,3,,3,,,,,,4,,4,,5,,6,,,,];
// test2.clean(undefined);
Array.prototype.clean = function(deleteValue) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == deleteValue) {
			this.splice(i, 1);
			i--;
		}
	}
	return this;
};


//Getter methods
FUSION.get = {

	//function to return the "true" page height, not just the displayed window size
	pageHeight: function() {
		try {
			var body = document.body;
			var html = document.documentElement;
			return FUSION.lib.getMax([body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight]);
		}
		catch(err) {
			FUSION.error.logError(err);
			return 0;
		}
	},

	//returns the users browser and version number - will need to be updated when Windows 10 is pushed
	browser: function() {
		var br = {};
		var ua = navigator.userAgent, tem,
		M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
		if(/trident/i.test(M[1])){
			tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
			br['browser'] = "IE";
			br['version'] = tem[1] || 0;
			return br;
		}
		if(M[1] === 'Chrome'){
			tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
			if(tem != null) {
				var brstr = tem.slice(1).join(' ').replace('OPR', 'Opera');
				var brarr = brstr.split(" ");
				br['browser'] = brarr[0];
				br['version'] = brarr[1];
				return br;
			}
		}
		M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
		if((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
		br['browser'] = M[0];
		br['version'] = M[1];
		return br;
	},

	//returns a specified DOM node by ID
	//if no element is found it returns a null value
	node: function(el) {
		try {
			var elm = (typeof el === "string") ? document.getElementById(el) : el;
			return elm;
		}
		catch(err) {
			FUSION.error.logError(err);
			return null;
		}
	},

	//returns an array of DOM Elements by name as an array
	//if no elements are found it returns an empty array
	byName: function(el) {
		try {
			var elm = (typeof el === "string") ? document.getElementsByName(el) : [];
			return elm;
		}
		catch(err) {
			FUSION.error.logError(err);
			return [];
		}
	},

	//returns an array of elements by tag name (div, p, tr, etc)
	//if no elements are found it returns an empty array
	byTagName: function(el) {
		try {
			var elm = (typeof el === "string") ? document.getElementsByTagName(el) : [];
			return elm;
		}
		catch(err) {
			FUSION.error.logError(err);
			return [];
		}
	},

	//returns the X coordinate of the current mouse position
	mouseX: function(e) {
		if (e.pageX) {
			return e.pageX;
		}
		if (e.clientX) {
			return e.clientX + (document.documentElement.scrollLeft ?
									document.documentElement.scrollLeft :
										document.body.scrollLeft);
		}
		return null;
	},

	//returns the Y coordinate of the current mouse position
	mouseY: function(e) {
		if (e.pageY) {
			return e.pageY;
		}
		if (e.clientY) {
			return e.clientY + (document.documentElement.scrollTop ?
									document.documentElement.scrollTop :
										document.body.scrollTop);
		}
		return null;
	},

	//returns the size of an object - this is more geared towards JSON or
	//Javascript objects rather than DOM objects, simply because DOM objects
	//don't really have a "size" per se
	objSize: function(obj) {
		try {
			var childCount = 0;
			for(var child in obj)
			{
				if(typeof obj[child] === 'object') {
					childCount += FUSION.get.objSize(obj[child]);
				}
				else {
					childCount++;
				}
			}
			return childCount;
		}
		catch(err) {
			FUSION.error.logError(err);
			return -1;
		}
	},

	//returns the value of a URL parameter by name
	urlParamByName: function(name, url) {
		try {
			var location = url || window.location;
			var rgx = new RegExp(name + "=" + "(.+?)(&|$)");
			var res = (rgx.exec(location)||[,null])[1]

			if(res !== null && typeof res !== undefined) {
				return decodeURI(res);
			}
			else {
				return null;
			}
		}
		catch(err) {
			FUSION.error.logError(err);
			return null;
		}
	},

	//returns all of the parameters in a url in a JSON object (hash table)
	urlParams: function() {
		var phash = {};
		try {
			var pstr = window.location.search;
			if(pstr && !FUSION.lib.isBlank(pstr))
			{
				var parr = pstr.toString().substring(1).split("&");
				for(var i = 0; i < parr.length; i++)
				{
					var a = parr[i].split("=");
					phash[a[0]] = decodeURI(a[1]);
				}
			}
			return phash;
		}
		catch(err) {
			FUSION.error.logError(err);
			phash['is_error'] = true;
			phash['error'] = err;
			return phash;
		}
	},

	//get the currently selected text in a select box / dropdown list
	selectedText: function(el) {
		try {
			var sel = FUSION.get.node(el);
			var idx = sel.selectedIndex;
			var txt = sel.options[idx].innerHTML;
			return txt;
		}
		catch(err) {
			FUSION.error.showError(err);
			return false;
		}
	},

	//get the currently selected text in a select box / dropdown list
	selectedValue: function(el) {
		try {
			var sel = FUSION.get.node(el);
			var val = (sel.options[sel.selectedIndex]) ? sel.options[sel.selectedIndex].value : "";
			return val;
		}
		catch(err) {
			FUSION.error.showError(err);
			return false;
		}
	},

	//returns an array of elements that have a specified attribute
	//admittedly this function is expensive, so is more of an idea to build on
	//than usable code
	elementsByAttr: function(attr) {
		var matchingElements = [];
		var allElements = FUSION.get.byTagName('*');
		for (var i = 0; i < allElements.length; i++)
		{
			if (allElements[i].getAttribute(attr))
			{
				matchingElements.push(allElements[i]);
			}
		}
		return matchingElements;
	},
};


//BEGIN LIBRARY SETTER METHODS
FUSION.set = {

	//Set the mouse cursor to the "waiting" icon
	overlayMouseWait: function() {
		var bd = document.body;
		var cn = bd.className;

		//body has no class applied
		if(FUSION.lib.isBlank(cn)) {
			bd.className = "wait";
		}
		else {
			//body has existing css classes, don't apply
			//the 'wait' class more than once
			var cn_arry = cn.split(" ");
			var cn_indx = cn_arry.indexOf("wait");
			if(cn_indx == -1) {
				bd.className += " wait";
			}
		}
	},

	//Set the mouse cursor back to the "default" icon
	overlayMouseNormal: function() {
		//remove the 'wait' class from the body
		document.body.className = document.body.className.replace(/(?:^|\s)wait(?!\S)/, "");
	},

	//set the selected text of a select box / dropdown list
	//return true if a value is found, otherwise return false
	selectedText: function(el,t) {
		try {
			var sel = FUSION.get.node(el);
			var res = false;
			for (var i = 0; i < sel.options.length; i++)
			{
				if (sel.options[i].text == t)
				{
					sel.selectedIndex = i;
					res = true;
					break;
				}
			}
			return res;
		}
		catch(err) {
			FUSION.error.showError(err);
			FUSION.error.logError(err);
			return false;
		}
	},
};


//BEGIN LIBRARY REMOVE METHODS
FUSION.remove = {

	//remove a table row by id
	//originally written because of a bug in the DataTables jQuery plugin,
	//kept for sentimental reasons
	rowById: function(id) {
		try {
			var row = FUSION.get.node(id);
			var tbl = row.parentNode;
			tbl.removeChild(row);
			return true;
		}
		catch(err) {
			FUSION.error.showError(err);
			return false;
		}
	},

	//as above, written due to a bug in the DataTables plugin,
	//not really used anymore but juuuuuust in case...keeping it.
	dTRowById: function(t, r) {
		try {
			var remrow = FUSION.get.node(r);
			if(remrow)
			{
				var table = jQuery("#" + t).DataTable();
				table.row("#" + r).remove().draw();
				return true;
			}
			return false;
		}
		catch(err) {
			FUSION.error.showError(err);
			return false;
		}
	},

	//remove a node either by value (passing the actual DOM object) or by ID (as a string)
	node: function(el) {
		try {
			var elm = FUSION.get.node(el);
			if(elm !== null) {
				var par = elm.parentNode;
				par.removeChild(elm);
			}
			return true;
		}
		catch(err) {
			FUSION.error.logError(err);
			return false;
		}
	},
};


//BEGIN LIBRARY ERROR METHODS
FUSION.error = {

	//this function needs work...still not happy with the how it's built or functions.
	//may end up removing.
	showError: function(e, m) {
		var emsg = "An error occurred during this operation:\n'" + e + "'\nPlease try again, or contact your administrator";
		if(typeof m !== "undefined")
		{
			emsg = m + "\n" + emsg;
		}
		alert(emsg);
	},

	//logs javascript errors to the console.  This *attempts* to use the functionality
	//available in browsers like Chrome and Firefox, but should work as a basic console logger
	//in IE
	logError: function(e, m) {
		m = m || "";
		var usrmsg = !FUSION.lib.isBlank(m) ? "DEVELOPER MESSAGE: " + m + "\n" : "";
		var errnme = "ERROR NAME: " + e.name + "\n";
		var errmsg = "ERROR MESSAGE: " + e.message + "\n";
		var fncnme = "";
		var linnum = "";
		try {
			linnum = e.lineNumber || linnum;
			var a = e.stack.split("\n");
			var b = a[0].split("@");
			var fncnme = b[0];
		}
		catch(err){}
		var functn = "ERROR FUNCTION: " + fncnme + "\n";
		var lnenmb = "ERROR LINE NUMBER: " + linnum + "\n";
		console.log(usrmsg + errnme + errmsg + functn + lnenmb);
	},

	//need to finalize the CSS and structure of the html being written here...it's not very pretty
	//at the moment, but does allow for some interesting functionality
	showErrorDialog: function(h)
	{
		var hash = h || {};
		var did = hash['divid'] || "jserrorform";
		var ttl = hash['title'] || "Error Message";
		var msg = hash['message'] || "It looks like something went wrong!  Please try again, or let the administrator know about the error."
		var lnk = hash['linktext'] || "Click here to notify the developers of this error";
		var eml = hash['emailfunction'] || "";
		var stk = hash['stacktrace'] || "";
		var err = hash['errormessage'] || "";
		var vislnk = hash['linkvisible'] || false;

		var div = "<div id='" + did + "' title='" + ttl + "'>";
		div += "<div style='with:100%;margin-top:15px;height:165px;overflow-y:auto;'>";
		div += "<label style='width:100%;text-align:center;'>" + msg + "</label>";
		div += "<label style='width:100%;text-align:center;margin-top:10px;'>";
		div += "<label style='width:100%;text-align:center;'>ERROR: <span style='color:#F00;'>" + err.toString() + "</span></label>";
		if(vislnk){
			div += "<a href='javascript:void(0)' onclick='" + eml + "' style='color:#68a4c4;'>" + lnk + "</a>";
		}
		div += "</label>";
		div += "<input type='hidden' id='errormessage' value='" + err + "' />";
		div += "<input type='hidden' id='fullstacktrace' value='" + stk + "' />";
		div += "</div></div>";

		FUSION.lib.alert({
			"message":div,
			"height":230,
			"width":350
		});
	},
};


//BEGIN LIBRARY GENERIC METHODS
FUSION.lib = {

	//add commas to a number
	addCommas: function(num) {
		try {
			return (num + "").replace(/\b(\d+)((\.\d+)*)\b/g, function(aMatches, grp1, grp2) {
				return (grp1.charAt(0) > 0 && !(grp2 || ".").lastIndexOf(".") ? grp1.replace(/(\d)(?=(\d{3})+$)/g, "$1,") : grp1) + grp2;
			});
		}
		catch(err) {
			FUSION.error.logError(err);
			return num;
		}
	},

	//focus the cursor on a specific DOM element, usually an input field or a select box
	focus: function(el) {
		try {
			//need to declare f here to avoid null reference errors
			var f = FUSION;
			setTimeout(function() {
				f.get.node(el).focus()
			}, 10);
		}
		catch(err) {
			FUSION.error.logError(err);
		}
	},

	//convert a string to Title Case
	titleCase: function(str) {
		try {
			return str.replace(/\w\S*/g, function(txt){ return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
		}
		catch(err) {
			FUSION.error.logError(err);
			return "";
		}
	},

	//allows an html element to be clicked/dragged around the page
	//needs to parameters: the "cel" to click and drag, and the containing
	//div (or other element) of that cel.
	dragable: function(cel, del) {
		//cel = div to click and drag
		//del = containing div
		var p = FUSION.get.node(cel);
		var t = FUSION.get.node(del);
		var drag = false;
		var offsetX = 0;
		var offsetY = 0;
		var mousemoveTemp = null;

		if (t) {
			var move = function(x,y) {
				var l = t.style.left ? parseInt(t.style.left) : 0;
				var o = t.style.top ?  parseInt(t.style.top)  : 0;
				t.style.left = (l + x) + "px";
				t.style.top  = (o + y) + "px";
			}
			var mouseMoveHandler = function(e) {
				e = e || window.event;

				if(!drag){ return true };

				var x = FUSION.get.mouseX(e);
				var y = FUSION.get.mouseY(e);
				if (x != offsetX || y != offsetY) {
					move(x - offsetX, y - offsetY);
					offsetX = x;
					offsetY = y;
				}
				return false;
			}
			var start_drag = function(e) {
				e = e || window.event;
				p.style.cursor = "-moz-grabbing";
				offsetX = FUSION.get.mouseX(e);
				offsetY = FUSION.get.mouseY(e);
				drag = true; // basically we're using this to detect dragging

				// save any previous mousemove event handler:
				if(document.body.onmousemove) {
					mousemoveTemp = document.body.onmousemove;
				}
				document.body.onmousemove = mouseMoveHandler;
				return false;
			}
			var stop_drag = function() {
				drag = false;
				p.style.cursor = "-moz-grab";
				// restore previous mousemove event handler if necessary:
				if(mousemoveTemp) {
					document.body.onmousemove = mousemoveTemp;
					mousemoveTemp = null;
				}
				return false;
			}
			p.onmousedown = start_drag;
			p.onmouseup = stop_drag;
		}
	},

	alert: function(o) {

		/*
		 * TODO: Extend for "levels", ie, Message, Info, Warning, Error, etc
		 */
		//great little function for displaying alerts that are a bit more pretty and flexible
		//than the standard browser alert.
		//you can pass in either just a message string or a full JSON object with various parameters
		//set to customize the look and feel of the alert
		var obj = o || {};
		var msg = (typeof obj === "string") ? obj : obj['message'];
		var hgt = obj['height'] 		|| 120;
		var wdt = obj['width'] 			|| 350;
		var fnt = obj['font-size'] 		|| 14;
		var bld = obj['font-weight']	|| "normal";
		var bcl = obj['background'] 	|| "#FFFFFF";
		var col = obj['color'] 			|| "#333";
		var txt = obj['text-align'] 	|| "left";
		var btn = obj['button-text'] 	|| "Okay";

		var odid = "alert" + FUSION.lib.getRandomInt(1000,9999);
		var idid = "inner_" + odid;
		var mdid = "message_" + odid;
		var bttn = "button_" + odid;

		var wht = jQuery(window).scrollTop() + jQuery(window).height() / 2;
		var top = wht - (hgt / 2) - 100;
// 		var top = (wht / 2) - (hgt / 2) - 100;

		var ao = FUSION.lib.createHtmlElement({"type":"div",
											   "attributes":{"id":odid, "class":"fl_alert_overlay"},
											   "style":{"display":"block", "height":FUSION.get.pageHeight() + "px"}});

		var aw = FUSION.lib.createHtmlElement({"type":"div",
											   "attributes":{"id":idid, "class":"fl_alert_wrapper"},
											   "style":{"top":	 Math.round(top)+"px",
													    "width": wdt+"px",
													    "height":hgt+"px"}});

		var amd = FUSION.lib.createHtmlElement({"type":"div",
											    "attributes":{"id":mdid, "class":"fl_alert_message_div"},
											    "style":{"fontSize":		fnt+"px",
														 "fontWeight":		bld,
														 "backgroundColor":bcl,
														 "color":			col,
														 "textAlign":		txt}});

		var abd = FUSION.lib.createHtmlElement({"type":"div",
											    "attributes":{"class":"fl_alert_button_div"}});

		var ab = FUSION.lib.createHtmlElement({"type":"input",
											   "onclick":"FUSION.remove.node('" + odid + "')",
											   "attributes":{"type":"button","class":"fl_alert_button","value":btn,"id":bttn}});
		amd.innerHTML = msg;
		abd.appendChild(ab);
		aw.appendChild(amd);
		aw.appendChild(abd);
		ao.appendChild(aw);
		document.body.appendChild(ao);
		FUSION.get.node(bttn).focus();
		FUSION.lib.dragable(idid, idid);
	},

	//this is more a wrapper function for my own personal AJAX calls
	//it assumes a basic return structure from the server - a hash containing the following entries:
	//	 - a status
	//	 - a message of some sort (can be blank)
	//	 - a content object, containing the information retrieved from the server (can be empty)
	//it requires two functions:
	//	 - the calling function
	//	 - the response function
	ajaxCall: function(ajaxobj) {
		if(!ajaxobj['type'] || !ajaxobj['data'] || !ajaxobj['path'])
		{
			alert("Unable to complete call to the server - insufficient data");
			return false;
		}

		var tmot = ajaxobj['timeout'] || 10000;
		FUSION.set.overlayMouseWait();
		jQuery.ajax({
			type: ajaxobj['type'],
			beforeSend: function(xhr) {
				xhr.setRequestHeader("X-CSRF-Token", jQuery('meta[name="csrf-token"]').attr('content'));
				xhr.setRequestHeader("Accept", "text/html");
			},
			url: ajaxobj['path'],
			data: ajaxobj['data'],
			success: function(result) {
				var response = JSON.parse(result);
				if(response['status'] == "success")
				{
					FUSION.set.overlayMouseNormal();
					if(ajaxobj['func'])
					{
						var fn = ajaxobj['func'];
						fn.apply(this, [response['content']]);
					}
				}
				else
				{
					FUSION.set.overlayMouseNormal();
					FUSION.error.showErrorDialog({'stacktrace':response['content'],
												  'message':response['message'],
												  'errormessage':response['content'],
												  'linkvisible':false});
				}
			},
			error: function(xhr, errtype, errthrown) {
				FUSION.set.overlayMouseNormal();
				switch(errtype) {
					case "error":
						FUSION.lib.alert("<p>Error completing request: " + errthrown + "</p>");
						break;
					case "abort":
						FUSION.lib.alert("<p>Call to server aborted: " + errthrown + "</p>");
						break;
					case "parsererror":
						FUSION.lib.alert("<p>Parser error during request: " + errthrown + "</p>");
						break;
					case "timeout":
						FUSION.lib.alert("<p>Call to server timed out - please try again</p>");
						break;
					default:
						FUSION.error.showError("The call to the server failed", "AJAX Error");
				}
			},
			timeout: tmot
		});
		return false;
	},

	modifyIETable: function(tid, d) {
		//Workaround for IE so I can replace the HTML in the tables
		//an old bug versions of IE > 6, and still present in at least
		//version 9 (not sure about 10/11/etc)
		//first set the html for the main table...
		try{
			var r = FUSION.lib.getRandomInt(1000,9999);
			var sid = "tempspan" + r;
			var tempspan = FUSION.lib.createHtmlElement({"type":"span", "style":{"visibility":"hidden"}, "attributes":{"id":sid}});
			document.body.appendChild(tempspan);

			var spn = FUSION.get.node(sid);
			var tbl = FUSION.get.node(tid);
			spn.innerHTML = "<table><tbody id='" + tid + "'>" + d;
			tbl.parentNode.replaceChild(spn.firstChild.firstChild,tbl);
			FUSION.remove.node(sid);

			return true;
		}
		catch(err){
			FUSION.error.logError(err);
			FUSION.error.showError("Error attempting to modify table contents of " + tid, err);
			return false;
		}
	},

	//returns a "random" integer between the min and max specified
	//may update to make the min/max optional
	getRandomInt: function(min, max) {
 		return Math.floor(Math.random() * (max - min)) + min;
	},

	//pads as many zeroes as needed, or other strings, to number:
	//turns 4 into 004 if you call FUSION.lib.padZero(4, 3)
	padZero: function(n, width, z) {
		z = z || '0';
		n = n + '';
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	},

	//returns the days in the month of a given year
	//helpful for leap years and such, but overall not used often
	daysInMonth: function(month,year) {
		try{
    		return new Date(year, month, 0).getDate();
		}
		catch(err){
			FUSION.error.logError(err);
			return 0;
		}
	},

	//quick tool to verify a variable has a value
	//returns true if a variable is blank, false otherwise
	//it accounts for white space, so "   " would be considered a blank string
	isBlank: function(t) {
		try {
			if(t === undefined || t === null) { return true; }
			return /^\s*$/.test(t);
		}
		catch(err) {
			FUSION.error.logError(err, "Error determining if string is blank: ");
			return true;
		}
	},

	//returns the max value in an array
	getMax: function(a) {
		try {
			return Math.max.apply(Math, a);
		}
		catch(err) {
			FUSION.error.logError(err, "Error during getMax function");
			return NaN;
		}
	},

	//returns the min value in an array
	getMin: function(a) {
		try {
			return Math.min.apply(Math, a);
		}
		catch(err) {
			FUSION.error.logError(err, "Error during getMin function");
			return NaN;
		}
	},

	//check if a year is a leap year or not
	isLeapYear: function(year) {
		var y = parseInt(year);
		return ((y % 4 == 0) && (y % 100 != 0)) || (y % 400 == 0);
	},

	//create an HTMLElement with parameters passed in by hash
	/*
		As an example of its use:

		var link = FUSION.lib.createHtmlElement({
								"type":"a",
								"attributes":{
									"id":"link-id",
									"target":"_blank",
									"href":"http://www.google.com"},
								"text":"Some Link Text"});

	*/
	//can set a variety of parameters such as onclick, onkeyup, style, class, id...almost anything
	//you might ask why not just use the jQuery "html()" function?
	//well...because I can't always assume the presence of jQuery and because (for me at least),
	//it's often easier to read a hash object than a string of html
	createHtmlElement: function(hash)
	{
		try {
			var type  = hash['type'];
			var text  = hash['text'];
			var click = hash['onclick'];
			var chnge = hash['onchange'];
			var keyup = hash['keyup'];
			var blur  = hash['onblur'];
			var styls = hash['style'];
			var attrs = hash['attributes'];

			var el = "";
			if(type && !FUSION.lib.isBlank(type))
			{
				el = document.createElement(type);
			}
			else
			{
				FUSION.error.logError("","You did not give a type when creating a new HTMLElement - Defaulting to div");
				el = document.createElement("div");
			}

			if(attrs && FUSION.get.objSize(attrs) > 0)
			{
				var br = FUSION.get.browser();
				var attrname = "";
				for (var key in attrs)
				{
					attrname = key;
					if(/^class/i.test(key)) {
						attrname = (/ie/i.test(br.browser) && parseInt(br.version) < 9) ? "className" : "class";
					}
					el.setAttribute(attrname, attrs[key]);
				}
			}

			if(styls && FUSION.get.objSize(styls) > 0)
			{
				//jQuery( el ).css(styls);
				var stylename = "";
				var stylearry = [];
				for (var key in styls)
				{
					stylename = key;
					if(/^float/.test(key)){
						stylename = "cssFloat";
					}
					stylearry = styls[key].split(" ");
					if(stylearry.length > 1 && stylearry[1] == "!important")
					{
						el.style.setProperty(key, stylearry[0], "important");
					}
					else
					{
						el.style[stylename] = styls[key];
					}
				}
			}

			if(text && !FUSION.lib.isBlank(text))
			{
				var tn = document.createTextNode(text);
				el.appendChild(tn);
			}

			if(click && !FUSION.lib.isBlank(click))
			{
				//el.onclick = function(){ showRemoveMentorForm(me_id, mr_id, me_name, mr_name); };
				//callback issues here with variable assignment...trying this way to see if it will work
				el.onclick = new Function(click);
			}

			if(blur && !FUSION.lib.isBlank(blur))
			{
				el.onblur = new Function(blur);
			}

			if(chnge && !FUSION.lib.isBlank(chnge))
			{
				el.onchange = new Function(chnge);
			}

			if(keyup && !FUSION.lib.isBlank(keyup))
			{
				el.onkeyup = new Function(keyup);
			}
			return el;
		}
		catch(err) {
			FUSION.error.showError(err, "There was an error creating the desired element: ");
			return document.createElement("div");
		}
	},

	//prevents a users from typing anything but numer characters in a text field
	noAlpha: function(th)
	{
		th.value = th.value.replace(/[^\d]+/,"");
	},

	//check if the given object is a DOM node
	isNode: function(o) {
		return (
			typeof Node === "object" ? o instanceof Node :
				o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
		);
	},

	//check if the given object is an HTML element
	isElement: function(o) {
		return (
			typeof HTMLElement === "object" ? o instanceof HTMLElement :
				o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string"
		);
	},

	/**
	* Does a PHP var_dump'ish behavior.  It only dumps one variable per call.  The
	* first parameter is the variable, and the second parameter is an optional
	* name.  This can be the variable name [makes it easier to distinguish between
	* numerious calls to this function], but any string value can be passed.
	*
	* @param mixed var_value - the variable to be dumped
	* @param string var_name - ideally the name of the variable, which will be used
	*       to label the dump.  If this argumment is omitted, then the dump will
	*       display without a label.
	* @param boolean - annonymous third parameter.
	*       On TRUE publishes the result to the DOM document body.
	*       On FALSE a string is returned.
	*       Default is TRUE.
	* @returns string|inserts Dom Object in the BODY element.
	*/
	vardump: function(var_value, var_name)
	{
		//Check for a third argument and if one exists, capture it's value, else
		//default to TRUE.  When the third argument is true, this function
		//publishes the result to the document body, else, it outputs a string.
		//The third argument is intend for use by recursive calls within this
		//function, but there is no reason why it couldn't be used in other ways.
		var is_publish_to_body = typeof arguments[2] === 'undefined' ? true:arguments[2];

		//Check for a fourth argument and if one exists, add three to it and
		//use it to indent the out block by that many characters.  This argument is
		//not intended to be used by any other than the recursive call.
		var indent_by = typeof arguments[3] === 'undefined' ? 0:arguments[3]+3;

		var do_boolean = function (v)
		{
			return 'Boolean(1) ' + (v ? 'TRUE' : 'FALSE');
		};

		var do_number = function(v)
		{
			var num_digits = ('' + v).length;
			return 'Number(' + num_digits + ') ' + v;
		};

		var do_string = function(v)
		{
			var num_chars = v.length;
			return 'String(' + num_chars + ') "' + v + '"';
		};

		var do_object = function(v)
		{
			if (v === null)
			{
				return "NULL(0)";
			}

			var out = '';
			var num_elem = 0;
			var indent = '';

			if (v instanceof Array)
			{
				num_elem = v.length;
				for (var d=0; d < indent_by; ++d)
				{
					indent += ' ';
				}
				out = "Array("+num_elem+") \n"+(indent.length === 0?'':'|'+indent+'')+"(";
				for (var i=0; i<num_elem; ++i)
				{
					out += "\n"+(indent.length === 0?'':'|'+indent)+"|   ["+i+"] = " + FUSION.lib.vardump(v[i],'',false,indent_by);
				}
				out += "\n"+(indent.length === 0?'':'|'+indent+'')+")";
				return out;
			}
			else if (v instanceof Object)
			{
				for (var d=0; d<indent_by; ++d)
				{
					indent += ' ';
				}
				out = "Object \n"+(indent.length === 0?'':'|'+indent+'')+"(";
				for (var p in v)
				{
					out += "\n"+(indent.length === 0?'':'|'+indent)+"|   ["+p+"] = " + FUSION.lib.vardump(v[p],'',false,indent_by);
				}
				out += "\n"+(indent.length === 0?'':'|'+indent+'')+")";
				return out;
			}
			else
			{
				return 'Unknown Object Type!';
			}
		};

		//Makes it easier, later on, to switch behaviors based on existance or
		//absence of a var_name parameter.  By converting 'undefined' to 'empty
		//string', the length greater than zero test can be applied in all cases.
		var_name = typeof var_name === 'undefined' ? '':var_name;
		var out = '';
		var v_name = '';

		switch(typeof var_value)
		{


			case "boolean":
				v_name = var_name.length > 0 ? var_name + ' = ':''; // Turns labeling on if var_name present, else no label
				out += v_name + do_boolean(var_value);
				break;

			case "number":
				v_name = var_name.length > 0 ? var_name + ' = ':'';
				out += v_name + do_number(var_value);
				break;

			case "string":
				v_name = var_name.length > 0 ? var_name + ' = ':'';
				out += v_name + do_string(var_value);
				break;

			case "object":
				v_name = var_name.length > 0 ? var_name + ' =\> ':'';
				out += v_name + do_object(var_value);
				break;

			case "function":
				v_name = var_name.length > 0 ? var_name + ' = ':'';
				out += v_name + "Function";
				break;

			case "undefined":
				v_name = var_name.length > 0 ? var_name + ' = ':'';
				out += v_name + "Undefined";
				break;

			default:
				out += v_name + ' is unknown type!';

		}

		// Using indent_by to filter out recursive calls, so this only happens on the
		// primary call [i.e. at the end of the algorithm]
		if (is_publish_to_body  &&  indent_by === 0)
		{
			var div_dump = FUSION.get.node('div_dump');
			if (!div_dump)
			{
				div_dump = document.createElement('div');
				div_dump.id = 'div_dump';

				var style_dump = FUSION.get.byTagName("style")[0];
				if (!style_dump)
				{
					var head = FUSION.get.byTagName("head")[0];
					style_dump = document.createElement("style");
					head.appendChild(style_dump);
				}

				// Thank you Tim Down [http://stackoverflow.com/users/96100/tim-down]
				// for the following addRule function
				var addRule;
				if (typeof document.styleSheets != "undefined" && document.styleSheets) {
					addRule = function(selector, rule) {
						var styleSheets = document.styleSheets, styleSheet;
						if (styleSheets && styleSheets.length) {
							styleSheet = styleSheets[styleSheets.length - 1];
							if (styleSheet.addRule) {
								styleSheet.addRule(selector, rule);
							} else if (typeof styleSheet.cssText == "string") {
								styleSheet.cssText = selector + " {" + rule + "}";
							} else if (styleSheet.insertRule && styleSheet.cssRules) {
								styleSheet.insertRule(selector + " {" + rule + "}", styleSheet.cssRules.length);
							}
						}
					};
				} else {
					addRule = function(selector, rule, el, doc) {
						el.appendChild(doc.createTextNode(selector + " {" + rule + "}"));
					};
				}

				// Ensure the dump text will be visible under all conditions [i.e. always
				// black text against a white background].
				addRule('#div_dump', 'background-color:white', style_dump, document);
				addRule('#div_dump', 'color:black', style_dump, document);
				addRule('#div_dump', 'padding:15px', style_dump, document);

				style_dump = null;
			}

			var pre_dump = FUSION.get.node('pre_dump');
			if (!pre_dump)
			{
				pre_dump = document.createElement('pre');
				pre_dump.id = 'pre_dump';
				pre_dump.innerHTML = out + "\n";
				div_dump.appendChild(pre_dump);
				document.body.appendChild(div_dump);
			}
			else
			{
				pre_dump.innerHTML += out+"\n";
			}
		}
		else
		{
			return out;
		}

	},

	//a lovely function that enables you to search through the DOM and return elements with a regex!
	findByRegex: function(rgx) {
		jQuery.expr[':'].regex = function(elem, index, match) {
			var matchParams = match[3].split(','),
				validLabels = /^(data|css):/,
				attr = {
					method: matchParams[0].match(validLabels) ?
								matchParams[0].split(":")[0] : "attr",
					property: matchParams.shift().replace(validLabels, "")
				},
				regexFlags = "ig",
				regex = new RegExp(matchParams.join("").replace(/^\s+|\s+$/g), regexFlags);
			return regex.test(jQuery(elem)[attr.method](attr.property));
		};
		return jQuery(rgx);
	},

	//an interesting thing I wrote a while ago to sort complex nested arrays/objects...not super useful
	//now, but keeping it just in case I run into such objects again
	sort_by: function(field, reverse, primer) {
		var key = function (x) {return primer ? primer(x[field]) : x[field]};
		return function (a,b)
		{
			var A = key(a), B = key(b);
			return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1,1][+!!reverse];
		}
	},

	validUrl: function(url) {
		try {
			return rgx_url.test(url);
		}
		catch(err) {
			FUSION.error.logError(err, "Error trying to parse URL: ");
			return false;
		}
	},
};

//
// Regular Expression for URL validation
//
// Author: Diego Perini
// Updated: 2010/12/05
// License: MIT
//
// Copyright (c) 2010-2013 Diego Perini (http://www.iport.it)
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.
//

var rgx_url = new RegExp(
  "^" +
    // protocol identifier
    "(?:(?:https?|ftp)://)" +
    // user:pass authentication
    "(?:\\S+(?::\\S*)?@)?" +
    "(?:" +
      // IP address exclusion
      // private & local networks
      "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
      "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
      "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broacast addresses
      // (first & last IP address of each class)
      "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
      "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
      "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
    "|" +
      // host name
      "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
      // domain name
      "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
      // TLD identifier
      "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
      // TLD may end with dot
      "\\.?" +
    ")" +
    // port number
    "(?::\\d{2,5})?" +
    // resource path
    "(?:[/?#]\\S*)?" +
  "$", "i"
);