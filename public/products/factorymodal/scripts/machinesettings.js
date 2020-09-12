'use strict';

	//Initialize MachineSettings
	function MachineSettings(user, referencePeriod) {
		const inst = this;
		this.userRef = user;
		this.currentReferencePeriod = referencePeriod;
		this.db = firebase.firestore();
	};

	MachineSettings.prototype.getCurrentLossVersion = function() {
		const inst = this;
		return this.db.doc('/users/' + this.userRef.uid + '/products/np002/factoryFileTypes/machine/referencePeriod/' + this.currentReferencePeriod).get().then(doc => {
			if(doc.exists) {
				if(doc.data().initialWritten) {
					if(doc.data().updatedWritten) {
						return 1;
					}
					return 0;
				}
			}
			return null;
		});
	};

	MachineSettings.prototype.getCurrentReferencePeriodVersion = function() {
		const inst = this;
		return this.db.doc('/users/' + this.userRef.uid + '/products/np002/factoryFileTypes/machine/referencePeriod/' + this.currentReferencePeriod).get().then(doc => {
			if(doc.exists) {
				if(doc.data().initialReferencePeriodWritten) {
					if(doc.data().updatedReferencePeriodWritten) {
						return 1;
					}
					return 0;
				}
			}
			return null;
		});
	};

	MachineSettings.prototype.constructLayout = function() {
		const inst = this;
		//get the current version from which to fetch the data
		const lossVersion = this.getCurrentLossVersion();
		const refPVersion = this.getCurrentReferencePeriodVersion();
		return lossVersion.then(lv => {
			if(lv !== null) {
				return refPVersion.then(rv => {
					if(rv !== null) {
						var fetchData;
						if(lv === 0 || rv === 0) {
							fetchData = inst.startDataFetching('initial');
						}
						else {
							fetchData = inst.startDataFetching('updated');
						}
						return fetchData.then(() => {
							//calculate all necessary values
							inst.calculateData();
							//display data
							//inst.displayData();
						}).catch(err => {
							console.log(err);
						});
					}
					else {
						displayDialog('Reference Period Table data is missing! Please upload the Reference Period data.');
					}
				}).catch(err => {
					console.log(err);
				})
			}
			else {
				displayDialog('Losses Table data is missing! Please upload the Losses data.');
			}
		}).catch(err => {
			console.log(err);
		});
		//start fetching and calculating data
	};

	MachineSettings.prototype.startDataFetching = function(version) {
		//fetch all data
		const referencePeriodHeaderData = this.fetchReferencePeriodHeaderData(version);
		const referencePeriodData = this.fetchReferencePeriodData(version);
		const lossesHeaderData = this.fetchLossesHeaderData(version);
		const lossesData = this.fetchLossesData(version);
		const potentialsData = this.fetchPotentialsPercentData(version);
		const lineData = this.fetchLineData();
		const familyData = this.fetchFamilyData();
		return (referencePeriodHeaderData && referencePeriodData && lossesHeaderData && lossesData && potentialsData && lineData && familyData);
	};

	MachineSettings.prototype.calculateData = function() {
		//cal all data for each line
		this.calCurrentOpeningTime();
		this.calLossesPercentage();
		this.calHmacByHash();
		this.calMinByHash();
		this.calPotentialsHmac();
		this.calAfterVisionCalendarTime();
		this.calAfterVisionTheoreticalTime();
		this.calAfterVisionOpeningTime();
		this.calAfterVisionUtilisation();
	};

	MachineSettings.prototype.displayData = function() {
		//display all data
		//display warning or danger if important data is missing
		this.displayLossesHeaders();
		this.displayReferencePeriodHeaders();
		this.displayLossesData();
		this.displayReferencePeriodData();
		this.displayPotentialsHeader();
		this.displayPotentialsData();
		this.displayAfterVisionHeader();
		this.displayAfterVisionData();
	};

	MachineSettings.prototype.fetchReferencePeriodHeaderData = function(version) {
		const inst = this;
		//store the fetched header data in an array
		this.refPHeaderArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/machine/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'ReferencePeriodHeaders').orderBy('id').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.refPHeaderArr[i++] = doc;
			});
		});
	};

	MachineSettings.prototype.fetchReferencePeriodData = function(version) {
		const inst = this;
		//store the fetched data in an array
		this.refPArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/machine/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'ReferencePeriodObj').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.refPArr[i++] = doc;
			});
		});
	};

	MachineSettings.prototype.fetchLossesHeaderData = function(version) {
		const inst = this;
		//store the fetched header data in an array
		this.lossesHeaderArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/machine/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'Headers').orderBy('id').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.lossesHeaderArr[i++] = doc;
			});
		});
	};

	MachineSettings.prototype.fetchLossesData = function(version) {
		const inst = this;
		//store the fetched data in an array
		this.lossesArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/machine/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'FileObj').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.lossesArr[i++] = doc;
			});
		});
	};

	MachineSettings.prototype.fetchPotentialsPercentData = function(version) {
		const inst = this;
		//store the fetched data in an array
		this.potentialsPercentArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/machine/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'PotentialsObj').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.potentialsPercentArr[i++] = doc;
			});
		});
	}

	MachineSettings.prototype.fetchLineData = function() {
		const inst = this;
		//store the fetched data in an array
		this.lineArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/areaLayout').get().then(querySnapshot => {
			querySnapshot.forEach(area => {
				inst.lineArr[i++] = area.data().line;
			});
		}).catch(err => {
			console.log(err);
		});	
	}

	MachineSettings.prototype.fetchFamilyData = function() {
		const inst = this;
		//store the fetched data in an array
		this.famArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/machine/family').get().then(querySnapshot => {
			querySnapshot.forEach(fam => {
				inst.famArr[i++] = fam.data();
			});
		}).catch(err => {
			console.log(err);
		});
	};

	MachineSettings.prototype.getReferencePeriodDataTotalByLine = function(dataHeaderId) {
		const lineHeader = this.refPHeaderArr[0].data().name;
		const dataHeader = this.refPHeaderArr[dataHeaderId].data().name;
		var lineName, sum = [];
		for(var i = 0; i < this.lineArr.length; i++) {
			lineName = this.lineArr[i];
			//console.log(lineName);
			sum[lineName] = 0;
			for(var j = 0; j < this.refPArr.length; j++) {
				if(this.refPArr[j].data()[lineHeader] === lineName) {
					sum[lineName] += parseFloat(this.refPArr[j].data()[dataHeader].replace(/,/g, ''));
				}
			}
		}
		return sum;
	};

	MachineSettings.prototype.getLossesDataTotalByLine = function(dataHeaderId) {
		const lineHeader = this.lossesArr[0].data().name;
		const dataHeader = this.lossesArr[dataHeaderId].data().name;
		var lineName, sum = [];
		for(var i = 0; i < this.lineArr.length; i++) {
			lineName = this.lineArr[i];
			//console.log(lineName);
			sum[lineName] = 0;
			for(var j = 0; j < this.lossesArr.length; j++) {
				if(this.lossesArr[j].data()[lineHeader] === lineName) {
					sum[lineName] += parseFloat(this.lossesArr[j].data()[dataHeader].replace(/,/g, ''));
				}
			}
		}
		return sum;
	};

	MachineSettings.prototype.calCurrentOpeningTime = function() {
		this.currentOpeningTimeArr = [];
		const calendarTimeHeaderName = this.refPHeaderArr[1].data().name;
		const utilisationHeaderName = this.refPHeaderArr[2].data().name;
		const lineHeaderName = this.refPHeaderArr[0].data().name;
		$.each(this.refPArr, (i, data) => {
			this.currentOpeningTimeArr[i] = {
				line : data.data()[lineHeaderName],
				value : parseFloat(data.data()[calendarTimeHeaderName].replace(/,/g, '')) - parseFloat(data.data()[utilisationHeaderName].replace(/,/g, ''))
			};
		});
	};

	MachineSettings.prototype.calLossesPercentage = function() {
		this.lossesPercentageArr = [];
		const lineHeaderName = this.lossesHeaderArr[0].data().name;
		const hmacHeaderName = this.lossesHeaderArr[3].data().name;
		var lineName, openingTimeSum;
		for(var i = 0; i < this.lossesArr.length; i++) {
			lineName = this.lossesArr[i].data()[lineHeaderName];
			openingTimeSum = 0;
			for(var j = 0; j < this.currentOpeningTimeArr.length; j++) {
				if(this.currentOpeningTimeArr[j].line === lineName)
					openingTimeSum += this.currentOpeningTimeArr[j].value;
			}
			this.lossesPercentageArr[i] = parseFloat(this.lossesArr[i].data()[hmacHeaderName].replace(/,/g, '')) / openingTimeSum * 100;
			if(openingTimeSum === 0)
				this.lossesPercentageArr[i] = 0;
		}
	};

	MachineSettings.prototype.calHmacByHash = function() {
		this.hmacByHashArr = [];
		const hmacHeaderName = this.lossesHeaderArr[3].data().name;
		const hashHeaderName = this.lossesHeaderArr[4].data().name;
		$.each(this.lossesArr, (i, loss) => {
			this.hmacByHashArr[i] = parseFloat(loss.data()[hmacHeaderName].replace(/,/g, '')) / parseFloat(loss.data()[hashHeaderName].replace(/,/g, ''));
		});
	};

	MachineSettings.prototype.calMinByHash = function() {
		this.minByHashArr = [];
		$.each(this.hmacByHashArr, (i, data) => {
			this.minByHashArr[i] = data * 60;
		});
	};

	MachineSettings.prototype.calPotentialsHmac = function() {
		this.potentialsArr = [];
		const hmacHeaderName = this.lossesHeaderArr[3].data().name;
		const lineHeaderName = this.lossesHeaderArr[0].data().name;
		for(var i = 0; i < this.potentialsPercentArr.length; i++) {
			for(var j = 0; j < this.lossesArr.length; j++) {
				if(this.lossesArr[j].id === this.potentialsPercentArr[i].id) {
					this.potentialsArr[i] = {
						line : this.lossesArr[j].data()[lineHeaderName],
						value : parseFloat(this.lossesArr[j].data()[hmacHeaderName].replace(/,/g, '')) * (100 - this.potentialsPercentArr[i].data().value) / 100
					};
					break;
				}
			}
		}
	};

	MachineSettings.prototype.calAfterVisionCalendarTime = function() {
		this.afterVisionCalendarTimeArr = [];
		const calendarTimeHeaderName = this.refPHeaderArr[1].data().name;
		$.each(this.refPArr, (i, data) => {
			this.afterVisionCalendarTimeArr[i] = data.data()[calendarTimeHeaderName];
		});
	};

	MachineSettings.prototype.calAfterVisionTheoreticalTime = function() {
		this.afterVisionTheoreticalTimeArr = [];
		const theoreticalTimeHeaderName = this.refPHeaderArr[4].data().name;
		$.each(this.refPArr, (i, data) => {
			this.afterVisionTheoreticalTimeArr[i] = data.data()[theoreticalTimeHeaderName];
		});
	};

	MachineSettings.prototype.calAfterVisionOpeningTime = function() {
		this.afterVisionOpeningTimeArr = [];
		const lineHeaderName = this.refPHeaderArr[0].data().name;
		var lineName, potentialsTotal;
		for(var i = 0; i < this.refPArr.length; i++) {
			lineName = this.refPArr[i].data()[lineHeaderName];
			potentialsTotal = 0;
			for(var j = 0; j < this.potentialsArr.length; j++) {
				if(this.potentialsArr[j].line === lineName)
					potentialsTotal += parseFloat(this.potentialsArr[j].value);
			}
			//console.log(potentialsTotal);
			this.afterVisionOpeningTimeArr[i] = {
				line : lineName,
				value : potentialsTotal + parseInt(this.afterVisionTheoreticalTimeArr[i].replace(/,/g, ''))
			};
		}
	};

	MachineSettings.prototype.calAfterVisionUtilisation = function() {
		this.afterVisionUtilisationArr = [];
		const calendarTimeHeaderName = this.refPHeaderArr[1].data().name;
		$.each(this.refPArr, (i, data) => {
			this.afterVisionUtilisationArr[i] = parseInt(data.data()[calendarTimeHeaderName].replace(/,/g, '')) - this.afterVisionOpeningTimeArr[i].value;
		});
	};

	MachineSettings.prototype.displayLossesHeaders = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers machine-losses-header">').appendTo('.fileHeaderAppendTo').text('S No.');
		//display all machine losses headers
		$.each(this.lossesHeaderArr, (i, data) => {
			$('<th class="text-small text-low text-center table-headers machine-losses-header">').appendTo('.fileHeaderAppendTo').text(data.data().displayName);
		});
	};

	MachineSettings.prototype.displayReferencePeriodHeaders = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers machine-reference-header">').appendTo('.referencePeriodHeaderAppendTo').text('S No.');
		//display all machine losses headers
		$.each(this.refPHeaderArr, (i, data) => {
			$('<th class="text-small text-low text-center table-headers machine-reference-header">').appendTo('.referencePeriodHeaderAppendTo').text(data.data().displayName);
		});
	};

	MachineSettings.prototype.displayLossesData = function() {
		var trRef, count = 1;
		$.each(this.lossesArr, (i, data) => {
			trRef = $("<tr class='table-data machine-losses-data-row' data-row-id='" + data.id + "'>").appendTo(".fileAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center machine-losses-data'>").text(count++));
			$.each(this.lossesHeaderArr, (j, header) => {
				if(j === 5) { // id of min/#
					trRef.append($("<td class='text-extra-small text-muted text-center machine-losses-data'>").text(this.minByHashArr[i].toFixed(2)));	
				}
				else if(j === 6) { // id of h/#
					trRef.append($("<td class='text-extra-small text-muted text-center machine-losses-data'>").text(this.hmacByHashArr[i].toFixed(2)));	
				}
				else if(j === 7) {// id of %
					trRef.append($("<td class='text-extra-small text-muted text-center machine-losses-data'>").text(this.lossesPercentageArr[i].toFixed(2)));	
				}
				else {
					trRef.append($("<td class='text-extra-small text-muted text-center machine-losses-data'>").text(data.data()[header.data().name]));
				}
			});
		});
	};

	MachineSettings.prototype.displayReferencePeriodData = function() {
		var trRef, count = 1;
		$.each(this.refPArr, (i, data) => {
			trRef = $("<tr class='table-data machine-reference-data-row' data-row-id='" + data.id + "'>").appendTo(".referencePeriodAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center machine-reference-data'>").text(count++));
			$.each(this.refPHeaderArr, (j, header) => {
				if(j === 3) { // id of opening time
					trRef.append($("<td class='text-extra-small text-muted text-center machine-reference-data'>").text(this.currentOpeningTimeArr[i].value));	
				}
				else {
					trRef.append($("<td class='text-extra-small text-muted text-center machine-reference-data'>").text(data.data()[header.data().name]));
				}
			});
		});
	};

	MachineSettings.prototype.displayPotentialsHeader = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers machine-potentials-header">').appendTo('.targetsHeaderAppendTo').text('S No.');
		$('<th class="text-small text-low text-center table-headers machine-potentials-header">').appendTo('.targetsHeaderAppendTo').text('%');
		$.each(this.lossesHeaderArr, (i, data) => {
			if(data.data().toPotentials && data.data().toPotentialsType === 'Inputted')
				$('<th class="text-small text-low text-center table-headers machine-potentials-header">').appendTo('.targetsHeaderAppendTo').text(data.data().displayName);
		});
		$('<th class="text-small text-low text-center table-headers machine-potentials-header">').appendTo('.targetsHeaderAppendTo').text('-');
		$('<th class="text-small text-low text-center table-headers machine-potentials-header">').appendTo('.targetsHeaderAppendTo').text('-');
	};

	MachineSettings.prototype.displayPotentialsData = function() {
		var trRef, count = 1, flag;
		$.each(this.lossesArr, (i, data) => {
			flag = 1;
			trRef = $("<tr class='table-data machine-potentials-data-row' data-row-id='" + data.id + "'>").appendTo(".targetsAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center machine-potentials-data'>").text(count++));
			for(var j = 0; j < this.potentialsPercentArr.length; j++) {
				if(data.id === this.potentialsPercentArr[j].id) {
					//add % value
					trRef.append($("<td class='text-extra-small text-muted text-center machine-potentials-data'>").text(this.potentialsPercentArr[j].data().value));
					//add potentials hmac
					trRef.append($("<td class='text-extra-small text-muted text-center machine-potentials-data'>").text(this.potentialsArr[j].value.toFixed(2)));
					//add edit icon
					trRef.append($("<td class='text-center py-1-5'>").html("<i class='fa fa-pencil-square target-edit-button' style='color: #c3cffd;' data-row-id='" + data.id + "'></i>"));
					//add delete icon
					trRef.append($("<td class='text-center py-1-5'>").html("<i class='fa fa-trash text-low target-delete-button' data-row-id='" + data.id + "'></i>"));
					flag = 0;
					break;
				}
			}
			if(flag) {
				//add blank % value
				trRef.append($("<td class='text-small text-center text-low py-1-5'>").html("<div class='targets-option-container' style='display:none;'><input type='number' class='targets-input w-50 border-top-0 border-left-0 border-right-0 border-bottom rounded' style='padding:2px;'></input></div><div data-row-id='" + data.id + "' class='targets-value-container'></div>"))
				//add blank potentials hmac
				trRef.append($("<td class='text-extra-small text-muted text-center machine-potentials-data'>").text('-'));
				//add edit icon
				trRef.append($("<td class='text-center py-1-5'>").html("<i class='fa fa-pencil-square target-edit-button' style='color: #c3cffd;' data-row-id='" + data.id + "'></i>"));
				//add delete icon
				trRef.append($("<td class='text-center py-1-5'>").html("<i class='fa fa-trash text-low target-delete-button' data-row-id='" + data.id + "'></i>"));
			}
		});
	};

	MachineSettings.prototype.displayAfterVisionHeader = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers machine-after-vision-header">').appendTo('.afterVisionHeaderAppendTo').text('S No.');
		$.each(this.refPHeaderArr, (i, data) => {
			if(data.data().toAfterVision)
				$('<th class="text-small text-low text-center table-headers machine-after-vision-header">').appendTo('.afterVisionHeaderAppendTo').text(data.data().displayName);
		});	
	};

	MachineSettings.prototype.displayAfterVisionData = function() {
		var trRef, count = 1;
		$.each(this.refPArr, (i, data) => {
			trRef = $("<tr class='table-data machine-after-vision-data-row' data-row-id='" + data.id + "'>").appendTo(".afterVisionAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center machine-after-vision-data'>").text(count++));
			//add Calendar Time
			trRef.append($("<td class='text-extra-small text-muted text-center machine-after-vision-data'>").text(this.afterVisionCalendarTimeArr[i]));
			//add Utilisation Losses
			trRef.append($("<td class='text-extra-small text-muted text-center machine-after-vision-data'>").text(this.afterVisionUtilisationArr[i].toFixed(2)));
			//add Opening Time
			trRef.append($("<td class='text-extra-small text-muted text-center machine-after-vision-data'>").text(this.afterVisionOpeningTimeArr[i].value.toFixed(2)));
			//add Theoretical Time
			trRef.append($("<td class='text-extra-small text-muted text-center machine-after-vision-data'>").text(this.afterVisionTheoreticalTimeArr[i]));
		});
	};
