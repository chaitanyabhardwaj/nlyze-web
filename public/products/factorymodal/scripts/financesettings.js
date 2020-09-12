'use strict';

	//Initialize FinanceSettings
	function FinanceSettings(user, referencePeriod) {
		const inst = this;
		this.userRef = user;
		this.currentReferencePeriod = referencePeriod;
		this.db = firebase.firestore();
	};

	FinanceSettings.prototype.getCurrentLossVersion = function() {
		const inst = this;
		return this.db.doc('/users/' + this.userRef.uid + '/products/np002/factoryFileTypes/finance/referencePeriod/' + this.currentReferencePeriod).get().then(doc => {
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

	FinanceSettings.prototype.constructLayout = function() {
		const inst = this;
		//get the current version from which to fetch the data
		const lossVersion = this.getCurrentLossVersion();
		return lossVersion.then(lv => {
			if(lv !== null) {
				var fetchData;
				if(lv === 0) {
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
				displayDialog('Losses Table data is missing! Please upload the Losses data.');
			}
		}).catch(err => {
			console.log(err);
		});
		//start fetching and calculating data
	};

	FinanceSettings.prototype.startDataFetching = function(version) {
		//fetch all data
		const lossesHeaderData = this.fetchLossesHeaderData(version);
		const lossesData = this.fetchLossesData(version);
		const lineData = this.fetchLineData();
		return (lossesHeaderData && lossesData && lineData);
	};

	FinanceSettings.prototype.calculateData = function() {
		//cal all data for each line
	};

	FinanceSettings.prototype.displayData = function() {
		//display all data
		//display warning or danger if important data is missing
		this.displayLossesHeaders();
		this.displayLossesData();
	};

	FinanceSettings.prototype.fetchLossesHeaderData = function(version) {
		const inst = this;
		//store the fetched header data in an array
		this.lossesHeaderArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/finance/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'Headers').orderBy('id').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.lossesHeaderArr[i++] = doc;
			});
		});
	};

	FinanceSettings.prototype.fetchLossesData = function(version) {
		const inst = this;
		//store the fetched data in an array
		this.lossesArr = [];
		var i = 0;
		return this.db.collection('users/' + this.userRef.uid + '/products/np002/factoryFileTypes/finance/referencePeriod/' + this.currentReferencePeriod + '/' + version + 'FileObj').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				inst.lossesArr[i++] = doc;
			});
		});
	};

	FinanceSettings.prototype.fetchLineData = function() {
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
	};

	FinanceSettings.prototype.displayLossesHeaders = function() {
		//Append "S no." as first header
		$('<th class="text-small text-low text-center table-headers finance-losses-header">').appendTo('.fileHeaderAppendTo').text('S No.');
		//display all finance losses headers
		$.each(this.lossesHeaderArr, (i, data) => {
			$('<th class="text-small text-low text-center table-headers finance-losses-header">').appendTo('.fileHeaderAppendTo').text(data.data().displayName);
		});
	};

	FinanceSettings.prototype.displayLossesData = function() {
		var trRef, count = 1;
		$.each(this.lossesArr, (i, data) => {
			trRef = $("<tr class='table-data finance-losses-data-row' data-row-id='" + data.id + "'>").appendTo(".fileAppendTo");
			//add S no.
			trRef.append($("<td class='text-extra-small text-muted text-center finance-losses-data'>").text(count++));
			$.each(this.lossesHeaderArr, (j, header) => {
				trRef.append($("<td class='text-extra-small text-muted text-center finance-losses-data'>").text(data.data()[header.data().name]));
			});
		});
	};
