//Possible variables to set in the calling file:
//numberOfHits
//searchWord
//session
//pagetitle
//url
//guid
//groups
//filetype
//responseTime
//path
//cvid
//cid
//metagroupname - Gives the possibility to automatically create group from metatag named the "metagroupname"
//surveysessionid
//sz_forceurl
var sz_account_id = "273607";   // accountid
if (typeof src_loaded=="undefined")
    var src_loaded = false;
var sz_previousSessionId = "";

/*
var numberOfHits = 10;           // hits
var searchWord = "searchy word"; // sw
var session="phpsessid";         // session
var guid="00000";                // guid
var groups="1234";               // groups
var filetype="javascript";       // ft
var responseTime=100;            // rt
var path="/1/2/3/4";             // path
var cvid="22";                   // cvid
var cid="44";                    // cid
var metagroupname="metagroup";   // ?
var surveysessionid="s1234";     // surveysessionid
var sz_forceurl="collision"      // ourl
*/

/*
        accountid -> 273607
              cid -> 44
             cvid -> 22
          session -> phpsessid
            title -> siteanalyze_ng test
             path -> /1/2/3/4
               rt -> 100
              ref -> http://localhost:8080/www/siteanalyze_ng/
              res -> 1920x1200
               sw -> searchy word
             hits -> 10
               ft -> javascript
           groups -> 1234
               rn -> 28649
             guid -> 00000
  surveysessionid -> s1234
             ourl -> collision
*/


function sz_getlogurl(p_url) {
    if (p_url) {url = p_url;}
    var get_log_url = "";

    var sz_url = "";if (typeof url=="string") {sz_url=escape(url);} else {sz_url=escape(location.href);}sz_url = sz_url.split("\n").join("").split("\r").join("");
    get_log_url += "dump.php?url=" + sz_url;

    if (typeof sz_account_id!="undefined") {get_log_url += sz_account_id ? "&accountid=" + sz_account_id : "";}    var sz_cid = "";if (typeof cid!="undefined") {sz_cid=escape(cid);}sz_cid = sz_cid.split("\n").join("").split("\r").join("");get_log_url += sz_cid ? "&cid=" + sz_cid : "";
    var sz_cvid = "";if (typeof cvid!="undefined") {sz_cvid=escape(cvid);}sz_cvid = sz_cvid.split("\n").join("").split("\r").join("");get_log_url += sz_cvid ? "&cvid=" + sz_cvid : "";
    var sz_session = "";if (typeof session!="undefined") {sz_session = session;}sz_session = sz_session.split("\n").join("").split("\r").join("");get_log_url += sz_session ? "&session=" + sz_session : "";
    var sz_title = ""; sz_title=escape(document.title);var jstitle = "";if (typeof pagetitle=="string") {sz_title=escape(pagetitle);}sz_title = sz_title.split("\n").join("").split("\r").join("");get_log_url += sz_title ? "&title=" + sz_title : "";
    var sz_path = "";if (typeof path=="string") {sz_path=escape(path);}sz_path = sz_path.split("\n").join("").split("\r").join("");get_log_url += sz_path ? "&path=" + sz_path : "";
    var sz_responseTime = "";if (typeof responseTime!="undefined") {sz_responseTime=escape(responseTime);}sz_responseTime = sz_responseTime.split("\n").join("").split("\r").join("");get_log_url += sz_responseTime ? "&rt=" + sz_responseTime : "";
    var sz_referer = ""; if (typeof referer=="string") {sz_referer=escape(referer); }else {sz_referer=escape(document.referrer);}sz_referer = sz_referer.split("\n").join("").split("\r").join("");get_log_url += sz_referer ? "&ref=" + sz_referer : "";
    var sz_screenResolution = window.screen.width + "x" + window.screen.height;sz_screenResolution = sz_screenResolution.split("\n").join("").split("\r").join("");get_log_url += sz_screenResolution ? "&res=" + sz_screenResolution : "";
    var sz_searchWord = "";if (typeof searchWord!="undefined") {sz_searchWord=escape(searchWord);}sz_searchWord = sz_searchWord.split("\n").join("").split("\r").join("");get_log_url += sz_searchWord ? "&sw=" + sz_searchWord : "";
    var sz_numberOfHits = "";if (typeof numberOfHits!="undefined") {sz_numberOfHits=escape(numberOfHits);}sz_numberOfHits = sz_numberOfHits.split("\n").join("").split("\r").join("");get_log_url += sz_numberOfHits ? "&hits=" + sz_numberOfHits : "";
    var sz_filetype = "";if (typeof filetype!="undefined") {sz_filetype=escape(filetype);}sz_filetype = sz_filetype.split("\n").join("").split("\r").join("");get_log_url += sz_filetype ? "&ft=" + sz_filetype : "";
    var sz_groups = "";if (typeof groups!="undefined") {sz_groups=escape(groups);}sz_groups = sz_groups.split("\n").join("").split("\r").join("");get_log_url += sz_groups ? "&groups=" + sz_groups : "";
    var sz_ourl = ""; if (typeof sz_forceurl=="string") {sz_ourl=escape(sz_forceurl);}sz_ourl = sz_ourl.split("\n").join("").split("\r").join("");get_log_url += sz_ourl ? "&ourl=" + sz_ourl : "";
    var sz_metarobotscontent = document.getElementsByTagName('meta')['robots'] ? document.getElementsByTagName('meta')['robots'].content : "";
    var sz_metarobotsaddon = sz_metarobotscontent ? "&robots=" + escape(sz_metarobotscontent) : ""; sz_metarobotsaddon = sz_metarobotsaddon.split("\n").join("").split("\r").join("");get_log_url += sz_metarobotsaddon;
    var randomNum = Math.floor(Math.random()*100000);
    get_log_url += randomNum ? "&rn=" + randomNum : "";
  nmstatCookie = sz_cookie('nmstat');
  if (nmstatCookie===null) {sz_cookie('nmstat',sz_session+(new Date()).getTime()+randomNum,{domain: document.domain, path: '/', expires: 1000});}
  nmstatCookie = sz_cookie('nmstat');
  if (nmstatCookie!==null) {sz_previousSessionId = escape(nmstatCookie);}sz_previousSessionId = sz_previousSessionId.split("\n").join("").split("\r").join("");
    get_log_url += sz_previousSessionId ? "&prev=" + sz_previousSessionId : "";
    var sz_uid = "";
if (typeof sz_userid!="undefined") {sz_uid=escape(sz_userid);}
    var sz_guid = "";if (typeof guid!="undefined") {sz_guid=escape(guid);}
    if (sz_guid==="") {
        for (var j=0; j< document.forms.length; j++) {
            if (document.forms[j].action) {
                var sz_tmp = document.forms[j].action.toString().toUpperCase();
                if (sz_tmp.indexOf("NRNODEGUID")!=-1) {
                    sz_guid = sz_tmp.substr(sz_tmp.indexOf("NRNODEGUID")+11);
                    if (sz_guid.indexOf("%7B")===0) {
                        sz_guid = sz_guid.substring(3);
                        sz_guid = sz_guid.substring(0, sz_guid.indexOf("%7D"));
                    }
                }
            }
        }
    }
    sz_guid = sz_guid.split("\n").join("").split("\r").join("");
    sz_uid = sz_uid.split("\n").join("").split("\r").join("");
    get_log_url += sz_guid ? "&guid=" + sz_guid : "";
    get_log_url += sz_uid ? "&uid=" + sz_uid : "";
    jstitle = jstitle.split("\n").join("").split("\r").join("");
    get_log_url += jstitle ? "&jstitle=" + jstitle : "";
    var sz_surveysessionid = ""; if (typeof surveysessionid!="undefined"){ sz_surveysessionid = surveysessionid;}sz_surveysessionid = sz_surveysessionid.split("\n").join("").split("\r").join("");
    get_log_url += sz_surveysessionid ? "&surveysessionid=" + sz_surveysessionid : "";
    if (typeof(_szpars) == "object") {
        for (var i in _szpars) {
            get_log_url += "&" + encodeURIComponent('grk_' + i) + '=' + encodeURIComponent(_szpars[i]);
        }
    }
    return get_log_url;
}

function writeStatistics() {
    if (src_loaded === true) {return;}
    if (document.images) {
        var img1 = new Image();
        img1.src = sz_getlogurl("");
    }
}

function logfile(filename, filetype, fileurl, groups, path) {
    var title   = filename;
    var url     = fileurl;
   var referer = location.href;
   
   var randomNum = Math.floor(Math.random()*100000) ;

    if (document.images) {
        var img1 = new Image();
        img1.src = "dump.php?ourl=" + escape(url) + "&title="+escape(title)+"&path="+escape(path) + "&ref=" + escape(referer) +"&ft="+escape(filetype)+"&groups="+escape(groups)+"&rn="+randomNum;
    }
    return;
}

function setgroupsfrommeta(mn){
    if (typeof groups=="undefined") {groups = "";}
    var m = document.getElementsByTagName('meta');   
    for(var i in m) {
        if(m[i].name === mn) {
            groups += (groups===""?"":",") + m[i].content;
        }
    }
}
if (typeof metagroupname!="undefined")
    {setgroupsfrommeta(metagroupname);}

writeStatistics();
src_loaded = true;

var currenturl = location.href;
var excludelist = {asp:1,aspx:1,php:1}

var l = document.links.length ? document.links : document.getElementsByTagName("a");
for (var c=0;c<l.length;c++) {
    if (l[c].href) {
        var l_href = l[c].href.toString().split("\n").join("").split("\r").join("");;
        if (l_href.match("#$")=="#") {continue;}
        var log_href = l_href.toString().replace("\\","\\\\").replace(/"/g,"\\\"");
        if (l[c].addEventListener) {
            eval("l[c].addEventListener('click', function(){onclicklogfile(\"" + log_href + "\");}, false);");
        } else if (l[c].attachEvent) {
            eval("l[c].attachEvent('onclick', function(){onclicklogfile(\"" + log_href + "\");});");
        }
    }
}


function onclickRegexReplace(inputString, fromString, toString) {var regString = new RegExp(fromString, "gi");return inputString.replace(regString, toString);}
function onclicklogfile(url) {
    var referer = location.href;
    var randomNum = Math.floor(Math.random()*100000) ;
    if (document.images) {
        var img1 = new Image();
        img1.src = "dump.php?ourl=" + escape(url) + "&ref=" + escape(referer) +"&autoonclick=1&rn="+randomNum;
    }
    return;
}
function sz_simple_cookie(name, value) {
    return sz_cookie(name, value, {domain: document.domain, path: '/', expires: 1000});
}
function sz_cookie(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i].replace( /^\s+|\s+$/g, "" );
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
} 