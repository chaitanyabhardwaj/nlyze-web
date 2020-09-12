

'use strict';
//Initialize ProductChecker
function ProductChecker(user) {
	this.db = firebase.firestore();
	this.productsRef = this.db.collection('users').doc(user.uid).collection('products');
	this.productsGlobalRef = this.db.collection('products');
};

ProductChecker.prototype.checkProductActive = function() {
	const inst = this;
	const currentDate = new Date().getTime();
	this.productsRef.get().then(function(querySnapshot) {
		querySnapshot.forEach(function(product) {
			if(product.data().active) {
				const daysLeft = Math.floor((product.data().endStamp - currentDate) / 86400000);
				//get 'notify user limit'
				inst.productsGlobalRef.get().then(function(querySnapshot1) {
					querySnapshot1.forEach(function(doc) {
						if(doc.id === product.id) {
							if((doc.data().notifyExpirationBefore / 86400000) >= daysLeft) {
								//send email and sms to user
								const sendEmail = firebase.functions().httpsCallable('productExpireDetailSendEmail');
								sendEmail({
									productCode : doc.id,
									productName : doc.data().name,
									productDaysLeft : daysLeft,
								}).then(function(result) {
									console.log(result);
								}).catch(function(error) {
									console.log(error);
								});
							}
							if(currentDate >= product.data().endStamp) {
								//product expired
								displayError('Product Expired');
								//change active status
								inst.productsRef.doc(product.id).update({
									active : 0
								}).then(function() {
									//updated
									window.location.replace('/');
								}).catch(function(error) {
									console.log(error);
								});
							}
						}
					});
				});
			}
		});
	});
};

$(document).ready(function() {
	firebase.auth().onAuthStateChanged(function(user) {
		if(user) {
			//User signed in
			const productChecker = new ProductChecker(user);
			productChecker.checkProductActive();
		}
	});
});
