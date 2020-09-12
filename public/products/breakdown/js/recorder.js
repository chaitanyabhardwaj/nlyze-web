var lines = [];
var list = document.getElementById("app");
var $buttons = $('#app');

function getLines() {
  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('layout');


  collectionReference.get().then(function(results) {

    results.forEach(function(doc) {
      lines.push(doc.data()['line']);
    });

  }).then((result) => {
    for (i = 0; i < lines.length; i++) {
      console.log(lines[i]);
      addItem(lines[i]);
    }
  })
}




function addItem(lineName) {
   var item = document.createElement("button"); // Main Element
   item.className = "item";
   item.innerHTML = lineName;
   list.appendChild(item);
}


$buttons.on('click', '.item', handleClick);




function addItem2(container, template, val) {
  let color = "#" + back[1];

  container.append(Mustache.render(template, {color, val}));

}


function render() {
  const tmpl = $('#item_template').html();
  const container = $('#app');

  for (let i = 0; i < lines.length; i++) {
    addItem(container, tmpl, lines[i]);
  }
}


function handleClick() {
  sessionStorage.setItem('line', this.innerHTML);
  window.location = "./breakdown.html";
  console.log(this.innerHTML);
}


var back = ["#B24C63", "5438DC", "357DED", "56EEF4", "32E875"];
