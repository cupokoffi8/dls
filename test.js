const { ReadableStream } = require('stream/web');

const stream = new ReadableStream({
  start(controller) {
    controller.enqueue("Hello, world!");
    controller.close();
  },
});

console.log("ReadableStream is working:", stream);
