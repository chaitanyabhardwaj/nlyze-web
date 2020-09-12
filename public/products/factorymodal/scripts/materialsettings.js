'use strict';

	//Initialize MaterialSettings
	function MaterialSettings(user, referencePeriod) {
		const inst = this;
		this.userRef = user;
		this.currentReferencePeriod = referencePeriod;
		this.db = firebase.firestore();
	};

	MaterialSettings.prototype.getCurrentLossVersion = function() {
		const inst = this;
		return this.db.doc('/users/' + this.userRef.uid + '/products/np002/factoryFileTypes/material/referencePeriod/' + this.currentReferencePeriod).get().then(doc => {
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

	MaterialSettings.prototype.getCurrentReferencePeriodVersion = function() {
		const inst = this;
		return this.db.doc('/users/' + this.userRef.uid + '/products/np002/factoryFileTypes/material/referencePeriod/' + this.currentReferencePeriod).get().then(doc => {
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

	MaterialSettings.prototype.constructLayout = function() {
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

	MaterialSettings.prototype.startDataFetching = function(version) {
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

	MaterialSettings.prototype.calculateData = function() {
		const inst = this;
		//cal all data for each line
		this.calLbsByHash();
		this.calCurrentLbsPercent();
		this.calkUSDByHash();
		this.calCurrentkUSDPercent();
		this.calLbsPotentials();
		this.calkUSDPotentials();
		this.calAfterVisionWasteInLbs();
		this.calAfterVisionWasteInkUSD();
	};

	MaterialSettings.prototype.displayData = function() {
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

	MaterialSettings.prototype.fetchReferencePeriodHeaderData = function(version) {
		const inst = this;
		//store the fetched header data in an array
		this.refPHeaderArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/material/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'ReferencePeriodHeaders').orderBy('id').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.refPHeaderArr[i++] = doc;
			});
		});
	};

	MaterialSettings.prototype.fetchReferencePeriodData = function(version) {
		const inst = this;
		//store the fetched data in an array
		this.refPArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/material/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'ReferencePeriodObj').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.refPArr[i++] = doc;
			});
		});
	};

	MaterialSettings.prototype.fetchLossesHeaderData = function(version) {
		const inst = this;
		//store the fetched header data in an array
		this.lossesHeaderArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/material/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'Headers').orderBy('id').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.lossesHeaderArr[i++] = doc;
			});
		});
	};

	MaterialSettings.prototype.fetchLossesData = function(version) {
		const inst = this;
		//store the fetched data in an array
		this.lossesArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/material/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'FileObj').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.lossesArr[i++] = doc;
			});
		});
	};

	MaterialSettings.prototype.fetchPotentialsPercentData = function(version) {
		const inst = this;
		//store the fetched data in an array
		this.potentialsPercentArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/material/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'PotentialsObj').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.potentialsPercentArr[i++] = doc;
			});
		});
	}

	MaterialSettings.prototype.fetchLineData = function() {
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

	MaterialSettings.prototype.fetchFamilyData = function() {
		const inst = this;
		//store the fetched data in an array
		this.famArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/material/family').get().then(querySnapshot => {
			querySnapshot.forEach(fam => {
				inst.famArr[i++] = fam.data();
			});
		}).catch(err => {
			console.log(err);
		});
	};

	MaterialSettings.prototype.getReferencePeriodDataTotalByLine = function(dataHeaderId) {
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

	MaterialSettings.prototype.getLossesDataTotalByLine = function(dataHeaderId) {
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

	MaterialSettings.prototype.calLbsByHash = function() {
		this.lbsByHashArr = [];
		const lbsHeaderName = this.lossesHeaderArr[5].data().name;
		const hashHeaderName = this.lossesHeaderArr[4].data().name;
		$.each(this.lossesArr, (i, data) => {
			if(data.data()[hashHeaderName] === undefined || data.data()[lbsHeaderName] === undefined)
				this.lbsByHashArr[i] = 0;
			else	
				this.lbsByHashArr[i] = parseFloat(data.data()[lbsHeaderName].replace(/,/g, '')) / parseFloat(data.data()[hashHeaderName].replace(/,/g, ''));
		});
	};

	MaterialSettings.prototype.calCurrentLbsPercent = function() {
		this.currentLbsPercentArr = [];
		const lbsHeaderName = this.lossesHeaderArr[5].data().name;
		const goodProductHeaderName = this.refPHeaderArr[1].data().name;
		const wasteHeaderName = this.refPHeaderArr[2].data().name;
		const lineHeaderName = this.lossesHeaderArr[0].data().name;
		const refLineHeaderName = this.refPHeaderArr[0].data().name;
		var lineName, sum;
		$.each(this.lossesArr, (i, loss) => {
			lineName = loss.data()[lineHeaderName];
			sum = 0;
			$.each(this.refPArr, (j, data) => {
				if(data.data()[refLineHeaderName] === lineName)
					sum += parseFloat(data.data()[goodProductHeaderName].replace(/,/g, '')) + parseFloat(data.data()[wasteHeaderName].replace(/,/g, ''));
			});
			this.currentLbsPercentArr[i] = parseFloat(loss.data()[lbsHeaderName].replace(/,/g, '')) / sum;
			if(sum === 0)
				this.currentLbsPercentArr[i] = 0;
		});
	};

	MaterialSettings.prototype.calkUSDByHash = function() {
		this.kUSDByHashArr = [];
		const kUSDHeaderName = this.lossesHeaderArr[8].data().name;
		const hashHeaderName = this.lossesHeaderArr[4].data().name;
		$.each(this.lossesArr, (i, data) => {
			if(data.data()[kUSDHeaderName] === undefined || data.data()[hashHeaderName] === undefined)
				this.kUSDByHashArr[i] = 0;
			else
				this.kUSDByHashArr[i] = parseFloat(data.data()[kUSDHeaderName].replace(/,/g, '')) / parseFloat(data.data()[hashHeaderName].replace(/,/g, ''));
		});
	};

	MaterialSettings.prototype.calCurrentkUSDPercent = function() {
		this.currentkUSDPercentArr = [];
		const kUSDHeaderName = this.lossesHeaderArr[8].data().name;
		const goodProductHeaderName = this.refPHeaderArr[1].data().name;
		const wasteHeaderName = this.refPHeaderArr[2].data().name;
		const lineHeaderName = this.lossesHeaderArr[0].data().name;
		const refLineHeaderName = this.refPHeaderArr[0].data().name;
		var lineName, sum;
		$.each(this.lossesArr, (i, loss) => {
			lineName = loss.data()[lineHeaderName];
			sum = 0;
			$.each(this.refPArr, (j, data) => {
				if(data.data()[refLineHeaderName] === lineName)
					sum += parseFloat(data.data()[goodProductHeaderName].replace(/,/g, '')) + parseFloat(data.data()[wasteHeaderName].replace(/,/g, ''));
			});
			this.currentkUSDPercentArr[i] = parseFloat(loss.data()[kUSDHeaderName].replace(/,/g, '')) / sum;
			if(sum === 0)
				this.currentkUSDPercentArr[i] = 0;
		});
	};

	MaterialSettings.prototype.calLbsPotentials = function() {
		this.lbsPotentialsArr = [];
		const lbsHeaderName = this.lossesHeaderArr[5].data().name;
		const lineHeaderName = this.lossesHeaderArr[0].data().name;
		for(var i = 0; i < this.potentialsPercentArr.length; i++) {
			for(var j = 0; j < this.lossesArr.length; j++) {
				if(this.lossesArr[j].id === this.potentialsPercentArr[i].id) {
					this.lbsPotentialsArr[i] = {
						line : this.lossesArr[j].data()[lineHeaderName],
						value : parseFloat(this.lossesArr[j].data()[lbsHeaderName].replace(/,/g, '')) * (100 - this.potentialsPercentArr[i].data().value) / 100
					};
					break;
				}
			}
		}
	};

	MaterialSettings.prototype.calkUSDPotentials = function() {
		this.kUSDPotentialsArr = [];
		const kUSDHeaderName = this.lossesHeaderArr[8].data().name;
		const lineHeaderName = this.lossesHeaderArr[0].data().name;
		for(var i = 0; i < this.potentialsPercentArr.length; i++) {
			for(var j = 0; j < this.lossesArr.length; j++) {
				if(this.lossesArr[j].id === this.potentialsPercentArr[i].id) {
					this.kUSDPotentialsArr[i] = {
						line : this.lossesArr[j].data()[lineHeaderName],
						value : parseFloat(this.lossesArr[j].data()[kUSDHeaderName].replace(/,/g, '')) * (100 - this.potentialsPercentArr[i].data().value) / 100
					};
					break;
				}
			}
		}
	};

	MaterialSettings.prototype.calAfterVisionWasteInLbs = function() {
		this.afterVisionWasteLbsArr = [];
		const lossLineHeaderName = this.lossesHeaderArr[0].data().name;
		const lbsHeaderName = this.lossesHeaderArr[5].data().name;
		var sum;
		$.each(this.lineArr, (i, line) => {
			sum = 0;
			$.each(this.lossesArr, (j, loss) => {
				if(loss.data()[lossLineHeaderName] === line)
					sum += parseFloat(loss.data()[lbsHeaderName].replace(/,/g, ''));
			});
			this.afterVisionWasteLbsArr[i] = {
				line : line,
				value : sum
			};
		});
	};

	MaterialSettings.prototype.calAfterVisionWasteInkUSD = function() {
		this.afterVisionWastekUSDArr = [];
		const lossLineHeaderName = this.lossesHeaderArr[0].data().name;
		const kUSDHeaderName = this.lossesHeaderArr[8].data().name;
		var sum;
		$.each(this.lineArr, (i, line) => {
			sum = 0;
			$.each(this.lossesArr, (j, loss) => {
				if(loss.data()[lossLineHeaderName] === line)
					sum += parseFloat(loss.data()[kUSDHeaderName].replace(/,/g, ''));
			});
			this.afterVisionWastekUSDArr[i] = {
				line : line,
				value : sum
			};
		});
	};

	MaterialSettings.prototype.displayLossesHeaders = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers material-losses-header">').appendTo('.fileHeaderAppendTo').text('S No.');
		//display all material losses headers
		$.each(this.lossesHeaderArr, (i, data) => {
			$('<th class="text-small text-low text-center table-headers material-losses-header">').appendTo('.fileHeaderAppendTo').text(data.data().displayName);
		});
	};

	MaterialSettings.prototype.displayReferencePeriodHeaders = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers material-reference-header">').appendTo('.referencePeriodHeaderAppendTo').text('S No.');
		//display all material losses headers
		$.each(this.refPHeaderArr, (i, data) => {
			$('<th class="text-small text-low text-center table-headers material-reference-header">').appendTo('.referencePeriodHeaderAppendTo').text(data.data().displayName);
		});
	};

	MaterialSettings.prototype.displayLossesData = function() {
		var trRef, count = 1;
		$.each(this.lossesArr, (i, data) => {
			trRef = $("<tr class='table-data material-losses-data-row' data-row-id='" + data.id + "'>").appendTo(".fileAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center material-losses-data'>").text(count++));
			$.each(this.lossesHeaderArr, (j, header) => {
				if(j === 6) { // id of lbs/#
					trRef.append($("<td class='text-extra-small text-muted text-center material-losses-data'>").text(this.lbsByHashArr[i].toFixed(2)));	
				}
				else if(j === 7) { // id of lbs%
					trRef.append($("<td class='text-extra-small text-muted text-center material-losses-data'>").text(this.currentLbsPercentArr[i].toFixed(2)));	
				}
				else if(j === 9) {// id of kUSD/#
					trRef.append($("<td class='text-extra-small text-muted text-center material-losses-data'>").text(this.kUSDByHashArr[i].toFixed(2)));	
				}
				else if(j === 10) { // id of kUSD%
					trRef.append($("<td class='text-extra-small text-muted text-center material-losses-data'>").text(this.currentkUSDPercentArr[i].toFixed(2)));		
				}
				else {
					trRef.append($("<td class='text-extra-small text-muted text-center material-losses-data'>").text(data.data()[header.data().name]));
				}
			});
		});
	};

	MaterialSettings.prototype.displayReferencePeriodData = function() {
		var trRef, count = 1;
		$.each(this.refPArr, (i, data) => {
			trRef = $("<tr class='table-data material-reference-data-row' data-row-id='" + data.id + "'>").appendTo(".referencePeriodAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center material-reference-data'>").text(count++));
			$.each(this.refPHeaderArr, (j, header) => {
				trRef.append($("<td class='text-extra-small text-muted text-center material-reference-data'>").text(data.data()[header.data().name]));
			});
		});
	};

	MaterialSettings.prototype.displayPotentialsHeader = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers material-potentials-header">').appendTo('.targetsHeaderAppendTo').text('S No.');
		$('<th class="text-small text-low text-center table-headers material-potentials-header">').appendTo('.targetsHeaderAppendTo').text('%');
		$.each(this.lossesHeaderArr, (i, data) => {
			if(data.data().toPotentials && data.data().toPotentialsType === 'Inputted')
				$('<th class="text-small text-low text-center table-headers material-potentials-header">').appendTo('.targetsHeaderAppendTo').text(data.data().displayName);
		});
		$('<th class="text-small text-low text-center table-headers material-potentials-header">').appendTo('.targetsHeaderAppendTo').text('-');
		$('<th class="text-small text-low text-center table-headers material-potentials-header">').appendTo('.targetsHeaderAppendTo').text('-');
	};

	MaterialSettings.prototype.displayPotentialsData = function() {
		var trRef, count = 1, flag;
		$.each(this.lossesArr, (i, data) => {
			flag = 1;
			trRef = $("<tr class='table-data material-potentials-data-row' data-row-id='" + data.id + "'>").appendTo(".targetsAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center material-potentials-data'>").text(count++));
			for(var j = 0; j < this.potentialsPercentArr.length; j++) {
				if(data.id === this.potentialsPercentArr[j].id) {
					//add % value
					trRef.append($("<td class='text-extra-small text-muted text-center material-potentials-data'>").text(this.potentialsPercentArr[j].data().value));
					//add potentials lbs
					trRef.append($("<td class='text-extra-small text-muted text-center material-potentials-data'>").text(this.lbsPotentialsArr[j].value.toFixed(2)));
					//add potentials kUSD
					trRef.append($("<td class='text-extra-small text-muted text-center material-potentials-data'>").text(this.kUSDPotentialsArr[j].value.toFixed(2)));
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
				//add blank potentials lbs
				trRef.append($("<td class='text-extra-small text-muted text-center material-potentials-data'>").text('-'));
				//add blank potentials kUSD
				trRef.append($("<td class='text-extra-small text-muted text-center material-potentials-data'>").text('-'));
				//add edit icon
				trRef.append($("<td class='text-center py-1-5'>").html("<i class='fa fa-pencil-square target-edit-button' style='color: #c3cffd;' data-row-id='" + data.id + "'></i>"));
				//add delete icon
				trRef.append($("<td class='text-center py-1-5'>").html("<i class='fa fa-trash text-low target-delete-button' data-row-id='" + data.id + "'></i>"));
			}
		});
	};

	MaterialSettings.prototype.displayAfterVisionHeader = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers material-after-vision-header">').appendTo('.afterVisionHeaderAppendTo').text('S No.');
		$.each(this.refPHeaderArr, (i, data) => {
			if(data.data().toAfterVision)
				$('<th class="text-small text-low text-center table-headers material-after-vision-header">').appendTo('.afterVisionHeaderAppendTo').text(data.data().displayName);
		});	
	};

	MaterialSettings.prototype.displayAfterVisionData = function() {
		var trRef, count = 1, flag;
		const lineHeaderName = this.refPHeaderArr[0].data().name;
		const goodProductHeaderNameLbs = this.refPHeaderArr[1].data().name;
		const goodProductHeaderNamekUSD = this.refPHeaderArr[3].data().name;
		$.each(this.refPArr, (i, data) => {
			trRef = $("<tr class='table-data material-after-vision-data-row' data-row-id='" + data.id + "'>").appendTo(".afterVisionAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center material-after-vision-data'>").text(count++));
			//add Good production in lbs
			trRef.append($("<td class='text-extra-small text-muted text-center material-after-vision-data'>").text(data.data()[goodProductHeaderNameLbs]));
			//add Waste in lbs
			flag = 1;
			$.each(this.afterVisionWasteLbsArr, (j , wasteLbs) => {
				if(wasteLbs.line === data.data()[lineHeaderName]) {
					trRef.append($("<td class='text-extra-small text-muted text-center material-after-vision-data'>").text(wasteLbs.value.toFixed(2)));
					flag = 0;
				}
			});
			if(flag)
				trRef.append($("<td class='text-extra-small text-muted text-center material-after-vision-data'>").text('-'));
			//add Good production in kUSD
			trRef.append($("<td class='text-extra-small text-muted text-center material-after-vision-data'>").text(data.data()[goodProductHeaderNamekUSD]));
			//add Waste in lbs
			flag = 1;
			$.each(this.afterVisionWastekUSDArr, (j , wastekUSD) => {
				if(wastekUSD.line === data.data()[lineHeaderName]) {
					trRef.append($("<td class='text-extra-small text-muted text-center material-after-vision-data'>").text(wastekUSD.value.toFixed(2)));
					flag = 0;
				}
			});
			if(flag)
				trRef.append($("<td class='text-extra-small text-muted text-center material-after-vision-data'>").text('-'));
		});
	};
