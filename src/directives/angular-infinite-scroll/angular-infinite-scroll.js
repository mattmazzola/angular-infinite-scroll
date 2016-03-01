AngularInifiteScrollController.$inject = ['$scope', '$timeout', '$q'];
function AngularInifiteScrollController($scope, $timeout, $q) {
  console.log('Controller $timeout: ', $timeout);
  
  
  this.infiniteScrollOffset = this.infiniteScrollOffset || 0;
  this.infiniteScrollDelay = this.infiniteScrollDelay || 1000;
  this.containerElement = null;
  this.listElement = null;
  this.scrollHandlerPromise = null;
    
  console.log('infiniteScrollOffset: ', this.infiniteScrollOffset);
  console.log('infiniteScrollDelay: ', this.infiniteScrollDelay);
  console.log('infiniteScrollDisabled: ', this.infiniteScrollDisabled);
    
  /**
   * Register scroll event handler on container element
   */
  this.registerScrollHandler = function (containerElement, listElement) {
    console.log('registerScrollHandler');
    
    this.containerElement = containerElement;
    this.listElement = listElement;
    
    var scrollHandler = function () {
        var that = this;
        var isListBottomAboveThreshold = this.isListBottomAboveThreshold(this.containerElement, this.listElement);
        if(isListBottomAboveThreshold) {
            this.scrollHandlerPromise = this.infiniteScrollHandler()
                .then(function () {
                    that.scrollHandlerPromise = null;
                }, function () {
                    that.scrollHandlerPromise = null;
                })
        }
    };
    
    this.containerElement.addEventListener("scroll", this.throttle(scrollHandler.bind(this), this.infiniteScrollDelay, { leading: false, trailing: true }));
  }

  /**
   * Unregister scroll event handler on container element
   */
  this.unregisterScrollHandler = function (element) {
    console.log('unregisterScrollHandler');
    this.containerElement.removeEventListener("scroll");
  }
  
  /**
   * Compute element boundaries and if bottom of list is above bottom of container + X offset then return true;
   */
  this.isListBottomAboveThreshold = function(containerElement, listElement) {
      var isListBottomAboveThreshold = false;
      
      if(!this.infiniteScrollDisabled) {
        console.group();
        // TODO: Maybe just require jQuery and calculate these correctly?
        var containerBottom = containerElement.getBoundingClientRect().top + containerElement.offsetHeight;
        var threshhold = containerBottom + this.infiniteScrollOffset;
        console.log('threshhold: ' + threshhold + ' = top (' + containerElement.getBoundingClientRect().top + ') + height (' + containerElement.offsetHeight + ') + offset (' + this.infiniteScrollOffset + ')');
        var listBottom = listElement.getBoundingClientRect().top + listElement.offsetHeight;
        console.log('listBottom: ' + listBottom + ' = top (' + listElement.getBoundingClientRect().top + ') + height (' + listElement.offsetHeight + ')');
        
        isListBottomAboveThreshold = (listBottom < threshhold);
        console.log('isListBottomAboveThreshold: ', isListBottomAboveThreshold);
        console.groupEnd();
      }
      
      return isListBottomAboveThreshold;
  }
  
  /**
   * Check element dimensions, if necessary execute parent handler until container is filled
   */
  this.invokeHandlerUntilContainerIsFull = function () {
      var that = this;
    function invokeHandlerUntilContainerIsFullInner() {
        var isListBottomAboveThreshold = that.isListBottomAboveThreshold(that.containerElement, that.listElement);
        var handlerPromise = new $q((resolve, reject) => reject());
        if(isListBottomAboveThreshold && !that.infiniteScrollDisabled) {
            handlerPromise = new $q(resolve => {
                $timeout(function () {
                    return that.infiniteScrollHandler()
                        .then(function () {
                            resolve();
                        });
                });
            });
        }
        
        return handlerPromise
            .then(() => invokeHandlerUntilContainerIsFullInner.call(that));
    }
    
    if(!this.infiniteScrollDisabled) {
        $timeout(function () {
            invokeHandlerUntilContainerIsFullInner();
        });
    }
  }
    

    this.throttle = function(func, wait, options) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        if (!options) options = {};
        var later = function() {
            previous = options.leading === false ? 0 : new Date().getTime();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        };
        return function() {
            var now = new Date().getTime();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    $timeout.cancel(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = $timeout(later, remaining);
            }
            return result;
        };
    }
}

function AngularInifiteScrollDirective() {

  function link($scope, element, attributes, controller) {

    var scrollElement = document.querySelector('body');
    if(typeof controller.infiniteScrollContainer === 'string' && controller.infiniteScrollContainer.length > 0) {
      scrollElement = document.querySelector(controller.infiniteScrollContainer);
      if(scrollElement === null) {
        throw new Error('The selector you passed to infiniteScrollContainer did not match any elements');
      }
    }
    
    controller.registerScrollHandler(scrollElement, element[0]);
    controller.invokeHandlerUntilContainerIsFull();

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
      infiniteScrollHandler: "&",
      infiniteScrollContainer: "=?",
      infiniteScrollDisabled: "=?",
      infiniteScrollOffset: "=?",
      infiniteScrollDelay: "=?"
    },
    link: link
  };
}

angular
  .module('angular-infinite-scroll', [])
  .directive('infiniteScroll', AngularInifiteScrollDirective);
