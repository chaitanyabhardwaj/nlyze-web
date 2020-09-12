var dataSet = []
var mtbfData = []

var totalData = []
var labels = []

var yearSet = []
var MTTRData = []

//data Object

function singleData(DTS, RS, RE, DTE, LINE) {
  this.DTS = DTS,
  this.RS = RS,
  this.RE = RE,
  this.DTE = DTE,
  this.LINE = LINE,
  this.MTTR = function() {
    return ((this.RS - this.RE) / 6000 / 60);
  }
  this.MDTR = function() {
    return ((this.DTS - this.DTE) / 6000 / 60);
  }
  this.MTBF = function() {

  }
}

function mtbfSingle(date, line, shiftOne, shiftTwo, shiftThree) {
  this.date = date,
  this.line = line,
  this.shiftOne = shiftOne,
  this.shiftTwo = shiftTwo,
  this.shiftThree = shiftThree

  this.totalFailure = function() {
    return (this.shiftOne + this.shiftTwo + this.shiftThree);
  }
}

//Chart

var ctx = document.getElementById("myChart");


var myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: [
      'MTTR', 'MDT', 'MTBF'
    ],
    datasets: totalData
  },
  options: {
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
            padding: 0
          }
        }
      ]
    },
    layout: {
       padding: {
           bottom: 0
       }
   },
    onClick: function(evt) {
      var element = myChart.getElementAtEvent(evt);
      if (element.length > 0) {
        //  console.log(myChart.getElementAtEvent(evt));
      }
    },
    responsive: true
  }
});

// Data getter from firestore

// Main dataPipeline

function dataAggregator(totalTimePeriodData) {
  var localTotal = [];


  for (var period in totalTimePeriodData) {
    var periodData = totalTimePeriodData[period]; //array of data for that month
    var periodNum = period;
    var graphData = [];

    for (var entry in periodData) {
      var entryData = periodData[entry];
      if (entryData instanceof singleData) {
        graphData[0] = (graphData[0] || 0) + entryData.MTTR();
        graphData[1] = (graphData[1] || 0) + entryData.MDTR();
      }
    }


    graphData[0] = Math.round(graphData[0] / periodData.length * 100) / 100;
    graphData[1] = Math.round(graphData[1] / periodData.length * 100) / 100;


    if (!document.getElementById("Weekly").checked && document.getElementById("year-menu").value != "AllYear") {
      var months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sept',
        'Oct',
        'Nov',
        'Dec'
      ];
      periodNum = months[periodNum];
    }

    var randColor = back[Math.floor(Math.random() * back.length)];

    if (periodNum) {
      localTotal.push({
        label: periodNum,
        data: graphData,
        backgroundColor: "#" + randColor
      })
    }

  }

  return localTotal;
  //myChart.destroy();
};

function getData() {

  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('rawData');


  collectionReference.get().then(function(querySnapshot) {
    var data = querySnapshot.docs.map(function(documentSnapshot) {
      dataSet.push(new singleData(documentSnapshot.data()['DTS'], documentSnapshot.data()['RS'], documentSnapshot.data()['RE'], documentSnapshot.data()['DTE'], documentSnapshot.data()['line']));
    })
    //    grapher(dataAggregator(group_by_year(dataSet)));
  }).then(function(response) {
    getShiftTimeData();
    return group_by_year(dataSet)
  }).then(function(response) {
    return dataAggregator(response)
  }).then(function(response) {
    myChart.data.datasets = response;
  }).then(function(response) {
    myChart.update();
  })
};

function getShiftTimeData() {

  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('shiftTimes');

  collectionReference.get().then(function(querySnapshot) {
    var data = querySnapshot.docs.map(function(documentSnapshot) {
      mtbfData.push(new mtbfSingle(documentSnapshot.data()['date'], documentSnapshot.data()['line'], documentSnapshot.data()['shiftTimes'][0], documentSnapshot.data()['shiftTimes'][1],documentSnapshot.data()['shiftTimes'][2]));
    })
    //    grapher(dataAggregator(group_by_year(dataSet)));
  }).then(function(response) {
    charter2();
  })
};

// Promise function for data grouping

const charter = function() {
  grouper(dataSet).then((result) => {
    return (dataAggregator(result))
  }).then((result) => {
    myChart.data.datasets = result;
  }).then((result) => {
    myChart.update();
  })
}

const charter2 = function() {
  MTBFGrouper(mtbfData).then((result) => {
    console.log(result);
  })
}

//Grouping Functions

function grouper(dataSet) {
  return new Promise(function(resolve, reject) {
    if(document.getElementById("year-menu").value != "AllYear"){
        if (document.getElementById("Weekly").checked) {
          if (document.getElementById("line-menu").value == "AllLines") {
            resolve(group_by_week(dataSet, (document.getElementById("year-menu").value)));
          } else {
            resolve(group_by_week(group_by_line(dataSet), (document.getElementById("year-menu").value)));
          }
        } else {
          if (document.getElementById("line-menu").value == "AllLines") {
            resolve(group_by_month(dataSet, (document.getElementById("year-menu").value)));
          } else {
            resolve(group_by_month(group_by_line(dataSet), (document.getElementById("year-menu").value)));
          }
        }
    } else {
      if (document.getElementById("line-menu").value == "AllLines")  {
        resolve(group_by_year(dataSet));
      } else {
        resolve(group_by_year(group_by_line(dataSet)));
      }
    }
  });
}

function group_by_month(data, year) {
  var months = []
  for (var obj in data) {
    var single = data[obj];
    var month = single['DTE'].getMonth();

    if (single['DTE'].getFullYear() == year) {
      if (months[month]) {
        months[month].push(data[obj]);
      } else {
        months[month] = [data[obj]]; // no list for this month yet - create a new one
      }
    }
  }
  return months;
}

function group_by_week(data, year) {
  var weeks = []
  for (var obj in data) {
    var single = data[obj];
    var week = single['DTE'].getWeek();

    if (single['DTE'].getFullYear() == year) {
      if (weeks[week]) {
        weeks[week].push(data[obj]);
        // already have a list- append to it
      } else {
        weeks[week] = [data[obj]]; // no list for this week yet - create a new one
      }
    }
  }

  return weeks;
}

function group_by_line(data) {
  var localTotal = []
  for (var obj in data) {
    var single = data[obj];

    if (single['LINE'] == document.getElementById("line-menu").value) {
      localTotal.push(single);
    }
  }

  return localTotal;
}

function group_by_year(data) {
  var years = []
  for (var obj in data) {
    var single = data[obj];
    var year = single['DTE'].getFullYear();

    if (years[year]) {
      years[year].push(data[obj]);
      // already have a list- append to it
    } else {
      years[year] = [data[obj]]; // no list for this year yet - create a new one
    }
  }
  return years;
}


//MTBF SORTING

function MTBFGrouper(dataSet) {
  return new Promise(function(resolve, reject) {
    if(document.getElementById("year-menu").value != "AllYear"){
        if (document.getElementById("Weekly").checked) {
          if (document.getElementById("line-menu").value == "AllLines") {
            resolve(MTBF_week(dataSet, (document.getElementById("year-menu").value)));
          } else {
            resolve(MTBF_week(MTBF_line(dataSet), (document.getElementById("year-menu").value)));
          }
        } else {
          if (document.getElementById("line-menu").value == "AllLines") {
            resolve(MTBF_month(dataSet, (document.getElementById("year-menu").value)));
          } else {
            resolve(MTBF_month(MTBF_line(dataSet), (document.getElementById("year-menu").value)));
          }
        }
    } else {
      if (document.getElementById("line-menu").value == "AllLines")  {
        resolve(MTBF_year(dataSet));
      } else {
        resolve(MTBF_year(MTBF_line(dataSet)));
      }
    }
  });
}

function MTBF_month(data, year) {
  var months = []
  for (var obj in data) {
    var single = data[obj];
    var month = single['date'].getMonth();

    if (single['date'].getFullYear() == year) {
      if (months[month]) {
        months[month].push(data[obj]);
      } else {
        months[month] = [data[obj]]; // no list for this month yet - create a new one
      }
    }
  }
  return months;
}

function MTBF_week(data, year) {
  var weeks = []
  for (var obj in data) {
    var single = data[obj];
    var week = single['date'].getWeek();

    if (single['date'].getFullYear() == year) {
      if (weeks[week]) {
        weeks[week].push(data[obj]);
        // already have a list- append to it
      } else {
        weeks[week] = [data[obj]]; // no list for this week yet - create a new one
      }
    }
  }

  return weeks;
}

function MTBF_line(data) {
  var localTotal = []
  for (var obj in data) {
    var single = data[obj];

    if (single['line'] == document.getElementById("line-menu").value) {
      localTotal.push(single);
    }
  }

  return localTotal;
}

function MTBF_year(data) {
  var years = []
  for (var obj in data) {
    var single = data[obj];
    var year = single['date'].getFullYear();

    if (years[year]) {
      years[year].push(data[obj]);
      // already have a list- append to it
    } else {
      years[year] = [data[obj]]; // no list for this year yet - create a new one
    }
  }
  return years;
}











// Data filter

function filter(timePeriodData) {
  var dataCopy = [];

  if (yearSet.length > 0) {
    totalData = [];
    for (var y in yearSet) {
      var index = yearSet[y];
      dataCopy[index] = timePeriodData[index];
    }
  } else {
    myChart.clear();
  }
  return dataCopy;
}

//Handle Graph Click

function handleClick(evt) {
  var activeElement = myChart.getElementAtEvent(evt);
  //  console.log(myChart.data.datasets[activeElement[0]._datasetIndex].data[activeElement[0]._index]);
  //  console.log(myChart.data.datasets[activeElement[0]._datasetIndex]);

}

//jQuery

// Define variable colors

var back = [
  "22A7F0",
  "8E44AD",
  "AEA8D3",
  "F62459",
  "DB0A5B",
  "D64541",
  "D2527F",
  "2C3E50",
  "1E8BC3",
  "87D37C",
  "4ECDC4",
  "3FC380",
  "E87E04",
  "F9690E",
  "F9BF3B"
];

/*
	Dropdown with Multiple checkbox select with jQuery - May 27, 2013
	(c) 2013 @ElmahdiMahmoud
	license: https://www.opensource.org/licenses/mit-license.php
*/

//Dropdown listener


//Function to get week

Date.prototype.getWeek = function(dowOffset) {
  /* getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

  dowOffset = typeof(dowOffset) == 'int'
    ? dowOffset
    : 0; //default dowOffset to zero
  var newYear = new Date(this.getFullYear(), 0, 1);
  var day = newYear.getDay() - dowOffset; //the day of week the year begins on
  day = (
    day >= 0
    ? day
    : day + 7);
  var daynum = Math.floor((this.getTime() - newYear.getTime() - (this.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
  var weeknum;
  //if the year starts before the middle of a week
  if (day < 4) {
    weeknum = Math.floor((daynum + day - 1) / 7) + 1;
    if (weeknum > 52) {
      nYear = new Date(this.getFullYear() + 1, 0, 1);
      nday = nYear.getDay() - dowOffset;
      nday = nday >= 0
        ? nday
        : nday + 7;
      /*if the next year starts before the middle of
              the week, it is week #1 of that year*/
      weeknum = nday < 4
        ? 1
        : 53;
    }
  } else {
    weeknum = Math.floor((daynum + day - 1) / 7);
  }
  return weeknum;
};

// Checkbox listener

function myCallback(boxes) {
  var values = '';
  yearSet = [];
  $(boxes).each(function() {
    if ($(this).is(":checked")) {
      values += $(this).attr("name");
      yearSet.push($(this).attr("name"));
    }
  });

  $("#checkboxValue").val(values);
}

// Menu listener

$(document).on('change', '#line-menu', function() {
  if (document.getElementById("line-menu").value == "AllLines") {
    charter();
    charter2();
  } else {
    charter('');
  }
});

$(document).on('change', '#year-menu', function() {
  if (document.getElementById("year-menu").value == "AllYear") {
    charter();
  } else {
    charter('time');
  }
});

$(document).on('change', '#Weekly', function() {
  if (document.getElementById("Weekly").checked) {
    document.getElementById("Monthly").checked = false;
    charter('time');
  }
});

$(document).on('change', '#Monthly', function() {
  if (document.getElementById("Monthly").checked) {
    document.getElementById("Weekly").checked = false;
    charter('time');
  }
});
