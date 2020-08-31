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

  // Add listeners for sign in buttons
  this.googleSignInButton.addEventListener('click', this.googleSignIn.bind(this));
  this.githubSignInButton.addEventListener('click', this.githubSignIn.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));

  //Add listeners for submit buttons

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

FirebaseAuth.prototype.displayData = function(sortBy) {
  console.log(sortBy);
  var cwid = this.cwid;
  var memberRef = this.database.ref('/members');

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
    if(userElement.accountType == "company") {
      // Show company page
      $('#company-profile-page').attr("hidden", false);
      // Set text
      $('#membershipLevel').html("Student Profiles");
      $('#membershipLevel').attr("href", "/profiles");
      $('#account-status').html("Board Member");
    }
    else {
      window.location.replace("/");
    }
    //Member stuff
    memberRef.orderByChild("member/lname").on('value', (memberSnapshot) => {
      var content = '';
      var iterations = 1;
      memberSnapshot.forEach((data) => {
        var val = data.val();
        var firstName = val.member.fname;
        var lastName = val.member.lname;
        var major = "-";
        var classYear = "-"
        var email = val.member.email;
        if (val.member.major != undefined){
          major = val.member.major;
        }
        if (val.member.year != undefined){
          classYear = val.member.year;
        }
        var resume = "N/A";
        var boardMember = "No";
        if (val.accountType == "board"){
          boardMember = '<i class="fas fa-user-tie"></i>';
        }

        content += '<tr>';
        content += '<td class="center">' + firstName + '</td>';
        content += '<td class="center">' + lastName + '</td>';
        content += '<td class="center">' + major + '</td>';
        content += '<td class="center">' + classYear + '</td>';
        content += '<td class="center" id="companyResumeLink' + iterations + '">' + resume + '</td>';
        content += '<td class="center"><a href="mailto:' + email + '" target="_blank">Email</a></td>';
        content += '<td class="center">' + boardMember + '</td>';
        content += '</tr>';
        $('#companyProfileTable').append(content);

        if (val.member.resume != undefined){
          var found1 = iterations
          this.storage.ref(val.member.resume).getDownloadURL().then((url) => {
            //console.log(found1);
            var idText = '#companyResumeLink' + found1 + '';
            //console.log(idText);
            $(idText).html('<a href="' + url + '" target="_blank">View Resume</a>');
            //console.log("Made it");
          }).catch((error) => {
            console.log(error);
            $('#companyResumeLink' + found1).html("An error occurred. Check console.");
          });
        }
        else{

        }

        content = '';
        iterations += 1;
      });
    });
  });
}

function sortTable(n) {
  var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
  table = document.getElementById("companyProfileTable");
  switching = true;
  // Set the sorting direction to ascending:
  dir = "asc";
  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
    // Start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /* Loop through all table rows (except the
    first, which contains table headers): */
    for (i = 1; i < (rows.length - 1); i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false;
      /* Get the two elements you want to compare,
      one from current row and one from the next: */
      x = rows[i].getElementsByTagName("TD")[n];
      y = rows[i + 1].getElementsByTagName("TD")[n];
      /* Check if the two rows should switch place,
      based on the direction, asc or desc: */
      if (dir == "asc") {
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          // If so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      } else if (dir == "desc") {
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          // If so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
      and mark that a switch has been done: */
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      // Each time a switch is done, increase this count by 1:
      switchcount ++;
    } else {
      /* If no switching has been done AND the direction is "asc",
      set the direction to "desc" and run the while loop again. */
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}
