Original post is available at http://codrspace.com/thaiat/extending-an-existing-directive-in-angularjs/


Let's say you have a third party angularjs directive that you want to extend or simply access the api defined by its controller.   
We could use `require` but that means that we have to put the 2 directives on the same element, or that the extended directive should be contained inside the first one (looks weird), because require will look up the chain of html.
  
Well... this is not always possible as we do not have control on the code defining the first directive. It could restrict its usage to 'E', meaning that our extended directive cannot be anymore restricted to 'E'.

How can we easily do that, and in a more natural way meaning the extended directive should wrap the first directive ?

Let's first start with some simple **index.html**

```html
<html>
    <head>
        <title>angular-extending-directive</title>
        <style type="text/css">
       .circle {
            border: 1px black solid;
            text-align: center;
            padding: 4px;
            font-size: 40px;
            border-radius: 50px;
            -moz-border-radius: 50px;
            border-radius: 50%;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            cursor: pointer;
        }
         .counter {
            width: 50px;
            height: 50px;
            background-color: green;         
        }
        </style>
        <script type="text/javascript" src="bower_components/angular/angular.js"></script>
        <script type="text/javascript" src="scripts/app.js"></script>
    </head>
    <body ng-app="myApp">
        <h1>counter</h1> 
        <counter></counter>

    </body>
</html>
```

We are defining a counter directive with some minimal css.

Our **counter** directive should display a number, starting at 0, and increment it each time we click on it.
Most of the chances are that this third party directive will use an isolate scope.

Again this is pretty simple, and here is the code.

```javascript
var myApp = angular.module('myApp', []);
myApp.directive('counter', function () {
  return {
    scope: {},
    controller: function ($scope, $element, $attrs, $transclude) {
      $scope.value = 0;
      $scope.increment = function () {
        $scope.value += 1;

      };
    },

    link: function (scope, iElm, iAttrs, controller) {
      iElm.on('click', function (e) {
        e.stopPropagation();
        scope.$apply(function () {
          console.log('click counter');
          scope.increment();
        });
      });
    },
    restrict: 'E',
    template: '<div class="circle counter">{{value}}</div>'
  };
});
```

The directive presents a circle with a number in it. Each time you click it will increment the number.

Now we want to use this existing directive but extend its behavior.
For the matter of the explanation, let's create a new directive called **wrappercounter** that wraps it into a wider circle, and when will click on it, it should log a console message.

The html for this new directive should be:

```html
<h1>wrapcounter</h1> 
<wrapcounter>
  <counter></counter>
</wrapcounter>
```

and to please our eyes we can add the following css

```css
.wrapcounter {
    width: 100px;
    height: 100px;
    background-color: red;
    box-pack: center;
    box-align: center;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}
```

Depending on how the first directive **counter** was written we have 3 ways to achieve this.

##1st way : element.isolateScope
If the first directive controller uses $scope (like above) we have to retrieve the inner element, and the api declared by the scope will be available through `element.isolateScope()`.

```javascript
myApp.directive('wrapcounter', function () {
  return {
    restrict: 'E',
    transclude: true,
    template: '<div class="circle wrapcounter" ng-transclude></div>',
    link: function (scope, iElm, iAttrs, controller) {
      // retrieve the inner directive element
      var counter = iElm.find('counter')[0];

      var innerScope = angular.element(counter).isolateScope();
      
      iElm.on('click', function (e) {
        e.stopPropagation();
        scope.$apply(function () {
          // decorating the increment function with a console log.
          console.log('click wrapper');
          // accessing the inner directive api
          innerScope.increment();

        });
      });
    }
  };

});

```


##2nd way : element.controller(name)
This only works if the controller of the first directive uses the *this (or controllerAs)* syntax.
Let's modify the first directive

```javascript
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
```

And now the second directive

```javascript
myApp.directive('wrapcounter', function () {
  return {
    restrict: 'E',
    transclude: true,
    template: '<div class="circle wrapcounter" ng-transclude></div>',
    link: function (scope, iElm, iAttrs, controller) {
      // retrieve the inner directive element
      var counter = iElm.find('counter')[0];
      
      // retrieve the inner controller
      var innerController = angular.element(counter).controller('counter');
      
      iElm.on('click', function (e) {
        e.stopPropagation();
        scope.$apply(function () {
          // decorating the increment function with a console log.
          console.log('click wrapper');
          // accessing the inner directive api
          innerController.increment();

        });
      });
    }
  };

});
```

###3rd way : element.data
Looking at the angluarjs source code we see this piece of code:

```javascript
if (!hasElementTranscludeDirective) {
     $element.data('$' + directive.name + 'Controller', controllerInstance);
}
```

So we can use this to get access to the controller:
```javascript
myApp.directive('wrapcounter', function () {
  return {
    restrict: 'E',
    transclude: true,
    template: '<div class="circle wrapcounter" ng-transclude></div>',
    link: function (scope, iElm, iAttrs, controller) {
      // retrieve the inner directive element
      var counter = iElm.find('counter')[0];

      // retrieve the inner controller
      var innerController = angular.element(counter).data('$' + 'counter' + 'Controller');
      
      iElm.on('click', function (e) {
        e.stopPropagation();
        scope.$apply(function () {
          // decorating the increment function with a console log.
          console.log('click wrapper');
          // accessing the inner directive api
          innerController.increment();

        });
      });
    }
  };

});
```

As you see in any case we have access to the api defined by the inner directive. We could change it, decorate or override existing functions, add our own functions if some are missing from the inner directive, etc...

Hope this makes sense...

Git repo : [https://github.com/thaiat/angular-extending-directive/tree/master/scripts][1]

Happy coding.

Avi

PS: Big thanks to Nir Kaufman that helped me figure it out.


  [1]: https://github.com/thaiat/angular-extending-directive/tree/master/scripts