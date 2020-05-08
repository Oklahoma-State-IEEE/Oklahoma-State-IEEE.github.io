//Membership button function to open new account modal
function openNewAccountModal() {
  $('#newAccountModal').modal({backdrop: 'static'});
}

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
  this.newAccountSignOut = document.getElementById('newaccount-signout');
  this.newAccountSubmit = document.getElementById('newaccount-submit');

  // Add listeners for sign in buttons.
  this.googleSignInButton.addEventListener('click', this.googleSignIn.bind(this));
  this.githubSignInButton.addEventListener('click', this.githubSignIn.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.newAccountSignOut.addEventListener('click', this.signOut.bind(this));
  this.newAccountSubmit.addEventListener('click', this.createAccount.bind(this));

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
  this.auth.signInWithPopup(provider).catch(function(error) {
    $('#same-email-warning').removeAttr("hidden");
    console.log("made it");
  });
};

FirebaseAuth.prototype.githubSignIn = function() {
  var provider = new firebase.auth.GithubAuthProvider();
  provider.addScope('read:org');
  provider.addScope('user');
  this.auth.signInWithPopup(provider).catch(function(error) {
    $('#same-email-warning').removeAttr("hidden");
    console.log("made it");
  });
  //other stuff
};

FirebaseAuth.prototype.signOut = function() {
  this.auth.signOut();
};

FirebaseAuth.prototype.onAuthStateChanged = function(user) {
  if(user) {
    //User is signed in! Show loading div
    $('#login-signin').attr("hidden", true);
    $('#login-wait').removeAttr("hidden");
    $('#login-success').attr("hidden", true);

    //Get user ID and store
    var uid = firebase.auth().currentUser.uid;
    this.uid = uid;

    //Get cwid from user ID
    this.database.ref('/accounts/' + uid + '/user').once('value').then((snapshot) => {
      var cwid = snapshot.val();

      if(cwid) {
        //Account is set up, store cwid
        this.cwid = cwid;

        //Set the user's name
        this.database.ref('/members/' + cwid).once('value').then((snapshot) => {
          var userElement = snapshot.val();
          var name = userElement.member.fname + " " + userElement.member.lname;
          $('#login-name').html(name);

          if(name.length > 10) {
            $('#userDropdown').html(userElement.member.fname + " " + userElement.member.lname.substr(0,1) + ".");
          }
          else {
             $('#userDropdown').html(name);
          }

          //Get membership status
          if(userElement.boardMember == true) {
            $('#membershipLevel').html("Board Page");
            $('#membershipLevel').attr("href", "/board");
          }
          else {
            var pointText = " Points";
            if(userElement.points == 1) {
              pointText = " Point"
            }
            $('#membershipLevel').html('<i class="fas fa-atom" style="padding-right: 5px;"></i>' + userElement.points + pointText);
            $('#membershipLevel').attr("href", "/account/#points");
          }
        });
      }
      else {
        //Run account setup, passing the user object
        console.log("Redirect to new account");
        this.setupAccount(user);
      }

      //Hide sign-in button.
      $('#sign-in-li').attr("hidden", true);

      // Show user's profile and sign-out button.
      $('#user-li').removeAttr("hidden");
      $('#sign-out').removeAttr("hidden");

      //Show success div
      $('#login-wait').attr("hidden", true);
      $('#login-success').removeAttr("hidden");

      //Close login modal after one second
      setTimeout(function() {
        $('#loginModal').modal('hide');
      }, 1000);
    });
  }
  else {
    //User is signed out!
    //Hide user's profile and sign-out button.
    $('#user-li').attr("hidden", true);
    $('#sign-out').attr("hidden", true);

    //Show sign-in button.
    $('#sign-in-li').removeAttr("hidden");

    //Show signin div
    $('#login-signin').removeAttr("hidden");
    $('#login-wait').attr("hidden", true);
    $('#login-success').attr("hidden", true);

    //Close new account modal, if open
    $('#newAccountModal').modal('hide');
  }
};
