ApplicationController.$inject = ['$q'];
function ApplicationController($q) {
  this.title = 'Angular-Infinite-Scroll';
  this.isListVisible = true;
  this.isListAtEnd = false;
  this.items = [];
  this.totalItems = [];

  
  var maxItems = 1000;
  for(var i = 0; i < maxItems; i++) {
    this.totalItems.push({ name: 'Lorem Ipsum ' + i });
  }

  this.offset = 0;
  this.pageSize = 5;
  this.loadNextPage = function() {
    var items = this.totalItems.slice(this.offset, this.offset + this.pageSize);
    this.offset += this.pageSize;
    Array.prototype.push.apply(this.items, items);
  }

  this.loadNextPage();
  this.dummyScrollHandler = function () {
      var that = this;
      console.log('dummy scroll handler');
      return new $q(resolve => {
          that.loadNextPage();
          resolve();
      });
  }

  this.clickLoadButton = function () {
    this.loadNextPage();
  }
  this.toggleListVisibility = function () {
    this.isListVisible = !this.isListVisible;
  }
  this.toggleDisabledState = function () {
      this.isListAtEnd = !this.isListAtEnd;
  }
}

angular
  .module('application.controller', [])
  .controller('ApplicationController', ApplicationController);
