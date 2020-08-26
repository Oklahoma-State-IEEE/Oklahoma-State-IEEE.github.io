//Initialize FirebaseAuth function on startup
window.onload = function() {
  window.FirebaseAuth = new FirebaseAuth();
};

//Firebase Initialization
function FirebaseAuth() {
  this.checkSetup();

  //Shortcuts to sign in DOM elements
  this.googleSignInButton = document.getElementById('google-sign-in');
  this.githubSignInButton = document.getElementById('github-sign-in');
  this.signOutButton = document.getElementById('sign-out');

  //Edit fields and submit buttons
  this.duesSubmit = document.getElementById('paid-dues-submit');
  this.eventCheckInSubmit = document.getElementById('event-checkin-submit');
  this.eventCheckInCWID = document.getElementById('event-checkin-cwid');
  this.eventDeleteSubmit = document.getElementById('delete-event-submit');
  this.boardSubmit = document.getElementById('assign-board-submit');
  this.eventSubmit = document.getElementById('create-event-submit');
  this.removeBoardSubmit = document.getElementById('remove-board-submit');
  this.clearDuesSubmit = document.getElementById('clear-dues-submit');
  this.clearPointsSubmit = document.getElementById('clear-points-submit');
  this.exportEventSubmit = document.getElementById('export-event-submit');
  this.exportMembersSubmit = document.getElementById('export-members-submit');
  this.clearEventSubmit = document.getElementById('clear-event-submit');

  // Add listeners for sign in buttons
  this.googleSignInButton.addEventListener('click', this.googleSignIn.bind(this));
  this.githubSignInButton.addEventListener('click', this.githubSignIn.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));

  //Add listeners for submit buttons
  this.duesSubmit.addEventListener('click', this.paidDues.bind(this));
  this.eventCheckInSubmit.addEventListener('click', this.eventCheckIn.bind(this));
  //this.eventCheckInCWID.addEventListener('keydown', function(e){if(e.keyCode === 13){document.getElementById('event-checkin-submit').click()}});
  this.eventDeleteSubmit.addEventListener('click', this.eventDelete.bind(this));
  this.boardSubmit.addEventListener('click', this.assignBoard.bind(this));
  this.eventSubmit.addEventListener('click', this.createEvent.bind(this));
  this.removeBoardSubmit.addEventListener('click', this.removeBoard.bind(this));
  this.clearDuesSubmit.addEventListener('click', this.clearDues.bind(this));
  this.clearPointsSubmit.addEventListener('click', this.clearPoints.bind(this));
  this.exportMembersSubmit.addEventListener('click', this.exportMembers.bind(this));
  this.exportEventSubmit.addEventListener('click', this.exportEvent.bind(this));
  this.clearEventSubmit.addEventListener('click', this.clearEvent.bind(this));

  this.initFirebase();
}

// Checks that the Firebase SDK has been correctly setup and configured.
FirebaseAuth.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
};

FirebaseAuth.prototype.initFirebase = function() {
  //Shortcuts to Firebase SDK features
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  //Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

FirebaseAuth.prototype.googleSignIn = function() {
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

FirebaseAuth.prototype.githubSignIn = function() {
  var provider = new firebase.auth.GithubAuthProvider();
  provider.addScope('read:org');
  provider.addScope('user');
  this.auth.signInWithPopup(provider);
  //other stuff
};

FirebaseAuth.prototype.signOut = function() {
  this.auth.signOut();
};

FirebaseAuth.prototype.onAuthStateChanged = function(user) {
  if(user) {

    //User is signed in! Get user ID and store
    var uid = firebase.auth().currentUser.uid;
    this.uid = uid;

    //Get cwid from user ID
    this.database.ref('/accounts/' + uid + '/user').once('value').then((snapshot) => {
      var cwid = snapshot.val();

      if(cwid) {
        //Account is set up, store cwid
        this.cwid = cwid;

        //Display data
        this.displayData();
      }
      else {
        //Redirect to homepage, where they can complete new account setup
        window.location.replace("/");
      }

      //Hide sign-in button.
      $('#sign-in-li').attr("hidden", true);

      // Show user's profile and sign-out button.
      $('#user-li').removeAttr("hidden");
      $('#sign-out').removeAttr("hidden");
    });
  }
  else {
    //Redirect to homepage
    window.location.replace("/");
  }
};

FirebaseAuth.prototype.displayData = function() {
  var cwid = this.cwid;

  //Get user data and set on page
  this.database.ref('/members/' + cwid).once('value').then((snapshot) => {
    var userElement = snapshot.val();

    //Name
    var name = userElement.member.fname + " " + userElement.member.lname;
    $('#account-name').html(name);

    if(name.length > 10) {
      $('#userDropdown').html(userElement.member.fname + " " + userElement.member.lname.substr(0,1) + ".");
    }
    else {
       $('#userDropdown').html(name);
    }

    //Membership Status
    if(userElement.boardMember == true) {
      // Show board page
      $('#board-page').attr("hidden", false);
      // Set text
      $('#membershipLevel').html("Board Page");
      $('#membershipLevel').attr("href", "/membership");
      $('#account-status').html("Board Member");
    }
    else {
      window.location.replace("/");
    }
  });
  this.database.ref('/events').once('value', (eventSnapshot) => {
    var content = '';
    eventSnapshot.forEach((data) => {
      var val = data.val();
      var date_name = data.key;
      content += '<option>' + date_name + '</option>';
    });
    $('#event-checkin-event').empty();
    $('#event-export-event').empty();
    $('#event-clear-event').empty();
    $('#delete-event-event').empty();
    $('#event-checkin-event').append(content);
    $('#event-export-event').append(content);
    $('#event-clear-event').append(content);
    $('#delete-event-event').append(content);
  });
}

//FOR NATIONAL DUES
FirebaseAuth.prototype.paidDues = function() {
  //Check if CWID Number is a valid number
  var cwid = $('#paid-dues-cwid').val();

  //Perform Regex on cwid
  if(cwid.match(/[1-9][0-9]{7}/g) != null && cwid.length == 8) {
    //Show wait div
    $('#paid-dues-edit').attr("hidden", true);
    $('#paid-dues-wait').removeAttr("hidden");

    this.database.ref('/members/' + cwid).once('value').then((paidDuesSnap) => {
      if(paidDuesSnap.val() == null) {
        // Show Warning that CWID was invalid
        $('#paid-dues-warning').html("Please enter a valid CWID.");
      }
      else {
        var paidDuesData = paidDuesSnap.val();
        var currentPoints = paidDuesData.points;
        var newPoints = parseInt(currentPoints) + 5;
        //Update data
        var updates = {};
        updates['/paidNationalDues'] = true;
        updates['/points'] = newPoints;

        this.database.ref('/members/' + cwid).update(updates, (error) => {
          if(error) {
            //Print message to console
            console.log("Paid National Dues failed!");
            console.log("Error: " + error);
          }
          else {
            //Success! Show success div
            $('#paid-dues-wait').attr("hidden", true);
            $('#paid-dues-success').removeAttr("hidden");

            //Run displayData to refresh items on page
            this.displayData();

            //Show edit div and dismiss modal
            setTimeout(function() {
              $('#paidDuesModal').modal('hide');
            }, 1000);

            setTimeout(function() {
              $('#paid-dues-success').attr("hidden", true);
              $('#paid-dues-edit').removeAttr("hidden");
            }, 1500);
          }
        });
      }
    });
  }
  else {
    $('#paid-dues-warning').html("Please enter a valid CWID.");
  }
};

//Event Check-In Submit Button Functions
function nextEventPage() {
  //Check if event was chosen
  var eventVar = $('#event-checkin-event').val();
  if(eventVar == null){
    $('#event-checkin-warning').removeAttr("hidden");
  }
  else {
    //set eventID in the confirmation screen
    this.database.ref('/events/' + eventTitle).once('value').then((eventCheckInSnap) => {
      var eventCheckInData = eventCheckInSnap.val();
      var eventID = eventCheckInData.eventID;
      $('#event-checkin-display').html(eventID);
    });

    //Show confirmation div
    $('#event-checkin-edit').attr("hidden", true);
    $('#event-checkin-confirm').removeAttr("hidden");
  }
}

function eventCheckIn() {
  //Show edit div
  $('#event-checkin-confirm').attr("hidden", true);
  $('#event-checkin-edit').removeAttr("hidden");
}

FirebaseAuth.prototype.eventCheckIn = function() {
  //Show wait div
  $('#event-checkin-confirm').attr("hidden", true);
  $('#event-checkin-wait').removeAttr("hidden");

  //Get CWID, Event ID, and Points
  //Set Event ID under CWID to true
  //Add Points To Account Total
  //Show Success and then Show Form
  /*var cwidEntry = $('#event-checkin-cwid').val();
  var eventTitle = $('#event-checkin-event').val();
  this.database.ref('/events/' + eventTitle).once('value').then((eventCheckInSnap) => {
    var eventCheckInData = eventCheckInSnap.val();
    var eventID = eventCheckInData.eventID;
    var eventPoints = eventCheckInData.points;

    this.database.ref('/members/' + cwidEntry).once('value').then((memberCheckInSnap) => {
      if(memberCheckInSnap.val() == null) {
        // Show Warning that CWID was invalid
        $('#event-checkin-cwid-warning').removeAttr("hidden");
        $('#event-checkin-wait').attr("hidden", true);
        $('#event-checkin-confirm').removeAttr("hidden");
        $('#event-checkin-cwid').val("");
      }
      else {
        var memberCheckInData = memberCheckInSnap.val();
        var currentPoints = memberCheckInData.points;
        var newPoints = parseInt(currentPoints) + parseInt(eventPoints);
        //Update data
        var updates = {};
        updates['/events/' + eventID] = true;
        updates['/points'] = newPoints;

        this.database.ref('/members/' + cwidEntry).update(updates, (error) => {
          if(error) {
            //Print message to console
            console.log("Event Check In Failed!");
            console.log("Error: " + error);
          }
          else {
            //Success! Show success div
            $('#event-checkin-wait').attr("hidden", true);
            $('#event-checkin-success').removeAttr("hidden");

            //Run displayData to refresh items on page
            this.displayData();

            setTimeout(function() {
              $('#event-checkin-success').attr("hidden", true);
              $('#event-checkin-confirm').removeAttr("hidden");
              $('#event-checkin-cwid').val("");
            }, 1000);
          }
        });
      }
    });
  });*/
  var eventTitle = $('#event-checkin-event').val();
  this.database.ref('/events/' + eventTitle).once('value').then((eventCheckInSnap) => {
    var eventCheckInData = eventCheckInSnap.val();
    var eventID = eventCheckInData.eventID;
    $('#event-checkin-display').html(eventID);
    $('#event-checkin-display-title').html(eventTitle);
  });

  //Show confirmation div
  $('#event-checkin-edit').attr("hidden", true);
  $('#event-checkin-confirm').removeAttr("hidden");
};

FirebaseAuth.prototype.assignBoard = function() {
  //Check if CWID Number is a valid number
  var cwid = $('#assign-board-cwid').val();

  //Perform Regex on cwid
  if(cwid.match(/[1-9][0-9]{7}/g) != null && cwid.length == 8) {
    //Show wait div
    $('#assign-board-edit').attr("hidden", true);
    $('#assign-board-wait').removeAttr("hidden");

    //Update data
    var updates = {};
    updates['/boardMember'] = true;

    this.database.ref('/members/' + this.cwid).update(updates, (error) => {
      if(error) {
        //Print message to console
        console.log("Board Status Assignment Failed!");
        console.log("Error: " + error);
      }
      else {
        //Success! Show success div
        $('#assign-board-wait').attr("hidden", true);
        $('#assign-board-success').removeAttr("hidden");

        //Run displayData to refresh items on page
        this.displayData();

        //Show edit div and dismiss modal
        setTimeout(function() {
          $('#assignBoardModal').modal('hide');
        }, 1000);

        setTimeout(function() {
          $('#assign-board-success').attr("hidden", true);
          $('#assign-board-edit').removeAttr("hidden");
        }, 1500);
      }
    });
  }
  else {
    $('#assign-board-warning').html("Please enter a valid CWID.");
  }
};

FirebaseAuth.prototype.createEvent = function() {
  //Check if date is in valid format
  var date = $('#create-event-date').val();

  //Check if name isn't too long
  var name = $('#create-event-name').val();

  //Check if points is a valid number
  var points = $('#create-event-points').val();

  //Perform Regex on date
  if(date.match(/[0-9][0-9][-][0-9][0-9][-][2][0][2][0-9]{1}/g) != null && date.length == 10) {
    //Perform Regex on name
    if(name.match(/^[a-z0-9\s]+/i) != null && name.length < 30) {
      //Perform Regex on points
      if(points.match(/[1-9]{1}/g) != null && points.length < 3) {
        //Show wait div
        $('#create-event-edit').attr("hidden", true);
        $('#create-event-wait').removeAttr("hidden");

        var eventTitle = date.substring(date.length - 4).concat('-',date.substring(0,5),'-',$('#create-event-name').val());
        var newID = "E" + randomString(4, '0123456789');
        //Update data
        var newEvent = {
          points: $('#create-event-points').val(),
          eventID: newID
        };

        this.database.ref('/events/' + eventTitle).update(newEvent, (error) => {
          //Update data
          var updates = {};
          updates['/events/' + newID] = false;

          var memberList = this.database.ref('/members');
          memberList.on('value', (snapshot) => {
            snapshot.forEach((child) => {
              child.ref.update(updates, (error) => {
                if(error) {
                  //Print message to console
                  console.log("Event creation failed!");
                  console.log("Error: " + error);
                }
                else {
                  //Success! Show success div
                  $('#create-event-wait').attr("hidden", true);
                  $('#event-id-display').html(newID);
                  $('#create-event-success').removeAttr("hidden");

                  //Run displayData to refresh items on page
                  this.displayData();

                  $('#create-event-date').val("");
                  $('#create-event-name').val("");
                  $('#create-event-points').val("");

                  //Show edit div and dismiss modal
                  setTimeout(function() {
                    $('#createEventModal').modal('hide');
                  }, 1000);

                  setTimeout(function() {
                    $('#create-event-success').attr("hidden", true);
                    $('#create-event-edit').removeAttr("hidden");
                  }, 1500);
                }
              });
            });
          });
        });
      }
      else {
        $('#create-event-warning').html("Please enter a point value greater than 0 and less than 100.");
      }
    }
    else {
      $('#create-event-warning').html("Please enter a shorter name with no special characters.");
    }
  }
  else {
    $('#create-event-warning').html("Please enter a valid date.");
  }
};

function nextDeleteEventPage() {
  //Check if event was chosen
  var eventVar = $('#delete-event-event').val();
  if(eventVar == null){
    $('#delete-event-warning').removeAttr("hidden");
  }
  else {
    $('#event-delete-display').html(eventVar);

    //Show confirmation div
    $('#delete-event-edit').attr("hidden", true);
    $('#delete-event-confirm').removeAttr("hidden");
  }
}

function eventDeleteBack() {
  //Show edit div
  $('#delete-event-confirm').attr("hidden", true);
  $('#delete-event-edit').removeAttr("hidden");
}

FirebaseAuth.prototype.eventDelete = function() {
  $('#delete-event-confirm').attr("hidden", true);
  $('#delete-event-wait').removeAttr("hidden");
  //Update data
  var clearEventUpdates = {};
  var pointsAfter;
  var eventTitle = $('#delete-event-event').val();
  if (eventTitle != null || eventTitle != ""){
    this.database.ref('/events/' + eventTitle).remove();

    //Success! Show success div
    $('#delete-event-wait').attr("hidden", true);
    $('#delete-event-success').removeAttr("hidden");

    //Run displayData to refresh items on page
    this.displayData();

    //Show edit div and dismiss modal
    setTimeout(function() {
      $('#deleteEventModal').modal('hide');
    }, 1000);

    setTimeout(function() {
      $('#delete-event-success').attr("hidden", true);
      $('#delete-event-edit').removeAttr("hidden");
    }, 1000);
  }
  else {

  }
};

FirebaseAuth.prototype.removeBoard = function() {
  //Check if CWID Number is a valid number
  var cwid = $('#remove-board-cwid').val();

  //Perform Regex on cwid
  if(cwid.match(/[1-9][0-9]{7}/g) != null && cwid.length == 8) {
    //Show wait div
    $('#remove-board-edit').attr("hidden", true);
    $('#remove-board-wait').removeAttr("hidden");

    //Update data
    var updates = {};
    updates['/boardMember'] = false;

    this.database.ref('/members/' + this.cwid).update(updates, (error) => {
      if(error) {
        //Print message to console
        console.log("Board Status Removal Failed!");
        console.log("Error: " + error);
      }
      else {
        //Success! Show success div
        $('#remove-board-wait').attr("hidden", true);
        $('#remove-board-success').removeAttr("hidden");

        //Run displayData to refresh items on page
        this.displayData();

        //Show edit div and dismiss modal
        setTimeout(function() {
          $('#removeBoardModal').modal('hide');
        }, 1000);

        setTimeout(function() {
          $('#remove-board-success').attr("hidden", true);
          $('#remove-board-edit').removeAttr("hidden");
        }, 1500);
      }
    });
  }
  else {
    $('#remove-board-warning').html("Please enter a valid CWID.");
  }
};

FirebaseAuth.prototype.clearDues = function() {
  //Show wait div
  $('#clear-dues-edit').attr("hidden", true);
  $('#clear-dues-wait').removeAttr("hidden");

  //Update data
  var updates = {};
  updates['/paidNationalDues'] = false;

  var memberList = this.database.ref('/members');
  memberList.on('value', (snapshot) => {
    snapshot.forEach((child) => {
      child.ref.update(updates, (error) => {
        if(error) {
          //Print message to console
          console.log("Clear Dues failed!");
          console.log("Error: " + error);
        }
        else {
          //Success! Show success div
          $('#clear-dues-wait').attr("hidden", true);
          $('#clear-dues-success').removeAttr("hidden");

          //Run displayData to refresh items on page
          this.displayData();

          //Show edit div and dismiss modal
          setTimeout(function() {
            $('#clearDuesModal').modal('hide');
          }, 1000);

          setTimeout(function() {
            $('#clear-dues-success').attr("hidden", true);
            $('#clear-dues-edit').removeAttr("hidden");
          }, 1500);
        }
      });
    });
  });
};

FirebaseAuth.prototype.clearPoints = function() {
  //Show wait div
  $('#clear-points-edit').attr("hidden", true);
  $('#clear-points-wait').removeAttr("hidden");

  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();

  //Check if date is in valid format
  var date = mm + '-' + dd + '-' + yyyy;

  console.log(date);

  //Check if name isn't too long
  var name = 'Cleared Points';

  //Check if points is a valid number
  var points = 0;

  var eventTitle = date.substring(date.length - 4).concat('-',date.substring(0,5),'-','Cleared Points');
  var newID = "E" + randomString(4, '0123456789');
  //Update data
  var newEvent = {
    points: 0,
    eventID: newID
  };

  this.database.ref('/events/' + eventTitle).update(newEvent, (error) => {
    //Update data
    var updates = {};
    updates['/events/' + newID] = true;
    updates['/points'] = 0;

    var memberList = this.database.ref('/members');
    memberList.on('value', (snapshot) => {
      snapshot.forEach((child) => {
        child.ref.update(updates, (error) => {
          if(error) {
            //Print message to console
            console.log("Clear Points failed!");
            console.log("Error: " + error);
          }
          else {
            //Success! Show success div
            $('#clear-points-wait').attr("hidden", true);
            $('#clear-points-success').removeAttr("hidden");

            //Run displayData to refresh items on page
            this.displayData();

            //Show edit div and dismiss modal
            setTimeout(function() {
              $('#clearPointsModal').modal('hide');
            }, 1000);

            setTimeout(function() {
              $('#clear-points-success').attr("hidden", true);
              $('#clear-points-edit').removeAttr("hidden");
            }, 1500);
          }
        });
      });
    });
  });
};

//Event Check-In Submit Button Functions
function nextEventReportPage() {
  //Check if event was chosen
  var eventVar = $('#event-export-event').val();
  if(eventVar == null){
    $('#export-event-warning').removeAttr("hidden");
  }
  else {
    //set event in the confirmation screen
    $('#export-event-display').html(eventVar);

    //Show confirmation div
    $('#export-event-edit').attr("hidden", true);
    $('#export-event-confirm').removeAttr("hidden");
  }
}

function eventExportBack() {
  //Show edit div
  $('#export-event-confirm').attr("hidden", true);
  $('#export-event-edit').removeAttr("hidden");
}

FirebaseAuth.prototype.exportEvent = function() {
  //Show wait div
  $('#export-event-confirm').attr("hidden", true);
  $('#export-event-wait').removeAttr("hidden");

  var eventTitle = $('#event-export-event').val();
  this.database.ref('/events/' + eventTitle).once('value').then((eventExportSnap) => {
    var eventExportData = eventExportSnap.val();
    var eventID = eventExportData.eventID;
    var memberList = this.database.ref('/members');
    memberList.on('value', (snapshot) => {
      csvData = eventTitle + "\nCWID,First Name,Last Name,Paid Dues?,Attended?,Electrons\n";
      snapshot.forEach((child) => {
        memberData = child.val();
        var cwid = child.key;
        var fname = memberData.member.fname;
        var lname = memberData.member.lname;
        var duesBool = memberData.paidNationalDues;
        var attended = "false";
        var electrons = memberData.points;
        var dues = "false";
        if(duesBool){
          dues = "true";
        }
        console.log(memberData.events[eventID]);
        if(memberData.events[eventID]){
          attended = "true";
        }
        csvData += cwid + "," + fname + "," + lname + "," + dues + "," + attended + "," + electrons + "\n";
      });
      //console.log(file);

      $('#export-event-link').attr("href", "data:text/csv;charset=utf-8," + encodeURI(csvData));
      //Show success div with download link
      $('#export-event-wait').attr("hidden", true);
      $('#export-event-success').removeAttr("hidden");
    });
  });
};

FirebaseAuth.prototype.exportMembers = function() {
  //Show wait div
  $('#export-members-edit').attr("hidden", true);
  $('#export-members-wait').removeAttr("hidden");

  var memberList = this.database.ref('/members');
  memberList.on('value', (snapshot) => {
    csvData = "CWID,First Name,Last Name,Paid Dues?,Electrons\n";
    snapshot.forEach((child) => {
      memberData = child.val();
      var cwid = child.key;
      var fname = memberData.member.fname;
      var lname = memberData.member.lname;
      var duesBool = memberData.paidNationalDues;
      var electrons = memberData.points;
      var dues = "false";
      if(duesBool){
        dues = "true";
      }
      csvData += cwid + "," + fname + "," + lname + "," + dues + "," + electrons + "\n";
    });
    //console.log(file);

    $('#export-members-link').attr("href", "data:text/csv;charset=utf-8," + encodeURI(csvData));
    //Show success div with download link
    $('#export-members-wait').attr("hidden", true);
    $('#export-members-success').removeAttr("hidden");
  });
};

//Event Check-In Submit Button Functions
function nextEventClearPage() {
  //Check if event was chosen
  var eventVar = $('#event-clear-event').val();
  if(eventVar == null){
    $('#clear-event-warning').removeAttr("hidden");
  }
  else {
    //set event in the confirmation screen
    $('#clear-event-display').html(eventVar);

    //Show confirmation div
    $('#clear-event-edit').attr("hidden", true);
    $('#clear-event-confirm').removeAttr("hidden");
  }
}

function eventClearBack() {
  //Show edit div
  $('#clear-event-confirm').attr("hidden", true);
  $('#clear-event-edit').removeAttr("hidden");
}

FirebaseAuth.prototype.clearEvent = function() {
  //Show wait div
  $('#clear-event-confirm').attr("hidden", true);
  $('#clear-event-wait').removeAttr("hidden");

  //Update data
  var clearEventUpdates = {};
  var pointsAfter;
  var eventTitle = $('#event-clear-event').val();
  this.database.ref('/events/' + eventTitle).once('value').then((eventClearSnap) => {
    var eventClearData = eventClearSnap.val();
    var eventID = eventClearData.eventID;
    var eventPoints = eventClearData.points;
    var memberList = this.database.ref('/members');
    memberList.on('value', (clearEventSnap) => {
      clearEventSnap.forEach((clearEventChild) => {
        var memberData = clearEventChild.val();
        pointsAfter = 0;
        //console.log(memberData);
        //console.log(eventPoints);
        //console.log(memberData.points);
        if(memberData.events[eventID]){
          pointsAfter = memberData.points - eventPoints;
        }
        else{
          pointsAfter = memberData.points;
        }
        clearEventUpdates['/events/' + eventID] = false;
        clearEventUpdates['/points'] = pointsAfter;

        clearEventChild.ref.update(clearEventUpdates, (error) => {
          if(error) {
            //Print message to console
            console.log("Clear Attendance failed!");
            console.log("Error: " + error);
          }
          else {
            //Success! Show success div
            $('#clear-event-wait').attr("hidden", true);
            $('#clear-event-success').removeAttr("hidden");

            //Run displayData to refresh items on page
            this.displayData();

            //Show edit div and dismiss modal
            setTimeout(function() {
              $('#clearEventModal').modal('hide');
            }, 1000);

            setTimeout(function() {
              $('#clear-event-success').attr("hidden", true);
              $('#clear-event-edit').removeAttr("hidden");
            }, 1500);
          }
        });
      });
    });
  });
};
