
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const SENDGRID_API_KEY = functions.config().sengrid.key;
const sendgridMail = require('@sendgrid/mail');
sendgridMail.setApiKey(SENDGRID_API_KEY);

const twilio = require('twilio');
const twilioAccountSid = functions.config().twilio.sid;
const twilioAuthToken = functions.config().twilio.token;
const twilioClient = new twilio(twilioAccountSid, twilioAuthToken);
const twilioNumber = '+19312728431';

exports.realtimeCollectorBttnThreshold = functions.firestore
	.document('/users/{userId}/products/np001/button_mapping/{buttonId}')
	.onUpdate(event => {
		const db = admin.firestore();
		const userId = event.params.userId;
		const buttonId = event.params.buttonId;
		const currentStamp = new Date().getTime();
		const bttnRef = db.doc('/users/' + userId + '/products/np001/button_mapping/' + buttonId);
		return db.runTransaction(transaction => {
			return transaction.get(bttnRef).then(doc => {
				if(!doc.exists) {
					throw 'Doc does not exists!';
				}
				const data = doc.data();
				if(data.frequency > 0 && data.counter >= data.frequency) {
					console.log('Bttn - ' + buttonId + ' counter refreshed');
					//update bttn time & counter
					if(currentStamp <= data.time) {
						transaction.update(bttnRef, {
							time : (currentStamp + data.interval),
							counter : 0
						});
					}
					else {
						transaction.update(bttnRef, {
							time : (data.time + data.interval),
							counter : 0
						});
					}
				}
			})
		}).then(() => {
			console.log('completed');
		}).catch(err => {
			console.log(err);
		});
});

exports.realtimeCollectorBttnSendEmail = functions.firestore
	.document('/users/{userId}/products/np001/button_mapping/{buttonId}')
	.onUpdate(event => {
		const db = admin.firestore();
		const userId = event.params.userId;
		const buttonId = event.params.buttonId;
		const bttnRef = db.doc('/users/' + userId + '/products/np001/button_mapping/' + buttonId);
		//get current timestamp to validate data
		const currentStamp = new Date().getTime();
		//get and validate 'send email' conditions
		return db.runTransaction(transaction => {
			return transaction.get(bttnRef).then(doc => {
				if(!doc.exists) {
					throw 'Doc does not exists!';
				}
				const data = doc.data();
				if(data.frequency >  0 && data.counter >= data.frequency && data.email !== '') {
					if(currentStamp <= data.time) {
						const msg = {
							to : data.email,
							from : 'sunil@nlyze.co',
							subject : 'Nlyze - Button Click Event',
							//custom template
							templateId : '162611c6-b034-445e-91bf-e55845efdd2f',
							substitutionWrappers : ['{{', '}}'],
							substitutions : {
								user_email : data.email,
								button_name : data.name,
								button_id : data.longId,
								frequency : "'" + data.counter + "'",
								duration : "'" + (data.interval/3600000) + "'"
							}
						}
						return sendgridMail.send(msg).then(() => console.log('Email Sent! To ' + data.email)).catch(error => console.log(error));
					}
				}
			});
		}).then(() => {
			console.log('completed');
		}).catch(err => {
			console.log(err);
		});
});

exports.realtimeCollectorBttnSendSms = functions.firestore
	.document('/users/{userId}/products/np001/button_mapping/{buttonId}')
	.onUpdate(event => {
		const db = admin.firestore();
		const userId = event.params.userId;
		const buttonId = event.params.buttonId;
		const bttnRef = db.doc('/users/' + userId + '/products/np001/button_mapping/' + buttonId);
		//get current timestamp to validate data
		const currentStamp = new Date().getTime();
		//get and validate 'send sms' conditions
		return bttnRef.get().then(doc => {
			if(doc.exists) {
				const data = doc.data();
				if(data.frequency > 0 && data.counter >= data.frequency) {
					if(currentStamp <= data.time) {
						if(data.phone !== '') {
							const msgBody = 'Hello ' + data.email + ', the button ' + data.name + ' has been pressed ' + data.counter + ' times within ' + (data.interval/3600000) + ' hours.\nNlyze Team';
							const msg = {
								body : msgBody,
								to : '+' + data.countryCode + data.phone,
								from : twilioNumber,
							};
							return twilioClient.messages.create(msg);
						}
					}
				}
			}
		}).catch(err => console.log(err));
});

exports.realtimeCollectorBttnPressed = functions.https.onRequest((req, res) => {
	const bttnId = req.query.longId;
	const userId = req.query.userId;
	const db = admin.firestore();
	//get current timestamp
	const currentTimestamp = new Date().getTime();
	const bttnRef = db.doc('users/' + userId + 'products/np001/button_mapping/' + bttnId);
	//get bttn counter
	return bttnRef.get().then(doc => {
		if(doc.exists) {
			bttnRef.update({
				lastPressed : currentTimestamp,
				counter : (doc.data().counter + 1)
			}).then(() => {
				console.log('Bttn clicked and updated!');
			}).catch(error => {
				console.log(error);
			});
		}
	});
});

exports.contactUsSendEmail = functions.https.onCall((data, context) => {
	const name = data.firstName + data.lastName;
	const companyName = data.companyName;
	const emailFrom = data.userEmail;
	const phone = data.userPhone;
	const message = data.message;
	const msg = {
		to : 'sunil@nlyze.co',
		from : emailFrom,
		subject : 'Contact Us | Nlyze',
		//custom template
		templateId : 'f671bc07-4ee2-497e-9def-59335a8b4091',
		substitutionWrappers : ['{{', '}}'],
		substitutions : {
			user_name : name,
			companyName : companyName,
			user_email : message,
			user_phone : phone,
			message : message
		}
	};
	return sendgridMail.send(msg).then(() => console.log('Email sent to self from ' + emailFrom)).catch(error => console.log(error));
});

exports.productExpireDetailSendEmail = functions.https.onCall((data, context) => {
	const db = admin.firestore();
	const productCode = data.productCode;
	const productName = data.productName;
	const productDaysLeft = data.productDaysLeft;
	const productRef = db.doc('users/' + context.auth.uid + '/products/' + productCode);
	return db.runTransaction(transaction => {
		return transaction.get(productRef).then(doc => {
			if(!doc.exists) {
				throw 'Doc does not exists';
			}
			if(!doc.data().emailSent) {
				transaction.update({
					emailSent : true
				});
				const msg = {
					to : context.auth.token.email,
					from : 'sunil@nlyze.co',
					subject : 'Product Expiration Notice | Nlyze',
					//custom template
					templateId : '34699794-7849-4fda-a9e5-ff6a752c0a7f',
					substitutionWrappers : ['{{', '}}'],
					substitutions : {
						user_email : context.auth.token.email,
						product_name : productName,
						product_expiration_days_left : productDaysLeft,
					}
				};
				return sendgridMail.send(msg).then(() => console.log('Email send to ' + userEmail)).catch(error => console.log(error));
			}
		});
	}).then(() => console.log('completed')).catch(err => console.log(err));
});

exports.authAdmin = functions.https.onCall((data, context) => {
	const userEmail = context.auth.token.email;
	if(userEmail) {
		//userEmail not null
		const db = admin.firestore();
		const adminRef = db.collection('admins');
		return adminRef.get().then(querySnapshot => {
			var flag = 0;
			querySnapshot.forEach(doc => {
				if(doc.data().email === userEmail)
					flag = 1;
			});
			return flag;
		});
	}
});

exports.createNewUser = functions.https.onCall((data, context) => {
	return admin.auth().createUser({
		email : data.userEmail,
		password : data.userPasswd,
		displayName : data.displayName,
	}).then(record => {
		console.log('User created with ' + record.uid + ' uid');
		//add user details to db
		const db = admin.firestore();
		const linkedEmail = data.linkedEmail;
		if(data.account_type === 'admin-type')
			linkedEmail = '';
		return db.collection('users').doc(record.uid).set({
			account_type : data.accountType,
			active : true,
			city : "",
			company_Name : "",
			country : "",
			linked_email : linkedEmail,
			countryCode : data.countryCode,
			phone : data.userPhone,
			street : "",
			user_email : data.userEmail
		}).then(docRef => {
			console.log('User added to DB');
			return true;
		}).catch(error => {
			console.log(error);
			return false;
		});
	}).catch(err => {
		console.log(err);
		return false;
	});
});

exports.enableUser = functions.https.onCall((data, context) => {
	return admin.auth().updateUser(data.uid, {
		disabled : false
	}).then(record => {
		console.log('User with uid - ' + data.uid + ' is enabled');
		const db = admin.firestore();
		return db.collection('users').doc(data.uid).update({
			active : true
		}).then(() => {
			console.log('User active status changed to true');
			return true;
		}).catch(err => {
			console.log(err);
			return false;
		});
	}).catch(error => {
		console.log(error);
		return false;
	})
});

exports.disableUser = functions.https.onCall((data, context) => {
	const db = admin.firestore();
	return db.collection('users').doc(data.uid).update({
		active : false
	}).then(() => {
		console.log('User active status changed to false');
		//disable user
		return admin.auth().updateUser(data.uid, {
			disabled : true
		}).then(record => {
			console.log('User with uid - ' + data.uid + ' is disabled');
			return true;
		}).catch(err => {
			console.log(err);
			return false;
		});
	}).catch(error => {
		console.log(error);
		return false;
	});
});

exports.createNewProduct = functions.https.onCall((data, context) => {
	const db = admin.firestore();
	return db.collection('products').doc(data.codeName).set({
		name : data.productName,
		linkName : data.linkName,
		notifyExpirationBefore : data.notifyBefore
	}).then(() => {
		console.log('New Product Added - ' + data.codeName);
		return true;
	}).catch(err => {
		console.log(err);
		return false
	});
});
















