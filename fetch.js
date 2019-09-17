"use strict";

/**
 * The global trygot namespace.
 *
 *@namespace http
 * @export
 */

window.http = window.http || {};

/**
 * Request.
 * Handles all fetch requests
 * @class
 */

http.Request = class {
  /**
   * Creates a Form object.
   * @param {!String} url
   * @constructor
   */
  constructor(url, config = {}) {
    /**
     * Holds a reference to the target form
     * @private {!String}
     */
    this.url = url;

    /**
     * Holds a reference to all events that can be performed
     * @private {!Object}
     */
    this.events = {};

    /**
     * Holds a reference to the request's content length
     * @private {!Number | undefined}
     */
    this.contentLength = null;

    /**
     * Holds a reference to the request's timeout
     * @private {!Number}
     */
    this.timeout = 5000;

    /**
     * Assign config variables from argument
     * @private {!Object}
     */
    Object.assign(this, config);
  }

  on(events = {}) {
    Object.assign(this.events, events);
  }
  /**
   * Handles the request stream
   * @param {!ReadableStream} reader
   * @private
   */

  async readableStreamHandler(reader) {
    let receivedStreamLength = 0;
    let chunks = [];
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log("Stream read completely!");
        break;
      }

      chunks.push(value);

      if (this.events.hasOwnProperty("data")) this.events["data"](value);

      receivedStreamLength += value.length;
      console.log(`${receivedStreamLength} received of ${this.contentLength}`);

      this.readableStreamHandler(reader);
    }

    const allChunks = new Uint8Array(receivedStreamLength);
    let position = 0;

    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    const decoder = new TextDecoder("utf-8");
    const data = decoder.decode(allChunks);

    return data;
  }

  /**
   * Handles the returned response
   * @private
   */

  async responseHandler(response) {
    this.contentLength = +response.headers.get("Content-Length");
    return await this.readableStreamHandler(response.body.getReader());
  }

  /**
   * Perform get request
   * @public
   */

  async get() {
    return await this.responseHandler(await fetch(this.url));
  }

  /**
   * Perform post request
   * @param {!String | !FormData} data
   * @public
   */

  async post(data = null) {
    return await this.responseHandler(
      await fetch(this.url, {
        body: data,
        headers: {
          "Content-Type": "x-www-form-urlencoded"
        },
        method: "POST"
      })
    );
  }
};
