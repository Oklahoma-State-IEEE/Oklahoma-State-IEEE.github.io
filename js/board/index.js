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
  this.boardSubmit = document.getElementById('assign-board-submit');
  this.eventSubmit = document.getElementById('create-event-submit');
  this.removeBoardSubmit = document.getElementById('remove-board-submit');
  this.clearDuesSubmit = document.getElementById('clear-dues-submit');
  this.clearPointsSubmit = document.getElementById('clear-points-submit');

  // Add listeners for sign in buttons
  this.googleSignInButton.addEventListener('click', this.googleSignIn.bind(this));
  this.githubSignInButton.addEventListener('click', this.githubSignIn.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));

  //Add listeners for submit buttons
  this.duesSubmit.addEventListener('click', this.paidDues.bind(this));
  this.boardSubmit.addEventListener('click', this.assignBoard.bind(this));
  this.eventSubmit.addEventListener('click', this.createEvent.bind(this));
  this.removeBoardSubmit.addEventListener('click', this.removeBoard.bind(this));
  this.clearDuesSubmit.addEventListener('click', this.clearDues.bind(this));
  this.clearPointsSubmit.addEventListener('click', this.clearPoints.bind(this));

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
}

FirebaseAuth.prototype.paidDues = function() {
  //Check if CWID Number is a valid number
  var cwid = $('#paid-dues-cwid').val();

  //Perform Regex on cwid
  if(cwid.match(/[1-9][0-9]{7}/g) != null && cwid.length == 8) {
    //Show wait div
    $('#paid-dues-edit').attr("hidden", true);
    $('#paid-dues-wait').removeAttr("hidden");

    //Update data
    var updates = {};
    updates['/paidDues'] = true;

    this.database.ref('/members/' + this.cwid).update(updates, (error) => {
      if(error) {
        //Print message to console
        console.log("Paid Dues failed!");
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
  else {
    $('#paid-dues-warning').html("Please enter a valid CWID.");
  }
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
    if(name.match(/^[a-z0-9\s]+/i) != null && name.length < 20) {
      //Perform Regex on points
      if(points.match(/[1-9]{1}/g) != null && points.length < 3) {
        //Show wait div
        $('#create-event-edit').attr("hidden", true);
        $('#create-event-wait').removeAttr("hidden");

        var eventTitle = $('#create-event-date').val().concat('-',$('#create-event-name').val());
        var newID = "E" + randomString(8, '0123456789');
        //Update data
        var newEvent = {
          points: $('#create-event-points').val(),
          eventID: newID
        };

        this.database.ref('/events/' + eventTitle).update(newEvent, (error) => {
          if(error) {
            //Print message to console
            console.log("Event creation failed!");
            console.log("Error: " + error);
          }
          else {
            //Success! Show success div
            $('#create-event-wait').attr("hidden", true);
            $('#create-event-success').removeAttr("hidden");

            //Run displayData to refresh items on page
            this.displayData();

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
  updates['/paidDues'] = false;

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

  //Update data
  var updates = {};
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
};
