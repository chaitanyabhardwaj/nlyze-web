//deploy script on access restricted pages

'use strict';

//initialize Inspector
function Inspector(user) {
	this.db = firebase.firestore();
	this.userRef = user;
	this.userDbRef = this.db.doc('users/' + user.uid);
};

Inspector.prototype.inspect = function() {
	const inst = this;
	this.userDbRef.get().then(function(doc) {
		if(doc.exists) {
			if(doc.data().account_type === 'user-type') {
				window.location.replace('/console.html');
			}
		}
	}).catch(function(error) {
		console.log(error);
	});
};

Inspector.prototype.checkDisabled = function() {
	const inst = this;
	this.userDbRef.get().then(doc => {
		if(doc.exists) {
			if(doc.data().active) {
				if(doc.data().account_type === 'user-type') {
					//check admin account status
					inst.db.collection('users').get().then(querySnapshot => {
						querySnapshot.forEach(doc1 => {
							if(doc1.data().user_email === doc.data().linked_email && (!doc1.data().active)) {
								displayError('USER HAS BEEN DISABLED');
								firebase.auth().signOut().then(() => {
									//User signed out
									window.location.replace('/signin.html');
								}).catch(error => console.log(error.message));
							}
						});
					}).catch(error => console.log(error));
				}
			}
			else {
				displayError('USER HAS BEEN DISABLED');
				firebase.auth().signOut().then(() => {
					//User signed out
					window.location.replace('/signin.html');
				}).catch(error => console.log(error.message));
			}
		}
	}).catch(err => console.log(err));
};















