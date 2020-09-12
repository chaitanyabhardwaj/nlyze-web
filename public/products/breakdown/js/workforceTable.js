var dataSet = [];

function addWorkerRow(singleRow) {
  var table = document.getElementById("dataTable");
  var row = table.insertRow(table.rows.length);

  Object.keys(singleRow).forEach(function(key, index) {

    if (key == 'TYPE') {
      var cell = row.insertCell(index);
      cell.className = 'TYPE';
      cell.innerHTML = singleRow[key];

      cell.addEventListener("focusout", function() {
        recordGetter(this);
      });
    } else if (key == 'AVAILABLE') {
      var cell = row.insertCell(index);
      cell.className = 'AVAILABLE';
      cell.innerHTML = singleRow[key];
      cell.addEventListener("focusout", function() {
        recordGetter(this);
      });
    } else {
      var cell = row.insertCell(index);
      cell.innerHTML = singleRow[key];
      cell.contentEditable = true;
      cell.tabindex = "0";
      cell.addEventListener("focusout", function() {
        console.log(this);
        recordGetter(this);
      });
    }

  });
}

function addNewRow() {
  var table = document.getElementById("dataTable");
  var row = table.insertRow(table.rows.length);

  for (var i = 0; i < 6; i++) {
    var cell = row.insertCell(i);
    cell.innerHTML = "";
    cell.contentEditable = true;
    cell.tabindex = "0";
    cell.addEventListener("focusout", function() {
      recordGetter(this);
    });
  }
}

function singleData(ID, NAME, TYPE, PHONE, EMAIL, AVAILABLE) {
  this.ID = ID,
  this.NAME = NAME,
  this.TYPE = TYPE,
  this.PHONE = PHONE,
  this.EMAIL = EMAIL,
  this.AVAILABLE = AVAILABLE
}

function getData() {

  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('workforce');

  collectionReference.get().then(function(querySnapshot) {
    var data = querySnapshot.docs.map(function(documentSnapshot) {
      dataSet.push(new singleData(documentSnapshot.data()['ID'], documentSnapshot.data()['Name'], documentSnapshot.data()['Type'], documentSnapshot.data()['Phone'], documentSnapshot.data()['Email'], documentSnapshot.data()['Available']));
    })
    //    grapher(dataAggregator(group_by_year(dataSet)));
  }).then(function(response) {
    dataSet.sort(propComparator('Name'));
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
    addWorkerRow(data[d]);
  }
}

function recordGetter(cell) {
  var $row = $(cell).closest("tr"), // Finds the closest row <tr>
    $ID = $row.find("td:nth-child(1)");
  $NAME = $row.find("td:nth-child(2)");
  $TYPE = $row.find("td:nth-child(3)");
  $PHONE= $row.find("td:nth-child(4)");
  $EMAIL = $row.find("td:nth-child(5)");
  $AVAILABLE = $row.find("td:nth-child(6)");

  var matchedData = $.grep(dataSet, function(e) {
    return e.ID == $ID.text();
  });

  matchedData = {
    "ID": $ID.text(),
    "Name": $NAME.text(),
    "Type": $TYPE.text(),
    "Email": $EMAIL.text(),
    "Phone": $PHONE.text(),
    "Available": $AVAILABLE.text()=='true'
  };

  console.log(matchedData);
  recordSetter(matchedData);
  //  getRecord(queryDate);

  //  var result = $.grep(dataSet, function(e){ return e. == id; });
}

function recordSetter(matchedData) {
  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('workforce');
  var query = collectionReference.where("ID", "==", matchedData['ID']);

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
  var collectionReference = db.collection('nakulUser').doc('First').collection('workforce');
  collectionReference.doc().set(Object.assign({}, matchedData))
}

$("#dataTable").on("click", ".TYPE", function() {
  var $this = $(this),
    current = $this.text(),
    select;
  if ($this.find("select").length) {
    return;
  }
  select = $('<select>' + '<option>Admin</option>' + '<option>Operator</option>' + '<option>Mechanic</option>' + '</select>');
  $this.html(select);
  select.val(current).focus();
});

$("#dataTable").on("blur", ".TYPE select", function() {
  var $this = $(this);
  $this.closest('td').text($this.val());
});

$("#dataTable").on("blur", ".TYPE", function() {
  recordGetter(this);
});

$("#dataTable").on("click", ".AVAILABLE", function() {
  var $this = $(this),
    current = $this.text(),
    select;
  if ($this.find("select").length) {
    return;
  }
  select = $('<select>' + '<option>true</option>'  + '<option>false</option>' + '</select>');
  $this.html(select);
  select.val(current).focus();
});

$("#dataTable").on("blur", ".AVAILABLE select", function() {
  var $this = $(this);
  $this.closest('td').text($this.val());
});

$("#dataTable").on("blur", ".AVAILABLE", function() {
  recordGetter(this);
});
