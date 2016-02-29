AngularInifiteScrollController.$inject = ['$window'];
function AngularInifiteScrollController($window) {
  console.log('Controller $window: ', $window);
  this.scrollElement = null;

  this.registerScrollHandler = function (element) {
    console.log('registerScrollHandler');
    this.scrollElement = element;
    console.log('element: ', element);

    this.scrollElement.addEventListener("scroll", function () {
      console.log('scroll handler called');
    });
  }

  this.unregisterScrollHandler = function (element) {
    console.log('unregisterScrollHandler');
    console.log('element: ', this.scrollElement);
    this.scrollElement.removeEventListener("scroll");
  }
}

AngularInifiteScrollDirective.$inject = ['$window'];
function AngularInifiteScrollDirective($window) {

  function link($scope, element, attributes, controller) {

    var scrollElement = document.querySelector('body');
    if(typeof controller.infiniteScrollContainer === 'string' && controller.infiniteScrollContainer.length > 0) {
      scrollElement = document.querySelector(controller.infiniteScrollContainer);
      if(scrollElement === null) {
        throw new Error('The selector you passed to infiniteScrollContainer did not match any elements');
      }
    }
    controller.registerScrollHandler(scrollElement);

    $scope.$on('$destroy', function() {
      controller.unregisterScrollHandler();
    });
  }

  return {
    restrict: 'A',
    bindToController: true,
    controller: AngularInifiteScrollController,
    controllerAs: 'vm',
    scope: {
      infiniteScrollContainer: "=",
      infiniteScrollDisabled: "="
    },
    link: link
  };
}

angular
  .module('angular-infinite-scroll', [])
  .directive('infiniteScroll', AngularInifiteScrollDirective);
