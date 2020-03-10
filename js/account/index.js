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
  this.permSubmit = document.getElementById('edit-perm-submit');

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
  this.permSubmit.addEventListener('click', this.editPerm.bind(this));

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
    //User is signed in! Get user ID and store
    var uid = firebase.auth().currentUser.uid;
    this.uid = uid;

    //Get perm from user ID
    this.database.ref('/accounts/' + uid + '/user').once('value').then((snapshot) => {
      var perm = snapshot.val();

      if(perm) {
        //Account is set up, store perm
        this.perm = perm;

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
  var perm = this.perm;

  //Get user data and set on page
  this.database.ref('/members/' + perm).once('value').then((snapshot) => {
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

    //GitHub
    if(userElement.member.github) {
      //Get GitHub username from ID
      var urlString = "https://api.github.com/user/" + userElement.member.github.id;

      var settings = {
        "async": true,
        "crossDomain": true,
        "url": urlString,
        "method": "GET"
      };

      $.ajax(settings).done((response) => {
        $('#account-github').html('<a href="' + response.html_url + '" target="_blank">@' + response.login + '</a>');
      });
    }
    else {
      $('#account-github').html("Not linked.");
    }

    //Discord
    if(userElement.member.discord) {
      $('#account-discord').html(userElement.member.discord.username + "#" + userElement.member.discord.discriminator);
    }
    else {
      $('#account-discord').html("Not linked.");
    }

    //Membership Status
    if(userElement.labMember == true) {
      $('#membershipLevel').html("Lab Member");
      $('#membershipLevel').attr("href", "/membership");
      $('#account-status').html("Lab Member");
    }
    else {
      $('#membershipLevel').html("Member");
      $('#membershipLevel').attr("href", "/membership");
      $('#account-status').html("Member");
      $('#account-status-edit').html('<a href="/membership">Purchase</a>');
    }

    //Perm number
    if(this.perm.substr(0,1) == "T") {
      $('#account-perm').html("Not set.");
      $('#account-perm-edit').html("<a href=\"javascript:void(0);\" onclick=\"$('#editPermModal').modal('show');\">Edit</a>");
    }
    else {
      $('#account-perm').html("***" + this.perm.substr(3,6));
    }
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

    this.database.ref('/members/' + this.perm + '/member').update(updates, (error) => {
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

    this.database.ref('/members/' + this.perm + '/member/').update(updates, (error) => {
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

  this.database.ref('/members/' + this.perm + '/member').update(updates, (error) => {
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

  this.database.ref('/members/' + this.perm + '/member').update(updates, (error) => {
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

    //Upload the image to Cloud Storage
    this.storage.ref("/resume/" + this.perm + ".pdf").put(file).then((snapshot) => {
      //Get the URL of the uploaded file
      var url = snapshot.metadata.fullPath;
      // console.log("URL: " + url);

      //Record this URL in the database
      var updates = {};
      updates['/resume'] = url;

      this.database.ref('/members/' + this.perm + '/member').update(updates, (error) => {
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
  }
  else {
    //File does not meet requirements, do nothing
    console.log("File does not meet requirements");
  }
};

//Perm Submit Button Functions
function submitPerm() {
  //Check if PERM Number is a valid number
  var perm = $('#edit-perm-perm').val();

  //Perform Regex on perm
  if(perm.match(/[1-9][0-9]{6}/g) != null && perm.length == 7) {
    //Hide warning message
    $('#edit-perm-warning').attr("hidden", true);

    //PERM Number is valid, set it in the confirmation screen
    $('#edit-perm-display').html(perm);

    //Show confirmation div
    $('#edit-perm-edit').attr("hidden", true);
    $('#edit-perm-confirm').removeAttr("hidden");
  }
  else {
    //PERM Number is not valid, display a warning message
    $('#edit-perm-warning').removeAttr("hidden");
  }
}

function editPerm() {
  //Show edit div
  $('#edit-perm-confirm').attr("hidden", true);
  $('#edit-perm-edit').removeAttr("hidden");
}

FirebaseAuth.prototype.editPerm = function() {
  //Show wait div
  $('#edit-perm-confirm').attr("hidden", true);
  $('#edit-perm-wait').removeAttr("hidden");

  //Set newPerm and oldPerm
  this.oldPerm = this.perm;
  this.newPerm = $('#edit-perm-perm').val();

  //Send information to endpoint
  var urlString = "https://us-central1-ucsb-ieee.cloudfunctions.net/editPerm?oldPerm=" + this.oldPerm + "&newPerm=" + this.newPerm + "&uid=" + this.uid;

  var settings = {
    "async": true,
    "crossDomain": true,
    "headers": {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    "url": urlString,
    "method": "GET"
  };

  $.ajax(settings).done(function(response) {
    if(response.success == true) {
      //PERM was successfully transferred, show success div
      $('#edit-perm-wait').attr("hidden", true);
      $('#edit-perm-success').removeAttr("hidden");

      //Refresh page after 3 seconds
      setTimeout(function() {
        window.location.reload(true);
      }, 3000);
    }
    else {
      //An error occurred, show failed div
      $('#edit-perm-wait').attr("hidden", true);
      $('#edit-perm-error').html(response.error);
      $('#edit-perm-failed').removeAttr("hidden");
    }
  }.bind(this));
};
