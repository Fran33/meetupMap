
    // share memory of individual API results in array visible to both AJAX callback and HTML update method
    // this memory is not needed for sharing between AJAX and HTML
    // but this memory can help when HTML is only view and we need to maintain the full data set accumulated from multiple query pages
    var jsonRSVPsResultsForSelection   = [];
    var rsvpsNameToHTML1 = new Array();
    var rsvpsNameToHTML2 = new Array();
    var PAGE_SIZE = 200;
    // maintain map memory for deduplication
    var pointToMarkerDictionary = {};
    var filterToGroupsDictionary = new Array();
    var debug = 1;
    

    <!--   methods for calling meetup api with AJAX functionality, javascript client --------------------------------->
    // offset is basically the page number of results, max of 200 per page
    // page lets you limit the number of results per page, from 0 .. 200
    function processMeetupRSVPsForEventNum1(id,offset,page){
       var api = new MeetupApiClient(document.getElementById('api-key').value);
       api.get_rsvps({'event_id':id,'offset':offset, 'page':page, 'order':'name'} , handleEventNum1RSVPs);
    }
    function processMeetupRSVPsForEventNum2(id,offset,page) {
       var api = new MeetupApiClient(document.getElementById('api-key').value);
       api.get_rsvps({'event_id':id,'offset':offset, 'page':page, 'order':'name'} , handleEventNum2RSVPs);
    }
    
    <!--   supporting call-back methods for calling meetup api ---------------------------------------------->
    <!--   1. AJAX call-back methods for calling meetup api ---------------------------------------------------->
    
    
    <!--   map call-back methods for calling meetup api ----------------------------------------------------->
    <!--   1. AJAX call-back methods for calling meetup api ---------------------------------------------------->
    <!--   need call-back to handle additional pages, because cannot wait for page to determine if next page is needed-->
    
    <!-- build table with link to user per row -->
    function handleEventNum1RSVPs(json){
       var count = 0;
       var myHTML;
       myHTML += "<table>";
       for(t in json.results) {
          if (json.results[t].response == "yes") {
          	myHTML += "<tr><td><a href=\"" + json.results[t].link + "\">"  
                                            + json.results[t].name 
                                            + "," + json.results[t].city 
                                            + "," + json.results[t].zip 
                                            + "</a></td></tr>";
                rsvpsNameToHTML1[json.results[t].link] = json.results[t].link;
                count++;
          }
       }
       myHTML += "</table>";
       document.getElementById('rsvpsEventNum1-span').innerHTML = myHTML;
    }
    
    <!-- build table with id of user per row -->
    function handleEventNum2RSVPs(json){
       var count = 0;
       
       var myHTML;
       myHTML += "<table>";
       for(t in json.results) {
          if (json.results[t].response == "yes") {
          	myHTML += "<tr><td><a href=\"" + json.results[t].link + "\">" 
                                            + json.results[t].name 
                                            + "," + json.results[t].city 
                                            + "," + json.results[t].zip 
                                            + "</a></td></tr>";
                rsvpsNameToHTML2[json.results[t].member_id] = json.results[t].link;
                count++;
          }
       }
       myHTML += "</table>";
       document.getElementById('rsvpsEventNum2-span').innerHTML = myHTML;
    }
    

    <!--   supporting call-back methods for calling meetup api ---------------------------------------------->
    <!--   1. AJAX call-back methods for calling meetup api ---------------------------------------------------->
        
    function getRSVPsForEventNum1() {
    	    var selectObject = document.getElementById('eventIDNum1');
    	    var id = selectObject.value;
    	    processMeetupRSVPsForEventNum1(id,0,200);
    }

    function getRSVPsForEventNum2() {
    	    var selectObject = document.getElementById('eventIDNum2');
    	    var id = selectObject.value;
    	    processMeetupRSVPsForEventNum2(id,0,200);
    }
    
    function consolidateRSVPsAndDisplay() {
       var myHTML;
       var len1 = rsvpsNameToHTML1.length;
       var len2 = rsvpsNameToHTML2.length;
       var max = len1;
       if (len1 < len2)
       	       max = len2;
       for(i=0;i<max;i++) {
       	       if (rsvpsNameToHTML1[i] == rsvpsNameToHTML2[i]){
       	       	       // dup
       	       }
       }

       myHTML += "<table>";
       // go through 
       myHTML += "</table>";
       document.getElementById('rsvpsEventBoth-span').innerHTML = myHTML;
    }

