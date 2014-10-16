var foie,
  controllers;

foie = angular.module('foie', [
  'ngRoute',
  'foie.controllers'
]);

foie.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/overview.html',
        controller: 'OverviewCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }
]);

controllers = angular.module('foie.controllers', []);

controllers.controller('OverviewCtrl', [ '$scope',
  function($scope) {
    var data = JSON.parse(document.getElementById('request-data').innerHTML);

    $scope.total = data.total;

    $scope.refusedCount = data.refusedCount;
    $scope.notHeldCount = data.notHeldCount;
    $scope.successCount = data.successCount;

    $scope.name = data.name;
    $scope.site = data.site;

    $scope.successful = data.successful;
    $scope.popular = data.popular;
    $scope.refused = data.refused;
    $scope.notHeld = data.notHeld;

    $scope.from = data.from;
    $scope.to = data.to;

    $scope.requests = data.requests;
  }
]);
