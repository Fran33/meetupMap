

    // share memory of individual API results in array visible to both AJAX callback and HTML update method
    // this memory is not needed for sharing between AJAX and HTML
    // but this memory can help when HTML is only view and we need to maintain the full data set accumulated from multiple query pages
    var jsonGroupsResultsForSelection  = [];
    var jsonGroupsResultsForTable      = [];
    var jsonMembersResultsForSelection = [];
    var jsonEventsResultsForSelection  = [];
    var jsonRSVPsResultsForSelection   = [];
    var jsonFiltersResultsForSelection   = [];
    var showOnlyTheseFilters = [];
    var PAGE_SIZE = 200;
    // maintain map memory for deduplication
    var pointToMarkerDictionary = {};
    var filterToGroupsDictionary = new Array();
    var debug = 1;

    <!--   methods for calling meetup api with AJAX functionality, javascript client --------------------------------->
    // offset is basically the page number of results, max of 200 per page
    // page lets you limit the number of results per page, from 0 .. 200
    function mapMeetupMembersForGroup(id,offset,page) {
       var api = new MeetupApiClient(document.getElementById('api-key').value);
       api.get_members({'group_id':id,'offset':offset, 'page':page, 'order':'name'} , mark_members_on_map);
    }
    function mapMeetupRSVPsForEvent(id,offset,page){
       var api = new MeetupApiClient(document.getElementById('api-key').value);
       api.get_rsvps({'event_id':id,'offset':offset, 'page':page, 'order':'name'} , mark_rsvps_on_map);
    }
    function loadMeetupMembersForGroup(id,offset,page) {
       var api = new MeetupApiClient(document.getElementById('api-key').value);
       api.get_members({'group_id':id,'offset':offset, 'page':page, 'order':'name'} , convert_members_to_rows);
    }
    function loadMeetupEventsForGroup(id,offset,page) {
       var api = new MeetupApiClient(document.getElementById('api-key').value);
       api.get_events({'group_id':id,'offset':offset, 'page':page, 'order':'time'} , convert_events_to_rows);
    }
    function loadMeetupGroupsForMember(offset,page) {
       var api = new MeetupApiClient(document.getElementById('api-key').value);
       var id = document.getElementById('meetup-id').value;
       api.get_groups({'member_id':id,'offset':offset, 'page':page, 'order':'name'} , handle_groups_results);
       
    }
    function loadMeetupMemberID(offset,page) {
       var api = new MeetupApiClient(document.getElementById('api-key').value);
       api.get_members({'relation':'self','offset':offset, 'page':page, 'order':'name'} , load_member_id);
    }
    function loadMeetupRSVPsForEvent(id,offset,page) {
       var api = new MeetupApiClient(document.getElementById('api-key').value);
       api.get_rsvps({'event_id':id,'offset':offset, 'page':page, 'order':'name'} , convert_rsvps_to_rows);
    }
    
    <!--   supporting call-back methods for calling meetup api ---------------------------------------------->
    <!--   1. AJAX call-back methods for calling meetup api ---------------------------------------------------->
    
    <!--   supporting map methods for de-duplicating data ------------------->
    function recordMarker(marker) {
        pointToMarkerDictionary[marker.getLatLng()] = marker;
    }
    
    function findMarker(marker){
        return pointToMarkerDictionary[marker.getLatLng()];
    }
    
    function clearMap() {
        map.clearOverlays();
        pointToMarkerDictionary = {};
    }
    
    <!--   map call-back methods for calling meetup api ----------------------------------------------------->
    <!--   1. AJAX call-back methods for calling meetup api ---------------------------------------------------->
    <!--   need call-back to handle additional pages, because cannot wait for page to determine if next page is needed-->
    function mark_members_on_map(json){
       var point = null;
       var marker = null;
       var count = 0;
       
       for(t in json.results) {
            point = new GLatLng(json.results[t].lat,json.results[t].lon);
            marker = findMarker(new GMarker(point));
            if(marker == null) {
                marker = new GMarker(point);
                marker.value = "<a href=\"" + json.results[t].link + "\">" 
                                            + json.results[t].name 
                                            + "," + json.results[t].city 
                                            + "," + json.results[t].zip 
                                            + "</a>";
                count++;
                recordMarker(marker);
            } else {
                // get market of existing point, and add to value
                marker.value += "<br><a href=\"" + json.results[t].link + "\">" 
                                                 + json.results[t].name 
                                                 + "," + json.results[t].city 
                                                 + "," + json.results[t].zip 
                                                 + "</a>";
                count++;
            }
       }
       update_map_icons_with_counts(pointToMarkerDictionary);
       plot_points_on_map(pointToMarkerDictionary);
       
       if (debug == 1) loadStatus("mapped " + count + " members");
       
       convert_members_to_rows(json);
    }
    
    function plot_points_on_map(dict) {
        for (var n in dict) {
            if (dict.hasOwnProperty(n)) {
                var marker = dict[n];
                var point = marker.getLatLng();
                createListener(point,marker);
                map.addOverlay(marker);
            }
        }
    }

    
    function update_map_icons_with_counts(dict) {
        // for each marker, check marker.value for number of href's
        // use href count to replace market with marker having number icon plus same marker value
        for (var n in dict) {
            if (dict.hasOwnProperty(n)) {
                var marker = dict[n];
                var baseIcon = new GIcon(G_DEFAULT_ICON);
                //baseIcon.shadow = "http://www.google.com/mapfiles/shadow50.png";
                //baseIcon.iconSize = new GSize(20, 34);
                //baseIcon.shadowSize = new GSize(37, 34);
                //baseIcon.iconAnchor = new GPoint(9, 34);
                //baseIcon.infoWindowAnchor = new GPoint(9, 2);

                // Create a lettered icon for this point using our icon class
                var size = 0;
                var text = marker.value;
                var index = text.indexOf("href");
                while(index != -1) {
                    size++;
                    text = text.substr(index+1,text.length-1);
                    index = text.indexOf("href");
                }
                var number = String.fromCharCode("0".charCodeAt(0) + size);
                var numberedIcon = new GIcon(baseIcon);
                // http://code.google.com/p/google-maps-icons/wiki/NumericIcons
                if (number < 10)
                    numberedIcon.image = "http://google-maps-icons.googlecode.com/files/red0" + number + ".png";
                else 
                    numberedIcon.image = "http://google-maps-icons.googlecode.com/files/red" + number + ".png";
                // Set up our GMarkerOptions object
                var myOptions = { icon:numberedIcon };
                var point = marker.getLatLng();
                var numberMarker = new GMarker(point,myOptions);
                numberMarker.value = marker.value;
                dict[point] = numberMarker;
            }
        }
    }
    
    function mark_rsvps_on_map(json){
       var point = null;
       var marker = null;
       var count = 0;
       
       for(t in json.results) {
          if (json.results[t].response == "yes") {
            point = new GLatLng(json.results[t].coord,json.results[t].lon);
            marker = findMarker(new GMarker(point));
            if(marker == null) {
                marker = new GMarker(point);
                marker.value = "<a href=\"" + json.results[t].link + "\">" 
                                            + json.results[t].name 
                                            + "," + json.results[t].city 
                                            + "," + json.results[t].zip 
                                            + "</a>";
                count++;
                recordMarker(marker);
            } else {
                // get market of existing point, and add to value
                marker.value += "<br><a href=\"" + json.results[t].link + "\">" 
                                                 + json.results[t].name 
                                                 + "," + json.results[t].city 
                                                 + "," + json.results[t].zip 
                                                 + "</a>";
                count++;
            }
          }
       }
       if (debug == 1) loadStatus("mapped " + count + " yes rsvp's");

       update_map_icons_with_counts(pointToMarkerDictionary);
       plot_points_on_map(pointToMarkerDictionary);
       
       convert_rsvps_to_rows(json);
    }
    
    function createListener(point,marker) {
       GEvent.addListener(marker, "click", function() {
          var myHtml = "<b>" + marker.value + "</b><br/>";
          map.openInfoWindowHtml(point,myHtml);
       });
    }

    <!--   supporting call-back methods for calling meetup api ---------------------------------------------->
    <!--   1. AJAX call-back methods for calling meetup api ---------------------------------------------------->
    
    function clearSelectionList(name) {
        if (name == "groups") {
            jsonGroupsResultsForSelection.splice(0); // delete everything after the 0th element
            jsonGroupsResultsForSelection.pop(); // delete the last element
        }
        if (name == "members") {
            jsonMembersResultsForSelection.splice(0); // delete everything after the 0th element
            jsonMembersResultsForSelection.pop(); // delete the last element
        }
        if (name == "events") {
            jsonEventsResultsForSelection.splice(0); // delete everything after the 0th element
            jsonEventsResultsForSelection.pop(); // delete the last element
        }
        if (name == "rsvps") {
            jsonRSVPsResultsForSelection.splice(0); // delete everything after the 0th element
            jsonRSVPsResultsForSelection.pop(); // delete the last element
        }
        if (name == "filters") {
            jsonFiltersResultsForSelection.splice(0); // delete everything after the 0th element
            jsonFiltersResultsForSelection.pop(); // delete the last element
        }
    }
       
    function handle_groups_results(json) {
        loadGroupsSelectionList(json);
        loadGroupsTable(json);
        loadFiltersSelectionList(json);
    }
    
    function loadGroupsSelectionList(json) {
       // convert groups to selection list
       var k = jsonGroupsResultsForSelection.length;
       for(t in json.results) {
            jsonGroupsResultsForSelection[k++] = '<option' + ' value=\"' + json.results[t].id   + '\"'
                                                           + ' name=\"'  + json.results[t].name + '\"'
                                                           + '>' 
                                                           + json.results[t].name 
                                                           //+ ' = ' + json.results[t].id 
                                                           + '</option>';
       }
    }
    
    function loadGroupsTable(json) {
       // build table of groups and their topics
       var l = jsonGroupsResultsForTable.length;
       jsonGroupsResultsForTable[l++] = "<th>Group</th><th>topic</th>";
       for(t in json.results) {
           var c = 0;
           var currentGroupTopicsArray = new Array();
           for(v in json.results[t].topics) {
             var topic = json.results[t].topics[v].name;
             currentGroupTopicsArray[c++] = topic;
           }
           currentGroupTopicsArray.sort();
           // for group, display all topics
           var currentGroupTopicsHTML = '<tr>' + '<td>' + '<a href=\"' + json.results[t].link + '\"/>' + json.results[t].name + '</a>' + '</td>' + '<td>';
           for(r in currentGroupTopicsArray) {
             currentGroupTopicsHTML += currentGroupTopicsArray[r] + ',';
           }
           currentGroupTopicsHTML += '</td></tr>';
           jsonGroupsResultsForTable[l++] = currentGroupTopicsHTML;
       }
    }
    
    function loadFiltersSelectionList(json) {
       // build selection list of all unique topics
       for(t in json.results) {
           var c = 0;
           var currentGroupTopicsArray = new Array();
           // as each group is encountered map unique topics to array of applicable groups
           for(v in json.results[t].topics) {
             var topic = json.results[t].topics[v].name;
             var existingGroups = filterToGroupsDictionary[topic];
             // build unique list of topics                                 
             if (existingGroups == null) {
                existingGroups = new Array();
                existingGroups[0] = json.results[t].id;
                filterToGroupsDictionary[topic] = existingGroups;
             } else {
                existingGroups[existingGroups.length] = json.results[t].id;
                filterToGroupsDictionary[topic] = existingGroups;
             }
           }
       }
       
       var k = jsonGroupsResultsForSelection.length;
       // TODO order the filter list either alphabetically or by filter count
       for(key in filterToGroupsDictionary) {
            jsonFiltersResultsForSelection[k++] = '<option' + ' len=\"' + (filterToGroupsDictionary[key]).length   + '\"'
                                                             + ' val=\"'  + key + '\"'
                                                             + '>' 
                                                             + key 
                                                             + '</option>';
       }

       
       
       
       // if groups are not publicly listed, json.meta does not exist...
       var selectObject = document.getElementById('meetup-id');
       var name = selectObject.value;
       loadStatus("Loaded " + jsonGroupsResultsForSelection.length + " of " + json.meta.total_count + " groups for " + name);

       loadGroupsSelection(); // from AJAX call-back, call method to update HTML
       
       loadGroupsForFilter(); // from AJAX call-back, call method to update HTML
    }

    function convert_events_to_rows(json) {
       var k = jsonEventsResultsForSelection.length;
       var j = 0;
       for(t in json.results) {
          if (debug == 1)
            jsonEventsResultsForSelection[k++] = '<option' + ' value=\"' + json.results[t].id   + '\"'
                                                           + ' name=\"'  + json.results[t].name + '\"'
                                                           + '>' 
                                                           + json.results[t].name 
                                                           //+ ' = ' + json.results[t].id 
                                                           + '</option>';
          else
            jsonEventsResultsForSelection[k++] = '<option' + ' value=\"' + json.results[t].id   + '\"'
                                                           + ' name=\"'  + json.results[t].name + '\"'
                                                           + '>' 
                                                           + json.results[t].name 
                                                           //+ ' = ' + json.results[t].id 
                                                           + '</option>';
          j++;
       }
       var selectObject = document.getElementById('groups');
       var name = selectObject.options[selectObject.selectedIndex].innerHTML;
       loadStatus("Loaded " + jsonEventsResultsForSelection.length + " of " + json.meta.total_count + " events for " + name);

       loadEventsSelection(); // from AJAX call-back, call method to update HTML
    }
    
    function load_member_id(json) {
       document.getElementById('meetup-id').value = json.results[0].id;
    }

    function convert_members_to_rows(json) {
       var k = jsonMembersResultsForSelection.length;
       var j = 0;
       for(t in json.results) {
          if (debug == 1)
            jsonMembersResultsForSelection[k++] = '<option' + ' value=\"' + json.results[t].id   + '\"'
                                                            + ' name=\"'  + json.results[t].name + '\"'
                                                            + '>' 
                                                            + json.results[t].name 
                                                          //+ ' = ' + json.results[t].id 
                                                          //+ ' : ' + json.results[t].lat + '--' + json.results[t].lon
                                                            + '</option>';
          else
            jsonMembersResultsForSelection[k++] = '<option value=\"' + json.results[t].id + '\">' + json.results[t].name + '</option>';
          j++;
       }
       
       var selectObject = document.getElementById('groups');
       var name = selectObject.options[selectObject.selectedIndex].innerHTML;
       loadStatus("Loaded " + jsonMembersResultsForSelection.length + " of " + json.meta.total_count + " members for " + name);

       loadMembersSelection(); // from AJAX call-back, call method to update HTML
    }
    
    function convert_rsvps_to_rows(json) {
       var k = jsonRSVPsResultsForSelection.length;
       var j = 0;
       for(t in json.results) {
          if (debug == 1)
            jsonRSVPsResultsForSelection[k++] = '<option' + ' value=\"' + json.results[t].id 
                                                          + ' name=\"'  + json.results[t].name 
                                                          + '\">' 
                                                          + json.results[t].response + '=' + json.results[t].name 
                                                        //+ ' = ' + json.results[t].id 
                                                        //+ ' : ' + json.results[t].coord + '--' + json.results[t].lon
                                                          + '</option>';
          else
            jsonRSVPsResultsForSelection[k++] = '<option value=\"' + json.results[t].id + '\">' + json.results[t].name + '</option>';
          j++;
       }
       
       
       var selectObject = document.getElementById('events');
       var name = selectObject.options[selectObject.selectedIndex].innerHTML;
       loadStatus("Loaded " + jsonRSVPsResultsForSelection.length + " of " + json.meta.total_count + " Yes rsvp's for " + name);
       
       loadRSVPsSelection(); // from AJAX call-back, call method to update HTML
    }

    
    <!--   2. methods for initiating AJAX request from html   ----------------------------------------------------------->
    
    function retrieveMemberID() {
        var offset = 0;
        loadMeetupMemberID(offset,PAGE_SIZE);
    }
    
    function loadMapWithMembers(offset) {
        var selectObject = document.getElementById('groups');
        var id = selectObject.options[selectObject.selectedIndex].value;
        if (offset == 0) {
            clearSelectionList("members");
            clearMap(); 
        }
        if (offset != 0)
            offset = jsonMembersResultsForSelection.length / 200;
        mapMeetupMembersForGroup(id,offset,PAGE_SIZE);
        //loadMembersSelection();
    }
    
    function loadMapWithRSVPs(offset) {
        var selectObject = document.getElementById('events');
        var id = selectObject.options[selectObject.selectedIndex].value;
        if (offset == 0){
            clearSelectionList("rsvps");
            clearMap();
        }
        if (offset != 0)
            offset = jsonRSVPsResultsForSelection.length / 200;
        mapMeetupRSVPsForEvent(id,offset,PAGE_SIZE);
        //loadRSVPsSelection();
    }
    
    function loadGroupsForMember(offset) {
        if (offset == 0)
            clearSelectionList("groups");
        // if there are multiple pages, then they can either be shown all as one list, or as individually retrieved pages
        // odds are pages are not gonna change often
        // so just store entire set in array, and accumulate as needed, and display as visible
        loadMeetupGroupsForMember(offset,PAGE_SIZE);
       
        // per ajax "asynchronous" magic, this method ends with the request sent
        // this method now exits, and the browser is free to respond to other events
        // once the "asynchronous" request is answered, and data received, the callback method, which was given to the AJAX routine (the meetup api call), does the rest,
        // so the browser can handle multiple requests in rapid sequence, by not waiting for each one to come back before proceeding to the next
    }

    function loadMembersForGroup(offset) {
        if (offset == 0)
            clearSelectionList("members");
        else
            offset = jsonMembersResultsForSelection.length / 200;
            
        loadStatus("loading members page " + offset);
        
        // method called by HTML to answer user request
        // method also called by AJAX-call-back to support user request with additional pages of results
        // that way this is the only mehtod that formally calls the api wrapper function
        var selectObject = document.getElementById('groups');
        var id = selectObject.options[selectObject.selectedIndex].value;  

        loadMeetupMembersForGroup(id,offset,PAGE_SIZE);
    }

    function loadEventsForGroup(offset) {
        if (offset == 0)
            clearSelectionList("events");
        var selectObject = document.getElementById('groups');
        var id = selectObject.options[selectObject.selectedIndex].value;

        loadMeetupEventsForGroup(id,offset,PAGE_SIZE);
    }
    
    function loadRSVPsForEvent(offset) {
        if (offset == 0)
            clearSelectionList("rsvps");
        var selectObject = document.getElementById('events');
        var id = selectObject.options[selectObject.selectedIndex].value;
       
        loadMeetupRSVPsForEvent(id,offset,PAGE_SIZE);
    }

    <!--   3. methods for AJAX call-back to write back to html   ----------------------------------------------------------->
    
    function loadGroupsSelection() {
       document.getElementById('groups-span').innerHTML="<select id=\"groups\"></select>";
       for(t in jsonGroupsResultsForSelection ) {
          var x = document.getElementById('groups-span').innerHTML;
          x = x.replace("</select>", jsonGroupsResultsForSelection[t] + "</select>");
          document.getElementById('groups-span').innerHTML = x;
       }
       document.getElementById('groups-span').innerHTML+="</select>";
    }
    
    function loadMembersSelection() {
        document.getElementById('members-span').innerHTML="<select id=\"members\"></select>";
        for(t in jsonMembersResultsForSelection) {
            var x = document.getElementById('members-span').innerHTML;
            x = x.replace("</select>", jsonMembersResultsForSelection[t] + "</select>");
            document.getElementById('members-span').innerHTML = x;
        }
        document.getElementById('members-span').innerHTML+="</select>";
    }
    
    function loadEventsSelection() {       
       document.getElementById('events-span').innerHTML="<select id=\"events\"></select>";
       for(t in jsonEventsResultsForSelection) {
          var x = document.getElementById('events-span').innerHTML;
          x = x.replace("</select>", jsonEventsResultsForSelection[t] + "</select>");
          document.getElementById('events-span').innerHTML = x;
       }
       document.getElementById('events-span').innerHTML+="</select>";
    }
    
    function loadRSVPsSelection() {       
       document.getElementById('rsvps-span').innerHTML="<select id=\"rsvps\"></select>";
       for(t in jsonRSVPsResultsForSelection) {
          var x = document.getElementById('rsvps-span').innerHTML;
          x = x.replace("</select>", jsonRSVPsResultsForSelection[t] + "</select>");
          document.getElementById('rsvps-span').innerHTML = x;
       }
       document.getElementById('rsvps-span').innerHTML+="</select>";
    }
    
    function loadGroupsForFilter() {
       var newHTML = "";
       // first display all groups, each with all topics
       for(t in jsonGroupsResultsForTable) {
            if (filterFoundInGroup(jsonGroupsResultsForTable[t])) {
                // add table row with group name and comma-separated-group-topics
                newHTML += jsonGroupsResultsForTable[t];
            }
       }
       document.getElementById('group-filter-table').innerHTML=newHTML;
       
       // second display selection list of topics
       document.getElementById('filters-span').innerHTML="<select id=\"filters\"></select>";
       for(t in jsonFiltersResultsForSelection) {
          var x = document.getElementById('filters-span').innerHTML;
          x = x.replace("</select>", jsonFiltersResultsForSelection[t] + "</select>");
          document.getElementById('filters-span').innerHTML = x;
       }
       document.getElementById('filters-span').innerHTML+="</select>";
    }
    
    function showGroupsWithFilter() {
        var selectObject = document.getElementById('filters');
        var name = selectObject.options[selectObject.selectedIndex].value;
        showOnlyTheseFilters[showOnlyTheseFilters.length] = name;
        document.getElementById('current-filters-span').innerHTML+="<br>" + name;
        loadGroupsForFilter();
    }
    
    function clearGroupsFilter() {
        showOnlyTheseFilters.splice(0); // delete everything after the 0th element
        showOnlyTheseFilters.pop(); // delete the last element
        document.getElementById('current-filters-span').innerHTML="<br>None";
        loadGroupsForFilter();
    }

    <!-- helper function -->
    function loadStatus(text) {
        if (debug == 1) document.getElementById('status-span').innerHTML = text;
    }
    
    function filterFoundInGroup(text) {
        var found = 0;
        for (f in showOnlyTheseFilters) {
          if (text.indexOf(showOnlyTheseFilters[f]) != -1) {
            found = 1;
            return found;
          }
        }
        return found;
    }
