/*alert('including includes');*/

function includeJavaScript(text)
{
  //alert("including " + text);
  var key = "ABQIAAAApu1FJP7pufT5_nOm518DSxSvWKiAWLhk_sOygIARlDHV5l8aFBTFOaqbJcIfOtEoeNFR3FrF1DJbBg";
  //include_dom("http://maps.google.com/maps?file=api&amp;v=2.x&amp;key=" + key + "&sensor=false");
  //include_dom("markermanager.js");
  include_dom("meetupclient.js");
  include_dom("jquery-1.3.2.min.js");
}

function include_dom(script_filename) {
    var html_doc = document.getElementsByTagName('head').item(0);
    var js = document.createElement('script');
    js.setAttribute('language', 'javascript');
    js.setAttribute('type', 'text/javascript');
    js.setAttribute('src', script_filename);
    html_doc.appendChild(js);

    //var element = document.getElementById('initialize-gmap');
    //document.getElementByTagName('head').removeChild(element);

    return false;
}
includeJavaScript('everything');
//alert('processed includes');

//alert('including functions');
    var jsonGroupsResultsForSelection = [];
    var jsonEventsResultsForSelection = [];

    function initialize() {
//      alert('getting map image');
      if (GBrowserIsCompatible()) {
        geocoder = new GClientGeocoder();
        map = new GMap2(document.getElementById("map_canvas"));
//        alert(document.getElementById("map_canvas").getAttribute('style'));
        var reston = new GLatLng(showAddress(map,geocoder,"20190"));
        var zoom = 13;
        map.setCenter(new GLatLng(38.95,360-77.3), 13);
	  // set default controls, for zoom, etc.
        map.setUIToDefault();
//        alert('done loading map');
      }
    }

    function showAddress(map,geocoder,address) {
      if (geocoder) {
        geocoder.getLatLng(
          address,
          function(point) {
            if (!point) {
              //alert(address + " not found");
            } else {
              //map.setCenter(point, 13);
              //var marker = new GMarker(point);
              //map.addOverlay(marker);
              //marker.openInfoWindowHtml(address);
            }
          }
        );
      }
    }

    <!-- need function to invoke meetup api, get members for a group, parse out lat and lon labeled by name and town, and post all on a map -->
    <!-- http://api.meetup.com/members.json/?group_id=194793&key=3b7912140787aed45272d5764c64 -->
    <!-- http://api.meetup.com/rsvps.json/?event_id=35250372&key=3b7912140787aed45272d5764c64 -->

    function loadMeetupMembersForGroup(id,offset,page) {
       // offset is basically the page number of results, max of 200 per page
       // page lets you limit the number of results per page, from 0 .. 200
       var api = new MeetupApiClient('3b7912140787aed45272d5764c64');
       api.get_members({'group_id':id,'offset':offset, 'page':page} , mark_members_on_map);
    }
    function loadMeetupEventsForGroup(id,offset,page) {
       // offset is basically the page number of results, max of 200 per page
       // page lets you limit the number of results per page, from 0 .. 200
       var api = new MeetupApiClient('3b7912140787aed45272d5764c64');
       api.get_events({'group_id':id,'offset':offset, 'page':page, 'order':'time'} , convert_events_to_rows);
//       api.get_events({'group_id':id,'offset':offset, 'after':'10182009','page':page, 'order':'time'} , convert_events_to_rows);
    }
    function loadMeetupGroupsForMember(id,offset,page) {
       // offset is basically the page number of results, max of 200 per page
       // page lets you limit the number of results per page, from 0 .. 200
       var api = new MeetupApiClient('3b7912140787aed45272d5764c64');
       api.get_groups({'member_id':id,'offset':offset, 'page':page, 'order':'name'} , convert_groups_to_rows);
    }
    function loadMeetupRSVPsForEvent(id,offset,page){
    	    alert("calling for rsvp");
       // offset is basically the page number of results, max of 200 per page
       // page lets you limit the number of results per page, from 0 .. 200
       var api = new MeetupApiClient('3b7912140787aed45272d5764c64');
       api.get_rsvps({'event_id':id,'offset':offset, 'page':page, 'order':'name'} , mark_rsvps_on_map);
    }

    function mark_members_on_map(json){
       var point = null;
       var marker = null;
       var batch = [];

       for(t in json.results) {
              if (json.results[t].city != "Washington") {
	              point = new GLatLng(json.results[t].lat,json.results[t].lon);
      	        marker = new GMarker(point);
            	  marker.value = "<a href=\"" + json.results[t].link + "\">" + json.results[t].name + "," + json.results[t].city + "</a>";
			  createListener(point,marker);
                    //batch.push(marker);
	      	  map.addOverlay(marker);
		  }
       }
       //mgr.addMarkers(batch,3);
       //mgr.refresh();
    }
    function mark_rsvps_on_map(json){
// http://api.meetup.com/rsvps.json/?event_id=11336792&key=3b7912140787aed45272d5764c64
// egads, its not lat and lon, as API says, but coord and lon  !!!
       var point = null;
       var marker = null;
       var batch = [];

       for(t in json.results) {
          if (json.results[t].response == "yes") {
            point = new GLatLng(json.results[t].coord,json.results[t].lon);
            marker = new GMarker(point);
            marker.value = "<a href=\"" + json.results[t].link + "\">" + json.results[t].name + "," + json.results[t].city + "</a>";
	      createListener(point,marker);
            //batch.push(marker);
	      map.addOverlay(marker);
          }
       }
       //mgr.addMarkers(batch,3);
       //mgr.refresh();
    }
    function createListener(point,marker) {
       GEvent.addListener(marker, "click", function() {
          var myHtml = "<b>" + marker.value + "</b><br/>";
          map.openInfoWindowHtml(point,myHtml);
       });
    }

    function convert_groups_to_rows(json) {
       alert("compiling groups");
       var k = jsonGroupsResultsForSelection.length;
       var j = 0;
       for(t in json.results) {
          jsonGroupsResultsForSelection[k++] = '<option value=\"' + json.results[t].id + '\">' + json.results[t].name + '</option>';
          j++;
       }
       alert("Found " + j + "=" + jsonGroupsResultsForSelection.length + " groups");
    }

    function convert_events_to_rows(json) {
       alert("compiling events");
       var k = jsonEventsResultsForSelection.length;
       var j = 0;
       for(t in json.results) {
          jsonEventsResultsForSelection[k++] = '<option value=\"' + json.results[t].id + '\">' + json.results[t].name + '</option>';
          j++;
       }
       alert("Found " + j + "=" + jsonEventsResultsForSelection.length + " events");
    }

    function loadMapWithMembers() {
        var selectObject = document.getElementById('groups');
        alert("selected " + selectObject.options[selectObject.selectedIndex].value + " for map");
        var id = 194793;
        id = selectObject.options[selectObject.selectedIndex].value;
        map.clearOverlays();
        //mgr.clearMarkers();
	  for(var i = 0; i < 2000/200; i++) {
	        loadMeetupMembersForGroup(id,i,200);
	  }
    }

    function loadMapWithRSVPs() {
        var selectObject = document.getElementById('events');
        alert("selected " + selectObject.options[selectObject.selectedIndex].value + " for map");
        var id = selectObject.options[selectObject.selectedIndex].value;
        map.clearOverlays();
        //mgr.clearMarkers();
	  for(var i = 0; i < 2000/200; i++) {
	        loadMeetupRSVPsForEvent(id,i,200);
	  }
    }

    function loadGroupsForMember(elem) {
       alert("loading groups for member " + elem.value);
       jsonGroupsResultsForSelection.splice(0); // delete everything after the 0th element
       jsonGroupsResultsForSelection.pop(); // delete the last element
       loadMeetupGroupsForMember(elem.value,0,200);
       document.getElementById('groups-span').innerHTML="<select id=\"groups\"></select>";
       alert("loading " + jsonGroupsResultsForSelection.length + " groups for " + elem.value);
       for(t in jsonGroupsResultsForSelection ) {
          var x = document.getElementById('groups-span').innerHTML;
          x = x.replace("</select>", jsonGroupsResultsForSelection[t] + "</select>");
          document.getElementById('groups-span').innerHTML = x;
       }
       document.getElementById('groups-span').innerHTML+="</select>";
    }

    function loadEventsForGroup(elem) {
       var selectObject = document.getElementById('groups');
       var id = selectObject.options[selectObject.selectedIndex].value;
       alert("retrieving events for " + id);

       jsonEventsResultsForSelection.splice(0); // delete everything after the 0th element
       jsonEventsResultsForSelection.pop(); // delete the last element
       loadMeetupEventsForGroup(id,0,200);
       alert("making select list of events");
       document.getElementById('events-span').innerHTML="<select id=\"events\"></select>";
       for(t in jsonEventsResultsForSelection) {
          var x = document.getElementById('events-span').innerHTML;
          x = x.replace("</select>", jsonEventsResultsForSelection[t] + "</select>");
          document.getElementById('events-span').innerHTML = x;
       }
       document.getElementById('events-span').innerHTML+="</select>";
    }

//alert('done including functions');
