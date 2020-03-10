FirebaseAuth.prototype.setupAccount = function(user) {
  //Get user's name
  var fullName = user.displayName;

  //Set the user's name on page
  $('#userDropdown').html(fullName);
  $('#login-name').html(fullName);

  //Set text field values for new account modal
  $('#newaccount-fname').val(fullName.substr(0, fullName.indexOf(" ")));
  $('#newaccount-lname').val(fullName.substr(fullName.indexOf(" ") + 1, fullName.length - 1));
  $('#newaccount-email').val(user.email);

  //Set membership level to new account
  $('#membershipLevel').html("Set Up Account");
  $('#membershipLevel').attr("href", "javascript:void(0);");
  $('#membershipLevel').attr("onclick", "openNewAccountModal();");

  //Open new account modal after 1.5 seconds
  setTimeout(function() {
    $('#newAccountModal').modal({backdrop: 'static'});
  }, 1500);
};

FirebaseAuth.prototype.createAccount = function() {
  //First, check to see if all text fields have a valid value
  if(($('#newaccount-fname').val().match(/([A-Z])\w+/g) != null) && ($('#newaccount-lname').val().match(/([A-Z])\w+/g) != null) && ($('#newaccount-email').val().match(/.+\@.+\..+/g) != null)) {
    //Values entered are valid, show wait div
    $('#newaccount-new').attr("hidden", true);
    $('#newaccount-wait').removeAttr("hidden");

    //Get and set new temp perm
    var tempPerm = "T" + randomString(8, '0123456789');
    this.perm = tempPerm;

    //Check to see if this temp perm is empty
    this.database.ref('/members/' + tempPerm).once('value').then((snapshot) => {
      if(snapshot.val() == null) {
        //Create account under accounts branch
        this.database.ref('/accounts/' + this.uid).set({
          user: this.perm
        });

        //Create account under members branch
        var newMember = {
          activated: true,
          labMember: false,
          agreedToLabRules: false,
          member: {
            fname: $('#newaccount-fname').val(),
            lname: $('#newaccount-lname').val(),
            email: $('#newaccount-email').val()
          }
        };

        this.database.ref('/members/' + this.perm).set(newMember, (error) => {
          if(error) {
            $('#newaccount-wait').attr("hidden", true);
            $('#newaccount-error').html(error);
            $('#newaccount-failed').removeAttr("hidden");
          }
          else {
            //Finished! Show success div
            $('#newaccount-wait').attr("hidden", true);
            $('#newaccount-success').removeAttr("hidden");

            //Refresh page after 1.5 seconds
            setTimeout(function() {
              window.location.reload(true);
            }, 1500);
          }
        })
      }
    }).catch((error) => {
      $('#newaccount-wait').attr("hidden", true);
      $('#newaccount-error').html(error);
      $('#newaccount-failed').removeAttr("hidden");
    });
  }
  else {
    //Values entered are invalid, display warning div
    $('#newaccount-warning').removeAttr("hidden");
  }
};
