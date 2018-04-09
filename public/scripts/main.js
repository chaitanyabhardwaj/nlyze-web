
'use strict';

//Initializing Dropdown
function Dropdown(container, handler) {
	//Instance handle
	var inst = this;
	//Element handle
	this.container = container;
	this.element = handler;
	//Initialize dropdown state
	this.state = 0;
	//Adding click event to dropdown element
	this.container.click(function() {
		inst.toggleDisplay();
	});
};

//Initializing Header
function Header() {
	this.fixed = 0; // Not fixed
	//Scrolls back the page to 0 on initialization
	$(window).scroll(0);
	this.headerFixed(); // Calling headerFixed() function
};

Dropdown.prototype.toggleDisplay = function() {
	if(this.state == 0) { //Dropdown is closed
		this.element.show();
		this.state = 1;
	}
	else { //Dropdown is opened
		this.element.hide();
		this.state = 0;
	}
};

Dropdown.prototype.closeIfClickedElsewhere = function() {
	var inst = this;
	$('main, footer').on('click', function() {
		if(inst.state == 1) { //Dropdown is opened
			inst.element.hide();
			inst.state = 0;
		}
	});
};

Header.prototype.headerFixed = function() { // Changes Header position to Fixed
	var mainScrollTop = $('main').scrollTop();
	var inst = this;
	$(window).scroll(function(event) {
		var scroll = $(window).scrollTop();
		if(scroll > (mainScrollTop + 45)) {
			$('header').css('position','fixed');
			if(inst.fixed == 0) {
				$('header').hide(0);
				$('header').slideDown('slow');
				inst.fixed = 1;
			}
		}
		else {
			$('header').css('position','initial');
			inst.fixed = 0;
		}
	});
};

function globalInit() {
	//AuthStateChange Listener
  	firebase.auth().onAuthStateChanged(function(user) {
		changeSignInOption(user);
		if(user) {
			//User is signed in.
			console.log(user.email + " signed up");
		}
		else {
			//User is signed out
			console.log("Signed Out 2");
		}
	});

	//SignOut Event
	$('#nav-signout-icon').click(function() {
		firebase.auth().signOut().then(function() {
			//User signed out
			displayError("Signed Out");
		}).catch(function(error) {
			console.log(error.message);
		});
	});
}

function changeSignInOption(user) {
	var signInIcon = $('#nav-signin-icon');
	var signOutIcon = $('#nav-signout-icon');
	var signOutText = $('#nav-signout-name');
	if(user) {
		//User is signed in
		console.log("Signed In");
		//Toggle
		signOutIcon.css('display','block');
		signInIcon.css('display','none');
		signOutText.text(user.displayName);
	}
	else {
		//User is signed out
		console.log("Signed Out");
		//Toggle
		signInIcon.css('display','block');
		signOutIcon.css('display','none');	
		signOutText.text("");
	}
};

$(document).ready(function() {
	var dropdown1 = new Dropdown($('#nav-container-signin'), $('#nav-dropdown'));
	dropdown1.closeIfClickedElsewhere();
	var header = new Header();
	// Initialize Firebase. Project nlyze-1
  	var config = {
    	apiKey: "AIzaSyCXWIr6ctkGUGYRvXsYgFG-NnCk6VRW_7Q",
    	authDomain: "nlyze-1.firebaseapp.com",
    	databaseURL: "https://nlyze-1.firebaseio.com",
    	projectId: "nlyze-1",
    	storageBucket: "nlyze-1.appspot.com",
    	messagingSenderId: "285435874741"
  	};
  	firebase.initializeApp(config);
  	globalInit();
});
















