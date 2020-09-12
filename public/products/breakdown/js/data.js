var dataSet = []
var mtbfData = []

var totalData = []
var labels = ['MTTR', 'MDT', 'MTBF'];

var yearSet = []
var MTTRData = []
var tempData = []
//data Object

function singleData(DTS, RS, RE, DTE, LINE) {
  this.DTS = DTS,
  this.RS = RS,
  this.RE = RE,
  this.DTE = DTE,
  this.LINE = LINE,
  this.MTTR = function() {
    var whole = Math.floor((this.RE - this.RS) / 1000 / 60 / 60);
    var dec = ((this.RE - this.RS) / 1000 / 60 / 60) - Math.floor((this.RE - this.RS) / 1000 / 60 / 60);
    var decConv = (Math.round(dec * 60) % 60) / 100;
    console.log(this, whole + decConv);
    return (whole + decConv);
  }
  this.MDT = function() {
    var whole = Math.floor((this.DTE - this.DTS) / 1000 / 60 / 60);
    var dec = ((this.DTE - this.DTS) / 1000 / 60 / 60) - Math.floor((this.DTE - this.DTS) / 1000 / 60 / 60);
    var decConv = (Math.round(dec * 60) % 60) / 100;
    return (whole + decConv);
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
    labels: labels,
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

function dataAggregator(totalTimePeriodData, mtbfData) {
  var localTotal = [];
  var index = 0;
//  console.log(totalTimePeriodData);

  if (document.getElementById("MTTR").checked && !labels.includes('MTTR')) {
    labels[0] = 'MTTR';
  } else if (!document.getElementById("MTTR").checked && labels.includes('MTTR')) {
    remove(labels, 'MTTR');
  }

  if (document.getElementById("MDT").checked && !labels.includes('MDT')) {
    labels[1] = 'MDT';
  } else if (!document.getElementById("MDT").checked && labels.includes('MDT')) {
    remove(labels, 'MDT');
  }

  if (document.getElementById("MTBF").checked && !labels.includes('MTBF')) {
    labels[2] = 'MTBF';
  } else if (!document.getElementById("MTBF").checked && labels.includes('MTBF')) {
    remove(labels, 'MTBF');
  }

  for (var period in totalTimePeriodData) {
    index = index + 1;
    var periodData = totalTimePeriodData[period];
    var mtbfPeriodData = mtbfData[period]; //array of data for that month
    var periodNum = period;
    var graphData = [];

    if (document.getElementById("MTTR").checked) {
      for (var entry in periodData) {
        var entryData = periodData[entry];
        if (entryData instanceof singleData) {
          graphData[labels.indexOf('MTTR')] = (graphData[labels.indexOf('MTTR')] || 0) + entryData.MTTR();
        }
      }
  //    console.log(periodData, graphData[labels.indexOf('MTTR')], periodData.length);
      graphData[labels.indexOf('MTTR')] = Math.round(graphData[labels.indexOf('MTTR')] / periodData.length * 100) / 100;
    }

    if (document.getElementById("MDT").checked) {
      for (var entry in periodData) {
        var entryData = periodData[entry];
        if (entryData instanceof singleData) {
          graphData[labels.indexOf('MDT')] = (graphData[labels.indexOf('MDT')] || 0) + entryData.MDT();
        }
      }
      graphData[labels.indexOf('MDT')] = Math.round(graphData[labels.indexOf('MDT')] / periodData.length * 100) / 100;
    }

    if (document.getElementById("MTBF").checked) {
      for (var entry in mtbfPeriodData) {
        if (mtbfPeriodData[entry] instanceof mtbfSingle) {
          graphData[labels.indexOf('MTBF')] = (graphData[labels.indexOf('MTBF')] || 0) + mtbfPeriodData[entry].totalFailure();
        }
      }
      graphData[labels.indexOf('MTBF')] = Math.round(graphData[labels.indexOf('MTBF')] / periodData.length * 100) / 100;
    }

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

    var randColor = back[index];

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
    return getShiftTimeData();
  })
};

function getShiftTimeData() {

  var db = firebase.firestore();
  var collectionReference = db.collection('nakulUser').doc('First').collection('shiftTimes');

  collectionReference.get().then(function(querySnapshot) {
    var data = querySnapshot.docs.map(function(documentSnapshot) {
      mtbfData.push(new mtbfSingle(documentSnapshot.data()['date'], documentSnapshot.data()['line'], documentSnapshot.data()['shiftTimes'][0], documentSnapshot.data()['shiftTimes'][1], documentSnapshot.data()['shiftTimes'][2]));
    })
    //    grapher(dataAggregator(group_by_year(dataSet)));
  }).then((results) => {
    charter2();
  }).then(function(response) {
    return group_by_year(dataSet)
  }).then(function(response) {
    return dataAggregator(response, tempData)
  }).then(function(response) {
    myChart.data.datasets = response;



  }).then(function(response) {
    myChart.update();
  })
};

// Promise function for data grouping

const charter = function() {
  grouper(dataSet).then((result) => {
    return (dataAggregator(result, tempData))
  }).then((result) => {
    myChart.data.datasets = result;
  }).then((result) => {
    myChart.update();
  })
}

const charter2 = function() {
  MTBFGrouper(mtbfData).then((result) => {
    tempData = result;
    return (result);
  })
}

//Grouping Functions

function grouper(dataSet) {
  return new Promise(function(resolve, reject) {
    if (document.getElementById("year-menu").value != "AllYear") {
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
      if (document.getElementById("line-menu").value == "AllLines") {
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
    if (document.getElementById("year-menu").value != "AllYear") {
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
      if (document.getElementById("line-menu").value == "AllLines") {
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

//MTBF LINE IS NOT WORKING FOR SOME REASON CHECK THIS

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

  "D6BBC0",
  "D0A3BF",
  "C585B3",
  "BC69AA",
  "AF42AE",
  '91C4F2'
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

function remove(array, element) {
  const index = array.indexOf(element);

  if (index !== -1) {
    array.splice(index, 1);
  }
}

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

//Modal Listener

// Menu listener

$(document).on('change', '#line-menu', function() {
  charter2();
  charter();
});

$(document).on('change', '#year-menu', function() {
  charter2();
  charter();
});

$(document).on('change', '#Weekly ', function() {
  charter2();
  charter();
});

$(document).on('change', '#Monthly', function() {
  charter2();
  charter();
});

$(document).on('change', '#MTTR', function() {
  charter2();
  charter();
});

$(document).on('change', '#MDT', function() {
  charter2();
  charter();
});

$(document).on('change', '#MTBF', function() {
  charter2();
  charter();
});
