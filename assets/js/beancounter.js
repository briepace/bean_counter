//http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
//
var app = angular.module('BeanCounterApp', ['ui.bootstrap','BeanCounterServices'])

app.controller('BeanCounterCtrl', ['$scope', 'Computer', function($scope, Computer) {

  //connect to the websocket.
  io.socket.get('/api/computers/');
  io.socket.on('connect', function(){console.log('connect')});
  var computers = Computer.query(function(data){
    var modified_computers = data;
    $scope.computers = modified_computers;
  });
  io.socket.on('computer', function(comps){
    $scope.$apply(function() {
        if(!_.isArray(comps.data)) {
            comps.data = [comps.data];
        }
        angular.forEach(comps.data, function(data, idx){

          var comp = _.find($scope.computers, 
            function(computer){
                return _.isUndefined(computer.id) ? false : computer.id ==data.id;
            }
          );
          if(!_.isUndefined(comp)) {
              angular.extend(comp, data);
          }
        });
    });
  });


  $scope.comp_statuses = [
      {name:'free'},
      {name:'used'},
      {name:'unavailable'}
  ];

  $scope.rooms = [
      {name: 'imc'},
      {name: 'ref'}
  ]

  $scope.admin_submit = function() {
      debugger;
      console.log($scope.computers[0]);
      $scope.computers.forEach(function(comp) {
          comp.$save();
      });
      /*
      $scope.computers.forEach(function(comp) {
          console.log(comp);
          comp.$save();
      });
     */
  }

  $scope.$watchCollection('computers', function(newValues, oldValues) {
  });

  $scope.img = $("#floorplanimage");
  $scope.real_img = $("<img/>")
    .attr("src", $($scope.img).attr("src"))
    .load(function() {
        $scope.pic_real_width = this.width;   // Note: $(this).width() will not
        $scope.pic_real_height = this.height; // work for in memory images.
    });
  $scope.real_img.on('load', function(){
    $scope.$apply();
  });
  $scope.total_computers = function(lab){
    if (undefined == $scope.computers)
      return 0;
    return $scope.computers.length;
  }
  $scope.free_computers = function(lab){
    return (_.filter($scope.computers, function(computer){return computer.status=='free';})).length;
  }
  $scope.percent_x = function(computer){
    var image_width = $scope.pic_real_width;
    percent = ((computer.x / image_width * 100)) ;
    //console.log(computer.name + " X:"+ computer.x+ " %:" +percent + "  iw:"+ image_width +" " + percent/100*image_width);
    return percent+'%';
  }
  $scope.percent_y = function(computer){
    var image_height = $scope.pic_real_height;
    return ((computer.y / image_height * 100)) + '%';
  }
  //.success(
    //somewhere in here, we should set the X and Y to the correct %.
    //);

}]);

app.filter('room', function(){
  return function(computers,name){
    return _.filter(computers, function(computer){return computer.room == name;});

  };
});
app.filter('pcDisplayImage', function(){
  return function(computer){
    if (computer.status == 'used') {
      return 'http://localhost/_assets/img/comp_unavailable.png';
    }
    if (computer.status == 'free') {
      return 'http://localhost/_assets/img/comp_available.png';
    }
    if (computer.status == 'dead') {
      return 'http://localhost/_assets/img/comp_offline.png';
    }

  };
});
app.filter('arraylist', function(){
  return function(computer){
    //computer.features will have hardware/software keys with array type values and an os key with string value
    var output = '<h4>'+computer.display+'</h4><h6>'+computer.os+'</h6>';
    output +='<ul class="computer_features">';
    angular.forEach(computer.features, function(property, index){
      output += '<li>'+index+'<ul class="'+index+'">';
      angular.forEach(property, function(value, index){
        output += '<li>'+value+'</li>';
      });
      output += '</ul></li>'
    });
    output += "</ul>";
    return output;
  };
});

app.directive('freeOfTotal', function(){
  return {
    restrict:'EAC',
    scope: {
      computers:"=computers",
      lab:"=lab"
    },
  template: 'Free: <span class="free">{{$parent.free_computers(lab)}}</span>/<span class="total">{{$parent.total_computers(lab)}}</span></span>'
  };
});
app.directive('computerDetails', function(){
  return {
    restrict:'EAC',
    scope: {
      computer:"=computerDetails"
    },
  template: '<div id="computer_container_{{computer.id}}" popover-html-unsafe="{{computer|arraylist}}" popover-trigger="mouseenter" ><div computer-image="computer"></div></div>'
  };
});
app.directive("popoverHtmlUnsafePopup", function () {
      return {
        restrict: "EA",
        replace: true,
        scope: { title: "@", content: "@", placement: "@", animation: "&", isOpen: "&" },
        templateUrl: "/templates/popover/popover-html-unsafe-popup.html"
      };
    })

    .directive("popoverHtmlUnsafe", [ "$tooltip", function ($tooltip) {
      return $tooltip("popoverHtmlUnsafe", "popover", "click");
    }]);
app.directive('computerImage', function(){
  return {
    restrict:'EAC',
    scope: {
      computer:"=computerImage"
    },
  template: '<img ng-src="{{computer|pcDisplayImage}}" />'
  };
});



var beancounterServices = angular.module('BeanCounterServices', ['ngResource'])
.factory('Computer', ['$resource',
    function($resource){
       return $resource('/api/computers/:id',{id:'@id'}, {
        query: { method:'GET', isArray:true},
        save: { method:'POST', isArray:true}
      });
    }
  ])
