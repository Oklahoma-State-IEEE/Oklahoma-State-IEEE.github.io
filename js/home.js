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
  this.emailSignInButton = document.getElementById('email-sign-in');
  this.emailSubmitButton = document.getElementById('sign-in-submit');
  this.emailSubmitEnter = document.getElementById('sign-in-password');
  this.emailSignUpSubmitButton = document.getElementById('sign-up-submit');
  this.emailSignUpSubmitEnter = document.getElementById('sign-in-password-confirm');
  this.forgotPassword = document.getElementById('forgot-password');

  // Add listeners for sign in buttons.
  this.googleSignInButton.addEventListener('click', this.googleSignIn.bind(this));
  this.githubSignInButton.addEventListener('click', this.githubSignIn.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.newAccountSignOut.addEventListener('click', this.signOut.bind(this));
  this.newAccountSubmit.addEventListener('click', this.createAccount.bind(this));
  this.emailSignInButton.addEventListener('click', this.emailSignIn.bind(this));
  this.emailSubmitButton.addEventListener('click', this.emailSubmit.bind(this));
  this.emailSubmitEnter.addEventListener('keydown', function(e){if(e.keyCode === 13){document.getElementById('sign-in-submit').click()}});
  this.emailSignUpSubmitButton.addEventListener('click', this.emailSignUpSubmit.bind(this));
  this.emailSignUpSubmitEnter.addEventListener('keydown', function(e){if(e.keyCode === 13){document.getElementById('sign-up-submit').click()}});
  this.forgotPassword.addEventListener('click', this.forgotPasswordSubmit.bind(this));

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

FirebaseAuth.prototype.emailSignIn = function() {
  $('#login-signin').attr("hidden", true);
  $('#login-email').removeAttr("hidden");
};

FirebaseAuth.prototype.forgotPasswordSubmit = function() {
  var resetEmail = $('#sign-in-email').val();
  this.auth.sendPasswordResetEmail(resetEmail).then(function() {
    $('#incorrect-password-warning').attr("hidden", true);
    $('#reset-email-sent').removeAttr("hidden");
  }).catch(function(error) {
    console.log(error);
  });
};

function createAccount() {
  $('#sign-in-password-confirm').removeAttr("hidden");
  $('#sign-in-submit').attr("hidden", true);
  $('#no-account').attr("hidden", true);
  $('#back-to-sign-in').removeAttr("hidden");
  $('#sign-up-submit').removeAttr("hidden");
  $('#sign-in-password').val("");
  $('#sign-in-h3').html("Sign Up with Email");
}

function backToSignIn() {
  $('#sign-in-password-confirm').attr("hidden", true);
  $('#sign-in-submit').removeAttr("hidden");
  $('#no-account').removeAttr("hidden");
  $('#back-to-sign-in').attr("hidden", true);
  $('#sign-up-submit').attr("hidden", true);
  $('#sign-in-password').val("");
  $('#sign-in-email').val("");
  $('#sign-in-h3').html("Sign In with Email");
  $('#login-signin').removeAttr("hidden");
  $('#login-email').attr("hidden", true);
}

FirebaseAuth.prototype.emailSubmit = function() {
  var userEmail = $('#sign-in-email').val();
  var userPassword = $('#sign-in-password').val();
  this.auth.signInWithEmailAndPassword(userEmail, userPassword).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    if (errorCode === 'auth/wrong-password') {
      $('#incorrect-password-warning').removeAttr("hidden");
      $('#forgot-password').removeAttr("hidden");
      $('#no-account').attr("hidden", true);
      $('#sign-in-password').val("");
    }
    else if (errorCode === 'auth/invalid-email'){
      $('#incorrect-password-warning').attr("hidden", true);
      $('#invalid-email-warning').removeAttr("hidden");
      $('#sign-in-email').val("");
      $('#sign-in-password').val("");
    }
    else if (errorCode === 'auth/user-not-found'){
      $('#incorrect-password-warning').attr("hidden", true);
      $('#invalid-email-warning').attr("hidden", true);
      $('#sign-in-password').val("");
      createAccount();
    }
    else {
      console.log(error);
    }
  });
};

FirebaseAuth.prototype.emailSignUpSubmit = function() {
  var userSignUpEmail = $('#sign-in-email').val();
  var userSignUpPassword = $('#sign-in-password').val();
  var userPasswordConfirm = $('#sign-in-password-confirm').val();

  if (userSignUpPassword != userPasswordConfirm) {
    $('#mismatch-password-warning').removeAttr("hidden");
  }
  else {
    this.auth.createUserWithEmailAndPassword(userSignUpEmail, userSignUpPassword).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      if (errorCode === 'auth/email-already-in-use') {
        $('#incorrect-password-warning').attr("hidden", true);
        $('#mismatch-password-warning').attr("hidden", true);
        $('#invalid-email-warning').attr("hidden", true);
        $('#weak-password-warning').attr("hidden", true);
        $('#same-email-warning').attr("hidden", true);
        $('#duplicate-email-warning').removeAttr("hidden");
        $('#sign-in-password').val("");
        $('#sign-in-password-confirm').val("");
      }
      else if (errorCode === 'auth/invalid-email'){
        $('#incorrect-password-warning').attr("hidden", true);
        $('#mismatch-password-warning').attr("hidden", true);
        $('#weak-password-warning').attr("hidden", true);
        $('#invalid-email-warning').removeAttr("hidden");
        $('#sign-in-email').val("");
        $('#sign-in-password').val("");
        $('#sign-in-password-confirm').val("");
      }
      else if (errorCode === 'auth/weak-password'){
        $('#incorrect-password-warning').attr("hidden", true);
        $('#mismatch-password-warning').attr("hidden", true);
        $('#invalid-email-warning').attr("hidden", true);
        $('#weak-password-warning').removeAttr("hidden");
        $('#sign-in-password').val("");
        $('#sign-in-password-confirm').val("");
      }
      else {
        console.log(error);
      }
    });
  }
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
            $('#membershipLevel').attr("href", "/membership");
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
