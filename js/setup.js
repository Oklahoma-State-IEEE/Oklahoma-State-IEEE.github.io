FirebaseAuth.prototype.setupAccount = function(user) {
  //Get user's name
  var fullName = "First Last";

  if(user.displayName != null){
    fullName = user.displayName;
  }

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

    //Get and set new temp cwid
    var tempCWID = "A" + randomString(8, '0123456789');
    this.cwid = tempCWID;

    //Check to see if this temp cwid is empty
    this.database.ref('/members/' + tempCWID).once('value').then((snapshot) => {
      if(snapshot.val() == null) {
        //Create account under accounts branch
        this.database.ref('/accounts/' + this.uid).set({
          user: this.cwid
        });

        //Create account under members branch
        var newMember = {
          activated: true,
          boardMember: false,
          paidNationalDues: false,
          points: 0,
          member: {
            fname: $('#newaccount-fname').val(),
            lname: $('#newaccount-lname').val(),
            email: $('#newaccount-email').val()
          }
        };

        this.database.ref('/members/' + this.cwid).set(newMember, (error) => {
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
