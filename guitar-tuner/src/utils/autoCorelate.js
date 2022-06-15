export default function autoCorrelate(buffer, sampleRate) {
  var SIZE = buffer.length;
  var sumOfSquares = 0;
  for (var i = 0; i < SIZE; i++) {
    var val = buffer[i];
    sumOfSquares += val * val;
  }
  var rootMeanSquare = Math.sqrt(sumOfSquares / SIZE);
  if (rootMeanSquare < 0.01) {
    return -1;
  }

  var r1 = 0;
  var r2 = SIZE - 1;
  var threshold = 0.2;

  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }

  buffer = buffer.slice(r1, r2);
  SIZE = buffer.length;

  var c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buffer[j] * buffer[j + i];
    }
  }

  var d = 0;
  while (c[d] > c[d + 1]) {
    d++;
  }

  var maxValue = -1;
  var maxIndex = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxValue) {
      maxValue = c[i];
      maxIndex = i;
    }
  }

  var T0 = maxIndex;

  var x1 = c[T0 - 1];
  var x2 = c[T0];
  var x3 = c[T0 + 1];

  var a = (x1 + x3 - 2 * x2) / 2;
  var b = (x3 - x1) / 2;
  if (a) {
    T0 = T0 - b / (2 * a);
  }
  return sampleRate / T0;
}
