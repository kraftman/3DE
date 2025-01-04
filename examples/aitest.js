function calc(x, y) {
  let a = 0;
  if (x > 10) {
    for (let i = 0; i < y; i++) {
      a += x;
    }
  } else if (x > 5) {
    a = x * y;
  } else {
    console.log('Invalid input');
  }
  return a;
}
