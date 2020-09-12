var dataSet = [];

function addRow(singleRow) {
  // Insert a row in the table at the last row

  var table = document.getElementById("dataTable");

  // Create an empty <tr> element and add it to the 1st position of the table:
  var row = table.insertRow(table.rows.length);

  // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:

  Object.keys(singleRow).forEach(function(key, index) {
    if (key == 'date') {
      var cell = row.insertCell(index);
      cell.innerHTML = singleRow[key].toLocaleString();
      cell.contentEditable = true;
      cell.addEventListener("click", function() {
        rowUpdater(this);
      });
    } else {
      var cell = row.insertCell(index);
      cell.innerHTML = singleRow[key];
      cell.contentEditable = true;
      cell.addEventListener("click", function() {
        rowUpdater(this);
      });
    }
  });
}

function addShiftTimeRow(singleRow) {
  var table = document.getElementById("dataTable");
  var row = table.insertRow(table.rows.length);

  Object.keys(singleRow).forEach(function(key, index) {
        var cell = row.insertCell(index);
        cell.innerHTML = singleRow[key];
        cell.contentEditable = true;
        cell.tabindex="0";
        cell.addEventListener("focusout", function() {
          recordGetter(this);
        });

  });
}

function addNewRow() {
  var table = document.getElementById("dataTable");
  var row = table.insertRow(table.rows.length);

  for(var i = 0; i < 6; i++) {
    var cell = row.insertCell(i);
    cell.innerHTML = "";
    cell.contentEditable = true;
    cell.tabindex="0";
    cell.addEventListener("focusout", function() {
      recordGetter(this);
    });
  }
}



function singleData(date, line, shiftOne, shiftTwo, shiftThree) {
  this.date = date,
  this.line = line,
  this.shiftOne = shiftOne,
  this.shiftTwo = shiftTwo,
  this.shiftThree = shiftThree
}

function getData() {

  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('shiftTimes');

  collectionReference.get().then(function(querySnapshot) {
    var data = querySnapshot.docs.map(function(documentSnapshot) {
      dataSet.push(new singleData(documentSnapshot.data()['date'], documentSnapshot.data()['line'], documentSnapshot.data()['shiftTimes'][0], documentSnapshot.data()['shiftTimes'][1],documentSnapshot.data()['shiftTimes'][2]));
    })
    //    grapher(dataAggregator(group_by_year(dataSet)));
  }).then(function(response) {
    fillTable(dataSet)
  })

};

//comparator that functions based on prop
function propComparator(prop) {
  return function(a, b) {
    if (a[prop] < b[prop])
      return -1;
    if (a[prop] > b[prop])
      return 1;
    return 0;
  }
}

function fillTable(data) {
  for (var d in data) {
    addShiftTimeRow(data[d]);
  }
}

function recordGetter(cell) {
  var $row = $(cell).closest("tr"), // Finds the closest row <tr>
      $date = $row.find("td:nth-child(1)");
      $line = $row.find("td:nth-child(2)");
      $shift1 = $row.find("td:nth-child(3)");
      $shift2 = $row.find("td:nth-child(4)");
      $shift3 = $row.find("td:nth-child(5)");

  var matchedData = $.grep(dataSet, function(e) {
    return e.date == $date.text();
  });

  matchedData = {
    "date": new Date($date.text()),
    "line": $line.text(),
    "shiftTimes": [Number($shift1.text()),Number($shift2.text()),Number($shift3.text())]
  };


  console.log(matchedData);
  recordSetter(matchedData);
//  getRecord(queryDate);

  //  var result = $.grep(dataSet, function(e){ return e. == id; });
}

function recordSetter(matchedData) {
  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('shiftTimes');
  var query = collectionReference.where("date", "==", matchedData['date']);

  query.get().then(function(results) {
    if (results.empty) {
      addRecord(matchedData);
      console.log("No documents found!");
    } else {

      console.log(results.docs[0].id);

      collectionReference.doc(results.docs[0].id).update(Object.assign({}, matchedData))



/*      collectionReference.doc(results.docs[0].id).update({
        ID: matchedData.ID,
        Name: matchedData.NAME,
        Type: matchedData.TYPE,
        Email: matchedData.EMAIL,
        Phone: matchedData.PHONE,
        Available: matchedData.AVAILABLE
      }); */
    }
  }).catch(function(error) {
    addRecord(matchedData);
    console.log("Error getting documents:", error);
  });
  console.log(query);
}


function addRecord(matchedData) {
  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('shiftTimes');
  collectionReference.doc().set(Object.assign({}, matchedData))
}




function updateInDataSet(Line, Dts, Dte, Rs, Re) {
  var matchedData = dataSet.find(function(p) {
    return p.dts === dts;
  });

  if (matchedData && matchedData[prop]) {
    person[prop] = val;
  }
}
