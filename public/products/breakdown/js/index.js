let button1 = document.querySelector('#btn-1');
let button2 = document.querySelector('#btn-2');
let button3 = document.querySelector('#btn-3');
let button4 = document.querySelector('#btn-4');

//Button listener

var dataSet = []
var eids = []
var comments = []
var lines = []

function fillShiftTimes(singleRow) {
  $("#shift-1").val(Number(singleRow.shiftTimes[0]));
  $("#shift-2").val(Number(singleRow.shiftTimes[1]));
  $("#shift-3").val(Number(singleRow.shiftTimes[2]));
}



function recordUpdater(matchedData) {

  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('shiftTimes');
  var query = collectionReference.where("date", "==", matchedData['date']);

  query.get().then(function(results) {
    if (results.empty) {
      addRecord(matchedData);
      console.log("No documents found!");
    } else {


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
    console.log("Error getting documents:", error);
  });
  console.log(query);
}


function addRecord(matchedData) {
  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('shiftTimes');
  collectionReference.doc().set(Object.assign({}, matchedData))
}



function enableButton(buttonName) {
  document.getElementById(buttonName).disabled = false;
}

function disableButton(buttonName) {
  document.getElementById(buttonName).disabled = true;
}


function removeModalL(modalType) {
  eids.push($("#IDL").val());
  document.getElementById("detailFormL").reset();
  console.log(eids, comments);
  $('.md-modal').removeClass('md-show');
}

function removeModalF(modalType) {
  eids.push($("#ID").val());
  comments.push($("#Email").val());
  document.getElementById("detailForm").reset();
  console.log(eids, comments);
  if (eids.length > 3) {
    storeData();
  }
  $('.md-modal').removeClass('md-show');
}
function storeLine(lineName) {
  sessionStorage.setItem("line", lineName);
  window.location = "./breakdown.html";
  console.log(sessionStorage.getItem('line'));
}

function show(id) {
      var d = new Date();
      h = (d.getHours()<10?'0':'') + d.getHours(),
      m = (d.getMinutes()<10?'0':'') + d.getMinutes();
      document.getElementById(id).innerHTML =  h + ':' + m;
}


function storeData() {
  var db = firebase.firestore();

  db.collection("nakulUser").doc('First').collection('rawData').add({
      line: sessionStorage.getItem('line'),
      DTS: new Date(sessionStorage.getItem('first')),
      RS: new Date(sessionStorage.getItem('second')),
      RE: new Date(sessionStorage.getItem('third')),
      DTE: new Date(sessionStorage.getItem('fourth')),
      Eids: eids,
      Comments: comments
  }).then(function(docRef) {
    console.log("Document written with ID: ", docRef.id);
    window.location.reload();
  })
  .catch(function(error) {
    console.error("Error adding document: ", error);
  });

}


function singleData(date, shiftTimes) {
  this.date = date,
  this.line = sessionStorage.getItem('line'),
  this.shiftTimes = shiftTimes
}




function getData() {

  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('shiftTimes');
  var d = (new Date());
  d.setHours(0,0,0,0);


  var query = collectionReference.where("date", "==", d);

  query.get().then(function(querySnapshot) {
    var data = querySnapshot.docs.map(function(documentSnapshot) {
      dataSet.push(new singleData(documentSnapshot.data()['date'], documentSnapshot.data()['shiftTimes']));
    })
  }).then(function() {
    fillShiftTimes(dataSet[0]);
  })  .catch(function(error) {
      dataSet.push(new singleData(d, [8,8,8]));
      recordUpdater(dataSet[0]);
      getData();

    });
};



[...document.querySelectorAll('.breakdown')].forEach(function(item) {
  item.addEventListener('click', function() {
    sessionStorage.setItem(item.name, new Date());
    console.log(item.name, new Date());

  });
});



var back = [
  "B24C63",
  "5438DC",
  "357DED",
  "56EEF4",
  "32E875",
];


$('input.shift').change(function() {
  dataSet[0].shiftTimes[0] = Number($( "#shift-1" ).val());
  dataSet[0].shiftTimes[1] = Number($( "#shift-2" ).val());
  dataSet[0].shiftTimes[2] = Number($( "#shift-3" ).val());

  recordUpdater(dataSet[0]);
});

jQuery(document).ready(function(e) {
    jQuery('#mymodal').trigger('click');
});
