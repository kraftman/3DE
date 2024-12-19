// 1. Function Declaration
function declaredFunction() {
  console.log('This is a declared function.');
}

declaredFunction();

// 2. Function Expression
const expressedFunction = function () {
  console.log('This is a function expression.');
};

expressedFunction();

// 3. Arrow Function
const arrowFunction = () => {
  console.log('This is an arrow function.');
};

arrowFunction();

// 4. Immediately Invoked Function Expression (IIFE)
(function () {
  console.log('This is an IIFE.');
})();

// 5. Named Function Expression
const namedFunctionExpression = function namedFunc() {
  console.log('This is a named function expression.');
};

namedFunctionExpression();

// // 6. Method Definition in an Object
// const obj = {
//   method() {
//       console.log("This is a method inside an object.");
//   }
// };

// obj.method();

// 7. Function as a Constructor
function ConstructorFunction() {
  console.log('This is a constructor function.');
}

const instance = new ConstructorFunction();

// 8. Class Method
class MyClass {
  classMethod() {
    console.log('This is a class method.');
  }
}

const myClassInstance = new MyClass();
myClassInstance.classMethod();

// 9. Static Method in a Class
class AnotherClass {
  static staticMethod() {
    console.log('This is a static method in a class.');
  }
}

AnotherClass.staticMethod();

// 10. Generator Function
// function* generatorFunction() {
//   console.log('This is a generator function.');
//   yield 1;
//   yield 2;
// }

// const generator = generatorFunction();
// generator.next();

// generator.next();

// 11. Async Function
async function asyncFunction() {
  console.log('This is an async function.');
}

asyncFunction();

// // 12. Function Bound to a Context
// const boundFunction = declaredFunction.bind({});
// boundFunction();
