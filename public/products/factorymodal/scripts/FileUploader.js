
'use strict';

//Initialize FileUploader
function FileUploader(requestCode, callingObj, jsonStruct) {
	const inst = this;
	this.callingObject = callingObj;
	this.jsonStruct = jsonStruct;
	this.requestCode = requestCode;
	//shortcut to dom elements
	this.fileUpload = $('#file-upload');
	this.fileDrop = $('.dropzone');
	//attach event listeners
	//attach event listener for multiple files upload
	this.fileUpload.change(function(event) {
		inst.handleMultipleFilesUpload(event);
	});
	//attach event listener drag 'n' drop
	this.fileDrop.on('dragover', function(event) {
		inst.handleDragOver(event);
	});
  	this.fileDrop.on('drop', function(event) {
  		inst.handleDrop(event);
  	});
};

FileUploader.prototype.handleMultipleFilesUpload = function(event) {
	const inst = this;
	const files = event.target.files; //FileList Object
	var rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer
	for(var i = 0, f; f = files[i]; i++) {
		if(!this.containsMIME(f, ['application/json', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'])) {
			displayDialog('File type not valid', 'danger');
			continue;
		}
		const metaData = {
			name : f.name,
			size : f.size,
			type : f.type
		};
		var fileReader = new FileReader();
		fileReader.onload = function(e) {
			inst.fileData = e.target.result; //gets file data
			const fileObject = {
				meta : metaData,
				content : inst.csv_to_json(rABS, inst.jsonStruct)
			}
			inst.callingObject.passFileData(inst.requestCode,fileObject);
		}
		//read file
		fileReader.readAsBinaryString(f);
	}
};

FileUploader.prototype.handleDragOver = function(event) {
	event.stopPropagation();
	event.preventDefault();
	event.originalEvent.dataTransfer.dropEffect = 'copy';
};

FileUploader.prototype.handleDrop = function(event) {
	event.stopPropagation();
	event.preventDefault();
	const inst = this;
	const files = event.originalEvent.dataTransfer.files; //FileList Object
	if(files.length > 1) {
		displayDialog('Only one file upload allowed at a time', 'warning');
		return;
	}
	var rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer
	for(var i = 0, f; f = files[i]; i++) {
		if(!this.containsMIME(f, ['application/json', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'])) {
			displayDialog('File type not valid', 'danger');
			continue;
		}
		const metaData = {
			name : f.name,
			size : f.size,
			type : f.type
		};
		var fileReader = new FileReader();
		fileReader.onload = function(e) {
			inst.fileData = e.target.result; //gets file data
			const fileObject = {
				meta : metaData,
				content : inst.csv_to_json(rABS, inst.jsonStruct)
			}
			inst.callingObject.passFileData(inst.requestCode,fileObject);
		}
		//read file
		fileReader.readAsBinaryString(f);
	}
};

FileUploader.prototype.containsMIME = function(fileRef, mimeTypes) {
	for(var i = 0; i < mimeTypes.length; i++) {
		if(fileRef.type.match(mimeTypes[i]))
			return true;
	}
	return false;
};

FileUploader.prototype.csv_to_json = function(rABS, jsonStruct) {
	const inst = this;
	if(!rABS) data = new Uint8Array(data);
    this.workbook = XLSX.read(this.fileData, {type: rABS ? 'binary' : 'array'});
	var result = {};
    //convert workbook to JSON
	this.workbook.SheetNames.forEach(function(sheetName) {
		const h = inst.headersToLowerCase(sheetName);
		var roa;
		if(inst.jsonStruct === 2)
			roa = XLSX.utils.sheet_to_json(inst.workbook.Sheets[sheetName], {header: h, range : 1}); // header : 2 - JSON(key/value pair)
		else
			roa = XLSX.utils.sheet_to_json(inst.workbook.Sheets[sheetName], {header: inst.jsonStruct}); // header : 2 - JSON(key/value pair)
		if(roa.length) result[sheetName] = roa;
	});
	return result;
};



FileUploader.prototype.headersToLowerCase = function(sheetName) {
	const range = XLSX.utils.decode_range(this.workbook.Sheets[sheetName]['!ref']);
	const headers = [];
	for(var C = range.s.c; C <= range.e.c; ++C) {
    	var addr = XLSX.utils.encode_cell({r:range.s.r, c:C});
    	var cell = this.workbook.Sheets[sheetName][addr];
    	if(!cell) continue;
    	headers.push((cell.v).toLowerCase().trim());
	}
	return headers;
};

FileUploader.prototype.dropTo = function(dropzone) {
	this.fileDrop = $(dropzone);
};











