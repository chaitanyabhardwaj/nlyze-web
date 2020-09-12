
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

/*
 *  ADD PRODUCTS LOGIC
 */

exports.addProduct = functions.https.onCall((data, context) => {
	const productId = data.productId;
	switch(productId) {
		case 'np001' : //Add realtime collector
			return addRealTimeCollector(data, context);
		case 'np002' : //Add factory model
			return addFactoryModel(data, context);
		default : //DEFAULT ACTIONS
			return false;
	}
});

/*
 *  ADD FACTORY MODEL FUNC
 */

function addFactoryModel(data, context) {
	const db = admin.firestore();
	const userId = data.userId;
	console.log('Adding to user - ' + userId);
	const endStamp = data.endStamp;
	const currentTimeStamp = new Date().getTime();
	//Add product to user db
	return db.doc('users/' + userId + '/products/np002').set({
		active : 1,
		endStamp : endStamp,
		name : "Factory Model",
		startStamp : currentTimeStamp
	}).then(() => {
		//call seperate function for each component
		const machineResult = addFactoryModelMachineData(userId);
		const materialResult = addFactoryModelMaterialData(userId);
		const manpowerResult = addFactoryModelManpowerData(userId);
		const energyResult = addFactoryModelEnergyData(userId);
		const financeResult = addFactoryModelFinanceData(userId);
		//const volumeResult = addFactoryModelVolumeData(userId);
		const areaDescription = addFactoryModelAreaDescription(userId);
		const areaLayout = addFactoryModelAreaLayout(userId);
		return Promise.all([machineResult, materialResult, manpowerResult, energyResult, financeResult, areaDescription, areaLayout])
			.then(result => {
			console.log(result);
			return (result[0] && result[1] && result[2] && result[3] && result[4] && result[5] && result[6]);
		}).catch(err => {
			console.log(err);
			return false;
		});
	}).catch(err => {
		console.log(err);
	});
};

/*
 *  ADD MACHINE DATA
 */

function addFactoryModelMachineData(userId) {
	var famArr = [], headersArr = [], refPHeadersArr = [];
	var iFam = 0, iHeaders = 0, iRefHeaders = 0;
	const db = admin.firestore();
	const userMachineRef = db.doc('users/' + userId + '/products/np002/factoryFileTypes/machine');
	//Family Ref
	const productMachineFamilyRef = db.collection('products/np002/factoryFileTypes/machine/family');
	const userMachineFamilyRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/machine/family');
	//Headers Ref
	const productMachineHeadersRef = db.collection('products/np002/factoryFileTypes/machine/headers');
	const userMachineHeadersRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/machine/headers');
	//ReferencePeriodHeaders Ref
	const productMachineReferencePeriodHeadersRef = db.collection('products/np002/factoryFileTypes/machine/referencePeriodHeaders');
	const userMachineReferencePeriodHeadersRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/machine/referencePeriodHeaders');
	//read and store all info
	//read family
	return productMachineFamilyRef.get().then(querySnapshot1 => {
		querySnapshot1.forEach(fam => {
			famArr[iFam++] = fam.data();
		});
		return productMachineHeadersRef.get().then(querySnapshot2 => {
			querySnapshot2.forEach(header => {
				headersArr[iHeaders++] = header.data();
			});
			return productMachineReferencePeriodHeadersRef.get().then(querySnapshot3 => {
				querySnapshot3.forEach(refHeader => {
					refPHeadersArr[iRefHeaders++] = refHeader.data();
				});
				return userMachineRef.set({
					displayName : "Machine"
				}).then(() => {
					for(var i = 0; i < famArr.length; i++) {
						userMachineFamilyRef.doc().set(famArr[i]);
					}
				}).then(() => {
					for(var i = 0; i < headersArr.length; i++) {
						userMachineHeadersRef.doc().set(headersArr[i]);
					}
				}).then(() => {
					for(var i = 0; i < refPHeadersArr.length; i++) {
						userMachineReferencePeriodHeadersRef.doc().set(refPHeadersArr[i]);
					}
					return true;
				}).catch(err => {
					console.log(err);
					return false;
				});
			});
		});
	});
};

/*
 *  ADD MATERIAL DATA
 */

function addFactoryModelMaterialData(userId) {
	var famArr = [], headersArr = [], potentialsHeaderArr = [], refPHeadersArr = [];
	var iFam = 0, iHeaders = 0, iPHeaders = 0, iRefHeaders = 0;
	const db = admin.firestore();
	const userMaterialRef = db.doc('users/' + userId + '/products/np002/factoryFileTypes/material');
	//Family Ref
	const productMaterialFamilyRef = db.collection('products/np002/factoryFileTypes/material/family');
	const userMaterialFamilyRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/material/family');
	//Headers Ref
	const productMaterialHeadersRef = db.collection('products/np002/factoryFileTypes/material/headers');
	const userMaterialHeadersRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/material/headers');
	//potentialsHeader Ref
	const productMaterialPotentialsHeaderRef = db.collection('products/np002/factoryFileTypes/material/potentialHeaders');
	const userMaterialPotentialsHeadersRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/material/potentialHeaders');
	//ReferencePeriodHeaders Ref
	const productMaterialReferencePeriodHeadersRef = db.collection('products/np002/factoryFileTypes/material/referencePeriodHeaders');
	const userMaterialReferencePeriodHeadersRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/material/referencePeriodHeaders');
	//read and store all info
	//read family
	return productMaterialFamilyRef.get().then(querySnapshot1 => {
		querySnapshot1.forEach(fam => {
			famArr[iFam++] = fam.data();
		});
		return productMaterialHeadersRef.get().then(querySnapshot2 => {
			querySnapshot2.forEach(header => {
				headersArr[iHeaders++] = header.data();
			});
			return productMaterialPotentialsHeaderRef.get().then(querySnapshot3 => {
				querySnapshot3.forEach(pHeader => {
					potentialsHeaderArr[iPHeaders++] = pHeader.data();
				});
				return productMaterialReferencePeriodHeadersRef.get().then(querySnapshot4 => {
					querySnapshot4.forEach(refHeader => {
						refPHeadersArr[iRefHeaders++] = refHeader.data();
					});
					return userMaterialRef.set({
						displayName : "Material"
					}).then(() => {
						for(var i = 0; i < famArr.length; i++) {
							userMaterialFamilyRef.doc().set(famArr[i]);
						}
					}).then(() => {
						for(var i = 0; i < headersArr.length; i++) {
							userMaterialHeadersRef.doc().set(headersArr[i]);
						}
					}).then(() => {
						for(var i = 0; i < potentialsHeaderArr.length; i++) {
							userMaterialPotentialsHeadersRef.doc().set(potentialsHeaderArr[i]);
						}
					}).then(() => {
						for(var i = 0; i < refPHeadersArr.length; i++) {
							userMaterialReferencePeriodHeadersRef.doc().set(refPHeadersArr[i]);
						}
						return true;
					}).catch(err => {
						console.log(err);
						return false;
					});
				});
			});
		});
	});
};

/*
 *  ADD MANPOWER DATA
 */

function addFactoryModelManpowerData(userId) {
	var famArr = [], headersArr = [], refPHeadersArr = [];
	var iFam = 0, iHeaders = 0, iRefHeaders = 0;
	const db = admin.firestore();
	const userManpowerRef = db.doc('users/' + userId + '/products/np002/factoryFileTypes/manpower');
	//Family Ref
	const productManpowerFamilyRef = db.collection('products/np002/factoryFileTypes/manpower/family');
	const userManpowerFamilyRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/manpower/family');
	//Headers Ref
	const productManpowerHeadersRef = db.collection('products/np002/factoryFileTypes/manpower/headers');
	const userManpowerHeadersRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/manpower/headers');
	//ReferencePeriodHeaders Ref
	const productManpowerReferencePeriodHeadersRef = db.collection('products/np002/factoryFileTypes/manpower/referencePeriodHeaders');
	const userManpowerReferencePeriodHeadersRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/manpower/referencePeriodHeaders');
	//read and store all info
	//read family
	return productManpowerFamilyRef.get().then(querySnapshot1 => {
		querySnapshot1.forEach(fam => {
			famArr[iFam++] = fam.data();
		});
		return productManpowerHeadersRef.get().then(querySnapshot2 => {
			querySnapshot2.forEach(header => {
				headersArr[iHeaders++] = header.data();
			});
			return productManpowerReferencePeriodHeadersRef.get().then(querySnapshot3 => {
				querySnapshot3.forEach(refHeader => {
					refPHeadersArr[iRefHeaders++] = refHeader.data();
				});
				return userManpowerRef.set({
					displayName : "Manpower"
				}).then(() => {
					for(var i = 0; i < famArr.length; i++) {
						userManpowerFamilyRef.doc().set(famArr[i]);
					}
				}).then(() => {
					for(var i = 0; i < headersArr.length; i++) {
						userManpowerHeadersRef.doc().set(headersArr[i]);
					}
				}).then(() => {
					for(var i = 0; i < refPHeadersArr.length; i++) {
						userManpowerReferencePeriodHeadersRef.doc().set(refPHeadersArr[i]);
					}
					return true;
				}).catch(err => {
					console.log(err);
					return false;
				});
			});
		});
	});
};

/*
 *  ADD ENERGY DATA
 */

function addFactoryModelEnergyData(userId) {
	var famArr = [], headersArr = [], refPHeadersArr = [];
	var iFam = 0, iHeaders = 0, iRefHeaders = 0;
	const db = admin.firestore();
	const userEnergyRef = db.doc('users/' + userId + '/products/np002/factoryFileTypes/energy');
	//Family Ref
	//const productEnergyFamilyRef = db.collection('products/np002/factoryFileTypes/energy/family');
	//const userEnergyFamilyRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/energy/family');
	//Headers Ref
	const productEnergyHeadersRef = db.collection('products/np002/factoryFileTypes/energy/headers');
	const userEnergyHeadersRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/energy/headers');
	//ReferencePeriodHeaders Ref
	const productEnergyReferencePeriodHeadersRef = db.collection('products/np002/factoryFileTypes/energy/referencePeriodHeaders');
	const userEnergyReferencePeriodHeadersRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/energy/referencePeriodHeaders');
	//read and store all info
		return productEnergyHeadersRef.get().then(querySnapshot2 => {
			querySnapshot2.forEach(header => {
				headersArr[iHeaders++] = header.data();
			});
			return productEnergyReferencePeriodHeadersRef.get().then(querySnapshot3 => {
				querySnapshot3.forEach(refHeader => {
					refPHeadersArr[iRefHeaders++] = refHeader.data();
				});
				return userEnergyRef.set({
					displayName : "Energy"
				}).then(() => {
					for(var i = 0; i < headersArr.length; i++) {
						userEnergyHeadersRef.doc().set(headersArr[i]);
					}
				}).then(() => {
					for(var i = 0; i < refPHeadersArr.length; i++) {
						userEnergyReferencePeriodHeadersRef.doc().set(refPHeadersArr[i]);
					}
					return true;
				}).catch(err => {
					console.log(err);
					return false;
				});
			});
		});
};

/*
 *  ADD FINANCE DATA
 */

function addFactoryModelFinanceData(userId) {
	var headersArr = [];
	var iHeaders = 0;
	const db = admin.firestore();
	const userEnergyRef = db.doc('users/' + userId + '/products/np002/factoryFileTypes/finance');

	const productFinanceHeadersRef = db.collection('products/np002/factoryFileTypes/finance/headers');
	const userFinanceHeadersRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/finance/headers');
	//read and store all info
	return productFinanceHeadersRef.get().then(querySnapshot2 => {
		querySnapshot2.forEach(header => {
			headersArr[iHeaders++] = header.data();
		});
		return userEnergyRef.set({
			displayName : "Finance"
		}).then(() => {
			for(var i = 0; i < headersArr.length; i++) {
				userFinanceHeadersRef.doc().set(headersArr[i]);
			}
			return true;
		}).catch(err => {
			console.log(err);
			return false;
		});
	});
};

/*
 *  ADD VOLUME DATA
 */

function addFactoryModelVolumeData(userId) {
	var famArr = [], headersArr = [], refPHeadersArr = [];
	var iFam = 0, iHeaders = 0, iRefHeaders = 0;
	const db = admin.firestore();
	const userVolumeRef = db.doc('users/' + userId + '/products/np002/factoryFileTypes/volume');
	//Family Ref
	const productVolumeFamilyRef = db.collection('products/np002/factoryFileTypes/volume/family');
	const userVolumeFamilyRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/volume/family');
	//Headers Ref
	const productVolumeHeadersRef = db.collection('products/np002/factoryFileTypes/volume/headers');
	const userVolumeHeadersRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/volume/headers');
	//ReferencePeriodHeaders Ref
	const productVolumeReferencePeriodHeadersRef = db.collection('products/np002/factoryFileTypes/volume/referencePeriodHeaders');
	const userVolumeReferencePeriodHeadersRef = db.collection('users/' + userId + '/products/np002/factoryFileTypes/volume/referencePeriodHeaders');
	//read and store all info
	//read family
	return productVolumeFamilyRef.get().then(querySnapshot1 => {
		querySnapshot1.forEach(fam => {
			famArr[iFam++] = fam.data();
		});
		return productVolumeHeadersRef.get().then(querySnapshot2 => {
			querySnapshot2.forEach(header => {
				headersArr[iHeaders++] = header.data();
			});
			return productVolumeReferencePeriodHeadersRef.get().then(querySnapshot3 => {
				querySnapshot3.forEach(refHeader => {
					refPHeadersArr[iRefHeaders++] = refHeader.data();
				});
				return userVolumeRef.set({
					displayName : "Volume"
				}).then(() => {
					for(var i = 0; i < famArr.length; i++) {
						userVolumeFamilyRef.doc().set(famArr[i]);
					}
				}).then(() => {
					for(var i = 0; i < headersArr.length; i++) {
						userVolumeHeadersRef.doc().set(headersArr[i]);
					}
				}).then(() => {
					for(var i = 0; i < refPHeadersArr.length; i++) {
						userVolumeReferencePeriodHeadersRef.doc().set(refPHeadersArr[i]);
					}
					return true;
				}).catch(err => {
					console.log(err);
					return false;
				});
			});
		});
	});
};

/*
 *  ADD AREA DESCRIPTION DATA
 */

function addFactoryModelAreaDescription(userId) {
 	var areaArr = [], i =0;
 	const db = admin.firestore();
 	const productAreaDescriptionRef = db.collection('products/np002/areaDescription');
 	const userAreaDescriptionRef = db.collection('users/' + userId + '/products/np002/areaDescription');
 	//read data
 	return productAreaDescriptionRef.get().then(querySnapshot => {
 		querySnapshot.forEach(doc => {
 			areaArr[i++] = doc.data();
 		});
 		//write data
 		for(i = 0; i < areaArr.length; i++) {
 			userAreaDescriptionRef.doc().set(areaArr[i]);
 		}
 		return true;
 	}).catch(err => {
 		console.log(err);
 		return false;
 	});
}

/*
 *  ADD AREA DESCRIPTION DATA
 */

function addFactoryModelAreaLayout(userId) {
 	var areaArr = [], i =0;
 	const db = admin.firestore();
 	const productAreaLayoutRef = db.collection('products/np002/areaLayout');
 	const userAreaLayoutRef = db.collection('users/' + userId + '/products/np002/areaLayout');
 	//read data
 	return productAreaLayoutRef.get().then(querySnapshot => {
 		querySnapshot.forEach(doc => {
 			areaArr[i++] = doc.data();
 		});
 		//write data
 		for(i = 0; i < areaArr.length; i++) {
 			userAreaLayoutRef.doc().set(areaArr[i]);
 		}
 		return true;
 	}).catch(err => {
 		console.log(err);
 		return false;
 	});
}

/*
 *  RealTimeCollector
 */

exports.realtimeCollectorBttnThreshold = functions.firestore
	.document('/users/{userId}/products/np001/button_mapping/{buttonId}')
	.onUpdate(event => {
		const db = admin.firestore();
		const userId = event.params.userId;
		const buttonId = event.params.buttonId;
		const currentStamp = new Date().getTime();
		const bttnRef = db.doc('users/' + userId + '/products/np001/button_mapping/' + buttonId);
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
		const bttnRef = db.doc('users/' + userId + '/products/np001/button_mapping/' + buttonId);
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
		const bttnRef = db.doc('users/' + userId + '/products/np001/button_mapping/' + buttonId);
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

//FACTORY MODEL

exports.validateDataModel = functions.https.onCall((data, context) => {
	const db = admin.firestore();
	const factoryFileType = data.factoryFileType;
	const headersRow = data.headersArr
	const factoryFileTypeHeaders = db.collection('users/' + context.auth.uid + '/products/np002/factoryFileTypes/' + factoryFileType + '/headers');
	//get file content
	var headerString1 = '', headerString2 = '', headerArr2 = [];
	for(var i = 0; i < headersRow.length; i++) {
		headerString1 += headersRow[i].trim() + ' ';
	}
	headerString1 = headerString1.toLowerCase().trim();
	return factoryFileTypeHeaders.orderBy('id').get().then(querySnapshot => {
		var i = 0;
		if(factoryFileType === 'energy' || factoryFileType === 'finance') {
			querySnapshot.forEach(header => {
				headerArr2[i++] = header.data();
			});
			return (headerArr2.length > 1 && headerArr2[0].name === headersRow[0].toLowerCase());
		}
		else {
			querySnapshot.forEach(header => {
				if(header.data().type == 'Inputted') {
					headerString2 += header.data().name + ' ';
				}
			});
			headerString2 = headerString2.toLowerCase().trim();
			console.log(headerString1);
			console.log("File - " + headerString1.length);
			console.log(headerString2);
			console.log('Database - ' + headerString2.length);
			console.log(headerString1 == headerString2);
			return (headerString1 == headerString2);
		}
	}).catch(err => {
		console.log(err);
	});
});

exports.validateReferencePeriodDataModel = functions.https.onCall((data, context) => {
	const db = admin.firestore();
	const factoryFileType = data.factoryFileType;
	const headersRow = data.headersArr
	const factoryFileTypeHeaders = db.collection('users/' + context.auth.uid + '/products/np002/factoryFileTypes/' + factoryFileType + '/referencePeriodHeaders');
	//get file content
	var headerString1 = '', headerString2 = '';
	for(var i = 0; i < headersRow.length; i++) {
		headerString1 += headersRow[i].trim() + ' ';
	}
	headerString1 = headerString1.toLowerCase().trim();
	return factoryFileTypeHeaders.orderBy('id').get().then(querySnapshot => {
		querySnapshot.forEach(header => {
			if(header.data().type == 'Inputted')
				headerString2 += header.data().name + ' ';
		});
		headerString2 = headerString2.toLowerCase().trim();
		console.log(headerString1);
		console.log("File - " + headerString1.length);
		console.log(headerString2);
		console.log('Database - ' + headerString2.length);
		console.log(headerString1 == headerString2);
		return (headerString1 == headerString2);
	}).catch(err => {
		console.log(err);
	});
});

exports.addReferencePeriod = functions.https.onCall((data, context) => {
	const db = admin.firestore();
	const factoryFileType = data.factoryFileType;
	const refPeriod = data.referencePeriod;
	const fileObject = data.fileObject;
	const facStr = 'users/' + context.auth.uid + '/products/np002/factoryFileTypes/' + factoryFileType;
	const refStr = facStr + '/referencePeriod/' + refPeriod;
	const batch = db.batch();
	const refP = db.doc(refStr);
	//create refP
	batch.set(refP,{
		initialFileName : fileObject.meta.name,
		initialCreationDate : new Date().getTime(),
		initialWritten : false,
		initialReferencePeriodWritten : false,
		updatedWritten : false,
		updatedReferencePeriodWritten : false
	});
	return batch.commit().then(() => {
		//refP created
	}).catch(err => {
		console.log(err);
	});
});

exports.addDataModel = functions.https.onCall((data, context) => {
	const db = admin.firestore();
	const factoryFileType = data.factoryFileType;
	//const headersArr = data.headersArr;
	const refPeriod = data.referencePeriod;
	const fileObject = data.fileObject;
	//extract file content from file object
	const fileContent = fileObject.content[Object.keys(fileObject.content)[0]];
	//remove first element
	const headersArr = fileContent.shift();
	//define document references
	const refStr = 'users/' + context.auth.uid + '/products/np002/factoryFileTypes/' + factoryFileType + '/referencePeriod/' + refPeriod;
	const refP = db.doc(refStr);
	const initialFileObjRef = db.collection(refStr + '/initialFileObj');
	const updatedFileObjRef = db.collection(refStr + '/updatedFileObj');
	var rowDocRef;
	return db.runTransaction(transaction => {
		return transaction.get(refP).then(doc => {
			if(!doc.exists) {
				throw 'Path to reference period ' + refPeriod + ' does not exists';
			}
			//else
			if(doc.data().initialWritten) {
				if(doc.data().updatedWritten) {
					//add headersArr
					/*transaction.update(updatedFileObjRef.doc('headers'), {
						headersArr : headersArr
					});*/
					//overwrite updated
					for(var row in fileContent) {
						rowDocRef = updatedFileObjRef.doc();
						transaction.set(rowDocRef, fileContent[row]);
					}
					var admh;
					if(factoryFileType === 'energy') {
						//add headersArr
						admh = addDataModelHeadersEnergy(headersArr, context.auth.uid, refPeriod, 'updated');
						const ardm = addReferencePeriodDataModelHeaders(context.auth.uid, factoryFileType, refPeriod, 'updated');
						return (admh && ardm)
					}
					else if(factoryFileType === 'finance') {
						admh = addDataModelHeadersFinance(headersArr, context.auth.uid, refPeriod, 'updated');
						return admh;
					}
					//else
					admh = addDataModelHeaders(context.auth.uid, factoryFileType, refPeriod, 'updated');
					//const admph = addDataModelPotentialHeaders(context.auth.uid, factoryFileType, refPeriod, 'updated');
					return admh.then(value => {
						return value;
					}).catch(err => {
						console.log(err);
					});
				}
				else {
					//add headersArr
					/*transaction.set(updatedFileObjRef.doc('headers'), {
						headersArr : headersArr
					});*/
					//add data to updated collection
					for(var row in fileContent) {
						rowDocRef = updatedFileObjRef.doc();
						transaction.set(rowDocRef, fileContent[row]);
					}
					//change updatedWritten flag
					transaction.update(refP, {
						updatedWritten : true
					});
				}
				var admh;
				if(factoryFileType === 'energy') {
					//add headersArr
					admh = addDataModelHeadersEnergy(headersArr, context.auth.uid, refPeriod, 'updated');
					const ardm = addReferencePeriodDataModelHeaders(context.auth.uid, factoryFileType, refPeriod, 'updated');
					return (admh && ardm)
				}
				else if(factoryFileType === 'finance') {
					admh = addDataModelHeadersFinance(headersArr, context.auth.uid, refPeriod, 'updated');
					return admh;
				}
				//else
				admh = addDataModelHeaders(context.auth.uid, factoryFileType, refPeriod, 'updated');
				//const admph = addDataModelPotentialHeaders(context.auth.uid, factoryFileType, refPeriod, 'updated');
				return admh.then(value => {
					return value;
				}).catch(err => {
					console.log(err);
				});
			}
			else {
				//add headersArr
				/*transaction.set(initialFileObjRef.doc('headers'), {
					headersArr : headersArr
				});*/
				//write to initial collection
				for(var row in fileContent) {
					rowDocRef = initialFileObjRef.doc();
					transaction.set(rowDocRef, fileContent[row]);
				}
				//change initialWritten flag
				transaction.update(refP, {
					initialWritten : true
				});
				var admh;
				if(factoryFileType === 'energy') {
					//add headersArr
					admh = addDataModelHeadersEnergy(headersArr, context.auth.uid, refPeriod, 'initial');
					const ardm = addReferencePeriodDataModelHeaders(context.auth.uid, factoryFileType, refPeriod, 'initial');
					return (admh && ardm)
				}
				else if(factoryFileType === 'finance') {
					admh = addDataModelHeadersFinance(headersArr, context.auth.uid, refPeriod, 'initial');
					return admh;
				}
				//else
				admh = addDataModelHeaders(context.auth.uid, factoryFileType, refPeriod, 'initial');
				//const admph = addDataModelPotentialHeaders(context.auth.uid, factoryFileType, refPeriod, 'initial');
				return admh.then(value => {
					return value;
				}).catch(err => {
					console.log(err);
				});
			}
		}).catch(err => {
			console.log(err);
			return false;
		});
	});
});

function addDataModelHeaders(userId, factoryFileType, refPeriod, version) {
	const headersStr = 'users/' + userId + '/products/np002/factoryFileTypes/' + factoryFileType + '/headers';
	const refStr = 'users/' + userId + '/products/np002/factoryFileTypes/' + factoryFileType + '/referencePeriod/' + refPeriod;
	const db = admin.firestore();
	//read headers
	const headerArr = [];
	var i = 0;
	return db.collection(headersStr).orderBy('id').get().then(querySnapshot => {
		querySnapshot.forEach(header => {
			headerArr[i++] = header.data();
		});
		//write headers
		for(i = 0; i < headerArr.length; i++) {
			db.collection(refStr + '/' + version + 'Headers').doc().set(headerArr[i]);
		}
		return true;
	});
};

function addDataModelHeadersEnergy(headersArr, userId, refPeriod, version) {
	const db = admin.firestore();
	const refStr = 'users/' + userId + '/products/np002/factoryFileTypes/energy/referencePeriod/' + refPeriod;
	var headerObj = {}; var i = 0, j =0, headerObjArr = [];
	for(key in headersArr) {
		headerObj = {
			id : i++,
			name : key,
			displayName : headersArr[key],
			type : 'Inputted'
		};
		headerObjArr[j++] = headerObj;
	}
	console.log(headerObjArr);
	for(i = 0; i < headerObjArr.length; i++) {
		db.collection(refStr + '/' + version + 'Headers').doc().set(headerObjArr[i]);
	}
	return true;
};

function addDataModelHeadersFinance(headersArr, userId, refPeriod, version) {
	const db = admin.firestore();
	const refStr = 'users/' + userId + '/products/np002/factoryFileTypes/finance/referencePeriod/' + refPeriod;
	var headerObj = {}; var i = 0, j =0, headerObjArr = [];
	for(key in headersArr) {
		headerObj = {
			id : i++,
			name : key,
			displayName : headersArr[key],
			type : 'Inputted'
		};
		headerObjArr[j++] = headerObj;
	}
	console.log(headerObjArr);
	for(i = 0; i < headerObjArr.length; i++) {
		db.collection(refStr + '/' + version + 'Headers').doc().set(headerObjArr[i]);
	}
	return true;
};

function addDataModelPotentialHeaders(userId, factoryFileType, refPeriod, version) {
	const headerStr = 'users/' + userId + '/products/np002/factoryFileTypes/' + factoryFileType + '/potentialHeaders';
	const refStr = 'users/' + userId + '/products/np002/factoryFileTypes/' + factoryFileType + '/referencePeriod/' + refPeriod;
	const db = admin.firestore();
	//read headers
	const headerArr = [];
	var i = 0;
	return db.collection(headerStr).orderBy('id').get().then(querySnapshot => {
		querySnapshot.forEach(header => {
			headerArr[i++] = header.data();
		});
		//write headers
		for(i = 0; i < headerArr.length; i++) {
			db.collection(refStr + '/' + version + 'PotentialHeaders').doc().set(headerArr[i]);
		}
		return true;
	});
};

exports.addReferencePeriodDataModel = functions.https.onCall((data, context) => {
	const db = admin.firestore();
	const factoryFileType = data.factoryFileType;
	const headersArr = data.headersArr;
	const refPeriod = data.referencePeriod;
	const fileObject = data.fileObject;
	//extract file content from file object
	const fileContent = fileObject.content[Object.keys(fileObject.content)[0]];
	//define document references
	const refStr = 'users/' + context.auth.uid + '/products/np002/factoryFileTypes/' + factoryFileType + '/referencePeriod/' + refPeriod;
	const refP = db.doc(refStr);
	const initialFileObjRef = db.collection(refStr + '/initialReferencePeriodObj');
	const updatedFileObjRef = db.collection(refStr + '/updatedReferencePeriodObj');
	var rowDocRef;
	return db.runTransaction(transaction => {
		return transaction.get(refP).then(doc => {
			if(!doc.exists) {
				throw 'Path to reference period ' + refPeriod + ' does not exists';
			}
			//else
			if(doc.data().initialReferencePeriodWritten) {
				if(doc.data().updatedReferencePeriodWritten) {
					//add headersArr
					/*transaction.update(updatedFileObjRef.doc('headers'), {
						headersArr : headersArr
					});*/
					//overwrite updated
					for(var row in fileContent) {
						rowDocRef = updatedFileObjRef.doc();
						transaction.set(rowDocRef, fileContent[row]);
					}
					return addReferencePeriodDataModelHeaders(context.auth.uid, factoryFileType, refPeriod, 'updated');
				}
				else {
					//add headersArr
					/*transaction.set(updatedFileObjRef.doc('headers'), {
						headersArr : headersArr
					});*/
					//add data to updated collection
					for(var row in fileContent) {
						rowDocRef = updatedFileObjRef.doc();
						transaction.set(rowDocRef, fileContent[row]);
					}
					//change updatedWritten flag
					transaction.update(refP, {
						updatedReferencePeriodWritten : true
					});
				}
				return addReferencePeriodDataModelHeaders(context.auth.uid, factoryFileType, refPeriod, 'updated');
			}
			else {
				//add headersArr
				/*transaction.set(initialFileObjRef.doc('headers'), {
					headersArr : headersArr
				});*/
				//write to initial collection
				for(var row in fileContent) {
					rowDocRef = initialFileObjRef.doc();
					transaction.set(rowDocRef, fileContent[row]);
				}
				//change initialWritten flag
				transaction.update(refP, {
					initialReferencePeriodWritten : true
				});
				return addReferencePeriodDataModelHeaders(context.auth.uid, factoryFileType, refPeriod, 'initial');
			}
		}).catch(err => {
			console.log(err);
			return false;
		});
	});
});

function addReferencePeriodDataModelHeaders(userId, factoryFileType, refPeriod, version) {
	const headersStr = 'users/' + userId + '/products/np002/factoryFileTypes/' + factoryFileType + '/referencePeriodHeaders';
	const refStr = 'users/' + userId + '/products/np002/factoryFileTypes/' + factoryFileType + '/referencePeriod/' + refPeriod;
	const db = admin.firestore();
	//read headers
	const headerArr = [];
	var i = 0;
	return db.collection(headersStr).orderBy('id').get().then(querySnapshot => {
		querySnapshot.forEach(header => {
			headerArr[i++] = header.data();
		});
		//write headers
		for(i = 0; i < headerArr.length; i++) {
			db.collection(refStr + '/' + version + 'ReferencePeriodHeaders').doc().set(headerArr[i]);
		}
		return true;
	});
};

exports.setTargetValue = functions.https.onCall((data, context) => {
	const db = admin.firestore();
	const rowId = data.rowId;
	const targetValue = data.targetValue;
	const targetType = data.targetType;
	const factoryFileType = data.factoryFileType;
	const refPeriod = data.referencePeriod;
	const fileObjType = data.fileObjType;
	const targetTypeStr = 'percentage';

	var potentialObjRef;

	if(fileObjType === 'initial') {
		potentialObjRef = db.collection('users/' + context.auth.uid + '/products/np002/factoryFileTypes/' + factoryFileType + '/referencePeriod/' + refPeriod + '/initialPotentialsObj');
		return potentialObjRef.doc(rowId).set({
			value : targetValue,
			valueType : targetTypeStr
		}).then(() => {
			return true;
		}).catch(err => {
			console.log(err);
		});
	}
	else {
		return potentialObjRef = db.collection('users/' + context.auth.uid + '/products/np002/factoryFileTypes/' + factoryFileType + '/referencePeriod/' + refPeriod + '/updatedPotentialsObj');
		return potentialObjRef.doc(rowId).set({
			value : targetValue,
			valueType : targetTypeStr
		}).then(() => {
			return true;
		}).catch(err => {
			console.log(err);
		});
	}
});

exports.deleteTargetDocument = functions.https.onCall((data, context) => {
	const db = admin.firestore();
	const rowId = data.rowId;
	const factoryFileType = data.factoryFileType;
	const refPeriod = data.referencePeriod;
	const fileObjType = data.fileObjType;
	//defining document reference
	const refP = 'users/' + context.auth.uid + '/products/np002/factoryFileTypes/' + factoryFileType + '/referencePeriod/' + refPeriod;
	if(fileObjType === 'initial') {
		//delete TargetValue from initial doc
		return db.doc(refP + '/initialPotentialsObj/' + rowId).delete().then(() => {
			return true;
		}).catch(err => {
			console.log(err);
			return false;
		});
	}
	else {
		//delete TargetValue from updated doc
		return db.doc(refP + '/updatedPotentialsObj/' + rowId).delete().then(() => {
			return true;
		}).catch(err => {
			console.log(err);
			return false;
		});
	}
});

//IN DEVELOPMENT

function computeMaterialData(userId, refPeriod) {
	const db = admin.firestore();
	//referenePeriod data is uploaded

	//compute and fill losses data
	const headersArr = [];
	var i = 0;
	const refP = db.doc('users/' + userId + '/products/np002/factoryFileTypes/material/referencePeriod/' + refPeriod);
	refP.get().then(refDoc => {
		if(!doc.exists) {
			throw 'Document does not exists';
		}
		if(doc.data().initialWritten) {
			if(doc.data().updatedWritten) {
				//get updated headers
				refP.collection('/updatedHeaders').orderBy('id').get().then(headersSnapshot => {
					headersSnapshot.forEach(header => {
						headersArr[i++] = header.data();
					});
					//get losses data
					i = 0;
					refP.collection('/updatedFileObj').get().then(lossesSnapshot => {
						lossesSnapshot.forEach(loss => {
							lossesArr[i++] = loss.data();
						});
						for(i = 0; i < headersArr.length; i++) {
							if(headersArr[i].type === 'Calculated') {
								//use cases for the headers
								switch(headersArr[i].id) {
									case 6 : // lbs/#

								}
							}
						}
					});
				});
			}
			else {

			}
		}
	})
};










