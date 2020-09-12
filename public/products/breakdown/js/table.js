var dataSet = [];

function addRow(singleRow) {
  // Insert a row in the table at the last row

  var table = document.getElementById("dataTable");

  // Create an empty <tr> element and add it to the 1st position of the table:
  var row = table.insertRow(table.rows.length);

  // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:

  Object.keys(singleRow).forEach(function(key, index) {
    if (index < 11) {
      if (index != 0) {
        var cell = row.insertCell(index);
        cell.innerHTML = singleRow[key].toLocaleString();
        cell.contentEditable = true;
        cell.addEventListener("click", function() {
      //    rowUpdater(this);
        });
      } else {
        var cell = row.insertCell(index);
        cell.innerHTML = singleRow[key];
        cell.contentEditable = true;
        cell.addEventListener("click", function() {
      //    rowUpdater(this);
        });
      }
    }
  });
}

function singleData(DTS, RS, RE, DTE, LINE, eids=[" "," "," "," "], comments=[" "," "]) {
  this.LINE = LINE,
  this.DTS = DTS,
  this.RS = RS,
  this.RE = RE,
  this.DTE = DTE,
  this.eidOne = eids[0],
  this.eidTwo = eids[1],
  this.eidThree = eids[2],
  this.eidFour = eids[3],
  this.commentOne = comments[0],
  this.commentTwo = comments[1],
  this.MTTR = function() {
    return ((this.RS - this.RE) / 6000 / 60);
  }
  this.MDTR = function() {
    return ((this.DTS - this.DTE) / 6000 / 60);
  }
  this.MTBF = function() {}
}

function getData() {

  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('rawData');

  collectionReference.get().then(function(querySnapshot) {
    var data = querySnapshot.docs.map(function(documentSnapshot) {
      dataSet.push(new singleData(documentSnapshot.data()['DTS'], documentSnapshot.data()['RS'], documentSnapshot.data()['RE'], documentSnapshot.data()['DTE'], documentSnapshot.data()['line'], documentSnapshot.data()['Eids'], documentSnapshot.data()['Comments']));
    })
    //    grapher(dataAggregator(group_by_year(dataSet)));
  }).then(function(response) {
    dataSet.sort(propComparator('DTS'));
  }).then(function(response) {
    console.log(dataSet);
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
    addRow(data[d]);
  }
}

function rowUpdater(cell) {
  var updatedData = new singleData();
  var $row = $(cell).closest("tr"), // Finds the closest row <tr>
    $LINE = $row.find("td:nth-child(1)");
  $DTS = $row.find("td:nth-child(2)");
  $DTE = $row.find("td:nth-child(3)");
  $RS = $row.find("td:nth-child(4)");
  $RE = $row.find("td:nth-child(5)");

  var queryDate = new Date($DTS.text());
  var matchedData = $.grep(dataSet, function(e) {
    return e.DTS == queryDate.toString();
  });

  getRecord(queryDate);

  //  var result = $.grep(dataSet, function(e){ return e. == id; });
}

function getRecord(Dts) {
  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('rawData');
  console.log(date);
  var query = collectionReference.where("line", "==", date);
  console.log(Dts);

  query.get().then(function(results) {
    if (results.empty) {
      console.log("No documents found!");
    } else {
      // go through all results
      results.forEach(function(doc) {
        console.log("Document data:", doc.data());
      });
      // or if you only want the first result you can also do something like this:
      console.log("Document data:", results.docs[0].data());
    }
  }).catch(function(error) {
    console.log("Error getting documents:", error);
  });
  console.log(query);
}



function updateInDataSet(Line, Dts, Dte, Rs, Re) {
  var matchedData = dataSet.find(function(p) {
    return p.dts === dts;
  });

  if (matchedData && matchedData[prop]) {
    person[prop] = val;
  }
}
