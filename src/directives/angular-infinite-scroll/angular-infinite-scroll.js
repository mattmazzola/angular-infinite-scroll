AngularInifiteScrollController.$inject = ['$scope', '$timeout', '$q'];
function AngularInifiteScrollController($scope, $timeout, $q) {
  console.log('Controller $timeout: ', $timeout);
  
  
  this.infiniteScrollOffset = this.infiniteScrollOffset || 0;
  this.infiniteScrollDelay = this.infiniteScrollDelay || 1000;
  this.containerElement = null;
  this.listElement = null;
    
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
        var shouldHandle = this.shouldInvokeScrollHandler(this.containerElement, this.listElement);
        if(shouldHandle) {
            this.infiniteScrollHandler();
        }
    };
    
    this.containerElement.addEventListener("scroll", this.debounce(scrollHandler.bind(this), this.infiniteScrollDelay, true));
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
  this.shouldInvokeScrollHandler = function(containerElement, listElement) {
      var shouldScroll = false;
      
      if(!this.infiniteScrollDisabled) {
        console.group();
        // TODO: Maybe just require jQuery and calculate these correctly?
        var containerBottom = containerElement.getBoundingClientRect().top + containerElement.offsetHeight;
        var threshhold = containerBottom + this.infiniteScrollOffset;
        console.log('threshhold: ' + containerBottom + ' = top (' + containerElement.getBoundingClientRect().top + ') + height (' + containerElement.offsetHeight + ') + offset (' + this.infiniteScrollOffset + ')');
        var listBottom = listElement.getBoundingClientRect().top + listElement.offsetHeight;
        console.log('listBottom: ' + listBottom + ' = top (' + listElement.getBoundingClientRect().top + ') + height (' + listElement.offsetHeight + ')');
        
        shouldScroll = (listBottom < threshhold);
        console.log('ShouldInvokeScrollHandler: ', shouldScroll);
        console.groupEnd();
      }
      
      return shouldScroll;
  }
  
  /**
   * Check element dimensions, if necessary execute parent handler until container is filled
   */
  this.checkInitialState = function () {
      var that = this;
    function loadUntilShouldScroll() {
        var shouldScroll = that.shouldInvokeScrollHandler(that.containerElement, that.listElement);
        var handlerPromise = new $q((resolve, reject) => reject());
        if(shouldScroll) {
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
            .then(() => loadUntilShouldScroll.call(that));
    }
    
    if(this.infiniteScrollDisabled) {
        $timeout(function () {
            loadUntilShouldScroll();
        });
    }
  }
    
    /**
     * Debounce from underscore, but swap setTimeout with $timeout
     */
    this.debounce = function(func, wait, immediate) {
        var timeout, args, context, timestamp, result;

        var later = function() {
            var last = (new Date().getTime()) - timestamp;

            if (last < wait && last >= 0) {
                timeout = $timeout(later, wait - last);
            } else {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                    if (!timeout) context = args = null;
                }
            }
        };

        return function() {
            context = this;
            args = arguments;
            timestamp = new Date().getTime();
            var callNow = immediate && !timeout;
            if (!timeout) {
                timeout = $timeout(later, wait);
            }
            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }

            return result;
        };
    };
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
    controller.checkInitialState();

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
