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
  this.eventCheckInSubmitID = document.getElementById('event-checkin-submit-user');
  this.eventCheckInEventID = document.getElementById('event-checkin-eventid-user');

  // Add listeners for sign in buttons
  this.googleSignInButton.addEventListener('click', this.googleSignIn.bind(this));
  this.githubSignInButton.addEventListener('click', this.githubSignIn.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));

  //Add listeners for submit buttons
  this.eventCheckInSubmitID.addEventListener('click', this.eventCheckInID.bind(this));
  this.eventCheckInEventID.addEventListener('keydown', function(e){if(e.keyCode === 13){document.getElementById('event-checkin-submit-user').click()}});

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
  });
}

FirebaseAuth.prototype.eventCheckInID = function() {
  //Show wait div
  $('#event-checkin-edit').attr("hidden", true);
  $('#event-checkin-wait').removeAttr("hidden");
  $('#event-checkin-warning').attr("hidden", true);
  $('#event-checkin-duplicate-warning').attr("hidden", true);

  var cwid = this.cwid;
  var eventIDSubmit = $('#event-checkin-eventid-user').val();
  var formattedEventID = 'E'.concat(eventIDSubmit);
  this.database.ref('/events').orderByChild("eventID").equalTo(formattedEventID).once('value').then((snapshot) => {
    var eventCheckInData = snapshot.val();
    var eventTitle;
    try {
      eventTitle = eventCheckInData[Object.keys(eventCheckInData)[0]];
      var eventID = eventTitle.eventID;
      var eventPoints = eventTitle.points;
    }
    catch(err) {
      eventTitle = null;
    }
    if (eventTitle != null) {
      this.database.ref('/members/' + cwid).once('value').then((memberCheckInSnap) => {
        if(memberCheckInSnap.val() == null) {
          // Show Warning that CWID was invalid
          $('#event-checkin-wait').attr("hidden", true);
          $('#event-checkin-edit').removeAttr("hidden");
          $('#event-checkin-cwid-warning').removeAttr("hidden");
          $('#event-checkin-eventid').val("");
        }
        else {
          var memberCheckInData = memberCheckInSnap.val();
          // Show Warning that event was already entered
          //console.log(memberCheckInData.events);
          //console.log(memberCheckInData.events[eventID]);
          if (memberCheckInData.events[eventID]) {
            $('#event-checkin-wait').attr("hidden", true);
            $('#event-checkin-edit').removeAttr("hidden");
            $('#event-checkin-eventid').val("");
            $('#event-checkin-duplicate-warning').removeAttr("hidden");
          }
          else {
            var currentPoints = memberCheckInData.points;
            var newPoints = parseInt(currentPoints) + parseInt(eventPoints);
            //Update data
            var updates = {};
            updates['/events/' + eventID] = true;
            updates['/points'] = newPoints;

            this.database.ref('/members/' + cwid).update(updates, (error) => {
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
                  $('#event-checkin-edit').removeAttr("hidden");
                }, 1500);

                //Show edit div and dismiss modal
                setTimeout(function() {
                  $('#eventCheckInModal').modal('hide');
                }, 1000);
              }
            });
          }
        }
      });
    }
    else {
      $('#event-checkin-warning').removeAttr("hidden");
      $('#event-checkin-wait').attr("hidden", true);
      $('#event-checkin-edit').removeAttr("hidden");
      $('#event-checkin-eventid').val("");
    }
  });
};
