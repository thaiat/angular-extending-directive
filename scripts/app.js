var myApp = angular.module('myApp', []);
myApp.directive('counter', function () {
	return {
		scope: {},
		controller: function ($scope, $element, $attrs, $transclude) {
			var vm = this;
			vm.value = 0;
			vm.increment = function () {
				vm.value += 1;
			};
		},
		controllerAs: 'vm',
		link: function (scope, iElm, iAttrs, controller) {
			iElm.on('click', function (e) {
				e.stopPropagation();
				scope.$apply(function () {
					console.log('click counter');
					scope.vm.increment();
				});
			});
		},
		restrict: 'E',
		template: '<div class="circle counter">{{vm.value}}</div>'
	};
});

myApp.directive('wrapcounter', function () {
	return {
		restrict: 'E',
		transclude: true,
		template: '<div class="circle wrapcounter" ng-transclude></div>',
		link: function (scope, iElm, iAttrs, controller) {
			// retrieve the inner directive element
			var counter = iElm.find('counter')[0];

			var innerController = angular.element(counter).controller('counter');

			iElm.on('click', function (e) {
				e.stopPropagation();
				scope.$apply(function () {
					// decorating the increment function with a console log.
					console.log('click wrapper');
					innerController.increment();

				});
			});
		}
	};

});