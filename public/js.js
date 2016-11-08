var socket = io.connect();
var puppyScore = 1;
var kittenScore = 1;

socket.on('score', function (data) {
  //console.log('Updated scores!', data.puppy, " ", data.kitten);
  puppyScore = data.puppy;
  kittenScore = data.kitten;
  $('#puppyScore').text(puppyScore);
  $('#kittenScore').text(kittenScore);
  if (voteChart !== undefined) {
    console.log(voteChart);
    voteChart.data.datasets[0].data[0] = kittenScore;
    voteChart.data.datasets[0].data[1] = puppyScore;
    voteChart.update();
  }
});

socket.on('resLimResponse', function (data) {
  if (data.status == true) {
    if ($('#responseLimitations').hasClass('limiting')) {
      $('#responseLimitations').toggleClass('limiting');
    }
    $('#responseLimitations').text("Limiting Responses");
  }
  else {
    if (!$('#responseLimitations').hasClass('limiting')) {
      $('#responseLimitations').toggleClass('limiting');
    }
    $('#responseLimitations').text("Not Limiting Responses");
  }
});

$(document).ready(function() {
  /**
   * Pie Chart Thingie
  **/
  initCharts();

  $('#puppiesButton').click(function() {
    //console.log('clicked puppies');
    socket.emit('vote', { puppies: true,
                          kittens: false  });
  });

  $('#kittensButton').click(function() {
    //console.log('clicked kittens');
    socket.emit('vote', { puppies: false,
                          kittens: true  });
  });

  $('#responseLimitations').click(function() {
    socket.emit('limits', { toggle: true });
  });
});

function initCharts() {
  var config = {
    type: 'pie',
    data: {
      labels: [
        "Kittens",
        "Puppies"
      ],
      datasets: [
        {
          data: [0,0],
          backgroundColor: [
            "#245999",
            "#EA6D26"
          ],
        }
      ]
    },
    options: {
      responsive: true,
      legend: {
        display: false
      }
    }
  };
  //Chart thingie
  var ctx = $("#voteCanvas");
  voteChart = new Chart(ctx, config);
}
