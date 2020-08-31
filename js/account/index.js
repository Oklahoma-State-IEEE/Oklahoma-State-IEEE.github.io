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
  this.nameSubmit = document.getElementById('edit-name-submit');
  this.emailSubmit = document.getElementById('edit-email-submit');
  this.majorSubmit = document.getElementById('edit-major-submit');
  this.yearSubmit = document.getElementById('edit-year-submit');
  this.resumeUpload = document.getElementById('edit-resume-choose');
  this.resumeFile = document.getElementById('edit-resume-resume');
  this.resumeSubmit = document.getElementById('edit-resume-submit');
  this.cwidSubmit = document.getElementById('edit-cwid-submit');

  // Add listeners for sign in buttons
  this.googleSignInButton.addEventListener('click', this.googleSignIn.bind(this));
  this.githubSignInButton.addEventListener('click', this.githubSignIn.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));

  //Add listeners for submit buttons
  this.nameSubmit.addEventListener('click', this.editName.bind(this));
  this.emailSubmit.addEventListener('click', this.editEmail.bind(this));
  this.majorSubmit.addEventListener('click', this.editMajor.bind(this));
  this.yearSubmit.addEventListener('click', this.editYear.bind(this));
  this.resumeSubmit.addEventListener('click', this.editResume.bind(this));
  this.cwidSubmit.addEventListener('click', this.editCWID.bind(this));

  //Add listeners for resume upload
  this.resumeUpload.addEventListener('click', function(e) {
    e.preventDefault();
    this.resumeFile.click();
  }.bind(this));
  this.resumeFile.addEventListener('change', this.checkResume.bind(this));

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
    // Show account page
    $('#account-page').removeAttr("hidden");

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
  var eventRef = this.database.ref('/events');
  //Get user data and set on page
  this.database.ref('/members/' + cwid).once('value').then((snapshot) => {
    var userElement = snapshot.val();

    //Show Dues Warning and Hide Resume Book/Event Data
    if (userElement.accountType != "company") {
      $('#resume-book').removeAttr("hidden");
      $('#event-data').removeAttr("hidden");
    }
    else {
      $('#company-profile-info').removeAttr("hidden");
      $('#table-row-company').removeAttr("hidden");
      $('#student-profile-info').attr("hidden", true);
      $('#cwid-section').attr("hidden", true);
      $('#table-row-major').attr("hidden", true);
      $('#table-row-year').attr("hidden", true);
    }

    //Name
    var name = userElement.member.fname + " " + userElement.member.lname;
    $('#account-name').html(name);

    if(name.length > 10) {
      $('#userDropdown').html(userElement.member.fname + " " + userElement.member.lname.substr(0,1) + ".");
    }
    else {
       $('#userDropdown').html(name);
    }

    //Email
    $('#account-email').html(userElement.member.email || "Not set.");

    //Major
    $('#account-major').html(userElement.member.major || "Not set.");

    //Year
    $('#account-year').html(userElement.member.year || "Not set.");

    //Resume
    if(userElement.member.resume) {
      this.storage.ref(userElement.member.resume).getDownloadURL().then((url) => {
        $('#account-resume').html('<a href="' + url + '" target="_blank">View Resume</a>');
      }).catch((error) => {
        console.log(error);
        $('#account-resume').html("An error occurred. Check console.");
      });
    }
    else {
      $('#account-resume').html("Not uploaded.");
    }

    //Membership Status
    var pointText = " Points";
    if(userElement.points == 1) {
      pointText = " Point";
    }
    if(userElement.accountType == "board") {
      $('#membershipLevel').html("Board Page");
      $('#membershipLevel').attr("href", "/board");
      $('#account-status').html("Board Member");
    }
    else if(userElement.accountType == "company"){
      $('#membershipLevel').html("Student Profiles");
      $('#membershipLevel').attr("href", "/profiles");
    }
    else {
      $('#membershipLevel').html('<i class="fas fa-atom" style="padding-right: 5px;"></i>' + userElement.points + pointText);
      $('#membershipLevel').attr("href", "#event-data");
      $('#account-status').html("Member");
    }

    //Add Points to Point and Events Section
    $('#pointText').html(userElement.points + pointText);

    //CWID number
    if(this.cwid.substr(0,1) == "A") {
      $('#account-cwid').html("Not set.");
      $('#account-cwid-edit').html("<a href=\"javascript:void(0);\" onclick=\"$('#editCWIDModal').modal('show');\">Edit</a>");
    }
    else {
      $('#account-cwid').html("***" + this.cwid.substr(3,8));
      $('#account-cwid-edit').html("<a href=\"javascript:void(0);\" onclick=\"$('#editCWIDModal').modal('show');\">Edit</a>");
    }

    //Event stuff
    eventRef.once('value', (eventSnapshot) => {
      var content = '';
      if(userElement.paidNationalDues) {
        content = '<tr><td class="center">N/A</td><td class="center">National Membership Dues</td><td class="center">5</td><td class="center"><i class="fas fa-check" aria-hidden="true"></td></tr>';
      }
      eventSnapshot.forEach((data) => {
        var val = data.val();
        var date_name = data.key;
        var date = date_name.substring(0,10);
        var formattedDate = date.substring(date.length - 5).concat('-',date.substring(0,4));
        var title = date_name.substring(11,50);
        var points = val.points;

        var eventID = val.eventID;
        var attendedBool;
        this.database.ref('/members/' + this.cwid + '/events/' + eventID).once('value').then((eventSnap) => {
          attendedBool = eventSnap.val();
          var attended;
          if(attendedBool) {
            attended = '<i class="fas fa-check" aria-hidden="true">';
          }
          else {
            attended = '<i class="fas fa-times" aria-hidden="true">';
          }
          content += '<tr>';
          content += '<td class="center">' + formattedDate + '</td>';
          content += '<td class="center">' + title + '</td>';
          content += '<td class="center">' + points + '</td>';
          content += '<td class="center">' + attended + '</td>';
          content += '</tr>';
          $('#eventTable').append(content);
          content = "";
        });
      });
    });
  });
}

FirebaseAuth.prototype.editName = function() {
  //First, check to see if both fields have a valid value
  if($('#edit-name-fname').val().match(/([A-Z])\w+/g) != null && $('#edit-name-lname').val().match(/([A-Z])\w+/g) != null) {
    //Show wait div
    $('#edit-name-edit').attr("hidden", true);
    $('#edit-name-wait').removeAttr("hidden");

    //Update data
    var updates = {};
    updates['/fname'] = $('#edit-name-fname').val();
    updates['/lname'] = $('#edit-name-lname').val();

    this.database.ref('/members/' + this.cwid + '/member').update(updates, (error) => {
      if(error) {
        //Print message to console
        console.log("Name update failed!");
        console.log("Error: " + error);
      }
      else {
        //Success! Show success div
        $('#edit-name-wait').attr("hidden", true);
        $('#edit-name-success').removeAttr("hidden");

        //Run displayData to refresh items on page
        this.displayData();

        //Show edit div and dismiss modal
        setTimeout(function() {
          $('#editNameModal').modal('hide');
        }, 1000);

        setTimeout(function() {
          $('#edit-name-success').attr("hidden", true);
          $('#edit-name-edit').removeAttr("hidden");
        }, 1500);
      }
    });
  }
  else {
    $('#edit-name-warning').html("Please enter a valid name.");
  }
};

FirebaseAuth.prototype.editEmail = function() {
  //First, check to see if the email is valid
  if($('#edit-email-email').val().match(/.+\@.+\..+/g) != null) {
    //Show wait div
    $('#edit-email-edit').attr("hidden", true);
    $('#edit-email-wait').removeAttr("hidden");

    //Update data
    var updates = {};
    updates['/email'] = $('#edit-email-email').val();

    this.database.ref('/members/' + this.cwid + '/member/').update(updates, (error) => {
      if(error) {
        //Print message to console
        console.log("Email update failed!");
        console.log("Error: " + error);
      }
      else {
        //Success! Show success div
        $('#edit-email-wait').attr("hidden", true);
        $('#edit-email-success').removeAttr("hidden");

        //Run displayData to refresh items on page
        this.displayData();

        //Show edit div and dismiss modal
        setTimeout(function() {
          $('#editEmailModal').modal('hide');
        }, 1000);

        setTimeout(function() {
          $('#edit-email-success').attr("hidden", true);
          $('#edit-email-edit').removeAttr("hidden");
        }, 1500);
      }
    });
  }
  else {
    $('#edit-email-warning').html("Please enter a valid email.");
  }
};

FirebaseAuth.prototype.editMajor = function() {
  ///Show wait div
  $('#edit-major-edit').attr("hidden", true);
  $('#edit-major-wait').removeAttr("hidden");

  //Update data
  var updates = {};
  updates['/major'] = $('#edit-major-major').val();

  this.database.ref('/members/' + this.cwid + '/member').update(updates, (error) => {
    if(error) {
      //Print message to console
      console.log("Major update failed!");
      console.log("Error: " + error);
    }
    else {
      //Success! Show success div
      $('#edit-major-wait').attr("hidden", true);
      $('#edit-major-success').removeAttr("hidden");

      //Run displayData to refresh items on page
      this.displayData();

      //Show edit div and dismiss modal
      setTimeout(function() {
        $('#editMajorModal').modal('hide');
      }, 1000);

      setTimeout(function() {
        $('#edit-major-success').attr("hidden", true);
        $('#edit-major-edit').removeAttr("hidden");
      }, 1500);
    }
  });
};

FirebaseAuth.prototype.editYear = function() {
  //Show wait div
  $('#edit-year-edit').attr("hidden", true);
  $('#edit-year-wait').removeAttr("hidden");

  //Update data
  var updates = {};
  updates['/year'] = $('#edit-year-year').val();

  this.database.ref('/members/' + this.cwid + '/member').update(updates, (error) => {
    if(error) {
      //Print message to console
      console.log("Year update failed!");
      console.log("Error: " + error);
    }
    else {
      //Success! Show success div
      $('#edit-year-wait').attr("hidden", true);
      $('#edit-year-success').removeAttr("hidden");

      //Run displayData to refresh items on page
      this.displayData();

      //Show edit div and dismiss modal
      setTimeout(function() {
        $('#editYearModal').modal('hide');
      }, 1000);

      setTimeout(function() {
        $('#edit-year-success').attr("hidden", true);
        $('#edit-year-edit').removeAttr("hidden");
      }, 1500);
    }
  });
};

FirebaseAuth.prototype.checkResume = function() {
  //First, check if a file has been uploaded
  if(this.resumeFile.files.length == 0) {
    //No file is uploaded
    $('#edit-resume-details').html("No file chosen");
    return false;
  }
  else {
    //File is uploaded, get the file
    var file = this.resumeFile.files[0];

    //List file details on modal
    $('#edit-resume-details').html(file.name + " (" + (file.size/1000000).toFixed(2) + " MB)");

    //Check if file fits requirements
    if(file.type != "application/pdf") {
      $('#edit-resume-warning').html("File must be a PDF.");
      return false;
    }
    else if(file.size > 5000000){
     $('#edit-resume-warning').html("File must be smaller than 5MB.");
     return false;
    }
    else {
      $('#edit-resume-warning').html("");
      return true;
    }
  }
};

FirebaseAuth.prototype.editResume = function() {
  //First, call checkResume to see if file meets requirements
  if(this.checkResume()) {
    //File meets requirements, submit
    console.log("File meets requirements");

    //Show wait div
    $('#edit-resume-edit').attr("hidden", true);
    $('#edit-resume-wait').removeAttr("hidden");

    //Get the file
    var file = this.resumeFile.files[0];

    this.database.ref('/members/' + this.cwid + "/member").once('value').then((snapshot) => {
      var userElement = snapshot.val();

      //Upload the image to Cloud Storage
      this.storage.ref("/resumes/" + userElement.year + "/" + userElement.lname + ", " + userElement.fname + ".pdf").put(file).then((snapshot) => {
        //Get the URL of the uploaded file
        var url = snapshot.metadata.fullPath;
        // console.log("URL: " + url);
        var currentDate = new Date();
        var dateUpdated = currentDate.toDateString();

        //Record this URL in the database
        var updates = {};
        updates['/resume'] = url;
        updates['/dateResumeUpdated'] = dateUpdated;

        this.database.ref('/members/' + this.cwid + '/member').update(updates, (error) => {
          if(error) {
            //Print message to console
            console.log("Resume update failed!");
            console.log("Error: " + error);
          }
          else {
            //Success! Show success div
            $('#edit-resume-wait').attr("hidden", true);
            $('#edit-resume-success').removeAttr("hidden");

            //Run displayData to refresh items on page
            this.displayData();

            //Show edit div and dismiss modal
            setTimeout(function() {
              $('#editResumeModal').modal('hide');
            }.bind(this), 1000);

            setTimeout(function() {
              $('#edit-resume-success').attr("hidden", true);
              $('#edit-resume-edit').removeAttr("hidden");
            }, 1500);
          }
        });
      });
    });
  }
  else {
    //File does not meet requirements, do nothing
    console.log("File does not meet requirements");
  }
};

//CWID Submit Button Functions
function submitCWID() {
  //Check if CWID Number is a valid number
  var cwid = $('#edit-cwid-cwid').val();

  //Perform Regex on cwid
  if(cwid.match(/[1-9][0-9]{7}/g) != null && cwid.length == 8) {
    //Hide warning message
    $('#edit-cwid-warning').attr("hidden", true);

    //CWID Number is valid, set it in the confirmation screen
    $('#edit-cwid-display').html(cwid);

    //Show confirmation div
    $('#edit-cwid-edit').attr("hidden", true);
    $('#edit-cwid-confirm').removeAttr("hidden");
  }
  else {
    //CWID Number is not valid, display a warning message
    $('#edit-cwid-warning').removeAttr("hidden");
  }
}

function editCWID() {
  //Show edit div
  $('#edit-cwid-confirm').attr("hidden", true);
  $('#edit-cwid-edit').removeAttr("hidden");
}

FirebaseAuth.prototype.editCWID = function() {
  //Show wait div
  $('#edit-cwid-confirm').attr("hidden", true);
  $('#edit-cwid-wait').removeAttr("hidden");

  //Set newCWID and oldCWID
  this.oldCWID = this.cwid;
  this.newCWID = $('#edit-cwid-cwid').val();

  this.database.ref('/accounts/' + this.uid).set({
    user: this.newCWID
  });
  var cwidRef = this.database.ref('/members');
  cwidRef.child(this.oldCWID).once('value').then((snapshot) => {
    var data = snapshot.val();
      //Update data
      var updates = {};
      updates[this.oldCWID] = null;
      updates[this.newCWID] = data;

      cwidRef.update(updates, (error) => {
      if(error) {
        //Print message to console
        console.log("CWID update failed!");
        console.log("Error: " + error);
        //An error occurred, show failed div
        $('#edit-cwid-wait').attr("hidden", true);
        $('#edit-cwid-error').html("Error: " + error);
        $('#edit-cwid-failed').removeAttr("hidden");
      }
      else {
        //Success! Show success div
        $('#edit-cwid-wait').attr("hidden", true);
        $('#edit-cwid-success').removeAttr("hidden");

        //Refresh page after 3 seconds
        setTimeout(function() {
          window.location.reload(true);
        }, 3000);
      }
    });
  });
};
