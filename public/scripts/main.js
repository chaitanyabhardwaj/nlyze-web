
'use strict';

//Initializing ScreenRuler
function ScreenRuler() {
	const inst = this;
	//init screen width value
	this.largeSize = 0;
	this.smallSize = 0;
	this.windowWidth = $(window).width();
	this.setScreenSizeVariable();
	//toggleDropdown according to view
	this.reloadOnChange();
	//Add window resize event listener
	$(window).resize(function() {
		//get new window width
		inst.windowWidth = $(window).width();
		inst.reloadOnChange();
	});
};

//Initializing Dropdown
function Dropdown(container, handler) {
	//Instance handle
	const inst = this;
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

//Initialize MainDrawer
function MainDrawer(id) {
	const inst = this;
	//dom element handle
	this.element = $('#' + id);
	this.section0 = $('#section-0');
	this.section0Content = $('#section-0-content');
	//drawer open state
	this.openned = 0;
	//drawer add click event listener
	this.element.click(function() {
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

ScreenRuler.prototype.setScreenSizeVariable = function() {
	if(this.windowWidth > 900) {
		this.largeSize = 1;
	}
	else {
		this.smallSize = 1;
		$('#nav-dropdown').removeClass('dropdown');
	}
};

ScreenRuler.prototype.reloadOnChange = function() {
	if(this.windowWidth > 900 && this.smallSize) {
		//add dropdown class to nav-dropdown
		//$('#nav-dropdown').addClass('dropdown');
		//NEW FUNC
		//instead
		//refresh page
		location.reload();
	}
	else if(this.windowWidth <= 900 && this.largeSize) {
		location.reload();
	}
};

Dropdown.prototype.toggleDisplay = function() {
	if(this.state == 0) { //Dropdown is closed
		//this.element.show();
		this.element.css('display','inline-block');
		this.state = 1;
	}
	else { //Dropdown is opened
		//this.element.hide();
		this.element.css('display','none');
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

MainDrawer.prototype.toggleDisplay = function() {
	if(this.openned) {
		//close drawer and reduce section-0 width
		this.openned = 0;
		this.section0.css('width','8%');
		this.section0Content.hide();
	}
	else {
		//open drawer and increase section-0 width
		this.openned = 1;
		this.section0.css('width','50%');
		this.section0Content.show();
	}
};

MainDrawer.prototype.closeIfClickedElsewhere = function() {
	var inst = this;
	$('header, #section-1, footer').on('click', function() {
		if(inst.openned) {
			inst.toggleDisplay();
		}
	});
}

Header.prototype.headerFixed = function() { // Changes Header position to Fixed
	var mainScrollTop = $('main').scrollTop();
	var inst = this;
	$(window).scroll(function(event) {
		var scroll = $(window).scrollTop();
		if(scroll > (mainScrollTop + 40)) {
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
			displayDialog("Signed Out");
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
	const screenRuler = new ScreenRuler();
	const dropdown1 = new Dropdown($('#nav-container-signin'), $('#nav-dropdown'));
	const dropdown2 = new Dropdown($('#nav-drawer'), $('#nav-container'));
	dropdown1.closeIfClickedElsewhere();
	const header = new Header();
	//Initialize bootstrap tooltop
	$('[data-toggle="tooltip"]').tooltip();
	//Initialize bootstrap popover
    $('[data-toggle="popover"]').popover(); 
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
















