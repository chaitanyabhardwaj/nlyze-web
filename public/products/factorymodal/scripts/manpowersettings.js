'use strict';

	//Initialize ManpowerSettings
	function ManpowerSettings(user, referencePeriod) {
		const inst = this;
		this.userRef = user;
		this.currentReferencePeriod = referencePeriod;
		this.db = firebase.firestore();
	};

	ManpowerSettings.prototype.getCurrentLossVersion = function() {
		const inst = this;
		return this.db.doc('/users/' + this.userRef.uid + '/products/np002/factoryFileTypes/manpower/referencePeriod/' + this.currentReferencePeriod).get().then(doc => {
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

	ManpowerSettings.prototype.getCurrentReferencePeriodVersion = function() {
		const inst = this;
		return this.db.doc('/users/' + this.userRef.uid + '/products/np002/factoryFileTypes/manpower/referencePeriod/' + this.currentReferencePeriod).get().then(doc => {
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

	ManpowerSettings.prototype.constructLayout = function() {
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

	ManpowerSettings.prototype.startDataFetching = function(version) {
		//fetch all data
		const referencePeriodHeaderData = this.fetchReferencePeriodHeaderData(version);
		const referencePeriodData = this.fetchReferencePeriodData(version);
		const lossesHeaderData = this.fetchLossesHeaderData(version);
		const lossesData = this.fetchLossesData(version);
		const potentialsData = this.fetchPotentialsPercentData(version);
		const lineData = this.fetchLineData();
		const familyData = this.fetchFamilyData();
		//fetch external data
		const fetchExternalData = this.fetchExternalData();
		return (referencePeriodHeaderData && referencePeriodData && lossesHeaderData && lossesData && potentialsData && lineData && familyData && fetchExternalData);
	};

	ManpowerSettings.prototype.calculateData = function() {
		//get data from machine
		this.getMachineTheoreticalTime();
		this.getCurrentMachineOpeningTime();
		this.getAfterVisionMachineOpeningTime();
		//cal all data for each line
		this.calAddedValueManpowerHours();
		this.calCurrentLosses();
		this.calHmanByHash();
		this.calLossesPercentage();
		this.calPotentialsHman();
		this.calAfterVisionLosses();
		this.calAfterVisionWorkingHours();
	};

	ManpowerSettings.prototype.displayData = function() {
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

	ManpowerSettings.prototype.fetchExternalData = function() {
		//start fetching from machine file
		//NOTE : THE machinesettings.js SCRIPT **MUST** BE PLACED ABOVE OR BEFORE THE manpowersettings.js
		this.machinesettings = new MachineSettings(this.userRef, this.currentReferencePeriod);
		const cL = this.machinesettings.constructLayout();
		return cL;
	};

	ManpowerSettings.prototype.fetchReferencePeriodHeaderData = function(version) {
		const inst = this;
		//store the fetched header data in an array
		this.refPHeaderArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/manpower/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'ReferencePeriodHeaders').orderBy('id').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.refPHeaderArr[i++] = doc;
			});
		});
	};

	ManpowerSettings.prototype.fetchReferencePeriodData = function(version) {
		const inst = this;
		//store the fetched data in an array
		this.refPArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/manpower/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'ReferencePeriodObj').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.refPArr[i++] = doc;
			});
		});
	};

	ManpowerSettings.prototype.fetchLossesHeaderData = function(version) {
		const inst = this;
		//store the fetched header data in an array
		this.lossesHeaderArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/manpower/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'Headers').orderBy('id').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.lossesHeaderArr[i++] = doc;
			});
		});
	};

	ManpowerSettings.prototype.fetchLossesData = function(version) {
		const inst = this;
		//store the fetched data in an array
		this.lossesArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/manpower/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'FileObj').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.lossesArr[i++] = doc;
			});
		});
	};

	ManpowerSettings.prototype.fetchPotentialsPercentData = function(version) {
		const inst = this;
		//store the fetched data in an array
		this.potentialsPercentArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/manpower/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'PotentialsObj').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.potentialsPercentArr[i++] = doc;
			});
		});
	}

	ManpowerSettings.prototype.fetchLineData = function() {
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

	ManpowerSettings.prototype.fetchFamilyData = function() {
		const inst = this;
		//store the fetched data in an array
		this.famArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/manpower/family').get().then(querySnapshot => {
			querySnapshot.forEach(fam => {
				inst.famArr[i++] = fam.data();
			});
		}).catch(err => {
			console.log(err);
		});
	};

	ManpowerSettings.prototype.getReferencePeriodDataTotalByLine = function(dataHeaderId) {
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

	ManpowerSettings.prototype.getLossesDataTotalByLine = function(dataHeaderId) {
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

	ManpowerSettings.prototype.getMachineTheoreticalTime = function() {
		this.machineTheoreticalTimeArr = [];
		const headerName = this.machinesettings.refPHeaderArr[4].data().name;
		const lineHeaderName = this.machinesettings.refPHeaderArr[0].data().name;
		const refPLineHeaderName = this.refPHeaderArr[0].data().name;
		var lineName, sum;
		$.each(this.refPArr, (i, r) => {
			lineName = r.data()[refPLineHeaderName];
			sum = 0;
			$.each(this.machinesettings.refPArr, (j, data) => {
				if(lineName === data.data()[lineHeaderName])
					sum += parseFloat(data.data()[headerName].replace(/,/g, ''));
			});
			this.machineTheoreticalTimeArr[i] = {
				line : lineName,
				value : sum
			};
		})
	};

	ManpowerSettings.prototype.getCurrentMachineOpeningTime = function() {
		this.currentMachineOpeningTimeArr = [];
		const refPLineHeaderName = this.refPHeaderArr[0].data().name;
		var lineName, sum;
		$.each(this.refPArr, (i, r) => {
			lineName = r.data()[refPLineHeaderName];
			sum = 0;
			$.each(this.machinesettings.currentOpeningTimeArr, (i, data) => {
				if(lineName === data.line) {
					sum += data.value;
				}
			});
			this.currentMachineOpeningTimeArr[i] = {
				line : lineName,
				value : sum
			};
		});
	};

	ManpowerSettings.prototype.getAfterVisionMachineOpeningTime = function() {
		this.afterVisionMachineOpeningTimeArr = [];
		const refPLineHeaderName = this.refPHeaderArr[0].data().name;
		var lineName, sum;
		$.each(this.refPArr, (i, r) => {
			lineName = r.data()[refPLineHeaderName];
			sum = 0;
			$.each(this.machinesettings.afterVisionOpeningTimeArr, (i, data) => {
				if(lineName === data.line) {
					sum += data.value;
				}
			});
			this.afterVisionMachineOpeningTimeArr[i] = {
				line : lineName,
				value : sum
			};
		});
	};

	ManpowerSettings.prototype.calAddedValueManpowerHours = function() {
		this.addedValueManpowerHoursArr = [];
		const refPLineHeaderName = this.refPHeaderArr[0].data().name;
		const manningNormHeaderName = this.refPHeaderArr[2].data().name;
		var lineName;
		$.each(this.refPArr, (i, r) => {
			lineName = r.data()[refPLineHeaderName];
			$.each(this.machineTheoreticalTimeArr, (j, m) => {
				if(lineName === m.line)
					this.addedValueManpowerHoursArr[i] = m.value * parseFloat(r.data()[manningNormHeaderName].replace(/,/g, ''));
			});
		});
	};

	ManpowerSettings.prototype.calCurrentLosses = function() {
		this.currentLossesArr = [];
		const workingHoursHeaderName = this.refPHeaderArr[1].data().name;
		const manningNormHeaderName = this.refPHeaderArr[2].data().name;
		const lineHeaderName = this.refPHeaderArr[0].data().name;
		var lineName;
		$.each(this.refPArr, (i, data) => {
			lineName = data.data()[lineHeaderName];
			$.each(this.machineTheoreticalTimeArr, (i , t) => {
				if(t.line === lineName) {
					this.currentLossesArr[i] = {
						line : data.data()[lineHeaderName],
						value : parseFloat(data.data()[workingHoursHeaderName].replace(/,/g, '')) - t.value * parseFloat(data.data()[manningNormHeaderName].replace(/,/g, ''))
					};
				}
			});
		});
	};

	ManpowerSettings.prototype.calHmanByHash = function() {
		this.hmanByHashArr = [];
		const hmanHeaderName = this.lossesHeaderArr[3].data().name;
		const hashHeaderName = this.lossesHeaderArr[4].data().name;
		$.each(this.lossesArr, (i, data) => {
			if(data.data()[hmanHeaderName] === undefined || data.data()[hashHeaderName] === undefined)
				this.hmanByHashArr[i] = 0;
			else
				this.hmanByHashArr[i] = parseFloat(data.data()[hmanHeaderName].replace(/,/g, '')) / parseFloat(data.data()[hashHeaderName].replace(/,/g, ''));
		});
	};

	ManpowerSettings.prototype.calLossesPercentage = function() {
		this.lossesPercentageArr = [];
		const hmanHeaderName = this.lossesHeaderArr[3].data().name;
		const hashHeaderName = this.lossesHeaderArr[4].data().name;
		const workingHoursHeaderName = this.refPHeaderArr[1].data().name;
		const lossLineHeaderName = this.lossesHeaderArr[0].data().name;
		const refPLineHeaderName = this.refPHeaderArr[0].data().name;
		var lineName, sum;
		$.each(this.lossesArr, (i, loss) => {
			lineName = loss.data()[lossLineHeaderName];
			sum = 0;
			$.each(this.refPArr, (j, data) => {
				if(lineName === data.data()[refPLineHeaderName])
					sum += parseFloat(data.data()[workingHoursHeaderName].replace(/,/g, ''));
			});
			if(sum === 0)
				this.lossesPercentageArr[i] = 0;
			else
				this.lossesPercentageArr[i] = parseFloat(loss.data()[hmanHeaderName].replace(/,/g, '')) / sum;
		});
	};

	ManpowerSettings.prototype.calPotentialsHman = function() {
		this.potentialsHmanArr = [];
		const hmanHeaderName = this.lossesHeaderArr[3].data().name;
		const lineHeaderName = this.lossesHeaderArr[0].data().name;
		for(var i = 0; i < this.potentialsPercentArr.length; i++) {
			for(var j = 0; j < this.lossesArr.length; j++) {
				if(this.lossesArr[j].id === this.potentialsPercentArr[i].id) {
					this.potentialsHmanArr[i] = {
						line : this.lossesArr[j].data()[lineHeaderName],
						value : parseFloat(this.lossesArr[j].data()[hmanHeaderName].replace(/,/g, '')) * (100 - this.potentialsPercentArr[i].data().value) / 100
					};
					break;
				}
			}
		}
	};

	ManpowerSettings.prototype.calAfterVisionLosses = function() {
		this.afterVisionLossesArr = [];
		const refPLineHeaderName = this.refPHeaderArr[0].data().name;
		var lineName, sum;
		$.each(this.refPArr, (i, data) => {
			lineName = data.data()[refPLineHeaderName];
			sum = 0;
			$.each(this.potentialsHmanArr, (j, p) => {
				if(lineName === p.line) {
					sum += p.value;
				}
			});
			this.afterVisionLossesArr[i] = sum;
		});
	};

	ManpowerSettings.prototype.calAfterVisionWorkingHours = function() {
		this.afterVisionWorkingHoursArr = [];
		const workingHoursHeaderName = this.refPHeaderArr[1].data().name;
		$.each(this.refPArr, (i, data) => {
			this.afterVisionWorkingHoursArr[i] = parseFloat(data.data()[workingHoursHeaderName].replace(/,/g, '')) - this.currentLossesArr[i].value + this.afterVisionLossesArr[i];
			console.log(data.data()[workingHoursHeaderName]);
			console.log(this.currentLossesArr[i].value);
			console.log(this.afterVisionLossesArr[i]);
			console.log('------------------------------');
		});
	};

	ManpowerSettings.prototype.displayLossesHeaders = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers manpower-losses-header">').appendTo('.fileHeaderAppendTo').text('S No.');
		//display all manpower losses headers
		$.each(this.lossesHeaderArr, (i, data) => {
			$('<th class="text-small text-low text-center table-headers manpower-losses-header">').appendTo('.fileHeaderAppendTo').text(data.data().displayName);
		});
	};

	ManpowerSettings.prototype.displayReferencePeriodHeaders = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers manpower-reference-header">').appendTo('.referencePeriodHeaderAppendTo').text('S No.');
		//display all manpower losses headers
		$.each(this.refPHeaderArr, (i, data) => {
			$('<th class="text-small text-low text-center table-headers manpower-reference-header">').appendTo('.referencePeriodHeaderAppendTo').text(data.data().displayName);
		});
	};

	ManpowerSettings.prototype.displayLossesData = function() {
		var trRef, count = 1;
		$.each(this.lossesArr, (i, data) => {
			trRef = $("<tr class='table-data manpower-losses-data-row' data-row-id='" + data.id + "'>").appendTo(".fileAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center manpower-losses-data'>").text(count++));
			$.each(this.lossesHeaderArr, (j, header) => {
				if(j === 5) { // id of hman/#
					trRef.append($("<td class='text-extra-small text-muted text-center manpower-losses-data'>").text(this.hmanByHashArr[i].toFixed(2)));	
				}
				else if(j === 6) { // id of losses %
					trRef.append($("<td class='text-extra-small text-muted text-center manpower-losses-data'>").text(this.lossesPercentageArr[i].toFixed(2)));	
				}
				else {
					trRef.append($("<td class='text-extra-small text-muted text-center manpower-losses-data'>").text(data.data()[header.data().name]));
				}
			});
		});
	};

	ManpowerSettings.prototype.displayReferencePeriodData = function() {
		var trRef, count = 1;
		$.each(this.refPArr, (i, data) => {
			trRef = $("<tr class='table-data manpower-reference-data-row' data-row-id='" + data.id + "'>").appendTo(".referencePeriodAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center manpower-reference-data'>").text(count++));
			$.each(this.refPHeaderArr, (j, header) => {
				if(j === 3) { // id of theoretical time
					trRef.append($("<td class='text-extra-small text-muted text-center manpower-reference-data'>").text(this.machineTheoreticalTimeArr[i].value));
				}
				else if(j === 4) { // id of opening time
					trRef.append($("<td class='text-extra-small text-muted text-center manpower-reference-data'>").text(this.currentMachineOpeningTimeArr[i].value));
				}
				else if(j === 5) { // id of added value manpower hours
					trRef.append($("<td class='text-extra-small text-muted text-center manpower-reference-data'>").text(this.addedValueManpowerHoursArr[i].toFixed(2)));	
				}
				else if(j === 6) { //id of Losses
					trRef.append($("<td class='text-extra-small text-muted text-center manpower-reference-data'>").text(this.currentLossesArr[i].value.toFixed(2)));
				}
				else {
					trRef.append($("<td class='text-extra-small text-muted text-center manpower-reference-data'>").text(data.data()[header.data().name]));
				}
			});
		});
	};

	ManpowerSettings.prototype.displayPotentialsHeader = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers manpower-potentials-header">').appendTo('.targetsHeaderAppendTo').text('S No.');
		$('<th class="text-small text-low text-center table-headers manpower-potentials-header">').appendTo('.targetsHeaderAppendTo').text('%');
		$.each(this.lossesHeaderArr, (i, data) => {
			if(data.data().toPotentials && data.data().toPotentialsType === 'Inputted')
				$('<th class="text-small text-low text-center table-headers manpower-potentials-header">').appendTo('.targetsHeaderAppendTo').text(data.data().displayName);
		});
		$('<th class="text-small text-low text-center table-headers manpower-potentials-header">').appendTo('.targetsHeaderAppendTo').text('-');
		$('<th class="text-small text-low text-center table-headers manpower-potentials-header">').appendTo('.targetsHeaderAppendTo').text('-');
	};

	ManpowerSettings.prototype.displayPotentialsData = function() {
		var trRef, count = 1, flag;
		$.each(this.lossesArr, (i, data) => {
			flag = 1;
			trRef = $("<tr class='table-data manpower-potentials-data-row' data-row-id='" + data.id + "'>").appendTo(".targetsAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center manpower-potentials-data'>").text(count++));
			for(var j = 0; j < this.potentialsPercentArr.length; j++) {
				if(data.id === this.potentialsPercentArr[j].id) {
					//add % value
					trRef.append($("<td class='text-extra-small text-muted text-center manpower-potentials-data'>").text(this.potentialsPercentArr[j].data().value));
					//add potentials hman
					trRef.append($("<td class='text-extra-small text-muted text-center manpower-potentials-data'>").text(this.potentialsHmanArr[j].value));
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
				trRef.append($("<td class='text-extra-small text-muted text-center manpower-potentials-data'>").text('-'));
				//add edit icon
				trRef.append($("<td class='text-center py-1-5'>").html("<i class='fa fa-pencil-square target-edit-button' style='color: #c3cffd;' data-row-id='" + data.id + "'></i>"));
				//add delete icon
				trRef.append($("<td class='text-center py-1-5'>").html("<i class='fa fa-trash text-low target-delete-button' data-row-id='" + data.id + "'></i>"));
			}
		});
	};

	ManpowerSettings.prototype.displayAfterVisionHeader = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers manpower-after-vision-header">').appendTo('.afterVisionHeaderAppendTo').text('S No.');
		$.each(this.refPHeaderArr, (i, data) => {
			if(data.data().toAfterVision)
				$('<th class="text-small text-low text-center table-headers manpower-after-vision-header">').appendTo('.afterVisionHeaderAppendTo').text(data.data().displayName);
		});	
	};

	ManpowerSettings.prototype.displayAfterVisionData = function() {
		var trRef, count = 1;
		const manningNormHeaderName = this.refPHeaderArr[2].data().name;
		$.each(this.refPArr, (i, data) => {
			trRef = $("<tr class='table-data manpower-after-vision-data-row' data-row-id='" + data.id + "'>").appendTo(".afterVisionAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center manpower-after-vision-data'>").text(count++));
			//add Working hours
			trRef.append($("<td class='text-extra-small text-muted text-center manpower-after-vision-data'>").text(this.afterVisionWorkingHoursArr[i].toFixed(2)));
			//add Manning norms
			trRef.append($("<td class='text-extra-small text-muted text-center manpower-after-vision-data'>").text(data.data()[manningNormHeaderName]));
			//add Opening Time
			trRef.append($("<td class='text-extra-small text-muted text-center manpower-after-vision-data'>").text(this.afterVisionMachineOpeningTimeArr[i].value));
			//add Losses
			trRef.append($("<td class='text-extra-small text-muted text-center manpower-after-vision-data'>").text(this.afterVisionLossesArr[i]));
		});
	};
